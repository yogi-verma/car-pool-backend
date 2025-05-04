const express = require("express");
const { signupCarOwner, loginCarOwner, getCarOwnerDashboard, getCarOwnersByPlace,deleteCarOwner, notifyCarOwner, confirmBooking , getAllCarOwners, getCarOwnerByUID, updateOnlineStatus, getOnlineCarOwners , logoutCarOwner, getColoniesByCity} = require("../controllers/CarOwnerController");
// const authMiddleware = require("../middleware/authMiddleware");
const protectCarOwner  = require("../middleware/authMiddlewareOwner");

const upload = require("../utils/multer");


const router = express.Router();

router.post("/signupOwner", upload.single('profilePhoto') ,signupCarOwner);
router.post("/loginOwner", loginCarOwner);
router.post("/logoutOwner", logoutCarOwner);
router.get("/dashboardOwner", protectCarOwner, getCarOwnerDashboard);
router.get("/:place", getCarOwnersByPlace);

// Route to notify car owner about the member's booking request
router.post('/notifycarowner', notifyCarOwner);

// Route to confirm the booking by the car owner
router.post('/confirmbooking', confirmBooking);


router.get("/", getAllCarOwners);
router.get("/:uid", getCarOwnerByUID);
// router.put("/status", updateCarOwnerStatus);
// router.delete("/:uid", deleteCarOwner);


router.get("/online/users", getOnlineCarOwners );

// Route to update online status manually (optional)
router.post("/update-status", updateOnlineStatus);

// Define route
router.get("/colonies/:city", getColoniesByCity);

// Delete a car owner
router.delete("/:uid", deleteCarOwner);


module.exports = router;
