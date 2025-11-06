import './env.js';
import fs from 'node:fs';
import https from 'node:https';
import { app } from './server.js';

const httpsOptions = {
    key: fs.readFileSync(process.env.LETSENCRYPT_KEY),
    cert: fs.readFileSync(process.env.LETSENCRYPT_CERT)
};

const HTTPS_PORT = process.env.POSTBASE_BACKEND_HTTPS_PORT || 4431;

https.createServer(httpsOptions, app).listen(HTTPS_PORT, () => console.log(`Postbase backend listening on https://0.0.0.0:${HTTPS_PORT}`));
