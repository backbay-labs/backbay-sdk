/**
 * @backbay/npctv - Commentary Generation
 *
 * Generates optional narration / commentary for stream events
 * based on the active persona template and event type.
 */

import type {
  StreamEvent,
  PersonaTemplateName,
  CommentaryFrequency,
} from '../types.js';

/**
 * Frequency thresholds: what fraction of events should get commentary.
 *
 * We use a simple random roll per event. Low = ~20%, medium = ~45%, high = ~75%.
 */
const FREQUENCY_CHANCE: Record<CommentaryFrequency, number> = {
  low: 0.2,
  medium: 0.45,
  high: 0.75,
};

/**
 * Commentary lookup: persona × event-type → array of possible lines.
 * One is chosen at random when commentary fires.
 */
const COMMENTARY: Record<PersonaTemplateName, Partial<Record<StreamEvent['type'], string[]>>> = {
  default: {
    command: [
      'Running this to see where we stand...',
      'Let me check something real quick.',
      'Alright, let\'s see what happens.',
    ],
    success: [
      'That worked. Moving on.',
      'Clean. Next step.',
      'Exactly what I expected.',
    ],
    error: [
      'Hmm, that didn\'t go as planned. Let me look at this.',
      'Okay, error. Let\'s figure out what happened.',
      'Not ideal. Let me dig in.',
    ],
    info: [
      'Taking a look at this...',
      'Just reading through the code here.',
    ],
  },

  hype: {
    command: [
      'HERE WE GO! Executing...',
      'LET\'S SEE WHAT THIS BAD BOY DOES!',
      'Sending it! Chat, hold on to your seats!',
    ],
    success: [
      'LET\'S GOOOOO! That just worked first try!',
      'CLEAN EXECUTION! W in the chat!',
      'NO ERRORS?! WE ARE SO BACK!',
      'ABSOLUTE LEGEND BEHAVIOR! It works!',
    ],
    error: [
      'OH NO NO NO... chat we have a PROBLEM!',
      'PAIN. But this is CONTENT! Let\'s fix it!',
      'Error?! Even better — debugging streams are the BEST streams!',
      'Chat, we\'re debugging live. THIS IS WHAT YOU CAME FOR!',
    ],
    info: [
      'Scouting the codebase... reconnaissance time!',
      'Reading through this — knowledge is POWER chat!',
    ],
    output: [
      'LOOK AT THAT OUTPUT! Beautiful!',
      'Data coming in hot! Let\'s analyze!',
    ],
  },

  chill: {
    command: [
      'Running this...',
      'Let\'s see.',
    ],
    success: [
      'Nice.',
      'That\'s clean.',
      'Cool, works.',
    ],
    error: [
      'Hmm. Let me look at that.',
      'Small hiccup. No worries.',
      'Okay. Deep breath. Let\'s fix this.',
    ],
    info: [
      'Just checking something.',
    ],
  },

  educational: {
    command: [
      'I\'m running this command because we need to verify our changes. Watch the output carefully.',
      'Let me execute this so we can see the result. I\'ll explain what we\'re looking for.',
      'Running this step — if it works, we\'ll know our approach is correct.',
    ],
    success: [
      'It worked as expected. Here\'s why: our changes aligned with the existing architecture.',
      'Success. Notice how the output confirms what we predicted earlier.',
      'That\'s the result we wanted. Let me explain why this approach was the right call.',
    ],
    error: [
      'We got an error. This is actually a great learning moment — let\'s read it carefully.',
      'Error output. The key information is usually in the last few lines. Let me walk through it.',
      'This failed, and that\'s okay. Debugging is where the real learning happens.',
    ],
    info: [
      'Let me read through this code. I\'ll explain the important parts as I go.',
      'Looking at the structure here — notice how the pieces connect.',
    ],
    output: [
      'Let me break down this output for you.',
      'Here\'s what this output is telling us.',
    ],
  },

  chaotic: {
    command: [
      'YOLO! Sending it!',
      'No tests needed. Ship first, fix later.',
      'Watch this. Either it works or it\'s content.',
    ],
    success: [
      'SHIP IT! Never doubted it for a second!',
      'It works and I have no idea why! NEXT!',
      'First try. Obviously. I don\'t miss.',
      'That\'s what I call speedrunning development!',
    ],
    error: [
      'LMAO what. Okay okay okay let me just—',
      'Error? You mean "surprise feature"! Let\'s pivot!',
      'Chat said this would happen. Chat was right. CHAT NEVER LIES.',
      'This is fine. Everything is fine. *refactors entire module*',
    ],
    info: [
      'Reading code at the speed of light...',
      'Hold on let me understand this in 0.3 seconds...',
    ],
    output: [
      'Output acquired. Processing... processing... UNDERSTOOD.',
      'I can feel the data flowing through me.',
    ],
  },
};

/**
 * Generate optional commentary for a stream event.
 *
 * Returns a commentary string if the random roll passes for the given
 * frequency, or `null` if no commentary should be generated.
 *
 * @param event - The stream event to potentially comment on
 * @param template - The active persona template name
 * @param frequency - How often commentary should appear
 */
export function generateCommentary(
  event: StreamEvent,
  template: PersonaTemplateName,
  frequency: CommentaryFrequency = 'medium',
): string | null {
  // Don't comment on commentary (prevent infinite loops)
  if (event.type === 'commentary') return null;

  // Roll against the frequency threshold
  const chance = FREQUENCY_CHANCE[frequency] ?? FREQUENCY_CHANCE.medium;
  if (Math.random() > chance) return null;

  // Look up possible lines for this persona + event type
  const personaLines = COMMENTARY[template] ?? COMMENTARY['default'];
  const lines = personaLines[event.type];

  if (!lines || lines.length === 0) return null;

  // Pick one at random
  const idx = Math.floor(Math.random() * lines.length);
  return lines[idx] ?? null;
}
