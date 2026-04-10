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
            // Initialize page 2 on first view
            if (!page2Initialized) {
                page2Initialized = true;
                generateDistribution();
            }
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
const distCtx = distributionCanvas ? distributionCanvas.getContext('2d') : null;

const computedMean = document.getElementById('computedMean');
const computedMedian = document.getElementById('computedMedian');
const computedStdDev = document.getElementById('computedStdDev');
const computedSkewness = document.getElementById('computedSkewness');
const insightTextPage2 = document.getElementById('insightTextPage2');

let distributionData = [];
let page2Initialized = false;

// Generate a dataset with specified mean and median
function generateDistribution() {
    const targetMean = parseFloat(meanSlider.value);
    const targetMedian = parseFloat(medianSlider.value);
    const size = parseInt(datasetSizeSlider.value, 10);

    // quick guards
    if (!size || size < 1) return;

    const n = size;
    const deltaAbs = Math.abs(targetMean - targetMedian);

    // If mean and median are very close, prefer a normal-based generator
    if (deltaAbs <= 2.0) {
        // choose initial sigma relative to targetMean (but at least 4)
        let sigma = Math.max(4, Math.abs(targetMean) * 0.12);
        sigma = Math.min(sigma, Math.max(4, Math.abs(targetMean) * 0.5));

        let candidate = [];
        let iter = 0;
        do {
            candidate = [];
            for (let i = 0; i < n; i++) {
                candidate.push(targetMean + gaussianRandom(0, sigma));
            }

            // shift to exact mean
            const curMean = calculateMean(candidate);
            const shift = targetMean - curMean;
            candidate = candidate.map(v => v + shift);

            // if negatives appear, reduce sigma and retry
            const minVal = Math.min(...candidate);
            if (minVal >= 1) break;
            sigma *= 0.85;
            iter++;
        } while (iter < 60);

        distributionData = candidate.map(v => Math.max(1, v));

        const actualMean = calculateMean(distributionData);
        const actualMedian = calculateMedian(distributionData);
        console.log(`[Page2/NORMAL] n=${n} targetMean=${targetMean} mean=${actualMean.toFixed(3)} targetMedian=${targetMedian} median=${actualMedian.toFixed(3)} sigma=${sigma.toFixed(3)}`);

        updateDistributionVisualization();
        updateDistributionStatistics();
        return;
    }

    // Otherwise use skewed solver (existing approach)
    const expCandidates = [1.05, 1.15, 1.3, 1.6, 2.0];
    const skewCandidates = [0.02, 0.05, 0.1, 0.2, 0.4, 0.7];
    const medianIndex = (n - 1) / 2;
    const delta = targetMean - targetMedian;
    let best = null;

    outer: for (let exp of expCandidates) {
        for (let skew of skewCandidates) {
            const sign = delta >= 0 ? 1 : -1;
            const rightFactor = 1 + sign * skew;
            const leftFactor = 1 - sign * skew;

            const baseOffsets = new Array(n);
            for (let i = 0; i < n; i++) {
                const d = i - medianIndex;
                const absd = Math.abs(d);
                const base = absd > 0 ? Math.pow(absd, exp) : 0;
                const factor = d >= 0 ? rightFactor : leftFactor;
                baseOffsets[i] = (d >= 0 ? 1 : -1) * base * factor;
            }

            const bMean = calculateMean(baseOffsets);
            const bMedian = calculateMedian(baseOffsets);
            const denom = bMean - bMedian;
            if (Math.abs(denom) < 1e-8) continue;

            let s = (targetMean - targetMedian) / denom;
            let t = -s * bMedian;

            let candidate = baseOffsets.map(o => targetMedian + s * o + t);

            let iter2 = 0;
            while (Math.min(...candidate) < 1 && iter2++ < 60) {
                s *= 0.88;
                t = -s * bMedian;
                candidate = baseOffsets.map(o => targetMedian + s * o + t);
            }

            const meanVal = calculateMean(candidate);
            const medianVal = calculateMedian(candidate);
            const maxErr = Math.max(Math.abs(meanVal - targetMean), Math.abs(medianVal - targetMedian));
            if (maxErr <= 1.0) {
                distributionData = candidate.map(v => Math.max(1, v));
                break outer;
            }

            if (!best || maxErr < best.err) best = { distribution: candidate.slice(), err: maxErr };
        }
    }

    if (!distributionData.length) {
        if (best) distributionData = best.distribution.map(v => Math.max(1, v));
        else {
            const arr = new Array(n);
            const mid = Math.floor(n / 2);
            for (let i = 0; i < n; i++) {
                if (n % 2 === 1 && i === mid) arr[i] = targetMedian;
                else if (i < mid) arr[i] = targetMedian - (mid - i);
                else arr[i] = targetMedian + (i - mid + (n % 2 === 0 ? 1 : 0));
            }

            const currentSum = arr.reduce((a, b) => a + b, 0);
            let diff = targetMean * n - currentSum;
            let idx = n - 1;
            let pass = 0;
            while (Math.abs(diff) > 1e-6 && pass < 1000) {
                const add = Math.sign(diff) * Math.max(1e-3, Math.abs(diff) / (idx + 1));
                arr[idx] += add;
                diff -= add;
                idx--;
                if (idx < 0) { idx = n - 1; pass++; }
            }

            distributionData = arr.map(v => Math.max(1, v));
        }
    }

    const actualMean = calculateMean(distributionData);
    const actualMedian = calculateMedian(distributionData);
    console.log(`[Page2/SKEW] n=${n} targetMean=${targetMean} mean=${actualMean.toFixed(3)} targetMedian=${targetMedian} median=${actualMedian.toFixed(3)}`);

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

    const canvas = document.getElementById('distributionViz');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.parentElement.clientWidth;
    const height = 400;
    
    canvas.width = width;
    canvas.height = height;

    const padding = 50;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    // Clear canvas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

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
    ctx.fillStyle = 'rgba(102, 126, 234, 0.7)';
    
    bins.forEach((count, i) => {
        const barHeight = (count / maxBinValue) * chartHeight;
        const x = padding + i * barWidth;
        const y = padding + chartHeight - barHeight;
        
        ctx.fillRect(x, y, barWidth - 1, barHeight);
    });

    // Calculate bin centers for trend line
    const binCenters = bins.map((_, i) => minValue + (i + 0.5) * binWidth);

    // Draw trend line
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 3;
    ctx.beginPath();
    
    bins.forEach((count, i) => {
        const barHeight = (count / maxBinValue) * chartHeight;
        const x = padding + (i + 0.5) * barWidth;
        const y = padding + chartHeight - barHeight;
        
        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    });
    ctx.stroke();

    // Draw axes
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, padding + chartHeight);
    ctx.lineTo(padding + chartWidth, padding + chartHeight);
    ctx.stroke();

    // Draw x-axis labels (value range)
    ctx.font = '11px Arial';
    ctx.fillStyle = '#666';
    ctx.textAlign = 'center';
    const xLabelCount = 5;
    for (let i = 0; i <= xLabelCount; i++) {
        const x = padding + (i / xLabelCount) * chartWidth;
        const value = minValue + (i / xLabelCount) * range;
        ctx.fillText(value.toFixed(0), x, padding + chartHeight + 15);
    }

    // Draw y-axis labels (frequency)
    ctx.textAlign = 'right';
    const yLabelCount = 4;
    for (let i = 0; i <= yLabelCount; i++) {
        const y = padding + chartHeight - (i / yLabelCount) * chartHeight;
        const value = Math.round((i / yLabelCount) * maxBinValue);
        ctx.fillText(value.toString(), padding - 10, y + 4);
    }

    // Draw mean and median lines
    const mean = calculateMean(distributionData);
    const median = calculateMedian(distributionData);

    // Mean line
    const meanX = padding + ((mean - minValue) / range) * chartWidth;
    ctx.strokeStyle = '#667eea';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(meanX, padding);
    ctx.lineTo(meanX, padding + chartHeight);
    ctx.stroke();

    // Mean label
    ctx.setLineDash([]);
    ctx.fillStyle = '#667eea';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`μ: ${mean.toFixed(1)}`, meanX, padding - 10);

    // Median line
    const medianX = padding + ((median - minValue) / range) * chartWidth;
    ctx.strokeStyle = '#764ba2';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(medianX, padding);
    ctx.lineTo(medianX, padding + chartHeight);
    ctx.stroke();

    // Median label
    ctx.setLineDash([]);
    ctx.fillStyle = '#764ba2';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`M: ${median.toFixed(1)}`, medianX, padding + 12);

    // Draw legend
    const legendX = padding + 15;
    const legendY = padding + 35;
    ctx.font = 'bold 11px Arial';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#667eea';
    ctx.fillText('μ = Mean', legendX, legendY);
    ctx.fillStyle = '#764ba2';
    ctx.fillText('M = Median', legendX, legendY + 16);
    
    // Draw axis labels
    ctx.font = '11px Arial';
    ctx.fillStyle = '#333';
    ctx.textAlign = 'center';
    ctx.fillText('Value', padding + chartWidth / 2, height - 10);
    
    ctx.save();
    ctx.translate(10, padding + chartHeight / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Frequency', 0, 0);
    ctx.restore();
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
if (meanSlider) {
    meanSlider.addEventListener('input', () => {
        meanValue.textContent = meanSlider.value;
        generateDistribution();
    });
}

if (medianSlider) {
    medianSlider.addEventListener('input', () => {
        medianValue.textContent = medianSlider.value;
        generateDistribution();
    });
}

if (datasetSizeSlider) {
    datasetSizeSlider.addEventListener('input', () => {
        datasetSizeValue.textContent = datasetSizeSlider.value;
        generateDistribution();
    });
}

if (generateDistributionBtn) {
    generateDistributionBtn.addEventListener('click', generateDistribution);
}

// Handle resize for distribution canvas
window.addEventListener('resize', () => {
    if (document.getElementById('page2-tab').classList.contains('active')) {
        updateDistributionVisualization();
    }
});
