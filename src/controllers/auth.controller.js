const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const User = require('../models/user.model');
const jwt = require('jsonwebtoken');
const { promisify } = require('util');

// Sign token
const signToken = (id) => {
	return jwt.sign({ id }, process.env.JWT_SECRET, {
		expiresIn: process.env.JWT_EXPIRES_IN,
	});
};

// Create and send token
const createSendToken = (user, statusCode, res) => {
	const token = signToken(user._id);

	// Remove password from output
	user.password = undefined;

	res.status(statusCode).json({
		status: 'success',
		token,
		data: {
			user,
		},
	});
};

exports.register = catchAsync(async (req, res, next) => {
	const newUser = await User.create(req.body);

	createSendToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
	const { phone, password } = req.body;

	// Check if email and password exist
	if (!phone || !password) {
		return next(new AppError('Please provide email and password!', 400));
	}

	const user = await User.findOne({ phone }).select('+password').exec();

	// check if user exists and password is correct
	if (
		!user ||
		user.role !== 'admin' ||
		!(await user.correctPassword(password, user.password))
	) {
		return next(new AppError('Incorrect phone or password', 401));
	}

	// If everything ok, send token to client
	createSendToken(user, 200, res);
});

exports.protect = catchAsync(async (req, res, next) => {
	// 1) Getting token and check of it's there
	let token;
	if (
		req.headers.authorization &&
		req.headers.authorization.startsWith('Bearer')
	) {
		token = req.headers.authorization.split(' ')[1];
	}

	if (!token) {
		return next(
			new AppError('You are not logged in! Please log in to get access.', 401)
		);
	}

	// 2) Verification token
	const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

	// 3) Check if user still exists
	const freshUser = await User.findById(decoded.id);
	if (!freshUser) {
		return next(
			new AppError(
				'The user belonging to this token does no longer exist.',
				401
			)
		);
	}

	// 4) Check if user changed password after the token was issued
	// if (freshUser.changedPasswordAfter(decoded.iat)) {
	// 	return next(
	// 		new AppError('User recently changed password! Please log in again.', 401)
	// 	);
	// }

	// GRANT ACCESS TO PROTECTED ROUTE
	req.user = freshUser;

	next();
});
