const User = require('../models/user.model');
const handlerFactory = require('../utils/handlerFactory');
const catchAsync = require('../utils/catchAsync');

exports.createUser = handlerFactory.createOne(User);
exports.getUser = handlerFactory.getOne(User);
exports.updateUser = handlerFactory.updateOne(User);
exports.deleteUser = handlerFactory.deleteOne(User);

exports.getAllUsers = catchAsync(async (req, res, next) => {
	// get all users except users with role 'admin'

	const users = await User.find({ role: { $ne: 'admin' } });

	res.status(200).json({
		status: 'success',
		results: users.length,
		data: users,
	});
});
