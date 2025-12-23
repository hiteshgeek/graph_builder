<?php

declare(strict_types=1);

class QueryValidator
{
    private static array $blockedKeywords = [
        'DROP',
        'DELETE',
        'TRUNCATE',
        'ALTER',
        'CREATE',
        'INSERT',
        'UPDATE',
        'GRANT',
        'REVOKE',
        'REPLACE',
        'RENAME',
        'LOAD',
        'CALL',
        'EXECUTE',
        'EXEC',
    ];

    private static array $blockedPatterns = [
        '/;\s*\w/i',
        '/UNION\s+ALL\s+SELECT/i',
        '/INTO\s+OUTFILE/i',
        '/INTO\s+DUMPFILE/i',
        '/BENCHMARK\s*\(/i',
        '/SLEEP\s*\(/i',
    ];

    public static function validate(string $sql): array
    {
        $errors = [];
        $warnings = [];
        $sql = trim($sql);

        if (empty($sql)) {
            $errors[] = 'Query cannot be empty';
            return ['valid' => false, 'errors' => $errors, 'warnings' => $warnings];
        }

        if (!self::isSelectQuery($sql)) {
            $errors[] = 'Only SELECT queries are allowed';
        }

        foreach (self::$blockedKeywords as $keyword) {
            if (preg_match('/\b' . $keyword . '\b/i', $sql)) {
                $errors[] = "Keyword '{$keyword}' is not allowed";
            }
        }

        foreach (self::$blockedPatterns as $pattern) {
            if (preg_match($pattern, $sql)) {
                $errors[] = 'Query contains potentially dangerous pattern';
                break;
            }
        }

        if (substr_count($sql, ';') > 1) {
            $errors[] = 'Multiple statements are not allowed';
        }

        if (stripos($sql, 'LIMIT') === false) {
            $warnings[] = 'Consider adding LIMIT to prevent large result sets';
        }

        return [
            'valid' => empty($errors),
            'errors' => $errors,
            'warnings' => $warnings
        ];
    }

    public static function isSelectQuery(string $sql): bool
    {
        $sql = trim($sql);
        $sql = preg_replace('/^\s*\(/', '', $sql);
        return preg_match('/^\s*SELECT\b/i', $sql) === 1;
    }

    public static function sanitize(string $sql): string
    {
        $sql = trim($sql);
        $sql = rtrim($sql, ';');
        $sql = preg_replace('/\s+/', ' ', $sql);
        return $sql;
    }
}
