const OPENWEATHER_API_KEY = 'bba2b4079b48987a8796363bcfc4ecc8';
const GEMINI_API_KEY = 'AIzaSyDbmNUHISq02p0lIyopehcVEL-seDjlpBo';

// DOM Elements
const cityInput = document.getElementById('cityInput');
const searchButton = document.getElementById('searchButton');
const forecastTable = document.getElementById('forecastTable').getElementsByTagName('tbody')[0];
const chatbotMessages = document.getElementById('chatbotMessages');
const chatbotInput = document.getElementById('chatbotInput');
const sendButton = document.getElementById('sendButton');
const unitToggle = document.querySelectorAll('input[name="unit"]');

// Pagination settings
const ENTRIES_PER_PAGE = 10;
let currentPage = 1;
let totalPages = 1;

let currentCity = '';
let currentForecastData = null;
let currentUnit = 'celsius';

// Add pagination controls to the DOM
const paginationContainer = document.createElement('div');
paginationContainer.className = 'pagination';
paginationContainer.style.cssText = 'margin-top: 1rem; display: flex; justify-content: center; gap: 0.5rem;';
document.querySelector('.weather-table').appendChild(paginationContainer);

// Greetings and common responses
const greetings = ['hi', 'hello', 'hey', 'good morning', 'good afternoon', 'good evening'];
const greetingResponses = [
    'Hello! How can I help you today?',
    'Hi there! Feel free to ask about the weather or anything else.',
    'Hey! What would you like to know?'
];

// Event Listeners
searchButton.addEventListener('click', fetchWeatherData);
sendButton.addEventListener('click', sendChatbotMessage);
chatbotInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendChatbotMessage();
});

// Add event listener for unit change
unitToggle.forEach(radio => {
    radio.addEventListener('change', (e) => {
        currentUnit = e.target.value;
        if (currentForecastData) {
            displayForecastTable(currentForecastData, currentPage);
        }
    });
});

// Temperature conversion functions
function celsiusToFahrenheit(celsius) {
    return (celsius * 9/5) + 32;
}

function convertTemperature(temp, targetUnit) {
    return targetUnit === 'fahrenheit' ? celsiusToFahrenheit(temp) : temp;
}

function formatTemperature(temp, unit) {
    const symbol = unit === 'fahrenheit' ? '°F' : '°C';
    return `${temp.toFixed(1)}${symbol}`;
}

async function fetchWeatherData() {
    const city = cityInput.value.trim();
    if (!city) {
        alert("Please enter a city name.");
        return;
    }

    try {
        const response = await fetch(
            `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&appid=${OPENWEATHER_API_KEY}&units=metric`
        );
        
        if (!response.ok) {
            if (response.status === 404) {
                throw new Error('City not found. Please check the spelling and try again.');
            } else {
                throw new Error('An error occurred while fetching weather data. Please try again later.');
            }
        }
        
        const data = await response.json();
        currentCity = city;
        currentForecastData = processForecastData(data);
        totalPages = Math.ceil(currentForecastData.length / ENTRIES_PER_PAGE);
        currentPage = 1;
        displayForecastTable(currentForecastData, currentPage);
        updatePaginationControls();
    } catch (error) {
        console.error('Error fetching weather data:', error);
        alert(error.message);
    }
}

function processForecastData(data) {
    const forecasts = [];
    
    // Process all forecast entries (3-hour intervals)
    data.list.forEach(forecast => {
        forecasts.push({
            date: new Date(forecast.dt * 1000).toLocaleDateString(),
            time: new Date(forecast.dt * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            temp: forecast.main.temp,
            condition: forecast.weather[0].main,
            humidity: forecast.main.humidity,
            windSpeed: forecast.wind.speed
        });
    });

    return forecasts; // Return all entries for pagination
}

function toggleFilterDropdown() {
    document.getElementById("filterDropdown").classList.toggle("show");
}

window.onclick = function(event) {
    if (!event.target.matches('#filterButton')) {
        var dropdowns = document.getElementsByClassName("filter-content");
        for (var i = 0; i < dropdowns.length; i++) {
            var openDropdown = dropdowns[i];
            if (openDropdown.classList.contains('show')) {
                openDropdown.classList.remove('show');
            }
        }
    }
}

document.getElementById("filterButton").addEventListener("click", toggleFilterDropdown);

document.getElementById("sortAscending").addEventListener("click", function() {
    if (currentForecastData) {
        currentForecastData.sort((a, b) => a.temp - b.temp);
        displayForecastTable(currentForecastData, currentPage);
    }
});

document.getElementById("sortDescending").addEventListener("click", function() {
    if (currentForecastData) {
        currentForecastData.sort((a, b) => b.temp - a.temp);
        displayForecastTable(currentForecastData, currentPage);
    }
});

document.getElementById("filterRain").addEventListener("click", function() {
    if (currentForecastData) {
        const rainyDays = currentForecastData.filter(day => day.condition.toLowerCase().includes('rain'));
        displayForecastTable(rainyDays, 1);
    }
});

document.getElementById("showHighest").addEventListener("click", function() {
    if (currentForecastData) {
        const highestTemp = currentForecastData.reduce((max, day) => day.temp > max.temp ? day : max);
        displayForecastTable([highestTemp], 1);
    }
});

// Update the displayForecastTable function to handle filtered data
function displayForecastTable(data, page) {
    const start = (page - 1) * ENTRIES_PER_PAGE;
    const end = start + ENTRIES_PER_PAGE;
    const pageData = data.slice(start, end);

    forecastTable.innerHTML = pageData.map(entry => `
        <tr>
            <td>${entry.date} ${entry.time}</td>
            <td>${formatTemperature(convertTemperature(entry.temp, currentUnit), currentUnit)}</td>
            <td>${entry.condition}</td>
            <td>${entry.humidity}%</td>
            <td>${entry.windSpeed} m/s</td>
        </tr>
    `).join('');

    // Update pagination for filtered data
    totalPages = Math.ceil(data.length / ENTRIES_PER_PAGE);
    currentPage = page;
    updatePaginationControls();
}

function updatePaginationControls() {
    paginationContainer.innerHTML = `
        <button 
            onclick="changePage(1)" 
            class="pagination-btn" 
            ${currentPage === 1 ? 'disabled' : ''}
            style="padding: 0.5rem 1rem; background-color: var(--primary-color); color: white; border: none; border-radius: 5px; cursor: pointer;">
            First
        </button>
        <button 
            onclick="changePage(${currentPage - 1})" 
            class="pagination-btn" 
            ${currentPage === 1 ? 'disabled' : ''}
            style="padding: 0.5rem 1rem; background-color: var(--primary-color); color: white; border: none; border-radius: 5px; cursor: pointer;">
            Previous
        </button>
        <span style="align-self: center;">Page ${currentPage} of ${totalPages}</span>
        <button 
            onclick="changePage(${currentPage + 1})" 
            class="pagination-btn" 
            ${currentPage === totalPages ? 'disabled' : ''}
            style="padding: 0.5rem 1rem; background-color: var(--primary-color); color: white; border: none; border-radius: 5px; cursor: pointer;">
            Next
        </button>
        <button 
            onclick="changePage(${totalPages})" 
            class="pagination-btn" 
            ${currentPage === totalPages ? 'disabled' : ''}
            style="padding: 0.5rem 1rem; background-color: var(--primary-color); color: white; border: none; border-radius: 5px; cursor: pointer;">
            Last
        </button>
    `;
}

function changePage(page) {
    if (page < 1 || page > totalPages) return;
    currentPage = page;
    displayForecastTable(currentForecastData, currentPage);
    updatePaginationControls();
}

async function sendChatbotMessage() {
    const userMessage = chatbotInput.value.trim();
    if (!userMessage) return;

    addMessageToChatbot('user', userMessage);
    chatbotInput.value = '';

    // Enhanced unit detection
    const unitPreference = detectUnitPreference(userMessage);

    // Check for greetings
    if (greetings.some(greeting => userMessage.toLowerCase().includes(greeting))) {
        const randomGreeting = greetingResponses[Math.floor(Math.random() * greetingResponses.length)];
        addMessageToChatbot('bot', randomGreeting);
        return;
    }

    // Check for unit conversion requests
    if (userMessage.toLowerCase().includes('convert') || 
        userMessage.toLowerCase().includes('both units') ||
        userMessage.toLowerCase().includes('both temperatures')) {
        const tempMatch = userMessage.match(/(-?\d+\.?\d*)/);
        if (tempMatch) {
            const temp = parseFloat(tempMatch[0]);
            const converted = convertBothUnits(temp, detectInputUnit(userMessage));
            addMessageToChatbot('bot', converted);
            return;
        }
    }

    // Check for weather-related queries
    const cityMatch = userMessage.match(/weather (?:for |in )?([a-zA-Z\s]+)/i);
    if (cityMatch) {
        const city = cityMatch[1].trim();
        const weatherInfo = await fetchWeatherInfo(city, unitPreference);
        addMessageToChatbot('bot', weatherInfo);
        return;
    }

    // Handle other queries
    if (userMessage.toLowerCase().includes('weather')) {
        addMessageToChatbot('bot', 
            'Which city would you like to know the weather for? You can:\n' +
            '1. Ask "What\'s the weather in [city]?"\n' +
            '2. Specify units: "Weather in Paris in Fahrenheit"\n' +
            '3. Get both units: "Weather in Tokyo in both units"'
        );
    } else {
        const response = await handleGeneralQuery(userMessage);
        addMessageToChatbot('bot', response);
    }
}

function detectUnitPreference(message) {
    const lowerMessage = message.toLowerCase();
    if (lowerMessage.includes('both') || 
        lowerMessage.includes('all units') || 
        lowerMessage.includes('celsius and fahrenheit') || 
        lowerMessage.includes('fahrenheit and celsius')) {
        return 'both';
    } else if (lowerMessage.includes('fahrenheit')) {
        return 'fahrenheit';
    } else if (lowerMessage.includes('celsius')) {
        return 'celsius';
    }
    return currentUnit; // default to current unit
}

function detectInputUnit(message) {
    const lowerMessage = message.toLowerCase();
    if (lowerMessage.includes('fahrenheit')) {
        return 'fahrenheit';
    } else if (lowerMessage.includes('celsius')) {
        return 'celsius';
    }
    return currentUnit;
}

function convertBothUnits(temp, fromUnit = 'celsius') {
    if (fromUnit === 'fahrenheit') {
        const celsius = (temp - 32) * 5/9;
        return `${temp}°F is equal to ${celsius.toFixed(1)}°C`;
    } else {
        const fahrenheit = (temp * 9/5) + 32;
        return `${temp}°C is equal to ${fahrenheit.toFixed(1)}°F`;
    }
}

// Function to extract city name from user message
function extractCityName(message) {
    // Remove unit specifications from the message
    let cleanMessage = message.toLowerCase()
        .replace(/in both celsius and fahrenheit/g, '')
        .replace(/in both units/g, '')
        .replace(/in celsius/g, '')
        .replace(/in fahrenheit/g, '')
        .replace(/celsius/g, '')
        .replace(/fahrenheit/g, '')
        .trim();

    // Try to extract city name using common patterns
    let cityMatch = cleanMessage.match(/weather (?:in|for)?\s+([^.?!]+)/i);
    if (cityMatch && cityMatch[1]) {
        return cityMatch[1].trim();
    }

    // If no "weather in/for" pattern found, try to get the remaining text
    cityMatch = cleanMessage.match(/^([^.?!]+)/);
    if (cityMatch && cityMatch[1]) {
        return cityMatch[1].trim();
    }

    return null;
}

async function sendChatbotMessage() {
    const userMessage = chatbotInput.value.trim();
    if (!userMessage) return;

    addMessageToChatbot('user', userMessage);
    chatbotInput.value = '';

    // Enhanced unit detection
    const unitPreference = detectUnitPreference(userMessage);

    // Check for greetings
    if (greetings.some(greeting => userMessage.toLowerCase().includes(greeting))) {
        const randomGreeting = greetingResponses[Math.floor(Math.random() * greetingResponses.length)];
        addMessageToChatbot('bot', randomGreeting);
        return;
    }

    // Check for unit conversion requests
    if (userMessage.toLowerCase().includes('convert') || 
        userMessage.toLowerCase().includes('both units') ||
        userMessage.toLowerCase().includes('both temperatures')) {
        const tempMatch = userMessage.match(/(-?\d+\.?\d*)/);
        if (tempMatch) {
            const temp = parseFloat(tempMatch[0]);
            const converted = convertBothUnits(temp, detectInputUnit(userMessage));
            addMessageToChatbot('bot', converted);
            return;
        }
    }

    // Extract city name from the message
    const cityName = extractCityName(userMessage);
    
    if (cityName) {
        const weatherInfo = await fetchWeatherInfo(cityName, unitPreference);
        addMessageToChatbot('bot', weatherInfo);
        return;
    }

    // Handle other queries
    if (userMessage.toLowerCase().includes('weather')) {
        addMessageToChatbot('bot', 
            'Which city would you like to know the weather for? You can:\n' +
            '1. Ask "What\'s the weather in [city]?"\n' +
            '2. Specify units: "Weather in Paris in Fahrenheit"\n' +
            '3. Get both units: "Weather in Tokyo in both units"'
        );
    } else {
        const response = await handleGeneralQuery(userMessage);
        addMessageToChatbot('bot', response);
    }
}

async function fetchWeatherInfo(city, unitPreference = currentUnit) {
    try {
        // URL encode the city name to handle spaces and special characters
        const encodedCity = encodeURIComponent(city);
        
        const response = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?q=${encodedCity}&appid=${OPENWEATHER_API_KEY}&units=metric`
        );
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (unitPreference === 'both') {
            const tempC = data.main.temp;
            const tempF = celsiusToFahrenheit(tempC);
            return `Current weather in ${data.name}:
Temperature: ${tempC.toFixed(1)}°C / ${tempF.toFixed(1)}°F
Condition: ${data.weather[0].main}
Humidity: ${data.main.humidity}%
Wind Speed: ${data.wind.speed} m/s`;
        } else {
            const temp = convertTemperature(data.main.temp, unitPreference);
            return `Current weather in ${data.name}:
Temperature: ${formatTemperature(temp, unitPreference)}
Condition: ${data.weather[0].main}
Humidity: ${data.main.humidity}%
Wind Speed: ${data.wind.speed} m/s`;
        }
    } catch (error) {
        console.error('Weather API Error:', error);
        return `Sorry, I couldn't find weather information for "${city}". Please check the spelling and try again.`;
    }
}
async function handleGeneralQuery(message) {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('help')) {
        return `I can help you with:
        1. Weather info: "What's the weather in Paris?"
        2. Specific units: "Weather in London in Fahrenheit"
        3. Both units: "Weather in Tokyo in both Celsius and Fahrenheit"
        4. Convert temperatures: "Convert 32°F to Celsius"`;
    }
    
    if (lowerMessage.includes('unit') || lowerMessage.includes('temperature')) {
        return `I can show temperatures in:
        - Celsius (°C)
        - Fahrenheit (°F)
        - Or both! Just ask for "both units" when requesting weather`;
    }
    
    if (lowerMessage.includes('thank')) {
        return 'You\'re welcome! Let me know if you need anything else.';
    }

    return 'I\'m here to help with weather information. You can ask about weather in any city and specify your preferred temperature unit!';
} 

function addMessageToChatbot(sender, message) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', `${sender}-message`);
    messageElement.textContent = message;
    chatbotMessages.appendChild(messageElement);
    chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
}
    // Add initial greeting when page loads
    document.addEventListener('DOMContentLoaded', () => {
        addMessageToChatbot('bot', 'Hello! I can help you check weather for any city. Just ask me something like "What\'s the weather in Paris?" or use the search bar above. You can specify temperature units too!');
    });