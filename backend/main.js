import './env.js';
import fs from 'node:fs';
import https from 'node:https';

import { app } from './app.js';
import { setupWebsocket } from './lib/postbase/websocket.js';

const httpsOptions = {
    key: fs.readFileSync(process.env.LETSENCRYPT_KEY),
    cert: fs.readFileSync(process.env.LETSENCRYPT_CERT)
};

const HTTPS_PORT = process.env.POSTBASE_BACKEND_HTTPS_PORT || 4431;

const server = https.createServer(httpsOptions, app);

server.listen(HTTPS_PORT,
    () => console.log(`Postbase backend listening on https://0.0.0.0:${HTTPS_PORT}`));

const wss = setupWebsocket({ server });
