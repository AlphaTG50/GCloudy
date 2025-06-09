// Firebase Konfiguration (from firebase-init.js)
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

// Firebase SDK imports (from firebase-init.js)
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.9.0/firebase-analytics.js";
import { getFirestore, collection, getDocs, addDoc, updateDoc, deleteDoc, doc, setDoc } from "https://www.gstatic.com/firebasejs/11.9.0/firebase-firestore.js";
import { getAuth, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.9.0/firebase-auth.js";

// Firebase initialisieren
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);
const auth = getAuth(app);

// All JavaScript logic (from main.js and login.js)
document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const appContent = document.getElementById('appContent');
    const homePageContent = document.getElementById('homePageContent');
    const linksPageContent = document.getElementById('linksPageContent');
    const nasPageContent = document.getElementById('nasPageContent');
    const adminPageContent = document.getElementById('adminPageContent');
    const infoPageContent = document.getElementById('infoPageContent');

    // Application specific elements
    const themeToggle = document.getElementById('themeToggle');
    const body = document.body;
    const bottomSectionLogoutBtn = document.getElementById('bottomSectionLogoutBtn');
    const adminNavLinkLi = document.getElementById('adminNavLinkLi');
    const navUl = document.querySelector('nav ul');

    // Admin Panel Elements
    const tabButtons = document.querySelectorAll('.admin-tabs-new .tab-button-new');
    const tabContents = document.querySelectorAll('.tab-content-new');
    const linkForm = document.getElementById('linkForm');
    const linkTitleInput = document.getElementById('linkTitle');
    const linkUrlInput = document.getElementById('linkUrl');
    const linkDescriptionInput = document.getElementById('linkDescription');
    const linkIconUrlInput = document.getElementById('linkIconUrl');
    const linksListAdmin = document.getElementById('linksListAdmin');
    const saveLinkBtn = document.getElementById('saveLinkBtn');
    let editingLinkDocId = null;
    const localServiceForm = document.getElementById('localServiceForm');
    const localServiceTitleInput = document.getElementById('localServiceTitle');
    const localServiceUrlInput = document.getElementById('localServiceUrl');
    const localServiceDescriptionInput = document.getElementById('localServiceDescription');
    const localServiceIconUrlInput = document.getElementById('localServiceIconUrl');
    const saveLocalServiceBtn = document.getElementById('saveLocalServiceBtn');
    const localServicesListAdmin = document.getElementById('localServicesListAdmin');
    let editingLocalServiceDocId = null;

    // Links Page Elements
    const searchInput = document.getElementById('searchInput');
    const noResults = document.getElementById('noResults');
    const linksList = document.getElementById('linksList');

    // NAS Page Elements
    const nasSearchInput = document.getElementById('nasSearchInput');
    const localServicesListContainer = document.getElementById('localServicesListContainer');
    const noNasResults = document.getElementById('noNasResults');

    // Info Modal Elements
    const infoButton = document.getElementById('infoButton');
    const infoModal = document.getElementById('infoModal');
    const modalCloseButton = infoModal.querySelector('.modal-close-button');

    // --- Helper Functions ---

    // Function to show a specific page content and hide others
    function showPage(pageId) {
        const allPages = document.querySelectorAll('.page-content');
        allPages.forEach(page => {
            if (page.id === pageId) {
                page.style.display = 'block'; // Or 'flex' for admin dashboard
                if (page.id === 'adminPageContent') {
                    // Admin dashboard uses flex for its internal layout
                    page.style.display = 'flex';
                }
            } else {
                page.style.display = 'none';
            }
        });
    }

    // Function to set the active navigation link
    function setActiveNavLink() {
        const currentHash = window.location.hash || '#home'; // Default to home if no hash
        const allNavLinks = document.querySelectorAll('nav a');

        allNavLinks.forEach(link => {
            link.classList.remove('active');
        });

        allNavLinks.forEach(link => {
            if (link.getAttribute('href') === currentHash) {
                link.classList.add('active');
            }
        });
    }


    // --- Theme Toggle ---

    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        body.classList.add('dark-mode');
    }

    themeToggle.addEventListener('click', () => {
        body.classList.toggle('dark-mode');
        const isDarkMode = body.classList.contains('dark-mode');
        localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    });


    // --- Logout Logic ---

    if (bottomSectionLogoutBtn) {
        bottomSectionLogoutBtn.addEventListener('click', async () => {
            try {
                await signOut(auth);
                localStorage.removeItem('loggedIn');
                localStorage.removeItem('userEmail');
                localStorage.removeItem('adminLoggedIn');
                window.location.href = 'login.html'; // Weiterleitung zur Login-Seite
            } catch (error) {
                console.error("Logout Error:", error.message);
                alert("Fehler beim Abmelden: " + error.message);
            }
        });
    }


    // --- Dynamic Sidebar Link Visibility ---

    window.updateSidebarLinkVisibility = function() {
        const userEmail = localStorage.getItem('userEmail');
        let nasNavLinkLi = document.getElementById('nasNavLinkLi');

        if (adminNavLinkLi) {
            adminNavLinkLi.style.display = (userEmail === 'guerkan.privat@gmail.com') ? 'list-item' : 'none';
        }

        if (userEmail === 'guerkan.privat@gmail.com') {
            if (!nasNavLinkLi) {
                nasNavLinkLi = document.createElement('li');
                nasNavLinkLi.id = 'nasNavLinkLi';
                nasNavLinkLi.innerHTML = '<a href="#nas" data-page="nas"><i class="fas fa-server"></i> Dienste</a>';
                if (adminNavLinkLi && adminNavLinkLi.parentNode === navUl) {
                    navUl.insertBefore(nasNavLinkLi, adminNavLinkLi);
                } else {
                    navUl.appendChild(nasNavLinkLi);
                }
            }
            nasNavLinkLi.style.display = 'list-item';
        } else {
            if (nasNavLinkLi) {
                nasNavLinkLi.remove();
            }
        }
        setActiveNavLink(); // Crucial: Call after updating sidebar links
    };


    // --- Navigation Logic ---

    navUl.addEventListener('click', async (e) => {
        const clickedLink = e.target.closest('a');
        if (!clickedLink) return;

        e.preventDefault();
        const pageId = clickedLink.dataset.page + 'PageContent'; // e.g., 'homePageContent'
        const href = clickedLink.getAttribute('href');

        // Update URL hash
        window.location.hash = href.substring(1);

        // Show the corresponding content
        showPage(pageId);
        setActiveNavLink(); // Set active link after page change

        // Specific actions for pages
        if (clickedLink.dataset.page === 'links') {
            renderLinksPublic('linksList', 'noResults', '');
        } else if (clickedLink.dataset.page === 'nas') {
            renderLocalServicesPublic('');
        } else if (clickedLink.dataset.page === 'admin') {
            const userEmail = localStorage.getItem('userEmail');
            if (userEmail === 'guerkan.privat@gmail.com') {
                initializeAdminPanel();
            } else {
                alert('Keine Berechtigung für den Admin-Bereich.');
                window.location.hash = '#home'; // Redirect to home if not admin
                showPage('homePageContent');
                setActiveNavLink();
            }
        }
    });

    // Handle Info Modal opening and closing
    if (infoButton && infoModal && modalCloseButton) {
        infoButton.addEventListener('click', () => {
            infoModal.classList.add('active');
        });

        modalCloseButton.addEventListener('click', () => {
            infoModal.classList.remove('active');
        });

        // Close modal when clicking outside (on the overlay itself)
        infoModal.addEventListener('click', (e) => {
            if (e.target === infoModal) {
                infoModal.classList.remove('active');
            }
        });
    }


    // --- Initial Page Load & Authentication Check ---

    onAuthStateChanged(auth, (user) => {
        const userEmail = localStorage.getItem('userEmail');
        const loggedIn = localStorage.getItem('loggedIn');

        if (loggedIn === 'true' || user) {
            appContent.style.display = 'flex'; // App-Inhalt anzeigen

            window.updateSidebarLinkVisibility(); // Sichtbarkeit der Seitenleistenlinks aktualisieren

            // Bestimmen, welche Seite basierend auf dem Hash oder Standard auf Startseite angezeigt werden soll
            const currentHash = window.location.hash;
            if (currentHash === '#links') {
                showPage('linksPageContent');
                renderLinksPublic('linksList', 'noResults', '');
            } else if (currentHash === '#nas' && userEmail === 'guerkan.privat@gmail.com') { // Nur für Admin-E-Mail
                showPage('nasPageContent');
                renderLocalServicesPublic('');
            } else if (currentHash === '#admin' && userEmail === 'guerkan.privat@gmail.com') { // Nur für Admin-E-Mail
                showPage('adminPageContent');
                initializeAdminPanel();
            } else {
                showPage('homePageContent'); // Standardmäßig Startseite
                window.location.hash = '#home'; // Startseiten-Hash setzen
            }
        } else {
            window.location.href = 'login.html'; // Zur Login-Seite umleiten, wenn nicht eingeloggt
        }
        setActiveNavLink(); // Aktiven Link nach dem Laden der Startseite setzen
    });


    // --- Admin Panel Logic ---

    function initializeAdminPanel() {
        const adminDashboard = document.getElementById('adminDashboard');
        if (adminDashboard) {
            tabButtons.forEach(button => {
                button.addEventListener('click', () => {
                    const tab = button.dataset.tab;
                    switchTab(tab);
                });
            });
            switchTab('links');
        }
    }

    function switchTab(activeTab) {
        tabButtons.forEach(button => {
            if (button.dataset.tab === activeTab) {
                button.classList.add('active');
            } else {
                button.classList.remove('active');
            }
        });

        tabContents.forEach(content => {
            if (content.id === `${activeTab}TabContent`) {
                content.style.display = 'flex';
                if (activeTab === 'links') {
                    loadLinks();
                } else if (activeTab === 'synology') {
                    loadLocalServices();
                }
            } else {
                content.style.display = 'none';
            }
        });
    }

    // Link Management (Admin)
    async function getLinksFromFirestore() {
        const linksCol = collection(db, 'Weblinks');
        const linkSnapshot = await getDocs(linksCol);
        const linksList = linkSnapshot.docs.map(_doc => ({ id: _doc.id, ..._doc.data() }));
        return linksList;
    }

    async function renderLinks() {
        if (!linksListAdmin) return;
        linksListAdmin.innerHTML = '';
        const links = await getLinksFromFirestore();
        links.forEach(link => {
            let iconHtml = '';
            if (link.iconUrl) {
                iconHtml = `<img src="${link.iconUrl}" alt="Link Icon">`;
            } else {
                iconHtml = `<i class="fas fa-globe"></i>`;
            }
            const div = document.createElement('div');
            div.classList.add('item-card-new');
            div.innerHTML = `
                <div class="item-icon">
                    ${iconHtml}
                </div>
                <div class="item-content-text">
                    <span>${link.title}</span>
                </div>
                <div class="item-actions">
                    <button class="edit" data-id="${link.id}">Bearbeiten</button>
                    <button class="delete-new" data-id="${link.id}">Löschen</button>
                </div>
            `;
            linksListAdmin.appendChild(div);
        });
    }

    async function loadLinks() {
        await renderLinks();
    }

    if (linkForm) {
        linkForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            let iconUrl = linkIconUrlInput.value;
            const linkData = {
                title: linkTitleInput.value,
                url: linkUrlInput.value,
                description: linkDescriptionInput.value,
                iconUrl: iconUrl,
            };
            try {
                if (editingLinkDocId) {
                    const linkRef = doc(db, 'Weblinks', editingLinkDocId);
                    await updateDoc(linkRef, linkData);
                    console.log("Link updated successfully!");
                } else {
                    const linkId = linkTitleInput.value;
                    if (!linkId || linkId.includes('/')) {
                        alert('Der Titel kann nicht als Dokumenten-ID verwendet werden, da er leer ist oder ungültige Zeichen (z.B. "/") enthält.');
                        return;
                    }
                    const linkRef = doc(db, 'Weblinks', linkId);
                    await setDoc(linkRef, linkData);
                    console.log("Link added successfully with custom ID!");
                }
                linkForm.reset();
                editingLinkDocId = null;
                saveLinkBtn.textContent = 'Speichern';
                await renderLinks();
            } catch (e) {
                console.error("Error adding/updating document: ", e);
                alert('Fehler beim Hinzufügen/Aktualisieren des Links: ' + e.message + '. Beachte, dass Links mit demselben Titel überschrieben werden.');
            }
        });
    }

    if (linksListAdmin) {
        linksListAdmin.addEventListener('click', async (e) => {
            if (e.target.classList.contains('edit')) {
                const idToEdit = e.target.dataset.id;
                const links = await getLinksFromFirestore();
                const linkToEdit = links.find(link => link.id === idToEdit);
                if (linkToEdit) {
                    linkTitleInput.value = linkToEdit.title;
                    linkUrlInput.value = linkToEdit.url;
                    linkDescriptionInput.value = linkToEdit.description;
                    linkIconUrlInput.value = linkToEdit.iconUrl || '';
                    editingLinkDocId = idToEdit;
                    saveLinkBtn.textContent = 'Aktualisieren';
                }
            } else if (e.target.classList.contains('delete-new')) {
                const idToDelete = e.target.dataset.id;
                if (confirm('Sind Sie sicher, dass Sie diesen Link löschen möchten?')) {
                    try {
                        await deleteDoc(doc(db, 'Weblinks', idToDelete));
                        console.log("Link successfully deleted!");
                        await renderLinks();
                    } catch (e) {
                        console.error("Error removing document: ", e);
                    }
                }
            }
        });
    }

    // Local Services Management (Admin)
    async function getLocalServicesFromFirestore() {
        const servicesCol = collection(db, 'LocalServices');
        const servicesSnapshot = await getDocs(servicesCol);
        const servicesList = servicesSnapshot.docs.map(_doc => ({ id: _doc.id, ..._doc.data() }));
        return servicesList;
    }

    async function renderLocalServices() {
        if (!localServicesListAdmin) return;
        localServicesListAdmin.innerHTML = '';
        const services = await getLocalServicesFromFirestore();
        services.forEach(service => {
            let iconHtml = '';
            if (service.iconUrl) {
                iconHtml = `<img src="${service.iconUrl}" alt="Dienst Icon">`;
            } else {
                iconHtml = `<i class="fas fa-cloud"></i>`;
            }
            const div = document.createElement('div');
            div.classList.add('item-card-new');
            div.innerHTML = `
                <div class="item-icon">
                    ${iconHtml}
                </div>
                <div class="item-content-text">
                    <span>${service.title}</span>
                </div>
                <div class="item-actions">
                    <button class="edit-local-service" data-id="${service.id}">Bearbeiten</button>
                    <button class="delete-new" data-id="${service.id}">Löschen</button>
                </div>
            `;
            localServicesListAdmin.appendChild(div);
        });
    }

    async function loadLocalServices() {
        await renderLocalServices();
    }

    if (localServiceForm) {
        localServiceForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const serviceData = {
                title: localServiceTitleInput.value,
                url: localServiceUrlInput.value,
                description: localServiceDescriptionInput.value,
                iconUrl: localServiceIconUrlInput.value,
            };
            try {
                if (editingLocalServiceDocId) {
                    const serviceRef = doc(db, 'LocalServices', editingLocalServiceDocId);
                    await updateDoc(serviceRef, serviceData);
                    console.log("Local Service updated successfully!");
                } else {
                    const serviceId = localServiceTitleInput.value;
                    if (!serviceId || serviceId.includes('/')) {
                        alert('Der Titel kann nicht als Dokumenten-ID verwendet werden, da er leer ist oder ungültige Zeichen (z.B. "/") enthält.');
                        return;
                    }
                    const serviceRef = doc(db, 'LocalServices', serviceId);
                    await setDoc(serviceRef, serviceData);
                    console.log("Local Service added successfully with custom ID!");
                }
                localServiceForm.reset();
                editingLocalServiceDocId = null;
                saveLocalServiceBtn.textContent = 'Dienst speichern';
                await renderLocalServices();
            } catch (e) {
                console.error("Error saving local service: ", e);
                alert("Fehler beim Speichern des lokalen Dienstes: " + e.message + ". Beachte, dass Dienste mit demselben Titel überschrieben werden.");
            }
        });
    }

    if (localServicesListAdmin) {
        localServicesListAdmin.addEventListener('click', async (e) => {
            if (e.target.classList.contains('edit-local-service')) {
                const idToEdit = e.target.dataset.id;
                const services = await getLocalServicesFromFirestore();
                const serviceToEdit = services.find(service => service.id === idToEdit);
                if (serviceToEdit) {
                    localServiceTitleInput.value = serviceToEdit.title;
                    localServiceUrlInput.value = serviceToEdit.url;
                    localServiceDescriptionInput.value = serviceToEdit.description;
                    localServiceIconUrlInput.value = serviceToEdit.iconUrl || '';
                    editingLocalServiceDocId = idToEdit;
                    saveLocalServiceBtn.textContent = 'Aktualisieren';
                }
            } else if (e.target.classList.contains('delete-new')) {
                const idToDelete = e.target.dataset.id;
                if (confirm('Sind Sie sicher, dass Sie diesen lokalen Dienst löschen möchten?')) {
                    try {
                        await deleteDoc(doc(db, 'LocalServices', idToDelete));
                        console.log("Local service successfully deleted!");
                        await renderLocalServices();
                    } catch (e) {
                        console.error("Error removing local service: ", e);
                    }
                }
            }
        });
    }

    // Public Links & Services Rendering
    async function getWeblinksFromFirestore() {
        const linksCol = collection(db, 'Weblinks');
        const linkSnapshot = await getDocs(linksCol);
        const linksList = linkSnapshot.docs.map(_doc => ({ id: _doc.id, ..._doc.data() }));
        return linksList;
    }

    async function renderLinksPublic(containerId, noResultsId, filterTerm = '') {
        const container = document.getElementById(containerId);
        const noResultsElem = document.getElementById(noResultsId);
        if (!container || !noResultsElem) {
            console.warn(`Container oder No-Results-Element nicht gefunden: ${containerId}, ${noResultsId}`);
            return;
        }
        container.innerHTML = '';
        const links = await getWeblinksFromFirestore();
        let hasResults = false;
        links.forEach(link => {
            const title = link.title.toLowerCase();
            const description = (link.description || '').toLowerCase();
            const searchTerm = filterTerm.toLowerCase();
            if (title.includes(searchTerm) || description.includes(searchTerm)) {
                let iconHtml = '';
                if (link.iconUrl) {
                    iconHtml = `<img src="${link.iconUrl}" alt="Link Icon" class="link-logo-img">`;
                } else {
                    iconHtml = `<i class="fas fa-globe"></i>`;
                }
                const linkCard = document.createElement('div');
                linkCard.classList.add('link-card');
                linkCard.innerHTML = `
                    <div class="link-logo">
                        ${iconHtml}
                    </div>
                    <div class="link-content">
                        <h3>${link.title}</h3>
                        <p>${link.description || 'Keine Beschreibung verfügbar.'}</p>
                    </div>
                    <a href="${link.url}" target="_blank">
                        <i class="fas fa-external-link-alt"></i>
                        Website besuchen
                    </a>
                `;
                container.appendChild(linkCard);
                hasResults = true;
            }
        });
        noResultsElem.style.display = hasResults ? 'none' : 'block';
    }

    if (searchInput) {
        searchInput.addEventListener('input', async (e) => {
            await renderLinksPublic('linksList', 'noResults', e.target.value);
        });
    }

    async function renderLocalServicesPublic(filterTerm = '') {
        const localServicesCol = collection(db, 'LocalServices');
        const servicesSnapshot = await getDocs(localServicesCol);
        const services = servicesSnapshot.docs.map(_doc => ({ id: _doc.id, ..._doc.data() }));
        if (!localServicesListContainer || !noNasResults) return;
        localServicesListContainer.innerHTML = '';
        let hasResults = false;
        services.forEach(service => {
            const title = service.title.toLowerCase();
            const description = (service.description || '').toLowerCase();
            const searchTerm = filterTerm.toLowerCase();
            if (title.includes(searchTerm) || description.includes(searchTerm)) {
                let iconHtml = '';
                if (service.iconUrl) {
                    iconHtml = `<img src="${service.iconUrl}" alt="Dienst Icon" class="link-logo-img">`;
                } else {
                    iconHtml = `<i class="fas fa-cloud"></i>`;
                }
                const serviceCard = document.createElement('div');
                serviceCard.classList.add('link-card', 'synology-drive-card');
                serviceCard.innerHTML = `
                        <div class="link-logo">
                            ${iconHtml}
                        </div>
                        <div class="link-content">
                            <h3>${service.title || 'Lokaler Dienst'}</h3>
                            <p>${service.description || 'Keine Beschreibung verfügbar.'}</p>
                        </div>
                        <a href="${service.url}" target="_blank">
                            <i class="fas fa-external-link-alt"></i>
                            Dienst öffnen
                        </a>
                    `;
                localServicesListContainer.appendChild(serviceCard);
                hasResults = true;
            }
        });
        // Update display of no-results message for NAS page
        if (!hasResults && filterTerm !== '') {
            noNasResults.style.display = 'block';
        } else {
            noNasResults.style.display = 'none';
        }
    }

    if (nasSearchInput) {
        nasSearchInput.addEventListener('input', async (e) => {
            await renderLocalServicesPublic(e.target.value);
        });
    }

    // Initial check for login status and show appropriate content
    const userEmail = localStorage.getItem('userEmail');
    const loggedIn = localStorage.getItem('loggedIn');
    if (loggedIn === 'true' && userEmail) {
        appContent.style.display = 'flex';
        // Handle initial page based on hash or default to home
        const initialHash = window.location.hash || '#home';
        showPage(initialHash.substring(1) + 'PageContent');
    } else {
        window.location.href = 'login.html';
    }
    setActiveNavLink();
}); 