<?php
/**
 * Get Table Fields API
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

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(array('error' => 'Method not allowed'));
    exit;
}

$tableName = isset($_GET['table']) ? $_GET['table'] : '';

if (empty($tableName)) {
    http_response_code(400);
    echo json_encode(array('error' => 'Table name is required'));
    exit;
}

// Validate table name (alphanumeric and underscores only)
if (!preg_match('/^[a-zA-Z_][a-zA-Z0-9_]*$/', $tableName)) {
    http_response_code(400);
    echo json_encode(array('error' => 'Invalid table name'));
    exit;
}

require_once dirname(dirname(__FILE__)) . '/config/database.php';

try {
    $db = Database::getInstance();
    $pdo = $db->getConnection();

    // Get database name
    $stmt = $pdo->query('SELECT DATABASE() as db_name');
    $dbInfo = $stmt->fetch();
    $dbName = $dbInfo['db_name'];

    // Verify table exists
    $checkSql = "SELECT COUNT(*) as cnt FROM information_schema.TABLES
                 WHERE TABLE_SCHEMA = :dbName AND TABLE_NAME = :tableName";
    $stmt = $pdo->prepare($checkSql);
    $stmt->execute(array('dbName' => $dbName, 'tableName' => $tableName));
    $exists = $stmt->fetch();

    if ($exists['cnt'] == 0) {
        http_response_code(404);
        echo json_encode(array('error' => 'Table not found'));
        exit;
    }

    // Get column information
    $sql = "SELECT
                COLUMN_NAME as name,
                DATA_TYPE as type,
                COLUMN_TYPE as full_type,
                IS_NULLABLE as nullable,
                COLUMN_KEY as key_type,
                COLUMN_DEFAULT as default_value,
                COLUMN_COMMENT as comment
            FROM information_schema.COLUMNS
            WHERE TABLE_SCHEMA = :dbName
            AND TABLE_NAME = :tableName
            ORDER BY ORDINAL_POSITION";

    $stmt = $pdo->prepare($sql);
    $stmt->execute(array('dbName' => $dbName, 'tableName' => $tableName));
    $fields = $stmt->fetchAll();

    // Format fields with type icons
    $formattedFields = array();
    foreach ($fields as $field) {
        $typeCategory = 'text';
        $type = strtolower($field['type']);

        if (in_array($type, array('int', 'bigint', 'smallint', 'tinyint', 'mediumint', 'decimal', 'float', 'double'))) {
            $typeCategory = 'number';
        } elseif (in_array($type, array('date', 'datetime', 'timestamp', 'time', 'year'))) {
            $typeCategory = 'date';
        } elseif (in_array($type, array('text', 'longtext', 'mediumtext', 'tinytext', 'blob', 'longblob'))) {
            $typeCategory = 'text';
        } elseif ($type === 'json') {
            $typeCategory = 'json';
        } elseif (in_array($type, array('enum', 'set'))) {
            $typeCategory = 'enum';
        }

        $formattedFields[] = array(
            'name' => $field['name'],
            'type' => $field['type'],
            'fullType' => $field['full_type'],
            'nullable' => $field['nullable'] === 'YES',
            'isPrimary' => $field['key_type'] === 'PRI',
            'isUnique' => $field['key_type'] === 'UNI',
            'isIndex' => $field['key_type'] === 'MUL',
            'default' => $field['default_value'],
            'comment' => $field['comment'],
            'category' => $typeCategory
        );
    }

    echo json_encode(array(
        'success' => true,
        'table' => $tableName,
        'fields' => $formattedFields,
        'count' => count($formattedFields)
    ));

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(array(
        'success' => false,
        'error' => $e->getMessage()
    ));
}
