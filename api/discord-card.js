import React from 'react';
import { ImageResponse } from '@vercel/og';

export const config = { runtime: 'nodejs' };

const ASSETS = {
  antharas: '/images/bosses/antharas.webp',
  baium: '/images/bosses/baium.webp',
  core: '/images/bosses/core.webp',
  frintezza: '/images/bosses/frintezza.webp',
  orfen: '/images/bosses/orfen.webp',
  'queen-ant': '/images/bosses/queen-ant.webp',
  valakas: '/images/bosses/valakas.webp',
  zaken: '/images/bosses/zaken.webp',
  siege: '/images/castles/aden.jpg',
  pvp: '/images/events/clan-pvp.webp',
  colloseum: '/images/events/colloseum-training.webp',
  olympiad: '/images/events/olympiad.jpg',
  default: '/images/logo-orzel-bialy.webp',
};

function fromB64Url(value = '') {
  try {
    const normalized = value.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(value.length / 4) * 4, '=');
    return new TextDecoder().decode(Uint8Array.from(atob(normalized), c => c.charCodeAt(0)));
  } catch {
    return '';
  }
}
function safeText(value, fallback, limit = 90) {
  const text = (value || fallback).trim().slice(0, limit);
  return text || fallback;
}
function assetUrl(key) {
  const path = ASSETS[key] || ASSETS.default;
  return 'https://orzelbialy.eu' + path;
}
function bossKey(name = '', type = '') {
  const s = name.toLowerCase();
  for (const key of ['frintezza','antharas','baium','valakas','zaken','core','orfen']) if (s.includes(key)) return key;
  if (s.includes('queen ant')) return 'queen-ant';
  if (type.toLowerCase() === 'siege') return 'siege';
  if (s.includes('pvp')) return 'pvp';
  if (s.includes('colloseum') || s.includes('colosseum')) return 'colloseum';
  if (type.toLowerCase() === 'olympiad') return 'olympiad';
  return 'default';
}

export default async function handler(req, res) {
  const url = new URL(req.url);
  const name = safeText(fromB64Url(url.searchParams.get('n')), 'Wydarzenie klanowe', 80);
  const date = safeText(fromB64Url(url.searchParams.get('d')), '--.--.----', 20);
  const time = safeText(fromB64Url(url.searchParams.get('t')), '--:--', 10);
  const location = safeText(fromB64Url(url.searchParams.get('l')), 'Lokalizacja do ustalenia', 80);
  const type = safeText(fromB64Url(url.searchParams.get('k')), 'EVENT', 30);
  const key = bossKey(name, type);
  const image = assetUrl(key);

  const card = React.createElement('div', {
    style: { width: '1200px', height: '630px', display: 'flex', position: 'relative', backgroundColor: '#090c12', overflow: 'hidden', color: '#f7f2e7', fontFamily: 'Arial, sans-serif' }
  },
    React.createElement('img', { src: image, style: { position: 'absolute', width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', opacity: 0.82 } }),
    React.createElement('div', { style: { position: 'absolute', inset: 0, display: 'flex', background: 'linear-gradient(90deg, rgba(5,8,12,0.98) 0%, rgba(5,8,12,0.90) 35%, rgba(5,8,12,0.42) 68%, rgba(5,8,12,0.18) 100%), linear-gradient(0deg, rgba(5,8,12,0.92), transparent 45%)' } }),
    React.createElement('div', { style: { position: 'absolute', inset: '24px', border: '1px solid rgba(209,164,74,0.48)', display: 'flex' } }),
    React.createElement('div', { style: { position: 'absolute', left: 60, top: 48, display: 'flex', flexDirection: 'column' } },
      React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 14, color: '#d6b46a', fontSize: 23, letterSpacing: 4, fontWeight: 700 } },
        React.createElement('span', { style: { width: 38, height: 2, background: '#c9a35b', display: 'flex' } }),
        'ORZEŁ BIAŁY · ETERNAL X10'
      ),
      React.createElement('div', { style: { marginTop: 42, display: 'flex', color: '#c6a45e', fontSize: 21, letterSpacing: 6, fontWeight: 800 } }, '⚔  RAID / CLAN EVENT'),
      React.createElement('div', { style: { marginTop: 12, display: 'flex', fontSize: 64, fontWeight: 900, letterSpacing: 1, maxWidth: 780, lineHeight: 1.04, textShadow: '0 4px 22px rgba(0,0,0,0.6)' } }, name.toUpperCase()),
      React.createElement('div', { style: { marginTop: 36, display: 'flex', fontSize: 19, color: '#bfa86b', letterSpacing: 4, fontWeight: 700 } }, 'RESPAWN / EVENT START'),
      React.createElement('div', { style: { marginTop: 12, display: 'flex', alignItems: 'baseline', gap: 30 } },
        React.createElement('div', { style: { display: 'flex', fontSize: 54, fontWeight: 900, color: '#fff7e6' } }, date),
        React.createElement('div', { style: { display: 'flex', fontSize: 82, fontWeight: 900, color: '#d5b46a', lineHeight: 1 } }, time)
      ),
      React.createElement('div', { style: { marginTop: 22, display: 'flex', fontSize: 24, color: '#f3e7cd', letterSpacing: 1 } }, '📍  ' + location),
      React.createElement('div', { style: { marginTop: 38, display: 'flex', fontSize: 18, color: '#c6c4be', letterSpacing: 2 } }, 'PRZYJEDŹ / PRZYGOTUJ SIĘ / WALCZ')
    ),
    React.createElement('div', { style: { position: 'absolute', right: 60, bottom: 48, display: 'flex', fontSize: 18, color: '#d2b16c', letterSpacing: 3, fontWeight: 700 } }, 'ORZELBIALY.EU')
  );

  try { const imageResponse = new ImageResponse(card, {
    width: 1200,
    height: 630,
    headers: { 'Cache-Control': 'public, max-age=60, s-maxage=300' },
  }); const png = Buffer.from(await imageResponse.arrayBuffer()); res.statusCode = imageResponse.status || 200; res.setHeader('Content-Type', 'image/png'); res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=300'); res.end(png); } catch (err) { console.error('Discord card render failed:', err); res.statusCode = 500; res.setHeader('Content-Type', 'text/plain'); res.end(String(err?.stack || err)); }
}
