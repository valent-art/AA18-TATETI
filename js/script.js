(() => {
  'use strict';

  /* ============================================================
     Constantes
     ============================================================ */
  const COMBOS = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
  ];

  const HUMAN = 'X';
  const AI = 'O';

  /* ============================================================
     Referencias al DOM
     ============================================================ */
  const boardEl        = document.getElementById('board');
  const statusEl       = document.getElementById('status');
  const scoreXEl       = document.getElementById('scoreX');
  const scoreOEl       = document.getElementById('scoreO');
  const scoreTieEl     = document.getElementById('scoreTie');
  const oLabelEl       = document.getElementById('oLabel');
  const restartBtn     = document.getElementById('restart');
  const resetScoresBtn = document.getElementById('resetScores');
  const modeControl    = document.getElementById('modeControl');
  const diffControl    = document.getElementById('diffControl');

  /* ============================================================
     Estado del juego
     ============================================================ */
  const state = {
    board: Array(9).fill(''),
    current: HUMAN,
    over: false,
    vsAI: true,
    difficulty: 'dificil',
    scores: { X: 0, O: 0, tie: 0 },
    thinking: false
  };

  const cells = [];

  /* ============================================================
     Construcción del tablero
     ============================================================ */
  for (let i = 0; i < 9; i++) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'cell';
    btn.dataset.index = i;
    btn.setAttribute('aria-label', `Casilla ${i + 1}: vacía`);
    btn.addEventListener('click', () => handleCellClick(i));
    boardEl.appendChild(btn);
    cells.push(btn);
  }

  /* ============================================================
     Lógica principal
     ============================================================ */
  function handleCellClick(index) {
    if (state.over || state.thinking) return;
    if (state.board[index]) return;
    if (state.vsAI && state.current === AI) return;

    playMove(index, state.current);

    if (state.over) return;

    switchTurn();

    if (state.vsAI && state.current === AI && !state.over) {
      scheduleAIMove();
    }
  }

  function playMove(index, player) {
    state.board[index] = player;

    const cell = cells[index];
    cell.classList.add('mark', player.toLowerCase());
    cell.innerHTML = `<span>${player}</span>`;
    cell.setAttribute('aria-label', `Casilla ${index + 1}: ${player}`);

    const result = evaluate(state.board);

    if (result) {
      endGame(result);
    }
  }

  function switchTurn() {
    state.current = state.current === 'X' ? 'O' : 'X';
    updateStatus();
  }

  function endGame(result) {
    state.over = true;

    if (result.winner === 'tie') {
      state.scores.tie++;
      scoreTieEl.textContent = state.scores.tie;
      statusEl.textContent = '¡Empate!';
      statusEl.className = 'status win';
      result.combo.forEach(i => cells[i].classList.add('win', 'tie'));
    } else {
      state.scores[result.winner]++;
      (result.winner === 'X' ? scoreXEl : scoreOEl).textContent = state.scores[result.winner];

      const name = state.vsAI && result.winner === AI ? 'la CPU' : result.winner;
      statusEl.textContent = `¡Ganó ${name}!`;
      statusEl.className = 'status win';

      result.combo.forEach(i => cells[i].classList.add('win', result.winner.toLowerCase()));
    }
  }

  function updateStatus() {
    if (state.over) return;
    const isCPU = state.vsAI && state.current === AI;
    statusEl.textContent = isCPU ? 'Turno de la CPU…' : `Turno de ${state.current}`;
    statusEl.className = 'status ' + state.current.toLowerCase();
  }

  /* ============================================================
     Reglas / evaluación
     ============================================================ */
  function evaluate(b) {
    for (const combo of COMBOS) {
      const [a, c, d] = combo;
      if (b[a] && b[a] === b[c] && b[a] === b[d]) {
        return { winner: b[a], combo };
      }
    }
    if (b.every(v => v !== '')) {
      return { winner: 'tie', combo: [] };
    }
    return null;
  }

  /* ============================================================
     IA — Minimax
     ============================================================ */
  function scheduleAIMove() {
    state.thinking = true;
    boardEl.style.pointerEvents = 'none';

    setTimeout(() => {
      const move = chooseAIMove();
      state.thinking = false;
      boardEl.style.pointerEvents = '';

      if (move === -1 || state.over) return;

      playMove(move, AI);
      if (!state.over) switchTurn();
    }, 320);
  }

  function chooseAIMove() {
    const empty = emptyIndices(state.board);
    if (empty.length === 0) return -1;

    const difficulty = state.difficulty;

    if (difficulty === 'facil') {
      if (Math.random() < 0.8) return randomPick(empty);
      return bestMove(state.board);
    }

    if (difficulty === 'medio') {
      return Math.random() < 0.5 ? randomPick(empty) : bestMove(state.board);
    }

    return bestMove(state.board);
  }

  function bestMove(b) {
    let bestScore = -Infinity;
    let move = -1;

    for (const i of shuffle(emptyIndices(b))) {
      b[i] = AI;
      const score = minimax(b, 0, false);
      b[i] = '';

      if (score > bestScore) {
        bestScore = score;
        move = i;
      }
    }
    return move;
  }

  function minimax(b, depth, isMaximizing) {
    const result = evaluate(b);

    if (result) {
      if (result.winner === AI)    return 10 - depth;
      if (result.winner === HUMAN) return depth - 10;
      return 0;
    }

    if (isMaximizing) {
      let best = -Infinity;
      for (let i = 0; i < 9; i++) {
        if (b[i]) continue;
        b[i] = AI;
        best = Math.max(best, minimax(b, depth + 1, false));
        b[i] = '';
      }
      return best;
    }

    let best = Infinity;
    for (let i = 0; i < 9; i++) {
      if (b[i]) continue;
      b[i] = HUMAN;
      best = Math.min(best, minimax(b, depth + 1, true));
      b[i] = '';
    }
    return best;
  }

  /* ============================================================
     Utilidades
     ============================================================ */
  function emptyIndices(b) {
    const out = [];
    for (let i = 0; i < 9; i++) if (!b[i]) out.push(i);
    return out;
  }

  function randomPick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  /* ============================================================
     Reinicio
     ============================================================ */
  function newRound() {
    state.board = Array(9).fill('');
    state.current = HUMAN;
    state.over = false;
    state.thinking = false;
    boardEl.style.pointerEvents = '';

    cells.forEach((cell, i) => {
      cell.className = 'cell';
      cell.textContent = '';
      cell.setAttribute('aria-label', `Casilla ${i + 1}: vacía`);
    });

    updateStatus();
  }

  function resetScores() {
    state.scores = { X: 0, O: 0, tie: 0 };
    scoreXEl.textContent = '0';
    scoreOEl.textContent = '0';
    scoreTieEl.textContent = '0';
    newRound();
  }

  /* ============================================================
     Eventos de UI
     ============================================================ */
  restartBtn.addEventListener('click', newRound);
  resetScoresBtn.addEventListener('click', resetScores);

  modeControl.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-mode]');
    if (!btn) return;

    modeControl.querySelectorAll('button').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    state.vsAI = btn.dataset.mode === 'cpu';
    diffControl.dataset.disabled = state.vsAI ? 'false' : 'true';
    oLabelEl.textContent = state.vsAI ? 'CPU' : 'Jugador O';

    newRound();
  });

  diffControl.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-diff]');
    if (!btn) return;

    diffControl.querySelectorAll('button').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.difficulty = btn.dataset.diff;
    newRound();
  });

  /* ============================================================
     Arranque
     ============================================================ */
  updateStatus();
})();