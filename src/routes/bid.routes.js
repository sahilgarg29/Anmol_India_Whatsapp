const bidController = require("../controllers/bid.controller");
const authController = require("../controllers/auth.controller");
const express = require("express");

const router = express.Router();

// router.use(authController.protect);

router.route("/").get(bidController.getAllBids).post(bidController.createBid);

router
  .route("/:id")
  .get(bidController.getBid)
  .patch(bidController.updateBid)
  .delete(bidController.deleteBid);

// updateBidStatus
router.route("/status/:id").patch(bidController.updateBidStatus);

module.exports = router;
