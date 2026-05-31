const themeStorageKey = "tournamenthub-theme";

function getPreferredTheme() {
    const savedTheme = localStorage.getItem(themeStorageKey);

    if (savedTheme === "dark" || savedTheme === "light") {
        return savedTheme;
    }

    return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

function applyTheme(theme) {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(themeStorageKey, theme);

    document.querySelectorAll("[data-theme-toggle]").forEach((toggleButton) => {
        toggleButton.setAttribute("aria-pressed", String(theme === "light"));
        toggleButton.setAttribute("title", `Switch to ${theme === "light" ? "dark" : "light"} mode`);
    });
}

function toggleTheme() {
    const nextTheme = document.documentElement.dataset.theme === "light" ? "dark" : "light";
    applyTheme(nextTheme);
}

function initializeThemeToggle() {
    applyTheme(getPreferredTheme());

    document.querySelectorAll("[data-theme-toggle]").forEach((toggleButton) => {
        toggleButton.addEventListener("click", toggleTheme);
    });
}

document.addEventListener("DOMContentLoaded", initializeThemeToggle);
