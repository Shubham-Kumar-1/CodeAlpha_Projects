# 🌌 AuraStore - Futuristic E-commerce Platform

AuraStore is a high-fidelity, full-stack e-commerce application designed with a premium "Glassmorphism" aesthetic. It features a seamless shopping experience, secure user authentication, and persistent data storage.

---

## ✨ Features

- **🚀 Modern UI/UX**: Built with Vanilla CSS using glassmorphism, smooth transitions, and high-quality typography (Outfit).
- **🛒 Dynamic Shopping Cart**: Real-time updates, quantity management, and persistent storage using `localStorage`.
- **🔐 Secure Authentication**: JWT-based login and registration system with `bcrypt` password hashing.
- **📦 Database Persistence**: Full integration with SQLite for products, users, and order history.
- **📱 Fully Responsive**: Optimized for desktop, tablet, and mobile screens.
- **🛠️ SEO Optimized**: Semantic HTML5 structure with proper meta tags.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: [Vite](https://vitejs.dev/) (Vanilla JS Template)
- **Styling**: Vanilla CSS (Custom Design System)
- **Icons**: Unicode & Custom CSS

### Backend
- **Server**: [Node.js](https://nodejs.org/) & [Express.js](https://expressjs.com/)
- **Authentication**: JWT (JSON Web Tokens)
- **Security**: BcryptJS

### Database
- **Engine**: [SQLite3](https://sqlite.org/) (File-based persistence)

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v16.x or higher)
- npm (installed automatically with Node.js)

### Installation

1. **Clone the repository** (or navigate to the project folder):
   ```bash
   cd "New folder (3)"
   ```

2. **Setup the Backend**:
   ```bash
   cd server
   npm install
   ```

3. **Setup the Frontend**:
   ```bash
   cd ../client
   npm install
   ```

### Running the Application

You need to run **both** the backend and the frontend servers simultaneously.

1. **Start the Backend Server** (from `/server`):
   ```bash
   npm start
   # or
   node index.js
   ```
   *The API will be available at http://localhost:5000*

2. **Start the Frontend Dev Server** (from `/client`):
   ```bash
   npm run dev
   ```
   *The store will be available at http://localhost:5173*

---

## 📁 Project Structure

```text
├── client/                # Frontend application
│   ├── index.html         # Main entry point
│   ├── main.js            # Core logic & state management
│   ├── style.css          # Design system & glassmorphism styles
│   └── package.json       # Frontend dependencies
├── server/                # Backend API
│   ├── index.js           # Express server & routes
│   ├── db.js              # SQLite schema & seeding logic
│   ├── database.sqlite    # The actual database file
│   └── package.json       # Backend dependencies
└── README.md              # Project documentation
```

---

## 🗺️ Roadmap
- [ ] Implement a full Checkout page with Stripe integration.
- [ ] Add an Admin Dashboard for product management.
- [ ] Implement product search and multi-category filtering.
- [ ] Add dark/light mode toggle.

---

## 📄 License
Distributed under the MIT License. See `LICENSE` for more information.

---

*Designed & Developed with ❤️ by AuraStore Team.*
