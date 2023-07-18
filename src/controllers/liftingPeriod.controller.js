const LiftingPeriod = require("../models/liftingPeriod.model");

const handlerFactory = require("../utils/handlerFactory");

exports.getAllLiftingPeriod = handlerFactory.getAll(LiftingPeriod, "name");
exports.getLiftingPeriod = handlerFactory.getOne(LiftingPeriod);
exports.createLiftingPeriod = handlerFactory.createOne(LiftingPeriod);
exports.updateLiftingPeriod = handlerFactory.updateOne(LiftingPeriod);
exports.deleteLiftingPeriod = handlerFactory.deleteOne(LiftingPeriod);
