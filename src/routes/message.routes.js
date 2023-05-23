const messageController = require('../controllers/message.controller');
const authController = require('../controllers/auth.controller');
const express = require('express');
const router = express.Router();

router.use(authController.protect);

router
	.route('/')
	.get(messageController.getAllMessages)
	.post(messageController.sendMessage);

router.route('/user/:userId').get(messageController.getUserMessages);

router
	.route('/:id')
	.get(messageController.getMessage)
	.patch(messageController.updateMessage)
	.delete(messageController.deleteMessage);

module.exports = router;
