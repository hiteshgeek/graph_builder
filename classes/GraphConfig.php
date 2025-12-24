<?php
/**
 * GraphConfig - Model for CRUD operations on graph configurations
 *
 * PHP 5.4 compatible
 */
class GraphConfig
{
    private $pdo;
    private $config;
    private $tables;
    private $columns;

    /**
     * Constructor
     *
     * @param PDO $pdo Database connection
     */
    public function __construct($pdo)
    {
        $this->pdo = $pdo;
        $this->config = require dirname(dirname(__FILE__)) . '/api/config/graph_builder.php';
        $this->tables = $this->config['tables'];
        $this->columns = $this->config['columns'];
    }

    /**
     * Create a new graph configuration
     *
     * @param array $data Graph data
     * @return int The new graph ID
     * @throws Exception
     */
    public function create($data)
    {
        $this->pdo->beginTransaction();

        try {
            // First create data source
            $dataSourceId = $this->createDataSource($data['dataSource']);

            // Generate slug if not provided
            $slug = isset($data['slug']) ? $data['slug'] : $this->generateSlug($data['name']);

            // Create graph config
            $sql = "INSERT INTO {$this->tables['configs']}
                    (slug, name, description, chart_type, config_base, config_type, data_mapping, gbds_id)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)";

            $stmt = $this->pdo->prepare($sql);
            $stmt->execute(array(
                $slug,
                $data['name'],
                isset($data['description']) ? $data['description'] : null,
                $data['chartType'],
                json_encode($data['configBase']),
                json_encode($data['configType']),
                json_encode($data['dataMapping']),
                $dataSourceId
            ));

            $graphId = (int) $this->pdo->lastInsertId();

            $this->pdo->commit();

            return $graphId;

        } catch (Exception $e) {
            $this->pdo->rollBack();
            throw $e;
        }
    }

    /**
     * Get graph configuration by ID or slug
     *
     * @param mixed $identifier ID (int) or slug (string)
     * @return array|null
     */
    public function get($identifier)
    {
        $column = is_numeric($identifier) ? 'gbc_id' : 'slug';

        $sql = "SELECT g.*, ds.*,
                       g.gbc_id as graph_id, ds.gbds_id as data_source_id
                FROM {$this->tables['configs']} g
                JOIN {$this->tables['data_sources']} ds ON g.gbds_id = ds.gbds_id
                WHERE g.{$column} = ? AND g.gbc_sid = 1";

        $stmt = $this->pdo->prepare($sql);
        $stmt->execute(array($identifier));
        $result = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$result) {
            return null;
        }

        // Decode JSON fields
        $result['config_base'] = json_decode($result['config_base'], true);
        $result['config_type'] = json_decode($result['config_type'], true);
        $result['data_mapping'] = json_decode($result['data_mapping'], true);

        // Decode data source JSON fields
        if ($result['api_headers']) {
            $result['api_headers'] = json_decode($result['api_headers'], true);
        }
        if ($result['callback_params']) {
            $result['callback_params'] = json_decode($result['callback_params'], true);
        }
        if ($result['static_data']) {
            $result['static_data'] = json_decode($result['static_data'], true);
        }

        return $result;
    }

    /**
     * Update graph configuration
     *
     * @param int $id Graph ID
     * @param array $data Updated data
     * @return bool
     * @throws Exception
     */
    public function update($id, $data)
    {
        $this->pdo->beginTransaction();

        try {
            $existing = $this->get($id);
            if (!$existing) {
                throw new Exception('Graph not found');
            }

            // Update data source if provided
            if (isset($data['dataSource'])) {
                $this->updateDataSource($existing['data_source_id'], $data['dataSource']);
            }

            // Build update fields
            $updates = array();
            $params = array();

            $fieldMap = array(
                'slug' => 'slug',
                'name' => 'name',
                'description' => 'description',
                'chartType' => 'chart_type',
                'configBase' => 'config_base',
                'configType' => 'config_type',
                'dataMapping' => 'data_mapping',
            );

            foreach ($fieldMap as $input => $column) {
                if (isset($data[$input])) {
                    $updates[] = "{$column} = ?";
                    $value = $data[$input];
                    if (in_array($column, array('config_base', 'config_type', 'data_mapping'))) {
                        $value = json_encode($value);
                    }
                    $params[] = $value;
                }
            }

            if (!empty($updates)) {
                $params[] = $id;
                $sql = "UPDATE {$this->tables['configs']}
                        SET " . implode(', ', $updates) . "
                        WHERE gbc_id = ?";
                $stmt = $this->pdo->prepare($sql);
                $stmt->execute($params);
            }

            $this->pdo->commit();

            return true;

        } catch (Exception $e) {
            $this->pdo->rollBack();
            throw $e;
        }
    }

    /**
     * Delete (soft-delete) graph configuration
     *
     * @param int $id Graph ID
     * @return bool
     */
    public function delete($id)
    {
        $sql = "UPDATE {$this->tables['configs']}
                SET gbc_sid = 0
                WHERE gbc_id = ?";

        $stmt = $this->pdo->prepare($sql);
        return $stmt->execute(array($id));
    }

    /**
     * List all graph configurations
     *
     * @param array $options Filter options
     * @return array
     */
    public function listAll($options = array())
    {
        $where = array('g.gbc_sid = 1');
        $params = array();

        if (!empty($options['chartType'])) {
            $where[] = 'g.chart_type = ?';
            $params[] = $options['chartType'];
        }

        if (!empty($options['search'])) {
            $where[] = '(g.name LIKE ? OR g.slug LIKE ?)';
            $params[] = '%' . $options['search'] . '%';
            $params[] = '%' . $options['search'] . '%';
        }

        $limit = isset($options['limit']) ? min((int) $options['limit'], 100) : 50;
        $offset = isset($options['offset']) ? (int) $options['offset'] : 0;

        $sql = "SELECT g.gbc_id, g.slug, g.name, g.description, g.chart_type,
                       g.created_ts, g.updated_ts, ds.source_type
                FROM {$this->tables['configs']} g
                JOIN {$this->tables['data_sources']} ds ON g.gbds_id = ds.gbds_id
                WHERE " . implode(' AND ', $where) . "
                ORDER BY g.updated_ts DESC
                LIMIT {$limit} OFFSET {$offset}";

        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Get total count of graphs
     *
     * @param array $options Filter options
     * @return int
     */
    public function count($options = array())
    {
        $where = array('gbc_sid = 1');
        $params = array();

        if (!empty($options['chartType'])) {
            $where[] = 'chart_type = ?';
            $params[] = $options['chartType'];
        }

        if (!empty($options['search'])) {
            $where[] = '(name LIKE ? OR slug LIKE ?)';
            $params[] = '%' . $options['search'] . '%';
            $params[] = '%' . $options['search'] . '%';
        }

        $sql = "SELECT COUNT(*) FROM {$this->tables['configs']}
                WHERE " . implode(' AND ', $where);

        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);

        return (int) $stmt->fetchColumn();
    }

    /**
     * Create data source record
     *
     * @param array $data Data source data
     * @return int Data source ID
     */
    private function createDataSource($data)
    {
        $sql = "INSERT INTO {$this->tables['data_sources']}
                (source_type, sql_query, api_url, api_method, api_headers, api_body,
                 api_data_path, callback_class, callback_method, callback_params,
                 static_data, transformer_class, transformer_method, cache_ttl)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

        $type = isset($data['type']) ? $data['type'] : 'sql';

        // Helper to encode value if it's an array, or keep as string if already JSON
        $encodeIfNeeded = function($value) {
            if (is_array($value)) {
                return json_encode($value);
            }
            return $value; // Keep as-is if already a string (JSON from frontend)
        };

        $stmt = $this->pdo->prepare($sql);
        $stmt->execute(array(
            $type,
            isset($data['query']) ? $data['query'] : null,
            isset($data['apiUrl']) ? $data['apiUrl'] : null,
            isset($data['apiMethod']) ? $data['apiMethod'] : 'GET',
            isset($data['apiHeaders']) ? $encodeIfNeeded($data['apiHeaders']) : null,
            isset($data['apiBody']) ? $data['apiBody'] : null,
            isset($data['apiDataPath']) ? $data['apiDataPath'] : null,
            isset($data['callbackClass']) ? $data['callbackClass'] : null,
            isset($data['callbackMethod']) ? $data['callbackMethod'] : null,
            isset($data['callbackParams']) ? $encodeIfNeeded($data['callbackParams']) : null,
            isset($data['staticData']) ? $encodeIfNeeded($data['staticData']) : null,
            isset($data['transformerClass']) ? $data['transformerClass'] : null,
            isset($data['transformerMethod']) ? $data['transformerMethod'] : null,
            isset($data['cacheTtl']) ? (int) $data['cacheTtl'] : 0
        ));

        return (int) $this->pdo->lastInsertId();
    }

    /**
     * Update data source record
     *
     * @param int $id Data source ID
     * @param array $data Updated data
     */
    private function updateDataSource($id, $data)
    {
        $updates = array();
        $params = array();

        $fieldMap = array(
            'type' => 'source_type',
            'query' => 'sql_query',
            'apiUrl' => 'api_url',
            'apiMethod' => 'api_method',
            'apiHeaders' => 'api_headers',
            'apiBody' => 'api_body',
            'apiDataPath' => 'api_data_path',
            'callbackClass' => 'callback_class',
            'callbackMethod' => 'callback_method',
            'callbackParams' => 'callback_params',
            'staticData' => 'static_data',
            'transformerClass' => 'transformer_class',
            'transformerMethod' => 'transformer_method',
            'cacheTtl' => 'cache_ttl',
        );

        foreach ($fieldMap as $input => $column) {
            if (isset($data[$input])) {
                $updates[] = "{$column} = ?";
                $value = $data[$input];
                // Encode as JSON if array, keep as-is if already string
                if (in_array($column, array('api_headers', 'callback_params', 'static_data'))) {
                    if (is_array($value)) {
                        $value = json_encode($value);
                    }
                    // Keep as-is if already a string (JSON from frontend)
                }
                $params[] = $value;
            }
        }

        if (!empty($updates)) {
            $params[] = $id;
            $sql = "UPDATE {$this->tables['data_sources']}
                    SET " . implode(', ', $updates) . "
                    WHERE gbds_id = ?";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute($params);
        }
    }

    /**
     * Generate URL-friendly slug from name
     *
     * @param string $name
     * @return string
     */
    private function generateSlug($name)
    {
        $slug = strtolower($name);
        $slug = preg_replace('/[^a-z0-9]+/', '-', $slug);
        $slug = trim($slug, '-');

        // Check for uniqueness
        $baseSlug = $slug;
        $counter = 1;

        while ($this->slugExists($slug)) {
            $slug = $baseSlug . '-' . $counter;
            $counter++;
        }

        return $slug;
    }

    /**
     * Check if slug already exists
     *
     * @param string $slug
     * @return bool
     */
    private function slugExists($slug)
    {
        $sql = "SELECT COUNT(*) FROM {$this->tables['configs']} WHERE slug = ?";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute(array($slug));
        return (int) $stmt->fetchColumn() > 0;
    }
}
