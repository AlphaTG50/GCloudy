import { initializeApp } from "https://www.gstatic.com/firebasejs/11.7.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.7.1/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/11.7.1/firebase-firestore.js";

// Firebase Konfiguration
const firebaseConfig = {
    apiKey: "AIzaSyCUwM57VBYF4MOhLljCFHZBGi7e7zHhR70",
    authDomain: "gcloudy-50.firebaseapp.com",
    projectId: "gcloudy-50",
    storageBucket: "gcloudy-50.appspot.com",
    messagingSenderId: "347620186784",
    appId: "1:347620186784:web:b0fca6b0a346614a0187c5",
    measurementId: "G-Y0ZSV8K3R2"
};

// Firebase Initialisieren
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

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
    const docRef = doc(db, 'whitelist', key);
    const docSnap = await getDoc(docRef);
    return docSnap.exists();
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
    const docRef = doc(db, 'blockedDevices', deviceId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return docSnap.data();
    } else {
        return { attempts: 0 };
    }
}

// Gerät blockieren
async function blockDevice(deviceId) {
    const blockUntil = Date.now() + BLOCK_TIME_MS;
    await setDoc(doc(db, 'blockedDevices', deviceId), {
        attempts: MAX_ATTEMPTS,
        blockUntil: blockUntil
    });
}

// Gerät entsperren
async function unblockDevice(deviceId) {
    await deleteDoc(doc(db, 'blockedDevices', deviceId));
}

// Button sperren
function disableLoginButton() {
    const button = document.querySelector('#login-form button[type="submit"]');
    if (button) {
        button.disabled = true;
        button.style.opacity = "0.5";
        button.style.cursor = "not-allowed";
    }
}

// Button freigeben
function enableLoginButton() {
    const button = document.querySelector('#login-form button[type="submit"]');
    if (button) {
        button.disabled = false;
        button.style.opacity = "1";
        button.style.cursor = "pointer";
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

    // Prüfen ob Gerät gesperrt ist
    if (deviceStatus.blockUntil && Date.now() < deviceStatus.blockUntil) {
        errorDiv.textContent = 'Zu viele Fehlversuche. Bitte warten Sie 10 Minuten.';
        disableLoginButton();
        return;
    }

    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        // Bei erfolgreichem Login: Sperrung aufheben
        await unblockDevice(deviceId);
        window.location.href = 'main.html';
    } catch (error) {
        errorDiv.textContent = 'Falsche Zugangsdaten.';
        
        // Fehlversuche zählen und ggf. sperren
        const currentAttempts = deviceStatus.attempts || 0;
        const newAttempts = currentAttempts + 1;

        if (newAttempts >= MAX_ATTEMPTS) {
            await blockDevice(deviceId);
            disableLoginButton();
            errorDiv.textContent = 'Zu viele Fehlversuche. Bitte warten Sie 10 Minuten.';
        } else {
            await setDoc(doc(db, 'blockedDevices', deviceId), { 
                attempts: newAttempts,
                blockUntil: null
            });
        }
    }
});

// Beim Start prüfen ob Gerät gesperrt ist
(async function checkDeviceOnStart() {
    const deviceId = getDeviceId();
    const deviceStatus = await getDeviceStatus(deviceId);

    if (deviceStatus.blockUntil && Date.now() < deviceStatus.blockUntil) {
        disableLoginButton();
        const errorDiv = document.getElementById('login-error');
        errorDiv.textContent = 'Zu viele Fehlversuche. Bitte warten Sie 10 Minuten.';
    } else if (deviceStatus.blockUntil && Date.now() >= deviceStatus.blockUntil) {
        await unblockDevice(deviceId);
        enableLoginButton();
    }
})();

// Dark Mode Logik
function setDarkmode(active) {
    document.body.classList.toggle('darkmode', active);
    document.body.classList.toggle('lightmode', !active);
    localStorage.setItem('gcloudy_darkmode', active ? '1' : '0');
}

// Dark Mode Status beim Laden wiederherstellen
const savedDark = localStorage.getItem('gcloudy_darkmode');
if (savedDark === '1') setDarkmode(true);
else setDarkmode(false);

// Logo als Dark Mode Toggle
const logo = document.querySelector('.logo');
if (logo) {
    logo.style.cursor = 'pointer';
    logo.addEventListener('click', () => {
        setDarkmode(!document.body.classList.contains('darkmode'));
    });
}