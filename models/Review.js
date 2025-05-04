// models/Review.js
const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
  member: { type: mongoose.Schema.Types.ObjectId, ref: "Member", required: true }, // Reference to Member
  carOwner: { type: mongoose.Schema.Types.ObjectId, ref: "CarOwner", required: true }, // Reference to CarOwner
  rating: { type: Number, required: true, min: 1, max: 5 }, // Star rating (1-5)
  comment: { type: String, required: true }, // Review comment
  createdAt: { type: Date, default: Date.now }, // Timestamp
});

module.exports = mongoose.model("Review", reviewSchema);