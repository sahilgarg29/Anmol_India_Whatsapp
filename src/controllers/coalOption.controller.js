const CoalOption = require('../models/coalOption.model');
const handlerFactory = require('../utils/handlerFactory');

exports.getAllCoalOption = handlerFactory.getAll(CoalOption, 'name', {
	path: 'coals',
	populate: {
		path: 'country port vessel',
	},
});
exports.getCoalOption = handlerFactory.getOne(CoalOption);
exports.createCoalOption = handlerFactory.createOne(CoalOption);
exports.updateCoalOption = handlerFactory.updateOne(CoalOption);
exports.deleteCoalOption = handlerFactory.deleteOne(CoalOption);
