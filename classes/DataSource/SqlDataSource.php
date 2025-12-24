<?php
/**
 * SqlDataSource - Execute SQL queries with dynamic filter injection
 *
 * PHP 5.4 compatible
 */

require_once dirname(__FILE__) . '/DataSourceInterface.php';
require_once dirname(dirname(__FILE__)) . '/FilterBuilder.php';

class SqlDataSource implements DataSourceInterface
{
    private $pdo;
    private $config;
    private $transformerClass;
    private $transformerMethod;

    /**
     * Constructor
     *
     * @param PDO $pdo Database connection
     * @param array $config Data source configuration
     */
    public function __construct($pdo, $config)
    {
        $this->pdo = $pdo;
        $this->config = $config;
        $this->transformerClass = isset($config['transformer_class']) ? $config['transformer_class'] : null;
        $this->transformerMethod = isset($config['transformer_method']) ? $config['transformer_method'] : null;
    }

    /**
     * Get the source type identifier
     *
     * @return string
     */
    public function getType()
    {
        return 'sql';
    }

    /**
     * Validate the data source configuration
     *
     * @return bool
     * @throws Exception
     */
    public function validate()
    {
        if (empty($this->config['sql_query'])) {
            throw new Exception('SQL query is required');
        }

        // Basic SQL injection prevention - block dangerous keywords
        $query = strtoupper($this->config['sql_query']);
        $blocked = array('DROP', 'DELETE', 'TRUNCATE', 'ALTER', 'CREATE', 'INSERT', 'UPDATE', 'GRANT', 'REVOKE');

        foreach ($blocked as $keyword) {
            if (preg_match('/\b' . $keyword . '\b/', $query)) {
                throw new Exception('Query contains blocked keyword: ' . $keyword);
            }
        }

        return true;
    }

    /**
     * Fetch data from SQL query with optional filters
     *
     * @param array $filters Runtime filters
     * @return array
     */
    public function fetch($filters = array())
    {
        $query = $this->config['sql_query'];

        // Build WHERE conditions from runtime filters
        $filterBuilder = new FilterBuilder();
        $built = $filterBuilder->build($filters);

        // Check if query has {{WHERE}} placeholder
        if (strpos($query, '{{WHERE}}') !== false) {
            $whereClause = $built['sql'] ? 'WHERE ' . $built['sql'] : '';
            $query = str_replace('{{WHERE}}', $whereClause, $query);
        }
        // Check if query has {{AND_CONDITIONS}} for adding to existing WHERE
        elseif (strpos($query, '{{AND_CONDITIONS}}') !== false) {
            $andClause = $built['sql'] ? 'AND ' . $built['sql'] : '';
            $query = str_replace('{{AND_CONDITIONS}}', $andClause, $query);
        }
        // No placeholder - ignore filters for this query

        // Remove any remaining placeholders
        $query = preg_replace('/\{\{WHERE\}\}|\{\{AND_CONDITIONS\}\}/', '', $query);

        // Execute query
        $stmt = $this->pdo->prepare($query);
        $stmt->execute($built['bindings']);

        $data = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Apply transformer if configured
        $data = $this->applyTransformer($data);

        return $data;
    }

    /**
     * Apply optional transformer to data
     *
     * @param array $data
     * @return array
     */
    private function applyTransformer($data)
    {
        if (empty($this->transformerClass) || empty($this->transformerMethod)) {
            return $data;
        }

        // Validate class is allowed
        $this->validateCallbackClass($this->transformerClass);

        if (!class_exists($this->transformerClass)) {
            throw new Exception('Transformer class not found: ' . $this->transformerClass);
        }

        if (!method_exists($this->transformerClass, $this->transformerMethod)) {
            throw new Exception('Transformer method not found: ' . $this->transformerMethod);
        }

        return call_user_func(
            array($this->transformerClass, $this->transformerMethod),
            $data
        );
    }

    /**
     * Validate callback class is in allowed namespaces
     *
     * @param string $className
     * @throws Exception
     */
    private function validateCallbackClass($className)
    {
        $configFile = dirname(dirname(dirname(__FILE__))) . '/api/config/graph_builder.php';
        $config = require $configFile;

        $allowedNamespaces = isset($config['security']['allowed_callback_namespaces'])
            ? $config['security']['allowed_callback_namespaces']
            : array();

        $isAllowed = false;
        foreach ($allowedNamespaces as $namespace) {
            if (strpos($className, $namespace) === 0) {
                $isAllowed = true;
                break;
            }
        }

        if (!$isAllowed && !empty($allowedNamespaces)) {
            throw new Exception('Class ' . $className . ' is not in allowed namespaces');
        }
    }
}
