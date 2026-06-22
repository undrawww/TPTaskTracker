import React from 'react';

export const AVATAR_COUNT = 10;

export const avatarURLs: string[] = [
  "https://res.cloudinary.com/dqmmfgbf1/image/upload/v1782141975/7_xo8gis.png",
  "https://res.cloudinary.com/dqmmfgbf1/image/upload/v1782141975/9_d3g1qk.png",
  "https://res.cloudinary.com/dqmmfgbf1/image/upload/v1782141975/8_ugq8xe.png",
  "https://res.cloudinary.com/dqmmfgbf1/image/upload/v1782141975/4_d2wsxn.png",
  "https://res.cloudinary.com/dqmmfgbf1/image/upload/v1782141975/3_rkqcws.png",
  "https://res.cloudinary.com/dqmmfgbf1/image/upload/v1782141974/10_lbzrje.png",
  "https://res.cloudinary.com/dqmmfgbf1/image/upload/v1782141974/5_xmpvos.png",
  "https://res.cloudinary.com/dqmmfgbf1/image/upload/v1782141974/6_q6qtvx.png",
  "https://res.cloudinary.com/dqmmfgbf1/image/upload/v1782141974/2_wtij8a.png",
  "https://res.cloudinary.com/dqmmfgbf1/image/upload/v1782141974/1_qkffqq.png",
];

/**
 * Simple deterministic hash to pick an avatar index from a name.
 */
function nameToIndex(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = ((hash << 5) - hash + name.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % avatarURLs.length;
}

/**
 * Returns a consistent avatar icon for a given name.
 */
export function getAvatarIcon(name: string): React.ReactNode {
  return (
    <img 
      src={avatarURLs[nameToIndex(name)]} 
      alt="Avatar" 
      className="w-full h-full object-cover rounded-full" 
    />
  );
}

/**
 * Returns an avatar icon by index (0–9).
 */
export function getAvatarByIndex(index: number): React.ReactNode {
  return (
    <img 
      src={avatarURLs[Math.abs(index) % avatarURLs.length]} 
      alt="Avatar" 
      className="w-full h-full object-cover rounded-full" 
    />
  );
}

/** Avatar labels for the picker */
export const AVATAR_LABELS = [
  'Avatar 1', 'Avatar 2', 'Avatar 3', 'Avatar 4',
  'Avatar 5', 'Avatar 6', 'Avatar 7', 'Avatar 8',
  'Avatar 9', 'Avatar 10',
];
