const mongoose = require("mongoose");

const paymentTermsSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
});

module.exports = mongoose.model("PaymentTerm", paymentTermsSchema);
