from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models import JournalEntry as JournalEntryModel
from app.schemas import JournalEntry, JournalEntryCreate, JournalEntryUpdate
import uuid

router = APIRouter(prefix="/api/journal", tags=["journal"])


@router.get("/", response_model=List[JournalEntry])
def get_journal_entries(db: Session = Depends(get_db)):
    """Get all journal entries"""
    entries = db.query(JournalEntryModel).order_by(JournalEntryModel.created_at.desc()).all()
    return entries


@router.get("/{entry_id}", response_model=JournalEntry)
def get_journal_entry(entry_id: str, db: Session = Depends(get_db)):
    """Get a specific journal entry"""
    entry = db.query(JournalEntryModel).filter(JournalEntryModel.id == entry_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Journal entry not found")
    return entry


@router.post("/", response_model=JournalEntry, status_code=201)
def create_journal_entry(entry: JournalEntryCreate, db: Session = Depends(get_db)):
    """Create a new journal entry"""
    try:
        db_entry = JournalEntryModel(
            id=f"journal-{uuid.uuid4().hex[:12]}",
            **entry.model_dump()
        )
        db.add(db_entry)
        db.commit()
        db.refresh(db_entry)
        return db_entry
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{entry_id}", response_model=JournalEntry)
def update_journal_entry(entry_id: str, entry: JournalEntryUpdate, db: Session = Depends(get_db)):
    """Update a journal entry"""
    try:
        db_entry = db.query(JournalEntryModel).filter(JournalEntryModel.id == entry_id).first()
        if not db_entry:
            raise HTTPException(status_code=404, detail="Journal entry not found")
        
        update_data = entry.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_entry, key, value)
        
        db.commit()
        db.refresh(db_entry)
        return db_entry
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{entry_id}", status_code=204)
def delete_journal_entry(entry_id: str, db: Session = Depends(get_db)):
    """Delete a journal entry"""
    try:
        db_entry = db.query(JournalEntryModel).filter(JournalEntryModel.id == entry_id).first()
        if not db_entry:
            raise HTTPException(status_code=404, detail="Journal entry not found")
        
        db.delete(db_entry)
        db.commit()
        return None
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
