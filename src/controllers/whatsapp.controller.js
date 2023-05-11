const facebookAxios = require('../axios/facebook');
const catchAsync = require('../utils/catchAsync');
const User = require('../models/user.model');
const Bid = require('../models/bid.model');
const Vessel = require('../models/vessel.model');

// Access token for your app
const token = process.env.WHATSAPP_TOKEN;

function sendMessage(phone_number_id, to, type, content) {
	return facebookAxios.post(
		'/' + phone_number_id + '/messages?access_token=' + token,
		{
			messaging_product: 'whatsapp',
			recipient_type: 'individual',
			to: to,
			type: type,
			[type]: content,
		}
	);
}

// Accepts POST requests at /webhook endpoint
exports.postWebhook = catchAsync(async (req, res) => {
	// Parse the request body from the POST
	let body = req.body;

	// Check the Incoming webhook message
	console.log(JSON.stringify(req.body, null, 2));

	// info on WhatsApp text message payload: https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks/payload-examples#text-messages
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
				}
			}

			let user = await User.findOne({ phone: from });

			if (!user) {
				// create a new user
				await User.create({
					phone: from,
				});

				// send a welcome message

				await sendMessage(phone_number_id, from, 'text', {
					preview_url: false,
					body: 'Welcome to the WhatsApp bot!',
				});

				// send a message to ask for the user's name
				await sendMessage(phone_number_id, from, 'text', {
					preview_url: false,
					body: 'What is your name?',
				});
			}

			if (user && !user.name) {
				// update the user's name

				user = await User.findOneAndUpdate({ phone: from }, { name: msg_body });

				// send a message to ask for company name
				await sendMessage(phone_number_id, from, 'text', {
					preview_url: false,
					body: `Hi ${user.name}, what is your company name?`,
				});
			}

			if (user && user.name && !user.company) {
				// update the user's company
				await User.findOneAndUpdate({ phone: from }, { company: msg_body });

				// send a thank you message for providing the information
				await sendMessage(phone_number_id, from, 'text', {
					preview_url: false,
					body: `Thank you ${user.name} for providing your company name!`,
				});

				// send a button message to ask placeing bid type (buy or sell)

				await sendMessage(phone_number_id, from, 'interactive', {
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
				});
			}

			if (user && user.name && user.company) {
				// check if the user has placed a bid before
				let bids = await Bid.find({ user: user._id });

				if (bids.length === 0) {
					// add bid
					await Bid.create({
						user: user._id,
						type: msg_body,
					});
				}

				if (bids.length > 0 && !bids[0].coal) {
					let vessels = await Vessel.find({});

					await sendMessage(phone_number_id, from, 'interactive', {
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
							sections: [
								{
									title: 'All Vessels',
									rows: vessels.map((vessel) => {
										return {
											id: vessel._id,
											title: vessel.name,
											description: vessel.name,
										};
									}),
								},
							],
						},
					});
				}
			}
		}
		res.sendStatus(200);
	} else {
		// Return a '404 Not Found' if event is not from a WhatsApp API
		res.sendStatus(404);
	}
});

// Accepts GET requests at the /webhook endpoint. You need this URL to setup webhook initially.
// info on verification request payload: https://developers.facebook.com/docs/graph-api/webhooks/getting-started#verification-requests

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
