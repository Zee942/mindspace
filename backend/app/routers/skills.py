from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import List
from app import models, schemas
from app.database import get_db
import uuid

router = APIRouter(prefix="/api/skills", tags=["skills"])


@router.get("/", response_model=List[schemas.Skill])
def get_skills(db: Session = Depends(get_db)):
    """Get all skills"""
    skills = db.query(models.Skill).all()
    return skills


@router.get("/{skill_id}", response_model=schemas.Skill)
def get_skill(skill_id: str, db: Session = Depends(get_db)):
    """Get a single skill by ID"""
    skill = db.query(models.Skill).filter(models.Skill.id == skill_id).first()
    if not skill:
        raise HTTPException(status_code=404, detail="Skill not found")
    return skill


@router.post("/", response_model=schemas.Skill, status_code=201)
def create_skill(skill: schemas.SkillCreate, db: Session = Depends(get_db)):
    """Create a new skill"""
    skill_id = f"skill-{uuid.uuid4().hex[:12]}"
    try:
        db_skill = models.Skill(
            id=skill_id,
            **skill.model_dump()
        )
        db.add(db_skill)
        db.commit()
        db.refresh(db_skill)
        return db_skill
    except IntegrityError as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Database integrity error: {str(e.orig)}")
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@router.put("/{skill_id}", response_model=schemas.Skill)
def update_skill(skill_id: str, skill_update: schemas.SkillUpdate, db: Session = Depends(get_db)):
    """Update an existing skill"""
    db_skill = db.query(models.Skill).filter(models.Skill.id == skill_id).first()
    if not db_skill:
        raise HTTPException(status_code=404, detail="Skill not found")
    
    update_data = skill_update.model_dump(exclude_unset=True)
    try:
        for key, value in update_data.items():
            setattr(db_skill, key, value)
        
        db.commit()
        db.refresh(db_skill)
        return db_skill
    except IntegrityError as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Database integrity error: {str(e.orig)}")
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@router.delete("/{skill_id}", status_code=204)
def delete_skill(skill_id: str, db: Session = Depends(get_db)):
    """Delete a skill and unlink associated tasks"""
    db_skill = db.query(models.Skill).filter(models.Skill.id == skill_id).first()
    if not db_skill:
        raise HTTPException(status_code=404, detail="Skill not found")
    
    try:
        # Unlink tasks before deleting
        db.query(models.Task).filter(models.Task.skill_id == skill_id).update({"skill_id": None})
        
        db.delete(db_skill)
        db.commit()
        return None
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
