// ========================================
// FIXWISE KIDS: parent-linked activity sets (front-end prototype)
// ========================================
// Each activity set is keyed by the SAME guide id used in
// js/data/guides-data.js, so a child's activities are always based on the
// real repair a parent is doing (problem statement section 8/11). If no
// matching parent repair session exists yet, the Kids section falls back
// to a sample set so the experience is still explorable.
//
// Activity shape:
//   id            - unique id (used for progress tracking)
//   badge         - badge id this activity contributes toward (see
//                   js/modules/kids-progress.js for the badge catalog)
//   type          - 'multiple-choice' | 'number' | 'order' | 'info'
//   title, prompt - copy shown to the child
//   options / items / correctIndex / correctAnswer / body - per type, below
//   explanation   - shown after answering, win or miss
//
// The child is NEVER instructed to perform dangerous real-world work —
// every activity here is observation, identification, counting, ordering,
// or a safety-awareness question about who does what.

export const kidsActivitySets = {
  'dripping-faucet': {
    parentTaskLabel: 'Fixing a dripping faucet',
    icon: '🚰',
    activities: [
      {
        id: 'faucet-identify-wrench',
        badge: 'tool-scout',
        type: 'multiple-choice',
        title: 'Identify the wrench',
        prompt: 'Which tool will help loosen the faucet\'s nut so it can come apart?',
        options: ['🔧 Adjustable wrench', '🪛 Screwdriver', '🔨 Hammer', '📏 Tape measure'],
        correctIndex: 0,
        explanation: 'An adjustable wrench opens and closes to grip different sized nuts and bolts — perfect for faucet repairs.'
      },
      {
        id: 'faucet-count-parts',
        badge: 'measurement-master',
        type: 'number',
        title: 'Count the parts',
        prompt: 'The repair kit has 1 washer, 2 O-rings, and 1 spring. How many parts is that in total?',
        correctAnswer: 4,
        explanation: 'Counting the parts before starting helps make sure nothing gets left out during reassembly.'
      },
      {
        id: 'faucet-choose-tool',
        badge: 'tool-scout',
        type: 'multiple-choice',
        title: 'Choose the correct tool',
        prompt: 'The shutoff valve under the sink feels a little stiff. What can help turn it safely?',
        options: ['🔧 An adjustable wrench for grip', '🖌️ A paintbrush', '🧽 A sponge', '📎 A paperclip'],
        correctIndex: 0,
        explanation: 'A wrench gives extra grip and leverage on a stiff valve — but a grown-up should be the one turning it.'
      },
      {
        id: 'faucet-measure-washer',
        badge: 'measurement-master',
        type: 'multiple-choice',
        title: 'Estimate the size',
        prompt: 'A typical faucet washer is closest in size to which coin?',
        options: ['A quarter', 'A basketball', 'A dinner plate', 'A grain of rice'],
        correctIndex: 0,
        explanation: 'Faucet washers are small, coin-sized parts — that\'s why it\'s easy to lose them down the drain!'
      },
      {
        id: 'faucet-water-pressure',
        badge: 'problem-solver',
        type: 'info',
        title: 'Why water pressure matters',
        body: 'Water moves through pipes because of pressure — like air in a balloon. Too much pressure can stress old washers and seals, which is one reason faucets start to drip over time.',
        prompt: 'True or false: too much water pressure can help cause a leaky faucet.',
        options: ['True', 'False'],
        correctIndex: 0,
        explanation: 'True! Extra pressure pushes harder on worn seals, which can make a small leak start or get worse.'
      },
      {
        id: 'faucet-estimate-cost',
        badge: 'money-smart',
        type: 'multiple-choice',
        title: 'Estimate the cost',
        prompt: 'About how much does a replacement faucet washer usually cost?',
        options: ['$1–$3', '$25', '$100', '$500'],
        correctIndex: 0,
        explanation: 'Small parts like washers are inexpensive — a big reason it\'s worth fixing instead of replacing the whole faucet.'
      },
      {
        id: 'faucet-order-steps',
        badge: 'problem-solver',
        type: 'order',
        title: 'Put the steps in order',
        prompt: 'Tap the steps in the order they should happen.',
        items: [
          { id: 'shutoff', label: 'Turn off the water supply' },
          { id: 'release', label: 'Open the faucet to release pressure' },
          { id: 'remove', label: 'Remove the handle' },
          { id: 'replace', label: 'Replace the worn washer' },
          { id: 'restore', label: 'Turn the water back on' }
        ],
        explanation: 'Getting the order right (water off first, water on last!) keeps the repair safe and mess-free.'
      },
      {
        id: 'faucet-safety-question',
        badge: 'safety-spotter',
        type: 'multiple-choice',
        title: 'Grown-up job or kid job?',
        prompt: 'Which of these should always be done by the grown-up, not the Junior Helper?',
        options: ['Turning off the water shutoff valve', 'Handing over the correct tool', 'Counting the parts', 'Watching and asking questions'],
        correctIndex: 0,
        explanation: 'Great instinct! Turning valves and taking things apart is a grown-up job. Junior Helpers assist, watch, and learn.'
      }
    ]
  },
  'sticking-door': {
    parentTaskLabel: 'Fixing a sticking door',
    icon: '🚪',
    activities: [
      {
        id: 'door-identify-screwdriver',
        badge: 'tool-scout',
        type: 'multiple-choice',
        title: 'Identify the screwdriver',
        prompt: 'Which tool tightens the screws in a door hinge?',
        options: ['🪛 Screwdriver', '🔧 Wrench', '🪚 Saw', '🧯 Fire extinguisher'],
        correctIndex: 0,
        explanation: 'A screwdriver fits into the screw head to tighten or loosen it.'
      },
      {
        id: 'door-count-hinges',
        badge: 'measurement-master',
        type: 'number',
        title: 'Count the hinges',
        prompt: 'A door has 3 hinges, each with 2 screws. How many screws is that in total?',
        correctAnswer: 6,
        explanation: 'Checking every screw on every hinge is how a wobbly door gets fixed for good.'
      },
      {
        id: 'door-order-steps',
        badge: 'problem-solver',
        type: 'order',
        title: 'Put the steps in order',
        prompt: 'Tap the steps in the order they should happen.',
        items: [
          { id: 'tighten', label: 'Tighten all the hinge screws' },
          { id: 'mark', label: 'Mark where the door rubs the frame' },
          { id: 'sand', label: 'Sand the marked spot a little' },
          { id: 'retest', label: 'Close the door again to test it' }
        ],
        explanation: 'Small changes, then re-test — that\'s how careful repairs avoid removing too much material.'
      },
      {
        id: 'door-safety-question',
        badge: 'safety-spotter',
        type: 'multiple-choice',
        title: 'Grown-up job or kid job?',
        prompt: 'Which job should always be the grown-up\'s?',
        options: ['Sanding near the door frame', 'Holding the flashlight steady', 'Naming which tool is needed', 'Watching for the door to close smoothly'],
        correctIndex: 0,
        explanation: 'Sanding and tool work is for grown-ups. Junior Helpers can absolutely hold the light and watch closely!'
      }
    ]
  }
};

export const defaultActivitySetId = 'dripping-faucet';

export function getActivitySet(guideId) {
  return kidsActivitySets[guideId] || null;
}
