<?php
/**
 * DataSourceFactory - Factory to create appropriate data source instances
 *
 * PHP 5.4 compatible
 */

require_once dirname(__FILE__) . '/DataSource/SqlDataSource.php';
require_once dirname(__FILE__) . '/DataSource/ApiDataSource.php';
require_once dirname(__FILE__) . '/DataSource/CallbackDataSource.php';
require_once dirname(__FILE__) . '/DataSource/StaticDataSource.php';

class DataSourceFactory
{
    private $pdo;

    /**
     * Constructor
     *
     * @param PDO $pdo Database connection (for SQL data source)
     */
    public function __construct($pdo)
    {
        $this->pdo = $pdo;
    }

    /**
     * Create a data source instance based on type
     *
     * @param array $sourceConfig Data source configuration
     * @return DataSourceInterface
     * @throws Exception
     */
    public function create($sourceConfig)
    {
        $type = isset($sourceConfig['source_type']) ? $sourceConfig['source_type'] : '';

        switch ($type) {
            case 'sql':
                return new SqlDataSource($this->pdo, $sourceConfig);

            case 'api':
                return new ApiDataSource($sourceConfig);

            case 'callback':
                return new CallbackDataSource($sourceConfig);

            case 'static':
                return new StaticDataSource($sourceConfig);

            default:
                throw new Exception('Unknown data source type: ' . $type);
        }
    }
}
