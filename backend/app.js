import express from 'express';
import cors from 'cors';
import { toNodeHandler } from "better-auth/node";

import { createPool } from './lib/postbase/db.js';
import { authMiddleware } from './lib/postbase/middlewares/auth.js';
import { makeGenericRouter } from './lib/postbase/genericRouter.js';
import { createStorageRouter } from './lib/postbase/storage.js';
import { createLocalStorage } from './postbase/local-storage.js';
import { makePostbaseAdminClient } from './postbase/adminClient.js';
import rulesModuleDB from './postbase_db_rules.js';
import rulesModuleStorage from './postbase_storage_rules.js';

const UPLOAD_DESTINATION = '/absolute/path/to/where/user/uploads/will/be/stored';
const UPLOAD_PUBLIC_URL = 'https://www.yourwebsite.com/uploads';

// Initialize DB pool using env variables
const pool = createPool({
    connectionString: process.env.DATABASE_URL
});

// This is firestore alternative
const db = makePostbaseAdminClient({ pool });

// This is firebase storage alternative
const bucket = createLocalStorage(
    UPLOAD_DESTINATION,
    UPLOAD_PUBLIC_URL // this is needed for making public urls
).bucket();

export const app = express();
const router = express.Router();

// BetterAuth
// router.all("/auth/*", toNodeHandler(auth));

makeGenericRouter({ pool, router, rulesModule: rulesModuleDB, authField: 'auth' });

router.use('/storage', createStorageRouter(UPLOAD_DESTINATION, bucket, rulesModuleStorage));

// For local testing
// app.use(cors({
//     origin: ["http://localhost:8080", "http://localhost:8080/*"],
//     credentials: true,
// }));
app.use(express.json());
app.use(await authMiddleware(pool));
app.use('/api', router);
