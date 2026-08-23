/**
 * =============================================================
 *  MAIN.JS — shared site behaviour
 * =============================================================
 *  Runs on every page. Responsibilities:
 *    1. Render the header (logo + nav + CTA) and footer from
 *       SITE_CONFIG, so branding lives in one place (config.js).
 *    2. Highlight the current page's nav link.
 *    3. Wire up the mobile menu toggle.
 *    4. Animate the "growth line" signature graphic wherever it
 *       appears (data-growth-line elements): draws in once on-screen,
 *       then loops — rise, reverse, pause, rise again — for as long
 *       as the page stays open.
 *    5. Respect prefers-reduced-motion throughout.
 *
 *  Security note: every value we inject into the DOM below comes
 *  from our own trusted config.js, and we still use textContent
 *  (never innerHTML) for it. That habit matters more in forms.js,
 *  where the values come from a visitor rather than from us —
 *  see the comments there for why.
 * =============================================================
 */

document.addEventListener("DOMContentLoaded", () => {
  renderHeader();
  renderFooter();
  setActiveNavLink();
  wireMobileMenu();
  animateGrowthLines();
});

/** Builds the <header> markup from SITE_CONFIG and drops it into #site-header. */
function renderHeader() {
  const mount = document.getElementById("site-header");
  if (!mount) return;

  const nav = document.createElement("nav");
  nav.className = "nav";
  nav.setAttribute("aria-label", "Primary");

  const brand = document.createElement("a");
  brand.href = "index.html";
  brand.className = "brand";

  const logo = document.createElement("img");
  logo.className = "logo-mark";
  logo.src = "assets/favicon.svg";
  logo.alt = ""; // decorative — the agency name text right next to it already labels the brand
  logo.setAttribute("aria-hidden", "true");

  const brandName = document.createElement("span");
  brandName.className = "brand-name";
  brandName.textContent = SITE_CONFIG.agencyName;

  brand.append(logo, brandName);

  const list = document.createElement("ul");
  list.className = "nav-list";
  list.id = "nav-list";

  SITE_CONFIG.nav.forEach((item) => {
    const li = document.createElement("li");
    const a = document.createElement("a");
    a.href = item.href;
    a.textContent = item.label;
    a.dataset.navHref = item.href;
    li.appendChild(a);
    list.appendChild(li);
  });

  const cta = document.createElement("a");
  cta.href = SITE_CONFIG.headerCta.href;
  cta.className = "btn btn-accent nav-cta";
  cta.textContent = SITE_CONFIG.headerCta.label;

  const toggle = document.createElement("button");
  toggle.className = "menu-toggle";
  toggle.id = "menu-toggle";
  toggle.setAttribute("aria-expanded", "false");
  toggle.setAttribute("aria-controls", "nav-list");
  toggle.setAttribute("aria-label", "Toggle menu");
  toggle.innerHTML = '<span></span><span></span><span></span>'; // static, non-user-facing markup

  nav.append(brand, list, cta, toggle);
  mount.appendChild(nav);
}

/** Builds the <footer> markup from SITE_CONFIG and drops it into #site-footer. */
function renderFooter() {
  const mount = document.getElementById("site-footer");
  if (!mount) return;

  const wrap = document.createElement("div");
  wrap.className = "footer-inner";

  const col1 = document.createElement("div");
  col1.className = "footer-brand";
  const h = document.createElement("p");
  h.className = "footer-agency-name";
  h.textContent = SITE_CONFIG.agencyName;
  const tag = document.createElement("p");
  tag.className = "footer-tagline";
  tag.textContent = SITE_CONFIG.agencyTagline;
  col1.append(h, tag);

  const col2 = document.createElement("div");
  col2.className = "footer-contact";
  const email = document.createElement("p");
  email.textContent = SITE_CONFIG.destinationEmail;
  const phone = document.createElement("p");
  phone.textContent = SITE_CONFIG.contactPhone;
  const addr = document.createElement("p");
  addr.textContent = SITE_CONFIG.contactAddress;
  col2.append(email, phone, addr);

  const col3 = document.createElement("div");
  col3.className = "footer-socials";
  SITE_CONFIG.socials.forEach((s) => {
    const a = document.createElement("a");
    a.href = s.href;
    a.textContent = s.label;
    col3.appendChild(a);
  });

  const bottom = document.createElement("p");
  bottom.className = "footer-note";
  bottom.textContent = `© ${SITE_CONFIG.currentYear} ${SITE_CONFIG.agencyName}. ${SITE_CONFIG.footerNote}`;

  // Legal links row (Privacy Policy, Terms of Service, Contact).
  const legalNav = document.createElement("nav");
  legalNav.className = "footer-legal-links";
  legalNav.setAttribute("aria-label", "Legal");
  SITE_CONFIG.legalLinks.forEach((link, index) => {
    const a = document.createElement("a");
    a.href = link.href;
    a.textContent = link.label;
    legalNav.appendChild(a);
    if (index < SITE_CONFIG.legalLinks.length - 1) {
      const sep = document.createElement("span");
      sep.className = "footer-legal-sep";
      sep.setAttribute("aria-hidden", "true");
      sep.textContent = "•";
      legalNav.appendChild(sep);
    }
  });

  // Ownership / trademark notices — plain text, one per line.
  const legalNotices = document.createElement("div");
  legalNotices.className = "footer-legal-notices";
  SITE_CONFIG.legalNotices.forEach((notice) => {
    const p = document.createElement("p");
    p.textContent = notice;
    legalNotices.appendChild(p);
  });

  wrap.append(col1, col2, col3);
  mount.append(wrap, legalNotices, legalNav, bottom);
}

/** Adds an "active" class + aria-current to whichever nav link matches the current page. */
function setActiveNavLink() {
  const current = window.location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll("[data-nav-href]").forEach((link) => {
    if (link.dataset.navHref === current) {
      link.classList.add("active");
      link.setAttribute("aria-current", "page");
    }
  });
}

/** Toggles the mobile nav open/closed and keeps aria-expanded in sync. */
function wireMobileMenu() {
  const toggle = document.getElementById("menu-toggle");
  const list = document.getElementById("nav-list");
  if (!toggle || !list) return;

  toggle.addEventListener("click", () => {
    const isOpen = list.classList.toggle("open");
    toggle.classList.toggle("open", isOpen);
    toggle.setAttribute("aria-expanded", String(isOpen));
  });

  // Close the menu after a link is chosen (mobile).
  list.querySelectorAll("a").forEach((a) =>
    a.addEventListener("click", () => {
      list.classList.remove("open");
      toggle.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
    })
  );
}

/**
 * Draws in any "growth line" SVGs (the site's signature graphic — a rising
 * line representing audience growth), then loops: rise, reverse, pause for
 * GROWTH_PAUSE_MS, then rise again — for as long as the page is open.
 * Uses stroke-dasharray/offset, a classic and lightweight reveal technique,
 * driven by a CSS animation (see css/style.css) so it keeps looping without
 * further JS involvement once started.
 *
 * NOTE: the three constants below are also written into the CSS keyframe
 * timing in css/style.css as fixed percentages (23.9% / 47.8%) and a 6.7s
 * duration, because CSS keyframe stops can't read JS variables directly.
 * If you change these numbers, update the matching comment/values in
 * css/style.css too — both files point at each other.
 */
const GROWTH_RISE_MS = 1600;    // time to draw the line in
const GROWTH_REVERSE_MS = 1600; // time to draw it back out
const GROWTH_PAUSE_MS = 3500;   // pause after reversing, before rising again

function animateGrowthLines() {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const lines = document.querySelectorAll("[data-growth-line] path");

  lines.forEach((path) => {
    const length = path.getTotalLength();
    path.style.strokeDasharray = String(length);

    if (reduceMotion) {
      // No motion: show the line fully drawn and leave it there.
      path.style.strokeDashoffset = "0";
      const endpoint = path.parentElement.querySelector("circle.endpoint");
      if (endpoint) endpoint.style.opacity = "1";
      return;
    }

    // Exposed as a CSS custom property so the keyframes (defined once,
    // generically, in style.css) work for any path length.
    path.style.setProperty("--path-length", length);
    path.style.strokeDashoffset = String(length); // hidden until the loop starts
  });

  if (reduceMotion || !("IntersectionObserver" in window)) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          // Starts the infinite CSS loop (see .growth-loop in style.css).
          // Once started it keeps looping even if scrolled out of view,
          // matching how a live dashboard chart would behave.
          entry.target.classList.add("growth-loop");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.4 }
  );

  document.querySelectorAll("[data-growth-line]").forEach((el) => observer.observe(el));
}
