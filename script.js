const menuBtn = document.getElementById('menuBtn');
const navLinks = document.getElementById('navLinks');

menuBtn?.addEventListener('click', () => {
  const open = navLinks.classList.toggle('open');
  menuBtn.setAttribute('aria-expanded', String(open));
});

document.querySelectorAll('#navLinks a').forEach(link => {
  link.addEventListener('click', () => navLinks.classList.remove('open'));
});

const photoUpload = document.getElementById('photoUpload');
const uploadBox = document.querySelector('.upload-box');

photoUpload?.addEventListener('change', () => {
  const old = document.querySelector('.photo-name');
  if (old) old.remove();
  if (photoUpload.files && photoUpload.files[0]) {
    const name = document.createElement('div');
    name.className = 'photo-name';
    name.textContent = `Selected photo: ${photoUpload.files[0].name}`;
    uploadBox.insertAdjacentElement('afterend', name);
  }
});

// ========================================
// COMPREHENSIVE DIAGNOSIS ENGINE
// ========================================

// Knowledge base for repairs
const diagnosisDatabase = {
  plumbing: {
    dangers: {
      keywords: ['gas', 'line', 'main break', 'flooding', 'raw sewage', 'sewer'],
      message: 'This plumbing issue may involve your main water line, sewage system, or serious water damage.',
      badge: 'Call Licensed Plumber'
    },
    issues: {
      'drip|leak|water': {
        causes: ['Worn faucet seals', 'Loose connection', 'Corroded pipe'],
        nextCheck: 'Turn off water supply; locate exact source of leak',
        diy: 'Beginner–Intermediate',
        safety: 'Turn off water supply first',
        pro: 'If water is spraying, shut off the main water valve immediately.'
      },
      'slow drain|draining slowly|drain slow': {
        causes: ['Partial drain blockage', 'Hair and soap buildup', 'Vent pipe issue'],
        nextCheck: 'Check drain for visible debris; pour hot water or use plunger',
        diy: 'Beginner',
        safety: 'Use normal precautions',
        pro: 'For clogs that don\'t respond to plunging, a professional snake or hydro-jet can clear it.'
      },
      'gurgling|backing up|overflow': {
        causes: ['Blocked drain line', 'Vent stack blockage', 'Septic system issue'],
        nextCheck: 'Check all drains in the house; listen for air sounds',
        diy: 'Inspection only',
        safety: 'Do not use if sewage is backing up',
        pro: 'Backup can indicate a main line clog—call a professional plumber immediately.'
      },
      'no water|low pressure': {
        causes: ['Shut-off valve closed', 'Supply line freeze or break', 'Municipal water issue'],
        nextCheck: 'Check the main shutoff valve; verify neighbors have water',
        diy: 'Beginner',
        safety: 'Do not damage pipes while searching',
        pro: 'If the issue is inside your walls, a plumber can locate and repair it.'
      },
      'toilet': {
        causes: ['Flapper valve worn', 'Fill valve failure', 'Bowl crack'],
        nextCheck: 'Check if it runs constantly; listen for hissing sounds',
        diy: 'Beginner',
        safety: 'Low risk',
        pro: 'Internal toilet parts are inexpensive and easy to replace with guidance.'
      }
    }
  },
  electrical: {
    dangers: {
      keywords: ['spark', 'shock', 'burn', 'fire', 'breaker trip', 'electric', 'outlet', 'switch', 'wire'],
      message: 'Electrical problems can be serious. Many require a licensed electrician for safety.',
      badge: 'Call Licensed Electrician'
    },
    issues: {
      'outlet|socket': {
        causes: ['Tripped circuit breaker', 'Loose connection', 'Failed outlet'],
        nextCheck: 'Check circuit breaker; test outlet with a lamp',
        diy: 'Inspection only',
        safety: 'Do not attempt to repair outlets yourself',
        pro: 'Electrical outlets should only be replaced by a qualified electrician.'
      },
      'switch': {
        causes: ['Bad switch', 'Blown bulb', 'Tripped breaker'],
        nextCheck: 'Try a different bulb; check breaker panel',
        diy: 'Inspection only',
        safety: 'Never open a switch box',
        pro: 'Hire a licensed electrician for any switch or wiring work.'
      },
      'breaker|trip': {
        causes: ['Overloaded circuit', 'Short circuit', 'Faulty appliance'],
        nextCheck: 'Unplug devices; reset breaker one at a time',
        diy: 'Inspection only',
        safety: 'Do not repeatedly reset a tripping breaker',
        pro: 'Repeated breaker trips indicate an electrical fault—call an electrician.'
      },
      'shock|tingling': {
        causes: ['Damaged appliance', 'Wet condition', 'Faulty wiring'],
        nextCheck: 'Stop immediately; unplug the device',
        diy: 'Do not attempt',
        safety: 'Critical danger',
        pro: 'Call an electrician immediately. Do not use the appliance again.'
      },
      'spark|fire|smoke': {
        causes: ['Electrical arc', 'Overheating wire', 'Component failure'],
        nextCheck: 'Turn off power; evacuate if necessary',
        diy: 'Do not attempt',
        safety: 'Life-threatening danger',
        pro: 'Call 911 or your emergency services first. Do not touch.'
      }
    }
  },
  appliance: {
    dangers: {
      keywords: ['gas', 'pilot', 'leak', 'fire', 'overheat', 'mold', 'electric'],
      message: 'Some appliance issues may involve gas, electrical, or thermal hazards.',
      badge: 'Consult Professional'
    },
    issues: {
      'refrigerator|fridge': {
        causes: ['Compressor issue', 'Thermostat failure', 'Dirty condenser coils'],
        nextCheck: 'Check if it\'s running; listen for compressor sound; clean coils',
        diy: 'Beginner',
        safety: 'Unplug before cleaning',
        pro: 'Compressor or refrigerant issues need a technician.'
      },
      'washer|washing machine': {
        causes: ['Clogged drain', 'Water inlet valve', 'Drive belt wear'],
        nextCheck: 'Check drain hose; run a test cycle',
        diy: 'Beginner–Intermediate',
        safety: 'Unplug before working on it',
        pro: 'Internal drum or motor issues require a technician.'
      },
      'dryer': {
        causes: ['Clogged vent', 'Thermal fuse blown', 'Lint trap full'],
        nextCheck: 'Clean lint trap; check exhaust vent for blockage',
        diy: 'Beginner',
        safety: 'Unplug first',
        pro: 'Heating element or motor failure needs a professional.'
      },
      'dishwasher': {
        causes: ['Drain clogged', 'Spray arm blocked', 'Inlet valve stuck'],
        nextCheck: 'Check drain; inspect spray arm holes',
        diy: 'Beginner',
        safety: 'Unplug first',
        pro: 'Pump or motor replacement requires a technician.'
      },
      'microwave': {
        causes: ['Door latch broken', 'Keypad malfunction', 'Magnetron failure'],
        nextCheck: 'Check if it powers on; test keypad',
        diy: 'Inspection only',
        safety: 'Do not open—contains high-voltage components',
        pro: 'Most microwave repairs require a technician.'
      },
      'oven|stove|range': {
        causes: ['Burner element', 'Igniter failure', 'Thermostat issue'],
        nextCheck: 'Check if burners ignite; test temperature control',
        diy: 'Some elements—consult manual first',
        safety: 'Turn off gas or power; let cool',
        pro: 'Gas line or heating element issues need a professional.'
      }
    }
  },
  'heating & cooling': {
    dangers: {
      keywords: ['carbon monoxide', 'gas', 'furnace', 'fire', 'refrigerant'],
      message: 'Heating and cooling issues can involve gas, carbon monoxide, or electrical hazards.',
      badge: 'Consult HVAC Professional'
    },
    issues: {
      'not heating|no heat|cold': {
        causes: ['Thermostat set low', 'Pilot light out', 'Furnace power off', 'Blocked air intake'],
        nextCheck: 'Check thermostat setting; verify furnace is on; check for error lights',
        diy: 'Beginner',
        safety: 'Let furnace rest if it shuts off repeatedly',
        pro: 'If pilot won\'t light or furnace keeps shutting off, call HVAC immediately.'
      },
      'not cooling|no ac|hot room': {
        causes: ['Thermostat setting', 'Clogged air filter', 'Outdoor unit issue', 'Low refrigerant'],
        nextCheck: 'Check thermostat; change air filter; verify outdoor condenser is running',
        diy: 'Beginner',
        safety: 'Do not handle refrigerant',
        pro: 'Low refrigerant or compressor problems require an HVAC professional.'
      },
      'filter': {
        causes: ['Dirty filter restricting airflow'],
        nextCheck: 'Replace air filter monthly during heavy use',
        diy: 'Beginner',
        safety: 'Turn off system before changing',
        pro: 'If problems persist after filter change, call HVAC.'
      },
      'noise|loud|rattling': {
        causes: ['Loose ductwork', 'Blower issue', 'Debris in unit'],
        nextCheck: 'Check for loose ducts; inspect around outdoor unit',
        diy: 'Beginner inspection',
        safety: 'Do not open sealed units',
        pro: 'Unusual noises often indicate mechanical problems—call HVAC.'
      },
      'smell|odor': {
        causes: ['Musty smell: mold in ducts or evaporator', 'Burning smell: furnace startup or clogged filter'],
        nextCheck: 'Change air filter; check for visible mold or debris',
        diy: 'Filter change only',
        safety: 'If it smells like gas or burning insulation, turn off and call immediately',
        pro: 'Mold in ducts or electrical issues require professional service.'
      }
    }
  },
  'doors & windows': {
    dangers: {
      keywords: ['broken glass', 'security', 'leak', 'mold', 'draft'],
      message: 'Door and window issues can affect security and energy efficiency.',
      badge: 'Assess Damage'
    },
    issues: {
      'stuck|sticking|hard to open': {
        causes: ['Loose hinges', 'Frame warping from humidity', 'Paint buildup', 'Contact point rub'],
        nextCheck: 'Inspect hinges for loose screws; check for paint or debris on edges',
        diy: 'Beginner',
        safety: 'Low risk',
        pro: 'Major frame damage may need carpenter work.'
      },
      'hinge|hinge loose': {
        causes: ['Loose screws', 'Stripped screw hole', 'Hinge wear'],
        nextCheck: 'Tighten hinge screws; check if door sags',
        diy: 'Beginner',
        safety: 'Low risk',
        pro: 'If hinges are damaged, they need replacement.'
      },
      'gap|crack|leak|draft': {
        causes: ['Weatherstripping worn', 'Frame settling', 'Caulk separation'],
        nextCheck: 'Feel for drafts; inspect weatherstripping condition',
        diy: 'Beginner',
        safety: 'Low risk',
        pro: 'Large gaps may indicate structural movement—assess frame alignment.'
      },
      'glass|broken window|cracked': {
        causes: ['Impact damage', 'Thermal stress', 'Seal failure'],
        nextCheck: 'Inspect the crack; check if it\'s spreading',
        diy: 'Inspection only',
        safety: 'Handle broken glass carefully',
        pro: 'Broken glass should be replaced by a professional to maintain seal and safety.'
      },
      'lock|latch': {
        causes: ['Mechanism wear', 'Misalignment', 'Key issue'],
        nextCheck: 'Test lock smoothness; check door alignment',
        diy: 'Beginner',
        safety: 'Verify security after repair',
        pro: 'If lock is broken, replace for security.'
      }
    }
  },
  'general home repair': {
    dangers: {
      keywords: ['crack', 'mold', 'water damage', 'foundation', 'structural', 'decay'],
      message: 'Some general home issues can be serious if they indicate structural problems.',
      badge: 'Have Professional Inspect'
    },
    issues: {
      'hole|drywall damage': {
        causes: ['Impact damage', 'Normal wear'],
        nextCheck: 'Assess hole size; check for underlying damage',
        diy: 'Beginner–Intermediate',
        safety: 'Low risk',
        pro: 'Small holes: spackling. Large damage: drywall patch or professional.'
      },
      'paint|stain|discoloration': {
        causes: ['Water damage', 'Mold', 'Dirt or marks'],
        nextCheck: 'Determine if stain is wet or dry; smell for mustiness',
        diy: 'Beginner inspection',
        safety: 'If mold is present, handle with proper protection',
        pro: 'Water stains indicate a leak—find and fix the source.'
      },
      'crack|cracks|cracking': {
        causes: ['Normal settling', 'Foundation movement', 'Structural issue'],
        nextCheck: 'Measure crack width; mark it to watch for growth',
        diy: 'Inspection and documentation',
        safety: 'Monitor for changes',
        pro: 'Wide or rapidly growing cracks need structural engineering evaluation.'
      },
      'floor|squeaky|soft': {
        causes: ['Loose floorboards', 'Moisture damage', 'Subfloor rot'],
        nextCheck: 'Check for movement when walking; inspect subfloor if accessible',
        diy: 'Beginner inspection',
        safety: 'Do not ignore soft spots—they may indicate structural issues',
        pro: 'Subfloor or joist problems need a structural specialist.'
      },
      'mold|mildew|moisture': {
        causes: ['Poor ventilation', 'Water leak', 'High humidity'],
        nextCheck: 'Locate moisture source; check ventilation',
        diy: 'Small surface mold: clean with bleach solution',
        safety: 'Wear mask and gloves; ensure good ventilation',
        pro: 'Extensive mold or hidden moisture requires professional remediation.'
      }
    }
  }
};

// Form and result elements
const form = document.getElementById('diagnosisForm');
const resultText = document.getElementById('resultText');
const resultTitle = document.getElementById('resultTitle');
const nextCheck = document.getElementById('nextCheck');
const diyLevel = document.getElementById('diyLevel');
const safetyLevel = document.getElementById('safetyLevel');
const dangerWarning = document.getElementById('dangerWarning');
const warningTitle = document.getElementById('warningTitle');
const warningText = document.getElementById('warningText');
const warningBadge = document.getElementById('warningBadge');
const possibleCauses = document.getElementById('possibleCauses');
const causesList = document.getElementById('causesList');
const professionalNote = document.getElementById('professionalNote');
const professionalText = document.getElementById('professionalText');

function searchDiagnosis(category, problemText) {
  const categoryKey = category.toLowerCase();
  const categoryData = diagnosisDatabase[categoryKey];
  
  if (!categoryData) return null;
  
  const search = problemText.toLowerCase();
  
  // Check for dangers first
  let hasDanger = false;
  const dangerConfig = categoryData.dangers;
  if (dangerConfig && dangerConfig.keywords) {
    const hasKeyword = dangerConfig.keywords.some(kw => search.includes(kw));
    if (hasKeyword) {
      hasDanger = true;
    }
  }
  
  // Find matching issue
  let matchedIssue = null;
  let matchedKey = null;
  
  if (categoryData.issues) {
    for (const [keyPattern, issueData] of Object.entries(categoryData.issues)) {
      const patterns = keyPattern.split('|').map(p => p.trim());
      const matches = patterns.some(p => search.includes(p));
      if (matches) {
        matchedIssue = issueData;
        matchedKey = keyPattern;
        break;
      }
    }
  }
  
  return {
    hasDanger,
    dangerConfig: categoryData.dangers,
    matchedIssue,
    matchedKey,
    category
  };
}

function renderResults(diagnosis) {
  // Hide everything initially
  dangerWarning.style.display = 'none';
  possibleCauses.style.display = 'none';
  professionalNote.style.display = 'none';
  
  if (!diagnosis || !diagnosis.matchedIssue) {
    resultTitle.textContent = 'Tell me more';
    resultText.textContent = 'I didn\'t find a specific match. Try describing your problem with more detail about what you see, hear, or notice. For example: "dripping," "spark," "smell," "not working," etc.';
    nextCheck.textContent = 'Add more details';
    diyLevel.textContent = '—';
    safetyLevel.textContent = '—';
    return;
  }
  
  const { hasDanger, dangerConfig, matchedIssue, category } = diagnosis;
  
  // Render danger warning
  if (hasDanger && dangerConfig) {
    dangerWarning.style.display = 'flex';
    warningTitle.textContent = 'Safety Alert';
    warningText.textContent = dangerConfig.message;
    warningBadge.textContent = dangerConfig.badge;
  }
  
  // Render main response
  resultTitle.textContent = `${category} Diagnosis`;
  resultText.textContent = `This ${category.toLowerCase()} problem requires careful inspection and diagnosis. ${matchedIssue.causes && matchedIssue.causes.length > 0 ? 'The most common causes are listed below.' : 'Here\'s what we recommend:'} Start with the suggested next check before attempting any repairs.`;
  
  // Render possible causes
  if (matchedIssue.causes && matchedIssue.causes.length > 0) {
    possibleCauses.style.display = 'block';
    causesList.innerHTML = matchedIssue.causes
      .map(cause => `<li>${cause}</li>`)
      .join('');
  }
  
  // Render result grid
  nextCheck.textContent = matchedIssue.nextCheck || 'Inspect the affected area';
  diyLevel.textContent = matchedIssue.diy || 'Inspection only';
  safetyLevel.textContent = matchedIssue.safety || 'Use caution';
  
  // Render professional note
  if (matchedIssue.pro) {
    professionalNote.style.display = 'block';
    professionalText.textContent = matchedIssue.pro;
  }
}

form?.addEventListener('submit', (event) => {
  event.preventDefault();
  
  const category = document.getElementById('category').value;
  const problem = document.getElementById('problem').value.trim();
  
  if (!problem) {
    resultTitle.textContent = 'Tell me what you\'re seeing';
    resultText.textContent = 'Describe what is happening first, then press Analyze problem.';
    nextCheck.textContent = 'Add symptoms';
    diyLevel.textContent = '—';
    safetyLevel.textContent = '—';
    dangerWarning.style.display = 'none';
    possibleCauses.style.display = 'none';
    professionalNote.style.display = 'none';
    return;
  }
  
  const diagnosis = searchDiagnosis(category, problem);
  renderResults(diagnosis);
});
