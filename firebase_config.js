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

// Exportar para uso global (NÃO inicializar aqui!)
window.firebaseConfig = firebaseConfig;
console.log('📦 firebaseConfig carregado!');