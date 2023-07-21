const Suggestions = require('../models/suggestions.model');
const { sendMessage } = require('../utils/sendMessage');
const User = require('../models/user.model');
const CoalOption = require('../models/coalOption.model');

const handlerFactory = require('../utils/handlerFactory');
const catchAsync = require('../utils/catchAsync');

exports.getAllSuggestions = handlerFactory.getAll(Suggestions, 'name');
exports.getSuggestion = handlerFactory.getOne(Suggestions);

exports.updateSuggestion = handlerFactory.updateOne(Suggestions);
exports.deleteSuggestion = handlerFactory.deleteOne(Suggestions);

const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;

exports.createSuggestion = catchAsync(async (req, res, next) => {
	console.log(req.body);
	let user = await User.findById(req.body.user);
	let coalOption = await CoalOption.findById(req.body.coalOption).populate({
		path: 'coals',
		populate: {
			path: 'country port vessel',
		},
	});

	console.log(coalOption);

	let botUser = await User.findOne({ phone: '911234567890' });

	let whatsappRes = await sendMessage(
		PHONE_NUMBER_ID.toString(),
		user.phone,
		user._id,
		botUser._id,
		'interactive',
		{
			type: 'button',
			body: {
				text: `Coal - *${coalOption.coals
					.map((coal) => coal.vessel.name)
					.join(' or ')}*\nQuantity - *${req.body.quantity}MT*\nPrice - *Rs. ${
					req.body.price
				}*\nLifting Period  - *${req.body.liftingPeriod}*\nPayment - *${
					req.body.paymentTerm
				}% Advance*\n
        `,
			},
			action: {
				buttons: [
					{
						type: 'reply',
						reply: {
							id: 'ACCEPT',
							title: 'Accept',
						},
					},
					{
						type: 'reply',
						reply: {
							id: 'REJECT',
							title: 'Reject',
						},
					},
					{
						type: 'reply',
						reply: {
							id: 'Negotiate',
							title: 'Negotiate',
						},
					},
				],
			},
		}
	);

	return res.status(200).json({
		status: 'success',
		data: {},
	});
});
