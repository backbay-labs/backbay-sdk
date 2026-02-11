/**
 * @backbay/npctv - Configuration
 *
 * Configuration resolution and defaults for the NPC.tv plugin.
 */

import type {
  NpcTvConfig,
  RelayConfig,
  ChannelConfig,
  PersonaConfig,
  FeaturesConfig,
  ChannelCategory,
  PersonaTemplateName,
  CommentaryFrequency,
} from './types.js';

/** Default relay configuration */
const DEFAULT_RELAY: RelayConfig = {
  url: 'http://localhost:3000/api/v1/npctv',
};

/** Default channel configuration */
const DEFAULT_CHANNEL: ChannelConfig = {
  name: 'Agent Stream',
  category: 'coding',
  autoGoLive: true,
};

/** Default persona configuration */
const DEFAULT_PERSONA: PersonaConfig = {
  template: 'default',
  commentaryFrequency: 'medium',
};

/** Default feature flags */
const DEFAULT_FEATURES: FeaturesConfig = {
  chat: true,
  reactions: true,
  clips: true,
  commentary: true,
};

/** Valid channel categories for validation */
const VALID_CATEGORIES: ChannelCategory[] = ['coding', 'gaming', 'fab', 'research', 'testing'];

/** Valid persona template names for validation */
const VALID_TEMPLATES: PersonaTemplateName[] = ['default', 'hype', 'chill', 'educational', 'chaotic'];

/** Valid commentary frequencies for validation */
const VALID_FREQUENCIES: CommentaryFrequency[] = ['low', 'medium', 'high'];

/**
 * Resolve raw plugin config into a fully typed NpcTvConfig with defaults.
 *
 * Accepts a partial/unknown config object (from openclaw.json or the
 * PluginAPI config bag) and returns a complete NpcTvConfig with all
 * fields filled.
 */
export function resolveConfig(raw: Record<string, unknown> = {}): NpcTvConfig {
  const rawRelay = (raw.relay ?? {}) as Record<string, unknown>;
  const rawChannel = (raw.channel ?? {}) as Record<string, unknown>;
  const rawPersona = (raw.persona ?? {}) as Record<string, unknown>;
  const rawFeatures = (raw.features ?? {}) as Record<string, unknown>;

  return {
    relay: resolveRelay(rawRelay),
    channel: resolveChannel(rawChannel),
    persona: resolvePersona(rawPersona),
    features: resolveFeatures(rawFeatures),
  };
}

function resolveRelay(raw: Record<string, unknown>): RelayConfig {
  return {
    url: typeof raw.url === 'string' && raw.url.length > 0
      ? raw.url
      : DEFAULT_RELAY.url,
    apiKey: typeof raw.apiKey === 'string' && raw.apiKey.length > 0
      ? raw.apiKey
      : undefined,
  };
}

function resolveChannel(raw: Record<string, unknown>): ChannelConfig {
  const categoryRaw = typeof raw.category === 'string' ? raw.category : '';
  const category: ChannelCategory = VALID_CATEGORIES.includes(categoryRaw as ChannelCategory)
    ? (categoryRaw as ChannelCategory)
    : DEFAULT_CHANNEL.category;

  return {
    name: typeof raw.name === 'string' && raw.name.length > 0
      ? raw.name
      : DEFAULT_CHANNEL.name,
    category,
    autoGoLive: typeof raw.autoGoLive === 'boolean'
      ? raw.autoGoLive
      : DEFAULT_CHANNEL.autoGoLive,
  };
}

function resolvePersona(raw: Record<string, unknown>): PersonaConfig {
  const templateRaw = typeof raw.template === 'string' ? raw.template : '';
  const template: PersonaTemplateName = VALID_TEMPLATES.includes(templateRaw as PersonaTemplateName)
    ? (templateRaw as PersonaTemplateName)
    : DEFAULT_PERSONA.template;

  const freqRaw = typeof raw.commentaryFrequency === 'string' ? raw.commentaryFrequency : '';
  const commentaryFrequency: CommentaryFrequency = VALID_FREQUENCIES.includes(freqRaw as CommentaryFrequency)
    ? (freqRaw as CommentaryFrequency)
    : DEFAULT_PERSONA.commentaryFrequency;

  return {
    template,
    customPrompt: typeof raw.customPrompt === 'string' && raw.customPrompt.length > 0
      ? raw.customPrompt
      : undefined,
    commentaryFrequency,
  };
}

function resolveFeatures(raw: Record<string, unknown>): FeaturesConfig {
  return {
    chat: typeof raw.chat === 'boolean' ? raw.chat : DEFAULT_FEATURES.chat,
    reactions: typeof raw.reactions === 'boolean' ? raw.reactions : DEFAULT_FEATURES.reactions,
    clips: typeof raw.clips === 'boolean' ? raw.clips : DEFAULT_FEATURES.clips,
    commentary: typeof raw.commentary === 'boolean' ? raw.commentary : DEFAULT_FEATURES.commentary,
  };
}
