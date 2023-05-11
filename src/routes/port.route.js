const portController = require('../controllers/port.controller');

const express = require('express');
const router = express.Router();

router
	.route('/')
	.get(portController.getAllPorts)
	.post(portController.createPort);

router
	.route('/:id')
	.get(portController.getPort)
	.patch(portController.updatePort)
	.delete(portController.deletePort);

module.exports = router;
