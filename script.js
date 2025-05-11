import { initializeApp } from "https://www.gstatic.com/firebasejs/11.7.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.7.1/firebase-auth.js";
import { getDatabase, ref, get, set, remove } from "https://www.gstatic.com/firebasejs/11.7.1/firebase-database.js";

// Firebase Konfiguration
const firebaseConfig = {
    apiKey: "AIzaSyCUwM57VBYF4MOhLljCFHZBGi7e7zHhR70",
    authDomain: "gcloudy-50.firebaseapp.com",
    projectId: "gcloudy-50",
    storageBucket: "gcloudy-50.appspot.com",
    messagingSenderId: "347620186784",
    appId: "1:347620186784:web:b0fca6b0a346614a0187c5",
    measurementId: "G-Y0ZSV8K3R2",
    databaseURL: "https://gcloudy-50-default-rtdb.europe-west1.firebasedatabase.app/"
};

// Firebase Initialisieren
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

// Maximal erlaubte Fehlversuche
const MAX_ATTEMPTS = 5;
const BLOCK_TIME_MS = 10 * 60 * 1000; // 10 Minuten in Millisekunden

// Hilfsfunktion für Whitelist
function emailToKey(email) {
    return email.replace(/\./g, ',');
}

// Whitelist überprüfen
async function checkWhitelist(email) {
    const key = emailToKey(email);
    const snapshot = await get(ref(db, 'whitelist/' + key));
    return snapshot.exists();
}

// Gerät-ID generieren (oder laden)
function getDeviceId() {
    let deviceId = localStorage.getItem('deviceId');
    if (!deviceId) {
        deviceId = 'device-' + Math.random().toString(36).substr(2, 16);
        localStorage.setItem('deviceId', deviceId);
    }
    return deviceId;
}

// Gerätestatus abrufen
async function getDeviceStatus(deviceId) {
    const snapshot = await get(ref(db, 'blockedDevices/' + deviceId));
    if (snapshot.exists()) {
        return snapshot.val();
    } else {
        return { attempts: 0 };
    }
}

// Gerät blockieren
async function blockDevice(deviceId) {
    const blockUntil = Date.now() + BLOCK_TIME_MS;
    await set(ref(db, 'blockedDevices/' + deviceId), {
        attempts: MAX_ATTEMPTS,
        blockUntil: blockUntil
    });
}

// Gerät entsperren
async function unblockDevice(deviceId) {
    await remove(ref(db, 'blockedDevices/' + deviceId));
}

// Button sperren
function disableLoginButton() {
    const button = document.querySelector('#login-form button[type="submit"]');
    if (button) {
        button.disabled = true;
        button.style.opacity = "0.5"; // Durchsichtiger
        button.style.cursor = "not-allowed"; // Cursor ändern
    }
}

// Button freigeben
function enableLoginButton() {
    const button = document.querySelector('#login-form button[type="submit"]');
    if (button) {
        button.disabled = false;
        button.style.opacity = "1"; // Voll sichtbar
        button.style.cursor = "pointer"; // Normaler Cursor
    }
}

// E-Mail/Passwort Anmeldung
document.getElementById('login-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    const errorDiv = document.getElementById('login-error');
    errorDiv.textContent = '';

    const deviceId = getDeviceId();
    const deviceStatus = await getDeviceStatus(deviceId);

    // Check ob blockiert
    if (deviceStatus.blockUntil && Date.now() < deviceStatus.blockUntil) {
        errorDiv.textContent = 'Dieses Gerät ist gesperrt. Bitte warte ein paar Minuten.';
        disableLoginButton();
        return;
    } else if (deviceStatus.blockUntil && Date.now() >= deviceStatus.blockUntil) {
        // Blockzeit abgelaufen → Gerät entsperren
        await unblockDevice(deviceId);
        enableLoginButton();
    }

    try {
        const whitelisted = await checkWhitelist(email);
        if (!whitelisted) {
            errorDiv.textContent = 'Anmeldung fehlgeschlagen. (Nicht auf Whitelist)';
            return;
        }

        await signInWithEmailAndPassword(auth, email, password);

        // Erfolgreich → Gerät freigeben
        await unblockDevice(deviceId);
        enableLoginButton();
        window.location.href = 'main.html';

    } catch (err) {
        let errorMessage = err.message;
        if (err.code === 'auth/too-many-requests') {
            errorMessage = 'Zu viele Anmeldeversuche. Bitte versuche es später erneut.';
        } else {
            errorMessage = 'Anmeldung fehlgeschlagen.';
        }

        const currentAttempts = deviceStatus.attempts || 0;
        const newAttempts = currentAttempts + 1;

        if (newAttempts >= MAX_ATTEMPTS) {
            await blockDevice(deviceId);
            disableLoginButton();
            errorDiv.textContent = 'Zu viele Fehlversuche. Gerät gesperrt für 10 Minuten.';
        } else {
            await set(ref(db, 'blockedDevices/' + deviceId), { attempts: newAttempts });
            errorDiv.textContent = errorMessage;
        }
    }
});

// Beim Start checken ob Gerät gesperrt
(async function checkDeviceOnStart() {
    const deviceId = getDeviceId();
    const deviceStatus = await getDeviceStatus(deviceId);

    if (deviceStatus.blockUntil && Date.now() < deviceStatus.blockUntil) {
        disableLoginButton();
    } else if (deviceStatus.blockUntil && Date.now() >= deviceStatus.blockUntil) {
        await unblockDevice(deviceId);
        enableLoginButton();
    }
})();
