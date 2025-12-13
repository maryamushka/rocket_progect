// ==================== ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ ====================
let userProfile = null;
let isProfileLoaded = false;
let starsCount = 0;
let currentRocket = 'falcon9';
let currentColor = '#ff0000';
let canvas, ctx;
let audioEnabled = false;
let studiedParts = new Set();
let launchCelebrated = false;
let alreadyAwardedMissions = new Set();

// Все достижения
const ALL_BADGES = [
    { id: 'first_steps', name: 'Первые шаги', emoji: '👣', requirement: 'Получить первую звезду', stars: 1 },
    { id: 'rocket_lover', name: 'Любитель ракет', emoji: '🚀', requirement: 'Изучить 3 ракеты', rockets: 3 },
    { id: 'artist', name: 'Космический художник', emoji: '🎨', requirement: 'Создать 5 раскрасок', colorings: 5 },
    { id: 'gamer', name: 'Игровой мастер', emoji: '🎮', requirement: 'Сыграть 10 игр', games: 10 },
    { id: 'explorer', name: 'Исследователь', emoji: '🔭', requirement: 'Просмотреть 5 миссий', missions: 5 },
    { id: 'star_collector', name: 'Собиратель звёзд', emoji: '⭐', requirement: 'Собрать 50 звёзд', stars: 50 },
    { id: 'master_builder', name: 'Мастер-строитель', emoji: '🧱', requirement: 'Собрать ракету 5 раз', builds: 5 },
    { id: 'cosmonaut', name: 'Настоящий космонавт', emoji: '👨‍🚀', requirement: 'Достичь 5 уровня', level: 5 },
    { id: 'genius', name: 'Космический гений', emoji: '🧠', requirement: 'Получить все бейджи', allBadges: true }
];

const rocketPartsInfo = {
    'engine': {
        title: '🔥 ДВИГАТЕЛЬ MERLIN',
        description: 'Самый мощный жидкостный ракетный двигатель! Работает на керосине и жидком кислороде. Развивает тягу 854 кН - это как 100 автомобилей одновременно! Температура в камере сгорания достигает 3000°C - горячее, чем лава вулкана!',
        image: 'engine.png',
        fact: '💡 Может запускаться и останавливаться до 10 раз за один полёт! Инженеры тестировали его более 1000 раз перед первым запуском.'
    },
    'tank': {
        title: '⛽ ТОПЛИВНЫЕ БАКИ',
        description: 'Хранят 440 тонн топтива: керосин и жидкий кислород при температуре -183°C! Баки сделаны из алюминиевого сплава толщиной всего 5 мм, но выдерживают огромное давление.',
        image: 'tank.png',
        fact: '🌡️ Жидкий кислород хранится при -183°C, холоднее чем на Северном полюсе! Если вылить его на пол, он моментально превратится в газ.'
    },
    'payload': {
        title: '🛰️ ПОЛЕЗНАЯ НАГРУЗКА',
        description: 'Здесь находятся спутники или капсула с космонавтами. Это главная цель полёта! Обтекатель защищает груз от ветра и нагрева при старте. Его высота - 13 метров, как 4-этажный дом!',
        image: 'payload.png',
        fact: '🎯 Обтекатель отстреливается на высоте 100 км, когда воздух становится разреженным! Он сделан из углеродного волокна и весит всего 2 тонны.'
    },
    'escape': {
        title: '🆘 СИСТЕМА АВАРИЙНОГО СПАСЕНИЯ (САС)',
        description: 'Спасает космонавтов если что-то пошло не так! За 2 секунды уводит капсулу на безопасное расстояние от аварийной ракеты. Использует твердотопливные двигатели.',
        image: 'escape.png',
        fact: '⚡ Срабатывает за 0.2 секунды и развивает ускорение 15g! Это в 15 раз сильнее, чем при запуске американских горок. Никогда не использовалась в реальных авариях, но спасла бы жизни.'
    }
};

const rocketInfo = {
    'falcon9': {
        name: 'Falcon 9',
        company: 'SpaceX',
        fact: '🔄 Первая в мире многоразовая ракета!',
        height: '70 м',
        weight: '549 т'
    },
    'starship': {
        name: 'Starship',
        company: 'SpaceX',
        fact: '🚀 Самая большая и мощная ракета в истории!',
        height: '120 м',
        weight: '5000 т'
    },
    'sojuz': {
        name: 'Союз',
        company: 'Роскосмос',
        fact: '🎖️ Самая надежная ракета в мире!',
        height: '46 м',
        weight: '308 т'
    }
};

// ==================== УТИЛИТЫ ====================
function normalizeStatus(status) {
    if (!status) return '';

    const statusStr = String(status).toLowerCase().trim();

    // Проверяем разные варианты написания "завершен"
    if (statusStr.includes('заверш')) {
        return 'completed';
    }

    // Проверяем разные варианты написания "предстоящий"
    if (statusStr.includes('предстоящ') || statusStr.includes('upcoming')) {
        return 'upcoming';
    }

    return statusStr;
}

function normalizeText(text) {
    if (!text) return '';
    return String(text)
        .toLowerCase()
        .trim()
        .replace(/\s+/g, ' ') // Убираем лишние пробелы
        .normalize('NFKC'); // Нормализуем Unicode
}

// ==================== ФУНКЦИИ ПРОФИЛЯ ====================
async function loadUserProfile() {
    try {
        const response = await fetch('/get_full_profile');
        if (response.ok) {
            userProfile = await response.json();
            isProfileLoaded = true;

            if (userProfile.studied_parts) {
                studiedParts = new Set(userProfile.studied_parts);
            }

            if (userProfile.awarded_missions) {
                userProfile.awarded_missions.forEach(item => {
                    alreadyAwardedMissions.add(item.missionId);
                });
            }

            updateProfileDisplay();
            return userProfile;
        }
    } catch (error) {
        console.log('Не удалось загрузить профиль с сервера:', error);
    }

    const localProfile = localStorage.getItem('rocket_profile');
    if (localProfile) {
        userProfile = JSON.parse(localProfile);
        if (userProfile.studied_parts) {
            studiedParts = new Set(userProfile.studied_parts);
        }
        if (userProfile.awarded_missions) {
            userProfile.awarded_missions.forEach(item => {
                alreadyAwardedMissions.add(item.missionId);
            });
        }
    } else {
        userProfile = {
            stars: 0,
            level: 1,
            exp: 0,
            next_level_exp: 100,
            games_played: 0,
            rockets_studied: 0,
            colorings_done: 0,
            missions_watched: 0,
            builds_completed: 0,
            badges: [],
            activities: [],
            avatar: 'astronaut',
            name: 'Космонавт',
            created_at: new Date().toISOString(),
            studied_parts: [],
            awarded_missions: [],
            favorites: []
        };
    }

    isProfileLoaded = true;
    updateProfileDisplay();
    return userProfile;
}

async function saveUserProfile() {
    if (!userProfile) return;

    userProfile.studied_parts = Array.from(studiedParts);

    try {
        await fetch('/update_profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userProfile)
        });
    } catch (error) {
        console.log('Оффлайн режим, сохраняем локально');
    }

    localStorage.setItem('rocket_profile', JSON.stringify(userProfile));
    updateProfileDisplay();
}

async function addStar(count = 1, reason = 'Достижение') {
    if (!isProfileLoaded) {
        await loadUserProfile();
    }

    userProfile.stars += count;
    userProfile.exp += count;

    while (userProfile.exp >= userProfile.next_level_exp) {
        userProfile.level++;
        userProfile.exp -= userProfile.next_level_exp;
        userProfile.next_level_exp = Math.floor(userProfile.next_level_exp * 1.5);

        showNotification(`🎉 УРА! Ты достиг ${userProfile.level} уровня!`);
        playSound('success');
    }

    const activity = {
        emoji: '⭐',
        text: `+${count} звезда: ${reason}`,
        time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
    };
    userProfile.activities.unshift(activity);
    userProfile.activities = userProfile.activities.slice(0, 10);

    try {
        const response = await fetch('/add_star', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ count, reason })
        });

        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                userProfile.stars = data.stars;
                userProfile.level = data.level;
                userProfile.exp = data.exp;
                userProfile.next_level_exp = data.next_level_exp;
            }
        }
    } catch (error) {
        console.log('Оффлайн режим, звёзды сохранены локально');
    }

    updateProfileDisplay();
    animateStars(count);
    checkAchievements();
    playSound('star');
    saveUserProfile();

    return userProfile.stars;
}

function updateProfileDisplay() {
    if (!userProfile) return;

    const starElements = document.querySelectorAll('#stars-count, .profile-stars span:last-child');
    starElements.forEach(el => {
        if (el.id === 'stars-count' || el.parentElement.classList.contains('profile-stars')) {
            el.textContent = userProfile.stars;
        }
    });

    const profileNameElements = document.querySelectorAll('.profile-name, #profile-display-name');
    profileNameElements.forEach(el => {
        if (el.id === 'profile-display-name') {
            el.textContent = `👤 ${userProfile.name || 'Космонавт'}`;
        } else {
            el.textContent = userProfile.name || 'Космонавт';
        }
    });

    const avatarEmoji = getAvatarEmoji(userProfile.avatar);
    document.querySelectorAll('.avatar-emoji, .profile-emoji').forEach(el => {
        el.textContent = avatarEmoji;
    });

    const levelElement = document.getElementById('profile-level');
    if (levelElement) {
        levelElement.textContent = userProfile.level;
    }

    const progressElement = document.getElementById('level-progress');
    const currentExpElement = document.getElementById('current-exp');
    const nextExpElement = document.getElementById('next-level-exp');

    if (progressElement && currentExpElement && nextExpElement) {
        const progressPercent = (userProfile.exp / userProfile.next_level_exp) * 100;
        progressElement.style.width = progressPercent + '%';
        currentExpElement.textContent = userProfile.exp;
        nextExpElement.textContent = userProfile.next_level_exp;

        const progressText = document.querySelector('.progress-text');
        if (progressText) {
            progressText.innerHTML = `
                <span class="progress-current">${userProfile.exp}</span>
                <span> из </span>
                <span class="progress-next">${userProfile.next_level_exp}</span>
                <span> звёзд до ${userProfile.level + 1} уровня</span>
            `;
        }
    }

    const stats = {
        'total-stars': userProfile.stars,
        'games-played': userProfile.games_played,
        'rockets-studied': userProfile.rockets_studied,
        'colorings-done': userProfile.colorings_done
    };

    Object.entries(stats).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    });
}

function getAvatarEmoji(avatarId) {
    const avatars = {
        'astronaut': '👨‍🚀',
        'alien': '👽',
        'rocket': '🚀',
        'robot': '🤖',
        'planet': '🪐',
        'star': '⭐',
        'comet': '☄️',
        'satellite': '🛰️'
    };
    return avatars[avatarId] || '👨‍🚀';
}

// ==================== МИССИИ ====================
async function awardStarsForMission(missionId, amount, reason) {
    if (alreadyAwardedMissions.has(missionId)) {
        showNotification('⭐ Вы уже получали звёзды за эту миссию!');
        return false;
    }

    await addStar(amount, reason);
    alreadyAwardedMissions.add(missionId);

    if (userProfile) {
        if (!userProfile.awarded_missions) {
            userProfile.awarded_missions = [];
        }
        userProfile.awarded_missions.push({
            missionId: missionId,
            amount: amount,
            reason: reason,
            time: new Date().toISOString()
        });
        saveUserProfile();
    }

    return true;
}

async function getMissionById(missionId) {
    try {
        const response = await fetch('/all_missions');
        const missions = await response.json();
        return missions.find(m => m.id === missionId);
    } catch (error) {
        console.error('Ошибка получения миссии:', error);
        return null;
    }
}

let currentFilter = 'all';

function filterMissions(filter) {
    currentFilter = filter;

    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
        if (normalizeText(btn.textContent).includes(filter)) {
            btn.classList.add('active');
        }
    });

    const missions = document.querySelectorAll('.mission-card');
    let visibleCount = 0;

    missions.forEach(mission => {
        const status = mission.dataset.status;
        const company = mission.dataset.company;
        let show = false;

        const normalizedStatus = normalizeStatus(status);

        switch(filter) {
            case 'all':
                show = true;
                break;
            case 'upcoming':
                show = normalizedStatus === 'upcoming';
                break;
            case 'completed':
                show = normalizedStatus === 'completed';
                break;
            case 'spacex':
                show = normalizeText(company).includes('spacex');
                break;
            case 'roscosmos':
                show = normalizeText(company).includes('роскосмос');
                break;
            case 'nasa':
                show = normalizeText(company).includes('nasa');
                break;
        }

        if (show) {
            mission.style.display = 'flex';
            visibleCount++;
            mission.style.animation = 'fadeIn 0.5s forwards';
        } else {
            mission.style.display = 'none';
        }
    });

    playSound('click');
}

function searchMissions() {
    const searchText = document.getElementById('mission-search').value.toLowerCase();
    const missions = document.querySelectorAll('.mission-card');
    let visibleCount = 0;

    missions.forEach(mission => {
        const missionText = mission.textContent.toLowerCase();
        const shouldShowByFilter = shouldShowMission(mission, currentFilter);
        const matchesSearch = missionText.includes(searchText);

        const show = shouldShowByFilter && matchesSearch;

        mission.style.display = show ? 'flex' : 'none';
        if (show) visibleCount++;
    });
}

function clearSearch() {
    document.getElementById('mission-search').value = '';
    searchMissions();
}

function shouldShowMission(mission, filter) {
    const status = mission.dataset.status;
    const company = mission.dataset.company;

    // Нормализуем статус для сравнения
    const normalizedStatus = status.toLowerCase().trim();

    switch(filter) {
        case 'all': return true;
        case 'upcoming':
            return normalizedStatus.includes('предстоящий') ||
                   normalizedStatus.includes('предстоящ') ||
                   normalizedStatus.includes('upcoming');
        case 'completed':
            return normalizedStatus.includes('завершён') ||
                   normalizedStatus.includes('завершен') ||
                   normalizedStatus.includes('complete');
        case 'spacex': return company.toLowerCase().includes('spacex');
        case 'roscosmos':
            return company.toLowerCase().includes('роскосмос') ||
                   company.toLowerCase().includes('roscosmos');
        case 'nasa': return company.toLowerCase().includes('nasa');
        default: return true;
    }
}

// ==================== ИЗУЧЕНИЕ РАКЕТ ====================
function showPartInfo(partId) {
    const part = rocketPartsInfo[partId];
    const infoDiv = document.getElementById('part-info');

    const alreadyStudied = studiedParts.has(partId);

    infoDiv.innerHTML = `
        <div style="text-align: center; position: relative;">
            <button onclick="showRocketOverview()"
                    style="position: absolute; left: 20px; top: 20px; background: rgba(255,255,255,0.1); color: white; border: 2px solid #00ffff; border-radius: 10px; padding: 8px 15px; cursor: pointer; display: flex; align-items: center; gap: 8px;">
                ← Назад
            </button>

            <h3 style="color: #00ffff; margin-bottom: 15px; margin-top: 20px;">${part.title}</h3>
            <img src="/static/images/rockets/${part.image}"
                 alt="${part.title}"
                 style="width: 150px; height: auto; border-radius: 10px; border: 3px solid #00ffff; margin: 15px 0;">
            <p style="font-size: 1.2rem; line-height: 1.5; margin: 15px 0; padding: 0 20px;">${part.description}</p>
            <div style="background: rgba(255,255,0,0.1); padding: 15px; border-radius: 10px; margin: 15px 20px;">
                <strong style="color: #ffff00;">🤔 Знаете ли вы?</strong>
                <p style="color: white; margin-top: 10px;">${part.fact}</p>
            </div>
            ${!alreadyStudied ? `
            <div style="margin-top: 20px;">
                <button onclick="studyPart('${partId}', '${part.title}')"
                        style="background: linear-gradient(45deg, gold, orange); color: black; padding: 12px 25px; border-radius: 20px; border: none; font-weight: bold; cursor: pointer; font-size: 1.1rem; box-shadow: 0 5px 15px rgba(255,215,0,0.3);">
                    ⭐ Получить 2 звезды за изучение!
                </button>
            </div>
            ` : `
            <div style="margin-top: 20px; background: rgba(0,255,0,0.1); padding: 15px; border-radius: 15px; border: 2px solid #00ff00; margin: 0 20px;">
                <p style="color: #00ff00; font-size: 1.1rem;">✅ Эта часть уже изучена!</p>
                <p style="color: #aaa; margin-top: 5px;">Ты получил за неё 2 звезды</p>
            </div>
            `}
        </div>
    `;

    playSound('rocket');
}

async function studyPart(partId, partTitle) {
    if (studiedParts.has(partId)) {
        showNotification('✅ Эта часть уже изучена!');
        return;
    }

    studiedParts.add(partId);

    try {
        await fetch('/update_profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                studied_parts: Array.from(studiedParts),
                rockets_studied: userProfile.rockets_studied + 1
            })
        });
    } catch (error) {
        console.log('Ошибка сохранения изученных частей:', error);
    }

    addStar(2, `Изучил ${partTitle}`);
    userProfile.rockets_studied++;
    saveUserProfile();

    showPartInfo(partId);
}

function showRocketOverview() {
    const info = rocketInfo[currentRocket] || rocketInfo['falcon9'];
    document.getElementById('part-info').innerHTML = `
        <div style="text-align: center;">
            <h3 style="color: #00ffff;">${info.name} • ${info.company}</h3>
            <div style="background: rgba(255,255,255,0.1); padding: 15px; border-radius: 15px; margin: 15px 0;">
                <p style="font-size: 1.3rem; color: gold;">${info.fact}</p>
                <div style="display: flex; justify-content: center; gap: 30px; margin-top: 15px;">
                    <div style="text-align: center;">
                        <div style="font-size: 1.2rem;">📏</div>
                        <div>Высота: ${info.height}</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 1.2rem;">⚖️</div>
                        <div>Вес: ${info.weight}</div>
                    </div>
                </div>
            </div>
            <p style="color: #aaa; margin: 20px 0; font-size: 1.2rem;">👆 НАЖМИ НА РАКЕТУ!<br>Нажми на любую часть ракеты, чтобы узнать о ней!</p>

            <div style="display: flex; justify-content: center; gap: 15px; margin-top: 20px; flex-wrap: wrap;">
                <button onclick="showPartInfo('engine')" class="part-btn">
                    <div class="part-emoji">🔥</div>
                    <div>Двигатель</div>
                </button>
                <button onclick="showPartInfo('tank')" class="part-btn">
                    <div class="part-emoji">⛽</div>
                    <div>Баки</div>
                </button>
                <button onclick="showPartInfo('payload')" class="part-btn">
                    <div class="part-emoji">🛰️</div>
                    <div>Нагрузка</div>
                </button>
                <button onclick="showPartInfo('escape')" class="part-btn">
                    <div class="part-emoji">🆘</div>
                    <div>Спасение</div>
                </button>
            </div>

            <div style="margin-top: 30px; background: rgba(0,255,255,0.1); padding: 15px; border-radius: 15px;">
                <h4 style="color: #ffff00; margin-bottom: 10px;">📊 Прогресс изучения:</h4>
                <div style="display: flex; justify-content: center; gap: 20px; flex-wrap: wrap;">
                    ${['engine', 'tank', 'payload', 'escape'].map(part => `
                        <div style="text-align: center;">
                            <div style="font-size: 2rem; color: ${studiedParts.has(part) ? '#00ff00' : '#ff0000'}">
                                ${studiedParts.has(part) ? '✅' : '❌'}
                            </div>
                            <div style="font-size: 0.9rem; color: #aaa;">
                                ${part === 'engine' ? 'Двигатель' :
                                  part === 'tank' ? 'Баки' :
                                  part === 'payload' ? 'Нагрузка' : 'Спасение'}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;

    // Добавляем обработчик клика на изображение ракеты
    const rocketImage = document.getElementById('rocket-image');
    if (rocketImage) {
        rocketImage.style.cursor = 'pointer';
        rocketImage.onclick = showRandomPart;
    }
}

function selectRocket(rocketType) {
    if (currentRocket === rocketType) {
        return;
    }

    currentRocket = rocketType;
    studiedParts.clear();

    document.getElementById('rocket-image').src =
        `/static/images/rockets/${rocketType}.png`;

    document.querySelectorAll('.rocket-selector button').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');

    const info = rocketInfo[rocketType];
    document.getElementById('part-info').innerHTML = `
        <div style="text-align: center;">
            <h3 style="color: #00ffff;">${info.name} • ${info.company}</h3>
            <div style="background: rgba(255,255,255,0.1); padding: 15px; border-radius: 15px; margin: 15px 0;">
                <p style="font-size: 1.3rem; color: gold;">${info.fact}</p>
                <div style="display: flex; justify-content: center; gap: 30px; margin-top: 15px;">
                    <div style="text-align: center;">
                        <div style="font-size: 1.2rem;">📏</div>
                        <div>Высота: ${info.height}</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 1.2rem;">⚖️</div>
                        <div>Вес: ${info.weight}</div>
                    </div>
                </div>
            </div>
            <p style="color: #aaa;">Нажми на кнопки ниже или кликни на ракету, чтобы изучить части!</p>
        </div>
    `;

    playSound('click');
}

function showRandomPart() {
    const parts = ['engine', 'tank', 'payload', 'escape'];
    const randomPart = parts[Math.floor(Math.random() * parts.length)];
    showPartInfo(randomPart);
}

// ==================== РАСКРАСКА ====================
function startColoring() {
    if (userProfile) {
        userProfile.colorings_done++;
        saveUserProfile();
    }

    document.querySelector('.action-buttons').style.display = 'none';
    document.getElementById('coloring-section').style.display = 'block';

    canvas = document.getElementById('coloring-canvas');
    ctx = canvas.getContext('2d');

    loadRocketOutline(currentRocket);

    let isDrawing = false;

    canvas.addEventListener('mousedown', (e) => {
        isDrawing = true;
        draw(e);
    });

    canvas.addEventListener('mousemove', (e) => {
        if (isDrawing) draw(e);
    });

    canvas.addEventListener('mouseup', () => isDrawing = false);
    canvas.addEventListener('mouseout', () => isDrawing = false);

    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        isDrawing = true;
        drawTouch(e);
    });

    canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        if (isDrawing) drawTouch(e);
    });

    canvas.addEventListener('touchend', () => isDrawing = false);

    playSound('click');
}

function loadRocketOutline(rocketName) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#222222';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;

    ctx.beginPath();
    ctx.moveTo(400, 550);
    ctx.lineTo(350, 450);
    ctx.lineTo(350, 100);
    ctx.lineTo(450, 100);
    ctx.lineTo(450, 450);
    ctx.closePath();
    ctx.stroke();

    ctx.fillStyle = '#666666';
    ctx.fillRect(380, 200, 40, 30);
    ctx.fillRect(370, 300, 60, 40);
    ctx.fillRect(390, 400, 20, 50);
}

function selectColor(color) {
    currentColor = color;
    document.querySelectorAll('.color').forEach(c => {
        c.style.border = '2px solid #666';
        c.style.transform = 'scale(1)';
    });
    event.target.style.border = '3px solid gold';
    event.target.style.transform = 'scale(1.2)';
    playSound('click');
}

function draw(e) {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.fillStyle = currentColor;
    ctx.beginPath();
    ctx.arc(x, y, 15, 0, Math.PI * 2);
    ctx.fill();
}

function drawTouch(e) {
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    ctx.fillStyle = currentColor;
    ctx.beginPath();
    ctx.arc(x, y, 20, 0, Math.PI * 2);
    ctx.fill();
}

function clearCanvas() {
    if (confirm('Очистить цвета? Контур останется.')) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        loadRocketOutline(currentRocket);
    }
}

function saveColoring() {
    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `моя_ракета_${currentRocket}.png`;
    link.href = dataUrl;
    link.click();

    addStar(3, 'Сохранил раскраску ракеты');
    showNotification('🎨 Раскраска сохранена! +3 звезды');
    playSound('success');
}

function hideColoring() {
    document.getElementById('coloring-section').style.display = 'none';
    document.querySelector('.action-buttons').style.display = 'flex';
}

// ==================== ИГРА "СОБЕРИ РАКЕТУ" ====================
function startBuildGame() {
    if (userProfile) {
        userProfile.games_played++;
        saveUserProfile();
    }

    document.querySelector('.action-buttons').style.display = 'none';
    document.getElementById('build-game').style.display = 'block';

    let collectedParts = 0;
    const totalParts = 4;

    document.querySelectorAll('.part').forEach(part => {
        part.addEventListener('dragstart', dragStart);
        part.setAttribute('draggable', 'true');
    });

    document.querySelectorAll('.slot').forEach(slot => {
        slot.addEventListener('dragover', dragOver);
        slot.addEventListener('drop', drop);
    });

    function dragStart(e) {
        e.dataTransfer.setData('text/plain', e.target.dataset.part);
    }

    function dragOver(e) {
        e.preventDefault();
    }

    function drop(e) {
        e.preventDefault();
        const partId = e.dataTransfer.getData('text/plain');
        const slot = e.target;

        if (slot.dataset.slot === partId) {
            slot.innerHTML = `✅ ${partId.toUpperCase()}`;
            slot.style.background = 'rgba(0,255,0,0.3)';
            collectedParts++;

            playSound('success');
            addStar(1, `Установил ${partId}`);

            if (collectedParts === totalParts) {
                setTimeout(() => {
                    showNotification('🎉 УРА! Ты собрал ракету! +2 звезды за полную сборку!');
                    addStar(2, 'Полная сборка ракеты');
                    if (userProfile) {
                        userProfile.builds_completed++;
                        saveUserProfile();
                    }
                }, 500);
            }
        } else {
            slot.innerHTML = '❌ Не туда!';
            slot.style.background = 'rgba(255,0,0,0.3)';
            playSound('error');

            setTimeout(() => {
                slot.innerHTML = '';
                slot.style.background = '';
            }, 1000);
        }
    }

    playSound('click');
    showNotification('🎮 Начинаем сборку ракеты! Перетащи детали на нужные места.');
}

function hideBuildGame() {
    document.getElementById('build-game').style.display = 'none';
    document.querySelector('.action-buttons').style.display = 'flex';
}

// ==================== МОДАЛЬНОЕ ОКНО МИССИИ ====================
async function showMissionDetail(missionId) {
    const mission = await getMissionById(missionId);
    if (!mission) return;

    const modal = document.getElementById('mission-modal');
    const content = modal.querySelector('.modal-content');

    const alreadyAwarded = alreadyAwardedMissions.has(missionId);
    const canGetStars = !alreadyAwarded && userProfile;

    const isFavorite = userProfile && userProfile.favorites && userProfile.favorites.includes(missionId);

    const facts = mission.kid_facts || [
        "🚀 Это самая мощная ракета в истории!",
        "⭐ Можно получить звёзды за изучение!",
        "👨‍🚀 Космонавты тренируются годами для таких полётов!"
    ];

    let factsCarouselHTML = '';
    if (facts.length > 0) {
        factsCarouselHTML = `
        <div class="facts-carousel">
            <h3><span class="card-icon">🤩</span> Интересно детям!</h3>
            <div class="facts-container" id="facts-container-${missionId}">
                ${facts.map((fact, index) => `
                <div class="fact-slide ${index === 0 ? 'active' : ''}" data-index="${index}">
                    <div class="fact-content">${fact}</div>
                </div>
                `).join('')}
            </div>
            ${facts.length > 1 ? `
            <div class="facts-navigation">
                <button class="facts-prev" onclick="prevFact(${missionId})">◀</button>
                <div class="facts-dots">
                    ${facts.map((_, index) => `
                    <span class="fact-dot ${index === 0 ? 'active' : ''}"
                          onclick="showFact(${missionId}, ${index})"></span>
                    `).join('')}
                </div>
                <button class="facts-next" onclick="nextFact(${missionId})">▶</button>
            </div>
            ` : ''}
        </div>
        `;
    }

    content.innerHTML = `
        <button class="close-modal" onclick="closeModal()">&times;</button>

        <div class="mission-modal-header">
            <div class="mission-modal-emoji">${mission.emoji || '🚀'}</div>
            <div class="mission-modal-title">
                <h2>${mission.name}</h2>
                <div class="mission-modal-subtitle">
                    <span class="mission-modal-company">${mission.company}</span>
                    <span class="mission-modal-rocket">${mission.rocket}</span>
                </div>
            </div>
        </div>

        <div class="mission-modal-image-container">
            <div class="image-scroll-container">
                <img src="/static/images/rockets/${mission.image || 'falcon9.png'}"
                     alt="${mission.name}"
                     class="mission-modal-image"
                     onload="checkImageSize(this, ${missionId})"
                     id="mission-image-${missionId}">
            </div>
        </div>

        <div class="mission-modal-status">
            <div class="mission-date-big">
                <span class="date-icon">📅</span>
                <span class="date-text">${mission.date} ${mission.time || ''}</span>
            </div>
            <div class="mission-status-big ${mission.status === 'предстоящий' ? 'upcoming' : 'completed'}">
                ${mission.status.toUpperCase()}
            </div>
        </div>

        <div class="mission-modal-info">
            <div class="info-card">
                <h3><span class="card-icon">🎯</span> Цель миссии</h3>
                <p>${mission.description}</p>
            </div>

            ${factsCarouselHTML}

            <div class="info-card">
                <h3><span class="card-icon">⭐</span> Важность</h3>
                <p>${mission.importance}</p>
            </div>

            <div class="info-grid">
                <div class="info-item">
                    <span class="item-icon">🏢</span>
                    <span class="item-label">Компания</span>
                    <span class="item-value">${mission.company}</span>
                </div>
                <div class="info-item">
                    <span class="item-icon">🚀</span>
                    <span class="item-label">Ракета</span>
                    <span class="item-value">${mission.rocket}</span>
                </div>
                <div class="info-item">
                    <span class="item-icon">🎮</span>
                    <span class="item-label">Сложность</span>
                    <span class="item-value ${mission.difficulty}">${mission.difficulty || 'средний'}</span>
                </div>
            </div>
        </div>

        <div class="mission-modal-actions">
            <button onclick="watchMissionStreamModal(${missionId})"
                    class="modal-action-btn stream-btn">
                <span class="btn-icon">📺</span>
                <span class="btn-text">Смотреть трансляцию</span>
                <span class="btn-hint">Имитация запуска!</span>
            </button>

            <button onclick="addToFavoritesModal(${missionId})"
                    class="modal-action-btn favorite-btn ${isFavorite ? 'disabled' : ''}"
                    ${isFavorite ? 'disabled' : ''}>
                <span class="btn-icon">${isFavorite ? '❤️' : '🤍'}</span>
                <span class="btn-text">${isFavorite ? 'В избранном' : 'В избранное'}</span>
                <span class="btn-hint">${isFavorite ? 'Уже добавлено!' : 'Добавить в избранное'}</span>
            </button>
        </div>

        ${alreadyAwarded ? `
        <div class="mission-awarded-notice">
            <span class="notice-icon">✅</span>
            <span class="notice-text">Вы уже получили звёзды за эту миссию!</span>
        </div>
        ` : ''}
    `;

    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
    playSound('click');
}

function closeModal() {
    document.getElementById('mission-modal').style.display = 'none';
    document.body.style.overflow = 'auto';

    if (window.factsInterval) {
        clearInterval(window.factsInterval);
        window.factsInterval = null;
    }

    playSound('click');
}

async function watchMissionStreamModal(missionId) {
    const modal = document.getElementById('mission-modal');
    const content = modal.querySelector('.modal-content');

    content.innerHTML = `
        <button class="close-modal" onclick="closeModal()">&times;</button>
        <h2 style="color: #ffff00; text-align: center;">📺 ТРАНСЛЯЦИЯ</h2>

        <div style="background: #000; border-radius: 15px; padding: 20px; margin: 20px 0;">
            <div style="height: 300px; background: linear-gradient(45deg, #0a0a2a, #1a1a4a);
                 border-radius: 10px; display: flex; justify-content: center; align-items: center;">
                <div style="text-align: center;">
                    <div style="font-size: 5rem; animation: float 2s ease-in-out infinite;">🚀</div>
                    <div style="color: #00ffff; font-size: 1.5rem; margin-top: 20px;">ТРАНСЛЯЦИЯ МИССИИ</div>
                    <div style="color: #aaa; margin-top: 10px;">Запуск через 00:02:15</div>
                </div>
            </div>
        </div>

        <button onclick="showMissionDetail(${missionId})"
                class="modal-action-btn" style="width: 100%; margin-top: 20px;">
            <span class="btn-icon">🔙</span>
            <span class="btn-text">Вернуться к миссии</span>
        </button>
    `;

    showNotification('📡 Запускаем трансляцию...');
    playSound('rocket');
}

async function addToFavoritesModal(missionId) {
    if (!userProfile) return;

    if (!userProfile.favorites) {
        userProfile.favorites = [];
    }

    if (userProfile.favorites.includes(missionId)) {
        showNotification('❤️ Эта миссия уже в избранном!');
        return;
    }

    userProfile.favorites.push(missionId);
    saveUserProfile();

    showNotification('❤️ Миссия добавлена в избранное!');
    playSound('success');

    const favoriteBtn = document.querySelector('.favorite-btn');
    if (favoriteBtn) {
        favoriteBtn.innerHTML = `
            <span class="btn-icon">❤️</span>
            <span class="btn-text">Уже в избранном</span>
            <span class="btn-hint">Добавлено в избранное</span>
        `;
        favoriteBtn.classList.add('disabled');
        favoriteBtn.disabled = true;
    }
}

// Карусель фактов
let currentFactIndex = {};

function showFact(missionId, index) {
    const container = document.getElementById(`facts-container-${missionId}`);
    if (!container) return;

    const slides = container.querySelectorAll('.fact-slide');
    const dots = container.parentElement.querySelectorAll('.fact-dot');

    slides.forEach(slide => slide.classList.remove('active'));
    dots.forEach(dot => dot.classList.remove('active'));

    if (slides[index]) {
        slides[index].classList.add('active');
    }
    if (dots[index]) {
        dots[index].classList.add('active');
    }

    currentFactIndex[missionId] = index;
}

function nextFact(missionId) {
    const container = document.getElementById(`facts-container-${missionId}`);
    if (!container) return;

    const slides = container.querySelectorAll('.fact-slide');
    let currentIndex = currentFactIndex[missionId] || 0;
    currentIndex = (currentIndex + 1) % slides.length;

    showFact(missionId, currentIndex);
}

function prevFact(missionId) {
    const container = document.getElementById(`facts-container-${missionId}`);
    if (!container) return;

    const slides = container.querySelectorAll('.fact-slide');
    let currentIndex = currentFactIndex[missionId] || 0;
    currentIndex = (currentIndex - 1 + slides.length) % slides.length;

    showFact(missionId, currentIndex);
}

function checkImageSize(img, missionId) {
    const hint = document.getElementById(`zoom-hint-${missionId}`);

    if (img.naturalWidth > img.naturalHeight) {
        img.classList.add('image-horizontal');
    } else {
        img.classList.add('image-vertical');
    }

    setTimeout(() => startFactsCarousel(missionId), 1000);
}

function startFactsCarousel(missionId) {
    const container = document.getElementById(`facts-container-${missionId}`);
    if (!container) return;

    const slides = container.querySelectorAll('.fact-slide');
    if (slides.length <= 1) return;

    if (window.factsInterval) {
        clearInterval(window.factsInterval);
    }

    window.factsInterval = setInterval(() => {
        nextFact(missionId);
    }, 5000);
}

// ==================== ПРОФИЛЬ ====================
async function showProfile() {
    await loadUserProfile();

    const modal = document.getElementById('profile-modal');
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden'; // Оставляем hidden для body

    // Устанавливаем overflow: auto для самого модального окна
    modal.style.overflowY = 'auto';

    // Создаем контент профиля
    modal.innerHTML = `
        <div class="profile-content">
            <button class="close-profile" onclick="closeProfile()">&times;</button>

            <div class="profile-header">
                <div class="avatar-display">
                    <div class="avatar-emoji">${getAvatarEmoji(userProfile.avatar)}</div>
                </div>
                <div class="profile-header-info">
                    <h2 id="profile-display-name">${userProfile.name || 'Космонавт'}</h2>
                    <div class="profile-level-badge">
                        <span class="level-icon">⭐</span>
                        <span class="level-text">Уровень: ${userProfile.level}</span>
                    </div>
                    <button class="change-avatar-btn" onclick="showAvatarSelector()">
                        <span style="font-size: 1.5rem;">✏️</span>
                        <span>Изменить аватар и имя</span>
                    </button>
                </div>
            </div>

            <div class="profile-stats-grid">
                <div class="stat-card">
                    <span class="stat-icon">⭐</span>
                    <div class="stat-label">Всего звёзд</div>
                    <div class="stat-value" id="total-stars">${userProfile.stars}</div>
                </div>
                <div class="stat-card">
                    <span class="stat-icon">🎮</span>
                    <div class="stat-label">Игр сыграно</div>
                    <div class="stat-value" id="games-played">${userProfile.games_played}</div>
                </div>
                <div class="stat-card">
                    <span class="stat-icon">🚀</span>
                    <div class="stat-label">Ракет изучено</div>
                    <div class="stat-value" id="rockets-studied">${userProfile.rockets_studied}</div>
                </div>
                <div class="stat-card">
                    <span class="stat-icon">🎨</span>
                    <div class="stat-label">Раскрасок создано</div>
                    <div class="stat-value" id="colorings-done">${userProfile.colorings_done}</div>
                </div>
            </div>

            <div class="achievements-section">
                <h3 class="section-title">🏆 МОИ ДОСТИЖЕНИЯ</h3>
                <div class="badges-grid" id="badges-container">
                </div>
            </div>

            <div class="progress-section">
                <div class="progress-header">
                    <h3>ПРОГРЕСС ДО СЛЕДУЮЩЕГО УРОВНЯ</h3>
                    <div class="progress-numbers">
                        ${userProfile.exp} / ${userProfile.next_level_exp}
                    </div>
                </div>
                <div class="progress-bar-container">
                    <div class="progress-bar"
                         style="width: ${(userProfile.exp / userProfile.next_level_exp) * 100}%">
                    </div>
                </div>
                <div class="progress-text">
                    <span class="progress-current">${userProfile.exp}</span>
                    <span>из</span>
                    <span class="progress-next">${userProfile.next_level_exp}</span>
                    <span>звёзд до ${userProfile.level + 1} уровня</span>
                </div>
            </div>

            <div class="activity-section">
                <h3 class="section-title">📜 ПОСЛЕДНИЕ ДОСТИЖЕНИЯ</h3>
                <div id="activity-list" style="max-height: 300px; overflow-y: auto; padding-right: 10px;">
                </div>
            </div>
        </div>
    `;

    // Заполняем бейджи
    const badgesContainer = document.getElementById('badges-container');
    badgesContainer.innerHTML = '';

    ALL_BADGES.forEach(badge => {
        const isEarned = userProfile.badges.includes(badge.id);

        const badgeEl = document.createElement('div');
        badgeEl.className = `badge ${isEarned ? 'earned' : 'locked'}`;
        badgeEl.innerHTML = `
            <div class="badge-emoji">${badge.emoji}</div>
            <div class="badge-name">${badge.name}</div>
            ${!isEarned ? '<div class="badge-locked">🔒</div>' : ''}
            <div class="badge-tooltip">${badge.requirement}</div>
        `;

        badgeEl.title = badge.requirement;
        badgesContainer.appendChild(badgeEl);
    });

    // Заполняем активность с прокруткой
    const activityList = document.getElementById('activity-list');
    activityList.innerHTML = '';

    if (userProfile.activities.length === 0) {
        activityList.innerHTML = `
            <div class="activity-item">
                <span class="activity-emoji">🚀</span>
                <span class="activity-text">Начните играть, чтобы получить первые достижения!</span>
                <span class="activity-time">Сейчас</span>
            </div>
        `;
    } else {
        userProfile.activities.forEach(activity => {
            const item = document.createElement('div');
            item.className = 'activity-item';
            item.innerHTML = `
                <span class="activity-emoji">${activity.emoji}</span>
                <span class="activity-text">${activity.text}</span>
                <span class="activity-time">${activity.time}</span>
            `;
            activityList.appendChild(item);
        });
    }

    // Прокручиваем вверх при открытии
    modal.scrollTop = 0;
}

function closeProfile() {
    const modal = document.getElementById('profile-modal');
    if (modal) {
        modal.style.display = 'none';
        modal.innerHTML = '';
        modal.style.overflowY = 'hidden'; // Сбрасываем overflow
    }
    document.body.style.overflow = 'auto'; // Восстанавливаем прокрутку body
    playSound('click');
}

// ==================== АВАТАР ====================
async function showAvatarSelector() {
    let avatars = [
        { id: 'astronaut', emoji: '👨‍🚀', name: 'Космонавт' },
        { id: 'alien', emoji: '👽', name: 'Инопланетянин' },
        { id: 'rocket', emoji: '🚀', name: 'Ракета' },
        { id: 'robot', emoji: '🤖', name: 'Робот' },
        { id: 'planet', emoji: '🪐', name: 'Планета' },
        { id: 'star', emoji: '⭐', name: 'Звезда' },
        { id: 'comet', emoji: '☄️', name: 'Комета' },
        { id: 'satellite', emoji: '🛰️', name: 'Спутник' }
    ];

    let html = `
        <div style="
            background: rgba(0,0,0,0.97);
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 3000;
            display: flex;
            justify-content: center;
            align-items: center;
            backdrop-filter: blur(5px);
        ">
            <div style="
                background: linear-gradient(135deg, #1a1a3a, #2a2a5a);
                padding: 35px;
                border-radius: 25px;
                border: 3px solid #00ffff;
                box-shadow: 0 0 40px rgba(0, 255, 255, 0.5);
                max-width: 750px;
                width: 90%;
                max-height: 85vh;
                overflow-y: auto;
                position: relative;
                animation: fadeInScale 0.4s ease-out;
            ">
                <style>
                    @keyframes fadeInScale {
                        from { opacity: 0; transform: scale(0.9); }
                        to { opacity: 1; transform: scale(1); }
                    }
                </style>

                <button onclick="closeAvatarSelector()" style="
                    position: absolute;
                    top: 20px;
                    right: 20px;
                    background: rgba(255,0,0,0.2);
                    border: 2px solid #ff0000;
                    color: #ff0000;
                    font-size: 2.2rem;
                    cursor: pointer;
                    line-height: 1;
                    width: 45px;
                    height: 45px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 50%;
                    transition: all 0.3s;
                ">&times;</button>

                <h2 style="
                    color: #ffff00;
                    text-align: center;
                    margin-bottom: 30px;
                    font-size: 2.2rem;
                    text-shadow: 0 0 15px rgba(255,255,0,0.5);
                    font-weight: bold;
                ">👤 ВЫБЕРИ АВАТАРКУ</h2>

                <div style="
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 20px;
                    margin-bottom: 35px;
                ">
    `;

    avatars.forEach(avatar => {
        const isSelected = userProfile.avatar === avatar.id;
        html += `
            <div onclick="selectAvatar('${avatar.id}')"
                 style="
                    cursor: pointer;
                    text-align: center;
                    padding: 25px 15px;
                    border-radius: 20px;
                    border: 3px solid ${isSelected ? '#ffff00' : '#00ffff'};
                    background: ${isSelected ?
                        'linear-gradient(135deg, rgba(255,255,0,0.2), rgba(255,255,0,0.1))' :
                        'linear-gradient(135deg, rgba(0,255,255,0.15), rgba(0,255,255,0.05))'
                    };
                    transition: all 0.3s;
                    aspect-ratio: 1;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                    min-height: 140px;
                    box-shadow: ${isSelected ?
                        '0 0 25px rgba(255,255,0,0.4)' :
                        '0 5px 15px rgba(0,255,255,0.2)'
                    };
                    transform: ${isSelected ? 'scale(1.05)' : 'scale(1)'};
                 ">
                <div style="
                    font-size: 4rem;
                    margin-bottom: 15px;
                    line-height: 1;
                    filter: drop-shadow(0 0 8px currentColor);
                ">${avatar.emoji}</div>
                <div style="
                    color: white;
                    font-size: 1rem;
                    line-height: 1.2;
                    font-weight: 500;
                ">${avatar.name}</div>
                ${isSelected ?
                    '<div style="color: gold; margin-top: 10px; font-size: 0.9rem; font-weight: bold;">✓ ВЫБРАН</div>' :
                    ''
                }
            </div>
        `;
    });

    html += `
                </div>

                <div style="margin-bottom: 30px;">
                    <h3 style="
                        color: #00ffff;
                        margin-bottom: 15px;
                        font-size: 1.4rem;
                        text-shadow: 0 0 10px rgba(0,255,255,0.5);
                    ">✏️ ВВЕДИ СВОЁ ИМЯ:</h3>
                    <input type="text" id="profile-name-input"
                           value="${userProfile.name || 'Космонавт'}"
                           style="
                                width: 100%;
                                padding: 18px;
                                border-radius: 15px;
                                border: 3px solid #ff00ff;
                                background: rgba(255,255,255,0.15);
                                color: white;
                                font-size: 1.3rem;
                                text-align: center;
                                font-weight: bold;
                                box-shadow: 0 5px 15px rgba(255,0,255,0.3);
                           ">
                </div>

                <div style="display: flex; gap: 20px;">
                    <button onclick="saveProfileChanges()"
                            style="
                                flex: 1;
                                padding: 20px;
                                background: linear-gradient(45deg, #00aa00, #00ff88);
                                color: white;
                                border: none;
                                border-radius: 15px;
                                font-size: 1.3rem;
                                cursor: pointer;
                                font-weight: bold;
                                transition: all 0.3s;
                                box-shadow: 0 8px 20px rgba(0,170,0,0.3);
                            ">
                        💾 СОХРАНИТЬ
                    </button>
                    <button onclick="closeAvatarSelector()"
                            style="
                                flex: 1;
                                padding: 20px;
                                background: linear-gradient(45deg, #ff0000, #ff5500);
                                color: white;
                                border: none;
                                border-radius: 15px;
                                font-size: 1.3rem;
                                cursor: pointer;
                                font-weight: bold;
                                transition: all 0.3s;
                                box-shadow: 0 8px 20px rgba(255,0,0,0.3);
                            ">
                        ❌ ОТМЕНА
                    </button>
                </div>
            </div>
        </div>
    `;

    const modal = document.createElement('div');
    modal.id = 'avatar-selector-modal';
    modal.innerHTML = html;
    document.body.appendChild(modal);
}

function selectAvatar(avatarId) {
    userProfile.avatar = avatarId;

    const avatarElements = document.querySelectorAll('#avatar-selector-modal [onclick^="selectAvatar"]');
    avatarElements.forEach(el => {
        const avatarDiv = el;
        const isSelected = avatarDiv.onclick.toString().includes(`'${avatarId}'`);

        if (isSelected) {
            avatarDiv.style.border = '3px solid #ffff00';
            avatarDiv.style.background = 'linear-gradient(135deg, rgba(255,255,0,0.2), rgba(255,255,0,0.1))';
            avatarDiv.style.boxShadow = '0 0 25px rgba(255,255,0,0.4)';
            avatarDiv.style.transform = 'scale(1.05)';
        } else {
            avatarDiv.style.border = '3px solid #00ffff';
            avatarDiv.style.background = 'linear-gradient(135deg, rgba(0,255,255,0.15), rgba(0,255,255,0.05))';
            avatarDiv.style.boxShadow = '0 5px 15px rgba(0,255,255,0.2)';
            avatarDiv.style.transform = 'scale(1)';
        }
    });
}

function closeAvatarSelector() {
    const modal = document.getElementById('avatar-selector-modal');
    if (modal) modal.remove();
}

async function saveProfileChanges() {
    const nameInput = document.getElementById('profile-name-input');
    const newName = nameInput.value.trim() || 'Космонавт';

    userProfile.name = newName;

    try {
        await fetch('/update_name', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: newName })
        });

        await fetch('/update_avatar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ avatar: userProfile.avatar })
        });
    } catch (error) {
        console.log('Ошибка сохранения профиля:', error);
    }

    updateProfileDisplay();
    closeAvatarSelector();
    showNotification('✅ Профиль обновлен!');
    playSound('success');
    saveUserProfile();
}

// === ФУНКЦИЯ ДЛЯ РОДИТЕЛЬСКОЙ СТАТИСТИКИ ===
function showParentStats() {
    // Создаем модальное окно для родительской статистики
    const modalHTML = `
        <div class="modal-content parent-stats-modal">
            <button class="close-modal" onclick="closeParentStats()">&times;</button>

            <div class="parent-header">
                <div class="parent-icon">
                    <i class="fas fa-user-shield" style="font-size: 3rem; color: #00ffff;"></i>
                </div>
                <div class="parent-title">
                    <h2>👨‍👩‍👧‍👦 СТАТИСТИКА ДЛЯ РОДИТЕЛЕЙ</h2>
                    <p style="color: #aaa; margin-top: 10px;">Мониторинг прогресса и активности ребенка</p>
                </div>
            </div>

            <div class="parent-stats-grid">
                <div class="parent-stat-card">
                    <div class="parent-stat-icon" style="background: rgba(255, 100, 100, 0.2);">
                        <i class="fas fa-clock" style="color: #ff6666;"></i>
                    </div>
                    <div class="parent-stat-info">
                        <div class="parent-stat-title">Общее время</div>
                        <div class="parent-stat-value">2 ч 30 мин</div>
                        <div class="parent-stat-desc">Сегодня</div>
                    </div>
                </div>

                <div class="parent-stat-card">
                    <div class="parent-stat-icon" style="background: rgba(100, 255, 100, 0.2);">
                        <i class="fas fa-star" style="color: #66ff66;"></i>
                    </div>
                    <div class="parent-stat-info">
                        <div class="parent-stat-title">Всего звёзд</div>
                        <div class="parent-stat-value" id="parent-total-stars">0</div>
                        <div class="parent-stat-desc">Заработано</div>
                    </div>
                </div>

                <div class="parent-stat-card">
                    <div class="parent-stat-icon" style="background: rgba(100, 100, 255, 0.2);">
                        <i class="fas fa-brain" style="color: #6666ff;"></i>
                    </div>
                    <div class="parent-stat-info">
                        <div class="parent-stat-title">Активность</div>
                        <div class="parent-stat-value">87%</div>
                        <div class="parent-stat-desc">Вовлечённость</div>
                    </div>
                </div>

                <div class="parent-stat-card">
                    <div class="parent-stat-icon" style="background: rgba(255, 255, 100, 0.2);">
                        <i class="fas fa-rocket" style="color: #ffff66;"></i>
                    </div>
                    <div class="parent-stat-info">
                        <div class="parent-stat-title">Изучено ракет</div>
                        <div class="parent-stat-value" id="parent-rockets-studied">0</div>
                        <div class="parent-stat-desc">Деталей: 24</div>
                    </div>
                </div>
            </div>

            <div class="parent-section">
                <h3><i class="fas fa-chart-line"></i> ПРОГРЕСС ПО ДНЯМ</h3>
                <div class="progress-chart">
                    <canvas id="progress-chart" width="400" height="200"></canvas>
                </div>
            </div>

            <div class="parent-section">
                <h3><i class="fas fa-gamepad"></i> АКТИВНОСТЬ ПО РАЗДЕЛАМ</h3>
                <div class="activity-bars">
                    <div class="activity-bar">
                        <div class="activity-label">🎮 Игры</div>
                        <div class="activity-bar-bg">
                            <div class="activity-bar-fill" style="width: 75%"></div>
                        </div>
                        <div class="activity-percent">75%</div>
                    </div>
                    <div class="activity-bar">
                        <div class="activity-label">🔬 Изучение</div>
                        <div class="activity-bar-bg">
                            <div class="activity-bar-fill" style="width: 90%"></div>
                        </div>
                        <div class="activity-percent">90%</div>
                    </div>
                    <div class="activity-bar">
                        <div class="activity-label">🎨 Раскраски</div>
                        <div class="activity-bar-bg">
                            <div class="activity-bar-fill" style="width: 60%"></div>
                        </div>
                        <div class="activity-percent">60%</div>
                    </div>
                    <div class="activity-bar">
                        <div class="activity-label">🧩 Сборка</div>
                        <div class="activity-bar-bg">
                            <div class="activity-bar-fill" style="width: 45%"></div>
                        </div>
                        <div class="activity-percent">45%</div>
                    </div>
                </div>
            </div>

            <div class="parent-section">
                <h3><i class="fas fa-trophy"></i> ДОСТИЖЕНИЯ ЗА НЕДЕЛЮ</h3>
                <div class="weekly-achievements">
                    <div class="achievement-item">
                        <div class="achievement-emoji">⭐</div>
                        <div class="achievement-text">Заработано 50 звёзд</div>
                        <div class="achievement-date">Сегодня</div>
                    </div>
                    <div class="achievement-item">
                        <div class="achievement-emoji">🚀</div>
                        <div class="achievement-text">Изучены все части Falcon 9</div>
                        <div class="achievement-date">2 дня назад</div>
                    </div>
                    <div class="achievement-item">
                        <div class="achievement-emoji">🎨</div>
                        <div class="achievement-text">Завершена 5-я раскраска</div>
                        <div class="achievement-date">3 дня назад</div>
                    </div>
                </div>
            </div>

            <div class="parent-actions">
                <button class="parent-btn report-btn" onclick="generateReport()">
                    <i class="fas fa-download"></i> Скачать отчёт
                </button>
                <button class="parent-btn settings-btn" onclick="openParentSettings()">
                    <i class="fas fa-cog"></i> Настройки
                </button>
                <button class="parent-btn close-btn" onclick="closeParentStats()">
                    <i class="fas fa-times"></i> Закрыть
                </button>
            </div>
        </div>
    `;

    // Создаем или находим модальное окно
    let modal = document.getElementById('parent-stats-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'parent-stats-modal';
        modal.className = 'modal-overlay';
        modal.innerHTML = modalHTML;
        document.body.appendChild(modal);
    } else {
        modal.innerHTML = modalHTML;
        modal.style.display = 'flex';
    }

    // Загружаем реальные данные
    loadParentStatsData();

    // Показываем модальное окно
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';

    // Инициализируем график (если есть Chart.js)
    if (typeof Chart !== 'undefined') {
        initProgressChart();
    }
}

// Функция закрытия родительской статистики
function closeParentStats() {
    const modal = document.getElementById('parent-stats-modal');
    if (modal) {
        modal.style.display = 'none';
    }
    document.body.style.overflow = 'auto';
}

// Загрузка данных для родительской статистики
function loadParentStatsData() {
    // Здесь можно загрузить реальные данные из localStorage или сервера

    // Пример: получаем звёзды из профиля
    const starsElement = document.getElementById('stars-count');
    if (starsElement) {
        const totalStars = starsElement.textContent || '0';
        const parentStarsElement = document.getElementById('parent-total-stars');
        if (parentStarsElement) {
            parentStarsElement.textContent = totalStars;
        }
    }

    // Получаем количество изученных ракет
    const rocketsStudied = localStorage.getItem('rocketsStudied') || '0';
    const parentRocketsElement = document.getElementById('parent-rockets-studied');
    if (parentRocketsElement) {
        parentRocketsElement.textContent = rocketsStudied;
    }
}

// Инициализация графика прогресса
function initProgressChart() {
    const ctx = document.getElementById('progress-chart').getContext('2d');

    // Пример данных за неделю
    const data = {
        labels: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'],
        datasets: [{
            label: 'Звёзды заработано',
            data: [12, 19, 8, 15, 22, 18, 25],
            borderColor: '#00ffff',
            backgroundColor: 'rgba(0, 255, 255, 0.1)',
            tension: 0.4,
            fill: true
        }, {
            label: 'Время (мин)',
            data: [45, 60, 30, 90, 120, 75, 150],
            borderColor: '#ff00ff',
            backgroundColor: 'rgba(255, 0, 255, 0.1)',
            tension: 0.4,
            fill: true
        }]
    };

    new Chart(ctx, {
        type: 'line',
        data: data,
        options: {
            responsive: true,
            plugins: {
                legend: {
                    labels: {
                        color: '#ffffff'
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                        color: '#ffffff'
                    }
                },
                y: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                        color: '#ffffff'
                    }
                }
            }
        }
    });
}

// Генерация отчёта
function generateReport() {
    alert('Отчёт будет сгенерирован и скачан в формате PDF!');
    // Здесь можно добавить логику генерации PDF
}

// Открытие настроек для родителей
function openParentSettings() {
    alert('Настройки для родителей (ограничение времени, уровень сложности и т.д.)');
}

// Закрытие при нажатии вне модального окна
document.addEventListener('click', function(event) {
    const modal = document.getElementById('parent-stats-modal');
    if (modal && modal.style.display === 'flex' && event.target === modal) {
        closeParentStats();
    }
});

// ==================== ДОСТИЖЕНИЯ ====================
function checkAchievements() {
    ALL_BADGES.forEach(badge => {
        if (userProfile.badges.includes(badge.id)) return;

        let earned = false;

        switch(badge.id) {
            case 'first_steps':
                earned = userProfile.stars >= 1;
                break;
            case 'rocket_lover':
                earned = userProfile.rockets_studied >= 3;
                break;
            case 'artist':
                earned = userProfile.colorings_done >= 5;
                break;
            case 'gamer':
                earned = userProfile.games_played >= 10;
                break;
            case 'explorer':
                earned = userProfile.missions_watched >= 5;
                break;
            case 'star_collector':
                earned = userProfile.stars >= 50;
                break;
            case 'master_builder':
                earned = userProfile.builds_completed >= 5;
                break;
            case 'cosmonaut':
                earned = userProfile.level >= 5;
                break;
            case 'genius':
                earned = userProfile.badges.length >= ALL_BADGES.length - 1;
                break;
        }

        if (earned) {
            awardBadge(badge);
        }
    });
}

function awardBadge(badge) {
    if (!userProfile.badges.includes(badge.id)) {
        userProfile.badges.push(badge.id);

        showNotification(`🏆 ПОЛУЧЕН БЕЙДЖ: ${badge.name}!`);

        const activity = {
            emoji: badge.emoji,
            text: `Получен бейдж "${badge.name}"`,
            time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
        };
        userProfile.activities.unshift(activity);
        userProfile.activities = userProfile.activities.slice(0, 10);

        playSound('success');
        saveUserProfile();
    }
}

// ==================== АНИМАЦИИ И ЭФФЕКТЫ ====================
function animateStars(count) {
    for (let i = 0; i < count; i++) {
        setTimeout(() => {
            const star = document.createElement('div');
            star.innerHTML = '⭐';
            star.style.cssText = `
                position: fixed;
                font-size: 2rem;
                z-index: 10000;
                animation: starFly 1.5s forwards;
                pointer-events: none;
            `;

            const startX = Math.random() * window.innerWidth;
            const startY = window.innerHeight;
            const endX = window.innerWidth - 100;
            const endY = 50;

            star.style.left = startX + 'px';
            star.style.top = startY + 'px';

            star.style.setProperty('--start-x', startX + 'px');
            star.style.setProperty('--start-y', startY + 'px');
            star.style.setProperty('--end-x', endX + 'px');
            star.style.setProperty('--end-y', endY + 'px');

            document.body.appendChild(star);

            setTimeout(() => star.remove(), 1500);
        }, i * 200);
    }
}

function createStarfield() {
    const starfield = document.querySelector('.starfield');
    const starCount = 200;

    for (let i = 0; i < starCount; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        star.style.width = Math.random() * 3 + 1 + 'px';
        star.style.height = star.style.width;
        star.style.left = Math.random() * 100 + '%';
        star.style.top = Math.random() * 100 + '%';
        star.style.animationDelay = Math.random() * 3 + 's';
        star.style.animationDuration = Math.random() * 3 + 2 + 's';
        starfield.appendChild(star);
    }
}

function createFallingStars() {
    const starfield = document.querySelector('.starfield');

    function createStar() {
        const star = document.createElement('div');
        star.className = 'falling-star';
        star.style.cssText = `
            position: absolute;
            width: ${Math.random() * 3 + 1}px;
            height: ${Math.random() * 3 + 1}px;
            background: white;
            border-radius: 50%;
            left: ${Math.random() * 100}%;
            top: -20px;
            box-shadow: 0 0 10px white;
            animation: fall ${Math.random() * 3 + 2}s linear infinite;
            animation-delay: ${Math.random() * 5}s;
            opacity: ${Math.random() * 0.5 + 0.5};
        `;
        starfield.appendChild(star);

        setTimeout(() => star.remove(), 5000);
    }

    for (let i = 0; i < 50; i++) {
        setTimeout(createStar, i * 100);
    }

    setInterval(() => {
        if (document.querySelectorAll('.falling-star').length < 50) {
            createStar();
        }
    }, 200);
}

// ==================== ЗВУКИ ====================
function playSound(type) {
    if (!audioEnabled) return;

    try {
        const sounds = {
            click: 'https://assets.mixkit.co/sfx/preview/mixkit-select-click-1109.mp3',
            star: 'https://assets.mixkit.co/sfx/preview/mixkit-winning-chimes-2015.mp3',
            rocket: 'https://assets.mixkit.co/sfx/preview/mixkit-rocket-whoosh-1114.mp3',
            success: 'https://assets.mixkit.co/sfx/preview/mixkit-achievement-bell-600.mp3',
            error: 'https://assets.mixkit.co/sfx/preview/mixkit-warning-alarm-buzzer-1551.mp3'
        };

        const audio = new Audio(sounds[type] || sounds.click);
        audio.volume = 0.3;
        audio.play();
    } catch (e) {
        console.log('Звук не воспроизводится');
    }
}

function enableAudio() {
    audioEnabled = true;
    playSound('click');
    document.getElementById('audio-btn').innerHTML = '🔊 Звук ВКЛ';
}

// ==================== ТАЙМЕР ====================
function updateCountdown() {
    const launchTime = new Date();
    launchTime.setHours(launchTime.getHours() + 2);
    const totalTime = 2 * 60 * 60 * 1000;

    function update() {
        const now = new Date();
        const diff = launchTime - now;

        if (diff > 0) {
            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

            const progressPercent = ((totalTime - diff) / totalTime) * 100;

            const hoursEl = document.getElementById('countdown-hours');
            const minutesEl = document.getElementById('countdown-minutes');
            const secondsEl = document.getElementById('countdown-seconds');

            if (hoursEl) hoursEl.textContent = hours.toString().padStart(2, '0');
            if (minutesEl) minutesEl.textContent = minutes.toString().padStart(2, '0');
            if (secondsEl) secondsEl.textContent = seconds.toString().padStart(2, '0');

            const progressFill = document.getElementById('launch-progress');
            const progressText = document.getElementById('launch-progress-text');
            if (progressFill && progressText) {
                progressFill.style.width = progressPercent + '%';
                progressText.textContent = Math.round(progressPercent) + '%';
            }
        } else {
            const hoursEl = document.getElementById('countdown-hours');
            const minutesEl = document.getElementById('countdown-minutes');
            const secondsEl = document.getElementById('countdown-seconds');

            if (hoursEl) hoursEl.textContent = '00';
            if (minutesEl) minutesEl.textContent = '00';
            if (secondsEl) secondsEl.textContent = '00';

            const progressFill = document.getElementById('launch-progress');
            const progressText = document.getElementById('launch-progress-text');
            if (progressFill && progressText) {
                progressFill.style.width = '100%';
                progressText.textContent = '100%';
            }

            if (!launchCelebrated) {
                launchCelebrated = true;
                const titleEl = document.querySelector('.countdown-title');
                if (titleEl) titleEl.textContent = '🚀 ЗАПУСК СОСТОЯЛСЯ!';

                const missionTitle = document.querySelector('.mission-info h3');
                if (missionTitle) missionTitle.textContent = 'Миссия: УСПЕШНЫЙ ЗАПУСК!';

                const missionDesc = document.querySelector('.mission-info p');
                if (missionDesc) missionDesc.textContent = 'Поздравляем с успешным запуском!';

                addStar(3, 'Запуск состоялся!');
                showNotification('🎉 УРА! Запуск прошел успешно! +3 звезды');
            }
        }
    }

    update();
    setInterval(update, 1000);
}

// ==================== УВЕДОМЛЕНИЯ ====================
function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.innerHTML = message;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s forwards';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// ==================== ИНИЦИАЛИЗАЦИЯ ====================
document.addEventListener('DOMContentLoaded', async function() {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes starFly {
            0% {
                transform: translate(0, 0) scale(1);
                opacity: 1;
            }
            50% {
                transform: translate(
                    calc(var(--end-x) - var(--start-x) - 100px),
                    calc(var(--end-y) - var(--start-y))
                ) scale(1.5);
                opacity: 0.8;
            }
            100% {
                transform: translate(
                    calc(var(--end-x) - var(--start-x)),
                    calc(var(--end-y) - var(--start-y))
                ) scale(0.5);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);

    createStarfield();
    createFallingStars();
    updateCountdown();

    await loadUserProfile();
    updateProfileDisplay();

    if (document.getElementById('coloring-canvas')) {
        canvas = document.getElementById('coloring-canvas');
        ctx = canvas.getContext('2d');
    }

    const audioBtn = document.createElement('button');
    audioBtn.id = 'audio-btn';
    audioBtn.innerHTML = '🔇 Включить звук';
    audioBtn.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 20px;
        padding: 10px 20px;
        background: rgba(0,0,0,0.7);
        color: white;
        border: 2px solid #00ffff;
        border-radius: 20px;
        cursor: pointer;
        z-index: 1000;
    `;
    audioBtn.onclick = enableAudio;
    document.body.appendChild(audioBtn);

    setTimeout(() => {
        if (userProfile && userProfile.stars === 0 && userProfile.activities.length === 0) {
            showNotification('🚀 Добро пожаловать в космическое приключение!');
        }
    }, 1000);
});