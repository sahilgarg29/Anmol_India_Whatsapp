const callbackRequestController = require('../controllers/callbackRequest.controller');

const router = require('express').Router();

router
	.route('/')
	.get(callbackRequestController.getAllCallbackRequests)
	.post(callbackRequestController.createCallbackRequest);

router
	.route('/:id')
	.get(callbackRequestController.getCallbackRequest)
	.patch(callbackRequestController.updateCallbackRequest)
	.delete(callbackRequestController.deleteCallbackRequest);

module.exports = router;
