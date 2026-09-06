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
    overview: 'A dripping faucet almost always comes down to a worn internal part failing to seal — but which part depends on what kind of faucet you have. Cartridge, compression, ceramic-disc, and ball-type faucets are opened up and repaired differently, so identifying the type first saves time and frustration.',
    symptoms: 'Water drips from the spout or handle even when fully closed.',
    causes: ['Worn rubber washer or O-ring', 'Corroded valve seat', 'Loose packing nut', 'Worn cartridge or ceramic disc'],
    tools: ['Adjustable wrench', 'Screwdriver', 'Replacement washer/cartridge kit'],
    parts: ['Faucet washer or cartridge', 'Plumber\'s tape'],
    safety: ['Turn off the water supply valves under the sink before disassembling the faucet.'],
    steps: [
      'Identify your faucet type (cartridge, compression, ceramic-disc, or ball).',
      'Shut off the water supply valves under the sink.',
      'Open the faucet to release remaining water pressure.',
      'Remove the handle and unscrew the packing/retaining nut.',
      'Inspect and replace the worn washer, O-ring, cartridge, or disc for your faucet type.',
      'Reassemble and turn the water back on slowly, checking for leaks.'
    ],
    time: '20–45 minutes',
    difficulty: LEVELS.BEGINNER.slug,
    tips: ['Take a photo before disassembly so you remember part order.', 'Bring the old part to the hardware store for an exact match.'],
    commonMistakes: [
      'Forgetting to plug the sink drain — small screws and springs can fall right in.',
      'Over-tightening the retaining nut, which can crack the faucet body.',
      'Buying a generic washer kit without checking it matches your specific faucet type.'
    ],
    verification: 'Turn the water supply back on slowly and run the faucet through a full hot/cold cycle, checking under the sink and at the handle for any new leaks.',
    stopWhen: 'You cannot locate or close the shutoff valves, or water sprays under pressure.',
    callPro: 'If the valve seat is badly corroded or the faucet body is cracked, a plumber can replace the fixture.',
    // Equipment-type-aware detail: different faucet mechanisms fail and get
    // repaired differently, so a single generic procedure isn't accurate
    // for all of them (see problem statement section 5).
    equipmentTypes: [
      {
        id: 'cartridge',
        name: 'Cartridge faucet',
        description: 'Single handle that lifts/turns; common in kitchens. The cartridge is a replaceable sealed unit.',
        likelyFix: 'Replace the cartridge — rarely worth repairing the old one.'
      },
      {
        id: 'compression',
        name: 'Compression faucet',
        description: 'Two separate handles (hot/cold) that get harder to turn as you close them; found in many older bathrooms.',
        likelyFix: 'Replace the rubber washer at the bottom of the stem.'
      },
      {
        id: 'ceramic-disc',
        name: 'Ceramic-disc faucet',
        description: 'Single handle with a smooth quarter-turn motion; a wide cylinder body is visible underneath.',
        likelyFix: 'Replace the neoprene seals beneath the ceramic disc cylinder.'
      },
      {
        id: 'ball',
        name: 'Ball-type faucet',
        description: 'Single handle that moves in every direction over a rounded cap with a slotted metal or plastic ball inside.',
        likelyFix: 'Replace the springs, seats, and O-rings in a ball-faucet repair kit.'
      }
    ],
    // Data-driven step-through for the interactive "Guide Me Through It"
    // mode (js/modules/repair-mode.js). A future backend can dynamically
    // control this same structure without any UI code changes.
    interactive: {
      intro: 'Let\'s fix that dripping faucet together, one step at a time. First, a couple of quick prep steps apply no matter what type of faucet you have.',
      commonSteps: [
        {
          instruction: 'Clear the area under the sink and confirm you can reach the shutoff valves.',
          explanation: 'Working with clear access prevents fumbling with tools near water and dropped small parts.',
          whatYoullSee: 'Two oval or lever-style valves on the supply lines under the sink.',
          tools: ['Flashlight'],
          troubleshoot: { question: 'No shutoff valves under the sink?', help: 'Some older homes only have a main shutoff. Turn off the home\'s main water supply instead before continuing.' }
        },
        {
          instruction: 'Turn both shutoff valves clockwise until snug to stop water flow.',
          explanation: 'This prevents a surprise spray once the faucet is disassembled.',
          safetyNote: 'Do not force a stuck valve — a seized valve can snap. Call a plumber if it won\'t turn.',
          tools: ['Adjustable wrench'],
          troubleshoot: { question: 'Valve won\'t fully stop the water?', help: 'If water still trickles after closing the valve, the valve itself may be worn — stop here and call a plumber rather than disassembling the faucet with water still live.' }
        },
        {
          instruction: 'Open the faucet handle(s) to release remaining pressure and let residual water drain.',
          explanation: 'Releasing pressure first makes disassembly cleaner and safer.',
          whatYoullSee: 'A slow trickle, then no more water from the spout.'
        },
        {
          instruction: 'Plug the sink drain with a cloth or stopper.',
          explanation: 'Small screws, springs, and O-rings are easy to lose down an open drain.'
        }
      ],
      variantPrompt: {
        question: 'What type of faucet is this?',
        helpText: 'Not sure? Look at the handle: one lever that lifts (cartridge), two separate hot/cold handles (compression), one handle with a smooth quarter turn over a wide base (ceramic-disc), or one handle that moves in every direction over a rounded cap (ball-type).',
        options: [
          { value: 'cartridge', label: 'Cartridge (single lever handle)' },
          { value: 'compression', label: 'Compression (two separate handles)' },
          { value: 'ceramic-disc', label: 'Ceramic-disc (smooth quarter-turn handle)' },
          { value: 'ball', label: 'Ball-type (handle moves in all directions)' },
          { value: 'unsure', label: 'I\'m not sure yet' }
        ]
      },
      variantSteps: {
        cartridge: [
          { instruction: 'Pry off the decorative cap and remove the handle screw underneath.', explanation: 'The screw usually hides under a small cap or button on top of the handle.', tools: ['Small flathead screwdriver'] },
          { instruction: 'Lift the handle straight up and off, then unscrew the retaining nut around the cartridge.', explanation: 'The retaining nut holds the cartridge in place inside the faucet body.', tools: ['Adjustable wrench or cartridge puller'] },
          { instruction: 'Pull the old cartridge straight up and out, noting its orientation.', explanation: 'Cartridges are directional — installing one backwards causes hot/cold to reverse.', whatYoullSee: 'A cylindrical cartridge with slots or tabs on the sides.' },
          { instruction: 'Insert the new cartridge in the same orientation and hand-tighten the retaining nut.', explanation: 'Overtightening can crack the faucet body, so snug is enough.', safetyNote: 'Do not overtighten plastic components.' }
        ],
        compression: [
          { instruction: 'Remove the decorative cap and handle screw, then lift off the handle.', explanation: 'This exposes the packing nut and stem underneath.', tools: ['Screwdriver'] },
          { instruction: 'Unscrew the packing nut and lift out the stem.', explanation: 'The stem holds the washer that seals against the valve seat.', tools: ['Adjustable wrench'] },
          { instruction: 'Remove the brass screw holding the rubber washer at the bottom of the stem and replace the washer.', explanation: 'A worn, hardened, or torn washer is the most common cause of a compression-faucet drip.', parts: ['Faucet washer (matching size)'] },
          { instruction: 'Check the valve seat inside the faucet body for roughness; if rough, it may need a seat wrench to smooth or replace it.', explanation: 'A damaged seat will keep causing drips even with a new washer.', tools: ['Seat wrench (optional)'] }
        ],
        'ceramic-disc': [
          { instruction: 'Lift the handle to remove the cap and unscrew the handle assembly.', explanation: 'This exposes the wide ceramic-disc cylinder underneath.', tools: ['Screwdriver'] },
          { instruction: 'Unscrew and lift out the ceramic cylinder.', explanation: 'The cylinder houses two ceramic discs that control flow.', whatYoullSee: 'A wide, short cylinder with visible holes on the bottom face.' },
          { instruction: 'Replace the neoprene seals on the bottom of the cylinder (or the whole cylinder if discs are scratched).', explanation: 'Worn seals — not the hard ceramic itself — usually cause the drip.', parts: ['Neoprene seal kit or replacement cylinder'] },
          { instruction: 'Reinstall the cylinder in the same orientation and hand-tighten.', explanation: 'Ceramic discs can crack if the cylinder is forced in misaligned.', safetyNote: 'Handle the ceramic cylinder gently — it can crack if dropped or forced.' }
        ],
        ball: [
          { instruction: 'Loosen the small setscrew on the handle with an Allen wrench, then remove the handle.', explanation: 'This exposes the domed cap covering the ball mechanism.', tools: ['Allen wrench'] },
          { instruction: 'Unscrew the domed cap and cam assembly to expose the ball.', explanation: 'The ball rotates to mix and control hot/cold water flow.', tools: ['Channel-lock pliers (wrap jaws with tape to avoid scratches)'] },
          { instruction: 'Lift out the ball and inspect the rubber seats and springs underneath it.', explanation: 'Worn springs/seats are the most common leak source in ball faucets.', whatYoullSee: 'Two small springs with rubber seat caps sitting in sockets.' },
          { instruction: 'Replace the springs, seats, and O-rings using a ball-faucet repair kit, then reinstall the ball in its original slot alignment.', explanation: 'The ball has a slot that must align with a pin inside the faucet body, or it won\'t operate correctly.', parts: ['Ball faucet repair kit'] }
        ],
        unsure: [
          { instruction: 'Remove the handle and take a clear photo of the mechanism underneath before going further.', explanation: 'A photo lets you compare against faucet-type references or show a hardware store associate for an exact match.', tools: ['Screwdriver'] },
          { instruction: 'Look for a single cartridge cylinder, two separate stems, a wide ceramic disc cylinder, or a rounded ball with springs.', explanation: 'This visual check usually reveals the type even without prior knowledge.', troubleshoot: { question: 'Still can\'t tell?', help: 'Bring the photo (or the faucet brand/model if visible) to a hardware store or plumber — guessing and forcing the wrong repair approach can damage the faucet body.' } }
        ]
      },
      finalSteps: [
        { instruction: 'Reassemble the handle and any decorative caps.', explanation: 'Reversing the disassembly order usually works well.' },
        { instruction: 'Turn the shutoff valves back on slowly, watching connections for drips.', explanation: 'Opening valves slowly avoids water-hammer noise and lets you catch leaks early.', safetyNote: 'If a connection sprays, shut the valve back off immediately and check the fitting.' },
        { instruction: 'Run the faucet through hot and cold for a minute and check underneath for leaks.', explanation: 'This is the verification step — confirms the repair actually solved the drip.' }
      ]
    }
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
    commonMistakes: ['Repeatedly resetting a GFCI that immediately trips again instead of stopping to investigate the cause.', 'Assuming the nearest outlet is the one with the GFCI, when it may be a different outlet upstream.'],
    verification: 'After a successful reset, test with a lamp or device and confirm it stays powered for at least a few minutes with nothing tripping again.',
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
