// fileRules.js
import { RuleHelpers as H } from './lib/postbase/rulesEngine.js'; // adjust import path to your evaluator helpers

export default {
    tables: {
        files: {
            // read: allowed if authenticated and auth.id equals owner OR auth.id in allowedUsers
            read: (req, resource) => {
                if (!resource) return false;
                if (!H.isAuth(req)) return false;
                const uid = req.auth.id;
                if (!uid) return false;
                if (resource.owner && String(resource.owner) === String(uid)) return true;
                if (Array.isArray(resource.allowedUsers) && resource.allowedUsers.map(String).includes(String(uid))) return true;
                return false;
            },

            // create: allow if auth.id equals incoming owner OR auth.id in incoming allowedUsers
            create: (req, resource) => {
                if (!H.isAuth(req)) return false;
                const uid = req.auth.id;
                if (!uid) return false;
                // resource is the incoming metadata object: must specify owner or allowedUsers
                if (resource.owner && String(resource.owner) === String(uid)) return true;
                if (Array.isArray(resource.allowedUsers) && resource.allowedUsers.map(String).includes(String(uid))) return true;
                return false;
            },

            // delete: only owner
            delete: (req, resource) => {
                if (!H.isAuth(req)) return false;
                const uid = req.auth.id;
                return resource && resource.owner && String(resource.owner) === String(uid);
            }
        }
    },

    // default denies everything
    default: {
        read: () => false,
        create: () => false,
        update: () => false,
        delete: () => false
    }
};
