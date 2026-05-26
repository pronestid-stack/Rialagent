#!/usr/bin/env python3
"""
Stock Analyst Agent — JP Morgan style deep-dive
Uses Claude's built-in web search for real-time data (no external API keys needed).
Usage: python3 stock_analyst.py [TICKER] [AMOUNT] [PORTFOLIO_TOTAL]
       python3 stock_analyst.py OUST 1000 34000
"""

import sys
import os
from datetime import datetime
from rich.console import Console
from rich.panel import Panel
from rich.rule import Rule
import anthropic

console = Console()


def build_research_prompt(ticker: str, amount: float, portfolio: float) -> str:
    pct_of_portfolio = (amount / portfolio * 100) if portfolio > 0 else 0
    currency_note = "Note: the investment amount is in EUR. Convert to USD as needed for share count estimates."

    return f"""You are a senior equity research analyst at JP Morgan. A client wants an institutional-grade analysis of **{ticker}** before investing.

**Investment context:**
- Amount to invest: €{amount:,.0f} (~${amount*1.08:,.0f} USD approx.)
- Total portfolio value: €{portfolio:,.0f}
- Position size: {pct_of_portfolio:.1f}% of total portfolio
- {currency_note}

**Your task — use web search to gather current, real-time data, then produce a full report.**

Please search for and include:
1. Current stock price, today's % change, 52-week high/low
2. Market cap, sector, industry
3. Latest earnings (EPS actual vs estimate, revenue actual vs estimate)
4. Key valuation multiples: P/E (TTM & forward), EV/EBITDA, P/S, P/B, PEG
5. Revenue growth, gross margin, operating margin, net margin, FCF
6. Balance sheet: cash, debt, debt/equity ratio
7. Analyst consensus: rating (Buy/Hold/Sell count), mean price target, upside %
8. Recent news and catalysts (last 30-60 days)
9. 3-5 direct competitors/peers with their key multiples for comparison

Then structure your report as follows:

---

## 1. COMPANY OVERVIEW & STRATEGIC POSITIONING
Business model, competitive moat, market position, key products/services.

## 2. SECTOR & INDUSTRY ANALYSIS
Macro trends driving the sector, regulatory environment, growth outlook, competitive landscape.

## 3. FUNDAMENTAL ANALYSIS
Revenue & earnings quality, margin trends, balance sheet health, FCF generation and trajectory.

## 4. KEY PERFORMANCE INDICATORS (KPIs)
The 4-6 most critical KPIs for this specific company/sector. For each: current value, trend direction (↑↓→), and what it signals.

## 5. COMPARATIVE ANALYSIS vs PEERS
Side-by-side table of valuation multiples and quality metrics vs 3-5 direct competitors. Explicit premium/discount assessment.

## 6. TECHNICAL POSITIONING
Price vs 50-day and 200-day moving averages. 52-week context (where in the range). Momentum. Short interest if notable.

## 7. VALUATION ASSESSMENT
Is the stock cheap, fair value, or expensive at current price? DCF or multiple-based fair value range. Upside/downside to consensus target.

## 8. RISK FACTORS
Top 4-5 specific, material risks for this stock (not generic market risks).

## 9. PORTFOLIO CONTEXT
Given this is {pct_of_portfolio:.1f}% of a €{portfolio:,.0f} portfolio, comment on:
- Position sizing appropriateness
- Correlation / diversification considerations
- Risk-adjusted fit

## 10. INVESTMENT DECISION
**VERDICT: BUY / HOLD / AVOID**
**Conviction: High / Medium / Low**

- 3-5 bullet points justifying the decision
- Entry strategy for €{amount:,.0f}: full position now / scale in / wait for better entry
- If BUY: suggested entry price range, stop-loss level, 12-month price target
- If AVOID: what conditions would change the thesis to a BUY

---

Be direct, data-driven, and specific with numbers. This is for a professional financial analyst — no hedging, no disclaimers, give a clear actionable recommendation.
"""


def run_analysis(ticker: str, amount: float, portfolio: float):
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        console.print("[red]ERROR: ANTHROPIC_API_KEY not set.[/red]")
        sys.exit(1)

    client = anthropic.Anthropic(api_key=api_key)
    prompt = build_research_prompt(ticker, amount, portfolio)

    console.print()
    console.print(Panel.fit(
        f"[bold cyan]Stock Analyst Agent[/bold cyan]\n"
        f"[dim]Ticker: [bold]{ticker}[/bold]  |  "
        f"Investment: €{amount:,.0f}  |  "
        f"Portfolio: €{portfolio:,.0f} ({amount/portfolio*100:.1f}%)[/dim]",
        border_style="cyan",
    ))
    console.print()
    console.print("[dim]Searching for real-time data and generating report...[/dim]")
    console.rule("[bold cyan]ANALYST REPORT[/bold cyan]")
    console.print()

    # Use streaming with web search tool
    with client.messages.stream(
        model="claude-opus-4-7",
        max_tokens=8000,
        tools=[{
            "type": "web_search_20250305",
            "name": "web_search",
            "max_uses": 12,
        }],
        system=(
            "You are a senior equity research analyst at JP Morgan with 20 years of experience. "
            "Use web search to gather current market data before writing your analysis. "
            "Be rigorous, data-driven, and direct. Give clear buy/hold/avoid recommendations with specific numbers."
        ),
        messages=[{"role": "user", "content": prompt}],
    ) as stream:
        for event in stream:
            # Print only text deltas — tool use happens silently
            if hasattr(event, "type"):
                if event.type == "content_block_start":
                    if hasattr(event, "content_block"):
                        if event.content_block.type == "tool_use":
                            tool_input = getattr(event.content_block, "input", {})
                            query = tool_input.get("query", "…") if isinstance(tool_input, dict) else "…"
                            console.print(f"  [dim cyan]⟳ Searching: {query}[/dim cyan]")
                elif event.type == "content_block_delta":
                    if hasattr(event, "delta"):
                        if event.delta.type == "text_delta":
                            console.print(event.delta.text, end="", markup=False, highlight=False)

    console.print()
    console.print()
    console.rule("[bold cyan]End of Report[/bold cyan]")
    console.print(f"[dim]Generated: {datetime.now().strftime('%Y-%m-%d %H:%M UTC')}[/dim]")


def main():
    if len(sys.argv) >= 4:
        ticker = sys.argv[1].upper().strip()
        amount = float(sys.argv[2].replace(",", "").replace("€", "").replace("$", ""))
        portfolio = float(sys.argv[3].replace(",", "").replace("€", "").replace("$", ""))
    elif len(sys.argv) == 3:
        ticker = sys.argv[1].upper().strip()
        amount = float(sys.argv[2].replace(",", "").replace("€", "").replace("$", ""))
        portfolio = float(console.input("[bold]Total portfolio value (€): [/bold]").replace(",", ""))
    elif len(sys.argv) == 2:
        ticker = sys.argv[1].upper().strip()
        amount = float(console.input("[bold]Investment amount (€): [/bold]").replace(",", ""))
        portfolio = float(console.input("[bold]Total portfolio value (€): [/bold]").replace(",", ""))
    else:
        ticker = console.input("[bold]Ticker symbol: [/bold]").upper().strip()
        amount = float(console.input("[bold]Investment amount (€): [/bold]").replace(",", ""))
        portfolio = float(console.input("[bold]Total portfolio value (€): [/bold]").replace(",", ""))

    run_analysis(ticker, amount, portfolio)


if __name__ == "__main__":
    main()
