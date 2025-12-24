<?php
/**
 * Execute SQL Query API
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

require_once dirname(__FILE__) . '/../config/database.php';
require_once dirname(__FILE__) . '/validate.php';

function sendResponse($data, $code = 200)
{
    http_response_code($code);
    echo json_encode($data);
    exit;
}

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

$sql = isset($input['sql']) ? $input['sql'] : '';

if (empty($sql)) {
    sendError('SQL query is required');
}

$validation = QueryValidator::validate($sql);

if (!$validation['valid']) {
    sendResponse(array(
        'success' => false,
        'errors' => $validation['errors'],
        'warnings' => $validation['warnings']
    ), 400);
}

$sql = QueryValidator::sanitize($sql);

try {
    $db = Database::getInstance();
    $pdo = $db->getConnection();

    $stmt = $pdo->prepare($sql);
    $stmt->execute();

    $data = $stmt->fetchAll();
    $columns = array();

    if (!empty($data)) {
        $columns = array_keys($data[0]);
    } elseif ($stmt->columnCount() > 0) {
        for ($i = 0; $i < $stmt->columnCount(); $i++) {
            $meta = $stmt->getColumnMeta($i);
            $columns[] = $meta['name'];
        }
    }

    sendResponse(array(
        'success' => true,
        'data' => $data,
        'columns' => $columns,
        'rowCount' => count($data),
        'warnings' => $validation['warnings']
    ));

} catch (PDOException $e) {
    sendError('Query execution failed: ' . $e->getMessage(), 500);
} catch (RuntimeException $e) {
    sendError($e->getMessage(), 500);
}
