import express from 'express';
import http from 'http';
import { WebSocketServer } from 'ws';
import bodyParser from 'body-parser';

import { pool, resetDb } from './db.js';
import { authMiddleware } from '../middlewares/auth.js';
import { createRtdbRouter } from '../rtdb/router.js';
import { createRtdbWs } from '../rtdb/ws.js';
import rules from './rules.js';

export async function startTestServer() {
    await resetDb();

    const app = express();
    app.use(bodyParser.json());

    const server = http.createServer(app);
    const wss = new WebSocketServer({ server });

    const authenticate = authMiddleware(pool);
    const rtdbWs = createRtdbWs(wss);

    app.use(
        '/rtdb',
        authenticate,
        createRtdbRouter({
            pool,
            notify: rtdbWs.notify,
            rulesModule: rules,
        })
    );

    await new Promise(res => server.listen(0, res));

    const port = server.address().port;

    return {
        app,
        server,
        wss,
        url: `http://localhost:${port}`,
        wsUrl: `ws://localhost:${port}`,
        close: () => server.close(),
    };
}
