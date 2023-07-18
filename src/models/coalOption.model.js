const mongoose = require("mongoose");

const coalOptionSchema = new mongoose.Schema({
  coals: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Coal",
    },
  ],

  paymentTerms: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PaymentTerm",
    },
  ],

  quantityUnit: {
    type: String,
    enum: ["MT", "Truck"],
    default: "MT",
  },
});

module.exports = mongoose.model("CoalOption", coalOptionSchema);
