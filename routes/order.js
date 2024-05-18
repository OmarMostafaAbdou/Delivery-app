var express = require("express");
var router = express.Router();
orderController = require("../controller/order.controller");

router.post("/Create/", orderController.CreateOrder);
router.get("/:id/", orderController.getOrder);
router.delete("/:id", orderController.deleteOrder);
router.get("/", orderController.getAllOrders);
router.get('/filter/orders', orderController.filterOrder)
router.put("/:id", orderController.editOrder);
router.post("/assignment/", orderController.orderAssignment);
router.post("/acceptation/", orderController.orderAcceptation);

module.exports = router;
