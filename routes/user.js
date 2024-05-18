var express = require("express");
var router = express.Router();
const userController = require("../controller/user.controller");

/* GET all users. */
router.get("/", userController.getAllUsers);
router.get("/:role", userController.getUsersByRole);

/* GET a user. */
router.get("/username/:username", userController.getUser);
router.get("/userid/:id", userController.getUserById);
router.post("/create/", userController.createUser);

/* PUT edit password user. */
router.put("/update-password", userController.editUserPassword);

/* PUT edit user. */
router.put("/:id", userController.editUser);

/* Active pilot */

router.put("/active/:id", userController.activePilot);

router.get("/active/activePilots", userController.getAllActivePilots);

router.get("/active/hasOrder/", userController.getAllPilotHasOrder);

router.get('/available/pilot',userController.getAvailablePilot)
/* DELETE delete user. */
router.delete("/:id", userController.deleteUser); 
  
router.post('/change-password/:id', userController.changePasswordForPilot )

module.exports = router;
