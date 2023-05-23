const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
	{
		wamid: {
			type: String,
			required: [true, 'Wamid is required'],
		},

		to: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			required: [true, 'To is required'],
		},
		from: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			required: [true, 'From is required'],
		},
		message: {
			type: String,
			required: [true, 'Message is required'],
		},
		type: {
			type: String,
			enum: ['text', 'image', 'video', 'audio', 'document', 'interactive'],
			default: 'text',
		},
		timestamps: {
			type: Date,
		},
	},
	{ timestamps: true, versionKey: false }
);

module.exports = mongoose.model('Message', messageSchema);
