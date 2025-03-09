document.addEventListener('DOMContentLoaded', () => {
    const setSelect = document.getElementById('set-select');
    const questionElement = document.getElementById('question');
    const optionsElement = document.getElementById('options');
    const nextButton = document.getElementById('next-btn');
    const accuracyElement = document.getElementById('accuracy');
    const redoButton = document.createElement('button');
    const progressButton = document.getElementById('progress-btn');
    const progressModal = document.createElement('div');
    const modalContent = document.createElement('div');
    const closeModal = document.createElement('span');

    let quizData = {};
    let currentSet = [];
    let currentQuestionIndex = 0;
    let correctAnswers = 0;
    let totalQuestions = 0;
    let wrongQuestions = [];
    let completedSets = loadProgress(); // Load saved progress or initialize new Map

    redoButton.textContent = '間違えた問題をやり直す';
    redoButton.className = 'redo-button';
    redoButton.style.display = 'none';
    document.body.appendChild(redoButton);

    progressModal.className = 'progress-modal';
    modalContent.className = 'modal-content';
    closeModal.className = 'close-modal';
    closeModal.textContent = '×';
    progressModal.appendChild(modalContent);
    modalContent.appendChild(closeModal);
    document.body.appendChild(progressModal);

    fetch('questions.json')
        .then(response => response.json())
        .then(data => {
            quizData = splitLargeSets(data);
            normalizeQuizData();
            populateSetSelect();
            loadSet(Object.keys(quizData)[0]);
        })
        .catch(error => console.error("Failed to load JSON:", error));

    function splitLargeSets(data) {
        const newData = {};
        const maxQuestionsPerSet = 20;
        for (const setName in data) {
            const questions = data[setName];
            if (questions.length <= maxQuestionsPerSet) {
                newData[setName] = questions;
            } else {
                const numSubSets = Math.ceil(questions.length / maxQuestionsPerSet);
                for (let i = 0; i < numSubSets; i++) {
                    const start = i * maxQuestionsPerSet;
                    const end = Math.min(start + maxQuestionsPerSet, questions.length);
                    newData[`${setName} ${i + 1}`] = questions.slice(start, end);
                }
            }
        }
        return newData;
    }

    function normalizeQuizData() {
        for (const setName in quizData) {
            quizData[setName] = quizData[setName].map((question, index) => ({
                ...question,
                id: question.id || `${setName}-q${index}`
            }));
        }
    }

    function populateSetSelect() {
        setSelect.innerHTML = "";
        for (const set in quizData) {
            const option = document.createElement('option');
            option.value = set;
            option.textContent = `${set}${completedSets.has(set) ? ' ✓' : ''}`;
            setSelect.appendChild(option);
        }

        setSelect.addEventListener('change', (e) => {
            loadSet(e.target.value);
        });
    }

    function loadSet(setName) {
        if (!quizData[setName]) {
            console.error(`Error: Set "${setName}" not found in quizData.`);
            return;
        }

        currentSet = shuffleArray([...quizData[setName]]);
        currentQuestionIndex = 0;
        correctAnswers = 0;
        totalQuestions = currentSet.length;
        wrongQuestions = [];
        displayQuestion();
        nextButton.style.display = 'none';
        redoButton.style.display = 'none';
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
        if (!question || !question.question || !Array.isArray(question.options)) {
            console.error("Invalid question format:", question);
            return;
        }

        questionElement.innerHTML = `
            <span class="question-id">${question.id}</span> 
            ${question.question}
        `;
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
            button.addEventListener('click', () => checkAnswer(option, question.options[0], question.id));
            optionsElement.appendChild(button);
        });
    }

    function checkAnswer(selectedOption, correctOption, questionId) {
        const buttons = document.querySelectorAll('.option-button');
        buttons.forEach(button => {
            button.disabled = true;
            const optionText = button.querySelector('.option-text').textContent;
            if (optionText === correctOption) {
                button.style.backgroundColor = 'var(--correct-color)';
            } else if (optionText === selectedOption && selectedOption !== correctOption) {
                button.style.backgroundColor = 'var(--incorrect-color)';
            }
        });

        if (selectedOption === correctOption) {
            correctAnswers++;
        } else {
            wrongQuestions.push(questionId);
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
            const accuracy = (correctAnswers / totalQuestions) * 100;
            completedSets.set(setSelect.value, accuracy);
            saveProgress(); // Save progress when set is completed
            populateSetSelect();
            alert('Set completed!');
            redoButton.style.display = wrongQuestions.length > 0 ? 'block' : 'none';
        }
    });

    redoButton.addEventListener('click', () => {
        currentSet = quizData[setSelect.value].filter(q => wrongQuestions.includes(q.id));
        currentQuestionIndex = 0;
        correctAnswers = 0;
        totalQuestions = currentSet.length;
        wrongQuestions = [];
        displayQuestion();
        nextButton.style.display = 'none';
        redoButton.style.display = 'none';
    });

    progressButton.addEventListener('click', () => {
        modalContent.innerHTML = `

            <div class="progress-summary">

                <button class="reset-progress">リセット</button>
            </div>
        `;
        modalContent.appendChild(closeModal);

        const completedList = document.createElement('div');
        completedList.className = 'set-list completed-sets';
        completedList.innerHTML = '<h3><span class="icon">✅</span> 完了済み</h3>';
        if (completedSets.size === 0) {
            completedList.innerHTML += '<p class="empty-text">何もないですね</p>';
        } else {
            completedSets.forEach((accuracy, set) => {
                completedList.innerHTML += `
                    <div class="set-item completed">
                        <span class="set-name">${set}</span>
                        <span class="set-accuracy">${accuracy.toFixed(2)}%</span>
                    </div>
                `;
            });
        }

        const remainingList = document.createElement('div');
        remainingList.className = 'set-list remaining-sets';
        remainingList.innerHTML = '<h3><span class="icon">⏳</span> 未完成</h3>';
        const remainingSets = Object.keys(quizData).filter(set => !completedSets.has(set));
        if (remainingSets.length === 0) {
            remainingList.innerHTML += '<p class="empty-text">全セット完了！</p>';
        } else {
            remainingSets.forEach(set => {
                remainingList.innerHTML += `
                    <div class="set-item remaining">
                        <span class="set-name">${set}</span>
                    </div>
                `;
            });
        }

        modalContent.appendChild(completedList);
        modalContent.appendChild(remainingList);
        progressModal.style.display = 'block';
        setTimeout(() => progressModal.classList.add('show'), 10);

        // Add event listener for reset button
        const resetButton = modalContent.querySelector('.reset-progress');
        resetButton.addEventListener('click', () => {
            if (confirm('Are you sure you want to reset all progress?')) {
                completedSets.clear();
                saveProgress();
                populateSetSelect();
                progressModal.classList.remove('show');
                setTimeout(() => progressModal.style.display = 'none', 300);
                alert('Progress reset!');
            }
        });
    });

    closeModal.addEventListener('click', () => {
        progressModal.classList.remove('show');
        setTimeout(() => progressModal.style.display = 'none', 300);
    });

    progressModal.addEventListener('click', (e) => {
        if (e.target === progressModal) {
            progressModal.classList.remove('show');
            setTimeout(() => progressModal.style.display = 'none', 300);
        }
    });

    function calculateTotalProgress() {
        const totalSets = Object.keys(quizData).length;
        const completedCount = completedSets.size;
        return totalSets > 0 ? (completedCount / totalSets) * 100 : 0;
    }

    // Save progress to localStorage
    function saveProgress() {
        const progressData = Array.from(completedSets.entries());
        localStorage.setItem('quizProgress', JSON.stringify(progressData));
    }

    // Load progress from localStorage
    function loadProgress() {
        const savedProgress = localStorage.getItem('quizProgress');
        if (savedProgress) {
            const progressArray = JSON.parse(savedProgress);
            return new Map(progressArray);
        }
        return new Map();
    }
});