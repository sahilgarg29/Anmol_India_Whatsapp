const Coal = require('../models/coal.model');
const handlerFactory = require('../utils/handlerFactory');

exports.getAllCoals = handlerFactory.getAll(Coal, 'vessel');
exports.createCoal = handlerFactory.createOne(Coal);
exports.getCoal = handlerFactory.getOne(Coal, 'vessel port country');
exports.updateCoal = handlerFactory.updateOne(Coal);
exports.deleteCoal = handlerFactory.deleteOne(Coal);
