const mongoose = require('mongoose');

const bidSchema = new mongoose.Schema(
	{
		user: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			required: [true, 'User is required'],
		},
		type: {
			type: String,
			enum: ['buy', 'sell'],
			required: [true, 'Type is required'],
		},
		coal: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Coal',
		},
		quantity: {
			type: Number,
		},
		price: {
			type: Number,
		},
		status: {
			type: String,
			enum: ['pending', 'accepted', 'rejected', 'expired', 'partial'],
			default: 'partial',
		},
	},
	{ timestamps: true, versionKey: false }
);

module.exports = mongoose.model('Bid', bidSchema);
