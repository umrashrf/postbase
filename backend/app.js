import express from 'express';
//import cors from 'cors';
import { WebSocketServer } from 'ws';
import { toNodeHandler } from "better-auth/node";

import { createPool } from './lib/postbase/db.js';
import { makeGenericRouter } from './lib/postbase/genericRouter.js';
import { createStorageRouter } from './lib/postbase/storage.js';
import { createLocalStorage } from './postbase/local-storage.js';
//import { makePostbaseAdminClient } from './postbase/adminClient.js';
import rulesModuleDB from './postbase_db_rules.js';
import rulesModuleStorage from './postbase_storage_rules.js';
import { authenticate } from './middlewares/auth_middleware.js';
import { auth } from './router/auth.js';

const UPLOAD_DESTINATION = '/absolute/path/to/where/user/uploads/will/be/stored'; // use public/uploads directory if using React/Vite
const UPLOAD_PUBLIC_URL = 'https://www.yourwebsite.com/uploads';

// Initialize DB pool using env variables
const pool = createPool({
    connectionString: process.env.DATABASE_URL
});

// This is firestore alternative
//const db = makePostbaseAdminClient({ pool });

// This is firebase storage alternative
const bucket = createLocalStorage(
    UPLOAD_DESTINATION,
    UPLOAD_PUBLIC_URL // this is needed for making public urls
).bucket();

export const app = express();
const router = express.Router();
const wss = new WebSocketServer({ noServer: true });

// BetterAuth
router.all("/auth/*", toNodeHandler(auth));

const genericRouter = makeGenericRouter({ pool, rulesModule: rulesModuleDB, authField: 'auth' });
router.use('/db', authenticate, genericRouter);

router.use('/storage', authenticate, createStorageRouter(UPLOAD_DESTINATION, bucket, rulesModuleStorage));

// For local testing
// app.use(cors({
//     origin: ["http://localhost:8080", "http://localhost:8080/*"],
//     credentials: true,
// }));
app.use(express.json());
app.use('/api', router);

// Upgrade HTTP → WS when path matches /api/<table>/stream
app.on('upgrade', (req, socket, head) => {
    const match = req.url.match(/^\/api\/([^\/]+)\/stream$/);
    if (!match) return socket.destroy();
    const table = match[1];
    wss.handleUpgrade(req, socket, head, (ws) => {
        wss.emit('connection', ws, table);
    });
});

wss.on('connection', async (ws, table) => {
    console.log(`WebSocket connected for table: ${table}`);

    // Each connection gets its own PG client to LISTEN
    const client = await pool.connect();
    await client.query(`LISTEN changes_${table}`);

    // Receive the initial query definition from the client
    ws.once('message', async (msg) => {
        const query = JSON.parse(msg.toString());
        const { filters = [], order = [], limit = 100, offset = 0 } = query;

        // Send initial data
        const { whereSql, params } = buildWhere(filters);
        const orderSql = buildOrder(order);
        const sql = `
        SELECT id, data, created_at, updated_at
        FROM "${table}"
        ${whereSql} ${orderSql}
        LIMIT ${limit} OFFSET ${offset}`;
        const res = await runQuery(pool, sql, params);
        ws.send(JSON.stringify({ type: 'init', data: res.rows.map(r => ({ id: r.id, ...r.data })) }));
    });

    // Handle Postgres notifications
    client.on('notification', async (msg) => {
        if (!ws.readyState === ws.OPEN) return;
        const payload = JSON.parse(msg.payload);
        ws.send(JSON.stringify({ type: 'change', data: payload }));
    });

    ws.on('close', () => {
        client.query(`UNLISTEN changes_${table}`).catch(console.error);
        client.release();
    });
});
