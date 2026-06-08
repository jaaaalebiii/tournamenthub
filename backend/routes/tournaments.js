const express = require("express");
const {
    getAllTournaments,
    getTournamentById,
    createTournament,
    updateTournament,
    deleteTournament
} = require("../controllers/tournamentController");

// `express.Router()` creates a mini router for related routes.
// We keep the router small and move business logic into controllers so each file has one job.
const router = express.Router();

// Routes stay thin: they match the URL and hand the work to a controller.
router.get("/", getAllTournaments);
router.post("/", createTournament);
router.get("/:id", getTournamentById);
router.put("/:id", updateTournament);
router.delete("/:id", deleteTournament);

module.exports = router;
