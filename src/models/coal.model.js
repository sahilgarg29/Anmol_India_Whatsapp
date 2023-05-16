const mongoose = require('mongoose');

const coalSchema = new mongoose.Schema(
	{
		country: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Country',
			required: [true, 'Country is required'],
		},
		port: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Port',
			required: [true, 'Port is required'],
		},
		vessel: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Vessel',
			required: [true, 'Vessel is required'],
		},

		minQuantity: {
			type: Number,
			required: [true, 'Minimum quantity is required'],
		},
		maxQuantity: {
			type: Number,
			required: [true, 'Maximum quantity is required'],
		},
		indicativePrice: {
			type: Number,
			required: [true, 'Indicative price is required'],
		},
		minPrice: {
			type: Number,
			required: [true, 'Minimum price is required'],
		},

		maxPrice: {
			type: Number,
			required: [true, 'Maximum price is required'],
		},
		description: {
			type: String,
		},
		bidding: {
			type: Boolean,
			default: false,
		},
		NAR: {
			type: Number,
		},
		GAR: {
			type: Number,
		},
	},
	{ timestamps: true, versionKey: false }
);

module.exports = mongoose.model('Coal', coalSchema);
