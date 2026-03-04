// ============================================================
// PLAYER FACTORY
// ============================================================
const PlayerFactory = (name, marker) => {
  const getName = () => name;
  const getMarker = () => marker;
  return { getName, getMarker };
};

// ============================================================
// GAMEBOARD MODULE
// ============================================================
const Gameboard = (() => {
  let board = Array(9).fill(null);

  const getBoard = () => [...board];

  const placeMarker = (index, marker) => {
    if (index < 0 || index > 8 || board[index] !== null) return false;
    board[index] = marker;
    return true;
  };

  const reset = () => { board = Array(9).fill(null); };

  const isFull = () => board.every(cell => cell !== null);

  const getWinner = () => {
    const wins = [
      [0,1,2],[3,4,5],[6,7,8],
      [0,3,6],[1,4,7],[2,5,8],
      [0,4,8],[2,4,6]
    ];
    for (const [a,b,c] of wins) {
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return { marker: board[a], line: [a,b,c] };
      }
    }
    return null;
  };

  return { getBoard, placeMarker, reset, isFull, getWinner };
})();

// ============================================================
// GAME CONTROLLER MODULE
// ============================================================
const GameController = (() => {
  let players = [];
  let currentPlayerIndex = 0;
  let gameOver = false;
  let scores = [0, 0];

  const setup = (p1Name, p2Name) => {
    players = [
      PlayerFactory(p1Name || 'Player 1', 'X'),
      PlayerFactory(p2Name || 'Player 2', 'O')
    ];
    currentPlayerIndex = 0;
    gameOver = false;
    Gameboard.reset();
  };

  const getCurrentPlayer = () => players[currentPlayerIndex];
  const getScores = () => [...scores];
  const resetScores = () => { scores = [0, 0]; };
  const isOver = () => gameOver;

  const playTurn = (index) => {
    if (gameOver) return { status: 'over' };
    const player = getCurrentPlayer();
    if (!Gameboard.placeMarker(index, player.getMarker())) return { status: 'invalid' };

    const winResult = Gameboard.getWinner();
    if (winResult) {
      gameOver = true;
      scores[currentPlayerIndex]++;
      return { status: 'win', player, line: winResult.line };
    }
    if (Gameboard.isFull()) {
      gameOver = true;
      return { status: 'tie' };
    }

    currentPlayerIndex = currentPlayerIndex === 0 ? 1 : 0;
    return { status: 'continue', player: getCurrentPlayer() };
  };

  const newRound = () => {
    currentPlayerIndex = 0;
    gameOver = false;
    Gameboard.reset();
  };

  return { setup, getCurrentPlayer, getScores, resetScores, isOver, playTurn, newRound };
})();

// ============================================================
// DISPLAY CONTROLLER MODULE
// ============================================================
const DisplayController = (() => {
  const startScreen = document.getElementById('start-screen');
  const gameScreen = document.getElementById('game-screen');
  const p1Input = document.getElementById('p1-name');
  const p2Input = document.getElementById('p2-name');
  const statusEl = document.getElementById('status');
  const p1LabelEl = document.getElementById('p1-label');
  const p2LabelEl = document.getElementById('p2-label');
  const p1ScoreEl = document.getElementById('p1-score');
  const p2ScoreEl = document.getElementById('p2-score');
  const cells = document.querySelectorAll('.cell');

  const renderBoard = () => {
    const board = Gameboard.getBoard();
    cells.forEach((cell, i) => {
      cell.textContent = board[i] || '';
      cell.className = 'cell';
      if (board[i]) cell.classList.add('marked');
    });
  };

  const highlightWinLine = (line) => {
    line.forEach(i => cells[i].classList.add('winner'));
  };

  const updateScores = () => {
    const [s1, s2] = GameController.getScores();
    p1ScoreEl.textContent = s1;
    p2ScoreEl.textContent = s2;
  };

  const handleCellClick = (e) => {
    const index = Number(e.target.dataset.index);
    const result = GameController.playTurn(index);
    if (result.status === 'invalid' || result.status === 'over') return;

    renderBoard();

    if (result.status === 'win') {
      highlightWinLine(result.line);
      updateScores();
      statusEl.textContent = `${result.player.getName()} wins!`;
    } else if (result.status === 'tie') {
      statusEl.textContent = "It's a tie!";
    } else {
      statusEl.textContent = `${result.player.getName()}'s turn (${result.player.getMarker()})`;
    }
  };

  const bindCells = () => {
    cells.forEach(cell => {
      cell.removeEventListener('click', handleCellClick);
      cell.addEventListener('click', handleCellClick);
    });
  };

  const startGame = () => {
    const p1 = p1Input.value.trim() || 'Player 1';
    const p2 = p2Input.value.trim() || 'Player 2';
    GameController.setup(p1, p2);
    GameController.resetScores();

    p1LabelEl.textContent = p1;
    p2LabelEl.textContent = p2;
    updateScores();

    startScreen.classList.add('hidden');
    gameScreen.classList.remove('hidden');

    renderBoard();
    const cur = GameController.getCurrentPlayer();
    statusEl.textContent = `${cur.getName()}'s turn (${cur.getMarker()})`;
    bindCells();
  };

  const restartRound = () => {
    GameController.newRound();
    renderBoard();
    bindCells();
    const cur = GameController.getCurrentPlayer();
    statusEl.textContent = `${cur.getName()}'s turn (${cur.getMarker()})`;
  };

  const goToNewGame = () => {
    GameController.resetScores();
    startScreen.classList.remove('hidden');
    gameScreen.classList.add('hidden');
  };

  document.getElementById('start-btn').addEventListener('click', startGame);
  document.getElementById('restart-btn').addEventListener('click', restartRound);
  document.getElementById('new-game-btn').addEventListener('click', goToNewGame);
  [p1Input, p2Input].forEach(input => {
    input.addEventListener('keydown', e => { if (e.key === 'Enter') startGame(); });
  });
})();
