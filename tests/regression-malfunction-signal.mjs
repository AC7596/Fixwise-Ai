// ========================================
// Regression test: whole-word malfunction-signal matching
// ========================================
// Covers the bug where hasMalfunctionSignal() in js/api/ai-client.js used
// plain substring checks (text.includes(word)), which could false-positive
// on words like "spark" matching inside "sparkling", "trip" inside
// "triple", "dead" inside "deadline", or "crack" inside "crackers". It now
// reuses the whole-word regex matcher from js/data/safety-data.js.
//
// Run with: node tests/regression-malfunction-signal.mjs
// No dependencies beyond Node's built-in `assert` — safe to run anywhere,
// including CI, without installing anything extra.
import assert from 'node:assert/strict';
import { diagnoseProblem } from '../js/api/ai-client.js';

const cases = [
  {
    label: '"I want to replace my outlets." is NOT treated as a malfunction (core PR fix)',
    category: 'Electrical',
    text: 'I want to replace my outlets.',
    expectFollowUp: true
  },
  {
    label: 'a genuinely broken/dead outlet IS treated as a malfunction',
    category: 'Electrical',
    text: 'My outlet is not working, it seems dead.',
    expectFollowUp: false
  },
  {
    label: '"sparkling" (unrelated word) must NOT match the "spark" malfunction signal',
    category: 'Electrical',
    text: 'I want to replace my outlet, it keeps sparkling in the sunlight display case.',
    expectFollowUp: true
  },
  {
    label: '"sparking" (real malfunction word) MUST match the "spark" signal',
    category: 'Electrical',
    text: 'I want to replace my outlet, it is actually sparking when I plug something in.',
    expectFollowUp: false
  },
  {
    label: '"deadbolt" must NOT match the "dead" malfunction signal',
    category: 'Doors & Windows',
    text: 'We want to replace the deadbolt on the front door.',
    expectFollowUp: true
  },
  {
    label: '"triple-pane" must NOT match the "trip" malfunction signal',
    category: 'Doors & Windows',
    text: 'Thinking about buying a triple-pane replacement window.',
    expectFollowUp: true
  },
  {
    label: '"tripping" (real malfunction word) MUST match the "trip" signal',
    category: 'Electrical',
    text: 'The breaker keeps tripping when I run the microwave.',
    expectFollowUp: false
  },
  {
    label: '"cracked" (real malfunction word) MUST match the "crack" signal',
    category: 'Structural',
    text: 'We are considering replacing the cracked tile by the tub.',
    expectFollowUp: false
  }
];

let pass = 0;
for (const c of cases) {
  const res = await diagnoseProblem({ category: c.category, problem: c.text });
  assert.equal(Boolean(res.needsFollowUp), c.expectFollowUp, c.label);
  console.log(`PASS: ${c.label}`);
  pass += 1;
}

console.log(`\nregression-malfunction-signal.mjs: ${pass}/${cases.length} passed`);
