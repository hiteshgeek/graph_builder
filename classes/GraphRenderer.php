<?php
/**
 * GraphRenderer - Fetches data and builds ECharts options for saved graphs
 *
 * PHP 5.4 compatible
 */

require_once dirname(__FILE__) . '/GraphConfig.php';
require_once dirname(__FILE__) . '/DataSourceFactory.php';
require_once dirname(__FILE__) . '/FilterBuilder.php';

class GraphRenderer
{
    private $pdo;
    private $graphConfig;
    private $dataSourceFactory;
    private $config;

    /**
     * Constructor
     *
     * @param PDO $pdo Database connection
     */
    public function __construct($pdo)
    {
        $this->pdo = $pdo;
        $this->graphConfig = new GraphConfig($pdo);
        $this->dataSourceFactory = new DataSourceFactory($pdo);
        $this->config = require dirname(dirname(__FILE__)) . '/api/config/graph_builder.php';
    }

    /**
     * Render a graph with optional runtime filters
     *
     * @param mixed $identifier Graph ID or slug
     * @param array $filters Runtime filters
     * @return array|null Result with data and ECharts option
     * @throws Exception
     */
    public function render($identifier, $filters = array())
    {
        // Get graph configuration
        $graph = $this->graphConfig->get($identifier);

        if (!$graph) {
            return null;
        }

        // Create data source
        $dataSourceConfig = $this->buildDataSourceConfig($graph);
        $dataSource = $this->dataSourceFactory->create($dataSourceConfig);

        // Fetch data with filters
        $data = $dataSource->fetch($filters);

        // Apply transformer if configured
        $data = $this->applyTransformer($graph, $data);

        // Build ECharts option
        $echartsOption = $this->buildEChartsOption($graph, $data);

        return array(
            'id' => $graph['graph_id'],
            'slug' => $graph['slug'],
            'name' => $graph['name'],
            'chartType' => $graph['chart_type'],
            'data' => $data,
            'echartsOption' => $echartsOption,
            'config' => array(
                'base' => $graph['config_base'],
                'type' => $graph['config_type'],
                'dataMapping' => $graph['data_mapping']
            )
        );
    }

    /**
     * Build data source config from graph record
     *
     * @param array $graph Graph record
     * @return array Data source configuration
     */
    private function buildDataSourceConfig($graph)
    {
        return array(
            'source_type' => $graph['source_type'],
            'sql_query' => $graph['sql_query'],
            'api_url' => $graph['api_url'],
            'api_method' => $graph['api_method'],
            'api_headers' => $graph['api_headers'],
            'api_body' => $graph['api_body'],
            'api_data_path' => $graph['api_data_path'],
            'callback_class' => $graph['callback_class'],
            'callback_method' => $graph['callback_method'],
            'callback_params' => $graph['callback_params'],
            'static_data' => $graph['static_data'],
            'cache_ttl' => $graph['cache_ttl']
        );
    }

    /**
     * Apply data transformer if configured
     *
     * @param array $graph Graph record
     * @param array $data Raw data
     * @return array Transformed data
     */
    private function applyTransformer($graph, $data)
    {
        if (empty($graph['transformer_class']) || empty($graph['transformer_method'])) {
            return $data;
        }

        $class = $graph['transformer_class'];
        $method = $graph['transformer_method'];

        // Validate namespace
        $allowed = false;
        if (isset($this->config['security']['allowed_callback_namespaces'])) {
            foreach ($this->config['security']['allowed_callback_namespaces'] as $namespace) {
                if (strpos($class, $namespace) === 0) {
                    $allowed = true;
                    break;
                }
            }
        }

        if (!$allowed) {
            // Log warning but don't fail - return original data
            error_log("GraphRenderer: Transformer class not in allowed namespaces: {$class}");
            return $data;
        }

        if (!class_exists($class)) {
            error_log("GraphRenderer: Transformer class not found: {$class}");
            return $data;
        }

        $instance = new $class();

        if (!method_exists($instance, $method)) {
            error_log("GraphRenderer: Transformer method not found: {$class}::{$method}");
            return $data;
        }

        return $instance->$method($data);
    }

    /**
     * Build ECharts option from config and data
     *
     * @param array $graph Graph configuration
     * @param array $data Chart data
     * @return array ECharts option
     */
    private function buildEChartsOption($graph, $data)
    {
        $chartType = $graph['chart_type'];
        $configBase = $graph['config_base'];
        $configType = $graph['config_type'];
        $dataMapping = $graph['data_mapping'];

        $option = array();

        // Title
        if (!empty($configBase['title'])) {
            $option['title'] = array(
                'text' => $configBase['title'],
                'left' => 'center'
            );
        }

        // Tooltip
        $option['tooltip'] = array(
            'trigger' => $chartType === 'pie' ? 'item' : 'axis'
        );

        // Legend
        if (isset($configBase['showLegend']) && $configBase['showLegend']) {
            $option['legend'] = array(
                'bottom' => 10
            );
        }

        // Animation
        if (isset($configBase['animation'])) {
            $option['animation'] = (bool) $configBase['animation'];
        }

        // Build chart-specific options
        switch ($chartType) {
            case 'line':
            case 'bar':
                $option = array_merge($option, $this->buildAxisChart($chartType, $data, $dataMapping, $configBase, $configType));
                break;

            case 'pie':
                $option = array_merge($option, $this->buildPieChart($data, $dataMapping, $configBase, $configType));
                break;
        }

        return $option;
    }

    /**
     * Build line or bar chart option
     *
     * @param string $chartType 'line' or 'bar'
     * @param array $data Chart data
     * @param array $dataMapping Data mapping config
     * @param array $configBase Base config
     * @param array $configType Type-specific config
     * @return array Partial ECharts option
     */
    private function buildAxisChart($chartType, $data, $dataMapping, $configBase, $configType)
    {
        $option = array();

        // Extract x-axis values
        $xAxisField = isset($dataMapping['xAxis']) ? $dataMapping['xAxis'] : null;
        $yAxisFields = isset($dataMapping['yAxis']) ? $dataMapping['yAxis'] : array();

        if (!is_array($yAxisFields)) {
            $yAxisFields = array($yAxisFields);
        }

        // Get x-axis data
        $xAxisData = array();
        if ($xAxisField) {
            foreach ($data as $row) {
                if (isset($row[$xAxisField])) {
                    $xAxisData[] = $row[$xAxisField];
                }
            }
        }

        $option['xAxis'] = array(
            'type' => 'category',
            'data' => $xAxisData
        );

        $option['yAxis'] = array(
            'type' => 'value'
        );

        // Grid with margins
        $option['grid'] = array(
            'left' => '3%',
            'right' => '4%',
            'bottom' => isset($configBase['showLegend']) && $configBase['showLegend'] ? '15%' : '3%',
            'containLabel' => true
        );

        // Build series
        $series = array();
        $colors = isset($configBase['colors']) ? $configBase['colors'] : array();

        foreach ($yAxisFields as $index => $field) {
            $seriesData = array();
            foreach ($data as $row) {
                if (isset($row[$field])) {
                    $seriesData[] = $row[$field];
                } else {
                    $seriesData[] = 0;
                }
            }

            $seriesItem = array(
                'name' => $field,
                'type' => $chartType,
                'data' => $seriesData
            );

            // Apply color
            if (isset($colors[$index])) {
                $seriesItem['itemStyle'] = array('color' => $colors[$index]);
                if ($chartType === 'line') {
                    $seriesItem['lineStyle'] = array('color' => $colors[$index]);
                }
            }

            // Line chart specific
            if ($chartType === 'line') {
                if (isset($configType['smooth'])) {
                    $seriesItem['smooth'] = (bool) $configType['smooth'];
                }
                if (isset($configType['areaStyle']) && $configType['areaStyle']) {
                    $seriesItem['areaStyle'] = new stdClass(); // Empty object for fill
                }
                if (isset($configType['showSymbol'])) {
                    $seriesItem['showSymbol'] = (bool) $configType['showSymbol'];
                }
            }

            // Bar chart specific
            if ($chartType === 'bar') {
                if (isset($configType['barWidth'])) {
                    $seriesItem['barWidth'] = $configType['barWidth'];
                }
                if (isset($configType['stacked']) && $configType['stacked']) {
                    $seriesItem['stack'] = 'total';
                }
            }

            $series[] = $seriesItem;
        }

        $option['series'] = $series;

        return $option;
    }

    /**
     * Build pie chart option
     *
     * @param array $data Chart data
     * @param array $dataMapping Data mapping config
     * @param array $configBase Base config
     * @param array $configType Type-specific config
     * @return array Partial ECharts option
     */
    private function buildPieChart($data, $dataMapping, $configBase, $configType)
    {
        $option = array();

        $nameField = isset($dataMapping['nameField']) ? $dataMapping['nameField'] : 'name';
        $valueField = isset($dataMapping['valueField']) ? $dataMapping['valueField'] : 'value';

        // Build pie data
        $pieData = array();
        foreach ($data as $row) {
            $pieData[] = array(
                'name' => isset($row[$nameField]) ? $row[$nameField] : '',
                'value' => isset($row[$valueField]) ? $row[$valueField] : 0
            );
        }

        $seriesItem = array(
            'type' => 'pie',
            'data' => $pieData
        );

        // Radius - check for both 'radius' (from frontend) and 'outerRadius' (legacy)
        $outerRadius = 70;
        if (isset($configType['radius'])) {
            $outerRadius = $configType['radius'];
        } elseif (isset($configType['outerRadius'])) {
            $outerRadius = $configType['outerRadius'];
        }

        if (isset($configType['innerRadius']) && $configType['innerRadius'] > 0) {
            // Donut chart
            $seriesItem['radius'] = array($configType['innerRadius'] . '%', $outerRadius . '%');
        } else {
            $seriesItem['radius'] = $outerRadius . '%';
        }

        // Rose type - only apply if explicitly set to a valid value (not 'none' or empty)
        if (isset($configType['roseType']) && $configType['roseType'] && $configType['roseType'] !== 'none') {
            $seriesItem['roseType'] = $configType['roseType'] === 'area' ? 'area' : 'radius';
        }

        // Labels
        if (isset($configType['showLabels'])) {
            $seriesItem['label'] = array(
                'show' => (bool) $configType['showLabels']
            );
            if (isset($configType['labelPosition'])) {
                $seriesItem['label']['position'] = $configType['labelPosition'];
            }
        }

        // Colors
        if (isset($configBase['colors']) && is_array($configBase['colors'])) {
            $option['color'] = $configBase['colors'];
        }

        $option['series'] = array($seriesItem);

        return $option;
    }

    /**
     * Get raw data only (without building ECharts option)
     *
     * @param mixed $identifier Graph ID or slug
     * @param array $filters Runtime filters
     * @return array|null Raw data
     */
    public function getData($identifier, $filters = array())
    {
        $graph = $this->graphConfig->get($identifier);

        if (!$graph) {
            return null;
        }

        $dataSourceConfig = $this->buildDataSourceConfig($graph);
        $dataSource = $this->dataSourceFactory->create($dataSourceConfig);

        $data = $dataSource->fetch($filters);
        $data = $this->applyTransformer($graph, $data);

        return $data;
    }
}
