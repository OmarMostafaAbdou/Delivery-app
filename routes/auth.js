var express = require("express");
var router = express.Router();
const authController = require("../controller/auth.controller");
/* POST signup. */
router.post("/signup", authController.signup);

router.post("/login", authController.login);

/* rest password*/
router.post("/reset-password", authController.resetPassword);
module.exports = router;
