import { writeFile } from "node:fs/promises";
import openapiTS, { astToString } from "openapi-typescript";

const SOURCE_URL = "https://api.hevyapp.com/docs/swagger-ui-init.js";
const OUT = "src/api/types.ts";

const res = await fetch(SOURCE_URL);
if (!res.ok) {
  throw new Error(`failed to fetch ${SOURCE_URL}: ${res.status} ${res.statusText}`);
}
const js = await res.text();

const spec = extractSwaggerDoc(js);
normalizeSpec(spec as any);
const ast = await openapiTS(spec as Parameters<typeof openapiTS>[0]);
const contents = `// GENERATED — do not edit by hand. Run \`npm run gen:types\`.\n${astToString(ast)}`;
await writeFile(OUT, contents, "utf8");
console.error(`wrote ${OUT}`);

function extractSwaggerDoc(src: string): unknown {
  const key = '"swaggerDoc":';
  const start = src.indexOf(key);
  if (start === -1) throw new Error("swaggerDoc key not found in source");
  // Walk forward from the colon to the first `{`, then balance braces (ignoring those inside strings).
  let i = src.indexOf("{", start + key.length);
  if (i === -1) throw new Error("swaggerDoc opening brace not found");
  const objStart = i;
  let depth = 0;
  let inStr = false;
  let escape = false;
  for (; i < src.length; i++) {
    const c = src[i];
    if (escape) { escape = false; continue; }
    if (c === "\\") { escape = true; continue; }
    if (c === '"') { inStr = !inStr; continue; }
    if (inStr) continue;
    if (c === "{") depth++;
    else if (c === "}") {
      depth--;
      if (depth === 0) {
        const json = src.slice(objStart, i + 1);
        return JSON.parse(json);
      }
    }
  }
  throw new Error("swaggerDoc closing brace not found");
}

function normalizeSpec(spec: any) {
  // Ensure all required fields are arrays
  const walk = (obj: any) => {
    if (!obj || typeof obj !== "object") return;
    if (Array.isArray(obj)) {
      obj.forEach(walk);
      return;
    }
    if (obj.required && !Array.isArray(obj.required)) {
      console.error(`WARNING: Converting required to array for:`, obj);
      obj.required = Object.keys(obj.required || {});
    }
    Object.values(obj).forEach(walk);
  };
  walk(spec);
}
