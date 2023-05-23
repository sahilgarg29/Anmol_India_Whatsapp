const Notification = require('../models/notification.model');

const handlerFactory = require('../utils/handlerFactory');

exports.getAllNotifications = handlerFactory.getAll(Notification, 'title');
exports.createNotification = handlerFactory.createOne(Notification);
exports.getNotification = handlerFactory.getOne(Notification);
exports.updateNotification = handlerFactory.updateOne(Notification);
exports.deleteNotification = handlerFactory.deleteOne(Notification);
