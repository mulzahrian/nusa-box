/**
 * Common utility functions used across the game
 */

export const rand = (a, b) => a + Math.random() * (b - a);
export const randInt = (a, b) => Math.floor(rand(a, b + 1));
export const choice = arr => arr[Math.floor(Math.random() * arr.length)];
export const fmtMoney = n => (n >= 1000 ? (n / 1000).toFixed(n >= 10000 ? 0 : 1) + 'k' : n.toFixed(0));
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
