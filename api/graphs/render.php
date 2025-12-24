<?php
/**
 * Render Graph API
 *
 * GET/POST: Render a graph with optional runtime filters
 * Returns ECharts option and raw data
 * PHP 5.4 compatible
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

require_once dirname(dirname(__FILE__)) . '/config/database.php';
require_once dirname(dirname(dirname(__FILE__))) . '/classes/GraphRenderer.php';

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

// Parse input based on method
$identifier = null;
$filters = array();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // GET: use query params
    if (isset($_GET['id'])) {
        $identifier = $_GET['id'];
    } elseif (isset($_GET['slug'])) {
        $identifier = $_GET['slug'];
    }

    // Parse filters from query string (format: filters[0][column]=x&filters[0][operator]==&filters[0][value]=y)
    if (isset($_GET['filters']) && is_array($_GET['filters'])) {
        $filters = $_GET['filters'];
    }

} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // POST: use JSON body
    $input = json_decode(file_get_contents('php://input'), true);

    if (json_last_error() !== JSON_ERROR_NONE) {
        sendError('Invalid JSON input');
    }

    if (isset($input['id'])) {
        $identifier = $input['id'];
    } elseif (isset($input['slug'])) {
        $identifier = $input['slug'];
    }

    if (isset($input['filters']) && is_array($input['filters'])) {
        $filters = $input['filters'];
    }

} else {
    sendError('Method not allowed', 405);
}

if ($identifier === null || $identifier === '') {
    sendError('Graph ID or slug is required');
}

// Validate filters format
foreach ($filters as $index => $filter) {
    if (!is_array($filter)) {
        sendError("Filter at index {$index} must be an object");
    }
    if (!isset($filter['column']) || empty($filter['column'])) {
        sendError("Filter at index {$index} must have a 'column' field");
    }
}

try {
    $db = Database::getInstance();
    $pdo = $db->getConnection();

    $renderer = new GraphRenderer($pdo);
    $result = $renderer->render($identifier, $filters);

    if (!$result) {
        sendError('Graph not found', 404);
    }

    sendResponse(array(
        'success' => true,
        'id' => $result['id'],
        'slug' => $result['slug'],
        'name' => $result['name'],
        'chartType' => $result['chartType'],
        'data' => $result['data'],
        'echartsOption' => $result['echartsOption'],
        'config' => $result['config'],
        'rowCount' => count($result['data'])
    ));

} catch (PDOException $e) {
    sendError('Database error: ' . $e->getMessage(), 500);
} catch (Exception $e) {
    sendError($e->getMessage(), 500);
}
