const Vessel = require('../models/vessel.model');

const handlerFactory = require('../utils/handlerFactory');

exports.getAllVessels = handlerFactory.getAll(Vessel, 'name');
exports.createVessel = handlerFactory.createOne(Vessel);
exports.getVessel = handlerFactory.getOne(Vessel);
exports.updateVessel = handlerFactory.updateOne(Vessel);
exports.deleteVessel = handlerFactory.deleteOne(Vessel);
