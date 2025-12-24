<?php
require_once __DIR__ . '/../includes/functions.php';
require_once __DIR__ . '/../api/config/database.php';
require_once __DIR__ . '/../classes/GraphConfig.php';

// Get graph identifier
$id = isset($_GET['id']) ? $_GET['id'] : null;
$slug = isset($_GET['slug']) ? $_GET['slug'] : null;
$identifier = $id ? $id : $slug;

$graph = null;
$error = null;

if (!$identifier) {
    $error = 'No graph ID or slug provided';
} else {
    try {
        $db = Database::getInstance();
        $pdo = $db->getConnection();

        $graphConfig = new GraphConfig($pdo);
        $graph = $graphConfig->get($identifier);

        if (!$graph) {
            $error = 'Graph not found';
        }
    } catch (Exception $e) {
        $error = $e->getMessage();
    }
}

// Helper functions
function getSourceTypeInfo($type) {
    $info = array(
        'sql' => array('label' => 'SQL Query', 'icon' => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>'),
        'api' => array('label' => 'API', 'icon' => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>'),
        'callback' => array('label' => 'Callback', 'icon' => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 18l6-6-6-6"/><path d="M8 6l-6 6 6 6"/></svg>'),
        'static' => array('label' => 'Static', 'icon' => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/></svg>')
    );
    return isset($info[$type]) ? $info[$type] : array('label' => $type, 'icon' => '');
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?= $graph ? htmlspecialchars($graph['name']) : 'Graph View' ?> - Graph Builder</title>
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
                <h1 class="usage-title"><?= $graph ? htmlspecialchars($graph['name']) : 'Graph View' ?></h1>
                <?php if ($graph): ?>
                <p class="usage-subtitle"><?= htmlspecialchars($graph['slug']) ?></p>
                <?php endif; ?>
            </div>
            <div class="usage-header-actions">
                <div id="theme-switcher"></div>
                <a href="<?= get_base_path() ?>/graphs/" class="usage-back-link">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
                        <path d="M19 12H5M12 19l-7-7 7-7"/>
                    </svg>
                    Back to Graphs
                </a>
            </div>
        </header>

        <?php if ($error): ?>
        <section class="usage-section">
            <div class="graphs-error">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="24" height="24">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <p><?= htmlspecialchars($error) ?></p>
                <a href="<?= get_base_path() ?>/graphs/" class="usage-cta" style="margin-top: var(--gb-spacing-md);">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
                        <path d="M19 12H5M12 19l-7-7 7-7"/>
                    </svg>
                    Back to Graphs
                </a>
            </div>
        </section>
        <?php else: ?>

        <!-- Graph Info & Filters -->
        <section class="usage-section">
            <div class="graph-view-layout">
                <!-- Left: Chart -->
                <div class="graph-view-chart-container">
                    <div class="graph-view-chart" id="chart"></div>
                    <div class="graph-view-chart-loading" id="chartLoading">
                        <div class="graph-view-spinner"></div>
                        <span>Loading chart...</span>
                    </div>
                </div>

                <!-- Right: Info & Filters -->
                <div class="graph-view-sidebar">
                    <!-- Graph Info -->
                    <div class="graph-view-info">
                        <h3>Graph Details</h3>
                        <div class="graph-view-info-grid">
                            <div class="graph-view-info-item">
                                <span class="label">Chart Type</span>
                                <span class="value"><?= ucfirst($graph['chart_type']) ?></span>
                            </div>
                            <?php
                            $sourceInfo = getSourceTypeInfo($graph['source_type']);
                            ?>
                            <div class="graph-view-info-item">
                                <span class="label">Data Source</span>
                                <span class="value"><?= $sourceInfo['label'] ?></span>
                            </div>
                            <?php if (!empty($graph['description'])): ?>
                            <div class="graph-view-info-item graph-view-info-item--full">
                                <span class="label">Description</span>
                                <span class="value"><?= htmlspecialchars($graph['description']) ?></span>
                            </div>
                            <?php endif; ?>
                        </div>
                    </div>

                    <!-- Runtime Filters -->
                    <div class="graph-view-filters">
                        <h3>Runtime Filters</h3>
                        <p class="graph-view-filters-help">Add filters to test how the chart data changes with different conditions.</p>

                        <div id="filtersContainer">
                            <!-- Filter rows will be added here -->
                        </div>

                        <button type="button" class="graph-view-add-filter" onclick="addFilter()">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                                <path d="M12 5v14M5 12h14"/>
                            </svg>
                            Add Filter
                        </button>

                        <div class="graph-view-filter-actions">
                            <button type="button" class="graph-view-apply-btn" onclick="applyFilters()">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                                    <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
                                </svg>
                                Apply Filters
                            </button>
                            <button type="button" class="graph-view-clear-btn" onclick="clearFilters()">
                                Clear All
                            </button>
                        </div>
                    </div>

                    <!-- Data Preview -->
                    <div class="graph-view-data">
                        <h3>Data Preview <span id="rowCount"></span></h3>
                        <div class="graph-view-data-table" id="dataPreview">
                            <p class="graph-view-data-empty">Apply filters to load data</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <?php endif; ?>
    </div>

    <script>
        // Graph data
        const graphId = <?= $graph ? (int) $graph['graph_id'] : 'null' ?>;
        const graphSlug = <?= $graph ? json_encode($graph['slug']) : 'null' ?>;
        const basePath = '<?= get_base_path() ?>';

        // Chart instance
        let chart = null;

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

            // Re-render chart if exists
            if (chart) {
                loadChart(getFilters());
            }
        }

        function updateThemeButtons(theme) {
            document.querySelectorAll('.gb-theme-btn').forEach(btn => {
                btn.classList.toggle('gb-theme-btn--active', btn.dataset.theme === theme);
            });
        }

        // Filter Management
        let filterCount = 0;

        function addFilter() {
            filterCount++;
            const container = document.getElementById('filtersContainer');

            const row = document.createElement('div');
            row.className = 'graph-view-filter-row';
            row.dataset.id = filterCount;

            row.innerHTML = `
                <input type="text" placeholder="Column" class="filter-column" data-id="${filterCount}">
                <select class="filter-operator" data-id="${filterCount}">
                    <option value="=">=</option>
                    <option value="!=">!=</option>
                    <option value=">">&gt;</option>
                    <option value="<">&lt;</option>
                    <option value=">=">&gt;=</option>
                    <option value="<=">&lt;=</option>
                    <option value="LIKE">LIKE</option>
                    <option value="IN">IN</option>
                    <option value="BETWEEN">BETWEEN</option>
                </select>
                <input type="text" placeholder="Value" class="filter-value" data-id="${filterCount}">
                <button type="button" class="filter-remove" onclick="removeFilter(${filterCount})" title="Remove filter">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                        <path d="M18 6L6 18M6 6l12 12"/>
                    </svg>
                </button>
            `;

            container.appendChild(row);
        }

        function removeFilter(id) {
            const row = document.querySelector(`.graph-view-filter-row[data-id="${id}"]`);
            if (row) {
                row.remove();
            }
        }

        function clearFilters() {
            document.getElementById('filtersContainer').innerHTML = '';
            filterCount = 0;
        }

        function getFilters() {
            const filters = [];
            const rows = document.querySelectorAll('.graph-view-filter-row');

            rows.forEach(row => {
                const id = row.dataset.id;
                const column = row.querySelector('.filter-column').value.trim();
                const operator = row.querySelector('.filter-operator').value;
                const value = row.querySelector('.filter-value').value.trim();

                if (column && value) {
                    filters.push({ column, operator, value });
                }
            });

            return filters;
        }

        function applyFilters() {
            loadChart(getFilters());
        }

        // Chart Loading
        function loadChart(filters) {
            if (!graphId) return;

            const loading = document.getElementById('chartLoading');
            loading.style.display = 'flex';

            fetch(basePath + '/api/graphs/render.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: graphId,
                    filters: filters || []
                })
            })
            .then(response => response.json())
            .then(data => {
                loading.style.display = 'none';

                if (!data.success) {
                    alert('Error loading chart: ' + (data.error || 'Unknown error'));
                    return;
                }

                // Update row count
                document.getElementById('rowCount').textContent = '(' + data.rowCount + ' rows)';

                // Render chart
                renderChart(data.echartsOption);

                // Update data preview
                updateDataPreview(data.data);
            })
            .catch(err => {
                loading.style.display = 'none';
                alert('Error loading chart: ' + err.message);
            });
        }

        function renderChart(option) {
            const container = document.getElementById('chart');

            if (chart) {
                chart.dispose();
            }

            chart = echarts.init(container);

            // Apply theme colors
            const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
            const textColor = isDark ? '#e5e7eb' : '#374151';
            const borderColor = isDark ? '#4b5563' : '#d1d5db';

            // Update option with theme colors
            if (option.xAxis) {
                option.xAxis.axisLabel = option.xAxis.axisLabel || {};
                option.xAxis.axisLabel.color = textColor;
                option.xAxis.axisLine = { lineStyle: { color: borderColor } };
            }
            if (option.yAxis) {
                option.yAxis.axisLabel = option.yAxis.axisLabel || {};
                option.yAxis.axisLabel.color = textColor;
                option.yAxis.axisLine = { lineStyle: { color: borderColor } };
                option.yAxis.splitLine = { lineStyle: { color: borderColor } };
            }
            if (option.legend) {
                option.legend.textStyle = { color: textColor };
            }
            if (option.title) {
                option.title.textStyle = { color: textColor };
            }

            chart.setOption(option);
        }

        function updateDataPreview(data) {
            const container = document.getElementById('dataPreview');

            if (!data || data.length === 0) {
                container.innerHTML = '<p class="graph-view-data-empty">No data returned</p>';
                return;
            }

            // Get columns from first row
            const columns = Object.keys(data[0]);

            // Build table
            let html = '<table><thead><tr>';
            columns.forEach(col => {
                html += '<th>' + escapeHtml(col) + '</th>';
            });
            html += '</tr></thead><tbody>';

            // Limit to first 20 rows
            const displayData = data.slice(0, 20);
            displayData.forEach(row => {
                html += '<tr>';
                columns.forEach(col => {
                    const value = row[col];
                    html += '<td>' + (value !== null ? escapeHtml(String(value)) : '<em>null</em>') + '</td>';
                });
                html += '</tr>';
            });

            html += '</tbody></table>';

            if (data.length > 20) {
                html += '<p class="graph-view-data-more">Showing 20 of ' + data.length + ' rows</p>';
            }

            container.innerHTML = html;
        }

        function escapeHtml(str) {
            const div = document.createElement('div');
            div.textContent = str;
            return div.innerHTML;
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

            // Handle chart resize
            window.addEventListener('resize', function() {
                if (chart) {
                    chart.resize();
                }
            });

            // Load chart initially (no filters)
            if (graphId) {
                loadChart([]);
            }
        });
    </script>
</body>
</html>
