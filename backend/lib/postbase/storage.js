// server/storage.js
import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { makeEvaluator } from './rulesEngine.js';

export function createStorageRouter(uploadDestination, bucket, rulesModule) {
    const router = express.Router();
    const upload = multer({ storage: multer.memoryStorage() });

    const evaluator = makeEvaluator(rulesModule);

    // --- Helper functions ---
    function metaPathFor(filePath) {
        return path.join(uploadDestination, `${filePath}.meta.json`);
    }

    async function loadMetadata(filePath) {
        try {
            const data = await fs.promises.readFile(metaPathFor(filePath), 'utf8');
            return JSON.parse(data);
        } catch {
            return null;
        }
    }

    async function saveMetadata(filePath, meta) {
        await fs.promises.mkdir(path.dirname(metaPathFor(filePath)), { recursive: true });
        await fs.promises.writeFile(metaPathFor(filePath), JSON.stringify(meta, null, 2), 'utf8');
    }

    // --- Routes ---

    // Upload file
    router.post('/upload', upload.single('file'), async (req, res) => {
        const file = req.file;
        const filePath = (req.query.path || '').replace(/^\/+/, '');

        if (!file) return res.status(400).json({ error: 'Missing file' });
        if (!filePath) return res.status(400).json({ error: 'Missing ?path=' });

        let incomingMeta = {};
        try {
            incomingMeta = req.body.metadata ? JSON.parse(req.body.metadata) : {};
        } catch {
            incomingMeta = {};
        }

        const resource = { ...incomingMeta, path: filePath };
        const request = { auth: req.auth, method: req.method, body: req.body, query: req.query, ip: req.ip };

        // Security check: can this user create this file?
        const allowed = await evaluator.evaluate('files', 'create', request, resource);
        if (!allowed) return res.status(403).json({ error: 'Permission denied' });

        try {
            const fileObj = bucket.file(filePath);
            await fileObj.save(file.buffer, { contentType: file.mimetype });

            const owner = incomingMeta.owner || req.auth?.id;
            const allowedUsers = incomingMeta.allowedUsers || [owner];

            const meta = {
                owner,
                allowedUsers: allowedUsers.map(String),
                contentType: file.mimetype,
                size: file.size,
                createdAt: new Date().toISOString(),
                path: filePath,
                publicUrl: fileObj.publicUrl(),
            };

            await saveMetadata(filePath, meta);
            res.status(201).json({ publicUrl: meta.publicUrl, metadata: meta });
        } catch (err) {
            console.error('upload error', err);
            res.status(500).json({ error: 'Failed to save file' });
        }
    });

    // Get file metadata
    router.get('/metadata', async (req, res) => {
        const filePath = (req.query.path || '').replace(/^\/+/, '');
        const meta = await loadMetadata(filePath);
        if (!meta) return res.status(404).json({ error: 'Not found' });

        const request = { auth: req.auth, method: req.method, query: req.query, ip: req.ip };
        const allowed = await evaluator.evaluate('files', 'read', request, meta);
        if (!allowed) return res.status(403).json({ error: 'Permission denied' });

        res.json(meta);
    });

    // Download file (rule-checked)
    router.get('/download', async (req, res) => {
        const filePath = (req.query.path || '').replace(/^\/+/, '');
        const meta = await loadMetadata(filePath);
        if (!meta) return res.status(404).json({ error: 'Not found' });

        const request = { auth: req.auth, method: req.method, query: req.query, ip: req.ip };
        const allowed = await evaluator.evaluate('files', 'read', request, meta);
        if (!allowed) return res.status(403).json({ error: 'Permission denied' });

        const fullPath = path.join(uploadDestination, filePath);
        res.sendFile(fullPath);
    });

    // Delete file
    router.delete('/file', async (req, res) => {
        const filePath = (req.query.path || '').replace(/^\/+/, '');
        const meta = await loadMetadata(filePath);
        if (!meta) return res.status(404).json({ error: 'Not found' });

        const request = { auth: req.auth, method: req.method, query: req.query, ip: req.ip };
        const allowed = await evaluator.evaluate('files', 'delete', request, meta);
        if (!allowed) return res.status(403).json({ error: 'Permission denied' });

        try {
            await fs.promises.unlink(path.join(uploadDestination, filePath));
            await fs.promises.unlink(metaPathFor(filePath)).catch(() => { });
            res.json({ deleted: true });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Delete failed' });
        }
    });

    return router;
}
