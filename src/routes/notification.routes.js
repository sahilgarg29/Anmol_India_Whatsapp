const notificationController = require('../controllers/notification.controller');
const authController = require('../controllers/auth.controller');
const express = require('express');

const router = express.Router();

router.use(authController.protect);

router
	.route('/')
	.get(notificationController.getAllNotifications)
	.post(notificationController.createNotification);

router
	.route('/:id')
	.get(notificationController.getNotification)
	.patch(notificationController.updateNotification)
	.delete(notificationController.deleteNotification);

module.exports = router;
