const sendErrorDev = (err, res) => {
	console.log(err);
	res.status(err.statusCode).json({
		status: err.status,
		error: err,
		message: err.message,
		stack: err.stack,
	});
};

const sendErrorProd = (err, res) => {
	// Operational, trusted error: send message to client
	if (err.isOperational) {
		res.status(err.statusCode).json({
			status: err.status,
			message: err.message,
		});
	} else {
		// Programming or other unknown error

		// 1) Log error
		console.error('ERROR 💥', err);

		// 2) Send generic message
		res.status(500).json({
			status: 'error',
			message: 'Something went very wrong!',
		});
	}
};

const handleJWTError = () =>
	new AppError('Invalid token. Please log in again!', 401);

const handleJWTExpiredError = () =>
	new AppError('Your token has expired! Please log in again.', 401);

module.exports = (err, req, res, next) => {
	err.statusCode = err.statusCode || 500;
	err.status = err.status || 'error';

	if (process.env.NODE_ENV === 'production') {
		let error = { ...err };
		error.message = err.message;

		// if (error.name === 'CastError') error = handleCastErrorDB(error);
		// if (error.code === 11000) error = handleDuplicateFieldsDB(error);
		// if (error.name === 'ValidationError')
		// 	error = handleValidationErrorDB(error);
		if (error.name === 'JsonWebTokenError') error = handleJWTError();
		if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();

		sendErrorProd(error, res);
	} else {
		sendErrorDev(err, res);
	}
};
