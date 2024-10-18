
const OPENWEATHER_API_KEY = 'bba2b4079b48987a8796363bcfc4ecc8';
let charts = {
    tempBar: null,
    conditions: null,
    tempLine: null
};
let currentUnit = 'celsius';
let currentWeatherData = null;
let currentForecastData = null;

const weatherBackgrounds = {
    Clear: 'linear-gradient(to bottom right, #4a90e2, #87ceeb)',
    Clouds: 'linear-gradient(to bottom right, #616161, #9e9e9e)',
    Rain: 'linear-gradient(to bottom right, #37474f, #78909c)',
    Snow: 'linear-gradient(to bottom right, #e0e0e0, #ffffff)',
    Thunderstorm: 'linear-gradient(to bottom right, #263238, #546e7a)',
    Drizzle: 'linear-gradient(to bottom right, #546e7a, #78909c)',
    Mist: 'linear-gradient(to bottom right, #b0bec5, #cfd8dc)'
};

document.getElementById('searchButton').addEventListener('click', fetchWeatherData);
document.getElementById('cityInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') fetchWeatherData();
});

// Add event listeners for unit toggle
document.querySelectorAll('input[name="unit"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
        currentUnit = e.target.value;
        if (currentWeatherData) updateWeatherWidget(currentWeatherData);
        if (currentForecastData) updateCharts(currentForecastData);
    });
});

async function fetchWeatherData() {
    const city = document.getElementById('cityInput').value.trim();
    if (!city) return;

    try {
        const currentResponse = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${OPENWEATHER_API_KEY}&units=metric`
        );
        
        const forecastResponse = await fetch(
            `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${OPENWEATHER_API_KEY}&units=metric`
        );

        if (!currentResponse.ok || !forecastResponse.ok) {
            throw new Error('City not found or API error');
        }

        currentWeatherData = await currentResponse.json();
        currentForecastData = await forecastResponse.json();

        updateWeatherWidget(currentWeatherData);
        updateCharts(currentForecastData);
    } catch (error) {
        console.error('Error:', error);
        alert(error.message);
    }
}

function updateWeatherWidget(data) {
    const widget = document.getElementById('weatherWidget');
    const details = document.getElementById('weatherDetails');
    
    const condition = data.weather[0].main;
    widget.style.background = weatherBackgrounds[condition] || weatherBackgrounds.Clear;

    const getWeatherIcon = (condition) => {
        switch (condition.toLowerCase()) {
            case 'clear':
                return 'fa-sun';
            case 'clouds':
                return 'fa-cloud';
            case 'rain':
                return 'fa-cloud-rain';
            case 'snow':
                return 'fa-snowflake';
            case 'thunderstorm':
                return 'fa-cloud-bolt';
            case 'drizzle':
                return 'fa-cloud-rain';
            default:
                return 'fa-cloud';
        }
    };

    const temp = convertTemperature(data.main.temp);

    details.innerHTML = `
        <div class="weather-main">
            <h3>${data.name}, ${data.sys.country}</h3>
        </div>
        <div class="weather-main">
            <i class="fa-solid ${getWeatherIcon(condition)} weather-icon"></i>
            <p style="font-size: 2rem">${temp}${currentUnit === 'celsius' ? '°C' : '°F'}</p>
        </div>
        <p>${data.weather[0].main} - ${data.weather[0].description}</p>
        <div class="weather-details">
            <div class="weather-detail-item">
                <i class="fa-solid fa-droplet detail-icon"></i>
                <p>Humidity: ${data.main.humidity}%</p>
            </div>
            <div class="weather-detail-item">
                <i class="fa-solid fa-wind detail-icon"></i>
                <p>Wind: ${data.wind.speed} m/s</p>
            </div>
        </div>
    `;
}

function updateCharts(forecastData) {
    const dates = [];
    const temps = [];
    const conditions = {};

    forecastData.list.forEach((forecast, index) => {
        if (index % 8 === 0) {
            const date = new Date(forecast.dt * 1000);
            dates.push(date.toLocaleDateString());
            temps.push(convertTemperature(forecast.main.temp));
            
            const condition = forecast.weather[0].main;
            conditions[condition] = (conditions[condition] || 0) + 1;
        }
    });

    updateTempBarChart(dates, temps);
    updateConditionsDoughnutChart(conditions);
    updateTempLineChart(dates, temps);
}

function updateTempBarChart(labels, data) {
    if (charts.tempBar) charts.tempBar.destroy();
    
    const ctx = document.getElementById('tempBarChart').getContext('2d');
    charts.tempBar = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: `Temperature (${currentUnit === 'celsius' ? '°C' : '°F'})`,
                data: data,
                backgroundColor: 'rgba(54, 162, 235, 0.5)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: '5-Day Temperature Forecast'
                }
            }
        }
    });
}

function updateConditionsDoughnutChart(conditions) {
    if (charts.conditions) charts.conditions.destroy();

    const colors = {
        Clear: '#FDB813',
        Clouds: '#B4B4B4',
        Rain: '#0066CC',
        Snow: '#FFFFFF',
        Thunderstorm: '#333333',
        Drizzle: '#87CEEB',
        Mist: '#CCCCCC'
    };

    const ctx = document.getElementById('conditionsDoughnutChart').getContext('2d');
    charts.conditions = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(conditions),
            datasets: [{
                data: Object.values(conditions),
                backgroundColor: Object.keys(conditions).map(condition => colors[condition])
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Weather Conditions Distribution'
                }
            }
        }
    });
}
function updateTempLineChart(labels, data) {
    if (charts.tempLine) charts.tempLine.destroy();

    const ctx = document.getElementById('tempLineChart').getContext('2d');
    charts.tempLine = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: `Temperature (${currentUnit === 'celsius' ? '°C' : '°F'})`,
                data: data,
                borderColor: 'rgba(255, 99, 132, 1)',
                tension: 0.1,
                fill: false
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Temperature Trend'
                }
            }
        }
    });
}

function convertTemperature(temp) {
    if (currentUnit === 'fahrenheit') {
        return Math.round((temp * 9/5) + 32);
    }
    return Math.round(temp);
}

async function getWeatherByCoords(lat, lon) {
try {
const currentResponse = await fetch(
    `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}&units=metric`
);

const forecastResponse = await fetch(
    `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}&units=metric`
);

if (!currentResponse.ok || !forecastResponse.ok) {
    throw new Error('API error');
}

currentWeatherData = await currentResponse.json();
currentForecastData = await forecastResponse.json();

// Update the city input field with the detected city
document.getElementById('cityInput').value = currentWeatherData.name;

updateWeatherWidget(currentWeatherData);
updateCharts(currentForecastData);
} catch (error) {
console.error('Error:', error);
// If geolocation weather fetch fails, fall back to Islamabad
fallbackToIslamabad();
}
}

function fallbackToIslamabad() {
document.getElementById('cityInput').value = 'Islamabad';
fetchWeatherData();
}

function initializeWeatherApp() {
if ("geolocation" in navigator) {
navigator.geolocation.getCurrentPosition(
    // Success callback
    function(position) {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        getWeatherByCoords(latitude, longitude);
    },
    // Error callback
    function(error) {
        console.error("Geolocation error:", error);
        fallbackToIslamabad();
    }
);
} else {
// Geolocation not supported
console.log("Geolocation is not supported by this browser");
fallbackToIslamabad();
}
}

document.addEventListener('DOMContentLoaded', initializeWeatherApp);