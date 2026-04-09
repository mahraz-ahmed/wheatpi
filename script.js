/* ═══════════════════════════════════════════════════
   WHEATSTONE ALLIANCE LAB DASHBOARD — ENGINE
   ═══════════════════════════════════════════════════ */

// ─── DATA ───

const PRINTERS = [
    {
        id: 'prusa-mk4-1',
        name: 'Prusa MK4 #1',
        status: 'printing',      // printing | idle | error | queued
        job: 'Olympus Wheel Hub v3',
        owner: 'Jay P.',
        progress: 67,
        eta: '2h 14m',
        queue: ['Servo Mount — Vayun K.', 'Gripper Claw — Aanya S.']
    },
    {
        id: 'prusa-mk4-2',
        name: 'Prusa MK4 #2',
        status: 'printing',
        job: 'NRC Fin Bracket',
        owner: 'Mahraz A.',
        progress: 23,
        eta: '5h 02m',
        queue: ['Nosecone Cap — Liam T.']
    },
    {
        id: 'ender-3',
        name: 'Ender 3 V3',
        status: 'idle',
        job: null,
        owner: null,
        progress: 0,
        eta: null,
        queue: []
    }
];

const EVENTS = [
    { name: 'UKSEDS Olympus Trials',   tag: 'Robotics',    date: '2026-04-10' },
    { name: 'Unibots UK',              tag: 'Competition', date: '2026-04-08' },
    { name: "Tomorrow's AI Panel",     tag: 'Talk',        date: '2026-04-12' },
    { name: 'ROS Workshop',            tag: 'Workshop',    date: '2026-04-15' },
    { name: 'CAD Drop-In Session',     tag: 'Workshop',    date: '2026-04-18' },
    { name: 'Hardware Hacks',          tag: 'Hackathon',   date: '2026-04-20' },
    { name: 'PCB Design Sprint',       tag: 'Workshop',    date: '2026-04-22' },
    { name: 'Robowars @ City',         tag: 'Competition', date: '2026-05-01' },
    { name: 'Robot Football',          tag: 'Competition', date: '2026-05-10' },
    { name: 'UKSEDS NRC',              tag: 'Rocketry',    date: '2026-06-01' },
    { name: 'European Rover Challenge', tag: 'Competition', date: '2026-06-15' },
    { name: 'White Elephant',          tag: 'Social',      date: '2026-12-20' }
];

const PROJECTS = [
    { img: 'assets/project_robot.png',  title: 'Olympus Rover',         team: 'Robotics Division' },
    { img: 'assets/project_pcb.png',    title: 'Custom Flight Computer', team: 'Avionics Team' },
    { img: 'assets/project_rocket.png', title: 'Titan I Launch Vehicle', team: 'Rocketry Division' },
    { img: 'assets/project_drone.png',  title: 'FPV Racing Quad',       team: 'Drone Club' }
];

// London coordinates for weather
const WEATHER_LAT = 51.4934;
const WEATHER_LON = -0.1132;

// ─── CLOCK ───

function updateClock() {
    const now = new Date();
    document.getElementById('clock').textContent =
        now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
    document.getElementById('clock-date').textContent =
        now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

// ─── WEATHER ───

const WEATHER_ICONS = {
    0:  '☀',  1:  '🌤', 2:  '⛅', 3:  '☁',
    45: '🌫', 48: '🌫',
    51: '🌦', 53: '🌦', 55: '🌧',
    61: '🌧', 63: '🌧', 65: '🌧',
    71: '🌨', 73: '🌨', 75: '❄',
    80: '🌦', 81: '🌧', 82: '⛈',
    95: '⛈', 96: '⛈', 99: '⛈'
};

const WEATHER_LABELS = {
    0: 'Clear',         1: 'Mostly clear',  2: 'Partly cloudy', 3: 'Overcast',
    45: 'Fog',          48: 'Rime fog',
    51: 'Light drizzle', 53: 'Drizzle',     55: 'Heavy drizzle',
    61: 'Light rain',   63: 'Rain',         65: 'Heavy rain',
    71: 'Light snow',   73: 'Snow',         75: 'Heavy snow',
    80: 'Rain showers', 81: 'Rain showers', 82: 'Heavy showers',
    95: 'Thunderstorm', 96: 'Thunderstorm', 99: 'Severe storm'
};

async function fetchWeather() {
    try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${WEATHER_LAT}&longitude=${WEATHER_LON}&current=temperature_2m,weather_code&timezone=Europe%2FLondon`;
        const res = await fetch(url);
        const data = await res.json();
        const code = data.current.weather_code;
        const temp = Math.round(data.current.temperature_2m);

        document.getElementById('weather-icon').textContent = WEATHER_ICONS[code] || '—';
        document.getElementById('weather-temp').textContent = `${temp}°C`;
        document.getElementById('weather-desc').textContent = WEATHER_LABELS[code] || '';
    } catch {
        document.getElementById('weather-temp').textContent = '—';
        document.getElementById('weather-desc').textContent = '';
    }
}

// ─── 3D PRINTERS ───

function renderPrinters() {
    const grid = document.getElementById('printer-grid');
    grid.innerHTML = '';

    PRINTERS.forEach(p => {
        const cell = document.createElement('div');
        cell.className = 'printer-cell';

        let detailHTML = '';

        if (p.status === 'printing') {
            detailHTML = `
                <div class="printer-detail">
                    <span class="printer-job">${p.job}</span>
                    <span class="printer-meta">${p.owner} · ETA ${p.eta}</span>
                    <div class="progress-track">
                        <div class="progress-fill" style="width: ${p.progress}%"></div>
                    </div>
                    <span class="printer-meta">${p.progress}% complete</span>
                </div>`;
        } else if (p.status === 'idle') {
            detailHTML = `
                <div class="printer-detail">
                    <span class="printer-job" style="color: var(--text-3);">Available</span>
                </div>`;
        } else if (p.status === 'error') {
            detailHTML = `
                <div class="printer-detail">
                    <span class="printer-job" style="color: var(--danger);">Check printer</span>
                </div>`;
        }

        let queueHTML = '';
        if (p.queue.length > 0) {
            const items = p.queue.map(q => `<span class="queue-item">${q}</span>`).join('');
            queueHTML = `
                <div class="printer-queue">
                    <span class="queue-label">Queue (${p.queue.length})</span>
                    ${items}
                </div>`;
        }

        cell.innerHTML = `
            <div class="printer-header">
                <span class="printer-name">${p.name}</span>
                <span class="printer-status status-${p.status}">
                    <span class="status-dot"></span>
                    ${p.status}
                </span>
            </div>
            ${detailHTML}
            ${queueHTML}
        `;

        grid.appendChild(cell);
    });
}

// ─── EVENTS ───

function renderEvents() {
    const list = document.getElementById('events-list');
    list.innerHTML = '';

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sorted = EVENTS
        .map(e => ({ ...e, d: new Date(e.date) }))
        .filter(e => e.d >= today)
        .sort((a, b) => a.d - b.d);

    sorted.forEach(ev => {
        const li = document.createElement('li');
        li.className = 'event-row';

        const dateStr = ev.d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

        li.innerHTML = `
            <span class="event-date">${dateStr}</span>
            <span class="event-name">${ev.name}</span>
            <span class="event-tag">${ev.tag}</span>
        `;
        list.appendChild(li);
    });

    // After layout, remove events that overflow
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            while (list.scrollHeight > list.clientHeight && list.children.length > 0) {
                list.removeChild(list.lastChild);
            }
        });
    });
}

// ─── PROJECT SPOTLIGHT ───

let spotlightIndex = 0;
const spotlightImages = [];

function initSpotlight() {
    const stage = document.getElementById('spotlight-stage');
    const dotsContainer = document.getElementById('spotlight-dots');

    // Pre-create all img elements
    PROJECTS.forEach((proj, i) => {
        const img = document.createElement('img');
        img.className = 'spotlight-img' + (i === 0 ? ' active' : '');
        img.src = proj.img;
        img.alt = proj.title;
        stage.insertBefore(img, stage.querySelector('.spotlight-caption'));
        spotlightImages.push(img);

        const dot = document.createElement('div');
        dot.className = 'spotlight-dot' + (i === 0 ? ' active' : '');
        dotsContainer.appendChild(dot);
    });

    // Remove the static img from HTML
    const staticImg = document.getElementById('spotlight-img');
    if (staticImg) staticImg.remove();

    updateSpotlightCaption();

    setInterval(nextSpotlight, 8000);
}

function nextSpotlight() {
    const dots = document.querySelectorAll('.spotlight-dot');

    spotlightImages[spotlightIndex].classList.remove('active');
    dots[spotlightIndex]?.classList.remove('active');

    spotlightIndex = (spotlightIndex + 1) % PROJECTS.length;

    spotlightImages[spotlightIndex].classList.add('active');
    dots[spotlightIndex]?.classList.add('active');

    updateSpotlightCaption();
}

function updateSpotlightCaption() {
    const proj = PROJECTS[spotlightIndex];
    document.getElementById('spotlight-title').textContent = proj.title;
    document.getElementById('spotlight-team').textContent = proj.team;
}

// ─── SIMULATE REAL-TIME PRINTER UPDATES ───

function simulatePrinterUpdates() {
    PRINTERS.forEach(p => {
        if (p.status === 'printing' && p.progress < 100) {
            p.progress = Math.min(100, p.progress + Math.random() * 0.5);
            // Recalculate ETA
            const remaining = 100 - p.progress;
            const minutesLeft = Math.round(remaining * 2.5);
            const h = Math.floor(minutesLeft / 60);
            const m = minutesLeft % 60;
            p.eta = `${h}h ${String(m).padStart(2, '0')}m`;

            if (p.progress >= 100) {
                p.progress = 100;
                p.status = 'idle';
                p.job = null;
                p.owner = null;
                p.eta = null;
                // Move queue forward
                if (p.queue.length > 0) {
                    const next = p.queue.shift();
                    const [jobName, owner] = next.split(' — ');
                    p.job = jobName;
                    p.owner = owner || 'Unknown';
                    p.status = 'printing';
                    p.progress = 0;
                    p.eta = 'Calculating...';
                }
            }
        }
    });
    renderPrinters();
}

// ─── INIT ───

function init() {
    updateClock();
    setInterval(updateClock, 1000);

    fetchWeather();
    setInterval(fetchWeather, 600000); // Refresh weather every 10 min

    renderPrinters();
    setInterval(simulatePrinterUpdates, 30000); // Update every 30s

    renderEvents();
    initSpotlight();
}

window.addEventListener('resize', () => {
    clearTimeout(window._resizeTimer);
    window._resizeTimer = setTimeout(renderEvents, 200);
});

document.addEventListener('DOMContentLoaded', init);
