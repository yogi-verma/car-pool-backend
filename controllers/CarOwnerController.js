const CarOwner = require("../models/CarOwner");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Notification = require('../models/Notification');
const cityColonyMapping = require("../utils/cityColonyMapping")


// @desc   Register a new Car Owner
// @route  POST /api/carowners/signup
const signupCarOwner = async (req, res) => {
    const { uid, name, mobile, password, carModel, carNumberPlate, seats, city, colony,parkingPlaceAtLPU} = req.body;

    try {
        // Check if UID or Car Number Plate already exists
        const existingOwner = await CarOwner.findOne({ uid });
        const existingCar = await CarOwner.findOne({ carNumberPlate });

        if (existingOwner) {
            return res.status(400).json({ success: false, message: "UID already registered" });
        }
        if (existingCar) {
            return res.status(400).json({ success: false, message: "Car Number Plate already registered" });
        }

        if (!req.file) {
            return res.status(400).json({ success: false, message: "Profile photo is required" });
        }

        // Hash Password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Save profile photo path if uploaded
        const profilePhoto = req.file ? req.file.path : "";

        // Create new CarOwner
        const newCarOwner = await CarOwner.create({
            uid,
            name,
            mobile,
            password: hashedPassword,
            carModel,
            carNumberPlate,
            numberOfSeats: seats,  // Fix field name
            city,
            colony: colony,
            parkingPlaceAtLPU,        // Fix field name
            profilePhoto,
        });

        res.status(201).json({ success: true, message: "Car Owner registered successfully", data: newCarOwner });
    } catch (error) {
        console.error("Signup error:", error);
        res.status(500).json({ success: false, message: "Error registering car owner", error });
    }
};




// @desc   Login Car Owner
// @route  POST /api/carowners/login

const loginCarOwner = async (req, res) => {
    const { uid, password } = req.body;

    try {
        // Check if Car Owner exists
        const carOwner = await CarOwner.findOne({ uid });
        if (!carOwner) {
            return res.status(400).json({ success: false, message: "Invalid UID or password" });
        }

        // Validate Password
        const isMatch = await bcrypt.compare(password, carOwner.password);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: "Invalid UID or password" });
        }

        // Update isOnline status to true
        carOwner.isOnline = true;
        await carOwner.save(); // Save the updated status

        // Generate JWT Token
        const token = jwt.sign(
            { id: carOwner._id, name: carOwner.name },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );

        res.json({
            success: true,
            token,
            carOwner: {
                uid: carOwner.uid,
                name: carOwner.name,
                isOnline: carOwner.isOnline, // Ensure it reflects the updated status
                parkingPlaceAtLPU: carOwner.parkingPlaceAtLPU,
                profilePhoto: carOwner.profilePhoto
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error logging in", error: error.message });
    }
};



const logoutCarOwner = async (req, res) => {
    const { uid } = req.body;

    try {
        const carOwner = await CarOwner.findOne({ uid });

        if (!carOwner) {
            return res.status(404).json({ success: false, message: "Car Owner not found!" });
        }

        carOwner.isOnline = false;
        await carOwner.save();

        res.json({ success: true, message: "Logged out successfully!", 
            carOwner: {
                uid: carOwner.uid,
                name: carOwner.name,
                isOnline: carOwner.isOnline // Ensure it reflects the updated status
            } });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error logging out", error: error.message });
    }
};




// @desc   Get Car Owner Dashboard
// @route  GET /api/carowners/dashboard
const getCarOwnerDashboard = async (req, res) => {
    try {
        if (!req.carOwner) {
            return res.status(401).json({ message: "Unauthorized. Please log in." });
        }


        // console.log(req.carOwner);


        res.json({
            uid: req.carOwner.uid,
            name: req.carOwner.name,
            carModel: req.carOwner.carModel || "N/A",
            carNumberPlate: req.carOwner.carNumberPlate || "N/A",
            numberOfSeats: req.carOwner.numberOfSeats || 0,
            city: req.carOwner.city || "N/A",
            colony: req.carOwner.colony || "N/A",
            isOnline: req.carOwner.isOnline,
            parkingPlaceAtLPU: req.carOwner.parkingPlaceAtLPU,
            profilePhoto: req.carOwner.profilePhoto
        });
    } catch (error) {
        console.error("Error fetching dashboard:", error);
        res.status(500).json({ message: "Error loading dashboard", error: error.message });
    }
};




const getCarOwnersByPlace = async (req, res) => {
    try {
        const place = req.params.place;
        const carOwners = await CarOwner.find({ city: place });

        if (carOwners.length === 0) {
            return res.status(404).json({ success: false, message: "No car owners found for this place." });
        }

        res.json({ success: true, data: carOwners });
    } catch (error) {
        console.error("Error fetching car owners:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};



// Controller to notify the car owner about the booking
const notifyCarOwner = async (req, res) => {
    const { uid, memberDetails } = req.body; // Use uid instead of _id

    try {
        console.log("Received request to notify car owner:", req.body);

        // Find car owner by uid
        const carOwner = await CarOwner.findOne({ uid });

        if (!carOwner) {
            return res.status(404).json({ message: "Car owner not found" });
        }

        // Create a new notification
        const notification = new Notification({
            carOwnerId: carOwner.uid, // Store uid instead of _id
            memberDetails,
            message: `You have a new booking request from ${memberDetails.name}`,
            status: "Pending",
        });

        await notification.save();
        console.log("Notification created:", notification);

        res.status(200).json({ message: "Booking request sent to car owner successfully." });
    } catch (err) {
        console.error("Error occurred while notifying car owner:", err);
        res.status(500).json({ message: "Failed to send booking request" });
    }
};



// Controller to confirm the booking by the car owner
const confirmBooking = async (req, res) => {
    const { _id } = req.body; // Using _id instead of notificationId

    try {
        console.log("Received request to confirm booking:", req.body);

        // Find the notification by _id
        const notification = await Notification.findById(_id);

        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        // Check if the notification is still pending
        if (notification.status !== 'Pending') {
            return res.status(400).json({ message: 'Booking is already confirmed or canceled.' });
        }

        // Update the notification status to "Confirmed"
        notification.status = 'Confirmed';
        await notification.save();

        console.log("Booking confirmed:", notification);

        res.status(200).json({ message: 'Booking confirmed successfully.', notification });
    } catch (err) {
        console.error('Error confirming booking:', err);
        res.status(500).json({ message: 'Failed to confirm the booking' });
    }
};


// ✅ Get all car owners
const getAllCarOwners = async (req, res) => {
    try {
        const carOwners = await CarOwner.find();
        res.status(200).json(carOwners);
    } catch (error) {
        res.status(500).json({ message: "Server Error", error });
    }
};



// ✅ Get car owner by UID
const getCarOwnerByUID = async (req, res) => {
    try {
        const carOwner = await CarOwner.findOne({ uid: req.params.uid });
        if (!carOwner) return res.status(404).json({ message: "Car owner not found" });
        res.status(200).json(carOwner);
    } catch (error) {
        res.status(500).json({ message: "Server Error", error });
    }
};




// ✅ Update car owner online/offline status
// const updateCarOwnerStatus = async (req, res) => {
//     try {
//         const { uid, isOnline } = req.body;
//         const updatedCarOwner = await CarOwner.findOneAndUpdate(
//             { uid }, 
//             { isOnline }, 
//             { new: true }
//         );
//         if (!updatedCarOwner) return res.status(404).json({ message: "Car owner not found" });

//         res.status(200).json({ message: "Status updated successfully", updatedCarOwner });
//     } catch (error) {
//         res.status(500).json({ message: "Server Error", error });
//     }
// };




//✅ Delete a car owner
const deleteCarOwner = async (req, res) => {
    try {
        const deletedCarOwner = await CarOwner.findOneAndDelete({ uid: req.params.uid });
        if (!deletedCarOwner) return res.status(404).json({ message: "Car owner not found" });

        res.status(200).json({ message: "Car owner deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server Error", error });
    }
};


// Get list of online users
// const getOnlineUsers = async (req, res) => {
//     try {
//         const onlineUsers = await CarOwner.find({ isOnline: true }).select("uid name carModel");
//         res.json({ success: true, onlineUsers });
//     } catch (error) {
//         res.status(500).json({ success: false, message: "Error fetching online users", error: error.message });
//     }
// };


// Update online status manually (optional)
const updateOnlineStatus = async (req, res) => {
    const { uid, isOnline } = req.body;
    try {
        const user = await CarOwner.findOneAndUpdate({ uid }, { isOnline }, { new: true });
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        res.json({ success: true, message: `User ${isOnline ? "online" : "offline"}`, user });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error updating status", error: error.message });
    }
};


const getOnlineCarOwners = async (req, res) => {
    try {
        const onlineCarOwners = await CarOwner.find({ isOnline: true });

        if (onlineCarOwners.length === 0) {
            return res.status(404).json({ success: false, message: "No online car owners found!" });
        }

        res.json({ success: true, onlineCarOwners });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error fetching online car owners", error: error.message });
    }
};


const getColoniesByCity = (req, res) => {
    const { city } = req.params;
    if (cityColonyMapping[city]) {
        return res.json({ colonies: cityColonyMapping[city] });
    } else {
        return res.status(404).json({ message: "City not found" });
    }
};




module.exports = { signupCarOwner, loginCarOwner, getCarOwnerDashboard,deleteCarOwner, getCarOwnersByPlace, notifyCarOwner, confirmBooking, getAllCarOwners, getCarOwnerByUID, updateOnlineStatus, getOnlineCarOwners , logoutCarOwner, getColoniesByCity };
