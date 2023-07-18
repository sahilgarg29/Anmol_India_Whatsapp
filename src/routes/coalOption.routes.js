const coalOptionController = require("../controllers/coalOption.controller");

const router = require("express").Router();

router
  .route("/")
  .get(coalOptionController.getAllCoalOption)
  .post(coalOptionController.createCoalOption);

router
  .route("/:id")
  .get(coalOptionController.getCoalOption)
  .patch(coalOptionController.updateCoalOption)
  .delete(coalOptionController.deleteCoalOption);

module.exports = router;
