import { Action, HallucinationOption, KeywordEntry, Level } from '../types';
import { matchKeywords, tokenize } from './PromptParser';

const BASE_HALLUCINATION_RATE = 0.3;
const EXTRA_WORD_PENALTY = 0.05;
const MINIMUM_WORDS = 3;
const COFFEE_BONUS_THRESHOLD = 75;
const COFFEE_BONUS = 0.1;
const MAX_HALLUCINATION_RATE = 0.8;

function calculateHallucinationRate(
  tokenCount: number,
  coffee: number
): number {
  let rate = BASE_HALLUCINATION_RATE;
  const extraWords = Math.max(0, tokenCount - MINIMUM_WORDS);
  rate += extraWords * EXTRA_WORD_PENALTY;
  if (coffee > COFFEE_BONUS_THRESHOLD) {
    rate -= COFFEE_BONUS;
  }
  return Math.min(MAX_HALLUCINATION_RATE, Math.max(0, rate));
}

function pickWeightedRandom(options: HallucinationOption[]): Action {
  const totalWeight = options.reduce((sum, o) => sum + o.weight, 0);
  let roll = Math.random() * totalWeight;
  for (const option of options) {
    roll -= option.weight;
    if (roll <= 0) {
      return option.action;
    }
  }
  return options[options.length - 1].action;
}

function mergeCorrectActions(matched: KeywordEntry[]): Action {
  const base: Action = {
    action: 'move',
    direction: 'right',
    speed: 1,
    hallucinated: false,
    flavor: 'AI: "Oke, aku paham. Mengerjakan sekarang..."',
  };

  for (const entry of matched) {
    const correct = entry.correctAction;
    if (correct.action) base.action = correct.action;
    if (correct.direction) base.direction = correct.direction;
    if (correct.speed) base.speed = correct.speed;
    if (correct.specialEffect) base.specialEffect = correct.specialEffect;
  }

  return base;
}

export function processPrompt(
  input: string,
  level: Level,
  coffee: number
): Action {
  const tokens = tokenize(input);
  const matched = matchKeywords(tokens, level.keywordEntries);

  // No keywords matched
  if (matched.length === 0) {
    return { ...level.defaultAction };
  }

  const rate = calculateHallucinationRate(tokens.length, coffee);

  // Check each matched keyword for hallucination
  const hallucinatedEntries: KeywordEntry[] = [];
  const correctEntries: KeywordEntry[] = [];

  for (const entry of matched) {
    if (Math.random() < rate) {
      hallucinatedEntries.push(entry);
    } else {
      correctEntries.push(entry);
    }
  }

  // If any keyword hallucinated, pick from the first hallucinated entry
  if (hallucinatedEntries.length > 0) {
    const entry = hallucinatedEntries[0];
    const action = pickWeightedRandom(entry.hallucinations);
    return { ...action };
  }

  // All keywords correct -- merge their effects
  return mergeCorrectActions(matched);
}
