#!/usr/bin/env python3
"""Generate gaming.html from SteamGames.csv and game_image_mapping.csv"""
import csv
import html

# Read image mapping
image_map = {}
with open('game_image_mapping.csv', 'r', encoding='utf-8') as f:
    reader = csv.reader(f)
    next(reader)  # skip header
    for row in reader:
        if len(row) >= 2:
            image_map[row[0].strip()] = row[1].strip()

# Read game data
games = []
with open('SteamGames.csv', 'r', encoding='utf-8') as f:
    reader = csv.reader(f)
    next(reader)  # skip header
    for row in reader:
        if len(row) >= 4:
            name = row[0].strip()
            playtime = row[1].strip()
            achievements = row[3].strip() if len(row) > 3 else ''
            img = image_map.get(name, '')
            games.append({
                'name': name,
                'playtime': playtime,
                'achievements': achievements,
                'image': img
            })

IMG_DIR = 'Steam 社区 __ [CN]Alexander-Zaychik __ 游戏_files'

# Build game cards HTML
cards = []
for g in games:
    name_escaped = html.escape(g['name'])
    playtime = html.escape(g['playtime']) if g['playtime'] else ''
    achievements = html.escape(g['achievements']) if g['achievements'] else ''

    if g['image']:
        img_html = f'<img class="game-cover" src="{IMG_DIR}/{g["image"]}" alt="{name_escaped}" loading="lazy">'
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

    # Playtime display
    time_html = f'<span class="game-time">{playtime}</span>' if playtime else ''

    card = f'''        <div class="game-item">
            {img_html}
            <div class="game-info">
                <h4>{name_escaped}</h4>
                {time_html}
                {ach_html}
            </div>
        </div>'''
    cards.append(card)

cards_html = '\n'.join(cards)

# Stats
total_games = len(games)
played_games = sum(1 for g in games if g['playtime'])
total_hours = 0
for g in games:
    pt = g['playtime']
    if '小时' in pt:
        try:
            total_hours += float(pt.replace(',', '').replace(' 小时', ''))
        except:
            pass
    elif '分钟' in pt:
        try:
            total_hours += float(pt.replace(',', '').replace(' 分钟', '')) / 60
        except:
            pass

full_ach = sum(1 for g in games if g['achievements'] and '/' in g['achievements'] and g['achievements'].split('/')[0] == g['achievements'].split('/')[1])

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
// Search & Sort
const searchInput = document.getElementById('gameSearch');
const sortSelect = document.getElementById('gameSort');
const grid = document.getElementById('gamesGrid');

function getTimeMinutes(el) {{
    const timeEl = el.querySelector('.game-time');
    if (!timeEl) return 0;
    const t = timeEl.textContent;
    if (t.includes('小时')) return parseFloat(t.replace(/,/g,'').replace(' 小时','')) * 60 || 0;
    if (t.includes('分钟')) return parseFloat(t.replace(/,/g,'').replace(' 分钟','')) || 0;
    return 0;
}}

function filterAndSort() {{
    const q = searchInput.value.toLowerCase();
    const items = Array.from(grid.children);
    items.forEach(item => {{
        const name = item.querySelector('h4').textContent.toLowerCase();
        item.style.display = name.includes(q) ? '' : 'none';
    }});
    const sortVal = sortSelect.value;
    if (sortVal === 'default') return;
    const sorted = items.sort((a, b) => {{
        if (sortVal === 'name') return a.querySelector('h4').textContent.localeCompare(b.querySelector('h4').textContent);
        if (sortVal === 'time-desc') return getTimeMinutes(b) - getTimeMinutes(a);
        if (sortVal === 'time-asc') return getTimeMinutes(a) - getTimeMinutes(b);
        return 0;
    }});
    sorted.forEach(item => grid.appendChild(item));
}}

searchInput.addEventListener('input', filterAndSort);
sortSelect.addEventListener('change', filterAndSort);
</script>
</body>
</html>
'''

with open('gaming.html', 'w', encoding='utf-8') as f:
    f.write(page_html)

print(f"Generated gaming.html with {total_games} games")
print(f"  {len(image_map)} image mappings loaded")
print(f"  {sum(1 for g in games if g['image'])} games with images")
print(f"  {sum(1 for g in games if not g['image'])} games without images")
print(f"  Total hours: {total_hours:,.0f}")
print(f"  Full achievements: {full_ach}")
