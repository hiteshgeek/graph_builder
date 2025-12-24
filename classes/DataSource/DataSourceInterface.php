<?php
/**
 * DataSourceInterface - Interface for all data source types
 *
 * PHP 5.4 compatible
 */
interface DataSourceInterface
{
    /**
     * Fetch data from the source
     *
     * @param array $filters Runtime filters to apply
     * @return array The fetched data
     */
    public function fetch($filters = array());

    /**
     * Validate the data source configuration
     *
     * @return bool True if valid
     * @throws Exception If invalid
     */
    public function validate();

    /**
     * Get the source type identifier
     *
     * @return string
     */
    public function getType();
}
