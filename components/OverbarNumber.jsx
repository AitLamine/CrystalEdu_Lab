'use client'

// Renders a Miller index digit with a proper crystallographic overbar (a
// horizontal line drawn exactly above the digit) for negative values, instead
// of relying on the Unicode combining macron (̅) which mis-positions
// itself across fonts/browsers.
export default function OverbarNumber({ n }) {
  const digit = String(Math.abs(n));
  if (n >= 0) return <span>{digit}</span>;
  return (
    <span style={{ position: 'relative', display: 'inline-block' }}>
      {digit}
      <span style={{ position: 'absolute', top: '-0.2em', left: 0, right: 0, borderTop: '1.4px solid currentColor' }} />
    </span>
  );
}
