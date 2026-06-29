# CodeGenie AI

[![License: MIT](https://img.shields.io/badge/license-MIT-green.svg)](#license) [![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)](#) [![Stars](https://img.shields.io/badge/stars-⭐-blue.svg)](#)

A browser-first, AI-powered development environment that helps developers write, run, debug, and ship code without local setup. CodeGenie AI combines a cloud IDE, intelligent AI assistance, and integrated tooling for a smooth developer experience.

---

## Table of Contents
- [Why CodeGenie AI](#why-codegenie-ai)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Clone & Install](#clone--install)
  - [Environment](#environment)
  - [Run Locally](#run-locally)
- [Usage](#usage)
- [Development Workflow](#development-workflow)
- [Architecture & Components](#architecture--components)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [Security](#security)
- [License](#license)
- [Author & Contact](#author--contact)

---

## Why CodeGenie AI
CodeGenie AI accelerates development by removing environment setup friction and combining intelligent coding assistance with a fully featured, browser-based IDE. It's ideal for:
- Students learning to code
- Interview preparation
- Rapid prototyping
- Collaboration and demos

---

## Features
- Intelligent AI Assistant (generate, explain, refactor code)
- Context-aware autocomplete & code completion
- Cloud browser IDE with Monaco editor
- Live previews and in-browser terminal (WebContainer)
- GitHub integration (import/sync repositories)
- Authentication with Google OAuth & session management
- Project and file management with autosave
- Multi-language support (JS/TS/Python/Java and more)
- Local/Cloud AI backends (Google Gemini, Ollama support)

---

## Tech Stack
- Frontend: Next.js 15, React 19, TypeScript, Tailwind CSS, Shadcn UI, Monaco Editor  
- Backend: Next.js API routes, NextAuth.js  
- Database: MongoDB (Mongoose)  
- AI: Google Gemini API, Ollama (local model support)  
- Runtime: WebContainer API  
- Cloud & Integrations: Cloudinary, GitHub API

---

## Project Structure
High-level layout:
```
app/
components/
hooks/
lib/
modules/
services/
types/
public/
styles/
prisma/
```

---

## Getting Started

### Prerequisites
- Node.js 18+ (or the project's required Node version)  
- npm or pnpm  
- MongoDB instance (local or cloud)  
- Optional: Cloudinary account, Google/GitHub OAuth credentials, Gemini API key

### Clone & Install
```bash
git clone https://github.com/yourusername/codegenie-ai.git
cd codegenie-ai
npm install
```

### Environment
Create a `.env.local` file in the project root with the following variables:
```env
MONGODB_URI=
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=
AUTH_GOOGLE_ID=
AUTH_GOOGLE_SECRET=
GEMINI_API_KEY=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GITHUB_TOKEN=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```
Notes:
- Keep secrets out of version control.
- Provide working OAuth keys for authentication flows and a valid MongoDB URI.

### Run Locally
```bash
# development
npm run dev

# build and serve
npm run build
npm run start
```
Open: http://localhost:3000

---

## Usage
- Create a new project or import a GitHub repository.
- Use the AI Assistant to generate, refactor, or explain code from prompts.
- Use the in-browser terminal to install packages and run scripts.
- Preview front-end applications in the live preview pane.

Example flow — generate a component:
1. Open the Editor and create a new file.
2. Prompt the AI Assistant: "Create a responsive navbar in React + Tailwind with a mobile menu."
3. Review, save, and run the dev server to preview.

---

## Development Workflow
- Branch naming: feature/<short-description>, fix/<short-description>  
- Commit messages: short, imperative (e.g., "feat: add project templates")  
- Keep PRs small and focused; include screenshots for UI changes.  
- Run linters and tests before opening a PR:
```bash
npm run lint
npm run test
```

---

## Architecture & Components
- Editor: Monaco Editor with custom AI integrations for inline suggestions.  
- AI Assistant: Server-side orchestrator routing prompts to Google Gemini or local Ollama.  
- Auth: NextAuth.js with Google/GitHub providers; sessions stored in MongoDB.  
- Runtime: WebContainer API provides an isolated in-browser runtime for npm scripts, dev servers, and REPLs.  
- Storage: Cloudinary for media assets; MongoDB for application and user data.

---

## Roadmap
Planned improvements:
- AI-powered code review & suggestions
- Real-time collaborative editing
- Voice assistant and multimodal prompting
- One-click deployment (Vercel, Netlify)
- Plugin marketplace & project templates

---

## Contributing
Thanks for contributing — you’re welcome!
1. Fork the repo and create a branch: `git checkout -b feature/your-feature`  
2. Commit changes: `git commit -m "feat: description"`  
3. Push and open a PR against `main`  
4. Fill the PR template and add screenshots for UI changes  
5. Follow code style (Prettier/ESLint) and run tests locally

Consider adding a CONTRIBUTING.md and ISSUE_TEMPLATE.md to standardize contribution workflows.

---

## Security
If you discover a security vulnerability, please report it privately to the project owner instead of opening a public issue.

---

## License
This project is licensed under the MIT License — see the LICENSE file for details.

---

## Author & Contact
Arpit — ECE Student, Full-stack & AI enthusiast  
GitHub: https://github.com/arpitsingh22197

---

