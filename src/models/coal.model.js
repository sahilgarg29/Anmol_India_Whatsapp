const mongoose = require("mongoose");

const coalSchema = new mongoose.Schema(
  {
    country: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Country",
      required: [true, "Country is required"],
    },
    port: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Port",
      required: [true, "Port is required"],
    },
    vessel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vessel",
      required: [true, "Vessel is required"],
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
  { timestamps: true, versionKey: false, toJSON: { virtuals: true } }
);

// virtual field Coal name with country name and NAR value
coalSchema.virtual("name").get(function () {
  return `${
    this.country.name
  } - ${this.vessel.name} ${this.NAR ? "(" + this.NAR + "NAR)" : ""}`;
});

module.exports = mongoose.model("Coal", coalSchema);
