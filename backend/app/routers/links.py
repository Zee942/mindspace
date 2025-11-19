from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import List
from app import models, schemas
from app.database import get_db
import uuid

router = APIRouter(prefix="/api/links", tags=["links"])


@router.get("/", response_model=List[schemas.Link])
def get_links(db: Session = Depends(get_db)):
    """Get all links"""
    links = db.query(models.Link).all()
    return [
        {
            "id": link.id,
            "source": link.source_id,
            "target": link.target_id,
            "source_id": link.source_id,
            "target_id": link.target_id,
            "created_at": link.created_at
        }
        for link in links
    ]


@router.get("/node/{node_id}", response_model=List[schemas.Link])
def get_node_links(node_id: str, db: Session = Depends(get_db)):
    """Get all links for a specific node"""
    links = db.query(models.Link).filter(
        (models.Link.source_id == node_id) | (models.Link.target_id == node_id)
    ).all()
    return [
        {
            "id": link.id,
            "source": link.source_id,
            "target": link.target_id,
            "source_id": link.source_id,
            "target_id": link.target_id,
            "created_at": link.created_at
        }
        for link in links
    ]


@router.post("/", response_model=schemas.Link, status_code=201)
def create_link(link: schemas.LinkCreate, db: Session = Depends(get_db)):
    """Create a new link between two nodes"""
    # Verify both nodes exist
    source_node = db.query(models.Node).filter(models.Node.id == link.source).first()
    target_node = db.query(models.Node).filter(models.Node.id == link.target).first()
    
    if not source_node or not target_node:
        raise HTTPException(status_code=404, detail="One or both nodes not found")
    
    # Check if link already exists
    existing_link = db.query(models.Link).filter(
        ((models.Link.source_id == link.source) & (models.Link.target_id == link.target)) |
        ((models.Link.source_id == link.target) & (models.Link.target_id == link.source))
    ).first()
    
    if existing_link:
        raise HTTPException(status_code=400, detail="Link already exists")
    
    link_id = f"link-{uuid.uuid4().hex[:12]}"
    try:
        db_link = models.Link(
            id=link_id,
            source_id=link.source,
            target_id=link.target
        )
        db.add(db_link)
        db.commit()
        db.refresh(db_link)
        
        return {
            "id": db_link.id,
            "source": db_link.source_id,
            "target": db_link.target_id,
            "source_id": db_link.source_id,
            "target_id": db_link.target_id,
            "created_at": db_link.created_at
        }
    except IntegrityError as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Database integrity error: {str(e.orig)}")
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@router.delete("/{link_id}", status_code=204)
def delete_link(link_id: str, db: Session = Depends(get_db)):
    """Delete a link"""
    db_link = db.query(models.Link).filter(models.Link.id == link_id).first()
    if not db_link:
        raise HTTPException(status_code=404, detail="Link not found")
    
    try:
        db.delete(db_link)
        db.commit()
        return None
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
