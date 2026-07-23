const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const PORTA = 3000;
const CAMINHO_CONFIG = path.join(__dirname, 'config.json');
const EXTENSOES_VALIDAS = ['.mp4', '.mkv', '.webm', '.avi', '.mov'];
const DATA_DIR = path.join(__dirname, 'data');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ============================================================
// CONFIGURACAO
// ============================================================
function lerConfig() {
  try {
    if (fs.existsSync(CAMINHO_CONFIG)) {
      const dados = JSON.parse(fs.readFileSync(CAMINHO_CONFIG, 'utf-8'));
      const caminho = dados.pastaMedia || './media';
      return path.isAbsolute(caminho) ? caminho : path.resolve(__dirname, caminho);
    }
  } catch (err) {
    console.error('Erro ao ler config.json:', err.message);
  }
  return path.join(__dirname, 'media');
}

function salvarConfig(caminhoPasta) {
  fs.writeFileSync(CAMINHO_CONFIG, JSON.stringify({ pastaMedia: caminhoPasta }, null, 2), 'utf-8');
}

let pastaMedia = lerConfig();

// ============================================================
// DATA PERSISTENCE (users, watch, categories)
// ============================================================
function lerDados(nome) {
  const caminho = path.join(DATA_DIR, `${nome}.json`);
  try {
    if (fs.existsSync(caminho)) return JSON.parse(fs.readFileSync(caminho, 'utf-8'));
  } catch { /* ignore */ }
  return nome === 'users' ? [] : {};
}

function salvarDados(nome, dados) {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(path.join(DATA_DIR, `${nome}.json`), JSON.stringify(dados, null, 2), 'utf-8');
}

function gerarId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// ============================================================
// UTILITARIOS
// ============================================================
function nomeAmigavel(nomeArquivo) {
  return path.parse(nomeArquivo).name.replace(/[_-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function buscarVideos(pasta) {
  const videos = [];
  if (!fs.existsSync(pasta)) return videos;
  for (const item of fs.readdirSync(pasta, { withFileTypes: true })) {
    const caminhoCompleto = path.join(pasta, item.name);
    if (item.isDirectory()) {
      videos.push(...buscarVideos(caminhoCompleto));
    } else if (EXTENSOES_VALIDAS.includes(path.extname(item.name).toLowerCase())) {
      const stats = fs.statSync(caminhoCompleto);
      const caminhoRelativo = path.relative(pastaMedia, caminhoCompleto);
      videos.push({
        id: Buffer.from(caminhoRelativo).toString('base64url'),
        titulo: nomeAmigavel(item.name),
        arquivo: item.name,
        caminhoRelativo,
        tamanho: stats.size,
        tamanhoFormatado: formatarTamanho(stats.size),
        extensao: path.extname(item.name).toLowerCase(),
      });
    }
  }
  return videos;
}

function formatarTamanho(bytes) {
  return bytes >= 1073741824
    ? (bytes / 1073741824).toFixed(2) + ' GB'
    : (bytes / 1048576).toFixed(1) + ' MB';
}

function extrairHierarquia(caminhoRelativo) {
  const partes = caminhoRelativo.split(/[\\/]/);
  if (partes.length <= 1) {
    return { show: nomeAmigavel(path.parse(partes[0]).name), temporada: null, numTemporada: 0, categoria: null };
  }
  const nomePasta = partes[partes.length - 2];
  const padroes = [
    { regex: /(\d+)\s*temporada/i, label: (n) => `Temporada ${n}` },
    { regex: /season\s*(\d+)/i, label: (n) => `Temporada ${n}` },
    { regex: /s(\d{1,2})/i, label: (n) => `Temporada ${n}` },
  ];
  for (const { regex, label } of padroes) {
    const m = nomePasta.match(regex);
    if (m) {
      const num = parseInt(m[1], 10);
      const showBruto = nomePasta.replace(regex, '').replace(/completa/i, '').replace(/\s+/g, ' ').trim();
      return { show: showBruto || nomeAmigavel(nomePasta), temporada: label(num), numTemporada: num, categoria: partes.length >= 3 ? partes[0] : null };
    }
  }
  return { show: nomeAmigavel(nomePasta), temporada: null, numTemporada: 0, categoria: partes.length >= 3 ? partes[0] : null };
}

// ============================================================
// API: CONFIG
// ============================================================
app.get('/api/config', (req, res) => {
  const existe = fs.existsSync(pastaMedia);
  res.json({ pastaMedia, pastaExiste: existe, totalVideos: existe ? buscarVideos(pastaMedia).length : 0 });
});

app.put('/api/config', (req, res) => {
  const { pastaMedia: novaPasta } = req.body;
  if (!novaPasta || typeof novaPasta !== 'string') return res.status(400).json({ erro: 'Caminho obrigatorio.' });
  const caminho = path.normalize(novaPasta.trim());
  if (!fs.existsSync(caminho)) return res.status(400).json({ erro: `Pasta nao encontrada: ${caminho}` });
  if (!fs.statSync(caminho).isDirectory()) return res.status(400).json({ erro: 'Nao e uma pasta.' });
  pastaMedia = caminho;
  salvarConfig(caminho);
  const total = buscarVideos(pastaMedia).length;
  console.log(`  [DIR] Pasta alterada: ${pastaMedia} (${total} videos)`);
  res.json({ pastaMedia, pastaExiste: true, totalVideos: total, mensagem: 'Sucesso!' });
});

// ============================================================
// API: USERS
// ============================================================
app.get('/api/users', (req, res) => {
  const usuarios = lerDados('users');
  res.json(usuarios.map(u => ({ id: u.id, nome: u.nome, cor: u.cor, criadoEm: u.criadoEm })));
});

app.post('/api/users', (req, res) => {
  const { nome, cor } = req.body;
  if (!nome || typeof nome !== 'string' || nome.trim().length === 0) {
    return res.status(400).json({ erro: 'Nome obrigatorio.' });
  }
  const usuarios = lerDados('users');
  const id = gerarId();
  const usuario = {
    id,
    nome: nome.trim(),
    cor: cor || '#e50914',
    criadoEm: new Date().toISOString(),
  };
  usuarios.push(usuario);
  salvarDados('users', usuarios);
  res.json(usuario);
});

app.delete('/api/users/:id', (req, res) => {
  let usuarios = lerDados('users');
  const antes = usuarios.length;
  usuarios = usuarios.filter(u => u.id !== req.params.id);
  if (usuarios.length === antes) return res.status(404).json({ erro: 'Usuario nao encontrado.' });
  salvarDados('users', usuarios);
  // limpa dados do usuario
  const watch = lerDados('watch');
  delete watch[req.params.id];
  salvarDados('watch', watch);
  const cats = lerDados('categories');
  delete cats[req.params.id];
  salvarDados('categories', cats);
  res.json({ ok: true });
});

// ============================================================
// API: WATCH (assistidos)
// ============================================================
app.get('/api/watch/:userId', (req, res) => {
  const watch = lerDados('watch');
  res.json(watch[req.params.userId] || {});
});

app.post('/api/watch/:userId', (req, res) => {
  const { videoId, progresso, assistido } = req.body;
  if (!videoId) return res.status(400).json({ erro: 'videoId obrigatorio.' });
  const watch = lerDados('watch');
  if (!watch[req.params.userId]) watch[req.params.userId] = {};
  const anterior = watch[req.params.userId][videoId] || {};
  watch[req.params.userId][videoId] = {
    progresso: progresso != null ? Math.min(100, Math.max(0, progresso)) : anterior.progresso || 0,
    assistido: assistido != null ? !!assistido : anterior.assistido || false,
    ultimaVez: new Date().toISOString(),
  };
  salvarDados('watch', watch);
  res.json(watch[req.params.userId][videoId]);
});

app.post('/api/watch/:userId/batch', (req, res) => {
  const { items } = req.body;
  if (!Array.isArray(items)) return res.status(400).json({ erro: 'items deve ser array.' });
  const watch = lerDados('watch');
  if (!watch[req.params.userId]) watch[req.params.userId] = {};
  for (const item of items) {
    if (!item.videoId) continue;
    const anterior = watch[req.params.userId][item.videoId] || {};
    watch[req.params.userId][item.videoId] = {
      progresso: item.progresso != null ? Math.min(100, Math.max(0, item.progresso)) : anterior.progresso || 0,
      assistido: item.assistido != null ? !!item.assistido : anterior.assistido || false,
      ultimaVez: new Date().toISOString(),
    };
  }
  salvarDados('watch', watch);
  res.json({ ok: true });
});

// ============================================================
// API: CATEGORIES (por usuario)
// ============================================================
app.get('/api/categories/:userId', (req, res) => {
  const cats = lerDados('categories');
  res.json(cats[req.params.userId] || {});
});

app.put('/api/categories/:userId', (req, res) => {
  const { show, categorias } = req.body;
  if (!show || !Array.isArray(categorias)) return res.status(400).json({ erro: 'show e categorias (array) obrigatorios.' });
  const cats = lerDados('categories');
  if (!cats[req.params.userId]) cats[req.params.userId] = {};
  cats[req.params.userId][show] = categorias.filter(c => typeof c === 'string' && c.trim());
  salvarDados('categories', cats);
  res.json(cats[req.params.userId]);
});

// ============================================================
// API: MOVIES
// ============================================================
app.get('/api/movies', (req, res) => {
  const videos = buscarVideos(pastaMedia);
  videos.sort((a, b) => a.caminhoRelativo.localeCompare(b.caminhoRelativo, undefined, { numeric: true, sensitivity: 'base' }));
  res.json({
    total: videos.length,
    pasta: pastaMedia,
    filmes: videos.map((v) => {
      const h = extrairHierarquia(v.caminhoRelativo);
      return {
        id: v.id,
        titulo: v.titulo,
        tamanho: v.tamanhoFormatado,
        extensao: v.extensao,
        thumbnail: `/api/thumbnail/${v.id}`,
        caminhoCompleto: v.caminhoRelativo,
        show: h.show,
        temporada: h.temporada,
        numTemporada: h.numTemporada,
        categoria: h.categoria,
      };
    }),
  });
});

// ============================================================
// API: THUMBNAIL
// ============================================================
app.get('/api/thumbnail/:id', (req, res) => {
  const videos = buscarVideos(pastaMedia);
  const video = videos.find((v) => v.id === req.params.id);
  if (!video) return res.status(404).json({ erro: 'Nao encontrado' });
  const palavras = video.titulo.split(' ');
  const ini = palavras.length >= 2 ? (palavras[0][0] + palavras[1][0]).toUpperCase() : video.titulo.substring(0, 2).toUpperCase();
  const cores = ['#e50914', '#b20710', '#141414', '#0071eb', '#5b21b6', '#059669', '#d97706', '#dc2626', '#7c3aed', '#0891b2'];
  const cor = cores[video.titulo.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % cores.length];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="225" viewBox="0 0 400 225"><defs><linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:${cor}"/><stop offset="100%" style="stop-color:#000;stop-opacity:0.9"/></linearGradient></defs><rect width="400" height="225" fill="url(#bg)" rx="8"/><text x="200" y="105" text-anchor="middle" dominant-baseline="middle" font-family="Arial" font-size="60" font-weight="bold" fill="white" opacity="0.9">${ini}</text><text x="200" y="160" text-anchor="middle" dominant-baseline="middle" font-family="Arial" font-size="14" fill="white" opacity="0.6">${video.extensao.toUpperCase().replace('.','')} - ${video.tamanhoFormatado}</text><text x="200" y="200" text-anchor="middle" dominant-baseline="middle" font-family="Arial" font-size="11" fill="white" opacity="0.3">ASSISTIR</text></svg>`;
  res.setHeader('Content-Type', 'image/svg+xml');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.send(svg);
});

// ============================================================
// API: STREAM
// ============================================================
app.get('/api/stream/:id', (req, res) => {
  const videos = buscarVideos(pastaMedia);
  const video = videos.find((v) => v.id === req.params.id);
  if (!video) return res.status(404).json({ erro: 'Nao encontrado' });
  const caminhoArquivo = path.join(pastaMedia, video.caminhoRelativo);
  if (!fs.existsSync(caminhoArquivo)) return res.status(404).json({ erro: 'Arquivo ausente' });
  const tamanhoArquivo = fs.statSync(caminhoArquivo).size;
  const mimeTypes = { '.mp4': 'video/mp4', '.mkv': 'video/x-matroska', '.webm': 'video/webm', '.avi': 'video/x-msvideo', '.mov': 'video/quicktime' };
  const contentType = mimeTypes[video.extensao] || 'video/mp4';
  const range = req.headers.range;
  if (range) {
    const partes = range.replace(/bytes=/, '').split('-');
    const inicio = parseInt(partes[0], 10);
    const fim = partes[1] ? parseInt(partes[1], 10) : Math.min(inicio + 10 * 1024 * 1024 - 1, tamanhoArquivo - 1);
    res.writeHead(206, { 'Content-Range': `bytes ${inicio}-${fim}/${tamanhoArquivo}`, 'Accept-Ranges': 'bytes', 'Content-Length': fim - inicio + 1, 'Content-Type': contentType });
    fs.createReadStream(caminhoArquivo, { start: inicio, end: fim }).pipe(res);
  } else {
    res.writeHead(200, { 'Content-Length': tamanhoArquivo, 'Content-Type': contentType, 'Accept-Ranges': 'bytes' });
    fs.createReadStream(caminhoArquivo).pipe(res);
  }
});

// ============================================================
app.listen(PORTA, () => {
  const total = buscarVideos(pastaMedia).length;
  console.log('');
  console.log('  +------------------------------------------+');
  console.log('  |            >> H O M E F L I X            |');
  console.log('  +------------------------------------------+');
  console.log(`  ->  http://localhost:${PORTA}`);
  console.log(`  ->  Pasta: ${pastaMedia}`);
  console.log(`  ->  Videos: ${total}`);
  console.log('');
});
