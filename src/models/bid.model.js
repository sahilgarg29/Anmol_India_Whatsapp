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
			enum: ['BUY', 'SELL'],
			// required: [true, "Type is required"],
		},
		coal: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'CoalOption',
		},
		quantity: {
			type: Number,
		},
		quantityUnit: {
			type: String,
			enum: ['MT', 'Truck'],
		},
		price: {
			type: Number,
		},
		status: {
			type: String,
			enum: ['pending', 'accepted', 'rejected', 'expired', 'partial'],
			default: 'partial',
		},
		liftingPeriod: {
			type: String,
		},
		paymentTerm: {
			type: Number,
		},
		expiresAt: {
			type: Date,
		},
	},
	{ timestamps: true, versionKey: false }
);

module.exports = mongoose.model('Bid', bidSchema);
