import express from 'express';
//import cors from 'cors';
import { WebSocketServer } from 'ws';
import { toNodeHandler } from "better-auth/node";

// TODO: npm install @postbase/server and replace with @postbase/server/..
import { createPool } from './lib/postbase/db.js';
import { makeGenericRouter } from './lib/postbase/genericRouter.js';
import { createStorageRouter } from './lib/postbase/storage.js';
import { createLocalStorage } from './lib/postbase/local-storage.js';
import { createRtdbWs } from './lib/postbase/rtdb/ws.js';
import { createRtdbRouter } from './lib/postbase/rtdb/router.js';
import { makePostbaseAdminClient } from './lib/postbase/adminClient.js';
import rulesModuleDB from './postbase_db_rules.js';
import rulesModuleStorage from './postbase_storage_rules.js';
import rulesModuleRTDB from './postbase_rtdb_rules.js';
import { authMiddleware } from './lib/postbase/middlewares/auth.js';
import { betterAuth } from './auth.js';

const POSTBASE_STORAGE_ROOT_DIR = process.env.POSTBASE_STORAGE_ROOT_DIR || '/var/www/html/www.yourwebsite.com/uploads';
const POSTBASE_STORAGE_PUBLIC_URL = process.env.POSTBASE_STORAGE_PUBLIC_URL || 'http://localhost:5173/uploads';


// Initialize DB pool using env variables
export const pool = createPool({
    connectionString: process.env.DATABASE_URL
});

const authenticate = authMiddleware(pool);
const auth = betterAuth({
    database: pool,
});

// This is firestore alternative
export const db = makePostbaseAdminClient({ pool });

// This is firebase storage alternative
const bucket = createLocalStorage(
    POSTBASE_STORAGE_ROOT_DIR,
    POSTBASE_STORAGE_PUBLIC_URL // this is needed for making public urls
).bucket();

export const app = express();
const router = express.Router();
const wss = new WebSocketServer({ noServer: true });

// BetterAuth
router.all("/auth/*", toNodeHandler(auth));

const genericRouter = makeGenericRouter({ pool, rulesModule: rulesModuleDB, authField: 'auth' });
router.use('/db', authenticate, genericRouter);

router.use('/storage', authenticate, createStorageRouter(POSTBASE_STORAGE_ROOT_DIR, bucket, rulesModuleStorage));

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
//     origin: ["http://localhost:5173", "http://localhost:5174"],
//     methods: ["GET", "POST", "PUT", "DELETE"],
//     credentials: true,
// }));
app.use(express.json());
app.use('/api', router);
