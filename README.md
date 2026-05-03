# ResumeForge

ResumeForge is a local single-page resume builder. It uses a plain HTML/CSS/JavaScript frontend, an Express REST API, and SQLite storage through Node's built-in SQLite module.

## Run

1. Install dependencies:

   ```bash
   npm install
   ```

2. Optional: copy `.env.example` to `.env` and add a Gemini API key.

3. Start the app:

   ```bash
   npm start
   ```

4. Open `http://localhost:3000`.

## Desktop App

ResumeForge can also run inside Electron:

```bash
npm run desktop
```

The Electron wrapper starts the same Express API locally, opens a desktop window, and closes the local server when the app quits.

## Features

- Manage profile, jobs, job responsibilities, skills, certifications, and awards.
- Store user-entered data in `data/resume-builder.sqlite`.
- Select which saved entries appear on the generated resume.
- Load Classic, Modern, or Compact resume styles from the Resume screen.
- Print or save the resume as a PDF from the Resume screen.
- Save a user-provided Gemini API key locally in SQLite and sync it to `.env` as `GEMINI_API_KEY`.
- Request field-level AI suggestions or build a full AI resume draft from selected resume sections.
- Display AI-built resumes in the same formatted preview as the built-in resume styles.
- Save and reload AI resume drafts from SQLite.
- Uses local Bootstrap and SweetAlert2 files; no CDN is required.

## Known Issues

- The web browser application saves the resume as print screen, and so results in a timestamp and web naming as a header at the top of the page.
- The Ai draft feature does not do a full return do to the token limit of gemini's free api cap.
  
