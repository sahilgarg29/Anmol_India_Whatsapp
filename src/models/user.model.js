const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
	{
		name: {
			type: String,
		},
		companyName: {
			type: String,
		},
		email: {
			type: String,
		},

		phone: {
			type: String,
			required: [true, 'Mobile number is required'],
			unique: [true, 'mobile number already exists'],
		},
		password: {
			type: String,
		},
		role: {
			type: String,
			enum: ['customer', 'admin'],
			default: 'customer',
		},

		currentBid: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Bid',
		},

		stage: {
			type: String,
			enum: [
				'start',
				'name',
				'companyName',
				'bidType',
				'Vessels',
				'details',
				'quanitity',
				'price',
				'confirmation',
			],
			default: 'start',
		},
	},
	{ timestamps: true, versionKey: false }
);

module.exports = mongoose.model('User', userSchema);
