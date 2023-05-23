require('dotenv').config();
const facebookAxios = require('../axios/facebook');
const catchAsync = require('../utils/catchAsync');
const User = require('../models/user.model');
const Bid = require('../models/bid.model');
const Vessel = require('../models/vessel.model');
const Coal = require('../models/coal.model');
const Message = require('../models/message.model');
const { sendMessage: sendMessageOriginal } = require('../utils/sendMessage');
const Notification = require('../models/notification.model');
// Access token for your app
const token = process.env.WHATSAPP_TOKEN;
const io = global.io;

var add_minutes = function (dt, minutes) {
	return new Date(dt.getTime() + minutes * 60000);
};

// Accepts POST requests at /webhook endpoint
exports.postWebhook = catchAsync(async (req, res) => {
	// Parse the request body from the POST
	let body = req.body;

	const sendMessage = async (
		phone_number_id,
		to,
		toId,
		fromId,
		type,
		content
	) => {
		return sendMessageOriginal(
			phone_number_id,
			to,
			toId,
			fromId,
			type,
			content,
			req.app.get('socketio')
		);
	};

	// console.log(JSON.stringify(body, null, 2));

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
			// console.log(user);

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

			let msg = msg_body.toLowerCase();

			if (
				msg === 'hi' ||
				msg === 'hello' ||
				msg === 'hey' ||
				msg === 'hola' ||
				msg === 'hii' ||
				msg === 'hiii'
			) {
				// send a welcome message
				await sendMessage(
					phone_number_id,
					from,
					user._id,
					botUser._id,
					'text',
					{
						preview_url: false,
						body: 'Hi there! Welcome to the Coal Trading Bot!',
					}
				);

				console.log('User stage is ' + user.stage);

				if (user.stage === 'name') {
					// send a message to ask for the user's name
					await sendMessage(
						phone_number_id,
						from,
						user._id,
						botUser._id,
						'text',
						{
							preview_url: false,
							body: 'What is your name?',
						}
					);
				} else if (user.stage === 'companyName') {
					// send a message to ask for the user's name
					await sendMessage(
						phone_number_id,
						from,
						user._id,
						botUser._id,
						'text',
						{
							preview_url: false,
							body: `Hi ${user.name}, what is your company name?`,
						}
					);
				} else {
					console.log('User stage is ' + user.stage);
					user.stage = 'bidType';
					await user.save();
					await sendMessage(
						phone_number_id,
						from,
						user._id,
						botUser._id,
						'interactive',
						{
							type: 'button',
							body: {
								text: 'What type of bid do you want to place?',
							},
							action: {
								buttons: [
									{
										type: 'reply',
										reply: {
											id: 'BUY',
											title: 'Buy',
										},
									},
									{
										type: 'reply',
										reply: {
											id: 'SELL',
											title: 'Sell',
										},
									},
								],
							},
						}
					);
				}

				return res.sendStatus(200);
			}

			if (user.stage === 'name') {
				// update the user's name
				console.log('updating user name');

				user = await User.findOneAndUpdate(
					{ phone: from },
					{ name: msg_body },
					{ new: true }
				);

				// send a message to ask for company name
				await sendMessage(
					phone_number_id,
					from,
					user._id,
					botUser._id,
					'text',
					{
						preview_url: false,
						body: `Hi ${user.name}, what is your company name?`,
					}
				);

				user.stage = 'companyName';
				await user.save();
			} else if (user.stage === 'companyName') {
				// update the user's company
				user = await User.findOneAndUpdate(
					{ phone: from },
					{ companyName: msg_body },
					{ new: true }
				);

				// send a thank you message for providing the information
				await sendMessage(
					phone_number_id,
					from,
					user._id,
					botUser._id,
					'text',
					{
						preview_url: false,
						body: `Thank you ${user.name} for providing your company name!`,
					}
				);

				// send a button message to ask placeing bid type (buy or sell)

				await sendMessage(
					phone_number_id,
					from,
					user._id,
					botUser._id,
					'interactive',
					{
						type: 'button',
						body: {
							text: 'What type of bid do you want to place?',
						},
						action: {
							buttons: [
								{
									type: 'reply',
									reply: {
										id: 'BUY',
										title: 'Buy',
									},
								},
								{
									type: 'reply',
									reply: {
										id: 'SELL',
										title: 'Sell',
									},
								},
							],
						},
					}
				);

				user.stage = 'bidType';
				await user.save();
			} else if (user.stage === 'bidType') {
				await Bid.deleteMany({ user: user._id, status: 'partial' });

				let bid = await Bid.create({
					user: user._id,
					type: msg_body,
				});

				user.currentBid = bid._id;
				await user.save();

				let coals = await Coal.find({ bidding: true }).populate(
					'country port vessel'
				);

				let countries = coals.map((coal) => {
					return coal.country.name;
				});

				countries = [...new Set(countries)];

				countries = countries.map((country) => {
					return {
						name: country,
						vessels: coals.filter((coal) => {
							return coal.country.name === country;
						}),
					};
				});

				let vessels = await Vessel.find({});

				await sendMessage(
					phone_number_id,
					from,
					user._id,
					botUser._id,
					'interactive',
					{
						type: 'list',
						header: {
							type: 'text',
							text: 'Selct Vessel',
						},
						body: {
							text: 'Select any vessel from the list',
						},
						footer: {
							text: 'Powered by CoalMantra',
						},
						action: {
							button: 'Show Vessels',
							sections: countries.map((country) => {
								return {
									title: country.name,
									rows: country.vessels.map((coal) => {
										return {
											id: coal.vessel._id,
											title: coal.vessel.name,
											description: `Port - ${coal.port.name}`,
										};
									}),
								};
							}),
						},
					}
				);

				user.stage = 'Vessels';
				await user.save();
			} else if (user.stage === 'Vessels') {
				let coal = await Coal.findOne({
					vessel: msg_body,
				}).populate('port vessel country');

				if (!coal || !coal.bidding) {
					await sendMessage(
						phone_number_id,
						from,
						user._id,
						botUser._id,
						'text',
						{
							preview_url: false,
							body: `No coal available for the selected vessel`,
						}
					);
				} else {
					// find bids for the user which are not pending
					let bids = await Bid.find({
						user: user._id,
						status: 'pending',
						coal: coal._id,
					});

					if (bids.length > 0) {
						await sendMessage(
							phone_number_id,
							from,
							user._id,
							botUser._id,
							'text',
							{
								preview_url: false,
								body: `You have already placed a bid for selected vessel`,
							}
						);
					} else {
						// update the bid with coal details
						let bid = await Bid.findOneAndUpdate(
							{ user: user._id, status: 'partial' },
							{ coal: coal._id },
							{ new: true }
						);

						// send message to show coal details
						await sendMessage(
							phone_number_id,
							from,
							user._id,
							botUser._id,
							'text',
							{
								preview_url: false,
								body: `
							Port - *${coal.port.name.toUpperCase()}*\nCountry - ${
									coal.country.name
								}\nVessel - ${coal.vessel.name}\n\nIndicative Price - *Rs. ${
									coal.indicativePrice
								}*\n${
									bid.type === 'BUY'
										? 'Minimum Price - *Rs. ' + coal.minPrice + '*'
										: 'Maximum Price - *Rs.' + coal.maxPrice + '*'
								}\n\nMinimum Order Quantity - *${
									coal.minQuantity
								}MT*\nMaximum Order Quantity - *${coal.maxQuantity}MT*`,
							}
						);

						// send message to ask for quantity
						await sendMessage(
							phone_number_id,
							from,
							user._id,
							botUser._id,
							'text',
							{
								preview_url: false,
								body: `How much *Quantity* do you want to order?`,
							}
						);

						user.stage = 'quanitity';
						await user.save();
					}
				}
			} else if (user.stage === 'quanitity') {
				let bid = await Bid.findOne({
					user: user._id,
					status: 'partial',
				}).populate('coal');

				// if mt or MT or Mt is present in the message body, remove it
				if (msg_body.toLowerCase().includes('mt')) {
					msg_body = msg_body.toLowerCase().replace('mt', '').trim();
				}

				if (isNaN(msg_body)) {
					await sendMessage(
						phone_number_id,
						from,
						user._id,
						botUser._id,
						'text',
						{
							preview_url: false,
							body: `Please enter a valid quantity`,
						}
					);
				} else if (
					msg_body < bid.coal.minQuantity ||
					msg_body > bid.coal.maxQuantity
				) {
					await sendMessage(
						phone_number_id,
						from,
						user._id,
						botUser._id,
						'text',
						{
							preview_url: false,
							body: `Please enter a quantity between ${bid.coal.minQuantity} and ${bid.coal.maxQuantity}`,
						}
					);
				} else {
					bid.quantity = msg_body;
					await bid.save();

					// send message to ask for price
					await sendMessage(
						phone_number_id,
						from,
						user._id,
						botUser._id,
						'text',
						{
							preview_url: false,
							body: `At what price do you want to place the bid?`,
						}
					);

					user.stage = 'price';
					await user.save();
				}
			} else if (user.stage === 'price') {
				let bid = await Bid.findOne({
					user: user._id,
					status: 'partial',
				}).populate({
					path: 'coal',
					populate: {
						path: 'country port vessel',
					},
				});

				if (isNaN(msg_body)) {
					await sendMessage(
						phone_number_id,
						from,
						user._id,
						botUser._id,
						'text',
						{
							preview_url: false,
							body: `Please enter a valid price`,
						}
					);
				} else if (bid.type === 'BUY' && msg_body < bid.coal.minPrice) {
					await sendMessage(
						phone_number_id,
						from,
						user._id,
						botUser._id,
						'text',
						{
							preview_url: false,
							body: `Please enter a price greater than ${bid.coal.minPrice}`,
						}
					);
				} else if (bid.type === 'SELL' && msg_body > bid.coal.maxPrice) {
					await sendMessage(
						phone_number_id,
						from,
						user._id,
						botUser._id,
						'text',
						{
							preview_url: false,
							body: `Please enter a price less than ${bid.coal.maxPrice}`,
						}
					);
				} else {
					bid.price = msg_body;
					await bid.save();

					// send message to show bid details
					await sendMessage(
						phone_number_id,
						from,
						user._id,
						botUser._id,
						'text',
						{
							preview_url: false,
							body: `Port - *${bid.coal.port.name.toUpperCase()}*\nCountry - *${bid.coal.country.name.toUpperCase()}*\nVessel - *${bid.coal.vessel.name.toUpperCase()}*\n\nBid Type - *${bid.type.toUpperCase()}*\nQuantity - *${
								bid.quantity
							}MT*\nPrice - *Rs. ${bid.price}*\n
						`,
						}
					);

					// send message to type "Yes" to confirm bid
					//and type "change" to change bid bid
					await sendMessage(
						phone_number_id,
						from,
						user._id,
						botUser._id,
						'text',
						{
							preview_url: false,
							body: `Please type "Yes" to confirm bid.`,
						}
					);

					user.stage = 'confirm';
					await user.save();
				}
			} else if (user.stage === 'confirm') {
				if (msg_body.toLowerCase() === 'yes') {
					console.log('confirm');

					let bid = await Bid.findOne({
						user: user._id,
						status: 'partial',
					}).populate({
						path: 'coal',
						populate: {
							path: 'country port vessel',
						},
					});
					console.log(bid);

					bid.status = 'pending';
					console.log(bid.coal.validity);
					bid.expiresAt = add_minutes(new Date(), bid.coal.validity);
					await bid.save();

					await sendMessage(
						phone_number_id,
						from,
						user._id,
						botUser._id,
						'text',
						{
							preview_url: false,
							body: `Your bid has been placed successfully`,
						}
					);

					let notification = await Notification.create({
						title: 'Bid Placed',
						description: `${user.phone} has placed a bid for ${bid.quantity}MT of ${bid.coal.name} at Rs. ${bid.price}`,
						type: 'new_bid',
					});

					req.app.get('socketio').emit('notification', notification);

					user.stage = 'bidType';
					await user.save();
				} else if (msg_body.toLowerCase() === 'change') {
					user.stage = 'bidType';
					await user.save();
				} else {
					await sendMessage(
						phone_number_id,
						from,
						user._id,
						botUser._id,
						'text',
						{
							preview_url: false,
							body: `Please type "Yes" to confirm bid`,
						}
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
	const verify_token = process.env.VERIFY_TOKEN;

	// Parse params from the webhook verification request
	let mode = req.query['hub.mode'];
	let token = req.query['hub.verify_token'];
	let challenge = req.query['hub.challenge'];

	// Check if a token and mode were sent
	if (mode && token) {
		// Check the mode and token sent are correct
		if (mode === 'subscribe' && token === verify_token) {
			// Respond with 200 OK and challenge token from the request
			console.log('WEBHOOK_VERIFIED');
			res.status(200).send(challenge);
		} else {
			// Responds with '403 Forbidden' if verify tokens do not match
			res.sendStatus(403);
		}
	}
});
