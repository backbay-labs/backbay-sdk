import type { Particle, WeatherConfig, WeatherType } from './types';
import { WEATHER_CONFIGS } from './types';
import type { EnvironmentStylePreset } from '../shared/types';

function smoothstep(edge0: number, edge1: number, x: number) {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

function getSpawnPosition(
  bounds: { width: number; height: number },
  velocity: { x: number; y: number }
) {
  const margin = 40;
  if (Math.abs(velocity.x) > Math.abs(velocity.y)) {
    return {
      x: velocity.x > 0 ? -margin : bounds.width + margin,
      y: Math.random() * bounds.height,
    };
  }

  return {
    x: Math.random() * bounds.width,
    y: velocity.y > 0 ? -margin : bounds.height + margin,
  };
}

function getLifeRangeMs(type: WeatherType): [number, number] {
  switch (type) {
    case 'rain':
      return [900, 2200];
    case 'snow':
      return [3200, 7200];
    case 'dust':
      return [5000, 11000];
    case 'leaves':
      return [6000, 14000];
    case 'embers':
      return [2600, 6500];
    case 'fireflies':
      return [4500, 9000];
    case 'ash':
      return [4500, 10000];
    case 'sakura':
      return [6500, 15000];
    case 'sparks':
      return [450, 1200];
    case 'spores':
      return [5000, 12000];
    default:
      return [3000, 8000];
  }
}

export function createParticle(
  id: number,
  type: WeatherType,
  config: WeatherConfig,
  wind: { x: number; y: number },
  bounds: { width: number; height: number },
  stylePreset: EnvironmentStylePreset = 'ui',
  colorsOverride?: readonly string[]
): Particle {
  const [minSize, maxSize] = config.sizeRange;
  const [minOpacity, maxOpacity] = config.opacityRange;
  const [minSpeed, maxSpeed] = config.speedRange;

  const speed = minSpeed + Math.random() * (maxSpeed - minSpeed);
  let vx = wind.x * speed;
  let vy = wind.y * speed;

  const depth = stylePreset === 'cinematic' ? Math.sqrt(Math.random()) : 0;
  const sizeScale = stylePreset === 'cinematic' ? 0.55 + (1 - depth) * 0.45 : 1;
  const speedScale = stylePreset === 'cinematic' ? 0.6 + (1 - depth) * 0.4 : 1;
  const opacityScale = stylePreset === 'cinematic' ? 0.45 + (1 - depth) * 0.55 : 1;

  switch (config.motionStyle) {
    case 'fall':
      vy = speed;
      vx = wind.x * 2 + (Math.random() - 0.5) * 0.5;
      break;
    case 'rise':
      vy = -speed;
      vx = wind.x + (Math.random() - 0.5) * 2;
      break;
    case 'drift': {
      // Some particles should always "fall" even when drifting (snow, leaves, petals).
      const allowUpdraft = type === 'dust' || type === 'fireflies';
      const verticalSign = allowUpdraft ? (Math.random() > 0.5 ? 1 : -1) : 1;

      const driftFallScale =
        type === 'snow' ? 0.35 :
          type === 'leaves' ? 0.55 :
            type === 'sakura' ? 0.45 :
              0.3;

      vy = speed * driftFallScale * verticalSign;
      vx = wind.x + (Math.random() - 0.5) * 2;
      break;
    }
    case 'erratic':
      vy = (Math.random() - 0.3) * speed;
      vx = (Math.random() - 0.5) * speed * 2;
      break;
  }

  vx *= speedScale;
  vy *= speedScale;

  const [minLife, maxLife] = getLifeRangeMs(type);
  const maxLifeMs = minLife + Math.random() * (maxLife - minLife);
  const palette = colorsOverride && colorsOverride.length > 0 ? colorsOverride : config.colors;
  const color = palette.length > 0 ? palette[Math.floor(Math.random() * palette.length)] : '#ffffff';
  const baseOpacity = (minOpacity + Math.random() * (maxOpacity - minOpacity)) * opacityScale;
  const baseSize = (minSize + Math.random() * (maxSize - minSize)) * sizeScale;

  // Only some weather types should visibly twinkle.
  const twinkleAmountBase =
    type === 'fireflies' ? 0.55 :
      type === 'sparks' ? 0.35 :
        type === 'embers' ? 0.18 :
          type === 'spores' ? 0.12 :
            0;

  const twinkleAmount = stylePreset === 'cinematic' ? twinkleAmountBase * 0.65 : twinkleAmountBase;
  const twinkleSpeed =
    type === 'sparks' ? 0.03 :
      type === 'fireflies' ? 0.008 :
        type === 'embers' ? 0.01 :
          type === 'spores' ? 0.007 :
            0;

  const driftPhase = Math.random() * Math.PI * 2;
  const twinklePhase = Math.random() * Math.PI * 2;

  const velocity = { x: vx, y: vy };
  const spawn = getSpawnPosition(bounds, velocity);

  const rotation =
    config.shape === 'streak'
      ? (Math.atan2(velocity.y, velocity.x) * 180) / Math.PI - 90
      : Math.random() * 360;

  const rotationSpeed =
    config.shape === 'leaf' || config.shape === 'petal'
      ? (stylePreset === 'cinematic' ? 0.03 : 0.06) * (Math.random() > 0.5 ? 1 : -1)
      : 0;

  return {
    id,
    x: spawn.x,
    y: spawn.y,
    size: baseSize,
    opacity: baseOpacity,
    rotation,
    rotationSpeed,
    velocity,
    life: 0,
    maxLife: maxLifeMs,
    color,
    baseOpacity,
    depth,
    driftPhase,
    twinklePhase,
    twinkleSpeed,
    twinkleAmount,
  };
}

export function updateParticle(
  particle: Particle,
  config: WeatherConfig,
  deltaTime: number
): Particle {
  const newLife = particle.life + deltaTime;
  const lifeRatio = newLife / particle.maxLife;

  // Fade in/out
  const fadeIn = smoothstep(0, 0.08, lifeRatio);
  const fadeOut = 1 - smoothstep(0.82, 1, lifeRatio);
  let opacity = particle.baseOpacity * fadeIn * fadeOut;

  if (particle.twinkleAmount > 0 && particle.twinkleSpeed > 0) {
    const tw = Math.sin(newLife * particle.twinkleSpeed + particle.twinklePhase);
    opacity *= Math.max(0.15, 1 + tw * particle.twinkleAmount * 0.5);
  }

  // Add some drift variation
  let vx = particle.velocity.x;
  let vy = particle.velocity.y;

  if (config.motionStyle === 'drift') {
    vx += Math.sin(newLife * 0.002 + particle.driftPhase) * 0.18;
    vy += Math.cos(newLife * 0.0016 + particle.driftPhase) * 0.07;
  } else if (config.motionStyle === 'erratic') {
    vx += Math.sin(newLife * 0.01 + particle.driftPhase) * 0.25;
    vy += Math.cos(newLife * 0.012 + particle.driftPhase) * 0.18;
  }

  return {
    ...particle,
    x: particle.x + vx * deltaTime * 0.1,
    y: particle.y + vy * deltaTime * 0.1,
    rotation: particle.rotation + particle.rotationSpeed * deltaTime,
    life: newLife,
    opacity,
  };
}

export function getParticleCount(
  type: WeatherType,
  intensity: number,
  maxParticles: number,
  stylePreset: EnvironmentStylePreset = 'ui'
): number {
  const config = WEATHER_CONFIGS[type];
  const styleScale =
    stylePreset === 'cinematic'
      ? type === 'snow'
        ? 1.8
        : type === 'leaves'
          ? 1.4
          : 0.7
      : 1;
  const desired = Math.floor(config.baseCount * intensity * styleScale);
  return Math.min(desired, maxParticles);
}
