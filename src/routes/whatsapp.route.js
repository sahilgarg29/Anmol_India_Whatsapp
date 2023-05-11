const express = require('express');
const whatsappController = require('../controllers/whatsapp.controller');

const router = express.Router();

router
	.route('/')
	.get(whatsappController.getAllWhatsapps)
	.post(whatsappController.createWhatsapp);

module.exports = router;
