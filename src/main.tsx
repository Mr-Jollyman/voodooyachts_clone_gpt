import React, { useEffect, useRef, useState, type CSSProperties } from "react";
import { createRoot } from "react-dom/client";
import DOMPurify from "dompurify";
import rawSite from "./data/site.json";
const RangeMap = React.lazy(() => import("./RangeMap"));
import "@fontsource/open-sans/latin-400.css";
import "@fontsource/open-sans/latin-700.css";
import "./styles.css";

type Node = {
  type: string;
  attrs?: Record<string, string>;
  children?: Node[];
  html?: string;
  images?: { src: string; alt: string }[];
};
type Page = {
  id: string;
  title: string;
  path: string;
  kind: string;
  description: string;
  nodes: Node[];
  thumbnail?: string;
};
type Asset = {
  src: string;
  source: string;
  width?: number;
  height?: number;
  variants?: { src: string; width: number }[];
};
const site = rawSite as unknown as {
  pages: Page[];
  assets: Record<string, Asset>;
  logo: string;
};
const pages = site.pages;
const models = pages.filter((p) => p.kind === "yacht");
const navModels = [
  "XF50",
  "XF60",
  "XF66",
  "XF75",
  "XF80",
  "XF85",
  "DSF86",
  "XF95",
  "XF450",
]
  .map((title) => models.find((p) => p.title === title)!)
  .filter(Boolean);
const stories = pages.filter((p) => p.kind === "story");
const assetBySrc = Object.fromEntries(
  Object.values(site.assets).map((a) => [a.src, a]),
);
const nav = [
  ["Home", "/"],
  ["Secret Of Speed", "/secret-of-speed/"],
  ["Unlock The Oceans", "/unlock-the-oceans/"],
  ["Welcome Aboard", "/welcome-aboard/"],
  ["Yachts", "/#yachts"],
  ["Travel Stories", "/travel-stories/"],
  ["Our Story", "/our-story-2/"],
  ["Sustainability", "/sustainability/"],
  ["Careers", "/careers/"],
];
const clean = (text: string) =>
  DOMPurify.sanitize(
    text.replace(/<h1(\s[^>]*)?>/gi, "<h2>").replace(/<\/h1>/gi, "</h2>"),
    {
      ALLOWED_TAGS: [
        "p",
        "h1",
        "h2",
        "h3",
        "h4",
        "h5",
        "h6",
        "a",
        "img",
        "strong",
        "em",
        "b",
        "i",
        "br",
        "ul",
        "ol",
        "li",
        "table",
        "tbody",
        "tr",
        "td",
        "th",
        "span",
        "div",
        "sup",
        "sub",
        "blockquote",
      ],
      ALLOWED_ATTR: [
        "href",
        "src",
        "alt",
        "width",
        "height",
        "colspan",
        "rowspan",
      ],
      FORBID_ATTR: ["style", "onclick"],
    },
  );
function dynamicText(s: string) {
  if (!s.startsWith("@ET-DC@")) return s;
  try {
    return JSON.parse(atob(s.split("@")[2])).settings?.custom_text || "";
  } catch {
    return "";
  }
}
function firstImage(nodes: Node[]): string {
  for (const n of nodes) {
    const a = n.attrs || {};
    if (a.background_image) return a.background_image;
    if (n.type === "et_pb_image" && a.src) return a.src;
    const child = firstImage(n.children || []);
    if (child) return child;
  }
  return "";
}
function photoAlt(src: string) {
  return (assetBySrc[src]?.source.split("/").pop() || "Voodoo yacht")
    .replace(/\.[^.]+$/, "")
    .replace(/[-_]/g, " ");
}
function Photo({
  src,
  alt,
  className = "",
  priority = false,
  onClick,
}: {
  src: string;
  alt?: string;
  className?: string;
  priority?: boolean;
  onClick?: () => void;
}) {
  const a = assetBySrc[src];
  if (!src) return null;
  return (
    <img
      src={src}
      srcSet={a?.variants?.map((v) => `${v.src} ${v.width}w`).join(", ")}
      sizes="(max-width: 700px) 100vw, (max-width: 1100px) 75vw, 1280px"
      width={a?.width || 1600}
      height={a?.height || 900}
      alt={alt || photoAlt(src)}
      className={className}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      onClick={onClick}
    />
  );
}
function useDialog(open: boolean, close: () => void) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
    const cancel = (e: Event) => {
      e.preventDefault();
      close();
    };
    el.addEventListener("cancel", cancel);
    return () => el.removeEventListener("cancel", cancel);
  }, [open, close]);
  return ref;
}
function Gallery({ images }: { images: { src: string; alt: string }[] }) {
  const [selected, setSelected] = useState<number | null>(null);
  const close = () => setSelected(null);
  const ref = useDialog(selected !== null, close);
  const good = images.filter((i) => i.src);
  if (!good.length) return null;
  return (
    <div className="gallery">
      <div className="gallery-grid">
        {good.map((im, i) => (
          <button
            key={im.src + i}
            type="button"
            className="gallery-thumb"
            onClick={() => setSelected(i)}
            aria-label={`Open ${im.alt || "yacht photograph"} ${i + 1}`}
          >
            <Photo {...im} />
            <span aria-hidden="true">＋</span>
          </button>
        ))}
      </div>
      <dialog
        ref={ref}
        className="lightbox"
        aria-label="Yacht photo gallery"
        onClick={(e) => {
          if (e.target === e.currentTarget) close();
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight")
            setSelected((x) => (x === null ? null : (x + 1) % good.length));
          if (e.key === "ArrowLeft")
            setSelected((x) =>
              x === null ? null : (x + good.length - 1) % good.length,
            );
        }}
      >
        <button className="close" onClick={close} aria-label="Close gallery">
          ×
        </button>
        {selected !== null && (
          <>
            <Photo {...good[selected]} priority />
            <div className="gallery-controls">
              <button
                aria-label="Previous photograph"
                onClick={() =>
                  setSelected((selected + good.length - 1) % good.length)
                }
              >
                ←
              </button>
              <p>
                {selected + 1} / {good.length}
              </p>
              <button
                aria-label="Next photograph"
                onClick={() => setSelected((selected + 1) % good.length)}
              >
                →
              </button>
            </div>
          </>
        )}
      </dialog>
    </div>
  );
}
function SourceSlider({ nodes }: { nodes: Node[] }) {
  const [index, setIndex] = useState(0);
  const slides = nodes
    .filter((n) => n.type === "et_pb_slide")
    .map((n) => ({
      src: n.attrs?.image || n.attrs?.background_image || "",
      alt: photoAlt(n.attrs?.image || n.attrs?.background_image || ""),
    }))
    .filter((n) => n.src);
  if (!slides.length) return null;
  const layout = nodes.some((n) => n.attrs?.background_image);
  return (
    <div
      className={layout ? "layout-slider" : "spec-slide"}
      role="group"
      aria-label={layout ? "Yacht layout viewer" : "Yacht measurements"}
    >
      <Photo {...slides[index]} />
      {slides.length > 1 && (
        <div className="slide-controls">
          <button
            aria-label={layout ? "Previous layout" : "Previous measurements"}
            onClick={() =>
              setIndex((index + slides.length - 1) % slides.length)
            }
          >
            ←
          </button>
          <span>
            {layout
              ? `Layout ${index + 1} of ${slides.length}`
              : "Metric / Imperial"}
          </span>
          <button
            aria-label={layout ? "Next layout" : "Next measurements"}
            onClick={() => setIndex((index + 1) % slides.length)}
          >
            →
          </button>
        </div>
      )}
    </div>
  );
}
function HeroVideo({ src, poster }: { src: string; poster: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const manuallyPaused = useRef(false);
  useEffect(() => {
    const video = ref.current;
    if (!video || matchMedia("(prefers-reduced-motion: reduce)").matches)
      return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !manuallyPaused.current)
          video.play().catch(() => {});
        else video.pause();
      },
      { threshold: 0.15 },
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, []);
  return (
    <div className="hero-video">
      <video
        ref={ref}
        src={src}
        poster={poster}
        muted
        playsInline
        loop
        preload="none"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        aria-label="Voodoo Yachts welcome film"
      />
      <button
        className="video-control"
        onClick={() => {
          if (playing) {
            manuallyPaused.current = true;
            ref.current?.pause();
          } else {
            manuallyPaused.current = false;
            ref.current?.play().catch(() => setPlaying(false));
          }
        }}
      >
        {playing ? "Ⅱ Pause film" : "▷ Play film"}
      </button>
      <button
        className="scroll-cue"
        aria-label="Discover Voodoo Yachts"
        onClick={(e) => {
          let block = e.currentTarget.closest(".hero-video");
          if (block?.parentElement?.classList.contains("source-section"))
            block = block.parentElement;
          block?.nextElementSibling?.scrollIntoView({
            behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
              ? "auto"
              : "smooth",
          });
        }}
      >
        ⌄
      </button>
    </div>
  );
}
function YachtCards() {
  return (
    <div className="yacht-grid" id="yachts">
      {models.map((p) => (
        <article className="yacht-card" key={p.id}>
          <a href={p.path}>
            <Photo
              src={firstImage(p.nodes)}
              alt={`${p.title} luxury adventure yacht`}
            />
            <h3>{p.title.replace(/^(XF|DSF)/, "$1 ")}</h3>
          </a>
          <a className="text-link" href={p.path}>
            Discover {p.title} <span>→</span>
          </a>
        </article>
      ))}
    </div>
  );
}
function StoryCards() {
  return (
    <div className="story-grid">
      {stories.map((p) => (
        <a key={p.id} href={p.path} className="story-card">
          <Photo src={p.thumbnail || firstImage(p.nodes)} alt={p.title} />
          <h2>{p.title}</h2>
          <span className="text-link">Read story →</span>
        </a>
      ))}
    </div>
  );
}
function Enquiry({ model }: { model: string }) {
  const [done, setDone] = useState(false);
  const [value, setValue] = useState(model);
  useEffect(() => {
    setValue(model);
    setDone(false);
  }, [model]);
  return (
    <div id="enquire" className="enquiry">
      <h2>Let’s Talk</h2>
      {done ? (
        <div role="status" className="confirmation">
          <h3>Thank you for your enquiry.</h3>
          <p>
            Your enquiry was captured in this prototype for demonstration only.
            It was not sent.
          </p>
          <button onClick={() => setDone(false)}>Make another enquiry</button>
        </div>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setDone(true);
          }}
        >
          <div className="form-row">
            <label>
              Name <span>*</span>
              <input name="name" autoComplete="name" required maxLength={120} />
            </label>
            <label>
              Email <span>*</span>
              <input
                name="email"
                type="email"
                autoComplete="email"
                required
                maxLength={200}
              />
            </label>
          </div>
          <div className="form-row">
            <label>
              Telephone <small>(optional)</small>
              <input
                name="telephone"
                type="tel"
                autoComplete="tel"
                maxLength={60}
              />
            </label>
            <label>
              Model of interest
              <select
                name="model"
                value={value}
                onChange={(e) => setValue(e.target.value)}
              >
                <option value="">General enquiry</option>
                {models.map((p) => (
                  <option key={p.id} value={p.title}>
                    {p.title}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label>
            Message <span>*</span>
            <textarea name="message" required rows={4} maxLength={5000} />
          </label>
          <p className="form-note">
            Client review prototype. Enquiries are not sent or stored.
          </p>
          <button className="button" type="submit">
            Send demo enquiry <span>→</span>
          </button>
        </form>
      )}
    </div>
  );
}
function Footer({ model }: { model: string }) {
  return (
    <footer>
      <div className="footer-grid">
        <div>
          <h2>Go further, faster</h2>
          <hr />
          <p>
            Immensely fast and utterly luxurious Voodoo yachts are the perfect
            high-speed vessels for the modern explorer. Utilising a unique
            foil-assisted catamaran hull the Voodoo is capable of cruising at
            speeds in excess of 40knts with genuine offshore passage making
            range.
          </p>
          <p>
            Talk further at{" "}
            <a href="mailto:welcome@voodooyachts.com">
              welcome@voodooyachts.com
            </a>
          </p>
          <div className="social">
            <a
              href="https://www.facebook.com/voodooyachts"
              target="_blank"
              rel="noreferrer"
            >
              Facebook ↗
            </a>
            <a
              href="https://www.instagram.com/voodooyachts/"
              target="_blank"
              rel="noreferrer"
            >
              Instagram ↗
            </a>
          </div>
          <Photo src={site.logo} alt="Voodoo Yachts" className="footer-logo" />
        </div>
        <Enquiry model={model} />
      </div>
      <div className="footer-bottom">
        <span>© Voodoo Yachts · Client review prototype</span>
        <a href="/privacy-policy/">Privacy policy</a>
        <a href="#top">Back to top ↑</a>
      </div>
    </footer>
  );
}
const unit = (v: string | undefined) =>
  v &&
  /^(?:\d+(?:\.\d+)?(?:px|%|em|vh)|#[a-f\d]{3,8}|rgba?\([\d., ]+\))$/i.test(v)
    ? v
    : undefined;
function Module({
  node,
  page,
  depth = 0,
}: {
  node: Node;
  page: Page;
  depth?: number;
}) {
  const a = node.attrs || {},
    type = node.type;
  const children = node.children || [];
  const content = () =>
    children.map((n, i) => (
      <Module key={i} node={n} page={page} depth={depth + 1} />
    ));
  const text = children.map((n) => n.html || "").join("");
  if (type === "html" && node.html?.includes("Devastatingly fast"))
    return (
      <div
        className="rich-text introduction"
        dangerouslySetInnerHTML={{ __html: clean(node.html) }}
      />
    );
  if (type === "html")
    return (
      <div
        className="rich-text"
        dangerouslySetInnerHTML={{ __html: clean(node.html || "") }}
      />
    );
  if (type === "et_pb_fullwidth_code")
    return page.kind === "yacht" && page.title !== "DSF86" ? (
      <React.Suspense
        fallback={<p className="content-width">Loading range map…</p>}
      >
        <RangeMap />
      </React.Suspense>
    ) : null;
  if (
    type === "et_pb_code" ||
    type.includes("contact") ||
    type.includes("social_media")
  )
    return null;
  if (type === "et_pb_fullwidth_header") {
    const src = a.background_video_mp4;
    return src ? (
      <HeroVideo src={src} poster={src.replace(/\.mp4$/, ".poster.webp")} />
    ) : (
      <div
        className="full-header"
        style={{
          backgroundImage: a.background_image
            ? `url("${a.background_image}")`
            : undefined,
        }}
      >
        {a.title && <h1>{a.title}</h1>}
      </div>
    );
  }
  if (type === "et_pb_image" || type === "et_pb_fullwidth_image") {
    if (!a.src) return null;
    const click = a.url;
    return (
      <div
        className={`image-module ${type === "et_pb_fullwidth_image" ? "full" : ""}`}
        style={{ textAlign: a.module_alignment as CSSProperties["textAlign"] }}
      >
        {click ? (
          <a href={click}>
            <Photo src={a.src} alt={a.alt || a.title_text} />
          </a>
        ) : (
          <Photo src={a.src} alt={a.alt || a.title_text} />
        )}
      </div>
    );
  }
  if (type === "et_pb_button")
    return a.button_text ? (
      <a
        href={
          (a.button_url === "#enquire"
            ? pages.find((p) => p.title === dynamicText(a.button_text))?.path
            : undefined) ||
          a.button_url ||
          "#enquire"
        }
        className="button"
      >
        {dynamicText(a.button_text)}
        <span aria-hidden="true">→</span>
      </a>
    ) : null;
  if (type === "et_pb_divider") return <hr />;
  if (type === "ngg" || type === "et_pb_gallery")
    return <Gallery images={node.images || []} />;
  if (type === "et_pb_video")
    return a.src ? (
      <video src={a.src} controls muted playsInline preload="none" />
    ) : null;
  if (
    type === "et_pb_dpfilterable_blog" ||
    type === "et_pb_portfolio" ||
    type === "et_pb_filterable_portfolio"
  )
    return <StoryCards />;
  if (type === "et_pb_slider") return <SourceSlider nodes={children} />;
  if (type === "et_pb_toggle" || type === "et_pb_accordion_item")
    return (
      <details>
        <summary>{a.title || "Read more"}</summary>
        {content()}
      </details>
    );
  const style: CSSProperties = {};
  if (unit(a.background_color)) style.backgroundColor = a.background_color;
  if (a.background_image)
    style.backgroundImage = `url("${a.background_image}")`;
  if (unit(a.text_text_color)) style.color = a.text_text_color;
  if (a.text_orientation)
    style.textAlign = a.text_orientation as CSSProperties["textAlign"];
  if (type === "et_pb_section") {
    if (!children.length && !a.background_image && !a.background_video_mp4)
      return null;
    if (a.background_video_mp4)
      return (
        <HeroVideo
          src={a.background_video_mp4}
          poster={a.background_video_mp4.replace(/\.mp4$/, ".poster.webp")}
        />
      );
    const hero = !!a.background_image && parseInt(a.height || "0") >= 500;
    // Model recommendation modules are kept in source order, with original content and data.
    return (
      <section
        id={
          a.module_id ||
          (page.path === "/" &&
          children.some((n) => n.attrs?.column_structure === "1_4,1_4,1_4,1_4")
            ? "yachts"
            : undefined)
        }
        className={`source-section ${hero ? "photo-hero" : ""} ${a.module_class || ""} ${a.background_image ? "has-background" : ""}`}
        style={style}
      >
        {hero ? (
          <>
            <Photo
              src={a.background_image}
              alt={`${page.title} — Voodoo Yachts`}
              className="hero-photo"
              priority
            />
            <div className="hero-content">{content()}</div>
          </>
        ) : (
          content()
        )}
      </section>
    );
  }
  if (type === "et_pb_row" || type === "et_pb_row_inner")
    return (
      <div
        id={a.module_id}
        className={`source-row ${a.column_structure?.includes("1_4") ? "four-col" : ""} ${a.max_width === "100%" || a.width === "100%" ? "edge-to-edge" : ""}`}
        style={style}
      >
        {content()}
      </div>
    );
  if (type === "et_pb_column" || type === "et_pb_column_inner") {
    const padding = (a.custom_padding || "").split("|");
    const hasPadding = padding.slice(0, 4).some((s) => s && s !== "0px");
    return (
      <div
        className={`source-column ${a.module_class || ""} ${a.background_image ? "photo-column" : ""} ${hasPadding ? "padded" : ""}`}
        style={{
          ...style,
          flexBasis: a.type?.includes("_")
            ? `${(Number(a.type.split("_")[0]) / Number(a.type.split("_")[1])) * 100}%`
            : undefined,
        }}
      >
        {a.background_image && (
          <Photo
            src={a.background_image}
            className="column-photo"
            alt={photoAlt(a.background_image)}
          />
        )}
        <div className="column-content">{content()}</div>
      </div>
    );
  }
  if (type === "et_pb_text") {
    if (text.includes("instagram-feed")) return null;
    return (
      <div className="text-module" style={style}>
        {content()}
      </div>
    );
  }
  return <div style={style}>{content()}</div>;
}
function App() {
  const requestedPath = decodeURI(location.pathname).replace(/\/?$/, "/");
  const path =
    (
      {
        "/xf95-3/": "/xf95/",
        "/home/": "/",
        "/our-story/": "/our-story-2/",
      } as Record<string, string>
    )[requestedPath] || requestedPath;
  const page = pages.find((p) => p.path === path);
  const [menu, setMenu] = useState(false);
  const [yachts, setYachts] = useState(false);
  const close = () => setMenu(false);
  const ref = useDialog(menu, close);
  useEffect(() => {
    document.title = page
      ? `${page.path === "/" ? "Luxury Adventure Yachts" : page.title} | Voodoo Yachts`
      : "Page not found | Voodoo Yachts";
    document
      .querySelector('meta[name="description"]')
      ?.setAttribute(
        "content",
        page?.description || "Voodoo Yachts client review prototype",
      );
  }, [page]);
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header id="top">
        <a className="brand" href="/" aria-label="Voodoo Yachts home">
          <Photo src={site.logo} alt="Voodoo Yachts" priority />
        </a>
        <button
          aria-label="MENU"
          className="menu-toggle"
          onClick={() => setMenu(true)}
          aria-expanded={menu}
          aria-controls="site-navigation"
        >
          <span>MENU</span>
          <i aria-hidden="true">
            <b />
            <b />
            <b />
          </i>
        </button>
      </header>
      <dialog
        className="menu-dialog"
        id="site-navigation"
        ref={ref}
        aria-label="Main navigation"
      >
        <button className="close" onClick={close} aria-label="Close menu">
          ×
        </button>
        <div className="menu-layout">
          <nav>
            {nav.map(([title, url]) =>
              title === "Yachts" ? (
                <div className="yacht-navigation" key={title}>
                  <div>
                    <a href={url} onClick={close}>
                      Yachts
                    </a>
                    <button
                      onClick={() => setYachts(!yachts)}
                      aria-expanded={yachts}
                      aria-label="Show yacht models"
                    >
                      {yachts ? "−" : "+"}
                    </button>
                  </div>
                  {yachts && (
                    <div className="model-links">
                      {navModels.map((p) => (
                        <a key={p.id} href={p.path} onClick={close}>
                          {p.title}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <a
                  key={title}
                  href={url}
                  onClick={close}
                  aria-current={path === url ? "page" : undefined}
                >
                  {title}
                </a>
              ),
            )}
          </nav>
          <div className="menu-about">
            <h2>Contact Us</h2>
            <hr />
            <p>
              58 Cross Road, PO Box 14292,
              <br />
              Tauranga, 3001, New Zealand
            </p>
            <a href="mailto:mitch@voodooyachts.com">mitch@voodooyachts.com</a>
            <a href="tel:+642102636362">+64 21 026 36362</a>
            <a href="#enquire" className="button" onClick={close}>
              Let’s Talk <span>→</span>
            </a>
          </div>
        </div>
      </dialog>
      <main id="main">
        {page ? (
          <>
            <div
              className={`page-content ${page.kind} ${page.path === "/" ? "home" : ""}`}
            >
              <h1 className="sr-only">
                {page.path === "/"
                  ? "Voodoo Yachts — Luxury Adventure Yachts"
                  : page.title}
              </h1>
              {page.nodes.map((n, i) => (
                <Module key={i} node={n} page={page} />
              ))}
            </div>
            {page.path === "/travel-stories/" &&
              !JSON.stringify(page.nodes).includes("filterable") && (
                <section className="content-width">
                  <StoryCards />
                </section>
              )}
            {page.path === "/" &&
              !JSON.stringify(page.nodes).includes("yachts") && (
                <section className="content-width">
                  <YachtCards />
                </section>
              )}
            {page.kind === "yacht" && (
              <div className="model-enquiry">
                {(page.title === "XF60" || page.title === "DSF86") && (
                  <a
                    className="button film-link"
                    target="_blank"
                    rel="noreferrer"
                    href={
                      page.title === "XF60"
                        ? "https://vimeo.com/1091992987"
                        : "https://vimeo.com/1076595897"
                    }
                  >
                    Watch {page.title} film ↗
                  </a>
                )}
                <a className="button" href="#enquire">
                  Enquire about {page.title} <span>→</span>
                </a>
              </div>
            )}
          </>
        ) : (
          <section className="not-found">
            <h1>Page not found</h1>
            <p>Explore the Voodoo fleet or return to the homepage.</p>
            <a href="/" className="button">
              Home →
            </a>
          </section>
        )}
      </main>
      <Footer model={page?.kind === "yacht" ? page.title : ""} />
    </>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
