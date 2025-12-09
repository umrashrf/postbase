import express from 'express';
import http from 'http';
import { WebSocketServer } from 'ws';
import bodyParser from 'body-parser';

import { pool, resetDb } from './db.js';
import { createRtdbRouter } from '../rtdb/router.js';
import { createRtdbWs } from '../rtdb/ws.js';

export async function startTestServer() {
    await resetDb();

    const app = express();
    app.use(bodyParser.json());

    const server = http.createServer(app);
    const wss = new WebSocketServer({ server });

    const rtdbWs = createRtdbWs(wss);

    app.use(
        '/rtdb',
        createRtdbRouter({
            pool,
            notify: rtdbWs.notify,
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
