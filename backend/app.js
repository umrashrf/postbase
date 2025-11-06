import express from 'express';
import cors from 'cors';
import { toNodeHandler } from "better-auth/node";

import { createPool } from './lib/postbase/db.js';
import { makeGenericRouter } from './lib/postbase/genericRouter.js';
import rulesModule from './rules.js';
import { authMiddleware } from './lib/postbase/middlewares/auth.js';
import { makePostbaseAdminClient } from './postbase/adminClient.js';
import { createLocalStorage } from './postbase/local-storage.js';

// Initialize DB pool using env variables
const pool = createPool({
    connectionString: process.env.DATABASE_URL
});

// This is firestore alternative
const db = makePostbaseAdminClient({ pool });

// This is firebase storage alternative
const storage = createLocalStorage(
    '/absolute/path/to/where/user/uploads/will/be/stored',
    'https://www.yourwebsite.com/uploads' // this is needed for making public urls
).bucket();

export const app = express();
const router = express.Router();

// BetterAuth
// router.all("/auth/*", toNodeHandler(auth));

makeGenericRouter({ pool, router, rulesModule, authField: 'auth' });

// For local testing
// app.use(cors({
//     origin: ["http://localhost:8080", "http://localhost:8080/*"],
//     credentials: true,
// }));
app.use(express.json());
app.use(await authMiddleware(pool));
app.use('/api', router);
