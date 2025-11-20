import { WebSocketServer } from 'ws';

import { createPool } from './db.js';
import { makePostbaseAdminClient } from './adminClient.js';

// FIXME: should not need to create a pool and db just to use db.buildWhere and db.buildOrder
const pool = createPool({
    connectionString: process.env.DATABASE_URL
});

const db = makePostbaseAdminClient({ pool });

export function setupWebsocket({ server }) {
    const wss = new WebSocketServer({
        noServer: true, // https://stackoverflow.com/a/65034250/355507
    });

    // Upgrade HTTP → WS when path matches /api/db/<fullPath>/stream
    server.on('upgrade', (req, socket, head) => {
        console.log('wss upgrade url:', req.url);

        // Match everything after /api/db/ up to optional /stream
        const match = req.url.match(/^\/api\/db\/(.+?)\/stream$/);
        if (!match) {
            console.log('No match, destroying socket');
            return socket.destroy();
        }

        const fullPath = decodeURIComponent(match[1]); // e.g., "users/u1/posts"
        console.log('Matched collection path:', fullPath);

        // Extract last segment as collection name, rest as parent path
        const segments = fullPath.split('/');
        const collectionName = segments[segments.length - 1];       // "posts"
        const parentPath = segments.slice(0, -1).join('/');         // "users/u1"

        // Pass fullPath or collectionName + parentPath to your connection handler
        wss.handleUpgrade(req, socket, head, (ws) => {
            wss.emit('connection', ws, { collectionName, parentPath, fullPath });
        });
    });

    wss.on('connection', async (ws, { collectionName, parentPath, fullPath }) => {
        console.log(`WebSocket connected for table: ${collectionName}`);

        console.log('Connecting pool...');
        const client = await pool.connect();
        console.log('Connected to pool');
        // Each connection gets its own PG client to LISTEN
        console.log(`LISTEN changes_${collectionName}`);
        await client.query(`LISTEN changes_${collectionName}`);

        // Receive the initial query definition from the client
        console.log('Attaching ws.once(\'message\')');
        ws.once('message', async (msg) => {
            try {
                const query = JSON.parse(msg.toString());
                console.log('query', query);
                // If subscribing to a subcollection, the client must send parent info:
                // { parent: { collectionName, id, path } }
                if (query.parent && typeof query.parent === 'object') {
                    query.filters = query.filters || [];
                    // Convert DocumentReference object to a path string
                    const parentPath =
                        query.parent.path ||
                        `${query.parent.collectionName}/${query.parent.id}`;

                    // FIX: Provide fake collectionName & id so buildWhere recognizes it
                    query.filters.push({
                        field: 'parent',
                        op: '==',
                        value: {
                            path: parentPath,
                            collectionName: query.parent.collectionName ?? null,
                            id: query.parent.id ?? null,
                        },
                    });
                }

                ws.query = query;

                const { filters = [], order = [], limit = 100, offset = 0 } = query;

                // Send initial data
                const { whereSql, params } = db.buildWhere(filters);
                const orderSql = db.buildOrder(order);
                const sql = `
                SELECT id, data, created_at, updated_at
                FROM "${collectionName}"
                ${whereSql} ${orderSql}
                LIMIT ${limit} OFFSET ${offset}`;
                console.log('sql, params', sql, params);
                const res = await client.query(sql, params);
                console.log('res.rows', res.rows);
                console.log('Sending result back to client');
                ws.send(JSON.stringify({ type: 'init', data: res.rows.map(r => ({ id: r.id, ...r.data })) }));
            } catch (err) {
                console.error('Error processing web socket message', err);
                console.log('Sending response back to client');
                ws.send(JSON.stringify({ type: 'error', error: err.message || err }));
            }
        });

        // Handle Postgres notifications
        console.log('Attaching client.on(\'notification\')');
        client.on('notification', async (msg) => {
            console.log('postgres notification received');
            console.log('web socket read state is:', ws.readyState);
            if (ws.readyState !== WebSocket.OPEN) return;
            const payload = JSON.parse(msg.payload);
            console.log('payload from postgres', payload);
            // Only send relevant changes for this subcollection parent
            if (ws.query?.filters?.some(f => f.field === 'parent' && f.value?.path)) {
                const parentFilter = ws.query.filters.find(f => f.field === 'parent');
                if (!payload.data?.parent?.path) return;
                if (payload.data.parent.path !== parentFilter.value.path) return;
            }
            console.log('Sending change event to the client with payload');
            ws.send(JSON.stringify({ type: 'change', data: payload }));
        });

        console.log('Attaching ws.on(\'close\')');
        ws.on('close', () => {
            console.log(`UNLISTEN changes_${collectionName}`);
            client.query(`UNLISTEN changes_${collectionName}`).catch(console.error);
            client.release();
        });
    });

    return wss;
}
