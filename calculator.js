"use strict";

function calculateYearlyCost(expenses, franchise, premium) {
  const annualPremium = 12 * premium;
  const quotePart = Math.min(Math.max(expenses - franchise, 0) * 0.1, 700);
  const medicalCost = Math.min(expenses, franchise) + quotePart;
  return { annualPremium, medicalCost, yearlyCost: annualPremium + medicalCost };
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
  const inputs = [...form.querySelectorAll("input")];
  const invalidInputs = inputs.filter(input => !input.validity.valid);
  for (const input of inputs) {
    input.setAttribute("aria-invalid", String(invalidInputs.includes(input)));
  }

  const options = [];
  for (const row of rows) {
    row.classList.remove("best");
    const premiumInput = row.querySelector("input");
    const cells = ["annual", "medical", "total"].map(key => row.querySelector(`[data-${key}]`));
    if (invalidInputs.length || premiumInput.value === "") {
      for (const cell of cells) cell.textContent = invalidInputs.length ? "Unavailable" : "Not entered";
      continue;
    }

    const franchise = Number(row.dataset.franchise);
    const costs = calculateYearlyCost(expensesInput.valueAsNumber, franchise, premiumInput.valueAsNumber);
    if (!Object.values(costs).every(Number.isFinite)) {
      for (const cell of cells) cell.textContent = "Unavailable";
      recommendation.textContent = "These amounts are too large to calculate.";
      resultDetail.textContent = "Enter smaller expenses or premiums.";
      return;
    }
    cells[0].textContent = currency.format(costs.annualPremium);
    cells[1].textContent = currency.format(costs.medicalCost);
    cells[2].textContent = currency.format(costs.yearlyCost);
    options.push({ row, franchise, cents: Math.round(costs.yearlyCost * 100) });
  }

  if (invalidInputs.length) {
    recommendation.textContent = "Enter valid, non-negative CHF amounts.";
    resultDetail.textContent = "Yearly expenses are required. Amounts may have up to two decimal places.";
    return;
  }
  if (!options.length) {
    recommendation.textContent = "Enter monthly premiums to compare.";
    resultDetail.textContent = "No example premiums are included.";
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