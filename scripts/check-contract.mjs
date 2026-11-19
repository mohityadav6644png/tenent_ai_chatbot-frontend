import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths to check
const openapiPaths = [
  path.resolve(__dirname, '../../docs/backend-openapi.json'),
  path.resolve(__dirname, '../docs/backend-openapi.json'),
];

let openapiFile = openapiPaths.find((p) => fs.existsSync(p));
if (!openapiFile) {
  console.error('[check-contract] Error: docs/backend-openapi.json not found');
  process.exit(1);
}

const openapi = JSON.parse(fs.readFileSync(openapiFile, 'utf8'));
const validOpenApiPaths = Object.keys(openapi.paths || {});

// Helper to convert an openapi path pattern (e.g. /v1/company/datasets/{dataset}/imports) into a regex
function openapiPathToRegex(pattern) {
  const escaped = pattern.replace(/\{[^}]+\}/g, '([^/]+)');
  return new RegExp(`^${escaped}$`);
}

const openapiRegexes = validOpenApiPaths.map((p) => ({
  pattern: p,
  regex: openapiPathToRegex(p),
}));

const apiDir = path.resolve(__dirname, '../src/api/v1');
const apiFiles = fs.readdirSync(apiDir).filter((f) => f.endsWith('.api.js'));

let hasError = false;
const checkedPaths = new Set();

for (const file of apiFiles) {
  const content = fs.readFileSync(path.join(apiDir, file), 'utf8');

  // Match literal paths '/v1/...' or template strings `/v1/...`
  // Examples:
  // '/v1/company/data/insert'
  // `/v1/company/datasets/${encodeURIComponent(dataset)}/imports`
  // `${API_BASE_URL}/v1/company/datasets/${encodeURIComponent(datasetKey)}/template`
  const matches = content.matchAll(/(?:`|'|")(?:\$\{API_BASE_URL\})?(\/v1\/[^`'"]+)(?:`|'|")/g);

  for (const match of matches) {
    let rawPath = match[1];

    // Strip query string if any
    if (rawPath.includes('?')) {
      rawPath = rawPath.split('?')[0];
    }

    // Replace template expressions like ${encodeURIComponent(x)} or ${x} with a wildcard
    // Example: /v1/company/datasets/${encodeURIComponent(dataset)}/imports -> /v1/company/datasets/{param}/imports
    const normalizedFrontendPath = rawPath.replace(/\$\{[^}]+\}/g, '{param}');

    if (checkedPaths.has(normalizedFrontendPath)) {
      continue;
    }
    checkedPaths.add(normalizedFrontendPath);

    // Convert normalizedFrontendPath to regex test against valid openapi paths
    const frontendRegex = new RegExp(
      '^' +
        normalizedFrontendPath
          .replace(/\{param\}/g, '[^/]+')
          .replace(/\//g, '\\/') +
        '$'
    );

    const matchFound = validOpenApiPaths.some((openPath) => {
      // Direct match
      if (openPath === rawPath) return true;
      // Regex match
      const openRegex = openapiPathToRegex(openPath);
      return (
        openRegex.test(normalizedFrontendPath.replace(/\{param\}/g, 'dummy')) ||
        frontendRegex.test(openPath.replace(/\{[^}]+\}/g, 'dummy'))
      );
    });

    if (!matchFound) {
      console.error(
        `[check-contract] Error in ${file}: Path "${rawPath}" (normalized: "${normalizedFrontendPath}") not found in docs/backend-openapi.json`
      );
      hasError = true;
    } else {
      console.log(`[check-contract] OK: ${normalizedFrontendPath}`);
    }
  }
}

if (hasError) {
  console.error('[check-contract] Contract validation failed: Frontend calls endpoints not present in OpenAPI spec.');
  process.exit(1);
} else {
  console.log(`[check-contract] Success: All ${checkedPaths.size} frontend API paths match backend OpenAPI spec.`);
}
