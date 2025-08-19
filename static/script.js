document.addEventListener('DOMContentLoaded', () => {
    // --- Main App Initializers ---
    const initializeApp = () => {
        // Show the main container after splash screen
        mainContainer.classList.add('visible');
        setTimeout(() => mainContainer.classList.add('loaded'), 500);

        // Initialize interactive elements
        initializeCursor();
        initializeButtonHoverEffect();
    };

    // --- Element Selectors ---
    const mainContainer = document.getElementById('main-container');
    const textInput = document.getElementById('text-input');
    const analyzeBtn = document.getElementById('analyze-btn');
    const resultContainer = document.getElementById('result-container');
    const resultsDiv = document.getElementById('results');
    const shamingContainer = document.getElementById('shaming-container');
    const shamingLine = document.getElementById('shaming-line');
    const beatenUpProbEl = document.getElementById('beaten-up-prob');
    const cancelledProbEl = document.getElementById('cancelled-prob');
    const micBtn = document.getElementById('mic-btn');
    const loadingOverlay = document.getElementById('loading-overlay');
    const shareBtn = document.getElementById('share-btn');
    const historyList = document.getElementById('history-list');
    const clearHistoryBtn = document.getElementById('clear-history-btn');

    // --- State Variables ---
    let currentAnalysisData = null;

    // --- Initial Setup ---
    const setInitialState = () => {
        resultsDiv.innerHTML = '<div class="initial-placeholder"><p>Your analysis will appear here.</p></div>';
        loadHistory();
    };

    // --- REMOVED: Start Screen Logic ---

    // --- ADDED: Splash Screen, Particles, Cursor, Hovers ---
    const initializeParticleCanvas = () => {
        const canvas = document.getElementById('particle-canvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        let particles = [];
        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();
        const particleCount = Math.floor((canvas.width * canvas.height) / 20000);
        class Particle {
            constructor() { this.x = Math.random() * canvas.width; this.y = Math.random() * canvas.height; this.size = Math.random() * 2 + 1; this.speedX = Math.random() * 1 - 0.5; this.speedY = Math.random() * 1 - 0.5; }
            update() { this.x += this.speedX; this.y += this.speedY; if (this.x > canvas.width) this.x = 0; else if (this.x < 0) this.x = canvas.width; if (this.y > canvas.height) this.y = 0; else if (this.y < 0) this.y = canvas.height; }
            draw() { ctx.fillStyle = 'rgba(79, 70, 229, 0.5)'; ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2); ctx.fill(); }
        }
        const initParticles = () => { particles = []; for (let i = 0; i < particleCount; i++) { particles.push(new Particle()); } };
        initParticles();
        const animateParticles = () => { ctx.clearRect(0, 0, canvas.width, canvas.height); for (const p of particles) { p.update(); p.draw(); } requestAnimationFrame(animateParticles); };
        animateParticles();
    };

    const initializeSplashScreen = () => {
        const splashScreen = document.getElementById('splash-screen');
        const codeLoader = document.getElementById('code-loader');
        const wipeElement = document.getElementById('wipe-transition');
        if (!splashScreen || !codeLoader || !wipeElement) { if(splashScreen) splashScreen.style.display = 'none'; initializeApp(); return; }
        const initialText = "not10gamer"; const finalText = "Ethan Peter"; const chars = "ABCDEFGHIJKLMONPQRSTUVWXYZ1234567890*<>"; const revealSpeed = 150; const scrambleSpeed = 75; const wipeDuration = 1200; const postWipePause = 1500;
        let scrambleInterval, revealInterval; let step = 0;
        const scramble = (targetText) => { let revealedText = ""; for (let i = 0; i < targetText.length; i++) { if (i < step) revealedText += targetText[i]; else revealedText += chars[Math.floor(Math.random() * chars.length)]; } codeLoader.textContent = revealedText; };
        const startFirstReveal = () => {
            revealInterval = setInterval(() => { if (step < initialText.length) { step++; } else { clearInterval(revealInterval); clearInterval(scrambleInterval); codeLoader.textContent = initialText; setTimeout(startWipeTransition, 800); } }, revealSpeed);
            scrambleInterval = setInterval(() => scramble(initialText), scrambleSpeed);
        };
        const startWipeTransition = () => { codeLoader.classList.add('is-blurring-out'); setTimeout(() => { codeLoader.textContent = finalText; codeLoader.classList.remove('is-blurring-out'); }, wipeDuration / 2); wipeElement.classList.add('animate'); setTimeout(fadeOutSplash, wipeDuration + postWipePause); };
        const fadeOutSplash = () => { splashScreen.style.opacity = '0'; splashScreen.addEventListener('transitionend', (e) => { if (e.target === splashScreen) { splashScreen.style.display = 'none'; initializeApp(); } }, { once: true }); };
        startFirstReveal();
    };

    const initializeCursor = () => {
        const cursorDot = document.querySelector('.cursor-dot'); const cursorAura = document.querySelector('.cursor-aura'); if (!cursorDot || !cursorAura) return;
        window.addEventListener('mousemove', e => { const { clientX, clientY } = e; cursorDot.style.left = `${clientX}px`; cursorDot.style.top = `${clientY}px`; cursorAura.style.left = `${clientX}px`; cursorAura.style.top = `${clientY}px`; });
        const interactiveElements = document.querySelectorAll('a, button, .text-input');
        interactiveElements.forEach(el => { el.addEventListener('mouseenter', () => { cursorDot.classList.add('hovered'); cursorAura.classList.add('hovered'); }); el.addEventListener('mouseleave', () => { cursorDot.classList.remove('hovered'); cursorAura.classList.remove('hovered'); }); });
    };

    const initializeButtonHoverEffect = () => {
        const buttons = document.querySelectorAll('.analyze-btn, .share-btn, .clear-history-btn, .view-summary-btn, .mic-btn');
        buttons.forEach(button => { button.addEventListener('mousemove', e => { const rect = button.getBoundingClientRect(); const x = e.clientX - rect.left; const y = e.clientY - rect.top; button.style.setProperty('--x', `${x}px`); button.style.setProperty('--y', `${y}px`); }); });
    };

    // --- Voice Input (Web Speech API) ---
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    let recognition;
    if (SpeechRecognition) {
        recognition = new SpeechRecognition();
        recognition.continuous = true; recognition.interimResults = true; recognition.lang = 'en-US';
        recognition.onstart = () => { micBtn.classList.add('recording'); micBtn.title = 'Stop Recording'; textInput.placeholder = 'Listening...'; };
        recognition.onend = () => { micBtn.classList.remove('recording'); micBtn.title = 'Use Voice Input'; textInput.placeholder = 'Enter text or use the microphone...'; };
        recognition.onerror = (event) => { console.error('Speech recognition error:', event.error); if (event.error === 'not-allowed') { alert('Microphone access was denied. Please allow microphone access in your browser settings.'); } };
        recognition.onresult = (event) => { let finalTranscript = ''; for (let i = event.resultIndex; i < event.results.length; ++i) { if (event.results[i].isFinal) finalTranscript += event.results[i][0].transcript; } textInput.value += finalTranscript; };
        micBtn.addEventListener('click', () => { if (micBtn.classList.contains('recording')) recognition.stop(); else recognition.start(); });
    } else { console.warn('Speech Recognition not supported in this browser.'); micBtn.disabled = true; micBtn.title = 'Voice input not supported'; }

    // --- Main Analysis Logic ---
    analyzeBtn.addEventListener('click', async () => {
        const text = textInput.value.trim(); if (!text) return;
        resetUIForAnalysis(); mainContainer.classList.add('loading'); loadingOverlay.classList.add('visible');
        try {
            const response = await fetch('/analyze', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text }), });
            const data = await response.json(); if (!response.ok) throw new Error(data.error || 'Analysis failed');
            currentAnalysisData = data; saveToHistory(text, data); displayShamingAndConsequences(data); displayResults(data); resultContainer.classList.add('visible'); shareBtn.classList.add('visible');
        } catch (error) { console.error('Error:', error); displayError(error.message); } finally { mainContainer.classList.remove('loading'); loadingOverlay.classList.remove('visible'); }
    });

    // --- UI Display Functions ---
    const resetUIForAnalysis = () => {
        resultContainer.classList.remove('visible'); shamingContainer.classList.remove('visible'); shareBtn.classList.remove('visible', 'success'); shareBtn.querySelector('span').textContent = 'Share Results'; resultsDiv.innerHTML = ''; shamingLine.textContent = ''; currentAnalysisData = null;
    };
    const displayResults = (data) => {
        resultsDiv.innerHTML = ''; const categories = ['racism', 'sexism', 'homophobia', 'religious_blasphemy', 'parental_disapproval', ...data.other_minorities?.map(m => m.group) || []];
        categories.forEach((category, index) => { const categoryData = data[category] || data.other_minorities.find(m => m.group === category); if (categoryData) { const resultElement = createCategoryResult(category, categoryData); resultElement.style.animationDelay = `${index * 100}ms`; resultsDiv.appendChild(resultElement); } });
    };
    const createCategoryResult = (title, data) => {
        const resultElement = document.createElement('div'); resultElement.classList.add('category-result'); const categoryTitle = title.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        resultElement.innerHTML = `<div class="category-header"><h3 class="category-title">${categoryTitle}</h3><button class="reason-btn" aria-expanded="false"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg></button></div><div class="score-section"><div class="score-display"><span class="score-label">AI Score</span><div class="score-container"><div class="score-bar" style="width: ${data.ai_score}%;"></div></div><span class="score-percentage">${data.ai_score}%</span></div><div class="score-display"><span class="score-label">Potential</span><div class="score-container"><div class="score-bar" style="width: ${data.potential_score}%;"></div></div><span class="score-percentage">${data.potential_score}%</span></div></div><p class="reason-text">${data.reason}</p>`;
        const reasonBtn = resultElement.querySelector('.reason-btn'); const reasonText = resultElement.querySelector('.reason-text');
        reasonBtn.addEventListener('click', () => { const isExpanded = reasonBtn.getAttribute('aria-expanded') === 'true'; reasonBtn.setAttribute('aria-expanded', !isExpanded); reasonBtn.classList.toggle('expanded'); reasonText.classList.toggle('visible'); });
        return resultElement;
    };
    const displayShamingAndConsequences = (data) => { if (data.shaming_line) { shamingLine.textContent = data.shaming_line; shamingContainer.classList.add('visible'); } if (data.hasOwnProperty('probability_beaten_up') && data.hasOwnProperty('probability_cancelled')) { beatenUpProbEl.textContent = `${data.probability_beaten_up}%`; cancelledProbEl.textContent = `${data.probability_cancelled}%`; } };
    const displayError = (errorMessage) => { resultsDiv.innerHTML = `<div class="error-message-box"><p><strong>Analysis Failed</strong></p><p>${errorMessage}</p></div>`; resultContainer.classList.add('visible'); shamingContainer.classList.remove('visible'); };

    // --- Share Functionality ---
    shareBtn.addEventListener('click', () => { if (!currentAnalysisData) return; const { shaming_line, probability_beaten_up, probability_cancelled } = currentAnalysisData; const shareText = `My Offense Meter Results:\n\n"${shaming_line}"\n\n- Chance of being beaten up: ${probability_beaten_up}%\n- Chance of being cancelled: ${probability_cancelled}%\n\nAnalyze your own text at https://offensive-meter.onrender.com!`; navigator.clipboard.writeText(shareText).then(() => { shareBtn.classList.add('success'); shareBtn.querySelector('span').textContent = 'Copied!'; setTimeout(() => { shareBtn.classList.remove('success'); shareBtn.querySelector('span').textContent = 'Share Results'; }, 2000); }); });

    // --- History Functionality ---
    const getHistory = () => JSON.parse(localStorage.getItem('offenseHistory')) || [];
    const saveHistory = (history) => localStorage.setItem('offenseHistory', JSON.stringify(history));
    const saveToHistory = (text, data) => { let history = getHistory(); history.unshift({ text, data, date: new Date().toISOString() }); if (history.length > 10) history.pop(); saveHistory(history); loadHistory(); };
    const loadHistory = () => {
        historyList.innerHTML = ''; const history = getHistory(); if (history.length === 0) { historyList.innerHTML = '<p class="no-history">No past analyses found.</p>'; return; }
        history.forEach(item => {
            const historyItemContainer = document.createElement('div'); historyItemContainer.classList.add('history-item-container');
            const historyItem = document.createElement('div'); historyItem.classList.add('history-item'); historyItem.innerHTML = `<p class="history-text">${item.text}</p><button class="view-summary-btn">View Summary</button>`;
            const summaryContent = document.createElement('div'); summaryContent.classList.add('history-summary-content'); summaryContent.innerHTML = `<p class="summary-line"><strong>AI Summary:</strong> ${item.data.history_summary}</p><p class="summary-line"><strong>Reception Score:</strong> ${item.data.conversational_reception_score}/100</p>`;
            historyItemContainer.appendChild(historyItem); historyItemContainer.appendChild(summaryContent); historyList.appendChild(historyItemContainer);
            const summaryBtn = historyItem.querySelector('.view-summary-btn');
            summaryBtn.addEventListener('click', (e) => { e.stopPropagation(); summaryContent.classList.toggle('visible'); });
            historyItem.querySelector('.history-text').addEventListener('click', () => { textInput.value = item.text; resetUIForAnalysis(); currentAnalysisData = item.data; displayShamingAndConsequences(item.data); displayResults(item.data); resultContainer.classList.add('visible'); shareBtn.classList.add('visible'); });
        });
    };
    clearHistoryBtn.addEventListener('click', () => { localStorage.removeItem('offenseHistory'); loadHistory(); });

    // --- Start App ---
    initializeParticleCanvas();
    initializeSplashScreen();
    setInitialState();
});