// Illustrative storage units, not aircraft measurements.
const scenarios = { gaps: [3, 3, 3, 2], fits: [2, 1, 2, 1, 2, 1, 2], full: [3, 3, 3, 3, 2] };
let bags = [...scenarios.gaps];
let boarded = 0;
const $ = id => document.getElementById(id);

// Recompute from the boarded prefix so reset and scenario changes stay simple.
function simulate(sequence) {
  let sharedSpace = 12;
  const bins = [4, 4, 4];
  const sharedStored = [], sharedChecked = [], separateChecked = [];
  const binBags = [[], [], []];
  sequence.forEach((size, index) => {
    const bag = { size, passenger: index + 1 };
    if (size <= sharedSpace) {
      sharedSpace -= size;
      sharedStored.push(bag);
    } else sharedChecked.push(bag);

    const bin = bins.findIndex(space => space >= size);
    if (bin !== -1) {
      bins[bin] -= size;
      binBags[bin].push(bag);
    } else separateChecked.push(bag);
  });
  return { sharedSpace, bins, sharedStored, sharedChecked, separateChecked, binBags };
}

function bagMarkup(bag, capacity) {
  return `<div class="stored-bag" style="width:${bag.size / capacity * 100}%" title="Passenger ${bag.passenger}: ${bag.size} units">P${bag.passenger}</div>`;
}

function showChecked(id, checked) {
  $(id).classList.toggle('has-bags', checked.length > 0);
  $(id).innerHTML = checked.length ? 'Gate-checked: ' + checked.map(bag => `<span class="gate-bag">P${bag.passenger} · ${bag.size}u</span>`).join('') : 'No gate-checked bags';
}

function render() {
  const state = simulate(bags.slice(0, boarded));
  $('queue').innerHTML = bags.map((size, index) => `<div class="passenger ${index < boarded ? 'boarded' : index === boarded ? 'next' : ''}"><span>P${String(index + 1).padStart(2, '0')} ${index < boarded ? ' / BOARDED' : index === boarded ? ' / NEXT' : ''}</span><strong><i class="bag-icon" aria-hidden="true"></i>${size} units</strong></div>`).join('');
  $('progress').textContent = `${boarded} of ${bags.length} boarded`;
  $('next').disabled = boarded === bags.length;
  $('next').innerHTML = boarded === bags.length ? 'Boarding complete ✓' : 'Board next passenger <span>→</span>';
  $('shared-storage').innerHTML = state.sharedStored.map(bag => bagMarkup(bag, 12)).join('');
  $('separate-storage').innerHTML = state.binBags.map((bin, index) => `<div class="storage" aria-label="Bin ${index + 1}: ${state.bins[index]} units remaining">${bin.map(bag => bagMarkup(bag, 4)).join('')}</div>`).join('');
  $('shared-left').textContent = state.sharedSpace;
  $('separate-left').textContent = state.bins.reduce((total, space) => total + space, 0);
  $('shared-checked').textContent = state.sharedChecked.length;
  $('separate-checked').textContent = state.separateChecked.length;
  showChecked('shared-gate', state.sharedChecked);
  showChecked('separate-gate', state.separateChecked);
  let title = 'Meet the next passenger.';
  let message = 'Board one passenger at a time and watch both models respond to the same bag.';
  if (boarded > 0) {
    const sharedRejected = state.sharedChecked.some(bag => bag.passenger === boarded);
    const separateRejected = state.separateChecked.some(bag => bag.passenger === boarded);
    if (!sharedRejected && separateRejected) {
      title = 'Empty space isn’t always usable space.';
      message = `P${boarded}’s ${bags[boarded - 1]}-unit bag fits in the shared model, but no separate bin has enough room. The remaining gaps cannot be combined.`;
    } else if (sharedRejected && separateRejected) {
      title = 'This bag doesn’t fit in either model.';
      message = `P${boarded} is gate-checked in both models. The shared model has ${state.sharedSpace} units left; the largest bin has ${Math.max(...state.bins)}.`;
    } else if (sharedRejected) {
      title = 'Earlier decisions change later outcomes.';
      message = `P${boarded} fits in a separate bin but not the shared model, which accepted different bags earlier.`;
    } else {
      title = boarded === bags.length ? 'Everyone has boarded. Compare the outcomes.' : `P${boarded}’s bag fits in both models.`;
      message = `Shared space remaining: ${state.sharedSpace} units. Separate bins: ${state.bins.join(' + ')} units. ${boarded === bags.length ? 'Try another sequence to test when the models agree or diverge.' : 'Keep boarding to see whether those gaps will matter.'}`;
    }
  }
  $('insight-title').textContent = title;
  $('insight-text').textContent = message;
}

$('next').addEventListener('click', () => { if (boarded < bags.length) boarded++; render(); });
$('reset').addEventListener('click', () => { boarded = 0; render(); });
$('scenario').addEventListener('change', event => {
  const custom = event.target.value === 'custom';
  $('custom-panel').hidden = !custom;
  if (!custom) { bags = [...scenarios[event.target.value]]; boarded = 0; render(); }
});
$('apply').addEventListener('click', () => {
  const values = $('custom').value.split(',').map(value => value.trim());
  if (values.length > 16 || values.some(value => !/^[123]$/.test(value))) {
    $('error').textContent = 'Enter 1–16 bag sizes using only 1, 2, or 3, separated by commas.';
    return;
  }
  $('error').textContent = '';
  bags = values.map(Number);
  boarded = 0;
  render();
});
render();
