/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const up = (pgm) => {
    // ---- Extensions ----
    pgm.createExtension('ltree', { ifNotExists: true });

    // ---- Table ----
    pgm.createTable('rtdb_nodes', {
        path: {
            type: 'text',
            primaryKey: true,
            notNull: true,
        },

        parent_path: {
            type: 'text',
            notNull: false,
        },

        key: {
            type: 'text',
            notNull: true,
        },

        value: {
            type: 'jsonb',
            notNull: true,
        },

        version: {
            type: 'bigint',
            notNull: true,
            default: 1,
        },

        updated_at: {
            type: 'timestamptz',
            notNull: true,
            default: pgm.func('now()'),
        },

        // Generated ltree column for fast subtree queries
        path_ltree: {
            type: 'ltree',
            generated: {
                as: "replace(path, '/', '.')::ltree",
                stored: true,
            },
        },
    });

    // ---- Indexes ----

    // Fast exact + prefix lookups (LIKE 'a/b/%')
    pgm.createIndex('rtdb_nodes', 'parent_path', {
        name: 'rtdb_nodes_parent_idx',
    });

    pgm.createIndex('rtdb_nodes', 'value', {
        name: 'rtdb_nodes_value_gin_idx',
        method: 'gin',
    });

    pgm.createIndex('rtdb_nodes', 'path_ltree', {
        name: 'rtdb_nodes_ltree_idx',
        method: 'gist',
    });

    // ✅ PREFIX INDEX (RAW SQL – avoids TS error)
    pgm.sql(`
        CREATE INDEX rtdb_nodes_path_prefix_idx
        ON rtdb_nodes (path text_pattern_ops)
    `);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
    pgm.sql(`DROP INDEX IF EXISTS rtdb_nodes_path_prefix_idx`);
    pgm.dropTable('rtdb_nodes', { ifExists: true });
    pgm.dropExtension('ltree', { ifExists: true });
};
