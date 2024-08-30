// Define the server domain and get the API key from user input
const SERVER_DOMAIN = "https://developer-lostark.game.onstove.com";
let API_KEY = "";  // This will be set from the user's input

// Function to save API Key to localStorage
function saveApiKey(apiKey) {
    localStorage.setItem('apiKey', apiKey);
}

// Function to get API Key from localStorage
function getApiKey() {
    return localStorage.getItem('apiKey');
}

// Load saved API Key into input field on page load
window.onload = function() {
    const savedApiKey = getApiKey();
    if (savedApiKey) {
        document.getElementById('apiKey').value = savedApiKey;
    }
}

// Function to check if a gem is Tier 3
function isT3(gemName) {
    return gemName.includes("홍염") || gemName.includes("멸화");
}

// Function to check if a gem is an event gem
function isEvent(gemName) {
    return gemName.includes("귀속");
}

document.getElementById('gemForm').addEventListener('submit', function (event) {
    event.preventDefault();  // Prevent form submission

    // Get the API key and character name from user input
    API_KEY = document.getElementById('apiKey').value;
    const mainCharacterName = document.getElementById('characterName').value;

    // Disable the button and show the spinner
    const findGemsButton = document.getElementById('findGemsButton');
    const spinner = document.getElementById('spinner');
    const buttonText = document.getElementById('buttonText');
    findGemsButton.disabled = true;
    buttonText.style.display = 'none';
    spinner.style.display = 'block';

    // Clear previous results
    document.getElementById('resultBox').innerHTML = "";

    // Fetch and display gems
    fetchGems(mainCharacterName).finally(() => {
        // Re-enable the button and hide the spinner after the operation
        findGemsButton.disabled = false;
        spinner.style.display = 'none';
        buttonText.style.display = 'block';
    });
});

async function fetchGems(mainCharacterName) {
    try {
        const headers = {
            "Authorization": `bearer ${API_KEY}`
        };

        // Fetch sibling characters
        let response = await fetch(`${SERVER_DOMAIN}/characters/${mainCharacterName}/siblings`, { headers });
        if (!response.ok) throw new Error("Failed to fetch sibling characters.");
        saveApiKey(API_KEY)

        let siblings = await response.json();
        if (siblings.length == 0) {
            raiseCharacterNotFound(mainCharacterName);
            return;
        }
        let siblingNames = siblings.filter(s => s.CharacterLevel >= 50).map(s => s.CharacterName);

        for (let characterName of siblingNames) {
            // Create a row for each character
            createCharacterRow(characterName);

            response = await fetch(`${SERVER_DOMAIN}/armories/characters/${characterName}/gems`, { headers });
            if (!response.ok) throw new Error("Failed to fetch gems.");

            let gemsData = await response.json();
            if (!gemsData) {
                markCharacterRow(characterName, "❓"); // 시즌3 갱신 필요한 경우 null이 옴
                continue;
            }
            else if (!gemsData.Gems || gemsData.Gems.length === 0) { // 보석 미장착
                markCharacterRow(characterName, "✔️");
                continue;
            }

            let foundGems = gemsData.Gems.filter(gem => gem.Level <= 7 && isT3(gem.Name) && !isEvent(gem.Name));

            if (foundGems.length > 0) {
                displayGems(characterName, foundGems);
            } else {
                markCharacterRow(characterName, "✔️");
            }
        }
    } catch (error) {
        console.error(error);
        alert("An error occurred while fetching data.");
    }
}

// Create a row for each character
function createCharacterRow(characterName) {
    const resultBox = document.getElementById("resultBox");
    resultBox.style.display = "block";

    const characterRow = document.createElement("div");
    characterRow.className = "character-row";
    characterRow.id = `row-${characterName}`;
    characterRow.textContent = characterName;
    resultBox.appendChild(characterRow);
}

function raiseCharacterNotFound(characterName) {
    const resultBox = document.getElementById("resultBox");
    resultBox.style.display = "block";

    const errorRow = document.createElement("div");
    errorRow.className = "error-row";
    errorRow.id = "error-row";
    errorRow.textContent = `해당 캐릭터를 찾을 수 없습니다.`;
    resultBox.appendChild(errorRow);
}

// Mark the character row as checked
function markCharacterRow(characterName, text) {
    const characterRow = document.getElementById(`row-${characterName}`);
    characterRow.classList.add("checked")
    const checkMark = document.createElement("span");
    checkMark.className = "check-mark";
    checkMark.innerHTML = text;
    characterRow.appendChild(checkMark);
}

function removePTags(htmlString) {
    // Create a new DOM parser
    const parser = new DOMParser();
    // Parse the HTML string into a document
    const doc = parser.parseFromString(htmlString, 'text/html');

    // Remove <p> tags but keep the inner content
    doc.querySelectorAll('p').forEach(p => {
        p.replaceWith(...p.childNodes);  // Replace <p> with its children
    });

    // Serialize the document back to a string
    return doc.body.innerHTML;
}

// Display gems under the character row
function displayGems(characterName, gems) {
    const characterRow = document.getElementById(`row-${characterName}`);
    const gemList = document.createElement("div");
    gemList.className = "gem-list";

    gems.forEach(gem => {
        const gemItem = document.createElement("div");
        const gemNameWithoutPTags = removePTags(gem.Name);
        gemItem.innerHTML = `<span class="chevron">ㄴ</span> ${gemNameWithoutPTags}`;
        gemItem.innerHTML = `${gemNameWithoutPTags}`;
        gemList.appendChild(gemItem);
    });

    characterRow.appendChild(gemList);
}
