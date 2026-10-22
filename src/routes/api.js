'use strict';

const express = require('express');
const rateLimit = require('express-rate-limit');
const { requireAuth } = require('../middleware/auth.js');
const authController = require('../controllers/authController.js');
const catalogController = require('../controllers/catalogController.js');
const financeController = require('../controllers/financeController.js');

const router = express.Router();

// Rate limiter khusus login untuk mencegah brute-force password
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, error: 'Terlalu banyak percobaan login. Silakan coba lagi beberapa menit.' }
});

// 1. Root & Healthcheck Endpoints
router.get(['/', ''], (req, res) => {
  res.json({
    ok: true,
    service: 'cetakin-cloud-erp',
    status: 'online',
    timestamp: new Date().toISOString()
  });
});

router.get('/health', (req, res) => {
  res.json({ ok: true, status: 'healthy', service: 'cetakin-cloud-erp', timestamp: new Date().toISOString() });
});

// 2. Public Catalog Endpoint
router.get('/catalog', catalogController.getPublicCatalog);

// 3. Auth Routes
router.post('/auth/login', loginLimiter, authController.login);
router.get('/auth/me', requireAuth, authController.getMe);
router.post('/auth/password', requireAuth, authController.updatePassword);

// 4. Admin Catalog CRUD Routes
router.get('/admin/catalog', requireAuth, catalogController.getAdminCatalog);
router.post('/admin/catalog', requireAuth, catalogController.createProduct);
router.put('/admin/catalog/:id', requireAuth, catalogController.updateProduct);
router.delete('/admin/catalog/:id', requireAuth, catalogController.deleteProduct);

// 5. Finance & Shared QRIS ERP Routes
router.get('/finance/dashboard', requireAuth, financeController.getDashboard);
router.post('/finance/orders', requireAuth, financeController.createOrder);
router.put('/finance/orders/:id', requireAuth, financeController.updateOrder);
router.delete('/finance/orders/:id', requireAuth, financeController.deleteOrder);

router.post('/finance/mutations', requireAuth, financeController.createMutation);
router.delete('/finance/mutations/:id', requireAuth, financeController.deleteMutation);

router.post('/finance/qris-payout', requireAuth, financeController.processQrisPayout);

router.post('/finance/wages', requireAuth, financeController.createWage);
router.delete('/finance/wages/:id', requireAuth, financeController.deleteWage);

router.put('/finance/settings', requireAuth, financeController.updateSettings);

module.exports = router;
