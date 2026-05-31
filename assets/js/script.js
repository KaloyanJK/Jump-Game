/* API key used to access OpenWeatherMap service */
const apiKey = "";

/*
  Wait until the HTML document is fully loaded
  before running any JavaScript.
  This ensures all elements exist in the DOM.
*/
window.addEventListener("DOMContentLoaded", function () {
  initThemeSwitch();   // Setup dark mode toggle
  initWeatherPage();   // Run weather logic (only if weather page)
  initGamePage();      // Run game logic (only if game page)
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

  // If the toggle doesn't exist, do nothing (page doesn't use it)
  if (!toggle || !icon) {
    return;
  }

  function applyTheme(isDark) {
    document.body.classList.toggle("dark-mode", isDark);
    icon.textContent = (isDark ? "🌙" : "☀️");
    toggle.checked = isDark;
  }

  function saveTheme(isDark) {
    localStorage.setItem("theme", isDark ? "dark" : "light");
  }

  const storedTheme = localStorage.getItem("theme");
  const prefersDark =
    window.matchMedia?.("(prefers-color-scheme: dark)").matches;
  const isDarkMode = (
    storedTheme ? storedTheme === "dark" : prefersDark
  );

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

  // If "city" element is missing, this is NOT the weather page
  if (!cityEl) {
    return;
  }

  /*
    Check if the browser supports geolocation
    (needed to get user's current position)
  */
  if (!navigator.geolocation) {
    setText("city", "Geolocation not supported");
    return;
  }

  /*
    Ask for user's location:
    - Success → fetch weather data
    - Error → show error message
  */
  navigator.geolocation.getCurrentPosition(fetchWeather, showWeatherError);
}

/*
  Fetch weather data from the API using coordinates
*/
async function fetchWeather(position) {
  try {
    const { latitude: lat, longitude: lon } = position.coords;

    const endpoint =
      `https://api.openweathermap.org/data/2.5/weather` +
      `?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`;

    const response = await fetch(endpoint);
    const data = await response.json();

    updateWeather(data);
  } catch {
    showWeatherError();
  }
}

/*
  Update the weather UI with API data
*/
function updateWeather(data) {

  // Display location name
  setText("city", data.name || "Unknown location");

  // Display temperature (rounded to whole number)
  setText("temp", `${Math.round(data.main.temp)}°C`);

  // Display weather description (e.g. "cloudy")
  setText("desc", data.weather?.[0]?.description || "No description");

  // Display extra info (humidity + wind speed)
  setText(
    "extra",
    `Humidity: ${data.main.humidity}% | Wind: ${data.wind.speed} m/s`
  );

  /*
    Set weather icon image using icon code from API
  */
  const iconEl = getById("icon");
  const iconCode = data.weather?.[0]?.icon;

  if (iconEl && iconCode) {
    iconEl.src = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
  }
}

/*
  Show error if location or API fails
*/
function showWeatherError() {
  setText("city", "Location access denied");
  setText("temp", "");
  setText("desc", "");
  setText("extra", "");
}

/*
  Helper function:
  Safely update text content if element exists
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

  /* CHANGE PLAYER ICON */
  function setPlayerIcon(iconName) {
    player.innerHTML = `<i class="fa-solid fa-${iconName}"></i>`;
  }

  function selectCharacter(iconName, button) {
    if (!iconName || !button) {
      return;
    }

    selectedCharacter = iconName;
    setPlayerIcon(iconName);

    // Highlight selected button
    characterButtons.forEach((btn) =>
      btn.classList.toggle("active", btn === button)
    );
  }

  /* JUMP MECHANIC */
  function jump() {
    if (isJumping || !gameRunning) {
      return;
    }

    isJumping = true;

    let position = 0;
    const baseBottom = 10;
    const jumpStep = 5;

    /*
      Move player up until max height,
      then back down
    */
    const upInterval = setInterval(function () {
      if (position >= 100) {
        clearInterval(upInterval);

        const downInterval = setInterval(function () {
          position -= jumpStep;
          player.style.bottom = `${position + baseBottom}px`;

          if (position <= 0) {
            clearInterval(downInterval);
            isJumping = false;
          }
        }, 20);
        return;
      }

      position += jumpStep;
      player.style.bottom = `${position + baseBottom}px`;
    }, 20);
  }

  /* COLLISION DETECTION */
  function checkCollision() {
    // creates an invisible box around the player
    const playerRect = player.getBoundingClientRect();
    //  creates an invisible box around the object
    const obstacleRect = obstacle.getBoundingClientRect();

    return (
      playerRect.right > obstacleRect.left + 3 &&
      playerRect.left < obstacleRect.right - 3 &&
      playerRect.bottom > obstacleRect.top + 3
    );
  }

  /* GAME OVER */
  function endGame() {
    clearInterval(gameLoopId);
    gameRunning = false;

    // Save best score in local storage
    if (score > bestScore) {
      bestScore = score;
      localStorage.setItem("bestScore", bestScore);
      bestScoreEl.textContent = bestScore;
    }

    actionBtn.innerHTML = `<i class="fa-solid fa-play"></i> Start / Jump`;

    alert(`Game Over!\nScore: ${score}\nBest: ${bestScore}`);
  }

  function updateScore() {
    scoreEl.textContent = score;
  }
}