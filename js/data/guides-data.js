// ========================================
// REPAIR GUIDES LIBRARY
// ========================================
// Add a new guide by pushing another object onto the array below.
// Every guide follows the same shape so the renderer (js/modules/guides.js)
// and search/filter logic work automatically for new entries — no other
// code needs to change to add more guides.

import { LEVELS } from './levels.js';

export const repairGuides = [
  {
    id: 'dripping-faucet',
    category: 'Plumbing',
    icon: '🚰',
    title: 'Fix a dripping faucet',
    symptoms: 'Water drips from the spout or handle even when fully closed.',
    causes: ['Worn rubber washer or O-ring', 'Corroded valve seat', 'Loose packing nut'],
    tools: ['Adjustable wrench', 'Screwdriver', 'Replacement washer/cartridge kit'],
    parts: ['Faucet washer or cartridge', 'Plumber\'s tape'],
    safety: ['Turn off the water supply valves under the sink before disassembling the faucet.'],
    steps: [
      'Shut off the water supply valves under the sink.',
      'Open the faucet to release remaining water pressure.',
      'Remove the handle and unscrew the packing/retaining nut.',
      'Inspect and replace the worn washer, O-ring, or cartridge.',
      'Reassemble and turn the water back on slowly, checking for leaks.'
    ],
    time: '20–45 minutes',
    difficulty: LEVELS.BEGINNER.slug,
    tips: ['Take a photo before disassembly so you remember part order.', 'Bring the old part to the hardware store for an exact match.'],
    stopWhen: 'You cannot locate or close the shutoff valves, or water sprays under pressure.',
    callPro: 'If the valve seat is badly corroded or the faucet body is cracked, a plumber can replace the fixture.'
  },
  {
    id: 'sticking-door',
    category: 'Doors & Windows',
    icon: '🚪',
    title: 'Stop a door from sticking',
    symptoms: 'Door drags on the frame or floor, or is hard to latch.',
    causes: ['Loose or worn hinges', 'Seasonal wood swelling', 'Paint buildup on edges', 'House settling'],
    tools: ['Screwdriver', 'Sandpaper', 'Pencil'],
    parts: ['Longer hinge screws', 'Wood filler (if needed)'],
    safety: ['Support the door while adjusting hinges so it does not fall.'],
    steps: [
      'Tighten all hinge screws first — this fixes many sticking doors.',
      'Close the door slowly and mark where it rubs against the frame.',
      'Sand the marked area lightly and re-test.',
      'Repeat marking and sanding in small amounts until it closes smoothly.'
    ],
    time: '15–30 minutes',
    difficulty: LEVELS.BEGINNER.slug,
    tips: ['Humidity changes with the seasons — a door that only sticks in summer may just need a small sand.'],
    stopWhen: 'The frame itself looks warped, cracked, or separated from the wall.',
    callPro: 'Persistent sticking after adjustment may mean the frame has shifted and needs a carpenter.'
  },
  {
    id: 'room-not-heating',
    category: 'Heating & Cooling',
    icon: '🌡️',
    title: 'Why isn\'t a room heating?',
    symptoms: 'One room or the whole house is colder than expected.',
    causes: ['Closed or blocked vents', 'Dirty air filter', 'Thermostat setting', 'Ductwork issue'],
    tools: ['Flashlight'],
    parts: ['Replacement air filter'],
    safety: ['Turn off the system before removing panels or filters.'],
    steps: [
      'Check the thermostat is set to heat and above current room temperature.',
      'Make sure vents in the room are open and unobstructed by furniture or rugs.',
      'Replace the air filter if it looks dirty.',
      'Check for warm air at the vent closest to the furnace versus the affected room.'
    ],
    time: '10–25 minutes',
    difficulty: LEVELS.EASY_CHECK.slug,
    tips: ['Furniture blocking vents is one of the most common causes of an uneven-feeling house.'],
    stopWhen: 'You smell gas, or the furnace repeatedly shuts off on its own.',
    callPro: 'If the room stays cold after these checks, ductwork balancing may need an HVAC technician.'
  },
  {
    id: 'gfci-outlet-tripped',
    category: 'Electrical',
    icon: '🔌',
    title: 'GFCI outlet won\'t reset',
    symptoms: 'An outlet in a kitchen, bathroom, or garage has no power and the reset button won\'t stay in.',
    causes: ['Ground fault detected on the circuit', 'Moisture in the outlet or a downstream device', 'Worn-out GFCI outlet'],
    tools: [],
    parts: ['Replacement GFCI outlet (professional install recommended)'],
    safety: ['Do not attempt to open or rewire the outlet yourself.'],
    steps: [
      'Unplug all devices from that outlet and any downstream outlets it protects.',
      'Press "Reset" firmly, then "Test", then "Reset" again.',
      'If it still won\'t hold, note whether the area has been exposed to moisture.'
    ],
    time: '10 minutes for inspection',
    difficulty: LEVELS.PROFESSIONAL.slug,
    tips: ['One GFCI outlet often protects several outlets on the same circuit — check nearby outlets too.'],
    stopWhen: 'You see scorch marks, smell burning plastic, or the outlet feels warm.',
    callPro: 'A GFCI that won\'t reset after unplugging everything should be evaluated and replaced by a licensed electrician.'
  },
  {
    id: 'refrigerator-not-cooling',
    category: 'Appliances',
    icon: '🧊',
    title: 'Refrigerator isn\'t cooling properly',
    symptoms: 'Food is warmer than expected or the fridge runs constantly.',
    causes: ['Dirty condenser coils', 'Door seal not sealing', 'Overpacked fridge blocking airflow', 'Thermostat set incorrectly'],
    tools: ['Vacuum with brush attachment'],
    parts: ['Replacement door gasket (if needed)'],
    safety: ['Unplug the refrigerator before cleaning coils or checking the back panel.'],
    steps: [
      'Unplug the fridge and pull it out if possible.',
      'Vacuum dust and pet hair off the condenser coils.',
      'Check the door gasket for gaps by closing it on a piece of paper and gently pulling — it should resist.',
      'Make sure vents inside are not blocked by food packages.'
    ],
    time: '30–60 minutes',
    difficulty: LEVELS.BEGINNER.slug,
    tips: ['Clean coils twice a year to prevent this from recurring.'],
    stopWhen: 'You notice a chemical or ammonia-like smell.',
    callPro: 'If cleaning and seal checks don\'t help, the compressor or refrigerant may need a technician.'
  },
  {
    id: 'drywall-hole-repair',
    category: 'Walls & Drywall',
    icon: '🧱',
    title: 'Patch a small hole in drywall',
    symptoms: 'A dent, small hole, or doorknob-sized hole in a wall.',
    causes: ['Impact damage (furniture, doorknob, accidental bump)', 'Removed wall fixture'],
    tools: ['Putty knife', 'Sanding sponge'],
    parts: ['Spackling paste or joint compound', 'Self-adhesive mesh patch (for larger holes)', 'Matching paint'],
    safety: ['Wear a dust mask when sanding dried compound.'],
    steps: [
      'Clean loose debris from the edges of the hole.',
      'For small holes, apply spackling with a putty knife and let dry.',
      'For larger holes, place a mesh patch over the hole, then cover with joint compound.',
      'Sand smooth once fully dry, then prime and paint to match.'
    ],
    time: '30–90 minutes plus drying time',
    difficulty: LEVELS.BEGINNER.slug,
    tips: ['Apply two thin coats rather than one thick coat to reduce cracking and sanding time.'],
    stopWhen: 'The hole is near a light switch, outlet, or you notice wires or pipes inside.',
    callPro: 'Large sections of damaged drywall or damage near utilities are best handled by a professional.'
  },
  {
    id: 'squeaky-floorboard',
    category: 'Flooring',
    icon: '🪵',
    title: 'Silence a squeaky floorboard',
    symptoms: 'A floorboard creaks or squeaks when stepped on.',
    causes: ['Boards rubbing against each other', 'Loose subfloor fasteners', 'Gaps between subfloor and joists'],
    tools: ['Stud finder', 'Drill', 'Hammer'],
    parts: ['Floor squeak repair kit or trim-head screws'],
    safety: ['Be cautious drilling near hidden pipes or wiring — use a stud/utility finder first.'],
    steps: [
      'Walk the area to pinpoint the exact squeaky board.',
      'Locate the nearest joist using a stud finder.',
      'Drive a trim-head screw at an angle through the floorboard into the joist.',
      'Countersink the screw slightly and fill the small hole if needed.'
    ],
    time: '20–40 minutes',
    difficulty: LEVELS.INTERMEDIATE.slug,
    tips: ['Talcum powder or graphite worked into the seam can quiet a squeak temporarily.'],
    stopWhen: 'The floor feels soft or spongy underfoot, not just squeaky.',
    callPro: 'Soft or sagging floor sections may indicate subfloor rot and need a professional assessment.'
  },
  {
    id: 'running-toilet',
    category: 'Bathrooms',
    icon: '🚽',
    title: 'Fix a toilet that keeps running',
    symptoms: 'Toilet tank refills repeatedly or you hear constant hissing.',
    causes: ['Worn flapper valve', 'Fill valve not shutting off', 'Chain tangled or too long/short'],
    tools: ['None required for inspection'],
    parts: ['Flapper valve', 'Fill valve kit'],
    safety: ['Low risk — no water shutoff hazards beyond normal caution.'],
    steps: [
      'Remove the tank lid and watch what happens during and after a flush.',
      'Check that the chain has a small amount of slack, not too tight or too loose.',
      'If the flapper doesn\'t seal, replace it — an inexpensive and common fix.',
      'If water still runs, the fill valve likely needs replacement.'
    ],
    time: '20–40 minutes',
    difficulty: LEVELS.BEGINNER.slug,
    tips: ['Toilet repair kits at any hardware store include both parts and instructions.'],
    stopWhen: 'You see a crack in the tank or bowl.',
    callPro: 'Persistent running after replacing both parts may need a plumber to check the bowl or connections.'
  },
  {
    id: 'garbage-disposal-jam',
    category: 'Kitchens',
    icon: '🍽️',
    title: 'Clear a jammed garbage disposal',
    symptoms: 'Disposal hums but doesn\'t spin, or won\'t turn on at all.',
    causes: ['Jammed impellers from food debris', 'Tripped internal reset button', 'Tripped breaker'],
    tools: ['Hex/Allen wrench (often included with disposal)', 'Flashlight'],
    parts: [],
    safety: ['Always turn off power at the switch and unplug or shut off the breaker before reaching inside.'],
    steps: [
      'Turn off power to the disposal completely — never put your hand in while it could power on.',
      'Use the hex wrench in the bottom center hole to manually rotate the flywheel back and forth.',
      'Press the small red reset button on the bottom of the unit.',
      'Restore power and test with water running.'
    ],
    time: '10–20 minutes',
    difficulty: LEVELS.BEGINNER.slug,
    tips: ['Avoid putting fibrous foods (celery, banana peels) down the disposal — they cause most jams.'],
    stopWhen: 'The motor smells burnt or trips the breaker repeatedly.',
    callPro: 'A disposal that hums but won\'t clear, or has a burnt motor smell, likely needs replacement by a plumber or appliance tech.'
  },
  {
    id: 'gutter-cleaning',
    category: 'Basic Home Maintenance',
    icon: '🏠',
    title: 'Seasonal gutter cleaning',
    symptoms: 'Water overflows gutters during rain, or plants are growing in them.',
    causes: ['Leaves and debris buildup', 'Sagging or misaligned gutter sections', 'Clogged downspouts'],
    tools: ['Sturdy ladder', 'Gloves', 'Garden trowel', 'Hose'],
    parts: ['Gutter sealant (if leaks are found)'],
    safety: ['Use a stable ladder on level ground, ideally with a spotter. Avoid ladder work near power lines or in wet/windy conditions.'],
    steps: [
      'Set up the ladder on firm, level ground away from power lines.',
      'Scoop out debris by hand or trowel, working toward the downspout.',
      'Flush the gutter with a hose to check for proper flow.',
      'Check downspouts are clear and directing water away from the foundation.'
    ],
    time: '1–2 hours',
    difficulty: LEVELS.INTERMEDIATE.slug,
    tips: ['Gutter guards can reduce how often this chore is needed.'],
    stopWhen: 'The ladder cannot be placed safely, the roof is steep, or you are not comfortable with ladder heights.',
    callPro: 'For steep roofs, tall homes, or if you are uncomfortable on a ladder, hire a gutter cleaning service.'
  }
];

export function getCategories() {
  const cats = new Set(repairGuides.map(g => g.category));
  return ['All', ...Array.from(cats)];
}
