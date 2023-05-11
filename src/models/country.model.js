const mongoose = require('mongoose');

const countrySchema = new mongoose.Schema(
	{
		name: {
			type: String,
			required: [true, 'Country name is required'],
			unique: [true, 'Country name must be unique'],
		},
	},
	{ timestamps: true, versionKey: false }
);

module.exports = mongoose.model('Country', countrySchema);
