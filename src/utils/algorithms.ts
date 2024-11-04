/**
 * Implementation of the Wilson Score Formula.
 */
const wilsonScore = (ups: number, downs: number, confidence: number = 1.96) => {
    const n = ups + downs;
    if (n === 0) return 0;  

    const p = ups / n;
    const z = confidence;

    const numerator = p + (z * z) / (2 * n) - z * Math.sqrt((p * (1 - p) + (z * z) / (4 * n)) / n);
    const denominator = 1 + (z * z) / n;

    return numerator / denominator;
};

export { wilsonScore };