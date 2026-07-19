// ============================================================
// FIREBASE CONFIG - Sudoku Studio
// ============================================================

const firebaseConfig = {
    apiKey: "AIzaSyCFBkHPbK1jnC1Tq9HtSWpAVhA0NSICd94",
    authDomain: "sudoku-studio-d600f.firebaseapp.com",
    projectId: "sudoku-studio-d600f",
    storageBucket: "sudoku-studio-d600f.firebasestorage.app",
    messagingSenderId: "1039085979567",
    appId: "1:1039085979567:web:19eca98195f4c61242915a"
};

// INICIALIZAR O FIREBASE AQUI (antes de qualquer outro script)
if (typeof firebase !== 'undefined') {
    // Verifica se já existe um app inicializado
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
        console.log('🔥 Firebase inicializado com sucesso!');
    } else {
        console.log('ℹ️ Firebase já estava inicializado');
    }
} else {
    console.error('❌ Firebase não carregado! Verifique os scripts CDN.');
}

// Exportar para uso global
window.firebaseConfig = firebaseConfig;
console.log('📦 firebaseConfig carregado!');
console.log('🌐 Domínio:', window.location.origin);