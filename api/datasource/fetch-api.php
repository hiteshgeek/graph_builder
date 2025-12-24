<?php
/**
 * Fetch data from external API
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

// Validate URL
$url = isset($input['url']) ? $input['url'] : '';
if (empty($url)) {
    sendError('API URL is required');
}

if (!filter_var($url, FILTER_VALIDATE_URL)) {
    sendError('Invalid API URL');
}

// Get configuration
$method = isset($input['method']) ? strtoupper($input['method']) : 'GET';
$headersJson = isset($input['headers']) ? $input['headers'] : '{}';
$body = isset($input['body']) ? $input['body'] : null;
$dataPath = isset($input['dataPath']) ? $input['dataPath'] : null;

// Parse headers
$headers = json_decode($headersJson, true);
if (!is_array($headers)) {
    $headers = array();
}

try {
    // Initialize cURL
    $ch = curl_init();

    $options = array(
        CURLOPT_URL => $url,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 30,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_SSL_VERIFYPEER => false,
    );

    // Format headers
    $formattedHeaders = array();
    foreach ($headers as $key => $value) {
        $formattedHeaders[] = $key . ': ' . $value;
    }
    if (!empty($formattedHeaders)) {
        $options[CURLOPT_HTTPHEADER] = $formattedHeaders;
    }

    // Handle POST
    if ($method === 'POST' && $body) {
        $options[CURLOPT_POST] = true;
        $options[CURLOPT_POSTFIELDS] = $body;
    }

    curl_setopt_array($ch, $options);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);

    if ($error) {
        sendError('API request failed: ' . $error);
    }

    if ($httpCode < 200 || $httpCode >= 300) {
        sendError('API request failed with code: ' . $httpCode);
    }

    $data = json_decode($response, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        sendError('Invalid JSON response from API');
    }

    // Navigate to data path if specified
    if ($dataPath) {
        $parts = explode('.', $dataPath);
        foreach ($parts as $part) {
            if (!isset($data[$part])) {
                sendError("Path '{$dataPath}' not found in response");
            }
            $data = $data[$part];
        }
    }

    if (!is_array($data)) {
        sendError('API response is not an array');
    }

    sendResponse(array(
        'success' => true,
        'data' => $data,
        'rowCount' => count($data)
    ));

} catch (Exception $e) {
    sendError($e->getMessage(), 500);
}
