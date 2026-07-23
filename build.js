/**
 * build.js — Minifica CSS e JS para producao
 * Uso: npm run build
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const PUBLIC = path.join(__dirname, 'public');
const DIST   = path.join(__dirname, 'dist');
const CSS_IN = path.join(PUBLIC, 'css', 'style.css');
const JS_IN  = path.join(PUBLIC, 'js', 'app.js');
const HTML_IN = path.join(PUBLIC, 'index.html');

function run(cmd) {
  try { execSync(cmd, { stdio: 'inherit' }); return true; }
  catch { return false; }
}

console.log('  [build] Iniciando...\n');

// --- CSS ---
if (fs.existsSync(CSS_IN)) {
  const cssOut = path.join(DIST, 'css', 'style.min.css');
  fs.mkdirSync(path.join(DIST, 'css'), { recursive: true });
  console.log('  [build] CSS -> dist/css/style.min.css');
  const ok = run(`npx csso-cli "${CSS_IN}" -o "${cssOut}"`);
  if (!ok) {
    console.log('  [build] csso falhou, copiando CSS bruto...');
    fs.copyFileSync(CSS_IN, cssOut);
  }
}

// --- JS ---
if (fs.existsSync(JS_IN)) {
  const jsOut = path.join(DIST, 'js', 'app.min.js');
  fs.mkdirSync(path.join(DIST, 'js'), { recursive: true });
  console.log('  [build] JS  -> dist/js/app.min.js');
  const ok = run(`npx terser "${JS_IN}" -o "${jsOut}" -c -m`);
  if (!ok) {
    console.log('  [build] terser falhou, copiando JS bruto...');
    fs.copyFileSync(JS_IN, jsOut);
  }
}

// --- HTML (substitui referencias para min) ---
if (fs.existsSync(HTML_IN)) {
  const htmlOut = path.join(DIST, 'index.html');
  let html = fs.readFileSync(HTML_IN, 'utf-8');
  html = html.replace('/css/style.css', '/css/style.min.css');
  html = html.replace('/js/app.js', '/js/app.min.js');
  fs.mkdirSync(DIST, { recursive: true });
  fs.writeFileSync(htmlOut, html, 'utf-8');
  console.log('  [build] HTML -> dist/index.html');
}

// --- Copia imagens/outras coisas se existir ---
const assetsDir = path.join(PUBLIC, 'assets');
if (fs.existsSync(assetsDir)) {
  fs.cpSync(assetsDir, path.join(DIST, 'assets'), { recursive: true });
}

const cssDir = path.join(PUBLIC, 'css');
const cssDist = path.join(DIST, 'css');
if (fs.existsSync(CSS_IN)) {
  // copia css minimo ja feito
}
// copia o original tambem para compat
if (fs.existsSync(CSS_IN)) fs.copyFileSync(CSS_IN, path.join(cssDist, 'style.css'));
const jsDir = path.join(PUBLIC, 'js');
const jsDist = path.join(DIST, 'js');
if (fs.existsSync(JS_IN)) fs.copyFileSync(JS_IN, path.join(jsDist, 'app.js'));

console.log('\n  [build] Frontend pronto em dist/');

// ============================================================
// BACKEND — copia server.js, config, data e media para dist/
// ============================================================
const DIST_SERVER = path.join(DIST, 'server.js');
const SERVER_SRC = path.join(__dirname, 'server.js');

if (fs.existsSync(SERVER_SRC)) {
  let serverCode = fs.readFileSync(SERVER_SRC, 'utf-8');
  // dist/server.js serve de si mesmo (nao precisa de auto-detect)
  serverCode = serverCode.replace(
    /const STATIC_DIR =.*\napp\.use\(express\.static\(STATIC_DIR\)\);/,
    "app.use(express.static(__dirname));"
  );
  fs.writeFileSync(DIST_SERVER, serverCode, 'utf-8');
  console.log('  [build] Server   -> dist/server.js');
}

// config.json
const configSrc = path.join(__dirname, 'config.json');
const configDst = path.join(DIST, 'config.json');
if (fs.existsSync(configSrc)) {
  fs.copyFileSync(configSrc, configDst);
  console.log('  [build] Config   -> dist/config.json');
} else {
  fs.writeFileSync(configDst, JSON.stringify({ pastaMedia: './media' }, null, 2), 'utf-8');
  console.log('  [build] Config   -> dist/config.json (padrao)');
}

// data/
const dataSrc = path.join(__dirname, 'data');
const dataDst = path.join(DIST, 'data');
if (fs.existsSync(dataSrc)) {
  fs.cpSync(dataSrc, dataDst, { recursive: true });
  console.log('  [build] Data     -> dist/data/');
} else {
  fs.mkdirSync(dataDst, { recursive: true });
  console.log('  [build] Data     -> dist/data/ (criado)');
}

// media/ (pasta padrao para videos)
const mediaDst = path.join(DIST, 'media');
fs.mkdirSync(mediaDst, { recursive: true });
console.log('  [build] Media    -> dist/media/');

console.log('\n  [build] Pronto! dist/ pronto para producao');
console.log('    cd dist && npm install --omit=dev && node server.js');
