const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    carOwnerId: { type: String, ref: 'CarOwner', required: true }, // Use _id for car owner
    memberDetails: { 
        type: Object, 
        required: true 
    },
    message: { 
        type: String, 
        required: true 
    },
    status: { 
        type: String, 
        enum: ['Pending', 'Confirmed'], 
        default: 'Pending' 
    },
}, { timestamps: true }); // Adds createdAt and updatedAt fields automatically

module.exports = mongoose.model('Notification', notificationSchema);
