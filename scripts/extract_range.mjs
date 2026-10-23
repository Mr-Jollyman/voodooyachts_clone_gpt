import fs from "node:fs";
import { parseExpression } from "@babel/parser";
const source = fs.readFileSync(
  process.argv[2] || "/workspace/site-source/live-range-app.js",
  "utf8",
);
const start = source.indexOf("ports:[") + 6;
let depth = 0,
  quoted = false,
  escape = false,
  end = start;
for (; end < source.length; end++) {
  const c = source[end];
  if (quoted) {
    if (escape) escape = false;
    else if (c === "\\") escape = true;
    else if (c === '"') quoted = false;
  } else if (c === '"') quoted = true;
  else if (c === "[") depth++;
  else if (c === "]" && --depth === 0) {
    end++;
    break;
  }
}
function literal(n) {
  if (["StringLiteral", "NumericLiteral", "BooleanLiteral"].includes(n.type))
    return n.value;
  if (n.type === "ArrayExpression") return n.elements.map(literal);
  if (n.type === "ObjectExpression")
    return Object.fromEntries(
      n.properties.map((p) => [p.key.name ?? p.key.value, literal(p.value)]),
    );
  if (n.type === "UnaryExpression" && n.operator === "-")
    return -literal(n.argument);
  throw Error("Nonliteral map data");
}
const ports = literal(parseExpression(source.slice(start, end)));
const map = source.slice(
  source.indexOf('L("svg",{ref:"svgMap"'),
  source.indexOf('L("svg",{staticClass:"rm_magnify"'),
);
const paths = [
  ...map.matchAll(
    /L\("path",\{(?:staticClass:"([^"]+)",)?attrs:\{d:("(?:\\.|[^"\\])*")/g,
  ),
].map((m) => ({ className: m[1] || "", d: JSON.parse(m[2]) }));
fs.writeFileSync("src/data/range-map.json", JSON.stringify({ ports }));
console.log(
  "Recovered original range map:",
  ports.length,
  "ports,",
  paths.length,
  "SVG paths.",
);
// Recover the original static SVG hierarchy, including clip paths and transforms.
const svgStart = source.indexOf('L("svg",{ref:"svgMap"');
let d = 0,
  q = "",
  esc = false,
  svgEnd = svgStart;
for (; svgEnd < source.length; svgEnd++) {
  const c = source[svgEnd];
  if (q) {
    if (esc) esc = false;
    else if (c === "\\") esc = true;
    else if (c === q) q = "";
  } else if (c === '"' || c === "'") q = c;
  else if (c === "(") d++;
  else if (c === ")" && --d === 0) {
    svgEnd++;
    break;
  }
}
const expression = parseExpression(source.slice(svgStart, svgEnd));
const xmlEscape = (s) =>
  String(s)
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;");
function svg(n) {
  if (n?.type === "ArrayExpression") return n.elements.map(svg).join("");
  if (
    n?.type !== "CallExpression" ||
    n.callee.name !== "L" ||
    n.arguments[0]?.type !== "StringLiteral"
  )
    return "";
  const tag = n.arguments[0].value;
  if (
    ![
      "svg",
      "g",
      "path",
      "circle",
      "ellipse",
      "polygon",
      "polyline",
      "rect",
      "defs",
      "clipPath",
      "use",
      "line",
    ].includes(tag)
  )
    return "";
  let attrs = "",
    children = "";
  for (const a of n.arguments.slice(1)) {
    if (a.type === "ArrayExpression") {
      children += svg(a);
      continue;
    }
    if (a.type !== "ObjectExpression") continue;
    for (const p of a.properties) {
      const key = p.key.name ?? p.key.value;
      if (key === "staticClass" && p.value.type === "StringLiteral")
        attrs += ` class="${xmlEscape(p.value.value)}"`;
      if (key === "attrs" && p.value.type === "ObjectExpression")
        for (const prop of p.value.properties) {
          const k = prop.key.name ?? prop.key.value;
          const val = prop.value;
          if (
            ["StringLiteral", "NumericLiteral"].includes(val.type) &&
            !["id", "viewBox"].includes(k)
          )
            attrs += ` ${k}="${xmlEscape(val.value)}"`;
          if (k === "id" && val.type === "StringLiteral")
            attrs += ` id="${xmlEscape(val.value)}"`;
        }
    }
  }
  if (tag === "svg") return children;
  return `<${tag}${attrs}>${children}</${tag}>`;
}
const svgBody = svg(expression);
fs.writeFileSync(
  "public/assets/original-range-map.svg",
  `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 500 5725.99 2400"><style>.st0{opacity:.75}.st1{fill:#6d99aa;fill-rule:evenodd}.st2{fill:#74a0b1;fill-rule:evenodd}.st3{fill:#82aab9;fill-rule:evenodd}.st4{fill:#6794a6;fill-rule:evenodd}.st6{fill:none;stroke:#003241}.st7{opacity:.25;fill:#003241}.st8{clip-path:url(#SVGID_2_)}.st9{fill:#a6b7bc}.st10{clip-path:url(#SVGID_2_);fill:#ccd6d9}.st11{fill:#a6c3cd;fill-rule:evenodd}.st12{fill:#3f6f8a}.st13{fill:#003241}</style>${svgBody}</svg>`,
);
console.log("Recovered static map hierarchy:", svgBody.length, "bytes");
