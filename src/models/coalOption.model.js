const mongoose = require('mongoose');

const coalOptionSchema = new mongoose.Schema(
	{
		coals: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: 'Coal',
			},
		],

		bidding: {
			type: Boolean,
			default: false,
		},
	},
	{
		virtuals: true,
	}
);

coalOptionSchema.virtual('name').get(function () {
	return this.coals.map((coal) => coal.vessel.name).join(' or ');
});

module.exports = mongoose.model('CoalOption', coalOptionSchema);
