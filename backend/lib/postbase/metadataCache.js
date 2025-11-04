// Simple cache for table columns to validate fields and to build safe queries.

export class MetadataCache {
    constructor(pool) {
        this.pool = pool;
        this.cache = new Map(); // tableName -> { columns: Set([...]), pk: 'id' }
    }

    async loadTable(tableName) {
        if (this.cache.has(tableName)) return this.cache.get(tableName);
        const res = await this.pool.query(
            `SELECT column_name, ordinal_position
                FROM information_schema.columns
                WHERE table_schema = 'public' AND table_name = $1
                ORDER BY ordinal_position`,
            [tableName]
        );
        if (!res.rowCount) {
            throw new Error(`Table "${tableName}" not found`);
        }
        const cols = new Set(res.rows.map(r => r.column_name));
        // default PK is 'id' if present; otherwise first column
        const pk = cols.has('id') ? 'id' : res.rows[0].column_name;
        const meta = { columns: cols, pk };
        this.cache.set(tableName, meta);
        return meta;
    }

    invalidate(tableName) {
        this.cache.delete(tableName);
    }
}
