document.addEventListener('DOMContentLoaded', () => {
    // Main elements
    const mainContainer = document.getElementById('main-container');
    const textInput = document.getElementById('text-input');
    const analyzeBtn = document.getElementById('analyze-btn');
    const resultContainer = document.getElementById('result-container');
    const resultsDiv = document.getElementById('results');
    const shamingContainer = document.getElementById('shaming-container');
    const shamingLine = document.getElementById('shaming-line');
    const beatenUpProbEl = document.getElementById('beaten-up-prob');
    const cancelledProbEl = document.getElementById('cancelled-prob');

    // Start screen elements
    const startScreen = document.getElementById('start-screen');
    const startBtn = document.getElementById('start-btn');

    // Voice input elements
    const micBtn = document.getElementById('mic-btn');

    // Loading overlay
    const loadingOverlay = document.getElementById('loading-overlay');

    // --- Start Screen Logic ---
    startBtn.addEventListener('click', () => {
        startScreen.classList.add('hidden');
        mainContainer.classList.add('visible');
        setTimeout(() => {
            mainContainer.classList.add('loaded');
        }, 500);
    });

    // --- Voice Input (Web Speech API) ---
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    let recognition;
    let isRecording = false;

    if (SpeechRecognition) {
        recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
            isRecording = true;
            micBtn.classList.add('recording');
            micBtn.title = 'Stop Recording';
            textInput.placeholder = 'Listening...';
        };

        recognition.onend = () => {
            isRecording = false;
            micBtn.classList.remove('recording');
            micBtn.title = 'Use Voice Input';
            textInput.placeholder = 'Enter text or use the microphone...';
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            if (event.error === 'not-allowed') {
                alert('Microphone access was denied. Please allow microphone access in your browser settings.');
            }
        };

        recognition.onresult = (event) => {
            let finalTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                }
            }
            textInput.value += finalTranscript;
        };

        micBtn.addEventListener('click', () => {
            if (isRecording) {
                recognition.stop();
            } else {
                recognition.start();
            }
        });

    } else {
        console.warn('Speech Recognition not supported in this browser.');
        micBtn.disabled = true;
        micBtn.title = 'Voice input not supported in your browser';
    }


    // --- Analyzer Logic ---
    analyzeBtn.addEventListener('click', async () => {
        const text = textInput.value.trim();
        if (!text) return;

        // --- Reset UI from previous analysis ---
        resultContainer.classList.remove('visible');
        shamingContainer.classList.remove('visible');
        resultsDiv.innerHTML = '';
        shamingLine.textContent = '';

        // --- Start Loading State ---
        mainContainer.classList.add('loading');
        loadingOverlay.classList.add('visible');

        try {
            const response = await fetch('/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text }),
            });

            const data = await response.json();

            if (response.ok) {
                // Display all results at once
                displayShamingAndConsequences(data);
                displayResults(data);
                resultContainer.classList.add('visible');
            } else {
                throw new Error(data.error || 'Analysis failed');
            }
        } catch (error) {
            console.error('Error:', error);
            displayError(error.message);
        } finally {
            // --- End Loading State ---
            mainContainer.classList.remove('loading');
            loadingOverlay.classList.remove('visible');
        }
    });

    function displayResults(data) {
        resultsDiv.innerHTML = ''; // Clear any previous results or loading indicators
        const fixedCategories = ['racism', 'sexism', 'homophobia', 'religious_blasphemy', 'parental_disapproval'];
        fixedCategories.forEach(category => {
            if (data[category]) {
                createCategoryResult(category, data[category]);
            }
        });

        if (data.other_minorities && data.other_minorities.length > 0) {
            data.other_minorities.forEach(minorityData => {
                createCategoryResult(minorityData.group, minorityData, true);
            });
        }
    }

    function createCategoryResult(title, data) {
        const resultElement = document.createElement('div');
        resultElement.classList.add('category-result');
        const categoryTitle = title.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

        resultElement.innerHTML = `
            <div class="category-header">
                <h3 class="category-title">${categoryTitle}</h3>
                <button class="reason-btn">?</button>
            </div>
            <div class="score-section">
                <div class="score-display">
                    <span class="score-label">AI Score</span>
                    <div class="score-container">
                        <div class="score-bar" style="width: 0%;"></div>
                    </div>
                    <span class="score-percentage">${data.ai_score}%</span>
                </div>
                <div class="score-display">
                    <span class="score-label">Potential</span>
                    <div class="score-container">
                        <div class="score-bar" style="width: 0%;"></div>
                    </div>
                    <span class="score-percentage">${data.potential_score}%</span>
                </div>
            </div>
            <p class="reason-text">${data.reason}</p>
        `;
        resultsDiv.appendChild(resultElement);

        setTimeout(() => {
            const scoreBars = resultElement.querySelectorAll('.score-bar');
            scoreBars[0].style.width = `${data.ai_score}%`;
            scoreBars[1].style.width = `${data.potential_score}%`;
        }, 100);

        const reasonBtn = resultElement.querySelector('.reason-btn');
        const reasonText = resultElement.querySelector('.reason-text');
        reasonBtn.addEventListener('click', () => {
            reasonText.classList.toggle('visible');
        });
    }

    function displayShamingAndConsequences(data) {
        // Update shaming line
        if(data.shaming_line) {
            shamingLine.style.color = 'var(--accent-color)';
            shamingLine.textContent = data.shaming_line;
            shamingContainer.classList.add('visible');
        } else {
            shamingContainer.classList.remove('visible');
        }

        // Update consequences
        if (data.hasOwnProperty('probability_beaten_up') && data.hasOwnProperty('probability_cancelled')) {
            beatenUpProbEl.textContent = `${data.probability_beaten_up}%`;
            cancelledProbEl.textContent = `${data.probability_cancelled}%`;
        }
    }

    function displayError(errorMessage) {
        // Display error in the shaming container for consistency
        shamingLine.textContent = `Error: ${errorMessage}`;
        shamingLine.style.color = 'var(--error-color)';
        shamingContainer.classList.add('visible');
        resultContainer.classList.remove('visible');
    }
});
