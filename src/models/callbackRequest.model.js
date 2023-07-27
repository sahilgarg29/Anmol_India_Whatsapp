const mongoose = require('mongoose');

const callbackRequestSchema = new mongoose.Schema(
	{
		user: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			required: [true, 'User is required'],
		},
		status: {
			type: String,
			enum: ['pending', 'completed', 'notAnswered', 'rejected'],
			default: 'pending',
		},
	},
	{ timestamps: true, versionKey: false }
);

module.exports = mongoose.model('CallbackRequest', callbackRequestSchema);
