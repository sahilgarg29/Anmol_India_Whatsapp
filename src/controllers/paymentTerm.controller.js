const PaymentTerm = require("../models/paymentTerms.model");
const handlerFactory = require("../utils/handlerFactory");

exports.getAllPaymentTerm = handlerFactory.getAll(PaymentTerm, "name");
exports.getPaymentTerm = handlerFactory.getOne(PaymentTerm);
exports.createPaymentTerm = handlerFactory.createOne(PaymentTerm);
exports.updatePaymentTerm = handlerFactory.updateOne(PaymentTerm);
exports.deletePaymentTerm = handlerFactory.deleteOne(PaymentTerm);
