<?php
require_once __DIR__ . '/../includes/functions.php';
require_once __DIR__ . '/../api/config/database.php';
require_once __DIR__ . '/../classes/GraphConfig.php';

// Get filters from query params
$chartType = isset($_GET['chartType']) ? $_GET['chartType'] : '';
$search = isset($_GET['search']) ? $_GET['search'] : '';
$page = isset($_GET['page']) ? max(1, (int) $_GET['page']) : 1;
$limit = 12;
$offset = ($page - 1) * $limit;

try {
    $db = Database::getInstance();
    $pdo = $db->getConnection();

    $graphConfig = new GraphConfig($pdo);

    $options = array(
        'limit' => $limit,
        'offset' => $offset
    );

    if (!empty($chartType)) {
        $options['chartType'] = $chartType;
    }

    if (!empty($search)) {
        $options['search'] = $search;
    }

    $graphs = $graphConfig->listAll($options);
    $total = $graphConfig->count($options);
    $totalPages = ceil($total / $limit);

} catch (Exception $e) {
    $graphs = array();
    $total = 0;
    $totalPages = 0;
    $error = $e->getMessage();
}

// Chart type icons
function getChartIcon($type) {
    switch ($type) {
        case 'line':
            return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12l5-5 4 4 6-6 3 3"/><path d="M21 21H3V3"/></svg>';
        case 'bar':
            return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="10" width="4" height="10"/><rect x="10" y="5" width="4" height="15"/><rect x="17" y="8" width="4" height="12"/></svg>';
        case 'pie':
            return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a10 10 0 1 0 10 10H12V2z"/><path d="M12 2a10 10 0 0 1 10 10h-10V2z" fill="currentColor" opacity="0.3"/></svg>';
        default:
            return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>';
    }
}

// Source type labels
function getSourceLabel($type) {
    $labels = array(
        'sql' => 'SQL Query',
        'api' => 'API',
        'callback' => 'Callback',
        'static' => 'Static Data'
    );
    return isset($labels[$type]) ? $labels[$type] : $type;
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Saved Graphs - Graph Builder</title>
    <?php favicon(); ?>
    <link rel="stylesheet" href="<?= asset('graph-creator.css') ?>">
    <link rel="stylesheet" href="<?= asset('main.css') ?>">
    <script src="https://cdn.jsdelivr.net/npm/echarts@5/dist/echarts.min.js"></script>
</head>
<body>
    <div class="usage-page">
        <!-- Header -->
        <header class="usage-header">
            <div class="usage-header-content">
                <h1 class="usage-title">Saved Graphs</h1>
                <p class="usage-subtitle"><?= $total ?> graph<?= $total !== 1 ? 's' : '' ?> saved</p>
            </div>
            <div class="usage-header-actions">
                <div id="theme-switcher"></div>
                <a href="<?= get_base_path() ?>/docs/" class="usage-back-link">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
                        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                        <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/>
                    </svg>
                    Docs
                </a>
                <a href="<?= get_base_path() ?>/" class="usage-back-link">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
                        <path d="M19 12H5M12 19l-7-7 7-7"/>
                    </svg>
                    Back to Builder
                </a>
            </div>
        </header>

        <!-- Filters -->
        <section class="usage-section" style="padding-bottom: var(--gb-spacing-md);">
            <form class="graphs-filters" method="GET" action="">
                <div class="graphs-filter-group">
                    <label for="search">Search</label>
                    <input type="text" id="search" name="search" placeholder="Search by name..." value="<?= htmlspecialchars($search) ?>">
                </div>
                <div class="graphs-filter-group">
                    <label for="chartType">Chart Type</label>
                    <select id="chartType" name="chartType">
                        <option value="">All Types</option>
                        <option value="line" <?= $chartType === 'line' ? 'selected' : '' ?>>Line</option>
                        <option value="bar" <?= $chartType === 'bar' ? 'selected' : '' ?>>Bar</option>
                        <option value="pie" <?= $chartType === 'pie' ? 'selected' : '' ?>>Pie</option>
                    </select>
                </div>
                <button type="submit" class="graphs-filter-btn">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                        <circle cx="11" cy="11" r="8"/>
                        <path d="M21 21l-4.35-4.35"/>
                    </svg>
                    Filter
                </button>
                <?php if (!empty($search) || !empty($chartType)): ?>
                <a href="<?= get_base_path() ?>/graphs/" class="graphs-filter-clear">Clear</a>
                <?php endif; ?>
            </form>
        </section>

        <!-- Graphs List -->
        <section class="usage-section">
            <?php if (isset($error)): ?>
            <div class="graphs-error">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="24" height="24">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <p>Error loading graphs: <?= htmlspecialchars($error) ?></p>
            </div>
            <?php elseif (empty($graphs)): ?>
            <div class="graphs-empty">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="48" height="48">
                    <rect x="3" y="3" width="18" height="18" rx="2"/>
                    <path d="M3 9h18M9 21V9"/>
                </svg>
                <h3>No Graphs Found</h3>
                <p>Create your first graph in the builder and save it here.</p>
                <a href="<?= get_base_path() ?>/" class="usage-cta">
                    Create Graph
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
                        <path d="M12 5v14M5 12h14"/>
                    </svg>
                </a>
            </div>
            <?php else: ?>
            <div class="graphs-grid">
                <?php foreach ($graphs as $graph): ?>
                <div class="graph-card">
                    <div class="graph-card-header">
                        <div class="graph-card-type" data-type="<?= htmlspecialchars($graph['chart_type']) ?>">
                            <?= getChartIcon($graph['chart_type']) ?>
                        </div>
                        <div class="graph-card-info">
                            <h3 class="graph-card-title"><?= htmlspecialchars($graph['name']) ?></h3>
                            <span class="graph-card-slug"><?= htmlspecialchars($graph['slug']) ?></span>
                        </div>
                        <div class="graph-card-actions">
                            <a href="<?= get_base_path() ?>/graphs/view.php?id=<?= $graph['gbc_id'] ?>" class="graph-card-btn" title="Preview">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                    <circle cx="12" cy="12" r="3"/>
                                </svg>
                            </a>
                            <a href="<?= get_base_path() ?>/?edit=<?= $graph['gbc_id'] ?>" class="graph-card-btn" title="Edit in Builder">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                                    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                                </svg>
                            </a>
                            <button class="graph-card-btn graph-card-btn--delete" title="Delete" onclick="deleteGraph(<?= $graph['gbc_id'] ?>, '<?= htmlspecialchars(addslashes($graph['name'])) ?>')">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                                </svg>
                            </button>
                        </div>
                    </div>
                    <div class="graph-card-meta">
                        <span class="graph-card-meta-item">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                                <path d="M4 19.5A2.5 2.5 0 016.5 17H20"/>
                                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/>
                            </svg>
                            <?= ucfirst($graph['chart_type']) ?>
                        </span>
                        <span class="graph-card-meta-item">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                                <ellipse cx="12" cy="5" rx="9" ry="3"/>
                                <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/>
                                <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
                            </svg>
                            <?= getSourceLabel($graph['source_type']) ?>
                        </span>
                    </div>
                    <?php if (!empty($graph['description'])): ?>
                    <p class="graph-card-desc"><?= htmlspecialchars(substr($graph['description'], 0, 100)) ?><?= strlen($graph['description']) > 100 ? '...' : '' ?></p>
                    <?php endif; ?>
                </div>
                <?php endforeach; ?>
            </div>

            <!-- Pagination -->
            <?php if ($totalPages > 1): ?>
            <div class="graphs-pagination">
                <?php if ($page > 1): ?>
                <a href="?page=<?= $page - 1 ?><?= $chartType ? '&chartType=' . urlencode($chartType) : '' ?><?= $search ? '&search=' . urlencode($search) : '' ?>" class="graphs-page-btn">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                        <path d="M15 18l-6-6 6-6"/>
                    </svg>
                    Previous
                </a>
                <?php endif; ?>

                <span class="graphs-page-info">Page <?= $page ?> of <?= $totalPages ?></span>

                <?php if ($page < $totalPages): ?>
                <a href="?page=<?= $page + 1 ?><?= $chartType ? '&chartType=' . urlencode($chartType) : '' ?><?= $search ? '&search=' . urlencode($search) : '' ?>" class="graphs-page-btn">
                    Next
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                        <path d="M9 18l6-6-6-6"/>
                    </svg>
                </a>
                <?php endif; ?>
            </div>
            <?php endif; ?>
            <?php endif; ?>
        </section>
    </div>

    <script>
        // Theme Switcher
        const THEME_KEY = 'graphBuilder_theme';

        function createThemeSwitcher() {
            const container = document.getElementById('theme-switcher');
            if (!container) return;

            const wrapper = document.createElement('div');
            wrapper.className = 'gb-theme-switcher';

            const options = [
                { value: 'light', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>', title: 'Light' },
                { value: 'dark', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>', title: 'Dark' },
                { value: 'system', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>', title: 'System' }
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
            let isDark = false;
            if (theme === 'dark') {
                isDark = true;
            } else if (theme === 'system') {
                isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            }
            document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
        }

        function updateThemeButtons(theme) {
            document.querySelectorAll('.gb-theme-btn').forEach(btn => {
                btn.classList.toggle('gb-theme-btn--active', btn.dataset.theme === theme);
            });
        }

        // Delete graph
        function deleteGraph(id, name) {
            if (!confirm('Are you sure you want to delete "' + name + '"?')) {
                return;
            }

            fetch('<?= get_base_path() ?>/api/graphs/delete.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: id })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    window.location.reload();
                } else {
                    alert('Error deleting graph: ' + (data.error || 'Unknown error'));
                }
            })
            .catch(err => {
                alert('Error deleting graph: ' + err.message);
            });
        }

        // Initialize
        document.addEventListener('DOMContentLoaded', function() {
            createThemeSwitcher();
            const storedTheme = getStoredTheme();
            applyTheme(storedTheme);
            updateThemeButtons(storedTheme);

            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
                if (getStoredTheme() === 'system') {
                    applyTheme('system');
                }
            });
        });
    </script>
</body>
</html>
