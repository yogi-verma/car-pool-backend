const mongoose = require("mongoose");

const memberSchema = new mongoose.Schema({
    uid: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    mobile: { type: String, required: true },
    password: { type: String, required: true },
    profilePhoto : { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model("Member", memberSchema);
