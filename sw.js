// ============================================================
// SERVICE WORKER - Sudoku Studio
// ============================================================

const CACHE_NAME = 'sudoku-studio-v1';
const ASSETS = [
    '/sudoku-studio/',
    '/sudoku-studio/index.html',
    '/sudoku-studio/sudoku_studio.css',
    '/sudoku-studio/modal.css',
    '/sudoku-studio/firebase_config.js',
    '/sudoku-studio/js/sudoku_engine.js',
    '/sudoku-studio/js/sudoku_firebase.js',
    '/sudoku-studio/js/sudoku_ui_part1.js',
    '/sudoku-studio/js/sudoku_ui_part2.js',
    '/sudoku-studio/manifest.json',
    '/sudoku-studio/icons/icon-192.png',
    '/sudoku-studio/icons/icon-512.png'
];

// ===== INSTALAÇÃO =====
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('📦 Cache aberto');
                return cache.addAll(ASSETS);
            })
            .then(() => {
                console.log('✅ Arquivos cacheados com sucesso!');
                return self.skipWaiting();
            })
            .catch(error => {
                console.error('❌ Erro ao adicionar ao cache:', error);
            })
    );
});

// ===== ATIVAÇÃO =====
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cache => {
                    if (cache !== CACHE_NAME) {
                        console.log('🗑️ Removendo cache antigo:', cache);
                        return caches.delete(cache);
                    }
                })
            );
        })
        .then(() => {
            console.log('✅ Service Worker ativado!');
            return self.clients.claim();
        })
    );
});

// ===== INTERCEPTAÇÃO DE REQUISIÇÕES =====
self.addEventListener('fetch', event => {
    const request = event.request;
    
    // IGNORAR requisições POST, PUT, DELETE (não cachear)
    if (request.method !== 'GET') {
        return event.respondWith(fetch(request));
    }
    
    // IGNORAR requisições para Firebase (auth, firestore)
    if (request.url.includes('firebase') || 
        request.url.includes('googleapis') ||
        request.url.includes('gstatic.com')) {
        return event.respondWith(fetch(request));
    }
    
    // IGNORAR requisições de extensões
    if (request.url.startsWith('chrome-extension://')) {
        return event.respondWith(fetch(request));
    }
    
    // ESTRATÉGIA: Cache First, depois Network
    event.respondWith(
        caches.match(request)
            .then(cachedResponse => {
                if (cachedResponse) {
                    return cachedResponse;
                }
                
                return fetch(request)
                    .then(response => {
                        // Só cachear respostas bem-sucedidas
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }
                        
                        const responseToCache = response.clone();
                        caches.open(CACHE_NAME)
                            .then(cache => {
                                try {
                                    cache.put(request, responseToCache);
                                } catch (error) {
                                    console.warn('⚠️ Não foi possível cachear:', request.url);
                                }
                            });
                        
                        return response;
                    })
                    .catch(() => {
                        // Fallback para páginas offline
                        if (request.headers.get('accept').includes('text/html')) {
                            return caches.match('/sudoku-studio/index.html');
                        }
                    });
            })
    );
});

// ===== MENSAGENS =====
self.addEventListener('message', event => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});