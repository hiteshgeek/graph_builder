<?php

/**
 * Get the base URL path for the Graph Builder project
 * Works regardless of where the project is hosted
 */
function get_base_path()
{
    // Get the directory of the current script relative to document root
    $scriptDir = dirname($_SERVER['SCRIPT_NAME']);
    $parts = explode('/', trim($scriptDir, '/'));

    // Known subdirectory names that are NOT the project root
    $subDirs = ['api', 'includes', 'usage', 'graphs', 'docs', 'setup'];

    // Walk backwards removing subdirectories until we find the project root
    while (!empty($parts) && in_array(end($parts), $subDirs)) {
        array_pop($parts);
    }

    $path = implode('/', $parts);
    return $path ? '/' . $path : '';
}

function asset_manifest($type = 'css')
{
      static $manifests = ['css' => null, 'js' => null];
      $manifestFile = $type === 'js'
            ? __DIR__ . '/../dist/rev/manifest-js.json'
            : __DIR__ . '/../dist/rev/manifest-css.json';
      if ($manifests[$type] === null) {
            if (!file_exists($manifestFile)) {
                  error_log("[asset_manifest] Manifest file not found: $manifestFile");
                  $manifests[$type] = [];
            } else {
                  $json = file_get_contents($manifestFile);
                  $manifests[$type] = json_decode($json, true) ?: [];
            }
      }

      return $manifests[$type];
}


function asset($logical, $variant = null)
{
      $basePath = get_base_path();
      $isJs = substr($logical, -3) === '.js';
      $isCss = substr($logical, -4) === '.css';
      $type = $isJs ? 'js' : ($isCss ? 'css' : null);
      if (!$type) {
            error_log("[asset] Unknown asset type for: $logical");
            return $basePath . '/dist/' . $logical;
      }
      $manifestKey = $logical;
      // Support nomodule variant for JS (IIFE build)
      if ($type === 'js' && $variant === 'nomodule') {
            $manifestKey = preg_replace('/\.js$/', '.iife.js', $manifestKey);
      }
      $baseUrl = $type === 'js' ? $basePath . '/dist/js/' : $basePath . '/dist/css/';
      $manifest = asset_manifest($type);

      if (isset($manifest[$manifestKey])) {
            return $baseUrl . $manifest[$manifestKey];
      }
      error_log("[asset] Asset not found in manifest: $logical (key: $manifestKey)");
      return $baseUrl . $logical;
}

/**
 * Output favicon link tags
 * Include this in the <head> of every page
 */
function favicon()
{
      $basePath = get_base_path();
      echo '<link rel="icon" href="' . $basePath . '/favicon.ico" sizes="32x32">' . "\n";
      echo '    <link rel="icon" type="image/svg+xml" href="' . $basePath . '/assets/images/favicon.svg">' . "\n";
      echo '    <link rel="icon" type="image/png" sizes="32x32" href="' . $basePath . '/assets/images/favicon-32.png">' . "\n";
      echo '    <link rel="apple-touch-icon" href="' . $basePath . '/assets/images/favicon-180.png">';
}
