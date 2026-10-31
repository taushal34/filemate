/**
 * Formatting and Code Generation utilities
 */

export function formatJson(input: string, indent: number | '\t' = 2): { success: boolean; result?: string; error?: string } {
  try {
    const parsed = JSON.parse(input);
    return {
      success: true,
      result: JSON.stringify(parsed, null, indent),
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Invalid JSON format',
    };
  }
}

export function minifyJson(input: string): { success: boolean; result?: string; error?: string } {
  try {
    const parsed = JSON.parse(input);
    return {
      success: true,
      result: JSON.stringify(parsed),
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Invalid JSON format',
    };
  }
}

export function jsonToTypeScript(jsonStr: string, rootInterfaceName = 'RootObject'): { success: boolean; result?: string; error?: string } {
  try {
    const parsed = JSON.parse(jsonStr);

    const interfaces: Map<string, string> = new Map();

    function getType(val: any, keyHint: string): string {
      if (val === null) return 'null';
      if (typeof val === 'string') return 'string';
      if (typeof val === 'number') return 'number';
      if (typeof val === 'boolean') return 'boolean';

      if (Array.isArray(val)) {
        if (val.length === 0) return 'any[]';
        const innerType = getType(val[0], keyHint.endsWith('s') ? keyHint.slice(0, -1) : `${keyHint}Item`);
        return `${innerType}[]`;
      }

      if (typeof val === 'object') {
        const nestedName = keyHint.charAt(0).toUpperCase() + keyHint.slice(1);
        generateInterface(val, nestedName);
        return nestedName;
      }

      return 'any';
    }

    function generateInterface(obj: Record<string, any>, name: string) {
      if (interfaces.has(name)) return;

      const lines: string[] = [`export interface ${name} {`];
      for (const [key, value] of Object.entries(obj)) {
        const typeStr = getType(value, key);
        const safeKey = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key) ? key : JSON.stringify(key);
        lines.push(`  ${safeKey}: ${typeStr};`);
      }
      lines.push('}');
      interfaces.set(name, lines.join('\n'));
    }

    if (Array.isArray(parsed)) {
      if (parsed.length > 0 && typeof parsed[0] === 'object' && parsed[0] !== null) {
        generateInterface(parsed[0], rootInterfaceName);
        return {
          success: true,
          result: `${Array.from(interfaces.values()).join('\n\n')}\n\nexport type ${rootInterfaceName}List = ${rootInterfaceName}[];`,
        };
      } else {
        return {
          success: true,
          result: `export type ${rootInterfaceName} = ${getType(parsed, 'item')};`,
        };
      }
    } else if (typeof parsed === 'object' && parsed !== null) {
      generateInterface(parsed, rootInterfaceName);
      return {
        success: true,
        result: Array.from(interfaces.values()).reverse().join('\n\n'),
      };
    } else {
      return {
        success: true,
        result: `export type ${rootInterfaceName} = ${typeof parsed};`,
      };
    }
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Failed to generate TypeScript interface',
    };
  }
}

export function jsonToZod(jsonStr: string, rootName = 'rootSchema'): { success: boolean; result?: string; error?: string } {
  try {
    const parsed = JSON.parse(jsonStr);

    function getZodType(val: any): string {
      if (val === null) return 'z.null()';
      if (typeof val === 'string') return 'z.string()';
      if (typeof val === 'number') return 'z.number()';
      if (typeof val === 'boolean') return 'z.boolean()';

      if (Array.isArray(val)) {
        if (val.length === 0) return 'z.array(z.unknown())';
        return `z.array(${getZodType(val[0])})`;
      }

      if (typeof val === 'object') {
        const fields = Object.entries(val).map(([k, v]) => {
          const safeKey = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(k) ? k : JSON.stringify(k);
          return `  ${safeKey}: ${getZodType(v)}`;
        });
        return `z.object({\n${fields.join(',\n')}\n})`;
      }

      return 'z.unknown()';
    }

    const typeDef = getZodType(parsed);
    const code = `import { z } from 'zod';\n\nexport const ${rootName} = ${typeDef};\n\nexport type ${rootName.charAt(0).toUpperCase() + rootName.slice(1).replace('Schema', '')} = z.infer<typeof ${rootName}>;`;

    return {
      success: true,
      result: code,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Failed to generate Zod schema',
    };
  }
}

export function jsonToCsv(jsonStr: string): { success: boolean; result?: string; error?: string } {
  try {
    const parsed = JSON.parse(jsonStr);
    const array = Array.isArray(parsed) ? parsed : [parsed];
    if (array.length === 0) return { success: true, result: '' };

    const keys = Array.from(
      new Set(
        array.flatMap(item => (typeof item === 'object' && item !== null ? Object.keys(item) : ['value']))
      )
    );

    const escapeCsv = (val: any) => {
      if (val === null || val === undefined) return '';
      const str = typeof val === 'object' ? JSON.stringify(val) : String(val);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const header = keys.map(k => escapeCsv(k)).join(',');
    const rows = array.map(item => {
      if (typeof item === 'object' && item !== null) {
        return keys.map(k => escapeCsv(item[k])).join(',');
      }
      return escapeCsv(item);
    });

    return {
      success: true,
      result: [header, ...rows].join('\n'),
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Failed to convert JSON to CSV',
    };
  }
}

export function formatSql(sql: string): string {
  const keywords = [
    'SELECT', 'FROM', 'WHERE', 'AND', 'OR', 'INSERT INTO', 'VALUES',
    'UPDATE', 'SET', 'DELETE', 'INNER JOIN', 'LEFT JOIN', 'RIGHT JOIN',
    'FULL JOIN', 'JOIN', 'ON', 'GROUP BY', 'ORDER BY', 'HAVING',
    'LIMIT', 'OFFSET', 'UNION', 'CREATE TABLE', 'ALTER TABLE', 'DROP TABLE',
    'AS', 'DISTINCT', 'COUNT', 'SUM', 'AVG', 'MIN', 'MAX', 'IN', 'NOT IN',
    'EXISTS', 'NOT EXISTS', 'LIKE', 'ILIKE', 'IS NULL', 'IS NOT NULL',
    'ASC', 'DESC', 'CASE', 'WHEN', 'THEN', 'ELSE', 'END', 'PRIMARY KEY'
  ];

  let formatted = sql.trim();
  // Uppercase keywords
  keywords.forEach(kw => {
    const regex = new RegExp(`\\b${kw}\\b`, 'gi');
    formatted = formatted.replace(regex, kw);
  });

  const breakKeywords = [
    'SELECT', 'FROM', 'WHERE', 'AND', 'OR', 'LEFT JOIN', 'RIGHT JOIN',
    'INNER JOIN', 'FULL JOIN', 'JOIN', 'GROUP BY', 'ORDER BY', 'HAVING',
    'LIMIT', 'OFFSET', 'VALUES', 'SET'
  ];

  breakKeywords.forEach(kw => {
    const regex = new RegExp(`\\s*\\b(${kw})\\b\\s*`, 'g');
    formatted = formatted.replace(regex, `\n$1 `);
  });

  return formatted
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .join('\n');
}
