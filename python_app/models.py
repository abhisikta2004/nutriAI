from typing import List, Optional, Union, Dict, Any
from pydantic import BaseModel, Field

class CustomIngredient(BaseModel):
    name: Optional[str] = None
    quantity: Optional[Union[float, int, str]] = None
    unit: Optional[str] = None

class DetailedLogInput(BaseModel):
    weight: Optional[Union[float, int, str]] = None
    pieces: Optional[Union[float, int, str]] = None
    servingSize: Optional[str] = None
    cookingMethod: Optional[str] = None
    customIngredients: Optional[List[CustomIngredient]] = Field(default_factory=list)

class UserProfileInput(BaseModel):
    dietPreference: Optional[str] = "non-veg"
    allergies: Optional[List[str]] = Field(default_factory=list)
    targetBodyType: Optional[str] = "athletic"
    currentBodyType: Optional[str] = None
    weight: Optional[Union[float, int, str]] = None
    height: Optional[Union[float, int, str]] = None
    age: Optional[Union[float, int, str]] = None
    hasCompletedOnboarding: Optional[bool] = None

class AnalyzeRequest(BaseModel):
    image: Optional[str] = None
    voiceQuery: Optional[str] = None
    identifyOnly: Optional[bool] = False
    detailedLog: Optional[DetailedLogInput] = None
    userProfile: Optional[UserProfileInput] = None

class NutritionInfo(BaseModel):
    calories: float
    protein: float
    carbs: float
    fat: float
    saturatedFat: Optional[float] = 0.0
    sugar: Optional[float] = 0.0
    fiber: Optional[float] = 0.0
    sodium: Optional[float] = 0.0
    vitamins: Optional[float] = 0.5
    processingLevel: Optional[float] = 0.5

class AlternativeReason(BaseModel):
    factor: str
    explanation: str
    actualChange: str
    status: str  # 'better' | 'worse' | 'same'

class Alternative(BaseModel):
    name: str
    healthScore: int
    benefits: List[str]
    reasons: List[AlternativeReason]
    nutrition: NutritionInfo
    isRegional: Optional[bool] = False

class IdentifiedFood(BaseModel):
    name: str
    confidence: float
    nutrition: NutritionInfo

class NutritionResponse(BaseModel):
    calories: int
    protein: float
    carbs: float
    fats: float
    saturatedFat: float
    sugar: float
    fiber: float
    sodium: int

class AnalyzeResponse(BaseModel):
    identifiedFood: str
    confidence: float
    healthScore: Optional[int] = None
    nutritionInfo: NutritionResponse
    totalCalories: Optional[int] = None
    totalProtein: Optional[float] = None
    totalCarbs: Optional[float] = None
    totalFat: Optional[float] = None
    totalFiber: Optional[float] = None
    totalSugar: Optional[float] = None
    totalSodium: Optional[int] = None
    servingInfo: Optional[str] = None
    hasDetailedLog: Optional[bool] = False
    alternatives: Optional[List[Alternative]] = Field(default_factory=list)
    alreadyOptimal: Optional[bool] = False
    bestChoice: Optional[Alternative] = None
    allergenWarning: Optional[List[str]] = None
    spokenResponse: Optional[str] = None
