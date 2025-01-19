let currentQuestionIndex = 0;
let kanjiData = [];  // Initialize kanjiData as an empty array

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

    nextButton.disabled = true; // Disable next button until an answer is selected
    choicesElement.innerHTML = ''; // Clear previous choices

    const currentKanji = kanjiData[currentQuestionIndex];

    // Randomly select whether to ask for the meaning or the reading
    const isMeaningQuestion = Math.random() < 0.5;

    if (isMeaningQuestion) {
        questionElement.innerText = `${currentKanji.kanji}?`;
        // Generate choices for the meaning question
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
        // Generate choices for the reading question
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
    nextButton.disabled = false; // Enable next button after an answer is selected

    document.querySelectorAll('.choice').forEach(choice => {
        choice.classList.remove('correct', 'wrong');
        if (choice.innerText === correct) {
            choice.classList.add('correct');
        } else if (choice.innerText === selected) {
            choice.classList.add('wrong');
        }
    });
}

// Update Kanji data based on pasted input
document.getElementById('update-button').addEventListener('click', () => {
    const bulkInput = document.getElementById('bulk-input').value.trim();
    const lines = bulkInput.split('\n');

    if (lines.length === 0 || !bulkInput) {
        alert("Please paste valid data in the input field.");
        return;
    }

    kanjiData = [];  // Clear the current data before updating

    lines.forEach(line => {
        const parts = line.split(',').map(part => part.trim());
        if (parts.length >= 3) {
            const kanji = parts[0];
            const reading = parts[1];
            const meaning = parts.slice(2).join(', ');  // Join the meaning parts
            kanjiData.push({ kanji: kanji, reading: reading, meaning: meaning });
        }
    });

    document.getElementById('bulk-input').value = '';  // Clear the input field after update
    updateDataDisplay(); // Update the data display with the new data
});

// Update the data display section inside the spoiler
function updateDataDisplay() {
    const kanjiListElement = document.getElementById('kanji-list');
    let kanjiText = '';

    kanjiData.forEach(data => {
        kanjiText += `${data.kanji}, ${data.reading}, ${data.meaning}\n`;
    });

    kanjiListElement.value = kanjiText; // Display the data in the text area (for copying)
}

// Next button click event
document.getElementById('next-button').addEventListener('click', () => {
    currentQuestionIndex = (currentQuestionIndex + 1) % kanjiData.length;
    loadQuestion();
});

// Refresh button to reshuffle and start the quiz again
document.getElementById('refresh-button').addEventListener('click', () => {
    shuffleArray(kanjiData);
    currentQuestionIndex = 0;
    loadQuestion();
});

// Initialize the quiz
function startQuiz() {
    shuffleArray(kanjiData);
    currentQuestionIndex = 0;
    loadQuestion();
    updateDataDisplay(); // Show the initial data
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
            content.classList.add("open"); // Add class to trigger transition
        }, 10); // Delay to allow style changes
    } else {
        content.classList.remove("open"); // Remove class to trigger transition
        setTimeout(() => {
            content.style.display = "none"; // Hide after transition completes
        }, 500); // Match the transition time
    }
}

// Function to copy the content of the day to the clipboard in the quiz data format
function copyToClipboard(button) {
    // Find the parent div containing the kanji data (all the <p> elements)
    const dayContent = button.previousElementSibling;

    // Get all text content from the <p> tags inside the day
    const contentToCopy = Array.from(dayContent.getElementsByTagName('p'))
                               .map(p => p.innerText)  // Get the text inside each <p> element
                               .join("\n");           // Join them with line breaks

    // Format the copied content to match the quiz data format (no extra spaces)
    const formattedContent = contentToCopy.replace(/、/g, ',');  // Replace full stops with commas

    // Use the clipboard API to copy the content
    navigator.clipboard.writeText(formattedContent)
        .then(() => {
            // Optional: Provide feedback to the user
            button.innerText = 'Copied!';
            setTimeout(() => {
                button.innerText = 'Copy';
            }, 1500); // Reset button text after 1.5 seconds
        })
        .catch(err => {
            console.error('Error copying to clipboard: ', err);
            alert('Failed to copy the content. Please try again.');
        });
}
