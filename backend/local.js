import './env.js'; // for loading .env file
import http from 'node:http';
import { setupWebsocket } from './lib/postbase/websocket.js';
import { app } from "./src/app.js";

const HTTPS_PORT = process.env.POSTBASE_BACKEND_HTTP_PORT || 8081;

const server = http.createServer({}, app);

setupWebsocket({ server });

server.listen(HTTPS_PORT,
    () => console.log(`Postbase backend listening on https://0.0.0.0:${HTTPS_PORT}`));

