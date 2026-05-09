# Nexus | Real-Time Collaboration Platform

Nexus is a premium, high-fidelity real-time collaboration application designed for seamless video conferencing, instant messaging, and interactive teamwork. Built with a modern glassmorphism aesthetic, it provides a powerful yet intuitive interface for teams to connect and collaborate.

![Nexus Preview](https://images.unsplash.com/photo-1587560699334-cc4ff634909a?q=80&w=2070&auto=format&fit=crop)

## 🚀 Features

### 📹 Video Conferencing
- **High-Quality Video/Audio**: Real-time peer-to-peer communication powered by PeerJS.
- **Screen Sharing**: Share your screen with participants with a single click.
- **Camera & Mic Toggle**: Easy controls for privacy and bandwidth management.

### 💬 Real-Time Messaging
- **Instant Group Chat**: Communicate with everyone in the room instantly.
- **Dynamic Avatars**: Personalized user profiles using DiceBear avatars.
- **Emoji Reactions**: Express yourself with quick interactive reactions.

### 🛠️ Collaboration Tools
- **Collaborative Whiteboard**: Draw, brainstorm, and visualize ideas together in real-time.
- **File Sharing**: Securely share documents and assets within the workspace.
- **Hand Raising**: Structured communication with a hand-raising feature.

### 🛡️ Moderation & Management
- **Host Controls**: Room hosts can manage participants, including muting and kicking users.
- **Lobby System**: Securely join rooms with custom usernames and Room IDs.
- **Invite System**: Quickly copy and share invite links to bring others into the session.

## 🛠️ Tech Stack

- **Frontend**: Vite, HTML5, Vanilla CSS (Glassmorphism), JavaScript (ES Modules).
- **Backend**: Node.js, Express.
- **Real-Time Engine**: Socket.io for signaling and messaging.
- **P2P Communication**: PeerJS for video/audio streams.
- **Design**: Lucide Icons, Google Fonts (Inter), DiceBear Avatars.

## 🏁 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd WebChat
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run the application**
   You can run both the client and server concurrently using:
   ```bash
   npm run dev
   ```

   Alternatively, run them separately:
   - Client: `npm run dev:client` (Vite)
   - Server: `npm run dev:server` (Node.js)

4. **Access the App**
   - Frontend: `http://localhost:5173` (default Vite port)
   - Server: `http://localhost:3000`

## 🏗️ Project Structure

```text
WebChat/
├── public/          # Static assets
├── src/
│   ├── style.css    # Premium Glassmorphism UI styles
│   └── main.js      # Frontend logic and signaling
├── server.js        # Node.js server with Socket.io & PeerServer
├── index.html       # Main entry point
├── vite.config.js   # Vite configuration
└── package.json     # Project dependencies and scripts
```

## 📄 License

This project is licensed under the MIT License.

---

Built with ❤️ for high-fidelity collaboration.
