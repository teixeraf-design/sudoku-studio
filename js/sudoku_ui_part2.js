// ============================================================
// PARTE 3B - SUDOKU UI (Eventos, Timer e Lógica do Jogo)
// ============================================================

// ===== Event Binding =====
SudokuUI.prototype._bindEvents = function() {
    console.log('🔗 Vinculando eventos...');

    // Difficulty select
    this.difficultyPreset.addEventListener('change', () => {
        console.log('📋 Dificuldade alterada:', this.difficultyPreset.value);
        if (this.difficultyPreset.value === '') {
            this._resetControlsToEmpty();
            return;
        }
        
        const val = this.difficultyMap[this.difficultyPreset.value];
        this.cluesSlider.value = val;
        this.cluesVal.textContent = val;
        this.cluesVal.classList.remove('empty');
        this.cluesSlider.disabled = false;
        this.difficultyPreset.classList.remove('empty');
        
        if (this.errorsPreset.value === '') {
            const errorsLimit = this.difficultyErrorsMap[this.difficultyPreset.value];
            if (errorsLimit) {
                this.errorsPreset.value = String(errorsLimit);
                this.errorsPreset.classList.remove('empty');
                this.maxErrors = errorsLimit;
                this._updateErrorsUI();
            }
        } else if (this.errorsPreset.value !== 'livre') {
            this._updateErrorsFromDifficulty(this.difficultyPreset.value);
        }
        
        this.isControlsReady = this._areControlsReady();
    });

    // Clues slider
    this.cluesSlider.addEventListener('input', () => {
        const value = parseInt(this.cluesSlider.value);
        this.cluesVal.textContent = value;
        this.cluesVal.classList.remove('empty');
        this._updateDifficultyFromSlider(value);
        this.isControlsReady = this._areControlsReady();
    });

    // Errors select
    this.errorsPreset.addEventListener('change', () => {
        const errorsVal = this.errorsPreset.value;
        
        if (errorsVal === '') {
            this.errorsPreset.classList.add('empty');
            this.isControlsReady = this._areControlsReady();
            return;
        }
        
        this.errorsPreset.classList.remove('empty');
        
        if (errorsVal === 'livre') {
            this.maxErrors = Infinity;
            this._updateErrorsUI();
            this.errorsPreset.classList.remove('errors-manual');
        } else {
            const newMax = parseInt(errorsVal);
            if (!isNaN(newMax) && newMax > 0) {
                this.maxErrors = newMax;
                this._updateErrorsUI();
                this._updateDifficultyFromErrors(newMax);
                this.errorsPreset.classList.add('errors-manual');
            }
        }
        
        this.isControlsReady = this._areControlsReady();
    });

    // Timer pause button
    this.timerPauseBtn.addEventListener('click', () => {
        console.log('⏸️ Botão pause clicado');
        if (this.isIdle || this.isGameOver) return;
        this._togglePause();
    });

    // Clique no grid para pausar
    this.gridWrapper.addEventListener('click', (e) => {
        if (this.isIdle || this.isGameOver) return;
        if (e.target.closest('.grid-overlay')) return;
        if (e.target.closest('.sudoku-cell')) return;
        this._togglePause();
    });

    // Botão de reset
    if (this.timerResetBtn) {
        this.timerResetBtn.addEventListener('click', () => {
            console.log('⟳ Botão reset clicado');
            this._resetGame();
        });
    }

    // Botão "Gerar Tabuleiro"
    this.btnNewGame.addEventListener('click', () => {
        console.log('🎮 Gerar Tabuleiro clicado');
        if (!this.isControlsReady) {
            this._showControlsWarning();
            return;
        }
        this._scrollToTop();
        this.startNewGame();
    });

    // Modal button
    this.modalBtn.addEventListener('click', () => {
        console.log('🔄 Jogar Novamente clicado');
        this.modalOverlay.classList.remove('active');
        this._resetGame();
    });

    // Scroll to controls
    if (this.scrollBtn) {
        this.scrollBtn.addEventListener('click', () => {
            console.log('⬇ Configurar Jogo clicado');
            this._scrollToControls();
        });
    }

    // ===== AUTH EVENTS =====
    // Botão de login Google
    const googleBtn = document.getElementById('btn-google-login');
    if (googleBtn) {
        googleBtn.addEventListener('click', async () => {
            console.log('🅶 Login com Google clicado');
            if (this.firebase) {
                try {
                    await this.firebase.loginWithGoogle();
                } catch (error) {
                    console.error('Erro no login:', error);
                }
            }
        });
    }

    // Botão de convidado
    const guestBtn = document.getElementById('btn-guest-play');
    if (guestBtn) {
        guestBtn.addEventListener('click', () => {
            console.log('👤 Jogar como convidado clicado');
            this._closeAuthModal();
            this.isAuthenticated = false;
            this._updateUIForGuest();
        });
    }

    // Botão de logout
    const logoutBtn = document.getElementById('btn-logout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            console.log('👋 Logout clicado');
            if (this.firebase) {
                try {
                    await this.firebase.logout();
                    this.isAuthenticated = false;
                    this._updateUIForGuest();
                    this._showAuthModal();
                } catch (error) {
                    console.error('Erro no logout:', error);
                }
            }
        });
    }

    // ===== BOTÃO PARA RECARREGAR ESTATÍSTICAS =====
    const refreshBtn = document.getElementById('btn-refresh-stats');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', async () => {
            console.log('⟳ Recarregando estatísticas...');
            if (this.isAuthenticated && this.firebase && this.firebase.currentUser) {
                await this._loadUserStats(this.firebase.currentUser.uid);
                console.log('✅ Estatísticas recarregadas!');
            } else {
                console.warn('⚠️ Usuário não autenticado');
            }
        });
    }

    // Keyboard events
    document.addEventListener('keydown', (e) => {
        if (this.isIdle || this.isPaused || this.isGameOver) return;
        
        if (e.key >= '1' && e.key <= '9') {
            e.preventDefault();
            this.inputNumber(parseInt(e.key));
        } else if (e.key === 'Backspace' || e.key === 'Delete') {
            e.preventDefault();
            this.inputNumber(0);
        } else if (e.key === 'r' || e.key === 'R') {
            if (!this.isIdle) {
                this._resetGame();
            }
        }
    });

    // Virtual keypad
    this.keyBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            if (this.isIdle || this.isPaused || this.isGameOver) return;
            const val = parseInt(btn.dataset.val);
            this.inputNumber(val);
        });
    });

    console.log('✅ Todos os eventos vinculados!');
};

// ===== Timer Methods =====
SudokuUI.prototype._startTimer = function() {
    if (this.timerInterval || this.isIdle) return;
    this.timerInterval = setInterval(() => {
        if (!this.isPaused) {
            this.timerSeconds++;
            this._updateTimerDisplay();
        }
    }, 1000);
};

SudokuUI.prototype._stopTimer = function() {
    if (this.timerInterval) {
        clearInterval(this.timerInterval);
        this.timerInterval = null;
    }
};

SudokuUI.prototype._resetTimer = function() {
    this._stopTimer();
    this.timerSeconds = 0;
    this.isPaused = false;
    this._updateTimerDisplay();
    this._updatePauseUI();
    if (this.boardFrame) {
        this.boardFrame.classList.remove('paused');
    }
};

SudokuUI.prototype._updateTimerDisplay = function() {
    const mins = String(Math.floor(this.timerSeconds / 60)).padStart(2, '0');
    const secs = String(this.timerSeconds % 60).padStart(2, '0');
    this.timerDisplay.textContent = `${mins}:${secs}`;
};

SudokuUI.prototype._togglePause = function() {
    if (this.isIdle || this.isGameOver) return;
    
    this.isPaused = !this.isPaused;
    this._updatePauseUI();
    
    if (this.isPaused) {
        this.gameStatus.textContent = "Pausado";
        this.gameStatus.className = "stat-value status-paused";
        if (this.boardFrame) {
            this.boardFrame.classList.add('paused');
        }
    } else {
        this.gameStatus.textContent = "Jogando";
        this.gameStatus.className = "stat-value status-active";
        if (this.boardFrame) {
            this.boardFrame.classList.remove('paused');
        }
    }
};

SudokuUI.prototype._updatePauseUI = function() {
    if (this.isIdle) return;
    
    if (this.isPaused) {
        this.pauseIcon.textContent = '▶';
        this.timerPauseBtn.classList.add('paused');
        this.timerDisplay.classList.add('paused');
        this.timerPauseBtn.title = 'Retomar';
    } else {
        this.pauseIcon.textContent = '⏸';
        this.timerPauseBtn.classList.remove('paused');
        this.timerDisplay.classList.remove('paused');
        this.timerPauseBtn.title = 'Pausar';
    }
};

// ===== Difficulty Sync Methods =====
SudokuUI.prototype._updateDifficultyFromSlider = function(value) {
    let closest = 'medio';
    let closestDiff = Infinity;
    
    for (const [key, val] of Object.entries(this.difficultyMap)) {
        const diff = Math.abs(val - value);
        if (diff < closestDiff) {
            closestDiff = diff;
            closest = key;
        }
    }
    
    if (this.difficultyPreset.value !== closest) {
        this.difficultyPreset.value = closest;
        this.difficultyPreset.classList.remove('empty');
        if (this.errorsPreset.value !== 'livre' && this.errorsPreset.value !== '') {
            this._updateErrorsFromDifficulty(closest);
        }
    }
};

SudokuUI.prototype._updateDifficultyFromErrors = function(errorsValue) {
    let closest = 'medio';
    let closestDiff = Infinity;
    
    for (const [key, val] of Object.entries(this.difficultyErrorsMap)) {
        const diff = Math.abs(val - errorsValue);
        if (diff < closestDiff) {
            closestDiff = diff;
            closest = key;
        }
    }
    
    if (this.difficultyPreset.value !== closest) {
        this.difficultyPreset.value = closest;
        this.difficultyPreset.classList.remove('empty');
        const newCluesValue = this.difficultyMap[closest];
        this.cluesSlider.value = newCluesValue;
        this.cluesVal.textContent = newCluesValue;
        this.cluesVal.classList.remove('empty');
        this.cluesSlider.disabled = false;
    }
};

SudokuUI.prototype._updateErrorsFromDifficulty = function(difficulty) {
    if (this.errorsPreset.value === 'livre' || this.errorsPreset.value === '') return;
    
    const errorsLimit = this.difficultyErrorsMap[difficulty];
    if (errorsLimit) {
        const currentErrorValue = parseInt(this.errorsPreset.value);
        if (currentErrorValue !== errorsLimit) {
            this.errorsPreset.value = String(errorsLimit);
            this.errorsPreset.classList.remove('empty');
            if (!this.isGameOver && this.errors === 0) {
                this.maxErrors = errorsLimit;
                this._updateErrorsUI();
            }
        }
    }
};

// ===== Game Lifecycle =====
SudokuUI.prototype.startNewGame = function() {
    console.log('🎮 Iniciando novo jogo...');
    this._scrollToTop();
    this.isIdle = false;
    
    if (this.gridOverlay) {
        this.gridOverlay.classList.add('hidden');
    }
    if (this.boardFrame) {
        this.boardFrame.classList.remove('idle');
    }

    this.isGameOver = false;
    this.isPaused = false;
    this.errors = 0;
    this.selectedIdx = null;
    this.isErrorPending = false;
    this.gameStatus.textContent = "Jogando";
    this.gameStatus.className = "stat-value status-active";

    this._resetTimer();
    this._startTimer();

    if (this.boardFrame) {
        this.boardFrame.classList.remove('paused');
    }

    if (this.errorsPreset.value !== 'livre' && this.errorsPreset.value !== '') {
        const currentDifficulty = this.difficultyPreset.value;
        const errorsFromDifficulty = this.difficultyErrorsMap[currentDifficulty];
        if (errorsFromDifficulty) {
            this.errorsPreset.value = String(errorsFromDifficulty);
            this.errorsPreset.classList.remove('empty');
            this.maxErrors = errorsFromDifficulty;
        } else {
            const errorsVal = this.errorsPreset.value;
            this.maxErrors = parseInt(errorsVal) || 5;
        }
    } else if (this.errorsPreset.value === 'livre') {
        this.maxErrors = Infinity;
    } else {
        this.maxErrors = 8;
    }

    this._updateErrorsUI();

    this.solution = SudokuEngine.generateFullBoard();
    const clues = parseInt(this.cluesSlider.value);
    this.puzzle = SudokuEngine.createPuzzle(this.solution, clues);

    this.cluesMask = Array.from({ length: 9 }, () => Array(9).fill(false));
    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            if (this.puzzle[r][c] !== 0) {
                this.cluesMask[r][c] = true;
            }
        }
    }

    this._renderGrid();
    this.isFirstLoad = false;
    console.log('✅ Jogo iniciado!');
};

// ===== Grid Rendering =====
SudokuUI.prototype._renderGrid = function() {
    if (this.gridOverlay) {
        this.gridOverlay.classList.add('hidden');
    }
    
    this.gridEl.innerHTML = '';
    const fragment = document.createDocumentFragment();

    for (let i = 0; i < 81; i++) {
        const row = Math.floor(i / 9);
        const col = i % 9;
        const value = this.puzzle[row][col];

        const cell = document.createElement('button');
        cell.className = 'sudoku-cell';
        cell.dataset.index = i;
        cell.setAttribute('role', 'gridcell');
        cell.setAttribute('aria-label', `Linha ${row + 1}, Coluna ${col + 1}`);

        if (this.cluesMask[row][col]) {
            cell.classList.add('clue');
            cell.textContent = value;
        } else if (value !== 0) {
            cell.classList.add('user-filled');
            cell.textContent = value;
            if (value !== this.solution[row][col]) {
                cell.classList.add('wrong');
            }
        }

        cell.addEventListener('click', () => this._selectCell(i));
        fragment.appendChild(cell);
    }

    this.gridEl.appendChild(fragment);
    
    if (this.selectedIdx !== null && !this.isGameOver) {
        const cells = this.gridEl.querySelectorAll('.sudoku-cell');
        if (cells[this.selectedIdx]) {
            cells[this.selectedIdx].classList.add('selected');
            this._updateHighlights();
        }
    }
};

// ===== Cell Selection =====
SudokuUI.prototype._selectCell = function(index) {
    if (this.isIdle || this.isPaused || this.isGameOver) return;
    const row = Math.floor(index / 9);
    const col = index % 9;
    if (this.cluesMask[row][col]) return;

    this.selectedIdx = index;
    this._updateHighlights();
};

SudokuUI.prototype._updateHighlights = function() {
    const cells = this.gridEl.querySelectorAll('.sudoku-cell');
    cells.forEach(c => c.classList.remove('selected', 'highlight', 'same-number'));

    if (this.selectedIdx === null || this.isGameOver) return;

    const selRow = Math.floor(this.selectedIdx / 9);
    const selCol = this.selectedIdx % 9;
    const selectedVal = this.puzzle[selRow][selCol];

    cells.forEach((cell, idx) => {
        const row = Math.floor(idx / 9);
        const col = idx % 9;

        if (idx === this.selectedIdx) {
            cell.classList.add('selected');
        }
        else if (row === selRow || col === selCol || 
                 (Math.floor(row / 3) === Math.floor(selRow / 3) && 
                  Math.floor(col / 3) === Math.floor(selCol / 3))) {
            if (!this.cluesMask[row][col] || this.puzzle[row][col] !== 0) {
                cell.classList.add('highlight');
            }
        }
        if (selectedVal !== 0 && this.puzzle[row][col] === selectedVal && idx !== this.selectedIdx) {
            cell.classList.add('same-number');
        }
    });
};

// ===== Game Input =====
SudokuUI.prototype.inputNumber = function(num) {
    if (this.isIdle || this.isPaused || this.selectedIdx === null || this.isGameOver) return;
    
    const row = Math.floor(this.selectedIdx / 9);
    const col = this.selectedIdx % 9;

    if (this.cluesMask[row][col]) return;
    if (this.puzzle[row][col] === num) return;
    if (num === 0 && this.puzzle[row][col] === 0) return;

    const previousValue = this.puzzle[row][col];
    const wasPreviousWrong = previousValue !== 0 && previousValue !== this.solution[row][col];

    this.puzzle[row][col] = num;

    if (num !== 0 && num !== this.solution[row][col]) {
        if (!wasPreviousWrong) {
            this.errors++;
            this._updateErrorsUI();
            
            if (this.errors >= this.maxErrors) {
                this._endGame(false);
                this._renderGrid();
                return;
            }
        }
    }

    this._renderGrid();
    
    const cells = this.gridEl.querySelectorAll('.sudoku-cell');
    if (cells[this.selectedIdx]) {
        cells[this.selectedIdx].classList.add('selected');
        this._updateHighlights();
    }

    this._checkWin();
};

// ===== Game State =====
SudokuUI.prototype._updateErrorsUI = function() {
    if (this.maxErrors === Infinity) {
        this.errorsCounter.textContent = `${this.errors} / ∞`;
    } else {
        this.errorsCounter.textContent = `${this.errors} / ${this.maxErrors}`;
    }
};

SudokuUI.prototype._checkWin = function() {
    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            if (this.puzzle[r][c] !== this.solution[r][c]) return;
        }
    }
    this._endGame(true);
};

SudokuUI.prototype._endGame = async function(isWin) {
    console.log('🏁 Fim de jogo:', isWin ? 'Vitória' : 'Derrota');
    this._stopTimer();
    this.isGameOver = true;
    
    // Salvar estatísticas se autenticado
    if (this.isAuthenticated && this.firebase && this.firebase.currentUser) {
        const gameData = {
            difficulty: this.difficultyPreset.value,
            result: isWin ? 'win' : 'loss',
            time: this.timerSeconds,
            errors: this.errors,
            clues: parseInt(this.cluesSlider.value)
        };
        
        console.log('📊 Salvando estatísticas:', gameData);
        
        try {
            const result = await this.firebase.updateStats(this.firebase.currentUser.uid, gameData);
            console.log('📊 Resultado do save:', result);
            
            // 🔥 FORÇAR RECARREGAMENTO DAS ESTATÍSTICAS
            await this._loadUserStats(this.firebase.currentUser.uid);
            console.log('📊 Estatísticas recarregadas!');
        } catch (error) {
            console.error('❌ Erro ao salvar estatísticas:', error);
        }
    } else {
        console.log('ℹ️ Usuário não autenticado - estatísticas não salvas');
    }
    
    // Mostrar modal
    if (isWin) {
        this.gameStatus.textContent = "Vitória! 🏆";
        this.gameStatus.className = "stat-value status-win";
        this.modalIcon.textContent = "🏆";
        this.modalTitle.textContent = "Parabéns!";
        this.modalMessage.textContent = "Você solucionou o tabuleiro com maestria lógica!";
    } else {
        this.gameStatus.textContent = "Derrota";
        this.gameStatus.className = "stat-value status-over";
        this.modalIcon.textContent = "💔";
        this.modalTitle.textContent = "Fim de Jogo!";
        this.modalMessage.textContent = `Você esgotou seu limite de ${this.maxErrors === Infinity ? 'erros' : this.maxErrors + ' erro(s)'}.`;
    }
    this.modalOverlay.classList.add('active');
};

// ===== Render Stats (completo) =====
SudokuUI.prototype._renderStatsFull = function(data) {
    console.log('📊 _renderStatsFull chamado com:', data);
    
    if (!data || !data.stats) {
        console.warn('⚠️ Dados inválidos:', data);
        return;
    }
    
    const stats = data.stats;
    console.log('📊 Stats:', stats);
    
    const total = stats.totalGames || 1;
    const winRate = Math.round((stats.totalWins / total) * 100);
    
    console.log('📊 Win Rate:', winRate, '%');
    console.log('📊 Current Streak:', stats.currentStreak);
    console.log('📊 Best Streak:', stats.bestStreak);
    console.log('📊 Avg Time:', stats.averageTime);
    
    const winRateEl = document.getElementById('win-rate');
    const currentStreakEl = document.getElementById('current-streak');
    const bestStreakEl = document.getElementById('best-streak');
    const avgTimeEl = document.getElementById('avg-time');
    const diffContainer = document.getElementById('difficulty-stats');
    const historyContainer = document.getElementById('history-list');

    if (winRateEl) {
        winRateEl.textContent = `${winRate}%`;
        console.log('✅ win-rate atualizado');
    }
    if (currentStreakEl) {
        currentStreakEl.textContent = stats.currentStreak;
        console.log('✅ current-streak atualizado');
    }
    if (bestStreakEl) {
        bestStreakEl.textContent = stats.bestStreak;
        console.log('✅ best-streak atualizado');
    }
    if (avgTimeEl) {
        avgTimeEl.textContent = this._formatTime(stats.averageTime || 0);
        console.log('✅ avg-time atualizado');
    }

    // Renderizar por dificuldade
    if (diffContainer) {
        diffContainer.innerHTML = '';
        const difficultyNames = {
            facil: 'Fácil',
            medio: 'Médio',
            dificil: 'Difícil',
            especialista: 'Especialista',
            genio: 'Gênio'
        };

        Object.entries(stats.byDifficulty || {}).forEach(([key, value]) => {
            const div = document.createElement('div');
            div.className = 'diff-stat';
            const games = value.games || 1;
            const winRateDiff = Math.round((value.wins / games) * 100);
            div.innerHTML = `
                <div class="diff-name">${difficultyNames[key] || key}</div>
                <div class="diff-winrate">${winRateDiff}%</div>
                <div style="font-size:0.6rem;color:var(--muted)">${value.games} jogos</div>
            `;
            diffContainer.appendChild(div);
        });
        console.log('✅ difficulty-stats atualizado');
    }

    // Renderizar histórico
    if (historyContainer) {
        historyContainer.innerHTML = '';
        const history = data.history || [];
        history.slice(0, 10).forEach(game => {
            const div = document.createElement('div');
            div.className = 'history-item';
            const resultClass = game.result === 'win' ? 'result-win' : 'result-loss';
            const resultText = game.result === 'win' ? '✅ Vitória' : '❌ Derrota';
            div.innerHTML = `
                <span>${game.difficulty}</span>
                <span class="${resultClass}">${resultText}</span>
                <span>${this._formatTime(game.time)}</span>
            `;
            historyContainer.appendChild(div);
        });
        console.log('✅ history-list atualizado');
    }
    
    console.log('📊 Renderização completa!');
};

SudokuUI.prototype._formatTime = function(seconds) {
    const mins = String(Math.floor(seconds / 60)).padStart(2, '0');
    const secs = String(seconds % 60).padStart(2, '0');
    return `${mins}:${secs}`;
};

// ============================================================
// INIT - Instanciar a UI quando o DOM estiver pronto
// ============================================================

console.log('📦 SudokuUI Part 2 carregado, aguardando DOM...');

function initSudokuUI() {
    console.log('🚀 Inicializando SudokuUI...');
    try {
        if (typeof SudokuUI === 'undefined') {
            console.error('❌ SudokuUI não está definido!');
            return;
        }
        if (window.sudokuUI) {
            console.log('ℹ️ SudokuUI já instanciado');
            return;
        }
        window.sudokuUI = new SudokuUI();
        console.log('✅ SudokuUI instanciado com sucesso!');
    } catch (error) {
        console.error('❌ Erro ao instanciar SudokuUI:', error);
    }
}

// Verificar se o DOM já está carregado
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSudokuUI);
} else {
    setTimeout(initSudokuUI, 100);
}