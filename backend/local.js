import './env.js'; // for loading .env file
import os from 'node:os';
import http from 'node:http';
import cluster from 'node:cluster';
import { setupWebsocket } from './lib/postbase/websocket.js';
import { app } from "./app.js";

const HTTPS_PORT = process.env.POSTBASE_BACKEND_HTTP_PORT || "8081";

if (cluster.isPrimary) {
    const workers = os.availableParallelism();

    for (let i = 0; i < workers; i++) {
        cluster.fork();
    }
} else {
    const server = http.createServer({}, app);

    setupWebsocket({ server });

    server.listen(parseInt(HTTPS_PORT), "127.0.0.1",
        () => console.log(`Postbase backend listening on http://127.0.0.1:${HTTPS_PORT}`));
}
