"""FastAPI server — serves the REST API and the React build."""

import os
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from analyzer import run_analysis

app = FastAPI(title="Stock Analyzer API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)


class AnalyzeRequest(BaseModel):
    ticker: str
    amount: float


class AnalyzeResponse(BaseModel):
    ticker: str
    amount: float
    report: str


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.post("/api/analyze", response_model=AnalyzeResponse)
async def analyze(req: AnalyzeRequest):
    ticker = req.ticker.strip().upper()
    if not ticker or not ticker.isalpha() or len(ticker) > 6:
        raise HTTPException(status_code=400, detail=f"Ticker non valido: '{ticker}'")
    if req.amount <= 0:
        raise HTTPException(status_code=400, detail="L'importo deve essere maggiore di 0")
    try:
        report = run_analysis(ticker, req.amount)
        return AnalyzeResponse(ticker=ticker, amount=req.amount, report=report)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


# Serve React build in production
_dist = Path(__file__).parent / "frontend" / "dist"
if _dist.exists():
    app.mount("/", StaticFiles(directory=str(_dist), html=True), name="static")
