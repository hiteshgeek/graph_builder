<?php
/**
 * Execute PHP callback to fetch data
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

require_once dirname(dirname(__FILE__)) . '/config/graph_builder.php';

/**
 * Send JSON response
 */
function sendResponse($data, $code = 200)
{
    http_response_code($code);
    echo json_encode($data);
    exit;
}

/**
 * Send error response
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

// Validate class and method
$className = isset($input['className']) ? $input['className'] : '';
$methodName = isset($input['methodName']) ? $input['methodName'] : '';
$paramsJson = isset($input['params']) ? $input['params'] : '{}';

if (empty($className)) {
    sendError('Class name is required');
}

if (empty($methodName)) {
    sendError('Method name is required');
}

// Parse params
$params = json_decode($paramsJson, true);
if (!is_array($params)) {
    $params = array();
}

// Load config
$configFile = dirname(dirname(__FILE__)) . '/config/graph_builder.php';
$config = file_exists($configFile) ? require $configFile : array();

// Validate class is in allowed namespaces
$allowedNamespaces = isset($config['security']['allowed_callback_namespaces'])
    ? $config['security']['allowed_callback_namespaces']
    : array();

$isAllowed = false;
if (empty($allowedNamespaces)) {
    // If no namespaces configured, deny all for security
    sendError('No allowed callback namespaces configured. Please configure security.allowed_callback_namespaces.');
}

foreach ($allowedNamespaces as $namespace) {
    if (strpos($className, $namespace) === 0) {
        $isAllowed = true;
        break;
    }
}

if (!$isAllowed) {
    sendError('Class ' . $className . ' is not in allowed namespaces');
}

try {
    // Check if class exists
    if (!class_exists($className)) {
        sendError('Class not found: ' . $className);
    }

    // Check if method exists
    if (!method_exists($className, $methodName)) {
        sendError('Method not found: ' . $methodName);
    }

    // Execute the callback
    $data = call_user_func(array($className, $methodName), $params);

    if (!is_array($data)) {
        sendError('Callback must return an array');
    }

    sendResponse(array(
        'success' => true,
        'data' => $data,
        'rowCount' => count($data)
    ));

} catch (Exception $e) {
    sendError($e->getMessage(), 500);
}
