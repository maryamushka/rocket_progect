// Adult Mode JavaScript - ОБНОВЛЕННАЯ ВЕРСИЯ

// Конфигурация
const API_BASE = '/api';
let allMissions = [];
let filteredMissions = [];
let compareMissions = new Set();
let currentFilters = {
    status: new Set(['upcoming']),
    company: new Set(['SpaceX']),
    type: new Set(['orbital_test']),
    search: ''
};

document.addEventListener('DOMContentLoaded', function() {
    // Обновление даты и времени
    function updateDateTime() {
        const now = new Date();
        const options = {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            timeZoneName: 'short'
        };
        document.getElementById('currentDateTime').textContent =
            now.toLocaleDateString('ru-RU', options);
    }
    updateDateTime();
    setInterval(updateDateTime, 1000);

    // Загрузка данных
    loadData();
    setupEventListeners();
});

// Загрузка всех данных
async function loadData() {
    try {
        // Загружаем миссии
        const missionsResponse = await fetch('/api/adult_missions');
        allMissions = await missionsResponse.json();

        // Загружаем статистику
        const statsResponse = await fetch('/api/launch_stats');
        const stats = await statsResponse.json();

        // Отображаем данные
        displayMissions(allMissions);
        updateStatsDisplay(stats);
        initializeCharts();

    } catch (error) {
        console.error('Ошибка загрузки данных:', error);
        showNotification('Не удалось загрузить данные. Проверьте подключение к интернету.', 'error');
    }
}

// Настройка обработчиков событий
function setupEventListeners() {
    // Обработчик поиска
    const searchInput = document.querySelector('.search-box input');
    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            searchMissions(e.target.value);
        });
    }

    // Обработчики фильтров
    document.querySelectorAll('.filter-options input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', updateFiltersFromUI);
    });
}

// Обновление фильтров из UI
function updateFiltersFromUI() {
    currentFilters = {
        status: new Set(),
        company: new Set(),
        type: new Set(),
        search: currentFilters.search
    };

    // Собираем выбранные фильтры
    document.querySelectorAll('.filter-options input[type="checkbox"]:checked').forEach(checkbox => {
        const name = checkbox.getAttribute('name') || getFilterName(checkbox);
        const value = checkbox.value;

        if (name === 'status' || name === 'company' || name === 'type') {
            currentFilters[name].add(value);
        }
    });

    applyFilters();
}

function getFilterName(checkbox) {
    // Определяем тип фильтра по родительскому элементу
    const group = checkbox.closest('.filter-group');
    if (!group) return '';

    const title = group.querySelector('h4').textContent.toLowerCase();
    if (title.includes('статус')) return 'status';
    if (title.includes('организация') || title.includes('компания')) return 'company';
    if (title.includes('тип') || title.includes('категория')) return 'type';
    return '';
}

// Применение фильтров
async function applyFilters() {
    if (allMissions.length === 0) {
        const response = await fetch('/api/adult_missions');
        allMissions = await response.json();
    }

    filteredMissions = allMissions.filter(mission => {
        // Фильтр по статусу
        if (currentFilters.status.size > 0) {
            const missionStatus = getMissionStatus(mission.status);
            if (!currentFilters.status.has(missionStatus)) {
                return false;
            }
        }

        // Фильтр по компании
        if (currentFilters.company.size > 0 && !currentFilters.company.has(mission.company)) {
            return false;
        }

        // Фильтр по типу
        if (currentFilters.type.size > 0 && mission.category) {
            if (!currentFilters.type.has(mission.category)) {
                return false;
            }
        }

        // Поиск
        if (currentFilters.search) {
            const searchTerm = currentFilters.search.toLowerCase();
            const searchFields = [
                mission.name,
                mission.company,
                mission.rocket,
                mission.description,
                mission.category
            ].filter(Boolean).join(' ').toLowerCase();

            if (!searchFields.includes(searchTerm)) {
                return false;
            }
        }

        return true;
    });

    displayMissions(filteredMissions);
}

function getMissionStatus(status) {
    const statusMap = {
        'предстоящий': 'upcoming',
        'planned': 'upcoming',
        'завершён': 'completed',
        'failed': 'failed',
        'in_progress': 'in_progress'
    };
    return statusMap[status] || status;
}

// Поиск миссий
function searchMissions(query) {
    currentFilters.search = query.toLowerCase();
    applyFilters();
}

function displayMissions(missions) {
    const missionsList = document.getElementById('missionsList');
    if (!missionsList) return;

    missionsList.innerHTML = '';

    if (missions.length === 0) {
        missionsList.innerHTML = `
            <div class="no-results">
                <i class="fas fa-search"></i>
                <h3>Миссии не найдены</h3>
                <p>Попробуйте изменить параметры фильтрации</p>
            </div>
        `;
        return;
    }

    missions.forEach(mission => {
        const missionCard = createMissionCard(mission);
        missionsList.appendChild(missionCard);
    });

    updateCompareUI();
}

function createMissionCard(mission) {
    const card = document.createElement('div');
    card.className = 'mission-card';
    card.dataset.id = mission.id;
    card.onclick = () => showMissionDetails(mission.id);

    const statusBadgeClass = {
        'upcoming': 'badge upcoming',
        'completed': 'badge completed',
        'failed': 'badge failed',
        'planned': 'badge upcoming'
    }[mission.status] || 'badge';

    const statusText = {
        'upcoming': 'Предстоящий',
        'completed': 'Завершен',
        'failed': 'Неудачный',
        'planned': 'Планируемый'
    }[mission.status] || mission.status;

    // Определяем цвет категории
    const categoryColor = getCategoryColor(mission.category || 'orbital_test');

    card.innerHTML = `
        <div class="mission-header">
            <div class="mission-title">
                <h3>${mission.name}</h3>
                <div class="company-name">${mission.company}</div>
            </div>
            <div class="mission-badges">
                <span class="${statusBadgeClass}">${statusText}</span>
                <span class="badge" style="background: ${categoryColor.background}; color: ${categoryColor.color}; border-color: ${categoryColor.border}">${getCategoryName(mission.category)}</span>
            </div>
        </div>

        <div class="rocket-info">
            <i class="fas fa-rocket"></i>
            <span>${mission.rocket}</span>
            <i class="fas fa-calendar-alt"></i>
            <span>${mission.date}</span>
            ${mission.time ? `<i class="fas fa-clock"></i><span>${mission.time}</span>` : ''}
        </div>

        <p class="mission-description">${mission.description.substring(0, 150)}${mission.description.length > 150 ? '...' : ''}</p>

        ${mission.technical_details ? `
        <div class="tech-specs">
            <div class="spec-item">
                <span class="spec-label">Высота</span>
                <span class="spec-value">${mission.technical_details.height || '—'}</span>
            </div>
            <div class="spec-item">
                <span class="spec-label">Масса</span>
                <span class="spec-value">${mission.technical_details.mass || '—'}</span>
            </div>
            <div class="spec-item">
                <span class="spec-label">Нагрузка</span>
                <span class="spec-value">${mission.technical_details.payload || '—'}</span>
            </div>
            <div class="spec-item">
                <span class="spec-label">Тяга</span>
                <span class="spec-value">${mission.technical_details.thrust || '—'}</span>
            </div>
        </div>
        ` : ''}

        ${mission.mission_goals ? `
        <div class="mission-goals">
            ${mission.mission_goals.slice(0, 2).map(goal => `
                <div class="goal-item">
                    <i class="fas fa-check-circle"></i>
                    <span>${goal}</span>
                </div>
            `).join('')}
            ${mission.mission_goals.length > 2 ? `
                <div class="goal-item">
                    <i class="fas fa-ellipsis-h"></i>
                    <span>+${mission.mission_goals.length - 2} целей</span>
                </div>
            ` : ''}
        </div>
        ` : ''}

        <div class="mission-actions">
            <button class="action-btn primary" onclick="event.stopPropagation(); watchStream(${mission.id})">
                <i class="fas fa-play"></i> Трансляция
            </button>
            <button class="action-btn secondary" onclick="event.stopPropagation(); toggleCompare(${mission.id})">
                <i class="fas fa-balance-scale"></i> Сравнить
            </button>
        </div>
    `;

    return card;
}

// Функции для категорий
function getCategoryColor(category) {
    const colors = {
        'orbital_test': { background: 'rgba(59, 130, 246, 0.1)', color: '#1d4ed8', border: 'rgba(59, 130, 246, 0.2)' },
        'manned': { background: 'rgba(16, 185, 129, 0.1)', color: '#047857', border: 'rgba(16, 185, 129, 0.2)' },
        'cargo': { background: 'rgba(245, 158, 11, 0.1)', color: '#b45309', border: 'rgba(245, 158, 11, 0.2)' },
        'scientific': { background: 'rgba(139, 92, 246, 0.1)', color: '#7c3aed', border: 'rgba(139, 92, 246, 0.2)' },
        'commercial': { background: 'rgba(14, 165, 233, 0.1)', color: '#0369a1', border: 'rgba(14, 165, 233, 0.2)' },
        'lunar': { background: 'rgba(99, 102, 241, 0.1)', color: '#4f46e5', border: 'rgba(99, 102, 241, 0.2)' },
        'martian': { background: 'rgba(239, 68, 68, 0.1)', color: '#dc2626', border: 'rgba(239, 68, 68, 0.2)' }
    };
    return colors[category] || colors['orbital_test'];
}

function getCategoryName(category) {
    const names = {
        'orbital_test': 'Орбитальный тест',
        'manned': 'Пилотируемый',
        'cargo': 'Грузовой',
        'scientific': 'Научный',
        'commercial': 'Коммерческий',
        'lunar': 'Лунный',
        'martian': 'Марсианский'
    };
    return names[category] || 'Орбитальный';
}

// Детали миссии
async function showMissionDetails(missionId) {
    try {
        const response = await fetch(`/api/mission_details/${missionId}`);
        const mission = await response.json();

        const detailsContent = document.getElementById('detailsContent');

        let detailsHTML = `
            <div class="mission-details">
                <h3>${mission.name}</h3>
                <div class="mission-meta">
                    <span class="meta-item"><i class="fas fa-building"></i> ${mission.company}</span>
                    <span class="meta-item"><i class="fas fa-calendar"></i> ${mission.date}</span>
                    <span class="meta-item"><i class="fas fa-clock"></i> ${mission.time}</span>
                </div>

                <p>${mission.description}</p>

                ${mission.technical_details ? `
                <h4><i class="fas fa-cogs"></i> Технические характеристики</h4>
                <table class="technical-table">
                    <tbody>
                        ${Object.entries(mission.technical_details).map(([key, value]) => `
                            <tr>
                                <th>${getTechnicalLabel(key)}</th>
                                <td>${value}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                ` : ''}

                ${mission.mission_goals ? `
                <h4><i class="fas fa-bullseye"></i> Цели миссии</h4>
                <ul class="goals-list">
                    ${mission.mission_goals.map(goal => `
                        <li><i class="fas fa-check" style="color: #10b981;"></i> ${goal}</li>
                    `).join('')}
                </ul>
                ` : ''}

                ${mission.timeline && mission.timeline.length > 0 ? `
                <h4><i class="fas fa-stream"></i> Временная линия</h4>
                <div class="timeline">
                    ${mission.timeline.map(item => `
                        <div class="timeline-item">
                            <span class="timeline-time">${item.time}</span>
                            <span class="timeline-event">${item.event}</span>
                        </div>
                    `).join('')}
                </div>
                ` : ''}

                ${mission.technical_analysis ? `
                <h4><i class="fas fa-chart-bar"></i> Анализ</h4>
                <div class="analysis-section">
                    ${mission.technical_analysis.innovations ? `
                    <div class="analysis-block">
                        <h5>Инновации</h5>
                        <ul>
                            ${mission.technical_analysis.innovations.map(item => `
                                <li>${item}</li>
                            `).join('')}
                        </ul>
                    </div>
                    ` : ''}

                    ${mission.technical_analysis.risks ? `
                    <div class="analysis-block">
                        <h5>Риски</h5>
                        <ul>
                            ${mission.technical_analysis.risks.map(item => `
                                <li>${item}</li>
                            `).join('')}
                        </ul>
                    </div>
                    ` : ''}
                </div>
                ` : ''}

                <div class="detail-actions">
                    <button class="action-btn primary" onclick="toggleCompare(${mission.id})">
                        <i class="fas fa-balance-scale"></i>
                        ${compareMissions.has(mission.id) ? 'Убрать из сравнения' : 'Добавить к сравнению'}
                    </button>
                    ${mission.stream_url ? `
                    <button class="action-btn secondary" onclick="watchStream(${mission.id})">
                        <i class="fas fa-play"></i>
                        Смотреть трансляцию
                    </button>
                    ` : ''}
                </div>
            </div>
        `;

        detailsContent.innerHTML = detailsHTML;

        // Показываем панель деталей
        document.getElementById('detailsPanel').style.display = 'block';

    } catch (error) {
        console.error('Ошибка загрузки деталей:', error);
        showNotification('Не удалось загрузить детали миссии', 'error');
    }
}

function getTechnicalLabel(key) {
    const labels = {
        'height': 'Высота',
        'diameter': 'Диаметр',
        'mass': 'Масса',
        'payload': 'Полезная нагрузка',
        'engines': 'Двигатели',
        'thrust': 'Тяга'
    };
    return labels[key] || key;
}

function closeDetails() {
    document.getElementById('detailsPanel').style.display = 'none';
}

// Статистика
async function loadStatistics() {
    try {
        const response = await fetch('/api/launch_stats');
        const stats = await response.json();
        updateStatsDisplay(stats);
    } catch (error) {
        console.error('Ошибка загрузки статистики:', error);
    }
}

function updateStatsDisplay(stats) {
    document.getElementById('launchesCount').textContent = stats.total_2023;
}

// Графики
function initializeCharts() {
    // График по странам
    const countryCtx = document.getElementById('countryChart');
    if (countryCtx) {
        new Chart(countryCtx.getContext('2d'), {
            type: 'doughnut',
            data: {
                labels: ['США', 'Китай', 'Россия', 'Европа', 'Индия', 'Другие'],
                datasets: [{
                    data: [108, 67, 19, 9, 7, 13],
                    backgroundColor: [
                        '#1a56db',
                        '#7c3aed',
                        '#10b981',
                        '#f59e0b',
                        '#ef4444',
                        '#64748b'
                    ],
                    borderWidth: 0,
                    borderRadius: 8
                }]
            },
            options: {
                responsive: true,
                cutout: '70%',
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: '#64748b',
                            font: {
                                family: 'Inter',
                                size: 11
                            },
                            padding: 15
                        }
                    }
                }
            }
        });
    }
}

// Сравнение миссий
function addToCompare(missionId) {
    if (!compareMissions.has(missionId)) {
        if (compareMissions.size >= 5) {
            showNotification('Можно сравнить не более 5 миссий', 'warning');
            return;
        }
        compareMissions.add(missionId);
        updateCompareUI();
    }
}

function toggleCompare(missionId) {
    if (compareMissions.has(missionId)) {
        compareMissions.delete(missionId);
    } else {
        if (compareMissions.size >= 5) {
            showNotification('Можно сравнить не более 5 миссий', 'warning');
            return;
        }
        compareMissions.add(missionId);
    }

    updateCompareUI();
}

function updateCompareUI() {
    // Обновляем кнопки сравнения в карточках
    document.querySelectorAll('.mission-card').forEach(card => {
        const missionId = parseInt(card.dataset.id);
        const btn = card.querySelector('.action-btn.secondary');
        if (btn) {
            const icon = compareMissions.has(missionId) ? 'fa-check' : 'fa-balance-scale';
            btn.innerHTML = `<i class="fas ${icon}"></i> ${compareMissions.has(missionId) ? 'В сравнении' : 'Сравнить'}`;
        }
    });

    // Обновляем счетчик в шапке
    updateCompareButton();
}

function updateCompareButton() {
    const compareBtn = document.querySelector('.compare-btn');
    if (compareBtn) {
        const count = compareMissions.size;
        compareBtn.innerHTML = `<i class="fas fa-balance-scale"></i> Сравнить ${count > 0 ? `(${count})` : ''}`;
    }
}

async function showCompareModal() {
    if (compareMissions.size < 2) {
        showNotification('Выберите минимум 2 миссии для сравнения', 'warning');
        return;
    }

    try {
        const response = await fetch('/api/compare_missions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ mission_ids: Array.from(compareMissions) })
        });

        const data = await response.json();
        displayComparison(data);
        document.getElementById('compareModal').style.display = 'flex';

    } catch (error) {
        console.error('Ошибка сравнения:', error);
        showNotification('Не удалось выполнить сравнение', 'error');
    }
}

function displayComparison(data) {
    const compareContent = document.getElementById('compareContent');

    let comparisonHTML = `
        <div class="comparison-table">
            <table>
                <thead>
                    <tr>
                        <th>Параметр</th>
                        ${data.missions.map(mission => `
                            <th>${mission.name}<br><small>${mission.company}</small></th>
                        `).join('')}
                    </tr>
                </thead>
                <tbody>
                    ${data.comparison.parameters.map((param, index) => `
                        <tr>
                            <td><strong>${param}</strong></td>
                            ${data.comparison.values.map(value => `
                                <td>${Object.values(value)[index + 1] || '—'}</td>
                            `).join('')}
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>

        <div class="comparison-actions">
            <button class="action-btn secondary" onclick="exportComparison()">
                <i class="fas fa-download"></i>
                Экспорт в CSV
            </button>
            <button class="action-btn secondary" onclick="clearComparison()">
                <i class="fas fa-trash"></i>
                Очистить сравнение
            </button>
        </div>
    `;

    compareContent.innerHTML = comparisonHTML;
}

function clearComparison() {
    compareMissions.clear();
    updateCompareUI();
    closeModal();
}

function closeModal() {
    document.getElementById('compareModal').style.display = 'none';
}

// Трансляция
function watchStream(missionId) {
    const mission = allMissions.find(m => m.id === missionId);
    if (mission && mission.stream_url) {
        window.open(mission.stream_url, '_blank');
    } else {
        showNotification('Трансляция недоступна для этой миссии', 'info');
    }
}

// Уведомления
function showNotification(message, type = 'info') {
    // Создаем элемент уведомления
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas fa-${getNotificationIcon(type)}"></i>
        <span>${message}</span>
        <button onclick="this.parentElement.remove()"><i class="fas fa-times"></i></button>
    `;

    // Добавляем стили
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${getNotificationColor(type)};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        display: flex;
        align-items: center;
        gap: 0.75rem;
        z-index: 9999;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        animation: slideIn 0.3s ease-out;
    `;

    document.body.appendChild(notification);

    // Автоматическое удаление через 5 секунд
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

function getNotificationIcon(type) {
    const icons = {
        'success': 'check-circle',
        'error': 'exclamation-triangle',
        'warning': 'exclamation-circle',
        'info': 'info-circle'
    };
    return icons[type] || 'info-circle';
}

function getNotificationColor(type) {
    const colors = {
        'success': '#10b981',
        'error': '#ef4444',
        'warning': '#f59e0b',
        'info': '#3b82f6'
    };
    return colors[type] || '#3b82f6';
}

// Экспорт
function exportComparison() {
    // Заглушка для экспорта
    showNotification('Функция экспорта в разработке', 'info');
}

// Добавляем глобальные функции
window.toggleCompare = toggleCompare;
window.watchStream = watchStream;
window.showCompareModal = showCompareModal;
window.closeModal = closeModal;
window.closeDetails = closeDetails;
window.searchMissions = searchMissions;