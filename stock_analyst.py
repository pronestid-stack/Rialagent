#!/usr/bin/env python3
"""
Stock Analyst Agent — JP Morgan style deep-dive
Usage: python3 stock_analyst.py [TICKER] [AMOUNT]
       python3 stock_analyst.py AAPL 10000
"""

import sys
import os
import json
import yfinance as yf
import pandas as pd
from datetime import datetime, timedelta
from rich.console import Console
from rich.panel import Panel
from rich.table import Table
from rich.text import Text
from rich.rule import Rule
from rich import box
import anthropic

console = Console()

# ── Peer maps by GICS sector ──────────────────────────────────────────────────
SECTOR_PEERS = {
    "Technology": ["AAPL", "MSFT", "GOOGL", "META", "NVDA", "AVGO", "ORCL", "AMD", "INTC", "QCOM"],
    "Consumer Cyclical": ["AMZN", "TSLA", "HD", "MCD", "NKE", "SBUX", "TGT", "LOW", "BKNG", "MAR"],
    "Consumer Defensive": ["WMT", "PG", "KO", "PEP", "COST", "MDLZ", "CL", "GIS", "K", "HSY"],
    "Healthcare": ["JNJ", "UNH", "PFE", "ABBV", "MRK", "TMO", "ABT", "DHR", "BMY", "LLY"],
    "Financial Services": ["BRK-B", "JPM", "BAC", "WFC", "GS", "MS", "C", "AXP", "BLK", "SCHW"],
    "Industrials": ["GE", "HON", "UPS", "BA", "CAT", "DE", "LMT", "RTX", "MMM", "EMR"],
    "Energy": ["XOM", "CVX", "COP", "EOG", "SLB", "MPC", "PSX", "VLO", "OXY", "HAL"],
    "Communication Services": ["GOOGL", "META", "NFLX", "DIS", "CMCSA", "VZ", "T", "TMUS", "WBD", "FOX"],
    "Utilities": ["NEE", "DUK", "SO", "D", "EXC", "AEP", "SRE", "PEG", "ED", "XEL"],
    "Real Estate": ["AMT", "PLD", "CCI", "EQIX", "PSA", "DLR", "O", "WELL", "AVB", "EQR"],
    "Basic Materials": ["LIN", "APD", "SHW", "FCX", "NEM", "NUE", "DOW", "DD", "ALB", "MOS"],
}


def safe_get(d, *keys, default="N/A"):
    """Safely traverse nested dicts."""
    for k in keys:
        if not isinstance(d, dict):
            return default
        d = d.get(k, default)
        if d is None:
            return default
    return d if d != "" else default


def fmt(value, suffix="", prefix="", decimals=2, pct=False):
    """Format numbers for display."""
    if value in (None, "N/A", float("inf"), float("-inf")):
        return "N/A"
    try:
        v = float(value)
        if pct:
            return f"{v*100:.{decimals}f}%"
        if abs(v) >= 1e12:
            return f"{prefix}{v/1e12:.{decimals}f}T{suffix}"
        if abs(v) >= 1e9:
            return f"{prefix}{v/1e9:.{decimals}f}B{suffix}"
        if abs(v) >= 1e6:
            return f"{prefix}{v/1e6:.{decimals}f}M{suffix}"
        return f"{prefix}{v:.{decimals}f}{suffix}"
    except (TypeError, ValueError):
        return "N/A"


def fetch_stock_data(ticker: str) -> dict:
    """Pull all relevant data from yfinance."""
    console.print(f"  [dim]Fetching data for {ticker}...[/dim]")
    stock = yf.Ticker(ticker)
    info = stock.info or {}

    # Price history
    hist_1y = stock.history(period="1y")
    hist_5y = stock.history(period="5y")

    current_price = safe_get(info, "currentPrice") or safe_get(info, "regularMarketPrice")
    if current_price == "N/A" and not hist_1y.empty:
        current_price = float(hist_1y["Close"].iloc[-1])

    # 52-week stats
    high_52w = safe_get(info, "fiftyTwoWeekHigh")
    low_52w = safe_get(info, "fiftyTwoWeekLow")

    # Returns
    ret_1m = ret_6m = ret_1y = ret_5y = "N/A"
    if not hist_1y.empty and len(hist_1y) > 1:
        close = hist_1y["Close"]
        try:
            ret_1m = (close.iloc[-1] / close.iloc[-min(21, len(close)-1)] - 1) if len(close) >= 21 else "N/A"
            ret_6m = (close.iloc[-1] / close.iloc[-min(126, len(close)-1)] - 1) if len(close) >= 126 else "N/A"
            ret_1y = (close.iloc[-1] / close.iloc[0] - 1)
        except Exception:
            pass
    if not hist_5y.empty and len(hist_5y) > 1:
        try:
            ret_5y = (hist_5y["Close"].iloc[-1] / hist_5y["Close"].iloc[0] - 1)
        except Exception:
            pass

    # Analyst targets
    try:
        analyst_df = stock.analyst_price_targets
        analyst_target = float(analyst_df["mean"].iloc[-1]) if analyst_df is not None and not analyst_df.empty else "N/A"
    except Exception:
        analyst_target = safe_get(info, "targetMeanPrice")

    # Earnings / revenue estimates
    try:
        earnings_est = stock.earnings_estimate
        rev_est = stock.revenue_estimate
    except Exception:
        earnings_est = rev_est = None

    return {
        "ticker": ticker.upper(),
        "name": safe_get(info, "longName"),
        "sector": safe_get(info, "sector"),
        "industry": safe_get(info, "industry"),
        "country": safe_get(info, "country"),
        "exchange": safe_get(info, "exchange"),
        # Price
        "current_price": current_price,
        "high_52w": high_52w,
        "low_52w": low_52w,
        "avg_50d": safe_get(info, "fiftyDayAverage"),
        "avg_200d": safe_get(info, "twoHundredDayAverage"),
        "analyst_target": analyst_target,
        # Returns
        "ret_1m": ret_1m,
        "ret_6m": ret_6m,
        "ret_1y": ret_1y,
        "ret_5y": ret_5y,
        # Valuation
        "pe_ttm": safe_get(info, "trailingPE"),
        "pe_fwd": safe_get(info, "forwardPE"),
        "pb": safe_get(info, "priceToBook"),
        "ps": safe_get(info, "priceToSalesTrailing12Months"),
        "peg": safe_get(info, "pegRatio"),
        "ev_ebitda": safe_get(info, "enterpriseToEbitda"),
        "ev_revenue": safe_get(info, "enterpriseToRevenue"),
        # Fundamentals
        "market_cap": safe_get(info, "marketCap"),
        "enterprise_value": safe_get(info, "enterpriseValue"),
        "revenue": safe_get(info, "totalRevenue"),
        "revenue_growth": safe_get(info, "revenueGrowth"),
        "gross_margin": safe_get(info, "grossMargins"),
        "operating_margin": safe_get(info, "operatingMargins"),
        "profit_margin": safe_get(info, "profitMargins"),
        "ebitda": safe_get(info, "ebitda"),
        "ebitda_margin": (
            safe_get(info, "ebitda") / safe_get(info, "totalRevenue")
            if isinstance(safe_get(info, "ebitda"), (int, float))
            and isinstance(safe_get(info, "totalRevenue"), (int, float))
            and safe_get(info, "totalRevenue") != 0
            else "N/A"
        ),
        "eps_ttm": safe_get(info, "trailingEps"),
        "eps_fwd": safe_get(info, "forwardEps"),
        "eps_growth": safe_get(info, "earningsGrowth"),
        # Balance sheet / cash
        "total_cash": safe_get(info, "totalCash"),
        "total_debt": safe_get(info, "totalDebt"),
        "debt_equity": safe_get(info, "debtToEquity"),
        "current_ratio": safe_get(info, "currentRatio"),
        "quick_ratio": safe_get(info, "quickRatio"),
        "free_cash_flow": safe_get(info, "freeCashflow"),
        "operating_cash_flow": safe_get(info, "operatingCashflow"),
        # Returns & efficiency
        "roe": safe_get(info, "returnOnEquity"),
        "roa": safe_get(info, "returnOnAssets"),
        "roic": safe_get(info, "returnOnCapital", default="N/A"),
        # Dividends
        "dividend_yield": safe_get(info, "dividendYield"),
        "dividend_rate": safe_get(info, "dividendRate"),
        "payout_ratio": safe_get(info, "payoutRatio"),
        # Other
        "beta": safe_get(info, "beta"),
        "shares_outstanding": safe_get(info, "sharesOutstanding"),
        "float_shares": safe_get(info, "floatShares"),
        "short_ratio": safe_get(info, "shortRatio"),
        "short_percent": safe_get(info, "shortPercentOfFloat"),
        "institutional_ownership": safe_get(info, "institutionPercentHeld"),
        "insider_ownership": safe_get(info, "insiderPercentHeld"),
        "description": safe_get(info, "longBusinessSummary"),
        "earnings_estimate": str(earnings_est) if earnings_est is not None else "N/A",
        "revenue_estimate": str(rev_est) if rev_est is not None else "N/A",
    }


def fetch_peers_data(main_ticker: str, sector: str, main_data: dict) -> list[dict]:
    """Fetch condensed data for peer stocks."""
    peers_pool = SECTOR_PEERS.get(sector, [])
    peers = [p for p in peers_pool if p.upper() != main_ticker.upper()][:5]

    if not peers:
        console.print("  [dim]No peer list for this sector, using generic benchmarks.[/dim]")
        return []

    peer_rows = []
    for p in peers:
        try:
            info = yf.Ticker(p).info or {}
            cp = safe_get(info, "currentPrice") or safe_get(info, "regularMarketPrice")
            peer_rows.append({
                "ticker": p,
                "name": safe_get(info, "longName"),
                "market_cap": safe_get(info, "marketCap"),
                "current_price": cp,
                "pe_ttm": safe_get(info, "trailingPE"),
                "pe_fwd": safe_get(info, "forwardPE"),
                "pb": safe_get(info, "priceToBook"),
                "ev_ebitda": safe_get(info, "enterpriseToEbitda"),
                "revenue_growth": safe_get(info, "revenueGrowth"),
                "profit_margin": safe_get(info, "profitMargins"),
                "roe": safe_get(info, "returnOnEquity"),
                "beta": safe_get(info, "beta"),
                "dividend_yield": safe_get(info, "dividendYield"),
                "ret_1y": "N/A",  # skip history fetch for speed
            })
        except Exception:
            pass

    return peer_rows


def build_analysis_prompt(main: dict, peers: list[dict], amount: float) -> str:
    """Build the Claude prompt with all gathered data."""

    def p(v, **kw):
        return fmt(v, **kw)

    peers_text = ""
    for r in peers:
        peers_text += (
            f"\n  {r['ticker']:8} | Cap {p(r['market_cap'])} | "
            f"P/E(ttm) {p(r['pe_ttm'], decimals=1)} | P/E(fwd) {p(r['pe_fwd'], decimals=1)} | "
            f"EV/EBITDA {p(r['ev_ebitda'], decimals=1)} | Rev Growth {p(r['revenue_growth'], pct=True)} | "
            f"Net Margin {p(r['profit_margin'], pct=True)} | ROE {p(r['roe'], pct=True)} | Beta {p(r['beta'], decimals=2)}"
        )

    prompt = f"""You are a senior equity research analyst at JP Morgan. A client wants a thorough institutional-grade analysis of {main['ticker']} before investing ${amount:,.0f}.

=== TARGET COMPANY ===
Name: {main['name']}
Ticker: {main['ticker']} | Exchange: {main['exchange']}
Sector: {main['sector']} | Industry: {main['industry']}
Description: {main['description'][:800] if main['description'] != 'N/A' else 'N/A'}

=== PRICE & TECHNICALS ===
Current Price:   ${p(main['current_price'])}
52-Week Range:   ${p(main['low_52w'])} – ${p(main['high_52w'])}
50-Day MA:       ${p(main['avg_50d'])}
200-Day MA:      ${p(main['avg_200d'])}
Analyst Target:  ${p(main['analyst_target'])} (mean consensus)
Beta:            {p(main['beta'])}
Short Interest:  {p(main['short_percent'], pct=True)} of float | Short Ratio {p(main['short_ratio'])}

=== PERFORMANCE ===
1-Month Return:  {p(main['ret_1m'], pct=True)}
6-Month Return:  {p(main['ret_6m'], pct=True)}
1-Year Return:   {p(main['ret_1y'], pct=True)}
5-Year Return:   {p(main['ret_5y'], pct=True)}

=== VALUATION MULTIPLES ===
P/E (TTM):        {p(main['pe_ttm'], decimals=1)}x
P/E (Forward):    {p(main['pe_fwd'], decimals=1)}x
P/B:              {p(main['pb'], decimals=1)}x
P/S:              {p(main['ps'], decimals=1)}x
PEG:              {p(main['peg'], decimals=2)}
EV/EBITDA:        {p(main['ev_ebitda'], decimals=1)}x
EV/Revenue:       {p(main['ev_revenue'], decimals=1)}x

=== FINANCIALS ===
Market Cap:       {p(main['market_cap'])}
Enterprise Value: {p(main['enterprise_value'])}
Revenue (TTM):    {p(main['revenue'])}
Revenue Growth:   {p(main['revenue_growth'], pct=True)}
Gross Margin:     {p(main['gross_margin'], pct=True)}
Operating Margin: {p(main['operating_margin'], pct=True)}
EBITDA Margin:    {p(main['ebitda_margin'], pct=True)}
Net Margin:       {p(main['profit_margin'], pct=True)}
EPS (TTM):        ${p(main['eps_ttm'])}
EPS (Forward):    ${p(main['eps_fwd'])}
EPS Growth:       {p(main['eps_growth'], pct=True)}

=== BALANCE SHEET & CASH FLOW ===
Total Cash:       {p(main['total_cash'])}
Total Debt:       {p(main['total_debt'])}
Debt/Equity:      {p(main['debt_equity'], decimals=2)}
Current Ratio:    {p(main['current_ratio'], decimals=2)}
Quick Ratio:      {p(main['quick_ratio'], decimals=2)}
Free Cash Flow:   {p(main['free_cash_flow'])}
Operating CF:     {p(main['operating_cash_flow'])}

=== RETURNS & EFFICIENCY ===
ROE:  {p(main['roe'], pct=True)}
ROA:  {p(main['roa'], pct=True)}

=== DIVIDENDS ===
Dividend Yield:   {p(main['dividend_yield'], pct=True)}
Dividend Rate:    ${p(main['dividend_rate'])}
Payout Ratio:     {p(main['payout_ratio'], pct=True)}

=== OWNERSHIP ===
Institutional:    {p(main['institutional_ownership'], pct=True)}
Insider:          {p(main['insider_ownership'], pct=True)}

=== SECTOR PEERS (for comparative analysis) ==={peers_text if peers_text else chr(10) + "  No peer data available."}

=== INVESTMENT REQUEST ===
Proposed Investment: ${amount:,.0f}
Shares purchasable at current price: {fmt(amount / float(main['current_price']), decimals=0) if isinstance(main['current_price'], (int, float)) and main['current_price'] not in (None, 'N/A', 0) else 'N/A'} shares

---

Please provide an institutional-grade equity research report with the following structure:

1. **COMPANY OVERVIEW & STRATEGIC POSITIONING**
   - Business model, competitive moat, market position
   - Key growth drivers and risks

2. **SECTOR & INDUSTRY ANALYSIS**
   - Sector macro trends
   - Competitive landscape positioning

3. **FUNDAMENTAL ANALYSIS**
   - Revenue & earnings quality
   - Margin analysis and trends
   - Balance sheet health and FCF generation

4. **KEY PERFORMANCE INDICATORS (KPIs)**
   - Most critical KPIs for this specific sector
   - Trend assessment (improving / stable / deteriorating)

5. **COMPARATIVE ANALYSIS vs PEERS**
   - Valuation premium or discount vs sector (with specific multiples comparison)
   - Quality metrics vs peers (margins, returns, growth)
   - Relative strengths and weaknesses

6. **TECHNICAL POSITIONING**
   - Price vs moving averages, 52-week context
   - Momentum assessment
   - Short interest interpretation

7. **VALUATION ASSESSMENT**
   - Is the current price attractive, fair, or expensive?
   - Upside / downside to analyst consensus target
   - Multiple-based fair value range

8. **RISK FACTORS**
   - Top 3-5 specific risks for this stock

9. **INVESTMENT DECISION**
   - **VERDICT**: BUY / HOLD / AVOID (with conviction level: High / Medium / Low)
   - Rationale in 3-5 bullet points
   - For the ${amount:,.0f} investment: entry strategy suggestion (full position now / scale in / wait for better entry)
   - Suggested stop-loss and price target if BUY

Write in a professional, direct, data-driven style. Be specific with numbers. Do not hedge excessively — give a clear recommendation.
"""
    return prompt


def run_claude_analysis(prompt: str) -> str:
    """Stream Claude's analysis to terminal."""
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        return "[ERROR] ANTHROPIC_API_KEY environment variable not set."

    client = anthropic.Anthropic(api_key=api_key)
    full_response = []

    console.print()
    console.rule("[bold cyan]ANALYST REPORT[/bold cyan]")
    console.print()

    with client.messages.stream(
        model="claude-opus-4-7",
        max_tokens=4096,
        messages=[{"role": "user", "content": prompt}],
        system=(
            "You are a senior equity research analyst at JP Morgan with 20 years of experience. "
            "Provide rigorous, data-driven analysis. Be direct and specific. "
            "Always base conclusions on the actual numbers provided."
        ),
    ) as stream:
        for text in stream.text_stream:
            console.print(text, end="", markup=False, highlight=False)
            full_response.append(text)

    console.print()
    return "".join(full_response)


def print_data_table(main: dict, peers: list[dict]):
    """Print a quick-reference comparison table."""
    table = Table(
        title=f"Comparative Snapshot: {main['ticker']} vs Sector Peers",
        box=box.ROUNDED,
        show_header=True,
        header_style="bold cyan",
    )
    table.add_column("Ticker", style="bold white", width=8)
    table.add_column("Price", justify="right", width=10)
    table.add_column("Mkt Cap", justify="right", width=10)
    table.add_column("P/E fwd", justify="right", width=8)
    table.add_column("EV/EBITDA", justify="right", width=9)
    table.add_column("Rev Gr%", justify="right", width=8)
    table.add_column("Net Mg%", justify="right", width=8)
    table.add_column("ROE%", justify="right", width=7)
    table.add_column("Beta", justify="right", width=6)

    def pct_fmt(v):
        if v in (None, "N/A"):
            return "N/A"
        try:
            return f"{float(v)*100:.1f}%"
        except Exception:
            return "N/A"

    def xfmt(v):
        if v in (None, "N/A"):
            return "N/A"
        try:
            return f"{float(v):.1f}x"
        except Exception:
            return "N/A"

    table.add_row(
        f"[bold green]{main['ticker']}[/bold green]",
        f"${fmt(main['current_price'])}",
        fmt(main['market_cap']),
        xfmt(main['pe_fwd']),
        xfmt(main['ev_ebitda']),
        pct_fmt(main['revenue_growth']),
        pct_fmt(main['profit_margin']),
        pct_fmt(main['roe']),
        fmt(main['beta'], decimals=2),
        style="on dark_green",
    )

    for p in peers:
        table.add_row(
            p['ticker'],
            f"${fmt(p['current_price'])}",
            fmt(p['market_cap']),
            xfmt(p['pe_fwd']),
            xfmt(p['ev_ebitda']),
            pct_fmt(p['revenue_growth']),
            pct_fmt(p['profit_margin']),
            pct_fmt(p['roe']),
            fmt(p['beta'], decimals=2),
        )

    console.print(table)


def main():
    console.print(Panel.fit(
        "[bold cyan]Stock Analyst Agent[/bold cyan]\n"
        "[dim]Powered by yfinance + Claude Opus 4 · JP Morgan style[/dim]",
        border_style="cyan",
    ))

    # ── Get inputs ────────────────────────────────────────────────────────────
    if len(sys.argv) >= 3:
        ticker = sys.argv[1].upper().strip()
        try:
            amount = float(sys.argv[2].replace(",", "").replace("$", ""))
        except ValueError:
            console.print("[red]Invalid amount. Usage: python3 stock_analyst.py TICKER AMOUNT[/red]")
            sys.exit(1)
    elif len(sys.argv) == 2:
        ticker = sys.argv[1].upper().strip()
        amount = float(console.input("[bold]Investment amount ($): [/bold]").replace(",", "").replace("$", ""))
    else:
        ticker = console.input("[bold]Enter ticker symbol: [/bold]").upper().strip()
        amount = float(console.input("[bold]Investment amount ($): [/bold]").replace(",", "").replace("$", ""))

    console.print(f"\n[bold]Analysing [cyan]{ticker}[/cyan] — investment of [green]${amount:,.0f}[/green][/bold]\n")

    # ── Fetch data ────────────────────────────────────────────────────────────
    with console.status("[bold green]Fetching market data...[/bold green]"):
        main_data = fetch_stock_data(ticker)

    if main_data["current_price"] == "N/A":
        console.print(f"[red]Could not fetch data for '{ticker}'. Check the ticker symbol.[/red]")
        sys.exit(1)

    sector = main_data["sector"] if main_data["sector"] != "N/A" else "Technology"
    console.print(f"  Sector detected: [bold]{sector}[/bold] | Industry: [bold]{main_data['industry']}[/bold]")

    with console.status("[bold green]Fetching peer comparison data...[/bold green]"):
        peers_data = fetch_peers_data(ticker, sector, main_data)

    console.print(f"  Peers loaded: [bold]{len(peers_data)}[/bold] comparables\n")

    # ── Print comparison table ────────────────────────────────────────────────
    print_data_table(main_data, peers_data)

    # ── Build prompt & run Claude ─────────────────────────────────────────────
    prompt = build_analysis_prompt(main_data, peers_data, amount)

    console.print("\n[dim]Sending to Claude for institutional-grade analysis...[/dim]")
    run_claude_analysis(prompt)

    console.print()
    console.rule("[bold cyan]End of Report[/bold cyan]")
    console.print(f"[dim]Analysis generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S UTC')}[/dim]")


if __name__ == "__main__":
    main()
