const mongoose = require('mongoose');

const suggestionSchema = new mongoose.Schema(
	{
		bid: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Bid',
			required: [true, 'Bid is required'],
		},
		user: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			required: [true, 'User is required'],
		},
		coalOption: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'CoalOption',
		},

		type: {
			type: String,
			enum: ['BUY', 'SELL'],
		},

		quantity: {
			type: Number,
		},

		price: {
			type: Number,
		},

		liftingPeriod: {
			type: String,
		},

		paymentTerm: {
			type: Number,
		},

		status: {
			type: String,
			enum: ['pending', 'accepted', 'rejected', 'expired', 'negotiating'],
			default: 'pending',
		},
	},
	{ timestamps: true, versionKey: false }
);

module.exports = mongoose.model('Suggestion', suggestionSchema);
