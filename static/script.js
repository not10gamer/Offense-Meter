document.addEventListener('DOMContentLoaded', () => {
    const textInput = document.getElementById('text-input');
    const analyzeBtn = document.getElementById('analyze-btn');
    const resultContainer = document.getElementById('result-container');
    const resultsDiv = document.getElementById('results');

    analyzeBtn.addEventListener('click', async () => {
        const text = textInput.value.trim();
        if (!text) return;

        // Reset and show loading state
        resultContainer.classList.add('visible');
        resultsDiv.innerHTML = '<p>Analyzing...</p>';

        try {
            const response = await fetch('/analyze', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ text }),
            });

            const data = await response.json();

            if (response.ok) {
                displayResults(data);
            } else {
                throw new Error(data.error || 'Analysis failed');
            }
        } catch (error) {
            console.error('Error:', error);
            displayError(error.message);
        }
    });

    function displayResults(data) {
        resultsDiv.innerHTML = ''; // Clear previous results

        // Handle fixed categories
        const fixedCategories = ['racism', 'sexism', 'homophobia', 'religious_blasphemy', 'parental_disapproval'];
        for (const category of fixedCategories) {
            if (data[category]) {
                createCategoryResult(category, data[category]);
            }
        }

        // Handle other minorities
        if (data.other_minorities && data.other_minorities.length > 0) {
            for (const minorityData of data.other_minorities) {
                createCategoryResult(minorityData.group, minorityData, true);
            }
        }
    }

    function createCategoryResult(title, data, isMinority = false) {
        const resultElement = document.createElement('div');
        resultElement.classList.add('category-result');

        const categoryTitle = isMinority ? title : title.replace('_', ' ');

        resultElement.innerHTML = `
            <div class="category-header">
                <h3 class="category-title">${categoryTitle}</h3>
                <button class="reason-btn">?</button>
            </div>
            <div class="score-display">
                <div class="score-container">
                    <div class="score-bar" style="width: ${data.score}%;"></div>
                </div>
                <span class="score-percentage">${data.score}%</span>
            </div>
            <p class="reason-text">${data.reason}</p>
        `;

        resultsDiv.appendChild(resultElement);

        const reasonBtn = resultElement.querySelector('.reason-btn');
        const reasonText = resultElement.querySelector('.reason-text');

        reasonBtn.addEventListener('click', () => {
            reasonText.classList.toggle('visible');
        });
    }

    function displayError(errorMessage) {
        resultsDiv.innerHTML = `<p>Error: ${errorMessage}</p>`;
    }
});
