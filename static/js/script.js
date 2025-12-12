// ==================== ЦЕНТРАЛИЗОВАННАЯ СИСТЕМА ЗВЁЗД ====================
let userProfile = null;
let isProfileLoaded = false;
let starsCount = 0;
let currentRocket = 'falcon9';
let currentColor = '#ff0000';
let canvas, ctx;
let audioEnabled = false;
let studiedParts = new Set(); // Для отслеживания изученных частей
let launchCelebrated = false;
let alreadyAwardedMissions = new Set(); // Для отслеживания уже награждённых миссий

// Все возможные бейджи
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

// Загрузка профиля с сервера
async function loadUserProfile() {
    try {
        const response = await fetch('/get_full_profile');
        if (response.ok) {
            userProfile = await response.json();
            isProfileLoaded = true;

            // Загружаем изученные части
            if (userProfile.studied_parts) {
                studiedParts = new Set(userProfile.studied_parts);
            }

            // Загружаем уже награждённые миссии
            if (userProfile.awarded_missions) {
                userProfile.awarded_missions.forEach(item => {
                    alreadyAwardedMissions.add(item.missionId);
                });
            }

            // Синхронизируем со счетчиком в HTML
            const starElement = document.getElementById('stars-count');
            if (starElement) {
                starElement.textContent = userProfile.stars;
            }

            // Если пользователь новый, добавляем первую звезду
            if (userProfile.stars === 0 && userProfile.activities.length === 0) {
                setTimeout(() => {
                    addStar(1, 'Добро пожаловать в космическое приключение!');
                }, 1000);
            }

            updateProfileDisplay();
            return userProfile;
        }
    } catch (error) {
        console.log('Не удалось загрузить профиль с сервера:', error);
    }

    // Если сервер не ответил, используем локальные данные
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
            awarded_missions: []
        };
    }

    isProfileLoaded = true;
    updateProfileDisplay();
    return userProfile;
}

// Сохранение профиля
async function saveUserProfile() {
    if (!userProfile) return;

    // Сохраняем изученные части
    userProfile.studied_parts = Array.from(studiedParts);

    // Сохраняем на сервер
    try {
        await fetch('/update_profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userProfile)
        });
    } catch (error) {
        console.log('Оффлайн режим, сохраняем локально');
    }

    // Всегда сохраняем локально
    localStorage.setItem('rocket_profile', JSON.stringify(userProfile));

    // Обновляем отображение
    updateProfileDisplay();
}

// Основная функция добавления звёзд
async function addStar(count = 1, reason = 'Достижение') {
    if (!isProfileLoaded) {
        await loadUserProfile();
    }

    // Обновляем локально
    userProfile.stars += count;
    userProfile.exp += count;

    // Проверяем повышение уровня
    while (userProfile.exp >= userProfile.next_level_exp) {
        userProfile.level++;
        userProfile.exp -= userProfile.next_level_exp;
        userProfile.next_level_exp = Math.floor(userProfile.next_level_exp * 1.5);

        showNotification(`🎉 УРА! Ты достиг ${userProfile.level} уровня!`);
        playSound('success');
    }

    // Добавляем активность
    const activity = {
        emoji: '⭐',
        text: `+${count} звезда: ${reason}`,
        time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
    };
    userProfile.activities.unshift(activity);
    userProfile.activities = userProfile.activities.slice(0, 10);

    // Обновляем на сервере
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

    // Обновляем отображение
    updateProfileDisplay();

    // Анимация
    animateStars(count);

    // Проверяем достижения
    checkAchievements();

    // Звук
    playSound('star');

    // Сохраняем
    saveUserProfile();

    return userProfile.stars;
}

// Обновление отображения профиля
function updateProfileDisplay() {
    if (!userProfile) return;

    // Обновляем счётчик звёзд
    const starElements = document.querySelectorAll('#stars-count, .profile-stars span:last-child');
    starElements.forEach(el => {
        if (el.id === 'stars-count' || el.parentElement.classList.contains('profile-stars')) {
            el.textContent = userProfile.stars;
        }
    });

    // Обновляем имя в профиле
    const profileNameElements = document.querySelectorAll('.profile-name, #profile-display-name');
    profileNameElements.forEach(el => {
        if (el.id === 'profile-display-name') {
            el.textContent = `👤 ${userProfile.name || 'Космонавт'}`;
        } else {
            el.textContent = userProfile.name || 'Космонавт';
        }
    });

    // Обновляем аватарку
    const avatarEmoji = getAvatarEmoji(userProfile.avatar);
    document.querySelectorAll('.avatar-emoji, .profile-emoji').forEach(el => {
        el.textContent = avatarEmoji;
    });

    // Обновляем уровень в профиле
    const levelElement = document.getElementById('profile-level');
    if (levelElement) {
        levelElement.textContent = userProfile.level;
    }

    // Обновляем прогресс
    const progressElement = document.getElementById('level-progress');
    const currentExpElement = document.getElementById('current-exp');
    const nextExpElement = document.getElementById('next-level-exp');

    if (progressElement && currentExpElement && nextExpElement) {
        const progressPercent = (userProfile.exp / userProfile.next_level_exp) * 100;
        progressElement.style.width = progressPercent + '%';
        currentExpElement.textContent = userProfile.exp;
        nextExpElement.textContent = userProfile.next_level_exp;

        // Обновляем текст прогресса
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

    // Обновляем статистику
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

// ==================== КОРРЕКТНОЕ НАЧИСЛЕНИЕ ЗВЁЗД В МИССИЯХ ====================
async function awardStarsForMission(missionId, amount, reason) {
    // Проверяем, не получал ли уже звёзды за эту миссию
    if (alreadyAwardedMissions.has(missionId)) {
        showNotification('⭐ Вы уже получали звёзды за эту миссию!');
        return false;
    }

    // Начисляем звёзды
    await addStar(amount, reason);
    alreadyAwardedMissions.add(missionId);

    // Сохраняем в профиле
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

// Вспомогательная функция для получения миссии по ID
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

// ==================== УЛУЧШЕННАЯ ФИЛЬТРАЦИЯ И ПОИСК МИССИЙ ====================
let currentFilter = 'all';

function filterMissions(filter) {
    currentFilter = filter;

    // Обновляем активную кнопку фильтра
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.textContent.toLowerCase().includes(filter)) {
            btn.classList.add('active');
        }
    });

    const missions = document.querySelectorAll('.mission-card');
    let visibleCount = 0;

    missions.forEach(mission => {
        const status = mission.dataset.status;
        const company = mission.dataset.company;
        let show = false;

        switch(filter) {
            case 'all':
                show = true;
                break;
            case 'upcoming':
                show = status === 'предстоящий';
                break;
            case 'completed':
                show = status === 'завершён';
                break;
            case 'spacex':
                show = company.includes('spacex');
                break;
            case 'roscosmos':
                show = company.includes('роскосмос');
                break;
            case 'nasa':
                show = company.includes('nasa');
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

    switch(filter) {
        case 'all': return true;
        case 'upcoming': return status === 'предстоящий';
        case 'completed': return status === 'завершён';
        case 'spacex': return company.includes('spacex');
        case 'roscosmos': return company.includes('роскосмос');
        case 'nasa': return company.includes('nasa');
        default: return true;
    }
}

// Добавьте анимацию появления
if (!document.querySelector('#mission-animations')) {
    const style = document.createElement('style');
    style.id = 'mission-animations';
    style.textContent = `
        @keyframes fadeIn {
            from {
                opacity: 0;
                transform: translateY(20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        .mission-card {
            animation: fadeIn 0.5s forwards;
        }

        .filter-btn.active {
            background: linear-gradient(45deg, #00ffff, #ff00ff) !important;
            color: black !important;
            border-color: white !important;
            transform: scale(1.05);
        }
    `;
    document.head.appendChild(style);
}

// ==================== ИГРА "СОБЕРИ РАКЕТУ" ====================
function checkRocketBuild() {
    const slots = document.querySelectorAll('.slot');
    let correct = 0;
    const total = slots.length;

    slots.forEach(slot => {
        if (slot.innerHTML.includes('✅')) {
            correct++;
        }
    });

    if (correct === total) {
        showNotification('🎉 УРА! Ракета собрана правильно! +3 звезды!');
        addStar(3, 'Собрал ракету правильно');
        userProfile.builds_completed++;
        saveUserProfile();
    } else {
        showNotification(`🔧 Нужно собрать ещё ${total - correct} деталей!`);
    }
}

// ==================== СМЕНА АВАТАРКИ И ИМЕНИ ====================
async function showAvatarSelector() {
    try {
        const response = await fetch('/available_avatars');
        const avatars = await response.json();

        let html = `
            <div style="background: rgba(0,0,0,0.9); position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: 3000; display: flex; justify-content: center; align-items: center;">
                <div style="background: linear-gradient(135deg, #1a1a3a, #2a2a5a); padding: 30px; border-radius: 25px; border: 3px solid #00ffff; max-width: 600px; width: 90%; max-height: 80vh; overflow-y: auto;">
                    <h2 style="color: #ffff00; text-align: center; margin-bottom: 20px;">👤 Выбери аватарку</h2>
                    <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 30px;">
        `;

        avatars.forEach(avatar => {
            const isSelected = userProfile.avatar === avatar.id;
            html += `
                <div onclick="selectAvatar('${avatar.id}')"
                     style="cursor: pointer; text-align: center; padding: 15px; border-radius: 15px; border: 2px solid ${isSelected ? '#ffff00' : '#00ffff'}; background: ${isSelected ? 'rgba(255,255,0,0.1)' : 'rgba(0,255,255,0.1)'}; transition: all 0.3s;">
                    <div style="font-size: 3rem; margin-bottom: 10px;">${avatar.emoji}</div>
                    <div style="color: white; font-size: 0.9rem;">${avatar.name}</div>
                </div>
            `;
        });

        html += `
                    </div>
                    <div style="margin-bottom: 20px;">
                        <h3 style="color: #00ffff; margin-bottom: 10px;">✏️ Введи своё имя:</h3>
                        <input type="text" id="profile-name-input"
                               value="${userProfile.name || 'Космонавт'}"
                               style="width: 100%; padding: 12px; border-radius: 15px; border: 2px solid #ff00ff; background: rgba(255,255,255,0.1); color: white; font-size: 1.1rem;">
                    </div>
                    <div style="display: flex; gap: 15px;">
                        <button onclick="saveProfileChanges()" style="flex: 1; padding: 15px; background: linear-gradient(45deg, #00aa00, #00ff88); color: white; border: none; border-radius: 15px; font-size: 1.1rem; cursor: pointer;">
                            💾 Сохранить
                        </button>
                        <button onclick="closeAvatarSelector()" style="flex: 1; padding: 15px; background: linear-gradient(45deg, #ff0000, #ff5500); color: white; border: none; border-radius: 15px; font-size: 1.1rem; cursor: pointer;">
                            ❌ Отмена
                        </button>
                    </div>
                </div>
            </div>
        `;

        const modal = document.createElement('div');
        modal.id = 'avatar-selector-modal';
        modal.innerHTML = html;
        document.body.appendChild(modal);

    } catch (error) {
        console.log('Ошибка загрузки аватарок:', error);
        alert('Не удалось загрузить аватарки. Проверьте подключение к интернету.');
    }
}

function selectAvatar(avatarId) {
    userProfile.avatar = avatarId;
    const avatarEmoji = getAvatarEmoji(avatarId);
    document.querySelectorAll('.avatar-emoji, .profile-emoji').forEach(el => {
        el.textContent = avatarEmoji;
    });
}

function closeAvatarSelector() {
    const modal = document.getElementById('avatar-selector-modal');
    if (modal) modal.remove();
}

async function saveProfileChanges() {
    const nameInput = document.getElementById('profile-name-input');
    const newName = nameInput.value.trim() || 'Космонавт';

    // Сохраняем имя
    userProfile.name = newName;

    // Сохраняем на сервере
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

    // Обновляем отображение
    updateProfileDisplay();

    // Закрываем модальное окно
    closeAvatarSelector();

    showNotification('✅ Профиль обновлен!');
    playSound('success');

    // Сохраняем локально
    saveUserProfile();
}

// Проверяем и выписываем достижения
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

// Награждаем бейджем
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

        try {
            const audio = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-achievement-unlocked-1997.mp3');
            audio.volume = 0.5;
            audio.play();
        } catch(e) {}

        saveUserProfile();
    }
}

// Показываем профиль
async function showProfile() {
    await loadUserProfile();

    const modal = document.getElementById('profile-modal');
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';

    // Заполняем профиль
    updateProfileDisplay();

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
        `;

        badgeEl.title = badge.requirement;
        badgesContainer.appendChild(badgeEl);
    });

    // Заполняем активность
    const activityList = document.getElementById('activity-list');
    activityList.innerHTML = '';

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

// Закрываем профиль
function closeProfile() {
    document.getElementById('profile-modal').style.display = 'none';
    document.body.style.overflow = 'auto';
    playSound('click');
}

// Магазин звёзд (демо-версия)
function showStarShop() {
    alert('🛒 МАГАЗИН ЗВЁЗД\n\n🎮 Мини-игра: 5 звёзд\n🎨 Новая раскраска: 3 звезды\n🚀 Специальная ракета: 10 звёзд\n\nСкоро открытие!');
    playSound('click');
}

// Поделиться профилем
function shareProfile() {
    const shareText = `👨‍🚀 Я космонавт ${userProfile.level} уровня в игре "Ракета, ты где?"!
⭐ У меня ${userProfile.stars} звёзд и ${userProfile.badges.length} достижений!
🚀 Присоединяйся: rocket-game.ru`;

    if (navigator.share) {
        navigator.share({
            title: 'Мой космический профиль',
            text: shareText
        });
    } else {
        alert('Скопировано в буфер обмена! ✨\n\n' + shareText);
        navigator.clipboard.writeText(shareText);
    }
}

// Анимация звезд
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

    if (!document.querySelector('#star-animation-style')) {
        const style = document.createElement('style');
        style.id = 'star-animation-style';
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
    }
}

// ==================== ЗВЕЗДНЫЙ ФОН ====================
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

// ==================== НОВЫЙ ТАЙМЕР ЗАПУСКА ====================
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

            // Обновляем цифры
            const hoursEl = document.getElementById('countdown-hours');
            const minutesEl = document.getElementById('countdown-minutes');
            const secondsEl = document.getElementById('countdown-seconds');

            if (hoursEl) hoursEl.textContent = hours.toString().padStart(2, '0');
            if (minutesEl) minutesEl.textContent = minutes.toString().padStart(2, '0');
            if (secondsEl) secondsEl.textContent = seconds.toString().padStart(2, '0');

            // Обновляем прогресс
            const progressFill = document.getElementById('launch-progress');
            const progressText = document.getElementById('launch-progress-text');
            if (progressFill && progressText) {
                progressFill.style.width = progressPercent + '%';
                progressText.textContent = Math.round(progressPercent) + '%';
            }

            // Анимация цифр
            animateDigits();
        } else {
            // Запуск состоялся
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

                const rocketIcon = document.querySelector('.rocket-icon');
                if (rocketIcon) {
                    rocketIcon.style.animation = 'rocketLaunch 3s forwards';
                }
            }
        }
    }

    function animateDigits() {
        const digits = document.querySelectorAll('.time-value');
        digits.forEach(digit => {
            digit.style.transform = 'scale(1.1)';
            setTimeout(() => {
                digit.style.transform = 'scale(1)';
            }, 300);
        });
    }

    if (!document.querySelector('#rocket-launch-animation')) {
        const style = document.createElement('style');
        style.id = 'rocket-launch-animation';
        style.textContent = `
            @keyframes rocketLaunch {
                0% { transform: translateY(0) rotate(0deg); opacity: 1; }
                50% { transform: translateY(-50px) rotate(10deg); opacity: 0.8; }
                100% { transform: translateY(-100px) rotate(20deg); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }

    update();
    setInterval(update, 1000);
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

// Функция для изучения части
async function studyPart(partId, partTitle) {
    if (studiedParts.has(partId)) {
        showNotification('✅ Эта часть уже изучена!');
        return;
    }

    studiedParts.add(partId);

    // Сохраняем на сервере
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

    // Обновляем отображение
    showPartInfo(partId);
}

// Функция возврата к обзору ракеты
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
            <p style="color: #aaa;">Нажми на кнопки ниже или кликни на ракету, чтобы изучить части!</p>

            <div style="display: flex; justify-content: center; gap: 15px; margin-top: 20px; flex-wrap: wrap;">
                <button onclick="showPartInfo('engine')" class="part-btn" style="background: linear-gradient(45deg, #ff4444, #ff0000);">
                    <span style="font-size: 1.5rem;">🔥</span><br>Двигатель
                </button>
                <button onclick="showPartInfo('tank')" class="part-btn" style="background: linear-gradient(45deg, #44ff44, #00aa00);">
                    <span style="font-size: 1.5rem;">⛽</span><br>Баки
                </button>
                <button onclick="showPartInfo('payload')" class="part-btn" style="background: linear-gradient(45deg, #4444ff, #0000ff);">
                    <span style="font-size: 1.5rem;">🛰️</span><br>Нагрузка
                </button>
                <button onclick="showPartInfo('escape')" class="part-btn" style="background: linear-gradient(45deg, #ffff44, #ffaa00);">
                    <span style="font-size: 1.5rem;">🆘</span><br>Спасение
                </button>
            </div>

            <div style="margin-top: 30px; background: rgba(0,255,255,0.1); padding: 15px; border-radius: 15px;">
                <h4 style="color: #ffff00; margin-bottom: 10px;">📊 Прогресс изучения:</h4>
                <div style="display: flex; justify-content: center; gap: 20px;">
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
}

// Выбор ракеты
function selectRocket(rocketType) {
    if (currentRocket === rocketType) {
        return;
    }

    currentRocket = rocketType;
    studiedParts.clear();

    // Меняем изображение
    document.getElementById('rocket-image').src =
        `/static/images/rockets/${rocketType}.png`;

    // Обновляем активную кнопку
    document.querySelectorAll('.rocket-selector button').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');

    // Показываем информацию о ракете
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

// Показать случайную часть при клике на ракету
function showRandomPart() {
    const parts = ['engine', 'tank', 'payload', 'escape'];
    const randomPart = parts[Math.floor(Math.random() * parts.length)];
    showPartInfo(randomPart);
}

// ==================== РАСКРАСКА РАКЕТ ====================
function startColoring() {
    userProfile.colorings_done++;
    saveUserProfile();

    document.querySelector('.action-buttons').style.display = 'none';
    document.getElementById('coloring-section').style.display = 'block';

    // Инициализация canvas
    canvas = document.getElementById('coloring-canvas');
    ctx = canvas.getContext('2d');

    // Загружаем контур ракеты
    loadRocketOutline(currentRocket);

    // Настройка событий canvas
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

    // Для мобильных устройств
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
    // Создаем простой контур если нет изображения
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Фон
    ctx.fillStyle = '#222222';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Рисуем контур ракеты
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;

    // Простой контур ракеты
    ctx.beginPath();
    ctx.moveTo(400, 550);  // Нос
    ctx.lineTo(350, 450);  // Левая сторона
    ctx.lineTo(350, 100);  // Верх
    ctx.lineTo(450, 100);  // Правый верх
    ctx.lineTo(450, 450);  // Правая сторона
    ctx.closePath();
    ctx.stroke();

    // Окна/детали
    ctx.fillStyle = '#666666';
    ctx.fillRect(380, 200, 40, 30);  // Окно
    ctx.fillRect(370, 300, 60, 40);  // Дверь
    ctx.fillRect(390, 400, 20, 50);  // Двигатель
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

// Очищаем canvas
function clearCanvas() {
    if (confirm('Очистить цвета? Контур останется.')) {
        // Восстанавливаем только белый фон и контур
        redrawContour();
    }
}

// Перерисовываем контур
function redrawContour() {
    // Очищаем весь canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Рисуем белый фон
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Если есть оригинальное изображение, рисуем его и преобразуем
    if (originalImage) {
        ctx.drawImage(originalImage, 0, 0, canvas.width, canvas.height);
        convertToColoringPage();
    } else {
        drawDefaultContour();
    }
}

// Утолщаем контуры
function thickenContours(thickness = 1) {
    if (!originalImage) return;

    // Создаем временный canvas
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;

    // Копируем текущее изображение
    tempCtx.drawImage(canvas, 0, 0);

    // Получаем данные
    const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
    const data = imageData.data;

    // Восстанавливаем оригинал
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(originalImage, 0, 0, canvas.width, canvas.height);
    convertToColoringPage();

    // Получаем данные после конвертации
    const finalData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    // Применяем утолщение
    if (thickness > 1) {
        applyThickening(finalData, thickness);
        ctx.putImageData(finalData, 0, 0);
    }
}

// Применяем утолщение к контурам
function applyThickening(imageData, thickness) {
    const data = imageData.data;
    const width = canvas.width;
    const height = canvas.height;

    // Создаем копию данных
    const originalData = new Uint8ClampedArray(data);

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const index = (y * width + x) * 4;

            // Если это черный пиксель (контур)
            if (originalData[index] < 50 &&
                originalData[index + 1] < 50 &&
                originalData[index + 2] < 50) {
// ==================== ЦЕНТРАЛИЗОВАННАЯ СИСТЕМА ЗВЁЗД ====================
let userProfile = null;
let isProfileLoaded = false;
let starsCount = 0;
let currentRocket = 'falcon9';
let currentColor = '#ff0000';
let canvas, ctx;
let audioEnabled = false;
let studiedParts = new Set(); // Для отслеживания изученных частей
let launchCelebrated = false;
let alreadyAwardedMissions = new Set(); // Для отслеживания уже награждённых миссий

// Все возможные бейджи
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

// Загрузка профиля с сервера
async function loadUserProfile() {
    try {
        const response = await fetch('/get_full_profile');
        if (response.ok) {
            userProfile = await response.json();
            isProfileLoaded = true;

            // Загружаем изученные части
            if (userProfile.studied_parts) {
                studiedParts = new Set(userProfile.studied_parts);
            }

            // Загружаем уже награждённые миссии
            if (userProfile.awarded_missions) {
                userProfile.awarded_missions.forEach(item => {
                    alreadyAwardedMissions.add(item.missionId);
                });
            }

            // Синхронизируем со счетчиком в HTML
            const starElement = document.getElementById('stars-count');
            if (starElement) {
                starElement.textContent = userProfile.stars;
            }

            // Если пользователь новый, добавляем первую звезду
            if (userProfile.stars === 0 && userProfile.activities.length === 0) {
                setTimeout(() => {
                    addStar(1, 'Добро пожаловать в космическое приключение!');
                }, 1000);
            }

            updateProfileDisplay();
            return userProfile;
        }
    } catch (error) {
        console.log('Не удалось загрузить профиль с сервера:', error);
    }

    // Если сервер не ответил, используем локальные данные
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
            awarded_missions: []
        };
    }

    isProfileLoaded = true;
    updateProfileDisplay();
    return userProfile;
}

// Сохранение профиля
async function saveUserProfile() {
    if (!userProfile) return;

    // Сохраняем изученные части
    userProfile.studied_parts = Array.from(studiedParts);

    // Сохраняем на сервер
    try {
        await fetch('/update_profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userProfile)
        });
    } catch (error) {
        console.log('Оффлайн режим, сохраняем локально');
    }

    // Всегда сохраняем локально
    localStorage.setItem('rocket_profile', JSON.stringify(userProfile));

    // Обновляем отображение
    updateProfileDisplay();
}

// Основная функция добавления звёзд
async function addStar(count = 1, reason = 'Достижение') {
    if (!isProfileLoaded) {
        await loadUserProfile();
    }

    // Обновляем локально
    userProfile.stars += count;
    userProfile.exp += count;

    // Проверяем повышение уровня
    while (userProfile.exp >= userProfile.next_level_exp) {
        userProfile.level++;
        userProfile.exp -= userProfile.next_level_exp;
        userProfile.next_level_exp = Math.floor(userProfile.next_level_exp * 1.5);

        showNotification(`🎉 УРА! Ты достиг ${userProfile.level} уровня!`);
        playSound('success');
    }

    // Добавляем активность
    const activity = {
        emoji: '⭐',
        text: `+${count} звезда: ${reason}`,
        time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
    };
    userProfile.activities.unshift(activity);
    userProfile.activities = userProfile.activities.slice(0, 10);

    // Обновляем на сервере
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

    // Обновляем отображение
    updateProfileDisplay();

    // Анимация
    animateStars(count);

    // Проверяем достижения
    checkAchievements();

    // Звук
    playSound('star');

    // Сохраняем
    saveUserProfile();

    return userProfile.stars;
}

// Обновление отображения профиля
function updateProfileDisplay() {
    if (!userProfile) return;

    // Обновляем счётчик звёзд
    const starElements = document.querySelectorAll('#stars-count, .profile-stars span:last-child');
    starElements.forEach(el => {
        if (el.id === 'stars-count' || el.parentElement.classList.contains('profile-stars')) {
            el.textContent = userProfile.stars;
        }
    });

    // Обновляем имя в профиле
    const profileNameElements = document.querySelectorAll('.profile-name, #profile-display-name');
    profileNameElements.forEach(el => {
        if (el.id === 'profile-display-name') {
            el.textContent = `👤 ${userProfile.name || 'Космонавт'}`;
        } else {
            el.textContent = userProfile.name || 'Космонавт';
        }
    });

    // Обновляем аватарку
    const avatarEmoji = getAvatarEmoji(userProfile.avatar);
    document.querySelectorAll('.avatar-emoji, .profile-emoji').forEach(el => {
        el.textContent = avatarEmoji;
    });

    // Обновляем уровень в профиле
    const levelElement = document.getElementById('profile-level');
    if (levelElement) {
        levelElement.textContent = userProfile.level;
    }

    // Обновляем прогресс
    const progressElement = document.getElementById('level-progress');
    const currentExpElement = document.getElementById('current-exp');
    const nextExpElement = document.getElementById('next-level-exp');

    if (progressElement && currentExpElement && nextExpElement) {
        const progressPercent = (userProfile.exp / userProfile.next_level_exp) * 100;
        progressElement.style.width = progressPercent + '%';
        currentExpElement.textContent = userProfile.exp;
        nextExpElement.textContent = userProfile.next_level_exp;

        // Обновляем текст прогресса
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

    // Обновляем статистику
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

// ==================== КОРРЕКТНОЕ НАЧИСЛЕНИЕ ЗВЁЗД В МИССИЯХ ====================
async function awardStarsForMission(missionId, amount, reason) {
    // Проверяем, не получал ли уже звёзды за эту миссию
    if (alreadyAwardedMissions.has(missionId)) {
        showNotification('⭐ Вы уже получали звёзды за эту миссию!');
        return false;
    }

    // Начисляем звёзды
    await addStar(amount, reason);
    alreadyAwardedMissions.add(missionId);

    // Сохраняем в профиле
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

// Вспомогательная функция для получения миссии по ID
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

// ==================== УЛУЧШЕННАЯ ФИЛЬТРАЦИЯ И ПОИСК МИССИЙ ====================
let currentFilter = 'all';

function filterMissions(filter) {
    currentFilter = filter;

    // Обновляем активную кнопку фильтра
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.textContent.toLowerCase().includes(filter)) {
            btn.classList.add('active');
        }
    });

    const missions = document.querySelectorAll('.mission-card');
    let visibleCount = 0;

    missions.forEach(mission => {
        const status = mission.dataset.status;
        const company = mission.dataset.company;
        let show = false;

        switch(filter) {
            case 'all':
                show = true;
                break;
            case 'upcoming':
                show = status === 'предстоящий';
                break;
            case 'completed':
                show = status === 'завершён';
                break;
            case 'spacex':
                show = company.includes('spacex');
                break;
            case 'roscosmos':
                show = company.includes('роскосмос');
                break;
            case 'nasa':
                show = company.includes('nasa');
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

    switch(filter) {
        case 'all': return true;
        case 'upcoming': return status === 'предстоящий';
        case 'completed': return status === 'завершён';
        case 'spacex': return company.includes('spacex');
        case 'roscosmos': return company.includes('роскосмос');
        case 'nasa': return company.includes('nasa');
        default: return true;
    }
}

// Добавьте анимацию появления
if (!document.querySelector('#mission-animations')) {
    const style = document.createElement('style');
    style.id = 'mission-animations';
    style.textContent = `
        @keyframes fadeIn {
            from {
                opacity: 0;
                transform: translateY(20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        .mission-card {
            animation: fadeIn 0.5s forwards;
        }

        .filter-btn.active {
            background: linear-gradient(45deg, #00ffff, #ff00ff) !important;
            color: black !important;
            border-color: white !important;
            transform: scale(1.05);
        }
    `;
    document.head.appendChild(style);
}

// ==================== ИГРА "СОБЕРИ РАКЕТУ" ====================
function checkRocketBuild() {
    const slots = document.querySelectorAll('.slot');
    let correct = 0;
    const total = slots.length;

    slots.forEach(slot => {
        if (slot.innerHTML.includes('✅')) {
            correct++;
        }
    });

    if (correct === total) {
        showNotification('🎉 УРА! Ракета собрана правильно! +3 звезды!');
        addStar(3, 'Собрал ракету правильно');
        userProfile.builds_completed++;
        saveUserProfile();
    } else {
        showNotification(`🔧 Нужно собрать ещё ${total - correct} деталей!`);
    }
}

// ==================== СМЕНА АВАТАРКИ И ИМЕНИ ====================
async function showAvatarSelector() {
    try {
        const response = await fetch('/available_avatars');
        const avatars = await response.json();

        let html = `
            <div style="background: rgba(0,0,0,0.9); position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: 3000; display: flex; justify-content: center; align-items: center;">
                <div style="background: linear-gradient(135deg, #1a1a3a, #2a2a5a); padding: 30px; border-radius: 25px; border: 3px solid #00ffff; max-width: 600px; width: 90%; max-height: 80vh; overflow-y: auto;">
                    <h2 style="color: #ffff00; text-align: center; margin-bottom: 20px;">👤 Выбери аватарку</h2>
                    <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 30px;">
        `;

        avatars.forEach(avatar => {
            const isSelected = userProfile.avatar === avatar.id;
            html += `
                <div onclick="selectAvatar('${avatar.id}')"
                     style="cursor: pointer; text-align: center; padding: 15px; border-radius: 15px; border: 2px solid ${isSelected ? '#ffff00' : '#00ffff'}; background: ${isSelected ? 'rgba(255,255,0,0.1)' : 'rgba(0,255,255,0.1)'}; transition: all 0.3s;">
                    <div style="font-size: 3rem; margin-bottom: 10px;">${avatar.emoji}</div>
                    <div style="color: white; font-size: 0.9rem;">${avatar.name}</div>
                </div>
            `;
        });

        html += `
                    </div>
                    <div style="margin-bottom: 20px;">
                        <h3 style="color: #00ffff; margin-bottom: 10px;">✏️ Введи своё имя:</h3>
                        <input type="text" id="profile-name-input"
                               value="${userProfile.name || 'Космонавт'}"
                               style="width: 100%; padding: 12px; border-radius: 15px; border: 2px solid #ff00ff; background: rgba(255,255,255,0.1); color: white; font-size: 1.1rem;">
                    </div>
                    <div style="display: flex; gap: 15px;">
                        <button onclick="saveProfileChanges()" style="flex: 1; padding: 15px; background: linear-gradient(45deg, #00aa00, #00ff88); color: white; border: none; border-radius: 15px; font-size: 1.1rem; cursor: pointer;">
                            💾 Сохранить
                        </button>
                        <button onclick="closeAvatarSelector()" style="flex: 1; padding: 15px; background: linear-gradient(45deg, #ff0000, #ff5500); color: white; border: none; border-radius: 15px; font-size: 1.1rem; cursor: pointer;">
                            ❌ Отмена
                        </button>
                    </div>
                </div>
            </div>
        `;

        const modal = document.createElement('div');
        modal.id = 'avatar-selector-modal';
        modal.innerHTML = html;
        document.body.appendChild(modal);

    } catch (error) {
        console.log('Ошибка загрузки аватарок:', error);
        alert('Не удалось загрузить аватарки. Проверьте подключение к интернету.');
    }
}

function selectAvatar(avatarId) {
    userProfile.avatar = avatarId;
    const avatarEmoji = getAvatarEmoji(avatarId);
    document.querySelectorAll('.avatar-emoji, .profile-emoji').forEach(el => {
        el.textContent = avatarEmoji;
    });
}

function closeAvatarSelector() {
    const modal = document.getElementById('avatar-selector-modal');
    if (modal) modal.remove();
}

async function saveProfileChanges() {
    const nameInput = document.getElementById('profile-name-input');
    const newName = nameInput.value.trim() || 'Космонавт';

    // Сохраняем имя
    userProfile.name = newName;

    // Сохраняем на сервере
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

    // Обновляем отображение
    updateProfileDisplay();

    // Закрываем модальное окно
    closeAvatarSelector();

    showNotification('✅ Профиль обновлен!');
    playSound('success');

    // Сохраняем локально
    saveUserProfile();
}

// Проверяем и выписываем достижения
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

// Награждаем бейджем
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

        try {
            const audio = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-achievement-unlocked-1997.mp3');
            audio.volume = 0.5;
            audio.play();
        } catch(e) {}

        saveUserProfile();
    }
}

// Показываем профиль
async function showProfile() {
    await loadUserProfile();

    const modal = document.getElementById('profile-modal');
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';

    // Заполняем профиль
    updateProfileDisplay();

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
        `;

        badgeEl.title = badge.requirement;
        badgesContainer.appendChild(badgeEl);
    });

    // Заполняем активность
    const activityList = document.getElementById('activity-list');
    activityList.innerHTML = '';

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

// Закрываем профиль
function closeProfile() {
    document.getElementById('profile-modal').style.display = 'none';
    document.body.style.overflow = 'auto';
    playSound('click');
}

// Магазин звёзд (демо-версия)
function showStarShop() {
    alert('🛒 МАГАЗИН ЗВЁЗД\n\n🎮 Мини-игра: 5 звёзд\n🎨 Новая раскраска: 3 звезды\n🚀 Специальная ракета: 10 звёзд\n\nСкоро открытие!');
    playSound('click');
}

// Поделиться профилем
function shareProfile() {
    const shareText = `👨‍🚀 Я космонавт ${userProfile.level} уровня в игре "Ракета, ты где?"!
⭐ У меня ${userProfile.stars} звёзд и ${userProfile.badges.length} достижений!
🚀 Присоединяйся: rocket-game.ru`;

    if (navigator.share) {
        navigator.share({
            title: 'Мой космический профиль',
            text: shareText
        });
    } else {
        alert('Скопировано в буфер обмена! ✨\n\n' + shareText);
        navigator.clipboard.writeText(shareText);
    }
}

// Анимация звезд
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

    if (!document.querySelector('#star-animation-style')) {
        const style = document.createElement('style');
        style.id = 'star-animation-style';
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
    }
}

// ==================== ЗВЕЗДНЫЙ ФОН ====================
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

// ==================== НОВЫЙ ТАЙМЕР ЗАПУСКА ====================
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

            // Обновляем цифры
            const hoursEl = document.getElementById('countdown-hours');
            const minutesEl = document.getElementById('countdown-minutes');
            const secondsEl = document.getElementById('countdown-seconds');

            if (hoursEl) hoursEl.textContent = hours.toString().padStart(2, '0');
            if (minutesEl) minutesEl.textContent = minutes.toString().padStart(2, '0');
            if (secondsEl) secondsEl.textContent = seconds.toString().padStart(2, '0');

            // Обновляем прогресс
            const progressFill = document.getElementById('launch-progress');
            const progressText = document.getElementById('launch-progress-text');
            if (progressFill && progressText) {
                progressFill.style.width = progressPercent + '%';
                progressText.textContent = Math.round(progressPercent) + '%';
            }

            // Анимация цифр
            animateDigits();
        } else {
            // Запуск состоялся
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

                const rocketIcon = document.querySelector('.rocket-icon');
                if (rocketIcon) {
                    rocketIcon.style.animation = 'rocketLaunch 3s forwards';
                }
            }
        }
    }

    function animateDigits() {
        const digits = document.querySelectorAll('.time-value');
        digits.forEach(digit => {
            digit.style.transform = 'scale(1.1)';
            setTimeout(() => {
                digit.style.transform = 'scale(1)';
            }, 300);
        });
    }

    if (!document.querySelector('#rocket-launch-animation')) {
        const style = document.createElement('style');
        style.id = 'rocket-launch-animation';
        style.textContent = `
            @keyframes rocketLaunch {
                0% { transform: translateY(0) rotate(0deg); opacity: 1; }
                50% { transform: translateY(-50px) rotate(10deg); opacity: 0.8; }
                100% { transform: translateY(-100px) rotate(20deg); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }

    update();
    setInterval(update, 1000);
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

// Функция для изучения части
async function studyPart(partId, partTitle) {
    if (studiedParts.has(partId)) {
        showNotification('✅ Эта часть уже изучена!');
        return;
    }

    studiedParts.add(partId);

    // Сохраняем на сервере
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

    // Обновляем отображение
    showPartInfo(partId);
}

// Функция возврата к обзору ракеты
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
            <p style="color: #aaa;">Нажми на кнопки ниже или кликни на ракету, чтобы изучить части!</p>

            <div style="display: flex; justify-content: center; gap: 15px; margin-top: 20px; flex-wrap: wrap;">
                <button onclick="showPartInfo('engine')" class="part-btn" style="background: linear-gradient(45deg, #ff4444, #ff0000);">
                    <span style="font-size: 1.5rem;">🔥</span><br>Двигатель
                </button>
                <button onclick="showPartInfo('tank')" class="part-btn" style="background: linear-gradient(45deg, #44ff44, #00aa00);">
                    <span style="font-size: 1.5rem;">⛽</span><br>Баки
                </button>
                <button onclick="showPartInfo('payload')" class="part-btn" style="background: linear-gradient(45deg, #4444ff, #0000ff);">
                    <span style="font-size: 1.5rem;">🛰️</span><br>Нагрузка
                </button>
                <button onclick="showPartInfo('escape')" class="part-btn" style="background: linear-gradient(45deg, #ffff44, #ffaa00);">
                    <span style="font-size: 1.5rem;">🆘</span><br>Спасение
                </button>
            </div>

            <div style="margin-top: 30px; background: rgba(0,255,255,0.1); padding: 15px; border-radius: 15px;">
                <h4 style="color: #ffff00; margin-bottom: 10px;">📊 Прогресс изучения:</h4>
                <div style="display: flex; justify-content: center; gap: 20px;">
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
}

// Выбор ракеты
function selectRocket(rocketType) {
    if (currentRocket === rocketType) {
        return;
    }

    currentRocket = rocketType;
    studiedParts.clear();

    // Меняем изображение
    document.getElementById('rocket-image').src =
        `/static/images/rockets/${rocketType}.png`;

    // Обновляем активную кнопку
    document.querySelectorAll('.rocket-selector button').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');

    // Показываем информацию о ракете
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

// Показать случайную часть при клике на ракету
function showRandomPart() {
    const parts = ['engine', 'tank', 'payload', 'escape'];
    const randomPart = parts[Math.floor(Math.random() * parts.length)];
    showPartInfo(randomPart);
}

// ==================== РАСКРАСКА РАКЕТ ====================
function startColoring() {
    userProfile.colorings_done++;
    saveUserProfile();

    document.querySelector('.action-buttons').style.display = 'none';
    document.getElementById('coloring-section').style.display = 'block';

    // Инициализация canvas
    canvas = document.getElementById('coloring-canvas');
    ctx = canvas.getContext('2d');

    // Загружаем контур ракеты
    loadRocketOutline(currentRocket);

    // Настройка событий canvas
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

    // Для мобильных устройств
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
    // Создаем простой контур если нет изображения
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Фон
    ctx.fillStyle = '#222222';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Рисуем контур ракеты
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;

    // Простой контур ракеты
    ctx.beginPath();
    ctx.moveTo(400, 550);  // Нос
    ctx.lineTo(350, 450);  // Левая сторона
    ctx.lineTo(350, 100);  // Верх
    ctx.lineTo(450, 100);  // Правый верх
    ctx.lineTo(450, 450);  // Правая сторона
    ctx.closePath();
    ctx.stroke();

    // Окна/детали
    ctx.fillStyle = '#666666';
    ctx.fillRect(380, 200, 40, 30);  // Окно
    ctx.fillRect(370, 300, 60, 40);  // Дверь
    ctx.fillRect(390, 400, 20, 50);  // Двигатель
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

// Очищаем canvas
function clearCanvas() {
    if (confirm('Очистить цвета? Контур останется.')) {
        // Восстанавливаем только белый фон и контур
        redrawContour();
    }
}

// Перерисовываем контур
function redrawContour() {
    // Очищаем весь canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Рисуем белый фон
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Если есть оригинальное изображение, рисуем его и преобразуем
    if (originalImage) {
        ctx.drawImage(originalImage, 0, 0, canvas.width, canvas.height);
        convertToColoringPage();
    } else {
        drawDefaultContour();
    }
}

// Утолщаем контуры
function thickenContours(thickness = 1) {
    if (!originalImage) return;

    // Создаем временный canvas
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;

    // Копируем текущее изображение
    tempCtx.drawImage(canvas, 0, 0);

    // Получаем данные
    const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
    const data = imageData.data;

    // Восстанавливаем оригинал
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(originalImage, 0, 0, canvas.width, canvas.height);
    convertToColoringPage();

    // Получаем данные после конвертации
    const finalData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    // Применяем утолщение
    if (thickness > 1) {
        applyThickening(finalData, thickness);
        ctx.putImageData(finalData, 0, 0);
    }
}

// Применяем утолщение к контурам
function applyThickening(imageData, thickness) {
    const data = imageData.data;
    const width = canvas.width;
    const height = canvas.height;

    // Создаем копию данных
    const originalData = new Uint8ClampedArray(data);

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const index = (y * width + x) * 4;

            // Если это черный пиксель (контур)
            if (originalData[index] < 50 &&
                originalData[index + 1] < 50 &&
                originalData[index + 2] < 50) {

                // Делаем пиксели вокруг тоже черными
                for (let dy = -thickness; dy <= thickness; dy++) {
                    for (let dx = -thickness; dx <= thickness; dx++) {
                        const nx = x + dx;
                        const ny = y + dy;

                        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                            const nIndex = (ny * width + nx) * 4;

                            // Проверяем, не белый ли это пиксель
                            if (originalData[nIndex] > 200 &&
                                originalData[nIndex + 1] > 200 &&
                                originalData[nIndex + 2] > 200) {
                                // Делаем его серым (толщина контура)
                                data[nIndex] = 100;
                                data[nIndex + 1] = 100;
                                data[nIndex + 2] = 100;
                            }
                        }
                    }
                }
            }
        }
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

// ==================== МИНИ-ИГРА "СОБЕРИ РАКЕТУ" ====================
function startBuildGame() {
    userProfile.games_played++;
    saveUserProfile();

    document.querySelector('.action-buttons').style.display = 'none';
    document.getElementById('build-game').style.display = 'block';

    let collectedParts = 0;
    const totalParts = 4;

    // Сделаем детали перетаскиваемыми
    document.querySelectorAll('.part').forEach(part => {
        part.addEventListener('dragstart', dragStart);
        part.setAttribute('draggable', 'true');
    });

    // Сделаем слоты для сброса
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
                    userProfile.builds_completed++;
                    saveUserProfile();
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

// ==================== УЛУЧШЕННОЕ МОДАЛЬНОЕ ОКНО МИССИИ ====================
async function showMissionDetail(missionId) {
    const mission = await getMissionById(missionId);
    if (!mission) return;

    const modal = document.getElementById('mission-modal');
    const content = modal.querySelector('.modal-content');

    // Проверяем, получал ли уже звёзды за эту миссию
    const alreadyAwarded = alreadyAwardedMissions.has(missionId);
    const canGetStars = !alreadyAwarded && userProfile;

    // Проверяем, в избранном ли уже
    const isFavorite = userProfile.favorites && userProfile.favorites.includes(missionId);

    // Создаем карусель фактов
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

        <!-- ШАПКА МИССИИ -->
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

        <!-- ИЗОБРАЖЕНИЕ МИССИИ С ПРОКРУТКОЙ -->
        <div class="mission-modal-image-container">
            <div class="image-scroll-container">
                <img src="/static/images/rockets/${mission.image || 'falcon9.png'}"
                     alt="${mission.name}"
                     class="mission-modal-image"
                     onload="checkImageSize(this, ${missionId})"
                     id="mission-image-${missionId}">
                ${facts.length > 0 ? `
                <div class="image-zoom-hint" id="zoom-hint-${missionId}">
                    <span class="zoom-icon">🔍</span>
                    <span class="zoom-text">Нажми и прокручивай чтобы увидеть детали!</span>
                </div>
                ` : ''}
            </div>
        </div>

        <!-- СТАТУС И ДАТА -->
        <div class="mission-modal-status">
            <div class="mission-date-big">
                <span class="date-icon">📅</span>
                <span class="date-text">${mission.date} ${mission.time || ''}</span>
            </div>
            <div class="mission-status-big ${mission.status === 'предстоящий' ? 'upcoming' : 'completed'}">
                ${mission.status.toUpperCase()}
            </div>
        </div>

        <!-- ОСНОВНАЯ ИНФОРМАЦИЯ -->
        <div class="mission-modal-info">
            <div class="info-card">
                <h3><span class="card-icon">🎯</span> Цель миссии</h3>
                <p>${mission.description}</p>
            </div>

            <!-- КАРУСЕЛЬ ИНТЕРЕСНЫХ ФАКТОВ -->
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

        <!-- КНОПКИ ДЕЙСТВИЙ -->
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

// Функция для просмотра трансляции из модального окна
async function watchMissionStreamModal(missionId) {
    // Только имитация трансляции без звёзд
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

// Функция добавления в избранное из модального окна
async function addToFavoritesModal(missionId) {
    if (!userProfile.favorites) {
        userProfile.favorites = [];
    }

    // Проверяем, не в избранном ли уже
    if (userProfile.favorites.includes(missionId)) {
        showNotification('❤️ Эта миссия уже в избранном!');
        return;
    }

    // Добавляем в избранное (без звёзд)
    userProfile.favorites.push(missionId);
    saveUserProfile();

    showNotification('❤️ Миссия добавлена в избранное!');
    playSound('success');

    // Обновляем кнопку в модальном окне
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

// Функции для карусели фактов
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

// Проверка размера изображения
function checkImageSize(img, missionId) {
    const hint = document.getElementById(`zoom-hint-${missionId}`);

    if (img.naturalWidth > img.naturalHeight) {
        // Горизонтальное изображение
        img.classList.add('image-horizontal');
        if (hint) {
            hint.innerHTML = '<span class="zoom-icon">🔍</span><span class="zoom-text">Прокручивай вправо/влево!</span>';
        }
    } else {
        // Вертикальное изображение
        img.classList.add('image-vertical');
        if (hint) {
            hint.innerHTML = '<span class="zoom-icon">🔍</span><span class="zoom-text">Прокручивай вверх/вниз!</span>';
        }
    }

    // Запускаем карусель фактов
    setTimeout(() => startFactsCarousel(missionId), 1000);
}

// Автопрокрутка фактов
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

// ==================== УВЕДОМЛЕНИЯ ====================
function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.innerHTML = `
        <div style="
            position: fixed;
            top: 100px;
            right: 20px;
            background: rgba(0,0,0,0.9);
            color: white;
            padding: 20px;
            border-radius: 15px;
            border-left: 5px solid gold;
            max-width: 300px;
            z-index: 10000;
            animation: slideIn 0.3s;
        ">
            ${message}
        </div>
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s forwards';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// ==================== ПАДАЮЩИЕ ЗВЕЗДЫ ====================
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

// ==================== СТАТИСТИКА ДЛЯ РОДИТЕЛЕЙ ====================
async function showParentStats() {
    try {
        const response = await fetch('/user_stats');
        const stats = await response.json();

        alert(`📊 СТАТИСТИКА ДЛЯ РОДИТЕЛЕЙ:

👥 Всего пользователей: ${stats.total_users}
👨‍👩‍👧‍👦 Активных сегодня: ${stats.users_today}
⭐ Рекорд звёзд на сервере: ${stats.top_stars}
🎮 Ваш ребёнок: ${userProfile.stars} звёзд
🎯 Уровень: ${userProfile.level}
🏆 Достижений: ${userProfile.badges.length}

🌟 Ребёнок изучает космос в игровой форме!
🧠 Развивает: логику, знания, моторику
🛡️ Безопасная среда, без рекламы
`);
    } catch (error) {
        alert(`📊 СТАТИСТИКА ДЛЯ РОДИТЕЛЕЙ:

🎮 Ваш ребёнок: ${userProfile.stars} звёзд
🎯 Уровень: ${userProfile.level}
🏆 Достижений: ${userProfile.badges.length}

🌟 Ребёнок изучает космос в игровой форме!
🧠 Развивает: логику, знания, моторику
🛡️ Безопасная среда, без рекламы
`);
    }
}

// ==================== ИНИЦИАЛИЗАЦИЯ ====================
document.addEventListener('DOMContentLoaded', async function() {
    // Добавляем CSS для анимаций
    const style = document.createElement('style');
    style.textContent = `
        @keyframes fall {
            0% {
                transform: translateY(0) translateX(0);
                opacity: 0;
            }
            10% {
                opacity: 1;
            }
            90% {
                opacity: 1;
            }
            100% {
                transform: translateY(100vh) translateX(${Math.random() * 100 - 50}px);
                opacity: 0;
            }
        }

        @keyframes starFall {
            0% { transform: translateY(-100px) rotate(0deg); opacity: 1; }
            100% { transform: translateY(calc(100vh + 100px)) rotate(360deg); opacity: 0; }
        }

        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }

        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
    `;
    document.head.appendChild(style);

    // Создаем звездное поле
    createStarfield();
    createFallingStars();

    // Запускаем обратный отсчет
    updateCountdown();

    // Загружаем профиль
    await loadUserProfile();
    updateProfileDisplay();

    // Инициализируем раскраску
    if (document.getElementById('coloring-canvas')) {
        canvas = document.getElementById('coloring-canvas');
        ctx = canvas.getContext('2d');
    }

    // Кнопка включения звука
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

    // Показываем приветствие для новых пользователей
    setTimeout(() => {
        if (userProfile && userProfile.stars === 0 && userProfile.activities.length === 0) {
            showNotification('🚀 Добро пожаловать в космическое приключение!');
        }
    }, 1000);
});
                // Делаем пиксели вокруг тоже черными
                for (let dy = -thickness; dy <= thickness; dy++) {
                    for (let dx = -thickness; dx <= thickness; dx++) {
                        const nx = x + dx;
                        const ny = y + dy;

                        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                            const nIndex = (ny * width + nx) * 4;

                            // Проверяем, не белый ли это пиксель
                            if (originalData[nIndex] > 200 &&
                                originalData[nIndex + 1] > 200 &&
                                originalData[nIndex + 2] > 200) {
                                // Делаем его серым (толщина контура)
                                data[nIndex] = 100;
                                data[nIndex + 1] = 100;
                                data[nIndex + 2] = 100;
                            }
                        }
                    }
                }
            }
        }
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

// ==================== МИНИ-ИГРА "СОБЕРИ РАКЕТУ" ====================
function startBuildGame() {
    userProfile.games_played++;
    saveUserProfile();

    document.querySelector('.action-buttons').style.display = 'none';
    document.getElementById('build-game').style.display = 'block';

    let collectedParts = 0;
    const totalParts = 4;

    // Сделаем детали перетаскиваемыми
    document.querySelectorAll('.part').forEach(part => {
        part.addEventListener('dragstart', dragStart);
        part.setAttribute('draggable', 'true');
    });

    // Сделаем слоты для сброса
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
                    userProfile.builds_completed++;
                    saveUserProfile();
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

// ==================== УЛУЧШЕННОЕ МОДАЛЬНОЕ ОКНО МИССИИ ====================
async function showMissionDetail(missionId) {
    const mission = await getMissionById(missionId);
    if (!mission) return;

    const modal = document.getElementById('mission-modal');
    const content = modal.querySelector('.modal-content');

    // Проверяем, получал ли уже звёзды за эту миссию
    const alreadyAwarded = alreadyAwardedMissions.has(missionId);
    const canGetStars = !alreadyAwarded && userProfile;

    // Проверяем, в избранном ли уже
    const isFavorite = userProfile.favorites && userProfile.favorites.includes(missionId);

    // Создаем карусель фактов
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

        <!-- ШАПКА МИССИИ -->
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

        <!-- ИЗОБРАЖЕНИЕ МИССИИ С ПРОКРУТКОЙ -->
        <div class="mission-modal-image-container">
            <div class="image-scroll-container">
                <img src="/static/images/rockets/${mission.image || 'falcon9.png'}"
                     alt="${mission.name}"
                     class="mission-modal-image"
                     onload="checkImageSize(this, ${missionId})"
                     id="mission-image-${missionId}">
                ${facts.length > 0 ? `
                <div class="image-zoom-hint" id="zoom-hint-${missionId}">
                    <span class="zoom-icon">🔍</span>
                    <span class="zoom-text">Нажми и прокручивай чтобы увидеть детали!</span>
                </div>
                ` : ''}
            </div>
        </div>

        <!-- СТАТУС И ДАТА -->
        <div class="mission-modal-status">
            <div class="mission-date-big">
                <span class="date-icon">📅</span>
                <span class="date-text">${mission.date} ${mission.time || ''}</span>
            </div>
            <div class="mission-status-big ${mission.status === 'предстоящий' ? 'upcoming' : 'completed'}">
                ${mission.status.toUpperCase()}
            </div>
        </div>

        <!-- ОСНОВНАЯ ИНФОРМАЦИЯ -->
        <div class="mission-modal-info">
            <div class="info-card">
                <h3><span class="card-icon">🎯</span> Цель миссии</h3>
                <p>${mission.description}</p>
            </div>

            <!-- КАРУСЕЛЬ ИНТЕРЕСНЫХ ФАКТОВ -->
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

        <!-- КНОПКИ ДЕЙСТВИЙ -->
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

// Функция для просмотра трансляции из модального окна
async function watchMissionStreamModal(missionId) {
    // Только имитация трансляции без звёзд
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

// Функция добавления в избранное из модального окна
async function addToFavoritesModal(missionId) {
    if (!userProfile.favorites) {
        userProfile.favorites = [];
    }

    // Проверяем, не в избранном ли уже
    if (userProfile.favorites.includes(missionId)) {
        showNotification('❤️ Эта миссия уже в избранном!');
        return;
    }

    // Добавляем в избранное (без звёзд)
    userProfile.favorites.push(missionId);
    saveUserProfile();

    showNotification('❤️ Миссия добавлена в избранное!');
    playSound('success');

    // Обновляем кнопку в модальном окне
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

// Функции для карусели фактов
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

// Проверка размера изображения
function checkImageSize(img, missionId) {
    const hint = document.getElementById(`zoom-hint-${missionId}`);

    if (img.naturalWidth > img.naturalHeight) {
        // Горизонтальное изображение
        img.classList.add('image-horizontal');
        if (hint) {
            hint.innerHTML = '<span class="zoom-icon">🔍</span><span class="zoom-text">Прокручивай вправо/влево!</span>';
        }
    } else {
        // Вертикальное изображение
        img.classList.add('image-vertical');
        if (hint) {
            hint.innerHTML = '<span class="zoom-icon">🔍</span><span class="zoom-text">Прокручивай вверх/вниз!</span>';
        }
    }

    // Запускаем карусель фактов
    setTimeout(() => startFactsCarousel(missionId), 1000);
}

// Автопрокрутка фактов
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

// ==================== УВЕДОМЛЕНИЯ ====================
function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.innerHTML = `
        <div style="
            position: fixed;
            top: 100px;
            right: 20px;
            background: rgba(0,0,0,0.9);
            color: white;
            padding: 20px;
            border-radius: 15px;
            border-left: 5px solid gold;
            max-width: 300px;
            z-index: 10000;
            animation: slideIn 0.3s;
        ">
            ${message}
        </div>
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s forwards';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// ==================== ПАДАЮЩИЕ ЗВЕЗДЫ ====================
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

// ==================== СТАТИСТИКА ДЛЯ РОДИТЕЛЕЙ ====================
async function showParentStats() {
    try {
        const response = await fetch('/user_stats');
        const stats = await response.json();

        alert(`📊 СТАТИСТИКА ДЛЯ РОДИТЕЛЕЙ:

👥 Всего пользователей: ${stats.total_users}
👨‍👩‍👧‍👦 Активных сегодня: ${stats.users_today}
⭐ Рекорд звёзд на сервере: ${stats.top_stars}
🎮 Ваш ребёнок: ${userProfile.stars} звёзд
🎯 Уровень: ${userProfile.level}
🏆 Достижений: ${userProfile.badges.length}

🌟 Ребёнок изучает космос в игровой форме!
🧠 Развивает: логику, знания, моторику
🛡️ Безопасная среда, без рекламы
`);
    } catch (error) {
        alert(`📊 СТАТИСТИКА ДЛЯ РОДИТЕЛЕЙ:

🎮 Ваш ребёнок: ${userProfile.stars} звёзд
🎯 Уровень: ${userProfile.level}
🏆 Достижений: ${userProfile.badges.length}

🌟 Ребёнок изучает космос в игровой форме!
🧠 Развивает: логику, знания, моторику
🛡️ Безопасная среда, без рекламы
`);
    }
}

// ==================== ИНИЦИАЛИЗАЦИЯ ====================
document.addEventListener('DOMContentLoaded', async function() {
    // Добавляем CSS для анимаций
    const style = document.createElement('style');
    style.textContent = `
        @keyframes fall {
            0% {
                transform: translateY(0) translateX(0);
                opacity: 0;
            }
            10% {
                opacity: 1;
            }
            90% {
                opacity: 1;
            }
            100% {
                transform: translateY(100vh) translateX(${Math.random() * 100 - 50}px);
                opacity: 0;
            }
        }

        @keyframes starFall {
            0% { transform: translateY(-100px) rotate(0deg); opacity: 1; }
            100% { transform: translateY(calc(100vh + 100px)) rotate(360deg); opacity: 0; }
        }

        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }

        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
    `;
    document.head.appendChild(style);

    // Создаем звездное поле
    createStarfield();
    createFallingStars();

    // Запускаем обратный отсчет
    updateCountdown();

    // Загружаем профиль
    await loadUserProfile();
    updateProfileDisplay();

    // Инициализируем раскраску
    if (document.getElementById('coloring-canvas')) {
        canvas = document.getElementById('coloring-canvas');
        ctx = canvas.getContext('2d');
    }

    // Кнопка включения звука
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

    // Показываем приветствие для новых пользователей
    setTimeout(() => {
        if (userProfile && userProfile.stars === 0 && userProfile.activities.length === 0) {
            showNotification('🚀 Добро пожаловать в космическое приключение!');
        }
    }, 1000);
});