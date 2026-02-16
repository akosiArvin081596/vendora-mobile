/**
 * Initial SQLite schema for offline-first support.
 * All monetary values are stored as integer cents (matching backend).
 */
export const migration_001_initial = {
  version: 1,
  up: (db) => {
    db.execSync(`
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER,
        local_id TEXT NOT NULL PRIMARY KEY,
        user_id INTEGER,
        category_id INTEGER,
        name TEXT NOT NULL,
        sku TEXT,
        barcode TEXT,
        price INTEGER NOT NULL DEFAULT 0,
        cost INTEGER NOT NULL DEFAULT 0,
        stock INTEGER NOT NULL DEFAULT 0,
        low_stock_threshold INTEGER DEFAULT 10,
        reorder_point INTEGER DEFAULT 5,
        image TEXT,
        description TEXT,
        is_active INTEGER NOT NULL DEFAULT 1,
        is_ecommerce INTEGER NOT NULL DEFAULT 0,
        sync_status TEXT NOT NULL DEFAULT 'synced',
        server_updated_at TEXT,
        created_at TEXT,
        updated_at TEXT
      );

      CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
      CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
      CREATE INDEX IF NOT EXISTS idx_products_sync ON products(sync_status);
      CREATE UNIQUE INDEX IF NOT EXISTS idx_products_server_id ON products(id) WHERE id IS NOT NULL;

      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER,
        local_id TEXT NOT NULL PRIMARY KEY,
        name TEXT NOT NULL,
        slug TEXT,
        description TEXT,
        icon TEXT,
        is_active INTEGER NOT NULL DEFAULT 1,
        sync_status TEXT NOT NULL DEFAULT 'synced',
        server_updated_at TEXT,
        created_at TEXT,
        updated_at TEXT
      );

      CREATE UNIQUE INDEX IF NOT EXISTS idx_categories_server_id ON categories(id) WHERE id IS NOT NULL;

      CREATE TABLE IF NOT EXISTS customers (
        id INTEGER,
        local_id TEXT NOT NULL PRIMARY KEY,
        user_id INTEGER,
        name TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        address TEXT,
        notes TEXT,
        status TEXT NOT NULL DEFAULT 'active',
        sync_status TEXT NOT NULL DEFAULT 'synced',
        server_updated_at TEXT,
        created_at TEXT,
        updated_at TEXT
      );

      CREATE UNIQUE INDEX IF NOT EXISTS idx_customers_server_id ON customers(id) WHERE id IS NOT NULL;

      CREATE TABLE IF NOT EXISTS orders (
        id INTEGER,
        local_id TEXT NOT NULL PRIMARY KEY,
        user_id INTEGER,
        customer_id INTEGER,
        customer_local_id TEXT,
        store_id INTEGER,
        order_number TEXT,
        ordered_at TEXT,
        status TEXT NOT NULL DEFAULT 'pending',
        subtotal INTEGER NOT NULL DEFAULT 0,
        tax INTEGER NOT NULL DEFAULT 0,
        discount INTEGER NOT NULL DEFAULT 0,
        total INTEGER NOT NULL DEFAULT 0,
        notes TEXT,
        channel TEXT DEFAULT 'pos',
        sync_status TEXT NOT NULL DEFAULT 'pending',
        server_updated_at TEXT,
        created_at TEXT,
        updated_at TEXT
      );

      CREATE INDEX IF NOT EXISTS idx_orders_sync ON orders(sync_status);
      CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_server_id ON orders(id) WHERE id IS NOT NULL;

      CREATE TABLE IF NOT EXISTS order_items (
        local_id TEXT NOT NULL PRIMARY KEY,
        order_local_id TEXT NOT NULL,
        product_id INTEGER,
        product_local_id TEXT,
        product_name TEXT,
        quantity INTEGER NOT NULL,
        unit_price INTEGER NOT NULL,
        unit_cost INTEGER NOT NULL DEFAULT 0,
        line_total INTEGER NOT NULL,
        FOREIGN KEY (order_local_id) REFERENCES orders(local_id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_oitems_order ON order_items(order_local_id);

      CREATE TABLE IF NOT EXISTS payments (
        id INTEGER,
        local_id TEXT NOT NULL PRIMARY KEY,
        order_id INTEGER,
        order_local_id TEXT NOT NULL,
        amount INTEGER NOT NULL,
        method TEXT NOT NULL DEFAULT 'cash',
        status TEXT NOT NULL DEFAULT 'completed',
        reference_number TEXT,
        sync_status TEXT NOT NULL DEFAULT 'pending',
        server_updated_at TEXT,
        created_at TEXT,
        updated_at TEXT,
        FOREIGN KEY (order_local_id) REFERENCES orders(local_id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_payments_order ON payments(order_local_id);

      CREATE TABLE IF NOT EXISTS inventory_adjustments (
        id INTEGER,
        local_id TEXT NOT NULL PRIMARY KEY,
        product_id INTEGER,
        product_local_id TEXT,
        user_id INTEGER,
        type TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        stock_before INTEGER NOT NULL,
        stock_after INTEGER NOT NULL,
        unit_cost INTEGER DEFAULT 0,
        reason TEXT,
        note TEXT,
        sync_status TEXT NOT NULL DEFAULT 'pending',
        server_updated_at TEXT,
        created_at TEXT,
        updated_at TEXT
      );

      CREATE TABLE IF NOT EXISTS sync_queue (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        idempotency_key TEXT NOT NULL UNIQUE,
        entity_type TEXT NOT NULL,
        entity_local_id TEXT NOT NULL,
        action TEXT NOT NULL,
        endpoint TEXT NOT NULL,
        method TEXT NOT NULL DEFAULT 'POST',
        payload TEXT NOT NULL DEFAULT '{}',
        depends_on TEXT,
        retry_count INTEGER NOT NULL DEFAULT 0,
        max_retries INTEGER NOT NULL DEFAULT 5,
        status TEXT NOT NULL DEFAULT 'pending',
        error_message TEXT,
        next_retry_at TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_sq_status_created ON sync_queue(status, created_at);
      CREATE INDEX IF NOT EXISTS idx_sq_depends ON sync_queue(depends_on);
      CREATE INDEX IF NOT EXISTS idx_sq_entity ON sync_queue(entity_type, entity_local_id);

      CREATE TABLE IF NOT EXISTS sync_meta (
        entity_type TEXT PRIMARY KEY,
        last_synced_at TEXT,
        last_server_timestamp TEXT,
        full_sync_completed INTEGER NOT NULL DEFAULT 0
      );
    `);
  },
};
