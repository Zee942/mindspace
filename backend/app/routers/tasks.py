from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import List
from app import models, schemas
from app.database import get_db
import uuid

router = APIRouter(prefix="/api/tasks", tags=["tasks"])


@router.get("/", response_model=List[schemas.Task])
def get_tasks(db: Session = Depends(get_db)):
    """Get all tasks with subtasks"""
    tasks = db.query(models.Task).all()
    return tasks


@router.get("/{task_id}", response_model=schemas.Task)
def get_task(task_id: str, db: Session = Depends(get_db)):
    """Get a single task by ID"""
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task


@router.post("/", response_model=schemas.Task, status_code=201)
def create_task(task: schemas.TaskCreate, db: Session = Depends(get_db)):
    """Create a new task"""
    task_id = f"task-{uuid.uuid4().hex[:12]}"
    
    try:
        db_task = models.Task(
            id=task_id,
            **task.model_dump()
        )
        db.add(db_task)
        db.commit()
        db.refresh(db_task)
        return db_task
    except IntegrityError as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Database integrity error: {str(e.orig)}")
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@router.put("/{task_id}", response_model=schemas.Task)
def update_task(task_id: str, task_update: schemas.TaskUpdate, db: Session = Depends(get_db)):
    """Update an existing task"""
    db_task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    update_data = task_update.model_dump(exclude_unset=True)
    
    try:
        for key, value in update_data.items():
            setattr(db_task, key, value)
        
        db.commit()
        db.refresh(db_task)
        return db_task
    except IntegrityError as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Database integrity error: {str(e.orig)}")
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@router.delete("/{task_id}", status_code=204)
def delete_task(task_id: str, db: Session = Depends(get_db)):
    """Delete a task and its subtasks"""
    db_task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    try:
        db.delete(db_task)
        db.commit()
        return None
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


# Subtask endpoints
@router.post("/{task_id}/subtasks", response_model=schemas.Subtask, status_code=201)
def create_subtask(task_id: str, subtask: schemas.SubtaskCreate, db: Session = Depends(get_db)):
    """Add a subtask to a task"""
    db_task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    subtask_id = f"subtask-{uuid.uuid4().hex[:12]}"
    try:
        db_subtask = models.Subtask(
            id=subtask_id,
            task_id=task_id,
            **subtask.model_dump()
        )
        db.add(db_subtask)
        db.commit()
        db.refresh(db_subtask)
        return db_subtask
    except IntegrityError as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Database integrity error: {str(e.orig)}")
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@router.put("/{task_id}/subtasks/{subtask_id}", response_model=schemas.Subtask)
def update_subtask(task_id: str, subtask_id: str, subtask_update: schemas.SubtaskUpdate, db: Session = Depends(get_db)):
    """Update a subtask"""
    db_subtask = db.query(models.Subtask).filter(
        models.Subtask.id == subtask_id,
        models.Subtask.task_id == task_id
    ).first()
    
    if not db_subtask:
        raise HTTPException(status_code=404, detail="Subtask not found")
    
    update_data = subtask_update.model_dump(exclude_unset=True)
    try:
        for key, value in update_data.items():
            setattr(db_subtask, key, value)
        
        db.commit()
        db.refresh(db_subtask)
        return db_subtask
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@router.delete("/{task_id}/subtasks/{subtask_id}", status_code=204)
def delete_subtask(task_id: str, subtask_id: str, db: Session = Depends(get_db)):
    """Delete a subtask"""
    db_subtask = db.query(models.Subtask).filter(
        models.Subtask.id == subtask_id,
        models.Subtask.task_id == task_id
    ).first()
    
    if not db_subtask:
        raise HTTPException(status_code=404, detail="Subtask not found")
    
    try:
        db.delete(db_subtask)
        db.commit()
        return None
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
