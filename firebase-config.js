// ============================================================
// firebase-config.js
// Cole aqui as chaves do seu projeto Firebase.
// Este arquivo NÃO deve ser commitado com chaves reais.
// Adicione ao .gitignore se usar chaves de produção.
// ============================================================

const firebaseConfig = {
    apiKey: "COLE_SUA_API_KEY",
    authDomain: "COLE_SEU_AUTH_DOMAIN",
    projectId: "COLE_SEU_PROJECT_ID",
    storageBucket: "COLE_SEU_STORAGE_BUCKET",
    messagingSenderId: "COLE_SEU_MESSAGING_SENDER_ID",
    appId: "COLE_SEU_APP_ID"
};

firebase.initializeApp(firebaseConfig);
