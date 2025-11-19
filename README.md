# Mind Space

**Mind Space** is a personal productivity and knowledge organization platform that combines task management, skill tracking, goal setting, financial management, and journaling into a unified, beautiful interface.

![Mind Space](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## Features

### 🗺️ Mind Map
- Interactive node-based visualization of your knowledge and tasks
- Drag-and-drop interface with D3.js
- Connect related concepts and ideas

### ✅ Action Center
- Kanban-style task board with drag-and-drop
- Link tasks to skills and goals
- Subtask management with progress tracking
- Goal management with task tracking

### 🎯 Skills Matrix
- Track your skill development with progress indicators
- 3D card interface with glassmorphic design
- Categorize and organize skills

### 💰 Finance Tracker
- Track income, expenses, and investments
- Virtual wallet with card management
- Monthly financial overview
- Tag-based transaction categorization

### 📔 Journal
- Calendar-integrated journal entries
- Rich media support (photos, voice notes)
- Tag-based organization
- Resizable interface

### 🔗 Link Weaver
- Manage and organize web links
- Categorize bookmarks
- Quick access to resources

## Tech Stack

### Frontend
- **React** with TypeScript
- **Vite** for blazing-fast dev experience
- **D3.js** for interactive visualizations
- **CSS-in-JS** with centralized styling

### Backend
- **FastAPI** for high-performance API
- **SQLAlchemy** ORM
- **SQLite** database
- **Pydantic** for data validation

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- Python 3.9+
- Git

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/mindspace.git
cd mindspace
```

2. **Backend Setup**
```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
```

3. **Frontend Setup**
```bash
cd frontend
npm install
```

### Running Locally

#### Using the batch files (Windows):
```bash
# Terminal 1 - Start backend
start-backend.bat

# Terminal 2 - Start frontend
start-frontend.bat
```

#### Manual start:
```bash
# Terminal 1 - Backend
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Terminal 2 - Frontend
cd frontend
npm run dev
```

The app will be available at:
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:8000`
- API Docs: `http://localhost:8000/docs`

## Deployment

### Vercel (Recommended for Frontend)

1. **Push to GitHub**
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/yourusername/mindspace.git
git push -u origin main
```

2. **Deploy Frontend on Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Set the root directory to `frontend`
   - Framework preset: Vite
   - Build command: `npm run build`
   - Output directory: `dist`
   - Add environment variable: `VITE_API_URL=your-backend-url`

### Backend Deployment Options

#### Render / Railway / Fly.io
1. Create a new web service
2. Connect your GitHub repository
3. Set root directory to `backend`
4. Build command: `pip install -r requirements.txt`
5. Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
6. Add environment variables if needed

#### Heroku
```bash
# Add Procfile to backend directory
echo "web: uvicorn app.main:app --host 0.0.0.0 --port $PORT" > backend/Procfile

# Deploy
heroku create mindspace-api
git push heroku main
```

### Environment Variables

**Frontend** (`.env`):
```
VITE_API_URL=http://localhost:8000
```

**Backend** (if using external database):
```
DATABASE_URL=postgresql://user:pass@host:port/dbname
```

## Project Structure

```
mindspace/
├── backend/
│   ├── app/
│   │   ├── routers/         # API endpoints
│   │   ├── models.py        # Database models
│   │   ├── schemas.py       # Pydantic schemas
│   │   ├── database.py      # DB configuration
│   │   └── main.py          # FastAPI app
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── services/        # API calls
│   │   ├── styles/          # Centralized styles
│   │   ├── types/           # TypeScript types
│   │   └── utils/           # Helper functions
│   ├── package.json
│   └── vite.config.ts
└── README.md
```

## API Endpoints

All endpoints are prefixed with `/api`:

- `/nodes` - Mind map nodes
- `/links` - Node connections
- `/tasks` - Tasks and subtasks
- `/skills` - Skill tracking
- `/goals` - Goal management
- `/cards` - Financial cards
- `/income` - Income transactions
- `/expenses` - Expense transactions
- `/investments` - Investment transactions
- `/journal` - Journal entries

Full API documentation available at `/docs` when running the backend.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.

## Acknowledgments

- Built with ❤️ using React, FastAPI, and D3.js
- Inspired by modern productivity tools and personal knowledge management systems
