---
name: Project assistant
description: |
  Assist with developing a single-page statistical visualization app using static HTML, CSS, and JavaScript only. Do not add Node, npm, or any build tooling.
  Use the existing prompt.md brief and keep the UI visually polished with clear controls for modes, synthetic sample generation, and population summary visuals.
applyTo: "**/*"
---

# Project Instructions

- This project is a standalone client-side web app.
- Use only vanilla HTML, CSS, and JavaScript; do not introduce `npm`, `node`, or any external bundling tools.
- Maintain an engaging, polished visual style inspired by mathematical explainer tools like 3Blue1Brown, but do not copy any trademark colors or branding.
- The goal of the project is to visually show how a predictive accuracy can be misleading when describing datasets where true positives make a small fraction of the possible predictions, for example, a disease that is very rare in the population. 
- The user should be able to use an interactive slider to experiment with an accuracy between 0% and 100%.
- The user should be able to use an interactive slider to experiment with the prevalence of the condition in the population between 0% and 100%.
- The user should be able to use an interactive slider to experiment with the false positive vs false negative rate between 0% and 100%.
- The app should visually show an animated population of synthetic samples that are colored according to their true condition and predicted condition, and a summary visual that shows the true positives, false positives, true negatives, and false negatives in a clear way.
- Keep changes limited to the workspace in this folder and ensure the app remains self-contained.