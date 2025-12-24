<?php
/**
 * Save Graph Configuration API
 *
 * POST: Save a new graph or update existing
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

// Validate required fields
$required = array('name', 'chartType', 'configBase', 'configType', 'dataMapping', 'dataSource');
foreach ($required as $field) {
    if (!isset($input[$field]) || (is_string($input[$field]) && trim($input[$field]) === '')) {
        sendError("Field '{$field}' is required");
    }
}

// Validate dataSource has type
if (!isset($input['dataSource']['type'])) {
    sendError('Data source type is required');
}

$validTypes = array('sql', 'api', 'callback', 'static');
if (!in_array($input['dataSource']['type'], $validTypes)) {
    sendError('Invalid data source type. Must be: sql, api, callback, or static');
}

// Validate chartType
$validChartTypes = array('line', 'bar', 'pie');
if (!in_array($input['chartType'], $validChartTypes)) {
    sendError('Invalid chart type. Must be: line, bar, or pie');
}

try {
    $db = Database::getInstance();
    $pdo = $db->getConnection();

    $graphConfig = new GraphConfig($pdo);

    // Check if updating existing graph
    if (isset($input['id']) && is_numeric($input['id'])) {
        $id = (int) $input['id'];
        $graphConfig->update($id, $input);

        sendResponse(array(
            'success' => true,
            'message' => 'Graph updated successfully',
            'id' => $id
        ));
    } else {
        // Create new graph
        $id = $graphConfig->create($input);

        sendResponse(array(
            'success' => true,
            'message' => 'Graph saved successfully',
            'id' => $id
        ), 201);
    }

} catch (PDOException $e) {
    sendError('Database error: ' . $e->getMessage(), 500);
} catch (Exception $e) {
    sendError($e->getMessage(), 500);
}
