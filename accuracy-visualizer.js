// Configuration

const POPULATION_SIZE = 475; // Population size = visualization size (reduced to avoid legend area)
const DOT_RADIUS = 4;

// DOM Elements
const prevalenceSlider = document.getElementById('prevalenceSlider');
const accuracySlider = document.getElementById('accuracySlider');
const biasSlider = document.getElementById('biasSlider');

const prevalenceValue = document.getElementById('prevalenceValue');
const accuracyValue = document.getElementById('accuracyValue');
const biasValue = document.getElementById('biasValue');

const canvas = document.getElementById('populationViz');
const ctx = canvas.getContext('2d');

const regenerateBtn = document.getElementById('regenerateButton');

// Stat elements
const tpValue = document.getElementById('tpValue');
const fpValue = document.getElementById('fpValue');
const tnValue = document.getElementById('tnValue');
const fnValue = document.getElementById('fnValue');

const sensitivityValue = document.getElementById('sensitivityValue');
const specificityValue = document.getElementById('specificityValue');
const precisionValue = document.getElementById('precisionValue');
const overallAccuracyValue = document.getElementById('overallAccuracyValue');

const matrixTP = document.getElementById('matrixTP');
const matrixFN = document.getElementById('matrixFN');
const matrixFP = document.getElementById('matrixFP');
const matrixTN = document.getElementById('matrixTN');

const insightText = document.getElementById('insightText');

// State
let population = [];

// Initialize canvas size
function resizeCanvas() {
    const container = canvas.parentElement;
    canvas.width = container.clientWidth;
    canvas.height = 400;
}

// Generate synthetic population
function generatePopulation() {
    const prevalence = parseInt(prevalenceSlider.value) / 100;
    const accuracy = parseInt(accuracySlider.value) / 100;
    const bias = parseInt(biasSlider.value) / 100;

    population = [];

    for (let i = 0; i < POPULATION_SIZE; i++) {
        // True condition: based on prevalence
        const trueCondition = Math.random() < prevalence;

        // Predicted condition: based on accuracy and bias
        let predicted;
        if (trueCondition) {
            // True positive rate (sensitivity)
            predicted = Math.random() < accuracy;
        } else {
            // True negative vs false positive
            // Bias determines the split between true negatives and false positives
            // when the model is wrong
            const errorRate = 1 - accuracy;
            const falsePositiveRate = errorRate * bias; // bias toward false positives
            predicted = Math.random() < falsePositiveRate;
        }

        population.push({
            id: i,
            trueCondition,
            predicted,
        });
    }

    updateVisualization();
    updateStatistics();
}

// Calculate statistics
function calculateStatistics() {
    let tp = 0, fp = 0, tn = 0, fn = 0;

    population.forEach(person => {
        if (person.trueCondition && person.predicted) tp++;
        else if (!person.trueCondition && person.predicted) fp++;
        else if (!person.trueCondition && !person.predicted) tn++;
        else if (person.trueCondition && !person.predicted) fn++;
    });

    return { tp, fp, tn, fn };
}

// Get color based on true and predicted condition
function getColor(trueCondition, predicted) {
    if (trueCondition && predicted) {
        // True Positive - Green
        return '#10b981';
    } else if (!trueCondition && predicted) {
        // False Positive - Orange/Amber
        return '#f59e0b';
    } else if (!trueCondition && !predicted) {
        // True Negative - Blue
        return '#3b82f6';
    } else {
        // False Negative - Red
        return '#ef4444';
    }
}

// Draw visualization
function updateVisualization() {
    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // Draw grid background
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    const gridSize = 50;
    for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
    }
    for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
    }

    // Draw dots for visualization subset
    const dotsPerRow = Math.ceil(Math.sqrt(POPULATION_SIZE));
    const spacingX = width / (dotsPerRow + 1);
    const spacingY = height / (dotsPerRow + 1);

    population.forEach((person, index) => {
        const row = Math.floor(index / dotsPerRow);
        const col = index % dotsPerRow;

        // Skip dots in the top-left 5x5 area to avoid drawing over the legend
        if (row < 5 && col < 5) {
            return;
        }

        const x = spacingX * (col + 1);
        const y = spacingY * (row + 1);

        // Draw outer ring (true condition)
        ctx.strokeStyle = person.trueCondition ? '#022c22' : '#f0f9ff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y, DOT_RADIUS + 2, 0, Math.PI * 2);
        ctx.stroke();

        // Draw center dot (predicted condition)
        ctx.fillStyle = getColor(person.trueCondition, person.predicted);
        ctx.beginPath();
        ctx.arc(x, y, DOT_RADIUS, 0, Math.PI * 2);
        ctx.fill();
    });

    // Draw legend
    const legendX = 15;
    const legendY = 15;
    const legendSpacing = 20;
    ctx.font = '12px Arial';
    ctx.textAlign = 'left';

    const legend = [
        { label: 'True Positive', color: '#10b981' },
        { label: 'False Positive', color: '#f59e0b' },
        { label: 'True Negative', color: '#3b82f6' },
        { label: 'False Negative', color: '#ef4444' },
    ];

    legend.forEach((item, i) => {
        const y = legendY + i * legendSpacing;
        ctx.fillStyle = item.color;
        ctx.fillRect(legendX, y - 5, 10, 10);
        ctx.fillStyle = '#333';
        ctx.fillText(item.label, legendX + 15, y + 3);
    });
}

// Update statistics display
function updateStatistics() {
    const stats = calculateStatistics();
    const { tp, fp, tn, fn } = stats;
    const total = population.length;

    // Update stat boxes
    tpValue.textContent = tp.toLocaleString();
    fpValue.textContent = fp.toLocaleString();
    tnValue.textContent = tn.toLocaleString();
    fnValue.textContent = fn.toLocaleString();

    // Calculate metrics
    const sensitivity = (tp + fn) > 0 ? (tp / (tp + fn)) * 100 : 0;
    const specificity = (tn + fp) > 0 ? (tn / (tn + fp)) * 100 : 0;
    const precision = (tp + fp) > 0 ? (tp / (tp + fp)) * 100 : 0;
    const accuracy = ((tp + tn) / total) * 100;

    // Update metric displays
    sensitivityValue.textContent = sensitivity.toFixed(1) + '%';
    specificityValue.textContent = specificity.toFixed(1) + '%';
    precisionValue.textContent = precision.toFixed(1) + '%';
    overallAccuracyValue.textContent = accuracy.toFixed(1) + '%';

    // Update confusion matrix
    matrixTP.textContent = tp.toLocaleString();
    matrixFN.textContent = fn.toLocaleString();
    matrixFP.textContent = fp.toLocaleString();
    matrixTN.textContent = tn.toLocaleString();

    // Update insight text
    updateInsight(stats, accuracy);
}

// Generate insight text
function updateInsight(stats, accuracy) {
    const { tp, fp, tn, fn } = stats;
    const prevalence = parseInt(prevalenceSlider.value);
    const totalPositives = tp + fn;
    const totalNegatives = tn + fp;

    let insight = '';

    if (totalPositives === 0) {
        insight = '📊 No positive cases in this population (condition is absent).';
    } else if (totalNegatives === 0) {
        insight = '📊 Entire population has the condition (condition is universal).';
    } else if (fp === 0 && fn === 0) {
        insight = '✓ Perfect predictions! All tests are correct.';
    } else if (fp > tp && prevalence < 20) {
        insight = `⚠️ More false positives than true positives! With ${accuracy.toFixed(1)}% accuracy on a ${prevalence}% prevalent condition, your positive test results are mostly wrong. Precision is only ${((tp / (tp + fp)) * 100).toFixed(1)}%.`;
    } else if (fp > tp * 2) {
        insight = `⚠️ Significantly more false positives. Even with high accuracy, when a condition is rare, false positives dominate positive predictions.`;
    } else if (fn > tp && prevalence > 50) {
        insight = `⚠️ The model misses many true cases (high false negatives). Lower false negative bias to catch more true positives.`;
    } else if (accuracy >= 95) {
        insight = `✓ High overall accuracy (${accuracy.toFixed(1)}%) but remember: this measures correct predictions for both conditions. Look at Precision for positive predictions specifically.`;
    } else if (accuracy <= 50) {
        insight = `❌ Below 50% accuracy - this model performs worse than random guessing!`;
    } else {
        insight = `📊 Average accuracy at ${accuracy.toFixed(1)}%. For a ${prevalence}% prevalent condition, Precision is ${((tp / (tp + fp)) * 100).toFixed(1)}% - this is the reliability of positive predictions.`;
    }

    insightText.textContent = insight;
}

// Update slider values on input
prevalenceSlider.addEventListener('input', () => {
    prevalenceValue.textContent = prevalenceSlider.value + '%';
    generatePopulation();
});

accuracySlider.addEventListener('input', () => {
    accuracyValue.textContent = accuracySlider.value + '%';
    generatePopulation();
});

biasSlider.addEventListener('input', () => {
    biasValue.textContent = biasSlider.value + '%';
    generatePopulation();
});

regenerateBtn.addEventListener('click', generatePopulation);

// Handle window resize
window.addEventListener('resize', () => {
    resizeCanvas();
    updateVisualization();
});

// Initialize
resizeCanvas();
generatePopulation();

// Tab navigation
const tabButtons = document.querySelectorAll('.tab-button');
const tabContents = document.querySelectorAll('.tab-content');

tabButtons.forEach(button => {
    button.addEventListener('click', () => {
        const tabName = button.getAttribute('data-tab');

        // Remove active class from all buttons and contents
        tabButtons.forEach(btn => btn.classList.remove('active'));
        tabContents.forEach(content => content.classList.remove('active'));

        // Add active class to clicked button and corresponding content
        button.classList.add('active');
        document.getElementById(`${tabName}-tab`).classList.add('active');

        // Resize canvas when switching back to visualizer tab
        if (tabName === 'visualizer') {
            setTimeout(() => {
                resizeCanvas();
                updateVisualization();
            }, 0);
        } else if (tabName === 'page2') {
            // Page 2 is loaded from page2.js; initialize on first view
            if (typeof page2Initialized === 'undefined' || !page2Initialized) {
                // If page2.js hasn't run yet, it will handle initialization when loaded.
            } else if (!page2Initialized) {
                page2Initialized = true;
                if (typeof generateDistribution === 'function') generateDistribution();
            } else {
                // Resize distribution canvas when switching to page 2
                setTimeout(() => {
                    if (typeof updateDistributionVisualization === 'function' && distributionData && distributionData.length > 0) {
                        updateDistributionVisualization();
                    }
                }, 0);
            }
        }
    });
});

// Page 2 code moved to page2.js

// Page 2 code moved to page2.js (cleaned)
