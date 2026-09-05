// ========================================
// PROFESSIONAL VS DIY LEVEL SYSTEM
// ========================================
// Shared across AI Diagnosis and Repair Guides so every result and every
// guide uses the exact same homeowner-facing language and color coding.
//
// To add a brand/name change later, this is the ONLY place the wording
// needs updating for difficulty levels — everything else references
// these constants instead of hardcoding strings.

export const LEVELS = {
  EASY_CHECK: {
    slug: 'easy-check',
    label: 'Easy homeowner check',
    className: 'level-easy',
    description: 'Anyone can safely look into this without tools or experience.'
  },
  BEGINNER: {
    slug: 'beginner',
    label: 'Beginner DIY',
    className: 'level-beginner',
    description: 'A first-time DIYer can usually handle this with basic tools.'
  },
  INTERMEDIATE: {
    slug: 'intermediate',
    label: 'Intermediate DIY',
    className: 'level-intermediate',
    description: 'Comfortable with tools and willing to follow detailed steps.'
  },
  ADVANCED: {
    slug: 'advanced',
    label: 'Advanced repair',
    className: 'level-advanced',
    description: 'Experienced DIYers only — mistakes here can be costly or unsafe.'
  },
  PROFESSIONAL: {
    slug: 'professional',
    label: 'Professional recommended',
    className: 'level-professional',
    description: 'Licensed or certified help is strongly recommended for this.'
  },
  EMERGENCY: {
    slug: 'emergency',
    label: 'Emergency — stop immediately',
    className: 'level-emergency',
    description: 'Stop what you are doing and contact a professional or emergency services now.'
  }
};

export const LEVEL_LIST = Object.values(LEVELS);

export function getLevelBySlug(slug) {
  return LEVEL_LIST.find(l => l.slug === slug) || null;
}
