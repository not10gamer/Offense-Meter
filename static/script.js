'use strict';

document.addEventListener('DOMContentLoaded', () => {
    // --- Global Error Handler ---
    window.addEventListener('error', function(e) {
        console.warn('JavaScript error caught:', e.message, 'at', e.filename, ':', e.lineno);
        return true;
    });

    // --- Main App Initializers ---
    const initializeApp = () => {
        const mainContainer = document.getElementById('main-container');
        if (mainContainer) {
            mainContainer.classList.add('visible');
            setTimeout(() => mainContainer.classList.add('loaded'), 500);
        }
        initializeInteractiveEffects();
        initializeRippleEffect();
        setInitialState();
    };

    // --- Element Selectors ---
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
    const mainContainer = document.getElementById('main-container');

    // --- State Variables ---
    let currentAnalysisData = null;

    // --- Initial Setup ---
    const setInitialState = () => {
        if (resultsDiv) {
            resultsDiv.innerHTML = '<div class="initial-placeholder"><p>Your analysis will appear here.</p></div>';
        }
        loadHistory();
    };

    // --- ADDED: Procedural Background from example.html ---
    function initializeProceduralBackground() {
        const canvas = document.getElementById('procedural-background');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        let blobs = [];
        const blobCount = 5;

        const setCanvasDimensions = () => {
            canvas.width = window.innerWidth;
            // Make it cover the full scroll height
            canvas.height = document.body.scrollHeight;
        };

        // Recalculate on resize and also on content changes that might affect scrollHeight
        window.addEventListener('resize', setCanvasDimensions);
        new MutationObserver(setCanvasDimensions).observe(document.body, { childList: true, subtree: true });


        class Blob {
            constructor() {
                this.x = Math.random() * canvas.width;
                this.y = Math.random() * canvas.height;
                this.radius = Math.random() * 400 + 400; // smaller blobs
                this.vx = (Math.random() - 0.5) * 1.5;
                this.vy = (Math.random() - 0.5) * 1.5;
                this.maxLife = Math.random() * 800 + 1000;
                this.life = this.maxLife;
                this.alpha = 0;
                this.hueStart = Math.random() * 90 + 240;
                this.hueRange = 30;
                this.color = { h: this.hueStart, s: 70, l: 50 };
            }
            update() {
                this.x += this.vx;
                this.y += this.vy;
                this.life--;
                if (this.x + this.radius > canvas.width || this.x - this.radius < 0) this.vx *= -1;
                if (this.y + this.radius > canvas.height || this.y - this.radius < 0) this.vy *= -1;
                const lifeProgress = (this.maxLife - this.life) / this.maxLife;
                this.color.h = this.hueStart + Math.sin(lifeProgress * Math.PI) * this.hueRange;
                this.alpha = 0.15 * Math.sin(lifeProgress * Math.PI); // more subtle
            }
            draw() {
                ctx.beginPath();
                const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius);
                const colorString = `hsla(${this.color.h}, ${this.color.s}%, ${this.color.l}%, ${this.alpha})`;
                const transparentString = `hsla(${this.color.h}, ${this.color.s}%, ${this.color.l}%, 0)`;
                gradient.addColorStop(0, colorString);
                gradient.addColorStop(1, transparentString);
                ctx.fillStyle = gradient;
                ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        function createBlobs() {
            blobs = [];
            for (let i = 0; i < blobCount; i++) {
                blobs.push(new Blob());
            }
        }
        function animate() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            blobs.forEach((blob, index) => {
                blob.update();
                blob.draw();
                if (blob.life <= 0) {
                    blobs[index] = new Blob();
                }
            });
            requestAnimationFrame(animate);
        }
        setCanvasDimensions();
        createBlobs();
        animate();
    }


    // --- OLD Splash Screen Logic ---
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


    // --- NEW: Cursor and Interactive Effects from example.html ---
    function initializeInteractiveEffects() {
        const cursorDot = document.querySelector('.cursor-dot');
        const cursorAura = document.querySelector('.cursor-aura');
        if (!cursorDot || !cursorAura) return;

        let mouseX = 0, mouseY = 0;
        let auraX = 0, auraY = 0;
        const lagAmount = 0.2;

        window.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
        });

        const animateEffects = () => {
            auraX += (mouseX - auraX) * lagAmount;
            auraY += (mouseY - auraY) * lagAmount;
            cursorDot.style.transform = `translate(${mouseX - (cursorDot.offsetWidth / 2)}px, ${mouseY - (cursorDot.offsetHeight / 2)}px)`;
            cursorAura.style.transform = `translate(${auraX - (cursorAura.offsetWidth / 2)}px, ${auraY - (cursorAura.offsetHeight / 2)}px)`;
            requestAnimationFrame(animateEffects);
        };
        animateEffects();

        const interactiveElements = document.querySelectorAll('a, button, .text-input, .history-item');
        interactiveElements.forEach(el => {
            el.addEventListener('mouseenter', () => {
                cursorDot.classList.add('hovered');
                cursorAura.classList.add('hovered');
            });
            el.addEventListener('mouseleave', () => {
                cursorDot.classList.remove('hovered');
                cursorAura.classList.remove('hovered');
            });
        });
    }

    // --- NEW: Ripple effect on buttons ---
    function initializeRippleEffect() {
        const buttons = document.querySelectorAll('.cta-primary, .cta-secondary, .mic-btn');

        buttons.forEach(button => {
            button.addEventListener('click', function (e) {
                const rect = button.getBoundingClientRect();
                
                // Create span element
                const ripple = document.createElement('span');
                ripple.classList.add('ripple');

                // Set size based on button's largest dimension
                const size = Math.max(rect.width, rect.height);
                ripple.style.width = ripple.style.height = `${size}px`;

                // Calculate position
                const x = e.clientX - rect.left - size / 2;
                const y = e.clientY - rect.top - size / 2;
                ripple.style.left = `${x}px`;
                ripple.style.top = `${y}px`;
                
                // Remove any existing ripple
                const existingRipple = button.querySelector('.ripple');
                if (existingRipple) {
                    existingRipple.remove();
                }
                
                // Add the ripple to the button
                this.appendChild(ripple);

                // Clean up after animation
                ripple.addEventListener('animationend', () => {
                    if(ripple) {
                        ripple.remove();
                    }
                });
            });
        });
    }

    // --- Voice Input (Web Speech API) ---
    if (micBtn) {
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
    }

    // --- Main Analysis Logic ---
    if (analyzeBtn) {
        analyzeBtn.addEventListener('click', async () => {
            const text = textInput.value.trim(); if (!text) return;
            resetUIForAnalysis(); mainContainer.classList.add('loading'); loadingOverlay.classList.add('visible');
            try {
                const response = await fetch('/analyze', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text }), });
                const data = await response.json(); if (!response.ok) throw new Error(data.error || 'Analysis failed');
                currentAnalysisData = data; saveToHistory(text, data); displayShamingAndConsequences(data); displayResults(data); resultContainer.classList.add('visible'); shareBtn.classList.add('visible');
            } catch (error) { console.error('Error:', error); displayError(error.message); } finally { mainContainer.classList.remove('loading'); loadingOverlay.classList.remove('visible'); }
        });
    }

    // --- UI Display Functions ---
    const resetUIForAnalysis = () => {
        resultContainer.classList.remove('visible'); shamingContainer.classList.remove('visible'); shareBtn.classList.remove('visible', 'success'); shareBtn.querySelector('span').textContent = 'Share Results'; resultsDiv.innerHTML = ''; shamingLine.textContent = ''; currentAnalysisData = null;
    };
    const displayResults = (data) => {
        resultsDiv.innerHTML = ''; const categories = ['racism', 'sexism', 'homophobia', 'religious_blasphemy', ...data.other_minorities?.map(m => m.group) || []];
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
    if (shareBtn) {
        shareBtn.addEventListener('click', () => { if (!currentAnalysisData) return; const { shaming_line, probability_beaten_up, probability_cancelled } = currentAnalysisData; const shareText = `My Offense Meter Results:\n\n"${shaming_line}"\n\n- Chance of being beaten up: ${probability_beaten_up}%\n- Chance of being cancelled: ${probability_cancelled}%\n\nAnalyze your own text at this website!`; navigator.clipboard.writeText(shareText).then(() => { shareBtn.classList.add('success'); shareBtn.querySelector('span').textContent = 'Copied!'; setTimeout(() => { shareBtn.classList.remove('success'); shareBtn.querySelector('span').textContent = 'Share Results'; }, 2000); }); });
    }

    // --- History Functionality ---
    const getHistory = () => JSON.parse(localStorage.getItem('offenseHistory')) || [];
    const saveHistory = (history) => localStorage.setItem('offenseHistory', JSON.stringify(history));
    const saveToHistory = (text, data) => { let history = getHistory(); history.unshift({ text, data, date: new Date().toISOString() }); if (history.length > 10) history.pop(); saveHistory(history); loadHistory(); };
    const loadHistory = () => {
        if (!historyList) return;
        historyList.innerHTML = ''; const history = getHistory(); if (history.length === 0) { historyList.innerHTML = '<p class="no-history">No past analyses found.</p>'; return; }
        history.forEach(item => {
            const historyItemContainer = document.createElement('div'); historyItemContainer.classList.add('history-item-container');
            const historyItem = document.createElement('div'); historyItem.classList.add('history-item'); historyItem.innerHTML = `<p class="history-text">${item.text}</p><button class="view-summary-btn cta-secondary">View Summary</button>`;
            const summaryContent = document.createElement('div'); summaryContent.classList.add('history-summary-content'); summaryContent.innerHTML = `<p class="summary-line"><strong>AI Summary:</strong> ${item.data.history_summary}</p><p class="summary-line"><strong>Reception Score:</strong> ${item.data.conversational_reception_score}/100</p>`;
            historyItemContainer.appendChild(historyItem);
            historyItemContainer.appendChild(summaryContent);
            historyList.appendChild(historyItemContainer);
            const summaryBtn = historyItem.querySelector('.view-summary-btn');
            summaryBtn.addEventListener('click', (e) => { e.stopPropagation(); summaryContent.classList.toggle('visible'); });
            historyItem.querySelector('.history-text').addEventListener('click', () => { textInput.value = item.text; resetUIForAnalysis(); currentAnalysisData = item.data; displayShamingAndConsequences(item.data); displayResults(item.data); resultContainer.classList.add('visible'); shareBtn.classList.add('visible'); window.scrollTo({ top: 0, behavior: 'smooth' }); });
        });
    };
    if (clearHistoryBtn) {
        clearHistoryBtn.addEventListener('click', () => { localStorage.removeItem('offenseHistory'); loadHistory(); });
    }

    // --- Start App ---
    initializeProceduralBackground();
    initializeParticleCanvas();
    initializeSplashScreen();
});