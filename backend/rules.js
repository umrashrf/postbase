// server/rules.js
import { RuleHelpers as H } from './lib/postbase/rulesEngine.js';

/**
 * This ruleset mirrors your Firestore rules.
 * Each table corresponds to a Firestore collection.
 * All functions receive (request, resource)
 *   - request.auth may be null or { uid, ... }
 *   - request.resource.data equivalent → request.resource (on create)
 *   - resource.data → resource (for read/update/delete)
 */
export default {
    tables: {
        /** === USERS === */
        users: {
            // Allow read and update if the auth.id matches the userId (row id)
            read: (req, res) => H.isAuth(req) && req.auth.id === String(res.id),
            update: (req, res) => H.isAuth(req) && req.auth.id === String(res.id),

            // Allow create if auth.id == resource.userId
            create: (req, res) => H.isAuth(req) && req.auth.id === String(res.id),

            // Delete not allowed
            delete: () => false,
        },

        /** === REVIEWS === */
        reviews: {
            // Everyone can read
            read: () => true,

            // Authenticated users can create reviews with proper fields and constraints
            create: (req, res) => {
                if (!H.isAuth(req)) return false;
                const d = req.resource || {};
                const isString = (v) => typeof v === 'string' && v.trim().length > 0;
                const isInt = (v) => Number.isInteger(v);

                const valid =
                    isString(d.name) &&
                    isString(d.email) &&
                    isString(d.comment) &&
                    isInt(d.stars) &&
                    d.stars >= 1 &&
                    d.stars <= 5 &&
                    // check createdAt equals request.time: approximated by presence of field
                    !!d.createdAt;

                return valid;
            },

            // No updates or deletes
            update: () => false,
            delete: () => false,
        },

        /** === DEV_REQUESTS === */
        dev_requests: {
            // Authenticated user can read their own requests
            read: (req, res) =>
                H.isAuth(req) && req.auth.id === String(res.user_id || res.userId),

            // Authenticated user can create their own requests with valid data
            create: (req, res) => {
                if (!H.isAuth(req)) return false;
                const d = req.resource || {};
                const isString = (v) => typeof v === 'string' && v.trim().length > 0;

                return (
                    req.auth.id === String(d.user_id || d.userId) &&
                    isString(d.name) &&
                    isString(d.email) &&
                    isString(d.description)
                );
            },

            // No updates or deletes
            update: () => false,
            delete: () => false,
        },

        /** === API_KEYS === */
        api_keys: {
            // Read / update / delete allowed only for owner
            read: (req, res) => {
                if (!res) return H.isAuth(req);
                return H.isAuth(req) && req.auth.id === String(res.user_id || res.userId);
            },
            update: (req, res) =>
                H.isAuth(req) && req.auth.id === String(res.user_id || res.userId),
            delete: (req, res) =>
                H.isAuth(req) && req.auth.id === String(res.user_id || res.userId),

            // Create: must be owner and valid key string with length >= 16
            create: (req, res) => {
                if (!H.isAuth(req)) return false;
                const d = req.resource || {};
                const isString = (v) => typeof v === 'string' && v.trim().length >= 16;
                return (
                    req.auth.id === String(d.user_id || d.userId) &&
                    isString(d.key)
                );
            },
        },

        /** === BILLING === */
        billing: {
            // Read and write allowed only for owner
            read: (req, res) =>
                H.isAuth(req) && req.auth.id === String(res.user_id || res.userId),
            create: (req, res) =>
                H.isAuth(req) && req.auth.id === String(res.user_id || res.userId),
            update: (req, res) =>
                H.isAuth(req) && req.auth.id === String(res.user_id || res.userId),
            delete: (req, res) =>
                H.isAuth(req) && req.auth.id === String(res.user_id || res.userId),
        },
    },

    /** === GLOBAL DEFAULTS === */
    default: {
        // Default deny everything (read/write false)
        read: () => false,
        create: () => false,
        update: () => false,
        delete: () => false,
    },
};
