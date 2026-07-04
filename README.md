# Whispr - Frontend Client

The frontend client for **Whispr**, a sleek, real-time messaging application. Built with [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), and [Vite](https://vite.dev/), featuring custom vanilla CSS stylesheets optimized for high performance, smooth micro-animations, and modern visual design.

---

## ✨ Features

- **Dynamic Landing Page:** Rich, modern landing page with animations and custom gradients.
- **Sleek Authentication Flow:** Dedicated, polished forms for both user Login and Registration with active input verification.
- **Unified Workspace Sidebar:** Multi-view sidebar navigator supporting dedicated tabs for **Chats**, **Profile** settings, general **Settings**, and shared **Media** gallery.
- **Room & Group Channel Management:** Start new chats via a drop-down menu. Create Direct Message rooms or build Group Channels by resolving and verifying participant emails directly against the backend.
- **Realtime Messaging & State Syncing:** Live message updates through WebSocket events for chat delivery, read receipts, and state syncing.
- **Presence & Activity Indicators:** Real-time online/offline presence indicators (including a "Last seen" timestamp for offline members) and live typing indicators showing which member is typing in the room.
- **Unread Conversation Tracking:** Chat list badges update in real-time for unread messages without needing to reopen the conversation manually.
- **Infinite Message Pagination:** Cursor-based older message pagination that automatically loads previous chat pages (30 messages per page) on scroll-up. Uses a custom skeleton loader UI (`skeleton-pulse` animation) and scroll-anchoring to prevent visual layout jumps.
- **Media & File Attachments:** Share files up to 50MB. Features an input preview drawer before sending, and custom visual rendering blocks in the chat feed (image overlays, full video players, audio player cards with waveforms, and download links for general files/documents). Includes a fullscreen modal media viewer with file downloading.
- **Message Operations & Soft Deletion:** Allows deleting user messages. Implements a custom confirm deletion modal and handles soft deletion, rendering deleted messages as "This message was deleted" for all users while clean-purging linked assets from storage.
- **Room History Clearing:** Clean option to clear chat history, displaying a custom backdrop-blurred confirm dialog. Purges all messages from the DB and files from Supabase storage, replacing them with a senderless system audit message.
- **Interactive User Profile Configuration:** In-app editing for name, contact details, bio, and custom profile image uploads/conversions. Features client-side image cropping/resizing and conversion to Base64 before syncing to the backend.
- **Advanced Chat Search & Match Highlighting:** Search specifically within the current chat room, complete with step-by-step match-highlighting controls (previous/next hit).
- **Backend API Integration:** Fully integrated with the backend Fastify server for account creation (`/api/auth/register`), authentication (`/api/auth/login`), profile retrieval and update (`/api/auth/me`), database email existence verification (`/api/auth/check/:email`), and session termination (`/api/auth/logout`).
- **Global Auth Context & Hooks:** Shared React context (`AuthProvider` and custom `useAuth()` hook) to persist state, restore sessions on reload, and dispatch API requests safely with cookies.
- **Access Route Guards:**
  - `ProtectedRoute` to guard `/chat` from unauthenticated users.
  - `PublicRoute` (Guest guard) to prevent logged-in users from manually backtracking to `/login`, `/register`, or `/`, automatically redirecting them to `/chat`.
- **Immersive Chat Interface:** Fully featured chat interface showing the active user's details, dynamic initials/avatar, online indicators, and realtime chat updates.
- **Premium Custom Aesthetics:** Custom dark/glassmorphic theme variables, scrollbars, card layouts, hover transitions, error alerts, page spinners, and responsive layouts.
- **Vector Icons:** Fully integrated vector icons using `lucide-react`.

---

## 🚀 Technology Stack

- **Core Library:** [React (v19)](https://react.dev/)
- **Build Tool:** [Vite (v8)](https://vite.dev/) with configured proxy for `/api` and `/ws` requests to backend on `http://localhost:3001`
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Realtime Layer:** WebSocket-based live updates for chat messages and presence events
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

## 📱 Mobile Responsive Optimizations

The layout has been heavily optimized for small screen dimensions and touch interactions under a dedicated `@media (max-width: 768px)` system:
- **Utility Nav Bar Collapse:** Collapses to a slim `70px` left bar on small screens, centering navigation icons and branding logo with full hover tooltips.
- **Compact Conversations List:** Shrinks the middle panel to `80px` displaying centered room avatars. Hovering over room avatars dynamically exposes the room/contact name in tooltips.
- **Aligned Headers:** Standardized height (`65px`) and horizontal padding (`1rem`) across all main layout headers (Conversations list, Chat conversation, and Details panel) for a perfectly aligned vertical axis.
- **Details Drawer Overlay:** Renders as a smooth-sliding fixed drawer spanning `280px` to cover a major portion of the screen, ensuring absolute visibility of details and the close (`X`) button without clipping.
- **Avatar Stretching Protections:** Implemented aspect ratio preservation and `flex-shrink: 0` constraints to secure proper circular representation of initials/profile avatars on limited view heights.
- **Header Text Protection:** Added bounds and auto-truncation rules for long room/contact names and online status texts in the header.

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
