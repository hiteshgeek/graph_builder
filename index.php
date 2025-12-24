<?php
require_once __DIR__ . '/includes/functions.php';

// Check if editing an existing graph
$editGraphId = isset($_GET['edit']) ? (int) $_GET['edit'] : null;
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Graph Builder</title>
    <?php favicon(); ?>
    <!-- Highlight.js for SQL syntax highlighting -->
    <link id="hljs-light" rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github.min.css">
    <link id="hljs-dark" rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github-dark.min.css" disabled>
    <link rel="stylesheet" href="<?= asset('graph-creator.css') ?>">
    <link rel="stylesheet" href="<?= asset('main.css') ?>">
</head>
<body>
    <div id="graph-builder"></div>

    <?php if ($editGraphId): ?>
    <script>
        window.GRAPH_BUILDER_EDIT_ID = <?= $editGraphId ?>;
    </script>
    <?php endif; ?>

    <!-- Highlight.js -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/languages/sql.min.js"></script>
    <script>
        // Sync highlight.js theme with app theme
        (function() {
            const lightTheme = document.getElementById('hljs-light');
            const darkTheme = document.getElementById('hljs-dark');

            function updateHljsTheme() {
                const theme = document.documentElement.getAttribute('data-theme');
                const isDark = theme === 'dark' ||
                    (theme !== 'light' && window.matchMedia('(prefers-color-scheme: dark)').matches);
                lightTheme.disabled = isDark;
                darkTheme.disabled = !isDark;
            }

            // Initial update
            updateHljsTheme();

            // Watch for theme changes
            const observer = new MutationObserver(updateHljsTheme);
            observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

            // Watch for system theme changes
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', updateHljsTheme);
        })();
    </script>
    <script type="module" src="<?= asset('main.js') ?>"></script>
    <script nomodule src="<?= asset('main.js', 'nomodule') ?>"></script>
</body>
</html>
