import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

const walk = (dir) => {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(fullPath) : [fullPath];
  });
};

const srcFiles = walk(path.join(root, "src")).filter((filePath) =>
  /\.(js|jsx)$/.test(filePath)
);

const write = (relativePath, content) => {
  const fullPath = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content, "utf8");
};

const update = (relativePath, transform) => {
  const fullPath = path.join(root, relativePath);
  const current = fs.readFileSync(fullPath, "utf8");
  const next = transform(current);
  if (next !== current) {
    fs.writeFileSync(fullPath, next, "utf8");
  }
};

write(
  "src/api/clineClient.js",
  `import { createClient } from "@base44/sdk";
import { appParams } from "@/lib/app-params";

const { appId, token, functionsVersion, appBaseUrl } = appParams;

export const cline = createClient({
  appId,
  token,
  functionsVersion,
  serverUrl: "",
  requiresAuth: false,
  appBaseUrl
});
`
);

write("src/api/base44Client.js", `export { cline } from "./clineClient";\n`);

for (const filePath of srcFiles) {
  const current = fs.readFileSync(filePath, "utf8");
  let next = current;

  next = next
    .replaceAll("@/api/base44Client", "@/api/clineClient")
    .replaceAll("./api/base44Client", "./api/clineClient")
    .replaceAll("../api/base44Client", "../api/clineClient")
    .replaceAll("import { base44 }", "import { cline }")
    .replaceAll("{ base44 }", "{ cline }")
    .replaceAll("({ base44 })", "({ cline })")
    .replaceAll("base44.auth", "cline.auth")
    .replaceAll("base44.entities", "cline.entities")
    .replaceAll("base44.integrations", "cline.integrations")
    .replaceAll("base44_", "cline_");

  if (next !== current) {
    fs.writeFileSync(filePath, next, "utf8");
  }
}

update("src/lib/app-params.js", (text) =>
  text
    .replaceAll("base44_", "cline_")
    .replaceAll("base44_access_token", "cline_access_token")
    .replaceAll("VITE_BASE44_APP_ID", "VITE_CLINE_APP_ID")
    .replaceAll("VITE_BASE44_FUNCTIONS_VERSION", "VITE_CLINE_FUNCTIONS_VERSION")
    .replaceAll("VITE_BASE44_APP_BASE_URL", "VITE_CLINE_APP_BASE_URL")
);

update("vite.config.js", (text) =>
  text
    .replace('import base44 from "@base44/vite-plugin"', 'import clinePlugin from "@base44/vite-plugin"')
    .replace("    base44({", "    clinePlugin({")
    .replaceAll("base44 SDK", "Cline SDK")
    .replaceAll("BASE44_LEGACY_SDK_IMPORTS", "CLINE_LEGACY_SDK_IMPORTS")
);

update("index.html", (text) =>
  text
    .replace(/\s*<link rel="icon" type="image\/svg\+xml" href="https:\/\/base44\.com\/logo_v2\.svg" \/>\r?\n/, "\n")
    .replace("<title>Base44 APP</title>", "<title>Cline APP</title>")
);

update(".env", (text) => text.replaceAll("VITE_BASE44_APP_BASE_URL", "VITE_CLINE_APP_BASE_URL"));
update("package.json", (text) => text.replace('"name": "base44-app"', '"name": "cline-app"'));
update("package-lock.json", (text) => text.replaceAll('"name": "base44-app"', '"name": "cline-app"'));

write(
  "README.md",
  `# Cline

Aplicação Vitalle em React + Vite.

## Scripts

- \`npm run dev\`
- \`npm run build\`
- \`npm run lint\`
- \`npm run typecheck\`
`
);

console.log("rename-base44-to-cline: ok");