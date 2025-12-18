// backend/postbase_rtdb_rules.js
export default {
    paths: {
        "/users/$uid": {
            read: (req, ctx) =>
                !!req.auth && req.auth.id === ctx.params.uid,

            write: (req, ctx) =>
                !!req.auth && req.auth.id === ctx.params.uid,

            delete: (req, ctx) =>
                !!req.auth && req.auth.id === ctx.params.uid,
        },

        "/public": {
            read: true,
            write: false,
            delete: false,
        },
    },

    default: {
        read: false,
        write: false,
        delete: false,
    }
};
