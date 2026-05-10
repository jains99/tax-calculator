import { useState, useEffect, useRef } from "react";

const fmt = (n) => Math.round(n).toLocaleString("en-IN");
const SD = 75000;

const DEFAULTS = {
  grossSalary: 0, bonus: 0, epf: 0, hlPrincipal: 0,
  elss: 0, lic: 0, hlInterest: 0, nps: 0,
  medSelf: 0, medParents: 0, hraExempt: 0, ld: 0, others: 0,
};

function calcNewTaxDetailed(taxable) {
  const slabs = [
    { from:0,       to:300000,   rate:0,    label:"Up to ₹3,00,000" },
    { from:300000,  to:700000,   rate:0.05, label:"₹3L – ₹7L" },
    { from:700000,  to:1000000,  rate:0.10, label:"₹7L – ₹10L" },
    { from:1000000, to:1200000,  rate:0.15, label:"₹10L – ₹12L" },
    { from:1200000, to:1500000,  rate:0.20, label:"₹12L – ₹15L" },
    { from:1500000, to:Infinity, rate:0.30, label:"Above ₹15L" },
  ];
  let tax = 0;
  const slabDetails = slabs.map(s => {
    const cap = s.to === Infinity ? taxable : s.to;
    const applicable = Math.max(0, Math.min(taxable, cap) - s.from);
    const slabTax = applicable * s.rate;
    tax += slabTax;
    return { ...s, applicable, slabTax };
  });
  const rebate = taxable <= 700000 ? tax : 0;
  if (taxable <= 700000) tax = 0;
  return { tax, slabDetails, rebate };
}

function calcOldTaxDetailed(taxable) {
  const slabs = [
    { from:0,       to:250000,   rate:0,    label:"Up to ₹2,50,000" },
    { from:250000,  to:500000,   rate:0.05, label:"₹2.5L – ₹5L" },
    { from:500000,  to:1000000,  rate:0.20, label:"₹5L – ₹10L" },
    { from:1000000, to:Infinity, rate:0.30, label:"Above ₹10L" },
  ];
  let tax = 0;
  const slabDetails = slabs.map(s => {
    const cap = s.to === Infinity ? taxable : s.to;
    const applicable = Math.max(0, Math.min(taxable, cap) - s.from);
    const slabTax = applicable * s.rate;
    tax += slabTax;
    return { ...s, applicable, slabTax };
  });
  const rebate = taxable <= 500000 ? tax : 0;
  if (taxable <= 500000) tax = 0;
  return { tax, slabDetails, rebate };
}

function calcSurchargeAndCess(baseTax, income) {
  let surchargeRate = 0;
  if (income > 50000000) surchargeRate = 0.37;
  else if (income > 20000000) surchargeRate = 0.25;
  else if (income > 10000000) surchargeRate = 0.15;
  else if (income > 5000000) surchargeRate = 0.10;
  const surcharge = baseTax * surchargeRate;
  const cess = (baseTax + surcharge) * 0.04;
  return { surcharge, surchargeRate, cess, total: baseTax + surcharge + cess };
}

const C = {
  bg:"#f5f5f7", surface:"#ffffff", surfaceSecondary:"#f5f5f7",
  border:"#e5e5e7", borderLight:"#f0f0f2",
  text:"#1d1d1f", textSecondary:"#6e6e73", textTertiary:"#aeaeb2",
  blue:"#0071e3", blueLight:"#e8f1fb",
  green:"#34c759", greenLight:"#edfaef",
  red:"#ff3b30", redLight:"#fff0ef",
  orange:"#ff9500", orangeLight:"#fff8ed",
  purple:"#af52de", purpleLight:"#f8f0fe",
  teal:"#32ade6", tealLight:"#edf8fe",
};
const shadow = {
  sm:"0 1px 3px rgba(0,0,0,0.08),0 1px 2px rgba(0,0,0,0.04)",
  md:"0 4px 16px rgba(0,0,0,0.08),0 1px 4px rgba(0,0,0,0.04)",
};

const Card = ({ children, style }) => (
  <div style={{ background:C.surface, borderRadius:18, padding:20, boxShadow:shadow.sm, border:`1px solid ${C.border}`, marginBottom:14, ...style }}>
    {children}
  </div>
);

const PillTabs = ({ tabs, active, onChange }) => (
  <div style={{ display:"flex", gap:6, background:C.surfaceSecondary, borderRadius:14, padding:4, marginBottom:20, border:`1px solid ${C.border}` }}>
    {tabs.map(t => (
      <button key={t.id} onClick={() => onChange(t.id)} style={{ flex:1, padding:"11px 4px", borderRadius:10, border:"none", cursor:"pointer", fontSize:13, fontWeight:600, background:active===t.id?C.surface:"transparent", color:active===t.id?C.text:C.textSecondary, boxShadow:active===t.id?shadow.sm:"none", transition:"all 0.18s" }}>{t.label}</button>
    ))}
  </div>
);

const NumInput = ({ label, sublabel, value, onChange, capVal }) => (
  <div style={{ marginBottom:18 }}>
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom:2 }}>
      <div style={{ fontSize:14, fontWeight:500, color:C.text }}>{label}</div>
      {capVal && (
        <button
          onClick={() => onChange(capVal)}
          style={{ fontSize:11, fontWeight:700, color:value===capVal?C.textTertiary:C.blue, background:value===capVal?C.surfaceSecondary:C.blueLight, border:"none", borderRadius:8, padding:"3px 8px", cursor:value===capVal?"default":"pointer", transition:"all 0.15s" }}
        >
          {value===capVal ? "✓ Max" : `Max ₹${fmt(capVal)}`}
        </button>
      )}
    </div>
    {sublabel && <div style={{ fontSize:12, color:C.textSecondary, marginBottom:8 }}>{sublabel}</div>}
    <div style={{ display:"flex", alignItems:"center", background:C.surfaceSecondary, border:`1.5px solid ${C.border}`, borderRadius:14, overflow:"hidden" }}>
      <span style={{ padding:"0 14px", fontSize:18, color:C.textSecondary, borderRight:`1px solid ${C.border}`, lineHeight:"52px" }}>₹</span>
      <input
        type="number"
        inputMode="numeric"
        pattern="[0-9]*"
        value={value || ""}
        placeholder="0"
        onChange={e => onChange(Number(e.target.value))}
        style={{ flex:1, border:"none", background:"transparent", fontSize:17, fontWeight:600, color:C.text, padding:"14px 16px", outline:"none", fontVariantNumeric:"tabular-nums" }}
      />
    </div>
  </div>
);

const SlabRow = ({ slab, color, maxTax }) => {
  const isActive = slab.applicable > 0 && slab.rate > 0;
  const pct = maxTax > 0 && slab.slabTax > 0 ? Math.round((slab.slabTax / maxTax) * 100) : 0;
  return (
    <div style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 0", borderBottom:`1px solid ${C.borderLight}`, opacity:isActive?1:0.35 }}>
      <div style={{ width:56, textAlign:"center" }}>
        <span style={{ fontSize:11, fontWeight:700, color:slab.rate===0?C.textTertiary:color, background:slab.rate===0?C.surfaceSecondary:color+"18", padding:"3px 6px", borderRadius:8 }}>
          {(slab.rate*100).toFixed(0)}%
        </span>
      </div>
      <div style={{ flex:1 }}>
        <div style={{ fontSize:13, fontWeight:500, color:C.text, marginBottom:2 }}>{slab.label}</div>
        {isActive && <div style={{ height:4, background:C.border, borderRadius:2, overflow:"hidden" }}><div style={{ height:"100%", width:`${pct}%`, background:color, borderRadius:2 }} /></div>}
        {isActive && slab.rate>0 && <div style={{ fontSize:11, color:C.textSecondary, marginTop:3 }}>₹{fmt(slab.applicable)} × {(slab.rate*100).toFixed(0)}%</div>}
      </div>
      <div style={{ textAlign:"right", minWidth:80 }}>
        <div style={{ fontSize:14, fontWeight:700, color:isActive&&slab.rate>0?C.red:C.textTertiary, fontVariantNumeric:"tabular-nums" }}>
          {isActive&&slab.rate>0?`₹${fmt(slab.slabTax)}`:"NIL"}
        </div>
      </div>
    </div>
  );
};

function DetailPanel({ regime, taxableIncome, grossIncome, slabDetails, rebate, surcharge, surchargeRate, cess, baseTax, totalTax, flowRows }) {
  const color = regime === "old" ? C.green : C.blue;
  const maxSlab = Math.max(...slabDetails.map(s => s.slabTax), 1);
  return (
    <div>
      <Card>
        <div style={{ fontSize:13, fontWeight:700, color:C.textSecondary, textTransform:"uppercase", letterSpacing:0.8, marginBottom:14 }}>Income → Taxable Income</div>
        {flowRows.map(({ label, val, sign, note, total, separator }, i) => (
          <div key={i}>
            {separator && <div style={{ height:1, background:C.border, margin:"6px 0" }} />}
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"6px 0" }}>
              <div>
                <div style={{ fontSize:total?15:13, fontWeight:total?700:500, color:total?C.text:C.textSecondary }}>{label}</div>
                {note && <div style={{ fontSize:11, color:C.textTertiary, marginTop:1 }}>{note}</div>}
              </div>
              <span style={{ fontSize:total?16:14, fontWeight:total?800:600, fontVariantNumeric:"tabular-nums", color:sign==="−"?(val>0?C.green:C.textTertiary):sign==="+"?C.text:color }}>
                {sign!=="="?(val>0?`${sign} ₹${fmt(val)}`:"—"):`₹${fmt(val)}`}
              </span>
            </div>
          </div>
        ))}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:10, padding:"14px 16px", background:color+"10", borderRadius:14, border:`1px solid ${color}28` }}>
          <div>
            <div style={{ fontSize:12, color:C.textSecondary, fontWeight:600 }}>Net Taxable Income</div>
            <div style={{ fontSize:11, color:C.textTertiary }}>Tax is calculated on this</div>
          </div>
          <div style={{ fontSize:22, fontWeight:800, color, fontVariantNumeric:"tabular-nums" }}>₹{fmt(taxableIncome)}</div>
        </div>
      </Card>
      <Card>
        <div style={{ fontSize:13, fontWeight:700, color:C.textSecondary, textTransform:"uppercase", letterSpacing:0.8, marginBottom:4 }}>Step 1 — Slab-wise Tax</div>
        <div style={{ fontSize:12, color:C.textTertiary, marginBottom:14 }}>Each slice of income taxed at its slab rate</div>
        {slabDetails.map((s,i) => <SlabRow key={i} slab={s} color={color} maxTax={maxSlab} />)}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"12px 14px", background:C.redLight, borderRadius:12, marginTop:10, border:`1px solid ${C.red}20` }}>
          <span style={{ fontSize:14, fontWeight:600, color:C.textSecondary }}>Total Slab Tax</span>
          <span style={{ fontSize:18, fontWeight:800, color:C.red, fontVariantNumeric:"tabular-nums" }}>₹{fmt(baseTax)}</span>
        </div>
      </Card>
      {rebate>0 && (
        <Card style={{ background:C.greenLight, borderColor:C.green+"30" }}>
          <div style={{ fontSize:13, fontWeight:700, color:C.textSecondary, textTransform:"uppercase", letterSpacing:0.8, marginBottom:10 }}>Step 2 — Rebate u/s 87A</div>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div>
              <div style={{ fontSize:14, fontWeight:600, color:C.text }}>Taxable income within rebate limit</div>
              <div style={{ fontSize:12, color:C.textSecondary, marginTop:2 }}>Net tax after rebate = ₹0</div>
            </div>
            <span style={{ fontSize:18, fontWeight:800, color:C.green }}>−₹{fmt(rebate)}</span>
          </div>
        </Card>
      )}
      <Card>
        <div style={{ fontSize:13, fontWeight:700, color:C.textSecondary, textTransform:"uppercase", letterSpacing:0.8, marginBottom:14 }}>Step {rebate>0?3:2} — Surcharge &amp; Cess</div>
        {[
          { label:"Base Tax (after rebate)", val:Math.max(0,baseTax-rebate) },
          { label:`Surcharge @ ${(surchargeRate*100).toFixed(0)}%${surchargeRate===0?" — not applicable (income ≤ ₹50L)":""}`, val:surcharge },
          { label:"Health & Education Cess @ 4%", val:cess },
        ].map(({ label, val }) => (
          <div key={label} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 0", borderBottom:`1px solid ${C.borderLight}` }}>
            <span style={{ fontSize:13, color:C.textSecondary }}>{label}</span>
            <span style={{ fontSize:14, fontWeight:600, color:val>0?C.red:C.textTertiary, fontVariantNumeric:"tabular-nums" }}>{val>0?`₹${fmt(val)}`:"—"}</span>
          </div>
        ))}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:14, padding:"14px 16px", background:C.redLight, borderRadius:14, border:`1px solid ${C.red}20` }}>
          <div>
            <div style={{ fontSize:14, fontWeight:700, color:C.text }}>Total Tax Payable</div>
            <div style={{ fontSize:12, color:C.textSecondary, marginTop:2 }}>
              Eff. rate: <strong>{taxableIncome>0?((totalTax/taxableIncome)*100).toFixed(2):0}%</strong> of taxable &nbsp;·&nbsp;
              <strong>{grossIncome>0?((totalTax/grossIncome)*100).toFixed(2):0}%</strong> of gross
            </div>
          </div>
          <div style={{ fontSize:24, fontWeight:800, color:C.red, fontVariantNumeric:"tabular-nums" }}>₹{fmt(totalTax)}</div>
        </div>
        <div style={{ marginTop:14, padding:"12px 14px", background:C.surfaceSecondary, borderRadius:12, border:`1px solid ${C.border}` }}>
          <div style={{ fontSize:11, fontWeight:700, color:C.textSecondary, marginBottom:6, textTransform:"uppercase", letterSpacing:0.5 }}>Formula</div>
          <div style={{ fontSize:12, color:C.textSecondary, lineHeight:2, fontFamily:"monospace" }}>
            Slab Tax = Σ (income in slab × rate)<br />
            Surcharge = Slab Tax × {(surchargeRate*100).toFixed(0)}%<br />
            Cess = (Slab Tax + Surcharge) × 4%<br />
            <span style={{ color, fontWeight:700 }}>Final Tax = Slab Tax + Surcharge + Cess</span>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default function App() {
  const [vals, setVals] = useState(DEFAULTS);
  const [inputTab, setInputTab] = useState("income");
  const [detailRegime, setDetailRegime] = useState("old");
  const [section, setSection] = useState("summary");
  const [toast, setToast] = useState(null);
  const [narrow, setNarrow] = useState(window.innerWidth < 480);
  const toastTimer = useRef(null);

  useEffect(() => {
    const fn = () => setNarrow(window.innerWidth < 480);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);

  const set = (field) => (v) => setVals(prev => ({ ...prev, [field]: v }));

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2800);
  };

  const resetToDefaults = () => {
    setVals(DEFAULTS);
    showToast("Reset to zero", "info");
  };

  const gross = vals.grossSalary + vals.bonus;
  const s80C  = Math.min(vals.epf + vals.hlPrincipal + vals.elss + vals.lic, 150000);
  const s24b  = Math.min(vals.hlInterest, 200000);
  const s80D  = Math.min(vals.medSelf, 25000) + Math.min(vals.medParents, 50000);
  const totalOldDed = SD + s80C + s24b + vals.nps + s80D + vals.hraExempt + vals.ld + vals.others;
  const oldTaxable  = Math.max(0, gross - totalOldDed);
  const { tax:oldBase, slabDetails:oldSlabs, rebate:oldRebate } = calcOldTaxDetailed(oldTaxable);
  const { surcharge:oldSurcharge, surchargeRate:oldSurchargeRate, cess:oldCess, total:oldTotal } = calcSurchargeAndCess(oldBase, oldTaxable);

  const newTaxable = Math.max(0, gross - SD);
  const { tax:newBase, slabDetails:newSlabs, rebate:newRebate } = calcNewTaxDetailed(newTaxable);
  const { surcharge:newSurcharge, surchargeRate:newSurchargeRate, cess:newCess, total:newTotal } = calcSurchargeAndCess(newBase, newTaxable);

  const savings    = newTotal - oldTotal;
  const better     = savings > 0 ? "old" : "new";
  const savingsAmt = Math.abs(savings);

  const oldFlowRows = [
    { label:"Gross Fixed Salary",                 val:vals.grossSalary, sign:"+" },
    { label:"Bonus & Variable Pay",               val:vals.bonus,       sign:"+" },
    { label:"Gross Total Income",                 val:gross,            sign:"=", total:true, separator:true },
    { label:"Standard Deduction",                 val:SD,               sign:"−", note:"Auto-applied — all salaried" },
    { label:"Section 80C",                        val:s80C,             sign:"−", note:"EPF + Principal, capped ₹1,50,000" },
    { label:"Section 24(b) — Home Loan Interest", val:s24b,             sign:"−", note:"Capped ₹2,00,000" },
    { label:"Section 80CCD(1B) — NPS",            val:vals.nps,         sign:"−" },
    { label:"Section 80D — Medical Insurance",    val:s80D,             sign:"−" },
    { label:"HRA Exemption",                      val:vals.hraExempt,   sign:"−" },
    { label:"L&D Reimbursement",                  val:vals.ld,          sign:"−" },
    { label:"Other Deductions",                   val:vals.others,      sign:"−" },
  ];

  const newFlowRows = [
    { label:"Gross Fixed Salary",                 val:vals.grossSalary, sign:"+" },
    { label:"Bonus & Variable Pay",               val:vals.bonus,       sign:"+" },
    { label:"Gross Total Income",                 val:gross,            sign:"=", total:true, separator:true },
    { label:"Standard Deduction",                 val:SD,               sign:"−", note:"Only deduction allowed in New Regime" },
    { label:"80C / 80D / 24(b) / NPS / HRA",     val:0,                sign:"−", note:"Not available in New Regime" },
  ];

  const regimeCards = [
    { label:"Old Regime", color:C.green, isBetter:better==="old", taxable:oldTaxable, deductions:totalOldDed, tax:oldTotal, inhand:gross-oldTotal },
    { label:"New Regime", color:C.blue,  isBetter:better==="new", taxable:newTaxable, deductions:SD,          tax:newTotal, inhand:gross-newTotal },
  ];

  return (
    <div style={{ minHeight:"100vh", background:C.bg, fontFamily:"-apple-system,'SF Pro Display','Helvetica Neue',sans-serif", color:C.text }}>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0;}
        input[type=number]::-webkit-inner-spin-button{-webkit-appearance:none;}
        input[type=number]::-webkit-outer-spin-button{-webkit-appearance:none;}
      `}</style>

      {toast && (
        <div style={{ position:"fixed", top:70, left:"50%", transform:"translateX(-50%)", zIndex:999,
          background:toast.type==="success"?C.green:C.blue, color:"#fff",
          padding:"10px 20px", borderRadius:20, fontSize:13, fontWeight:600,
          boxShadow:shadow.md, whiteSpace:"nowrap", animation:"fadeIn 0.2s ease" }}>
          {toast.msg}
        </div>
      )}
      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateX(-50%) translateY(-8px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}`}</style>

      {/* Top bar */}
      <div style={{ background:"rgba(245,245,247,0.85)", backdropFilter:"blur(20px)", WebkitBackdropFilter:"blur(20px)", borderBottom:`1px solid ${C.border}`, position:"sticky", top:0, zIndex:100, padding:"0 16px" }}>
        <div style={{ maxWidth:540, margin:"0 auto", display:"flex", alignItems:"center", justifyContent:"space-between", height:52 }}>
          <div>
            <div style={{ fontSize:17, fontWeight:700, color:C.text, letterSpacing:-0.4 }}>Tax Calculator</div>
            <div style={{ fontSize:11, color:C.textSecondary }}>FY 2025–26 · India</div>
          </div>
          {gross > 0 && (
            <div style={{ display:"flex", alignItems:"center", gap:6, background:better==="old"?C.greenLight:C.blueLight, border:`1px solid ${better==="old"?C.green:C.blue}28`, borderRadius:20, padding:"4px 10px" }}>
              <div style={{ width:7, height:7, borderRadius:"50%", background:better==="old"?C.green:C.blue }} />
              <span style={{ fontSize:12, fontWeight:700, color:better==="old"?C.green:C.blue }}>
                {better==="old"?"Old":"New"} saves ₹{fmt(savingsAmt)}
              </span>
            </div>
          )}
        </div>
      </div>

      <div style={{ maxWidth:540, margin:"0 auto", padding:"16px 12px 48px" }}>

        {/* Reset bar */}
        <div style={{ display:"flex", justifyContent:"flex-end", marginBottom:12 }}>
          <button onClick={resetToDefaults} style={{ padding:"10px 18px", background:C.surface, color:C.textSecondary, border:`1px solid ${C.border}`, borderRadius:14, fontSize:13, fontWeight:600, cursor:"pointer", boxShadow:shadow.sm }}>
            Reset
          </button>
        </div>

        {/* Section nav */}
        <div style={{ display:"flex", background:C.surface, borderRadius:14, padding:4, marginBottom:16, boxShadow:shadow.sm, border:`1px solid ${C.border}` }}>
          {[{id:"summary",label:"Summary"},{id:"detail",label:"Tax Detail"},{id:"deductions",label:"Deductions"}].map(n => (
            <button key={n.id} onClick={() => setSection(n.id)} style={{ flex:1, padding:"12px 4px", borderRadius:10, border:"none", cursor:"pointer", fontSize:13, fontWeight:600, background:section===n.id?C.blue:"transparent", color:section===n.id?"#fff":C.textSecondary, transition:"all 0.18s" }}>{n.label}</button>
          ))}
        </div>

        {/* SUMMARY */}
        {section==="summary" && (
          <div>
            {gross > 0 ? (
              <div style={{ background:better==="old"?`linear-gradient(135deg,#34c759,#30b050)`:`linear-gradient(135deg,#0071e3,#005bb5)`, borderRadius:20, padding:"24px 22px", marginBottom:14, color:"#fff" }}>
                <div style={{ fontSize:12, fontWeight:600, opacity:0.8, textTransform:"uppercase", letterSpacing:0.8, marginBottom:6 }}>Recommended</div>
                <div style={{ fontSize:28, fontWeight:800, letterSpacing:-0.8, marginBottom:4 }}>{better==="old"?"Old Tax Regime":"New Tax Regime"}</div>
                <div style={{ fontSize:14, opacity:0.9 }}>Saves you <strong>₹{fmt(savingsAmt)}</strong> vs the other regime</div>
              </div>
            ) : (
              <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:20, padding:"28px 22px", marginBottom:14, textAlign:"center" }}>
                <div style={{ fontSize:40, marginBottom:12 }}>☝️</div>
                <div style={{ fontSize:18, fontWeight:700, color:C.text, marginBottom:6 }}>Enter your income to get started</div>
                <div style={{ fontSize:13, color:C.textSecondary }}>Fill your salary details below to see Old vs New regime comparison</div>
              </div>
            )}

            {/* Regime cards — stack on narrow screens */}
            <div style={{ display:"grid", gridTemplateColumns:narrow?"1fr":"1fr 1fr", gap:10, marginBottom:14 }}>
              {regimeCards.map(r => (
                <div key={r.label} style={{ background:C.surface, borderRadius:18, padding:"16px 14px", border:`2px solid ${r.isBetter&&gross>0?r.color:C.border}`, boxShadow:r.isBetter&&gross>0?`0 4px 16px ${r.color}20`:shadow.sm, position:"relative" }}>
                  {r.isBetter && gross>0 && <div style={{ position:"absolute", top:-11, left:"50%", transform:"translateX(-50%)", background:r.color, color:"#fff", fontSize:10, fontWeight:700, padding:"2px 10px", borderRadius:20, whiteSpace:"nowrap" }}>✓ Better</div>}
                  <div style={{ fontSize:13, fontWeight:700, color:r.color, marginBottom:narrow?10:14 }}>{r.label}</div>
                  {narrow ? (
                    /* Compact horizontal layout on mobile */
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"6px 12px" }}>
                      {[["Gross",gross],["Deductions",r.deductions],["Taxable",r.taxable],["Tax",r.tax],["In-Hand",r.inhand]].map(([k,v]) => (
                        <div key={k}>
                          <div style={{ fontSize:10, fontWeight:600, color:C.textTertiary, textTransform:"uppercase", letterSpacing:0.5 }}>{k}</div>
                          <div style={{ fontSize:k==="In-Hand"?14:13, fontWeight:k==="In-Hand"||k==="Tax"?700:500, color:k==="Tax"?C.red:k==="In-Hand"?C.text:C.textSecondary, fontVariantNumeric:"tabular-nums", marginTop:1 }}>₹{fmt(v)}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    [["Gross",gross],["Deductions",r.deductions],["Taxable",r.taxable],["Tax",r.tax],["In-Hand",r.inhand]].map(([k,v]) => (
                      <div key={k} style={{ marginBottom:10 }}>
                        <div style={{ fontSize:10, fontWeight:600, color:C.textTertiary, textTransform:"uppercase", letterSpacing:0.5 }}>{k}</div>
                        <div style={{ fontSize:k==="In-Hand"?15:13, fontWeight:k==="In-Hand"||k==="Tax"?700:500, color:k==="Tax"?C.red:k==="In-Hand"?C.text:C.textSecondary, fontVariantNumeric:"tabular-nums", marginTop:1 }}>₹{fmt(v)}</div>
                      </div>
                    ))
                  )}
                  <div style={{ paddingTop:10, marginTop:narrow?8:0, borderTop:`1px solid ${C.border}`, fontSize:11, color:C.textTertiary }}>Monthly: <span style={{ fontWeight:700, color:C.text }}>₹{fmt((gross-r.tax)/12)}</span></div>
                </div>
              ))}
            </div>

            <Card>
              <div style={{ fontSize:15, fontWeight:700, color:C.text, marginBottom:16 }}>Your Details</div>
              <PillTabs tabs={[{id:"income",label:"💰 Income"},{id:"80c",label:"📦 80C"},{id:"housing",label:"🏠 Housing"},{id:"other",label:"🏥 Other"}]} active={inputTab} onChange={setInputTab} />
              {inputTab==="income" && (
                <div>
                  <NumInput label="Gross Fixed Salary (Annual)" value={vals.grossSalary} onChange={set("grossSalary")} />
                  <NumInput label="Bonus & Variable Pay (Annual)" value={vals.bonus} onChange={set("bonus")} />
                  <div style={{ background:C.blueLight, border:`1px solid ${C.blue}28`, borderRadius:12, padding:12, fontSize:12, color:C.textSecondary }}>
                    <span style={{ fontWeight:700, color:C.blue }}>Standard Deduction ₹75,000</span> auto-applied to both regimes
                  </div>
                </div>
              )}
              {inputTab==="80c" && (
                <div>
                  <div style={{ background:C.orangeLight, border:`1px solid ${C.orange}28`, borderRadius:12, padding:"8px 12px", fontSize:12, color:C.textSecondary, marginBottom:16 }}>
                    Total 80C capped at ₹1,50,000 · Current: <strong style={{ color:C.orange }}>₹{fmt(s80C)}</strong>
                  </div>
                  <NumInput label="EPF Contribution" value={vals.epf} onChange={set("epf")} capVal={150000} />
                  <NumInput label="Home Loan Principal Repayment" value={vals.hlPrincipal} onChange={set("hlPrincipal")} capVal={150000} />
                  <NumInput label="ELSS / NSC / Tax Saver FD" value={vals.elss} onChange={set("elss")} capVal={150000} />
                  <NumInput label="Life Insurance Premium" value={vals.lic} onChange={set("lic")} capVal={150000} />
                </div>
              )}
              {inputTab==="housing" && (
                <div>
                  <NumInput label="Home Loan Interest Paid" sublabel="Section 24(b) · capped at ₹2,00,000" value={vals.hlInterest} onChange={set("hlInterest")} capVal={200000} />
                  <NumInput label="HRA Exemption (exempt portion only)" sublabel="Set to 0 if same city as loan property" value={vals.hraExempt} onChange={set("hraExempt")} />
                  <div style={{ background:C.orangeLight, border:`1px solid ${C.orange}28`, borderRadius:12, padding:12, fontSize:12, color:C.textSecondary }}>
                    ⚠️ HRA + same city home loan → set HRA to ₹0
                  </div>
                </div>
              )}
              {inputTab==="other" && (
                <div>
                  <NumInput label="NPS — 80CCD(1B)" sublabel="Extra ₹50,000 beyond 80C" value={vals.nps} onChange={set("nps")} capVal={50000} />
                  <NumInput label="Medical Insurance — Self & Family" sublabel="Section 80D · capped ₹25,000" value={vals.medSelf} onChange={set("medSelf")} capVal={25000} />
                  <NumInput label="Medical Insurance — Parents" sublabel="80D · ₹25K below 60 / ₹50K senior citizen" value={vals.medParents} onChange={set("medParents")} capVal={50000} />
                  <NumInput label="L&D Reimbursement Claimed" value={vals.ld} onChange={set("ld")} />
                  <NumInput label="Other Deductions" sublabel="80E education loan, 80G donations etc." value={vals.others} onChange={set("others")} />
                </div>
              )}
            </Card>
          </div>
        )}

        {/* TAX DETAIL */}
        {section==="detail" && (
          <div>
            <PillTabs tabs={[{id:"old",label:"🟢 Old Regime"},{id:"new",label:"🔵 New Regime"}]} active={detailRegime} onChange={setDetailRegime} />
            {detailRegime==="old" && <DetailPanel regime="old" taxableIncome={oldTaxable} grossIncome={gross} slabDetails={oldSlabs} rebate={oldRebate} surcharge={oldSurcharge} surchargeRate={oldSurchargeRate} cess={oldCess} baseTax={oldBase} totalTax={oldTotal} flowRows={oldFlowRows} />}
            {detailRegime==="new" && <DetailPanel regime="new" taxableIncome={newTaxable} grossIncome={gross} slabDetails={newSlabs} rebate={newRebate} surcharge={newSurcharge} surchargeRate={newSurchargeRate} cess={newCess} baseTax={newBase} totalTax={newTotal} flowRows={newFlowRows} />}
          </div>
        )}

        {/* DEDUCTIONS */}
        {section==="deductions" && (
          <div>
            <Card>
              <div style={{ fontSize:15, fontWeight:700, color:C.text, marginBottom:4 }}>Old Regime Deductions</div>
              <div style={{ fontSize:12, color:C.textSecondary, marginBottom:16 }}>Only applicable in Old Regime (except Standard Deduction)</div>
              {[
                { label:"Standard Deduction",    sec:"Auto",      val:SD,             color:C.blue },
                { label:"Section 80C",           sec:"80C",       val:s80C,           note:`EPF ₹${fmt(vals.epf)} + Principal ₹${fmt(vals.hlPrincipal)} + ELSS ₹${fmt(vals.elss)} + LIC ₹${fmt(vals.lic)}`, cap:150000, color:C.green },
                { label:"Home Loan Interest",    sec:"24(b)",     val:s24b,           note:`Paid ₹${fmt(vals.hlInterest)} → capped ₹2,00,000`, cap:200000, color:C.teal },
                { label:"NPS Additional",        sec:"80CCD(1B)", val:vals.nps,       cap:50000,  color:C.purple },
                { label:"Medical Insurance",     sec:"80D",       val:s80D,           note:`Self ₹${fmt(Math.min(vals.medSelf,25000))} + Parents ₹${fmt(Math.min(vals.medParents,50000))}`, color:C.orange },
                { label:"HRA Exemption",         sec:"HRA",       val:vals.hraExempt, color:C.blue },
                { label:"L&D Reimbursement",     sec:"Reimb.",    val:vals.ld,        color:C.teal },
                { label:"Other Deductions",      sec:"Various",   val:vals.others,    color:C.textSecondary },
              ].map(({ label, sec, val, note, cap, color }) => (
                <div key={label} style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 0", borderBottom:`1px solid ${C.borderLight}` }}>
                  <div style={{ width:60, flexShrink:0 }}>
                    <span style={{ fontSize:10, fontWeight:700, color, background:color+"18", padding:"3px 6px", borderRadius:8 }}>{sec}</span>
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, fontWeight:500, color:C.text }}>{label}</div>
                    {note && <div style={{ fontSize:11, color:C.textTertiary, marginTop:2 }}>{note}</div>}
                    {cap && <div style={{ marginTop:5, height:3, background:C.border, borderRadius:2 }}><div style={{ height:"100%", width:`${Math.min(100,(val/cap)*100)}%`, background:color, borderRadius:2 }} /></div>}
                  </div>
                  <div style={{ textAlign:"right" }}>
                    <div style={{ fontSize:15, fontWeight:700, color:val>0?color:C.textTertiary, fontVariantNumeric:"tabular-nums" }}>{val>0?`−₹${fmt(val)}`:"—"}</div>
                    {cap && <div style={{ fontSize:10, color:C.textTertiary }}>of ₹{fmt(cap)}</div>}
                  </div>
                </div>
              ))}
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"16px 0 0" }}>
                <div>
                  <div style={{ fontSize:15, fontWeight:700, color:C.text }}>Total Deductions</div>
                  {gross>0 && <div style={{ fontSize:12, color:C.textSecondary }}>Saving {((totalOldDed/gross)*100).toFixed(1)}% of gross</div>}
                </div>
                <div style={{ fontSize:22, fontWeight:800, color:C.green, fontVariantNumeric:"tabular-nums" }}>−₹{fmt(totalOldDed)}</div>
              </div>
            </Card>
            <Card style={{ background:C.blueLight, borderColor:C.blue+"28" }}>
              <div style={{ fontSize:15, fontWeight:700, color:C.blue, marginBottom:8 }}>New Regime</div>
              <div style={{ fontSize:13, color:C.textSecondary, marginBottom:12 }}>Only Standard Deduction is allowed. All other deductions unavailable.</div>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <span style={{ fontSize:14, color:C.text }}>Standard Deduction</span>
                <span style={{ fontSize:16, fontWeight:700, color:C.blue }}>₹{fmt(SD)}</span>
              </div>
            </Card>
          </div>
        )}

        <div style={{ textAlign:"center", fontSize:11, color:C.textTertiary, marginTop:8 }}>
          Includes 4% Health & Education Cess · Surcharge if income &gt; ₹50L<br />
          Consult a CA for final filing — this is an estimate only
        </div>
      </div>
    </div>
  );
}
