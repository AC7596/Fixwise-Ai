// ========================================
// Regression test: CO vs CO2 follow-up/refine diagnosis flow
// ========================================
// Covers a live-testing bug found after regression-co-vs-co2.mjs and
// regression-diagnosis-followup.mjs already passed: when a user starts with
// the genuinely ambiguous "my CO2 alarm is going off" (matching the
// CAUTION-level carbon-dioxide signal, which asks a CO-vs-CO2 clarifying
// question) and then answers the follow-up with "it says CO carbon
// monoxide", the *combined* session text (original message + follow-up
// answer) matched BOTH the carbon-dioxide AND carbon-monoxide signals at
// once. dangerConfig.message/action joined every matched signal's text
// together, so the resulting "emergency" response still contained the
// carbon-dioxide signal's "different hazard ... not immediately
// life-threatening at typical household levels" language sitting right next
// to the carbon-monoxide STOP warning — a genuinely dangerous contradiction.
//
// Fix: js/data/safety-data.js's carbon-dioxide signal now declares
// `excludes: ['carbon-monoxide']`, and assessRisk() drops any matched signal
// whose `excludes` list names another signal that also matched in the same
// text. Carbon monoxide — the more urgent, more specific, and (in the
// follow-up case) more recently confirmed reading — always wins outright,
// and no CO2 language leaks into a confirmed CO emergency response.
//
// Run with: node tests/regression-co-vs-co2-followup.mjs
import assert from 'node:assert/strict';
import { diagnoseProblem } from '../js/api/ai-client.js';
import { assessRisk, RISK_LEVEL } from '../js/data/safety-data.js';

const baseRequest = { seen: '', heard: '', smell: '', otherSymptoms: '', photos: [] };

let pass = 0;
async function check(label, fn) {
  await fn();
  console.log(`PASS: ${label}`);
  pass += 1;
}

// Collects every bit of homeowner-facing text FixWise generated for a
// diagnosis result, so we can scan the WHOLE message (not just the heading)
// for contradictory CO/CO2 language, as the problem statement requires.
function allResponseText(diagnosis) {
  const parts = [
    diagnosis?.dangerConfig?.message,
    diagnosis?.dangerConfig?.action,
    diagnosis?.dangerConfig?.badge,
    ...(diagnosis?.clarifyingQuestions || [])
  ].filter(Boolean);
  return parts.join(' ').toLowerCase();
}

// ---- Flow A: CO2 alarm mentioned first, then confirmed as CO ----
await check('Flow A: "my CO2 alarm is going off" then "it says CO carbon monoxide" is a clean CO emergency, no CO2 language', async () => {
  const initial = await diagnoseProblem({
    ...baseRequest,
    category: 'Electrical',
    problem: 'my CO2 alarm is going off',
    conversationHistory: []
  });
  assert.equal(initial.isEmergency, undefined, 'CO2 alone must not be the CO emergency');
  assert.equal(initial.riskLevel, 'caution');

  const followUp = await diagnoseProblem({
    ...baseRequest,
    category: 'Electrical',
    problem: 'my CO2 alarm is going off',
    conversationHistory: [{ answer: 'it says CO carbon monoxide', timestamp: new Date().toISOString() }]
  });

  assert.equal(followUp.isEmergency, true, 'confirming CO must escalate to the emergency response');
  assert.equal(followUp.riskLevel, RISK_LEVEL.STOP);

  const text = allResponseText(followUp);
  assert.ok(/carbon monoxide/.test(text), 'response must contain carbon-monoxide emergency guidance');
  assert.ok(!/different hazard/.test(text), 'must not contain the CO2 signal\'s "different hazard" contradiction');
  assert.ok(!/not immediately life-threatening/.test(text), 'must not contain the CO2 signal\'s lower-severity reassurance');
  assert.ok(!/carbon dioxide/.test(text), 'must not mix carbon-dioxide language into a confirmed CO emergency');
});

// ---- Flow B: CO2 alarm mentioned first, then confirmed as CO2 ----
await check('Flow B: "my CO2 alarm is going off" then "it says CO2 carbon dioxide" stays CO2 guidance, not the CO emergency', async () => {
  const followUp = await diagnoseProblem({
    ...baseRequest,
    category: 'Electrical',
    problem: 'my CO2 alarm is going off',
    conversationHistory: [{ answer: 'it says CO2 carbon dioxide', timestamp: new Date().toISOString() }]
  });

  assert.equal(followUp.isEmergency, undefined, 'confirmed CO2 must never be treated as the CO emergency');
  assert.equal(followUp.riskLevel, RISK_LEVEL.CAUTION);

  const text = allResponseText(followUp);
  assert.ok(/carbon dioxide/.test(text), 'response should still contain the CO2 guidance');
  assert.ok(!/get everyone outside into fresh air immediately/.test(text), 'must not contain the CO emergency action text');
});

// ---- Flow C: unambiguous CO wording up front ----
await check('Flow C: "my carbon monoxide alarm is going off" is immediately a CO emergency, no clarification needed', async () => {
  const r = await diagnoseProblem({
    ...baseRequest,
    category: 'Electrical',
    problem: 'my carbon monoxide alarm is going off',
    conversationHistory: []
  });
  assert.equal(r.isEmergency, true);
  assert.equal(r.needsFollowUp, false);
  assert.equal(r.riskLevel, RISK_LEVEL.STOP);
  const text = allResponseText(r);
  assert.ok(!/carbon dioxide/.test(text));
});

// ---- Flow D: unambiguous "CO alarm" wording up front ----
await check('Flow D: "my CO alarm is going off" is immediately a CO emergency, no clarification needed', async () => {
  const r = await diagnoseProblem({
    ...baseRequest,
    category: 'Electrical',
    problem: 'my CO alarm is going off',
    conversationHistory: []
  });
  assert.equal(r.isEmergency, true);
  assert.equal(r.needsFollowUp, false);
  assert.equal(r.riskLevel, RISK_LEVEL.STOP);
  const text = allResponseText(r);
  assert.ok(!/carbon dioxide/.test(text));
});

// ---- Still-ambiguous follow-up: keep asking, never guess ----
await check('An unrelated/ambiguous follow-up answer keeps asking rather than guessing CO vs CO2', async () => {
  const followUp = await diagnoseProblem({
    ...baseRequest,
    category: 'Electrical',
    problem: 'my CO2 alarm is going off',
    conversationHistory: [{ answer: 'not sure, it just started beeping', timestamp: new Date().toISOString() }]
  });
  assert.equal(followUp.isEmergency, undefined);
  assert.equal(followUp.riskLevel, RISK_LEVEL.CAUTION);
  assert.equal(followUp.needsFollowUp, true, 'still ambiguous — must keep asking, not guess');
  assert.ok(followUp.clarifyingQuestions && followUp.clarifyingQuestions.length > 0);
});

// ---- Lower-level unit check directly against assessRisk() ----
await check('assessRisk() drops the CO2 signal outright once CO is also present in the same text', () => {
  const res = assessRisk('my CO2 alarm is going off. it says CO carbon monoxide');
  assert.equal(res.level, RISK_LEVEL.STOP);
  assert.ok(!res.signals.some(s => s.id === 'carbon-dioxide'), 'carbon-dioxide signal must be excluded once CO is confirmed');
  assert.ok(res.signals.some(s => s.id === 'carbon-monoxide'));
});

console.log(`\nregression-co-vs-co2-followup.mjs: ${pass}/${pass} passed`);
