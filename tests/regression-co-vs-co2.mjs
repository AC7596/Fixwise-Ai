// ========================================
// Regression test: carbon monoxide (CO) vs carbon dioxide (CO2)
// ========================================
// Covers the bug where the carbon-monoxide STOP-level safety signal in
// js/data/safety-data.js included a 'co2 alarm' keyword, causing an
// ordinary CO2 (carbon dioxide) alert to be misclassified as a genuine
// carbon-monoxide emergency just because "CO" appears inside "CO2". CO and
// CO2 are now completely separate signals at different severities.
//
// Run with: node tests/regression-co-vs-co2.mjs
import assert from 'node:assert/strict';
import { assessRisk, RISK_LEVEL } from '../js/data/safety-data.js';

const cases = [
  { label: '"CO alarm" triggers the carbon-monoxide STOP response', text: 'My CO alarm just went off.', expect: RISK_LEVEL.STOP },
  { label: '"carbon monoxide alarm" triggers the STOP response', text: 'Carbon monoxide alarm is beeping in the hallway.', expect: RISK_LEVEL.STOP },
  { label: '"CO detector going off" triggers the STOP response', text: 'The CO detector going off in the basement.', expect: RISK_LEVEL.STOP },
  { label: '"carbon monoxide detector" alarming triggers the STOP response', text: 'The carbon monoxide detector is alarming right now.', expect: RISK_LEVEL.STOP },
  { label: '"CO2 alarm" does NOT trigger the carbon-monoxide STOP response', text: 'My CO2 alarm went off in the greenhouse.', expect: RISK_LEVEL.CAUTION },
  { label: '"carbon dioxide alarm" is not misclassified as carbon monoxide', text: 'The carbon dioxide alarm in the grow room is beeping.', expect: RISK_LEVEL.CAUTION },
  { label: '"CO2 levels" high reading is handled at a lower severity', text: 'CO2 levels seem high according to my monitor.', expect: RISK_LEVEL.CAUTION }
];

let pass = 0;
for (const c of cases) {
  const res = assessRisk(c.text);
  assert.equal(res.level, c.expect, `${c.label} (got level="${res.level}")`);
  console.log(`PASS: ${c.label}`);
  pass += 1;
}

// A CO2 mention should never itself escalate to STOP, but if genuine CO
// language is *also* present in the same description, the real emergency
// must still win (highest-severity match wins) — CO2 handling must never
// weaken legitimate CO protection.
const mixed = assessRisk('The CO2 monitor is fine but the CO alarm is going off too.');
assert.equal(mixed.level, RISK_LEVEL.STOP, 'a real CO alarm mentioned alongside CO2 text still triggers STOP');
console.log('PASS: a real CO alarm mentioned alongside CO2 text still triggers STOP');
pass += 1;

console.log(`\nregression-co-vs-co2.mjs: ${pass}/${cases.length + 1} passed`);
