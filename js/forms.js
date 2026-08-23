/**
 * =============================================================
 *  FORMS.JS — shared handling for every form on the site
 * =============================================================
 *  Used by contact.html, application.html, and careers.html.
 *  Each of those pages just needs:
 *    <form data-secure-form data-form-name="contact"> ... </form>
 *  and this script does the rest.
 *
 *  IMPORTANT HONESTY NOTE ON SECURITY:
 *  No website is "immune" to attacks — anyone who tells you
 *  otherwise is selling something. What this file (together with
 *  backend/app.py) DOES do is follow well-established best
 *  practice so the common, automated attacks don't work:
 *    - Every value is treated as plain text, never as HTML or code
 *      (we use .textContent / .value, never .innerHTML, on
 *      anything a visitor typed) — this is what stops stored/reflected
 *      XSS from a form field.
 *    - A hidden honeypot field silently drops bot submissions.
 *    - A CSRF token ties each submission to the page that loaded it.
 *    - The real defence against injection lives on the SERVER
 *      (backend/app.py), because client-side JS can always be
 *      bypassed by anyone who skips the browser entirely. This file
 *      is a first, user-friendly filter — not the security boundary.
 *
 *  FILE UPLOADS (the Careers resume field):
 *  Submissions are sent as multipart/form-data (via the FormData API)
 *  rather than JSON, since JSON can't carry binary file content. The
 *  client checks file type/size as a courtesy so people get fast
 *  feedback — the backend re-checks both independently (extension,
 *  size, and that the bytes are actually attached as a file, not
 *  executed or opened) since that's the only check that can't be
 *  bypassed by calling the API directly.
 * =============================================================
 */

const ALLOWED_RESUME_EXTENSIONS = [".pdf", ".doc", ".docx", ".txt", ".rtf"];
const MAX_RESUME_BYTES = 5 * 1024 * 1024; // 5MB, must match backend/app.py

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("[data-secure-form]").forEach(initSecureForm);
});

function initSecureForm(form) {
  addHoneypot(form);
  attachCsrfToken(form);

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearMessages(form);

    // Bots fill every field, including hidden ones. A human never will.
    const honeypot = form.querySelector('input[name="_gotcha"]');
    if (honeypot && honeypot.value.trim() !== "") {
      // Pretend it worked, so the bot doesn't learn anything. No request sent.
      showMessage(form, "success", "Thanks — we'll be in touch.");
      form.reset();
      return;
    }

    const validationError = validateForm(form);
    if (validationError) {
      showMessage(form, "error", validationError);
      return;
    }

    const formData = collectSanitizedFormData(form);
    const submitBtn = form.querySelector('[type="submit"]');
    setSubmitting(submitBtn, true);

    try {
      // No Content-Type header here on purpose — the browser sets the
      // correct multipart boundary itself when the body is a FormData.
      const response = await fetch("/api/submit", {
        method: "POST",
        body: formData,
      });

      // The backend always returns JSON — never trust/parse anything else.
      const result = await response.json().catch(() => null);

      if (response.ok && result && result.ok) {
        showMessage(form, "success", "Thanks — your message is on its way. We'll reply soon.");
        form.reset();
      } else {
        const reason = result && typeof result.error === "string"
          ? result.error
          : "Something went wrong. Please try again in a moment.";
        showMessage(form, "error", reason);
      }
    } catch (err) {
      showMessage(
        form,
        "error",
        "We couldn't reach the server. Check your connection and try again."
      );
    } finally {
      setSubmitting(submitBtn, false);
    }
  });
}

/** Adds a visually-hidden field bots tend to fill in but humans never see. */
function addHoneypot(form) {
  if (form.querySelector('input[name="_gotcha"]')) return;
  const wrapper = document.createElement("div");
  wrapper.className = "honeypot-field";
  wrapper.setAttribute("aria-hidden", "true");
  wrapper.innerHTML = `
    <label for="_gotcha_${form.dataset.formName}">Leave this field empty</label>
    <input type="text" id="_gotcha_${form.dataset.formName}" name="_gotcha" tabindex="-1" autocomplete="off">
  `; // static markup we authored — not visitor-supplied, so safe to set via innerHTML
  form.appendChild(wrapper);
}

/** Fetches a one-time CSRF token from the backend and stores it in a hidden field. */
async function attachCsrfToken(form) {
  let tokenField = form.querySelector('input[name="csrf_token"]');
  if (!tokenField) {
    tokenField = document.createElement("input");
    tokenField.type = "hidden";
    tokenField.name = "csrf_token";
    form.appendChild(tokenField);
  }
  try {
    const res = await fetch("/api/csrf-token");
    const data = await res.json();
    if (data && typeof data.token === "string") {
      tokenField.value = data.token;
    }
  } catch (err) {
    // If the backend isn't running (e.g. static preview), submission will
    // simply fail server-side validation later — no silent bypass.
    console.warn("Could not fetch CSRF token — is the backend running?");
  }
}

/** Basic required-field / format checks, run before we touch the network. */
function validateForm(form) {
  const fields = form.querySelectorAll("[required]");
  for (const field of fields) {
    if (!field.value || !field.value.trim()) {
      return `Please fill in "${field.previousElementSibling?.textContent || field.name}".`;
    }
  }

  const emailField = form.querySelector('input[type="email"]');
  if (emailField && emailField.value) {
    const simpleEmailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!simpleEmailPattern.test(emailField.value.trim())) {
      return "Please enter a valid email address.";
    }
  }

  for (const field of form.querySelectorAll("input, textarea")) {
    if (field.type !== "file" && field.value && field.value.length > 5000) {
      return "One of your answers is too long. Please shorten it.";
    }
  }

  const fileError = validateFileFields(form);
  if (fileError) return fileError;

  return null;
}

/** Checks any file input (currently just the Careers resume field) for
 * a sane extension and size before we bother uploading it. */
function validateFileFields(form) {
  for (const fileInput of form.querySelectorAll('input[type="file"]')) {
    const file = fileInput.files && fileInput.files[0];

    if (!file) {
      if (fileInput.required) {
        return `Please attach your ${fileInput.previousElementSibling?.textContent || "file"}.`;
      }
      continue;
    }

    const name = file.name.toLowerCase();
    const hasAllowedExtension = ALLOWED_RESUME_EXTENSIONS.some((ext) => name.endsWith(ext));
    if (!hasAllowedExtension) {
      return `"${file.name}" isn't a supported file type. Please upload a PDF, DOC, DOCX, TXT, or RTF file.`;
    }

    if (file.size > MAX_RESUME_BYTES) {
      return `"${file.name}" is too large. Please keep it under 5MB.`;
    }
  }
  return null;
}

/**
 * Builds a FormData object to submit: trims whitespace and strips control/
 * newline characters from text fields (which could otherwise be used for
 * header injection if a value ever ends up in an email header), and passes
 * file fields through untouched — a file's bytes aren't something we
 * "sanitize" client-side, that's the backend's job (see backend/app.py).
 * This is a courtesy pass, not the security boundary: the backend
 * re-validates everything, since client-side code can always be bypassed
 * by calling the API directly.
 */
function collectSanitizedFormData(form) {
  const outgoing = new FormData();
  outgoing.append("formName", form.dataset.formName || "unknown");

  const source = new FormData(form);
  for (const [key, rawValue] of source.entries()) {
    if (key === "formName") continue; // avoid double-adding

    if (rawValue instanceof File) {
      if (rawValue.size > 0) outgoing.append(key, rawValue, rawValue.name);
      continue;
    }

    const cleaned = String(rawValue).replace(/[\r\n\t\x00-\x1F\x7F]/g, " ").trim();
    outgoing.append(key, cleaned.slice(0, 5000));
  }

  return outgoing;
}

function setSubmitting(button, isSubmitting) {
  if (!button) return;
  button.disabled = isSubmitting;
  button.textContent = isSubmitting ? "Sending…" : button.dataset.defaultLabel || "Send";
  if (!button.dataset.defaultLabel) {
    button.dataset.defaultLabel = button.textContent;
  }
}

/** Shows a status message using textContent only — never innerHTML on dynamic text. */
function showMessage(form, type, text) {
  let region = form.querySelector(".form-message");
  if (!region) {
    region = document.createElement("p");
    region.className = "form-message";
    region.setAttribute("role", "status");
    region.setAttribute("aria-live", "polite");
    form.appendChild(region);
  }
  region.classList.remove("form-message--error", "form-message--success");
  region.classList.add(type === "error" ? "form-message--error" : "form-message--success");
  region.textContent = text; // safe: always our own copy or a short backend error code, never raw user input
}

function clearMessages(form) {
  const region = form.querySelector(".form-message");
  if (region) {
    region.textContent = "";
    region.classList.remove("form-message--error", "form-message--success");
  }
}
