// Configuration

const POPULATION_SIZE = 1000;
const VISUALIZATION_DOTS = 500; // Show subset for better visualization
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
let visualizationIndices = [];

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

    // Select random indices for visualization
    visualizationIndices = [];
    while (visualizationIndices.length < VISUALIZATION_DOTS) {
        const idx = Math.floor(Math.random() * population.length);
        if (!visualizationIndices.includes(idx)) {
            visualizationIndices.push(idx);
        }
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
    const dotsPerRow = Math.ceil(Math.sqrt(VISUALIZATION_DOTS));
    const spacingX = width / (dotsPerRow + 1);
    const spacingY = height / (dotsPerRow + 1);

    visualizationIndices.forEach((idx, index) => {
        const person = population[idx];
        const row = Math.floor(index / dotsPerRow);
        const col = index % dotsPerRow;

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
            // Resize distribution canvas when switching to page 2
            setTimeout(() => {
                if (distributionData.length > 0) {
                    updateDistributionVisualization();
                }
            }, 0);
        }
    });
});

// ============================================
// PAGE 2: Mean vs Median Visualizer
// ============================================

// DOM Elements for Page 2
const meanSlider = document.getElementById('meanSlider');
const medianSlider = document.getElementById('medianSlider');
const datasetSizeSlider = document.getElementById('datasetSizeSlider');

const meanValue = document.getElementById('meanValue');
const medianValue = document.getElementById('medianValue');
const datasetSizeValue = document.getElementById('datasetSizeValue');

const generateDistributionBtn = document.getElementById('generateDistributionBtn');
const distributionCanvas = document.getElementById('distributionViz');
const distCtx = distributionCanvas.getContext('2d');

const computedMean = document.getElementById('computedMean');
const computedMedian = document.getElementById('computedMedian');
const computedStdDev = document.getElementById('computedStdDev');
const computedSkewness = document.getElementById('computedSkewness');
const insightTextPage2 = document.getElementById('insightTextPage2');

let distributionData = [];

// Generate a dataset with specified mean and median
function generateDistribution() {
    const targetMean = parseInt(meanSlider.value);
    const targetMedian = parseInt(medianSlider.value);
    const size = parseInt(datasetSizeSlider.value);
    const skewness = Math.abs(targetMean - targetMedian) / 100; // Scale based on mean-median difference

    distributionData = [];

    // Generate base data using a skewed distribution
    // We'll use a combination of normal and log-normal to create skewness
    for (let i = 0; i < size; i++) {
        let value;
        
        // Generate from a base distribution
        if (i < size * 0.7) {
            // 70% from normal distribution around median
            value = targetMedian + (gaussianRandom() * 15);
        } else {
            // 30% from a tail (scattered outliers)
            const direction = targetMean > targetMedian ? 1 : -1;
            value = targetMedian + (Math.random() * 80 * direction);
        }

        distributionData.push(Math.max(1, value));
    }

    // Sort the data
    distributionData.sort((a, b) => a - b);

    // Scale and shift to approximate the target mean
    const currentMean = calculateMean(distributionData);
    const scaleFactor = currentMean !== 0 ? targetMean / currentMean : 1;
    
    distributionData = distributionData.map(v => v * scaleFactor);

    // Fine-tune median by adjusting middle values
    const sortedData = [...distributionData].sort((a, b) => a - b);
    const medianIndex = Math.floor(sortedData.length / 2);
    const currentMedian = sortedData[medianIndex];
    const medianShift = targetMedian - currentMedian;
    
    // Apply shift more heavily to the upper half if mean > median
    if (targetMean > targetMedian) {
        for (let i = medianIndex; i < distributionData.length; i++) {
            distributionData[i] += medianShift * 0.5;
        }
    } else {
        for (let i = 0; i < medianIndex; i++) {
            distributionData[i] += medianShift * 0.5;
        }
    }

    distributionData = distributionData.map(v => Math.max(1, v));

    updateDistributionVisualization();
    updateDistributionStatistics();
}

// Box-Muller transform for Gaussian random numbers
function gaussianRandom(mean = 0, stdev = 1) {
    const u = 1 - Math.random();
    const v = Math.random();
    const z0 = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    return z0 * stdev + mean;
}

// Calculate mean
function calculateMean(data) {
    if (data.length === 0) return 0;
    return data.reduce((a, b) => a + b, 0) / data.length;
}

// Calculate median
function calculateMedian(data) {
    if (data.length === 0) return 0;
    const sorted = [...data].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

// Calculate standard deviation
function calculateStdDev(data) {
    if (data.length === 0) return 0;
    const mean = calculateMean(data);
    const variance = data.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / data.length;
    return Math.sqrt(variance);
}

// Calculate skewness
function calculateSkewness(data) {
    if (data.length < 3) return 0;
    const mean = calculateMean(data);
    const stdDev = calculateStdDev(data);
    if (stdDev === 0) return 0;
    
    const numerator = data.reduce((acc, val) => acc + Math.pow((val - mean) / stdDev, 3), 0);
    return numerator / data.length;
}

// Draw distribution visualization
function updateDistributionVisualization() {
    if (distributionData.length === 0) return;

    const width = distributionCanvas.parentElement.clientWidth;
    const height = 400;
    
    distributionCanvas.width = width;
    distributionCanvas.height = height;

    const padding = 50;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    // Clear canvas
    distCtx.fillStyle = '#ffffff';
    distCtx.fillRect(0, 0, width, height);

    // Find min and max for scaling
    const minValue = Math.min(...distributionData);
    const maxValue = Math.max(...distributionData);
    const range = maxValue - minValue || 1;

    // Create histogram bins
    const binCount = Math.max(10, Math.min(30, Math.floor(Math.sqrt(distributionData.length))));
    const bins = new Array(binCount).fill(0);
    const binWidth = range / binCount;

    distributionData.forEach(value => {
        const binIndex = Math.min(binCount - 1, Math.floor((value - minValue) / binWidth));
        bins[binIndex]++;
    });

    const maxBinValue = Math.max(...bins);

    // Draw bars
    const barWidth = chartWidth / binCount;
    distCtx.fillStyle = 'rgba(102, 126, 234, 0.7)';
    
    bins.forEach((count, i) => {
        const barHeight = (count / maxBinValue) * chartHeight;
        const x = padding + i * barWidth;
        const y = padding + chartHeight - barHeight;
        
        distCtx.fillRect(x, y, barWidth - 1, barHeight);
    });

    // Calculate bin centers for trend line
    const binCenters = bins.map((_, i) => minValue + (i + 0.5) * binWidth);

    // Draw trend line
    distCtx.strokeStyle = '#ef4444';
    distCtx.lineWidth = 3;
    distCtx.beginPath();
    
    bins.forEach((count, i) => {
        const barHeight = (count / maxBinValue) * chartHeight;
        const x = padding + (i + 0.5) * barWidth;
        const y = padding + chartHeight - barHeight;
        
        if (i === 0) {
            distCtx.moveTo(x, y);
        } else {
            distCtx.lineTo(x, y);
        }
    });
    distCtx.stroke();

    // Draw axes
    distCtx.strokeStyle = '#333';
    distCtx.lineWidth = 2;
    distCtx.beginPath();
    distCtx.moveTo(padding, padding);
    distCtx.lineTo(padding, padding + chartHeight);
    distCtx.lineTo(padding + chartWidth, padding + chartHeight);
    distCtx.stroke();

    // Draw mean and median lines
    const mean = calculateMean(distributionData);
    const median = calculateMedian(distributionData);

    // Mean line
    const meanX = padding + ((mean - minValue) / range) * chartWidth;
    distCtx.strokeStyle = '#667eea';
    distCtx.lineWidth = 2;
    distCtx.setLineDash([5, 5]);
    distCtx.beginPath();
    distCtx.moveTo(meanX, padding);
    distCtx.lineTo(meanX, padding + chartHeight);
    distCtx.stroke();

    // Median line
    const medianX = padding + ((median - minValue) / range) * chartWidth;
    distCtx.strokeStyle = '#764ba2';
    distCtx.lineWidth = 2;
    distCtx.setLineDash([5, 5]);
    distCtx.beginPath();
    distCtx.moveTo(medianX, padding);
    distCtx.lineTo(medianX, padding + chartHeight);
    distCtx.stroke();
    distCtx.setLineDash([]);

    // Draw legend
    const legendX = padding + 10;
    const legendY = padding + 10;
    distCtx.font = 'bold 12px Arial';
    distCtx.textAlign = 'left';
    distCtx.fillStyle = '#667eea';
    distCtx.fillText('▬ Mean', legendX, legendY);
    distCtx.fillStyle = '#764ba2';
    distCtx.fillText('▬ Median', legendX, legendY + 16);
    
    // Draw axis labels
    distCtx.font = '11px Arial';
    distCtx.fillStyle = '#333';
    distCtx.textAlign = 'center';
    distCtx.fillText('Value', padding + chartWidth / 2, height - 10);
    
    distCtx.save();
    distCtx.translate(10, padding + chartHeight / 2);
    distCtx.rotate(-Math.PI / 2);
    distCtx.fillText('Frequency', 0, 0);
    distCtx.restore();
}

// Update statistics display
function updateDistributionStatistics() {
    if (distributionData.length === 0) return;

    const mean = calculateMean(distributionData);
    const median = calculateMedian(distributionData);
    const stdDev = calculateStdDev(distributionData);
    const skewness = calculateSkewness(distributionData);

    computedMean.textContent = mean.toFixed(2);
    computedMedian.textContent = median.toFixed(2);
    computedStdDev.textContent = stdDev.toFixed(2);
    computedSkewness.textContent = skewness.toFixed(2);

    // Update insight
    updatePage2Insight(mean, median, stdDev, skewness);
}

function updatePage2Insight(mean, median, stdDev, skewness) {
    let insight = '';
    const difference = Math.abs(mean - median);

    if (difference < 1) {
        insight = `✓ The mean (${mean.toFixed(2)}) and median (${median.toFixed(2)}) are nearly equal. This indicates a symmetric distribution.`;
    } else if (mean > median) {
        insight = `⚠️ The mean (${mean.toFixed(2)}) is greater than the median (${median.toFixed(2)}) by ${difference.toFixed(2)}. This suggests a right-skewed (positive-skewed) distribution with a tail of larger values pulling the mean up.`;
    } else {
        insight = `⚠️ The mean (${mean.toFixed(2)}) is less than the median (${median.toFixed(2)}) by ${difference.toFixed(2)}. This suggests a left-skewed (negative-skewed) distribution with a tail of smaller values pulling the mean down.`;
    }

    insightTextPage2.textContent = insight;
}

// Event listeners for Page 2
meanSlider.addEventListener('input', () => {
    meanValue.textContent = meanSlider.value;
    generateDistribution();
});

medianSlider.addEventListener('input', () => {
    medianValue.textContent = medianSlider.value;
    generateDistribution();
});

datasetSizeSlider.addEventListener('input', () => {
    datasetSizeValue.textContent = datasetSizeSlider.value;
    generateDistribution();
});

generateDistributionBtn.addEventListener('click', generateDistribution);

// Handle resize for distribution canvas
window.addEventListener('resize', () => {
    if (document.getElementById('page2-tab').classList.contains('active')) {
        updateDistributionVisualization();
    }
});

// Initialize Page 2 on load
generateDistribution();
