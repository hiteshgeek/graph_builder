<?php
/**
 * Database Connection Class
 * PHP 5.4 compatible
 */

class Database
{
    private static $instance = null;
    private $pdo = null;
    private $config = array();

    private function __construct()
    {
        $this->loadEnv();
        $this->connect();
    }

    public static function getInstance()
    {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    public function getConnection()
    {
        return $this->pdo;
    }

    private function loadEnv()
    {
        $envPath = dirname(dirname(__DIR__)) . '/.env';

        if (!file_exists($envPath)) {
            throw new RuntimeException('.env file not found. Copy .env.example to .env and configure.');
        }

        $lines = file($envPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);

        foreach ($lines as $line) {
            if (strpos(trim($line), '#') === 0) {
                continue;
            }

            if (strpos($line, '=') !== false) {
                list($key, $value) = explode('=', $line, 2);
                $this->config[trim($key)] = trim($value);
            }
        }
    }

    private function connect()
    {
        $host = isset($this->config['DB_HOST']) ? $this->config['DB_HOST'] : 'localhost';
        $port = isset($this->config['DB_PORT']) ? $this->config['DB_PORT'] : '3306';
        $name = isset($this->config['DB_NAME']) ? $this->config['DB_NAME'] : '';
        $user = isset($this->config['DB_USER']) ? $this->config['DB_USER'] : '';
        $pass = isset($this->config['DB_PASS']) ? $this->config['DB_PASS'] : '';
        $charset = isset($this->config['DB_CHARSET']) ? $this->config['DB_CHARSET'] : 'utf8mb4';

        $dsn = "mysql:host={$host};port={$port};dbname={$name};charset={$charset}";

        $options = array(
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        );

        try {
            $this->pdo = new PDO($dsn, $user, $pass, $options);
        } catch (PDOException $e) {
            throw new RuntimeException('Database connection failed: ' . $e->getMessage());
        }
    }

    private function __clone() {}

    public function __wakeup()
    {
        throw new RuntimeException('Cannot unserialize singleton');
    }
}
