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
const sportRoles = {
    Cricket: [
        "Batsman",
        "Bowler",
        "All-Rounder",
        "Wicketkeeper"
    ],
    Football: [
        "Goalkeeper",
        "Defender",
        "Midfielder",
        "Forward"
    ],
    Badminton: [
        "Singles Specialist",
        "Doubles Specialist"
    ],
    Athletics: [
        "Sprinter",
        "Relay Runner",
        "Distance Runner"
    ]
};
const roleShortLabels = {
    Batsman: "BAT",
    Bowler: "BOWL",
    "All-Rounder": "AR",
    Wicketkeeper: "WK",
    Goalkeeper: "GK",
    Defender: "DEF",
    Midfielder: "MID",
    Forward: "FWD",
    "Singles Specialist": "SS",
    "Doubles Specialist": "DS",
    Sprinter: "SPR",
    "Relay Runner": "REL",
    "Distance Runner": "DIST"
};
let players = loadPlayers();
let matchConfig = getDefaultMatchConfig();
matchConfig.customPlayersPerTeamInput = "";
matchConfig.customTeamCountInput = "";
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
        rating: player.rating,
        role: player.role || null
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
        rolePanel: document.getElementById("role-panel"),
        roleSelect: document.getElementById("role"),
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
        statisticsOverview: document.getElementById("statistics-overview"),
        statisticsTeamAnalytics: document.getElementById("statistics-team-analytics"),
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

function getRoleOptionsForSport(sport) {
    return sportRoles[formatSportName(sport)] || [];
}

function getDefaultRoleForSport(sport) {
    return getRoleOptionsForSport(sport)[0] || null;
}

function isValidRoleForSport(sport, role) {
    if (!role) {
        return false;
    }

    return getRoleOptionsForSport(sport).includes(role);
}

function getRoleShortLabel(role) {
    return roleShortLabels[role] || role || "";
}

function renderPlayerRoleBadge(role) {
    if (!role) {
        return "";
    }

    const shortLabel = getRoleShortLabel(role);

    if (!shortLabel) {
        return "";
    }

    return `<span class="player-role-badge">[${shortLabel}]</span>`;
}

function renderPlayerIdentity(player) {
    return `
        <div class="player-name-row">
            <span class="player-name">${player.name}</span>
            ${renderPlayerRoleBadge(player.role)}
        </div>
    `;
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
        if (matchConfig.customTeamCountInput !== "" && !Number.isNaN(Number(matchConfig.customTeamCountInput))) {
            matchConfig.teamCount = Number(matchConfig.customTeamCountInput);
            ensureTeamNames(matchConfig.teamCount);
        }

        if (matchConfig.customPlayersPerTeamInput !== "" && !Number.isNaN(Number(matchConfig.customPlayersPerTeamInput))) {
            matchConfig.teamSize = Number(matchConfig.customPlayersPerTeamInput);
        }

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
    const { customSettingsPanel, teamCountInput, playersPerTeamInput, sportModeBlock, rolePanel, roleSelect } = getAppElements();
    const showCustomSettings = isCustomSport();

    if (!customSettingsPanel || !teamCountInput || !playersPerTeamInput || !sportModeBlock || !rolePanel || !roleSelect) {
        return;
    }

    customSettingsPanel.classList.toggle("is-visible", showCustomSettings);
    customSettingsPanel.setAttribute("aria-hidden", String(!showCustomSettings));
    sportModeBlock.classList.toggle("hidden", showCustomSettings);
    rolePanel.classList.toggle("hidden", showCustomSettings);
    rolePanel.setAttribute("aria-hidden", String(showCustomSettings));
    roleSelect.disabled = showCustomSettings;
    teamCountInput.value = matchConfig.customTeamCountInput;
    playersPerTeamInput.value = matchConfig.customPlayersPerTeamInput;
}

function updateTeamSizeDisplay() {
    const { teamSizeDisplay } = getAppElements();

    if (!teamSizeDisplay) {
        return;
    }

    if (isCustomSport()) {
        const rawCustomTeamSize = matchConfig.customPlayersPerTeamInput.trim();

        if (rawCustomTeamSize === "") {
            teamSizeDisplay.textContent = "Enter team size";
            return;
        }

        const activeCustomTeamSize = Number(rawCustomTeamSize);

        if (Number.isNaN(activeCustomTeamSize) || activeCustomTeamSize < 1) {
            teamSizeDisplay.textContent = "Enter team size";
            return;
        }

        teamSizeDisplay.textContent = `${activeCustomTeamSize} player${activeCustomTeamSize === 1 ? "" : "s"} per team`;
        return;
    }

    teamSizeDisplay.textContent = `${matchConfig.teamSize} player${matchConfig.teamSize === 1 ? "" : "s"} per team`;
}

function renderRoleOptions() {
    const { rolePanel, roleSelect } = getAppElements();

    if (!rolePanel || !roleSelect) {
        return;
    }

    if (isCustomSport()) {
        rolePanel.classList.add("hidden");
        rolePanel.setAttribute("aria-hidden", "true");
        roleSelect.innerHTML = "";
        roleSelect.value = "";
        roleSelect.disabled = true;
        matchConfig.selectedRole = null;
        return;
    }

    const sportRoleOptions = getRoleOptionsForSport(matchConfig.sport);
    const selectedRole = isValidRoleForSport(matchConfig.sport, matchConfig.selectedRole)
        ? matchConfig.selectedRole
        : getDefaultRoleForSport(matchConfig.sport);

    rolePanel.classList.remove("hidden");
    rolePanel.setAttribute("aria-hidden", "false");
    roleSelect.disabled = false;
    roleSelect.innerHTML = "";

    sportRoleOptions.forEach((role) => {
        const option = document.createElement("option");
        option.value = role;
        option.textContent = role;
        option.selected = role === selectedRole;
        roleSelect.appendChild(option);
    });

    roleSelect.value = selectedRole || sportRoleOptions[0] || "";
    matchConfig.selectedRole = roleSelect.value || null;
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

function getCustomInputValue(input) {
    return input?.value.trim() || "";
}

function validateCustomSportSettings() {
    const { playersPerTeamInput, teamCountInput } = getAppElements();
    const playersPerTeamValue = getCustomInputValue(playersPerTeamInput);
    const teamCountValue = getCustomInputValue(teamCountInput);

    matchConfig.customPlayersPerTeamInput = playersPerTeamValue;
    matchConfig.customTeamCountInput = teamCountValue;

    if (playersPerTeamValue === "") {
        showConfigMessage("Please enter Players Per Team", "error");
        return false;
    }

    if (teamCountValue === "") {
        showConfigMessage("Please enter Number of Teams", "error");
        return false;
    }

    const nextPlayersPerTeam = Number(playersPerTeamValue);
    const nextTeamCount = Number(teamCountValue);

    if (Number.isNaN(nextPlayersPerTeam) || nextPlayersPerTeam < 1) {
        showConfigMessage("Players Per Team must be at least 1.", "error");
        return false;
    }

    if (Number.isNaN(nextTeamCount) || nextTeamCount < 2) {
        showConfigMessage("Number of Teams must be at least 2.", "error");
        return false;
    }

    matchConfig.customPlayersPerTeam = Math.min(20, nextPlayersPerTeam);
    matchConfig.customTeamCount = Math.min(8, nextTeamCount);
    matchConfig.teamSize = matchConfig.customPlayersPerTeam;
    matchConfig.teamCount = matchConfig.customTeamCount;
    matchConfig.customPlayersPerTeamInput = String(matchConfig.customPlayersPerTeam);
    matchConfig.customTeamCountInput = String(matchConfig.customTeamCount);
    ensureTeamNames(matchConfig.teamCount);
    updateCustomSettingsVisibility();
    updateTeamSizeDisplay();
    clearConfigMessage();

    return true;
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
        customTeamCount: 2,
        customPlayersPerTeamInput: "",
        customTeamCountInput: "",
        selectedRole: getDefaultRoleForSport("cricket")
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

        nextConfig.selectedRole = isValidRoleForSport(nextConfig.sport, nextConfig.selectedRole)
            ? nextConfig.selectedRole
            : getDefaultRoleForSport(nextConfig.sport);
    } else if (nextConfig.sport === "custom") {
        nextConfig.teamCount = nextConfig.customTeamCount;
        nextConfig.teamSize = nextConfig.customPlayersPerTeam;
        nextConfig.selectedRole = null;
    }

    nextConfig.customPlayersPerTeamInput = config?.customPlayersPerTeamInput
        ?? (config?.customPlayersPerTeam ? String(config.customPlayersPerTeam) : "");
    nextConfig.customTeamCountInput = config?.customTeamCountInput
        ?? (config?.customTeamCount ? String(config.customTeamCount) : "");

    return nextConfig;
}

function getTournamentDisplayName() {
    return getAppElements().tournamentNameInput?.value.trim() || "Untitled Tournament";
}

function getBalanceStatus(balanceDifference) {
    if (balanceDifference <= 1) {
        return {
            label: "Excellent Balance",
            className: "stat-card__badge--excellent"
        };
    }

    if (balanceDifference <= 4) {
        return {
            label: "Good Balance",
            className: "stat-card__badge--good"
        };
    }

    return {
        label: "Needs Improvement",
        className: "stat-card__badge--warning"
    };
}

function calculateTournamentStatistics() {
    const totalPlayers = players.length;
    const totalTeams = latestGeneratedTeams.length;
    const totalPlayerRating = players.reduce((sum, player) => sum + player.rating, 0);
    const averagePlayerRating = totalPlayers > 0 ? (totalPlayerRating / totalPlayers).toFixed(1) : "0.0";
    const highestRatedPlayer = totalPlayers > 0
        ? players.reduce((highest, player) => (player.rating > highest.rating ? player : highest), players[0])
        : null;
    const lowestRatedPlayer = totalPlayers > 0
        ? players.reduce((lowest, player) => (player.rating < lowest.rating ? player : lowest), players[0])
        : null;
    const strongestTeam = totalTeams > 0
        ? latestGeneratedTeams.reduce((strongest, team) => (team.total > strongest.total ? team : strongest), latestGeneratedTeams[0])
        : null;
    const weakestTeam = totalTeams > 0
        ? latestGeneratedTeams.reduce((weakest, team) => (team.total < weakest.total ? team : weakest), latestGeneratedTeams[0])
        : null;
    const balanceDifference = strongestTeam && weakestTeam ? strongestTeam.total - weakestTeam.total : 0;
    const totalMatchesGenerated = latestTournament?.rounds
        ? latestTournament.rounds.reduce((sum, round) => sum + round.matches.length, 0)
        : 0;

    return {
        totalPlayers,
        totalTeams,
        averagePlayerRating,
        highestRatedPlayer,
        lowestRatedPlayer,
        strongestTeam,
        weakestTeam,
        balanceDifference,
        balanceStatus: getBalanceStatus(balanceDifference),
        totalMatchesGenerated
    };
}

function createStatisticsCard(icon, label, value, detail, badgeMarkup = "") {
    return `
        <article class="stat-card">
            <div class="stat-card__top">
                <div>
                    <p class="stat-card__label">${label}</p>
                    <h3 class="stat-card__value">${value}</h3>
                </div>
                <span class="stat-card__icon" aria-hidden="true">${icon}</span>
            </div>
            <div class="stat-card__detail">${detail}</div>
            ${badgeMarkup}
        </article>
    `;
}

function createTeamAnalyticsCard(team, icon, roleLabel, statusDetail) {
    const averageTeamRating = team.players.length > 0 ? (team.total / team.players.length).toFixed(1) : "0.0";

    return `
        <article class="team-analytics-card">
            <div class="team-analytics-card__top">
                <div>
                    <p class="team-analytics-card__label">${roleLabel}</p>
                    <h3 class="team-analytics-card__title">${getTeamDisplayName(team)}</h3>
                </div>
                <span class="team-analytics-card__icon" aria-hidden="true">${icon}</span>
            </div>
            <div class="team-analytics-card__detail">${statusDetail}</div>
            <div class="team-analytics-list">
                <div class="team-analytics-list__row">
                    <span>Team Rating Total</span>
                    <strong>${team.total}</strong>
                </div>
                <div class="team-analytics-list__row">
                    <span>Average Team Rating</span>
                    <strong>${averageTeamRating}</strong>
                </div>
                <div class="team-analytics-list__row">
                    <span>Players</span>
                    <strong>${team.players.length}</strong>
                </div>
            </div>
        </article>
    `;
}

function renderStatisticsDashboard() {
    const { statisticsOverview, statisticsTeamAnalytics } = getAppElements();

    if (!statisticsOverview || !statisticsTeamAnalytics) {
        return;
    }

    const statistics = calculateTournamentStatistics();
    const highestRatedPlayerText = statistics.highestRatedPlayer
        ? `${statistics.highestRatedPlayer.name} (${statistics.highestRatedPlayer.rating})`
        : "No players yet";
    const lowestRatedPlayerText = statistics.lowestRatedPlayer
        ? `${statistics.lowestRatedPlayer.name} (${statistics.lowestRatedPlayer.rating})`
        : "No players yet";
    const strongestTeamName = statistics.strongestTeam ? getTeamDisplayName(statistics.strongestTeam) : "No teams yet";
    const weakestTeamName = statistics.weakestTeam ? getTeamDisplayName(statistics.weakestTeam) : "No teams yet";

    statisticsOverview.innerHTML = `
        ${createStatisticsCard("PL", "Total Players", statistics.totalPlayers, "Current players available for selection")}
        ${createStatisticsCard("TM", "Total Teams", statistics.totalTeams, "Generated teams in the active tournament")}
        ${createStatisticsCard("AR", "Average Player Rating", statistics.averagePlayerRating, "Average across the current player pool")}
        ${createStatisticsCard("HP", "Highest Rated Player", statistics.highestRatedPlayer ? statistics.highestRatedPlayer.rating : "-", highestRatedPlayerText)}
        ${createStatisticsCard("LP", "Lowest Rated Player", statistics.lowestRatedPlayer ? statistics.lowestRatedPlayer.rating : "-", lowestRatedPlayerText)}
        ${createStatisticsCard(
        "BS",
        "Tournament Balance Score",
        statistics.balanceDifference,
        `Rating difference between ${strongestTeamName} and ${weakestTeamName}`,
        `<span class="stat-card__badge ${statistics.balanceStatus.className}">${statistics.balanceStatus.label}</span>`
    )}
        ${createStatisticsCard("MG", "Total Matches Generated", statistics.totalMatchesGenerated, "Bracket and fixture matches currently created")}
    `;

    if (statistics.strongestTeam && statistics.weakestTeam) {
        statisticsTeamAnalytics.innerHTML = `
            ${createTeamAnalyticsCard(
            statistics.strongestTeam,
            "ST",
            "Strongest Team",
            `${strongestTeamName} currently has the highest total rating.`
        )}
            ${createTeamAnalyticsCard(
            statistics.weakestTeam,
            "WT",
            "Weakest Team",
            `${weakestTeamName} currently has the lowest total rating.`
        )}
            <article class="team-analytics-card">
                <div class="team-analytics-card__top">
                    <div>
                        <p class="team-analytics-card__label">Balance Analysis</p>
                        <h3 class="team-analytics-card__title">${statistics.balanceStatus.label}</h3>
                    </div>
                    <span class="team-analytics-card__icon" aria-hidden="true">BA</span>
                </div>
                <div class="team-analytics-card__detail">Live comparison of team strength based on total ratings.</div>
                <div class="team-analytics-list">
                    <div class="team-analytics-list__row">
                        <span>Strongest Team</span>
                        <strong>${strongestTeamName}</strong>
                    </div>
                    <div class="team-analytics-list__row">
                        <span>Weakest Team</span>
                        <strong>${weakestTeamName}</strong>
                    </div>
                    <div class="team-analytics-list__row">
                        <span>Rating Difference</span>
                        <strong>${statistics.balanceDifference}</strong>
                    </div>
                </div>
            </article>
        `;
        return;
    }

    statisticsTeamAnalytics.innerHTML = `
        <article class="team-analytics-card">
            <div class="team-analytics-card__top">
                <div>
                    <p class="team-analytics-card__label">Team Analytics</p>
                    <h3 class="team-analytics-card__title">Generate teams to unlock analytics</h3>
                </div>
                <span class="team-analytics-card__icon" aria-hidden="true">TA</span>
            </div>
            <div class="team-analytics-card__detail">
                Team totals, averages, strongest and weakest team comparisons, and balance analysis will appear here once teams are generated.
            </div>
        </article>
    `;
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

function getCsvRowColumns(row) {
    return row.split(",").map((column) => column.trim());
}

function parseCsvPlayers(csvText) {
    const rows = csvText
        .split(/\r?\n/)
        .map((row) => row.trim())
        .filter((row) => row !== "");

    if (rows.length < 2) {
        return { players: [], hasValidHeader: false };
    }

    const headerColumns = getCsvRowColumns(rows[0]).map((column) => column.toLowerCase());
    const hasValidHeader = headerColumns[0] === "name" && headerColumns[1] === "rating";

    if (!hasValidHeader) {
        return { players: [], hasValidHeader: false, errorMessage: "" };
    }

    const importSportName = formatSportName(matchConfig.sport);
    const validRoles = getRoleOptionsForSport(matchConfig.sport);
    const hasRoleColumn = headerColumns[2] === "role";
    const importedPlayers = [];

    for (const row of rows.slice(1)) {
        const columns = getCsvRowColumns(row);

        if (columns.length < 2) {
            continue;
        }

        const name = columns[0];
        const rating = Number(columns[1]);
        const rawRole = columns[2] || "";

        if (!name || Number.isNaN(rating) || rating < 1 || rating > 10) {
            continue;
        }

        if (!isCustomSport()) {
            const roleToUse = hasRoleColumn ? rawRole : getDefaultRoleForSport(matchConfig.sport);

            if (!roleToUse) {
                return {
                    players: [],
                    hasValidHeader: true,
                    errorMessage: `Please include a role for ${importSportName} players.`
                };
            }

            if (!validRoles.includes(roleToUse)) {
                return {
                    players: [],
                    hasValidHeader: true,
                    errorMessage: `${roleToUse} is not a valid ${importSportName} role.`
                };
            }

            importedPlayers.push({
                id: createPlayerId(),
                name,
                rating,
                role: roleToUse
            });
            continue;
        }

        importedPlayers.push({
            id: createPlayerId(),
            name,
            rating,
            role: null
        });
    }

    return {
        players: importedPlayers,
        hasValidHeader: true,
        errorMessage: ""
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
        const { players: importedPlayers, hasValidHeader, errorMessage } = parseCsvPlayers(csvText);

        if (!hasValidHeader) {
            showImportMessage("Invalid CSV format. Use headers: name,rating[,role]", "error");
            return;
        }

        if (errorMessage) {
            showImportMessage(errorMessage, "error");
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
        renderStatisticsDashboard();
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
        renderRoleOptions();
        renderModeOptions();
        applyModeRules();
        updateTeamSizeDisplay();

        if (teamsContainer && teamsContainer.children.length > 0) {
            clearTeams();
        }
    }

    if (configKey === "selectedRole") {
        matchConfig.selectedRole = value;
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
        matchConfig.customTeamCountInput = value;

        if (value !== "" && !Number.isNaN(Number(value))) {
            matchConfig.teamCount = Number(value);
            ensureTeamNames(matchConfig.teamCount);
        }

        if (teamsContainer && teamsContainer.children.length > 0) {
            clearTeams();
        }
    }

    if (configKey === "customPlayersPerTeam") {
        matchConfig.customPlayersPerTeamInput = value;

        if (value !== "" && !Number.isNaN(Number(value))) {
            matchConfig.teamSize = Number(value);
        }

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

function handleRoleSelectionChange(event) {
    updateMatchConfig("selectedRole", event.target.value);
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
    const { nameInput, ratingInput, roleSelect } = getAppElements();
    const name = nameInput.value.trim();
    const rating = Number(ratingInput.value);
    const role = isCustomSport() ? null : roleSelect?.value || null;

    if (!name || Number.isNaN(rating) || rating < 1 || rating > 10) {
        alert("Enter a valid player name and rating between 1 and 10.");
        return;
    }

    const player = {
        id: createPlayerId(),
        name,
        rating,
        role
    };

    players.push(player);
    recentPlayerId = player.id;
    savePlayers();
    renderPlayers();
    clearTeams();
    renderStatisticsDashboard();

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
        renderStatisticsDashboard();
        return;
    }

    playerRow.classList.add("player-item--removing");

    window.setTimeout(() => {
        players = players.filter((player) => player.id !== playerId);
        savePlayers();
        renderPlayers();
        clearTeams();
        renderStatisticsDashboard();
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
    renderStatisticsDashboard();
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
            ${renderPlayerIdentity(player)}
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
    if (isCustomSport() && !validateCustomSportSettings()) {
        return;
    }

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

    if (isCustomSport() && !validateCustomSportSettings()) {
        return;
    }

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
        playersPerTeamInput.value = matchConfig.customPlayersPerTeamInput;
    }

    if (teamCountInput) {
        teamCountInput.value = matchConfig.customTeamCountInput;
    }

    if (tournamentNameInput && typeof savedConfig.name === "string") {
        tournamentNameInput.value = savedConfig.name;
    }

    ensureTeamNames(matchConfig.teamCount);
    updateCustomSettingsVisibility();
    renderRoleOptions();
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

    renderStatisticsDashboard();
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
        const playerLine = team.players.map((player) => (
            player.role
                ? `${player.name} (${player.rating}) - ${player.role}`
                : `${player.name} (${player.rating})`
        )).join(", ");

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
            <ul class="team-list" data-team-key="${key}">
                ${teamPlayers.map((player) => `
                    <li class="team-player-item" draggable="true" data-player-id="${player.id}" data-team-key="${key}">
                        <div class="team-player">
                            ${renderPlayerIdentity(player)}
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
    renderStatisticsDashboard();
    initDragAndDrop();
}

// ==========================================
// Drag & Drop Team Rebalancing Implementation
// ==========================================

// Drag & Drop and Mobile Fallback State
let draggedPlayerId = null;
let draggedSourceTeamKey = null;
let selectedPlayerId = null;
let selectedSourceTeamKey = null;
let justMovedPlayerId = null;
let justUpdatedTeamKey = null;
let swappedPlayer1Id = null;
let swappedPlayer2Id = null;

// Toast Notification System
function showToast(message, type = "info") {
    let container = document.getElementById("toast-container");
    if (!container) {
        container = document.createElement("div");
        container.id = "toast-container";
        container.className = "toast-container";
        document.body.appendChild(container);
    }

    const toast = document.createElement("div");
    toast.className = `toast toast--${type}`;

    let icon = "ℹ️";
    if (type === "success") icon = "✨";
    if (type === "error") icon = "⚠️";

    toast.innerHTML = `
        <span class="toast__icon" aria-hidden="true">${icon}</span>
        <span class="toast__text">${message}</span>
    `;

    container.appendChild(toast);

    // Trigger sliding transition
    requestAnimationFrame(() => {
        toast.classList.add("toast--visible");
    });

    // Remove toast after 3 seconds
    window.setTimeout(() => {
        toast.classList.remove("toast--visible");
        toast.addEventListener("transitionend", () => {
            toast.remove();
            if (container.children.length === 0) {
                container.remove();
            }
        });
    }, 3000);
}

// Clear mobile select highlights
function clearMobileSelection() {
    selectedPlayerId = null;
    selectedSourceTeamKey = null;

    const { teamsContainer } = getAppElements();
    if (!teamsContainer) return;

    teamsContainer.querySelectorAll(".team-player-item--selected").forEach((el) => {
        el.classList.remove("team-player-item--selected");
    });
    teamsContainer.querySelectorAll(".team-card--selectable-target").forEach((el) => {
        el.classList.remove("team-card--selectable-target");
    });
}

// Initialize Drag & Drop Events
function initDragAndDrop() {
    const { teamsContainer } = getAppElements();
    if (!teamsContainer) return;

    const teamCards = teamsContainer.querySelectorAll(".team-card");
    const playerItems = teamsContainer.querySelectorAll(".team-player-item");

    playerItems.forEach((playerItem) => {
        // Native Drag Start
        playerItem.addEventListener("dragstart", (event) => {
            draggedPlayerId = playerItem.dataset.playerId;
            draggedSourceTeamKey = playerItem.dataset.teamKey;

            // Clear any active mobile click selections
            clearMobileSelection();

            playerItem.classList.add("team-player-item--dragging");
            event.dataTransfer.setData("text/plain", draggedPlayerId);
            event.dataTransfer.effectAllowed = "move";

            // Highlight all other team cards as potential drop targets
            teamCards.forEach((card) => {
                const nameInput = card.querySelector(".team-name-input");
                const teamKey = nameInput?.dataset.teamKey;
                if (teamKey && teamKey !== draggedSourceTeamKey) {
                    card.classList.add("team-card--drop-target");
                }
            });
        });

        // Native Drag End
        playerItem.addEventListener("dragend", () => {
            playerItem.classList.remove("team-player-item--dragging");
            teamCards.forEach((card) => {
                card.classList.remove("team-card--drop-target");
                card.classList.remove("team-card--drag-over");
            });
            draggedPlayerId = null;
            draggedSourceTeamKey = null;
        });

        // Player over player dragover (swap intent)
        playerItem.addEventListener("dragover", (event) => {
            if (draggedSourceTeamKey && draggedSourceTeamKey !== playerItem.dataset.teamKey) {
                event.preventDefault();
                event.stopPropagation();
                playerItem.classList.add("team-player-item--drag-over");
            }
        });

        // Player over player dragleave
        playerItem.addEventListener("dragleave", (event) => {
            event.stopPropagation();
            playerItem.classList.remove("team-player-item--drag-over");
        });

        // Player dropped over player (execute swap!)
        playerItem.addEventListener("drop", (event) => {
            event.preventDefault();
            event.stopPropagation();
            playerItem.classList.remove("team-player-item--drag-over");

            const sourcePlayerId = event.dataTransfer.getData("text/plain") || draggedPlayerId;
            const sourceKey = draggedSourceTeamKey;
            const targetPlayerId = playerItem.dataset.playerId;
            const targetKey = playerItem.dataset.teamKey;

            if (sourcePlayerId && sourceKey && targetPlayerId && targetKey && sourceKey !== targetKey) {
                swapPlayers(sourcePlayerId, sourceKey, targetPlayerId, targetKey);
            }
        });

        // Mobile / Touch Click selection and swap fallback
        playerItem.addEventListener("click", (event) => {
            event.stopPropagation(); // Prevent document click handler from resetting
            const playerId = playerItem.dataset.playerId;
            const teamKey = playerItem.dataset.teamKey;

            if (selectedPlayerId === playerId) {
                clearMobileSelection();
            } else if (selectedPlayerId && selectedSourceTeamKey && selectedSourceTeamKey !== teamKey) {
                // Tapped another player in a different team -> SWAP!
                const sourcePlayerId = selectedPlayerId;
                const sourceKey = selectedSourceTeamKey;
                clearMobileSelection();
                swapPlayers(sourcePlayerId, sourceKey, playerId, teamKey);
            } else {
                // Select player
                clearMobileSelection();
                selectedPlayerId = playerId;
                selectedSourceTeamKey = teamKey;

                playerItem.classList.add("team-player-item--selected");

                // Highlight all valid target team cards
                teamCards.forEach((card) => {
                    const nameInput = card.querySelector(".team-name-input");
                    const cardTeamKey = nameInput?.dataset.teamKey;
                    if (cardTeamKey && cardTeamKey !== selectedSourceTeamKey) {
                        card.classList.add("team-card--selectable-target");
                    }
                });

                showToast("Player selected. Tap a team to move, or another player to swap.", "success");
            }
        });
    });

    teamCards.forEach((card) => {
        const nameInput = card.querySelector(".team-name-input");
        const teamKey = nameInput?.dataset.teamKey;
        if (!teamKey) return;

        // Native Drag Over Card
        card.addEventListener("dragover", (event) => {
            event.preventDefault();
            if (draggedSourceTeamKey && draggedSourceTeamKey !== teamKey) {
                card.classList.add("team-card--drag-over");
                event.dataTransfer.dropEffect = "move";
            }
        });

        // Native Drag Leave Card
        card.addEventListener("dragleave", () => {
            card.classList.remove("team-card--drag-over");
        });

        // Native Drop on Card
        card.addEventListener("drop", (event) => {
            event.preventDefault();
            card.classList.remove("team-card--drag-over");

            const playerId = event.dataTransfer.getData("text/plain") || draggedPlayerId;
            const sourceKey = draggedSourceTeamKey;

            if (playerId && sourceKey && sourceKey !== teamKey) {
                movePlayer(playerId, sourceKey, teamKey);
            }
        });

        // Mobile/Touch Click destination selection
        card.addEventListener("click", (event) => {
            if (selectedPlayerId && selectedSourceTeamKey && selectedSourceTeamKey !== teamKey) {
                event.stopPropagation();
                const playerId = selectedPlayerId;
                const sourceKey = selectedSourceTeamKey;
                clearMobileSelection();
                movePlayer(playerId, sourceKey, teamKey);
            }
        });
    });
}

// Move Player data logic
function movePlayer(playerId, sourceTeamKey, targetTeamKey) {
    const { playersPerTeam } = getActiveTeamSettings();

    const targetTeam = latestGeneratedTeams.find((t) => t.key === targetTeamKey);
    const sourceTeam = latestGeneratedTeams.find((t) => t.key === sourceTeamKey);

    if (!targetTeam || !sourceTeam) {
        showToast("Error: team not found.", "error");
        return;
    }

    // Check size limit rules
    if (targetTeam.players.length >= playersPerTeam) {
        showToast("Team size limit reached.", "error");
        return;
    }

    const playerIndex = sourceTeam.players.findIndex((p) => p.id === playerId);
    if (playerIndex === -1) {
        showToast("Error: player not found in source team.", "error");
        return;
    }

    // Splice from source, push to target
    const [player] = sourceTeam.players.splice(playerIndex, 1);
    targetTeam.players.push(player);

    // Recalculate totals
    sourceTeam.total = sourceTeam.players.reduce((sum, p) => sum + p.rating, 0);
    targetTeam.total = targetTeam.players.reduce((sum, p) => sum + p.rating, 0);

    // Set variables for visual feedback
    justMovedPlayerId = playerId;
    justUpdatedTeamKey = targetTeamKey;

    // Sync with active tournament snapshots
    if (latestTournament) {
        latestTournament.teams = cloneTournamentData(latestGeneratedTeams);
    }

    // Trigger optimized direct-DOM update
    updateTeamsDOM(sourceTeamKey, targetTeamKey);

    showToast(`Moved ${player.name} to ${getTeamDisplayName(targetTeam)}`, "success");
}

// Swap Players logic
function swapPlayers(player1Id, team1Key, player2Id, team2Key) {
    const team1 = latestGeneratedTeams.find((t) => t.key === team1Key);
    const team2 = latestGeneratedTeams.find((t) => t.key === team2Key);

    if (!team1 || !team2) {
        showToast("Error swapping players: team not found.", "error");
        return;
    }

    const p1Index = team1.players.findIndex((p) => p.id === player1Id);
    const p2Index = team2.players.findIndex((p) => p.id === player2Id);

    if (p1Index === -1 || p2Index === -1) {
        showToast("Error: player not found in team.", "error");
        return;
    }

    const player1 = team1.players[p1Index];
    const player2 = team2.players[p2Index];

    // Swap items in-place
    team1.players[p1Index] = player2;
    team2.players[p2Index] = player1;

    // Recalculate totals
    team1.total = team1.players.reduce((sum, p) => sum + p.rating, 0);
    team2.total = team2.players.reduce((sum, p) => sum + p.rating, 0);

    // Set variables for visual feedback
    swappedPlayer1Id = player1Id;
    swappedPlayer2Id = player2Id;

    // Sync with active tournament snapshots
    if (latestTournament) {
        latestTournament.teams = cloneTournamentData(latestGeneratedTeams);
    }

    // Trigger optimized direct-DOM update
    updateTeamsDOM(team1Key, team2Key);

    showToast(`Swapped ${player1.name} with ${player2.name}`, "success");
}

// Optimized high-performance direct-DOM update engine
function updateTeamsDOM(sourceTeamKey, targetTeamKey) {
    const { teamsContainer } = getAppElements();
    if (!teamsContainer) return;

    const teamTotals = latestGeneratedTeams.map((team) => team.total);
    const highestTotal = Math.max(...teamTotals);
    const lowestTotal = Math.min(...teamTotals);
    const balanceDifference = highestTotal - lowestTotal;

    // 1. Update Balance Summary block in-place
    const balanceSummary = teamsContainer.querySelector(".balance-summary");
    if (balanceSummary) {
        const isWellBalanced = balanceDifference <= 2;
        const balanceLabel = isWellBalanced ? "Well Balanced" : "Needs Adjustment";
        balanceSummary.className = `balance-summary${isWellBalanced ? " balance-summary--good" : ""}`;

        const diffStrong = balanceSummary.querySelector("strong");
        if (diffStrong) {
            diffStrong.textContent = `Difference: ${balanceDifference}`;
        }

        const badge = balanceSummary.querySelector(".balance-summary__badge");
        if (badge) {
            badge.textContent = balanceLabel;
        }
    }

    // 2. Update ONLY the two affected team card elements
    [sourceTeamKey, targetTeamKey].forEach((teamKey) => {
        const team = latestGeneratedTeams.find((t) => t.key === teamKey);
        if (!team) return;

        const nameInput = teamsContainer.querySelector(`[data-team-key="${teamKey}"]`);
        const teamCard = nameInput?.closest(".team-card");
        if (!teamCard) return;

        // Update player count header
        const countText = teamCard.querySelector("p");
        if (countText) {
            countText.textContent = `${team.players.length} player${team.players.length === 1 ? "" : "s"}`;
        }

        // Update player list list-items
        const list = teamCard.querySelector(".team-list");
        if (list) {
            list.innerHTML = team.players.map((player) => `
                <li class="team-player-item" draggable="true" data-player-id="${player.id}" data-team-key="${teamKey}">
                    <div class="team-player">
                        ${renderPlayerIdentity(player)}
                        <span>Rating: ${player.rating}</span>
                    </div>
                </li>
            `).join("");
        }

        // Update total rating summary
        const totalText = teamCard.querySelector(".team-total");
        if (totalText) {
            totalText.textContent = `Total Rating: ${team.total}`;
        }

        // Update balance note if present
        const isWellBalanced = balanceDifference <= 2;
        const balanceNote = teamCard.querySelector(".team-balance-note");
        if (isWellBalanced && !balanceNote) {
            const noteDiv = document.createElement("div");
            noteDiv.className = "team-balance-note";
            noteDiv.textContent = "Balanced matchup";
            // Insert before the total rating element
            teamCard.insertBefore(noteDiv, totalText);
        } else if (!isWellBalanced && balanceNote) {
            balanceNote.remove();
        }
    });

    // 3. Dynamically recalculate and toggle winner badge/classes for ALL team cards
    latestGeneratedTeams.forEach((team) => {
        const nameInput = teamsContainer.querySelector(`[data-team-key="${team.key}"]`);
        const teamCard = nameInput?.closest(".team-card");
        if (!teamCard) return;

        const isWinner = team.total === highestTotal;
        const isDraw = balanceDifference === 0;

        teamCard.classList.toggle("team-card--winner", isWinner);
        teamCard.classList.toggle("team-card--draw", isDraw);

        const topContainer = teamCard.querySelector(".team-card__top");
        if (topContainer) {
            let badge = topContainer.querySelector(".team-badge");
            if (isWinner && !badge) {
                badge = document.createElement("span");
                badge.className = "team-badge";
                badge.textContent = "Higher Rated";
                topContainer.appendChild(badge);
            } else if (!isWinner && badge) {
                badge.remove();
            }
        }
    });

    // 4. Re-bind Drag & Drop / Mobile touch listeners to fresh player card nodes
    initDragAndDrop();

    // 5. Update statistics overview dashboard in-place
    renderStatisticsDashboard();

    // 6. Execute micro-animations for visual feedback
    if (justMovedPlayerId) {
        const droppedElement = teamsContainer.querySelector(`[data-player-id="${justMovedPlayerId}"]`);
        if (droppedElement) {
            droppedElement.classList.add("team-player-item--dropped");
        }
        justMovedPlayerId = null;
    }

    if (swappedPlayer1Id) {
        const p1Element = teamsContainer.querySelector(`[data-player-id="${swappedPlayer1Id}"]`);
        if (p1Element) {
            p1Element.classList.add("team-player-item--dropped");
        }
        swappedPlayer1Id = null;
    }

    if (swappedPlayer2Id) {
        const p2Element = teamsContainer.querySelector(`[data-player-id="${swappedPlayer2Id}"]`);
        if (p2Element) {
            p2Element.classList.add("team-player-item--dropped");
        }
        swappedPlayer2Id = null;
    }

    if (justUpdatedTeamKey) {
        const updatedTeamCard = teamsContainer.querySelector(`[data-team-key="${justUpdatedTeamKey}"]`)?.closest(".team-card");
        if (updatedTeamCard) {
            updatedTeamCard.classList.add("team-card--just-updated");
        }
        justUpdatedTeamKey = null;
    }
}

// Global click listener to deselect mobile tap-to-move selection
document.addEventListener("click", () => {
    clearMobileSelection();
});

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
    renderStatisticsDashboard();
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
    const roleSelect = document.getElementById("role");
    if (roleSelect) {
        roleSelect.addEventListener("change", handleRoleSelectionChange);
    }
    playersPerTeamInput.addEventListener("input", () => {
        updateMatchConfig("customPlayersPerTeam", playersPerTeamInput.value);
    });
    teamCountInput.addEventListener("input", () => {
        updateMatchConfig("customTeamCount", teamCountInput.value);
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
    renderRoleOptions();
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
    renderStatisticsDashboard();
}

initializeApp();
