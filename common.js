// ---- Theme ----
function initTheme() {
    const saved = localStorage.getItem('theme');
    if (saved) {
        document.documentElement.setAttribute('data-theme', saved);
    } else if (window.matchMedia('(prefers-color-scheme: light)').matches) {
        document.documentElement.setAttribute('data-theme', 'light');
    }
    updateToggleIcon();
}

function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    updateToggleIcon();
}

function updateToggleIcon() {
    const btn = document.querySelector('.theme-toggle');
    if (!btn) return;
    const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
    btn.textContent = isDark ? '\u2600' : '\u263E';
    btn.title = isDark ? 'Light mode' : 'Dark mode';
}

// ---- Language toggle ----
function initLang() {
    const saved = localStorage.getItem('lang') || 'zh';
    if (saved === 'en') applyLang('en');
    updateLangButton();
}

function toggleLang() {
    const current = localStorage.getItem('lang') || 'zh';
    const next = current === 'zh' ? 'en' : 'zh';
    applyLang(next);
    localStorage.setItem('lang', next);
    updateLangButton();
}

function applyLang(lang) {
    document.querySelectorAll('[data-en]').forEach(el => {
        // Save original Chinese text on first switch
        if (!el.hasAttribute('data-zh')) {
            el.setAttribute('data-zh', el.innerHTML);
        }
        if (lang === 'en') {
            el.innerHTML = el.getAttribute('data-en');
        } else {
            el.innerHTML = el.getAttribute('data-zh');
        }
    });
    // Handle placeholder translations
    document.querySelectorAll('[data-en-placeholder]').forEach(el => {
        if (!el.hasAttribute('data-zh-placeholder')) {
            el.setAttribute('data-zh-placeholder', el.placeholder);
        }
        el.placeholder = lang === 'en' ? el.getAttribute('data-en-placeholder') : el.getAttribute('data-zh-placeholder');
    });
    document.documentElement.lang = lang === 'en' ? 'en' : 'zh-CN';
}

function updateLangButton() {
    const btn = document.querySelector('.lang-toggle');
    if (!btn) return;
    const isZh = (localStorage.getItem('lang') || 'zh') === 'zh';
    btn.textContent = isZh ? 'EN' : '\u4E2D';
    btn.title = isZh ? 'Switch to English' : '\u5207\u6362\u4E2D\u6587';
}

// ---- Scroll reveal ----
function initReveal() {
    const ANIM_CLASSES = ['reveal-wipe', 'reveal-left', 'reveal-scale', 'reveal-up'];
    const selector = ANIM_CLASSES.map(c => '.' + c).join(',');
    const els = document.querySelectorAll(selector);
    if (!els.length) return;

    const isHome = document.body.hasAttribute('data-home');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                if (!isHome) observer.unobserve(entry.target);
            } else if (isHome) {
                entry.target.classList.remove('visible');
            }
        });
    }, { threshold: 0.05, rootMargin: '0px 0px -30px 0px' });

    els.forEach(el => observer.observe(el));
}

// ---- Smooth scroll ----
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) target.scrollIntoView({ behavior: 'smooth' });
            const navLinks = document.querySelector('.nav-links');
            if (navLinks) navLinks.classList.remove('open');
        });
    });
}

// ---- Hamburger ----
function initHamburger() {
    const btn = document.querySelector('.hamburger');
    if (btn) btn.addEventListener('click', () => {
        document.querySelector('.nav-links').classList.toggle('open');
    });
}

// ---- Init ----
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initLang();
    initReveal();
    initSmoothScroll();
    initHamburger();
});
