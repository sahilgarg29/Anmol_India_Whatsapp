const mongoose = require('mongoose');

const portSchema = new mongoose.Schema(
	{
		name: {
			type: String,
			required: [true, 'Port name is required'],
			unique: [true, 'Port name must be unique'],
		},
	},
	{ timestamps: true, versionKey: false }
);

module.exports = mongoose.model('Port', portSchema);
