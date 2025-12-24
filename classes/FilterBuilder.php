<?php
/**
 * FilterBuilder - Builds SQL WHERE clauses from runtime filter arrays
 *
 * PHP 5.4 compatible
 */
class FilterBuilder
{
    /**
     * Build WHERE clause from runtime filter array
     *
     * Each filter should have: column, operator, value
     * Only filters with non-empty values are applied
     *
     * @param array $filters Array of filter definitions
     * @return array ['sql' => string, 'bindings' => array]
     */
    public function build($filters)
    {
        $conditions = array();
        $bindings = array();

        if (!is_array($filters)) {
            return array(
                'sql' => '',
                'bindings' => array()
            );
        }

        foreach ($filters as $filter) {
            // Skip if no value provided
            if (!isset($filter['value']) || $filter['value'] === '' || $filter['value'] === null) {
                continue;
            }

            // Skip if no column specified
            if (!isset($filter['column']) || empty($filter['column'])) {
                continue;
            }

            $column = $this->sanitizeColumnName($filter['column']);
            $operator = isset($filter['operator']) ? strtoupper(trim($filter['operator'])) : '=';
            $value = $filter['value'];

            // Validate operator
            if (!$this->isValidOperator($operator)) {
                $operator = '=';
            }

            // Build condition based on operator
            switch ($operator) {
                case 'LIKE':
                    $conditions[] = "{$column} LIKE ?";
                    $bindings[] = "%" . $value . "%";
                    break;

                case 'NOT LIKE':
                    $conditions[] = "{$column} NOT LIKE ?";
                    $bindings[] = "%" . $value . "%";
                    break;

                case 'IN':
                    $values = is_array($value) ? $value : explode(',', $value);
                    $values = array_map('trim', $values);
                    $values = array_filter($values, function($v) { return $v !== ''; });

                    if (count($values) > 0) {
                        $placeholders = implode(',', array_fill(0, count($values), '?'));
                        $conditions[] = "{$column} IN ({$placeholders})";
                        $bindings = array_merge($bindings, array_values($values));
                    }
                    break;

                case 'NOT IN':
                    $values = is_array($value) ? $value : explode(',', $value);
                    $values = array_map('trim', $values);
                    $values = array_filter($values, function($v) { return $v !== ''; });

                    if (count($values) > 0) {
                        $placeholders = implode(',', array_fill(0, count($values), '?'));
                        $conditions[] = "{$column} NOT IN ({$placeholders})";
                        $bindings = array_merge($bindings, array_values($values));
                    }
                    break;

                case 'BETWEEN':
                    $parts = is_array($value) ? $value : explode(',', $value);
                    if (count($parts) >= 2) {
                        $conditions[] = "{$column} BETWEEN ? AND ?";
                        $bindings[] = trim($parts[0]);
                        $bindings[] = trim($parts[1]);
                    }
                    break;

                case 'IS NULL':
                    $conditions[] = "{$column} IS NULL";
                    break;

                case 'IS NOT NULL':
                    $conditions[] = "{$column} IS NOT NULL";
                    break;

                default:
                    // Standard operators: =, !=, <>, >, <, >=, <=
                    $conditions[] = "{$column} {$operator} ?";
                    $bindings[] = $value;
                    break;
            }
        }

        return array(
            'sql' => count($conditions) > 0 ? implode(' AND ', $conditions) : '',
            'bindings' => $bindings
        );
    }

    /**
     * Sanitize column name to prevent SQL injection
     *
     * @param string $column
     * @return string
     */
    private function sanitizeColumnName($column)
    {
        // Allow only alphanumeric, underscore, dot (for table.column), and backticks
        $column = preg_replace('/[^a-zA-Z0-9_\.\`]/', '', $column);
        return $column;
    }

    /**
     * Check if operator is valid
     *
     * @param string $operator
     * @return bool
     */
    private function isValidOperator($operator)
    {
        $validOperators = array(
            '=', '!=', '<>', '>', '<', '>=', '<=',
            'LIKE', 'NOT LIKE',
            'IN', 'NOT IN',
            'BETWEEN',
            'IS NULL', 'IS NOT NULL'
        );

        return in_array($operator, $validOperators);
    }
}
