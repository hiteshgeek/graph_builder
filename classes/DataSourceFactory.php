<?php
/**
 * DataSourceFactory - Factory to create SQL data source instances
 *
 * PHP 5.4 compatible
 */

require_once dirname(__FILE__) . '/DataSource/SqlDataSource.php';

class DataSourceFactory
{
    private $pdo;

    /**
     * Constructor
     *
     * @param PDO $pdo Database connection
     */
    public function __construct($pdo)
    {
        $this->pdo = $pdo;
    }

    /**
     * Create a SQL data source instance
     *
     * @param array $sourceConfig Data source configuration
     * @return SqlDataSource
     * @throws Exception
     */
    public function create($sourceConfig)
    {
        $type = isset($sourceConfig['source_type']) ? $sourceConfig['source_type'] : '';

        if ($type !== 'sql') {
            throw new Exception('Only SQL data source type is supported');
        }

        return new SqlDataSource($this->pdo, $sourceConfig);
    }
}
