require('dotenv').config();
const facebookAxios = require('../axios/facebook');
const catchAsync = require('../utils/catchAsync');
const User = require('../models/user.model');
const Bid = require('../models/bid.model');
const Vessel = require('../models/vessel.model');
const Coal = require('../models/coal.model');
const Message = require('../models/message.model');
const SuggestedBid = require('../models/suggestedBid.model');
const { sendMessage: sendMessageOriginal } = require('../utils/sendMessage');
const Notification = require('../models/notification.model');
const WhatsAppService = require('../utils/whatsAppService');

var add_minutes = function (dt, minutes) {
	return new Date(dt.getTime() + minutes * 60000);
};

exports.postWebhook = catchAsync(async (req, res) => {
	if (req.body.object) {
		if (
			req.body.entry &&
			req.body.entry[0].changes &&
			req.body.entry[0].changes[0] &&
			req.body.entry[0].changes[0].value.messages &&
			req.body.entry[0].changes[0].value.messages[0]
		) {
			let phone_number_id =
				req.body.entry[0].changes[0].value.metadata.phone_number_id;
			let from = req.body.entry[0].changes[0].value.messages[0].from; // extract the phone number from the webhook payload
			let wamid = req.body.entry[0].changes[0].value.messages[0].id;
			let timestamps = req.body.entry[0].changes[0].value.messages[0].timestamp;

			// ckeck if message already recieved
			let message = await Message.findOne({ wamid: wamid });
			if (message) {
				console.log('Message already exists');
				return res.sendStatus(200);
			}

			let msg_body;

			if (req.body.entry[0].changes[0].value.messages[0].type === 'text') {
				msg_body = req.body.entry[0].changes[0].value.messages[0].text.body;
			} else if (
				req.body.entry[0].changes[0].value.messages[0].type === 'interactive'
			) {
				if (
					req.body.entry[0].changes[0].value.messages[0].interactive.type ===
					'button_reply'
				) {
					msg_body =
						req.body.entry[0].changes[0].value.messages[0].interactive
							.button_reply.id;
				} else {
					msg_body =
						req.body.entry[0].changes[0].value.messages[0].interactive
							.list_reply.id;
				}
			}
		}

		console.log('from' + from);
		console.log('msg_body ' + msg_body);
		console.log('message_id ' + wamid);

		let user = await User.findOne({ phone: from });
		let botUser = await User.findOne({ phone: '911234567890' });

		if (!user) {
			user = await User.create({
				phone: from,
			});

			user.stage = 'name';
			await user.save();

			let notification = await Notification.create({
				title: 'New User Registered',
				description: user.phone + ' has registered on the whtsapp bot',
				type: 'new_user',
			});

			req.app.get('socketio').emit('notification', notification);
		}

		let bid = await Bid.findOne({
			user: user._id,
			status: 'partial',
		});

		await facebookAxios.post(
			'/' + phone_number_id + '/messages?access_token=' + token,
			{
				messaging_product: 'whatsapp',
				status: 'read',
				message_id: wamid,
			}
		);

		let whatsapp = new WhatsAppService(phone_number_id, user, botUser, bid);

		req.app.get('socketio').emit('message', {
			to: botUser._id,
			from: user._id,
			type: req.body.entry[0].changes[0].value.messages[0].type,
			message: msg_body,
			wamid: wamid,
		});

		// save message to database
		await Message.create({
			to: botUser._id,
			from: user._id,
			type: req.body.entry[0].changes[0].value.messages[0].type,
			message: msg_body,
			wamid: req.body.entry[0].changes[0].value.messages[0].id,
			timestamps: Date.now(),
		});

		let msg = msg_body.toLowerCase();

		if (user.stage === 'name') {
			// update the user's name
			console.log('updating user name');

			user = await User.findOneAndUpdate(
				{ phone: from },
				{ name: msg_body },
				{ new: true }
			);

			user.stage = 'companyName';
			await user.save();
		} else if (user.stage === 'companyName') {
			console.log('updating user company name');

			// update the user's company
			user = await User.findOneAndUpdate(
				{ phone: from },
				{ companyName: msg_body },
				{ new: true }
			);

			user.stage = 'bidType';
			await user.save();
		} else if (user.stage === 'bidType') {
			console.log('updating user bid type');

			await Bid.deleteMany({ user: user._id, status: 'partial' });

			await Bid.create({
				user: user._id,
				type: msg_body,
			});

			user.stage = 'Vessels';
			await user.save();
		} else if (user.stage === 'Vessels') {
			console.log('updating user Vessels');

			let coal = await Coal.findOne({
				vessel: msg_body,
			}).populate('port vessel country');

			// update the bid with coal details
			bid = await Bid.findOneAndUpdate(
				{ user: user._id, status: 'partial' },
				{ coal: coal._id },
				{ new: true }
			);

			user.stage = 'quantity';
			await user.save();
		} else if (user.stage === 'quantity') {
			console.log('updating user quantity');

			// if mt or MT or Mt is present in the message body, remove it
			if (msg_body.toLowerCase().includes('mt')) {
				msg_body = msg_body.toLowerCase().replace('mt', '').trim();
			}

			if (isNaN(msg_body)) {
				await whatsapp.sendValidQuantityMessage();
			} else if (
				msg_body < bid.coal.minQuantity ||
				msg_body > bid.coal.maxQuantity
			) {
				await whatsapp.sendValidQuantityMessage();
			} else {
				// update the bid with quantity
				bid = await Bid.findOneAndUpdate(
					{ user: user._id, status: 'partial' },
					{ quantity: msg_body },
					{ new: true }
				);

				user.stage = 'price';
				await user.save();
			}
		} else if (user.stage === 'price') {
			console.log('updating user price');

			if (isNaN(msg_body)) {
				await whatsapp.sendValidPriceMessage();
			} else if (bid.type === 'BUY' && msg_body < bid.coal.minPrice) {
				await whatsapp.sendMessage('text', {
					preview_url: false,
					body: `Please enter a price greater than ${bid.coal.minPrice}`,
				});
			} else if (bid.type === 'SELL' && msg_body > bid.coal.maxPrice) {
				await whatsapp.sendMessage('text', {
					preview_url: false,
					body: `Please enter a price less than ${bid.coal.maxPrice}`,
				});
			} else {
				bid.price = msg_body;
				await bid.save();

				user.stage = 'confirm';
				await user.save();
			}
		} else if (user.stage === 'confirm') {
			console.log('updating user confirm');

			if (msg_body.toLowerCase() === 'yes') {
				console.log('confirm');

				bid.status = 'pending';
				console.log(bid.coal.validity);
				bid.expiresAt = add_minutes(new Date(), bid.coal.validity);
				await bid.save();

				let notification = await Notification.create({
					title: 'Bid Placed',
					description: `${user.phone} has placed a bid for ${bid.quantity}MT of ${bid.coal.name} at Rs. ${bid.price}`,
					type: 'new_bid',
				});

				req.app.get('socketio').emit('notification', notification);

				user.stage = 'bidType';
				await user.save();
			}
		}

		return res.sendStatus(200);
	} else {
		res.sendStatus(404);
	}
});
