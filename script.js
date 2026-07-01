const games = [
  {
    id: 1,
    title: "Sky Blazer 2",
    rating: "4.8",
    size: "1.2 ГБ",
    icon: "✈️",
    accent: "game-icon-1",
    description: "Быстротечный экшен с динамичными сражениями и красивой космической атмосферой.",
  },
  {
    id: 2,
    title: "Neon Quest",
    rating: "4.6",
    size: "892 МБ",
    icon: "🌈",
    accent: "game-icon-2",
    description: "Погружение в яркий мир головоломок и увлекательных испытаний.",
  },
  {
    id: 3,
    title: "Rush Arena",
    rating: "4.9",
    size: "1.5 ГБ",
    icon: "⚡",
    accent: "game-icon-3",
    description: "Мультиплеерные арены с быстрыми матчами и удобным управлением.",
  },
];

let selectedGame = games[0];
let downloadTimer = null;

const searchInput = document.getElementById("searchInput");
const gameList = document.getElementById("gameList");
const registerForm = document.getElementById("registerForm");
const registerMessage = document.getElementById("registerMessage");
const detailTitle = document.getElementById("detailTitle");
const detailIcon = document.getElementById("detailIcon");
const detailMeta = document.getElementById("detailMeta");
const detailDescription = document.getElementById("detailDescription");
const detailRating = document.getElementById("detailRating");
const detailSize = document.getElementById("detailSize");
const downloadBtn = document.getElementById("downloadBtn");
const progressBar = document.getElementById("progressBar");
const downloadMessage = document.getElementById("downloadMessage");
const navButtons = document.querySelectorAll(".bottom-nav .nav-btn");
const screens = document.querySelectorAll(".screen");

function init() {
  renderGames();
  bindEvents();
  showScreen("home");
}

function bindEvents() {
  searchInput.addEventListener("input", renderGames);

  document.addEventListener("click", (event) => {
    const targetButton = event.target.closest("button[data-target], button[data-game], .download-btn");
    if (!targetButton) return;

    if (targetButton.dataset.target) {
      const target = targetButton.dataset.target;
      if (target === "register") {
        showScreen("register");
      } else {
        showScreen(target);
      }
    }

    if (targetButton.dataset.game) {
      const matchedGame = games.find((game) => game.id === Number(targetButton.dataset.game));
      if (matchedGame) {
        selectedGame = matchedGame;
        populateGameDetails();
        showScreen("game");
        startDownload();
      }
    }

    if (targetButton.classList.contains("download-btn")) {
      const item = targetButton.closest(".game-item");
      const gameId = Number(item?.dataset.gameId);
      const matchedGame = games.find((game) => game.id === gameId);
      if (matchedGame) {
        selectedGame = matchedGame;
        populateGameDetails();
        showScreen("game");
        startDownload();
      }
    }
  });

  registerForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(registerForm);
    const firstName = formData.get("firstName")?.toString().trim() || "";
    if (!firstName) {
      registerMessage.textContent = "Пожалуйста, заполните все поля.";
      return;
    }
    registerMessage.textContent = "Добро пожаловать!";
  });

  downloadBtn.addEventListener("click", startDownload);
}

function renderGames() {
  const query = searchInput.value.trim().toLowerCase();
  const filteredGames = games.filter((game) => game.title.toLowerCase().includes(query));

  gameList.innerHTML = filteredGames
    .map(
      (game) => `
        <article class="game-item" data-game-id="${game.id}">
          <div class="game-icon ${game.accent}">${game.icon}</div>
          <div class="game-meta">
            <h3>${game.title}</h3>
            <p>${game.rating} ★ • ${game.size}</p>
          </div>
          <button class="download-btn" type="button">Скачать</button>
        </article>
      `
    )
    .join("");
}

function showScreen(name) {
  screens.forEach((screen) => {
    screen.classList.toggle("active", screen.id === `${name}-screen`);
  });

  navButtons.forEach((button) => {
    const isActive = button.dataset.target === name;
    button.classList.toggle("active", isActive);
  });
}

function populateGameDetails() {
  detailTitle.textContent = selectedGame.title;
  detailIcon.textContent = selectedGame.icon;
  detailIcon.className = `detail-icon ${selectedGame.accent}`;
  detailMeta.textContent = `${selectedGame.rating} ★ • ${selectedGame.size}`;
  detailDescription.textContent = selectedGame.description;
  detailRating.textContent = selectedGame.rating;
  detailSize.textContent = selectedGame.size;
  downloadMessage.textContent = "";
  progressBar.style.width = "0%";
}

function startDownload() {
  if (downloadTimer) {
    clearInterval(downloadTimer);
  }

  progressBar.style.width = "0%";
  downloadMessage.textContent = "Подготовка загрузки...";
  downloadBtn.textContent = "Скачивание...";
  downloadBtn.disabled = true;

  let progress = 0;
  downloadTimer = setInterval(() => {
    progress += 10;
    progressBar.style.width = `${Math.min(progress, 100)}%`;

    if (progress >= 100) {
      clearInterval(downloadTimer);
      downloadTimer = null;
      downloadBtn.textContent = "Скачать";
      downloadBtn.disabled = false;
      downloadMessage.textContent = "Игра успешно скачана";
    }
  }, 180);
}

init();
