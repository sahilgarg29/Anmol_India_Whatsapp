const Port = require('../models/port.model');
const handlerFactory = require('../utils/handlerFactory');

exports.getAllPorts = handlerFactory.getAll(Port, 'name');
exports.createPort = handlerFactory.createOne(Port);
exports.getPort = handlerFactory.getOne(Port);
exports.updatePort = handlerFactory.updateOne(Port);
exports.deletePort = handlerFactory.deleteOne(Port);
