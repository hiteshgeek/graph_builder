<?php

declare(strict_types=1);

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/validate.php';

function sendResponse(array $data, int $code = 200): void
{
    http_response_code($code);
    echo json_encode($data);
    exit;
}

function sendError(string $message, int $code = 400): void
{
    sendResponse(['success' => false, 'error' => $message], $code);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendError('Method not allowed', 405);
}

$input = json_decode(file_get_contents('php://input'), true);

if (json_last_error() !== JSON_ERROR_NONE) {
    sendError('Invalid JSON input');
}

$sql = $input['sql'] ?? '';

if (empty($sql)) {
    sendError('SQL query is required');
}

$validation = QueryValidator::validate($sql);

if (!$validation['valid']) {
    sendResponse([
        'success' => false,
        'errors' => $validation['errors'],
        'warnings' => $validation['warnings']
    ], 400);
}

$sql = QueryValidator::sanitize($sql);

try {
    $db = Database::getInstance();
    $pdo = $db->getConnection();

    $stmt = $pdo->prepare($sql);
    $stmt->execute();

    $data = $stmt->fetchAll();
    $columns = [];

    if (!empty($data)) {
        $columns = array_keys($data[0]);
    } elseif ($stmt->columnCount() > 0) {
        for ($i = 0; $i < $stmt->columnCount(); $i++) {
            $meta = $stmt->getColumnMeta($i);
            $columns[] = $meta['name'];
        }
    }

    sendResponse([
        'success' => true,
        'data' => $data,
        'columns' => $columns,
        'rowCount' => count($data),
        'warnings' => $validation['warnings']
    ]);

} catch (PDOException $e) {
    sendError('Query execution failed: ' . $e->getMessage(), 500);
} catch (RuntimeException $e) {
    sendError($e->getMessage(), 500);
}
