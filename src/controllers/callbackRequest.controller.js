const CallbackRequest = require('../models/callbackRequest.model');

const handlerFactory = require('../utils/handlerFactory');

exports.getAllCallbackRequests = handlerFactory.getAll(
	CallbackRequest,
	'user',
	{
		path: 'user',
	}
);

exports.getCallbackRequest = handlerFactory.getOne(CallbackRequest);

exports.createCallbackRequest = handlerFactory.createOne(CallbackRequest);

exports.updateCallbackRequest = handlerFactory.updateOne(CallbackRequest);

exports.deleteCallbackRequest = handlerFactory.deleteOne(CallbackRequest);
