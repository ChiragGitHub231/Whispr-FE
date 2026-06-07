# Whispr - Frontend Client

The frontend client for **Whispr**, a sleek, real-time messaging application. Built with [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), and [Vite](https://vite.dev/), featuring custom vanilla CSS stylesheets optimized for high performance, smooth micro-animations, and modern visual design.

---

## ✨ Features

- **Dynamic Landing Page:** Rich, modern landing page with animations and custom gradients.
- **Sleek Authentication Flow:** Dedicated, polished forms for both user Login and Registration.
- **Immersive Chat Interface:** Fully featured chat interface designed for communication. The main Navigation Bar is automatically hidden inside the chat window (`/chat`) to maximize screen estate and focus attention on messages.
- **Premium Custom Aesthetics:** Custom dark/glassmorphic theme variables, scrollbars, card layouts, hover transitions, and responsive grid layouts.
- **Vector Icons:** Fully integrated vector icons using `lucide-react`.

---

## 🚀 Technology Stack

- **Core Library:** [React (v19)](https://react.dev/)
- **Build Tool:** [Vite (v8)](https://vite.dev/) for lightning-fast HMR and building
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Routing:** [React Router DOM (v7)](https://reactrouter.com/)
- **Styling:** Custom Vanilla CSS (Design system defined in `src/index.css` & `src/App.css`)
- **Icons:** [Lucide React](https://lucide.dev/)

---

## 🛠️ Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+ recommended)
- [npm](https://www.npmjs.com/)

### Installation

Navigate to the frontend directory and install dependencies:

```bash
cd Whispr-FE
npm install
```

### Running Development Server

Start Vite's development server with Hot Module Replacement (HMR) enabled:

```bash
npm run dev
```

The app will start on `http://localhost:5173` (by default). Open it in your web browser.

### Build & Production Deployment

To compile the production-ready assets:

```bash
npm run build
```

This generates optimized static files in the `/dist` directory. You can preview the production bundle locally with:

```bash
npm run preview
```

---

## 📁 Project Structure

```
Whispr-FE/
├── public/               # Public assets
├── src/
│   ├── assets/           # Application images and media assets
│   ├── components/       # Reusable layout and UI components
│   │   └── Navbar.tsx    # Responsive header navigation
│   ├── pages/            # Core views mapped to app routes
│   │   ├── Home.tsx      # Welcome landing page
│   │   ├── Login.tsx     # Sign-in portal
│   │   ├── Register.tsx  # Sign-up portal
│   │   └── Chat.tsx      # Immersive chat interface
│   ├── App.css           # Layout and app-wide minor styling overrides
│   ├── App.tsx           # App entry routing wrapper and layout switch
│   ├── index.css         # Main stylesheet, theme tokens, and global typography
│   └── main.tsx          # React application mount script
├── index.html            # Vite HTML template entrypoint
├── vite.config.ts        # Vite custom compiler rules and configuration
├── tsconfig.json         # TypeScript project configuration
└── package.json          # Dependency manifest and scripts
```
