const mongoose = require("mongoose");

const liftingPeriodSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
});

module.exports = mongoose.model("LiftingPeriod", liftingPeriodSchema);
