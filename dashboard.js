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
    Clear: 'https://images.unsplash.com/photo-1601297183305-6df142704ea2?auto=format&fit=crop&w=1920&q=80',
    Clouds: 'https://images.unsplash.com/photo-1534088568595-a066f410bcda?auto=format&fit=crop&w=1920&q=80',
    Rain: 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?auto=format&fit=crop&w=1920&q=80',
    Snow: 'https://images.unsplash.com/photo-1516431883744-f077862d497c?auto=format&fit=crop&w=1920&q=80',
    Thunderstorm: 'https://images.unsplash.com/photo-1605727216801-e27ce1d0cc28?auto=format&fit=crop&w=1920&q=80',
    Drizzle: 'https://images.unsplash.com/photo-1556485689-33e55ab56127?auto=format&fit=crop&w=1920&q=80',
    Mist: 'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?auto=format&fit=crop&w=1920&q=80'
};

document.getElementById('searchButton').addEventListener('click', fetchWeatherData);
document.getElementById('cityInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') fetchWeatherData();
});

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
    const backgroundElement = document.getElementById('weatherBackground');
    
    const condition = data.weather[0].main;
    const backgroundUrl = weatherBackgrounds[condition] || weatherBackgrounds.Clear;
    backgroundElement.style.backgroundImage = `url('${backgroundUrl}')`;

    const getWeatherIcon = (condition) => {
        switch (condition.toLowerCase()) {
            case 'clear': return 'fa-sun';
            case 'clouds': return 'fa-cloud';
            case 'rain': return 'fa-cloud-rain';
            case 'snow': return 'fa-snowflake';
            case 'thunderstorm': return 'fa-cloud-bolt';
            case 'drizzle': return 'fa-cloud-rain';
            default: return 'fa-cloud';
        }
    };

    const temp = convertTemperature(data.main.temp);

    details.innerHTML = `
    <div class="weather-main">
        <h3>${data.name}, ${data.sys.country}</h3>
        <p style="font-size: 4rem; font-weight: bold;">${temp}${currentUnit === 'celsius' ? '°C' : '°F'}</p>
        <i class="fa-solid ${getWeatherIcon(condition)} weather-icon" style="font-size: 4rem;"></i>
        <p style="font-size: 1.5rem; margin-top: 1rem;">${data.weather[0].main} - ${data.weather[0].description}</p>
    </div>
    <div class="weather-details">
        <div class="weather-detail-item">
            <i class="fa-solid fa-droplet detail-icon"></i>
            <div>
                <p style="font-size: 0.9rem; opacity: 0.9">Humidity</p>
                <p style="font-size: 1.2rem; font-weight: bold">${data.main.humidity}%</p>
            </div>
        </div>
        <div class="weather-detail-item">
            <i class="fa-solid fa-wind detail-icon"></i>
            <div>
                <p style="font-size: 0.9rem; opacity: 0.9">Wind Speed</p>
                <p style="font-size: 1.2rem; font-weight: bold">${data.wind.speed} m/s</p>
            </div>
        </div>
        <div class="weather-detail-item">
            <i class="fa-solid fa-compass detail-icon"></i>
            <div>
                <p style="font-size: 0.9rem; opacity: 0.9">Pressure</p>
                <p style="font-size: 1.2rem; font-weight: bold">${data.main.pressure} hPa</p>
            </div>
        </div>
    </div>
    `;
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
                backgroundColor: 'rgba(54, 162, 235, 0.8)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 2,
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        font: {
                            size: 12,
                            weight: 'bold'
                        },
                        color: '#333'
                    }
                },
                title: {
                    display: true,
                    text: '5-Day Temperature Forecast',
                    font: {
                        size: 16,
                        weight: 'bold'
                    },
                    color: '#333',
                    padding: {
                        top: 10,
                        bottom: 20
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    ticks: {
                        font: {
                            size: 10,
                            weight: '500'
                        },
                        color: '#333',
                        callback: function(value) {
                            return value + (currentUnit === 'celsius' ? '°C' : '°F');
                        }
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    }
                },
                x: {
                    ticks: {
                        font: {
                            size: 10,
                            weight: '500'
                        },
                        color: '#333',
                        maxRotation: 45,
                        minRotation: 45
                    },
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

function updateConditionsDoughnutChart(conditions) {
    if (charts.conditions) charts.conditions.destroy();

    const colors = {
        Clear: '#FFB300',
        Clouds: '#78909C',
        Rain: '#42A5F5',
        Snow: '#90A4AE',
        Thunderstorm: '#455A64',
        Drizzle: '#29B6F6',
        Mist: '#B0BEC5'
    };

    const ctx = document.getElementById('conditionsDoughnutChart').getContext('2d');
    charts.conditions = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(conditions),
            datasets: [{
                data: Object.values(conditions),
                backgroundColor: Object.keys(conditions).map(condition => colors[condition]),
                borderColor: '#fff',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        font: {
                            size: 12,
                            weight: '500'
                        },
                        color: '#333',
                        padding: 15
                    }
                },
                title: {
                    display: true,
                    text: 'Weather Conditions Distribution',
                    font: {
                        size: 16,
                        weight: 'bold'
                    },
                    color: '#333',
                    padding: {
                        top: 10,
                        bottom: 20
                    }
                }
            }
        }
    });
}

function updateTempLineChart(labels, data) {
    if (charts.tempLine) charts.tempLine.destroy();

    const ctx = document.getElementById('tempLineChart').getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, 'rgba(255, 87, 34, 0.8)');
    gradient.addColorStop(1, 'rgba(255, 87, 34, 0.2)');

    charts.tempLine = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: `Temperature (${currentUnit === 'celsius' ? '°C' : '°F'})`,
                data: data,
                borderColor: '#FF5722',
                backgroundColor: gradient,
                borderWidth: 3,
                tension: 0.4,
                fill: true,
                pointBackgroundColor: '#FF5722',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        font: {
                            size: 12,
                            weight: 'bold'
                        },
                        color: '#333'
                    }
                },
                title: {
                    display: true,
                    text: 'Temperature Trend',
                    font: {
                        size: 16,
                        weight: 'bold'
                    },
                    color: '#333',
                    padding: {
                        top: 10,
                        bottom: 20
                    }
                }
            },
            scales: {
                y: {
                    ticks: {
                        font: {
                            size: 10,
                            weight: '500'
                        },
                        color: '#333',
                        callback: function(value) {
                            return value + (currentUnit === 'celsius' ? '°C' : '°F');
                        }
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    }
                },
                x: {
                    ticks: {
                        font: {
                            size: 10,
                            weight: '500'
                        },
                        color: '#333',
                        maxRotation: 45,
                        minRotation: 45
                    },
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

// Add this function to handle chart resizing
function resizeCharts() {
    Object.values(charts).forEach(chart => {
        if (chart) {
            chart.resize();
        }
    });
}

window.addEventListener('resize', resizeCharts); 
function updateCharts(forecastData) {
    const dates = [];
    const temps = [];
    const conditions = {};

    forecastData.list.forEach((forecast, index) => {
        if (index % 8 === 0) {
            const date = new Date(forecast.dt * 1000);
            dates.push(date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }));
            temps.push(convertTemperature(forecast.main.temp));
            
            const condition = forecast.weather[0].main;
            conditions[condition] = (conditions[condition] || 0) + 1;
        }
    });

    updateTempBarChart(dates, temps);
    updateConditionsDoughnutChart(conditions);
    updateTempLineChart(dates, temps);
      resizeCharts();
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

        document.getElementById('cityInput').value = currentWeatherData.name;
        updateWeatherWidget(currentWeatherData);
        updateCharts(currentForecastData);
    } catch (error) {
        console.error('Error:', error);
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
            function(position) {
                const latitude = position.coords.latitude;
                const longitude = position.coords.longitude;
                getWeatherByCoords(latitude, longitude);
            },
            function(error) {
                console.error("Geolocation error:", error);
                fallbackToIslamabad();
            }
        );
    } else {
        console.log("Geolocation is not supported by this browser");
        fallbackToIslamabad();
    }
}

document.addEventListener('DOMContentLoaded', initializeWeatherApp);