<?php
/**
 * Delete Graph Configuration API
 *
 * POST: Soft delete a graph by ID
 * PHP 5.4 compatible
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
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

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendError('Method not allowed', 405);
}

$input = json_decode(file_get_contents('php://input'), true);

if (json_last_error() !== JSON_ERROR_NONE) {
    sendError('Invalid JSON input');
}

if (!isset($input['id']) || !is_numeric($input['id'])) {
    sendError('Graph ID is required');
}

$id = (int) $input['id'];

try {
    $db = Database::getInstance();
    $pdo = $db->getConnection();

    $graphConfig = new GraphConfig($pdo);

    // Check if graph exists
    $graph = $graphConfig->get($id);
    if (!$graph) {
        sendError('Graph not found', 404);
    }

    // Soft delete
    $result = $graphConfig->delete($id);

    if ($result) {
        sendResponse(array(
            'success' => true,
            'message' => 'Graph deleted successfully'
        ));
    } else {
        sendError('Failed to delete graph', 500);
    }

} catch (PDOException $e) {
    sendError('Database error: ' . $e->getMessage(), 500);
} catch (Exception $e) {
    sendError($e->getMessage(), 500);
}
