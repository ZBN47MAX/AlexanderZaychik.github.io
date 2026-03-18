/* ════════════════════════════════════════════
   STRATAGEM HERO — Game Logic
   ════════════════════════════════════════════ */
(function () {
    'use strict';

    var IMG_BASE = 'secret/assets/images/';
    var ARROW_IMGS = {
        up:    IMG_BASE + 'U.png',
        down:  IMG_BASE + 'D.png',
        left:  IMG_BASE + 'L.png',
        right: IMG_BASE + 'R.png'
    };
    var ARROWS = { up: '\u2B06', down: '\u2B07', left: '\u2B05', right: '\u27A1' };
    var KEY_MAP = {
        ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
        w: 'up', W: 'up', s: 'down', S: 'down', a: 'left', A: 'left', d: 'right', D: 'right'
    };

    // ── DOM ──
    var screens = {
        title: document.getElementById('game-title'),
        play:  document.getElementById('game-play'),
        over:  document.getElementById('game-over')
    };
    var el = {
        btnRestart:  document.getElementById('btn-restart'),
        scoreVal:    document.getElementById('hud-score-val'),
        roundVal:    document.getElementById('hud-round-val'),
        timerBar:    document.getElementById('timer-bar'),
        roundQueue:  document.getElementById('round-queue'),
        stratIcon:   document.getElementById('strat-icon'),
        stratName:   document.getElementById('strat-name'),
        arrowSeq:    document.getElementById('arrow-sequence'),
        swipeArea:   document.getElementById('swipe-area'),
        feedback:    document.getElementById('input-feedback'),
        overScore:   document.getElementById('over-score'),
        overCount:   document.getElementById('over-count'),
        overStreak:  document.getElementById('over-streak')
    };

    // ── State ──
    var allStratagems = [];
    var recentIds = [];
    var state = {
        score: 0, round: 1, completed: 0,
        streak: 0, bestStreak: 0,
        currentStrat: null, inputIndex: 0,
        timeLeft: 0, maxTime: 8,
        timerInterval: null,
        roundStratagems: [], roundIndex: 0,
        playing: false,
        waiting: false  // waiting for first input to start timer
    };

    // ── Crypto random ──
    function rand() {
        if (window.crypto && crypto.getRandomValues) {
            return crypto.getRandomValues(new Uint32Array(1))[0] / 4294967296;
        }
        return Math.random();
    }

    function shuffle(arr) {
        for (var i = arr.length - 1; i > 0; i--) {
            var j = Math.floor(rand() * (i + 1));
            var t = arr[i]; arr[i] = arr[j]; arr[j] = t;
        }
        return arr;
    }

    function getLang() { return localStorage.getItem('lang') || 'zh'; }

    function showScreen(name) {
        for (var k in screens) screens[k].classList.toggle('active', k === name);
    }

    function showFeedback(text, cls) {
        el.feedback.textContent = text;
        el.feedback.className = 'input-feedback';
        void el.feedback.offsetWidth;
        el.feedback.className = 'input-feedback ' + cls;
    }

    // ── Fallback data if JSON fails ──
    var FALLBACK = [
        { id: 'reinforce', zh: '\u589E\u63F4', en: 'Reinforce', icon: '\uD83D\uDEE0\uFE0F', sequence: ['up','down','right','left','up'] },
        { id: 'resupply', zh: '\u8865\u7ED9', en: 'Resupply', icon: '\uD83D\uDCE6', sequence: ['down','down','up','right'] },
        { id: 'eagle_airstrike', zh: '\u9E70\u5F0F\u7A7A\u88AD', en: 'Eagle Airstrike', icon: '\uD83E\uDD85', sequence: ['up','right','down','right'] },
        { id: 'eagle_500kg', zh: '\u9E70\u5F0F500KG\u70B8\u5F39', en: 'Eagle 500kg Bomb', icon: '\uD83E\uDDE8', sequence: ['up','right','down','down','down'] },
        { id: 'orbital_laser', zh: '\u8F68\u9053\u6FC0\u5149', en: 'Orbital Laser', icon: '\uD83D\uDCA5', sequence: ['right','down','up','right','down'] },
        { id: 'orbital_380', zh: '380mm\u8F68\u9053\u5F39\u5E55', en: 'Orbital 380mm HE Barrage', icon: '\u2622\uFE0F', sequence: ['right','down','up','up','left','down','down'] },
        { id: 'orbital_walking', zh: '\u6B65\u8FDB\u5F0F\u8F68\u9053\u8F70\u70B8', en: 'Orbital Walking Barrage', icon: '\uD83C\uDFAF', sequence: ['right','down','right','down','right','down'] },
        { id: 'railgun', zh: '\u7535\u78C1\u6B65\u67AA', en: 'Railgun', icon: '\uD83D\uDD29', sequence: ['down','right','down','up','left','right'] },
        { id: 'flamethrower', zh: '\u55B7\u706B\u5668', en: 'Flamethrower', icon: '\uD83D\uDD25', sequence: ['down','left','up','down','up'] },
        { id: 'autocannon', zh: '\u673A\u70AE', en: 'Autocannon', icon: '\u2699\uFE0F', sequence: ['down','left','down','up','up','right'] },
        { id: 'orbital_precision', zh: '\u8F68\u9053\u7CBE\u786E\u6253\u51FB', en: 'Orbital Precision Strike', icon: '\uD83D\uDCCD', sequence: ['right','right','up'] },
        { id: 'machine_gun', zh: '\u673A\u67AA', en: 'Machine Gun', icon: '\uD83D\uDD2B', sequence: ['down','left','down','up','right'] },
        { id: 'hellbomb', zh: '\u5730\u72F1\u706B\u70B8\u5F39', en: 'Hellbomb', icon: '\u2622\uFE0F', sequence: ['down','up','left','down','up','right','down','up'] }
    ];

    // ── Load JSON (handle file:// where status=0) ──
    function loadStratagems(cb) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', 'secret/stratagems.json', true);
        xhr.onload = function () {
            try {
                var data = JSON.parse(xhr.responseText);
                if (data && data.length) allStratagems = data;
            } catch (e) {}
            if (!allStratagems.length) allStratagems = FALLBACK;
            cb();
        };
        xhr.onerror = function () {
            allStratagems = FALLBACK;
            cb();
        };
        xhr.send();
    }

    // ── Weighted pick — truly random, avoids recent ──
    function pickRoundStratagems(count, round) {
        var pool = allStratagems.filter(function (s) {
            return recentIds.indexOf(s.id) === -1;
        });
        if (pool.length < count) pool = allStratagems.slice();

        // Weight: heavy random noise + slight bias for longer seqs in later rounds
        var items = pool.map(function (s) {
            var w = 0.5 + rand() * 1.5;                         // big noise range
            if (round > 2) w += (s.sequence.length - 3) * 0.15; // mild length bias
            w *= (0.4 + rand() * 1.2);                          // second noise pass
            return { strat: s, w: w };
        });

        // Sort descending by weight, pick top N
        items.sort(function (a, b) { return b.w - a.w; });
        var picked = items.slice(0, count).map(function (x) { return x.strat; });

        // Shuffle picked order
        shuffle(picked);

        // Update recent (only block for next round)
        recentIds = picked.map(function (s) { return s.id; });

        return picked;
    }

    // ── Difficulty curve ──
    function getDifficulty(round) {
        //  R1:3  R2:4  R3:5  R4:5  R5:6  R6:7  R7:7  R8:8 ... cap 10
        var count = Math.min(3 + Math.ceil(round * 0.6), 10);
        //  R1:8  R2:7.3  R3:6.6  R4:5.9  R5:5.2 ... floor 3
        var time = Math.max(8 - (round - 1) * 0.7, 3);
        return { count: count, time: time };
    }

    // ── Render queue ──
    function renderQueue() {
        el.roundQueue.innerHTML = '';
        var lang = getLang();
        state.roundStratagems.forEach(function (strat, i) {
            var item = document.createElement('div');
            item.className = 'queue-item';
            if (i === state.roundIndex) item.classList.add('active');
            else if (i < state.roundIndex) item.classList.add('done');
            item.innerHTML = '<span class="q-icon">' + strat.icon + '</span>' +
                '<span class="q-name">' + (lang === 'en' ? strat.en : strat.zh) + '</span>';
            el.roundQueue.appendChild(item);
        });
    }

    function updateQueueHighlight() {
        var items = el.roundQueue.children;
        for (var i = 0; i < items.length; i++) {
            items[i].classList.remove('active', 'done');
            if (i < state.roundIndex) items[i].classList.add('done');
            else if (i === state.roundIndex) items[i].classList.add('active');
        }
    }

    // ── Show stratagem ──
    function showStratagem() {
        var strat = state.roundStratagems[state.roundIndex];
        if (!strat) { gameOver(); return; }
        state.currentStrat = strat;
        state.inputIndex = 0;

        // Icon — use image if available, else emoji
        el.stratIcon.innerHTML = '';
        var imgPath = IMG_BASE + 'pac_' + strat.id + '.png';
        var img = new Image();
        img.src = imgPath;
        img.className = 'strat-icon-img';
        img.alt = strat.en;
        img.onerror = function () {
            el.stratIcon.textContent = strat.icon;
        };
        img.onload = function () {
            el.stratIcon.innerHTML = '';
            el.stratIcon.appendChild(img);
        };
        el.stratIcon.textContent = strat.icon; // fallback while loading
        el.stratIcon.style.animation = 'none';
        void el.stratIcon.offsetWidth;
        el.stratIcon.style.animation = '';

        var lang = getLang();
        el.stratName.textContent = lang === 'en' ? strat.en : strat.zh;

        // Arrow keys — use directional images
        el.arrowSeq.innerHTML = '';
        strat.sequence.forEach(function (dir, i) {
            var key = document.createElement('div');
            key.className = 'arrow-key' + (i === 0 ? ' current' : '');
            var arrowImg = document.createElement('img');
            arrowImg.src = ARROW_IMGS[dir];
            arrowImg.className = 'arrow-img';
            arrowImg.alt = dir;
            arrowImg.onerror = function () {
                key.textContent = ARROWS[dir];
            };
            key.appendChild(arrowImg);
            el.arrowSeq.appendChild(key);
        });

        updateQueueHighlight();
        showFeedback('', '');
    }

    // ── Timer ──
    function startTimer() {
        state.timeLeft = state.maxTime;
        el.timerBar.style.transform = 'scaleX(1)';
        el.timerBar.classList.remove('danger');
        clearInterval(state.timerInterval);
        var tick = 50;
        state.timerInterval = setInterval(function () {
            state.timeLeft -= tick / 1000;
            var r = Math.max(0, state.timeLeft / state.maxTime);
            el.timerBar.style.transform = 'scaleX(' + r + ')';
            if (r < 0.3) el.timerBar.classList.add('danger');
            if (state.timeLeft <= 0) gameOver();
        }, tick);
    }

    function resetTimer() {
        state.timeLeft = state.maxTime;
        el.timerBar.style.transform = 'scaleX(1)';
        el.timerBar.classList.remove('danger');
    }

    // ── Input handler ──
    function handleDirection(dir) {
        // Block all input during intro animations
        if (document.documentElement.classList.contains('intro-locked')) return;

        // Title screen → start game on any arrow
        if (screens.title.classList.contains('active')) {
            beginGame();
            return;
        }

        // Waiting for first input → start timer, then process
        if (state.waiting) {
            state.waiting = false;
            state.playing = true;
            startTimer();
        }

        if (!state.playing || !state.currentStrat) return;

        var seq = state.currentStrat.sequence;
        var expected = seq[state.inputIndex];

        if (dir === expected) {
            GameAudio.play('press');
            var keys = el.arrowSeq.children;
            keys[state.inputIndex].classList.remove('current');
            keys[state.inputIndex].classList.add('done');
            state.inputIndex++;
            if (state.inputIndex < seq.length) {
                keys[state.inputIndex].classList.add('current');
            } else {
                onStratagemComplete();
            }
        } else {
            GameAudio.play('error');
            state.inputIndex = 0;
            state.streak = 0;
            var allKeys = el.arrowSeq.children;
            for (var i = 0; i < allKeys.length; i++) {
                allKeys[i].className = 'arrow-key' + (i === 0 ? ' current wrong' : '');
            }
            showFeedback('MISS', 'miss');
            setTimeout(function () {
                if (el.arrowSeq.children[0]) el.arrowSeq.children[0].classList.remove('wrong');
            }, 300);
        }
    }

    // ── Stratagem complete ──
    function onStratagemComplete() {
        GameAudio.play('success');
        state.completed++;
        state.streak++;
        if (state.streak > state.bestStreak) state.bestStreak = state.streak;

        var timeBonus = Math.round(state.timeLeft / state.maxTime * 50);
        var streakBonus = Math.min(state.streak * 10, 100);
        var lengthBonus = state.currentStrat.sequence.length * 5;
        var points = 100 + timeBonus + streakBonus + lengthBonus;
        state.score += points;
        el.scoreVal.textContent = state.score;

        var lang = getLang();
        showFeedback((lang === 'en' ? 'NICE! +' : '\u5B8C\u6210\uFF01+') + points, 'perfect');

        state.roundIndex++;
        if (state.roundIndex >= state.roundStratagems.length) {
            nextRound();
        } else {
            resetTimer();
            showStratagem();
        }
    }

    // ── Next round (with buffer pause) ──
    function nextRound() {
        // Pause: stop timer, block input
        state.playing = false;
        clearInterval(state.timerInterval);

        state.round++;
        el.roundVal.textContent = state.round;

        var diff = getDifficulty(state.round);
        state.maxTime = diff.time;

        // Clear current display
        el.arrowSeq.innerHTML = '';
        el.stratIcon.textContent = '';
        el.stratName.textContent = '';

        GameAudio.play('roundOver');

        // Round flash
        var flash = document.createElement('div');
        flash.className = 'round-clear';
        var lang = getLang();
        flash.innerHTML = '<span>' + (lang === 'en' ? 'ROUND ' : '\u7B2C ') + state.round + (lang === 'en' ? '' : ' \u56DE\u5408') + '</span>';
        document.body.appendChild(flash);
        setTimeout(function () { if (flash.parentNode) flash.parentNode.removeChild(flash); }, 1200);

        // Buffer: 1.5s pause before next round starts
        setTimeout(function () {
            GameAudio.play('roundStart');
            state.roundStratagems = pickRoundStratagems(diff.count, state.round);
            state.roundIndex = 0;
            renderQueue();
            showStratagem();
            resetTimer();
            state.playing = true;
            startTimer();
        }, 1500);
    }

    // ── Game over ──
    function gameOver() {
        state.playing = false;
        state.waiting = false;
        clearInterval(state.timerInterval);
        GameAudio.stopMusic();
        GameAudio.play('gameOver');
        el.overScore.textContent = state.score;
        el.overCount.textContent = state.completed;
        el.overStreak.textContent = state.bestStreak;
        showScreen('over');
    }

    // ── Begin game (called from title on first arrow input) ──
    function beginGame() {
        showScreen('play');

        // 3-second ready phase with blinking hint
        state.playing = false;
        state.waiting = false;
        el.roundQueue.innerHTML = '';
        el.arrowSeq.innerHTML = '';
        el.stratIcon.textContent = '';
        el.stratName.textContent = '';
        el.timerBar.style.transform = 'scaleX(1)';
        el.timerBar.classList.remove('danger');

        GameAudio.startMusic();
        GameAudio.play('roundStart');

        var lang = getLang();
        showFeedback(lang === 'en' ? 'GET READY...' : '\u505A\u597D\u51C6\u5907...', 'ready');

        setTimeout(function () {
            // Init state
            state.score = 0;
            state.round = 1;
            state.completed = 0;
            state.streak = 0;
            state.bestStreak = 0;
            state.inputIndex = 0;
            recentIds = [];

            var diff = getDifficulty(1);
            state.maxTime = diff.time;

            el.scoreVal.textContent = '0';
            el.roundVal.textContent = '1';

            state.roundStratagems = pickRoundStratagems(diff.count, 1);
            state.roundIndex = 0;
            renderQueue();
            showStratagem();

            // Enter waiting state — timer starts on first arrow input
            state.waiting = true;
            showFeedback(lang === 'en' ? 'INPUT TO START!' : '\u8F93\u5165\u5F00\u59CB\uFF01', 'blink');
        }, 3000);
    }

    // ── Keyboard — always prevent arrow default to stop scrolling ──
    document.addEventListener('keydown', function (e) {
        var dir = KEY_MAP[e.key];
        if (dir) {
            e.preventDefault();
            handleDirection(dir);
        }
        // Block F5/Ctrl+R refresh during gameplay
        if (state.playing && (e.key === 'F5' || (e.ctrlKey && e.key === 'r'))) {
            e.preventDefault();
        }
    });

    // ── Swipe (mobile) ──
    (function () {
        var area = el.swipeArea;
        if (!area) return;
        var sx, sy, threshold = 30;
        area.addEventListener('touchstart', function (e) {
            sx = e.touches[0].clientX;
            sy = e.touches[0].clientY;
        }, { passive: true });
        area.addEventListener('touchend', function (e) {
            if (sx === undefined) return;
            var dx = e.changedTouches[0].clientX - sx;
            var dy = e.changedTouches[0].clientY - sy;
            sx = undefined;
            if (Math.abs(dx) < threshold && Math.abs(dy) < threshold) return;
            handleDirection(
                Math.abs(dx) > Math.abs(dy)
                    ? (dx > 0 ? 'right' : 'left')
                    : (dy > 0 ? 'down' : 'up')
            );
        }, { passive: true });
    })();

    // ── Restart button ──
    el.btnRestart.addEventListener('click', function () {
        showScreen('title');
    });

    // ── Init ──
    loadStratagems(function () {
        if (typeof applyLang === 'function') applyLang(getLang());
    });

    // ── Language switch re-render ──
    // When user toggles language, re-render queue and current stratagem name
    var origToggleLang = window.toggleLang;
    window.toggleLang = function () {
        if (typeof origToggleLang === 'function') origToggleLang();
        // Re-render game text
        if (state.roundStratagems.length) renderQueue();
        if (state.currentStrat) {
            var lang = getLang();
            el.stratName.textContent = lang === 'en' ? state.currentStrat.en : state.currentStrat.zh;
        }
    };

})();
