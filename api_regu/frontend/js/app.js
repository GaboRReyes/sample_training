// Configuración de la API
const API_URL = 'https://sample-training.onrender.com/api';

// Días de la semana
const DAYS = ['', 'Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

// Variables globales para los gráficos
let userChart, hourlyChart, dailyChart, peakChart;

// Elementos del DOM
const loading = document.getElementById('loading');
const error = document.getElementById('error');


// FUNCIONES DE UTILIDAD


function showLoading() {
    loading.classList.remove('hidden');
}

function hideLoading() {
    loading.classList.add('hidden');
}

function showError(message) {
    error.textContent = `Error: ${message}`;
    error.classList.remove('hidden');
    setTimeout(() => {
        error.classList.add('hidden');
    }, 5000);
}

async function fetchData(endpoint) {
    showLoading();
    try {
        const response = await fetch(`${API_URL}${endpoint}`);
        if (!response.ok) throw new Error('Error al cargar datos');
        const data = await response.json();
        hideLoading();
        return data;
    } catch (err) {
        hideLoading();
        showError(err.message);
        console.error('Error:', err);
        return null;
    }
}


// MANEJO DE TABS


document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
        const tabName = tab.dataset.tab;
        
        // Actualizar tabs activos
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        
        // Actualizar contenido activo
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(tabName).classList.add('active');
        
        // Cargar datos según la pestaña
        loadTabData(tabName);
    });
});

function loadTabData(tabName) {
    switch(tabName) {
        case 'overview':
            loadUserDistribution();
            break;
        case 'hourly':
            loadHourlyTrips();
            break;
        case 'daily':
            loadDailyTrips();
            break;
        case 'stations':
            loadTopStations();
            break;
        case 'peak':
            loadPeakHours();
            break;
    }
}


// CONSULTA 1: DISTRIBUCIÓN POR TIPO DE USUARIO


async function loadUserDistribution() {
    const data = await fetchData('/trips/user_distribution');
    if (!data || data.length === 0) return;
    
    // Actualizar stats cards
    const totalTrips = data.reduce((acc, item) => acc + item.total_trips, 0);
    const avgDuration = Math.round(data.reduce((acc, item) => acc + item.average_duration, 0) / data.length);
    
    document.getElementById('statsCards').innerHTML = `
        <div class="stat-card blue">
            <div class="stat-info">
                <h3>Total Viajes</h3>
                <p>${totalTrips.toLocaleString()}</p>
            </div>
            <div class="stat-icon">👥</div>
        </div>
        <div class="stat-card green">
            <div class="stat-info">
                <h3>Duración Promedio</h3>
                <p>${avgDuration}s</p>
            </div>
            <div class="stat-icon">⏱️</div>
        </div>
        <div class="stat-card yellow">
            <div class="stat-info">
                <h3>Tipos de Usuario</h3>
                <p>${data.length}</p>
            </div>
            <div class="stat-icon">📊</div>
        </div>
        <div class="stat-card red">
            <div class="stat-info">
                <h3>Estaciones Activas</h3>
                <p>150+</p>
            </div>
            <div class="stat-icon">📍</div>
        </div>
    `;
    
    // Crear gráfico
    const ctx = document.getElementById('userChart').getContext('2d');
    if (userChart) userChart.destroy();
    
    userChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.map(d => d.usertype),
            datasets: [
                {
                    label: 'Total Viajes',
                    data: data.map(d => d.total_trips),
                    backgroundColor: '#3b82f6',
                    borderRadius: 5
                },
                {
                    label: 'Duración Promedio (s)',
                    data: data.map(d => Math.round(d.average_duration)),
                    backgroundColor: '#10b981',
                    borderRadius: 5
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': ' + context.parsed.y.toLocaleString();
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}


// CONSULTA 2: VIAJES POR HORA


async function loadHourlyTrips() {
    const hourFilter = document.getElementById('hourFilter').value;
    const query = hourFilter ? `?hour=${hourFilter}` : '';
    const data = await fetchData(`/trips/trips_by_hour${query}`);
    if (!data || data.length === 0) return;
    
    const ctx = document.getElementById('hourlyChart').getContext('2d');
    if (hourlyChart) hourlyChart.destroy();
    
    hourlyChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.map(d => `${d.hour}:00`),
            datasets: [
                {
                    label: 'Total Viajes',
                    data: data.map(d => d.total_trips),
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    tension: 0.4,
                    fill: true
                },
                {
                    label: 'Duración Promedio (s)',
                    data: data.map(d => Math.round(d.average_duration)),
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    tension: 0.4,
                    fill: true
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': ' + context.parsed.y.toLocaleString();
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

function clearHourFilter() {
    document.getElementById('hourFilter').value = '';
    loadHourlyTrips();
}


// CONSULTA 3: VIAJES POR DÍA


async function loadDailyTrips() {
    const data = await fetchData('/trips/trips_by_day');
    if (!data || data.length === 0) return;
    
    const ctx = document.getElementById('dailyChart').getContext('2d');
    if (dailyChart) dailyChart.destroy();
    
    // Mostrar solo los primeros 30 días
    const limitedData = data.slice(0, 30);
    
    dailyChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: limitedData.map(d => d.day),
            datasets: [{
                label: 'Total Viajes',
                data: limitedData.map(d => d.total_trips),
                backgroundColor: '#3b82f6',
                borderRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': ' + context.parsed.y.toLocaleString();
                        }
                    }
                }
            },
            scales: {
                x: {
                    ticks: {
                        maxRotation: 45,
                        minRotation: 45
                    }
                },
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}


// CONSULTA 4: TOP ESTACIONES


async function loadTopStations() {
    const limit = document.getElementById('stationLimit').value;
    const data = await fetchData(`/trips/top_station?limit=${limit}`);
    if (!data || data.length === 0) return;
    
    const tbody = document.getElementById('stationsTableBody');
    tbody.innerHTML = data.map((station, index) => `
        <tr>
            <td><strong>${index + 1}</strong></td>
            <td>${station.start_station_id}</td>
            <td>${station.station_name}</td>
            <td><strong>${station.total_trips.toLocaleString()}</strong></td>
            <td>${Math.round(station.average_duration)}s</td>
        </tr>
    `).join('');
}


// CONSULTA 5: HORAS PICO


async function loadPeakHours() {
    const hour = document.getElementById('peakHourFilter').value;   
    let dayOfWeek = document.getElementById('peakDayFilter').value;

    console.log('Filtro hora:', hour);
    console.log('Filtro día de la semana:', dayOfWeek);
    
    if (dayOfWeek && isNaN(dayOfWeek)) {
        dayOfWeek = DAYS.indexOf(dayOfWeek);
    }

    const params = new URLSearchParams();
    
    if (hour !== '') params.append('hour', hour);        
    if (dayOfWeek !== '') params.append('dayOfWeek', dayOfWeek);

    const query = params.toString() ? `?${params.toString()}` : '';
    
    const data = await fetchData(`/trips/peak_hours${query}`);
    if (!data || data.length === 0) return;
        
    // Gráfico
    const ctx = document.getElementById('peakChart').getContext('2d');
    if (peakChart) peakChart.destroy();
    
    peakChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.map(d => `${d.hour}:00`),
            datasets: [{
                label: 'Total Viajes',
                data: data.map(d => d.total_trips),
                backgroundColor: '#3b82f6',
                borderRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': ' + context.parsed.y.toLocaleString();
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
    
    // Lista de horas pico
    const peakList = document.getElementById('peakList');
    peakList.innerHTML = '<h3>Top 10 Combinaciones Hora-Día</h3>' +
        data.map((peak, index) => `
            <div class="peak-item">
                <span class="peak-item-label">
                    <strong>#${index + 1}</strong> ${peak.hour}:00 - ${DAYS[peak.day_of_week]}
                </span>
                <span class="peak-item-value">${peak.total_trips.toLocaleString()} viajes</span>
            </div>
        `).join('');
}

function clearPeakFilters() {
    document.getElementById('peakHourFilter').value = '';
    document.getElementById('peakDayFilter').value = '';
    loadPeakHours();
}

// INICIALIZACIÓN

document.addEventListener('DOMContentLoaded', () => {
    console.log('Dashboard cargado correctamente');
    console.log('API URL:', API_URL);
    loadUserDistribution();
});