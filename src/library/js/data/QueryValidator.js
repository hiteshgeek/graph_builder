/**
 * QueryValidator - Client-side SQL validation
 */
class QueryValidator {
    static blockedKeywords = [
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
        'RENAME'
    ];

    /**
     * Validate SQL query
     * @param {string} sql
     * @returns {Object} { valid: boolean, errors: string[], warnings: string[] }
     */
    static validate(sql) {
        const errors = [];
        const warnings = [];
        const trimmed = (sql || '').trim();

        if (!trimmed) {
            errors.push('Query cannot be empty');
            return { valid: false, errors, warnings };
        }

        if (!this.isSelectQuery(trimmed)) {
            errors.push('Only SELECT queries are allowed');
        }

        for (const keyword of this.blockedKeywords) {
            const regex = new RegExp(`\\b${keyword}\\b`, 'i');
            if (regex.test(trimmed)) {
                errors.push(`Keyword '${keyword}' is not allowed`);
            }
        }

        if ((trimmed.match(/;/g) || []).length > 1) {
            errors.push('Multiple statements are not allowed');
        }

        if (!/\bLIMIT\b/i.test(trimmed)) {
            warnings.push('Consider adding LIMIT to prevent large result sets');
        }

        return {
            valid: errors.length === 0,
            errors,
            warnings
        };
    }

    /**
     * Check if query is SELECT only
     * @param {string} sql
     * @returns {boolean}
     */
    static isSelectQuery(sql) {
        const trimmed = (sql || '').trim().replace(/^\s*\(/, '');
        return /^\s*SELECT\b/i.test(trimmed);
    }

    /**
     * Extract table names from query
     * @param {string} sql
     * @returns {string[]}
     */
    static extractTables(sql) {
        const tables = [];
        const fromMatch = sql.match(/\bFROM\s+([`'\"]?\w+[`'\"]?)/gi);
        const joinMatch = sql.match(/\bJOIN\s+([`'\"]?\w+[`'\"]?)/gi);

        if (fromMatch) {
            fromMatch.forEach(match => {
                const table = match.replace(/^FROM\s+/i, '').replace(/[`'"]/g, '');
                if (!tables.includes(table)) tables.push(table);
            });
        }

        if (joinMatch) {
            joinMatch.forEach(match => {
                const table = match.replace(/^JOIN\s+/i, '').replace(/[`'"]/g, '');
                if (!tables.includes(table)) tables.push(table);
            });
        }

        return tables;
    }
}

export { QueryValidator };
