const Bid = require('../models/bid.model');
const handlerFactory = require('../utils/handlerFactory');
const catchAsync = require('../utils/catchAsync');
const { sendMessage } = require('../utils/sendMessage');
const User = require('../models/user.model');

const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;

exports.getAllBids = handlerFactory.getAll(Bid, 'coal', [
	{
		path: 'user',
	},
	{
		path: 'coal',
		populate: {
			path: 'vessel country port',
		},
	},
]);
exports.createBid = handlerFactory.createOne(Bid);
exports.getBid = handlerFactory.getOne(Bid);
exports.updateBid = handlerFactory.updateOne(Bid);
exports.deleteBid = handlerFactory.deleteOne(Bid);

exports.updateBidStatus = catchAsync(async (req, res, next) => {
	let bid = await Bid.findById(req.params.id).populate([
		{
			path: 'user',
		},
		{
			path: 'coal',
			populate: {
				path: 'vessel country port',
			},
		},
	]);
	let botuser = await User.findOne({ phone: '911234567890' });

	let msg;

	if (req.body.status === 'accepted') {
		msg = `Your bid for ${bid.coal.vessel.name} has been accepted`;
	} else if (req.body.status === 'rejected') {
		msg = `Your bid for ${bid.coal.vessel.name} has been rejected`;
	} else if (req.body.status === 'expired') {
		msg = `Your bid for ${bid.coal.vessel.name} has expired`;
	}

	// update bid and return updated bid
	bid = await Bid.findByIdAndUpdate(req.params.id, req.body, {
		new: true,
		runValidators: true,
	}).populate([
		{
			path: 'user',
		},
		{
			path: 'coal',
			populate: {
				path: 'vessel country port',
			},
		},
	]);

	if (msg) {
		await sendMessage(
			PHONE_NUMBER_ID.toString(),
			bid.user.phone,
			bid.user._id,
			botuser._id,
			'text',
			{
				preview_url: false,
				body: msg,
			}
		);
	}

	res.status(200).json({
		status: 'success',
		data: bid,
	});
});
