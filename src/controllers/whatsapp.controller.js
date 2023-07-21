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
const PaymentTerm = require('../models/paymentTerms.model');
// Access token for your app
const token = process.env.WHATSAPP_TOKEN;

var add_minutes = function (dt, minutes) {
	return new Date(dt.getTime() + minutes * 60000);
};

// Accepts POST requests at /webhook endpoint
exports.postWebhook = catchAsync(async (req, res) => {
	// Parse the request body from the POST
	let body = req.body;

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

			console.log('from' + from);
			console.log('msg_body ' + msg_body);
			console.log('message_id ' + wamid);

			await facebookAxios.post(
				'/' + phone_number_id + '/messages?access_token=' + token,
				{
					messaging_product: 'whatsapp',
					status: 'read',
					message_id: wamid,
				}
			);

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

			let bid = await Bid.findOne({
				user: user._id,
				status: 'partial',
			}).populate([
				{
					path: 'coal',
					populate: {
						path: 'coals',
						populate: {
							path: 'country port vessel',
						},
					},
				},
				'paymentTerm',
			]);
			console.log(bid);
			let whatsapp = new WhatsAppService(
				token,
				phone_number_id,
				user,
				botUser,
				bid,
				res.app.get('socketio')
			);

			let msg = msg_body.toLowerCase();

			if (
				msg === 'hi' ||
				msg === 'hello' ||
				msg === 'hey' ||
				msg === 'hola' ||
				msg === 'hii' ||
				msg === 'hiii'
			) {
				if (user.stage === 'name' || user.stage === 'companyName') {
					// send a welcome message
					await whatsapp.sendWelcomeMessage();
				} else {
					console.log('menu');
					user.stage = 'bidType';
					await user.save();
					// send a welcome message
					await whatsapp.sendBidTypeMessage();
				}

				if (user.stage === 'name') {
					// send a message to ask for the user's name
					await whatsapp.sendAskNameMessage();
				} else if (user.stage === 'companyName') {
					// send a message to ask for the user's name
					await whatsapp.sendAskCompanyMessage();
				}

				return res.sendStatus(200);
			}

			if (user.stage === 'menu') {
				if (msg_body === 'PLACE_BID') {
					user.stage = 'coalOptions';
					await user.save();
					await whatsapp.sendCoalOptionsListMessage();
				} else if (msg_body === 'CALL_BACK') {
					notification = await Notification.create({
						title: 'New Call Back Request',
						description:
							user.phone + ' has requested a call back on the whtsapp bot',
						type: 'call_back',
					});

					req.app.get('socketio').emit('notification', notification);

					user.stage = 'menu';
					await user.save();

					await whatsapp.sendCallBackMessage();
				}
			} else if (user.stage == 'coalOptions') {
				bid.coal = msg_body;
				await bid.save();

				user.stage = 'quantityUnit';
				await user.save();

				await whatsapp.sendAskQuantityUnitMessage();
			} else if (user.stage === 'bidType') {
				await Bid.deleteMany({ user: user._id, status: 'partial' });

				bid = await Bid.create({
					user: user._id,
					type: msg_body,
				});
				await bid.save();

				user.stage = 'coalOptions';
				await user.save();

				await whatsapp.sendCoalOptionsListMessage();
			} else if (user.stage === 'suggestedBid') {
				if (msg_body === 'CUSTOM_BID') {
					await whatsapp.sendVesselsListMessage();
					user.stage = 'Vessels';
					await user.save();
					return res.sendStatus(200);
				} else {
					let suggestedBid = await SuggestedBid.findOne({
						_id: msg_body,
					}).populate({
						path: 'coal',
						populate: {
							path: 'country port vessel',
						},
					});

					bid.coal = suggestedBid.coal._id;
					bid.quantity = suggestedBid.quantity;
					bid.price = suggestedBid.price;
					await bid.save();

					bid.coal = suggestedBid.coal;

					// send message to show bid details
					await whatsapp.sendBidOverviewMessage();

					// send message to type "Yes" to confirm bid
					//and type "change" to change bid bid
					await whatsapp.sendTextMessage(
						'Please type *Yes* to confirm the bid.'
					);

					user.stage = 'confirm';
					await user.save();
				}
			} else if (user.stage === 'Vessels') {
				let coal = await Coal.findOne({
					vessel: msg_body,
				}).populate('port vessel country');
				// update the bid with coal details

				bid.coal = coal._id;
				await bid.save();

				bid.coal = coal;

				user.stage = 'quanitity';
				await user.save();

				// send message to show coal details
				await whatsapp.sendCoalDetailsMessage();

				// send message to ask for quantity
				await whatsapp.sendAskQuantityMessage();
			} else if (user.stage === 'quantityUnit') {
				if (msg_body === 'MT') {
					bid.quantityUnit = msg_body;
					await bid.save();

					user.stage = 'quantity';
					await user.save();

					await whatsapp.sendAskQuantityMessage(msg_body);
				} else if (msg_body === 'Truck') {
					bid.quantityUnit = msg_body;
					await bid.save();

					user.stage = 'quantity';
					await user.save();

					await whatsapp.sendAskQuantityMessage(msg_body);
				} else {
					user.stage = 'quantityUnit';
					await user.save();
					await whatsapp.sendAskQuantityUnitMessage();
				}
			} else if (user.stage === 'quantity') {
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
					await whatsapp.sendQuantityNotInRangeMessage();
				} else {
					bid.quantity = msg_body;
					await bid.save();

					// send message to ask for price
					await whatsapp.sendAskPriceMessage();

					user.stage = 'price';
					await user.save();
				}
			} else if (user.stage === 'price') {
				if (isNaN(msg_body)) {
					await whatsapp.sendValidPriceMessage();
				} else {
					bid.price = msg_body;
					await bid.save();

					// send message to show bid details
					await whatsapp.sendAskLiftingPeriodMessage();
					user.stage = 'liftingPeriod';
					await user.save();
				}
			} else if (user.stage === 'liftingPeriod') {
				bid.liftingPeriod = msg_body;
				await bid.save();

				// send message to show bid details
				await whatsapp.sendAskPaymentTermsMessage();

				user.stage = 'paymentTerms';
				await user.save();
			} else if (user.stage === 'paymentTerms') {
				if (msg_body === 'CUSTOM_PAYMENT_TERMS') {
					user.stage = 'customPaymentTerms';
					await user.save();
					await whatsapp.sendCustomPaymentTermsMessage();
				} else {
					bid.paymentTerm = Number(msg_body);
					await bid.save();

					// send message to show bid details
					await whatsapp.sendBidOverviewMessage();

					// send message to type "Yes" to confirm bid
					//and type "change" to change bid bid
					await whatsapp.sendTextMessage(
						'Please type *Yes* to confirm the bid.'
					);

					user.stage = 'confirm';
					await user.save();
				}
			} else if (user.stage === 'customPaymentTerms') {
				if (isNaN(msg_body)) {
					await whatsapp.sendValidCustomPaymentTermsMessage();
				} else {
					bid.paymentTerm = Number(msg_body);
					await bid.save();

					// send message to show bid details
					await whatsapp.sendBidOverviewMessage();

					// send message to type "Yes" to confirm bid
					//and type "change" to change bid bid
					await whatsapp.sendTextMessage(
						'Please type *Yes* to confirm the bid.'
					);

					user.stage = 'confirm';
					await user.save();
				}
			} else if (user.stage === 'confirm') {
				if (msg_body.toLowerCase() === 'yes') {
					bid.status = 'pending';
					await bid.save();

					await whatsapp.sendTextMessage(
						'Your bid has been placed successfully.'
					);

					// let notification = await Notification.create({
					//   title: "Bid Placed",
					//   description: `${user.phone} has placed a bid for ${bid.quantity}MT of ${bid.coal.name} at Rs. ${bid.price}`,
					//   type: "new_bid",
					// });

					// req.app.get("socketio").emit("notification", notification);

					user.stage = 'menu';
					await user.save();
				} else if (msg_body.toLowerCase() === 'change') {
					user.stage = 'menu';
					await user.save();
				} else {
					await whatsapp.sendTextMessage(
						'Please type *Yes* to confirm the bid.'
					);
				}
			}
		}

		return res.sendStatus(200);
	} else {
		// Return a '404 Not Found' if event is not from a WhatsApp API
		res.sendStatus(404);
	}
});

exports.getWebhook = catchAsync(async (req, res) => {
	/**
	 * UPDATE YOUR VERIFY TOKEN
	 *This will be the Verify Token value when you set up webhook
	 **/
	const verify_token = 'QWERTY';

	// Parse params from the webhook verification request
	let mode = req.query['hub.mode'];
	let token = req.query['hub.verify_token'];
	let challenge = req.query['hub.challenge'];
	console.log(req.query);

	// Check if a token and mode were sent
	if (mode && token) {
		// Check the mode and token sent are correct
		if (mode === 'subscribe' && token === verify_token) {
			// Respond with 200 OK and challenge token from the request
			console.log('WEBHOOK_VERIFIED');
			return res.status(200).send(challenge);
		} else {
			// Responds with '403 Forbidden' if verify tokens do not match
			res.sendStatus(403);
		}
	}
});
