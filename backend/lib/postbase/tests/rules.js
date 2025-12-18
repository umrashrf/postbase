// backend/postbase_rtdb_rules.js
export default {
    paths: {
        "/users/$uid": {
            read: () => true,
            write: () => true,
            delete: () => true,
        },

        "/users/$uid/posts": {
            read: () => true,
            write: () => true,
        },

        "/users/$uid/profile": {
            read: () => true,
            write: () => true,
        }
    },

    default: {
        read: false,
        write: false,
        delete: false,
    }
};
