(() => {
  'use strict';

  /* ============================================================
     Constantes
     ============================================================ */
  // Las 8 combinaciones ganadoras (filas, columnas y diagonales)
  const COMBOS = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],   // filas
    [0, 3, 6], [1, 4, 7], [2, 5, 8],   // columnas
    [0, 4, 8], [2, 4, 6]                // diagonales
  ];

  /* ============================================================
     Referencias al DOM
     ============================================================ */
  const boardEl     = document.getElementById('board');
  const statusEl    = document.getElementById('status');
  const scoreXEl    = document.getElementById('scoreX');
  const scoreOEl    = document.getElementById('scoreO');
  const scoreTieEl  = document.getElementById('scoreTie');
  const restartBtn  = document.getElementById('restart');
  const resetBtn    = document.getElementById('resetScores');

  /* ============================================================
     Estado del juego
     ============================================================ */
  const state = {
    board: Array(9).fill(''),           // las 9 casillas
    current: 'X',                       // turno actual (empieza X)
    over: false,                        // ¿terminó la partida?
    scores: { X: 0, O: 0, tie: 0 }      // puntajes
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
    // Ignorar si la partida terminó o la casilla ya está ocupada
    if (state.over) return;
    if (state.board[index]) return;

    playMove(index, state.current);

    if (state.over) return;

    switchTurn();
  }

  function playMove(index, player) {
    state.board[index] = player;

    const cell = cells[index];
    cell.classList.add('mark', player.toLowerCase());
    cell.textContent = player;
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
      result.combo.forEach(i => cells[i].classList.add('win'));
    } else {
      state.scores[result.winner]++;
      (result.winner === 'X' ? scoreXEl : scoreOEl).textContent = state.scores[result.winner];
      statusEl.textContent = `¡Ganó ${result.winner}!`;
      result.combo.forEach(i => cells[i].classList.add('win'));
    }
  }

  function updateStatus() {
    if (state.over) return;
    statusEl.textContent = `Turno de ${state.current}`;
  }

  /* ============================================================
     Reglas / evaluación
     ============================================================ */
  function evaluate(b) {
    // Verificar si hay un ganador
    for (const combo of COMBOS) {
      const [a, c, d] = combo;
      if (b[a] && b[a] === b[c] && b[a] === b[d]) {
        return { winner: b[a], combo };
      }
    }
    // Verificar empate (todas las casillas llenas)
    if (b.every(v => v !== '')) {
      return { winner: 'tie', combo: [] };
    }
    return null;
  }

  /* ============================================================
     Reinicio
     ============================================================ */
  function newRound() {
    state.board = Array(9).fill('');
    state.current = 'X';
    state.over = false;

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
  resetBtn.addEventListener('click', resetScores);

  /* ============================================================
     Arranque
     ============================================================ */
  updateStatus();
})();