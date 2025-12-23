<?php

declare(strict_types=1);

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
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

require_once dirname(__DIR__) . '/config/database.php';

try {
    $db = Database::getInstance();
    $pdo = $db->getConnection();

    // Get database name from connection
    $stmt = $pdo->query('SELECT DATABASE() as db_name');
    $dbInfo = $stmt->fetch();
    $dbName = $dbInfo['db_name'];

    // Get search parameter
    $search = $_GET['search'] ?? '';

    // Build query for tables
    $sql = "SELECT TABLE_NAME as name, TABLE_ROWS as row_count, TABLE_COMMENT as comment
            FROM information_schema.TABLES
            WHERE TABLE_SCHEMA = :dbName
            AND TABLE_TYPE = 'BASE TABLE'";

    if (!empty($search)) {
        $sql .= " AND TABLE_NAME LIKE :search";
    }

    $sql .= " ORDER BY TABLE_NAME ASC LIMIT 50";

    $stmt = $pdo->prepare($sql);
    $stmt->bindValue(':dbName', $dbName, PDO::PARAM_STR);

    if (!empty($search)) {
        $stmt->bindValue(':search', '%' . $search . '%', PDO::PARAM_STR);
    }

    $stmt->execute();
    $tables = $stmt->fetchAll();

    echo json_encode([
        'success' => true,
        'database' => $dbName,
        'tables' => $tables,
        'count' => count($tables)
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
