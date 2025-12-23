// backend/lib/postbase/rtdb/rulesEngine.js

/**
 * Extract /users/$uid → { uid: "u1" }
 */
function matchPathRule(rulePath, actualPath) {
    const rSeg = rulePath.split("/").filter(Boolean);
    const aSeg = actualPath.split("/").filter(Boolean);

    if (rSeg.length !== aSeg.length) return null;

    const params = {};

    for (let i = 0; i < rSeg.length; i++) {
        const r = rSeg[i];
        const a = aSeg[i];

        if (r.startsWith("$")) {
            params[r.slice(1)] = a;
        } else if (r !== a) {
            return null;
        }
    }

    return params;
}

export function makeRtdbEvaluator(rulesModule) {
    const rulePaths = Object.entries(rulesModule.paths || {});
    const defaults = rulesModule.default || { read: false, write: false };

    /**
     * op = "read" or "write"
     */
    async function evaluate(op, request, context) {
        const { path } = context;

        // Find matching rule
        for (const [rulePath, ruleDef] of rulePaths) {
            const params = matchPathRule(rulePath, path);
            if (params) {
                context.params = params;
                const fn = ruleDef[op];

                if (typeof fn === "function") {
                    const r = fn(request, context);
                    return r instanceof Promise ? await r : !!r;
                }
                if (typeof fn === "boolean") return fn;
            }
        }

        // Apply defaults
        const def = defaults[op];
        if (typeof def === "function") {
            const r = def(request, context);
            return r instanceof Promise ? await r : !!r;
        }
        return !!def;
    }

    return { evaluate };
}
