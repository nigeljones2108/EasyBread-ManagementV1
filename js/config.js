/**
 * =============================================================
 *  SITE CONFIG
 * =============================================================
 *  Edit THIS file to re-brand the entire website.
 *  Every page reads from these values at load time (see main.js),
 *  so a change here shows up on every page automatically —
 *  you never need to hunt through individual HTML files.
 *
 *  SITE_CONFIG.destinationEmail below is just what's DISPLAYED in
 *  the footer as a general contact address. It is NOT where form
 *  submissions actually get delivered — each form (Contact,
 *  Application, Careers) sends to its own address, configured
 *  separately in backend/.env, since the browser can't be trusted
 *  to say where its own mail goes (that's the backend's job, kept
 *  out of client reach). See backend/.env.example for those.
 * =============================================================
 */

const SITE_CONFIG = {
  // ---- Branding -------------------------------------------------
  agencyName: "EasyBread Management",
  agencyTagline: "Social growth, managed.",
  logoText: "EBM",                 // shown inside the placeholder logo mark
  domain: "easybreadmanagement.com",

  // ---- Contact (displayed in the footer only — see note above) ----
  destinationEmail: "info@easybreadmanagement.com",
  contactPhone: "+61 000 000 000",
  contactAddress: "Melbourne, VIC, Australia",

  // ---- Navigation (edit labels/order here, nav renders from this) --
  nav: [
    { label: "Home", href: "index.html" },
    { label: "About", href: "about.html" },
    { label: "Services", href: "services.html" },
    { label: "FAQ", href: "faq.html" },
    { label: "Careers", href: "careers.html" },
    { label: "Contact", href: "contact.html" },
  ],

  // Call-to-action button shown in the header on every page
  headerCta: { label: "Apply Now", href: "application.html" },

  // ---- Footer ----------------------------------------------------
  footerNote: "All rights reserved.",
  socials: [
    { label: "Instagram", href: "https://www.instagram.com/easybreadmanagement" },
    { label: "TikTok", href: "#" },
    { label: "LinkedIn", href: "#" },
  ],

  // Legal links shown in the footer's bottom row on every page.
  legalLinks: [
    { label: "Privacy Policy", href: "privacy-policy.html" },
    { label: "Terms of Service", href: "terms-of-service.html" },
    { label: "Contact", href: "contact.html" },
  ],

  // Legal/ownership notices shown at the very bottom of the footer.
  // Replace the ACN with the real number when you have it.
  legalNotices: [
    "This site is owned and operated by MELBOURNE INNOVATIVE MANAGEMENT SERVICES PTY LTD — Company ACN: XXXXXXXXX",
    "OnlyFans is a Trademark owned by Fenix International Limited and not affiliated with EasyBread Management",
  ],

  currentYear: new Date().getFullYear(),
};
