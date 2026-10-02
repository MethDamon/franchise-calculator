# Franchise calculator

A static Swiss adult health insurance franchise calculator using native HTML, CSS and vanilla JavaScript. No dependencies, build step, account or server required. Inputs stay in the browser and are not sent anywhere.

Open `index.html` in a browser. Enter your actual monthly premiums for any of the six adult franchises; projected annual covered medical expenses are optional for expense ranges and required for yearly cost comparisons. Leave unavailable premiums blank. Results update as you type; all lowest-cost options are highlighted, including ties. Recommendations compare only the premiums entered, rounded to the nearest cent. The expense range column shows where each entered franchise has the lowest yearly cost; ranges can be disjoint when premium differences make a franchise competitive only at specific expense levels.

## Calculation

Annual cost = 12 x monthly premium + min(expenses, franchise) + min(0.1 x max(expenses - franchise, 0), 700).

This follows the supplied model. It excludes uncovered care, hospital contributions and other charges, and is not a guarantee of actual costs. Use comparable insurance quotes for the same person and year.

## GitHub Pages

1. Upload `index.html`, `styles.css` and `calculator.js` to the root of a GitHub repository.
2. Under **Settings > Pages**, select **Deploy from a branch**.
3. Select the branch containing these files and **/ (root)**, then save.

All asset paths are relative, so the calculator works on both repository and custom-domain Pages sites.