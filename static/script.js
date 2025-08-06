document.addEventListener('DOMContentLoaded', () => {
    // --- Element Selectors ---
    const mainContainer = document.getElementById('main-container');
    const textInput = document.getElementById('text-input');
    const highlightedOutput = document.getElementById('highlighted-output');
    const editTextBtn = document.getElementById('edit-text-btn');
    const analyzeBtn = document.getElementById('analyze-btn');
    const resultContainer = document.getElementById('result-container');
    const resultsDiv = document.getElementById('results');
    const shamingContainer = document.getElementById('shaming-container');
    const shamingLine = document.getElementById('shaming-line');
    const beatenUpProbEl = document.getElementById('beaten-up-prob');
    const cancelledProbEl = document.getElementById('cancelled-prob');
    const startScreen = document.getElementById('start-screen');
    const startBtn = document.getElementById('start-btn');
    const micBtn = document.getElementById('mic-btn');
    const loadingOverlay = document.getElementById('loading-overlay');
    const shareBtn = document.getElementById('share-btn');
    const historyList = document.getElementById('history-list');
    const clearHistoryBtn = document.getElementById('clear-history-btn');
    const themeToggle = document.getElementById('theme-toggle');
    const offenseChartCanvas = document.getElementById('offense-chart');

    // --- State Variables ---
    let currentAnalysisData = null;
    let offenseChart = null;

    // --- Initial Setup ---
    const setInitialState = () => {
        resultsDiv.innerHTML = '<div class="initial-placeholder"><p>Your analysis will appear here.</p></div>';
        loadHistory();
        setupTheme();
        setupKeyboardShortcuts();
    };

    // --- Theme Switcher ---
    const setupTheme = () => {
        const savedTheme = localStorage.getItem('theme') || 'dark';
        if (savedTheme === 'light') {
            document.body.classList.add('light-mode');
            themeToggle.checked = true;
        }
        themeToggle.addEventListener('change', () => {
            if (themeToggle.checked) {
                document.body.classList.add('light-mode');
                localStorage.setItem('theme', 'light');
            } else {
                document.body.classList.remove('light-mode');
                localStorage.setItem('theme', 'dark');
            }
            // Re-render chart with new colors if it exists
            if (offenseChart) {
                drawRadarChart(currentAnalysisData);
            }
        });
    };

    // --- Keyboard Shortcut ---
    const setupKeyboardShortcuts = () => {
        document.addEventListener('keydown', (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                e.preventDefault();
                analyzeBtn.click();
            }
        });
    };

    // --- Start Screen ---
    startBtn.addEventListener('click', () => {
        startScreen.classList.add('hidden');

        startScreen.addEventListener('transitionend', () => {
            mainContainer.classList.add('visible');
            setTimeout(() => mainContainer.classList.add('loaded'), 50);
        }, { once: true });
    });

    // --- Voice Input ---
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        recognition.onstart = () => { micBtn.classList.add('recording'); micBtn.title = 'Stop Recording'; };
        recognition.onend = () => { micBtn.classList.remove('recording'); micBtn.title = 'Use Voice Input'; };
        recognition.onerror = (e) => { if (e.error === 'not-allowed') alert('Microphone access denied.'); };
        recognition.onresult = (e) => {
            let finalTranscript = '';
            for (let i = e.resultIndex; i < e.results.length; ++i) if (e.results[i].isFinal) finalTranscript += e.results[i][0].transcript;
            textInput.value += finalTranscript;
        };
        micBtn.addEventListener('click', () => {
            if (micBtn.classList.contains('recording')) recognition.stop();
            else recognition.start();
        });
    } else {
        micBtn.disabled = true;
        micBtn.title = 'Voice input not supported';
    }

    // --- Main Analysis Logic ---
    analyzeBtn.addEventListener('click', async () => {
        const text = textInput.value.trim();
        if (!text) return;

        resetUIForAnalysis();
        mainContainer.classList.add('loading');
        loadingOverlay.classList.add('visible');

        try {
            const response = await fetch('/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Analysis failed');

            currentAnalysisData = data;
            saveToHistory(text, data);
            displayShamingAndConsequences(data);
            displayResults(data);
            drawRadarChart(data);
            highlightProblematicText(text, data.problematic_words);

        } catch (error) {
            console.error('Error:', error);
            displayError(error.message);
        } finally {
            mainContainer.classList.remove('loading');
            loadingOverlay.classList.remove('visible');
        }
    });

    // --- UI Display & Reset ---
    const resetUIForAnalysis = () => {
        resultContainer.classList.remove('visible');
        shamingContainer.classList.remove('visible');
        shareBtn.classList.remove('visible', 'success');
        shareBtn.querySelector('span').textContent = 'Share Results';
        resultsDiv.innerHTML = '';
        shamingLine.textContent = '';
        currentAnalysisData = null;
        if (offenseChart) offenseChart.destroy();

        textInput.classList.remove('highlighted');
        textInput.disabled = false;
        highlightedOutput.innerHTML = '';
        editTextBtn.classList.remove('visible');
    };

    editTextBtn.addEventListener('click', () => {
        textInput.classList.remove('highlighted');
        textInput.disabled = false;
        highlightedOutput.innerHTML = '';
        editTextBtn.classList.remove('visible');
        textInput.focus();
    });

    const highlightProblematicText = (originalText, wordsToHighlight) => {
        if (!wordsToHighlight || wordsToHighlight.length === 0) {
            highlightedOutput.innerHTML = originalText.replace(/</g, "&lt;").replace(/>/g, "&gt;");
            textInput.classList.add('highlighted');
            textInput.disabled = true;
            editTextBtn.classList.add('visible');
            return;
        };

        const escapedWords = wordsToHighlight.map(word => word.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'));
        const regex = new RegExp(`(${escapedWords.join('|')})`, 'gi');

        const highlightedHTML = originalText
            .replace(/</g, "&lt;").replace(/>/g, "&gt;")
            .replace(regex, '<mark>$1</mark>');

        highlightedOutput.innerHTML = highlightedHTML;
        textInput.classList.add('highlighted');
        textInput.disabled = true;
        editTextBtn.classList.add('visible');
    };

    const displayResults = (data) => {
        resultsDiv.innerHTML = '';
        const categories = ['racism', 'sexism', 'homophobia', 'religious_blasphemy', 'parental_disapproval', ...data.other_minorities?.map(m => m.group) || []];

        categories.forEach((category, index) => {
            const categoryData = data[category] || data.other_minorities?.find(m => m.group === category);
            if (categoryData) {
                const resultElement = createCategoryResult(category, categoryData);
                resultElement.style.animationDelay = `${index * 100}ms`;
                resultsDiv.appendChild(resultElement);
            }
        });
        resultContainer.classList.add('visible');
    };

    const createCategoryResult = (title, data) => {
        const resultElement = document.createElement('div');
        resultElement.classList.add('category-result');
        const categoryTitle = title.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

        resultElement.innerHTML = `
            <div class="category-header">
                <h3 class="category-title">${categoryTitle}</h3>
                <button class="reason-btn" aria-expanded="false">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                </button>
            </div>
            <div class="score-section">
                <div class="score-display"><span class="score-label">AI Score</span><div class="score-container"><div class="score-bar" style="width: ${data.ai_score}%;"></div></div><span class="score-percentage">${data.ai_score}%</span></div>
                <div class="score-display"><span class="score-label">Potential</span><div class="score-container"><div class="score-bar" style="width: ${data.potential_score}%;"></div></div><span class="score-percentage">${data.potential_score}%</span></div>
            </div>
            <p class="reason-text">${data.reason}</p>
        `;

        const reasonBtn = resultElement.querySelector('.reason-btn');
        const reasonText = resultElement.querySelector('.reason-text');
        reasonBtn.addEventListener('click', () => {
            const isExpanded = reasonBtn.getAttribute('aria-expanded') === 'true';
            reasonBtn.setAttribute('aria-expanded', !isExpanded);
            reasonBtn.classList.toggle('expanded');
            reasonText.classList.toggle('visible');
            reasonBtn.querySelector('svg').style.transform = !isExpanded ? 'rotate(45deg)' : 'rotate(0deg)';
        });

        return resultElement;
    };

    const displayShamingAndConsequences = (data) => {
        if (data.shaming_line) {
            shamingLine.textContent = data.shaming_line;
            shamingContainer.classList.add('visible');
        }
        if (data.hasOwnProperty('probability_beaten_up') && data.hasOwnProperty('probability_cancelled')) {
            beatenUpProbEl.textContent = `${data.probability_beaten_up}%`;
            cancelledProbEl.textContent = `${data.probability_cancelled}%`;
        }
        shareBtn.classList.add('visible');
    };

    const displayError = (errorMessage) => {
        resultsDiv.innerHTML = `<div class="error-message-box"><p><strong>Analysis Failed</strong></p><p>${errorMessage}</p></div>`;
        resultContainer.classList.add('visible');
        shamingContainer.classList.remove('visible');
    };

    // --- Radar Chart ---
    const drawRadarChart = (data) => {
        if (offenseChart) offenseChart.destroy();

        const isLightTheme = document.body.classList.contains('light-mode');
        const gridColor = isLightTheme ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.1)';
        const labelColor = isLightTheme ? '#4B5563' : '#D1D5DB';

        const labels = ['Racism', 'Sexism', 'Homophobia', 'Blasphemy', 'Disapproval'];
        const chartData = [
            data.racism?.potential_score || 0,
            data.sexism?.potential_score || 0,
            data.homophobia?.potential_score || 0,
            data.religious_blasphemy?.potential_score || 0,
            data.parental_disapproval?.potential_score || 0
        ];

        offenseChart = new Chart(offenseChartCanvas, {
            type: 'radar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Potential Offense',
                    data: chartData,
                    backgroundColor: 'rgba(79, 70, 229, 0.2)',
                    borderColor: 'rgba(79, 70, 229, 1)',
                    borderWidth: 2,
                    pointBackgroundColor: 'rgba(79, 70, 229, 1)',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: 'rgba(79, 70, 229, 1)'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: { legend: { display: false } },
                scales: {
                    r: {
                        angleLines: { color: gridColor },
                        grid: { color: gridColor },
                        pointLabels: { color: labelColor, font: { size: 12 } },
                        ticks: { display: false, maxTicksLimit: 5, backdropColor: 'transparent' },
                        min: 0,
                        max: 100
                    }
                }
            }
        });
    };

    // --- Share & History ---
    shareBtn.addEventListener('click', () => {
        if (!currentAnalysisData) return;
        const { shaming_line } = currentAnalysisData;
        const shareText = `My Offense Meter says: "${shaming_line}"\n\nFind out your score at https://offensive-meter.onrender.com!`;
        navigator.clipboard.writeText(shareText).then(() => {
            shareBtn.classList.add('success');
            shareBtn.querySelector('span').textContent = 'Copied!';
            setTimeout(() => {
                shareBtn.classList.remove('success');
                shareBtn.querySelector('span').textContent = 'Share Results';
            }, 2000);
        });
    });

    const getHistory = () => JSON.parse(localStorage.getItem('offenseHistory')) || [];
    const saveHistory = (history) => localStorage.setItem('offenseHistory', JSON.stringify(history));
    const saveToHistory = (text, data) => {
        let history = getHistory();
        history.unshift({ text, data, date: new Date().toISOString() });
        if (history.length > 10) history.pop();
        saveHistory(history);
        loadHistory();
    };

    const loadHistory = () => {
        historyList.innerHTML = '';
        const history = getHistory();
        if (history.length === 0) {
            historyList.innerHTML = '<p class="no-history">No past analyses found.</p>';
            return;
        }
        history.forEach(item => {
            const container = document.createElement('div');
            container.className = 'history-item-container';
            container.innerHTML = `
                <div class="history-item">
                    <p class="history-text">${item.text}</p>
                    <button class="view-summary-btn">View Summary</button>
                </div>
                <div class="history-summary-content">
                    <p class="summary-line"><strong>AI Summary:</strong> ${item.data.history_summary}</p>
                    <p class="summary-line"><strong>Reception Score:</strong> ${item.data.conversational_reception_score}/100</p>
                </div>
            `;
            historyList.appendChild(container);

            container.querySelector('.view-summary-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                container.querySelector('.history-summary-content').classList.toggle('visible');
            });

            container.querySelector('.history-text').addEventListener('click', () => {
                textInput.value = item.text;
                analyzeBtn.click();
            });
        });
    };

    clearHistoryBtn.addEventListener('click', () => {
        localStorage.removeItem('offenseHistory');
        loadHistory();
    });

    // --- Initialize App ---
    setInitialState();
});
