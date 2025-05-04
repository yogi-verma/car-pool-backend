const jwt = require("jsonwebtoken");
const Member = require("../models/Member");
const CarOwner = require("../models/CarOwner");

const authMiddleware = async (req, res, next) => {
    let token = req.header("Authorization");

    if (!token) {
        return res.status(401).json({ message: "Access denied. No token provided" });
    }

    // 🚀 Ensure token is clean
    if (token.startsWith("Bearer ")) {
        token = token.slice(7, token.length).trim(); // Remove "Bearer "
    }

    // console.log("Extracted Token:", token); 

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const member = await Member.findById(decoded.id).select("-password");
        const carOwner = await CarOwner.findById(decoded.id).select("-password");

        if (!member && !carOwner) {
            return res.status(404).json({ message: "User not found" });
        }

        req.user = member || carOwner;
        next();
    } catch (error) {
        // console.error("JWT Verification Error:", error.message); // Debugging log
        return res.status(400).json({ message: "Invalid token" });
    }
};

module.exports = authMiddleware;
