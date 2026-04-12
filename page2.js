// ============================================
// PAGE 2: Mean vs Median Visualizer (moved from script.js)
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
let distributionChart = null;

// Plugin: draw vertical lines for mean (μ) and median (M) on the Chart.js histogram
const meanMedianPlugin = {
    id: 'meanMedianPlugin',
    afterDraw: (chart) => {
        if (!chart || !chart.data || !chart.data.labels || chart.data.labels.length === 0) return;
        const ctx = chart.ctx;
        const { top, bottom } = chart.chartArea || {};
        const xScale = chart.scales && chart.scales['x'];
        if (!xScale || top === undefined || bottom === undefined) return;

        // Parse numeric centers from labels
        const centers = chart.data.labels.map(l => Number(l));
        if (!centers || centers.length === 0) return;

        const mean = calculateMean(distributionData || []);
        const median = calculateMedian(distributionData || []);

        const draw = (value, color, label) => {
            if (typeof value !== 'number' || Number.isNaN(value)) return;
            // find closest center index
            let closestIdx = 0;
            let minDiff = Number.POSITIVE_INFINITY;
            for (let i = 0; i < centers.length; i++) {
                const d = Math.abs(centers[i] - value);
                if (d < minDiff) { minDiff = d; closestIdx = i; }
            }

            // Determine pixel x coordinate robustly (prefer element.x, then scale lookup, then proportional fallback)
            let x;
            const meta = chart.getDatasetMeta && chart.getDatasetMeta(0);
            if (meta && meta.data && meta.data[closestIdx] && typeof meta.data[closestIdx].x === 'number') {
                x = meta.data[closestIdx].x;
            } else {
                const labelValue = chart.data.labels[closestIdx];
                if (xScale && typeof xScale.getPixelForValue === 'function') {
                    x = xScale.getPixelForValue(labelValue);
                } else {
                    // fallback: compute proportional position inside chart area
                    const left = chart.chartArea.left;
                    const right = chart.chartArea.right;
                    x = left + ((closestIdx + 0.5) / centers.length) * (right - left);
                }
            }

            // Clamp x inside chart area
            const left = chart.chartArea.left;
            const right = chart.chartArea.right;
            if (x < left) x = left + 6;
            if (x > right) x = right - 6;

            ctx.save();
            ctx.beginPath();
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            ctx.setLineDash([6, 4]);
            ctx.moveTo(x, top);
            ctx.lineTo(x, bottom);
            ctx.stroke();
            ctx.setLineDash([]);

            // Position label to the right of the line, clamped inside chart area
            const labelText = `${label}: ${value.toFixed(1)}`;
            ctx.font = '12px Arial';
            const offset = 8;
            const padding = 6;
            let labelX = x + offset;
            const textWidth = ctx.measureText(labelText).width;
            const rightLimit = chart.chartArea.right - padding;
            const leftLimit = chart.chartArea.left + padding;
            if (labelX + textWidth > rightLimit) {
                // fallback to left side of the line
                labelX = x - offset - textWidth;
            }
            if (labelX < leftLimit) labelX = leftLimit;
            let labelY = top + 16;
            if (labelY > bottom - 6) labelY = bottom - 6;
            ctx.fillStyle = color;
            ctx.textAlign = 'left';
            ctx.fillText(labelText, labelX, labelY);
            ctx.restore();
        };

        draw(mean, '#667eea', 'μ');
        draw(median, '#764ba2', 'M');
    }
};
Chart.register(meanMedianPlugin);

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
// Gaussian sampler: prefer d3.randomNormal when available, fallback to Box–Muller
function gaussianRandom(mean = 0, stdev = 1) {
    if (typeof d3 !== 'undefined' && typeof d3.randomNormal === 'function') {
        // d3.randomNormal(mu, sigma) returns a generator function
        try {
            return d3.randomNormal(mean, stdev)();
        } catch (e) {
            // fallback to Box-Muller below
        }
    }

    // Fallback: Box–Muller transform
    const u = 1 - Math.random();
    const v = Math.random();
    const z0 = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    return z0 * stdev + mean;
}

// Calculate mean (use simple-statistics if available)
function calculateMean(data) {
    if (typeof ss !== 'undefined' && typeof ss.mean === 'function') return ss.mean(data);
    if (data.length === 0) return 0;
    return data.reduce((a, b) => a + b, 0) / data.length;
}

// Calculate median (use simple-statistics if available)
function calculateMedian(data) {
    if (typeof ss !== 'undefined' && typeof ss.median === 'function') return ss.median(data);
    if (data.length === 0) return 0;
    const sorted = [...data].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

// Calculate standard deviation (use simple-statistics if available)
function calculateStdDev(data) {
    if (typeof ss !== 'undefined' && typeof ss.standardDeviation === 'function') return ss.standardDeviation(data);
    if (data.length === 0) return 0;
    const mean = calculateMean(data);
    const variance = data.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / data.length;
    return Math.sqrt(variance);
}

// Calculate skewness (use simple-statistics if available)
function calculateSkewness(data) {
    if (typeof ss !== 'undefined' && typeof ss.sampleSkewness === 'function') return ss.sampleSkewness(data);
    if (data.length < 3) return 0;
    const mean = calculateMean(data);
    const stdDev = calculateStdDev(data);
    if (stdDev === 0) return 0;
    const numerator = data.reduce((acc, val) => acc + Math.pow((val - mean) / stdDev, 3), 0);
    return numerator / data.length;
}

// Draw distribution visualization using Chart.js
function updateDistributionVisualization() {
    if (distributionData.length === 0) return;

    const canvas = document.getElementById('distributionViz');
    if (!canvas) return;

    const width = canvas.parentElement.clientWidth;
    const height = 400;
    canvas.width = width;
    canvas.height = height;

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

    const binCenters = bins.map((_, i) => minValue + (i + 0.5) * binWidth);
    const labels = binCenters.map(v => Math.round(v).toString());

    // Use Chart.js to render histogram and a smoothed trendline
    const ctx = canvas.getContext('2d');

    // Simple moving-average smoother for trendline
    const smoothBins = (arr, windowSize = 3) => {
        const n = arr.length;
        if (n === 0) return [];
        const out = new Array(n).fill(0);
        const half = Math.floor(windowSize / 2);
        for (let i = 0; i < n; i++) {
            let sum = 0, count = 0;
            for (let j = i - half; j <= i + half; j++) {
                if (j >= 0 && j < n) { sum += arr[j]; count++; }
            }
            out[i] = count > 0 ? sum / count : 0;
        }
        return out;
    };

    const smoothWindow = Math.max(3, Math.floor(binCount / 6));
    const trendData = smoothBins(bins, smoothWindow);

    if (!distributionChart) {
        distributionChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Frequency',
                        data: bins,
                        backgroundColor: 'rgba(102, 126, 234, 0.8)',
                        borderColor: 'rgba(102, 126, 234, 1)',
                        borderWidth: 1,
                        order: 1
                    },
                    {
                        type: 'line',
                        label: 'Trend',
                        data: trendData,
                        borderColor: '#ef4444',
                        borderWidth: 3,
                        tension: 0.4,
                        fill: false,
                        pointRadius: 0,
                        order: 2
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: { title: { display: true, text: 'Value' } },
                    y: { title: { display: true, text: 'Frequency' }, beginAtZero: true }
                },
                plugins: {
                    legend: { display: false }
                }
            }
        });
    } else {
        distributionChart.data.labels = labels;
        // Ensure datasets exist
        if (!distributionChart.data.datasets || distributionChart.data.datasets.length === 0) {
            distributionChart.data.datasets = [{ label: 'Frequency', data: bins }];
        }
        distributionChart.data.datasets[0].data = bins;
        if (distributionChart.data.datasets.length < 2) {
            distributionChart.data.datasets.push({
                type: 'line',
                label: 'Trend',
                data: trendData,
                borderColor: '#ef4444',
                borderWidth: 3,
                tension: 0.4,
                fill: false,
                pointRadius: 0,
                order: 2
            });
        } else {
            distributionChart.data.datasets[1].data = trendData;
        }

        distributionChart.update();
    }
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
