const coalController = require('../controllers/coal.controller');

const express = require('express');
const router = express.Router();

router
	.route('/')
	.get(coalController.getAllCoals)
	.post(coalController.createCoal);

router
	.route('/:id')
	.get(coalController.getCoal)
	.patch(coalController.updateCoal)
	.delete(coalController.deleteCoal);

module.exports = router;
