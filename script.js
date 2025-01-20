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
        questionElement.innerText = `${currentKanji.kanji}?`;
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
        questionElement.innerText = `${currentKanji.kanji}?`;
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

    if (percentage < 50) {
        document.querySelector('.rating-container').classList.add('low-score');
    } else {
        document.querySelector('.rating-container').classList.remove('low-score');
    }

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
        alert("Please paste valid data in the input field.");
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
    spoiler.style.display = (spoiler.style.display === 'block') ? 'none' : 'block';
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

// Function to copy the content of the day to the clipboard in the quiz data format
function copyToClipboard(button) {
    // Find the parent div containing the kanji data (all the <p> elements)
    const dayContent = button.previousElementSibling;

    // Create a temporary text area to copy the content
    const textArea = document.createElement('textarea');
    
    // Get all text content from the <p> tags inside the day
    textArea.value = Array.from(dayContent.getElementsByTagName('p'))
                          .map(p => p.innerText)  // Get the text inside each <p> element
                          .join("\n");           // Join them with line breaks

    // Format the copied content to match the quiz data format (no extra spaces)
    textArea.value = textArea.value.replace(/、/g, ',');  // Replace full stops with commas

    document.body.appendChild(textArea);

    // Select the text and copy it to the clipboard
    textArea.select();
    document.execCommand('copy');

    // Remove the temporary text area after copying
    document.body.removeChild(textArea);

    // Optional: Provide feedback to the user
    button.innerText = 'Copied!';
    setTimeout(() => {
        button.innerText = 'Copy';
    }, 1500); // Reset button text after 1.5 seconds
}
