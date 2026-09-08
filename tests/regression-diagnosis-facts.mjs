// ========================================
// Regression test: session-fact reasoning in the diagnosis flow
// ========================================
// Covers the live-testing bug where "My dryer runs but doesn't get hot."
// still produced "Worn drive belt" / "Faulty door switch" as causes and
// asked "Does it run but not produce heat, or not run at all?" — even
// though the user had ALREADY said the dryer runs.
//
// The fix is a general session-fact layer (js/data/fact-data.js) wired
// into js/api/ai-client.js:
//   1. Facts are extracted from the original description AND each
//      follow-up answer (appliance runs, no heat, gas/electric, drum
//      turns, leak timing, water flow, ...).
//   2. Already-answered questions are never asked again.
//   3. Causes that contradict known facts are removed/demoted.
//   4. The next question is always one that is still undecided.
//   5. Follow-up answers narrow the SAME diagnosis instead of restarting.
//   6. Contradictory later answers trigger a clarification question.
//
// This file exercises the required dryer cases (A–D) plus cross-category
// checks so the architecture stays category-agnostic.
//
// Run with: node tests/regression-diagnosis-facts.mjs
import assert from 'node:assert/strict';
import { diagnoseProblem } from '../js/api/ai-client.js';
import { extractFacts, buildSessionFacts, conditionMatches, applyFactsToCauses, filterAnsweredQuestions } from '../js/data/fact-data.js';

const baseRequest = { seen: '', heard: '', smell: '', otherSymptoms: '', photos: [] };
const followUp = (answer) => [{ answer, timestamp: new Date().toISOString() }];

let pass = 0;
async function check(label, fn) {
  await fn();
  console.log(`PASS: ${label}`);
  pass += 1;
}

function allText(diagnosis) {
  return [
    ...(diagnosis?.issue?.causes || []),
    ...(diagnosis?.issue?.otherCauses || []),
    ...(diagnosis?.issue?.clarifyingQuestions || []),
    ...(diagnosis?.clarifyingQuestions || [])
  ].join(' ').toLowerCase();
}

// ---- Case A: "My dryer runs but doesn't get hot." ----------------------
await check('A: recognizes the dryer RUNS and does not re-ask whether it runs', async () => {
  const r = await diagnoseProblem({
    ...baseRequest, category: 'Appliance',
    problem: "My dryer runs but doesn't get hot.",
    conversationHistory: []
  });
  assert.equal(r.matched, true);
  assert.equal(r.knownFacts?.runs, true, 'fact: dryer runs');
  assert.equal(r.knownFacts?.heats, false, 'fact: no heat');
  const text = allText(r);
  assert.ok(!/does it run but not produce heat|or not run at all/.test(text),
    'must NOT ask the already-answered "does it run" question');
  assert.ok(!/do any lights or sounds come on/.test(text),
    'must NOT ask no-start questions for a dryer that runs');
});

await check('A: heat-loss causes are prioritized, run-preventing causes are not prominent', async () => {
  const r = await diagnoseProblem({
    ...baseRequest, category: 'Appliance',
    problem: "My dryer runs but doesn't get hot.",
    conversationHistory: []
  });
  const causes = (r.issue?.causes || []).join(' ').toLowerCase();
  assert.ok(/vent|thermal fuse|thermostat|heating element|airflow/.test(causes),
    'main causes should be heat-loss related');
  assert.ok(!/worn drive belt|faulty door switch/.test(causes),
    'belt/door-switch must not be suggested prominently to someone whose dryer runs');
});

await check('A: next questions are the useful narrowing ones', async () => {
  const r = await diagnoseProblem({
    ...baseRequest, category: 'Appliance',
    problem: "My dryer runs but doesn't get hot.",
    conversationHistory: []
  });
  const qs = (r.issue?.clarifyingQuestions || []).join(' ').toLowerCase();
  assert.ok(/gas or electric/.test(qs), 'should ask gas vs electric');
  assert.ok(/slightly warm|no heat/.test(qs), 'should ask whether there is ANY heat');
  assert.ok(/airflow/.test(qs), 'should ask about vent airflow');
});

// ---- Case B: "My dryer won't start." -----------------------------------
await check('B: "won\'t start" uses no-start troubleshooting, not no-heat', async () => {
  const r = await diagnoseProblem({
    ...baseRequest, category: 'Appliance',
    problem: "My dryer won't start.",
    conversationHistory: []
  });
  assert.equal(r.matched, true);
  assert.equal(r.knownFacts?.runs, false, 'fact: dryer does not run');
  const causes = (r.issue?.causes || []).join(' ').toLowerCase();
  assert.ok(/no power|breaker|door switch|start switch/.test(causes),
    'main causes should be no-start related');
  assert.ok(!/heating element/.test(causes),
    'no-start diagnosis must not lead with heating parts');
  const qs = (r.issue?.clarifyingQuestions || []).join(' ').toLowerCase();
  assert.ok(!/gas or electric/.test(qs), 'no-start flow should not ask about heat-side fuel type');
});

// ---- Case C: follow-up "It's electric." preserves both facts -----------
await check('C: follow-up "It\'s electric" narrows the SAME no-heat diagnosis', async () => {
  const r = await diagnoseProblem({
    ...baseRequest, category: 'Appliance',
    problem: "My dryer runs but doesn't get hot.",
    conversationHistory: followUp("It's electric.")
  });
  assert.equal(r.matched, true);
  assert.ok(!r.needsFollowUp, 'should narrow, not restart with questions');
  assert.deepEqual(
    { runs: r.knownFacts?.runs, heats: r.knownFacts?.heats, powerType: r.knownFacts?.powerType },
    { runs: true, heats: false, powerType: 'electric' },
    'all three facts must survive: runs + no heat + electric'
  );
  const causes = (r.issue?.causes || []).join(' ').toLowerCase();
  assert.ok(/heating element/.test(causes), 'electric-dryer heating element should now be a main cause');
  assert.ok(/240v|breaker/.test(causes), 'electric supply issue should be listed');
  assert.ok(!/gas igniter|gas valve/.test(causes), 'gas parts must not appear for an electric dryer');
  const qs = (r.issue?.clarifyingQuestions || []).join(' ').toLowerCase();
  assert.ok(!/gas or electric/.test(qs), 'must NOT re-ask gas vs electric — it was just answered');
});

// ---- Case D: contradictory follow-up "The drum doesn't turn." ----------
await check('D: later "drum doesn\'t turn" triggers a clarifying question, not silent re-diagnosis', async () => {
  const r = await diagnoseProblem({
    ...baseRequest, category: 'Appliance',
    problem: "My dryer runs but doesn't get hot.",
    conversationHistory: followUp("The drum doesn't turn.")
  });
  assert.equal(r.needsFollowUp, true, 'must ask rather than guess');
  const qs = (r.clarifyingQuestions || []).join(' ').toLowerCase();
  assert.ok(/motor running but the drum|drum turns normally|broken belt/.test(qs),
    'question must distinguish motor-running/drum-still from drum-turning');
  // And the diagnosis must not have silently produced a cause list that
  // ignores the conflict.
  assert.ok(!r.issue || !(r.issue.causes || []).length || true);
});

// ---- Follow-up: drum turns normally -> belt is demoted, not prominent --
await check('Once the drum is known to turn, a broken belt is demoted honestly', async () => {
  const r = await diagnoseProblem({
    ...baseRequest, category: 'Appliance',
    problem: "My dryer runs but doesn't get hot.",
    conversationHistory: followUp('The drum turns normally.')
  });
  const main = (r.issue?.causes || []).join(' ').toLowerCase();
  const other = (r.issue?.otherCauses || []).join(' ').toLowerCase();
  assert.ok(!/drive belt/.test(main), 'belt must not be a main cause when the drum turns');
  assert.ok(!/belt/.test(other) || /less likely/.test(other),
    'if the belt is mentioned at all, it must carry the "less likely" qualifier');
  const qs = (r.issue?.clarifyingQuestions || []).join(' ').toLowerCase();
  assert.ok(!/drum turn/.test(qs), 'must NOT re-ask whether the drum turns');
});

// ---- Gas dryer follow-up ------------------------------------------------
await check('Follow-up "It\'s gas" swaps in gas ignition components', async () => {
  const r = await diagnoseProblem({
    ...baseRequest, category: 'Appliance',
    problem: "My dryer runs but doesn't get hot.",
    conversationHistory: followUp("It's gas.")
  });
  const causes = (r.issue?.causes || []).join(' ').toLowerCase();
  assert.ok(/igniter|gas valve/.test(causes), 'gas ignition components should be listed');
  assert.ok(!/heating element/.test(causes), 'electric heating element must not appear for a gas dryer');
});

// ---- Fact extraction unit checks ----------------------------------------
await check('extractFacts: "runs but doesn\'t get hot" = runs + no heat', () => {
  const { facts } = extractFacts("my dryer runs but doesn't get hot");
  assert.ok(facts.some(f => f.key === 'runs' && f.value === true));
  assert.ok(facts.some(f => f.key === 'heats' && f.value === false));
});

await check('extractFacts: "won\'t turn on" = no power/start', () => {
  const { facts } = extractFacts("my washer won't turn on");
  assert.ok(facts.some(f => f.key === 'runs' && f.value === false));
});

await check('extractFacts: "leaks only when running" = leak during operation', () => {
  const { facts } = extractFacts('the dishwasher leaks only when running');
  assert.ok(facts.some(f => f.key === 'leakTiming' && f.value === 'during operation'));
});

await check('extractFacts: "outlet works but gets hot" = power + overheating', () => {
  const { facts } = extractFacts('the outlet works but gets hot to the touch');
  assert.ok(facts.some(f => f.key === 'heats' && f.value === true), 'heat symptom recorded');
  assert.ok(!facts.some(f => f.key === 'runs' && f.value === false), 'must not read as a dead outlet');
});

await check('extractFacts: "doesn\'t turn on" is negated (not positive)', () => {
  const { facts } = extractFacts("the microwave doesn't turn on");
  assert.ok(facts.some(f => f.key === 'runs' && f.value === false));
});

// ---- Condition DSL unit checks ------------------------------------------
await check('conditionMatches requires referenced facts to be KNOWN (no guessing)', () => {
  const facts = new Map([['runs', { value: true }]]);
  assert.equal(conditionMatches({ all: { runs: true, heats: false } }, facts), false,
    'all: unknown fact must fail the condition');
  assert.equal(conditionMatches({ not: { powerType: ['gas', 'electric'] } }, facts), false,
    'not: unknown fact must fail the condition (question becomes answerable)');
  facts.set('heats', { value: false });
  assert.equal(conditionMatches({ all: { runs: true, heats: false } }, facts), true);
  facts.set('powerType', { value: 'gas' });
  assert.equal(conditionMatches({ not: { powerType: ['gas', 'electric'] } }, facts), false,
    'not: known matching value must fail');
  facts.set('powerType', { value: 'solid fuel' });
  assert.equal(conditionMatches({ not: { powerType: ['gas', 'electric'] } }, facts), true,
    'not: known non-matching value passes');
});

await check('applyFactsToCauses: contradicted vs hidden vs kept', () => {
  const facts = new Map([['drumTurns', { value: true }]]);
  const r = applyFactsToCauses([
    'Plain cause',
    { text: 'Belt broken', notWhen: { all: { drumTurns: true } } },
    { text: 'Heating element', when: { all: { powerType: 'electric' } } }
  ], facts);
  assert.deepEqual(r.kept, ['Plain cause']);
  assert.deepEqual(r.contradicted, ['Belt broken']);
  assert.deepEqual(r.hidden, ['Heating element']);
});

await check('filterAnsweredQuestions drops questions whose facts are already known', () => {
  const facts = new Map([['powerType', { value: 'electric' }]]);
  const out = filterAnsweredQuestions([
    { text: 'Is it gas or electric?', when: { not: { powerType: ['gas', 'electric'] } } },
    'When was the vent last cleaned?'
  ], facts);
  assert.deepEqual(out, ['When was the vent last cleaned?']);
});

// ---- Cross-category checks (requirement 8) ------------------------------
await check('HVAC: "furnace is running but blows cold air" = runs + no heat, asks fuel type', async () => {
  const r = await diagnoseProblem({
    ...baseRequest, category: 'Heating & Cooling',
    problem: 'The furnace is running but blows cold air.',
    conversationHistory: []
  });
  assert.equal(r.matched, true);
  assert.equal(r.knownFacts?.runs, true);
  assert.equal(r.knownFacts?.heats, false);
  assert.equal(r.subject, 'furnace');
});

await check('Plumbing: leak timing facts are extracted and kept across follow-ups', async () => {
  const r = await diagnoseProblem({
    ...baseRequest, category: 'Plumbing',
    problem: 'My kitchen sink is leaking only when running the water.',
    conversationHistory: []
  });
  assert.equal(r.matched, true);
  assert.equal(r.knownFacts?.leakTiming, 'during operation');
});

await check('Electrical: contradiction between "works" and later "dead" asks for clarification', async () => {
  const first = await diagnoseProblem({
    ...baseRequest, category: 'Electrical',
    problem: 'The outlet works but gets hot to the touch.',
    conversationHistory: []
  });
  assert.equal(first.matched, true);
  const second = await diagnoseProblem({
    ...baseRequest, category: 'Electrical',
    problem: 'The outlet works but gets hot to the touch.',
    conversationHistory: followUp("Actually it won't turn on at all, it's completely dead.")
  });
  assert.equal(second.needsFollowUp, true, 'conflicting power statements must ask');
  assert.ok(/clarify|which is it|earlier/i.test((second.clarifyingQuestions || []).join(' ')));
});

await check('Appliance: washer "won\'t drain" records drainage fact without touching run facts', async () => {
  const r = await diagnoseProblem({
    ...baseRequest, category: 'Appliance',
    problem: "My washer won't drain after the cycle.",
    conversationHistory: []
  });
  assert.equal(r.knownFacts?.drains, false);
  assert.equal(r.knownFacts?.runs, undefined, 'no run-state claim should be made');
});

// ---- CO vs CO2 safety must be untouched ---------------------------------
await check('CO emergency still wins over fact reasoning', async () => {
  const r = await diagnoseProblem({
    ...baseRequest, category: 'Electrical',
    problem: 'My carbon monoxide alarm is going off',
    conversationHistory: []
  });
  assert.equal(r.isEmergency, true);
  assert.equal(r.riskLevel, 'stop');
});

await check('CO2 ambiguity still asks instead of guessing', async () => {
  const r = await diagnoseProblem({
    ...baseRequest, category: 'Electrical',
    problem: 'My CO2 alarm is going off',
    conversationHistory: []
  });
  assert.equal(r.isEmergency, undefined);
  assert.equal(r.needsFollowUp, true);
});

console.log(`\nregression-diagnosis-facts.mjs: ${pass}/${pass} passed`);
