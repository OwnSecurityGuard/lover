const http = require('http');
const path = require('path');
const fs = require('fs');
const { URL } = require('url');

const PORT = Number(process.env.PORT || 3000);
const ROOT = __dirname;
const PUBLIC_DIR = path.join(ROOT, 'public');
const DATA_DIR = path.join(ROOT, 'data');
const EVENTS_FILE = path.join(DATA_DIR, 'events.jsonl');
const PROFILES_FILE = path.join(DATA_DIR, 'profiles.json');

const GIFT_CODE = process.env.GIFT_CODE || 'HEMA-XXXX-XXXX-XXXX';
const GIFT_QR_URL = process.env.GIFT_QR_URL || '/assets/hema-qr.svg';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || '';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
};

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(PROFILES_FILE)) fs.writeFileSync(PROFILES_FILE, JSON.stringify({}, null, 2), 'utf8');
}

function safeJsonParse(text, fallback) {
  try {
    return JSON.parse(text);
  } catch {
    return fallback;
  }
}

function readProfiles() {
  ensureDataDir();
  return safeJsonParse(fs.readFileSync(PROFILES_FILE, 'utf8'), {});
}

function writeProfiles(obj) {
  ensureDataDir();
  fs.writeFileSync(PROFILES_FILE, JSON.stringify(obj, null, 2), 'utf8');
}

function appendEvent(evt) {
  ensureDataDir();
  fs.appendFileSync(EVENTS_FILE, `${JSON.stringify(evt)}\n`, 'utf8');
}

function sendJson(res, code, obj) {
  res.writeHead(code, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
  res.end(JSON.stringify(obj));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
      if (raw.length > 200 * 1024) {
        reject(new Error('payload too large'));
        req.destroy();
      }
    });
    req.on('end', () => resolve(raw));
    req.on('error', reject);
  });
}

function serveStatic(reqPath, res) {
  const normalized = path.normalize(reqPath).replace(/^([.][.][/\\])+/, '');
  let filePath = path.join(PUBLIC_DIR, normalized);
  if (!filePath.startsWith(PUBLIC_DIR)) {
    sendJson(res, 403, { ok: false, error: 'forbidden' });
    return;
  }
  if (reqPath === '/' || reqPath === '') filePath = path.join(PUBLIC_DIR, 'index.html');

  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(PUBLIC_DIR, 'index.html');
  }

  const ext = path.extname(filePath).toLowerCase();
  const ctype = MIME[ext] || 'application/octet-stream';
  res.writeHead(200, { 'content-type': ctype });
  fs.createReadStream(filePath).pipe(res);
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const now = new Date().toISOString();
  res.setHeader('x-powered-by', '');

  try {
    if (req.method === 'GET' && url.pathname === '/api/health') return sendJson(res, 200, { ok: true });

    if (req.method === 'GET' && url.pathname === '/api/gift') {
      return sendJson(res, 200, { code: GIFT_CODE, qrUrl: GIFT_QR_URL });
    }

    if (req.method === 'POST' && url.pathname === '/api/event') {
      const raw = await readBody(req);
      const body = safeJsonParse(raw, {});
      const sessionId = String(body?.sessionId || '').slice(0, 80);
      const type = String(body?.type || '').slice(0, 60);
      const payload = body?.payload && typeof body.payload === 'object' ? body.payload : null;
      if (!sessionId || !type) return sendJson(res, 400, { ok: false, error: 'missing sessionId/type' });

      appendEvent({ ts: now, sessionId, type, payload, ua: req.headers['user-agent'] || '', ip: req.socket.remoteAddress || '' });
      return sendJson(res, 200, { ok: true });
    }

    if (req.method === 'POST' && url.pathname === '/api/profile') {
      const raw = await readBody(req);
      const body = safeJsonParse(raw, {});
      const sessionId = String(body?.sessionId || '').slice(0, 80);
      const answers = body?.answers && typeof body.answers === 'object' ? body.answers : null;
      if (!sessionId || !answers) return sendJson(res, 400, { ok: false, error: 'missing sessionId/answers' });

      const profiles = readProfiles();
      const prev = profiles[sessionId] && typeof profiles[sessionId] === 'object' ? profiles[sessionId] : {};
      profiles[sessionId] = { ...prev, ...answers, updatedAt: now, createdAt: prev.createdAt || now };
      writeProfiles(profiles);
      appendEvent({ ts: now, sessionId, type: 'profile_submit', payload: { keys: Object.keys(answers) }, ua: req.headers['user-agent'] || '', ip: req.socket.remoteAddress || '' });
      return sendJson(res, 200, { ok: true });
    }

    if (req.method === 'GET' && url.pathname === '/api/admin/export') {
      if (!ADMIN_TOKEN) return sendJson(res, 403, { ok: false, error: 'admin disabled' });
      const token = String(req.headers['x-admin-token'] || '');
      if (token !== ADMIN_TOKEN) return sendJson(res, 401, { ok: false, error: 'bad token' });
      ensureDataDir();
      const profiles = readProfiles();
      const events = fs.existsSync(EVENTS_FILE) ? fs.readFileSync(EVENTS_FILE, 'utf8') : '';
      return sendJson(res, 200, { ok: true, profiles, eventsJsonl: events });
    }

    if (url.pathname.startsWith('/api/')) return sendJson(res, 404, { ok: false, error: 'not found' });
    return serveStatic(url.pathname, res);
  } catch (err) {
    return sendJson(res, 500, { ok: false, error: err.message || 'internal error' });
  }
});

server.listen(PORT, () => {
  ensureDataDir();
  console.log(`[girlsday] http://localhost:${PORT}`);
});
