'use strict';

const http = require('node:http');
const path = require('node:path');
const express = require('express');
const helmet = require('helmet');
const compression = require('compression');
const cors = require('cors');
const apiRouter = require('./src/routes/api.js');

const PORT = Number(process.env.PORT) || 8080;

const app = express();
app.disable('x-powered-by');

// Nonaktifkan CSP & COEP bawaan agar kompatibel dengan inline SVG & OpenStreetMap iframe
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
  })
);

app.use(compression());

// Batas 6MB diperlukan untuk menerima payload foto produk Base64/WebP
app.use(cors());
app.use(express.json({ limit: '6mb' }));
app.use(express.urlencoded({ extended: true, limit: '6mb' }));

// Blokir akses publik langsung ke file sensitif backend & database
app.use((req, res, next) => {
  const lower = req.path.toLowerCase();
  const forbidden = ['/server.js', '/db.js', '/package.json', '/package-lock.json', '/dockerfile', '/data/cetakin-db.json', '/src/'];
  if (forbidden.some((f) => lower === f || lower.startsWith('/src/'))) {
    return res.status(403).send('403 Forbidden');
  }
  next();
});

app.use('/api', apiRouter);

app.get(['/', '/index.html'], (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get(['/admin', '/admin/', '/admin.html'], (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

app.get(['/robotika', '/robotika/', '/robotika.html'], (req, res) => {
  res.sendFile(path.join(__dirname, 'robotika.html'));
});

app.get(['/clicker', '/clicker/', '/clicker.html'], (req, res) => {
  res.sendFile(path.join(__dirname, 'clicker.html'));
});

app.get(['/panduan', '/panduan/', '/panduan.html'], (req, res) => {
  res.sendFile(path.join(__dirname, 'panduan.html'));
});

app.get(['/projek', '/projek/'], (req, res) => {
  res.redirect(302, '/projek.html');
});

app.get('/projek.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'projek.html'));
});

app.get(['/gantungan-kunci', '/gantungan-kunci/', '/gantungan-kunci.html'], (req, res) => {
  res.redirect(302, '/projek.html');
});

app.get(['/produk', '/produk/', '/produk.html'], (req, res) => {
  res.sendFile(path.join(__dirname, 'produk.html'));
});

app.use(
  express.static(__dirname, {
    extensions: ['html'],
    maxAge: process.env.NODE_ENV === 'production' ? '1h' : 0
  })
);

app.use('/api/*', (req, res) => {
  res.status(404).json({ ok: false, error: 'Endpoint API tidak ditemukan.' });
});

app.use((req, res) => {
  res.status(404).send('404 Halaman tidak ditemukan');
});

app.use((err, req, res, _next) => {
  console.error('[EXPRESS ERROR]', err.message);
  if (req.path.startsWith('/api/')) {
    return res.status(err.status || 400).json({
      ok: false,
      error: err.message || 'Terjadi kesalahan pada server.'
    });
  }
  res.status(500).send('500 Internal Server Error');
});

const server = http.createServer(app);

if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`Cetakin Server aktif di http://localhost:${PORT}`);
  });
}

module.exports = app;
module.exports.app = app;
module.exports.server = server;
