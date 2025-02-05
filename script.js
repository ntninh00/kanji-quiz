document.addEventListener('DOMContentLoaded', () => {
    const setSelect = document.getElementById('set-select');
    const questionElement = document.getElementById('question');
    const optionsElement = document.getElementById('options');
    const nextButton = document.getElementById('next-btn');
    const accuracyElement = document.getElementById('accuracy');

    let quizData = {}; // Store quiz sets globally
    let currentSet = [];
    let currentQuestionIndex = 0;
    let correctAnswers = 0;
    let totalQuestions = 0;

    // Load JSON data
    fetch('questions.json')
        .then(response => response.json())
        .then(data => {
            quizData = data;
            populateSetSelect();
            loadSet(Object.keys(quizData)[0]); // Load first set
        })
        .catch(error => console.error("Failed to load JSON:", error));

        function populateSetSelect() {
            setSelect.innerHTML = ""; // Clear existing options
            for (const set in quizData) {
                const option = document.createElement('option');
                option.value = set;
                option.textContent = set;
                setSelect.appendChild(option);
            }
        
            setSelect.addEventListener('change', (e) => {
                const selectedSet = e.target.value;
                if (quizData[selectedSet]) {
                    loadSet(selectedSet);
                } else {
                    console.error(`Set "${selectedSet}" does not exist.`);
                }
            });
        }
        

    function loadSet(setName) {
        console.log(`Loading set: ${setName}`, quizData[setName]); // Debugging
    
        if (!quizData[setName]) {
            console.error(`Error: Set "${setName}" not found in quizData.`);
            return;
        }
        
        if (!Array.isArray(quizData[setName])) {
            console.error(`Invalid question format:`, quizData[setName]);
            return;
        }
    
        currentSet = shuffleArray(quizData[setName]); // Use as an array
        currentQuestionIndex = 0;
        correctAnswers = 0;
        totalQuestions = currentSet.length;
        displayQuestion();
        nextButton.style.display = 'none';
    }
    

    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    function displayQuestion() {
        const question = currentSet[currentQuestionIndex];
        
        // Ensure the question object has the required properties
        if (!question || !question.question || !Array.isArray(question.options)) {
            console.error("Invalid question format:", question);
            return;
        }

        questionElement.textContent = question.question;

        optionsElement.innerHTML = '';
        const shuffledOptions = shuffleArray([...question.options]);

        const optionNumbers = ['1', '2', '3', '4'];
        shuffledOptions.forEach((option, index) => {
            const button = document.createElement('button');
            button.className = 'option-button';
            button.innerHTML = `
                <span class="option-number">${optionNumbers[index]}</span>
                <span class="option-text">${option}</span>
            `;
            button.addEventListener('click', () => checkAnswer(option, question.options[0])); // First option is the correct answer
            optionsElement.appendChild(button);
        });
    }

    function checkAnswer(selectedOption, correctOption) {
        const buttons = document.querySelectorAll('.option-button');
        buttons.forEach(button => {
            button.disabled = true; // Disable all buttons after selection
            const optionText = button.querySelector('.option-text').textContent;
            if (optionText === correctOption) {
                button.style.backgroundColor = 'var(--correct-color)';
            } else if (optionText === selectedOption && selectedOption !== correctOption) {
                button.style.backgroundColor = 'var(--incorrect-color)';
            }
        });

        if (selectedOption === correctOption) {
            correctAnswers++;
        }
        updateAccuracy();
        nextButton.style.display = 'block';
    }

    function updateAccuracy() {
        const accuracy = (correctAnswers / totalQuestions) * 100;
        accuracyElement.textContent = `${accuracy.toFixed(2)}%`;
    }

    nextButton.addEventListener('click', () => {
        currentQuestionIndex++;
        if (currentQuestionIndex < currentSet.length) {
            displayQuestion();
            nextButton.style.display = 'none';
        } else {
            alert('Quiz finished!');
        }
    });
});
