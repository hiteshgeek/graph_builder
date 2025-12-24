<?php
/**
 * List Graph Configurations API
 *
 * GET: List all saved graphs with optional filters
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

try {
    $db = Database::getInstance();
    $pdo = $db->getConnection();

    $graphConfig = new GraphConfig($pdo);

    // Build options from query params
    $options = array();

    if (isset($_GET['chartType']) && !empty($_GET['chartType'])) {
        $options['chartType'] = $_GET['chartType'];
    }

    if (isset($_GET['search']) && !empty($_GET['search'])) {
        $options['search'] = $_GET['search'];
    }

    if (isset($_GET['limit'])) {
        $options['limit'] = (int) $_GET['limit'];
    }

    if (isset($_GET['offset'])) {
        $options['offset'] = (int) $_GET['offset'];
    }

    // Get graphs and total count
    $graphs = $graphConfig->listAll($options);
    $total = $graphConfig->count($options);

    sendResponse(array(
        'success' => true,
        'data' => $graphs,
        'total' => $total,
        'limit' => isset($options['limit']) ? $options['limit'] : 50,
        'offset' => isset($options['offset']) ? $options['offset'] : 0
    ));

} catch (PDOException $e) {
    sendError('Database error: ' . $e->getMessage(), 500);
} catch (Exception $e) {
    sendError($e->getMessage(), 500);
}
