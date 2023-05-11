const facebookAxios = require('../axios/facebook');
const catchAsync = require('../utils/catchAsync');
const User = require('../models/user.model');

// Access token for your app
const token = process.env.WHATSAPP_TOKEN;

function sendMessage(phone_number_id, to, text) {
	return facebookAxios.post(
		'/' + phone_number_id + '/messages?access_token=' + token,
		{
			messaging_product: 'whatsapp',
			to: to,
			text,
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
			let msg_body = req.body.entry[0].changes[0].value.messages[0].text.body; // extract the message text from the webhook payload

			const user = await User.findOne({ phone: from });

			if (!user) {
				// create a new user
				await User.create({
					phone: from,
				});

				// send a welcome message

				await sendMessage(phone_number_id, from, 'Welcome to our service!');

				// send a message to ask for the user's name
				await sendMessage(phone_number_id, from, 'What is your name?');
			}

			if (user && !user.name) {
				// update the user's name

				await User.findOneAndUpdate({ phone: from }, { name: msg_body });

				// send a message to ask for company name
				await sendMessage(phone_number_id, from, 'What is your company name?');
			}

			if (user && user.name && !user.company) {
				// update the user's company
				await User.findOneAndUpdate({ phone: from }, { company: msg_body });

				// send a thank you message for providing the information
				await sendMessage(
					phone_number_id,
					from,
					`Thanks ${user.name} for providing the information!`
				);
			}
		}

		// 	await facebookAxios.post(
		// 		'/' + phone_number_id + '/messages?access_token=' + token,
		// 		{
		// 			messaging_product: 'whatsapp',
		// 			to: from,
		// 			text: { body: 'Ack: ' + msg_body },
		// 		}
		// 	);
		// }
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
