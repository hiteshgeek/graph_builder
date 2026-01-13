<?php
/**
 * Graph Builder Configuration
 *
 * Settings for graph storage, security, and caching
 */

return array(
    // Database table names
    'tables' => array(
        'configs' => 'graph_builder_configs',
        'data_sources' => 'graph_builder_data_sources',
    ),

    // Column name mappings
    'columns' => array(
        'configs' => array(
            'id' => 'gbc_id',
            'state' => 'gbc_sid',
        ),
        'data_sources' => array(
            'id' => 'gbds_id',
        ),
    ),

    // Security settings
    'security' => array(
        // Allowed callback namespaces (whitelist for PHP callbacks)
        'allowed_callback_namespaces' => array(
            'App\\Charts\\',
            'App\\Reports\\',
            'GraphBuilder\\Callbacks\\',
        ),
    ),

    // Cache settings
    'cache' => array(
        'enabled' => false,
        'path' => '/tmp/graph_builder_cache',
        'default_ttl' => 300, // 5 minutes
    ),
);
