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
import { getFirestore, collection, getDocs, addDoc, updateDoc, deleteDoc, doc, getDoc, setDoc, query, orderBy } from "https://www.gstatic.com/firebasejs/11.9.0/firebase-firestore.js";
import { getAuth, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.9.0/firebase-auth.js";

// Firebase initialisieren
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);
const auth = getAuth(app);

// Sofortige Authentifizierungsprüfung
onAuthStateChanged(auth, (user) => {
    // Prüfe auf Gast-Login oder authentifizierten Benutzer
    if (!user && localStorage.getItem('loggedIn') !== 'true') {
        // Wenn kein Benutzer angemeldet ist und kein Gast-Login, zur Login-Seite umleiten
        window.location.href = 'index.html';
        return;
    }
});

// Debug-Logging aktivieren
console.log('Firebase initialisiert');

// Globale Funktionen für QR Code
window.showQRCode = function(url) {
    const modal = document.getElementById('qrModal');
    const qrContainer = document.getElementById('qrCodeContainer');
    const qrUrl = document.getElementById('qrCodeUrl');
    
    qrContainer.innerHTML = '';
    qrUrl.textContent = url;
    
    new QRCode(qrContainer, {
        text: url,
        width: 200,
        height: 200,
        colorDark: "#000000",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.H
    });
    
    modal.classList.add('show');
}

window.closeQRModal = function() {
    const modal = document.getElementById('qrModal');
    modal.classList.remove('show');
}

// Hauptanwendung
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM geladen, starte Anwendung...');

    // DOM-Elemente
    const appContent = document.getElementById('appContent');
    const themeToggle = document.getElementById('themeToggle');
    const mobileThemeToggle = document.getElementById('mobileThemeToggle');
    const searchInput = document.getElementById('searchInput');
    const linksList = document.getElementById('linksList');
    const noResults = document.getElementById('noResults');
    const modal = document.getElementById('qrModal');
    const closeBtn = modal.querySelector('.close-modal');

    // Modal Event Listener
    closeBtn.addEventListener('click', closeQRModal);
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeQRModal();
        }
    });
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('show')) {
            closeQRModal();
        }
    });

    // Theme Toggle
    function toggleTheme() {
        document.body.classList.toggle('dark-mode');
        const isDarkMode = document.body.classList.contains('dark-mode');
        localStorage.setItem('darkMode', isDarkMode);
    }

    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }
    if (mobileThemeToggle) {
        mobileThemeToggle.addEventListener('click', toggleTheme);
    }

    // Theme aus localStorage laden
    const savedTheme = localStorage.getItem('darkMode');
    if (savedTheme === 'true') {
        document.body.classList.add('dark-mode');
    }

    // Links Funktionen
    async function getWeblinksFromFirestore() {
        try {
            console.log('Lade Links aus Firestore...');
            const linksCol = collection(db, 'Weblinks');
            const linkSnapshot = await getDocs(linksCol);
            const linksList = linkSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            console.log('Links geladen:', linksList);
            return linksList;
            } catch (error) {
            console.error('Fehler beim Laden der Links:', error);
            return [];
        }
    }

    async function renderLinks(filterTerm = '') {
        try {
            const linksList = document.getElementById('linksList');
            const noResults = document.getElementById('noResults');
            let hasResults = false;

            if (linksList) {
                linksList.innerHTML = '';
                const links = await getWeblinksFromFirestore();
                
                links.forEach(link => {
                    const title = (link.title || '').toLowerCase();
                    const description = (link.description || '').toLowerCase();
                    const searchTerm = filterTerm.toLowerCase();

                    if (title.includes(searchTerm) || description.includes(searchTerm)) {
                        const linkCard = document.createElement('div');
                        linkCard.classList.add('link-card');
                        
                        let iconHtml = '';
                        if (link.iconUrl) {
                            iconHtml = `<img src="${link.iconUrl}" alt="Link Icon" class="link-logo-img" onerror="this.onerror=null; this.parentElement.innerHTML='<i class=\'fas fa-link\'></i>';"></img>`;
                        } else {
                            iconHtml = `<i class="fas fa-link"></i>`;
                        }
                        
                        const createdAt = link.createdAt ? new Date(link.createdAt.toDate()).toLocaleString('de-DE') : 'Unbekannt';
                        const updatedAt = link.updatedAt ? new Date(link.updatedAt.toDate()).toLocaleString('de-DE') : null;

                        linkCard.innerHTML = `
                            <div class="link-logo">
                                ${iconHtml}
                            </div>
                            <div class="link-content">
                                <h3>${link.title || 'Kein Titel'}</h3>
                                <p>${link.description || 'Keine Beschreibung verfügbar.'}</p>
                                <div class="item-dates">
                                    <p class="date-info"><i class="fas fa-calendar-plus"></i> Erstellt: ${createdAt}</p>
                                    ${updatedAt ? `<p class="date-info"><i class="fas fa-clock"></i> Geändert: ${updatedAt}</p>` : ''}
                                </div>
                            </div>
                            <div class="link-actions">
                                <button class="qr-button" onclick="showQRCode('${link.url}')">
                                    <i class="fas fa-qrcode"></i>
                                </button>
                                <a href="${link.url}" target="_blank" rel="noopener noreferrer">
                                    <i class="fas fa-external-link-alt"></i>
                                </a>
                            </div>
                        `;
                        linksList.appendChild(linkCard);
                        hasResults = true;
                    }
                });

                if (noResults) {
                    noResults.style.display = hasResults ? 'none' : 'block';
                }
            }
        } catch (error) {
            console.error('Fehler beim Rendern der Links:', error);
            if (linksList) {
                linksList.innerHTML = '<div class="error-message">Fehler beim Laden der Links</div>';
            }
        }
    }

    // Suchfunktion
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            console.log('Sucheingabe:', e.target.value);
            renderLinks(e.target.value);
        });
    }

    // Test-Funktion für Datenbankverbindung
    async function testDatabaseConnection() {
        try {
            console.log('Teste Datenbankverbindung...');
            
            // Versuche ein Test-Dokument zu erstellen
            const testDoc = await addDoc(collection(db, 'Weblinks'), {
                title: "Test Link",
                url: "https://example.com",
                description: "Dies ist ein Test-Link",
                createdAt: new Date()
            });
            
            console.log('Test-Dokument erstellt mit ID:', testDoc.id);
            
            // Lösche das Test-Dokument wieder
            await deleteDoc(testDoc);
            console.log('Test-Dokument erfolgreich gelöscht');
            
            return true;
            } catch (error) {
            console.error('Fehler bei der Datenbankverbindung:', error);
            alert('Fehler bei der Datenbankverbindung: ' + error.message);
            return false;
        }
    }

    // Toast Queue System
    const toastQueue = {
        queue: [],
        isProcessing: false,
        
        add(message, type = 'success') {
            this.queue.push({ message, type });
            if (!this.isProcessing) {
                this.process();
            }
        },
        
        async process() {
            if (this.queue.length === 0) {
                this.isProcessing = false;
                return;
            }
            
            this.isProcessing = true;
            const { message, type } = this.queue.shift();
            
            const toastContainer = document.getElementById('toastContainer');
            const toast = document.createElement('div');
            toast.className = `toast ${type}`;
            
            let icon;
            switch(type) {
                case 'success':
                    icon = 'check-circle';
                    break;
                case 'error':
                    icon = 'exclamation-circle';
                    break;
                case 'info':
                    icon = 'info-circle';
                    break;
                case 'warning':
                    icon = 'exclamation-triangle';
                    break;
                default:
                    icon = 'info-circle';
            }
            
            toast.innerHTML = `
                <i class="fas fa-${icon}"></i>
                <span>${message}</span>
            `;
            
            toastContainer.appendChild(toast);
            
            // Warte 3 Sekunden
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            // Blende Toast aus
            toast.style.animation = 'slideOut 0.3s ease-out forwards';
            await new Promise(resolve => setTimeout(resolve, 300));
            toast.remove();
            
            // Verarbeite nächsten Toast
            this.process();
        }
    };

    // Toast Benachrichtigung Funktion
    function showToast(message, type = 'success') {
        toastQueue.add(message, type);
    }

    // Bestätigungsdialog Funktion
    function showConfirmDialog(message) {
        return new Promise((resolve) => {
            const dialog = document.getElementById('confirmDialog');
            const messageElement = document.getElementById('confirmDialogMessage');
            const confirmButton = document.getElementById('confirmDialogConfirm');
            const cancelButton = document.getElementById('confirmDialogCancel');

            messageElement.textContent = message;
            dialog.classList.add('show');

            const handleConfirm = () => {
                cleanup();
                resolve(true);
            };

            const handleCancel = () => {
                cleanup();
                resolve(false);
            };

            const handleKeyPress = (e) => {
                if (e.key === 'Escape') {
                    handleCancel();
                }
            };

            const cleanup = () => {
                dialog.classList.remove('show');
                confirmButton.removeEventListener('click', handleConfirm);
                cancelButton.removeEventListener('click', handleCancel);
                document.removeEventListener('keydown', handleKeyPress);
            };

            confirmButton.addEventListener('click', handleConfirm);
            cancelButton.addEventListener('click', handleCancel);
            document.addEventListener('keydown', handleKeyPress);
        });
    }

    // Funktion zum Bearbeiten eines Links
    async function editLink(id, link) {
        // Formularfelder mit den Link-Daten füllen
        document.getElementById('linkTitle').value = link.title || '';
        document.getElementById('linkUrl').value = link.url || '';
        document.getElementById('linkDescription').value = link.description || '';
        document.getElementById('linkIconUrl').value = link.iconUrl || '';

        // Submit-Button Text ändern
        const submitButton = document.querySelector('#addLinkForm button[type="submit"]');
        submitButton.textContent = 'Link aktualisieren';

        // Formular und Event Listener
        const form = document.getElementById('addLinkForm');
        
        // Alten Event Listener entfernen
        if (form.submitHandler) {
            form.removeEventListener('submit', form.submitHandler);
            form.submitHandler = null;
        }
        
        // Temporären Event Listener für das Update hinzufügen
        const updateHandler = async function(e) {
            e.preventDefault();
            
            const newTitle = document.getElementById('linkTitle').value;
            const newUrl = document.getElementById('linkUrl').value;
            const newDescription = document.getElementById('linkDescription').value;
            const newIconUrl = document.getElementById('linkIconUrl').value;

            if (!newTitle || !newUrl) {
                showToast('Bitte füllen Sie mindestens Titel und URL aus', 'error');
                return;
            }

            try {
                // Aktualisiere den bestehenden Link
                await updateDoc(doc(db, 'Weblinks', id), {
                    title: newTitle,
                    url: newUrl,
                    description: newDescription,
                    iconUrl: newIconUrl,
                    updatedAt: new Date()
                });

                // Formular zurücksetzen
                resetLinkForm();
                
                // Event Listener entfernen
                form.removeEventListener('submit', updateHandler);
                form.submitHandler = null;
                
                // Links aktualisieren
                await loadAdminLinks();
                await renderLinks();
                showToast('Link wurde erfolgreich aktualisiert', 'info');
            } catch (error) {
                console.error('Fehler beim Aktualisieren des Links:', error);
                showToast('Fehler beim Aktualisieren des Links: ' + error.message, 'error');
            }
        };

        // Neuen Event Listener hinzufügen
        form.addEventListener('submit', updateHandler);
        form.submitHandler = updateHandler;
    }

    // Funktion zum Zurücksetzen des Formulars
    function resetLinkForm() {
        const form = document.getElementById('addLinkForm');
        form.reset();
        const submitButton = form.querySelector('button[type="submit"]');
        submitButton.textContent = 'Link hinzufügen';
        
        // Event Listener entfernen
        if (form.submitHandler) {
            form.removeEventListener('submit', form.submitHandler);
            form.submitHandler = null;
        }
    }

    // Funktion zum Laden der Links im Admin-Bereich
    async function loadAdminLinks() {
        console.log('Lade Links für Admin-Bereich...');
        const linksGrid = document.getElementById('linksGrid');
        if (!linksGrid) {
            console.error('Links Grid Container nicht gefunden');
            return;
        }

        try {
            console.log('Starte Firebase-Abruf...');
            const linksSnapshot = await getDocs(collection(db, 'Weblinks'));
            console.log('Firebase-Abruf erfolgreich, Anzahl Links:', linksSnapshot.size);
            
            linksGrid.innerHTML = '';
            
            if (linksSnapshot.empty) {
                console.log('Keine Links in der Datenbank gefunden');
                linksGrid.innerHTML = '<div class="no-results">Keine Links vorhanden</div>';
                return;
            }

            linksSnapshot.forEach(doc => {
                console.log('Verarbeite Link:', doc.id, doc.data());
                const link = doc.data();
                const linkElement = createAdminLinkElement(doc.id, link);
                linksGrid.appendChild(linkElement);
            });
            
            console.log('Links für Admin-Bereich erfolgreich geladen');
        } catch (error) {
            console.error('Fehler beim Laden der Links:', error);
            linksGrid.innerHTML = '<div class="error-message">Fehler beim Laden der Links</div>';
        }
    }

    // Funktion zum Erstellen eines Link-Elements im Admin-Bereich
    function createAdminLinkElement(id, link) {
        const div = document.createElement('div');
        div.className = 'item-card-new';
        
            let iconHtml = '';
            if (link.iconUrl) {
            iconHtml = `<img src="${link.iconUrl}" alt="Link Icon" class="link-icon-img" onerror="this.onerror=null; this.parentElement.innerHTML='<i class=\'fas fa-link\'></i>';"></img>`;
        } else {
            iconHtml = `<i class="fas fa-link"></i>`;
        }

        // Formatiere die Datumsangaben
        const createdAt = link.createdAt ? new Date(link.createdAt.toDate()).toLocaleString('de-DE') : 'Unbekannt';
        const updatedAt = link.updatedAt ? new Date(link.updatedAt.toDate()).toLocaleString('de-DE') : null;

            div.innerHTML = `
                <div class="item-icon">
                    ${iconHtml}
                </div>
                <div class="item-content-text">
            <h4>${link.title || 'Kein Titel'}</h4>
            <p>${link.description || 'Keine Beschreibung'}</p>
            <a href="${link.url}" target="_blank" class="link-url">${link.url}</a>
            ${link.iconUrl ? `<p class="icon-url">Icon URL: ${link.iconUrl}</p>` : ''}
            <div class="item-dates">
                <p class="date-info"><i class="fas fa-calendar-plus"></i> Erstellt: ${createdAt}</p>
                ${updatedAt ? `<p class="date-info"><i class="fas fa-clock"></i> Geändert: ${updatedAt}</p>` : ''}
            </div>
                </div>
                <div class="item-actions">
            <button class="edit" data-id="${id}">
                <i class="fas fa-edit"></i>
            </button>
            <button class="delete-new" data-id="${id}">
                <i class="fas fa-trash"></i>
            </button>
                </div>
            `;

        // Event Listener für Bearbeiten
        const editBtn = div.querySelector('.edit');
        editBtn.addEventListener('click', () => editLink(id, link));

        // Event Listener für Löschen
        const deleteBtn = div.querySelector('.delete-new');
        deleteBtn.addEventListener('click', () => deleteLink(id));

        return div;
    }

    // Funktion zum Löschen eines Links
    async function deleteLink(id) {
        const confirmed = await showConfirmDialog('Möchten Sie diesen Link wirklich löschen?');
        
        if (confirmed) {
            try {
                await deleteDoc(doc(db, 'Weblinks', id));
                await loadAdminLinks();
        await renderLinks();
                showToast('Link wurde erfolgreich gelöscht', 'warning');
            } catch (error) {
                console.error('Fehler beim Löschen des Links:', error);
                showToast('Fehler beim Löschen des Links: ' + error.message, 'error');
            }
        }
    }

    // Navigation
    function handleNavigation(e) {
        const clickedLink = e.target.closest('a');
        if (!clickedLink) return;

        e.preventDefault();
        const pageId = clickedLink.dataset.page;
        const href = clickedLink.getAttribute('href');

        // Prüfe Berechtigung für geschützte Seiten
        const userEmail = localStorage.getItem('userEmail');
        const isAdmin = userEmail === 'guerkan.privat@gmail.com';
        
        if ((pageId === 'nas' || pageId === 'admin') && !isAdmin) {
            alert('Sie haben keine Berechtigung für diesen Bereich');
                        return;
                    }

        window.location.hash = href.substring(1);

        // Aktiven Navigationszustand setzen
        updateActiveNavigation(pageId);

        const allPages = document.querySelectorAll('.page');
        allPages.forEach(page => {
            if (page.id === pageId) {
                page.style.display = 'block';
                // Admin Panel initialisieren wenn Admin-Seite aktiviert wird
                if (pageId === 'admin' && isAdmin) {
                    console.log('Admin-Seite aktiviert, initialisiere Panel...');
                initializeAdminPanel();
                }
            } else {
                page.style.display = 'none';
            }
        });
    }

    // Funktion zum Aktualisieren des aktiven Navigationszustands
    function updateActiveNavigation(activePageId) {
        // Desktop Navigation
        const desktopLinks = document.querySelectorAll('.desktop-nav a');
        desktopLinks.forEach(link => {
            if (link.dataset.page === activePageId) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });

        // Mobile Navigation
        const mobileLinks = document.querySelectorAll('.mobile-nav a');
        mobileLinks.forEach(link => {
            if (link.dataset.page === activePageId) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    }

    // Funktion zum Laden der Dienste aus Firestore
    async function getServicesFromFirestore() {
        try {
            console.log('Lade Dienste aus Firestore...');
            const servicesCol = collection(db, 'Dienste');
            const serviceSnapshot = await getDocs(servicesCol);
            const servicesList = serviceSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            console.log('Dienste geladen:', servicesList);
        return servicesList;
        } catch (error) {
            console.error('Fehler beim Laden der Dienste:', error);
            return [];
        }
    }

    // Funktion zum Rendern der Dienste
    async function renderServices(filterTerm = '') {
        try {
            const servicesList = document.getElementById('localServicesListContainer');
            const noResults = document.getElementById('noNasResults');
            let hasResults = false;

            if (servicesList) {
                servicesList.innerHTML = '';
                const services = await getServicesFromFirestore();
                
        services.forEach(service => {
                    const title = (service.title || '').toLowerCase();
                    const description = (service.description || '').toLowerCase();
                    const searchTerm = filterTerm.toLowerCase();

                    if (title.includes(searchTerm) || description.includes(searchTerm)) {
                        const serviceCard = document.createElement('div');
                        serviceCard.classList.add('link-card');
                        
            let iconHtml = '';
            if (service.iconUrl) {
                            iconHtml = `<img src="${service.iconUrl}" alt="Service Icon" class="link-logo-img" onerror="this.onerror=null; this.parentElement.innerHTML='<i class=\'fas fa-server\'></i>';"></img>`;
            } else {
                            iconHtml = `<i class="fas fa-server"></i>`;
                        }
                        
                        const createdAt = service.createdAt ? new Date(service.createdAt.toDate()).toLocaleString('de-DE') : 'Unbekannt';
                        const updatedAt = service.updatedAt ? new Date(service.updatedAt.toDate()).toLocaleString('de-DE') : null;

                        serviceCard.innerHTML = `
                            <div class="link-logo">
                    ${iconHtml}
                </div>
                            <div class="link-content">
                                <h3>${service.title || 'Kein Titel'}</h3>
                                <p>${service.description || 'Keine Beschreibung verfügbar.'}</p>
                                <div class="item-dates">
                                    <p class="date-info"><i class="fas fa-calendar-plus"></i> Erstellt: ${createdAt}</p>
                                    ${updatedAt ? `<p class="date-info"><i class="fas fa-clock"></i> Geändert: ${updatedAt}</p>` : ''}
                </div>
                            </div>
                            <div class="link-actions">
                                <button class="qr-button" onclick="showQRCode('${service.url}')">
                                    <i class="fas fa-qrcode"></i>
                                </button>
                                <a href="${service.url}" target="_blank" rel="noopener noreferrer">
                                    <i class="fas fa-external-link-alt"></i>
                                </a>
                </div>
            `;
                        servicesList.appendChild(serviceCard);
                        hasResults = true;
                    }
                });

                if (noResults) {
                    noResults.style.display = hasResults ? 'none' : 'block';
                }
            }
        } catch (error) {
            console.error('Fehler beim Rendern der Dienste:', error);
            if (servicesList) {
                servicesList.innerHTML = '<div class="error-message">Fehler beim Laden der Dienste</div>';
            }
        }
    }

    // Suchfunktion für Dienste
    const nasSearchInput = document.getElementById('nasSearchInput');
    if (nasSearchInput) {
        nasSearchInput.addEventListener('input', (e) => {
            console.log('Dienste-Sucheingabe:', e.target.value);
            renderServices(e.target.value);
        });
    }

    // Auth State Change
    onAuthStateChanged(auth, async (user) => {
        console.log('Auth State Changed:', user ? 'Eingeloggt' : 'Nicht eingeloggt');
        
        // Ladebildschirm nur beim initialen Laden anzeigen
        const loadingScreen = document.getElementById('loadingScreen');
        const appContent = document.getElementById('appContent');
        
        if (loadingScreen && !appContent.style.display) {
            loadingScreen.classList.remove('hidden');
        }
        if (appContent) {
            appContent.style.display = 'none';
        }
        
        if (user || localStorage.getItem('loggedIn') === 'true') {
            // Kurze Verzögerung für flüssigeren Übergang
            await new Promise(resolve => setTimeout(resolve, 200));
            
            if (appContent) {
                appContent.style.display = 'flex';
            }
            
            // Initial Links und Dienste laden
            await renderLinks();
            await renderServices();
            
            // Aktive Seite setzen
            const currentHash = window.location.hash || '#links';
            const pageId = currentHash.substring(1);
            const allPages = document.querySelectorAll('.page');
            allPages.forEach(page => {
                page.style.display = page.id === pageId ? 'block' : 'none';
            });

            // Navigationselemente basierend auf Authentifizierung anzeigen/ausblenden
            updateNavigationVisibility(user);

            // Aktiven Navigationszustand setzen
            updateActiveNavigation(pageId);

            // Wenn wir auf der Admin-Seite sind, initialisiere das Admin Panel
            if (pageId === 'admin' && localStorage.getItem('userEmail') === 'guerkan.privat@gmail.com') {
                console.log('Admin-Seite direkt geladen, initialisiere Panel...');
                initializeAdminPanel();
            }
        } else {
            window.location.href = 'index.html';
        }
        
        // Ladebildschirm ausblenden
        if (loadingScreen) {
            loadingScreen.classList.add('hidden');
        }
    });

    // Funktion zum Aktualisieren der Sichtbarkeit der Navigationselemente
    function updateNavigationVisibility(user) {
        const userEmail = user ? user.email : localStorage.getItem('userEmail');
        const isAdmin = userEmail === 'guerkan.privat@gmail.com';
        const isGuest = userEmail === 'guest';

        // Desktop Navigation
        const nasNavLink = document.getElementById('nasNavLinkLi');
        const adminNavLink = document.getElementById('adminNavLinkLi');
        
        if (nasNavLink) {
            nasNavLink.style.display = isAdmin ? 'block' : 'none';
        }
        if (adminNavLink) {
            adminNavLink.style.display = isAdmin ? 'block' : 'none';
        }

        // Mobile Navigation
        const mobileNasNavLink = document.getElementById('mobileNasNavLinkLi');
        const mobileAdminNavLink = document.getElementById('mobileAdminNavLinkLi');
        
        if (mobileNasNavLink) {
            mobileNasNavLink.style.display = isAdmin ? 'block' : 'none';
        }
        if (mobileAdminNavLink) {
            mobileAdminNavLink.style.display = isAdmin ? 'block' : 'none';
        }

        // Wenn wir auf einer geschützten Seite sind und keine Berechtigung haben, zur Links-Seite wechseln
        if (!isAdmin && (window.location.hash === '#nas' || window.location.hash === '#admin')) {
            window.location.hash = '#links';
        }
    }

    // Navigation Event Listener
    const desktopNav = document.querySelector('.desktop-nav ul');
    const mobileNav = document.querySelector('.mobile-nav ul');

    if (desktopNav) {
        desktopNav.addEventListener('click', handleNavigation);
    }
    if (mobileNav) {
        mobileNav.addEventListener('click', handleNavigation);
    }

    // Logout
    const logoutLinks = document.querySelectorAll('a[href="index.html"]');
    logoutLinks.forEach(link => {
        link.addEventListener('click', async (e) => {
            e.preventDefault();
            try {
                await signOut(auth);
                localStorage.removeItem('loggedIn');
                localStorage.removeItem('userEmail');
                window.location.href = 'index.html';
            } catch (error) {
                console.error('Logout Fehler:', error);
                alert('Fehler beim Abmelden: ' + error.message);
            }
        });
    });

    // Funktion zum Laden der Dienste im Admin-Bereich
    async function loadAdminServices() {
        console.log('Lade Dienste für Admin-Bereich...');
        const servicesGrid = document.getElementById('servicesGrid');
        if (!servicesGrid) {
            console.error('Services Grid Container nicht gefunden');
            return;
        }

        try {
            console.log('Starte Firebase-Abruf für Dienste...');
            const servicesSnapshot = await getDocs(collection(db, 'Dienste'));
            console.log('Firebase-Abruf erfolgreich, Anzahl Dienste:', servicesSnapshot.size);
            
            servicesGrid.innerHTML = '';
            
            if (servicesSnapshot.empty) {
                console.log('Keine Dienste in der Datenbank gefunden');
                servicesGrid.innerHTML = '<div class="no-results">Keine Dienste vorhanden</div>';
                return;
            }

            servicesSnapshot.forEach(doc => {
                console.log('Verarbeite Dienst:', doc.id, doc.data());
                const service = doc.data();
                const serviceElement = createAdminServiceElement(doc.id, service);
                servicesGrid.appendChild(serviceElement);
            });
            
            console.log('Dienste für Admin-Bereich erfolgreich geladen');
        } catch (error) {
            console.error('Fehler beim Laden der Dienste:', error);
            servicesGrid.innerHTML = '<div class="error-message">Fehler beim Laden der Dienste</div>';
        }
    }

    // Funktion zum Erstellen eines Dienst-Elements im Admin-Bereich
    function createAdminServiceElement(id, service) {
        const div = document.createElement('div');
        div.className = 'item-card-new';
        
            let iconHtml = '';
                if (service.iconUrl) {
            iconHtml = `<img src="${service.iconUrl}" alt="Service Icon" class="link-icon-img" onerror="this.onerror=null; this.parentElement.innerHTML='<i class=\'fas fa-server\'></i>';"></img>`;
            } else {
            iconHtml = `<i class="fas fa-server"></i>`;
        }

        // Formatiere die Datumsangaben
        const createdAt = service.createdAt ? new Date(service.createdAt.toDate()).toLocaleString('de-DE') : 'Unbekannt';
        const updatedAt = service.updatedAt ? new Date(service.updatedAt.toDate()).toLocaleString('de-DE') : null;

            div.innerHTML = `
                <div class="item-icon">
                    ${iconHtml}
                </div>
                <div class="item-content-text">
                <h4>${service.title || 'Kein Titel'}</h4>
                <p>${service.description || 'Keine Beschreibung'}</p>
                <a href="${service.url}" target="_blank" class="link-url">${service.url}</a>
                ${service.iconUrl ? `<p class="icon-url">Icon URL: ${service.iconUrl}</p>` : ''}
                <div class="item-dates">
                    <p class="date-info"><i class="fas fa-calendar-plus"></i> Erstellt: ${createdAt}</p>
                    ${updatedAt ? `<p class="date-info"><i class="fas fa-clock"></i> Geändert: ${updatedAt}</p>` : ''}
                        </div>
                </div>
                <div class="item-actions">
                <button class="edit" data-id="${id}">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="delete-new" data-id="${id}">
                    <i class="fas fa-trash"></i>
                </button>
                </div>
            `;

        // Event Listener für Bearbeiten
        const editBtn = div.querySelector('.edit');
        editBtn.addEventListener('click', () => editService(id, service));

        // Event Listener für Löschen
        const deleteBtn = div.querySelector('.delete-new');
        deleteBtn.addEventListener('click', () => deleteService(id));

        return div;
    }

    // Funktion zum Bearbeiten eines Dienstes
    async function editService(id, service) {
        // Formularfelder mit den Dienst-Daten füllen
        document.getElementById('serviceTitle').value = service.title || '';
        document.getElementById('serviceUrl').value = service.url || '';
        document.getElementById('serviceDescription').value = service.description || '';
        document.getElementById('serviceIconUrl').value = service.iconUrl || '';

        // Submit-Button Text ändern
        const submitButton = document.querySelector('#addServiceForm button[type="submit"]');
        submitButton.textContent = 'Dienst aktualisieren';

        // Formular und Event Listener
        const form = document.getElementById('addServiceForm');
        
        // Alten Event Listener entfernen
        if (form.submitHandler) {
            form.removeEventListener('submit', form.submitHandler);
            form.submitHandler = null;
        }
        
        // Temporären Event Listener für das Update hinzufügen
        const updateHandler = async function(e) {
            e.preventDefault();
            
            const newTitle = document.getElementById('serviceTitle').value;
            const newUrl = document.getElementById('serviceUrl').value;
            const newDescription = document.getElementById('serviceDescription').value;
            const newIconUrl = document.getElementById('serviceIconUrl').value;

            if (!newTitle || !newUrl) {
                showToast('Bitte füllen Sie mindestens Titel und URL aus', 'error');
                return;
            }

            try {
                // Aktualisiere den bestehenden Dienst
                await updateDoc(doc(db, 'Dienste', id), {
                    title: newTitle,
                    url: newUrl,
                    description: newDescription,
                    iconUrl: newIconUrl,
                    updatedAt: new Date()
                });

                // Formular zurücksetzen
                resetServiceForm();
                
                // Event Listener entfernen
                form.removeEventListener('submit', updateHandler);
                form.submitHandler = null;
                
                // Dienste aktualisieren
                await loadAdminServices();
                await renderServices();
                showToast('Dienst wurde erfolgreich aktualisiert', 'info');
            } catch (error) {
                console.error('Fehler beim Aktualisieren des Dienstes:', error);
                showToast('Fehler beim Aktualisieren des Dienstes: ' + error.message, 'error');
            }
        };

        // Neuen Event Listener hinzufügen
        form.addEventListener('submit', updateHandler);
        form.submitHandler = updateHandler;
    }

    // Funktion zum Löschen eines Dienstes
    async function deleteService(id) {
        const confirmed = await showConfirmDialog('Möchten Sie diesen Dienst wirklich löschen?');
        
        if (confirmed) {
            try {
                await deleteDoc(doc(db, 'Dienste', id));
                await loadAdminServices();
                await renderServices();
                showToast('Dienst wurde erfolgreich gelöscht', 'warning');
            } catch (error) {
                console.error('Fehler beim Löschen des Dienstes:', error);
                showToast('Fehler beim Löschen des Dienstes: ' + error.message, 'error');
            }
        }
    }

    // Funktion zum Zurücksetzen des Service-Formulars
    function resetServiceForm() {
        const form = document.getElementById('addServiceForm');
        form.reset();
        const submitButton = form.querySelector('button[type="submit"]');
        submitButton.textContent = 'Dienst hinzufügen';
        
        // Event Listener entfernen
        if (form.submitHandler) {
            form.removeEventListener('submit', form.submitHandler);
            form.submitHandler = null;
        }
    }

    // Admin Panel Funktionen
    function initializeAdminPanel() {
        const tabButtons = document.querySelectorAll('.tab-button-new');
        const tabContents = document.querySelectorAll('.tab-content-new');
        const addLinkForm = document.getElementById('addLinkForm');
        const addServiceForm = document.getElementById('addServiceForm');

        function switchTab(activeTab) {
            // Tab-Buttons aktualisieren
            tabButtons.forEach(button => {
                if (button.dataset.tab === activeTab) {
                    button.classList.add('active');
                } else {
                    button.classList.remove('active');
                }
            });

            // Tab-Inhalte aktualisieren
            tabContents.forEach(content => {
                if (content.id === `${activeTab}TabContent`) {
                    content.style.display = 'block';
                    // Initialisiere den entsprechenden Tab-Inhalt
                    if (activeTab === 'links') {
                        loadAdminLinks();
                    } else if (activeTab === 'services') {
                        loadAdminServices();
                    } else if (activeTab === 'bug-reports') {
                        initializeBugReportsAdmin();
                    }
                } else {
                    content.style.display = 'none';
                }
            });
        }

        // Event-Listener für Tab-Buttons
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                switchTab(button.dataset.tab);
            });
        });

        // Initialisiere den aktiven Tab
        const activeTab = document.querySelector('.tab-button-new.active').dataset.tab;
        switchTab(activeTab);

        // Link Form Handler
        if (addLinkForm) {
            // Alten Event Listener entfernen, falls vorhanden
            if (addLinkForm.submitHandler) {
                addLinkForm.removeEventListener('submit', addLinkForm.submitHandler);
            }

            const addHandler = async function(e) {
                e.preventDefault();
                const formData = {
                    title: document.getElementById('linkTitle').value,
                    url: document.getElementById('linkUrl').value,
                    iconUrl: document.getElementById('linkIconUrl').value,
                    description: document.getElementById('linkDescription').value,
                    createdAt: new Date(),
                    updatedAt: new Date()
                };

                try {
                    await addDoc(collection(db, 'Weblinks'), formData);
                    showToast('Link erfolgreich hinzugefügt', 'success');
                    resetLinkForm();
                    await loadAdminLinks();
                    await renderLinks();
                } catch (error) {
                    console.error('Fehler beim Hinzufügen des Links:', error);
                    showToast('Fehler beim Hinzufügen des Links', 'error');
                }
            };

            addLinkForm.addEventListener('submit', addHandler);
            addLinkForm.submitHandler = addHandler;
        }

        // Service Form Handler
        if (addServiceForm) {
            // Alten Event Listener entfernen, falls vorhanden
            if (addServiceForm.submitHandler) {
                addServiceForm.removeEventListener('submit', addServiceForm.submitHandler);
            }

            const addHandler = async function(e) {
                e.preventDefault();
                const formData = {
                    title: document.getElementById('serviceTitle').value,
                    url: document.getElementById('serviceUrl').value,
                    iconUrl: document.getElementById('serviceIconUrl').value,
                    description: document.getElementById('serviceDescription').value,
                    createdAt: new Date(),
                    updatedAt: new Date()
                };

                try {
                    await addDoc(collection(db, 'Dienste'), formData);
                    showToast('Dienst erfolgreich hinzugefügt', 'success');
                    resetServiceForm();
                    await loadAdminServices();
                    await renderServices();
                } catch (error) {
                    console.error('Fehler beim Hinzufügen des Dienstes:', error);
                    showToast('Fehler beim Hinzufügen des Dienstes', 'error');
                }
            };

            addServiceForm.addEventListener('submit', addHandler);
            addServiceForm.submitHandler = addHandler;
        }
    }

    // Intelligente Suche mit Vorschlägen
    function initializeSearch() {
        const searchInput = document.getElementById('searchInput');
        const nasSearchInput = document.getElementById('nasSearchInput');
        const linksList = document.getElementById('linksList');
        const servicesList = document.getElementById('localServicesListContainer');

        // Erstelle Suchvorschläge-Container
        const createSuggestionsContainer = (parent) => {
            const container = document.createElement('div');
            container.className = 'search-suggestions';
            parent.appendChild(container);
            return container;
        };

        // Erstelle Suchvorschlag-Element
        const createSuggestionItem = (item, type, index) => {
            const div = document.createElement('div');
            div.className = 'suggestion-item';
            div.dataset.index = index;
            
            // Icon basierend auf Typ und Icon-URL
            let iconHtml = '';
            if (item.iconUrl) {
                iconHtml = `<img src="${item.iconUrl}" alt="${item.title}" class="suggestion-icon-img">`;
            } else {
                iconHtml = `<i class="fas ${type === 'link' ? 'fa-link' : 'fa-server'}"></i>`;
            }

            div.innerHTML = `
                <div class="suggestion-content">
                    ${iconHtml}
                    <div class="suggestion-text">
                        <div class="suggestion-title">${item.title}</div>
                        <div class="suggestion-description">${item.description || ''}</div>
                    </div>
                </div>
                <div class="suggestion-type">${type === 'link' ? 'Link' : 'Dienst'}</div>
            `;
            return div;
        };

        // Zeige Suchvorschläge an
        const showSuggestions = async (searchTerm, container, type, inputElement) => {
            if (!searchTerm) {
                container.classList.remove('show');
            return;
        }

            const items = type === 'link' ? await getWeblinksFromFirestore() : await getServicesFromFirestore();
            const filteredItems = items.filter(item => {
                const title = (item.title || '').toLowerCase();
                const description = (item.description || '').toLowerCase();
                const term = searchTerm.toLowerCase();
                return title.includes(term) || description.includes(term);
            });

        container.innerHTML = '';
            
            if (filteredItems.length > 0) {
                filteredItems.slice(0, 5).forEach((item, index) => {
                    container.appendChild(createSuggestionItem(item, type, index));
                });
                container.classList.add('show');
                
                // Speichere die gefilterten Items für die Tastatursteuerung
                container.filteredItems = filteredItems;
                } else {
                container.classList.remove('show');
            }
        };

        // Tastatursteuerung für Suchvorschläge
        const handleKeyboardNavigation = (e, container, inputElement) => {
            const items = container.querySelectorAll('.suggestion-item');
            const currentIndex = Array.from(items).findIndex(item => item.classList.contains('selected'));
            
            switch (e.key) {
                case 'ArrowDown':
            e.preventDefault();
                    if (currentIndex < items.length - 1) {
                        items[currentIndex]?.classList.remove('selected');
                        items[currentIndex + 1].classList.add('selected');
                        items[currentIndex + 1].scrollIntoView({ block: 'nearest' });
                    } else if (currentIndex === -1 && items.length > 0) {
                        items[0].classList.add('selected');
                    }
                    break;
                    
                case 'ArrowUp':
                    e.preventDefault();
                    if (currentIndex > 0) {
                        items[currentIndex].classList.remove('selected');
                        items[currentIndex - 1].classList.add('selected');
                        items[currentIndex - 1].scrollIntoView({ block: 'nearest' });
                    }
                    break;
                    
                case 'Enter':
                    e.preventDefault();
                    const selectedItem = container.querySelector('.suggestion-item.selected');
                    if (selectedItem) {
                        const index = parseInt(selectedItem.getAttribute('data-index'));
                        const item = container.filteredItems[index];
                        if (item) {
                            window.open(item.url, '_blank');
                            container.classList.remove('show');
                            inputElement.value = '';
                        }
                    }
                    break;
                    
                case 'Escape':
                    e.preventDefault();
                    container.classList.remove('show');
                    break;
            }
        };

        // Initialisiere Suche für Links
        if (searchInput && linksList) {
            const suggestionsContainer = createSuggestionsContainer(searchInput.parentElement);
            
            searchInput.addEventListener('input', (e) => {
                showSuggestions(e.target.value, suggestionsContainer, 'link', searchInput);
            });

            searchInput.addEventListener('keydown', (e) => {
                if (suggestionsContainer.classList.contains('show')) {
                    handleKeyboardNavigation(e, suggestionsContainer, searchInput);
                }
            });

            // Schließe Vorschläge beim Klick außerhalb
            document.addEventListener('click', (e) => {
                if (!searchInput.contains(e.target) && !suggestionsContainer.contains(e.target)) {
                    suggestionsContainer.classList.remove('show');
                }
            });
        }

        // Initialisiere Suche für Dienste
        if (nasSearchInput && servicesList) {
            const suggestionsContainer = createSuggestionsContainer(nasSearchInput.parentElement);
            
            nasSearchInput.addEventListener('input', (e) => {
                showSuggestions(e.target.value, suggestionsContainer, 'service', nasSearchInput);
            });

            nasSearchInput.addEventListener('keydown', (e) => {
                if (suggestionsContainer.classList.contains('show')) {
                    handleKeyboardNavigation(e, suggestionsContainer, nasSearchInput);
                }
            });

            // Schließe Vorschläge beim Klick außerhalb
            document.addEventListener('click', (e) => {
                if (!nasSearchInput.contains(e.target) && !suggestionsContainer.contains(e.target)) {
                    suggestionsContainer.classList.remove('show');
                }
            });
        }
    }

    // Initialisiere die Suche beim Laden der Seite
    initializeSearch();

    // Bug Report Funktionalität
    function initializeBugReport() {
        const bugReportForm = document.getElementById('bugReportForm');
        const bugReportsRef = collection(db, "Bugreports");

        function getBrowserInfo() {
            const userAgent = navigator.userAgent;
            let browserName = "Unbekannt";
            let browserVersion = "Unbekannt";

            if (userAgent.indexOf("Firefox") > -1) {
                browserName = "Firefox";
                browserVersion = userAgent.match(/Firefox\/([0-9.]+)/)[1];
            } else if (userAgent.indexOf("Chrome") > -1) {
                browserName = "Chrome";
                browserVersion = userAgent.match(/Chrome\/([0-9.]+)/)[1];
            } else if (userAgent.indexOf("Safari") > -1) {
                browserName = "Safari";
                browserVersion = userAgent.match(/Version\/([0-9.]+)/)[1];
            } else if (userAgent.indexOf("Edge") > -1) {
                browserName = "Edge";
                browserVersion = userAgent.match(/Edge\/([0-9.]+)/)[1];
            }

            return `${browserName} ${browserVersion}`;
        }

        function getOSInfo() {
            const userAgent = navigator.userAgent;
            let osName = "Unbekannt";

            if (userAgent.indexOf("Win") > -1) {
                osName = "Windows";
            } else if (userAgent.indexOf("Mac") > -1) {
                osName = "MacOS";
            } else if (userAgent.indexOf("Linux") > -1) {
                osName = "Linux";
            } else if (userAgent.indexOf("Android") > -1) {
                osName = "Android";
            } else if (userAgent.indexOf("iOS") > -1) {
                osName = "iOS";
            }

            return osName;
        }

        function getScreenInfo() {
            return `${window.screen.width}x${window.screen.height}`;
        }

        function updateEnvironmentInfo() {
            document.getElementById('browserInfo').textContent = getBrowserInfo();
            document.getElementById('osInfo').textContent = getOSInfo();
            document.getElementById('screenInfo').textContent = getScreenInfo();
        }

        updateEnvironmentInfo();
        window.addEventListener('resize', updateEnvironmentInfo);

        bugReportForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const bugReport = {
                title: document.getElementById('bugTitle').value,
                description: document.getElementById('bugDescription').value,
                steps: document.getElementById('bugSteps').value,
                expected: document.getElementById('bugExpected').value,
                actual: document.getElementById('bugActual').value,
                email: document.getElementById('bugEmail').value || null,
                phone: document.getElementById('bugPhone').value || null,
                environment: {
                    browser: getBrowserInfo(),
                    os: getOSInfo(),
                    screen: getScreenInfo()
                },
                status: "new",
                priority: "medium",
                createdAt: new Date(),
                updatedAt: new Date()
            };

            try {
                await addDoc(bugReportsRef, bugReport);
                showToast('Bug Report erfolgreich eingereicht!', 'success');
                bugReportForm.reset();
            } catch (error) {
                console.error("Fehler beim Speichern des Bug Reports:", error);
                showToast('Fehler beim Speichern des Bug Reports', 'error');
            }
        });
    }

    function initializeBugReportsAdmin() {
        const bugReportsList = document.getElementById('bugReportsList');
        const statusFilter = document.getElementById('statusFilter');
        const priorityFilter = document.getElementById('priorityFilter');

        function createBugReportCard(bugReport) {
            const card = document.createElement('div');
            card.className = 'bug-report-card';
            card.innerHTML = `
                <div class="bug-report-header">
                    <div class="bug-report-title-container">
                        <h3 class="bug-report-title">${bugReport.title}</h3>
                        <button class="expand-button">
                            <i class="fas fa-chevron-down"></i>
                        </button>
                    </div>
                    <div class="bug-report-status ${bugReport.status}">${getStatusText(bugReport.status)}</div>
                </div>
                <div class="bug-report-meta">
                    <div class="bug-report-meta-item">
                        <i class="fas fa-calendar"></i>
                        ${new Date(bugReport.createdAt.toDate()).toLocaleString('de-DE')}
                    </div>
                    <div class="bug-report-meta-item">
                        <i class="fas fa-exclamation-circle"></i>
                        <span class="bug-report-priority ${bugReport.priority}">${getPriorityText(bugReport.priority)}</span>
                    </div>
                </div>
                <div class="bug-report-content" style="display: none;">
                    <div class="bug-report-section">
                        <h4 class="bug-report-section-title">Beschreibung</h4>
                        <p class="bug-report-section-content">${bugReport.description}</p>
                    </div>
                    <div class="bug-report-section">
                        <h4 class="bug-report-section-title">Schritte zum Reproduzieren</h4>
                        <p class="bug-report-section-content">${bugReport.steps}</p>
                    </div>
                    <div class="bug-report-section">
                        <h4 class="bug-report-section-title">Erwartetes Verhalten</h4>
                        <p class="bug-report-section-content">${bugReport.expected}</p>
                    </div>
                    <div class="bug-report-section">
                        <h4 class="bug-report-section-title">Tatsächliches Verhalten</h4>
                        <p class="bug-report-section-content">${bugReport.actual}</p>
                    </div>
                    <div class="bug-report-section">
                        <h4 class="bug-report-section-title">Umgebung</h4>
                        <p class="bug-report-section-content">
                            Browser: ${bugReport.environment.browser}<br>
                            OS: ${bugReport.environment.os}<br>
                            Bildschirm: ${bugReport.environment.screen}
                        </p>
                    </div>
                    ${bugReport.email ? `
                    <div class="bug-report-section">
                        <h4 class="bug-report-section-title">Kontakt E-Mail</h4>
                        <p class="bug-report-section-content"><a href="mailto:${bugReport.email}">${bugReport.email}</a></p>
                    </div>
                    ` : ''}
                    ${bugReport.phone ? `
                    <div class="bug-report-section">
                        <h4 class="bug-report-section-title">Kontakt Telefon</h4>
                        <p class="bug-report-section-content"><a href="tel:${bugReport.phone}">${bugReport.phone}</a></p>
                    </div>
                    ` : ''}
                    <div class="bug-report-actions">
                        <select class="status-select" data-id="${bugReport.id}">
                            <option value="new" ${bugReport.status === 'new' ? 'selected' : ''}>Neu</option>
                            <option value="in-progress" ${bugReport.status === 'in-progress' ? 'selected' : ''}>In Bearbeitung</option>
                            <option value="resolved" ${bugReport.status === 'resolved' ? 'selected' : ''}>Gelöst</option>
                            <option value="closed" ${bugReport.status === 'closed' ? 'selected' : ''}>Geschlossen</option>
                        </select>
                        <select class="priority-select" data-id="${bugReport.id}">
                            <option value="low" ${bugReport.priority === 'low' ? 'selected' : ''}>Niedrig</option>
                            <option value="medium" ${bugReport.priority === 'medium' ? 'selected' : ''}>Mittel</option>
                            <option value="high" ${bugReport.priority === 'high' ? 'selected' : ''}>Hoch</option>
                            <option value="critical" ${bugReport.priority === 'critical' ? 'selected' : ''}>Kritisch</option>
                        </select>
                        <button class="delete-new" data-id="${bugReport.id}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;

            // Event Listener für den Expand-Button
            const expandButton = card.querySelector('.expand-button');
            const content = card.querySelector('.bug-report-content');
            expandButton.addEventListener('click', () => {
                const isExpanded = content.style.display !== 'none';
                content.style.display = isExpanded ? 'none' : 'block';
                expandButton.querySelector('i').className = isExpanded ? 'fas fa-chevron-down' : 'fas fa-chevron-up';
                card.classList.toggle('expanded');
            });

            // Event Listener für Status-Änderungen
            const statusSelect = card.querySelector('.status-select');
            statusSelect.addEventListener('change', async (e) => {
                const newStatus = e.target.value;
                const bugReportRef = doc(db, "Bugreports", bugReport.id);
                try {
                    await updateDoc(bugReportRef, {
                        status: newStatus,
                        updatedAt: new Date()
                    });
                    showToast('Status aktualisiert', 'success');
                    // Aktualisiere den Status-Text in der Card
                    card.querySelector('.bug-report-status').className = `bug-report-status ${newStatus}`;
                    card.querySelector('.bug-report-status').textContent = getStatusText(newStatus);
                } catch (error) {
                    console.error("Fehler beim Aktualisieren des Status:", error);
                    showToast('Fehler beim Aktualisieren des Status', 'error');
                }
            });

            // Event Listener für Prioritäts-Änderungen
            const prioritySelect = card.querySelector('.priority-select');
            prioritySelect.addEventListener('change', async (e) => {
                const newPriority = e.target.value;
                const bugReportRef = doc(db, "Bugreports", bugReport.id);
                try {
                    await updateDoc(bugReportRef, {
                        priority: newPriority,
                        updatedAt: new Date()
                    });
                    showToast('Priorität aktualisiert', 'success');
                    // Aktualisiere den Prioritäts-Text in der Card
                    const prioritySpan = card.querySelector('.bug-report-priority');
                    prioritySpan.className = `bug-report-priority ${newPriority}`;
                    prioritySpan.textContent = getPriorityText(newPriority);
                } catch (error) {
                    console.error("Fehler beim Aktualisieren der Priorität:", error);
                    showToast('Fehler beim Aktualisieren der Priorität', 'error');
                }
            });

            // Event Listener für Löschen
            const deleteButton = card.querySelector('.delete-new');
            if (deleteButton) {
                deleteButton.addEventListener('click', () => deleteBugReport(bugReport.id));
            }

            return card;
        }

        function getStatusText(status) {
            const statusMap = {
                'new': 'Neu',
                'in-progress': 'In Bearbeitung',
                'resolved': 'Gelöst',
                'closed': 'Geschlossen'
            };
            return statusMap[status] || status;
        }

        function getPriorityText(priority) {
            const priorityMap = {
                'low': 'Niedrig',
                'medium': 'Mittel',
                'high': 'Hoch',
                'critical': 'Kritisch'
            };
            return priorityMap[priority] || priority;
        }

        async function loadBugReports() {
            try {
                console.log('Lade Bug Reports...');
                const bugReportsRef = collection(db, "Bugreports");
                const q = query(bugReportsRef, orderBy("createdAt", "desc"));
                const querySnapshot = await getDocs(q);
                
                console.log('Alte Bug Report Liste leeren...');
                bugReportsList.innerHTML = '';

                if (querySnapshot.empty) {
                    console.log('Keine Bug Reports in der Datenbank gefunden.');
                    bugReportsList.innerHTML = '<div class="no-results">Keine Bug Reports vorhanden</div>';
                    return;
                }
                
                console.log(`Füge ${querySnapshot.size} Bug Reports zur Liste hinzu.`);
                querySnapshot.forEach((doc) => {
                    const bugReport = { id: doc.id, ...doc.data() };
                    if (shouldShowBugReport(bugReport)) {
                        const card = createBugReportCard(bugReport);
                        bugReportsList.appendChild(card);
                    }
                });
                console.log('Bug Reports erfolgreich geladen und angezeigt.');
            } catch (error) {
                console.error("Fehler beim Laden der Bug Reports:", error);
                showToast('Fehler beim Laden der Bug Reports', 'error');
            }
        }

        function shouldShowBugReport(bugReport) {
            const selectedStatus = statusFilter.value;
            const selectedPriority = priorityFilter.value;
            
            return (selectedStatus === 'all' || bugReport.status === selectedStatus) &&
                   (selectedPriority === 'all' || bugReport.priority === selectedPriority);
        }

        // Event Listener für Filter
        statusFilter.addEventListener('change', loadBugReports);
        priorityFilter.addEventListener('change', loadBugReports);

        // Initial laden
        loadBugReports();
    }

    // Funktion zum Löschen eines Bug Reports
    async function deleteBugReport(id) {
        const confirmed = await showConfirmDialog('Möchten Sie diesen Bug Report wirklich löschen?');
        
        if (confirmed) {
            try {
                await deleteDoc(doc(db, 'Bugreports', id));
                showToast('Bug Report erfolgreich gelöscht', 'warning');

                // Finde und entferne das Element direkt aus dem DOM
                const bugReportCard = document.querySelector(`.bug-report-card .delete-new[data-id="${id}"]`).closest('.bug-report-card');
                if (bugReportCard) {
                    bugReportCard.remove();
                    console.log(`Bug Report Card mit ID ${id} direkt aus dem DOM entfernt.`);
                }

                await loadBugReports(); // Bug Reports neu laden nach dem Löschen
            } catch (error) {
                console.error('Fehler beim Löschen des Bug Reports:', error);
                showToast('Fehler beim Löschen des Bug Reports: ' + error.message, 'error');
            }
        }
    }

    // Initialisiere Bug Reports Admin beim Laden der Seite
    initializeBugReport();
    initializeBugReportsAdmin();
}); 