const animals = {
  turtle: {
    label: "Turtle",
    image: "./src/assets/turtle.svg",
    win: "The turtle takes the crown. Slow, smug, unstoppable.",
    turn: "Turtle's turn. Shell up."
  },
  alligator: {
    label: "Alligator",
    image: "./src/assets/alligator.svg",
    win: "The alligator snaps up the win. Hide the snacks.",
    turn: "Alligator's turn. Teeth out."
  }
};

const winLines = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6]
];

const state = {
  board: Array(9).fill(null),
  current: "turtle",
  human: "turtle",
  mode: "computer",
  difficulty: "easy",
  locked: false,
  scores: {
    turtle: 0,
    alligator: 0,
    tie: 0
  }
};

const cells = [...document.querySelectorAll(".cell")];
const statusText = document.querySelector("#status");
const modeButtons = [...document.querySelectorAll("[data-mode]")];
const difficultyButtons = [...document.querySelectorAll("[data-difficulty]")];
const playerButtons = [...document.querySelectorAll("[data-player]")];
const scoreTurtle = document.querySelector("#score-turtle");
const scoreAlligator = document.querySelector("#score-alligator");
const scoreTie = document.querySelector("#score-tie");
const resetRound = document.querySelector("#reset-round");
const resetScore = document.querySelector("#reset-score");

function other(animal) {
  return animal === "turtle" ? "alligator" : "turtle";
}

function availableMoves(board = state.board) {
  return board.map((value, index) => (value ? null : index)).filter((value) => value !== null);
}

function getWinner(board = state.board) {
  for (const line of winLines) {
    const [a, b, c] = line;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { animal: board[a], line };
    }
  }

  if (board.every(Boolean)) {
    return { animal: "tie", line: [] };
  }

  return null;
}

function setStatus(message) {
  statusText.textContent = message;
}

function renderScores() {
  scoreTurtle.textContent = state.scores.turtle;
  scoreAlligator.textContent = state.scores.alligator;
  scoreTie.textContent = state.scores.tie;
}

function renderBoard() {
  const winner = getWinner();
  cells.forEach((cell, index) => {
    const animal = state.board[index];
    cell.innerHTML = "";
    cell.classList.toggle("is-winning", Boolean(winner?.line.includes(index)));
    cell.disabled = state.locked || Boolean(animal) || Boolean(winner);
    cell.setAttribute("aria-label", `Cell ${index + 1}${animal ? `, ${animals[animal].label}` : ""}`);

    if (animal) {
      const img = document.createElement("img");
      img.src = animals[animal].image;
      img.alt = animals[animal].label;
      img.className = "piece";
      cell.append(img);
    }
  });
}

function finishIfOver() {
  const winner = getWinner();
  if (!winner) {
    return false;
  }

  state.locked = true;

  if (winner.animal === "tie") {
    state.scores.tie += 1;
    setStatus("A tie. Everyone looks ridiculous, which feels correct.");
  } else {
    state.scores[winner.animal] += 1;
    setStatus(animals[winner.animal].win);
  }

  renderScores();
  renderBoard();
  return true;
}

function makeMove(index) {
  if (state.locked || state.board[index] || getWinner()) {
    return;
  }

  state.board[index] = state.current;
  renderBoard();

  if (finishIfOver()) {
    return;
  }

  state.current = other(state.current);
  setStatus(animals[state.current].turn);

  if (state.mode === "computer" && state.current !== state.human) {
    state.locked = true;
    renderBoard();
    window.setTimeout(playComputerTurn, 450);
  }
}

function randomMove() {
  const moves = availableMoves();
  return moves[Math.floor(Math.random() * moves.length)];
}

function findLineMove(animal, board = state.board) {
  for (const line of winLines) {
    const values = line.map((index) => board[index]);
    const openIndex = line.find((index) => !board[index]);
    if (openIndex !== undefined && values.filter((value) => value === animal).length === 2) {
      return openIndex;
    }
  }

  return null;
}

function smartMove() {
  const computer = other(state.human);
  const human = state.human;
  const winningMove = findLineMove(computer);
  const blockingMove = findLineMove(human);

  if (winningMove !== null) return winningMove;
  if (blockingMove !== null) return blockingMove;
  if (!state.board[4]) return 4;

  const corners = [0, 2, 6, 8].filter((index) => !state.board[index]);
  if (corners.length) return corners[Math.floor(Math.random() * corners.length)];

  return randomMove();
}

function minimax(board, player, computer) {
  const winner = getWinner(board);
  if (winner?.animal === computer) return { score: 10 };
  if (winner?.animal === other(computer)) return { score: -10 };
  if (winner?.animal === "tie") return { score: 0 };

  const moves = availableMoves(board).map((index) => {
    const nextBoard = [...board];
    nextBoard[index] = player;
    const result = minimax(nextBoard, other(player), computer);
    return {
      index,
      score: result.score
    };
  });

  if (player === computer) {
    return moves.reduce((best, move) => (move.score > best.score ? move : best));
  }

  return moves.reduce((best, move) => (move.score < best.score ? move : best));
}

function computerMove() {
  if (state.difficulty === "easy") {
    return Math.random() < 0.55 ? randomMove() : smartMove();
  }

  return minimax([...state.board], other(state.human), other(state.human)).index;
}

function playComputerTurn() {
  const move = computerMove();
  state.locked = false;
  makeMove(move);
}

function newRound(message = "Fresh round. Turtle starts because tradition is bossy.") {
  state.board = Array(9).fill(null);
  state.current = "turtle";
  state.locked = false;
  setStatus(message);
  renderBoard();

  if (state.mode === "computer" && state.current !== state.human) {
    state.locked = true;
    renderBoard();
    window.setTimeout(playComputerTurn, 450);
  }
}

function setActive(buttons, activeButton) {
  buttons.forEach((button) => {
    button.classList.toggle("is-active", button === activeButton);
  });
}

cells.forEach((cell) => {
  cell.addEventListener("click", () => makeMove(Number(cell.dataset.index)));
});

modeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    state.mode = button.dataset.mode;
    setActive(modeButtons, button);
    newRound(state.mode === "computer" ? "Computer mode. The swamp has thoughts." : "Two players. Pass the device like a cursed trophy.");
  });
});

difficultyButtons.forEach((button) => {
  button.addEventListener("click", () => {
    state.difficulty = button.dataset.difficulty;
    setActive(difficultyButtons, button);
    newRound(state.difficulty === "hard" ? "Unbeatable mode. Bold choice." : "Chaos mode. The computer is wearing floaties.");
  });
});

playerButtons.forEach((button) => {
  button.addEventListener("click", () => {
    state.human = button.dataset.player;
    setActive(playerButtons, button);
    newRound(`You are ${animals[state.human].label}. Please behave accordingly.`);
  });
});

resetRound.addEventListener("click", () => newRound());

resetScore.addEventListener("click", () => {
  state.scores = { turtle: 0, alligator: 0, tie: 0 };
  renderScores();
  newRound("Scores erased. Nobody can prove anything.");
});

renderScores();
newRound("Turtle starts. Make it weird.");
