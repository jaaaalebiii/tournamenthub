const Tournament = require("../models/Tournament");

// Controllers hold the business logic for a feature.
// Keeping this code out of the router makes the route file smaller and easier to read.
async function getAllTournaments(req, res) {
    try {
        const tournaments = await Tournament.find();

        res.json({
            success: true,
            tournaments
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Database error"
        });
    }
}

async function createTournament(req, res) {
    try {
        // The frontend now sends the full tournament snapshot in req.body, so MongoDB stores the complete state.
        const tournament = await Tournament.create(req.body);

        res.status(201).json({
            success: true,
            tournament
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Database error"
        });
    }
}

async function getTournamentById(req, res) {
    try {
        // `findById()` looks up one document in MongoDB using the route id.
        const tournament = await Tournament.findById(req.params.id);

        if (!tournament) {
            // We return 404 because the tournament was not found on the server.
            res.status(404).json({
                success: false,
                message: "Tournament not found"
            });
            return;
        }

        res.json({
            success: true,
            tournament
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Database error"
        });
    }
}

async function updateTournament(req, res) {
    try {
        // `findByIdAndUpdate()` updates the saved tournament while keeping the rest of the snapshot intact.
        // `new: true` returns the updated version instead of the old one.
        const tournament = await Tournament.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        if (!tournament) {
            res.status(404).json({
                success: false,
                message: "Tournament not found"
            });
            return;
        }

        res.json({
            success: true,
            tournament
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Database error"
        });
    }
}

async function deleteTournament(req, res) {
    try {
        // `findByIdAndDelete()` finds one document by id and removes it from MongoDB.
        const tournament = await Tournament.findByIdAndDelete(req.params.id);

        if (!tournament) {
            res.status(404).json({
                success: false,
                message: "Tournament not found"
            });
            return;
        }

        res.json({
            success: true,
            message: "Tournament deleted"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Database error"
        });
    }
}

module.exports = {
    getAllTournaments,
    getTournamentById,
    createTournament,
    updateTournament,
    deleteTournament
};
