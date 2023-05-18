const userController = require('../controllers/user.controller');
const { protect } = require('../controllers/auth.controller');
const express = require('express');
const router = express.Router();

router.use(protect);

router
	.route('/')
	.get(userController.getAllUsers)
	.post(userController.createUser);

router
	.route('/:id')
	.get(userController.getUser)
	.patch(userController.updateUser)
	.delete(userController.deleteUser);

module.exports = router;
