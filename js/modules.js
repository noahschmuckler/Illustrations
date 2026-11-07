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
  {
    id: 'triglycerides',
    title: 'Triglycerides',
    blurb: 'How extra energy — alcohol, sugar, fat — becomes triglycerides in the liver, how they worsen plaque, and how very high levels cause pancreatitis.',
    href: 'modules/triglycerides.html',
    color: '#ffad4a',
    thumb: `
      <path d="M 40 50 C 90 28 170 26 230 40 C 260 48 250 62 220 72 C 170 88 130 112 90 118 C 55 120 34 100 40 50 Z" fill="#953a2c" stroke="#e08a74"/>
      <path d="M 225 66 C 250 70 270 78 300 80" stroke="#a8323e" stroke-width="16" fill="none"/>
      <g fill="#ffad4a" stroke="#a8560c"><circle cx="246" cy="71" r="5"/><circle cx="268" cy="76" r="6"/><circle cx="290" cy="79" r="5"/><circle cx="110" cy="70" r="7"/><circle cx="150" cy="58" r="6"/><circle cx="90" cy="90" r="5"/></g>
      <circle cx="20" cy="30" r="4" fill="#4aa3ff"/><circle cx="18" cy="60" r="4" fill="#ffd84d"/><circle cx="22" cy="92" r="4" fill="#a66cff"/>`,
  },
  {
    id: 'bp',
    title: 'Blood Pressure',
    blurb: 'Systolic vs diastolic, why salt raises pressure, how the kidneys filter and sense pressure, and what each blood pressure medicine does.',
    href: 'modules/bp.html',
    color: '#ff6a74',
    thumb: `
      <polyline fill="none" stroke="#ff5a64" stroke-width="3" points="10,95 25,45 40,62 70,85 85,95 100,45 115,62 145,85 160,95 175,45 190,62 220,85 235,95 250,45 265,62 290,82"/>
      <line x1="0" y1="45" x2="300" y2="45" stroke="#ff8a8a" stroke-dasharray="5 5"/><line x1="0" y1="95" x2="300" y2="95" stroke="#7cc4ff" stroke-dasharray="5 5"/>
      <text x="8" y="30" fill="#e8eef7" font-size="20" font-weight="700" font-family="system-ui">130/80</text>`,
  },
];
