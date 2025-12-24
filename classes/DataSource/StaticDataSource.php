<?php
/**
 * StaticDataSource - Return stored static JSON data
 *
 * PHP 5.4 compatible
 */

require_once dirname(__FILE__) . '/DataSourceInterface.php';

class StaticDataSource implements DataSourceInterface
{
    private $config;
    private $data;
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
        $this->data = isset($config['static_data']) ? json_decode($config['static_data'], true) : array();
        $this->transformerClass = isset($config['transformer_class']) ? $config['transformer_class'] : null;
        $this->transformerMethod = isset($config['transformer_method']) ? $config['transformer_method'] : null;

        if (!is_array($this->data)) {
            $this->data = array();
        }
    }

    /**
     * Get the source type identifier
     *
     * @return string
     */
    public function getType()
    {
        return 'static';
    }

    /**
     * Validate the data source configuration
     *
     * @return bool
     * @throws Exception
     */
    public function validate()
    {
        if (empty($this->data)) {
            throw new Exception('Static data is required');
        }

        return true;
    }

    /**
     * Fetch the static data
     *
     * @param array $filters Runtime filters (ignored for static data)
     * @return array
     */
    public function fetch($filters = array())
    {
        $data = $this->data;

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
