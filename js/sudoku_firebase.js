// ============================================================
// PARTE 2 - FIREBASE INTEGRATION
// ============================================================

class FirebaseManager {
    constructor() {
        this.auth = null;
        this.db = null;
        this.currentUser = null;
        this.isInitialized = false;
    }

    initialize(config) {
        if (this.isInitialized) return;
        
        if (typeof firebase === 'undefined') {
            console.error('❌ Firebase não carregado');
            return;
        }

        try {
            if (!firebase.apps.length) {
                firebase.initializeApp(config);
                console.log('🔥 Firebase inicializado!');
            } else {
                console.log('ℹ️ Firebase já inicializado');
            }
            
            this.auth = firebase.auth();
            this.db = firebase.firestore();
            this.isInitialized = true;
            console.log('✅ Firebase Manager pronto!');
        } catch (error) {
            console.error('❌ Erro ao inicializar Firebase:', error);
        }
    }

    async loginWithGoogle() {
        try {
            const provider = new firebase.auth.GoogleAuthProvider();
            provider.setCustomParameters({ prompt: 'select_account' });
            const result = await this.auth.signInWithPopup(provider);
            this.currentUser = result.user;
            await this._ensureUserDocument(result.user);
            return result.user;
        } catch (error) {
            console.error('❌ Erro no login:', error);
            throw error;
        }
    }

    async logout() {
        try {
            await this.auth.signOut();
            this.currentUser = null;
            console.log('👋 Logout realizado');
        } catch (error) {
            console.error('❌ Erro no logout:', error);
            throw error;
        }
    }

    async _ensureUserDocument(user) {
        if (!this.db) return;
        
        const userRef = this.db.collection('users').doc(user.uid);
        const doc = await userRef.get();
        
        if (!doc.exists) {
            const initialData = {
                displayName: user.displayName || 'Jogador',
                email: user.email,
                photoURL: user.photoURL || '',
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                stats: {
                    totalGames: 0,
                    totalWins: 0,
                    totalLosses: 0,
                    bestStreak: 0,
                    currentStreak: 0,
                    totalTime: 0,
                    averageTime: 0,
                    byDifficulty: {
                        facil: { wins: 0, losses: 0, bestTime: 0, games: 0 },
                        medio: { wins: 0, losses: 0, bestTime: 0, games: 0 },
                        dificil: { wins: 0, losses: 0, bestTime: 0, games: 0 },
                        especialista: { wins: 0, losses: 0, bestTime: 0, games: 0 },
                        genio: { wins: 0, losses: 0, bestTime: 0, games: 0 }
                    }
                },
                history: []
            };
            await userRef.set(initialData);
            console.log('📝 Documento do usuário criado!');
        }
        return userRef;
    }

    async updateStats(uid, gameData) {
        if (!this.db) return null;

        try {
            const userRef = this.db.collection('users').doc(uid);
            const doc = await userRef.get();
            
            if (!doc.exists) return null;

            const data = doc.data();
            const stats = data.stats;
            const difficulty = gameData.difficulty;
            const isWin = gameData.result === 'win';

            stats.totalGames += 1;
            if (isWin) {
                stats.totalWins += 1;
                stats.currentStreak += 1;
                stats.bestStreak = Math.max(stats.bestStreak, stats.currentStreak);
            } else {
                stats.totalLosses += 1;
                stats.currentStreak = 0;
            }

            stats.totalTime += gameData.time;
            stats.averageTime = Math.round(stats.totalTime / stats.totalGames);

            const diffStats = stats.byDifficulty[difficulty];
            diffStats.games += 1;
            if (isWin) {
                diffStats.wins += 1;
                if (gameData.time < diffStats.bestTime || diffStats.bestTime === 0) {
                    diffStats.bestTime = gameData.time;
                }
            } else {
                diffStats.losses += 1;
            }

            const history = data.history || [];
            history.unshift({
                difficulty: difficulty,
                result: isWin ? 'win' : 'loss',
                time: gameData.time,
                errors: gameData.errors,
                clues: gameData.clues,
                date: firebase.firestore.FieldValue.serverTimestamp()
            });
            if (history.length > 50) history.pop();

            await userRef.update({ stats, history });
            console.log('📊 Estatísticas salvas!');
            return { stats, history };
        } catch (error) {
            console.error('❌ Erro ao salvar stats:', error);
            return null;
        }
    }

    async getUserData(uid) {
        if (!this.db) return null;

        try {
            const userRef = this.db.collection('users').doc(uid);
            const doc = await userRef.get();
            return doc.exists ? doc.data() : null;
        } catch (error) {
            console.error('❌ Erro ao buscar dados:', error);
            return null;
        }
    }

    onAuthStateChanged(callback) {
        if (this.auth) {
            this.auth.onAuthStateChanged(async (user) => {
                this.currentUser = user;
                if (user) {
                    await this._ensureUserDocument(user);
                }
                callback(user);
            });
        }
    }

    isAuthenticated() {
        return this.currentUser !== null;
    }

    getUserId() {
        return this.currentUser ? this.currentUser.uid : null;
    }
}

window.FirebaseManager = FirebaseManager;
console.log('📦 FirebaseManager carregado!');