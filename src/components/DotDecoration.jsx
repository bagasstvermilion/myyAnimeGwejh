const CENTER_RADIUS = 92;

const RINGS = [
  { radius: 116, dotSize: 12, count: 26 },
  { radius: 146, dotSize: 9, count: 32 },
  { radius: 176, dotSize: 6.5, count: 38 },
  { radius: 206, dotSize: 5, count: 44 },
  { radius: 236, dotSize: 3.5, count: 50 },
  { radius: 266, dotSize: 2, count: 56 },
];

export default function DotDecoration() {
  return (
    <svg
      aria-hidden
      className="pointer-events-none absolute left-1/2 top-1/2 z-0 h-[700px] w-[700px] -translate-x-1/2 -translate-y-1/2"
      viewBox="-350 -350 700 700"
    >
      <g className="fill-violet-400 opacity-35">
        <circle cx={0} cy={0} r={CENTER_RADIUS} />

        {RINGS.map((ring, ringIndex) =>
          Array.from({ length: ring.count }, (_, i) => {
            const angle = (i / ring.count) * Math.PI * 2 + ringIndex * 0.35;
            const cx = Math.cos(angle) * ring.radius;
            const cy = Math.sin(angle) * ring.radius;
            return (
              <circle
                key={`${ringIndex}-${i}`}
                cx={cx}
                cy={cy}
                r={ring.dotSize}
              />
            );
          }),
        )}
      </g>
    </svg>
  );
}
