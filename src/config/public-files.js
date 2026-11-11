'use strict';

const publicFiles = new Set([
  'admin.html', 'clicker.html', 'index.html', 'panduan.html', 'produk.html', 'projek.html', 'robotika.html',
  'admin.css', 'catalog.css', 'clicker.css', 'guide.css', 'projek.css', 'styles.css',
  'admin.js', 'admin-table-core.js', 'analytics-init.js', 'app.js', 'catalog-core.js', 'catalog.js', 'clicker-assets.js',
  'clicker-core.js', 'clicker.js', 'contact.js', 'finance-core.js', 'guide-core.js', 'guide-data.js',
  'guide-index.js', 'guide.js', 'site-config.js', 'data/products-demo.csv'
]);
const publicDirectories = ['assets', 'panduan'];
const publicAsset = /^assets\/(?:[a-z0-9_-]+\/)*[a-z0-9_-]+\.(?:avif|gif|ico|jpe?g|png|svg|webp|ttf|woff2?)$/i;
const fontLicense = /^assets\/clicker\/[a-z0-9_-]+-OFL\.txt$/i;
const guidePage = /^panduan\/[a-z0-9-]+\.html$/;

function isPublicFile(file) {
  return publicFiles.has(file) || publicAsset.test(file) || fontLicense.test(file) || guidePage.test(file);
}

module.exports = { isPublicFile, publicDirectories, publicFiles };
