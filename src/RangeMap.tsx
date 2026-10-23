import { useState } from "react";
import mapData from "./data/range-map.json";
export default function RangeMap() {
  const [port, setPort] = useState<number | null>(null);
  const [zoom, setZoom] = useState(false);
  const p = port === null ? null : mapData.ports[port];
  const view =
    zoom && p
      ? `${Math.max(0, Math.min(1908, p.x - 1909))} ${Math.max(0, p.y - 800)} 3818 1600`
      : "0 500 5725.99 2400";
  return (
    <section className="range-map" aria-label="Indicative yacht range map">
      <div className="range-toolbar">
        <label>
          Departure port
          <select
            value={port ?? ""}
            onChange={(e) =>
              setPort(e.target.value === "" ? null : Number(e.target.value))
            }
          >
            <option value="">Select a location</option>
            {mapData.ports.map((p, i) => (
              <option key={p.name} value={i}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <div className="range-legend">
          <span>
            <i />
            1200NM @ 30knts
          </span>
          <span>
            <i />
            3000NM @ 8knts
          </span>
        </div>
        <button onClick={() => setZoom(!zoom)} disabled={!p}>
          {zoom ? "Show world" : "Zoom to port"}
        </button>
      </div>
      <svg
        viewBox={view}
        role="img"
        aria-label={`Original Voodoo range map${p ? ": " + p.name : ""}`}
      >
        <rect x="0" y="0" width="5726" height="3200" fill="#0d3341" />
        <image
          href="/assets/original-range-map.svg"
          x="0"
          y="500"
          width="5725.99"
          height="2400"
        />
        {p &&
          (["long", "short"] as const).map((key) => {
            const r = p.range[key] as {
              type: string;
              d?: string;
              cx?: number;
              cy?: number;
              rx?: number;
              ry?: number;
              r?: number;
            };
            const fill = key === "long" ? "#4bc8e155" : "#4bc8e1aa";
            if (r.type === "path")
              return (
                <path
                  key={key}
                  d={r.d}
                  fill={fill}
                  stroke="#4bc8e1"
                  strokeWidth="4"
                />
              );
            if (r.type === "ellipse")
              return (
                <ellipse
                  key={key}
                  {...r}
                  fill={fill}
                  stroke="#4bc8e1"
                  strokeWidth="4"
                />
              );
            return (
              <circle
                key={key}
                {...r}
                fill={fill}
                stroke="#4bc8e1"
                strokeWidth="4"
              />
            );
          })}
        {mapData.ports.map((p, i) => (
          <g
            key={p.name}
            className="map-port"
            role="button"
            tabIndex={0}
            aria-label={`View range from ${p.name}`}
            onClick={() => setPort(i)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setPort(i);
              }
            }}
          >
            <circle cx={p.x} cy={p.y} r="65" fill="transparent" />
            <circle
              cx={p.x}
              cy={p.y}
              r={port === i ? 25 : 17}
              fill="#fff"
              stroke="#4bc8e1"
              strokeWidth="8"
            />
            <text x={p.x + 28} y={p.y - 24} fill="#fff" fontSize="39">
              {p.name}
            </text>
          </g>
        ))}
      </svg>
      <p>
        This range map is indicative only and must not be used for navigation
        purposes.
      </p>
    </section>
  );
}
