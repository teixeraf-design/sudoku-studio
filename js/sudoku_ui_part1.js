// ============================================================
// PARTE 3A - SUDOKU UI (Construtor e Métodos Básicos)
// ============================================================

class SudokuUI {
    constructor() {
        // ===== DOM refs =====
        this.gridEl = document.getElementById('sudoku-grid');
        this.cluesSlider = document.getElementById('clues-slider');
        this.cluesVal = document.getElementById('clues-val');
        this.difficultyPreset = document.getElementById('difficulty-preset');
        this.errorsPreset = document.getElementById('errors-preset');
        this.errorsCounter = document.getElementById('errors-counter');
        this.gameStatus = document.getElementById('game-status');
        this.btnNewGame = document.getElementById('btn-new-game');
        this.modalOverlay = document.getElementById('modal-overlay');
        this.modalIcon = document.getElementById('modal-icon');
        this.modalTitle = document.getElementById('modal-title');
        this.modalMessage = document.getElementById('modal-message');
        this.modalBtn = document.getElementById('modal-btn-restart');
        this.keyBtns = document.querySelectorAll('.key-btn');
        this.scrollBtn = document.getElementById('btn-scroll-to-controls');

        // Timer DOM refs
        this.timerDisplay = document.getElementById('timer-display');
        this.timerPauseBtn = document.getElementById('timer-pause-btn');
        this.timerResetBtn = document.getElementById('timer-reset-btn');
        this.pauseIcon = document.getElementById('pause-icon');

        // Overlay DOM refs
        this.gridOverlay = document.getElementById('grid-overlay');
        this.boardFrame = document.querySelector('.board-frame');
        this.gridWrapper = document.querySelector('.grid-wrapper');

        // ===== Firebase =====
        this.firebase = null;
        this.isAuthenticated = false;
        this.userData = null;

        // ===== State =====
        this.solution = [];
        this.puzzle = [];
        this.cluesMask = [];
        this.selectedIdx = null;
        this.errors = 0;
        this.maxErrors = 5;
        this.isGameOver = false;
        this.isErrorPending = false;
        this.isFirstLoad = true;
        this.isIdle = true;
        this.isControlsReady = false;

        // Timer state
        this.timerSeconds = 0;
        this.timerInterval = null;
        this.isPaused = false;

        this.difficultyMap = {
            'facil': 43,
            'medio': 37,
            'dificil': 32,
            'especialista': 26,
            'genio': 20
        };

        this.difficultyErrorsMap = {
            'facil': 12,
            'medio': 8,
            'dificil': 6,
            'especialista': 4,
            'genio': 2
        };

        // ===== Inicialização =====
        this._initFirebase();
        this._bindEvents();
        this._initIdleMode();
        this._resetControlsToEmpty();
        
        console.log('✅ SudokuUI inicializado!');
    }

    // ===== Firebase =====
    _initFirebase() {
        if (typeof FirebaseManager !== 'undefined') {
            this.firebase = new FirebaseManager();
            
            if (typeof firebaseConfig !== 'undefined') {
                this.firebase.initialize(firebaseConfig);
                
                this.firebase.onAuthStateChanged((user) => {
                    console.log('🔐 Auth state changed:', user ? user.email : 'null');
                    if (user) {
                        this._onUserLoggedIn(user);
                    } else {
                        this._showAuthModal();
                        this.isAuthenticated = false;
                        this._updateUIForGuest();
                    }
                });
            } else {
                console.warn('⚠️ firebaseConfig não encontrado. Login desativado.');
            }
        } else {
            console.warn('⚠️ FirebaseManager não encontrado. Login desativado.');
        }
    }

    // ===== Auth UI Methods =====
    _onUserLoggedIn(user) {
        this.isAuthenticated = true;
        this._closeAuthModal();
        this._updateUIForUser(user);
        
        console.log('👤 Usuário logado:', user.email);
        console.log('📊 Carregando estatísticas do usuário...');
        
        // 🔥 FORÇAR CARREGAMENTO DAS ESTATÍSTICAS
        this._loadUserStats(user.uid);
    }

    _updateUIForUser(user) {
        const avatar = document.getElementById('user-avatar');
        const name = document.getElementById('user-name');
        const email = document.getElementById('user-email');
        const panel = document.getElementById('stats-panel');

        if (avatar) avatar.src = user.photoURL || '';
        if (name) name.textContent = user.displayName || 'Jogador';
        if (email) email.textContent = user.email;
        if (panel) panel.classList.add('visible');
    }

    _updateUIForGuest() {
        const panel = document.getElementById('stats-panel');
        if (panel) panel.classList.remove('visible');
        
        const avatar = document.getElementById('user-avatar');
        const name = document.getElementById('user-name');
        const email = document.getElementById('user-email');
        if (avatar) avatar.src = '';
        if (name) name.textContent = 'Convidado';
        if (email) email.textContent = 'guest@sudoku.studio';
    }

    async _loadUserStats(uid) {
        if (!this.firebase) {
            console.warn('⚠️ Firebase não disponível');
            return;
        }
        
        console.log('📊 Buscando dados do usuário:', uid);
        
        try {
            const data = await this.firebase.getUserData(uid);
            console.log('📊 Dados recebidos:', data);
            
            if (data) {
                this.userData = data;
                console.log('📊 Renderizando estatísticas...');
                this._renderStats(data);
            } else {
                console.warn('⚠️ Nenhum dado encontrado para o usuário');
            }
        } catch (error) {
            console.error('❌ Erro ao carregar stats:', error);
        }
    }

    _renderStats(data) {
        console.log('📊 _renderStats chamado');
        if (typeof this._renderStatsFull === 'function') {
            console.log('📊 Chamando _renderStatsFull...');
            this._renderStatsFull(data);
        } else {
            console.warn('⚠️ _renderStatsFull não está definido!');
        }
    }

    _showAuthModal() {
        const modal = document.getElementById('auth-modal');
        if (modal) modal.classList.add('active');
    }

    _closeAuthModal() {
        const modal = document.getElementById('auth-modal');
        if (modal) modal.classList.remove('active');
    }

    // ===== Reset Controls to Empty =====
    _resetControlsToEmpty() {
        this.difficultyPreset.value = '';
        this.difficultyPreset.classList.add('empty');
        this.errorsPreset.value = '';
        this.errorsPreset.classList.add('empty');
        this.cluesSlider.value = 37;
        this.cluesSlider.disabled = true;
        this.cluesVal.textContent = '—';
        this.cluesVal.classList.add('empty');
        this.isControlsReady = false;
    }

    // ===== Check if controls are ready =====
    _areControlsReady() {
        const difficultySelected = this.difficultyPreset.value !== '';
        const errorsSelected = this.errorsPreset.value !== '';
        return difficultySelected && errorsSelected;
    }

    // ===== Inicialização em modo idle =====
    _initIdleMode() {
        this.isIdle = true;
        this.isGameOver = false;
        this.isPaused = false;
        
        if (this.boardFrame) {
            this.boardFrame.classList.add('idle');
        }
        
        if (this.gridOverlay) {
            this.gridOverlay.classList.remove('hidden');
        }
        
        this.timerDisplay.textContent = '00:00';
        this.pauseIcon.textContent = '⏸';
        this.timerPauseBtn.classList.remove('paused');
        this.timerDisplay.classList.remove('paused');
        
        this.gameStatus.textContent = "Aguardando";
        this.gameStatus.className = "stat-value status-idle";
        
        this.errors = 0;
        this.errorsCounter.textContent = '0 / ∞';
        
        this.gridEl.innerHTML = '';
        this.selectedIdx = null;
        
        this._resetControlsToEmpty();
    }

    // ===== Scroll Methods =====
    _scrollToControls() {
        const controlsPanel = document.querySelector('.controls-panel');
        const difficultySelect = document.getElementById('difficulty-preset');
        
        if (controlsPanel) {
            controlsPanel.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
            
            setTimeout(() => {
                if (difficultySelect) {
                    difficultySelect.focus();
                    if (difficultySelect.select) {
                        difficultySelect.select();
                    }
                }
            }, 400);
        }
    }

    _scrollToTop() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }

    // ===== Reset =====
    _resetGame() {
        if (this.modalOverlay) {
            this.modalOverlay.classList.remove('active');
        }
        
        this._stopTimer();
        this._initIdleMode();
        this._scrollToTop();
        
        if (this.boardFrame) {
            this.boardFrame.classList.remove('paused');
        }
        
        this.gridEl.innerHTML = '';
        console.log('🔄 Jogo resetado para o estado inicial');
    }

    // ===== Controls Warning =====
    _showControlsWarning() {
        const controls = [this.difficultyPreset, this.errorsPreset];
        controls.forEach(ctrl => {
            if (ctrl.value === '') {
                ctrl.style.borderColor = '#e2635a';
                ctrl.style.boxShadow = '0 0 0 3px rgba(226, 99, 90, 0.3)';
                setTimeout(() => {
                    ctrl.style.borderColor = '';
                    ctrl.style.boxShadow = '';
                }, 1500);
            }
        });
        
        this.gameStatus.textContent = "⚠️";
        this.gameStatus.className = "stat-value status-idle";
        
        setTimeout(() => {
            if (this.isIdle) {
                this.gameStatus.textContent = "Aguardando";
                this.gameStatus.className = "stat-value status-idle";
            }
        }, 2000);
    }
}

// Exportar para uso global
window.SudokuUI = SudokuUI;
console.log('📦 SudokuUI Part 1 carregado!');