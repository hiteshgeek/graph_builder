<?php
/**
 * CallbackDataSource - Call PHP class methods to fetch data
 *
 * PHP 5.4 compatible
 */

require_once dirname(__FILE__) . '/DataSourceInterface.php';

class CallbackDataSource implements DataSourceInterface
{
    private $config;
    private $class;
    private $method;
    private $params;
    private $transformerClass;
    private $transformerMethod;

    /**
     * Constructor
     *
     * @param array $config Data source configuration
     */
    public function __construct($config)
    {
        $this->config = $config;
        $this->class = isset($config['callback_class']) ? $config['callback_class'] : '';
        $this->method = isset($config['callback_method']) ? $config['callback_method'] : '';
        $this->params = isset($config['callback_params']) ? json_decode($config['callback_params'], true) : array();
        $this->transformerClass = isset($config['transformer_class']) ? $config['transformer_class'] : null;
        $this->transformerMethod = isset($config['transformer_method']) ? $config['transformer_method'] : null;

        if (!is_array($this->params)) {
            $this->params = array();
        }
    }

    /**
     * Get the source type identifier
     *
     * @return string
     */
    public function getType()
    {
        return 'callback';
    }

    /**
     * Validate the data source configuration
     *
     * @return bool
     * @throws Exception
     */
    public function validate()
    {
        if (empty($this->class)) {
            throw new Exception('Callback class is required');
        }

        if (empty($this->method)) {
            throw new Exception('Callback method is required');
        }

        // Validate class is in allowed namespaces
        $this->validateCallbackClass($this->class);

        return true;
    }

    /**
     * Fetch data by calling the PHP callback
     *
     * @param array $filters Runtime filters
     * @return array
     */
    public function fetch($filters = array())
    {
        $this->validate();

        if (!class_exists($this->class)) {
            throw new Exception('Callback class not found: ' . $this->class);
        }

        if (!method_exists($this->class, $this->method)) {
            throw new Exception('Callback method not found: ' . $this->method);
        }

        // Merge configured params with runtime filters
        $callParams = array_merge($this->params, array('filters' => $filters));

        $data = call_user_func(
            array($this->class, $this->method),
            $callParams
        );

        if (!is_array($data)) {
            throw new Exception('Callback must return an array');
        }

        // Apply transformer if configured
        $data = $this->applyTransformer($data);

        return $data;
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

        // If no namespaces configured, allow all (for flexibility)
        if (empty($allowedNamespaces)) {
            return;
        }

        $isAllowed = false;
        foreach ($allowedNamespaces as $namespace) {
            if (strpos($className, $namespace) === 0) {
                $isAllowed = true;
                break;
            }
        }

        if (!$isAllowed) {
            throw new Exception('Class ' . $className . ' is not in allowed namespaces');
        }
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
}
