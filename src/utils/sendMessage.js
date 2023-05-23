const facebookAxios = require('../axios/facebook');
const Message = require('../models/message.model');
const token = process.env.WHATSAPP_TOKEN;

async function sendMessage(
	phone_number_id,
	to,
	toId,
	fromId,
	type,
	content,
	io
) {
	let res = await facebookAxios.post(
		'/' + phone_number_id + '/messages?access_token=' + token,
		{
			messaging_product: 'whatsapp',
			recipient_type: 'individual',
			to: to,
			type: type,
			[type]: content,
		}
	);

	let msg = '';

	if (type === 'text') {
		msg = content.body;
	} else if (type === 'interactive') {
		msg = content.body.text;
	}

	Message.create({
		to: toId,
		from: fromId,
		type: type,
		message: msg,
		wamid: res.data.messages[0].id,
		timestamps: Date.now(),
	}).then((message) => {
		if (io) io.emit('message', message);
	});

	return res;
}

module.exports = {
	sendMessage,
};
