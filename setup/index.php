<?php
require_once __DIR__ . '/../includes/functions.php';

$envPath = dirname(__DIR__) . '/.env';
$envExamplePath = dirname(__DIR__) . '/.env.example';
$schemaPath = dirname(__DIR__) . '/database/schema.sql';

// Status flags
$envExists = file_exists($envPath);
$schemaExists = file_exists($schemaPath);
$dbConnected = false;
$tablesExist = false;
$dbError = '';
$successMessage = '';
$errorMessage = '';

// Handle form submissions
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = isset($_POST['action']) ? $_POST['action'] : '';

    if ($action === 'save_env') {
        $envContent = "DB_HOST=" . trim($_POST['db_host']) . "\n";
        $envContent .= "DB_PORT=" . trim($_POST['db_port']) . "\n";
        $envContent .= "DB_NAME=" . trim($_POST['db_name']) . "\n";
        $envContent .= "DB_USER=" . trim($_POST['db_user']) . "\n";
        $envContent .= "DB_PASS=" . trim($_POST['db_pass']) . "\n";
        $envContent .= "DB_CHARSET=" . trim($_POST['db_charset']) . "\n";

        if (file_put_contents($envPath, $envContent)) {
            $successMessage = 'Database configuration saved successfully.';
            $envExists = true;
        } else {
            $errorMessage = 'Failed to save .env file. Check file permissions.';
        }
    }

    if ($action === 'create_tables') {
        try {
            require_once dirname(__DIR__) . '/api/config/database.php';
            $pdo = Database::getInstance()->getConnection();
            $sql = file_get_contents($schemaPath);

            // Split by semicolon and execute each statement
            $statements = array_filter(array_map('trim', explode(';', $sql)));
            foreach ($statements as $statement) {
                if (!empty($statement) && stripos($statement, 'CREATE TABLE') !== false) {
                    $pdo->exec($statement);
                }
            }
            $successMessage = 'Database tables created successfully.';
        } catch (Exception $e) {
            $errorMessage = 'Failed to create tables: ' . $e->getMessage();
        }
    }

    if ($action === 'test_connection') {
        // Test will happen below
    }
}

// Load current env values
$envValues = array(
    'DB_HOST' => 'localhost',
    'DB_PORT' => '3306',
    'DB_NAME' => '',
    'DB_USER' => '',
    'DB_PASS' => '',
    'DB_CHARSET' => 'utf8mb4'
);

if ($envExists) {
    $lines = file($envPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) continue;
        if (strpos($line, '=') !== false) {
            list($key, $value) = explode('=', $line, 2);
            $envValues[trim($key)] = trim($value);
        }
    }
}

// Test database connection
if ($envExists) {
    try {
        require_once dirname(__DIR__) . '/api/config/database.php';
        $pdo = Database::getInstance()->getConnection();
        $dbConnected = true;

        // Check if tables exist
        $stmt = $pdo->query("SHOW TABLES LIKE 'graph_builder_%'");
        $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
        $tablesExist = count($tables) >= 2;
    } catch (Exception $e) {
        $dbError = $e->getMessage();
    }
}

// Load graph builder config
$gbConfig = include dirname(__DIR__) . '/api/config/graph_builder.php';
?>
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Graph Builder - Setup</title>
    <?php favicon(); ?>
    <link rel="stylesheet" href="<?= asset('graph-creator.css') ?>">
    <link rel="stylesheet" href="<?= asset('main.css') ?>">
    <style>
        .setup-container {
            max-width: 900px;
            margin: 0 auto;
            padding: var(--gb-spacing-xl);
        }

        .setup-card {
            background: var(--gb-bg-secondary);
            border: 1px solid var(--gb-border-color);
            border-radius: var(--gb-radius-lg);
            padding: var(--gb-spacing-xl);
            margin-bottom: var(--gb-spacing-xl);
        }

        .setup-card h2 {
            margin: 0 0 var(--gb-spacing-md) 0;
            font-size: 1.25rem;
            display: flex;
            align-items: center;
            gap: var(--gb-spacing-sm);
        }

        .setup-card h2 .status-icon {
            width: 24px;
            height: 24px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .setup-card h2 .status-icon.success {
            background: #10b981;
            color: white;
        }

        .setup-card h2 .status-icon.error {
            background: #ef4444;
            color: white;
        }

        .setup-card h2 .status-icon.pending {
            background: #f59e0b;
            color: white;
        }

        .setup-card p {
            color: var(--gb-text-secondary);
            margin-bottom: var(--gb-spacing-md);
        }

        .form-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: var(--gb-spacing-md);
        }

        .form-group {
            display: flex;
            flex-direction: column;
            gap: var(--gb-spacing-xs);
        }

        .form-group.full-width {
            grid-column: span 2;
        }

        .form-group label {
            font-weight: 500;
            font-size: var(--gb-font-size-sm);
        }

        .form-group input {
            padding: var(--gb-spacing-sm) var(--gb-spacing-md);
            border: 1px solid var(--gb-border-color);
            border-radius: var(--gb-radius-md);
            background: var(--gb-bg-primary);
            color: var(--gb-text-primary);
            font-size: var(--gb-font-size-base);
        }

        .form-group input:focus {
            outline: none;
            border-color: var(--gb-primary);
            box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
        }

        .form-actions {
            display: flex;
            gap: var(--gb-spacing-md);
            margin-top: var(--gb-spacing-lg);
        }

        .btn {
            padding: var(--gb-spacing-sm) var(--gb-spacing-lg);
            border: none;
            border-radius: var(--gb-radius-md);
            font-weight: 500;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            gap: var(--gb-spacing-sm);
            font-size: var(--gb-font-size-sm);
            transition: all 0.2s;
        }

        .btn-primary {
            background: var(--gb-primary);
            color: white;
        }

        .btn-primary:hover {
            background: var(--gb-primary-hover);
        }

        .btn-secondary {
            background: var(--gb-bg-tertiary);
            color: var(--gb-text-primary);
            border: 1px solid var(--gb-border-color);
        }

        .btn-secondary:hover {
            background: var(--gb-bg-hover);
        }

        .alert {
            padding: var(--gb-spacing-md);
            border-radius: var(--gb-radius-md);
            margin-bottom: var(--gb-spacing-lg);
        }

        .alert-success {
            background: rgba(16, 185, 129, 0.1);
            border: 1px solid #10b981;
            color: #10b981;
        }

        .alert-error {
            background: rgba(239, 68, 68, 0.1);
            border: 1px solid #ef4444;
            color: #ef4444;
        }

        .config-table {
            width: 100%;
            border-collapse: collapse;
        }

        .config-table th,
        .config-table td {
            padding: var(--gb-spacing-sm) var(--gb-spacing-md);
            text-align: left;
            border-bottom: 1px solid var(--gb-border-color);
        }

        .config-table th {
            font-weight: 500;
            color: var(--gb-text-secondary);
            font-size: var(--gb-font-size-sm);
        }

        .config-table code {
            background: var(--gb-bg-tertiary);
            padding: 2px 6px;
            border-radius: 4px;
            font-size: var(--gb-font-size-sm);
        }

        .step-number {
            width: 28px;
            height: 28px;
            background: var(--gb-primary);
            color: white;
            border-radius: 50%;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-weight: 600;
            font-size: var(--gb-font-size-sm);
            margin-right: var(--gb-spacing-sm);
        }

        .checklist {
            list-style: none;
            padding: 0;
            margin: 0;
        }

        .checklist li {
            display: flex;
            align-items: center;
            gap: var(--gb-spacing-sm);
            padding: var(--gb-spacing-sm) 0;
            border-bottom: 1px solid var(--gb-border-color-light);
        }

        .checklist li:last-child {
            border-bottom: none;
        }

        .check-icon {
            width: 20px;
            height: 20px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .check-icon.done {
            background: #10b981;
            color: white;
        }

        .check-icon.pending {
            background: var(--gb-bg-tertiary);
            border: 2px solid var(--gb-border-color);
        }

        @media (max-width: 600px) {
            .form-grid {
                grid-template-columns: 1fr;
            }

            .form-group.full-width {
                grid-column: span 1;
            }
        }
    </style>
</head>

<body>
    <div class="docs-page">
        <!-- Header -->
        <header class="usage-header">
            <div class="usage-header-content">
                <h1 class="usage-title">Graph Builder</h1>
                <p class="usage-subtitle">Setup & Configuration</p>
            </div>
            <div class="usage-header-actions">
                <div id="theme-switcher"></div>
                <a href="<?= get_base_path() ?>/" class="usage-back-link">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
                        <path d="M19 12H5M12 19l-7-7 7-7" />
                    </svg>
                    Back to Builder
                </a>
            </div>
        </header>

        <div class="setup-container">
            <?php if ($successMessage): ?>
                <div class="alert alert-success"><?= htmlspecialchars($successMessage) ?></div>
            <?php endif; ?>

            <?php if ($errorMessage): ?>
                <div class="alert alert-error"><?= htmlspecialchars($errorMessage) ?></div>
            <?php endif; ?>

            <!-- Status Overview -->
            <div class="setup-card">
                <h2>
                    <span class="step-number">1</span>
                    Setup Status
                </h2>
                <ul class="checklist">
                    <li>
                        <span class="check-icon <?= $envExists ? 'done' : 'pending' ?>">
                            <?php if ($envExists): ?>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                                    <path d="M20 6L9 17l-5-5" />
                                </svg>
                            <?php endif; ?>
                        </span>
                        Environment file (.env) <?= $envExists ? 'exists' : 'not found' ?>
                    </li>
                    <li>
                        <span class="check-icon <?= $dbConnected ? 'done' : 'pending' ?>">
                            <?php if ($dbConnected): ?>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                                    <path d="M20 6L9 17l-5-5" />
                                </svg>
                            <?php endif; ?>
                        </span>
                        Database connection <?= $dbConnected ? 'successful' : 'not established' ?>
                        <?php if ($dbError): ?>
                            <span style="color: #ef4444; font-size: 0.85em;"> - <?= htmlspecialchars($dbError) ?></span>
                        <?php endif; ?>
                    </li>
                    <li>
                        <span class="check-icon <?= $tablesExist ? 'done' : 'pending' ?>">
                            <?php if ($tablesExist): ?>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                                    <path d="M20 6L9 17l-5-5" />
                                </svg>
                            <?php endif; ?>
                        </span>
                        Database tables <?= $tablesExist ? 'created' : 'not found' ?>
                    </li>
                </ul>
            </div>

            <!-- Database Configuration -->
            <div class="setup-card">
                <h2>
                    <span class="step-number">2</span>
                    Database Configuration
                </h2>
                <p>Configure your MySQL database connection settings.</p>

                <form method="POST">
                    <input type="hidden" name="action" value="save_env">
                    <div class="form-grid">
                        <div class="form-group">
                            <label for="db_host">Database Host</label>
                            <input type="text" id="db_host" name="db_host" value="<?= htmlspecialchars($envValues['DB_HOST']) ?>" placeholder="localhost">
                        </div>
                        <div class="form-group">
                            <label for="db_port">Port</label>
                            <input type="text" id="db_port" name="db_port" value="<?= htmlspecialchars($envValues['DB_PORT']) ?>" placeholder="3306">
                        </div>
                        <div class="form-group">
                            <label for="db_name">Database Name</label>
                            <input type="text" id="db_name" name="db_name" value="<?= htmlspecialchars($envValues['DB_NAME']) ?>" placeholder="your_database">
                        </div>
                        <div class="form-group">
                            <label for="db_charset">Charset</label>
                            <input type="text" id="db_charset" name="db_charset" value="<?= htmlspecialchars($envValues['DB_CHARSET']) ?>" placeholder="utf8mb4">
                        </div>
                        <div class="form-group">
                            <label for="db_user">Username</label>
                            <input type="text" id="db_user" name="db_user" value="<?= htmlspecialchars($envValues['DB_USER']) ?>" placeholder="root">
                        </div>
                        <div class="form-group">
                            <label for="db_pass">Password</label>
                            <input type="password" id="db_pass" name="db_pass" value="<?= htmlspecialchars($envValues['DB_PASS']) ?>" placeholder="********">
                        </div>
                    </div>
                    <div class="form-actions">
                        <button type="submit" class="btn btn-primary">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                                <polyline points="17 21 17 13 7 13 7 21" />
                                <polyline points="7 3 7 8 15 8" />
                            </svg>
                            Save Configuration
                        </button>
                    </div>
                </form>
            </div>

            <!-- Create Tables -->
            <div class="setup-card">
                <h2>
                    <span class="step-number">3</span>
                    Database Tables
                </h2>
                <p>Create the required database tables for Graph Builder.</p>

                <?php if (!$dbConnected): ?>
                    <p style="color: #f59e0b;">Please configure and test database connection first.</p>
                <?php elseif ($tablesExist): ?>
                    <p style="color: #10b981;">Tables already exist. You're all set!</p>
                <?php else: ?>
                    <form method="POST">
                        <input type="hidden" name="action" value="create_tables">
                        <button type="submit" class="btn btn-primary">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                <line x1="3" y1="9" x2="21" y2="9" />
                                <line x1="9" y1="21" x2="9" y2="9" />
                            </svg>
                            Create Tables
                        </button>
                    </form>
                <?php endif; ?>

                <h3 style="margin-top: var(--gb-spacing-lg); font-size: 1rem;">Table Schema</h3>
                <table class="config-table">
                    <thead>
                        <tr>
                            <th>Table</th>
                            <th>Purpose</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><code>graph_builder_configs</code></td>
                            <td>Stores graph configurations (name, type, settings, mapping)</td>
                        </tr>
                        <tr>
                            <td><code>graph_builder_data_sources</code></td>
                            <td>Stores data source definitions (SQL, API, Callback, Static)</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <!-- Application Settings -->
            <div class="setup-card">
                <h2>
                    <span class="step-number">4</span>
                    Application Settings
                </h2>
                <p>Current settings from <code>api/config/graph_builder.php</code></p>

                <h3 style="margin-top: var(--gb-spacing-lg); font-size: 1rem;">Security - Allowed Callback Namespaces</h3>
                <table class="config-table">
                    <thead>
                        <tr>
                            <th>Namespace</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($gbConfig['security']['allowed_callback_namespaces'] as $ns): ?>
                            <tr>
                                <td><code><?= htmlspecialchars($ns) ?></code></td>
                            </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>

                <h3 style="margin-top: var(--gb-spacing-lg); font-size: 1rem;">Cache Settings</h3>
                <table class="config-table">
                    <thead>
                        <tr>
                            <th>Setting</th>
                            <th>Value</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>Enabled</td>
                            <td><code><?= $gbConfig['cache']['enabled'] ? 'true' : 'false' ?></code></td>
                        </tr>
                        <tr>
                            <td>Path</td>
                            <td><code><?= htmlspecialchars($gbConfig['cache']['path']) ?></code></td>
                        </tr>
                        <tr>
                            <td>Default TTL</td>
                            <td><code><?= $gbConfig['cache']['default_ttl'] ?></code> seconds</td>
                        </tr>
                    </tbody>
                </table>

                <p style="margin-top: var(--gb-spacing-md); color: var(--gb-text-secondary); font-size: var(--gb-font-size-sm);">
                    To modify these settings, edit <code>api/config/graph_builder.php</code> directly.
                </p>
            </div>

            <!-- Quick Links -->
            <div class="setup-card">
                <h2>Quick Links</h2>
                <div class="form-actions" style="margin-top: 0; flex-wrap: wrap;">
                    <a href="<?= get_base_path() ?>/" class="btn btn-primary">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                            <line x1="3" y1="9" x2="21" y2="9" />
                            <line x1="9" y1="21" x2="9" y2="9" />
                        </svg>
                        Graph Builder
                    </a>
                    <a href="<?= get_base_path() ?>/graphs/" class="btn btn-secondary">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="20" x2="18" y2="10" />
                            <line x1="12" y1="20" x2="12" y2="4" />
                            <line x1="6" y1="20" x2="6" y2="14" />
                        </svg>
                        Saved Graphs
                    </a>
                    <a href="<?= get_base_path() ?>/docs/" class="btn btn-secondary">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                            <line x1="16" y1="13" x2="8" y2="13" />
                            <line x1="16" y1="17" x2="8" y2="17" />
                        </svg>
                        Documentation
                    </a>
                    <a href="<?= get_base_path() ?>/usage/" class="btn btn-secondary">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="16 18 22 12 16 6" />
                            <polyline points="8 6 2 12 8 18" />
                        </svg>
                        Usage Examples
                    </a>
                </div>
            </div>
        </div>

        <!-- Footer -->
        <footer class="usage-footer">
            <p>&copy; <?= date('Y') ?> Graph Builder</p>
        </footer>
    </div>

    <script>
        // Theme Switcher
        const THEME_KEY = 'graphBuilder_theme';

        function createThemeSwitcher() {
            const container = document.getElementById('theme-switcher');
            if (!container) return;

            const wrapper = document.createElement('div');
            wrapper.className = 'gb-theme-switcher';

            const options = [{
                    value: 'light',
                    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>',
                    title: 'Light'
                },
                {
                    value: 'dark',
                    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>',
                    title: 'Dark'
                },
                {
                    value: 'system',
                    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>',
                    title: 'System'
                }
            ];

            options.forEach(opt => {
                const btn = document.createElement('button');
                btn.className = 'gb-theme-btn';
                btn.dataset.theme = opt.value;
                btn.title = opt.title;
                btn.innerHTML = opt.icon;
                btn.addEventListener('click', () => setTheme(opt.value));
                wrapper.appendChild(btn);
            });

            container.appendChild(wrapper);
        }

        function getStoredTheme() {
            try {
                return localStorage.getItem(THEME_KEY) || 'system';
            } catch (e) {
                return 'system';
            }
        }

        function setTheme(theme) {
            try {
                localStorage.setItem(THEME_KEY, theme);
            } catch (e) {}
            applyTheme(theme);
            updateThemeButtons(theme);
        }

        function applyTheme(theme) {
            let isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
            document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
        }

        function updateThemeButtons(theme) {
            document.querySelectorAll('.gb-theme-btn').forEach(btn => {
                btn.classList.toggle('gb-theme-btn--active', btn.dataset.theme === theme);
            });
        }

        // Initialize
        document.addEventListener('DOMContentLoaded', function() {
            createThemeSwitcher();
            const storedTheme = getStoredTheme();
            applyTheme(storedTheme);
            updateThemeButtons(storedTheme);

            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
                if (getStoredTheme() === 'system') applyTheme('system');
            });
        });
    </script>
</body>

</html>
