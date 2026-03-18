// ---- Theme ----
function initTheme() {
    const saved = localStorage.getItem('theme');
    if (saved) {
        document.documentElement.setAttribute('data-theme', saved);
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

// ---- Intro animation ----
function initIntro() {
    var overlay = document.getElementById('intro-overlay');
    if (!overlay) return;

    // Lock scroll & force top
    document.documentElement.classList.add('intro-active');
    window.scrollTo(0, 0);

    var dismissed = false;
    function dismissIntro() {
        if (dismissed) return;
        dismissed = true;
        clearTimeout(autoTimer);
        document.removeEventListener('mousedown', onSkip);

        var introName = overlay.querySelector('.intro-name');
        var heroH1 = document.querySelector('.hero h1');

        // Fallback: if hero elements missing, simple fade-out
        if (!introName || !heroH1) {
            overlay.classList.add('done');
            document.documentElement.classList.remove('intro-active');
            window.scrollTo(0, 0);
            setTimeout(function () {
                if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
            }, 700);
            return;
        }

        // Step 1: fade out overlay decorations, keep intro-name
        overlay.classList.add('morphing');

        // Calculate transform: intro-name → hero h1 position
        var introRect = introName.getBoundingClientRect();
        var heroRect = heroH1.getBoundingClientRect();
        var dx = (heroRect.left + heroRect.width / 2) - (introRect.left + introRect.width / 2);
        var dy = (heroRect.top + heroRect.height / 2) - (introRect.top + introRect.height / 2);
        var scale = heroRect.width / introRect.width;

        introName.style.transition = 'transform 0.7s cubic-bezier(0.16, 1, 0.3, 1)';
        introName.style.transformOrigin = 'center center';
        introName.style.transform = 'translate(' + dx + 'px, ' + dy + 'px) scale(' + scale + ')';

        // Step 2: after morph lands, swap to hero content
        setTimeout(function () {
            introName.style.visibility = 'hidden';
            document.documentElement.classList.remove('intro-active');
            document.documentElement.classList.add('intro-done');
            window.scrollTo(0, 0);

            setTimeout(function () {
                if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
            }, 500);
        }, 700);
    }

    function onSkip(e) {
        if (e.button === 0) dismissIntro();
    }
    document.addEventListener('mousedown', onSkip);

    // Total intro duration: ring animations (~1.5s) + text (~2s) + hold (0.5s) = ~3.5s
    var autoTimer = setTimeout(dismissIntro, 3500);
}

// ---- Easter Egg: 0451 / two-finger double-tap ----
function initEasterEgg() {
    var seq = '';
    var code = '0451';
    var egg = document.getElementById('easter-egg');
    var input = document.getElementById('easter-egg-input');
    if (!egg || !input) return;

    function showEgg() {
        if (egg.style.display !== 'none' && egg.style.display !== '') return;
        egg.style.display = '';
    }

    // Keyboard: type 0451
    document.addEventListener('keydown', function (e) {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        seq += e.key;
        if (seq.length > code.length) seq = seq.slice(-code.length);
        if (seq === code) {
            showEgg();
            seq = '';
        }
    });

    // Mobile: two-finger double-tap
    var lastTwoFingerTap = 0;
    document.addEventListener('touchend', function (e) {
        // Detect a two-finger tap (touchend after 2 touches)
        if (e.touches.length === 0 && e.changedTouches.length === 2) {
            var now = Date.now();
            if (now - lastTwoFingerTap < 500) {
                showEgg();
                lastTwoFingerTap = 0;
            } else {
                lastTwoFingerTap = now;
            }
        }
    });

    // Submit answer
    input.addEventListener('keydown', function (e) {
        if (e.key !== 'Enter') return;
        var val = input.value.replace(/\s+/g, '').toLowerCase();
        var answer = 'keeponkeepingon';
        if (val === answer) {
            egg.classList.add('success');
            input.disabled = true;
            // Glitch transition
            var glitch = document.createElement('div');
            glitch.className = 'glitch-transition';
            document.body.appendChild(glitch);
            setTimeout(function () {
                window.location.href = 'secret.html';
            }, 900);
        } else {
            input.style.borderColor = '#ff2222';
            input.style.boxShadow = '0 0 12px rgba(255,34,34,0.3)';
            setTimeout(function () {
                input.style.borderColor = '';
                input.style.boxShadow = '';
            }, 500);
        }
    });
}

// ---- Init ----
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initLang();
    initIntro();
    initReveal();
    initSmoothScroll();
    initHamburger();
    initEasterEgg();
});
