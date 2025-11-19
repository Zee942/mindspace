from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import List
from app import models, schemas
from app.database import get_db
import uuid

router = APIRouter(prefix="/api/income", tags=["income"])


@router.get("/", response_model=List[schemas.Income])
def get_income(db: Session = Depends(get_db)):
    """Get all income entries, sorted by date descending"""
    income = db.query(models.Income).order_by(models.Income.date.desc()).all()
    return income


@router.get("/{income_id}", response_model=schemas.Income)
def get_income_entry(income_id: str, db: Session = Depends(get_db)):
    """Get a single income entry by ID"""
    income = db.query(models.Income).filter(models.Income.id == income_id).first()
    if not income:
        raise HTTPException(status_code=404, detail="Income entry not found")
    return income


@router.post("/", response_model=schemas.Income, status_code=201)
def create_income(income: schemas.TransactionCreate, db: Session = Depends(get_db)):
    """Create a new income entry"""
    income_id = f"inc-{uuid.uuid4().hex[:12]}"
    try:
        db_income = models.Income(
            id=income_id,
            **income.model_dump()
        )
        db.add(db_income)
        db.commit()
        db.refresh(db_income)
        return db_income
    except IntegrityError as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Database integrity error: {str(e.orig)}")
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@router.delete("/{income_id}", status_code=204)
def delete_income(income_id: str, db: Session = Depends(get_db)):
    """Delete an income entry"""
    db_income = db.query(models.Income).filter(models.Income.id == income_id).first()
    if not db_income:
        raise HTTPException(status_code=404, detail="Income entry not found")
    
    try:
        db.delete(db_income)
        db.commit()
        return None
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
