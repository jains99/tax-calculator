# Tax Calculator — FY 2025-26

India income tax calculator — Old vs New regime, side-by-side.

**Live:** https://jains99.github.io/tax-calculator/

## Features

### Regime Comparison
- Old vs New regime compared side-by-side
- Auto-recommends the better regime with exact savings amount
- Shows Gross, Deductions, Taxable Income, Tax, and Monthly In-Hand for each regime

### Tax Calculation
- Slab-wise breakdown — each income slice taxed at its rate with a visual bar
- Rebate u/s 87A auto-applied (up to ₹7L in New, ₹5L in Old)
- Surcharge auto-calculated for income above ₹50L, ₹1Cr, ₹2Cr, ₹5Cr
- 4% Health & Education Cess included
- Effective tax rate shown as % of taxable income and % of gross
- Standard Deduction ₹75,000 auto-applied to both regimes

### Deductions (Old Regime)
| Section | What | Cap |
|---------|------|-----|
| 80C | EPF + Home Loan Principal + ELSS + LIC | ₹1,50,000 |
| 24(b) | Home Loan Interest | ₹2,00,000 |
| 80CCD(1B) | NPS Additional | ₹50,000 |
| 80D | Medical Insurance — Self + Family / Parents | ₹25,000 + ₹50,000 |
| HRA | House Rent Allowance exemption | As applicable |
| L&D | Learning & Development reimbursement | As applicable |
| Various | Other (80E education loan, 80G donations, etc.) | As applicable |

## Local Development

```bash
npm install
npm run dev
```

## Deploy

```bash
npm run deploy
```

Builds and pushes to `gh-pages` branch automatically.
