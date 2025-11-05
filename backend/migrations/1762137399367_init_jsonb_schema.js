/**
 * @file 1762137399367_init_jsonb_schema.js
 * Adds JSONB Firestore-like tables alongside Better-Auth.
 */

export const shorthands = undefined;

export const up = async (pgm) => {
    // enable UUID extension for gen_random_uuid()
    await pgm.sql(`CREATE EXTENSION IF NOT EXISTS "pgcrypto";`);

    // Trigger function to update updated_at
    await pgm.sql(`
    CREATE OR REPLACE FUNCTION set_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = now();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `);

    const createJsonTable = async (name) => {
        pgm.createTable(name, {
            id: {
                type: 'text',
                primaryKey: true,
                default: pgm.func('gen_random_uuid()'),
            },
            data: {
                type: 'jsonb',
                notNull: true,
                default: '{}',
            },
            created_at: {
                type: 'timestamptz',
                notNull: true,
                default: pgm.func('now()'),
            },
            updated_at: {
                type: 'timestamptz',
                notNull: true,
                default: pgm.func('now()'),
            },
        });

        await pgm.sql(`
      CREATE TRIGGER ${name}_updated_at
      BEFORE UPDATE ON "${name}"
      FOR EACH ROW
      EXECUTE FUNCTION set_updated_at();
    `);
    };

    // Create the Firestore-style JSONB collections
    await createJsonTable('users');
    await createJsonTable('reviews');

    // Optional: indexes on JSONB ids
    pgm.createIndex('users', 'id');
    pgm.createIndex('reviews', 'id');
};

export const down = async (pgm) => {
    pgm.dropTable('users');
    pgm.dropTable('reviews');
    pgm.sql(`DROP FUNCTION IF EXISTS set_updated_at() CASCADE;`);
};
