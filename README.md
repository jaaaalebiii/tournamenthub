# 🏆 TournamentHub

TournamentHub is a modern full-stack sports tournament management platform that helps organizers create balanced teams, generate tournament brackets, track match results, save tournaments to the cloud, and export tournament data — all from a clean and responsive web interface.

---

## 🌐 Live Demo

**Website:** https://tournamenthub-seven.vercel.app/

---

## ✨ Features

### ⚖️ Smart Team Generation

* Rating-based team balancing
* Multi-team support
* Custom team names
* Custom sport configuration
* Dynamic team size selection
* Drag-and-drop player swapping

### 🏅 Tournament Management

* Automatic tournament bracket generation
* Friendly, Knockout, and League formats
* Match score tracking
* Winner progression system
* Tournament save/load functionality
* Tournament editing and deletion
* Shareable tournament links

### 📊 Statistics Dashboard

* Total players
* Team statistics
* Average ratings
* Strongest and weakest teams
* Tournament balance analysis
* Match generation metrics
* Role balance analysis

### ☁️ Cloud Storage

* MongoDB Atlas integration
* Tournament persistence across sessions
* Backend API support
* Saved tournament management
* Load tournaments from anywhere

### 📂 Data Management

* CSV player import
* PDF tournament export
* LocalStorage caching
* Cloud database storage

### 🎨 User Experience

* Modern premium UI
* Dark theme design
* Fully responsive layout
* Mobile-friendly experience
* Interactive tournament bracket
* Toast notifications
* Drag-and-drop team management

### 🏃 Multi-Sport Support

Supported sports:

* Cricket
* Football
* Badminton
* Athletics
* Custom Sports

---

## 🏗️ Architecture

```text
Frontend (Vercel)
        ↓
HTML • CSS • JavaScript
        ↓
REST API
        ↓
Node.js + Express.js (Render)
        ↓
MongoDB Atlas
```

---

## 📸 Screenshots

### Landing Page

<img width="2504" height="1215" alt="image" src="https://github.com/user-attachments/assets/098c3aa0-7776-416f-89ad-69972fae16ad" />

### Team Generation

<img width="996" height="1229" alt="image" src="https://github.com/user-attachments/assets/45cb1171-7104-4f6d-ad0e-4163c48bfce7" />

### Statistics Dashboard

<img width="1453" height="1112" alt="image" src="https://github.com/user-attachments/assets/bb70fc07-224a-45a1-814c-76bbdc8edce1" />

### Tournament Bracket

<img width="1026" height="745" alt="image" src="https://github.com/user-attachments/assets/ca953477-0c84-4099-b26e-17dbcf1d41d7" />

---

## 🛠️ Tech Stack

### Frontend

* HTML5
* CSS3
* Vanilla JavaScript

### Backend

* Node.js
* Express.js

### Database

* MongoDB Atlas
* Mongoose

### Browser APIs

* LocalStorage

### Libraries

* jsPDF

### Deployment

* Vercel
* Render

### Version Control

* Git
* GitHub

---

## 🚀 Getting Started

Clone the repository:

```bash
git clone https://github.com/jaaaalebiii/tournamenthub.git
```

Open the project:

```bash
cd tournamenthub
```

Install dependencies:

```bash
npm install
```

Create a `.env` file inside backend:

```env
MONGO_URI=your_mongodb_connection_string
PORT=5000
```

Run the backend:

```bash
npm start
```

Open the frontend:

```bash
Open index.html in your browser
```

---

## 📈 Roadmap

### Version 1.1

* Enhanced role balancing
* Improved analytics dashboard
* Better bracket visualization
* Tournament sharing improvements

### Version 2.0

* User authentication
* Public tournament pages
* Team captain system
* Real-time score updates
* Leaderboards
* Tournament invitations
* Admin dashboard

---

## 🤝 Contributing

Contributions, suggestions, and improvements are welcome.

Feel free to fork the repository and submit pull requests.

---

## 👨‍💻 Author

**Jalaj Maheshwari**

* GitHub: https://github.com/jaaaalebiii
* LinkedIn: https://www.linkedin.com/in/jalaj-maheshwari-82802130a/

---

## ⭐ Support

If you found this project useful, consider giving the repository a star.

It helps support future development and improvements.
