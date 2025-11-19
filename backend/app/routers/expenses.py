from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import List
from app import models, schemas
from app.database import get_db
import uuid

router = APIRouter(prefix="/api/expenses", tags=["expenses"])


@router.get("/", response_model=List[schemas.Expense])
def get_expenses(db: Session = Depends(get_db)):
    """Get all expense entries, sorted by date descending"""
    expenses = db.query(models.Expense).order_by(models.Expense.date.desc()).all()
    return expenses


@router.get("/{expense_id}", response_model=schemas.Expense)
def get_expense(expense_id: str, db: Session = Depends(get_db)):
    """Get a single expense entry by ID"""
    expense = db.query(models.Expense).filter(models.Expense.id == expense_id).first()
    if not expense:
        raise HTTPException(status_code=404, detail="Expense entry not found")
    return expense


@router.post("/", response_model=schemas.Expense, status_code=201)
def create_expense(expense: schemas.TransactionCreate, db: Session = Depends(get_db)):
    """Create a new expense entry"""
    expense_id = f"exp-{uuid.uuid4().hex[:12]}"
    try:
        db_expense = models.Expense(
            id=expense_id,
            **expense.model_dump()
        )
        db.add(db_expense)
        db.commit()
        db.refresh(db_expense)
        return db_expense
    except IntegrityError as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Database integrity error: {str(e.orig)}")
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@router.delete("/{expense_id}", status_code=204)
def delete_expense(expense_id: str, db: Session = Depends(get_db)):
    """Delete an expense entry"""
    db_expense = db.query(models.Expense).filter(models.Expense.id == expense_id).first()
    if not db_expense:
        raise HTTPException(status_code=404, detail="Expense entry not found")
    
    try:
        db.delete(db_expense)
        db.commit()
        return None
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
