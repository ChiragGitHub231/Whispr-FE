# Whispr - A chat based web application

**Whispr** is a high-performance, real-time chat application designed with a sleek, premium dark/glassmorphic user interface. It provides a highly secure and interactive messaging platform for instant communication.

*   **Purpose & Use Case:** Enables users to chat instantly via private Direct Messages (DMs) and multi-user Group Channels, serving as a comprehensive real-time communication platform.
*   **Real-Time Interactions:** Supports instantaneous message delivery, live typing status, online/offline presence tracking, and synchronized read receipts using WebSockets.
*   **Media & File Sharing:** Allows users to share and preview images, audio, video, and documents (up to 50MB) with an in-app media gallery to view all shared files.
*   **Privacy & Account Controls:** Features secure JWT authentication (with cookies), customizable user profiles (including cropping avatars), and privacy controls to toggle status visibility, soft-delete messages, or clear chat history.

---

## 📸 Project Screenshots

| | |
| :---: | :---: |
| <img src="https://github.com/user-attachments/assets/1fd14424-672a-40f5-821d-7e1e2192a7fb" width="450" alt="Register Page" /><br>**Register Page:** *Secure registration screen supporting custom avatar uploads, password verification, and instant email validation.* | <img src="https://github.com/user-attachments/assets/ff43f43e-e9b6-49f5-b89a-afbed3d84a42" width="450" alt="Login Page" /><br>**Login Page:** *Authentication gateway verifying user credentials and saving JWT cookies for secure sessions.* |
| <img src="https://github.com/user-attachments/assets/a8ede980-2a2d-4a17-9c36-1f05439ce536" width="450" alt="Home Page" /><br>**Home Page:** *The primary dashboard layout featuring the core navigation sidebar, conversation sidebar, and welcome screen.* | <img src="https://github.com/user-attachments/assets/c80cdd7f-4715-4834-a3aa-c9823f345126" width="450" alt="Chat Conversations" /><br>**Chat Conversations:** *Immersive chat feed showcasing real-time messages, media attachments, typing status, and read receipts.* |
| <img src="https://github.com/user-attachments/assets/f6870653-e429-4c55-a3a2-2498d4e4d22b" width="450" alt="Profile Page" /><br>**User Profile:** *Profile customization allowing real-time edits to names, bios, contact details, and cropping/uploading profile pictures.* | <img src="https://github.com/user-attachments/assets/292b51a4-cff0-4bbd-88c2-da3c9b75760b" width="450" alt="Settings Page" /><br>**App Settings:** *Privacy panel with instant toggles for presence status ('Show Status') and read receipts, syncing with the backend database.* |
| <img src="https://github.com/user-attachments/assets/5654fa4b-e056-49e0-94e3-9750fc80d471" width="450" alt="Media Page" /><br>**Shared Media Gallery:** *Unified gallery categorizing photos, videos, and files shared across all chat rooms, with real-time updates.* | <img src="https://github.com/user-attachments/assets/b80efd14-c75d-4939-b81e-e88b95b94201" width="450" alt="Search and Details" /><br>**Search & Room Details:** *Interactive right details drawer for room members, combined with local message search and hit highlighting.* |
| <img src="https://github.com/user-attachments/assets/e32a3b00-705a-4f67-9bc8-f00210d8bff4" width="450" alt="Add User Options" /><br>**Add User Options:** *Quick action drop-down menu in the sidebar to start a new DM or create a Group Channel.* | <img src="https://github.com/user-attachments/assets/4f7cf4d7-b5a0-4055-8ee3-4369ca5c0318" width="450" alt="DM Creation Dialog" /><br>**DM Creation:** *Popup modal to start a DM by validating the recipient's email address.* |
| <img src="https://github.com/user-attachments/assets/71733b18-8087-4058-97fa-354c0dea102a" width="450" alt="Group Creation Dialog" /><br>**Channel (Group) Creation:** *Channel creation menu to configure group chat names and add multiple verified participant emails.* | |

---

## ✨ Core Features

| Feature | Description | Key Tech / Mechanics |
| :--- | :--- | :--- |
| **Real-Time Messaging** | Instant message transmission, delivery verification, and real-time state synchronization. | WebSockets, React State |
| **Presence Indicators** | Live tracking of users' online/offline presence status, including "Last seen" timestamps. | WebSocket Broadcasts |
| **Activity Indicators** | Shows active typing indicators in real-time when room members are typing. | Debounced event listeners |
| **Group & Direct Chats** | Create private direct messages or multi-user channels by looking up verified emails. | Fastify API, PostgreSQL relations |
| **Robust Authentication** | Polished Login & Registration flow with secure route guards and session persistence. | React Router Guards, JWT, Cookies |
| **Shared Media Gallery** | Unified gallery displaying shared images, videos, and documents grouped by date. | Fastify Media endpoints, filtering |
| **In-App Profile Management** | Dynamic updates to name, bio, contacts, and custom avatars with client-side cropping. | Base64 conversion, canvas resizing |
| **Message Search & Highlights** | Text search within the active conversation featuring step-by-step match highlighting. | Custom match highlighting logic |
| **File & Attachment Pipeline** | Share and preview files up to 50MB with dedicated players and full-screen viewports. | File reader API, custom audio/video layers |
| **Security & Deletion** | Options to soft-delete specific messages or clear entire conversation chat histories. | Supabase storage API, cascade deletion |
| **Fully Responsive UI** | Optimized layout that scales dynamically across mobile, tablet, and desktop viewports. | Vanilla CSS media queries |

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

---

## 🔗 Backend API Integration

The frontend client communicates with the **Whispr Backend API** for all authentication, room management, messaging, and real-time synchronization.

*   **Backend Repository:** [ChiragGitHub231/Whispr-BE](https://github.com/ChiragGitHub231/Whispr-BE)
*   **Base API Endpoint:** `http://localhost:3001` (proxied via `/api` in development)
*   **Websocket Server:** `ws://localhost:3001/ws` (proxied via `/ws` in development)

### 🔌 Main API Endpoints Utilized

| Service | Endpoint | Method | Purpose |
| :--- | :--- | :---: | :--- |
| **Auth** | `/api/auth/register` | `POST` | Account registration with form validation |
| | `/api/auth/login` | `POST` | Authenticate user and store JWT cookie |
| | `/api/auth/logout` | `POST` | Clear JWT session token |
| | `/api/auth/me` | `GET` / `PUT` | Retrieve or update user profile and privacy settings |
| | `/api/auth/check/:email` | `GET` | Validate user registration status by email |
| **Rooms** | `/api/rooms` | `GET` / `POST` | List joined chat rooms or create new DM/Group channels |
| | `/api/rooms/:id` | `PATCH` / `DELETE` | Rename or delete group channels |
| | `/api/rooms/:id/members` | `POST` / `DELETE` | Manage group channel participants |
| **Messages** | `/api/messages/:roomId` | `GET` / `POST` | Load message history (paginated) or send new text/attachments |
| | `/api/messages/:roomId/upload` | `POST` | Upload file attachments up to 50MB |
| | `/api/messages/:messageId` | `DELETE` | Soft-delete a sent message |
| | `/api/messages/room/:roomId/clear` | `DELETE` | Clear complete conversation chat history |
| **Media** | `/api/media` | `GET` | Retrieve list of all files/media shared in the user's rooms |
