from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv

from app.database import init_db
from app.routers import nodes, links, tasks, skills, goals, cards, income, expenses, investments, journal

load_dotenv()

# Initialize FastAPI app
app = FastAPI(
    title="Mind Space API",
    description="Backend API for Mind Space - Personal Productivity & Knowledge Organizer",
    version="1.0.0",
    # Serialize responses using field aliases (camelCase)
    response_model_by_alias=True
)

# CORS middleware - Allow all origins for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(nodes.router)
app.include_router(links.router)
app.include_router(tasks.router)
app.include_router(skills.router)
app.include_router(goals.router)
app.include_router(cards.router)
app.include_router(income.router)
app.include_router(expenses.router)
app.include_router(investments.router)
app.include_router(journal.router)


@app.on_event("startup")
def startup_event():
    """Initialize database on startup"""
    init_db()
    print("✅ Database initialized")
    print("✅ Mind Space API is running")
    print("📚 API Docs: http://localhost:8000/docs")


@app.get("/")
def read_root():
    """Root endpoint"""
    return {
        "message": "Welcome to Mind Space API",
        "version": "1.0.0",
        "docs": "/docs"
    }


@app.get("/api/health")
def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "Mind Space API"}
