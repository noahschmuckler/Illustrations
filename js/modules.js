// The library menu. Add a module here and it appears on the home page.
// `thumb` is a small inline SVG (viewBox 0 0 300 140) for the card.

export const modules = [
  {
    id: 'cholesterol',
    title: 'Cholesterol',
    blurb: 'How arteries crack and get repaired — why HDL patches smoothly while LDL leaves bulging plaque that narrows and hardens the artery.',
    href: 'modules/cholesterol.html',
    color: '#f2cf73',
    thumb: `
      <g transform="translate(150 72) rotate(-22)">
        <rect x="-120" y="-34" width="240" height="68" rx="4" fill="#c23c48"/>
        <rect x="-120" y="-26" width="240" height="52" fill="#f2a65e" opacity=".9"/>
        <ellipse cx="-120" cy="0" rx="14" ry="34" fill="#a6303c"/>
        <ellipse cx="-120" cy="0" rx="11" ry="26" fill="#3a0610"/>
        <ellipse cx="35" cy="-10" rx="40" ry="11" fill="#e6c477" stroke="#8a5428"/>
        <circle cx="-45" cy="-12" r="5" fill="#3fd2b0"/><circle cx="-34" cy="-11" r="5" fill="#3fd2b0"/><circle cx="-56" cy="-13" r="5" fill="#3fd2b0"/>
      </g>`,
  },
  {
    id: 'a1c',
    title: 'Blood Sugar & A1c',
    blurb: 'What hemoglobin A1c measures, how sugar coats red blood cells, and how high sugar damages capillaries and larger arteries.',
    href: 'modules/a1c.html',
    color: '#4aa3ff',
    thumb: `
      <rect x="0" y="52" width="300" height="36" fill="#2a0a10"/>
      <rect x="0" y="44" width="300" height="8" fill="#c8606a"/><rect x="0" y="88" width="300" height="8" fill="#c8606a"/>
      <g fill="#d22a33" stroke="#8f0f1a"><circle cx="60" cy="70" r="15"/><circle cx="150" cy="70" r="15"/><circle cx="240" cy="70" r="15"/></g>
      <g fill="#4aa3ff"><circle cx="146" cy="64" r="2.5"/><circle cx="156" cy="73" r="2.5"/><circle cx="144" cy="77" r="2.5"/><circle cx="236" cy="62" r="2.5"/><circle cx="246" cy="70" r="2.5"/><circle cx="238" cy="79" r="2.5"/><circle cx="250" cy="78" r="2.5"/><circle cx="230" cy="70" r="2.5"/>
      <circle cx="100" cy="62" r="2"/><circle cx="195" cy="80" r="2"/><circle cx="20" cy="76" r="2"/><circle cx="280" cy="60" r="2"/></g>`,
  },
];
