const suggestedBidController = require('../controllers/suggestedBid.controller');
const authController = require('../controllers/auth.controller');

const express = require('express');

const router = express.Router();

router.use(authController.protect);

router
	.route('/')
	.get(suggestedBidController.getAllSuggestedBids)
	.post(suggestedBidController.createSuggestedBid);

router
	.route('/:id')
	.get(suggestedBidController.getSuggestedBid)
	.patch(suggestedBidController.updateSuggestedBid)
	.delete(suggestedBidController.deleteSuggestedBid);

module.exports = router;
