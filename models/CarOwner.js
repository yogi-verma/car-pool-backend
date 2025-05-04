const mongoose = require("mongoose");

const carOwnerSchema = new mongoose.Schema({
    uid: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    mobile: { type: String, required: true },
    password: { type: String, required: true },
    carModel: { type: String, required: true },
    carNumberPlate: { type: String, required: true, unique: true },
    numberOfSeats: { type: Number, required: true },
    city: { 
        type: String, 
        enum: ["Jalandhar", "Jalandhar Cantt", "Phagwara", "Ludhiana"], 
        required: true 
    },
    colony: { type: String, required: true },
    parkingPlaceAtLPU: { 
        type: String, 
        enum: [
            "LPU main gate parking", 
            "Animation building k side me", 
            "Kids school k samne",
            "Girls hostel 5 6 ki side me", 
            "Block 34 k peche", 
            "BH-2 BH-3 k samne", 
            "Block 55 56 57 k samne"
        ], 
        required: true 
    },
    profilePhoto : { type: String, required: true },
    isOnline: { type: Boolean, default: false },
    // reviews: [{ 
    //     type: mongoose.Schema.Types.ObjectId, 
    //     ref: 'Review' 
    // }] 
}, { timestamps: true });

module.exports = mongoose.model("CarOwner", carOwnerSchema);
