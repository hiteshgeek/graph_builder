<?php
/**
 * Get Single Graph Configuration API
 *
 * GET: Get a graph by ID or slug
 * PHP 5.4 compatible
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

require_once dirname(dirname(__FILE__)) . '/config/database.php';
require_once dirname(dirname(dirname(__FILE__))) . '/classes/GraphConfig.php';

/**
 * Send JSON response
 *
 * @param array $data Response data
 * @param int $code HTTP status code
 */
function sendResponse($data, $code = 200)
{
    http_response_code($code);
    echo json_encode($data);
    exit;
}

/**
 * Send error response
 *
 * @param string $message Error message
 * @param int $code HTTP status code
 */
function sendError($message, $code = 400)
{
    sendResponse(array('success' => false, 'error' => $message), $code);
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendError('Method not allowed', 405);
}

// Get identifier (id or slug)
$identifier = null;
if (isset($_GET['id'])) {
    $identifier = $_GET['id'];
} elseif (isset($_GET['slug'])) {
    $identifier = $_GET['slug'];
}

if ($identifier === null || $identifier === '') {
    sendError('Graph ID or slug is required');
}

try {
    $db = Database::getInstance();
    $pdo = $db->getConnection();

    $graphConfig = new GraphConfig($pdo);
    $graph = $graphConfig->get($identifier);

    if (!$graph) {
        sendError('Graph not found', 404);
    }

    // Format response
    $response = array(
        'id' => $graph['graph_id'],
        'slug' => $graph['slug'],
        'name' => $graph['name'],
        'description' => $graph['description'],
        'chartType' => $graph['chart_type'],
        'configBase' => $graph['config_base'],
        'configType' => $graph['config_type'],
        'dataMapping' => $graph['data_mapping'],
        'dataSource' => array(
            'id' => $graph['data_source_id'],
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
            'transformerClass' => $graph['transformer_class'],
            'transformerMethod' => $graph['transformer_method'],
            'cacheTtl' => $graph['cache_ttl']
        ),
        'createdAt' => $graph['created_ts'],
        'updatedAt' => $graph['updated_ts']
    );

    sendResponse(array(
        'success' => true,
        'data' => $response
    ));

} catch (PDOException $e) {
    sendError('Database error: ' . $e->getMessage(), 500);
} catch (Exception $e) {
    sendError($e->getMessage(), 500);
}
