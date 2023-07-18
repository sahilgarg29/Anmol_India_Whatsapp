const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
    },
    companyName: {
      type: String,
    },

    phone: {
      type: String,
      required: [true, "Mobile number is required"],
      unique: [true, "mobile number already exists"],
    },
    password: {
      type: String,
    },
    role: {
      type: String,
      enum: ["customer", "admin"],
      default: "customer",
    },
    stage: {
      type: String,
      enum: [
        "start",
        "menu",
        "coalOptions",
        "bidType",
        "price",
        "quantityUnit",
        "quantity",
        "liftingPeriod",
        "paymentTerms",
        "customPaymentTerms",
        "confirm",
      ],
      default: "start",
    },
  },
  { timestamps: true, versionKey: false }
);

// Instance method to check if password is correct
userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

// remove users with role admin when getting all users
// userSchema.pre('find', function (next) {
// 	this.find({ role: { $ne: 'admin' } });
// 	next();
// });

// Encrypt password using bcrypt
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  this.password = await bcrypt.hash(this.password, 12);

  next();
});

// Remove password from output
userSchema.post("save", function (doc, next) {
  doc.password = undefined;
  next();
});

module.exports = mongoose.model("User", userSchema);
