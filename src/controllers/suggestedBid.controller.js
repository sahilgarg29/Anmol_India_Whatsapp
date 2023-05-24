const SuggestedBid = require('../models/suggestedBid.model');

const handlerFactory = require('../utils/handlerFactory');

exports.getAllSuggestedBids = handlerFactory.getAll(SuggestedBid, '', {
	path: 'coal',
	select: 'vessel port country',
});

exports.createSuggestedBid = handlerFactory.createOne(SuggestedBid);

exports.getSuggestedBid = handlerFactory.getOne(SuggestedBid, {
	path: 'coal',
	select: 'vessel port country',
});

exports.updateSuggestedBid = handlerFactory.updateOne(SuggestedBid);

exports.deleteSuggestedBid = handlerFactory.deleteOne(SuggestedBid);
