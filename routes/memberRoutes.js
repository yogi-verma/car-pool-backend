const express = require("express");
const { signupMember, loginMember, getDashboard, deleteMember } = require("../controllers/memberController");
const authMiddleware = require("../middleware/authMiddleware");

const upload = require("../utils/multer");

const router = express.Router();

router.post("/signupMember",upload.single('profilePhoto'), signupMember);
router.post("/loginMember", loginMember);
router.get("/dashboardMember", authMiddleware, getDashboard);

router.delete("/:uid", deleteMember);

module.exports = router;

