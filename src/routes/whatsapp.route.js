const express = require('express');
const whatsappController = require('../controllers/whatsapp.controller');

const router = express.Router();

router
	.route('/webhook')
	.get(whatsappController.getWebhook)
	.post(whatsappController.postWebhook);

module.exports = router;
