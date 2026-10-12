// A deterministic capacity model. Values are illustrative, not flight data.
function estimateBags(passengers, carryOnPercent, capacity) {
  const bags = Math.round(passengers * carryOnPercent / 100);
  const gateChecked = Math.max(0, bags - capacity);
  const fit = bags - gateChecked;
  const percent = bags === 0 ? null : gateChecked / bags * 100;
  return { bags, gateChecked, fit, percent };
}

const estimator = document.getElementById('estimate-form');
const passengerInput = document.getElementById('passengers');
const rateInput = document.getElementById('carry-rate');
const capacityInput = document.getElementById('capacity');
const write = (id, text) => { document.getElementById(id).textContent = text; };
const formatPercent = value => value === null ? 'N/A' : value.toFixed(1) + '%';

function comparisonText(before, after) {
  if (after.percent === null) return 'No overhead bags remain in this scenario; percentage is N/A.';
  if (before.percent === null) return 'No overhead bags to compare; percentage is N/A.';
  const reduction = before.percent - after.percent;
  return `${formatPercent(before.percent)} → ${formatPercent(after.percent)} · ${after.gateChecked} of ${after.bags} bags gate-checked (${reduction.toFixed(1)} percentage-point reduction).`;
}

function updateEstimate() {
  const valid = estimator.checkValidity();
  document.getElementById('apply-less').disabled = !valid;
  document.getElementById('apply-more').disabled = !valid;
  write('estimate-error', valid ? '' : 'Use whole numbers: 0–1,000 passengers, 0–100% carry-ons, and 0–1,000 bag spaces.');
  if (!valid) {
    write('estimate-percent', '—');
    ['estimate-counts', 'estimate-math', 'estimate-empty', 'less-result', 'more-result'].forEach(id => write(id, ''));
    document.getElementById('fit-bar').style.width = '0%';
    document.getElementById('check-bar').style.width = '0%';
    return;
  }
  const passengers = Number(passengerInput.value);
  const rate = Number(rateInput.value);
  const capacity = Number(capacityInput.value);
  const result = estimateBags(passengers, rate, capacity);
  write('estimate-percent', formatPercent(result.percent));
  write('estimate-counts', `${result.gateChecked} of ${result.bags} carry-on bags gate-checked · ${result.fit} fit overhead`);
  write('estimate-math', `Bag demand: round(${passengers} × ${rate} ÷ 100) = ${result.bags}. Overflow: max(0, ${result.bags} − ${capacity}) = ${result.gateChecked}.`);
  write('estimate-empty', result.bags === 0 ? 'No carry-on bags: a percentage has no denominator.' : `Gate-check share: ${result.gateChecked} ÷ ${result.bags} × 100. This is a share of bags, not a passenger’s probability.`);
  document.getElementById('fit-bar').style.width = (result.bags ? 100 - result.percent : 0) + '%';
  document.getElementById('check-bar').style.width = (result.percent || 0) + '%';
  write('less-result', comparisonText(result, estimateBags(passengers, Math.max(0, rate - 10), capacity)));
  write('more-result', comparisonText(result, estimateBags(passengers, rate, Math.min(1000, capacity + 20))));
  document.getElementById('apply-less').disabled = rate === 0;
  document.getElementById('apply-more').disabled = capacity === 1000;
}

estimator.addEventListener('input', updateEstimate);
estimator.addEventListener('submit', event => event.preventDefault());
document.getElementById('estimate-reset').addEventListener('click', () => { estimator.reset(); updateEstimate(); });
document.getElementById('apply-less').addEventListener('click', () => { rateInput.value = Math.max(0, Number(rateInput.value) - 10); updateEstimate(); });
document.getElementById('apply-more').addEventListener('click', () => { capacityInput.value = Math.min(1000, Number(capacityInput.value) + 20); updateEstimate(); });
updateEstimate();
