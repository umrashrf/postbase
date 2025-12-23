// frontend/lib/postbase/rtdbClient.js
export class RtdbClient {
    constructor({ restUrl, wsUrl }) {
        this.restUrl = restUrl.replace(/\/+$/, '');
        this.wsUrl = wsUrl;
        this.ws = null;
        this.listeners = new Map();
    }

    async connect() {
        this.ws = new WebSocket(this.wsUrl);

        await new Promise((resolve, reject) => {
            this.ws.addEventListener("open", resolve, { once: true });
            this.ws.addEventListener("error", reject, { once: true });
        });

        this.ws.addEventListener("message", evt => {
            let msg;
            try { msg = JSON.parse(evt.data); }
            catch { return; }

            const { path, field, value } = msg;
            const key = field ? `${path}/${field}` : path;

            if (this.listeners.has(key)) {
                for (const cb of this.listeners.get(key)) cb(value);
            }
        });
    }

    /**
     * Firebase-style ON()
     */
    on(path, callback) {
        if (!this.listeners.has(path)) {
            this.listeners.set(path, new Set());

            const parts = path.split("/");
            const isField = parts.length > 2;

            let type = "sub";
            let payload = { type, path };

            if (isField) {
                const field = parts.pop();
                const basePath = parts.join("/");
                payload = { type, path: basePath, field };
            }

            // prefix listener if path does NOT include a leaf key
            if (path !== "" && !isField && !path.includes("/")) {
                payload = { type, path, prefix: true };
            }

            this.ws.send(JSON.stringify(payload));
        }

        this.listeners.get(path).add(callback);

        // Return unsubscribe function (like Firebase)
        return () => this.off(path, callback);
    }

    /**
     * Firebase-style OFF()
     */
    off(path, callback) {
        if (!this.listeners.has(path)) return;

        if (callback)
            this.listeners.get(path).delete(callback);

        if (!callback || this.listeners.get(path).size === 0) {
            this.listeners.delete(path);

            this.ws.send(JSON.stringify({
                type: "unsub",
                path
            }));
        }
    }

    // -------------------
    // Write / update
    // -------------------
    async set(path, value) {
        return fetch(`${this.restUrl}/rtdb/${path}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(value),
        }).then(r => r.json());
    }

    async get(path) {
        return fetch(`${this.restUrl}/rtdb/${path}`)
            .then(r => r.json());
    }

    async update(path, value) {
        return fetch(`${this.restUrl}/rtdb/${path}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(value),
        }).then(res => res.json());
    }
}
