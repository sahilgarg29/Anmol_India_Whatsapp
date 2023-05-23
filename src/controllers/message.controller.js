const Message = require('../models/message.model');
const handlerFactory = require('../utils/handlerFactory');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const { sendMessage } = require('../utils/sendMessage');
const User = require('../models/user.model');

const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;

exports.getAllMessages = handlerFactory.getAll(Message, 'message', 'from to');
// exports.createMessage = handlerFactory.createOne(Message);
exports.getMessage = handlerFactory.getOne(Message, 'from to');
exports.updateMessage = handlerFactory.updateOne(Message);
exports.deleteMessage = handlerFactory.deleteOne(Message);

exports.getUserMessages = catchAsync(async (req, res, next) => {
	const messages = await Message.find({
		$or: [{ from: req.params.userId }, { to: req.params.userId }],
	})
		.sort('timestamps')
		.populate('from to');

	res.status(200).json({
		status: 'success',
		results: messages.length,
		data: messages,
	});
});

exports.sendMessage = catchAsync(async (req, res, next) => {
	let botUser = await User.findOne({ phone: '911234567890' });

	let responses = req.body.users.map(async (userId) => {
		const user = await User.findById(userId);
		console.log('sendMessage');

		let whatsappRes = await sendMessage(
			PHONE_NUMBER_ID.toString(),
			user.phone,
			user._id,
			botUser._id,
			'text',
			{
				preview_url: false,
				body: req.body.message,
			}
		);
		console.log(whatsappRes.data);

		return whatsappRes.data.messages[0].id;
	});

	let whatsappRes = await Promise.all(responses);

	res.status(200).json({
		status: 'success',
		data: whatsappRes,
	});
});
