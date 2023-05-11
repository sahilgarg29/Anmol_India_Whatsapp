const User = require('../models/user.model');
const handlerFactory = require('../utils/handlerFactory');

exports.getAllUsers = handlerFactory.getAll(User, 'name');
exports.createUser = handlerFactory.createOne(User);
exports.getUser = handlerFactory.getOne(User, 'name');
exports.updateUser = handlerFactory.updateOne(User, 'name');
exports.deleteUser = handlerFactory.deleteOne(User);
