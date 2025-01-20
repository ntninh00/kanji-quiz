let currentQuestionIndex = 0;
let kanjiData = [];
let correctAnswers = 0;
let totalAnsweredCorrectly = 0;
let incorrectQuestions = [];
let incorrectAttempts = {};

// Shuffle function
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// Load question function
function loadQuestion() {
    const questionElement = document.getElementById('question');
    const choicesElement = document.getElementById('choices');
    const nextButton = document.getElementById('next-button');

    nextButton.disabled = true;
    choicesElement.innerHTML = '';

    const currentKanji = kanjiData[currentQuestionIndex];

    const isMeaningQuestion = Math.random() < 0.5;

    if (isMeaningQuestion) {
        questionElement.innerText = `${currentKanji.kanji}`;
        let answerChoices = kanjiData.filter(kanji => kanji.meaning !== currentKanji.meaning);
        shuffleArray(answerChoices);
        answerChoices = answerChoices.slice(0, 3).map(kanji => kanji.meaning);
        answerChoices.push(currentKanji.meaning);
        shuffleArray(answerChoices);

        answerChoices.forEach(choice => {
            const choiceElement = document.createElement('div');
            choiceElement.classList.add('choice');
            choiceElement.innerText = choice;
            choiceElement.addEventListener('click', () => selectAnswer(choice, currentKanji.meaning, isMeaningQuestion));
            choicesElement.appendChild(choiceElement);
        });
    } else {
        questionElement.innerText = `${currentKanji.kanji}`;
        let answerChoices = kanjiData.filter(kanji => kanji.reading !== currentKanji.reading);
        shuffleArray(answerChoices);
        answerChoices = answerChoices.slice(0, 3).map(kanji => kanji.reading);
        answerChoices.push(currentKanji.reading);
        shuffleArray(answerChoices);

        answerChoices.forEach(choice => {
            const choiceElement = document.createElement('div');
            choiceElement.classList.add('choice');
            choiceElement.innerText = choice;
            choiceElement.addEventListener('click', () => selectAnswer(choice, currentKanji.reading, isMeaningQuestion));
            choicesElement.appendChild(choiceElement);
        });
    }
}

// Function to handle answer selection
function selectAnswer(selected, correct, isMeaningQuestion) {
    const nextButton = document.getElementById('next-button');
    nextButton.disabled = false;

    document.querySelectorAll('.choice').forEach(choice => {
        choice.classList.remove('correct', 'wrong');
        if (choice.innerText === correct) {
            choice.classList.add('correct');
        } else if (choice.innerText === selected) {
            choice.classList.add('wrong');
        }
    });

    const currentKanji = kanjiData[currentQuestionIndex];

    if (selected === correct) {
        correctAnswers++;
        if (!currentKanji.answeredCorrectly) {
            currentKanji.answeredCorrectly = true;
            totalAnsweredCorrectly++;
        }
    } else {
        if (!incorrectQuestions.includes(currentKanji)) {
            incorrectQuestions.push(currentKanji);
        }

        // Increment incorrect attempts count
        const key = `${currentKanji.kanji}-${isMeaningQuestion ? 'meaning' : 'reading'}`;
        if (incorrectAttempts[key]) {
            incorrectAttempts[key].count++;
        } else {
            incorrectAttempts[key] = { kanji: currentKanji.kanji, type: isMeaningQuestion ? 'Meaning' : 'Reading', count: 1 };
        }
    }

    updateRating();
    updateIncorrectBoard();
}

// Update Rating and Progress Bar
function updateRating() {
    const percentage = kanjiData.length > 0 ? (totalAnsweredCorrectly / kanjiData.length) * 100 : 0;

    document.getElementById('correct-answers').textContent = totalAnsweredCorrectly;
    document.getElementById('total-answers').textContent = kanjiData.length;
    document.getElementById('percentage').textContent = `${percentage.toFixed(0)}%`;

    const progressBar = document.getElementById('progress-bar');
    progressBar.value = percentage;

/*     if (percentage < 50) {
        document.querySelector('.rating-container').classList.add('low-score');
    } else {
        document.querySelector('.rating-container').classList.remove('low-score');
    } */

    if (percentage >= 100) {
        displayIncorrectBoard();
    }
}

// Display Incorrect Board
function displayIncorrectBoard() {
    const incorrectBoardContainer = document.getElementById('incorrect-board-container');
    incorrectBoardContainer.style.display = 'block';
}

// Update Incorrect Board
function updateIncorrectBoard() {
    const incorrectBoard = document.getElementById('incorrect-board');
    incorrectBoard.innerHTML = '';

    const sortedIncorrect = Object.values(incorrectAttempts).sort((a, b) => b.count - a.count);
    sortedIncorrect.forEach(entry => {
        const entryElement = document.createElement('div');
        entryElement.classList.add('incorrect-entry');
        entryElement.innerText = `${entry.kanji} (${entry.type}) - Incorrect: ${entry.count} times`;
        incorrectBoard.appendChild(entryElement);
    });
}

// Hide Incorrect Board
function hideIncorrectBoard() {
    const incorrectBoardContainer = document.getElementById('incorrect-board-container');
    incorrectBoardContainer.style.display = 'none';
}

// Update Kanji data based on pasted input
document.getElementById('update-button').addEventListener('click', () => {
    const bulkInput = document.getElementById('bulk-input').value.trim();
    const lines = bulkInput.split('\n');

    if (lines.length === 0 || !bulkInput) {
        alert("please paste valid data in the input field");
        return;
    }

    kanjiData = [];
    lines.forEach(line => {
        const parts = line.split(',').map(part => part.trim());
        if (parts.length >= 3) {
            const kanji = parts[0];
            const reading = parts[1];
            const meaning = parts.slice(2).join(', ');
            kanjiData.push({ kanji: kanji, reading: reading, meaning: meaning, answeredCorrectly: false });
        }
    });

    document.getElementById('bulk-input').value = '';
    updateDataDisplay();
    updateIncorrectBoard();
});

// Update the data display section inside the spoiler
function updateDataDisplay() {
    const kanjiListElement = document.getElementById('kanji-list');
    let kanjiText = '';

    kanjiData.forEach(data => {
        kanjiText += `${data.kanji}, ${data.reading}, ${data.meaning}\n`;
    });

    kanjiListElement.value = kanjiText;
}

// Next button click event
document.getElementById('next-button').addEventListener('click', () => {
    currentQuestionIndex++;
    if (currentQuestionIndex >= kanjiData.length) {
        if (incorrectQuestions.length > 0) {
            kanjiData = incorrectQuestions;
            incorrectQuestions = [];
            currentQuestionIndex = 0;
            shuffleArray(kanjiData);
        } else {
            alert("all questions answered correctly!");
            return;
        }
    }
    loadQuestion();
});

// Function to handle answer selection with kanji details reveal
function selectAnswer(selected, correct, isMeaningQuestion) {
    const nextButton = document.getElementById('next-button');
    nextButton.disabled = false;

    document.querySelectorAll('.choice').forEach(choice => {
        choice.classList.remove('correct', 'wrong');
        if (choice.innerText === correct) {
            choice.classList.add('correct');
        } else if (choice.innerText === selected) {
            choice.classList.add('wrong');
        }
    });

    const currentKanji = kanjiData[currentQuestionIndex];

    if (selected === correct) {
        correctAnswers++;
        if (!currentKanji.answeredCorrectly) {
            currentKanji.answeredCorrectly = true;
            totalAnsweredCorrectly++;
        }
    } else {
        if (!incorrectQuestions.includes(currentKanji)) {
            incorrectQuestions.push(currentKanji);
        }

        // Increment incorrect attempts count
        const key = `${currentKanji.kanji}-${isMeaningQuestion ? 'meaning' : 'reading'}`;
        if (incorrectAttempts[key]) {
            incorrectAttempts[key].count++;
        } else {
            incorrectAttempts[key] = { kanji: currentKanji.kanji, type: isMeaningQuestion ? 'Meaning' : 'Reading', count: 1 };
        }
    }

    updateRating();
    updateIncorrectBoard();

    // Display kanji details on answer selection
    revealKanjiDetails(currentKanji);
}

// Function to reveal kanji details
function revealKanjiDetails(kanji) {
    const detailsContainer = document.getElementById('kanji-details');
    detailsContainer.innerHTML = `
        <p>${kanji.reading}</p>
        <p>${kanji.meaning}</p>
    `;
    detailsContainer.style.display = 'block';
}

function revealAnswer() {
    const kanjiInfo = document.getElementById('kanji-info');
    kanjiInfo.style.display = 'block';
}

// Refresh button to reshuffle and start the quiz again
document.getElementById('refresh-button').addEventListener('click', () => {
    shuffleArray(kanjiData);
    currentQuestionIndex = 0;
    totalAnsweredCorrectly = 0;
    correctAnswers = 0;
    incorrectQuestions = [];
    incorrectAttempts = {};
    kanjiData.forEach(data => data.answeredCorrectly = false);
    loadQuestion();
    updateRating();
    updateIncorrectBoard();
});

// Initialize the quiz
function startQuiz() {
    shuffleArray(kanjiData);
    currentQuestionIndex = 0;
    totalAnsweredCorrectly = 0;
    correctAnswers = 0;
    incorrectQuestions = [];
    incorrectAttempts = {};
    kanjiData.forEach(data => data.answeredCorrectly = false);
    loadQuestion();
    updateDataDisplay();
    updateRating();
    updateIncorrectBoard();
}

startQuiz();

// Toggle the visibility of the spoiler
function toggleSpoiler() {
    const spoiler = document.querySelector('.spoiler');


    if (spoiler.style.display === "none" || spoiler.style.display === "") {
        spoiler.style.display = "block";
        setTimeout(() => {
            spoiler.classList.add("open");
        }, 10);
    } else {
        spoiler.classList.remove("open");
        setTimeout(() => {
            spoiler.style.display = "none";
        }, 500);
    }

}

// Function to toggle visibility of To-Learn List with a smooth effect
function toggleToLearnList() {
    const content = document.querySelector('.to-learn-list-content');
    if (content.style.display === "none" || content.style.display === "") {
        content.style.display = "block";
        setTimeout(() => {
            content.classList.add("open");
        }, 10);
    } else {
        content.classList.remove("open");
        setTimeout(() => {
            content.style.display = "none";
        }, 500);
    }
}

function copyToClipboard(button) {
    // Ensure the next sibling is the container with <p> tags
    const dayContent = button.nextElementSibling;

    // Check if the next sibling exists and contains the <p> elements
    if (dayContent && dayContent.classList.contains('kanji-container')) {
        // Create a temporary text area to copy the content
        const textArea = document.createElement('textarea');
        textArea.value = Array.from(dayContent.getElementsByTagName('p'))
                              .map(p => p.innerText)  // Get the text inside each <p> element
                              .join("\n");            // Join them with line breaks

        document.body.appendChild(textArea);

        // Select the text and copy it to the clipboard
        textArea.select();
        document.execCommand('copy');

        // Remove the temporary text area after copying
        document.body.removeChild(textArea);

        // Optional: Provide feedback to the user
        button.innerText = 'copied!';
        setTimeout(() => {
            button.innerText = 'copy all';
        }, 1500); // Reset button text after 1.5 seconds
    } else {
        console.error('kanji container not found or incorrect structure');
    }
}

function handleLogin(event) {
    event.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    let users = JSON.parse(localStorage.getItem('users')) || {};
    
    if (users[username]) {
        if (users[username].password === password) {
            showQuizContainer(username);
        } else {
            alert('incorrect password!');
        }
    } else {
        users[username] = { password: password, results: [] };
        localStorage.setItem('users', JSON.stringify(users));
        alert('new user registered and logged in!');
        showQuizContainer(username);
    }
}

function showQuizContainer(username) {
    document.getElementById('login-container').style.display = 'none';
    document.getElementById('quiz-container').style.display = 'block';
    document.getElementById('welcome-user').innerText = username;
    loadUserResults(username);
}

function loadUserResults(username) {
    const users = JSON.parse(localStorage.getItem('users'));
    const resultsContainer = document.getElementById('results-container');
    resultsContainer.innerHTML = '';
    
    if (users[username].results.length > 0) {
        users[username].results.forEach(result => {
            const resultItem = document.createElement('p');
            resultItem.textContent = `past quiz result: ${result}`;
            resultsContainer.appendChild(resultItem);
        });
    } else {
        resultsContainer.textContent = 'no quiz results yet.';
    }
}

function logout() {
    document.getElementById('quiz-container').style.display = 'none';
    document.getElementById('login-container').style.display = 'block';
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
}

function saveQuizResult(username, result) {
    const users = JSON.parse(localStorage.getItem('users'));
    users[username].results.push(result);
    localStorage.setItem('users', JSON.stringify(users));
    loadUserResults(username);
}
