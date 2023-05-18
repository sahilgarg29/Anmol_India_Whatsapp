const vesselController = require('../controllers/vessel.controller');
const { protect } = require('../controllers/auth.controller');

const express = require('express');
const router = express.Router();

router.use(protect);

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
