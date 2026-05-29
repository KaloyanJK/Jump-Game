/* API key used to access OpenWeatherMap service */
const apiKey = "36572f7db00c8c9190ecf56965ab8819";

/*
  Wait until the HTML document is fully loaded
  before running any JavaScript.
*/
window.addEventListener("DOMContentLoaded", function () {
  initThemeSwitch();   // Setup dark mode toggle
  initWeatherPage();   // Run weather logic
});

/*
  Helper function:
  Quickly select an element by ID
*/
function getById(id) {
  return document.getElementById(id);
}

/* ======================================================
   DARK MODE / LIGHT MODE TOGGLE
   ====================================================== */
function initThemeSwitch() {
  const toggle = getById("themeToggle");
  const icon = getById("themeIcon");

  if (!toggle || !icon) return;

  function applyTheme(isDark) {
    document.body.classList.toggle("dark-mode", isDark);
    icon.textContent = isDark ? "🌙" : "☀️";
    toggle.checked = isDark;
  }

  function saveTheme(isDark) {
    localStorage.setItem("theme", isDark ? "dark" : "light");
  }

  const storedTheme = localStorage.getItem("theme");
  const prefersDark =
    window.matchMedia?.("(prefers-color-scheme: dark)").matches;

  const isDarkMode =
    storedTheme ? storedTheme === "dark" : prefersDark;

  applyTheme(isDarkMode);

  toggle.addEventListener("change", function () {
    applyTheme(toggle.checked);
    saveTheme(toggle.checked);
  });
}

/* ======================================================
   WEATHER PAGE LOGIC
   ====================================================== */
function initWeatherPage() {
  const cityEl = getById("city");

  // If no "city" element → not on weather page
  if (!cityEl) return;

  if (!navigator.geolocation) {
    setText("city", "Geolocation not supported");
    return;
  }

  navigator.geolocation.getCurrentPosition(fetchWeather, showWeatherError);
}

/*
  Fetch weather data using coordinates
*/
function fetchWeather(position) {
  const lat = position.coords.latitude;
  const lon = position.coords.longitude;

  const endpoint =
    "https://api.openweathermap.org/data/2.5/weather" +
    `?lat=${lat}&lon=${lon}` +
    `&units=metric&appid=${apiKey}`;

  fetch(endpoint)
    .then((response) => response.json())
    .then(updateWeather)
    .catch(() => showWeatherError());
}

/*
  Update UI with API data
*/
function updateWeather(data) {
  setText("city", data.name || "Unknown location");
  setText("temp", `${Math.round(data.main.temp)}°C`);
  setText("desc", data.weather?.[0]?.description || "No description");

  setText(
    "extra",
    `Humidity: ${data.main.humidity}% | Wind: ${data.wind.speed} m/s`
  );

  const iconEl = getById("icon");
  const iconCode = data.weather?.[0]?.icon;

  if (iconEl && iconCode) {
    iconEl.src = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
  }
}

/*
  Error handling
*/
function showWeatherError() {
  setText("city", "Location access denied");
  setText("temp", "");
  setText("desc", "");
  setText("extra", "");
}

/*
  Helper: safely update text
*/
function setText(id, text) {
  const element = getById(id);
  if (element) {
    element.innerText = text;
  }
}