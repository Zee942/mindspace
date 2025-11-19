from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import List
from app import models, schemas
from app.database import get_db
import uuid

router = APIRouter(prefix="/api/cards", tags=["cards"])


@router.get("/", response_model=List[schemas.Card])
def get_cards(db: Session = Depends(get_db)):
    """Get all cards"""
    cards = db.query(models.Card).all()
    return cards


@router.get("/{card_id}", response_model=schemas.Card)
def get_card(card_id: str, db: Session = Depends(get_db)):
    """Get a single card by ID"""
    card = db.query(models.Card).filter(models.Card.id == card_id).first()
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    return card


@router.post("/", response_model=schemas.Card, status_code=201)
def create_card(card: schemas.CardCreate, db: Session = Depends(get_db)):
    """Create a new card"""
    card_id = f"card-{uuid.uuid4().hex[:12]}"
    
    try:
        db_card = models.Card(
            id=card_id,
            **card.model_dump()
        )
        db.add(db_card)
        db.commit()
        db.refresh(db_card)
        return db_card
    except IntegrityError as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Database integrity error: {str(e.orig)}")
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@router.put("/{card_id}", response_model=schemas.Card)
def update_card(card_id: str, card_update: schemas.CardUpdate, db: Session = Depends(get_db)):
    """Update an existing card"""
    db_card = db.query(models.Card).filter(models.Card.id == card_id).first()
    if not db_card:
        raise HTTPException(status_code=404, detail="Card not found")
    
    update_data = card_update.model_dump(exclude_unset=True, by_alias=False)
    
    try:
        for key, value in update_data.items():
            setattr(db_card, key, value)
        
        db.commit()
        db.refresh(db_card)
        return db_card
    except IntegrityError as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Database integrity error: {str(e.orig)}")
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@router.delete("/{card_id}", status_code=204)
def delete_card(card_id: str, db: Session = Depends(get_db)):
    """Delete a card"""
    db_card = db.query(models.Card).filter(models.Card.id == card_id).first()
    if not db_card:
        raise HTTPException(status_code=404, detail="Card not found")
    
    try:
        db.delete(db_card)
        db.commit()
        return None
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
