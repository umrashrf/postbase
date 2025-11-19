import './env.js';
import fs from 'node:fs';
import https from 'node:https';
import { WebSocketServer } from 'ws';

import { createPool } from './lib/postbase/db.js';
import { makePostbaseAdminClient } from './lib/postbase/adminClient.js';

const pool = createPool({
    connectionString: process.env.DATABASE_URL
});

const db = makePostbaseAdminClient({ pool });

import { app } from './app.js';

const httpsOptions = {
    key: fs.readFileSync(process.env.LETSENCRYPT_KEY),
    cert: fs.readFileSync(process.env.LETSENCRYPT_CERT)
};

const HTTPS_PORT = process.env.POSTBASE_BACKEND_HTTPS_PORT || 4431;

const server = https.createServer(httpsOptions, app);

server.listen(HTTPS_PORT,
    () => console.log(`Postbase backend listening on https://0.0.0.0:${HTTPS_PORT}`));

const wss = new WebSocketServer({
    noServer: true, // https://stackoverflow.com/a/65034250/355507
});

// Upgrade HTTP → WS when path matches /api/db/<table>/stream
server.on('upgrade', (req, socket, head) => {
    console.log('wss upgrade url:', req.url);
    const match = req.url.match(/^\/api\/db\/([^/]+)\/(?:stream|[^/]+)$/);
    console.log('match', match);
    if (!match) return socket.destroy();
    const table = match[1];
    wss.handleUpgrade(req, socket, head, (ws) => {
        wss.emit('connection', ws, table);
    });
});

wss.on('connection', async (ws, table) => {
    console.log(`WebSocket connected for table: ${table}`);

    console.log('Connecting pool...');
    const client = await pool.connect();
    console.log('Connected to pool');

    // Each connection gets its own PG client to LISTEN
    console.log(`LISTEN changes_${table}`);
    await client.query(`LISTEN changes_${table}`);

    // Receive the initial query definition from the client
    console.log('Attaching ws.once(\'message\')');
    ws.once('message', async (msg) => {
        console.log('message received', msg);
        try {
            const query = JSON.parse(msg.toString());
            const { filters = [], order = [], limit = 100, offset = 0 } = query;

            // Send initial data
            const { whereSql, params } = db.buildWhere(filters);
            const orderSql = db.buildOrder(order);
            const sql = `
                SELECT id, data, created_at, updated_at
                FROM "${table}"
                ${whereSql} ${orderSql}
                LIMIT ${limit} OFFSET ${offset}`;
            const res = await client.query(sql, params);
            console.log('Sending result back to client');
            ws.send(JSON.stringify({ type: 'init', data: res.rows.map(r => ({ id: r.id, ...r.data })) }));
        } catch (err) {
            console.error('Error processing web socket message', err);
            console.log('Sending response back to client');
            ws.send(JSON.stringify({ type: 'error', error: err }));
        }
    });

    // Handle Postgres notifications
    console.log('Attaching client.on(\'notification\')');
    client.on('notification', async (msg) => {
        console.log('postgres notification received');
        console.log('web socket read state is:', ws.readyState);
        if (ws.readyState !== WebSocket.OPEN) return;
        const payload = JSON.parse(msg.payload);
        ws.send(JSON.stringify({ type: 'change', data: payload }));
    });

    console.log('Attaching ws.on(\'close\')');
    ws.on('close', () => {
        console.log(`UNLISTEN changes_${table}`);
        client.query(`UNLISTEN changes_${table}`).catch(console.error);
        client.release();
    });
});
