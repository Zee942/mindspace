from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import List
from app import models, schemas
from app.database import get_db
import uuid

router = APIRouter(prefix="/api/goals", tags=["goals"])


@router.get("/", response_model=List[schemas.Goal])
def get_goals(db: Session = Depends(get_db)):
    """Get all goals"""
    goals = db.query(models.Goal).all()
    return goals


@router.get("/{goal_id}", response_model=schemas.Goal)
def get_goal(goal_id: str, db: Session = Depends(get_db)):
    """Get a single goal by ID"""
    goal = db.query(models.Goal).filter(models.Goal.id == goal_id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    return goal


@router.get("/{goal_id}/tasks", response_model=List[schemas.Task])
def get_goal_tasks(goal_id: str, db: Session = Depends(get_db)):
    """Get all tasks linked to a goal"""
    tasks = db.query(models.Task).filter(models.Task.goal_id == goal_id).all()
    return tasks


@router.post("/", response_model=schemas.Goal, status_code=201)
def create_goal(goal: schemas.GoalCreate, db: Session = Depends(get_db)):
    """Create a new goal"""
    goal_id = f"goal-{uuid.uuid4().hex[:12]}"
    try:
        db_goal = models.Goal(
            id=goal_id,
            **goal.model_dump()
        )
        db.add(db_goal)
        db.commit()
        db.refresh(db_goal)
        return db_goal
    except IntegrityError as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Database integrity error: {str(e.orig)}")
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@router.put("/{goal_id}", response_model=schemas.Goal)
def update_goal(goal_id: str, goal_update: schemas.GoalUpdate, db: Session = Depends(get_db)):
    """Update an existing goal"""
    db_goal = db.query(models.Goal).filter(models.Goal.id == goal_id).first()
    if not db_goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    
    update_data = goal_update.model_dump(exclude_unset=True)
    try:
        for key, value in update_data.items():
            setattr(db_goal, key, value)
        
        db.commit()
        db.refresh(db_goal)
        return db_goal
    except IntegrityError as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Database integrity error: {str(e.orig)}")
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@router.delete("/{goal_id}", status_code=204)
def delete_goal(goal_id: str, db: Session = Depends(get_db)):
    """Delete a goal and unlink associated tasks"""
    db_goal = db.query(models.Goal).filter(models.Goal.id == goal_id).first()
    if not db_goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    
    try:
        # Unlink tasks before deleting
        db.query(models.Task).filter(models.Task.goal_id == goal_id).update({"goal_id": None})
        
        db.delete(db_goal)
        db.commit()
        return None
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
