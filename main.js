document.addEventListener('DOMContentLoaded', () => {
    // Service-URLs Konfiguration
    const serviceUrls = {
        // Lokale Dienste
        'dsm': 'https://192.168.178.10/',
        'active-backup': 'https://192.168.178.10/activebackup',
        'contacts': 'https://192.168.178.10/contacts',
        'download-station': 'https://192.168.178.10/download',
        'file-station': 'https://192.168.178.10/file',
        'drive': 'https://192.168.178.10/drive',
        'photos': 'https://192.168.178.10/photo',
        'video-station': 'https://192.168.178.10/video',
        'vmm': 'https://192.168.178.10/vm',
        'home-assistant': 'http://homeassistant.local:8123/',
        'homebox': 'http://192.168.178.10:3100/',
        'portainer': 'http://192.168.178.10:9000/'
    };

    // Cloud-URLs Konfiguration
    const cloudUrls = {
        'dsm': 'https://quickconnect.to/guerkan/',
        'active-backup': 'https://quickconnect.to/guerkan/activebackup',
        'contacts': 'https://quickconnect.to/guerkan/contacts',
        'download-station': 'https://quickconnect.to/guerkan/download',
        'file-station': 'https://quickconnect.to/guerkan/file',
        'drive': 'https://quickconnect.to/guerkan/drive',
        'photos': 'https://quickconnect.to/guerkan/photo',
        'video-station': 'https://quickconnect.to/guerkan/video',
        'vmm': 'https://quickconnect.to/guerkan/vm',
        'home-assistant': 'https://homeassistant.gcloudy.de/',
        'homebox': 'https://homebox.gcloudy.de/',
        'portainer': 'https://portainer.gcloudy.de/'
    };

    // Event Listener für alle Service-Karten
    document.querySelectorAll('.service-card').forEach(card => {
        const serviceId = card.getAttribute('data-service');
        const switchInput = card.querySelector('.service-switch');
        
        // Nur Switches für Dienste mit Cloud-URL aktivieren
        if (switchInput && cloudUrls[serviceId]) {
            // Verhindere Event-Bubbling für den Switch-Container
            const switchContainer = switchInput.closest('.service-toggle');
            switchContainer.addEventListener('click', (e) => {
                e.stopPropagation();
            });

            switchInput.addEventListener('change', (e) => {
                e.stopPropagation();
                const isCloud = e.target.checked;
                card.setAttribute('data-mode', isCloud ? 'cloud' : 'local');
            });
        } else if (switchInput) {
            switchInput.parentElement.style.display = 'none';
        }

        // Klick-Handler für die Service-Karte
        card.addEventListener('click', (e) => {
            // Ignoriere Klicks auf den Switch oder dessen Container
            if (e.target.closest('.service-toggle')) {
                return;
            }
            
            const serviceId = card.getAttribute('data-service');
            const isCloud = card.getAttribute('data-mode') === 'cloud';
            const url = isCloud ? cloudUrls[serviceId] : serviceUrls[serviceId];
            
            if (url) {
                window.open(url, '_blank');
            } else {
                console.error(`URL für Service ${serviceId} nicht gefunden`);
            }
        });

        // Hover-Effekt für bessere Benutzerinteraktion
        card.addEventListener('mouseenter', () => {
            card.style.transform = 'translateY(-5px)';
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = 'translateY(0)';
        });
    });

    // Toggle-Funktion für einklappbare Bereiche
    document.querySelectorAll('.toggle-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.getAttribute('data-target');
            const wrapper = document.getElementById(targetId);
            if (wrapper) {
                wrapper.classList.toggle('collapsed');
            }
        });
    });

    // Tab-Logik für die Tab-Ansicht
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    function activateTab(tab) {
        tabBtns.forEach(b => b.classList.remove('active'));
        tabContents.forEach(tc => tc.classList.remove('active'));
        document.querySelector(`.tab-btn[data-tab="${tab}"]`).classList.add('active');
        document.getElementById('tab-' + tab).classList.add('active');
        localStorage.setItem('gcloudy_active_tab', tab);
    }
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.getAttribute('data-tab');
            activateTab(tab);
        });
    });
    // Tab-Status beim Laden wiederherstellen
    const savedTab = localStorage.getItem('gcloudy_active_tab');
    if (savedTab && document.querySelector(`.tab-btn[data-tab="${savedTab}"]`)) {
        activateTab(savedTab);
    }

    // Darkmode-Umschaltung beim Klick auf das Logo
    const logo = document.querySelector('.logo');
    function setDarkmode(active) {
        document.body.classList.toggle('darkmode', active);
        localStorage.setItem('gcloudy_darkmode', active ? '1' : '0');
    }
    if (logo) {
        logo.style.cursor = 'pointer';
        logo.addEventListener('click', () => {
            setDarkmode(!document.body.classList.contains('darkmode'));
        });
    }
    // Darkmode-Status beim Laden wiederherstellen
    const savedDark = localStorage.getItem('gcloudy_darkmode');
    if (savedDark === '1') setDarkmode(true);
    else setDarkmode(false);

    // Favoriten-Feature
    function getFavorites() {
        const favs = localStorage.getItem('gcloudy_favs');
        return favs ? JSON.parse(favs) : [];
    }
    function setFavorites(favs) {
        localStorage.setItem('gcloudy_favs', JSON.stringify(favs));
    }
    function updateFavorites() {
        const favs = getFavorites();
        const grid = document.querySelector('.services-grid');
        if (!grid) return;
        const cards = Array.from(grid.children);
        // Sortiere Favoriten nach oben, innerhalb alphabetisch
        cards.sort((a, b) => {
            const aFav = favs.includes(a.getAttribute('data-service')) ? 0 : 1;
            const bFav = favs.includes(b.getAttribute('data-service')) ? 0 : 1;
            if (aFav !== bFav) return aFav - bFav;
            // Alphabetisch nach Titel
            const aTitle = a.querySelector('h3').textContent.toLowerCase();
            const bTitle = b.querySelector('h3').textContent.toLowerCase();
            return aTitle.localeCompare(bTitle, 'de');
        });
        cards.forEach(card => grid.appendChild(card));
        // Setze Stern-Status
        cards.forEach(card => {
            const star = card.querySelector('.favorite-star');
            if (!star) return;
            if (favs.includes(card.getAttribute('data-service'))) {
                star.classList.add('fav');
                star.textContent = '★';
                star.title = 'Favorit entfernen';
            } else {
                star.classList.remove('fav');
                star.textContent = '☆';
                star.title = 'Als Favorit markieren';
            }
        });
    }
    // Event Listener für Favoriten-Stern
    document.querySelectorAll('.favorite-star').forEach(star => {
        star.addEventListener('click', e => {
            e.stopPropagation();
            const card = star.closest('.service-card');
            const service = card.getAttribute('data-service');
            let favs = getFavorites();
            if (favs.includes(service)) {
                favs = favs.filter(f => f !== service);
            } else {
                favs.push(service);
            }
            setFavorites(favs);
            updateFavorites();
        });
    });
    // Beim Laden Favoriten sortieren
    updateFavorites();

    // Suchfunktionalität
    const searchInput = document.getElementById('service-search');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            const cards = document.querySelectorAll('.service-card');

            cards.forEach(card => {
                const title = card.querySelector('h3').textContent.toLowerCase();
                const description = card.querySelector('p').textContent.toLowerCase();
                const matches = title.includes(searchTerm) || description.includes(searchTerm);
                
                card.style.display = matches ? 'block' : 'none';
                if (matches) {
                    card.style.animation = 'fadeInOnly 0.3s ease-out';
                }
            });
        });
    }
});