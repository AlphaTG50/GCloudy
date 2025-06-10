// Firebase Konfiguration
const firebaseConfig = {
    apiKey: "AIzaSyCUwM57VBYF4MOhLljCFHZBGi7e7zHhR70",
    authDomain: "gcloudy-50.firebaseapp.com",
    databaseURL: "https://gcloudy-50-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "gcloudy-50",
    storageBucket: "gcloudy-50.firebasestorage.app",
    messagingSenderId: "347620186784",
    appId: "1:347620186784:web:b0fca6b0a346614a0187c5",
    measurementId: "G-Y0ZSV8K3R2"
};

// Firebase SDK imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.9.0/firebase-analytics.js";
import { getAuth, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/11.9.0/firebase-auth.js";

// Firebase initialisieren
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);

document.addEventListener('DOMContentLoaded', () => {
    const MAX_LOGIN_ATTEMPTS = 3;
    const COOLDOWN_TIME_SECONDS = 60;

    const firebaseLoginForm = document.getElementById('firebaseLoginFormFullPage');
    const emailInput = document.getElementById('emailFullPage');
    const passwordInput = document.getElementById('passwordFullPage');
    const loginBtn = document.getElementById('loginBtnFullPage');
    const authErrorMessage = document.getElementById('authErrorMessageFullPage');
    const guestLoginBtn = document.getElementById('guestLoginBtn');

    let loginAttempts = parseInt(localStorage.getItem('fullPageLoginAttempts')) || 0;
    let cooldownEndTime = parseInt(localStorage.getItem('fullPageCooldownEndTime')) || 0;

    function updateLoginButtonState() {
        const currentTime = Math.floor(Date.now() / 1000);
        if (cooldownEndTime > currentTime) {
            const timeLeft = cooldownEndTime - currentTime;
            loginBtn.disabled = true;
            authErrorMessage.textContent = `Zu viele fehlgeschlagene Versuche. Bitte versuchen Sie es in ${timeLeft} Sekunden erneut.`;
            authErrorMessage.style.display = 'block';
            setTimeout(updateLoginButtonState, 1000);
        } else {
            loginBtn.disabled = false;
            if (authErrorMessage.textContent.includes('fehlgeschlagene Versuche')) {
                authErrorMessage.textContent = '';
                authErrorMessage.style.display = 'none';
            }
            if (loginAttempts >= MAX_LOGIN_ATTEMPTS) {
                loginAttempts = 0;
                localStorage.setItem('fullPageLoginAttempts', 0);
                localStorage.removeItem('fullPageCooldownEndTime');
            }
        }
    }

    updateLoginButtonState();

    if (firebaseLoginForm) {
        firebaseLoginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            console.log('Login-Versuch gestartet...');

            authErrorMessage.textContent = '';
            authErrorMessage.style.display = 'none';

            const currentTime = Math.floor(Date.now() / 1000);
            if (cooldownEndTime > currentTime) {
                updateLoginButtonState();
                return;
            }

            const email = emailInput.value;
            const password = passwordInput.value;

            try {
                console.log('Versuche Login mit E-Mail:', email);
                const userCredential = await signInWithEmailAndPassword(auth, email, password);
                console.log('Login erfolgreich für:', userCredential.user.email);
                
                localStorage.setItem('loggedIn', 'true');
                localStorage.setItem('userEmail', email);
                
                if (email === 'guerkan.privat@gmail.com') {
                    console.log('Admin-Login erkannt');
                    localStorage.setItem('adminLoggedIn', 'true');
                } else {
                    localStorage.removeItem('adminLoggedIn');
                }
                
                loginAttempts = 0;
                localStorage.setItem('fullPageLoginAttempts', 0);
                localStorage.removeItem('fullPageCooldownEndTime');
                
                console.log('Weiterleitung zu main.html...');
                window.location.href = 'main.html';
            } catch (error) {
                console.error("Login Fehler:", error);
                loginAttempts++;
                localStorage.setItem('fullPageLoginAttempts', loginAttempts);

                if (loginAttempts >= MAX_LOGIN_ATTEMPTS) {
                    cooldownEndTime = currentTime + COOLDOWN_TIME_SECONDS;
                    localStorage.setItem('fullPageCooldownEndTime', cooldownEndTime);
                }

                if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
                    authErrorMessage.textContent = 'Ungültige E-Mail oder falsches Passwort.';
                } else if (error.code === 'auth/invalid-email') {
                    authErrorMessage.textContent = 'Die E-Mail-Adresse ist nicht gültig.';
                } else {
                    authErrorMessage.textContent = 'Anmeldung fehlgeschlagen. Bitte versuchen Sie es erneut.';
                }
                authErrorMessage.style.display = 'block';
                updateLoginButtonState();
            }
        });
    }

    if (guestLoginBtn) {
        guestLoginBtn.addEventListener('click', () => {
            localStorage.setItem('loggedIn', 'true');
            localStorage.setItem('userEmail', 'guest');
            window.location.href = 'main.html';
        });
    }
}); 