# CodeGenie AI

[![License: MIT](https://img.shields.io/badge/license-MIT-green.svg)](#license) [![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)](#) [![Stars](https://img.shields.io/badge/stars-welcome-yellow.svg)](#)

A browser-first, AI-powered development environment that helps developers write, run, debug, and ship code without local setup. CodeGenie AI combines a cloud IDE, intelligent AI assistance, and in-browser runtime capabilities for a seamless coding experience.

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
- **Intelligent AI Assistant** — Generate, explain, and refactor code with Groq or local Ollama models
- **Multi-AI Model Support** — Fallback between Groq API and local Ollama for flexibility
- **Context-aware Autocomplete** — Real-time code completion powered by AI
- **Cloud Browser IDE** — Monaco editor with full code editing capabilities
- **Live In-Browser Terminal** — WebContainer API for npm/script execution and REPL
- **Project Management** — Create projects, file management with autosave, and browser-based persistence
- **Authentication** — Google OAuth with NextAuth.js and secure session management
- **Multi-language Support** — JavaScript, TypeScript, Python, Java, and more
- **Database Integration** — Built-in user and project persistence with Prisma

---

## Tech Stack
- **Frontend:** Next.js 15, React 19, TypeScript, Tailwind CSS, Shadcn/UI, Monaco Editor
- **Backend:** Next.js API routes, NextAuth.js
- **Database:** MongoDB with Prisma ORM
- **AI Models:** Groq API (primary), Ollama (local/self-hosted fallback)
- **Runtime:** WebContainer API (in-browser npm/shell environment)
- **Authentication:** NextAuth.js with Google OAuth
- **UI Components:** Radix UI, custom Shadcn components

---

## Project Structure
High-level layout:
```
app/                    # Next.js app directory
├── api/               # API routes (auth, AI, playground)
├── (auth)/            # Auth-related pages
└── (main)/            # Main application pages

components/            # Reusable React components
hooks/                 # Custom React hooks
lib/                   # Utilities and helpers
modules/               # Feature-specific modules
services/              # External service integrations
types/                 # TypeScript type definitions
styles/                # Global styles
prisma/                # Prisma ORM schema
public/                # Static assets
```

---

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or pnpm
- MongoDB instance (local or cloud)
- **For AI features:**
  - Groq API key (https://console.groq.com) — **OR**
  - Local Ollama installation (https://ollama.ai)
- **For authentication:**
  - Google OAuth credentials (https://console.cloud.google.com)

### Clone & Install
```bash
git clone https://github.com/arpitsingh22197/Project.git
cd Project
npm install
```

### Environment
Create a `.env.local` file in the project root:
```env
# Database
DATABASE_URL=mongodb+srv://username:password@cluster.mongodb.net/codegenie

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here

# Google OAuth
AUTH_GOOGLE_ID=your-google-client-id
AUTH_GOOGLE_SECRET=your-google-client-secret

# AI Models (choose one or both for fallback)
GROQ_API_KEY=your-groq-api-key          # Primary AI provider
OLLAMA_BASE_URL=http://localhost:11434  # Local Ollama (optional fallback)

# Optional: GitHub integration
GITHUB_TOKEN=your-github-token-optional
```

**Notes:**
- `DATABASE_URL`: Obtain from MongoDB Atlas
- `NEXTAUTH_SECRET`: Generate with `openssl rand -base64 32`
- `GROQ_API_KEY`: Get free API key from [Groq Console](https://console.groq.com)
- `OLLAMA_BASE_URL`: Only needed if running Ollama locally
- Keep all secrets out of version control

### Run Locally
```bash
# Development (with Turbopack for fast rebuilds)
npm run dev

# Production build
npm run build
npm run start

# Lint code
npm run lint
```

Open: http://localhost:3000

---

## Usage

### Basic Workflow
1. **Sign in** with Google OAuth
2. **Create a new project** or start with a template (React, Next.js, Express, Vue, Hono, Angular)
3. **Use the AI Assistant** to:
   - Generate code from natural language prompts
   - Refactor existing code
   - Explain code snippets
4. **Run code** in the in-browser terminal without local setup
5. **Save and iterate** — projects persist to MongoDB

### Example: Generate a React Component
1. Create a new file in the editor (e.g., `Navbar.tsx`)
2. Prompt the AI: "Create a responsive navbar in React + Tailwind with a mobile menu and dark mode toggle"
3. Review the generated code, edit as needed
4. Import and use in your project
5. Test in the live preview pane

### AI Model Behavior
- **Primary:** Groq API is used by default (fast, free tier available)
- **Fallback:** If Groq fails or is unavailable, the system falls back to local Ollama
- **Self-hosted:** Run Ollama locally for complete privacy and offline operation

---

## Development Workflow
- **Branch naming:** `feature/<short-description>` or `fix/<short-description>`
- **Commit messages:** Short, imperative tense (e.g., "feat: add code generation", "fix: auth session leak")
- **PRs:** Keep focused and small; include screenshots for UI changes
- **Before opening a PR:**
  ```bash
  npm run lint
  ```

---

## Architecture & Components

### Editor
- Monaco Editor with syntax highlighting for 50+ languages
- Custom AI integrations for inline code suggestions
- Real-time file management and autosave to MongoDB

### AI Assistant
- Server-side orchestrator routing prompts to Groq or local Ollama
- Intelligent fallback: tries Groq first, falls back to Ollama if needed
- Streaming responses for real-time user feedback

### Authentication & Sessions
- NextAuth.js with Google OAuth provider
- Sessions stored securely in MongoDB via Prisma
- Role-based access control (USER, PREMIUM_USER, ADMIN)

### Runtime
- WebContainer API provides an isolated, in-browser runtime
- Full npm package installation and script execution
- REPL support for quick testing and debugging

### Database & ORM
- MongoDB for user, project, and chat data persistence
- Prisma ORM for type-safe queries and automatic migrations
- Automatic schema generation on build

---

## Roadmap
Planned improvements:
- AI-powered code review and suggestions
- Real-time collaborative editing
- Voice-based prompts and multimodal AI interactions
- One-click deployment (Vercel, Netlify, Railway)
- Custom project templates and plugin marketplace
- Extended language support (Go, Rust, C++)

---

## Contributing
Contributions are welcome! Here's how:
1. Fork the repo and create a feature branch: `git checkout -b feature/your-feature`
2. Make your changes and commit: `git commit -m "feat: description of changes"`
3. Push to your fork and open a PR against `main`
4. Fill out the PR template and include screenshots for UI changes
5. Follow code style (Prettier/ESLint); run `npm run lint` before submitting

See `CONTRIBUTING.md` for detailed guidelines (coming soon).

---

## Security
If you discover a security vulnerability, please report it **privately** to the project owner instead of opening a public issue. Do not disclose vulnerabilities publicly until they are fixed.

---

## License
This project is licensed under the MIT License — see the [LICENSE](./LICENSE) file for details.

---

## Author & Contact
**Arpit** — ECE Student, Full-stack & AI Enthusiast

- **GitHub:** https://github.com/arpitsingh22197
- **LinkedIn:** https://www.linkedin.com/in/arpit-singh-b9b5052a0/

---
