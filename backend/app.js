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

// -----------------------------
// METERED USAGE ENDPOINT
// -----------------------------
router.post('/meter-usage', verifyApiKey, async (req, res) => {
    const { count = 1 } = req.body;
    const totalCharge = count * PRICE_PER_REQUEST;

    await db.collection('usage_logs').add({
        userId: req.apiUserId,
        count,
        totalCharge,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Optional: enqueue for Stripe invoice creation later
    res.json({ ok: true, billed: totalCharge });
});

// Middleware to check and charge balance
async function requireFunds(req, res, next) {
    const uid = req.apiUserId || req.user.id;
    const userRef = db.collection('users').doc(uid);
    const userDoc = await userRef.get();
    const bal = userDoc.exists ? userDoc.data().balanceUSD || 0 : 0;
    if (bal < PRICE_PER_REQUEST) return res.status(402).json({ error: 'Insufficient funds' });

    await db.runTransaction(async (t) => {
        const d = await t.get(userRef);
        const b = d.data().balanceUSD || 0;
        if (b < PRICE_PER_REQUEST) throw new Error('Insufficient funds');
        t.update(userRef, { balanceUSD: b - PRICE_PER_REQUEST });
    });

    next();
}

makeGenericRouter({ pool, router, rulesModule, authField: 'auth' });

// For local testing
// app.use(cors({
//     origin: ["http://localhost:8080", "http://localhost:8080/*"],
//     credentials: true,
// }));
app.use(express.json());
app.use(await authMiddleware(pool));
app.use('/api', router);
