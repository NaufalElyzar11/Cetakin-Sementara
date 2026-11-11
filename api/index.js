'use strict';

const serverExport = require('../server.js');
const app = serverExport.app || serverExport;

module.exports = (req, res) => {
  // Pertahankan prefix router saat Vercel meneruskan path fungsi internal.
  if (req.url) req.url = req.url.replace(/^\/api\/index\.js(?=\/|\?|$)/, '/api');
  return app(req, res);
};
module.exports.app = app;
