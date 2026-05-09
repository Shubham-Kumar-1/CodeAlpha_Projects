# NexusSocial 🌐

NexusSocial is a modern, high-fidelity social networking platform featuring a sleek dark-mode interface and futuristic design aesthetics. Built with a focus on seamless user interaction, it provides a premium experience for connecting and sharing content.

![NexusSocial Preview](https://via.placeholder.com/1200x600/1a1a2e/ffffff?text=NexusSocial+Interface+Preview)

## ✨ Features

- **🔐 Secure Authentication**: User registration and login with JWT (JSON Web Tokens) and bcrypt password hashing.
- **📱 Dynamic Feed**: Real-time access to global posts with support for text and image content.
- **🖼️ Media Support**: Image upload functionality for posts and profile pictures.
- **💬 Engagement**: Like system and multi-level commenting to keep the conversation flowing.
- **👤 User Profiles**: Personalized profile pages with bios, follower counts, and post history.
- **🤝 Follow System**: Connect with other users through a robust following/unfollowing mechanism.
- **✨ Futuristic UI**: A premium dark-themed interface built with glassmorphism, smooth animations, and responsive layout.

## 🚀 Tech Stack

### Frontend
- **HTML5**: Semantic structure.
- **Vanilla CSS**: Custom styling with glassmorphism and modern typography (Outfit).
- **JavaScript (ES6+)**: Dynamic DOM manipulation and API integration.
- **FontAwesome**: High-quality vector icons.

### Backend
- **Node.js**: Server-side runtime environment.
- **Express.js**: Web framework for API development.
- **SQLite3**: Lightweight, file-based relational database.
- **JWT**: Token-based authentication.
- **Multer**: Middleware for handling `multipart/form-data` (image uploads).
- **Bcrypt.js**: Secure password encryption.

## 🛠️ Installation & Setup

1. **Clone the repository**:
   ```bash
   git clone <your-repository-url>
   cd nexus-social
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Database Initialization**:
   The server automatically initializes the SQLite database (`social.db`) and required tables on the first run.

4. **Environment Configuration**:
   Ensure you update the `SECRET_KEY` in `server.js` for production environments.

## 🏃 Running the Application

To start the server, run:

```bash
npm start
```

The application will be accessible at: `http://localhost:5000`

## 📁 Project Structure

```text
├── public/              # Frontend assets
│   ├── index.html       # Main entry point
│   ├── style.css        # Custom styles
│   └── app.js           # Frontend logic
├── uploads/             # User-uploaded images
├── server.js            # Node.js backend
├── package.json         # Dependencies and scripts
└── social.db            # SQLite database file
```

## 📜 License

This project is licensed under the **ISC License**.

---

*Built with ❤️ by the Nexus team.*
