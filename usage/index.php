<?php
require_once __DIR__ . '/../includes/functions.php';
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Graph Builder - Usage Examples</title>
    <?php favicon(); ?>
    <link id="hljs-light" rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github.min.css">
    <link id="hljs-dark" rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github-dark.min.css" disabled>
    <link rel="stylesheet" href="<?= asset('graph-creator.css') ?>">
    <link rel="stylesheet" href="<?= asset('main.css') ?>">
    <script src="https://cdn.jsdelivr.net/npm/echarts@5/dist/echarts.min.js"></script>
</head>
<body>
    <div class="usage-page">
        <!-- Header -->
        <header class="usage-header">
            <div class="usage-header-content">
                <h1 class="usage-title">Graph Builder</h1>
                <p class="usage-subtitle">Usage Examples & Data Formats</p>
            </div>
            <div class="usage-header-actions">
                <div id="theme-switcher"></div>
                <a href="<?= get_base_path() ?>/" class="usage-back-link">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
                        <path d="M19 12H5M12 19l-7-7 7-7"/>
                    </svg>
                    Back to Builder
                </a>
            </div>
        </header>

        <!-- Introduction -->
        <section class="usage-section">
            <h2 class="usage-section-title">Overview</h2>
            <p class="usage-text">
                Graph Builder supports multiple chart types with various configurations.
                Below you'll find examples of each chart type along with the data formats they accept.
            </p>
        </section>

        <!-- Line Charts -->
        <section class="usage-section">
            <h2 class="usage-section-title">Line Charts</h2>
            <p class="usage-text">Line charts are ideal for showing trends over time or continuous data.</p>

            <div class="usage-examples">
                <!-- Basic Line -->
                <div class="usage-example">
                    <h3 class="usage-example-title">Basic Line Chart</h3>
                    <div class="usage-example-content">
                        <div class="usage-chart" id="line-basic"></div>
                        <div class="usage-data">
                            <h4>Data Format</h4>
                            <pre><code class="language-json">[
  { "month": "Jan", "sales": 120 },
  { "month": "Feb", "sales": 150 },
  { "month": "Mar", "sales": 180 },
  { "month": "Apr", "sales": 140 },
  { "month": "May", "sales": 200 },
  { "month": "Jun", "sales": 220 }
]</code></pre>
                            <div class="usage-config">
                                <span class="usage-config-item"><span class="config-label">X-Axis:</span> <span class="config-value">month</span></span>
                                <span class="usage-config-item"><span class="config-label">Y-Axis:</span> <span class="config-value">sales</span></span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Multi-Series Line -->
                <div class="usage-example">
                    <h3 class="usage-example-title">Multi-Series Line Chart</h3>
                    <div class="usage-example-content">
                        <div class="usage-chart" id="line-multi"></div>
                        <div class="usage-data">
                            <h4>Data Format</h4>
                            <pre><code class="language-json">[
  { "month": "Jan", "sales": 120, "revenue": 80, "profit": 40 },
  { "month": "Feb", "sales": 150, "revenue": 95, "profit": 55 },
  { "month": "Mar", "sales": 180, "revenue": 120, "profit": 60 },
  { "month": "Apr", "sales": 140, "revenue": 90, "profit": 50 },
  { "month": "May", "sales": 200, "revenue": 150, "profit": 50 },
  { "month": "Jun", "sales": 220, "revenue": 170, "profit": 50 }
]</code></pre>
                            <div class="usage-config">
                                <span class="usage-config-item"><span class="config-label">X-Axis:</span> <span class="config-value">month</span></span>
                                <span class="usage-config-item"><span class="config-label">Y-Axis:</span> <span class="config-value">sales, revenue, profit</span></span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Area Chart -->
                <div class="usage-example">
                    <h3 class="usage-example-title">Area Chart (Smooth with Fill)</h3>
                    <div class="usage-example-content">
                        <div class="usage-chart" id="line-area"></div>
                        <div class="usage-data">
                            <h4>Configuration</h4>
                            <pre><code class="language-json">{
  "smooth": true,
  "showArea": true,
  "showSymbol": true,
  "symbolSize": 8,
  "lineWidth": 3
}</code></pre>
                            <div class="usage-config">
                                <span class="usage-config-item"><span class="config-label">Smooth Curve:</span> <span class="config-value">On</span></span>
                                <span class="usage-config-item"><span class="config-label">Area Fill:</span> <span class="config-value">On</span></span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Step Line -->
                <div class="usage-example">
                    <h3 class="usage-example-title">Step Line Chart</h3>
                    <div class="usage-example-content">
                        <div class="usage-chart" id="line-step"></div>
                        <div class="usage-data">
                            <h4>Data Format</h4>
                            <pre><code class="language-json">[
  { "time": "00:00", "users": 10 },
  { "time": "04:00", "users": 5 },
  { "time": "08:00", "users": 25 },
  { "time": "12:00", "users": 80 },
  { "time": "16:00", "users": 120 },
  { "time": "20:00", "users": 60 },
  { "time": "24:00", "users": 15 }
]</code></pre>
                            <div class="usage-config">
                                <span class="usage-config-item"><span class="config-label">Step Line:</span> <span class="config-value">middle</span></span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- Bar Charts -->
        <section class="usage-section">
            <h2 class="usage-section-title">Bar Charts</h2>
            <p class="usage-text">Bar charts are great for comparing values across categories.</p>

            <div class="usage-examples">
                <!-- Basic Bar -->
                <div class="usage-example">
                    <h3 class="usage-example-title">Basic Bar Chart</h3>
                    <div class="usage-example-content">
                        <div class="usage-chart" id="bar-basic"></div>
                        <div class="usage-data">
                            <h4>Data Format</h4>
                            <pre><code class="language-json">[
  { "category": "Product A", "sales": 45 },
  { "category": "Product B", "sales": 30 },
  { "category": "Product C", "sales": 65 },
  { "category": "Product D", "sales": 50 }
]</code></pre>
                            <div class="usage-config">
                                <span class="usage-config-item"><span class="config-label">X-Axis:</span> <span class="config-value">category</span></span>
                                <span class="usage-config-item"><span class="config-label">Y-Axis:</span> <span class="config-value">sales</span></span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Grouped Bar -->
                <div class="usage-example">
                    <h3 class="usage-example-title">Grouped Bar Chart</h3>
                    <div class="usage-example-content">
                        <div class="usage-chart" id="bar-grouped"></div>
                        <div class="usage-data">
                            <h4>Data Format</h4>
                            <pre><code class="language-json">[
  { "category": "Q1", "2022": 120, "2023": 150, "2024": 180 },
  { "category": "Q2", "2022": 100, "2023": 140, "2024": 160 },
  { "category": "Q3", "2022": 140, "2023": 160, "2024": 200 },
  { "category": "Q4", "2022": 180, "2023": 200, "2024": 240 }
]</code></pre>
                            <div class="usage-config">
                                <span class="usage-config-item"><span class="config-label">X-Axis:</span> <span class="config-value">category</span></span>
                                <span class="usage-config-item"><span class="config-label">Y-Axis:</span> <span class="config-value">2022, 2023, 2024</span></span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Stacked Bar -->
                <div class="usage-example">
                    <h3 class="usage-example-title">Stacked Bar Chart</h3>
                    <div class="usage-example-content">
                        <div class="usage-chart" id="bar-stacked"></div>
                        <div class="usage-data">
                            <h4>Configuration</h4>
                            <pre><code class="language-json">{
  "stacked": true,
  "barWidth": 50,
  "borderRadius": 4
}</code></pre>
                            <div class="usage-config">
                                <span class="usage-config-item"><span class="config-label">Stacked:</span> <span class="config-value">On</span></span>
                                <span class="usage-config-item"><span class="config-label">Border Radius:</span> <span class="config-value">4</span></span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Horizontal Bar -->
                <div class="usage-example">
                    <h3 class="usage-example-title">Horizontal Bar Chart</h3>
                    <div class="usage-example-content">
                        <div class="usage-chart" id="bar-horizontal"></div>
                        <div class="usage-data">
                            <h4>Data Format</h4>
                            <pre><code class="language-json">[
  { "country": "USA", "population": 331 },
  { "country": "China", "population": 1411 },
  { "country": "India", "population": 1380 },
  { "country": "Indonesia", "population": 273 },
  { "country": "Brazil", "population": 212 }
]</code></pre>
                            <div class="usage-config">
                                <span class="usage-config-item"><span class="config-label">Horizontal:</span> <span class="config-value">On</span></span>
                                <span class="usage-config-item"><span class="config-label">X-Axis Label:</span> <span class="config-value">Population (millions)</span></span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- Pie Charts -->
        <section class="usage-section">
            <h2 class="usage-section-title">Pie Charts</h2>
            <p class="usage-text">Pie charts show proportions of a whole.</p>

            <div class="usage-examples">
                <!-- Basic Pie -->
                <div class="usage-example">
                    <h3 class="usage-example-title">Basic Pie Chart</h3>
                    <div class="usage-example-content">
                        <div class="usage-chart" id="pie-basic"></div>
                        <div class="usage-data">
                            <h4>Data Format</h4>
                            <pre><code class="language-json">[
  { "name": "Electronics", "value": 335 },
  { "name": "Clothing", "value": 210 },
  { "name": "Food", "value": 180 },
  { "name": "Books", "value": 125 },
  { "name": "Other", "value": 90 }
]</code></pre>
                            <div class="usage-config">
                                <span class="usage-config-item"><span class="config-label">Name Field:</span> <span class="config-value">name</span></span>
                                <span class="usage-config-item"><span class="config-label">Value Field:</span> <span class="config-value">value</span></span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Donut Chart -->
                <div class="usage-example">
                    <h3 class="usage-example-title">Donut Chart</h3>
                    <div class="usage-example-content">
                        <div class="usage-chart" id="pie-donut"></div>
                        <div class="usage-data">
                            <h4>Configuration</h4>
                            <pre><code class="language-json">{
  "radius": 70,
  "innerRadius": 40,
  "showLabels": true,
  "labelPosition": "outside"
}</code></pre>
                            <div class="usage-config">
                                <span class="usage-config-item"><span class="config-label">Inner Radius:</span> <span class="config-value">40%</span></span>
                                <span class="usage-config-item"><span class="config-label">Outer Radius:</span> <span class="config-value">70%</span></span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Rose Chart -->
                <div class="usage-example">
                    <h3 class="usage-example-title">Rose (Nightingale) Chart</h3>
                    <div class="usage-example-content">
                        <div class="usage-chart" id="pie-rose"></div>
                        <div class="usage-data">
                            <h4>Configuration</h4>
                            <pre><code class="language-json">{
  "roseType": "radius",
  "radius": 65,
  "borderRadius": 5,
  "padAngle": 2
}</code></pre>
                            <div class="usage-config">
                                <span class="usage-config-item"><span class="config-label">Rose Type:</span> <span class="config-value">radius</span></span>
                                <span class="usage-config-item"><span class="config-label">Pad Angle:</span> <span class="config-value">2</span></span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Styled Donut -->
                <div class="usage-example">
                    <h3 class="usage-example-title">Styled Donut with Gap</h3>
                    <div class="usage-example-content">
                        <div class="usage-chart" id="pie-styled"></div>
                        <div class="usage-data">
                            <h4>Data Format</h4>
                            <pre><code class="language-json">[
  { "browser": "Chrome", "share": 65 },
  { "browser": "Safari", "share": 19 },
  { "browser": "Firefox", "share": 8 },
  { "browser": "Edge", "share": 5 },
  { "browser": "Other", "share": 3 }
]</code></pre>
                            <div class="usage-config">
                                <span class="usage-config-item"><span class="config-label">Border Radius:</span> <span class="config-value">8</span></span>
                                <span class="usage-config-item"><span class="config-label">Pad Angle:</span> <span class="config-value">3</span></span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- Data Format Guide -->
        <section class="usage-section">
            <h2 class="usage-section-title">Data Format Guide</h2>

            <div class="usage-guide">
                <div class="usage-guide-item">
                    <h3>Line & Bar Charts</h3>
                    <p>Use an array of objects with one field for categories (X-axis) and one or more numeric fields for values (Y-axis).</p>
                    <pre><code class="language-json">[
  { "category_field": "Label 1", "value_field": 100, "value_field_2": 80 },
  { "category_field": "Label 2", "value_field": 150, "value_field_2": 120 }
]</code></pre>
                </div>

                <div class="usage-guide-item">
                    <h3>Pie & Donut Charts</h3>
                    <p>Use an array of objects with a name field and a value field.</p>
                    <pre><code class="language-json">[
  { "name": "Category A", "value": 100 },
  { "name": "Category B", "value": 200 }
]</code></pre>
                </div>

                <div class="usage-guide-item">
                    <h3>Supported Import Formats</h3>
                    <ul>
                        <li><strong>JSON:</strong> Direct array of objects</li>
                        <li><strong>CSV:</strong> Comma-separated values with headers</li>
                        <li><strong>PHP Array:</strong> Associative array syntax</li>
                        <li><strong>SQL Query:</strong> Execute queries against your database</li>
                    </ul>
                </div>
            </div>
        </section>

        <!-- Footer -->
        <footer class="usage-footer">
            <a href="<?= get_base_path() ?>/" class="usage-cta">
                Start Building Your Chart
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
            </a>
        </footer>
    </div>

    <!-- Highlight.js -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/languages/json.min.js"></script>
    <script>
        // Theme Switcher
        const THEME_KEY = 'graphBuilder_theme';
        let charts = [];

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
            const lightSheet = document.getElementById('hljs-light');
            const darkSheet = document.getElementById('hljs-dark');

            let isDark = false;
            if (theme === 'dark') {
                isDark = true;
            } else if (theme === 'system') {
                isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            }

            document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
            lightSheet.disabled = isDark;
            darkSheet.disabled = !isDark;

            // Re-render charts with new theme colors
            reinitCharts();
        }

        function updateThemeButtons(theme) {
            document.querySelectorAll('.gb-theme-btn').forEach(btn => {
                btn.classList.toggle('gb-theme-btn--active', btn.dataset.theme === theme);
            });
        }

        // Chart color palette
        const colors = ['#5376df', '#5bd123', '#fac858', '#ee6666', '#73c0de', '#3ba272', '#fc8452', '#9a60b4'];

        function getTextColor() {
            const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
            return isDark ? '#e5e7eb' : '#374151';
        }

        function getBorderColor() {
            const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
            return isDark ? '#4b5563' : '#d1d5db';
        }

        function disposeCharts() {
            charts.forEach(chart => {
                if (chart && !chart.isDisposed()) {
                    chart.dispose();
                }
            });
            charts = [];
        }

        function reinitCharts() {
            disposeCharts();
            initCharts();
        }

        function initCharts() {
            const textColor = getTextColor();
            const borderColor = getBorderColor();

            // Line Basic
            const lineBasic = echarts.init(document.getElementById('line-basic'));
            lineBasic.setOption({
                color: colors,
                tooltip: { trigger: 'axis' },
                xAxis: { type: 'category', data: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'], axisLabel: { color: textColor }, axisLine: { lineStyle: { color: borderColor } } },
                yAxis: { type: 'value', axisLabel: { color: textColor }, axisLine: { lineStyle: { color: borderColor } }, splitLine: { lineStyle: { color: borderColor } } },
                series: [{ data: [120, 150, 180, 140, 200, 220], type: 'line' }],
                grid: { left: 50, right: 20, top: 20, bottom: 30 }
            });
            charts.push(lineBasic);

            // Line Multi
            const lineMulti = echarts.init(document.getElementById('line-multi'));
            lineMulti.setOption({
                color: colors,
                tooltip: { trigger: 'axis' },
                legend: { data: ['Sales', 'Revenue', 'Profit'], textStyle: { color: textColor } },
                xAxis: { type: 'category', data: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'], axisLabel: { color: textColor }, axisLine: { lineStyle: { color: borderColor } } },
                yAxis: { type: 'value', axisLabel: { color: textColor }, axisLine: { lineStyle: { color: borderColor } }, splitLine: { lineStyle: { color: borderColor } } },
                series: [
                    { name: 'Sales', data: [120, 150, 180, 140, 200, 220], type: 'line' },
                    { name: 'Revenue', data: [80, 95, 120, 90, 150, 170], type: 'line' },
                    { name: 'Profit', data: [40, 55, 60, 50, 50, 50], type: 'line' }
                ],
                grid: { left: 50, right: 20, top: 40, bottom: 30 }
            });
            charts.push(lineMulti);

            // Line Area
            const lineArea = echarts.init(document.getElementById('line-area'));
            lineArea.setOption({
                color: colors,
                tooltip: { trigger: 'axis' },
                xAxis: { type: 'category', data: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'], axisLabel: { color: textColor }, axisLine: { lineStyle: { color: borderColor } } },
                yAxis: { type: 'value', axisLabel: { color: textColor }, axisLine: { lineStyle: { color: borderColor } }, splitLine: { lineStyle: { color: borderColor } } },
                series: [{ data: [120, 150, 180, 140, 200, 220], type: 'line', smooth: true, areaStyle: { opacity: 0.3 }, symbolSize: 8, lineStyle: { width: 3 } }],
                grid: { left: 50, right: 20, top: 20, bottom: 30 }
            });
            charts.push(lineArea);

            // Line Step
            const lineStep = echarts.init(document.getElementById('line-step'));
            lineStep.setOption({
                color: colors,
                tooltip: { trigger: 'axis' },
                xAxis: { type: 'category', data: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00'], axisLabel: { color: textColor }, axisLine: { lineStyle: { color: borderColor } } },
                yAxis: { type: 'value', name: 'Active Users', nameTextStyle: { color: textColor }, axisLabel: { color: textColor }, axisLine: { lineStyle: { color: borderColor } }, splitLine: { lineStyle: { color: borderColor } } },
                series: [{ data: [10, 5, 25, 80, 120, 60, 15], type: 'line', step: 'middle' }],
                grid: { left: 60, right: 20, top: 30, bottom: 30 }
            });
            charts.push(lineStep);

            // Bar Basic
            const barBasic = echarts.init(document.getElementById('bar-basic'));
            barBasic.setOption({
                color: colors,
                tooltip: { trigger: 'axis' },
                xAxis: { type: 'category', data: ['Product A', 'Product B', 'Product C', 'Product D'], axisLabel: { color: textColor }, axisLine: { lineStyle: { color: borderColor } } },
                yAxis: { type: 'value', axisLabel: { color: textColor }, axisLine: { lineStyle: { color: borderColor } }, splitLine: { lineStyle: { color: borderColor } } },
                series: [{ data: [45, 30, 65, 50], type: 'bar', barWidth: '60%' }],
                grid: { left: 50, right: 20, top: 20, bottom: 30 }
            });
            charts.push(barBasic);

            // Bar Grouped
            const barGrouped = echarts.init(document.getElementById('bar-grouped'));
            barGrouped.setOption({
                color: colors,
                tooltip: { trigger: 'axis' },
                legend: { data: ['2022', '2023', '2024'], textStyle: { color: textColor } },
                xAxis: { type: 'category', data: ['Q1', 'Q2', 'Q3', 'Q4'], axisLabel: { color: textColor }, axisLine: { lineStyle: { color: borderColor } } },
                yAxis: { type: 'value', axisLabel: { color: textColor }, axisLine: { lineStyle: { color: borderColor } }, splitLine: { lineStyle: { color: borderColor } } },
                series: [
                    { name: '2022', data: [120, 100, 140, 180], type: 'bar' },
                    { name: '2023', data: [150, 140, 160, 200], type: 'bar' },
                    { name: '2024', data: [180, 160, 200, 240], type: 'bar' }
                ],
                grid: { left: 50, right: 20, top: 40, bottom: 30 }
            });
            charts.push(barGrouped);

            // Bar Stacked
            const barStacked = echarts.init(document.getElementById('bar-stacked'));
            barStacked.setOption({
                color: colors,
                tooltip: { trigger: 'axis' },
                legend: { data: ['2022', '2023', '2024'], textStyle: { color: textColor } },
                xAxis: { type: 'category', data: ['Q1', 'Q2', 'Q3', 'Q4'], axisLabel: { color: textColor }, axisLine: { lineStyle: { color: borderColor } } },
                yAxis: { type: 'value', axisLabel: { color: textColor }, axisLine: { lineStyle: { color: borderColor } }, splitLine: { lineStyle: { color: borderColor } } },
                series: [
                    { name: '2022', data: [120, 100, 140, 180], type: 'bar', stack: 'total', itemStyle: { borderRadius: [0, 0, 0, 0] } },
                    { name: '2023', data: [150, 140, 160, 200], type: 'bar', stack: 'total', itemStyle: { borderRadius: [0, 0, 0, 0] } },
                    { name: '2024', data: [180, 160, 200, 240], type: 'bar', stack: 'total', itemStyle: { borderRadius: [4, 4, 0, 0] } }
                ],
                grid: { left: 50, right: 20, top: 40, bottom: 30 }
            });
            charts.push(barStacked);

            // Bar Horizontal
            const barHorizontal = echarts.init(document.getElementById('bar-horizontal'));
            barHorizontal.setOption({
                color: colors,
                tooltip: { trigger: 'axis' },
                xAxis: { type: 'value', name: 'Population (millions)', nameLocation: 'middle', nameGap: 30, nameTextStyle: { color: textColor }, axisLabel: { color: textColor }, axisLine: { lineStyle: { color: borderColor } }, splitLine: { lineStyle: { color: borderColor } } },
                yAxis: { type: 'category', data: ['Brazil', 'Indonesia', 'India', 'China', 'USA'], axisLabel: { color: textColor }, axisLine: { lineStyle: { color: borderColor } } },
                series: [{ data: [212, 273, 1380, 1411, 331], type: 'bar', barWidth: '60%' }],
                grid: { left: 80, right: 20, top: 20, bottom: 50 }
            });
            charts.push(barHorizontal);

            // Pie Basic
            const pieBasic = echarts.init(document.getElementById('pie-basic'));
            pieBasic.setOption({
                color: colors,
                tooltip: { trigger: 'item' },
                legend: { orient: 'vertical', right: 10, top: 'center', textStyle: { color: textColor } },
                series: [{
                    type: 'pie',
                    radius: '65%',
                    center: ['40%', '50%'],
                    data: [
                        { name: 'Electronics', value: 335 },
                        { name: 'Clothing', value: 210 },
                        { name: 'Food', value: 180 },
                        { name: 'Books', value: 125 },
                        { name: 'Other', value: 90 }
                    ],
                    label: { color: textColor }
                }]
            });
            charts.push(pieBasic);

            // Pie Donut
            const pieDonut = echarts.init(document.getElementById('pie-donut'));
            pieDonut.setOption({
                color: colors,
                tooltip: { trigger: 'item' },
                legend: { orient: 'vertical', right: 10, top: 'center', textStyle: { color: textColor } },
                series: [{
                    type: 'pie',
                    radius: ['40%', '70%'],
                    center: ['40%', '50%'],
                    data: [
                        { name: 'Electronics', value: 335 },
                        { name: 'Clothing', value: 210 },
                        { name: 'Food', value: 180 },
                        { name: 'Books', value: 125 },
                        { name: 'Other', value: 90 }
                    ],
                    label: { color: textColor }
                }]
            });
            charts.push(pieDonut);

            // Pie Rose
            const pieRose = echarts.init(document.getElementById('pie-rose'));
            pieRose.setOption({
                color: colors,
                tooltip: { trigger: 'item' },
                series: [{
                    type: 'pie',
                    radius: ['20%', '65%'],
                    center: ['50%', '50%'],
                    roseType: 'radius',
                    padAngle: 2,
                    itemStyle: { borderRadius: 5 },
                    data: [
                        { name: 'Electronics', value: 335 },
                        { name: 'Clothing', value: 210 },
                        { name: 'Food', value: 180 },
                        { name: 'Books', value: 125 },
                        { name: 'Other', value: 90 }
                    ],
                    label: { color: textColor }
                }]
            });
            charts.push(pieRose);

            // Pie Styled
            const pieStyled = echarts.init(document.getElementById('pie-styled'));
            pieStyled.setOption({
                color: colors,
                tooltip: { trigger: 'item' },
                legend: { orient: 'vertical', right: 10, top: 'center', textStyle: { color: textColor } },
                series: [{
                    type: 'pie',
                    radius: ['45%', '70%'],
                    center: ['40%', '50%'],
                    padAngle: 3,
                    itemStyle: { borderRadius: 8 },
                    data: [
                        { name: 'Chrome', value: 65 },
                        { name: 'Safari', value: 19 },
                        { name: 'Firefox', value: 8 },
                        { name: 'Edge', value: 5 },
                        { name: 'Other', value: 3 }
                    ],
                    label: { show: false }
                }]
            });
            charts.push(pieStyled);

            // Handle resize
            window.addEventListener('resize', function() {
                charts.forEach(chart => chart.resize());
            });
        }

        // Initialize on DOM ready
        document.addEventListener('DOMContentLoaded', function() {
            // Create theme switcher
            createThemeSwitcher();

            // Apply stored theme
            const storedTheme = getStoredTheme();
            applyTheme(storedTheme);
            updateThemeButtons(storedTheme);

            // Listen for system theme changes
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
                if (getStoredTheme() === 'system') {
                    applyTheme('system');
                }
            });

            // Highlight code blocks
            hljs.highlightAll();
        });
    </script>
</body>
</html>
