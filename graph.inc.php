<?php
/**
 * Graph Builder Controller
 * Handles all graph builder routes and API actions
 *
 * URL Routes:
 * - ?urlq=graph/view         -> Main graph builder UI
 * - ?urlq=graph/view/123     -> View saved graph
 * - ?urlq=graph/list         -> List saved graphs page
 * - ?urlq=graph/edit/123     -> Edit existing graph
 *
 * POST Actions (via $_POST['submit']):
 * - graph-save, graph-delete, graph-render, query-execute, etc.
 */

// Include required classes
require_once __DIR__ . '/includes/utility.php';
require_once __DIR__ . '/api/config/database.php';
require_once __DIR__ . '/classes/GraphConfig.php';
require_once __DIR__ . '/classes/DataSourceFactory.php';
require_once __DIR__ . '/classes/GraphRenderer.php';

// Parse URL segments (your framework provides $url, or parse manually)
if (!isset($url)) {
    $url = isset($_GET['urlq']) ? explode('/', $_GET['urlq']) : array('graph', 'view');
}
$url[1] = isset($url[1]) ? $url[1] : 'view';
$url[2] = isset($url[2]) ? $url[2] : null;

// Handle POST submissions
if (isset($_POST['submit'])) {
    switch ($_POST['submit']) {
        case "graph-save":
            graph_save($_POST);
            break;
        case "graph-delete":
            graph_delete($_POST);
            break;
        case "graph-render":
            graph_render($_POST);
            break;
        case "query-execute":
            query_execute($_POST);
            break;
        case "schema-tables":
            schema_tables($_POST);
            break;
        case "schema-fields":
            schema_fields($_POST);
            break;
        case "graphs-list-ajax":
            graphs_list_ajax($_POST);
            break;
        case "graph-get":
            graph_get($_POST);
            break;
    }
}

// Handle URL routes (GET requests - page loads)
switch ($url[1]) {
    case "view":
        if (isset($url[2]) && is_numeric($url[2])) {
            // View specific graph: ?urlq=graph/view/123
            $_GET['id'] = $url[2];
            include __DIR__ . '/graphs/view.php';
        } else {
            // Main builder UI: ?urlq=graph/view
            // Unset urlq to prevent infinite loop when including index.php
            unset($_GET['urlq']);
            include __DIR__ . '/index.php';
        }
        break;
    case "list":
        // Show saved graphs list
        include __DIR__ . '/graphs/index.php';
        break;
    case "edit":
        // Edit mode - pass ID to builder
        $_GET['edit'] = $url[2];
        // Unset urlq to prevent infinite loop when including index.php
        unset($_GET['urlq']);
        include __DIR__ . '/index.php';
        break;
    default:
        ScreenMessage::setMessage("The url you entered is not valid", ScreenMessage::MESSAGE_TYPE_INFO);
        System::redirectInternal("403");
        break;
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * Helper: Decode JSON fields from FormData
 *
 * @param array $data Reference to data array
 * @param array $fields Fields to decode
 */
function decode_json_fields(&$data, $fields)
{
    foreach ($fields as $field) {
        if (isset($data[$field]) && is_string($data[$field])) {
            $decoded = json_decode($data[$field], true);
            if (json_last_error() === JSON_ERROR_NONE) {
                $data[$field] = $decoded;
            }
        }
    }
}

/**
 * Save/update graph configuration
 *
 * @param array $data POST data
 */
function graph_save($data)
{
    // Decode JSON fields sent via FormData
    decode_json_fields($data, array('configBase', 'configType', 'dataMapping', 'dataSource'));

    // Validate required fields
    $required = array('name', 'chartType', 'configBase', 'configType', 'dataMapping', 'dataSource');
    foreach ($required as $field) {
        if (!isset($data[$field]) || (is_string($data[$field]) && trim($data[$field]) === '')) {
            Utility::ajaxResponseFalse("Field '{$field}' is required");
        }
    }

    // Validate dataSource type
    if (!isset($data['dataSource']['type'])) {
        Utility::ajaxResponseFalse('Data source type is required');
    }

    // Only SQL data source is supported
    if ($data['dataSource']['type'] !== 'sql') {
        Utility::ajaxResponseFalse('Only SQL data source type is supported');
    }

    // Validate chartType
    $validChartTypes = array('line', 'bar', 'pie');
    if (!in_array($data['chartType'], $validChartTypes)) {
        Utility::ajaxResponseFalse('Invalid chart type. Must be: line, bar, or pie');
    }

    try {
        $db = Database::getInstance();
        $pdo = $db->getConnection();
        $graphConfig = new GraphConfig($pdo);

        if (isset($data['id']) && is_numeric($data['id'])) {
            $id = (int) $data['id'];
            $graphConfig->update($id, $data);
            Utility::ajaxResponseTrue("Graph updated successfully", array('id' => $id));
        } else {
            $id = $graphConfig->create($data);
            Utility::ajaxResponseTrue("Graph saved successfully", array('id' => $id));
        }
    } catch (Exception $e) {
        Utility::ajaxResponseFalse('Database error: ' . $e->getMessage());
    }
}

/**
 * Delete graph (soft delete)
 *
 * @param array $data POST data
 */
function graph_delete($data)
{
    if (!isset($data['id']) || !is_numeric($data['id'])) {
        Utility::ajaxResponseFalse('Invalid graph ID');
    }

    try {
        $db = Database::getInstance();
        $pdo = $db->getConnection();
        $graphConfig = new GraphConfig($pdo);
        $graphConfig->delete((int) $data['id']);
        Utility::ajaxResponseTrue("Graph deleted successfully");
    } catch (Exception $e) {
        Utility::ajaxResponseFalse('Failed to delete graph: ' . $e->getMessage());
    }
}

/**
 * Get single graph data
 *
 * @param array $data POST data
 */
function graph_get($data)
{
    try {
        $db = Database::getInstance();
        $pdo = $db->getConnection();
        $graphConfig = new GraphConfig($pdo);

        if (isset($data['id']) && is_numeric($data['id'])) {
            $graph = $graphConfig->get((int) $data['id']);
        } elseif (isset($data['slug'])) {
            $graph = $graphConfig->get($data['slug']);
        } else {
            Utility::ajaxResponseFalse('ID or slug required');
        }

        if (!$graph) {
            Utility::ajaxResponseFalse('Graph not found');
        }

        // Transform to camelCase for frontend
        $response = array(
            'id' => $graph['gbc_id'],
            'slug' => $graph['slug'],
            'name' => $graph['name'],
            'description' => $graph['description'],
            'chartType' => $graph['chart_type'],
            'configBase' => $graph['config_base'],
            'configType' => $graph['config_type'],
            'dataMapping' => $graph['data_mapping'],
            'dataSource' => array(
                'type' => $graph['source_type'],
                'query' => $graph['sql_query'],
                'apiUrl' => $graph['api_url'],
                'apiMethod' => $graph['api_method'],
                'apiHeaders' => $graph['api_headers'],
                'apiBody' => $graph['api_body'],
                'apiDataPath' => $graph['api_data_path'],
                'callbackClass' => $graph['callback_class'],
                'callbackMethod' => $graph['callback_method'],
                'callbackParams' => $graph['callback_params'],
                'staticData' => $graph['static_data'],
                'cacheTtl' => $graph['cache_ttl']
            ),
            'createdAt' => $graph['created_ts'],
            'updatedAt' => $graph['updated_ts']
        );

        Utility::ajaxResponseTrue("Graph loaded", $response);
    } catch (Exception $e) {
        Utility::ajaxResponseFalse($e->getMessage());
    }
}

/**
 * List graphs with filters
 *
 * @param array $data POST data
 */
function graphs_list_ajax($data)
{
    try {
        $db = Database::getInstance();
        $pdo = $db->getConnection();
        $graphConfig = new GraphConfig($pdo);

        $params = array(
            'chartType' => isset($data['chartType']) ? $data['chartType'] : null,
            'search' => isset($data['search']) ? $data['search'] : null,
            'limit' => isset($data['limit']) ? (int) $data['limit'] : 50,
            'offset' => isset($data['offset']) ? (int) $data['offset'] : 0
        );

        $result = $graphConfig->listAll($params);
        Utility::ajaxResponseTrue("Graphs loaded", $result);
    } catch (Exception $e) {
        Utility::ajaxResponseFalse($e->getMessage());
    }
}

/**
 * Execute SQL query
 *
 * @param array $data POST data
 */
function query_execute($data)
{
    if (!isset($data['sql']) || trim($data['sql']) === '') {
        Utility::ajaxResponseFalse('SQL query is required');
    }

    try {
        $db = Database::getInstance();
        $pdo = $db->getConnection();

        $sql = trim($data['sql']);

        // Security: Only allow SELECT queries
        if (!preg_match('/^\s*SELECT\s/i', $sql)) {
            Utility::ajaxResponseFalse('Only SELECT queries are allowed');
        }

        // Check for dangerous patterns
        $dangerous = array('DROP', 'DELETE', 'UPDATE', 'INSERT', 'ALTER', 'TRUNCATE', 'CREATE', 'GRANT', 'REVOKE');
        foreach ($dangerous as $keyword) {
            if (preg_match('/\b' . $keyword . '\b/i', $sql)) {
                Utility::ajaxResponseFalse("Keyword '$keyword' is not allowed in queries");
            }
        }

        $stmt = $pdo->prepare($sql);
        $stmt->execute();

        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $columns = array();
        if (count($rows) > 0) {
            $columns = array_keys($rows[0]);
        }

        Utility::ajaxResponseTrue("Query executed", array(
            'data' => $rows,
            'columns' => $columns,
            'rowCount' => count($rows)
        ));
    } catch (PDOException $e) {
        Utility::ajaxResponseFalse('Query error: ' . $e->getMessage());
    }
}

/**
 * Render graph with runtime filters
 *
 * @param array $data POST data
 */
function graph_render($data)
{
    decode_json_fields($data, array('filters'));

    try {
        $db = Database::getInstance();
        $pdo = $db->getConnection();

        // Determine identifier
        $identifier = null;
        if (isset($data['id']) && is_numeric($data['id'])) {
            $identifier = (int) $data['id'];
        } elseif (isset($data['slug'])) {
            $identifier = $data['slug'];
        } else {
            Utility::ajaxResponseFalse('ID or slug required');
        }

        // Use GraphRenderer to render the graph
        $renderer = new GraphRenderer($pdo);
        $filters = isset($data['filters']) ? $data['filters'] : array();
        $result = $renderer->render($identifier, $filters);

        if (!$result) {
            Utility::ajaxResponseFalse('Graph not found');
        }

        Utility::ajaxResponseTrue("Graph rendered", $result);
    } catch (Exception $e) {
        Utility::ajaxResponseFalse($e->getMessage());
    }
}

/**
 * Get database tables
 *
 * @param array $data POST data
 */
function schema_tables($data)
{
    try {
        $db = Database::getInstance();
        $pdo = $db->getConnection();

        // Get database name
        $dbNameStmt = $pdo->query("SELECT DATABASE()");
        $database = $dbNameStmt->fetchColumn();

        // Get search filter
        $search = isset($data['search']) ? trim($data['search']) : '';

        // Get tables with row counts
        $sql = "SELECT
                    TABLE_NAME as name,
                    TABLE_ROWS as row_count
                FROM information_schema.TABLES
                WHERE TABLE_SCHEMA = DATABASE()";

        if ($search !== '') {
            $sql .= " AND TABLE_NAME LIKE :search";
        }

        $sql .= " ORDER BY TABLE_NAME";

        $stmt = $pdo->prepare($sql);
        if ($search !== '') {
            $stmt->bindValue(':search', '%' . $search . '%');
        }
        $stmt->execute();
        $tables = $stmt->fetchAll(PDO::FETCH_ASSOC);

        Utility::ajaxResponseTrue("Tables loaded", array(
            'database' => $database,
            'tables' => $tables
        ));
    } catch (Exception $e) {
        Utility::ajaxResponseFalse($e->getMessage());
    }
}

/**
 * Get table fields/columns
 *
 * @param array $data POST data
 */
function schema_fields($data)
{
    if (!isset($data['table']) || trim($data['table']) === '') {
        Utility::ajaxResponseFalse('Table name is required');
    }

    try {
        $db = Database::getInstance();
        $pdo = $db->getConnection();

        // Sanitize table name
        $table = preg_replace('/[^a-zA-Z0-9_]/', '', $data['table']);

        // Get column details from information_schema
        $sql = "SELECT
                    COLUMN_NAME as name,
                    DATA_TYPE as type,
                    COLUMN_TYPE as fullType,
                    IS_NULLABLE as nullable,
                    COLUMN_KEY as columnKey,
                    COLUMN_DEFAULT as defaultValue,
                    EXTRA as extra,
                    COLUMN_COMMENT as comment
                FROM information_schema.COLUMNS
                WHERE TABLE_SCHEMA = DATABASE()
                AND TABLE_NAME = :table
                ORDER BY ORDINAL_POSITION";

        $stmt = $pdo->prepare($sql);
        $stmt->bindValue(':table', $table);
        $stmt->execute();
        $rawFields = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Process fields to add category and flags
        $fields = array();
        foreach ($rawFields as $field) {
            $category = getFieldCategory($field['type']);
            $fields[] = array(
                'name' => $field['name'],
                'type' => $field['type'],
                'fullType' => $field['fullType'],
                'category' => $category,
                'nullable' => $field['nullable'] === 'YES',
                'isPrimary' => $field['columnKey'] === 'PRI',
                'isUnique' => $field['columnKey'] === 'UNI',
                'isIndex' => $field['columnKey'] === 'MUL',
                'defaultValue' => $field['defaultValue'],
                'extra' => $field['extra'],
                'comment' => $field['comment']
            );
        }

        Utility::ajaxResponseTrue("Fields loaded", array('fields' => $fields));
    } catch (Exception $e) {
        Utility::ajaxResponseFalse($e->getMessage());
    }
}

/**
 * Get field category based on data type
 *
 * @param string $type MySQL data type
 * @return string Category: number, string, date, json
 */
function getFieldCategory($type)
{
    $type = strtolower($type);

    $numberTypes = array('int', 'tinyint', 'smallint', 'mediumint', 'bigint', 'decimal', 'float', 'double', 'numeric');
    $dateTypes = array('date', 'datetime', 'timestamp', 'time', 'year');
    $jsonTypes = array('json');

    if (in_array($type, $numberTypes)) {
        return 'number';
    }
    if (in_array($type, $dateTypes)) {
        return 'date';
    }
    if (in_array($type, $jsonTypes)) {
        return 'json';
    }

    return 'string';
}
