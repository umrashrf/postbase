import express from 'express';
//import cors from 'cors';
import { WebSocketServer } from 'ws';
import { toNodeHandler } from "better-auth/node";

import { createPool } from './lib/postbase/db.js';
import { makeGenericRouter } from './lib/postbase/genericRouter.js';
import { createStorageRouter } from './lib/postbase/storage.js';
import { createLocalStorage } from './postbase/local-storage.js';
import { createRtdbWs } from './lib/postbase/rtdb/ws.js';
import { createRtdbRouter } from './lib/postbase/rtdb/router.js';
//import { makePostbaseAdminClient } from './postbase/adminClient.js';
import rulesModuleDB from './postbase_db_rules.js';
import rulesModuleStorage from './postbase_storage_rules.js';
import rulesModuleRTDB from './postbase_rtdb_rules.js';
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

const rtdbWs = createRtdbWs(wss);

router.use(
    '/rtdb',
    authenticate,
    createRtdbRouter({
        pool,
        notify: rtdbWs.notify,
        rulesModule: rulesModuleRTDB,
    })
);

// For local testing
// app.use(cors({
//     origin: ["http://localhost:8080", "http://localhost:8080/*"],
//     credentials: true,
// }));
app.use(express.json());
app.use('/api', router);
