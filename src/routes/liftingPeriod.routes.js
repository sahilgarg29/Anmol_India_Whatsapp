const liftingPeriodController = require("../controllers/liftingPeriod.controller");

const router = require("express").Router();

router
  .route("/")
  .get(liftingPeriodController.getAllLiftingPeriod)
  .post(liftingPeriodController.createLiftingPeriod);

router
  .route("/:id")
  .get(liftingPeriodController.getLiftingPeriod)
  .patch(liftingPeriodController.updateLiftingPeriod)
  .delete(liftingPeriodController.deleteLiftingPeriod);

module.exports = router;
