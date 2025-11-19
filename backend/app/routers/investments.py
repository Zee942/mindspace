from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import List
from app import models, schemas
from app.database import get_db
import uuid

router = APIRouter(prefix="/api/investments", tags=["investments"])


@router.get("/", response_model=List[schemas.Investment])
def get_investments(db: Session = Depends(get_db)):
    """Get all investment entries, sorted by date descending"""
    investments = db.query(models.Investment).order_by(models.Investment.date.desc()).all()
    return investments


@router.get("/{investment_id}", response_model=schemas.Investment)
def get_investment(investment_id: str, db: Session = Depends(get_db)):
    """Get a single investment entry by ID"""
    investment = db.query(models.Investment).filter(models.Investment.id == investment_id).first()
    if not investment:
        raise HTTPException(status_code=404, detail="Investment entry not found")
    return investment


@router.post("/", response_model=schemas.Investment, status_code=201)
def create_investment(investment: schemas.TransactionCreate, db: Session = Depends(get_db)):
    """Create a new investment entry"""
    investment_id = f"inv-{uuid.uuid4().hex[:12]}"
    try:
        db_investment = models.Investment(
            id=investment_id,
            **investment.model_dump()
        )
        db.add(db_investment)
        db.commit()
        db.refresh(db_investment)
        return db_investment
    except IntegrityError as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Database integrity error: {str(e.orig)}")
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@router.delete("/{investment_id}", status_code=204)
def delete_investment(investment_id: str, db: Session = Depends(get_db)):
    """Delete an investment entry"""
    db_investment = db.query(models.Investment).filter(models.Investment.id == investment_id).first()
    if not db_investment:
        raise HTTPException(status_code=404, detail="Investment entry not found")
    
    try:
        db.delete(db_investment)
        db.commit()
        return None
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
