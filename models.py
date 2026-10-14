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
    text: str = Field(..., max_length=2000, description="Raw notes from user, max 2000 characters")

class CompareRequest(SQLModel):
    experiment_id_a: int
    experiment_id_b: int

class CoffeeBean(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(description="Bean Name, e.g. Ethiopian Yirgacheffe")
    origin: Optional[str] = Field(default="Unknown", description="Country/Region of origin")
    roaster: Optional[str] = Field(default="Unknown", description="Roaster Name")
    roaster_level: Optional[str] = Field(default="Medium", description="Light, Medium, Dark")
    process: Optional[str] = Field(default="Washed", description="Washed, Honey, Natural, Anaerobic")
    flavor_notes: List[str] = Field(default_factory=list, sa_column=Column(JSON), description="Flavor Notes")
    stock_grams: float = Field(default=200.0, description="Remaining bean stock in grams")
    is_favorite: bool = Field(default=False)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CoffeeBeanCreate(SQLModel):
    name:str
    origin: Optional[str] = 'Unknown'
    roaster: Optional[str] = 'Unknown'
    roast_level: Optional[str] = 'Medium'
    process: Optional[str] = 'Washed'
    flavor_notes: List[str] = []
    stock_grams: float = 200.0

    
