const storageKey = "players";
const tournamentStorageKey = "saved-tournaments";
const sportRules = {
    cricket: {
        teamSize: 11,
        modes: ["Standard"]
    },
    football: {
        teamSize: 5,
        modes: ["5v5"]
    },
    badminton: {
        teamSize: 1,
        modes: ["Singles", "Doubles"]
    },
    athletics: {
        teamSize: 4,
        modes: ["Relay"]
    }
};
let players = loadPlayers();
let matchConfig = getDefaultMatchConfig();
let teamNames = {};
let recentPlayerId = null;
let latestGeneratedTeams = [];
let latestTournament = null;

function createPlayerId() {
    return `player-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizePlayer(player) {
    return {
        id: player.id || createPlayerId(),
        name: player.name,
        rating: player.rating
    };
}

function loadPlayers() {
    const savedPlayers = localStorage.getItem(storageKey);

    if (!savedPlayers) {
        return [];
    }

    try {
        return JSON.parse(savedPlayers).map(normalizePlayer);
    } catch (error) {
        return [];
    }
}

function savePlayers() {
    localStorage.setItem(storageKey, JSON.stringify(players));
}

function loadSavedTournaments() {
    const savedTournaments = localStorage.getItem(tournamentStorageKey);

    if (!savedTournaments) {
        return [];
    }

    try {
        const parsedTournaments = JSON.parse(savedTournaments);

        return Array.isArray(parsedTournaments) ? parsedTournaments : [];
    } catch (error) {
        return [];
    }
}

function saveSavedTournaments(tournaments) {
    localStorage.setItem(tournamentStorageKey, JSON.stringify(tournaments));
}

function getAppElements() {
    return {
        nameInput: document.getElementById("name"),
        tournamentNameInput: document.getElementById("tournament-name"),
        ratingInput: document.getElementById("rating"),
        ratingValue: document.getElementById("rating-value"),
        ratingLevel: document.getElementById("rating-level"),
        playersPerTeamInput: document.getElementById("players-per-team"),
        teamCountInput: document.getElementById("team-count"),
        customSettingsPanel: document.getElementById("custom-sport-settings"),
        configMessage: document.getElementById("config-message"),
        teamSizeDisplay: document.getElementById("team-size-display"),
        sportModeBlock: document.getElementById("sport-mode-block"),
        sportModeSelector: document.getElementById("sport-mode-selector"),
        csvFileInput: document.getElementById("csv-file"),
        importCsvButton: document.getElementById("import-csv-btn"),
        toggleInstructionsButton: document.getElementById("toggle-instructions-btn"),
        instructionsPanel: document.getElementById("csv-instructions"),
        importMessage: document.getElementById("csv-import-message"),
        playersList: document.getElementById("players-list"),
        playersEmptyState: document.getElementById("players-empty-state"),
        teamsContainer: document.getElementById("teams"),
        teamsEmptyState: document.getElementById("teams-empty-state"),
        matchesContainer: document.getElementById("matches"),
        saveTournamentMessage: document.getElementById("tournament-save-message"),
        savedTournamentsList: document.getElementById("saved-tournaments-list"),
        savedTournamentsEmptyState: document.getElementById("saved-tournaments-empty-state"),
        matchDetailsSection: document.getElementById("match-details-section"),
        bracketContainer: document.getElementById("tournament-bracket"),
        bracketSection: document.getElementById("tournament-bracket-section"),
        configSummary: document.getElementById("config-summary"),
        optionPills: document.querySelectorAll(".option-pill")
    };
}

function isCustomSport() {
    return matchConfig.sport === "custom";
}

function getActiveTeamSettings() {
    if (isCustomSport()) {
        return {
            playersPerTeam: matchConfig.customPlayersPerTeam,
            teamCount: matchConfig.customTeamCount
        };
    }

    return {
        playersPerTeam: matchConfig.teamSize,
        teamCount: matchConfig.teamCount
    };
}

function formatSportName(sportKey) {
    if (sportKey === "custom") {
        return "Custom";
    }

    return sportKey.charAt(0).toUpperCase() + sportKey.slice(1);
}

function getDefaultTeamName(teamIndex) {
    return `Team ${teamIndex + 1}`;
}

function ensureTeamNames(teamCount) {
    const nextTeamNames = {};

    for (let index = 0; index < teamCount; index += 1) {
        const teamKey = `team-${index}`;
        nextTeamNames[teamKey] = teamNames[teamKey] || getDefaultTeamName(index);
    }

    teamNames = nextTeamNames;
}

function applySportSettings(sport) {
    if (sport === "custom") {
        matchConfig.teamCount = matchConfig.customTeamCount;
        matchConfig.teamSize = matchConfig.customPlayersPerTeam;
        ensureTeamNames(matchConfig.teamCount);
        return;
    }

    const selectedSportRules = sportRules[sport];

    if (!selectedSportRules) {
        return;
    }

    matchConfig.teamCount = 2;
    matchConfig.mode = selectedSportRules.modes[0];
    matchConfig.teamSize = selectedSportRules.teamSize;
    ensureTeamNames(matchConfig.teamCount);
}

function updateCustomSettingsVisibility() {
    const { customSettingsPanel, teamCountInput, playersPerTeamInput, sportModeBlock } = getAppElements();
    const showCustomSettings = isCustomSport();

    if (!customSettingsPanel || !teamCountInput || !playersPerTeamInput || !sportModeBlock) {
        return;
    }

    customSettingsPanel.classList.toggle("is-visible", showCustomSettings);
    customSettingsPanel.setAttribute("aria-hidden", String(!showCustomSettings));
    sportModeBlock.classList.toggle("hidden", showCustomSettings);
    teamCountInput.value = String(matchConfig.customTeamCount);
    playersPerTeamInput.value = String(matchConfig.customPlayersPerTeam);
}

function updateTeamSizeDisplay() {
    const { teamSizeDisplay } = getAppElements();

    if (!teamSizeDisplay) {
        return;
    }

    const activeTeamSize = isCustomSport() ? matchConfig.customPlayersPerTeam : matchConfig.teamSize;
    teamSizeDisplay.textContent = `${activeTeamSize} player${activeTeamSize === 1 ? "" : "s"} per team`;
}

function renderModeOptions() {
    const { sportModeSelector } = getAppElements();

    if (!sportModeSelector) {
        return;
    }

    if (isCustomSport()) {
        sportModeSelector.innerHTML = "";
        return;
    }

    const selectedSportRules = sportRules[matchConfig.sport];

    if (!selectedSportRules) {
        sportModeSelector.innerHTML = "";
        return;
    }

    sportModeSelector.innerHTML = selectedSportRules.modes.map((mode) => `
        <button
            class="option-pill${matchConfig.mode === mode ? " is-selected" : ""}"
            type="button"
            data-config-key="mode"
            data-value="${mode}"
            aria-pressed="${String(matchConfig.mode === mode)}"
        >${mode}</button>
    `).join("");
}

function showConfigMessage(message, type) {
    const { configMessage } = getAppElements();

    if (!configMessage) {
        return;
    }

    configMessage.textContent = message;
    configMessage.className = `status-message status-message--${type}`;
}

function clearConfigMessage() {
    const { configMessage } = getAppElements();

    if (!configMessage) {
        return;
    }

    configMessage.textContent = "";
    configMessage.className = "status-message hidden";
}

function applyModeRules() {
    if (matchConfig.sport === "badminton") {
        matchConfig.teamSize = matchConfig.mode === "Doubles" ? 2 : 1;
        return;
    }

    if (!isCustomSport()) {
        matchConfig.teamSize = sportRules[matchConfig.sport].teamSize;
    }
}

function getRatingMeta(value) {
    if (value <= 3) {
        return {
            label: "Beginner",
            levelClass: "rating-level--beginner",
            accent: "#52e0a1",
            accentSoft: "rgba(82, 224, 161, 0.16)"
        };
    }

    if (value <= 7) {
        return {
            label: "Intermediate",
            levelClass: "rating-level--intermediate",
            accent: "#f3c969",
            accentSoft: "rgba(243, 201, 105, 0.18)"
        };
    }

    return {
        label: "Pro",
        levelClass: "rating-level--pro",
        accent: "#ff6b6b",
        accentSoft: "rgba(255, 107, 107, 0.18)"
    };
}

function getAvatarColor(name) {
    const palette = [
        "linear-gradient(135deg, #52e0a1, #2d9f74)",
        "linear-gradient(135deg, #5ba6ff, #2d5bc9)",
        "linear-gradient(135deg, #ff8b6b, #c94f46)",
        "linear-gradient(135deg, #f3c969, #d9801f)",
        "linear-gradient(135deg, #aa8cff, #6652d9)",
        "linear-gradient(135deg, #5de1d1, #247d90)"
    ];
    const hash = [...name].reduce((total, char) => total + char.charCodeAt(0), 0);

    return palette[hash % palette.length];
}

function showImportMessage(message, type) {
    const { importMessage } = getAppElements();

    if (!importMessage) {
        return;
    }

    importMessage.textContent = message;
    importMessage.className = `status-message status-message--${type}`;
}

function clearImportMessage() {
    const { importMessage } = getAppElements();

    if (!importMessage) {
        return;
    }

    importMessage.textContent = "";
    importMessage.className = "status-message hidden";
}

function showTournamentSaveMessage(message, type) {
    const { saveTournamentMessage } = getAppElements();

    if (!saveTournamentMessage) {
        return;
    }

    saveTournamentMessage.textContent = message;
    saveTournamentMessage.className = `status-message status-message--${type}`;
}

function clearTournamentSaveMessage() {
    const { saveTournamentMessage } = getAppElements();

    if (!saveTournamentMessage) {
        return;
    }

    saveTournamentMessage.textContent = "";
    saveTournamentMessage.className = "status-message hidden";
}

function cloneTournamentData(data) {
    return JSON.parse(JSON.stringify(data));
}

function formatSavedDate(savedAt) {
    const parsedDate = new Date(savedAt);

    if (Number.isNaN(parsedDate.getTime())) {
        return "Unknown date";
    }

    return parsedDate.toLocaleString();
}

function sanitizeFileName(value) {
    return value.replace(/[<>:"/\\|?*\x00-\x1f]/g, "").replace(/\s+/g, "-").toLowerCase();
}

function getDefaultMatchConfig() {
    return {
        sport: "cricket",
        mode: "Standard",
        matchType: "Friendly",
        teamCount: 2,
        teamSize: 11,
        customPlayersPerTeam: 5,
        customTeamCount: 2
    };
}

function normalizeMatchConfig(config) {
    const nextConfig = {
        ...getDefaultMatchConfig(),
        ...config
    };

    if (nextConfig.sport !== "custom" && sportRules[nextConfig.sport]) {
        nextConfig.teamCount = 2;

        if (!sportRules[nextConfig.sport].modes.includes(nextConfig.mode)) {
            nextConfig.mode = sportRules[nextConfig.sport].modes[0];
        }

        if (nextConfig.sport === "badminton") {
            nextConfig.teamSize = nextConfig.mode === "Doubles" ? 2 : 1;
        } else {
            nextConfig.teamSize = sportRules[nextConfig.sport].teamSize;
        }
    } else if (nextConfig.sport === "custom") {
        nextConfig.teamCount = nextConfig.customTeamCount;
        nextConfig.teamSize = nextConfig.customPlayersPerTeam;
    }

    return nextConfig;
}

function getTournamentDisplayName() {
    return getAppElements().tournamentNameInput?.value.trim() || "Untitled Tournament";
}

function updateImportButtonState() {
    const { csvFileInput, importCsvButton } = getAppElements();

    if (!csvFileInput || !importCsvButton) {
        return;
    }

    importCsvButton.disabled = csvFileInput.files.length === 0;
}

function toggleInstructions() {
    const { instructionsPanel, toggleInstructionsButton } = getAppElements();

    if (!instructionsPanel || !toggleInstructionsButton) {
        return;
    }

    const isHidden = instructionsPanel.classList.toggle("hidden");
    toggleInstructionsButton.setAttribute("aria-expanded", String(!isHidden));
    toggleInstructionsButton.textContent = isHidden ? "View Instructions" : "Hide Instructions";
}

function parseCsvPlayers(csvText) {
    const rows = csvText
        .split(/\r?\n/)
        .map((row) => row.trim())
        .filter((row) => row !== "");

    if (rows.length < 2) {
        return { players: [], hasValidHeader: false };
    }

    const headerColumns = rows[0].split(",").map((column) => column.trim().toLowerCase());
    const hasValidHeader = headerColumns[0] === "name" && headerColumns[1] === "rating";

    if (!hasValidHeader) {
        return { players: [], hasValidHeader: false };
    }

    const importedPlayers = rows.slice(1).reduce((validPlayers, row) => {
        const columns = row.split(",");

        if (columns.length < 2) {
            return validPlayers;
        }

        const name = columns[0].trim();
        const rating = Number(columns[1].trim());

        if (!name || Number.isNaN(rating) || rating < 1 || rating > 10) {
            return validPlayers;
        }

        validPlayers.push({
            id: createPlayerId(),
            name,
            rating
        });

        return validPlayers;
    }, []);

    return {
        players: importedPlayers,
        hasValidHeader: true
    };
}

function handleCsvImport() {
    const { csvFileInput } = getAppElements();

    if (!csvFileInput || csvFileInput.files.length === 0) {
        showImportMessage("Select a CSV file before importing.", "error");
        return;
    }

    const [file] = csvFileInput.files;

    if (!file.name.toLowerCase().endsWith(".csv")) {
        showImportMessage("Invalid file format. Please upload a .csv file.", "error");
        return;
    }

    const reader = new FileReader();

    reader.addEventListener("load", () => {
        const csvText = typeof reader.result === "string" ? reader.result : "";
        const { players: importedPlayers, hasValidHeader } = parseCsvPlayers(csvText);

        if (!hasValidHeader) {
            showImportMessage("Invalid CSV format. Use headers: name,rating", "error");
            return;
        }

        if (importedPlayers.length === 0) {
            showImportMessage("No valid player rows found in the CSV file.", "error");
            return;
        }

        players = [...players, ...importedPlayers];
        recentPlayerId = importedPlayers[importedPlayers.length - 1].id;
        savePlayers();
        renderPlayers();
        clearTeams();
        showImportMessage(`Imported ${importedPlayers.length} player${importedPlayers.length === 1 ? "" : "s"} successfully.`, "success");
        csvFileInput.value = "";
        updateImportButtonState();
    });

    reader.addEventListener("error", () => {
        showImportMessage("Unable to read the selected file. Try again.", "error");
    });

    clearImportMessage();
    reader.readAsText(file);
}

function renderOptionPills() {
    const { optionPills } = getAppElements();

    optionPills.forEach((pill) => {
        const { configKey, value } = pill.dataset;
        pill.classList.toggle("is-selected", matchConfig[configKey] === value);
        pill.setAttribute("aria-pressed", String(matchConfig[configKey] === value));
    });
}

function updateMatchConfig(configKey, value) {
    const { teamsContainer } = getAppElements();

    if (!configKey || !value) {
        return;
    }

    matchConfig = {
        ...matchConfig,
        [configKey]: value
    };

    if (configKey === "sport") {
        applySportSettings(value);
        updateCustomSettingsVisibility();
        renderModeOptions();
        applyModeRules();
        updateTeamSizeDisplay();

        if (teamsContainer && teamsContainer.children.length > 0) {
            clearTeams();
        }
    }

    if (configKey === "mode") {
        applyModeRules();
        renderModeOptions();
        updateTeamSizeDisplay();

        if (teamsContainer && teamsContainer.children.length > 0) {
            clearTeams();
        }
    }

    if (configKey === "customTeamCount") {
        matchConfig.teamCount = Number(value);
        ensureTeamNames(matchConfig.teamCount);

        if (teamsContainer && teamsContainer.children.length > 0) {
            clearTeams();
        }
    }

    if (configKey === "customPlayersPerTeam") {
        matchConfig.teamSize = Number(value);
        updateTeamSizeDisplay();

        if (teamsContainer && teamsContainer.children.length > 0) {
            clearTeams();
        }
    }

    renderOptionPills();
    clearConfigMessage();

    if (teamsContainer && teamsContainer.children.length > 0) {
        renderConfigSummary();

        if (latestGeneratedTeams.length > 0) {
            renderMatches(latestGeneratedTeams);
        }
    }
}

function updateRatingDisplay() {
    const { ratingInput, ratingValue, ratingLevel } = getAppElements();

    if (!ratingInput || !ratingValue || !ratingLevel) {
        return;
    }

    const min = Number(ratingInput.min);
    const max = Number(ratingInput.max);
    const value = Number(ratingInput.value);
    const progress = ((value - min) / (max - min)) * 100;
    const ratingMeta = getRatingMeta(value);

    ratingValue.textContent = String(value);
    ratingLevel.textContent = ratingMeta.label;
    ratingLevel.className = `rating-level ${ratingMeta.levelClass}`;
    ratingInput.style.setProperty("--range-progress", `${progress}%`);
    ratingInput.style.setProperty("--range-accent", ratingMeta.accent);
    ratingInput.style.setProperty("--range-accent-soft", ratingMeta.accentSoft);
}

function renderConfigSummary() {
    const { configSummary } = getAppElements();

    if (!configSummary) {
        return;
    }

    configSummary.innerHTML = `
        <span class="config-pill">Sport: ${formatSportName(matchConfig.sport)}</span>
        ${isCustomSport() ? "" : `<span class="config-pill">Mode: ${matchConfig.mode}</span>`}
        <span class="config-pill">Match Type: ${matchConfig.matchType}</span>
        <span class="config-pill">Teams: ${matchConfig.teamCount}</span>
        <span class="config-pill">Team Size: ${isCustomSport() ? matchConfig.customPlayersPerTeam : matchConfig.teamSize}</span>
    `;
    configSummary.classList.remove("hidden");
}

function addPlayer() {
    const { nameInput, ratingInput } = getAppElements();
    const name = nameInput.value.trim();
    const rating = Number(ratingInput.value);

    if (!name || Number.isNaN(rating) || rating < 1 || rating > 10) {
        alert("Enter a valid player name and rating between 1 and 10.");
        return;
    }

    const player = {
        id: createPlayerId(),
        name,
        rating
    };

    players.push(player);
    recentPlayerId = player.id;
    savePlayers();
    renderPlayers();
    clearTeams();

    nameInput.value = "";
    ratingInput.value = "5";
    updateRatingDisplay();
    nameInput.focus();
}

function deletePlayer(playerId) {
    const { playersList } = getAppElements();
    const playerRow = playersList?.querySelector(`[data-player-id="${playerId}"]`);

    if (!playerRow) {
        players = players.filter((player) => player.id !== playerId);
        savePlayers();
        renderPlayers();
        clearTeams();
        return;
    }

    playerRow.classList.add("player-item--removing");

    window.setTimeout(() => {
        players = players.filter((player) => player.id !== playerId);
        savePlayers();
        renderPlayers();
        clearTeams();
    }, 220);
}

function clearPlayers() {
    if (players.length === 0) {
        return;
    }

    players = [];
    savePlayers();
    renderPlayers();
    clearTeams();
}

function renderPlayers() {
    const { playersList, playersEmptyState } = getAppElements();

    if (!playersList || !playersEmptyState) {
        return;
    }

    playersList.innerHTML = "";
    playersEmptyState.classList.toggle("hidden", players.length > 0);

    players.forEach((player) => {
        const listItem = document.createElement("li");
        listItem.className = "player-item";
        listItem.dataset.playerId = player.id;

        if (player.id === recentPlayerId) {
            listItem.classList.add("player-item--enter");
        }

        const avatar = document.createElement("span");
        avatar.className = "player-avatar";
        avatar.textContent = player.name.charAt(0).toUpperCase();
        avatar.style.background = getAvatarColor(player.name);

        const meta = document.createElement("div");
        meta.className = "player-meta";
        meta.innerHTML = `
            <span class="player-name">${player.name}</span>
            <span class="player-rating">Rating: ${player.rating}</span>
        `;

        const info = document.createElement("div");
        info.className = "player-info";
        info.append(avatar, meta);

        const deleteButton = document.createElement("button");
        deleteButton.className = "btn btn-danger";
        deleteButton.type = "button";
        deleteButton.textContent = "Delete";
        deleteButton.addEventListener("click", () => deletePlayer(player.id));

        listItem.append(info, deleteButton);
        playersList.appendChild(listItem);
    });

    recentPlayerId = null;
}

function generateTeams() {
    const { playersPerTeam, teamCount } = getActiveTeamSettings();
    const requiredPlayers = playersPerTeam * teamCount;

    if (players.length < requiredPlayers) {
        showConfigMessage("Not enough players for selected sport", "error");
        return;
    }

    clearConfigMessage();

    const sortedPlayers = [...players]
        .sort((a, b) => b.rating - a.rating)
        .slice(0, requiredPlayers);
    const generatedTeams = Array.from({ length: teamCount }, (_, index) => ({
        key: `team-${index}`,
        players: [],
        total: 0
    }));

    sortedPlayers.forEach((player) => {
        const targetTeam = generatedTeams.reduce((lowestTotalTeam, currentTeam) => {
            if (
                currentTeam.players.length < playersPerTeam &&
                (
                    lowestTotalTeam.players.length === playersPerTeam ||
                    currentTeam.total < lowestTotalTeam.total
                )
            ) {
                return currentTeam;
            }

            return lowestTotalTeam;
        }, generatedTeams[0]);

        targetTeam.players.push(player);
        targetTeam.total += player.rating;
    });

    renderTeams(generatedTeams);
}

function updateTeamName(teamKey, value) {
    const trimmedValue = value.trim();
    const teamIndex = Number(teamKey.replace("team-", ""));

    teamNames[teamKey] = trimmedValue || getDefaultTeamName(teamIndex);
}

function handleTeamNameInput(event) {
    const teamKey = event.target.dataset.teamKey;

    if (!teamKey) {
        return;
    }

    updateTeamName(teamKey, event.target.value);
}

function handleTeamNameBlur(event) {
    const teamKey = event.target.dataset.teamKey;

    if (!teamKey) {
        return;
    }

    updateTeamName(teamKey, event.target.value);
    event.target.value = teamNames[teamKey];

    if (latestGeneratedTeams.length > 0) {
        renderMatches(latestGeneratedTeams);
    }
}

function createTournamentSnapshot() {
    return {
        id: `tournament-${Date.now()}`,
        name: getTournamentDisplayName(),
        savedAt: new Date().toISOString(),
        sport: matchConfig.sport,
        matchType: matchConfig.matchType,
        matchConfig: cloneTournamentData(matchConfig),
        players: cloneTournamentData(players),
        teams: cloneTournamentData(latestGeneratedTeams),
        teamNames: cloneTournamentData(teamNames),
        matches: cloneTournamentData(latestTournament?.rounds || []),
        tournamentState: cloneTournamentData(latestTournament),
        winners: cloneTournamentData(
            latestTournament?.rounds.flatMap((round) => (
                round.matches
                    .filter((match) => match.winnerSide)
                    .map((match) => ({
                        matchId: match.id,
                        winnerSide: match.winnerSide,
                        winnerName: resolveParticipantName(match[match.winnerSide], latestTournament)
                    }))
            )) || []
        )
    };
}

function saveTournament() {
    const { tournamentNameInput } = getAppElements();
    const tournamentName = tournamentNameInput?.value.trim() || "";

    if (!tournamentName) {
        showTournamentSaveMessage("Enter a tournament name before saving.", "error");
        return;
    }

    if (latestGeneratedTeams.length === 0 || !latestTournament) {
        showTournamentSaveMessage("Generate teams before saving a tournament.", "error");
        return;
    }

    const nextTournament = createTournamentSnapshot();
    const savedTournaments = loadSavedTournaments();

    savedTournaments.unshift(nextTournament);
    saveSavedTournaments(savedTournaments);
    renderSavedTournaments();
    showTournamentSaveMessage(`Saved "${tournamentName}" successfully.`, "success");
}

function applyLoadedMatchConfig(savedConfig) {
    const { playersPerTeamInput, teamCountInput, tournamentNameInput } = getAppElements();

    matchConfig = normalizeMatchConfig(savedConfig);

    if (playersPerTeamInput) {
        playersPerTeamInput.value = String(matchConfig.customPlayersPerTeam);
    }

    if (teamCountInput) {
        teamCountInput.value = String(matchConfig.customTeamCount);
    }

    if (tournamentNameInput && typeof savedConfig.name === "string") {
        tournamentNameInput.value = savedConfig.name;
    }

    ensureTeamNames(matchConfig.teamCount);
    updateCustomSettingsVisibility();
    renderModeOptions();
    applyModeRules();
    updateTeamSizeDisplay();
    renderOptionPills();
    clearConfigMessage();
}

function loadTournament(tournamentId) {
    const savedTournament = loadSavedTournaments().find((tournament) => tournament.id === tournamentId);

    if (!savedTournament) {
        showTournamentSaveMessage("Saved tournament not found.", "error");
        return;
    }

    players = Array.isArray(savedTournament.players)
        ? savedTournament.players.map(normalizePlayer)
        : [];
    savePlayers();
    renderPlayers();

    teamNames = savedTournament.teamNames || {};
    applyLoadedMatchConfig({
        ...savedTournament.matchConfig,
        name: savedTournament.name
    });

    latestGeneratedTeams = cloneTournamentData(savedTournament.teams || []);
    latestTournament = cloneTournamentData(savedTournament.tournamentState || null);

    if (latestGeneratedTeams.length > 0) {
        renderTeams(latestGeneratedTeams, { preserveTournamentState: true });
    } else {
        clearTeams();
    }

    showTournamentSaveMessage(`Loaded "${savedTournament.name}".`, "success");
}

function deleteTournament(tournamentId) {
    const savedTournaments = loadSavedTournaments();
    const nextTournaments = savedTournaments.filter((tournament) => tournament.id !== tournamentId);

    if (nextTournaments.length === savedTournaments.length) {
        showTournamentSaveMessage("Saved tournament not found.", "error");
        return;
    }

    saveSavedTournaments(nextTournaments);
    renderSavedTournaments();
    showTournamentSaveMessage("Tournament deleted.", "success");
}

function renderSavedTournaments() {
    const { savedTournamentsList, savedTournamentsEmptyState } = getAppElements();

    if (!savedTournamentsList || !savedTournamentsEmptyState) {
        return;
    }

    const savedTournaments = loadSavedTournaments();

    savedTournamentsList.innerHTML = savedTournaments.map((tournament) => `
        <article class="saved-tournament-card">
            <div class="saved-tournament-card__top">
                <div>
                    <h3 class="saved-tournament-card__title">${tournament.name}</h3>
                    <div class="saved-tournament-card__date">${formatSavedDate(tournament.savedAt)}</div>
                </div>
                <span class="config-pill">${formatSportName(tournament.sport || tournament.matchConfig?.sport || "custom")}</span>
            </div>
            <div class="saved-tournament-card__meta">
                <span class="config-pill">Match Type: ${tournament.matchType || tournament.matchConfig?.matchType || "Unknown"}</span>
                <span class="config-pill">Teams: ${(tournament.teams || []).length}</span>
            </div>
            <div class="saved-tournament-card__actions">
                <button class="btn btn-primary" type="button" data-saved-action="load" data-tournament-id="${tournament.id}">Load</button>
                <button class="btn btn-danger" type="button" data-saved-action="delete" data-tournament-id="${tournament.id}">Delete</button>
            </div>
        </article>
    `).join("");

    savedTournamentsEmptyState.classList.toggle("hidden", savedTournaments.length > 0);
}

function getChampionName(tournamentState) {
    if (!tournamentState || !Array.isArray(tournamentState.rounds) || tournamentState.rounds.length === 0) {
        return "TBD";
    }

    const finalRound = tournamentState.rounds[tournamentState.rounds.length - 1];
    const finalMatch = finalRound?.matches?.[0];

    if (!finalMatch || !finalMatch.winnerSide) {
        return "TBD";
    }

    return resolveParticipantName(finalMatch[finalMatch.winnerSide], tournamentState);
}

function getTournamentFixtureLines(tournamentState) {
    if (!tournamentState || !Array.isArray(tournamentState.rounds)) {
        return [];
    }

    return tournamentState.rounds.flatMap((round) => {
        const roundHeader = `${round.title}`;
        const roundMatches = round.matches.map((match) => {
            const homeName = resolveParticipantName(match.home, tournamentState);
            const awayName = resolveParticipantName(match.away, tournamentState);
            const homeScore = match.homeScore === "" ? "-" : match.homeScore;
            const awayScore = match.awayScore === "" ? "-" : match.awayScore;
            const winnerName = match.winnerSide
                ? resolveParticipantName(match[match.winnerSide], tournamentState)
                : "TBD";

            return `Match ${getMatchNumber(match.id)}: ${homeName} vs ${awayName} | Score ${homeScore}-${awayScore} | Winner: ${winnerName}`;
        });

        return [roundHeader, ...roundMatches, ""];
    });
}

function getTeamSummaryLines(teams) {
    return teams.flatMap((team) => {
        const title = getTeamDisplayName(team);
        const playerLine = team.players.map((player) => `${player.name} (${player.rating})`).join(", ");

        return [
            `${title}`,
            `Total Rating: ${team.total}`,
            `Players: ${playerLine}`,
            ""
        ];
    });
}

function applyPdfPageTheme(doc) {
    doc.setFillColor(7, 17, 31);
    doc.rect(0, 0, 210, 297, "F");
    doc.setTextColor(236, 244, 255);
}

function addPdfWrappedText(doc, lines, startY, options = {}) {
    const left = options.left || 20;
    const maxWidth = options.maxWidth || 170;
    const lineHeight = options.lineHeight || 7;
    const bottomLimit = options.bottomLimit || 280;
    let currentY = startY;

    lines.forEach((line) => {
        const normalizedLine = line === "" ? " " : line;
        const wrappedLines = doc.splitTextToSize(normalizedLine, maxWidth);

        wrappedLines.forEach((wrappedLine) => {
            if (currentY > bottomLimit) {
                doc.addPage();
                applyPdfPageTheme(doc);
                currentY = 20;
            }

            doc.text(wrappedLine, left, currentY);
            currentY += lineHeight;
        });

        if (line === "") {
            currentY += 2;
        }
    });

    return currentY;
}

function exportTournamentPdf() {
    const tournamentName = getTournamentDisplayName();

    if (latestGeneratedTeams.length === 0 || !latestTournament) {
        showTournamentSaveMessage("Generate teams before exporting a tournament PDF.", "error");
        return;
    }

    if (!window.jspdf || !window.jspdf.jsPDF) {
        showTournamentSaveMessage("PDF library is unavailable right now.", "error");
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const exportDate = new Date();
    const champion = getChampionName(latestTournament);
    const title = tournamentName;
    const detailsLines = [
        `Date: ${exportDate.toLocaleString()}`,
        `Sport: ${formatSportName(matchConfig.sport)}`,
        `Match Type: ${matchConfig.matchType}`,
        `Champion: ${champion}`
    ];

    applyPdfPageTheme(doc);
    doc.setDrawColor(82, 224, 161);
    doc.setLineWidth(0.7);
    doc.line(20, 26, 190, 26);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text(title, 20, 18);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    let currentY = addPdfWrappedText(doc, detailsLines, 34, { lineHeight: 6 });

    currentY += 6;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("Teams", 20, currentY);
    currentY += 8;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10.5);
    currentY = addPdfWrappedText(doc, getTeamSummaryLines(latestGeneratedTeams), currentY, {
        lineHeight: 5.5
    });

    currentY += 5;
    if (currentY > 265) {
        doc.addPage();
        applyPdfPageTheme(doc);
        currentY = 20;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("Match Fixtures", 20, currentY);
    currentY += 8;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10.5);
    currentY = addPdfWrappedText(doc, getTournamentFixtureLines(latestTournament), currentY, {
        lineHeight: 5.5
    });

    currentY += 4;
    if (currentY > 275) {
        doc.addPage();
        applyPdfPageTheme(doc);
        currentY = 20;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("Champion", 20, currentY);
    currentY += 8;

    doc.setFontSize(12);
    doc.text(champion, 20, currentY);

    doc.save(`${sanitizeFileName(tournamentName) || "tournament"}-report.pdf`);
    showTournamentSaveMessage(`Exported "${tournamentName}" as PDF.`, "success");
}

function createBalanceSummary(balanceDifference) {
    const isWellBalanced = balanceDifference <= 2;
    const balanceLabel = isWellBalanced ? "Well Balanced" : "Needs Adjustment";
    const balanceStateClass = isWellBalanced ? " balance-summary--good" : "";

    return `
        <div class="balance-summary${balanceStateClass}">
            <span class="balance-summary__eyebrow">Balance Score</span>
            <div class="balance-summary__row">
                <strong>Difference: ${balanceDifference}</strong>
                <span class="balance-summary__badge">${balanceLabel}</span>
            </div>
        </div>
    `;
}

function createTeamCard(team, highestTotal, balanceDifference) {
    const { key, players: teamPlayers, total } = team;
    const teamIndex = Number(key.replace("team-", ""));
    const title = teamNames[key] || getDefaultTeamName(teamIndex);
    const isWinner = total === highestTotal;
    const isDraw = balanceDifference === 0;
    const winnerBadge = isWinner ? '<span class="team-badge">Higher Rated</span>' : "";
    const teamCardStateClass = isWinner ? " team-card--winner" : "";
    const teamCardToneClass = isDraw ? " team-card--draw" : "";
    const isWellBalanced = balanceDifference <= 2;
    const balanceNote = isWellBalanced ? '<div class="team-balance-note">Balanced matchup</div>' : "";

    return `
        <article class="team-card fade-in${teamCardStateClass}${teamCardToneClass}">
            <div class="team-card__top">
                <label class="team-name-field">
                    <span class="sr-only">Team name</span>
                    <input
                        class="team-name-input"
                        type="text"
                        value="${title}"
                        data-team-key="${key}"
                        aria-label="${title} name"
                    >
                </label>
                ${winnerBadge}
            </div>
            <p>${teamPlayers.length} player${teamPlayers.length === 1 ? "" : "s"}</p>
            <ul class="team-list">
                ${teamPlayers.map((player) => `
                    <li>
                        <div class="team-player">
                            <strong>${player.name}</strong>
                            <span>Rating: ${player.rating}</span>
                        </div>
                    </li>
                `).join("")}
            </ul>
            ${balanceNote}
            <div class="team-total">Total Rating: ${total}</div>
        </article>
    `;
}

function getTeamDisplayName(team) {
    const teamIndex = Number(team.key.replace("team-", ""));

    return teamNames[team.key] || getDefaultTeamName(teamIndex);
}

function createParticipant(type, value) {
    return { type, value };
}

function createTournamentMatch(id, home, away) {
    return {
        id,
        home,
        away,
        homeScore: "",
        awayScore: "",
        winnerSide: "",
        error: ""
    };
}

function createRoundSection(title, matches, tournamentState) {
    return `
        <section class="match-round">
            <div class="match-round__header">
                <h3>${title}</h3>
                <span>${matches.length} match${matches.length === 1 ? "" : "es"}</span>
            </div>
            <div class="matches-grid">
                ${matches.map((match, index) => createMatchCard(index + 1, match, tournamentState)).join("")}
            </div>
        </section>
    `;
}

function buildTournamentRounds(generatedTeams) {
    const seededTeams = [...generatedTeams].sort((teamA, teamB) => teamB.total - teamA.total);
    const rounds = [];
    let matchNumber = 1;

    const nextMatchId = () => {
        const id = `match-${matchNumber}`;
        matchNumber += 1;
        return id;
    };

    if (seededTeams.length === 2) {
        rounds.push({
            title: "Final",
            matches: [
                createTournamentMatch(
                    nextMatchId(),
                    createParticipant("team", seededTeams[0].key),
                    createParticipant("team", seededTeams[1].key)
                )
            ]
        });

        return rounds;
    }

    if (seededTeams.length <= 4) {
        const roundOneMatches = [];

        if (seededTeams.length === 3) {
            const firstMatchId = nextMatchId();

            roundOneMatches.push(
                createTournamentMatch(
                    firstMatchId,
                    createParticipant("team", seededTeams[1].key),
                    createParticipant("team", seededTeams[2].key)
                )
            );

            rounds.push({
                title: "Round 1",
                matches: roundOneMatches
            });

            rounds.push({
                title: "Final",
                matches: [
                    createTournamentMatch(
                        nextMatchId(),
                        createParticipant("team", seededTeams[0].key),
                        createParticipant("winner", firstMatchId)
                    )
                ]
            });

            return rounds;
        } else {
            const firstSemiId = nextMatchId();
            const secondSemiId = nextMatchId();

            roundOneMatches.push(
                createTournamentMatch(
                    firstSemiId,
                    createParticipant("team", seededTeams[0].key),
                    createParticipant("team", seededTeams[3].key)
                ),
                createTournamentMatch(
                    secondSemiId,
                    createParticipant("team", seededTeams[1].key),
                    createParticipant("team", seededTeams[2].key)
                )
            );

            rounds.push({
                title: "Semi-finals",
                matches: roundOneMatches
            });

            rounds.push({
                title: "Final",
                matches: [
                    createTournamentMatch(
                        nextMatchId(),
                        createParticipant("winner", firstSemiId),
                        createParticipant("winner", secondSemiId)
                    )
                ]
            });

            return rounds;
        }
    }

    const roundOneMatchCount = seededTeams.length - 4;
    const byeTeamCount = seededTeams.length - (roundOneMatchCount * 2);
    const roundOneMatches = [];
    const roundOneWinnerParticipants = [];

    for (let index = 0; index < roundOneMatchCount; index += 1) {
        const roundOneMatchId = nextMatchId();
        const homeTeam = seededTeams[byeTeamCount + index];
        const awayTeam = seededTeams[seededTeams.length - 1 - index];

        roundOneMatches.push(
            createTournamentMatch(
                roundOneMatchId,
                createParticipant("team", homeTeam.key),
                createParticipant("team", awayTeam.key)
            )
        );

        roundOneWinnerParticipants.push(createParticipant("winner", roundOneMatchId));
    }

    rounds.push({
        title: "Round 1",
        matches: roundOneMatches
    });

    const semiFinalParticipants = [
        ...seededTeams.slice(0, byeTeamCount).map((team) => createParticipant("team", team.key)),
        ...roundOneWinnerParticipants
    ];
    const semiFinalOneId = nextMatchId();
    const semiFinalTwoId = nextMatchId();

    rounds.push({
        title: "Semi-finals",
        matches: [
            createTournamentMatch(
                semiFinalOneId,
                semiFinalParticipants[0],
                semiFinalParticipants[3]
            ),
            createTournamentMatch(
                semiFinalTwoId,
                semiFinalParticipants[1],
                semiFinalParticipants[2]
            )
        ]
    });

    rounds.push({
        title: "Final",
        matches: [
            createTournamentMatch(
                nextMatchId(),
                createParticipant("winner", semiFinalOneId),
                createParticipant("winner", semiFinalTwoId)
            )
        ]
    });

    return rounds;
}

function createTournamentState(generatedTeams) {
    return {
        rounds: buildTournamentRounds(generatedTeams)
    };
}

function findMatchById(matchId, tournamentState) {
    for (const round of tournamentState.rounds) {
        const foundMatch = round.matches.find((match) => match.id === matchId);

        if (foundMatch) {
            return foundMatch;
        }
    }

    return null;
}

function getMatchNumber(matchId) {
    return matchId.replace("match-", "");
}

function resolveParticipantName(participant, tournamentState) {
    if (participant.type === "team") {
        const teamIndex = Number(participant.value.replace("team-", ""));

        return teamNames[participant.value] || getDefaultTeamName(teamIndex);
    }

    const sourceMatch = findMatchById(participant.value, tournamentState);

    if (!sourceMatch || !sourceMatch.winnerSide) {
        return `Winner Match ${getMatchNumber(participant.value)}`;
    }

    return resolveParticipantName(sourceMatch[sourceMatch.winnerSide], tournamentState);
}

function clearDependentMatches(matchId, tournamentState) {
    tournamentState.rounds.forEach((round) => {
        round.matches.forEach((match) => {
            const dependsOnMatch = [match.home, match.away].some((participant) => (
                participant.type === "winner" && participant.value === matchId
            ));

            if (dependsOnMatch) {
                match.homeScore = "";
                match.awayScore = "";
                match.winnerSide = "";
                match.error = "";
                clearDependentMatches(match.id, tournamentState);
            }
        });
    });
}

function createMatchCard(matchNumber, match, tournamentState) {
    const homeName = resolveParticipantName(match.home, tournamentState);
    const awayName = resolveParticipantName(match.away, tournamentState);
    const winnerName = match.winnerSide ? resolveParticipantName(match[match.winnerSide], tournamentState) : "";
    const winnerMarkup = winnerName
        ? `<div class="match-card__winner">Winner: <span>${winnerName}</span></div>`
        : "";
    const errorMarkup = match.error ? `<div class="match-card__error">${match.error}</div>` : "";

    return `
        <article class="match-card fade-in${winnerName ? " match-card--resolved" : ""}">
            <div class="match-card__top">
                <span class="match-card__title">Match ${matchNumber}</span>
                <span class="match-card__type">${matchConfig.matchType}</span>
            </div>
            <div class="match-card__teams">${homeName} vs ${awayName}</div>
            <div class="match-card__scores">
                <label class="match-score-field">
                    <span>${homeName}</span>
                    <input type="number" min="0" data-match-id="${match.id}" data-score-side="homeScore" value="${match.homeScore}">
                </label>
                <label class="match-score-field">
                    <span>${awayName}</span>
                    <input type="number" min="0" data-match-id="${match.id}" data-score-side="awayScore" value="${match.awayScore}">
                </label>
            </div>
            <div class="match-card__actions">
                <button class="btn btn-primary" type="button" data-action="set-winner" data-match-id="${match.id}">Set Winner</button>
            </div>
            ${winnerMarkup}
            ${errorMarkup}
        </article>
    `;
}

function createBracketMatchCard(match, tournamentState) {
    const homeName = resolveParticipantName(match.home, tournamentState);
    const awayName = resolveParticipantName(match.away, tournamentState);
    const homeScore = match.homeScore === "" ? "-" : match.homeScore;
    const awayScore = match.awayScore === "" ? "-" : match.awayScore;
    const homeWinnerClass = match.winnerSide === "home" ? " bracket-match__team--winner" : "";
    const awayWinnerClass = match.winnerSide === "away" ? " bracket-match__team--winner" : "";

    return `
        <article class="bracket-match${match.winnerSide ? " bracket-match--resolved" : ""}">
            <div class="bracket-match__title">Match ${getMatchNumber(match.id)}</div>
            <div class="bracket-match__team${homeWinnerClass}">
                <span>${homeName}</span>
                <strong>${homeScore}</strong>
            </div>
            <div class="bracket-match__team${awayWinnerClass}">
                <span>${awayName}</span>
                <strong>${awayScore}</strong>
            </div>
        </article>
    `;
}

function renderBracket(tournamentState) {
    const { bracketContainer, bracketSection } = getAppElements();

    if (!bracketContainer || !bracketSection) {
        return;
    }

    if (!tournamentState || tournamentState.rounds.length === 0) {
        bracketContainer.innerHTML = "";
        bracketSection.classList.add("hidden");
        return;
    }

    bracketContainer.innerHTML = tournamentState.rounds.map((round) => `
        <section class="bracket-round bracket-round--${round.title.toLowerCase().replace(/[^a-z]+/g, "-")}">
            <div class="bracket-round__header">${round.title}</div>
            <div class="bracket-round__matches">
                ${round.matches.map((match) => createBracketMatchCard(match, tournamentState)).join("")}
            </div>
        </section>
    `).join("");

    bracketSection.classList.remove("hidden");
}

function setMatchWinner(matchId) {
    if (!latestTournament) {
        return;
    }

    const match = findMatchById(matchId, latestTournament);

    if (!match) {
        return;
    }

    if (match.homeScore === "" || match.awayScore === "") {
        match.error = "Enter both scores before setting a winner.";
        renderMatches(latestGeneratedTeams);
        return;
    }

    const homeScore = Number(match.homeScore);
    const awayScore = Number(match.awayScore);

    if (homeScore === awayScore) {
        match.error = "Tie scores are not allowed. Enter a decisive result.";
        renderMatches(latestGeneratedTeams);
        return;
    }

    match.winnerSide = homeScore > awayScore ? "home" : "away";
    match.error = "";
    clearDependentMatches(match.id, latestTournament);
    renderMatches(latestGeneratedTeams);
}

function bindMatchEvents() {
    const { matchesContainer } = getAppElements();

    if (!matchesContainer) {
        return;
    }

    matchesContainer.querySelectorAll("[data-score-side]").forEach((input) => {
        input.addEventListener("input", (event) => {
            if (!latestTournament) {
                return;
            }

            const { matchId, scoreSide } = event.target.dataset;
            const match = findMatchById(matchId, latestTournament);

            if (!match) {
                return;
            }

            match[scoreSide] = event.target.value;
            match.error = "";
        });
    });

    matchesContainer.querySelectorAll('[data-action="set-winner"]').forEach((button) => {
        button.addEventListener("click", () => {
            setMatchWinner(button.dataset.matchId);
        });
    });
}

function renderMatches(generatedTeams) {
    const { matchesContainer, matchDetailsSection } = getAppElements();

    if (!matchesContainer || !matchDetailsSection) {
        return;
    }

    if (!latestTournament) {
        latestTournament = createTournamentState(generatedTeams);
    }

    matchesContainer.innerHTML = latestTournament.rounds
        .map((round) => createRoundSection(round.title, round.matches, latestTournament))
        .join("");
    matchDetailsSection.classList.remove("hidden");
    bindMatchEvents();
    renderBracket(latestTournament);
}

function renderTeams(generatedTeams, options = {}) {
    const { teamsContainer, teamsEmptyState, configSummary } = getAppElements();
    const { preserveTournamentState = false } = options;

    if (!teamsContainer || !teamsEmptyState || !configSummary) {
        return;
    }

    const teamTotals = generatedTeams.map((team) => team.total);
    const highestTotal = Math.max(...teamTotals);
    const lowestTotal = Math.min(...teamTotals);
    const balanceDifference = highestTotal - lowestTotal;
    latestGeneratedTeams = generatedTeams;

    if (!preserveTournamentState || !latestTournament) {
        latestTournament = createTournamentState(generatedTeams);
    }

    renderConfigSummary();

    teamsContainer.innerHTML = `
        ${createBalanceSummary(balanceDifference)}
        ${generatedTeams.map((team) => createTeamCard(team, highestTotal, balanceDifference)).join("")}
    `;
    teamsEmptyState.classList.add("hidden");

    teamsContainer.querySelectorAll(".team-name-input").forEach((input) => {
        input.addEventListener("input", handleTeamNameInput);
        input.addEventListener("blur", handleTeamNameBlur);
    });

    renderMatches(generatedTeams);
}

function clearTeams() {
    const {
        teamsContainer,
        teamsEmptyState,
        configSummary,
        matchesContainer,
        matchDetailsSection,
        bracketContainer,
        bracketSection
    } = getAppElements();

    if (
        !teamsContainer ||
        !teamsEmptyState ||
        !configSummary ||
        !matchesContainer ||
        !matchDetailsSection ||
        !bracketContainer ||
        !bracketSection
    ) {
        return;
    }

    teamsContainer.innerHTML = "";
    teamsEmptyState.classList.remove("hidden");
    configSummary.innerHTML = "";
    configSummary.classList.add("hidden");
    matchesContainer.innerHTML = "";
    matchDetailsSection.classList.add("hidden");
    bracketContainer.innerHTML = "";
    bracketSection.classList.add("hidden");
    latestGeneratedTeams = [];
    latestTournament = null;
}

function bindEvents() {
    const addPlayerButton = document.getElementById("add-player-btn");
    const clearPlayersButton = document.getElementById("clear-players-btn");
    const generateTeamsButton = document.getElementById("generate-teams-btn");
    const saveTournamentButton = document.getElementById("save-tournament-btn");
    const exportPdfButton = document.getElementById("export-pdf-btn");
    const ratingInput = document.getElementById("rating");
    const nameInput = document.getElementById("name");
    const playersPerTeamInput = document.getElementById("players-per-team");
    const teamCountInput = document.getElementById("team-count");
    const optionPills = document.querySelectorAll(".option-pill");
    const csvFileInput = document.getElementById("csv-file");
    const importCsvButton = document.getElementById("import-csv-btn");
    const toggleInstructionsButton = document.getElementById("toggle-instructions-btn");
    const savedTournamentsList = document.getElementById("saved-tournaments-list");

    if (
        !addPlayerButton ||
        !clearPlayersButton ||
        !generateTeamsButton ||
        !saveTournamentButton ||
        !exportPdfButton ||
        !ratingInput ||
        !nameInput ||
        !playersPerTeamInput ||
        !teamCountInput ||
        !csvFileInput ||
        !importCsvButton ||
        !toggleInstructionsButton ||
        !savedTournamentsList ||
        optionPills.length === 0
    ) {
        return;
    }

    addPlayerButton.addEventListener("click", addPlayer);
    clearPlayersButton.addEventListener("click", clearPlayers);
    generateTeamsButton.addEventListener("click", generateTeams);
    saveTournamentButton.addEventListener("click", saveTournament);
    exportPdfButton.addEventListener("click", exportTournamentPdf);
    ratingInput.addEventListener("input", updateRatingDisplay);
    playersPerTeamInput.addEventListener("input", () => {
        const nextPlayersPerTeam = Math.min(20, Math.max(1, Number(playersPerTeamInput.value) || 1));

        playersPerTeamInput.value = String(nextPlayersPerTeam);
        updateMatchConfig("customPlayersPerTeam", nextPlayersPerTeam);
    });
    teamCountInput.addEventListener("input", () => {
        const nextTeamCount = Math.min(8, Math.max(2, Number(teamCountInput.value) || 2));

        teamCountInput.value = String(nextTeamCount);
        updateMatchConfig("customTeamCount", nextTeamCount);
    });
    csvFileInput.addEventListener("change", () => {
        updateImportButtonState();
        clearImportMessage();
    });
    importCsvButton.addEventListener("click", handleCsvImport);
    toggleInstructionsButton.addEventListener("click", toggleInstructions);
    savedTournamentsList.addEventListener("click", (event) => {
        const actionButton = event.target.closest("[data-saved-action]");

        if (!actionButton) {
            return;
        }

        const { savedAction, tournamentId } = actionButton.dataset;

        if (savedAction === "load") {
            loadTournament(tournamentId);
            return;
        }

        if (savedAction === "delete") {
            deleteTournament(tournamentId);
        }
    });

    document.addEventListener("click", (event) => {
        const pill = event.target.closest(".option-pill");

        if (!pill) {
            return;
        }

        updateMatchConfig(pill.dataset.configKey, pill.dataset.value);
    });

    nameInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
            addPlayer();
        }
    });
}

function initializeApp() {
    if (!document.body.classList.contains("app-page")) {
        return;
    }

    bindEvents();
    applySportSettings(matchConfig.sport);
    updateCustomSettingsVisibility();
    renderModeOptions();
    applyModeRules();
    updateTeamSizeDisplay();
    renderOptionPills();
    updateRatingDisplay();
    updateImportButtonState();
    renderPlayers();
    renderSavedTournaments();
    clearTournamentSaveMessage();
    clearTeams();
}

initializeApp();
