const Member = require("../models/Member");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// @desc   Register a new Member
// @route  POST /api/members/signup

const signupMember = async (req, res) => {
  const { uid, name, mobile, password } = req.body;

  try {
    // Check if UID already exists
    const existingMember = await Member.findOne({ uid });
    if (existingMember) {
      return res.status(400).json({ message: "UID already registered" });
    }

    // Hash Password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Save profile photo path if uploaded
    const profilePhoto = req.file ? req.file.path : "";

    // Create new Member
    const newMember = await Member.create({
      uid,
      name,
      mobile,
      password: hashedPassword,
      profilePhoto,
    });

    // Generate Token
    const token = jwt.sign({ id: newMember._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res
      .status(201)
      .json({
        message: "Member registered successfully",
        token,
        member: { id: newMember._id, name: newMember.name, profilePhoto: newMember.profilePhoto },
      });
  } catch (error) {
    // console.error("Signup Error:", error);
    res.status(500).json({ message: "Error registering member", error });
  }
};

// @desc   Login Member
// @route  POST /api/members/login
const loginMember = async (req, res) => {
  const { uid, password } = req.body;

  try {
    // Check if Member exists
    const member = await Member.findOne({ uid });
    if (!member) {
      return res.status(400).json({ message: "You are not registered member." });
    }

    // Validate Password
    const isMatch = await bcrypt.compare(password, member.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid UID or password" });
    }

    // Generate JWT Token
    const token = jwt.sign(
      { id: member._id, name: member.name },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({ token, member: { uid: member.uid, name: member.name, profilePhoto: member.profilePhoto } });
  } catch (error) {
    res.status(500).json({ message: "Error logging in", error });
  }
};

// @desc   Get Member Dashboard
// @route  GET /api/members/dashboard
const getDashboard = async (req, res) => {
  try {
    if (!req.user) {
      return res
        .status(401)
        .json({ message: "Unauthorized. No user data found." });
    }

    res.json({ message: ` ${req.user.name || "Member"}, Welcome to Dashboard`, user: req.user, muid: req.user.muid, name: req.user.name, profilePhoto: req.user.profilePhoto });
  } catch (error) {
    // console.error("Dashboard Error:", error);
    res.status(500).json({ message: "Error loading dashboard", error });
  }
};


//✅ Delete a car owner
const deleteMember = async (req, res) => {
    try {
        const deletedMember = await Member.findOneAndDelete({ uid: req.params.uid });
        if (!deletedMember) return res.status(404).json({ message: "Car owner not found" });

        res.status(200).json({ message: "Car owner deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server Error", error });
    }
};

module.exports = { signupMember, loginMember, getDashboard, deleteMember};
