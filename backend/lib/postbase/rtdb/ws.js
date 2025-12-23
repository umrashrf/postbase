export function createRtdbWs(wss) {
    const exact = new Map();    // path → Set<ws>
    const prefixes = new Map(); // prefix → Set<ws>
    const fields = new Map();   // path|field → Set<ws>

    const clean = p => (p || '').replace(/^\/+|\/+$/g, '');

    const add = (map, key, ws) => {
        if (!map.has(key)) map.set(key, new Set());
        map.get(key).add(ws);
    };

    const removeAll = ws => {
        for (const map of [exact, prefixes, fields]) {
            for (const [k, set] of map) {
                set.delete(ws);
                if (!set.size) map.delete(k);
            }
        }
    };

    wss.on('connection', ws => {
        ws.on('message', msg => {
            try {
                const data = JSON.parse(msg.toString());
                const path = clean(data.path);

                if (data.type === 'sub') {
                    if (data.field)
                        add(fields, `${path}|${data.field}`, ws);
                    else if (data.prefix)
                        add(prefixes, `${path}/`, ws);
                    else
                        add(exact, path, ws);
                }

                if (data.type === 'unsub') removeAll(ws);
            } catch {}
        });

        ws.on('close', () => removeAll(ws));
    });

    // -----------------------------------------------------
    // Notifier (called by REST)
    // -----------------------------------------------------
    async function notify(path, newVal, oldVal = null) {
        const p = clean(path);

        // exact listeners
        if (exact.has(p)) {
            const msg = JSON.stringify({ path: p, value: newVal });
            exact.get(p).forEach(ws => ws.send(msg));
        }

        // prefix listeners
        for (const [pre, set] of prefixes) {
            if (p.startsWith(pre)) {
                const msg = JSON.stringify({ path: p, value: newVal });
                set.forEach(ws => ws.send(msg));
            }
        }

        // field listeners
        if (newVal) {
            for (const [k, set] of fields) {
                const [fp, field] = k.split('|');
                if (fp !== p) continue;

                const oldFieldValue = oldVal ? oldVal[field] : undefined;
                if (newVal[field] !== oldFieldValue) {
                    const msg = JSON.stringify({
                        path: p,
                        field,
                        value: newVal[field],
                    });
                    set.forEach(ws => ws.send(msg));
                }
            }
        }
    }

    return { notify };
}
