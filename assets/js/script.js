/* API key used to access OpenWeatherMap service */
const apiKey = "36572f7db00c8c9190ecf56965ab8819";

// Wait until the HTML document is fully loaded
// before running any JavaScript.
// This ensures all elements exist in the DOM.
window.addEventListener("DOMContentLoaded", function () {
  initThemeSwitch();   // Setup dark mode toggle
  initWeatherPage();   // Run weather logic (only if weather page)
  initGamePage();      // Run game logic (only if game page)
});


// Helper function:
// Quickly select an element by ID
function getById(id) {
  return document.getElementById(id);
}

// DARK MODE / LIGHT MODE TOGGLE
// Find the theme switch and icon, load the saved theme from localStorage, 
// detect system preference if needed, update the page theme, 
// and save future changes.
function initThemeSwitch() {
  const toggle = getById("themeToggle");
  const icon = getById("themeIcon");

  // If the toggle doesn't exist, do nothing (page doesn't use it)
  if (!toggle || !icon) {
    return;
  }

  // Adds/remove the dark-mode CSS class, update the icon, 
  // and synchronize the toggle state.
  function applyTheme(isDark) {
    document.body.classList.toggle("dark-mode", isDark);
    icon.textContent = (isDark ? "🌙" : "☀️");
    toggle.checked = isDark;
  }

  // Save 'dark' or 'light' in localStorage.
  function saveTheme(isDark) {
    localStorage.setItem("theme", isDark ? "dark" : "light");
  }

  // Read valu "theme" from browsers local storage
  const storedTheme = localStorage.getItem("theme");

  // Check the user's operating system/browser theme preference
  const prefersDark =
    window.matchMedia?.("(prefers-color-scheme: dark)").matches;
  
  // Which theme to use.
  const isDarkMode = (
    storedTheme ? storedTheme === "dark" : prefersDark
  );

  // Apply the chosen theme to the page
  applyTheme(isDarkMode);

  // Add an event listener to a theme toggle control (checkbox).
  toggle.addEventListener("change", function () {
    // Update the page theme
    applyTheme(toggle.checked);
    saveTheme(toggle.checked);
  });
}

// WEATHER PAGE LOGIC
// Check if weather page elements exist, verifie geolocation support, 
// request the user's location, and call weather retrieval functions.
function initWeatherPage() {
  const cityEl = getById("city");

  // If "city" element is missing, this is NOT the weather page
  if (!cityEl) {
    return;
  }

  // Check if the browser supports geolocation
  // (needed to get user's current position)
  if (!navigator.geolocation) {
    setText("city", "Geolocation not supported");
    return;
  }

  
  // Ask for user's location:
  // - Success → fetch weather data
  // - Error → show error message
  navigator.geolocation.getCurrentPosition(fetchWeather, showWeatherError);
}


// Extract coordinates, build the API request URL, fetche
// weather data asynchronously, and passe it to updateWeather().
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

//  Update the weather UI with API data
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

  // Set weather icon image using icon code from API
  const iconEl = getById("icon");
  const iconCode = data.weather?.[0]?.icon;

  if (iconEl && iconCode) {
    iconEl.src = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
  }
}

//  Show error if location or API fails
function showWeatherError() {
  setText("city", "Location access denied");
  setText("temp", "");
  setText("desc", "");
  setText("extra", "");
}
// Helper function:
// Safely update text content if element exists
function setText(id, text) {
  const element = getById(id);
  if (element) {
    element.innerText = text;
  }
}

//GAME PAGE LOGIC
// Load game elements, initialize scores and variables, 
// set up controls, and handles character selection.
function initGamePage() {
  const gameArea = getById("gameArea");

  // If no game area return
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

  // GAME STATE VARIABLES
  let isJumping = false;    // Prevent jumping again mid-air
  let gameRunning = false;  // Track if game is active
  let score = 0;
  let obstacleSpeed = 5;
  let bgFrontX = 0;
  let bgBackX = 0;
  let gameLoopId = null;    // Add no value

  // Load best score from browser storage
  let bestScore = Number(localStorage.getItem("bestScore")) || 0;

  // Character selection
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

  // Initial UI values
  bestScoreEl.textContent = bestScore;
  scoreEl.textContent = score;

  // Player controls click or press of space bar
  actionBtn.addEventListener("click", handleAction);
  document.addEventListener("keydown", function (event) {
    if (event.code === "Space" || event.code === "ArrowUp") {
      event.preventDefault();
      handleAction();
    }
  });

  // Mobile tap (button)
  gameArea.addEventListener("touchstart", handleAction);

  // Desktop click
  gameArea.addEventListener("click", handleAction);

  // Handle player action:
  // - Start game if not running
  // - Trigger jump
  function handleAction() {
    if (!gameRunning) {
      startGame();
    }
    jump();
  }

  // Start Game
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

  // GAME LOOP (MAIN ENGINE)
  // Run repeatedly, move obstacles and backgrounds, and check for collisions.
  function runGameLoop() {
    moveObstacle();
    moveBackground();

    // Check for collision every frame
    if (checkCollision()) {
      endGame();
    }
  }

  // Move front and back layers at different speeds, 
  // creating a parallax effect and looping backgrounds. (PARALLAX effect)
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

  // Move obstacle
  function moveObstacle() {
    const currentRight = parseInt(getComputedStyle(obstacle).right, 10) || 0;
    obstacle.style.right = `${currentRight + obstacleSpeed}px`;

    // If obstacle leaves screen:
    // - Reset it
    // - Increase score
    // - Increase difficulty
    if (currentRight > gameArea.offsetWidth + 80) {
      score += 1;
      // Increase speed gradually
      obstacleSpeed = Math.min(9, 5 + Math.floor(score / 5) * 0.5);

      resetObstacle();
      updateScore();
    }
  }

  // Place the obstacle off-screen ready for reuse.
  function resetObstacle() {
    obstacle.style.right = "-60px";
  }

  // Update the Font Awesome icon displayed for the player.
  function setPlayerIcon(iconName) {
    player.innerHTML = `<i class="fa-solid fa-${iconName}"></i>`;
  }

  // Save the chosen character, update the displayed icon, 
  // and highlight the selected button.
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

  // Jump magic 
  // Prevent double-jumping, move the player upward, 
  // then downward using timed intervals
  function jump() {
    if (isJumping || !gameRunning) {
      return;
    }

    isJumping = true;

    let position = 0;
    const baseBottom = 10;
    const jumpStep = 5;

    // Move player up until max height,
    // then back down
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

  // COLLISION DETECTION
  // Create collision boxes and checks for overlap.
  function checkCollision() {
    // Create an invisible box around the player
    const playerRect = player.getBoundingClientRect();
    // Create an invisible box around the object
    const obstacleRect = obstacle.getBoundingClientRect();

    return (
      playerRect.right > obstacleRect.left + 3 &&
      playerRect.left < obstacleRect.right - 3 &&
      playerRect.bottom > obstacleRect.top + 3
    );
  }

  // GAME OVER 
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

    // Display the game end message (score and best score)
    alert(`Game Over!\nScore: ${score}\nBest: ${bestScore}`);
  }

  // Update the score element with the current score.
  function updateScore() {
    scoreEl.textContent = score;
  }
}