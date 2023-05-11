const vesselController = require('../controllers/vessel.controller');

const express = require('express');
const router = express.Router();

router
	.route('/')
	.get(vesselController.getAllVessels)
	.post(vesselController.createVessel);

router
	.route('/:id')
	.get(vesselController.getVessel)
	.patch(vesselController.updateVessel)
	.delete(vesselController.deleteVessel);

module.exports = router;
