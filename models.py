from datetime import datetime, timezone
from typing import Optional, List
from sqlmodel import SQLModel, Field, JSON, Column

class BrewExperimentBase(SQLModel):
    raw_notes: str = Field(description="Raw notes from users")
    bean_name: Optional[str] = Field(description="Bean Name", default="Unknown Bean")
    roast_level: Optional[str] = Field(description="Roast Level", default="Medium")
    method: Optional[str] = Field(description="Brew Method", default="V60")
    dose_grams: Optional[float] = Field(description="Dose (grams)", default=None)
    water_grams: Optional[float] = Field(description="Water (grams)", default=None)
    ratio: Optional[str] = Field(description="Brew ratio, e.g: 1:15", default=None)
    water_temp_c: Optional[float] = Field(description="Water temperature in Celsius", default=None)
    grind_size: Optional[str] = Field(description="Grind size", default=None)
    brew_time_seconds: Optional[int] = Field(description="Brew time in seconds", default=None)
    sensory_notes: List[str] = Field(default_factory=list, sa_column=Column(JSON), description="Taste Notes")
    rating: Optional[int] = Field(description="Rating out of 10", default=None)

class BrewExperiment(BrewExperimentBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class RawBrewInput(SQLModel):
    text: str = Field(..., description="Raw notes from users")

class CompareRequest(SQLModel):
    expreiment_id_a: int
    expreiment_id_b: int
    
