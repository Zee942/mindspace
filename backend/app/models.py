from sqlalchemy import Column, String, Text, Integer, Float, DateTime, ForeignKey, Enum, JSON, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.database import Base


class NodeType(str, enum.Enum):
    TASK = "Task"
    SKILL = "Skill"
    GOAL = "Goal"
    LINK = "Link"


class TaskStatus(str, enum.Enum):
    TODO = "To Do"
    DONE = "Done"


class CardType(str, enum.Enum):
    DEBIT = "Debit"
    CREDIT = "Credit"


class Node(Base):
    __tablename__ = "nodes"
    
    id = Column(String, primary_key=True, index=True)
    title = Column(String, nullable=False)
    summary = Column(Text)
    type = Column(Enum(NodeType), nullable=False)
    url = Column(String, nullable=True)
    color = Column(String, nullable=True)
    x = Column(Float, nullable=True)
    y = Column(Float, nullable=True)
    progress = Column(Integer, nullable=True)
    completed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    outgoing_links = relationship("Link", foreign_keys="Link.source_id", back_populates="source_node", cascade="all, delete-orphan")
    incoming_links = relationship("Link", foreign_keys="Link.target_id", back_populates="target_node", cascade="all, delete-orphan")


class Link(Base):
    __tablename__ = "links"
    
    id = Column(String, primary_key=True, index=True)
    source_id = Column(String, ForeignKey("nodes.id", ondelete="CASCADE"), nullable=False)
    target_id = Column(String, ForeignKey("nodes.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    source_node = relationship("Node", foreign_keys=[source_id], back_populates="outgoing_links")
    target_node = relationship("Node", foreign_keys=[target_id], back_populates="incoming_links")


class Task(Base):
    __tablename__ = "tasks"
    
    id = Column(String, primary_key=True, index=True)
    content = Column(String, nullable=False)
    status = Column(Enum(TaskStatus), nullable=False, default=TaskStatus.TODO)
    skill_id = Column(String, ForeignKey("skills.id", ondelete="SET NULL"), nullable=True)
    goal_id = Column(String, ForeignKey("goals.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    subtasks = relationship("Subtask", back_populates="task", cascade="all, delete-orphan")
    skill = relationship("Skill", back_populates="tasks")
    goal = relationship("Goal", back_populates="tasks")


class Subtask(Base):
    __tablename__ = "subtasks"
    
    id = Column(String, primary_key=True, index=True)
    task_id = Column(String, ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False)
    content = Column(String, nullable=False)
    completed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    task = relationship("Task", back_populates="subtasks")


class Skill(Base):
    __tablename__ = "skills"
    
    id = Column(String, primary_key=True, index=True)
    title = Column(String, nullable=False)
    summary = Column(Text)
    progress = Column(Integer, default=0)
    color = Column(String)
    category = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    tasks = relationship("Task", back_populates="skill")


class Goal(Base):
    __tablename__ = "goals"
    
    id = Column(String, primary_key=True, index=True)
    title = Column(String, nullable=False)
    summary = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    tasks = relationship("Task", back_populates="goal")


class Card(Base):
    __tablename__ = "cards"
    
    id = Column(String, primary_key=True, index=True)
    nickname = Column(String, nullable=False)
    bank_name = Column(String, nullable=False)
    cardholder_name = Column(String, nullable=False)
    limit = Column(Float, nullable=False)
    card_type = Column(Enum(CardType), nullable=False)
    theme = Column(String, default="default")
    created_at = Column(DateTime, default=datetime.utcnow)


class Income(Base):
    __tablename__ = "income"
    
    id = Column(String, primary_key=True, index=True)
    source = Column(String, nullable=False)
    amount = Column(Float, nullable=False)
    tags = Column(JSON, default=list)
    date = Column(String, nullable=False)  # ISO date string
    created_at = Column(DateTime, default=datetime.utcnow)


class Expense(Base):
    __tablename__ = "expenses"
    
    id = Column(String, primary_key=True, index=True)
    source = Column(String, nullable=False)
    amount = Column(Float, nullable=False)
    tags = Column(JSON, default=list)
    date = Column(String, nullable=False)  # ISO date string
    created_at = Column(DateTime, default=datetime.utcnow)


class Investment(Base):
    __tablename__ = "investments"
    
    id = Column(String, primary_key=True, index=True)
    source = Column(String, nullable=False)
    amount = Column(Float, nullable=False)
    tags = Column(JSON, default=list)
    date = Column(String, nullable=False)  # ISO date string
    created_at = Column(DateTime, default=datetime.utcnow)


class JournalEntry(Base):
    __tablename__ = "journal_entries"
    
    id = Column(String, primary_key=True, index=True)
    title = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    photos = Column(JSON, default=list)
    voice_notes = Column(JSON, default=list)
    tags = Column(JSON, default=list)
    date = Column(String, nullable=False)  # ISO date string
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
