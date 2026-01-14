<?php
require_once __DIR__ . '/../includes/functions.php';
?>
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Graph Builder - Documentation</title>
    <?php favicon(); ?>
    <link id="hljs-light" rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github.min.css">
    <link id="hljs-dark" rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github-dark.min.css" disabled>
    <link rel="stylesheet" href="<?= asset('graph-creator.css') ?>">
    <link rel="stylesheet" href="<?= asset('main.css') ?>">
</head>

<body>
    <div class="docs-page">
        <!-- Header -->
        <header class="usage-header">
            <div class="usage-header-content">
                <h1 class="usage-title">Graph Builder</h1>
                <p class="usage-subtitle">Developer Documentation</p>
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

        <!-- Layout Container -->
        <div class="docs-layout">
            <!-- Table of Contents Sidebar -->
            <nav class="docs-toc">
                <h3>Contents</h3>
                <ul>
                    <li><a href="#overview">Overview</a></li>
                    <li><a href="#installation">Installation</a></li>
                    <li><a href="#database">Database Schema</a></li>
                    <li>
                        <a href="#data-sources">Data Sources</a>
                        <ul>
                            <li><a href="#sql-source">SQL Source</a></li>
                            <li><a href="#api-source">API Source</a></li>
                            <li><a href="#callback-source">Callback Source</a></li>
                            <li><a href="#static-source">Static Source</a></li>
                        </ul>
                    </li>
                    <li><a href="#transformers">Transformers</a></li>
                    <li><a href="#filters">Runtime Filters</a></li>
                    <li><a href="#php-integration">PHP Integration</a></li>
                    <li><a href="#js-integration">JS Integration</a></li>
                    <li><a href="#api-reference">API Reference</a></li>
                    <li><a href="#configuration">Configuration</a></li>
                    <li><a href="#security">Security</a></li>
                </ul>
            </nav>

            <!-- Main Content -->
            <main class="docs-content">
                <!-- Overview -->
        <section class="docs-section" id="overview">
            <h2 class="docs-section-title">Overview</h2>
            <p>Graph Builder is a visual chart configuration tool that supports:</p>
            <ul class="docs-list">
                <li><strong>Multiple Chart Types:</strong> Line, Bar, and Pie charts with extensive customization</li>
                <li><strong>Four Data Sources:</strong> SQL queries, REST APIs, PHP callbacks, and static JSON data</li>
                <li><strong>Runtime Filters:</strong> Dynamic data filtering at render time without modifying saved configurations</li>
                <li><strong>Database Storage:</strong> Save and manage graph configurations in MySQL</li>
                <li><strong>ECharts Integration:</strong> Generates ready-to-use ECharts options</li>
            </ul>

            <div class="docs-note">
                <strong>Compatibility:</strong> PHP 5.4+ and MySQL 5.6+ (no JSON columns, uses TEXT with json_encode/json_decode)
            </div>
        </section>

        <!-- Installation -->
        <section class="docs-section" id="installation">
            <h2 class="docs-section-title">Installation</h2>

            <h3>1. Database Setup</h3>
            <p>Run the schema SQL to create the required tables:</p>
            <pre><code class="language-bash">mysql -u your_user -p your_database < database/schema.sql</code></pre>

            <h3>2. Configure Database Connection</h3>
            <p>Edit <code>api/config/database.php</code> with your database credentials:</p>
            <pre><code class="language-php">&lt;?php
return [
    'host' => 'localhost',
    'database' => 'your_database',
    'username' => 'your_user',
    'password' => 'your_password',
    'charset' => 'utf8mb4'
];</code></pre>

            <h3>3. Configure Graph Builder</h3>
            <p>Edit <code>api/config/graph_builder.php</code> for security settings:</p>
            <pre><code class="language-php">&lt;?php
return [
    'tables' => [
        'configs' => 'graph_builder_configs',
        'data_sources' => 'graph_builder_data_sources',
    ],
    'security' => [
        'allowed_callback_namespaces' => [
            'App\\Charts\\',
            'App\\Reports\\',
        ],
    ],
];</code></pre>
        </section>

        <!-- Database Schema -->
        <section class="docs-section" id="database">
            <h2 class="docs-section-title">Database Schema</h2>

            <h3>Table: graph_builder_data_sources</h3>
            <p>Stores data source configurations for fetching chart data.</p>

            <table class="docs-table">
                <thead>
                    <tr>
                        <th>Column</th>
                        <th>Type</th>
                        <th>Description</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>gbds_id</td>
                        <td>INT UNSIGNED</td>
                        <td>Primary key</td>
                    </tr>
                    <tr>
                        <td>source_type</td>
                        <td>ENUM</td>
                        <td>'sql', 'api', 'callback', 'static'</td>
                    </tr>
                    <tr>
                        <td>sql_query</td>
                        <td>TEXT</td>
                        <td>SQL query with optional placeholders</td>
                    </tr>
                    <tr>
                        <td>api_url</td>
                        <td>VARCHAR(2048)</td>
                        <td>API endpoint URL</td>
                    </tr>
                    <tr>
                        <td>api_method</td>
                        <td>ENUM</td>
                        <td>'GET' or 'POST'</td>
                    </tr>
                    <tr>
                        <td>api_headers</td>
                        <td>TEXT</td>
                        <td>JSON object of HTTP headers</td>
                    </tr>
                    <tr>
                        <td>api_body</td>
                        <td>TEXT</td>
                        <td>Request body for POST</td>
                    </tr>
                    <tr>
                        <td>api_data_path</td>
                        <td>VARCHAR(255)</td>
                        <td>Dot notation path to data in response</td>
                    </tr>
                    <tr>
                        <td>callback_class</td>
                        <td>VARCHAR(255)</td>
                        <td>PHP class name</td>
                    </tr>
                    <tr>
                        <td>callback_method</td>
                        <td>VARCHAR(100)</td>
                        <td>Method to call</td>
                    </tr>
                    <tr>
                        <td>callback_params</td>
                        <td>TEXT</td>
                        <td>JSON parameters to pass</td>
                    </tr>
                    <tr>
                        <td>static_data</td>
                        <td>LONGTEXT</td>
                        <td>JSON array of data</td>
                    </tr>
                    <tr>
                        <td>transformer_class</td>
                        <td>VARCHAR(255)</td>
                        <td>Optional data transformer class</td>
                    </tr>
                    <tr>
                        <td>transformer_method</td>
                        <td>VARCHAR(100)</td>
                        <td>Transformer method name</td>
                    </tr>
                    <tr>
                        <td>cache_ttl</td>
                        <td>INT UNSIGNED</td>
                        <td>Cache duration in seconds</td>
                    </tr>
                </tbody>
            </table>

            <h3>Table: graph_builder_configs</h3>
            <p>Stores chart configurations and visual settings.</p>

            <table class="docs-table">
                <thead>
                    <tr>
                        <th>Column</th>
                        <th>Type</th>
                        <th>Description</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>gbc_id</td>
                        <td>INT UNSIGNED</td>
                        <td>Primary key</td>
                    </tr>
                    <tr>
                        <td>slug</td>
                        <td>VARCHAR(100)</td>
                        <td>Unique identifier for API access</td>
                    </tr>
                    <tr>
                        <td>name</td>
                        <td>VARCHAR(255)</td>
                        <td>Display name</td>
                    </tr>
                    <tr>
                        <td>description</td>
                        <td>TEXT</td>
                        <td>Optional description</td>
                    </tr>
                    <tr>
                        <td>chart_type</td>
                        <td>ENUM</td>
                        <td>'line', 'bar', 'pie'</td>
                    </tr>
                    <tr>
                        <td>config_base</td>
                        <td>TEXT</td>
                        <td>JSON: title, legend, colors, animation</td>
                    </tr>
                    <tr>
                        <td>config_type</td>
                        <td>TEXT</td>
                        <td>JSON: chart-type-specific options</td>
                    </tr>
                    <tr>
                        <td>data_mapping</td>
                        <td>TEXT</td>
                        <td>JSON: field mappings for axes</td>
                    </tr>
                    <tr>
                        <td>gbds_id</td>
                        <td>INT UNSIGNED</td>
                        <td>Foreign key to data_sources</td>
                    </tr>
                    <tr>
                        <td>gbc_sid</td>
                        <td>TINYINT</td>
                        <td>State: 1=active, 0=inactive</td>
                    </tr>
                </tbody>
            </table>
        </section>

        <!-- Data Sources -->
        <section class="docs-section" id="data-sources">
            <h2 class="docs-section-title">Data Sources</h2>
            <p>Graph Builder supports four types of data sources for maximum flexibility.</p>
        </section>

        <!-- SQL Data Source -->
        <section class="docs-section" id="sql-source">
            <h3 class="docs-subsection-title">SQL Data Source</h3>
            <p>Execute SQL queries directly against your database. Supports runtime filter injection via placeholders.</p>

            <h4>Placeholder Syntax</h4>
            <ul class="docs-list">
                <li><code>{{WHERE}}</code> - Replaced with full WHERE clause when filters provided</li>
                <li><code>{{AND_CONDITIONS}}</code> - Appends to existing WHERE clause</li>
            </ul>

            <h4>Example Queries</h4>
            <pre><code class="language-sql">-- Using {{WHERE}} placeholder (adds full WHERE clause)
SELECT month, sales, revenue
FROM reports
{{WHERE}}
ORDER BY month

-- Using {{AND_CONDITIONS}} (appends to existing WHERE)
SELECT * FROM orders
WHERE status = 'active'
{{AND_CONDITIONS}}
ORDER BY created_at DESC

-- Without placeholders (filters ignored)
SELECT category, SUM(amount) as total
FROM transactions
GROUP BY category</code></pre>

            <div class="docs-note docs-note--warning">
                <strong>Security Note:</strong> All filter values are parameterized to prevent SQL injection.
            </div>
        </section>

        <!-- API Data Source -->
        <section class="docs-section" id="api-source">
            <h3 class="docs-subsection-title">API Data Source</h3>
            <p>Fetch data from external REST APIs. Supports GET/POST methods, custom headers, and nested response paths.</p>

            <h4>Configuration</h4>
            <table class="docs-table">
                <tbody>
                    <tr>
                        <td><strong>URL</strong></td>
                        <td>Full API endpoint URL with optional placeholders</td>
                    </tr>
                    <tr>
                        <td><strong>Method</strong></td>
                        <td>GET or POST</td>
                    </tr>
                    <tr>
                        <td><strong>Headers</strong></td>
                        <td>JSON object: <code>{"Authorization": "Bearer token"}</code></td>
                    </tr>
                    <tr>
                        <td><strong>Body</strong></td>
                        <td>Request body for POST requests</td>
                    </tr>
                    <tr>
                        <td><strong>Data Path</strong></td>
                        <td>Dot notation to data array: <code>response.data.items</code></td>
                    </tr>
                </tbody>
            </table>

            <h4>Placeholder Support</h4>
            <p>Use <code>{{filter_column}}</code> in URL or body to inject filter values:</p>
            <pre><code class="language-text">https://api.example.com/sales?year={{year}}&region={{region}}</code></pre>

            <h4>Example Response with Data Path</h4>
            <pre><code class="language-json">// API Response:
{
    "status": "success",
    "response": {
        "data": {
            "items": [
                {"month": "Jan", "sales": 100},
                {"month": "Feb", "sales": 150}
            ]
        }
    }
}

// Data Path: response.data.items
// Result: [{"month": "Jan", "sales": 100}, ...]</code></pre>
        </section>

        <!-- Callback Data Source -->
        <section class="docs-section" id="callback-source">
            <h3 class="docs-subsection-title">Callback Data Source</h3>
            <p>Call PHP class methods to fetch data. Ideal for complex data processing or integrating with existing application code.</p>

            <h4>Configuration</h4>
            <table class="docs-table">
                <tbody>
                    <tr>
                        <td><strong>Class</strong></td>
                        <td>Fully qualified class name (must be in allowed namespace)</td>
                    </tr>
                    <tr>
                        <td><strong>Method</strong></td>
                        <td>Static or instance method name</td>
                    </tr>
                    <tr>
                        <td><strong>Params</strong></td>
                        <td>JSON object passed as first argument</td>
                    </tr>
                </tbody>
            </table>

            <h4>Example Callback Class</h4>
            <pre><code class="language-php">&lt;?php
namespace App\Charts;

class SalesReport
{
    /**
     * Get monthly sales data
     *
     * @param array $params Contains 'filters' key with runtime filters
     * @return array
     */
    public static function getMonthlySales($params)
    {
        $filters = isset($params['filters']) ? $params['filters'] : [];
        $year = 2024;

        // Extract year from filters if provided
        foreach ($filters as $filter) {
            if ($filter['column'] === 'year') {
                $year = $filter['value'];
            }
        }

        // Your data fetching logic here
        return [
            ['month' => 'Jan', 'sales' => 120],
            ['month' => 'Feb', 'sales' => 150],
            // ...
        ];
    }
}</code></pre>

            <div class="docs-note">
                <strong>Security:</strong> Only classes in <code>allowed_callback_namespaces</code> (configured in graph_builder.php) can be executed.
            </div>
        </section>

        <!-- Static Data Source -->
        <section class="docs-section" id="static-source">
            <h3 class="docs-subsection-title">Static Data Source</h3>
            <p>Use pre-defined JSON data directly. Useful for demos, prototypes, or data that rarely changes.</p>

            <pre><code class="language-json">[
    {"category": "Electronics", "sales": 4500, "profit": 1200},
    {"category": "Clothing", "sales": 3200, "profit": 800},
    {"category": "Food", "sales": 2800, "profit": 400},
    {"category": "Books", "sales": 1500, "profit": 350}
]</code></pre>
        </section>

        <!-- Transformers -->
        <section class="docs-section" id="transformers">
            <h2 class="docs-section-title">Data Transformers</h2>
            <p>Transformers allow you to modify data after it's fetched from any data source (SQL, API, Callback, or Static) but before it's rendered as a chart. This is useful for data aggregation, calculations, formatting, or any custom processing.</p>

            <h3>How Transformers Work</h3>
            <p>The data flow is: <code>DataSource::fetch()</code> → <code>GraphRenderer::applyTransformer()</code> → <code>GraphRenderer::buildEChartsOption()</code></p>

            <div class="docs-note">
                <strong>Key Method:</strong> The <code>applyTransformer()</code> method in <code>GraphRenderer.php</code> is where all data passes through after being fetched from any source.
            </div>

            <h3>Configuring a Transformer</h3>
            <p>In the data source configuration, specify a transformer class and method:</p>

            <table class="docs-table">
                <thead>
                    <tr>
                        <th>Field</th>
                        <th>Description</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td><strong>transformer_class</strong></td>
                        <td>Fully qualified class name (e.g., <code>App\Transformers\SalesTransformer</code>)</td>
                    </tr>
                    <tr>
                        <td><strong>transformer_method</strong></td>
                        <td>Static method name to call (e.g., <code>aggregateByMonth</code>)</td>
                    </tr>
                </tbody>
            </table>

            <h3>Example Transformer Class</h3>
            <pre><code class="language-php">&lt;?php
namespace App\Transformers;

class SalesTransformer
{
    /**
     * Aggregate daily data into monthly totals
     *
     * @param array $data Raw data from data source
     * @param array $config Graph configuration (optional context)
     * @return array Transformed data
     */
    public static function aggregateByMonth($data, $config = array())
    {
        $monthly = array();

        foreach ($data as $row) {
            $month = date('Y-m', strtotime($row['date']));
            if (!isset($monthly[$month])) {
                $monthly[$month] = array('month' => $month, 'sales' => 0, 'orders' => 0);
            }
            $monthly[$month]['sales'] += $row['amount'];
            $monthly[$month]['orders'] += 1;
        }

        return array_values($monthly);
    }

    /**
     * Add calculated fields
     */
    public static function addProfitMargin($data, $config = array())
    {
        foreach ($data as &$row) {
            if (isset($row['revenue']) && isset($row['cost'])) {
                $row['profit'] = $row['revenue'] - $row['cost'];
                $row['margin'] = $row['revenue'] > 0
                    ? round(($row['profit'] / $row['revenue']) * 100, 2)
                    : 0;
            }
        }
        return $data;
    }

    /**
     * Filter and sort data
     */
    public static function topTenByRevenue($data, $config = array())
    {
        usort($data, function($a, $b) {
            return $b['revenue'] - $a['revenue'];
        });
        return array_slice($data, 0, 10);
    }
}</code></pre>

            <h3>Use Cases</h3>
            <ul class="docs-list">
                <li><strong>Aggregation:</strong> Sum daily records into weekly/monthly totals</li>
                <li><strong>Calculations:</strong> Add computed fields (profit margins, percentages, averages)</li>
                <li><strong>Filtering:</strong> Apply complex business logic filters</li>
                <li><strong>Formatting:</strong> Format dates, numbers, or text for display</li>
                <li><strong>Sorting:</strong> Custom sort orders not possible in SQL</li>
                <li><strong>Joining:</strong> Combine data from the source with other lookups</li>
            </ul>

            <div class="docs-note docs-note--warning">
                <strong>Security:</strong> Like callbacks, transformer classes must be in the <code>allowed_callback_namespaces</code> configured in <code>graph_builder.php</code>.
            </div>
        </section>

        <!-- Runtime Filters -->
        <section class="docs-section" id="filters">
            <h2 class="docs-section-title">Runtime Filters</h2>
            <p>Filters allow dynamic data filtering at render time without modifying saved configurations.</p>

            <h3>Filter Format</h3>
            <pre><code class="language-php">$filters = [
    ['column' => 'year', 'operator' => '=', 'value' => 2024],
    ['column' => 'region', 'operator' => 'IN', 'value' => ['north', 'south']],
    ['column' => 'created_at', 'operator' => 'BETWEEN', 'value' => ['2024-01-01', '2024-12-31']],
    ['column' => 'name', 'operator' => 'LIKE', 'value' => 'John'],
    ['column' => 'deleted_at', 'operator' => 'IS NULL', 'value' => true],
];</code></pre>

            <h3>Supported Operators</h3>
            <table class="docs-table">
                <thead>
                    <tr>
                        <th>Operator</th>
                        <th>Description</th>
                        <th>Value Format</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td><code>=</code></td>
                        <td>Equals</td>
                        <td>Single value</td>
                    </tr>
                    <tr>
                        <td><code>!=</code> or <code>&lt;&gt;</code></td>
                        <td>Not equals</td>
                        <td>Single value</td>
                    </tr>
                    <tr>
                        <td><code>&gt;</code> <code>&lt;</code> <code>&gt;=</code> <code>&lt;=</code></td>
                        <td>Comparison</td>
                        <td>Single value</td>
                    </tr>
                    <tr>
                        <td><code>LIKE</code></td>
                        <td>Pattern match (adds % wildcards)</td>
                        <td>String</td>
                    </tr>
                    <tr>
                        <td><code>NOT LIKE</code></td>
                        <td>Negative pattern match</td>
                        <td>String</td>
                    </tr>
                    <tr>
                        <td><code>IN</code></td>
                        <td>Value in list</td>
                        <td>Array or comma-separated</td>
                    </tr>
                    <tr>
                        <td><code>NOT IN</code></td>
                        <td>Value not in list</td>
                        <td>Array or comma-separated</td>
                    </tr>
                    <tr>
                        <td><code>BETWEEN</code></td>
                        <td>Range (inclusive)</td>
                        <td>Array [min, max]</td>
                    </tr>
                    <tr>
                        <td><code>IS NULL</code></td>
                        <td>Null check</td>
                        <td>true (ignored)</td>
                    </tr>
                    <tr>
                        <td><code>IS NOT NULL</code></td>
                        <td>Not null check</td>
                        <td>true (ignored)</td>
                    </tr>
                </tbody>
            </table>
        </section>

        <!-- PHP Integration -->
        <section class="docs-section" id="php-integration">
            <h2 class="docs-section-title">PHP Integration</h2>
            <p>Render saved graphs directly in your PHP application.</p>

            <h3>Basic Usage</h3>
            <pre><code class="language-php">&lt;?php
require_once '/path/to/graph_builder/api/config/database.php';
require_once '/path/to/graph_builder/classes/GraphRenderer.php';

// Get database connection
$db = Database::getInstance();
$pdo = $db->getConnection();

// Create renderer
$renderer = new GraphRenderer($pdo);

// Render by slug (or ID)
$result = $renderer->render('monthly-sales');

// Access the result
$echartsOption = $result['echartsOption'];  // Ready for ECharts
$rawData = $result['data'];                 // Raw data array
$chartType = $result['chartType'];          // 'line', 'bar', 'pie'</code></pre>

            <h3>With Runtime Filters</h3>
            <pre><code class="language-php">&lt;?php
$filters = [
    ['column' => 'year', 'operator' => '=', 'value' => $_GET['year']],
    ['column' => 'department', 'operator' => 'IN', 'value' => ['sales', 'marketing']]
];

$result = $renderer->render('sales-report', $filters);

// Output for JavaScript
echo '&lt;script&gt;';
echo 'const chartOption = ' . json_encode($result['echartsOption']) . ';';
echo 'echarts.init(document.getElementById("chart")).setOption(chartOption);';
echo '&lt;/script&gt;';</code></pre>

            <h3>Get Raw Data Only</h3>
            <pre><code class="language-php">&lt;?php
// Get just the data without ECharts option
$data = $renderer->getData('monthly-sales', $filters);

// Process data as needed
foreach ($data as $row) {
    echo $row['month'] . ': ' . $row['sales'] . "\n";
}</code></pre>
        </section>

        <!-- JavaScript Integration -->
        <section class="docs-section" id="js-integration">
            <h2 class="docs-section-title">JavaScript Integration</h2>
            <p>Fetch and render graphs via the REST API.</p>

            <h3>Basic Fetch</h3>
            <pre><code class="language-javascript">// Fetch by slug
const response = await fetch('/graph_builder/api/graphs/render.php?slug=monthly-sales');
const result = await response.json();

if (result.success) {
    const chart = echarts.init(document.getElementById('chart'));
    chart.setOption(result.echartsOption);
}</code></pre>

            <h3>With Runtime Filters (POST)</h3>
            <pre><code class="language-javascript">const response = await fetch('/graph_builder/api/graphs/render.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        slug: 'monthly-sales',
        filters: [
            { column: 'year', operator: '=', value: 2024 },
            { column: 'region', operator: 'IN', value: ['north', 'south'] }
        ]
    })
});

const result = await response.json();

if (result.success) {
    console.log('Rows:', result.rowCount);
    console.log('Data:', result.data);

    const chart = echarts.init(document.getElementById('chart'));
    chart.setOption(result.echartsOption);
}</code></pre>

            <h3>With Filters (GET)</h3>
            <pre><code class="language-javascript">// Build query string with filters
const params = new URLSearchParams({
    slug: 'monthly-sales',
    'filters[0][column]': 'year',
    'filters[0][operator]': '=',
    'filters[0][value]': '2024'
});

const response = await fetch(`/graph_builder/api/graphs/render.php?${params}`);
const result = await response.json();</code></pre>
        </section>

        <!-- API Reference -->
        <section class="docs-section" id="api-reference">
            <h2 class="docs-section-title">API Reference</h2>

            <h3>POST /api/graphs/save.php</h3>
            <p>Save a new graph configuration or update existing.</p>
            <pre><code class="language-json">// Request Body
{
    "id": null,                    // null for new, ID for update
    "name": "Monthly Sales",
    "slug": "monthly-sales",       // auto-generated if omitted
    "description": "Optional",
    "chartType": "bar",
    "configBase": {
        "title": "Monthly Sales Report",
        "showLegend": true,
        "animation": true,
        "colors": ["#5376df", "#5bd123"]
    },
    "configType": {
        "stacked": false,
        "barWidth": 60
    },
    "dataMapping": {
        "xAxis": "month",
        "yAxis": ["sales", "revenue"]
    },
    "dataSource": {
        "type": "sql",
        "query": "SELECT month, sales, revenue FROM reports {{WHERE}}"
    }
}

// Response
{
    "success": true,
    "id": 1,
    "slug": "monthly-sales"
}</code></pre>

            <h3>GET /api/graphs/list.php</h3>
            <p>List all saved graphs.</p>
            <pre><code class="language-json">// Response
{
    "success": true,
    "data": [
        {
            "id": 1,
            "slug": "monthly-sales",
            "name": "Monthly Sales",
            "chartType": "bar",
            "sourceType": "sql",
            "createdAt": "2024-01-15 10:30:00"
        }
    ],
    "count": 1
}</code></pre>

            <h3>GET /api/graphs/get.php?id=1</h3>
            <p>Get a single graph configuration.</p>
            <pre><code class="language-json">// Response
{
    "success": true,
    "data": {
        "id": 1,
        "slug": "monthly-sales",
        "name": "Monthly Sales",
        "chartType": "bar",
        "configBase": {...},
        "configType": {...},
        "dataMapping": {...},
        "dataSource": {...}
    }
}</code></pre>

            <h3>GET/POST /api/graphs/render.php</h3>
            <p>Render a graph with optional filters. Returns ECharts option and raw data.</p>
            <pre><code class="language-json">// GET: ?slug=monthly-sales
// POST: {"slug": "monthly-sales", "filters": [...]}

// Response
{
    "success": true,
    "id": 1,
    "slug": "monthly-sales",
    "name": "Monthly Sales",
    "chartType": "bar",
    "data": [
        {"month": "Jan", "sales": 120, "revenue": 80},
        {"month": "Feb", "sales": 150, "revenue": 95}
    ],
    "echartsOption": {
        "xAxis": {"type": "category", "data": ["Jan", "Feb"]},
        "yAxis": {"type": "value"},
        "series": [...]
    },
    "rowCount": 2
}</code></pre>

            <h3>POST /api/graphs/delete.php</h3>
            <p>Delete a graph (soft delete - sets state to inactive).</p>
            <pre><code class="language-json">// Request
{"id": 1}

// Response
{"success": true}</code></pre>
        </section>

        <!-- Configuration -->
        <section class="docs-section" id="configuration">
            <h2 class="docs-section-title">Configuration</h2>

            <h3>Data Mapping</h3>
            <p>Mapping defines how your data fields map to chart axes.</p>

            <h4>Line & Bar Charts</h4>
            <pre><code class="language-json">{
    "xAxis": "month",           // Field for X-axis categories
    "yAxis": ["sales", "revenue"] // Field(s) for Y-axis values
}</code></pre>

            <h4>Pie Charts</h4>
            <pre><code class="language-json">{
    "nameField": "category",    // Field for slice labels
    "valueField": "amount"      // Field for slice values
}</code></pre>

            <h3>Chart Type Options</h3>

            <h4>Line Chart Options</h4>
            <pre><code class="language-json">{
    "smooth": true,         // Smooth curves
    "areaStyle": true,      // Fill area under line
    "showSymbol": true,     // Show data point markers
    "symbolSize": 6,        // Marker size
    "lineWidth": 2,         // Line thickness
    "step": "middle"        // Step line: "start", "middle", "end", or false
}</code></pre>

            <h4>Bar Chart Options</h4>
            <pre><code class="language-json">{
    "stacked": true,        // Stack multiple series
    "barWidth": 60,         // Bar width (px or %)
    "borderRadius": 4,      // Bar corner radius
    "horizontal": false     // Horizontal bars
}</code></pre>

            <h4>Pie Chart Options</h4>
            <pre><code class="language-json">{
    "radius": 70,           // Outer radius %
    "innerRadius": 40,      // Inner radius % (for donut)
    "roseType": "radius",   // "radius", "area", or false
    "showLabels": true,     // Show slice labels
    "labelPosition": "outside", // "inside" or "outside"
    "padAngle": 2,          // Gap between slices (degrees)
    "borderRadius": 4       // Slice corner radius
}</code></pre>
        </section>

        <!-- Security -->
        <section class="docs-section" id="security">
            <h2 class="docs-section-title">Security</h2>

            <h3>SQL Injection Protection</h3>
            <ul class="docs-list">
                <li>All filter values use parameterized queries (PDO prepared statements)</li>
                <li>Column names are sanitized to allow only alphanumeric, underscore, dot, and backticks</li>
                <li>Operators are validated against a whitelist</li>
            </ul>

            <h3>Callback Security</h3>
            <ul class="docs-list">
                <li>Only classes in <code>allowed_callback_namespaces</code> can be executed</li>
                <li>Configure in <code>api/config/graph_builder.php</code></li>
                <li>If no namespaces configured, all classes are allowed (development mode)</li>
            </ul>

            <pre><code class="language-php">// api/config/graph_builder.php
return [
    'security' => [
        'allowed_callback_namespaces' => [
            'App\\Charts\\',
            'App\\Reports\\',
            'MyCompany\\Data\\',
        ],
    ],
];</code></pre>

            <h3>API Security</h3>
            <ul class="docs-list">
                <li>CORS headers are set - configure for your domain in production</li>
                <li>Input validation on all API endpoints</li>
                <li>Error messages don't expose sensitive database information</li>
            </ul>

            <div class="docs-note docs-note--warning">
                <strong>Production Recommendations:</strong>
                <ul>
                    <li>Restrict CORS to your domain</li>
                    <li>Add authentication to save/delete endpoints</li>
                    <li>Configure allowed callback namespaces</li>
                    <li>Use HTTPS</li>
                </ul>
            </div>
        </section>
            </main>
        </div>

        <!-- Footer -->
        <footer class="usage-footer">
            <div class="docs-footer-links">
                <a href="<?= get_base_path() ?>/" class="usage-cta">
                    Open Graph Builder
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
                        <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                </a>
                <a href="<?= get_base_path() ?>/usage/" class="usage-back-link">
                    View Usage Examples
                </a>
                <a href="<?= get_base_path() ?>/?urlq=graph/list" class="usage-back-link">
                    Saved Graphs
                </a>
            </div>
        </footer>
    </div>

    <!-- Highlight.js -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/languages/json.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/languages/php.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/languages/sql.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/languages/javascript.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/languages/bash.min.js"></script>
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
            const lightSheet = document.getElementById('hljs-light');
            const darkSheet = document.getElementById('hljs-dark');

            let isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

            document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
            if (lightSheet) lightSheet.disabled = isDark;
            if (darkSheet) darkSheet.disabled = !isDark;
        }

        function updateThemeButtons(theme) {
            document.querySelectorAll('.gb-theme-btn').forEach(btn => {
                btn.classList.toggle('gb-theme-btn--active', btn.dataset.theme === theme);
            });
        }

        // Smooth scroll for TOC links
        document.querySelectorAll('.docs-toc a').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const target = document.querySelector(link.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                    history.pushState(null, null, link.getAttribute('href'));
                }
            });
        });

        // Active section highlighting
        function initScrollSpy() {
            const sections = document.querySelectorAll('.docs-section[id]');
            const tocLinks = document.querySelectorAll('.docs-toc a');

            const observerOptions = {
                root: null,
                rootMargin: '-80px 0px -70% 0px',
                threshold: 0
            };

            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const id = entry.target.getAttribute('id');
                        setActiveLink(id);
                    }
                });
            }, observerOptions);

            sections.forEach(section => observer.observe(section));

            function setActiveLink(id) {
                tocLinks.forEach(link => {
                    link.classList.remove('docs-toc-active');
                    if (link.getAttribute('href') === '#' + id) {
                        link.classList.add('docs-toc-active');
                        // Also highlight parent if this is a nested item
                        const parentLi = link.closest('ul').closest('li');
                        if (parentLi) {
                            const parentLink = parentLi.querySelector(':scope > a');
                            if (parentLink) parentLink.classList.add('docs-toc-active');
                        }
                    }
                });
            }

            // Set initial active based on hash or first section
            if (window.location.hash) {
                setActiveLink(window.location.hash.slice(1));
            } else if (sections.length > 0) {
                setActiveLink(sections[0].getAttribute('id'));
            }
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

            hljs.highlightAll();
            initScrollSpy();
        });
    </script>
</body>

</html>