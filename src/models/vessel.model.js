const mongoose = require('mongoose');

const vesselSchema = new mongoose.Schema(
	{
		name: {
			type: String,
			required: [true, 'Vessel name is required'],
			unique: [true, 'Vessel name must be unique'],
		},
	},
	{ timestamps: true, versionKey: false }
);

module.exports = mongoose.model('Vessel', vesselSchema);
