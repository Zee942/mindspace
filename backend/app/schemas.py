from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import datetime
from enum import Enum


class NodeType(str, Enum):
    TASK = "Task"
    SKILL = "Skill"
    GOAL = "Goal"
    LINK = "Link"


class TaskStatus(str, Enum):
    TODO = "To Do"
    DONE = "Done"


class CardType(str, Enum):
    DEBIT = "Debit"
    CREDIT = "Credit"


# Node Schemas
class NodeBase(BaseModel):
    title: str
    summary: Optional[str] = None
    type: NodeType
    url: Optional[str] = None
    color: Optional[str] = None
    x: Optional[float] = None
    y: Optional[float] = None
    progress: Optional[int] = None
    completed: Optional[bool] = False


class NodeCreate(NodeBase):
    pass


class NodeUpdate(BaseModel):
    title: Optional[str] = None
    summary: Optional[str] = None
    type: Optional[NodeType] = None
    url: Optional[str] = None
    color: Optional[str] = None
    x: Optional[float] = None
    y: Optional[float] = None
    progress: Optional[int] = None
    completed: Optional[bool] = None


class Node(NodeBase):
    id: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# Link Schemas
class LinkBase(BaseModel):
    source: str
    target: str


class LinkCreate(LinkBase):
    pass


class Link(LinkBase):
    id: str
    source_id: str
    target_id: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# Subtask Schemas
class SubtaskBase(BaseModel):
    content: str
    completed: bool = False


class SubtaskCreate(SubtaskBase):
    pass


class SubtaskUpdate(BaseModel):
    content: Optional[str] = None
    completed: Optional[bool] = None


class Subtask(SubtaskBase):
    id: str
    task_id: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# Task Schemas
class TaskBase(BaseModel):
    content: str
    status: TaskStatus = TaskStatus.TODO
    skill_id: Optional[str] = Field(None, alias="skillId", serialization_alias="skillId")
    goal_id: Optional[str] = Field(None, alias="goalId", serialization_alias="goalId")


class TaskCreate(TaskBase):
    model_config = ConfigDict(populate_by_name=True)


class SubtaskInput(BaseModel):
    id: str
    content: str
    completed: bool = False


class TaskUpdate(BaseModel):
    content: Optional[str] = None
    status: Optional[TaskStatus] = None
    skill_id: Optional[str] = Field(None, alias="skillId", serialization_alias="skillId")
    goal_id: Optional[str] = Field(None, alias="goalId", serialization_alias="goalId")
    subtasks: Optional[List[SubtaskInput]] = None
    
    model_config = ConfigDict(populate_by_name=True)


class Task(TaskBase):
    id: str
    subtasks: Optional[List[Subtask]] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True,
        use_enum_values=True
    )


# Skill Schemas
class SkillBase(BaseModel):
    title: str
    summary: Optional[str] = None
    progress: int = 0
    color: Optional[str] = None
    category: Optional[str] = None


class SkillCreate(SkillBase):
    pass


class SkillUpdate(BaseModel):
    title: Optional[str] = None
    summary: Optional[str] = None
    progress: Optional[int] = None
    color: Optional[str] = None
    category: Optional[str] = None


class Skill(SkillBase):
    id: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# Goal Schemas
class GoalBase(BaseModel):
    title: str
    summary: Optional[str] = None


class GoalCreate(GoalBase):
    pass


class GoalUpdate(BaseModel):
    title: Optional[str] = None
    summary: Optional[str] = None


class Goal(GoalBase):
    id: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# Card Schemas
class CardBase(BaseModel):
    nickname: str
    bank_name: str = Field(..., alias="bankName", serialization_alias="bankName")
    cardholder_name: str = Field(..., alias="cardholderName", serialization_alias="cardholderName")
    limit: float
    card_type: CardType = Field(..., alias="cardType", serialization_alias="cardType")
    theme: str = "default"


class CardCreate(CardBase):
    model_config = ConfigDict(populate_by_name=True)


class CardUpdate(BaseModel):
    nickname: Optional[str] = None
    bank_name: Optional[str] = Field(None, alias="bankName", serialization_alias="bankName")
    cardholder_name: Optional[str] = Field(None, alias="cardholderName", serialization_alias="cardholderName")
    limit: Optional[float] = None
    card_type: Optional[CardType] = Field(None, alias="cardType", serialization_alias="cardType")
    theme: Optional[str] = None

    model_config = ConfigDict(populate_by_name=True)


class Card(CardBase):
    id: str
    created_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True
    )


# Transaction Schemas (Income, Expense, Investment)
class TransactionBase(BaseModel):
    source: str
    amount: float
    tags: List[str] = Field(default_factory=list)
    date: str  # ISO date string


class TransactionCreate(TransactionBase):
    pass


class Transaction(TransactionBase):
    id: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class Income(Transaction):
    pass


class Expense(Transaction):
    pass


class Investment(Transaction):
    pass


# Journal Entry Schemas
class JournalEntryBase(BaseModel):
    title: str
    content: str
    photos: List[str] = Field(default_factory=list)
    voice_notes: List[str] = Field(default_factory=list, alias="voiceNotes", serialization_alias="voiceNotes")
    tags: List[str] = Field(default_factory=list)
    date: str


class JournalEntryCreate(JournalEntryBase):
    model_config = ConfigDict(populate_by_name=True)


class JournalEntryUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    photos: Optional[List[str]] = None
    voice_notes: Optional[List[str]] = Field(None, alias="voiceNotes", serialization_alias="voiceNotes")
    tags: Optional[List[str]] = None


class JournalEntry(JournalEntryBase):
    id: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True
    )
