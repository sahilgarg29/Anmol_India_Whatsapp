const paymentTermController = require("../controllers/paymentTerm.controller");
const router = require("express").Router();

router
  .route("/")
  .get(paymentTermController.getAllPaymentTerm)
  .post(paymentTermController.createPaymentTerm);

router
  .route("/:id")
  .get(paymentTermController.getPaymentTerm)
  .patch(paymentTermController.updatePaymentTerm);

module.exports = router;
