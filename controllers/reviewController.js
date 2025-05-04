// controllers/reviewController.js
const Review = require("../models/Review");
const Member = require("../models/Member");
const CarOwner = require("../models/CarOwner");

// Create a review
exports.createReview = async (req, res) => {
  const { memberId, carOwnerId, rating, comment } = req.body;

  try {
    // Check if member and car owner exist
    const member = await Member.findById(memberId);
    const carOwner = await CarOwner.findById(carOwnerId);

    if (!member || !carOwner) {
      return res.status(404).json({ message: "Member or Car Owner not found" });
    }

    // Create the review
    const review = new Review({ member: memberId, carOwner: carOwnerId, rating, comment });
    await review.save();

    res.status(201).json({ message: "Review created successfully", review });
  } catch (error) {
    res.status(500).json({ message: "Error creating review", error: error.message });
  }
};

// Get all reviews for a car owner
exports.getReviewsByCarOwner = async (req, res) => {
  const { carOwnerId } = req.params;

  try {
    const reviews = await Review.find({ carOwner: carOwnerId }).populate("member", "name profilePhoto");
    res.status(200).json(reviews);
  } catch (error) {
    res.status(500).json({ message: "Error fetching reviews", error: error.message });
  }
};

// Get all reviews by a member
exports.getReviewsByMember = async (req, res) => {
  const { memberId } = req.params;

  try {
    const reviews = await Review.find({ member: memberId }).populate("carOwner", "name profilePhoto carModel");
    res.status(200).json(reviews);
  } catch (error) {
    res.status(500).json({ message: "Error fetching reviews", error: error.message });
  }
};

// Delete a review
exports.deleteReview = async (req, res) => {
  const { reviewId } = req.params;

  try {
    const review = await Review.findByIdAndDelete(reviewId);
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }
    res.status(200).json({ message: "Review deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting review", error: error.message });
  }
};