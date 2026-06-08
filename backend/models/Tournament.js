const mongoose = require("mongoose");

const tournamentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    sport: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("Tournament", tournamentSchema);
