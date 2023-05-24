const mongoose = require('mongoose');

const suggestedBidSchema = new mongoose.Schema(
	{
		type: {
			type: String,
			enum: ['BUY', 'SELL'],
			required: [true, 'Type is required'],
		},

		coal: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Coal',
			required: [true, 'Coal is required'],
		},

		price: {
			type: Number,
		},
		quantity: {
			type: Number,
		},

		isBiddable: {
			type: Boolean,
			default: false,
		},
	},
	{ timestamps: true, versionKey: false }
);

module.exports = mongoose.model('SuggestedBid', suggestedBidSchema);
