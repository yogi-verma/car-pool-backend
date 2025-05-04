const jwt = require("jsonwebtoken");
const CarOwner = require("../models/CarOwner");

const protectCarOwner = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        if (!token) return res.status(401).json({ message: "Unauthorized, no token" });

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.carOwner = await CarOwner.findById(decoded.id).select("-password");
        if (!req.carOwner) return res.status(404).json({ message: "Car Owner not found" });

        next();
    } catch (error) {
        res.status(401).json({ message: "Invalid token", error: error.message });
    }
};

module.exports = protectCarOwner ;
