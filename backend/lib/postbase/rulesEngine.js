/**
 * Simple rules engine. Rules are plain javascript functions that receive:
 * - request: {auth, method, params, query, body, ip}
 * - resource: for read/update/delete: current row (object); for create: incoming data
 *
 * Rules file should export default object:
 * {
 *   tables: {
 *     posts: {
 *       read: (request, resource) => boolean | Promise<boolean>,
 *       create: (request, resource) => boolean | Promise<boolean>,
 *       update: ...,
 *       delete: ...
 *     }
 *   },
 *   default: { read: true, create: false, update: false, delete: false }
 * }
 */

export function makeEvaluator(rulesModule = {}) {
    const tables = (rulesModule && rulesModule.tables) || {};
    const defaults = (rulesModule && rulesModule.default) || { read: true, create: true, update: true, delete: true };

    async function evaluate(tableName, op, request, resource = null) {
        const tableRules = tables[tableName];
        let fn;
        if (tableRules && typeof tableRules[op] === 'function') {
            fn = tableRules[op];
        } else if (defaults && typeof defaults[op] === 'function') {
            fn = defaults[op];
        } else {
            // boolean default allowed/denied
            const val = (defaults && defaults[op]);
            if (typeof val === 'boolean') return val;
            // fallback allow
            return true;
        }
        const result = fn(request, resource);
        if (result && typeof result.then === 'function') {
            return await result;
        }
        return !!result;
    }

    return { evaluate };
}

/**
 * Helper functions you can import into your rules file to keep rules concise.
 */
export const RuleHelpers = {
    isAuth: (request) => !!request.auth,
    uidEquals: (request, propOrValue) => {
        if (!request.auth) return false;
        // propOrValue can be a function(resource) or a string path
        if (typeof propOrValue === 'function') return request.auth.id === propOrValue(request.resource);
        return request.auth.id === propOrValue;
    },
    allowIf: (pred) => (request, resource) => !!pred(request, resource),
    and: (...preds) => (req, res) => preds.every(p => p(req, res)),
    or: (...preds) => (req, res) => preds.some(p => p(req, res)),
};
