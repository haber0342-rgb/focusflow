# FocusFlow | Productivity Monitor & Task Manager

FocusFlow is a standalone, no-install Progressive Web App (PWA) that combines intelligent task management, automatic productivity tracking, focus sessions, Google Calendar integration, and Gemini AI assistance.

## Features
- **Intelligent Task Management**: 13-field task tracking with Markdown support and rollover logic.
- **Multiple Views**: Dashboard, List, Kanban Board, Eisenhower Matrix, and Calendar.
- **Focus Mode**: Distraction-free full-screen mode with procedural ambient sounds (white noise/rain) and procrastination helpers.
- **Google Integration**: Optional sync with Google Drive for shared tasks and Google Calendar for event scheduling.
- **Gemini AI**: Smart task intake, daily prioritization suggestions, and productivity insights.
- **PWA**: Fully functional offline with namespaced localStorage.

## Deployment to GitHub Pages

1. Create a new public GitHub repository named `focusflow`.
2. Upload all files from this project preserving the folder structure.
3. In Repository Settings → Pages:
   - Source: "Deploy from a branch"
   - Branch: `main` / `root`
   - Save.
4. Your site will be live at `https://yourusername.github.io/focusflow`.

### Important Maintenance Note
`404.html` is a manual copy of `index.html`. Whenever you update `index.html`, remember to copy the updated content to `404.html` before committing.

## Setup Instructions

### Google Cloud Console (Optional)
To enable Google Drive and Calendar features:
1. Create a project in [Google Cloud Console](https://console.cloud.google.com/).
2. Enable APIs: Google Calendar API, Google Drive API, and Google Picker API.
3. Create an **OAuth 2.0 Client ID** (Web application).
   - Authorised JavaScript origins: `https://yourusername.github.io`
4. Create a **Browser API Key** (for Google Picker).
5. Copy the Client ID and API Key into FocusFlow Settings → Integrations.

### Gemini API (Optional)
To enable AI features:
1. Get an API key from [Google AI Studio](https://aistudio.google.com/).
2. Enter the key in FocusFlow Settings → AI Configuration.
3. The key is stored in your local browser only.

## Keyboard Shortcuts
- `N` - New task
- `F` - Start focus mode
- `D` - Daily planning overlay
- `1-7` - Switch views
- `?` - Toggle shortcuts help
- `Ctrl+Z` - Undo last task status change

## License
MIT
