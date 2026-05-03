# AI Usage Documentation

Generative AI was used to help scaffold and implement this project from the provided assignment outline and `AGENTS.md` rules file.

## How AI Was Used

- Interpreted the CSC3100 Resume Builder requirements from the supplied Word document.
- Created the Express route structure under `/api/routing`.
- Created the SQLite schema and prepared-statement CRUD operations.
- Created the single-page Bootstrap frontend and print-ready resume preview.
- Added the Gemini API review endpoint and frontend AI Review buttons.
- Added a full-resume Gemini construction prompt for selected resume entries.

## Rules File

The coding rules came from `AGENTS.md` in the project root. The implementation follows the major constraints: `server.js` entry point, RESTful APIs under `/api/routing`, PUT for updates, URL parameters for deletes, query strings for GET filtering, JSON bodies for creates, prepared statements, input validation, local frontend libraries, Bootstrap utility usage, and SweetAlert2 user-facing errors.

## MCP Server Details

No MCP servers were used for this implementation.

## API Key Handling

The application does not include a hardcoded Gemini API key. During development, a key may be placed in `.env` as `GEMINI_API_KEY`, or a user may save their own key in the app Settings screen. When a key is saved in Settings, it is stored in SQLite and synced into `.env` as `GEMINI_API_KEY`. On startup, the server also checks SQLite and refreshes `.env` if a stored key exists. `.env` is excluded by `.gitignore`.

## Prompt Locations

- Field-level review prompt: `api/routing/aiSuggestions.js`
  - Prompt pattern: `Here is what I have for [section] for my resume how can I make this sound better?`
- Shared Gemini request helper: `api/routing/aiHelpers.js`
- Full resume construction prompt: `api/routing/aiResumeBuilder.js`
  - Prompt pattern: `Here is all the different sections of a resume build me [descriptor] resume.`
  - The selected resume sections are sent as JSON. Gemini is asked to return valid JSON so the app can rebuild the live preview safely without rendering AI-generated HTML.

## Resume Styles

The Resume screen can load three styles: Classic, Modern, and Compact. The selected style is stored as the `resumeStyle` setting in SQLite and applied through CSS classes in `public/css/styles.css`.

## AI Comments In Code

The code does not mark individual AI-generated lines because the implementation was generated as a cohesive scaffold. Be prepared to explain the route modules, SQLite prepared statements, frontend fetch calls, and print CSS during review.
