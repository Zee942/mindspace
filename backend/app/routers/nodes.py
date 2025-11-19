from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import List
from app import models, schemas
from app.database import get_db
import uuid

router = APIRouter(prefix="/api/nodes", tags=["nodes"])


@router.get("/", response_model=List[schemas.Node])
def get_nodes(db: Session = Depends(get_db)):
    """Get all nodes"""
    nodes = db.query(models.Node).all()
    return nodes


@router.get("/{node_id}", response_model=schemas.Node)
def get_node(node_id: str, db: Session = Depends(get_db)):
    """Get a single node by ID"""
    node = db.query(models.Node).filter(models.Node.id == node_id).first()
    if not node:
        raise HTTPException(status_code=404, detail="Node not found")
    return node


@router.post("/", response_model=schemas.Node, status_code=201)
def create_node(node: schemas.NodeCreate, db: Session = Depends(get_db)):
    """Create a new node"""
    node_id = f"node-{uuid.uuid4().hex[:12]}"
    try:
        db_node = models.Node(
            id=node_id,
            **node.model_dump()
        )
        db.add(db_node)
        db.commit()
        db.refresh(db_node)
        return db_node
    except IntegrityError as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Database integrity error: {str(e.orig)}")
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@router.put("/{node_id}", response_model=schemas.Node)
def update_node(node_id: str, node_update: schemas.NodeUpdate, db: Session = Depends(get_db)):
    """Update an existing node"""
    db_node = db.query(models.Node).filter(models.Node.id == node_id).first()
    if not db_node:
        raise HTTPException(status_code=404, detail="Node not found")
    
    update_data = node_update.model_dump(exclude_unset=True)
    try:
        for key, value in update_data.items():
            setattr(db_node, key, value)
        
        db.commit()
        db.refresh(db_node)
        return db_node
    except IntegrityError as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Database integrity error: {str(e.orig)}")
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@router.delete("/{node_id}", status_code=204)
def delete_node(node_id: str, db: Session = Depends(get_db)):
    """Delete a node and its associated links"""
    db_node = db.query(models.Node).filter(models.Node.id == node_id).first()
    if not db_node:
        raise HTTPException(status_code=404, detail="Node not found")
    
    try:
        db.delete(db_node)
        db.commit()
        return None
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
