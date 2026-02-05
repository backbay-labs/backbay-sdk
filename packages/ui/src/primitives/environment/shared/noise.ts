const NOISE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
  <filter id="n">
    <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" seed="2" stitchTiles="stitch" />
    <feColorMatrix type="saturate" values="0" />
  </filter>
  <rect width="200" height="200" filter="url(#n)" opacity="0.55" />
</svg>`;

export const NOISE_DATA_URL = `data:image/svg+xml,${encodeURIComponent(NOISE_SVG)}`;

