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
  Update weather UI with API data
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
  Helper: Safely update text content if element exists
*/
function setText(id, text) {
  const element = getById(id);
  if (element) {
    element.innerText = text;
  }
}

/* ======================================================
   GAME PAGE LOGIC
   ====================================================== */
function initGamePage() {
  const gameArea = getById("gameArea");

  // If no game area → not on game page
  if (!gameArea) {
    return;
  }

  // Get all important game elements
  const player = getById("player");
  const obstacle = getById("obstacle");
  const actionBtn = getById("actionBtn");
  const scoreEl = getById("score");
  const bestScoreEl = getById("bestScore");
  const bgFront = getById("bgFront");
  const bgBack = getById("bgBack");

  // Stop if anything critical is missing
  if (
    !player ||
    !obstacle ||
    !actionBtn ||
    !scoreEl ||
    !bestScoreEl ||
    !bgFront ||
    !bgBack
  ) {
    return;
  }

  /* GAME STATE VARIABLES */
  let isJumping = false;    // Prevents jumping again mid-air
  let gameRunning = false;  // Tracks if game is active
  let score = 0;
  let obstacleSpeed = 5;
  let bgFrontX = 0;
  let bgBackX = 0;
  let gameLoopId = null;

  // Load best score from browser storage
  let bestScore = Number(localStorage.getItem("bestScore")) || 0;

  /* CHARACTER SELECTION */
  const characterButtons = Array.from(
    document.querySelectorAll(".character-option")
  );
  let selectedCharacter = "person-running";


  characterButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      selectCharacter(button.dataset.icon, button);
    });
  });


  setPlayerIcon(selectedCharacter);

  /* INITIAL UI VALUES */
  bestScoreEl.textContent = bestScore;
  scoreEl.textContent = score;

  /* PLAYER CONTROLS */
  actionBtn.addEventListener("click", handleAction);

  document.addEventListener("keydown", function (event) {
    if (event.code === "Space" || event.code === "ArrowUp") {
      event.preventDefault();
      handleAction();
    }
  });


  // Mobile tap
  gameArea.addEventListener("touchstart", handleAction);

  // Desktop click
  gameArea.addEventListener("click", handleAction);

  /*
    Handles player action:
    - Start game if not running
    - Trigger jump
  */
  function handleAction() {
    if (!gameRunning) {
      startGame();
    }
    jump();
  }

  /* START GAME */
  function startGame() {
    gameRunning = true;
    score = 0;
    obstacleSpeed = 5;
    bgFrontX = 0;
    bgBackX = 0;

    resetObstacle();
    updateScore();

    actionBtn.innerHTML = "Jump";

    // Start game loop (runs ~50 times per second)
    gameLoopId = setInterval(runGameLoop, 20);
  }

  /* GAME LOOP (MAIN ENGINE) */
  function runGameLoop() {
    moveObstacle();
    moveBackground();

    // Check for collision every frame
    if (checkCollision()) {
      endGame();
    }
  }

  /* MOVE BACKGROUND (PARALLAX EFFECT) */
  function moveBackground() {
    bgFrontX -= obstacleSpeed;
    bgBackX -= obstacleSpeed * 0.4;

    bgFront.style.transform = `translateX(${bgFrontX}px)`;
    bgBack.style.transform = `translateX(${bgBackX}px)`;

    const resetDistance = gameArea.offsetWidth;

    // Loop backgrounds infinitely
    if (bgFrontX <= -resetDistance) {
      bgFrontX = 0;
    }
    if (bgBackX <= -resetDistance) {
      bgBackX = 0;
    }

  }

  /* MOVE OBSTACLE */
  function moveObstacle() {
    const currentRight = parseInt(getComputedStyle(obstacle).right, 10) || 0;
    obstacle.style.right = `${currentRight + obstacleSpeed}px`;

    /*
      If obstacle leaves screen:
      - Reset it
      - Increase score
      - Increase difficulty
    */
    if (currentRight > gameArea.offsetWidth + 80) {
      score += 1;

      // Increase speed gradually
      obstacleSpeed = Math.min(9, 5 + Math.floor(score / 5) * 0.5);

      resetObstacle();
      updateScore();
    }
  }

  function resetObstacle() {
    obstacle.style.right = "-60px";
  }

}