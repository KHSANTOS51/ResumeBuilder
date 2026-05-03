# Republic Resumes

Republic Resumes is a local single-page resume builder for CSC3100. It uses a plain HTML/CSS/JavaScript frontend, an Express REST API, and SQLite storage through Node's built-in SQLite module.

https://github.com/KHSANTOS51/ResumeBuilder

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

Republic Resumes can also run inside Electron:

```bash
npm run desktop
```

The Electron wrapper starts the same Express API locally, opens a desktop window, and closes the local server when the app quits.

In browser mode, `Print or Save PDF` opens the browser print preview. In Electron mode, the same button opens a native save dialog and writes the resume preview directly to a PDF file.

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
- Uses local Bootstrap, the Bootswatch Vapor theme, and SweetAlert2 files; no CDN is required.

## Known Issues 

- The web browser version of the application has timestamp and naming at the top of the header for the print resume function, issue does not occur with the electron js app. 
- The AI build of the resume needs more tokens to pass all the traffic through to build out the resume, but all AI revisions work at this time. 
