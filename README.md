# EasyBread Management Website

A 7-page site (Home, About, Services, FAQ, Careers, Contact, Application)
built with plain HTML, CSS, and JavaScript, plus a small Python (Flask)
backend that emails form submissions to you.

Everything is placeholder content — swap it out before you launch. Text
is Lorem Ipsum, and the agency name/logo are placeholders driven from a
single config file (see below), so re-branding takes minutes, not hours.

## File map

```
index.html         Home
about.html          About
services.html       Services
faq.html            FAQ
careers.html        Careers (job list + application form, with resume upload)
contact.html        Contact form
application.html    Client/creator application form
privacy-policy.html Placeholder Privacy Policy (linked from the footer)
terms-of-service.html  Placeholder Terms of Service (linked from the footer)

css/style.css       All styling. Section 1 at the top has the color
                    and font "tokens" — change those and the whole
                    site updates.

js/config.js        EDIT THIS to rename the agency, change the nav,
                    update contact details, swap the logo placeholder.
js/main.js          Builds the header/footer from config.js, mobile
                    menu, and the animated hero graphic. You shouldn't
                    need to touch this for everyday edits.
js/forms.js         Client-side form handling (validation, honeypot,
                    CSRF token, talking to the backend). Shared by all
                    three forms.

backend/app.py      Flask server: serves the site + handles form
                    submissions by emailing them to you.
backend/requirements.txt
backend/.env.example   Copy to .env and fill in your real SMTP details.
```

## Making everyday edits

- **Agency name, logo text, nav links, contact email/phone:** edit
  `js/config.js`. Every page reads from it, so one edit updates the
  whole site.
- **Footer legal links and ownership/trademark notices:** also in
  `js/config.js` (`legalLinks` and `legalNotices`). The ACN is a
  placeholder — update it once you have the real number.
- **Colors/fonts:** edit the `:root { ... }` block at the top of
  `css/style.css`.
- **Page copy:** edit the Lorem Ipsum text directly inside each
  `.html` file — it's plain, readable HTML with comments marking each
  section.
- **Real logo:** once you have an image file, replace the `.logo-mark`
  `<span>` markup in `js/main.js` (`renderHeader` function) with an
  `<img src="assets/logo.svg" alt="EasyBread Management">`, and drop your file
  into the `assets/` folder.

## Running the site (with working forms)

The HTML/CSS/JS work as a static preview on their own, but the three
forms need the Python backend running to actually send email.

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env             # then edit .env with real values
python app.py
```

Then open **http://localhost:5000** — the backend serves the whole
site plus the form endpoints from one place, so there's nothing else
to configure.

### Setting up email sending

Fill in `backend/.env` (never commit this file):

- `SECRET_KEY` — any long random string (a command to generate one is
  in `.env.example`).
- `SMTP_HOST` / `SMTP_PORT` / `SMTP_USERNAME` / `SMTP_PASSWORD` — your
  email provider's SMTP details. If you use Gmail, you need an **App
  Password**, not your normal login password (Google Account →
  Security → 2-Step Verification → App passwords).
- `CONTACT_DESTINATION_EMAIL`, `TALENT_DESTINATION_EMAIL`,
  `CAREERS_DESTINATION_EMAIL` — where each form's submissions are
  delivered. These already default to EasyBread Management's real
  addresses (`info@`, `talent@`, and `career@easybreadmanagement.com`)
  even if you don't set them in `.env`, but you can override any of
  them there if that ever changes.

## Resume uploads (Careers page)

The Careers form accepts a resume as a PDF, DOC, DOCX, TXT, or RTF
file, up to 5MB. It's checked on both ends:

- **In the browser** (`js/forms.js`): rejects the wrong file type or
  an oversized file before it even uploads, so people get instant
  feedback.
- **On the server** (`backend/app.py`): re-checks the extension and
  real file size regardless of what the browser said, strips the
  filename down to safe characters (blocking any path-traversal
  attempt hidden in a filename), and forces the email attachment's
  content type from its own fixed mapping rather than trusting
  anything the uploader's browser claims. The file is attached to the
  notification email — it's never saved to disk or executed.

To change the size limit or accepted types, update both
`MAX_RESUME_BYTES` / `ALLOWED_RESUME_EXTENSIONS` in `backend/app.py`
and the matching constants at the top of `js/forms.js`.

## Deploying it for real

Running `python app.py` is fine for testing on your own machine. For a
real, public launch you'll want:

- A real web host (Render, Railway, PythonAnywhere, a VPS, etc.) — not
  the Flask development server, which isn't built for production
  traffic. Run it behind a production WSGI server like `gunicorn`.
- HTTPS (a free certificate via Let's Encrypt, or handled by your
  host automatically).
- The `.env` values set as environment variables on the host, rather
  than a checked-in file.

## A note on security

Nothing here — or anywhere — makes a website "immune" to attacks; be
wary of anyone who claims otherwise. What this project does is follow
solid, standard practice so the common automated attacks don't work:

- Every form field is checked against an explicit allow-list on the
  **server**, not just in the browser, since browser-side checks can
  always be skipped by anyone who calls the API directly.
- Submissions are emailed using Python's `email.message` API rather
  than hand-built strings, which is what prevents header-injection
  attacks via a form field.
- A CSRF token and a honeypot field cut down on automated/bot spam.
- A simple rate limit slows down abuse from any one visitor.
- Security-relevant HTTP headers (CSP, X-Frame-Options, etc.) are set
  on every response.
- The Flask debugger is off; request bodies are size-capped.

Keep your dependencies (`pip install --upgrade -r requirements.txt`
periodically) up to date, and never commit your real `.env` file —
those two habits matter as much as any of the code above.
