use tauri_plugin_sql::{Migration, MigrationKind};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    env_logger::init();
    log::info!("Starting Airavoto Gaming POS...");

    let migrations = vec![
        Migration {
            version: 1,
            description: "create_users_table",
            sql: r#"
                CREATE TABLE IF NOT EXISTS users (
                    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
                    username TEXT UNIQUE,
                    password_hash TEXT,
                    role TEXT,
                    onboarding_completed INTEGER DEFAULT 0,
                    profile_image_url TEXT,
                    created_at TEXT DEFAULT (datetime('now')),
                    updated_at TEXT DEFAULT (datetime('now'))
                )
            "#,
            kind: MigrationKind::Up,
        },
        Migration {
            version: 2,
            description: "create_session_groups_table",
            sql: r#"
                CREATE TABLE IF NOT EXISTS session_groups (
                    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
                    group_code TEXT UNIQUE,
                    group_name TEXT NOT NULL,
                    category TEXT NOT NULL,
                    booking_type TEXT NOT NULL,
                    created_at TEXT DEFAULT (datetime('now'))
                )
            "#,
            kind: MigrationKind::Up,
        },
        Migration {
            version: 3,
            description: "create_bookings_table",
            sql: r#"
                CREATE TABLE IF NOT EXISTS bookings (
                    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
                    booking_code TEXT UNIQUE,
                    group_id TEXT,
                    group_code TEXT,
                    category TEXT NOT NULL,
                    seat_number INTEGER NOT NULL,
                    seat_name TEXT NOT NULL,
                    customer_name TEXT NOT NULL,
                    whatsapp_number TEXT,
                    start_time TEXT NOT NULL,
                    end_time TEXT NOT NULL,
                    price TEXT NOT NULL,
                    status TEXT NOT NULL,
                    booking_type TEXT NOT NULL,
                    paused_remaining_time INTEGER,
                    person_count INTEGER NOT NULL DEFAULT 1,
                    payment_method TEXT,
                    cash_amount TEXT,
                    upi_amount TEXT,
                    payment_status TEXT NOT NULL DEFAULT 'unpaid',
                    last_payment_action TEXT,
                    food_orders TEXT DEFAULT '[]',
                    original_price TEXT,
                    discount_applied TEXT,
                    bonus_hours_applied TEXT,
                    promotion_details TEXT,
                    is_promotional_discount INTEGER DEFAULT 0,
                    is_promotional_bonus INTEGER DEFAULT 0,
                    manual_discount_percentage INTEGER,
                    manual_free_hours TEXT,
                    discount TEXT,
                    bonus TEXT,
                    created_at TEXT DEFAULT (datetime('now'))
                )
            "#,
            kind: MigrationKind::Up,
        },
        Migration {
            version: 4,
            description: "create_booking_history_table",
            sql: r#"
                CREATE TABLE IF NOT EXISTS booking_history (
                    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
                    booking_id TEXT NOT NULL,
                    booking_code TEXT,
                    group_id TEXT,
                    group_code TEXT,
                    category TEXT NOT NULL,
                    seat_number INTEGER NOT NULL,
                    seat_name TEXT NOT NULL,
                    customer_name TEXT NOT NULL,
                    whatsapp_number TEXT,
                    start_time TEXT NOT NULL,
                    end_time TEXT NOT NULL,
                    price TEXT NOT NULL,
                    status TEXT NOT NULL,
                    booking_type TEXT NOT NULL,
                    paused_remaining_time INTEGER,
                    person_count INTEGER NOT NULL DEFAULT 1,
                    payment_method TEXT,
                    cash_amount TEXT,
                    upi_amount TEXT,
                    payment_status TEXT NOT NULL DEFAULT 'unpaid',
                    last_payment_action TEXT,
                    food_orders TEXT DEFAULT '[]',
                    original_price TEXT,
                    discount_applied TEXT,
                    bonus_hours_applied TEXT,
                    promotion_details TEXT,
                    is_promotional_discount INTEGER DEFAULT 0,
                    is_promotional_bonus INTEGER DEFAULT 0,
                    manual_discount_percentage INTEGER,
                    manual_free_hours TEXT,
                    discount TEXT,
                    bonus TEXT,
                    created_at TEXT NOT NULL,
                    archived_at TEXT DEFAULT (datetime('now'))
                )
            "#,
            kind: MigrationKind::Up,
        },
        Migration {
            version: 5,
            description: "create_food_items_table",
            sql: r#"
                CREATE TABLE IF NOT EXISTS food_items (
                    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
                    name TEXT NOT NULL,
                    price TEXT NOT NULL,
                    cost_price TEXT,
                    current_stock INTEGER NOT NULL DEFAULT 0,
                    min_stock_level INTEGER NOT NULL DEFAULT 10,
                    in_inventory INTEGER NOT NULL DEFAULT 0,
                    category TEXT NOT NULL DEFAULT 'trackable',
                    supplier TEXT,
                    expiry_date TEXT
                )
            "#,
            kind: MigrationKind::Up,
        },
        Migration {
            version: 6,
            description: "create_stock_batches_table",
            sql: r#"
                CREATE TABLE IF NOT EXISTS stock_batches (
                    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
                    food_item_id TEXT NOT NULL,
                    quantity INTEGER NOT NULL,
                    cost_price TEXT NOT NULL,
                    supplier TEXT,
                    purchase_date TEXT DEFAULT (datetime('now')),
                    expiry_date TEXT,
                    notes TEXT,
                    created_at TEXT DEFAULT (datetime('now'))
                )
            "#,
            kind: MigrationKind::Up,
        },
        Migration {
            version: 7,
            description: "create_device_configs_table",
            sql: r#"
                CREATE TABLE IF NOT EXISTS device_configs (
                    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
                    category TEXT NOT NULL UNIQUE,
                    count INTEGER NOT NULL DEFAULT 0,
                    seats TEXT NOT NULL DEFAULT '[]'
                )
            "#,
            kind: MigrationKind::Up,
        },
        Migration {
            version: 8,
            description: "create_pricing_configs_table",
            sql: r#"
                CREATE TABLE IF NOT EXISTS pricing_configs (
                    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
                    category TEXT NOT NULL,
                    duration TEXT NOT NULL,
                    price TEXT NOT NULL,
                    person_count INTEGER NOT NULL DEFAULT 1
                )
            "#,
            kind: MigrationKind::Up,
        },
        Migration {
            version: 9,
            description: "create_happy_hours_configs_table",
            sql: r#"
                CREATE TABLE IF NOT EXISTS happy_hours_configs (
                    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
                    category TEXT NOT NULL,
                    start_time TEXT NOT NULL,
                    end_time TEXT NOT NULL,
                    enabled INTEGER NOT NULL DEFAULT 1
                )
            "#,
            kind: MigrationKind::Up,
        },
        Migration {
            version: 10,
            description: "create_happy_hours_pricing_table",
            sql: r#"
                CREATE TABLE IF NOT EXISTS happy_hours_pricing (
                    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
                    category TEXT NOT NULL,
                    duration TEXT NOT NULL,
                    price TEXT NOT NULL,
                    person_count INTEGER NOT NULL DEFAULT 1
                )
            "#,
            kind: MigrationKind::Up,
        },
        Migration {
            version: 11,
            description: "create_expenses_table",
            sql: r#"
                CREATE TABLE IF NOT EXISTS expenses (
                    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
                    category TEXT NOT NULL,
                    description TEXT NOT NULL,
                    amount TEXT NOT NULL,
                    date TEXT NOT NULL,
                    created_at TEXT DEFAULT (datetime('now'))
                )
            "#,
            kind: MigrationKind::Up,
        },
        Migration {
            version: 12,
            description: "create_activity_logs_table",
            sql: r#"
                CREATE TABLE IF NOT EXISTS activity_logs (
                    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
                    user_id TEXT NOT NULL,
                    username TEXT NOT NULL,
                    user_role TEXT NOT NULL,
                    action TEXT NOT NULL,
                    entity_type TEXT,
                    entity_id TEXT,
                    details TEXT,
                    created_at TEXT DEFAULT (datetime('now'))
                )
            "#,
            kind: MigrationKind::Up,
        },
        Migration {
            version: 13,
            description: "create_notifications_table",
            sql: r#"
                CREATE TABLE IF NOT EXISTS notifications (
                    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
                    type TEXT NOT NULL,
                    title TEXT NOT NULL,
                    message TEXT NOT NULL,
                    entity_type TEXT,
                    entity_id TEXT,
                    activity_log_id TEXT,
                    is_read INTEGER NOT NULL DEFAULT 0,
                    created_at TEXT DEFAULT (datetime('now'))
                )
            "#,
            kind: MigrationKind::Up,
        },
        Migration {
            version: 14,
            description: "create_gaming_center_info_table",
            sql: r#"
                CREATE TABLE IF NOT EXISTS gaming_center_info (
                    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
                    name TEXT NOT NULL,
                    description TEXT NOT NULL,
                    address TEXT NOT NULL,
                    phone TEXT NOT NULL,
                    email TEXT,
                    hours TEXT NOT NULL,
                    timezone TEXT NOT NULL DEFAULT 'Asia/Kolkata',
                    updated_at TEXT DEFAULT (datetime('now'))
                )
            "#,
            kind: MigrationKind::Up,
        },
        Migration {
            version: 15,
            description: "create_gallery_images_table",
            sql: r#"
                CREATE TABLE IF NOT EXISTS gallery_images (
                    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
                    title TEXT NOT NULL,
                    image_url TEXT NOT NULL,
                    description TEXT,
                    created_at TEXT DEFAULT (datetime('now'))
                )
            "#,
            kind: MigrationKind::Up,
        },
        Migration {
            version: 16,
            description: "create_facilities_table",
            sql: r#"
                CREATE TABLE IF NOT EXISTS facilities (
                    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
                    name TEXT NOT NULL,
                    description TEXT NOT NULL,
                    icon TEXT NOT NULL
                )
            "#,
            kind: MigrationKind::Up,
        },
        Migration {
            version: 17,
            description: "create_games_table",
            sql: r#"
                CREATE TABLE IF NOT EXISTS games (
                    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
                    name TEXT NOT NULL,
                    description TEXT,
                    image_url TEXT,
                    category TEXT NOT NULL
                )
            "#,
            kind: MigrationKind::Up,
        },
        Migration {
            version: 18,
            description: "create_device_maintenance_table",
            sql: r#"
                CREATE TABLE IF NOT EXISTS device_maintenance (
                    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
                    category TEXT NOT NULL,
                    seat_name TEXT NOT NULL,
                    last_maintenance_date TEXT,
                    total_usage_hours REAL NOT NULL DEFAULT 0,
                    total_sessions INTEGER NOT NULL DEFAULT 0,
                    issues_reported INTEGER NOT NULL DEFAULT 0,
                    maintenance_notes TEXT,
                    status TEXT NOT NULL DEFAULT 'healthy',
                    created_at TEXT DEFAULT (datetime('now')),
                    updated_at TEXT DEFAULT (datetime('now'))
                )
            "#,
            kind: MigrationKind::Up,
        },
        Migration {
            version: 19,
            description: "create_staff_visibility_settings_table",
            sql: r#"
                CREATE TABLE IF NOT EXISTS staff_visibility_settings (
                    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
                    pages TEXT NOT NULL DEFAULT '{}',
                    dashboard TEXT NOT NULL DEFAULT '{}',
                    updated_at TEXT DEFAULT (datetime('now'))
                )
            "#,
            kind: MigrationKind::Up,
        },
        Migration {
            version: 20,
            description: "create_app_settings_table",
            sql: r#"
                CREATE TABLE IF NOT EXISTS app_settings (
                    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
                    theme TEXT NOT NULL DEFAULT 'system',
                    language TEXT NOT NULL DEFAULT 'en',
                    notifications TEXT NOT NULL DEFAULT '{}',
                    updated_at TEXT DEFAULT (datetime('now'))
                )
            "#,
            kind: MigrationKind::Up,
        },
        Migration {
            version: 21,
            description: "create_indexes",
            sql: r#"
                CREATE INDEX IF NOT EXISTS idx_bookings_category ON bookings(category);
                CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
                CREATE INDEX IF NOT EXISTS idx_bookings_start_time ON bookings(start_time);
                CREATE INDEX IF NOT EXISTS idx_booking_history_booking_id ON booking_history(booking_id);
                CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
                CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at);
                CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
                CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
            "#,
            kind: MigrationKind::Up,
        },
        Migration {
            version: 22,
            description: "insert_default_admin",
            sql: r#"
                INSERT OR IGNORE INTO users (id, username, password_hash, role, onboarding_completed)
                VALUES (
                    'default-admin-id',
                    'admin',
                    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/9.5C5RdFi',
                    'admin',
                    0
                )
            "#,
            kind: MigrationKind::Up,
        },
    ];

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations("sqlite:airavoto_pos.db", migrations)
                .build()
        )
        .run(tauri::generate_context!())
        .expect("error while running Tauri application");
}
