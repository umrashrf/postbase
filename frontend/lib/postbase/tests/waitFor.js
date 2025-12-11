export function waitFor(fn, timeout = 500) {
    return new Promise((resolve, reject) => {
        const start = Date.now();
        const tick = () => {
            if (fn()) return resolve();
            if (Date.now() - start > timeout) {
                return reject(new Error('timeout'));
            }
            setTimeout(tick, 10);
        };
        tick();
    });
}
