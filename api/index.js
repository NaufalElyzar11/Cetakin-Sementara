'use strict';

const serverExport = require('../server.js');
const app = serverExport.app || serverExport;

module.exports = (req, res) => {
  // Normalisasi URL jika rewrites Vercel meneruskan path internal
  if (req.url && req.url.startsWith('/api/index.js')) {
    req.url = req.url.replace('/api/index.js', '') || '/';
  }
  return app(req, res);
};
module.exports.app = app;
