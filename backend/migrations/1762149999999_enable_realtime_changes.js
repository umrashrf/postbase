/**
 * @file 1762149999999_enable_realtime_changes.js
 * Adds realtime triggers (pg_notify) for Firestore-style JSONB tables.
 */

export const shorthands = undefined;

export const up = async (pgm) => {
    // --- Shared trigger function for realtime updates ---
    await pgm.sql(`
    CREATE OR REPLACE FUNCTION notify_table_change() RETURNS trigger AS $$
    DECLARE
      payload JSON;
    BEGIN
      IF (TG_OP = 'DELETE') THEN
        payload = json_build_object('op', TG_OP, 'id', OLD.id);
      ELSE
        payload = json_build_object('op', TG_OP, 'id', NEW.id, 'data', NEW.data);
      END IF;
      PERFORM pg_notify('changes_' || TG_TABLE_NAME, payload::text);
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `);

    // --- Helper function to create trigger for a table ---
    const createRealtimeTrigger = async (tableName) => {
        await pgm.sql(`
      CREATE TRIGGER ${tableName}_change
      AFTER INSERT OR UPDATE OR DELETE ON "${tableName}"
      FOR EACH ROW
      EXECUTE FUNCTION notify_table_change();
    `);
    };

    // --- Create triggers for each table ---
    await createRealtimeTrigger('users');
    await createRealtimeTrigger('reviews');
    await createRealtimeTrigger('dev_requests');
    await createRealtimeTrigger('api_keys');
    await createRealtimeTrigger('billing');
    await createRealtimeTrigger('domain_requests');
    await createRealtimeTrigger('sessions');
};

export const down = async (pgm) => {
    // Drop all triggers explicitly
    await pgm.sql(`DROP TRIGGER IF EXISTS users_change ON "users" CASCADE;`);
    await pgm.sql(`DROP TRIGGER IF EXISTS reviews_change ON "reviews" CASCADE;`);
    await pgm.sql(`DROP TRIGGER IF EXISTS dev_requests_change ON "dev_requests" CASCADE;`);
    await pgm.sql(`DROP TRIGGER IF EXISTS api_keys_change ON "api_keys" CASCADE;`);
    await pgm.sql(`DROP TRIGGER IF EXISTS billing_change ON "billing" CASCADE;`);
    await pgm.sql(`DROP TRIGGER IF EXISTS domain_requests_change ON "domain_requests" CASCADE;`);
    await pgm.sql(`DROP TRIGGER IF EXISTS sessions_change ON "sessions" CASCADE;`);

    // Drop shared trigger function
    await pgm.sql(`DROP FUNCTION IF EXISTS notify_table_change() CASCADE;`);
};
