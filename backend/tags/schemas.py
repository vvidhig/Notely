from pydantic import BaseModel


class TagCreate(BaseModel):
    name: str
    color: str = "#6366f1"
    session_type: str = "custom"


class TagResponse(BaseModel):
    id: int
    name: str
    color: str
    session_type: str = "custom"
    is_default: bool = False

    model_config = {"from_attributes": True}
