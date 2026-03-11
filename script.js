// =========================================
// 1. CUSTOM CURSOR
// =========================================
const cursor = document.querySelector('.cursor');

// Déplacement
document.addEventListener('mousemove', (e) => {
    // Petit décalage pour centrer le cercle sur la pointe de la souris
    cursor.style.left = (e.clientX - 10) + 'px'; 
    cursor.style.top = (e.clientY - 10) + 'px';
});

// Effet Hover (Grossissement)
// On cible tous les éléments cliquables
const hoverables = document.querySelectorAll('a, button, .project-card, .modal-close, .lang-switch span');

hoverables.forEach(el => {
    el.addEventListener('mouseenter', () => {
        cursor.style.transform = 'scale(2.5)';
        cursor.style.background = 'rgba(139, 92, 246, 0.1)'; // Fond violet léger
        cursor.style.borderColor = 'transparent';
    });
    
    el.addEventListener('mouseleave', () => {
        cursor.style.transform = 'scale(1)';
        cursor.style.background = 'transparent';
        cursor.style.borderColor = '#8b5cf6'; // Retour bordure violette
    });
});


// =========================================
// 2. MODAL LOGIC (POP-UP)
// =========================================
const modal = document.querySelector('#project-modal');
const triggers = document.querySelectorAll('#trigger-project-1, .modal-trigger-btn'); // Clic sur l'article ou le bouton
const closeBtn = document.querySelector('.modal-close');
const body = document.body;

function openModal(e) {
    // Si le clic provient d'un lien, laisser la navigation se produire
    if (e.target.closest('a') && !e.target.closest('.modal-trigger-btn')) {
        return; 
    }
    // Empêcher le comportement par défaut pour d'autres éléments (ex: bouton)
    e.preventDefault();
    modal.classList.add('is-visible');
    body.classList.add('modal-open'); // Bloque le scroll
}

function closeModal() {
    modal.classList.remove('is-visible');
    body.classList.remove('modal-open'); // Réactive le scroll
}

// Events
triggers.forEach(trigger => {
    trigger.addEventListener('click', openModal);
});

closeBtn.addEventListener('click', closeModal);

// Fermer en cliquant sur le fond noir
modal.addEventListener('click', (e) => {
    if (e.target === modal) {
        closeModal();
    }
});

// Fermer avec la touche Echap
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('is-visible')) {
        closeModal();
    }
});


// =========================================
// 3. SCROLL REVEAL (ANIMATION D'APPARITION)
// =========================================
const observerOptions = {
    threshold: 0.1, // Déclenche quand 10% de l'élément est visible
    rootMargin: "0px 0px -50px 0px"
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
            // On arrête d'observer une fois apparu (pour ne pas rejouer l'anim)
            observer.unobserve(entry.target); 
        }
    });
}, observerOptions);

// Liste des éléments à animer
const elementsToAnimate = document.querySelectorAll(
    'h1, .subtitle, .intro-text, .section-header, .project-card, .timeline-item, .about-content'
);

// État initial (caché)
elementsToAnimate.forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(40px)'; // Décalé vers le bas
    el.style.transition = 'opacity 0.8s ease-out, transform 0.8s ease-out';
    observer.observe(el);
});


// =========================================
// 4. LANGUAGE SWITCHER
// =========================================
const langSwitch = document.querySelector('.lang-switch');
if (langSwitch) {
    const frBtn = langSwitch.querySelector('.lang-fr');
    const enBtn = langSwitch.querySelector('.lang-en');

    function setLanguage(lang) {
        if (lang === 'en') {
            document.body.classList.add('lang-en');
            enBtn.classList.add('active');
            frBtn.classList.remove('active');
        } else {
            document.body.classList.remove('lang-en');
            frBtn.classList.add('active');
            enBtn.classList.remove('active');
        }
        localStorage.setItem('preferred-lang', lang);
    }

    frBtn.addEventListener('click', () => setLanguage('fr'));
    enBtn.addEventListener('click', () => setLanguage('en'));

    // Check for saved preference
    const savedLang = localStorage.getItem('preferred-lang');
    if (savedLang) {
        setLanguage(savedLang);
    }
}