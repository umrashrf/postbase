import express from 'express';
import cors from 'cors';
import { toNodeHandler } from "better-auth/node";

import { createPool } from './db.js';
import { makeGenericRouter } from './genericRouter.js';
import rulesModule from './rules.js';
import { authMiddleware } from './middlewares/auth.js';

// Initialize DB pool using env variables
const pool = createPool({
    connectionString: process.env.POSTGRES_CONNECTION_STRING
});

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
