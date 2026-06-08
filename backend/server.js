require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const tournamentRoutes = require("./routes/tournaments");

const app = express();

app.use(cors());
app.use(express.json());

// Connect the backend to MongoDB now, but keep the current routes using the in-memory array for now.
mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {
        console.log("MongoDB Connected");
    })
    .catch((error) => {
        console.error("MongoDB connection error:", error);
    });

mongoose.connection.on("error", (error) => {
    console.error("MongoDB connection error:", error);
});

app.get("/api/test", (req, res) => {
    res.json({
        message: "TournamentHub Backend Running"
    });
});

// `app.use()` mounts a router at a path prefix, so every route inside the router
// will automatically start with `/api/tournaments`.
app.use("/api/tournaments", tournamentRoutes);

app.listen(5000, () => {
    console.log("Server running on port 5000");
});
