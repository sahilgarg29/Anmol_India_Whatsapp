const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
	{
		title: {
			type: String,
			required: [true, 'Title is required'],
		},
		description: {
			type: String,
		},
		type: {
			type: String,
		},
		status: {
			type: String,
			enum: ['read', 'unread'],
			default: 'unread',
		},
	},
	{ timestamps: true, versionKey: false }
);

module.exports = mongoose.model('Notification', notificationSchema);
