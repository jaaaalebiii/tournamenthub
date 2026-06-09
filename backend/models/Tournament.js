const mongoose = require("mongoose");
const { Schema } = mongoose;

// MongoDB stores the full saved tournament snapshot so the frontend can reload it exactly as it was saved.
const tournamentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    sport: {
        type: String,
        required: true
    },
    matchType: {
        type: String,
        default: "Friendly"
    },
    playersPerTeam: {
        type: Number
    },
    numberOfTeams: {
        type: Number
    },
    matchConfig: {
        type: Schema.Types.Mixed,
        default: {}
    },
    players: {
        type: [Schema.Types.Mixed],
        default: []
    },
    generatedTeams: {
        type: [Schema.Types.Mixed],
        default: []
    },
    teams: {
        type: [Schema.Types.Mixed],
        default: []
    },
    fixtures: {
        type: [Schema.Types.Mixed],
        default: []
    },
    matches: {
        type: [Schema.Types.Mixed],
        default: []
    },
    bracket: {
        type: Schema.Types.Mixed,
        default: null
    },
    tournamentState: {
        type: Schema.Types.Mixed,
        default: null
    },
    teamNames: {
        type: Schema.Types.Mixed,
        default: {}
    },
    winners: {
        type: [Schema.Types.Mixed],
        default: []
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("Tournament", tournamentSchema);
