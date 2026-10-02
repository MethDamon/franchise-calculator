"use strict";

function calculateYearlyCost(expenses, franchise, premium) {
  const annualPremium = 12 * premium;
  const quotePart = Math.min(Math.max(expenses - franchise, 0) * 0.1, 700);
  const medicalCost = Math.min(expenses, franchise) + quotePart;
  return { annualPremium, medicalCost, yearlyCost: annualPremium + medicalCost };
}

function findLowestCostRanges(options) {
  const structuralBreakpoints = [...new Set([
    0,
    ...options.flatMap(option => [option.franchise, option.franchise + 7000]),
  ])].sort((first, second) => first - second);
  const breakpoints = [...structuralBreakpoints];

  for (let index = 0; index < structuralBreakpoints.length; index += 1) {
    const start = structuralBreakpoints[index];
    const end = structuralBreakpoints[index + 1] ?? Infinity;
    const sample = Number.isFinite(end) ? (start + end) / 2 : start + Math.max(1, start * 0.1);
    const costs = options.map(option => calculateYearlyCost(sample, option.franchise, option.premium).yearlyCost);
    const slopes = options.map(option => sample < option.franchise ? 1 : sample < option.franchise + 7000 ? 0.1 : 0);

    for (let first = 0; first < options.length; first += 1) {
      for (let second = first + 1; second < options.length; second += 1) {
        const slopeDifference = slopes[first] - slopes[second];
        if (slopeDifference === 0) continue;
        const crossing = sample - (costs[first] - costs[second]) / slopeDifference;
        if (crossing > start && crossing < end) breakpoints.push(crossing);
      }
    }
  }

  const sortedBreakpoints = [...new Set(breakpoints)].sort((first, second) => first - second);
  const ranges = new Map(options.map(option => [option, []]));
  for (let index = 0; index < sortedBreakpoints.length; index += 1) {
    const start = sortedBreakpoints[index];
    const end = sortedBreakpoints[index + 1] ?? Infinity;
    const sample = Number.isFinite(end) ? start / 2 + end / 2 : start + Math.max(1, start * 0.1);
    const costs = options.map(option => calculateYearlyCost(sample, option.franchise, option.premium).yearlyCost);
    const minimum = Math.min(...costs);
    const tolerance = Number.EPSILON * 16 * Math.max(1, Math.abs(minimum));

    options.forEach((option, optionIndex) => {
      if (costs[optionIndex] - minimum > tolerance) return;
      const optionRanges = ranges.get(option);
      const previous = optionRanges.at(-1);
      if (previous && previous.end === start) previous.end = end;
      else optionRanges.push({ start, end });
    });
  }

  return ranges;
}

const form = document.querySelector("#calculator");
const expensesInput = document.querySelector("#expenses");
const rows = [...document.querySelectorAll("[data-franchise]")];
const recommendation = document.querySelector("#recommendation");
const resultDetail = document.querySelector("#result-detail");
const currency = new Intl.NumberFormat("en-CH", {
  style: "currency",
  currency: "CHF",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function updateComparison() {
  for (const input of form.querySelectorAll("input")) {
    input.setAttribute("aria-invalid", String(!input.validity.valid));
  }

  const options = [];
  const expensesEntered = expensesInput.value !== "";
  const expensesValid = expensesInput.validity.valid;
  let amountsTooLarge = false;
  for (const row of rows) {
    row.classList.remove("best");
    const premiumInput = row.querySelector("input");
    const cells = ["annual", "medical", "total", "range"].map(key => row.querySelector(`[data-${key}]`));
    if (!premiumInput.validity.valid) {
      for (const cell of cells) cell.textContent = "Unavailable";
      continue;
    }
    if (premiumInput.value === "") {
      for (const cell of cells) cell.textContent = "Not entered";
      continue;
    }

    const franchise = Number(row.dataset.franchise);
    const premium = premiumInput.valueAsNumber;
    const annualPremium = 12 * premium;
    if (!Number.isFinite(annualPremium)) {
      for (const cell of cells) cell.textContent = "Unavailable";
      continue;
    }
    cells[0].textContent = currency.format(annualPremium);

    const option = { row, franchise, premium };
    if (!expensesValid) {
      cells[1].textContent = "Unavailable";
      cells[2].textContent = "Unavailable";
    } else if (!expensesEntered) {
      cells[1].textContent = "Enter expenses";
      cells[2].textContent = "Enter expenses";
    } else {
      const costs = calculateYearlyCost(expensesInput.valueAsNumber, franchise, premium);
      if (!Object.values(costs).every(Number.isFinite)) {
        cells[1].textContent = "Unavailable";
        cells[2].textContent = "Unavailable";
        amountsTooLarge = true;
      } else {
        cells[1].textContent = currency.format(costs.medicalCost);
        cells[2].textContent = currency.format(costs.yearlyCost);
        option.cents = Math.round(costs.yearlyCost * 100);
      }
    }
    options.push(option);
  }

  if (!options.length) {
    recommendation.textContent = "Enter monthly premiums to compare.";
    resultDetail.textContent = "No example premiums are included.";
    return;
  }

  const lowestCostRanges = findLowestCostRanges(options);
  for (const option of options) {
    const ranges = lowestCostRanges.get(option);
    option.row.querySelector("[data-range]").textContent = ranges.length
      ? ranges.map(range => {
        if (range.start === 0 && range.end === Infinity) return "Any expense level";
        if (range.start === 0) return `Through ${currency.format(range.end)}`;
        if (range.end === Infinity) return `From ${currency.format(range.start)}`;
        return `${currency.format(range.start)} to ${currency.format(range.end)}`;
      }).join("; ")
      : "Not lowest-cost";
  }

  if (!expensesValid) {
    recommendation.textContent = "Enter valid, non-negative CHF amounts.";
    resultDetail.textContent = "Expense ranges are shown using valid entered premiums. Amounts may have up to two decimal places.";
    return;
  }
  if (!expensesEntered) {
    recommendation.textContent = "Enter projected yearly medical expenses to compare total costs.";
    resultDetail.textContent = "Expense ranges are shown using the entered monthly premiums.";
    return;
  }
  if (amountsTooLarge) {
    recommendation.textContent = "These amounts are too large to calculate.";
    resultDetail.textContent = "Enter smaller expenses or premiums.";
    return;
  }

  const minimum = Math.min(...options.map(option => option.cents));
  const winners = options.filter(option => option.cents === minimum);
  for (const winner of winners) winner.row.classList.add("best");
  const franchises = winners.map(winner => currency.format(winner.franchise)).join(", ");
  recommendation.textContent = winners.length === 1
    ? `${franchises} franchise has the lowest yearly cost.`
    : `${franchises} franchises tie for the lowest yearly cost.`;
  resultDetail.textContent = `${currency.format(minimum / 100)} per year among ${options.length} entered ${options.length === 1 ? "premium" : "premiums"}.`;
}

form.addEventListener("input", updateComparison);
form.addEventListener("submit", event => {
  event.preventDefault();
  updateComparison();
});
updateComparison();