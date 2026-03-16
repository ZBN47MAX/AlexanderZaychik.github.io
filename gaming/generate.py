#!/usr/bin/env python3
"""Generate gaming.html and update index.html from games_db.json

Run from project root:  python gaming/generate.py

Data source: gaming/games_db.json
"""
import html
import os
import re
from urllib.parse import quote

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.dirname(SCRIPT_DIR)

IMG_DIR = 'gaming/covers'
IMG_DIR_ENCODED = quote(IMG_DIR, safe='/')

def encode_img_src(filename):
    return IMG_DIR_ENCODED + '/' + quote(filename, safe='')

def has_chinese(s):
    return any('\u4e00' <= c <= '\u9fff' or '\u3000' <= c <= '\u303f' or
               '\uff00' <= c <= '\uffef' for c in s)

def playtime_to_en(pt):
    if '小时' in pt:
        return pt.replace(' 小时', ' hrs')
    elif '分钟' in pt:
        return pt.replace(' 分钟', ' min')
    return pt

def parse_hours(pt):
    if '小时' in pt:
        try: return float(pt.replace(',', '').replace(' 小时', ''))
        except: return 0
    elif '分钟' in pt:
        try: return float(pt.replace(',', '').replace(' 分钟', '')) / 60
        except: return 0
    return 0

def parse_ach(ach):
    if ach and '/' in ach:
        parts = ach.split('/')
        try:
            done, total = int(parts[0]), int(parts[1])
            return (done / total) if total > 0 else 0, done, total
        except ValueError:
            pass
    return 0, 0, 0

# ---- Read single database (JSON) ----
import json

db_path = os.path.join(SCRIPT_DIR, 'games_db.json')
with open(db_path, 'r', encoding='utf-8') as f:
    db_raw = json.load(f)

games = []
for entry in db_raw:
    zh_name = entry.get('zh_name', '').strip()
    en_name = entry.get('en_name', '').strip()
    if not zh_name and not en_name:
        continue
    display_name = zh_name if zh_name else en_name
    games.append({
        'name':         display_name,
        'zh_name':      zh_name,
        'en_name':      en_name,
        'playtime':     entry.get('playtime', '').strip(),
        'last_played':  entry.get('last_played', '').strip(),
        'achievements': entry.get('achievements', '').strip(),
        'image':        entry.get('cover', '').strip(),
        'blacklisted':  bool(entry.get('blacklisted', False)),
    })

# ---- Build game cards HTML (skip blacklisted) ----
cards = []
for g in games:
    if g['blacklisted']:
        continue
    name_escaped = html.escape(g['name'])
    playtime = html.escape(g['playtime']) if g['playtime'] else ''
    achievements = html.escape(g['achievements']) if g['achievements'] else ''

    if g['image']:
        img_src = encode_img_src(g['image'])
        img_html = f'<img class="game-cover" src="{img_src}" alt="{name_escaped}" loading="lazy">'
    else:
        img_html = '<div class="game-cover-placeholder"></div>'

    # Achievement bar
    ach_html = ''
    if achievements and '/' in achievements:
        parts = achievements.split('/')
        try:
            done = int(parts[0])
            total = int(parts[1])
            pct = round(done / total * 100) if total > 0 else 0
            if done == total:
                ach_class = ' ach-complete'
            elif pct >= 50:
                ach_class = ' ach-half'
            else:
                ach_class = ''
            ach_html = f'''<div class="game-ach{ach_class}">
                    <div class="ach-bar"><div class="ach-fill" style="width:{pct}%"></div></div>
                    <span>{achievements}</span>
                </div>'''
        except ValueError:
            ach_html = f'<div class="game-ach"><span>{achievements}</span></div>'

    # Playtime with i18n
    if playtime:
        playtime_en = html.escape(playtime_to_en(g['playtime']))
        if playtime != playtime_en:
            time_html = f'<span class="game-time" data-en="{playtime_en}">{playtime}</span>'
        else:
            time_html = f'<span class="game-time">{playtime}</span>'
    else:
        time_html = ''

    # Game name with i18n
    # 3 cases:
    #   zh + en  → show zh, data-en for toggle
    #   zh only  → show zh, no toggle (same name both languages)
    #   en only  → show en, no toggle (same name both languages)
    zh_name = g['zh_name']
    en_name = g['en_name']
    if zh_name and en_name:
        name_h4 = f'<h4 data-en="{html.escape(en_name)}">{name_escaped}</h4>'
    else:
        name_h4 = f'<h4>{name_escaped}</h4>'

    card = f'''        <div class="game-item">
            {img_html}
            <div class="game-info">
                {name_h4}
                {time_html}
                {ach_html}
            </div>
        </div>'''
    cards.append(card)

cards_html = '\n'.join(cards)

# ---- Stats ----
# Game count excludes blacklisted; hours and achievements include ALL games
total_games = sum(1 for g in games if not g['blacklisted'])
total_hours = sum(parse_hours(g['playtime']) for g in games)
full_ach = sum(1 for g in games if g['achievements'] and '/' in g['achievements']
               and g['achievements'].split('/')[0] == g['achievements'].split('/')[1])

# ---- Write gaming.html ----
page_html = f'''<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>游戏经历 | Alexander Zaychik</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>

<nav>
    <div class="nav-inner">
        <a href="index.html" class="logo">Alexander.dev</a>
        <div class="nav-right">
            <button class="hamburger" aria-label="Toggle menu">
                <span></span><span></span><span></span>
            </button>
            <ul class="nav-links">
                <li><a href="index.html" data-en="Home">首页</a></li>
                <li><a href="index.html#skills" data-en="Skills">技能</a></li>
                <li><a href="education.html" data-en="Education">教育</a></li>
                <li><a href="projects.html" data-en="Projects">项目</a></li>
                <li><a href="gaming.html" class="active" data-en="Gaming">游戏经历</a></li>
                <li><a href="index.html#contact" data-en="Contact">联系</a></li>
            </ul>
            <button class="lang-toggle" onclick="toggleLang()"></button>
            <button class="theme-toggle" onclick="toggleTheme()"></button>
        </div>
    </div>
</nav>

<div class="page-header">
    <a href="index.html" class="back-link" data-en=" Back to Home"> 返回首页</a>
    <h1 data-en="Gaming Experience">游戏经历</h1>
    <p>Gaming Experience</p>
</div>

<section>
    <div class="gaming-stats">
        <div class="stat-card">
            <div class="stat-num">{total_games}</div>
            <div class="stat-label" data-en="Games Owned">游戏收藏</div>
        </div>
        <div class="stat-card">
            <div class="stat-num">{total_hours:,.0f}</div>
            <div class="stat-label" data-en="Hours Played">游玩小时</div>
        </div>
        <div class="stat-card">
            <div class="stat-num">{full_ach}</div>
            <div class="stat-label" data-en="Perfected">全成就</div>
        </div>
    </div>

    <div class="gaming-controls">
        <input type="text" id="gameSearch" class="game-search" placeholder="搜索游戏..." data-en-placeholder="Search games...">
        <select id="gameSort" class="game-sort">
            <option value="default" data-en="Default Order">默认排序</option>
            <option value="time-desc" data-en="Playtime ↓">游戏时间 ↓</option>
            <option value="time-asc" data-en="Playtime ↑">游戏时间 ↑</option>
            <option value="name" data-en="Name A-Z">名称 A-Z</option>
            <option value="ach-count" data-en="Achievements ↓">成就数量 ↓</option>
            <option value="ach-pct" data-en="Completion % ↓">成就比例 ↓</option>
        </select>
    </div>

    <div class="games-grid" id="gamesGrid">
{cards_html}
    </div>
</section>

<footer>
    <p>&copy; 2026 Alexander Zaychik &mdash; Built with passion for games.</p>
    <p style="margin-top:0.5rem">
        <a href="mailto:alexanderzaychik47@gmail.com">alexanderzaychik47@gmail.com</a>
        &nbsp;|&nbsp;
        <a href="https://zbn47max-blog.notion.site/" target="_blank">Notion</a>
    </p>
</footer>

<script src="common.js"></script>
<script>
const searchInput = document.getElementById('gameSearch');
const sortSelect = document.getElementById('gameSort');
const grid = document.getElementById('gamesGrid');

// Max playtime across all games (for normalizing score)
let maxTime = 0;

function getTimeMinutes(el) {{
    const timeEl = el.querySelector('.game-time');
    if (!timeEl) return 0;
    const t = timeEl.getAttribute('data-zh') || timeEl.textContent;
    if (t.includes('小时')) return parseFloat(t.replace(/,/g,'').replace(' 小时','')) * 60 || 0;
    if (t.includes('分钟')) return parseFloat(t.replace(/,/g,'').replace(' 分钟','')) || 0;
    return 0;
}}

function getAch(el) {{
    const achEl = el.querySelector('.game-ach span');
    if (!achEl) return {{ done: 0, total: 0, pct: 0 }};
    const t = achEl.textContent;
    const m = t.match(/(\d+)\/(\d+)/);
    if (!m) return {{ done: 0, total: 0, pct: 0 }};
    const done = parseInt(m[1]), total = parseInt(m[2]);
    return {{ done, total, pct: total > 0 ? done / total : 0 }};
}}

function getDefaultScore(el) {{
    const time = getTimeMinutes(el);
    const ach = getAch(el);
    // Composite: 50% normalized playtime + 50% achievement completion %
    const timeScore = maxTime > 0 ? time / maxTime : 0;
    return 0.5 * timeScore + 0.5 * ach.pct;
}}

function filterAndSort() {{
    const q = searchInput.value.toLowerCase();
    const items = Array.from(grid.children);
    items.forEach(item => {{
        const h4 = item.querySelector('h4');
        const zhName = (h4.getAttribute('data-zh') || h4.textContent).toLowerCase();
        const enName = (h4.getAttribute('data-en') || '').toLowerCase();
        item.style.display = (zhName.includes(q) || enName.includes(q)) ? '' : 'none';
    }});
    const sortVal = sortSelect.value;
    const sorted = items.sort((a, b) => {{
        if (sortVal === 'default') return getDefaultScore(b) - getDefaultScore(a);
        if (sortVal === 'name') return a.querySelector('h4').textContent.localeCompare(b.querySelector('h4').textContent);
        if (sortVal === 'time-desc') return getTimeMinutes(b) - getTimeMinutes(a);
        if (sortVal === 'time-asc') return getTimeMinutes(a) - getTimeMinutes(b);
        if (sortVal === 'ach-count') return getAch(b).done - getAch(a).done;
        if (sortVal === 'ach-pct') return getAch(b).pct - getAch(a).pct;
        return 0;
    }});
    sorted.forEach(item => grid.appendChild(item));
}}

// Compute maxTime on load
(function() {{
    const items = Array.from(grid.children);
    items.forEach(item => {{
        const t = getTimeMinutes(item);
        if (t > maxTime) maxTime = t;
    }});
}})()

searchInput.addEventListener('input', filterAndSort);
sortSelect.addEventListener('change', filterAndSort);
</script>
</body>
</html>
'''

with open(os.path.join(ROOT_DIR, 'gaming.html'), 'w', encoding='utf-8') as f:
    f.write(page_html)

print(f"Generated gaming.html with {total_games} games")
print(f"  {sum(1 for g in games if g['image'])} with covers, {sum(1 for g in games if g['en_name'])} with translations")
print(f"  Total hours: {total_hours:,.0f}, Full achievements: {full_ach}")

# ---- Update index.html gaming brief ----
max_hours = max((parse_hours(g['playtime']) for g in games), default=1) or 1
scored = []
for g in games:
    if g['blacklisted']:
        continue
    hrs = parse_hours(g['playtime'])
    ach_rate, ach_done, ach_total = parse_ach(g['achievements'])
    score = 0.5 * (hrs / max_hours) + 0.5 * ach_rate
    scored.append((score, hrs, ach_done, ach_total, g))

scored.sort(key=lambda x: x[0], reverse=True)
top_games = scored[:5]

brief_cards = []
for score, hrs, ach_done, ach_total, g in top_games:
    name_escaped = html.escape(g['name'])
    time_str = f'{hrs:,.0f}h' if hrs >= 1 else f'{hrs * 60:.0f}min'
    ach_text = f'{ach_done}/{ach_total}' if ach_total > 0 else ''
    if g['image']:
        img_html = f'<img class="brief-cover" src="{encode_img_src(g["image"])}" alt="{name_escaped}" loading="lazy">'
    else:
        img_html = '<div class="brief-cover-placeholder"></div>'
    meta_str = ' · '.join([time_str] + ([ach_text] if ach_text else []))

    if g['zh_name'] and g['en_name']:
        brief_name = f'<h3 data-en="{html.escape(g["en_name"])}">{name_escaped}</h3>'
    else:
        brief_name = f'<h3>{name_escaped}</h3>'

    brief_cards.append(f'''        <a href="gaming.html" class="brief-card">
            {img_html}
            <div class="brief-body">
                {brief_name}
                <span class="brief-meta">{meta_str}</span>
            </div>
            <span class="brief-arrow">&rsaquo;</span>
        </a>''')

brief_html = '\n'.join(brief_cards)

with open(os.path.join(ROOT_DIR, 'index.html'), 'r', encoding='utf-8') as f:
    index_content = f.read()

gaming_match = re.search(
    r'(<!-- Gaming Brief -->\n<section id="gaming-brief">.*?<div class="brief-list">\n)(.*?)(    </div>\n    <p style="text-align:center.*?</p>\n</section>)',
    index_content, re.DOTALL
)
if gaming_match:
    new_section = gaming_match.group(1) + brief_html + f'\n    </div>\n    <p style="text-align:center; margin-top:1.5rem;">\n        <a href="gaming.html" class="view-all" data-en="View all {total_games} titles ">查看全部 {total_games} 款游戏 </a>\n    </p>\n</section>'
    index_content = index_content[:gaming_match.start()] + new_section + index_content[gaming_match.end():]
    with open(os.path.join(ROOT_DIR, 'index.html'), 'w', encoding='utf-8') as f:
        f.write(index_content)
    print(f"\nUpdated index.html brief with top {len(top_games)} games ({sum(1 for g in games if g['blacklisted'])} blacklisted)")
else:
    print("\nWARNING: Could not find gaming brief section in index.html")
