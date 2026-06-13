# Whispr - Frontend Client

The frontend client for **Whispr**, a sleek, real-time messaging application. Built with [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), and [Vite](https://vite.dev/), featuring custom vanilla CSS stylesheets optimized for high performance, smooth micro-animations, and modern visual design.

---

## ✨ Features

- **Dynamic Landing Page:** Rich, modern landing page with animations and custom gradients.
- **Sleek Authentication Flow:** Dedicated, polished forms for both user Login and Registration with active input verification.
- **Backend API Integration:** Fully integrated with the backend Fastify server for account creation (`/api/auth/register`), user authentication (`/api/auth/login`), profile retrieval (`/api/auth/me`), and active session termination (`/api/auth/logout`).
- **Global Auth Context & Hooks:** Shared React context (`AuthProvider` and custom `useAuth()` hook) to persist state, restore sessions on reload, and dispatch API requests safely with cookies.
- **Access Route Guards:** 
  - `ProtectedRoute` to guard `/chat` from unauthenticated users.
  - `PublicRoute` (Guest guard) to prevent logged-in users from manually backtracking to `/login`, `/register`, or `/`, automatically redirecting them to `/chat`.
- **Immersive Chat Interface:** Fully featured chat interface showing the active user's details, dynamic initials/avatar, and online indicators.
- **Premium Custom Aesthetics:** Custom dark/glassmorphic theme variables, scrollbars, card layouts, hover transitions, error alerts, page spinners, and responsive layouts.
- **Vector Icons:** Fully integrated vector icons using `lucide-react`.

---

## 🚀 Technology Stack

- **Core Library:** [React (v19)](https://react.dev/)
- **Build Tool:** [Vite (v8)](https://vite.dev/) with configured proxy for `/api` requests to backend on `http://localhost:3001`
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Routing:** [React Router DOM (v7)](https://reactrouter.com/)
- **Styling:** Custom Vanilla CSS (Design system defined in `src/index.css` & `src/App.css`)
- **Icons:** [Lucide React](https://lucide.dev/)
- **Validation:** [Zod](https://zod.dev/) for client-side type-safe form validations

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

Start Vite's development server with Hot Module Replacement (HMR) and backend API proxy routing:

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
├── public/                 # Public assets
├── src/
│   ├── assets/             # Application images and media assets
│   ├── components/         # Reusable layouts, navigation, and guards
│   │   ├── AuthLayout.tsx  # Split 60-40 screen layout wrapper for login/register pages
│   │   ├── Navbar.tsx      # Responsive header navigation (hidden on chat)
│   │   ├── ProtectedRoute.tsx # Route guard enforcing authentication (redirects to login)
│   │   ├── PublicRoute.tsx    # Guest-only route guard (redirects authenticated to chat)
│   │   └── ThemeToggle.tsx # Theme changer widget (light/dark mode)
│   ├── context/            # React global context providers
│   │   └── AuthContext.tsx # Context managing active session state & API requests
│   ├── pages/              # Core views mapped to app routes
│   │   ├── Home.tsx        # Welcome landing page
│   │   ├── Login.tsx       # Sign-in portal (with API state integration)
│   │   ├── Register.tsx    # Sign-up portal (with API validation redirection)
│   │   └── Chat.tsx        # Immersive chat interface with dynamic profile header
│   ├── App.css             # Layout and minor app-wide overriding rules
│   ├── App.tsx             # App entry, routing wrapper, guards config
│   ├── index.css           # Main stylesheet, CSS variables system, and globals
│   └── main.tsx            # React application mount script
├── index.html              # Vite HTML template entrypoint
├── vite.config.ts          # Vite compiler rules, including server API proxying
├── tsconfig.json           # TypeScript configuration
└── package.json            # Dependency manifest and scripts
```
