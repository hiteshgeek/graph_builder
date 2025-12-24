<?php
/**
 * ApiDataSource - Fetch data from external APIs
 *
 * PHP 5.4 compatible
 */

require_once dirname(__FILE__) . '/DataSourceInterface.php';

class ApiDataSource implements DataSourceInterface
{
    private $config;
    private $url;
    private $method;
    private $headers;
    private $body;
    private $dataPath;
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
        $this->url = isset($config['api_url']) ? $config['api_url'] : '';
        $this->method = isset($config['api_method']) ? strtoupper($config['api_method']) : 'GET';
        $this->headers = isset($config['api_headers']) ? json_decode($config['api_headers'], true) : array();
        $this->body = isset($config['api_body']) ? $config['api_body'] : null;
        $this->dataPath = isset($config['api_data_path']) ? $config['api_data_path'] : null;
        $this->transformerClass = isset($config['transformer_class']) ? $config['transformer_class'] : null;
        $this->transformerMethod = isset($config['transformer_method']) ? $config['transformer_method'] : null;

        if (!is_array($this->headers)) {
            $this->headers = array();
        }
    }

    /**
     * Get the source type identifier
     *
     * @return string
     */
    public function getType()
    {
        return 'api';
    }

    /**
     * Validate the data source configuration
     *
     * @return bool
     * @throws Exception
     */
    public function validate()
    {
        if (empty($this->url)) {
            throw new Exception('API URL is required');
        }

        if (!filter_var($this->url, FILTER_VALIDATE_URL)) {
            throw new Exception('Invalid API URL');
        }

        if (!in_array($this->method, array('GET', 'POST'))) {
            throw new Exception('Method must be GET or POST');
        }

        return true;
    }

    /**
     * Fetch data from API
     *
     * @param array $filters Runtime filters (can be used in URL/body placeholders)
     * @return array
     */
    public function fetch($filters = array())
    {
        $url = $this->processPlaceholders($this->url, $filters);
        $body = $this->body ? $this->processPlaceholders($this->body, $filters) : null;

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
        foreach ($this->headers as $key => $value) {
            $formattedHeaders[] = $key . ': ' . $value;
        }
        if (!empty($formattedHeaders)) {
            $options[CURLOPT_HTTPHEADER] = $formattedHeaders;
        }

        // Handle POST
        if ($this->method === 'POST' && $body) {
            $options[CURLOPT_POST] = true;
            $options[CURLOPT_POSTFIELDS] = $body;
        }

        curl_setopt_array($ch, $options);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);

        if ($error) {
            throw new Exception('API request failed: ' . $error);
        }

        if ($httpCode < 200 || $httpCode >= 300) {
            throw new Exception('API request failed with code: ' . $httpCode);
        }

        $data = json_decode($response, true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new Exception('Invalid JSON response from API');
        }

        // Navigate to data path if specified
        if ($this->dataPath) {
            $data = $this->navigateToPath($data, $this->dataPath);
        }

        if (!is_array($data)) {
            throw new Exception('API response is not an array');
        }

        // Apply transformer if configured
        $data = $this->applyTransformer($data);

        return $data;
    }

    /**
     * Process placeholders in string with filter values
     *
     * @param string $string
     * @param array $filters
     * @return string
     */
    private function processPlaceholders($string, $filters)
    {
        foreach ($filters as $filter) {
            if (!isset($filter['column']) || !isset($filter['value'])) {
                continue;
            }
            $placeholder = '{{' . $filter['column'] . '}}';
            $value = is_array($filter['value']) ? implode(',', $filter['value']) : $filter['value'];
            $string = str_replace($placeholder, urlencode($value), $string);
        }

        // Remove any remaining placeholders
        $string = preg_replace('/\{\{[a-zA-Z_][a-zA-Z0-9_]*\}\}/', '', $string);

        return $string;
    }

    /**
     * Navigate to a nested path in the data
     *
     * @param array $data
     * @param string $path Dot notation path
     * @return mixed
     */
    private function navigateToPath($data, $path)
    {
        $parts = explode('.', $path);

        foreach ($parts as $part) {
            if (!isset($data[$part])) {
                throw new Exception("Path '{$path}' not found in response");
            }
            $data = $data[$part];
        }

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
