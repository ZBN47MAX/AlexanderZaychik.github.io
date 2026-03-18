/* ════════════════════════════════════════════
   STRATAGEM HERO — Audio Manager
   ════════════════════════════════════════════ */
var GameAudio = (function () {
    'use strict';

    var BASE = 'secret/assets/audio/';
    var sounds = {};
    var music = null;
    var musicPlaying = false;

    function load(name, file, vol) {
        var a = new Audio(BASE + file);
        a.volume = vol || 0.5;
        a.preload = 'auto';
        sounds[name] = a;
    }

    function init() {
        load('press', 'button_press.mp3', 0.4);
        load('error', 'button_press_error.mp3', 0.4);
        load('success', 'sequence_success.mp3', 0.5);
        load('roundStart', 'round_start_coin.mp3', 0.5);
        load('roundOver', 'round_over.mp3', 0.5);
        load('gameOver', 'game_over.mp3', 0.6);

        music = new Audio(BASE + 'game_music.mp3');
        music.volume = 0.55;
        music.loop = true;
    }

    function play(name) {
        var s = sounds[name];
        if (!s) return;
        // Clone for overlapping sounds
        var clone = s.cloneNode();
        clone.volume = s.volume;
        clone.play().catch(function () {});
    }

    function startMusic() {
        if (music && !musicPlaying) {
            music.currentTime = 0;
            music.play().catch(function () {});
            musicPlaying = true;
        }
    }

    function stopMusic() {
        if (music) {
            music.pause();
            music.currentTime = 0;
            musicPlaying = false;
        }
    }

    init();

    return {
        play: play,
        startMusic: startMusic,
        stopMusic: stopMusic
    };
})();
