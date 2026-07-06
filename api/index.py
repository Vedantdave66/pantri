import os
import uuid
from datetime import datetime, timezone
from typing import List, Optional

from dotenv import load_dotenv
from fastapi import Depends, FastAPI, Header, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from supabase import create_client, Client

load_dotenv()

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY")
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


def make_auth_client() -> Client:
    # sign_in_with_password mutates the client's auth state, which would
    # rebind the shared service-role client to the signed-in user's RLS on
    # warm serverless instances. Sign-ins get a throwaway client instead.
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        raise HTTPException(status_code=500, detail="Supabase is not configured")
    return create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)


def _employee_password(pin: str, user_id: str) -> str:
    # Employees sign in with a PIN, but Supabase Auth requires an
    # email/password account. The password is derived from the PIN and
    # user id so a PIN change (delete + recreate) invalidates the old one.
    return f"pantri-pin:{pin}:{user_id}"


def get_current_profile(authorization: Optional[str] = Header(None)) -> dict:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing bearer token")
    token = authorization.removeprefix("Bearer ").strip()

    supabase = get_supabase()
    try:
        result = supabase.auth.get_user(token)
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")
    if not result or not result.user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")

    res = supabase.table("profiles").select("*").eq("id", result.user.id).execute()
    if not res.data:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No profile for this account")
    return res.data[0]


def require_owner(profile: dict = Depends(get_current_profile)) -> dict:
    if profile["role"] != "owner":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Owner access required")
    return profile


def get_owner_id(supabase: Client) -> str:
    # Single-restaurant MVP: items belong to the sole owner profile.
    res = supabase.table("profiles").select("id").eq("role", "owner").limit(1).execute()
    if not res.data:
        raise HTTPException(status_code=500, detail="No owner profile configured")
    return res.data[0]["id"]


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def today_start_iso() -> str:
    now = datetime.now(timezone.utc)
    return now.replace(hour=0, minute=0, second=0, microsecond=0).isoformat()


# ---------- Schemas ----------

class LoginRequest(BaseModel):
    email: str
    password: str


class PinLoginRequest(BaseModel):
    pin: str


class CreateEmployeeRequest(BaseModel):
    full_name: str
    pin: str


class ItemCreate(BaseModel):
    name: str
    unit: str
    category: Optional[str] = None
    reorder_threshold: float = 1
    current_quantity: float = 0
    expected_quantity: Optional[float] = None


class ItemUpdate(BaseModel):
    name: Optional[str] = None
    unit: Optional[str] = None
    category: Optional[str] = None
    reorder_threshold: Optional[float] = None
    expected_quantity: Optional[float] = None


class CountRequest(BaseModel):
    new_quantity: float


class CountEntry(BaseModel):
    item_id: str
    new_quantity: float


class CountSubmission(BaseModel):
    counts: List[CountEntry]
    notes: Optional[str] = None


# ---------- Auth ----------

@app.post("/api/auth/login")
def login(body: LoginRequest):
    supabase = get_supabase()
    try:
        result = make_auth_client().auth.sign_in_with_password(
            {"email": body.email, "password": body.password}
        )
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
    if not result or not result.session:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    prof = supabase.table("profiles").select("*").eq("id", result.user.id).execute()
    profile = prof.data[0] if prof.data else {"role": "owner", "full_name": None}

    return {
        "access_token": result.session.access_token,
        "user": {
            "id": result.user.id,
            "email": result.user.email,
            "role": profile["role"],
            "full_name": profile.get("full_name"),
        },
    }


@app.post("/api/auth/pin-login")
def pin_login(body: PinLoginRequest):
    pin = body.pin.strip()
    if not pin.isdigit() or len(pin) != 4:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid PIN")

    supabase = get_supabase()
    res = (
        supabase.table("profiles")
        .select("*")
        .eq("pin", pin)
        .eq("role", "employee")
        .execute()
    )
    if not res.data:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid PIN")
    profile = res.data[0]

    try:
        auth_user = supabase.auth.admin.get_user_by_id(profile["id"])
        result = make_auth_client().auth.sign_in_with_password(
            {
                "email": auth_user.user.email,
                "password": _employee_password(pin, profile["id"]),
            }
        )
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid PIN")
    if not result or not result.session:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid PIN")

    return {
        "access_token": result.session.access_token,
        "user": {
            "id": profile["id"],
            "role": "employee",
            "full_name": profile.get("full_name"),
        },
    }


@app.post("/api/auth/logout")
def logout():
    return {"success": True}


@app.get("/api/me")
def me(profile: dict = Depends(get_current_profile)):
    return {
        "id": profile["id"],
        "role": profile["role"],
        "full_name": profile.get("full_name"),
    }


# ---------- Employees (owner only) ----------

@app.post("/api/auth/create-employee", status_code=status.HTTP_201_CREATED)
def create_employee(body: CreateEmployeeRequest, owner: dict = Depends(require_owner)):
    pin = body.pin.strip()
    name = body.full_name.strip()
    if not name:
        raise HTTPException(status_code=400, detail="Name is required")
    if not pin.isdigit() or len(pin) != 4:
        raise HTTPException(status_code=400, detail="PIN must be exactly 4 digits")

    supabase = get_supabase()
    existing = supabase.table("profiles").select("id").eq("pin", pin).execute()
    if existing.data:
        raise HTTPException(status_code=409, detail="That PIN is already in use — pick another")

    email = f"emp-{uuid.uuid4().hex}@pantri.local"
    try:
        created = supabase.auth.admin.create_user(
            {"email": email, "password": uuid.uuid4().hex, "email_confirm": True}
        )
        user_id = created.user.id
        supabase.auth.admin.update_user_by_id(
            user_id, {"password": _employee_password(pin, user_id)}
        )
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to create employee account")

    res = (
        supabase.table("profiles")
        .insert({"id": user_id, "full_name": name, "role": "employee", "pin": pin})
        .execute()
    )
    if not res.data:
        raise HTTPException(status_code=500, detail="Failed to create employee profile")
    profile = res.data[0]
    return {"id": profile["id"], "full_name": profile["full_name"], "role": "employee"}


@app.get("/api/employees")
def list_employees(owner: dict = Depends(require_owner)):
    supabase = get_supabase()
    res = (
        supabase.table("profiles")
        .select("id, full_name, role, created_at")
        .eq("role", "employee")
        .order("created_at")
        .execute()
    )
    employees = res.data

    logs = (
        supabase.table("count_logs")
        .select("employee_id, counted_at")
        .order("counted_at", desc=True)
        .limit(500)
        .execute()
    )
    last_active = {}
    for log in logs.data:
        emp = log.get("employee_id")
        if emp and emp not in last_active:
            last_active[emp] = log["counted_at"]

    for emp in employees:
        emp["last_active"] = last_active.get(emp["id"])
    return employees


@app.delete("/api/employees/{employee_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_employee(employee_id: str, owner: dict = Depends(require_owner)):
    supabase = get_supabase()
    res = (
        supabase.table("profiles")
        .select("id, role")
        .eq("id", employee_id)
        .eq("role", "employee")
        .execute()
    )
    if not res.data:
        raise HTTPException(status_code=404, detail="Employee not found")
    try:
        # Cascades to the profile row; count_logs keep employee_name.
        supabase.auth.admin.delete_user(employee_id)
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to delete employee")
    return None


# ---------- Items ----------

@app.get("/api/items")
def list_items(profile: dict = Depends(get_current_profile)):
    supabase = get_supabase()
    owner_id = get_owner_id(supabase)
    res = (
        supabase.table("items")
        .select("*")
        .eq("user_id", owner_id)
        .order("name")
        .execute()
    )
    if profile["role"] == "employee":
        # Employees count stock blind — don't leak current levels.
        hidden = {"current_quantity", "expected_quantity", "reorder_threshold"}
        return [{k: v for k, v in item.items() if k not in hidden} for item in res.data]
    return res.data


@app.post("/api/items", status_code=status.HTTP_201_CREATED)
def create_item(body: ItemCreate, owner: dict = Depends(require_owner)):
    supabase = get_supabase()
    payload = body.model_dump()
    payload["user_id"] = get_owner_id(supabase)
    res = supabase.table("items").insert(payload).execute()
    if not res.data:
        raise HTTPException(status_code=500, detail="Failed to create item")
    return res.data[0]


@app.patch("/api/items/{item_id}")
def update_item(item_id: str, body: ItemUpdate, owner: dict = Depends(require_owner)):
    supabase = get_supabase()
    payload = {k: v for k, v in body.model_dump().items() if v is not None}
    if not payload:
        raise HTTPException(status_code=400, detail="No fields to update")
    payload["updated_at"] = now_iso()
    res = (
        supabase.table("items")
        .update(payload)
        .eq("id", item_id)
        .eq("user_id", get_owner_id(supabase))
        .execute()
    )
    if not res.data:
        raise HTTPException(status_code=404, detail="Item not found")
    return res.data[0]


@app.delete("/api/items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_item(item_id: str, owner: dict = Depends(require_owner)):
    supabase = get_supabase()
    res = (
        supabase.table("items")
        .delete()
        .eq("id", item_id)
        .eq("user_id", get_owner_id(supabase))
        .execute()
    )
    if not res.data:
        raise HTTPException(status_code=404, detail="Item not found")
    return None


# ---------- Counts ----------

def _has_submitted_today(supabase: Client, employee_id: str) -> bool:
    res = (
        supabase.table("count_logs")
        .select("id")
        .eq("employee_id", employee_id)
        .gte("counted_at", today_start_iso())
        .limit(1)
        .execute()
    )
    return bool(res.data)


@app.get("/api/counts/mine/today")
def my_count_today(profile: dict = Depends(get_current_profile)):
    supabase = get_supabase()
    return {"submitted": _has_submitted_today(supabase, profile["id"])}


@app.post("/api/counts/submit")
def submit_counts(body: CountSubmission, profile: dict = Depends(get_current_profile)):
    if not body.counts:
        raise HTTPException(status_code=400, detail="No counts to submit")

    supabase = get_supabase()
    owner_id = get_owner_id(supabase)

    if profile["role"] == "employee" and _has_submitted_today(supabase, profile["id"]):
        raise HTTPException(status_code=409, detail="Already submitted today")

    items_res = supabase.table("items").select("id, current_quantity").eq("user_id", owner_id).execute()
    known = {item["id"]: item["current_quantity"] for item in items_res.data}

    logs = []
    for entry in body.counts:
        if entry.item_id not in known:
            raise HTTPException(status_code=404, detail=f"Item not found: {entry.item_id}")

    for entry in body.counts:
        supabase.table("items").update(
            {"current_quantity": entry.new_quantity, "updated_at": now_iso()}
        ).eq("id", entry.item_id).eq("user_id", owner_id).execute()
        logs.append(
            {
                "item_id": entry.item_id,
                "user_id": owner_id,
                "previous_quantity": known[entry.item_id],
                "new_quantity": entry.new_quantity,
                "employee_id": profile["id"],
                "employee_name": profile.get("full_name"),
                "notes": body.notes,
            }
        )

    supabase.table("count_logs").insert(logs).execute()
    return {"submitted": len(logs)}


# Kept for single-item updates from the owner's count screen.
@app.post("/api/items/{item_id}/count")
def count_item(item_id: str, body: CountRequest, profile: dict = Depends(get_current_profile)):
    submission = CountSubmission(counts=[CountEntry(item_id=item_id, new_quantity=body.new_quantity)])
    submit_counts(submission, profile)
    supabase = get_supabase()
    res = supabase.table("items").select("*").eq("id", item_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Item not found")
    return res.data[0]


@app.get("/api/counts/today")
def counts_today(owner: dict = Depends(require_owner)):
    supabase = get_supabase()
    res = (
        supabase.table("count_logs")
        .select("*")
        .gte("counted_at", today_start_iso())
        .order("counted_at", desc=True)
        .execute()
    )
    logs = res.data

    by_employee = {}
    for log in logs:
        key = log.get("employee_id") or "unknown"
        group = by_employee.setdefault(
            key,
            {
                "employee_id": log.get("employee_id"),
                "employee_name": log.get("employee_name") or "Unknown",
                "submitted_at": log["counted_at"],
                "items_counted": 0,
                "notes": None,
            },
        )
        group["items_counted"] += 1
        if log["counted_at"] > group["submitted_at"]:
            group["submitted_at"] = log["counted_at"]
        if log.get("notes") and not group["notes"]:
            group["notes"] = log["notes"]

    return {"logs": logs, "submissions": list(by_employee.values())}


@app.get("/api/counts/latest")
def counts_latest(owner: dict = Depends(require_owner)):
    supabase = get_supabase()
    res = (
        supabase.table("count_logs")
        .select("item_id, employee_name, counted_at")
        .order("counted_at", desc=True)
        .limit(500)
        .execute()
    )
    latest = {}
    for log in res.data:
        if log["item_id"] not in latest:
            latest[log["item_id"]] = {
                "employee_name": log.get("employee_name"),
                "counted_at": log["counted_at"],
            }
    return latest


# ---------- Reorder & discrepancies (owner only) ----------

@app.get("/api/reorder")
def reorder_list(owner: dict = Depends(require_owner)):
    supabase = get_supabase()
    res = (
        supabase.table("items")
        .select("*")
        .eq("user_id", get_owner_id(supabase))
        .execute()
    )
    items = [item for item in res.data if item["current_quantity"] <= item["reorder_threshold"]]
    items.sort(key=lambda i: i["name"])
    return items


@app.get("/api/discrepancies")
def discrepancies(owner: dict = Depends(require_owner)):
    supabase = get_supabase()
    owner_id = get_owner_id(supabase)

    items_res = (
        supabase.table("items")
        .select("id, name, unit, expected_quantity")
        .eq("user_id", owner_id)
        .execute()
    )
    items = {i["id"]: i for i in items_res.data if i.get("expected_quantity") is not None}
    if not items:
        return []

    logs_res = (
        supabase.table("count_logs")
        .select("item_id, new_quantity, employee_name, counted_at")
        .gte("counted_at", today_start_iso())
        .order("counted_at", desc=True)
        .execute()
    )

    seen = set()
    flagged = []
    for log in logs_res.data:
        item = items.get(log["item_id"])
        if not item or log["item_id"] in seen:
            continue
        seen.add(log["item_id"])
        expected = float(item["expected_quantity"])
        if expected <= 0:
            continue
        reported = float(log["new_quantity"])
        variance = (reported - expected) / expected * 100
        if abs(variance) > 30:
            flagged.append(
                {
                    "item_id": log["item_id"],
                    "item_name": item["name"],
                    "unit": item["unit"],
                    "expected_qty": expected,
                    "reported_qty": reported,
                    "reported_by": log.get("employee_name") or "Unknown",
                    "variance_percent": round(variance, 1),
                    "counted_at": log["counted_at"],
                }
            )
    flagged.sort(key=lambda d: abs(d["variance_percent"]), reverse=True)
    return flagged
