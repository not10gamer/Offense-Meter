'use strict';

const App = {
    // Configuration
    config: {
        splashScreen: {
            initialText: "not10gamer",
            finalText: "Ethan Peter",
            chars: "ABCDEFGHIJKLMONPQRSTUVWXYZ1234567890*<>",
            revealSpeed: 150,
            scrambleSpeed: 75,
            wipeDuration: 1200,
            postWipePause: 1500,
        },
        blobAnimation: {
            count: 5,
        },
        history: {
            maxLength: 10,
        }
    },

    // DOM Elements
    elements: {
        mainContainer: document.getElementById('main-container'),
        textInput: document.getElementById('text-input'),
        analyzeBtn: document.getElementById('analyze-btn'),
        resultContainer: document.getElementById('result-container'),
        resultsDiv: document.getElementById('results'),
        shamingContainer: document.getElementById('shaming-container'),
        shamingLine: document.getElementById('shaming-line'),
        beatenUpProbEl: document.getElementById('beaten-up-prob'),
        cancelledProbEl: document.getElementById('cancelled-prob'),
        micBtn: document.getElementById('mic-btn'),
        loadingOverlay: document.getElementById('loading-overlay'),
        shareBtn: document.getElementById('share-btn'),
        historyList: document.getElementById('history-list'),
        clearHistoryBtn: document.getElementById('clear-history-btn'),
        splashScreen: document.getElementById('splash-screen'),
        codeLoader: document.getElementById('code-loader'),
        wipeElement: document.getElementById('wipe-transition'),
        proceduralBg: document.getElementById('procedural-background'),
        particleCanvas: document.getElementById('particle-canvas'),
        cursorDot: document.querySelector('.cursor-dot'),
        cursorAura: document.querySelector('.cursor-aura'),
    },

    // State
    state: {
        currentAnalysisData: null,
        recognition: null,
    },

    // Initialization
    init() {
        window.addEventListener('error', this.handleGlobalError.bind(this));
        document.addEventListener('DOMContentLoaded', this.handleDOMLoaded.bind(this));
    },

    handleDOMLoaded() {
        this.initSplashScreen();
        this.initProceduralBackground();
        this.initInteractiveEffects();
        this.initEventListeners();
        this.setInitialState();
    },

    setInitialState() {
        if (this.elements.resultsDiv) {
            this.elements.resultsDiv.innerHTML = '<div class="initial-placeholder"><p>Your analysis will appear here.</p></div>';
        }
        this.History.load();
    },

    // Event Listeners
    initEventListeners() {
        if (this.elements.analyzeBtn) {
            this.elements.analyzeBtn.addEventListener('click', this.handleAnalyzeClick.bind(this));
        }
        if (this.elements.micBtn) {
            this.initVoiceInput();
            this.elements.micBtn.addEventListener('click', this.handleMicClick.bind(this));
        }
        if (this.elements.shareBtn) {
            this.elements.shareBtn.addEventListener('click', this.handleShareClick.bind(this));
        }
        if (this.elements.clearHistoryBtn) {
            this.elements.clearHistoryBtn.addEventListener('click', this.History.clear.bind(this.History));
        }
    },

    // Splash Screen
    initSplashScreen() {
        const { splashScreen, codeLoader, wipeElement } = this.elements;
        if (!splashScreen || !codeLoader || !wipeElement) {
            if(splashScreen) splashScreen.style.display = 'none';
            this.showMainContent();
            return;
        }

        const { initialText, finalText, chars, revealSpeed, scrambleSpeed, wipeDuration, postWipePause } = this.config.splashScreen;
        let step = 0;
        let scrambleInterval, revealInterval;

        const scramble = (targetText) => {
            let revealedText = "";
            for (let i = 0; i < targetText.length; i++) {
                if (i < step) revealedText += targetText[i];
                else revealedText += chars[Math.floor(Math.random() * chars.length)];
            }
            codeLoader.textContent = revealedText;
        };

        const startWipeTransition = () => {
            codeLoader.classList.add('is-blurring-out');
            setTimeout(() => {
                codeLoader.textContent = finalText;
                codeLoader.classList.remove('is-blurring-out');
            }, wipeDuration / 2);
            wipeElement.classList.add('animate');
            setTimeout(fadeOutSplash, wipeDuration + postWipePause);
        };

        const fadeOutSplash = () => {
            splashScreen.style.opacity = '0';
            splashScreen.addEventListener('transitionend', (e) => {
                if (e.target === splashScreen) {
                    splashScreen.style.display = 'none';
                    this.showMainContent();
                }
            }, { once: true });
        };

        revealInterval = setInterval(() => {
            if (step < initialText.length) {
                step++;
            } else {
                clearInterval(revealInterval);
                clearInterval(scrambleInterval);
                codeLoader.textContent = initialText;
                setTimeout(startWipeTransition, 800);
            }
        }, revealSpeed);

        scrambleInterval = setInterval(() => scramble(initialText), scrambleSpeed);
    },

    showMainContent() {
        if (this.elements.mainContainer) {
            this.elements.mainContainer.classList.add('visible');
            setTimeout(() => this.elements.mainContainer.classList.add('loaded'), 500);
        }
    },

    // Backgrounds and Effects
    initProceduralBackground() {
        const canvas = this.elements.proceduralBg;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        let blobs = [];
        const blobCount = this.config.blobAnimation.count;

        const setCanvasDimensions = () => {
            canvas.width = window.innerWidth;
            canvas.height = document.body.scrollHeight;
        };

        window.addEventListener('resize', setCanvasDimensions);
        new MutationObserver(setCanvasDimensions).observe(document.body, { childList: true, subtree: true });

        class Blob {
            constructor() {
                this.x = Math.random() * canvas.width;
                this.y = Math.random() * canvas.height;
                this.radius = Math.random() * 400 + 400;
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
                this.alpha = 0.15 * Math.sin(lifeProgress * Math.PI);
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

        const createBlobs = () => {
            blobs = [];
            for (let i = 0; i < blobCount; i++) {
                blobs.push(new Blob());
            }
        };

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            blobs.forEach((blob, index) => {
                blob.update();
                blob.draw();
                if (blob.life <= 0) {
                    blobs[index] = new Blob();
                }
            });
            requestAnimationFrame(animate);
        };

        setCanvasDimensions();
        createBlobs();
        animate();
    },

    initInteractiveEffects() {
        const { cursorDot, cursorAura } = this.elements;
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

        const buttons = document.querySelectorAll('.cta-primary, .cta-secondary, .mic-btn');
        buttons.forEach(button => {
            button.addEventListener('mousemove', e => {
                const rect = button.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                button.style.setProperty('--x', `${x}px`);
                button.style.setProperty('--y', `${y}px`);
            });
        });
    },

    // Voice Input
    initVoiceInput() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            this.state.recognition = new SpeechRecognition();
            this.state.recognition.continuous = true;
            this.state.recognition.interimResults = true;
            this.state.recognition.lang = 'en-US';

            this.state.recognition.onstart = () => {
                this.elements.micBtn.classList.add('recording');
                this.elements.micBtn.title = 'Stop Recording';
                this.elements.textInput.placeholder = 'Listening...';
            };
            this.state.recognition.onend = () => {
                this.elements.micBtn.classList.remove('recording');
                this.elements.micBtn.title = 'Use Voice Input';
                this.elements.textInput.placeholder = 'Enter text or use the microphone...';
            };
            this.state.recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                if (event.error === 'not-allowed') {
                    alert('Microphone access was denied. Please allow microphone access in your browser settings.');
                }
            };
            this.state.recognition.onresult = (event) => {
                let finalTranscript = '';
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        finalTranscript += event.results[i][0].transcript;
                    }
                }
                this.elements.textInput.value += finalTranscript;
            };
        } else {
            console.warn('Speech Recognition not supported in this browser.');
            this.elements.micBtn.disabled = true;
            this.elements.micBtn.title = 'Voice input not supported';
        }
    },

    handleMicClick() {
        if (this.elements.micBtn.classList.contains('recording')) {
            this.state.recognition.stop();
        } else {
            this.state.recognition.start();
        }
    },

    // Analysis
    async handleAnalyzeClick() {
        const text = this.elements.textInput.value.trim();
        if (!text) return;

        this.resetUIForAnalysis();
        this.toggleLoading(true);

        try {
            const response = await fetch('/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Analysis failed');

            this.state.currentAnalysisData = data;
            this.History.save(text, data);
            this.displayShamingAndConsequences(data);
            this.displayResults(data);
            this.elements.resultContainer.classList.add('visible');
            this.elements.shareBtn.classList.add('visible');
        } catch (error) {
            console.error('Error:', error);
            this.displayError(error.message);
        } finally {
            this.toggleLoading(false);
        }
    },

    // UI Updates
    resetUIForAnalysis() {
        this.elements.resultContainer.classList.remove('visible');
        this.elements.shamingContainer.classList.remove('visible');
        this.elements.shareBtn.classList.remove('visible', 'success');
        this.elements.shareBtn.querySelector('span').textContent = 'Share Results';
        this.elements.resultsDiv.innerHTML = '';
        this.elements.shamingLine.textContent = '';
        this.state.currentAnalysisData = null;
    },

    displayResults(data) {
        this.elements.resultsDiv.innerHTML = '';
        const categories = ['racism', 'sexism', 'homophobia', 'religious_blasphemy', ...data.other_minorities?.map(m => m.group) || []];
        categories.forEach((category, index) => {
            const categoryData = data[category] || data.other_minorities.find(m => m.group === category);
            if (categoryData) {
                const resultElement = this.createCategoryResult(category, categoryData);
                resultElement.style.animationDelay = `${index * 100}ms`;
                this.elements.resultsDiv.appendChild(resultElement);
            }
        });
    },

    createCategoryResult(title, data) {
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
                <div class="score-display">
                    <span class="score-label">AI Score</span>
                    <div class="score-container"><div class="score-bar" style="width: ${data.ai_score}%;"></div></div>
                    <span class="score-percentage">${data.ai_score}%</span>
                </div>
                <div class="score-display">
                    <span class="score-label">Potential</span>
                    <div class="score-container"><div class="score-bar" style="width: ${data.potential_score}%;"></div></div>
                    <span class="score-percentage">${data.potential_score}%</span>
                </div>
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
        });
        return resultElement;
    },

    displayShamingAndConsequences(data) {
        if (data.shaming_line) {
            this.elements.shamingLine.textContent = data.shaming_line;
            this.elements.shamingContainer.classList.add('visible');
        }
        if (data.hasOwnProperty('probability_beaten_up') && data.hasOwnProperty('probability_cancelled')) {
            this.elements.beatenUpProbEl.textContent = `${data.probability_beaten_up}%`;
            this.elements.cancelledProbEl.textContent = `${data.probability_cancelled}%`;
        }
    },

    displayError(errorMessage) {
        this.elements.resultsDiv.innerHTML = `
            <div class="error-message-box">
                <p><strong>Analysis Failed</strong></p>
                <p>${errorMessage}</p>
            </div>
        `;
        this.elements.resultContainer.classList.add('visible');
        this.elements.shamingContainer.classList.remove('visible');
    },

    toggleLoading(isLoading) {
        this.elements.mainContainer.classList.toggle('loading', isLoading);
        this.elements.loadingOverlay.classList.toggle('visible', isLoading);
    },

    // Share
    handleShareClick() {
        if (!this.state.currentAnalysisData) return;
        const { shaming_line, probability_beaten_up, probability_cancelled } = this.state.currentAnalysisData;
        const shareText = `My Offense Meter Results:\n\n"${shaming_line}"\n\n- Chance of being beaten up: ${probability_beaten_up}%\n- Chance of being cancelled: ${probability_cancelled}%\n\nAnalyze your own text at this website!`;
        navigator.clipboard.writeText(shareText).then(() => {
            this.elements.shareBtn.classList.add('success');
            this.elements.shareBtn.querySelector('span').textContent = 'Copied!';
            setTimeout(() => {
                this.elements.shareBtn.classList.remove('success');
                this.elements.shareBtn.querySelector('span').textContent = 'Share Results';
            }, 2000);
        });
    },

    // History
    History: {
        get() {
            return JSON.parse(localStorage.getItem('offenseHistory')) || [];
        },
        set(history) {
            localStorage.setItem('offenseHistory', JSON.stringify(history));
        },
        save(text, data) {
            let history = this.get();
            history.unshift({ text, data, date: new Date().toISOString() });
            if (history.length > App.config.history.maxLength) history.pop();
            this.set(history);
            this.load();
        },
        load() {
            if (!App.elements.historyList) return;
            App.elements.historyList.innerHTML = '';
            const history = this.get();
            if (history.length === 0) {
                App.elements.historyList.innerHTML = '<p class="no-history">No past analyses found.</p>';
                return;
            }
            history.forEach(item => {
                const historyItemContainer = document.createElement('div');
                historyItemContainer.classList.add('history-item-container');

                const historyItem = document.createElement('div');
                historyItem.classList.add('history-item');
                historyItem.innerHTML = `
                    <p class="history-text">${item.text}</p>
                    <button class="view-summary-btn cta-secondary">View Summary</button>
                `;

                const summaryContent = document.createElement('div');
                summaryContent.classList.add('history-summary-content');
                summaryContent.innerHTML = `
                    <p class="summary-line"><strong>AI Summary:</strong> ${item.data.history_summary}</p>
                    <p class="summary-line"><strong>Reception Score:</strong> ${item.data.conversational_reception_score}/100</p>
                `;

                historyItemContainer.appendChild(historyItem);
                historyItemContainer.appendChild(summaryContent);
                App.elements.historyList.appendChild(historyItemContainer);

                const summaryBtn = historyItem.querySelector('.view-summary-btn');
                summaryBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    summaryContent.classList.toggle('visible');
                });

                historyItem.querySelector('.history-text').addEventListener('click', () => {
                    App.elements.textInput.value = item.text;
                    App.resetUIForAnalysis();
                    App.state.currentAnalysisData = item.data;
                    App.displayShamingAndConsequences(item.data);
                    App.displayResults(item.data);
                    App.elements.resultContainer.classList.add('visible');
                    App.elements.shareBtn.classList.add('visible');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                });
            });
        },
        clear() {
            localStorage.removeItem('offenseHistory');
            this.load();
        }
    },

    // Error Handling
    handleGlobalError(e) {
        console.warn('JavaScript error caught:', e.message, 'at', e.filename, ':', e.lineno);
        return true;
    }
};

App.init();
