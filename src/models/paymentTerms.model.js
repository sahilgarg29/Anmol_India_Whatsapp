const mongoose = require('mongoose');

const paymentTermsSchema = new mongoose.Schema({
	name: {
		type: Number,
		required: true,
	},
});

module.exports = mongoose.model('PaymentTerm', paymentTermsSchema);
