const express = require('express');
const router = express.Router();
const paymentController = require('./payment.controller');
const { authenticate } = require('../../core/middleware/auth.middleware');
const { checkPermission } = require('../../core/middleware/checkPermission.middleware');

// Public Webhook (must verify signature)
router.post('/webhook', paymentController.handleWebhook);

// Protected Routes
router.use(authenticate);

router.post('/verify', checkPermission('payments', 'create'), paymentController.verifyPayment);

module.exports = router;
