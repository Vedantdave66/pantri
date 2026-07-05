import os
from datetime import datetime, timezone
from typing import Optional

from dotenv import load_dotenv
from fastapi import Depends, FastAPI, Header, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from jose import jwt, JWTError
from pydantic import BaseModel
from supabase import create_client, Client

load_dotenv()

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY")
JWT_SECRET = os.environ.get("JWT_SECRET")
CORS_ORIGINS = os.environ.get("CORS_ORIGINS", "*")

app = FastAPI(title="Pantri API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in CORS_ORIGINS.split(",")] if CORS_ORIGINS != "*" else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

_supabase_client: Optional[Client] = None


def get_supabase() -> Client:
    global _supabase_client
    if _supabase_client is None:
        if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
            raise HTTPException(status_code=500, detail="Supabase is not configured")
        _supabase_client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    return _supabase_client


def get_current_user_id(authorization: Optional[str] = Header(None)) -> str:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing bearer token")
    token = authorization.removeprefix("Bearer ").strip()
    if not JWT_SECRET:
        raise HTTPException(status_code=500, detail="JWT secret is not configured")
    try:
        payload = jwt.decode(
            token,
            JWT_SECRET,
            algorithms=["HS256"],
            options={"verify_aud": False},
        )
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")
    return user_id


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


# ---------- Schemas ----------

class LoginRequest(BaseModel):
    email: str
    password: str


class ItemCreate(BaseModel):
    name: str
    unit: str
    category: Optional[str] = None
    reorder_threshold: float = 1
    current_quantity: float = 0


class ItemUpdate(BaseModel):
    name: Optional[str] = None
    unit: Optional[str] = None
    category: Optional[str] = None
    reorder_threshold: Optional[float] = None


class CountRequest(BaseModel):
    new_quantity: float


# ---------- Auth ----------

@app.post("/api/auth/login")
def login(body: LoginRequest):
    supabase = get_supabase()
    try:
        result = supabase.auth.sign_in_with_password(
            {"email": body.email, "password": body.password}
        )
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    if not result or not result.session:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    return {
        "access_token": result.session.access_token,
        "user": {"id": result.user.id, "email": result.user.email},
    }


@app.post("/api/auth/logout")
def logout():
    return {"success": True}


# ---------- Items ----------

@app.get("/api/items")
def list_items(user_id: str = Depends(get_current_user_id)):
    supabase = get_supabase()
    res = (
        supabase.table("items")
        .select("*")
        .eq("user_id", user_id)
        .order("name")
        .execute()
    )
    return res.data


@app.post("/api/items", status_code=status.HTTP_201_CREATED)
def create_item(body: ItemCreate, user_id: str = Depends(get_current_user_id)):
    supabase = get_supabase()
    payload = body.model_dump()
    payload["user_id"] = user_id
    res = supabase.table("items").insert(payload).execute()
    if not res.data:
        raise HTTPException(status_code=500, detail="Failed to create item")
    return res.data[0]


@app.patch("/api/items/{item_id}")
def update_item(item_id: str, body: ItemUpdate, user_id: str = Depends(get_current_user_id)):
    supabase = get_supabase()
    payload = {k: v for k, v in body.model_dump().items() if v is not None}
    if not payload:
        raise HTTPException(status_code=400, detail="No fields to update")
    payload["updated_at"] = now_iso()
    res = (
        supabase.table("items")
        .update(payload)
        .eq("id", item_id)
        .eq("user_id", user_id)
        .execute()
    )
    if not res.data:
        raise HTTPException(status_code=404, detail="Item not found")
    return res.data[0]


@app.delete("/api/items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_item(item_id: str, user_id: str = Depends(get_current_user_id)):
    supabase = get_supabase()
    res = (
        supabase.table("items")
        .delete()
        .eq("id", item_id)
        .eq("user_id", user_id)
        .execute()
    )
    if not res.data:
        raise HTTPException(status_code=404, detail="Item not found")
    return None


@app.post("/api/items/{item_id}/count")
def count_item(item_id: str, body: CountRequest, user_id: str = Depends(get_current_user_id)):
    supabase = get_supabase()
    existing = (
        supabase.table("items")
        .select("*")
        .eq("id", item_id)
        .eq("user_id", user_id)
        .execute()
    )
    if not existing.data:
        raise HTTPException(status_code=404, detail="Item not found")
    previous_quantity = existing.data[0]["current_quantity"]

    updated = (
        supabase.table("items")
        .update({"current_quantity": body.new_quantity, "updated_at": now_iso()})
        .eq("id", item_id)
        .eq("user_id", user_id)
        .execute()
    )

    supabase.table("count_logs").insert(
        {
            "item_id": item_id,
            "user_id": user_id,
            "previous_quantity": previous_quantity,
            "new_quantity": body.new_quantity,
        }
    ).execute()

    return updated.data[0]


@app.get("/api/reorder")
def reorder_list(user_id: str = Depends(get_current_user_id)):
    supabase = get_supabase()
    res = (
        supabase.table("items")
        .select("*")
        .eq("user_id", user_id)
        .execute()
    )
    items = [item for item in res.data if item["current_quantity"] <= item["reorder_threshold"]]
    items.sort(key=lambda i: i["name"])
    return items
