import { useEffect, useState, useRef, useCallback } from "react";
import API from "../services/api";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line,
  AreaChart, Area, RadarChart, Radar, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, Treemap, ComposedChart, ReferenceLine
} from "recharts";

const COLORS = ["#C8102E","#1a1a2e","#0f3460","#e94560","#16213e","#28a745","#ff9800"];
const ONPREM_COLORS = ["#0f3460","#1a1a2e","#e94560","#16213e","#C8102E"];
const CLIENT_COLORS = ["#C8102E","#0f3460","#28a745","#ff9800","#e94560","#1a1a2e","#6c757d"];
const AI_API = "http://localhost:5001";
const PAGE_SIZE = 20;
const ONPREM_GROUPS = ["GIS","BDO","CDO","DO","EIP"];
const MONTHS = ["Jan","Fév","Mar","Avr","Mai","Jun","Jul","Aoû","Sep","Oct","Nov","Déc"];
const DAYS = ["Lun","Mar","Mer","Jeu","Ven","Sam","Dim"];
const HOURS = ["08h","09h","10h","11h","12h","13h","14h","15h","16h","17h","18h"];
const MONITORING_TASKS = ["Colateral SOC", "Insurance SOC", "Internal SOC"];

const styles = {
  navbar:  { background:"linear-gradient(135deg,#C8102E,#a00c26)", padding:"0 30px", height:"65px", display:"flex", alignItems:"center", justifyContent:"space-between", boxShadow:"0 4px 20px rgba(200,16,46,0.4)" },
  brand:   { color:"white", fontSize:"20px", fontWeight:"bold", letterSpacing:"2px" },
  page:    { minHeight:"100vh", background:"linear-gradient(135deg,#f0f2f5,#e8edf2)", fontFamily:"Arial, sans-serif" },
  container:{ padding:"25px" },
  card:    { background:"white", borderRadius:"12px", padding:"20px", boxShadow:"0 4px 20px rgba(0,0,0,0.08)", marginBottom:"20px" },
  cardTitle:{ color:"#1a1a2e", fontWeight:"bold", fontSize:"16px", marginBottom:"15px", borderBottom:"3px solid #C8102E", paddingBottom:"8px" },
  btn: (bg) => ({ background:bg, color:"white", border:"none", padding:"10px 24px", borderRadius:"8px", fontWeight:"bold", cursor:"pointer", fontSize:"14px", margin:"0 6px" }),
  tabBtn: (active) => ({ padding:"10px 20px", borderRadius:"8px 8px 0 0", fontWeight:"bold", cursor:"pointer", fontSize:"13px", margin:"0 2px 0 0", border:"none", background:active?"white":"#e0e0e0", color:active?"#C8102E":"#666", borderBottom:active?"3px solid #C8102E":"none" }),
  badge: (bg) => ({ background:bg, color:"white", padding:"4px 10px", borderRadius:"20px", fontSize:"12px", fontWeight:"bold" }),
  table:   { width:"100%", borderCollapse:"collapse" },
  th:      { background:"linear-gradient(135deg,#1a1a2e,#0f3460)", color:"white", padding:"12px 15px", textAlign:"left", fontSize:"13px" },
  td:      { padding:"12px 15px", borderBottom:"1px solid #f0f0f0", fontSize:"14px", color:"#333" },
  filterSelect: { padding:"8px 12px", borderRadius:"6px", border:"2px solid #e0e0e0", fontSize:"13px", outline:"none", marginRight:"10px", cursor:"pointer" },
  pagination:  { display:"flex", alignItems:"center", justifyContent:"center", gap:"8px", marginTop:"15px", padding:"10px" },
  pageBtn:(active)=>({ padding:"6px 12px", border:"1px solid #ddd", borderRadius:"5px", cursor:"pointer", background:active?"#C8102E":"white", color:active?"white":"#333", fontWeight:active?"bold":"normal" })
};

const FLIP_CSS = `
  .flip-card{background:transparent;perspective:1000px;height:130px;cursor:pointer;}
  .flip-card-inner{position:relative;width:100%;height:100%;transition:transform 0.7s cubic-bezier(0.4,0.2,0.2,1);transform-style:preserve-3d;}
  .flip-card:hover .flip-card-inner{transform:rotateY(180deg);}
  .flip-card-front,.flip-card-back{position:absolute;width:100%;height:100%;-webkit-backface-visibility:hidden;backface-visibility:hidden;border-radius:12px;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:15px;box-sizing:border-box;box-shadow:0 8px 25px rgba(0,0,0,0.15);}
  .flip-card-back{transform:rotateY(180deg);}
  .heatmap-cell{transition:all 0.2s;cursor:pointer;}
  .heatmap-cell:hover{transform:scale(1.15);filter:brightness(1.2);}
  .bullet-bar{transition:width 0.6s ease;}
  @keyframes slideDown{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}
  @keyframes pulse{0%,100%{box-shadow:0 0 0 0 rgba(200,16,46,0.4)}50%{box-shadow:0 0 0 8px rgba(200,16,46,0)}}
  .cf-active{animation:pulse 1.5s ease-in-out 1;}
`;

// ── CROSS-FILTER BANNER ──
function CrossFilterBanner({ selectedClient, selectedGroup, onClear }) {
  if (!selectedClient && !selectedGroup) return null;
  const label = selectedClient || selectedGroup;
  const isGroup = !!selectedGroup;
  return (
    <div style={{
      display:"flex", alignItems:"center", gap:"12px",
      background: isGroup ? "linear-gradient(135deg,#0f3460,#1a1a2e)" : "linear-gradient(135deg,#C8102E,#a00c26)",
      borderRadius:"10px", padding:"10px 18px", marginBottom:"18px",
      boxShadow:"0 4px 15px rgba(0,0,0,0.15)", animation:"slideDown 0.3s ease"
    }}>
      <span style={{fontSize:"18px"}}>{isGroup ? "🖥️" : "🎯"}</span>
      <span style={{color:"white", fontWeight:"bold", fontSize:"14px"}}>
        Filtre actif : <span style={{background:"rgba(255,255,255,0.2)", padding:"2px 10px", borderRadius:"15px", marginLeft:"4px"}}>{label}</span>
      </span>
      <span style={{color:"rgba(255,255,255,0.7)", fontSize:"12px"}}>— Tous les visuels sont filtrés</span>
      <button onClick={onClear} style={{marginLeft:"auto", background:"rgba(255,255,255,0.2)", color:"white", border:"1px solid rgba(255,255,255,0.4)", padding:"5px 14px", borderRadius:"20px", cursor:"pointer", fontSize:"12px", fontWeight:"bold"}}>✕ Effacer filtre</button>
    </div>
  );
}

function Pagination({total,page,onPage}){
  const tot=Math.ceil(total/PAGE_SIZE);
  if(tot<=1) return null;
  const pages=[];
  for(let i=Math.max(1,page-2);i<=Math.min(tot,page+2);i++) pages.push(i);
  return(
    <div style={styles.pagination}>
      <button style={styles.pageBtn(false)} onClick={()=>onPage(1)} disabled={page===1}>«</button>
      <button style={styles.pageBtn(false)} onClick={()=>onPage(page-1)} disabled={page===1}>‹</button>
      {pages.map(p=><button key={p} style={styles.pageBtn(p===page)} onClick={()=>onPage(p)}>{p}</button>)}
      <button style={styles.pageBtn(false)} onClick={()=>onPage(page+1)} disabled={page===tot}>›</button>
      <button style={styles.pageBtn(false)} onClick={()=>onPage(tot)} disabled={page===tot}>»</button>
      <span style={{fontSize:"13px",color:"#666",marginLeft:"10px"}}>{(page-1)*PAGE_SIZE+1}–{Math.min(page*PAGE_SIZE,total)} / {total}</span>
    </div>
  );
}

function Gauge({value,max,label,highlighted}){
  const pct=Math.min((value/max)*100,100);
  const color=pct>80?"#C8102E":pct>50?"#ff9800":"#28a745";
  return(
    <div style={{textAlign:"center",padding:"10px",width:"100%",opacity:highlighted===false?0.3:1,transition:"opacity 0.2s"}}>
      <svg viewBox="0 0 100 60" style={{width:"120px",margin:"0 auto",display:"block"}}>
        <path d="M10,55 A45,45 0 0,1 90,55" fill="none" stroke="#e0e0e0" strokeWidth="12" strokeLinecap="round"/>
        <path d="M10,55 A45,45 0 0,1 90,55" fill="none" stroke={color} strokeWidth="12" strokeLinecap="round" strokeDasharray={`${(pct/100)*141} 141`}/>
      </svg>
      <div style={{fontSize:"20px",fontWeight:"bold",color}}>{value}h</div>
      <div style={{fontSize:"12px",color:"#666"}}>/ {max}h max</div>
      <div style={{fontSize:"13px",fontWeight:"bold",color:"#1a1a2e",marginTop:"4px"}}>{label}</div>
      <div style={{fontSize:"12px",color,fontWeight:"bold",marginTop:"4px"}}>{pct>=100?"⚠️ Dépassé":`${pct.toFixed(0)}%`}</div>
    </div>
  );
}

function ActivityHeatmap({ timeEntries, selectedClient, onSelectClient }) {
  const filtered = selectedClient ? timeEntries.filter(e => (e.client_name || e.group_name) === selectedClient) : timeEntries;
  const grid = DAYS.map((_, di) => HOURS.map((_, hi) => {
    const hour = 8 + hi;
    const entries = filtered.filter(e => {
      if (!e.date || !e.slot_start) return false;
      const d = new Date(e.date).getDay(); const dayIdx = d === 0 ? 6 : d - 1;
      const h = parseInt(e.slot_start?.split(":")[0] || "0");
      return dayIdx === di && h === hour;
    });
    return { count: entries.length, entries };
  }));
  const maxVal = Math.max(...grid.flat().map(c => c.count), 1);
  const getColor = (v) => { if (v === 0) return "#f0f2f5"; const p = v / maxVal; if (p < 0.25) return "#fce4e4"; if (p < 0.5) return "#f48fb1"; if (p < 0.75) return "#e94560"; return "#C8102E"; };

  const handleCellClick = (cell) => {
    if (!onSelectClient || cell.entries.length === 0) return;
    // Trouve le client/groupe le plus fréquent dans cette cellule
    const counts = {};
    cell.entries.forEach(e => {
      const name = e.client_name || e.group_name;
      if (name) counts[name] = (counts[name] || 0) + 1;
    });
    const topName = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0];
    if (topName) onSelectClient(topName === selectedClient ? null : topName);
  };

  return (
    <div style={{ overflowX: "auto" }}>
      {selectedClient && <div style={{fontSize:"12px",color:"#C8102E",fontWeight:"bold",marginBottom:"8px"}}>🎯 Filtré sur : {selectedClient}</div>}
      <div style={{ display: "flex", gap: "4px", marginBottom: "6px", paddingLeft: "36px" }}>
        {HOURS.map(h => <div key={h} style={{ width: "32px", fontSize: "10px", color: "#999", textAlign: "center" }}>{h}</div>)}
      </div>
      {grid.map((row, di) => (
        <div key={di} style={{ display: "flex", gap: "4px", alignItems: "center", marginBottom: "4px" }}>
          <div style={{ width: "32px", fontSize: "11px", color: "#666", fontWeight: "bold" }}>{DAYS[di]}</div>
          {row.map((cell, hi) => (
            <div key={hi} className="heatmap-cell"
              title={`${DAYS[di]} ${HOURS[hi]} — ${cell.count} entrée(s)${cell.count > 0 ? " (clic pour filtrer)" : ""}`}
              onClick={() => handleCellClick(cell)}
              style={{ width: "32px", height: "28px", borderRadius: "5px", background: getColor(cell.count), display: "flex", alignItems: "center", justifyContent: "center", cursor: cell.count > 0 ? "pointer" : "default" }}>
              {cell.count > 0 && <span style={{ fontSize: "10px", fontWeight: "bold", color: cell.count / maxVal > 0.4 ? "white" : "#C8102E" }}>{cell.count}</span>}
            </div>
          ))}
        </div>
      ))}
      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "10px", paddingLeft: "36px" }}>
        <span style={{ fontSize: "11px", color: "#999" }}>Moins</span>
        {["#f0f2f5", "#fce4e4", "#f48fb1", "#e94560", "#C8102E"].map((c, i) => <div key={i} style={{ width: "18px", height: "18px", borderRadius: "3px", background: c }} />)}
        <span style={{ fontSize: "11px", color: "#999" }}>Plus</span>
      </div>
    </div>
  );
}

function WaterfallChart({comparison, selectedClient, onSelectClient}){
  if(!comparison.length) return <div style={{textAlign:"center",color:"#999",padding:"40px"}}>Aucune donnée</div>;
  const data=comparison.filter(c=>Math.abs(parseFloat(c.ecart))>0).slice(0,8).map(c=>({client:c.client,ecart:parseFloat(c.ecart),jira:parseFloat(c.jira_hours),chronos:parseFloat(c.chronos_hours)}));
  const CustomBar=(props)=>{
    const{x,y,width,height,payload}=props;
    if(!height||!payload) return null;
    const client=payload.client; const ecart=payload.ecart;
    const isSelected=selectedClient===client; const isDimmed=selectedClient&&!isSelected;
    const fill=ecart>0?"#ff9800":ecart<0?"#C8102E":"#28a745";
    const h=Math.abs(height);
    return(
      <g style={{cursor:"pointer"}} onClick={()=>onSelectClient(client===selectedClient?null:client)}>
        <rect x={x} y={y} width={width} height={h} fill={fill} rx={4} opacity={isDimmed?0.2:1} stroke={isSelected?"#1a1a2e":"none"} strokeWidth={isSelected?3:0}/>
        <text x={x+width/2} y={ecart<0?y+h+14:y-6} textAnchor="middle" fontSize={10} fontWeight="bold" fill={isDimmed?"#ccc":fill}>{ecart>0?"+":""}{ecart.toFixed(1)}h</text>
      </g>
    );
  };
  return(
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{top:20,right:20,bottom:20,left:10}}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false}/>
        <XAxis dataKey="client" tick={{fontSize:11,fill:"#666"}}/>
        <YAxis tick={{fontSize:11,fill:"#666"}} tickFormatter={v=>`${v}h`}/>
        <ReferenceLine y={0} stroke="#1a1a2e" strokeWidth={2}/>
        <Tooltip contentStyle={{borderRadius:"8px"}} formatter={(v,n)=>[`${parseFloat(v).toFixed(2)}h`,n]}/>
        <Bar dataKey="ecart" name="Écart (h)" shape={<CustomBar/>}/>
      </BarChart>
    </ResponsiveContainer>
  );
}

function BulletChart({data,title,colorScheme="red",selectedClient,onSelectClient}){
  const accent=colorScheme==="red"?"#C8102E":"#0f3460";
  if(!data||data.length===0) return null;
  return(
    <div>
      <div style={styles.cardTitle}>{title}</div>
      {data.map((item,i)=>{
        const valuePct=Math.min((item.value/item.max)*100,100);
        const targetPct=Math.min((item.target/item.max)*100,100);
        const overTarget=item.value>item.target;
        const isSelected=selectedClient===item.label;
        const isDimmed=selectedClient&&!isSelected;
        return(
          <div key={i} style={{marginBottom:"16px",opacity:isDimmed?0.3:1,transition:"opacity 0.2s",cursor:"pointer",padding:"4px 8px",borderRadius:"8px",background:isSelected?"rgba(200,16,46,0.06)":"transparent",border:isSelected?"1px solid rgba(200,16,46,0.3)":"1px solid transparent"}}
            onClick={()=>onSelectClient&&onSelectClient(item.label===selectedClient?null:item.label)}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:"5px"}}>
              <span style={{fontSize:"12px",fontWeight:"bold",color:isSelected?"#C8102E":"#1a1a2e"}}>{isSelected?"🎯 ":""}{item.label}</span>
              <span style={{fontSize:"11px",color:"#666"}}><span style={{color:overTarget?"#C8102E":"#28a745",fontWeight:"bold"}}>{item.value.toFixed(1)}h</span>{" / "}{item.target}h objectif</span>
            </div>
            <div style={{position:"relative",height:"22px",background:"#f0f2f5",borderRadius:"6px",overflow:"visible"}}>
              <div style={{position:"absolute",left:0,top:0,width:`${Math.min((item.target/item.max)*100*1.2,100)}%`,height:"100%",background:"#e0e4ea",borderRadius:"6px"}}/>
              <div className="bullet-bar" style={{position:"absolute",left:0,top:"4px",height:"14px",width:`${valuePct}%`,background:overTarget?`linear-gradient(90deg,${accent},${accent}cc)`:`linear-gradient(90deg,#28a745,#1e7e34)`,borderRadius:"4px"}}/>
              <div style={{position:"absolute",left:`${targetPct}%`,top:"-3px",width:"3px",height:"28px",background:"#1a1a2e",borderRadius:"2px",transform:"translateX(-50%)"}}/>
            </div>
            <div style={{display:"flex",justifyContent:"flex-end",marginTop:"2px"}}>
              <span style={{fontSize:"10px",color:overTarget?"#C8102E":"#28a745",fontWeight:"bold"}}>{overTarget?`⚠️ +${(item.value-item.target).toFixed(1)}h`:`✅ -${(item.target-item.value).toFixed(1)}h restant`}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

const renderDonutLabel=({cx,cy,midAngle,innerRadius,outerRadius,percent})=>{
  if(percent<0.05) return null;
  const R=Math.PI/180,r=innerRadius+(outerRadius-innerRadius)*0.5;
  return<text x={cx+r*Math.cos(-midAngle*R)} y={cy+r*Math.sin(-midAngle*R)} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight="bold">{`${(percent*100).toFixed(0)}%`}</text>;
};

const TreemapContent=({x,y,width,height,name,value,index,depth,selectedClient,onSelectClient})=>{
  if(depth===0||width<40||height<30) return null;
  const colors=["#C8102E","#1a1a2e","#0f3460","#e94560","#28a745","#ff9800","#16213e","#6c757d"];
  const isSelected=selectedClient===name; const isDimmed=selectedClient&&!isSelected;
  return(
    <g style={{cursor:"pointer"}} onClick={()=>onSelectClient&&onSelectClient(name===selectedClient?null:name)}>
      <rect x={x} y={y} width={width} height={height} fill={colors[index%colors.length]} stroke="white" strokeWidth={2} rx={4} opacity={isDimmed?0.3:1}/>
      {isSelected&&<rect x={x+2} y={y+2} width={width-4} height={height-4} fill="none" stroke="white" strokeWidth={2} rx={3} strokeDasharray="4,2"/>}
      <text x={x+width/2} y={y+height/2-8} textAnchor="middle" fill="white" fontSize={Math.min(13,width/5)} fontWeight="bold">{name}</text>
      <text x={x+width/2} y={y+height/2+10} textAnchor="middle" fill="rgba(255,255,255,0.8)" fontSize={Math.min(11,width/6)}>{value} tickets</text>
    </g>
  );
};

const CustomBarLabel=({x,y,width,value})=><text x={x+width+5} y={y+12} fill="#333" fontSize={12} fontWeight="bold">{value}</text>;

function ClickablePie({data,dataKey,nameKey,colors,selectedClient,onSelectClient,innerRadius=60,outerRadius=100}){
  return(
    <PieChart>
      <Pie data={data} dataKey={dataKey} nameKey={nameKey} cx="50%" cy="50%" innerRadius={innerRadius} outerRadius={outerRadius} labelLine={false} label={renderDonutLabel}
        onClick={(d)=>onSelectClient&&onSelectClient(d[nameKey]===selectedClient?null:d[nameKey])} style={{cursor:"pointer"}}>
        {data.map((entry,i)=>{
          const isSelected=selectedClient===entry[nameKey]; const isDimmed=selectedClient&&!isSelected;
          return<Cell key={i} fill={colors[i%colors.length]} opacity={isDimmed?0.25:1} stroke={isSelected?"#1a1a2e":"white"} strokeWidth={isSelected?3:1}/>;
        })}
      </Pie>
      <Tooltip contentStyle={{borderRadius:"8px"}}/><Legend/>
    </PieChart>
  );
}

function ClientRetentionAI({tickets,hoursByClient,clientRules,selectedClient,onSelectClient}){
  const [insights,setInsights]=useState([]);
  const [loading,setLoading]=useState(false);
  const generate=()=>{
    setLoading(true);
    setTimeout(()=>{
      const saas=tickets.filter(t=>t.ticket_type==="SAAS");
      const byC=saas.reduce((a,t)=>{const c=t.client_name||"?";a[c]=(a[c]||0)+1;return a;},{});
      const res=Object.entries(byC).map(([client,count])=>{
        const rule=clientRules.find(r=>r.client===client);
        const pct=rule?(rule.used/rule.max)*100:0;
        const risk=count>100&&pct>80?"🔴 Critique":count>50||pct>60?"🟡 Modéré":"🟢 Faible";
        const action=risk.includes("Critique")?"Augmenter la capacité ou redistribuer.":risk.includes("Modéré")?"Planifier une réunion de suivi.":"Maintenir le niveau actuel.";
        return{client,tickets:count,usedPercent:pct.toFixed(0),risk,action};
      }).sort((a,b)=>b.tickets-a.tickets).slice(0,8);
      setInsights(res);setLoading(false);
    },1200);
  };
  return(
    <div style={{marginBottom:"25px"}}>
      <div style={styles.cardTitle}>🤝 Analyse de Risque Clients — IA <span style={{fontSize:"11px",color:"#999",fontWeight:"normal"}}>(clic = filtre)</span></div>
      <button onClick={generate} disabled={loading} style={{...styles.btn("#C8102E"),marginBottom:"20px"}}>{loading?"⏳ Analyse...":"🤝 Analyser Risque Clients"}</button>
      {insights.length>0&&(
        <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:"15px"}}>
          {insights.map((ins,i)=>{
            const isSelected=selectedClient===ins.client; const isDimmed=selectedClient&&!isSelected;
            return(
              <div key={i} onClick={()=>onSelectClient&&onSelectClient(ins.client===selectedClient?null:ins.client)}
                style={{background:ins.risk.includes("Critique")?"#fff5f5":ins.risk.includes("Modéré")?"#fffbf0":"#f0fff4",borderRadius:"10px",padding:"15px",border:`2px solid ${isSelected?"#1a1a2e":ins.risk.includes("Critique")?"#C8102E":ins.risk.includes("Modéré")?"#ff9800":"#28a745"}`,cursor:"pointer",opacity:isDimmed?0.3:1,transition:"all 0.2s",transform:isSelected?"scale(1.02)":"scale(1)"}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:"8px"}}>
                  <span style={{fontWeight:"bold"}}>{isSelected?"🎯 ":""}📌 {ins.client}</span><span>{ins.risk}</span>
                </div>
                <div style={{display:"flex",gap:"8px",marginBottom:"8px"}}>
                  <span style={styles.badge("#1a1a2e")}>{ins.tickets} tickets</span>
                  {parseFloat(ins.usedPercent)>0&&<span style={styles.badge(parseFloat(ins.usedPercent)>80?"#C8102E":"#ff9800")}>{ins.usedPercent}%</span>}
                </div>
                <div style={{fontSize:"12px",background:"white",padding:"8px",borderRadius:"6px"}}>✅ {ins.action}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Chatbot({tickets,timeEntries,aiPredictions,aiAnomalies}){
  const [messages,setMessages]=useState([{role:"assistant",content:"👋 Bonjour ! Je suis l'assistant IA du SOC Dashboard VERMEG. Posez-moi des questions !"}]);
  const [input,setInput]=useState("");
  const [loading,setLoading]=useState(false);
  const endRef=useRef(null);
  useEffect(()=>{endRef.current?.scrollIntoView({behavior:"smooth"});},[messages]);
  const ctx=()=>{
    const saas=tickets.filter(t=>t.ticket_type==="SAAS");
    const total=timeEntries.reduce((a,e)=>a+parseFloat(e.hours_logged||0),0);
    const byC=saas.reduce((a,t)=>{const n=t.client_name||"?";a[n]=(a[n]||0)+1;return a;},{});
    return`Tu es l'assistant IA expert du SOC Dashboard VERMEG Tunisie. ${tickets.length} tickets (SaaS:${saas.length}), ${total.toFixed(1)}h. Clients: ${Object.entries(byC).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([c,n])=>`${c}(${n})`).join(", ")}. Réponds en français, concis.`;
  };
  const send=async()=>{
    if(!input.trim()||loading) return;
    const msg=input.trim();setInput("");
    setMessages(p=>[...p,{role:"user",content:msg}]);setLoading(true);
    try{
      const token=localStorage.getItem("token");
      const r=await fetch("http://localhost:5000/api/chat",{method:"POST",headers:{"Content-Type":"application/json","Authorization":`Bearer ${token}`},body:JSON.stringify({messages:[...messages.filter((_,i)=>i>0).map(m=>({role:m.role,content:m.content})),{role:"user",content:msg}]})});
      const d=await r.json();
      setMessages(p=>[...p,{role:"assistant",content:d.reply||"Désolé."}]);
    }catch{setMessages(p=>[...p,{role:"assistant",content:"⚠️ Erreur API."}]);}
    setLoading(false);
  };
  return(
    <div style={{background:"white",borderRadius:"12px",boxShadow:"0 4px 20px rgba(0,0,0,0.12)",overflow:"hidden"}}>
      <div style={{background:"linear-gradient(135deg,#1a1a2e,#0f3460)",padding:"15px 20px",display:"flex",alignItems:"center",gap:"10px"}}>
        <div style={{fontSize:"24px"}}>🤖</div>
        <div><div style={{color:"white",fontWeight:"bold"}}>Assistant IA — SOC Dashboard</div><div style={{color:"rgba(255,255,255,0.7)",fontSize:"12px"}}>Powered by Groq AI (Llama 3.1)</div></div>
        <div style={{marginLeft:"auto",background:"#28a745",color:"white",padding:"4px 10px",borderRadius:"20px",fontSize:"11px"}}>● En ligne</div>
      </div>
      <div style={{height:"350px",overflowY:"auto",padding:"15px",background:"#f8f9fa"}}>
        {messages.map((m,i)=>(
          <div key={i} style={{display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start",marginBottom:"12px"}}>
            {m.role==="assistant"&&<div style={{width:"32px",height:"32px",borderRadius:"50%",background:"#1a1a2e",display:"flex",alignItems:"center",justifyContent:"center",marginRight:"8px",fontSize:"16px"}}>🤖</div>}
            <div style={{maxWidth:"78%",padding:"10px 14px",borderRadius:m.role==="user"?"18px 18px 4px 18px":"18px 18px 18px 4px",background:m.role==="user"?"#C8102E":"white",color:m.role==="user"?"white":"#333",fontSize:"13px",lineHeight:"1.6",boxShadow:"0 2px 8px rgba(0,0,0,0.1)",whiteSpace:"pre-wrap"}}>{m.content}</div>
            {m.role==="user"&&<div style={{width:"32px",height:"32px",borderRadius:"50%",background:"#C8102E",display:"flex",alignItems:"center",justifyContent:"center",marginLeft:"8px"}}>👤</div>}
          </div>
        ))}
        {loading&&<div style={{color:"#666",fontSize:"13px",padding:"10px"}}>🤖 IA réfléchit...</div>}
        <div ref={endRef}/>
      </div>
      <div style={{padding:"8px 15px",background:"#f0f0f0",display:"flex",gap:"8px",flexWrap:"wrap"}}>
        {["Quel client a le plus de tickets ?","Analyse les anomalies","Résume les performances SOC"].map(q=>(
          <button key={q} onClick={()=>setInput(q)} style={{padding:"4px 10px",background:"white",border:"1px solid #C8102E",color:"#C8102E",borderRadius:"15px",fontSize:"11px",cursor:"pointer"}}>{q}</button>
        ))}
      </div>
      <div style={{padding:"12px 15px",background:"white",display:"flex",gap:"10px",borderTop:"1px solid #f0f0f0"}}>
        <input value={input} onChange={e=>setInput(e.target.value)} onKeyPress={e=>e.key==="Enter"&&send()} placeholder="Posez une question..." style={{flex:1,padding:"10px 15px",border:"2px solid #e0e0e0",borderRadius:"25px",fontSize:"13px",outline:"none"}}/>
        <button onClick={send} disabled={loading||!input.trim()} style={{background:"#C8102E",color:"white",border:"none",borderRadius:"50%",width:"44px",height:"44px",cursor:"pointer",fontSize:"18px"}}>➤</button>
      </div>
    </div>
  );
}

function Dashboard(){
  const [tickets,setTickets]=useState([]);
  const [timeEntries,setTimeEntries]=useState([]);
  const [hoursByClient,setHoursByClient]=useState([]);
  const [hoursByUser,setHoursByUser]=useState([]);
  const [unsyncedTickets,setUnsyncedTickets]=useState([]);
  const [syncLoading,setSyncLoading]=useState(false);
  const [syncLogs,setSyncLogs]=useState([]);
  const [activeTab,setActiveTab]=useState("global");
  const [comparison,setComparison]=useState([]);
  const [filterType,setFilterType]=useState("ALL");
  const [filterGroup,setFilterGroup]=useState("ALL");
  const [filterClient,setFilterClient]=useState("ALL");
  const [ticketPage,setTicketPage]=useState(1);
  const [saasPage,setSaasPage]=useState(1);
  const [onpremPage,setOnpremPage]=useState(1);
  const [unsyncedPage,setUnsyncedPage]=useState(1);
  const [aiLoading,setAiLoading]=useState(false);
  const [aiPredictions,setAiPredictions]=useState(null);
  const [aiAnomalies,setAiAnomalies]=useState(null);
  const [aiForecast,setAiForecast]=useState(null);
  const [aiError,setAiError]=useState("");
  const [aiEstimation,setAiEstimation]=useState(null);
  const [showChatbot,setShowChatbot]=useState(false);
  const [allOnPremTickets,setAllOnPremTickets]=useState([]);
  const [editEntry,setEditEntry]=useState(null);
  const [editForm,setEditForm]=useState({hours_logged:"",slot_start:"",slot_end:"",date:""});
  const currentUser=JSON.parse(localStorage.getItem("user")||"{}");

  // CROSS-FILTER STATE
  const [selectedClient,setSelectedClient]=useState(null);
  const [selectedGroup,setSelectedGroup]=useState(null);

  const handleSelectClient=useCallback((client)=>{
    setSelectedClient(prev=>prev===client?null:client);
    setSelectedGroup(null);
  },[]);
  const handleSelectGroup=useCallback((group)=>{
    setSelectedGroup(prev=>prev===group?null:group);
    setSelectedClient(null);
  },[]);
  const clearFilter=useCallback(()=>{ setSelectedClient(null); setSelectedGroup(null); },[]);
  const activeFilter=selectedClient||selectedGroup;
  const filterIsGroup=!!selectedGroup;

  useEffect(()=>{
    API.get("/tickets").then(r=>setTickets(r.data)).catch(console.error);
    API.get("/time-entries").then(r=>setTimeEntries(r.data)).catch(console.error);
    API.get("/time-entries/stats").then(r=>setHoursByClient(r.data)).catch(console.error);
    API.get("/time-entries/stats/user").then(r=>setHoursByUser(r.data)).catch(console.error);
    API.get("/tickets/unsynced").then(r=>setUnsyncedTickets(r.data)).catch(console.error);
    API.get("/tickets/onprem/all").then(r=>setAllOnPremTickets(r.data)).catch(console.error);
    API.get("/tickets").then(tr=>API.get("/time-entries/stats").then(sr=>{
      const tix=tr.data,stats=sr.data,byC={};
      tix.filter(t=>t.ticket_type==="SAAS").forEach(t=>{const c=t.client_name||"?";if(!byC[c])byC[c]={client:c,jira_tickets:0,jira_hours:0,chronos_hours:0};byC[c].jira_tickets++;byC[c].jira_hours+=0.25;});
      stats.forEach(s=>{const c=s.name||"?";if(!byC[c])byC[c]={client:c,jira_tickets:0,jira_hours:0,chronos_hours:0};byC[c].chronos_hours+=parseFloat(s.total_hours||0);});
      setComparison(Object.values(byC).map(c=>({...c,jira_tickets:Math.round(c.jira_hours/0.25),ecart:(c.chronos_hours-c.jira_hours).toFixed(2),jira_hours:c.jira_hours.toFixed(2),chronos_hours:c.chronos_hours.toFixed(2)})));
    })).catch(console.error);
  },[]);

  const handleSmartSync=async()=>{
    setSyncLoading(true);setSyncLogs([]);
    try{
      const token=localStorage.getItem("token");
      const res=await fetch("http://localhost:5000/api/smart-sync",{method:"POST",headers:{"Content-Type":"application/json","Authorization":`Bearer ${token}`}});
      const data=await res.json();
      setSyncLogs([`✅ Terminée !`,`📥 Insérés: ${data.inserted||0}`,`☁️ SaaS: ${data.saasInserted||0}`,`🖥️ OnPrem: ${data.onPremInserted||0}`,`⏭️ Ignorés: ${data.skipped||0}`]);
      API.get("/tickets").then(r=>setTickets(r.data));
      API.get("/time-entries").then(r=>setTimeEntries(r.data));
      API.get("/tickets/unsynced").then(r=>setUnsyncedTickets(r.data));
    }catch(err){setSyncLogs(["❌ Erreur: "+err.message]);}
    setSyncLoading(false);
  };

  const callAI=async(ep,setter)=>{setAiLoading(true);setAiError("");try{setter(await(await fetch(`${AI_API}${ep}`)).json());}catch{setAiError("⚠️ API IA non disponible !");}setAiLoading(false);};
  const handleDeleteEntry=async(id)=>{if(!window.confirm("Supprimer ?"))return;try{await fetch(`http://localhost:5000/api/time-entries/${id}`,{method:"DELETE",headers:{"Authorization":`Bearer ${localStorage.getItem("token")}`}});setTimeEntries(p=>p.filter(e=>e.id!==id));}catch{alert("Erreur");}};
  const handleEditEntry=(e)=>{setEditEntry(e);setEditForm({hours_logged:e.hours_logged,slot_start:e.slot_start,slot_end:e.slot_end,date:e.date?e.date.toString().slice(0,10):""});};
  const handleUpdateEntry=async()=>{try{await fetch(`http://localhost:5000/api/time-entries/${editEntry.id}`,{method:"PUT",headers:{"Content-Type":"application/json","Authorization":`Bearer ${localStorage.getItem("token")}`},body:JSON.stringify(editForm)});setTimeEntries(p=>p.map(e=>e.id===editEntry.id?{...e,...editForm}:e));setEditEntry(null);}catch{alert("Erreur");}};
  const handleLogout=()=>{localStorage.removeItem("token");localStorage.removeItem("role");localStorage.removeItem("user");window.location.reload();};

  // DATA
  const saasTickets=tickets.filter(t=>t.ticket_type==="SAAS");
  const cfSaasTickets=selectedClient?saasTickets.filter(t=>t.client_name===selectedClient):saasTickets;
  const cfOnPremTickets=selectedGroup?allOnPremTickets.filter(t=>t.group_name===selectedGroup):allOnPremTickets;
  const cfTimeEntries=activeFilter?timeEntries.filter(e=>(e.client_name===activeFilter||e.group_name===activeFilter)):timeEntries;

  const byClient=saasTickets.reduce((a,t)=>{const n=t.client_name||"?";a[n]=(a[n]||0)+1;return a;},{});
  const saasChartData=Object.entries(byClient).map(([client,count])=>({client,tickets:count,heures:count*0.25}));
  const treemapData=Object.entries(byClient).map(([name,value])=>({name,value}));
  const syncRate=tickets.length>0?((tickets.length-unsyncedTickets.length)/tickets.length*100).toFixed(0):"0";

  const onPremPieData=ONPREM_GROUPS.map(g=>({name:g,value:allOnPremTickets.filter(t=>t.group_name===g).length})).filter(d=>d.value>0);
  const comparisonData=[
    {name:"SaaS",tickets:cfSaasTickets.length,heures:cfSaasTickets.length*0.25},
    {name:"On-Prem",tickets:cfOnPremTickets.length,heures:cfOnPremTickets.length*0.25}
  ];
  const radarData=ONPREM_GROUPS.map(g=>({group:g,tickets:allOnPremTickets.filter(t=>t.group_name===g).length,heures:allOnPremTickets.filter(t=>t.group_name===g).length*0.25}));
  const byMonth=Array.from({length:12},(_,i)=>({
    mois:MONTHS[i],
    heures:cfTimeEntries.filter(e=>e.date&&new Date(e.date).getMonth()===i).reduce((a,e)=>a+parseFloat(e.hours_logged||0),0).toFixed(2),
    saas:cfSaasTickets.filter(t=>t.outage_start&&new Date(t.outage_start).getMonth()===i).length,
    onprem:cfOnPremTickets.filter(t=>t.outage_start&&new Date(t.outage_start).getMonth()===i).length
  }));
  const byDate=cfTimeEntries.reduce((a,e)=>{const d=e.date?e.date.toString().slice(0,10):"?";if(d==="?"||d.startsWith("1970"))return a;a[d]=(a[d]||0)+parseFloat(e.hours_logged||0);return a;},{});
  const lineData=Object.entries(byDate).sort().map(([date,heures])=>({date,heures}));
  const clientRules=hoursByClient.filter(s=>parseFloat(s.max_hours_per_week)>0).map(s=>({client:s.name||"?",used:parseFloat(s.total_hours||0),max:parseFloat(s.max_hours_per_week||0)})).sort((a,b)=>(b.used/b.max)-(a.used/a.max));
  const filteredTickets=tickets.filter(t=>{
    if(filterType!=="ALL"&&t.ticket_type!==filterType)return false;
    if(filterClient!=="ALL"&&t.client_name!==filterClient)return false;
    if(filterGroup!=="ALL"&&t.group_name!==filterGroup)return false;
    if(selectedClient&&t.client_name!==selectedClient)return false;
    if(selectedGroup&&t.group_name!==selectedGroup)return false;
    return true;
  });
  const predChartData=aiPredictions?aiPredictions.predictions.slice(0,10).map(p=>({client:p.client,tickets:p.predicted_tickets,heures:p.predicted_hours})):[];
  const anomalyChart=aiAnomalies?Object.entries(aiAnomalies.anomalies.reduce((a,x)=>{a[x.client]=(a[x.client]||0)+1;return a;},{})).map(([client,anomalies])=>({client,anomalies})):[];
  const forecastData=aiForecast?(()=>{const dates=aiForecast.forecast[0]?.predictions.map(p=>p.date)||[];return dates.map((date,i)=>{const o={date};aiForecast.forecast.forEach(c=>{o[c.client]=c.predictions[i]?.tickets||0;});return o;})})():[];
  const saasBulletData=clientRules.slice(0,6).map(r=>({label:r.client,value:r.used,target:r.max*0.8,max:Math.max(r.used*1.2,r.max)}));
  const onpremBulletData=ONPREM_GROUPS.map(g=>({label:g,value:allOnPremTickets.filter(t=>t.group_name===g).length*0.25,target:40,max:50}));
  const paginatedTickets=filteredTickets.slice((ticketPage-1)*PAGE_SIZE,ticketPage*PAGE_SIZE);
  const paginatedSaas=cfSaasTickets.slice((saasPage-1)*PAGE_SIZE,saasPage*PAGE_SIZE);

  const handleBarClick=(data,isGroup=false)=>{
    if(!data||!data.activePayload)return;
    const name=data.activePayload[0]?.payload?.client||data.activePayload[0]?.payload?.group||data.activePayload[0]?.payload?.name;
    if(!name)return;
    if(isGroup) handleSelectGroup(name);
    else handleSelectClient(name);
  };

  return(
    <div style={styles.page}>
      <style>{FLIP_CSS}</style>
      <nav style={styles.navbar}>
        <div style={{display:"flex",alignItems:"center",gap:"12px"}}>
          <img src="/Vermeg_logo.png" alt="Vermeg" style={{height:"45px"}}/>
          <span style={styles.brand}>SOC DASHBOARD</span>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
          <span style={{color:"white",fontSize:"13px"}}>👤 {currentUser.full_name||"User"}</span>
          <button onClick={()=>setShowChatbot(!showChatbot)} style={{background:showChatbot?"#28a745":"rgba(255,255,255,0.2)",color:"white",border:"1px solid rgba(255,255,255,0.5)",padding:"8px 18px",borderRadius:"8px",cursor:"pointer",fontWeight:"bold"}}>🤖 Assistant IA</button>
          <button onClick={handleLogout} style={{background:"rgba(255,255,255,0.15)",color:"white",border:"1px solid rgba(255,255,255,0.5)",padding:"8px 18px",borderRadius:"8px",cursor:"pointer",fontWeight:"bold"}}>Déconnexion</button>
        </div>
      </nav>

      <div style={styles.container}>
        {showChatbot&&<div style={{marginBottom:"25px"}}><Chatbot tickets={tickets} timeEntries={timeEntries} aiPredictions={aiPredictions} aiAnomalies={aiAnomalies}/></div>}

        <CrossFilterBanner selectedClient={selectedClient} selectedGroup={selectedGroup} onClear={clearFilter}/>

        {/* KPI CARDS */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:"15px",marginBottom:"25px"}}>
          {[
            {front:{icon:"🎫",label:"TOTAL TICKETS",value:activeFilter?(filterIsGroup?cfOnPremTickets.length:cfSaasTickets.length):tickets.length,bg:"linear-gradient(135deg,#C8102E,#a00c26)"},back:{bg:"linear-gradient(135deg,#a00c26,#800a1e)",rows:[["☁️ SaaS",cfSaasTickets.length],["🖥️ On-Prem",cfOnPremTickets.length],["⚠️ Non sync",unsyncedTickets.length]]}},
            {front:{icon:"☁️",label:"TICKETS SAAS",value:cfSaasTickets.length,bg:"linear-gradient(135deg,#1a1a2e,#0d0d1a)"},back:{bg:"linear-gradient(135deg,#0d0d1a,#050510)",rows:Object.entries(byClient).sort((a,b)=>b[1]-a[1]).slice(0,3).map(([c,n])=>[`📌 ${c}`,n])}},
            {front:{icon:"🖥️",label:"TICKETS ON-PREM",value:cfOnPremTickets.length,bg:"linear-gradient(135deg,#0f3460,#092540)"},back:{bg:"linear-gradient(135deg,#092540,#061830)",rows:ONPREM_GROUPS.map(g=>[`🖥️ ${g}`,allOnPremTickets.filter(t=>t.group_name===g).length])}},
            {front:{icon:"⚠️",label:"NON SYNCHRONISÉS",value:unsyncedTickets.length,bg:"linear-gradient(135deg,#ff9800,#cc7a00)"},back:{bg:"linear-gradient(135deg,#cc7a00,#995c00)",rows:[["✅ Sync",tickets.length-unsyncedTickets.length],["⏳ Attente",unsyncedTickets.length],["📊 Taux",`${syncRate}%`]]}},
            {front:{icon:"⏱️",label:"HEURES CHRONOS",value:`${cfTimeEntries.reduce((a,e)=>a+parseFloat(e.hours_logged||0),0).toFixed(0)}h`,bg:"linear-gradient(135deg,#28a745,#1e7e34)"},back:{bg:"linear-gradient(135deg,#1e7e34,#155724)",rows:[["☁️ SaaS",`${(cfSaasTickets.length*0.25).toFixed(1)}h`],["🖥️ OnPrem",`${(cfOnPremTickets.length*0.25).toFixed(1)}h`],["📊 Moy","0.25h"]]}}
          ].map((card,i)=>(
            <div key={i} className={`flip-card ${activeFilter?"cf-active":""}`}>
              <div className="flip-card-inner">
                <div className="flip-card-front" style={{background:card.front.bg,color:"white"}}>
                  <div style={{fontSize:"28px",marginBottom:"4px"}}>{card.front.icon}</div>
                  <div style={{fontSize:"11px",opacity:0.9}}>{card.front.label}</div>
                  <div style={{fontSize:"34px",fontWeight:"bold"}}>{card.front.value}</div>
                  {activeFilter&&<div style={{fontSize:"9px",background:"rgba(255,255,255,0.2)",padding:"2px 8px",borderRadius:"10px",marginTop:"4px"}}>🎯 {activeFilter}</div>}
                  <div style={{fontSize:"10px",opacity:0.6,marginTop:"4px"}}>Survoler →</div>
                </div>
                <div className="flip-card-back" style={{background:card.back.bg,color:"white"}}>
                  <div style={{fontSize:"12px",fontWeight:"bold",marginBottom:"8px"}}>📊 DÉTAIL</div>
                  {card.back.rows.map(([label,val],j)=><div key={j} style={{fontSize:"12px"}}>{label} : <strong>{val}</strong></div>)}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* TABS */}
        <div style={{marginBottom:"0",borderBottom:"2px solid #e0e0e0",display:"flex",flexWrap:"wrap"}}>
          {["global","saas","onprem","unsynced","comparison","ai"].map(tab=>(
            <button key={tab} style={styles.tabBtn(activeTab===tab)} onClick={()=>setActiveTab(tab)}>
              {tab==="global"?"🌐 Vue Globale":tab==="saas"?"☁️ Vue SaaS":tab==="onprem"?"🖥️ Vue On-Prem":tab==="unsynced"?"⚠️ Non Synchronisés":tab==="comparison"?"📊 Jira vs Chronos":"🤖 IA & Analytics"}
            </button>
          ))}
        </div>

        <div style={{background:"white",borderRadius:"0 12px 12px 12px",padding:"25px",marginBottom:"20px",boxShadow:"0 4px 20px rgba(0,0,0,0.08)"}}>

          {/* ═══ VUE GLOBALE ═══ */}
          {activeTab==="global"&&(
            <div>
              {/* Smart Sync */}
              <div style={{display:"flex",alignItems:"center",gap:"15px",marginBottom:"25px",padding:"15px",background:"linear-gradient(135deg,#f8f9fa,#e8edf2)",borderRadius:"12px",border:"1px solid #e0e0e0"}}>
                <button onClick={handleSmartSync} disabled={syncLoading} style={{...styles.btn(syncLoading?"#ccc":"#C8102E"),fontSize:"15px",padding:"12px 28px"}}>{syncLoading?"⏳ Synchronisation...":"🧠 Smart Sync"}</button>
                <div style={{flex:1}}>
                  {syncLogs.length>0?<div style={{display:"flex",flexWrap:"wrap",gap:"8px"}}>{syncLogs.map((log,i)=><span key={i} style={{padding:"4px 12px",background:log.startsWith("❌")?"#fff0f0":"#f0fff4",border:`1px solid ${log.startsWith("❌")?"#C8102E":"#28a745"}`,borderRadius:"20px",fontSize:"13px",color:log.startsWith("❌")?"#C8102E":"#28a745",fontWeight:"bold"}}>{log}</span>)}</div>:<span style={{color:"#999",fontSize:"13px"}}>Synchronise automatiquement les tickets Jira vers Chronos</span>}
                </div>
              </div>

              <div style={{background:"#f0f7ff",border:"1px solid #7AAFD4",borderRadius:"8px",padding:"10px 16px",marginBottom:"18px",fontSize:"13px",color:"#0f3460"}}>
                💡 <strong>Cross-filtering actif</strong> — Clique sur un client dans le <strong>Top 5</strong> ou la <strong>Fidélisation IA</strong> pour filtrer tous les visuels.
              </div>

              {/* Row 1: Répartition Globale + Synchronisation */}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"20px",marginBottom:"25px"}}>
                <div>
                  <div style={styles.cardTitle}>📊 Répartition Globale — SaaS vs On-Prem
                    {activeFilter&&<span style={{fontSize:"11px",color:"#C8102E",fontWeight:"normal",marginLeft:"6px"}}>— {activeFilter}</span>}
                  </div>
                  <ResponsiveContainer width="100%" height={230}>
                    <BarChart data={comparisonData} barGap={8} onClick={d=>handleBarClick(d,false)}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
                      <XAxis dataKey="name" stroke="#666"/><YAxis stroke="#666"/>
                      <Tooltip contentStyle={{borderRadius:"8px"}}/><Legend/>
                      <Bar dataKey="tickets" fill="#C8102E" radius={[6,6,0,0]} name="Tickets" style={{cursor:"pointer"}}/>
                      <Bar dataKey="heures" fill="#0f3460" radius={[6,6,0,0]} name="Heures" style={{cursor:"pointer"}}/>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div>
                  <div style={styles.cardTitle}>✅ Synchronisation Chronos — {syncRate}% complété</div>
                  {/* KPI instead of always-100% donut */}
                  <div style={{display:"flex",flexDirection:"column",gap:"15px",padding:"20px"}}>
                    <div style={{background:"linear-gradient(135deg,#28a745,#1e7e34)",borderRadius:"12px",padding:"20px",textAlign:"center",color:"white"}}>
                      <div style={{fontSize:"42px",fontWeight:"bold"}}>{syncRate}%</div>
                      <div style={{fontSize:"13px",opacity:0.9}}>Tickets synchronisés dans Chronos</div>
                    </div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px"}}>
                      <div style={{background:"#f0fff4",border:"2px solid #28a745",borderRadius:"10px",padding:"12px",textAlign:"center"}}>
                        <div style={{fontSize:"22px",fontWeight:"bold",color:"#28a745"}}>{tickets.length-unsyncedTickets.length}</div>
                        <div style={{fontSize:"11px",color:"#666"}}>✅ Synchronisés</div>
                      </div>
                      <div style={{background:"#fffbf0",border:"2px solid #ff9800",borderRadius:"10px",padding:"12px",textAlign:"center"}}>
                        <div style={{fontSize:"22px",fontWeight:"bold",color:"#ff9800"}}>{unsyncedTickets.length}</div>
                        <div style={{fontSize:"11px",color:"#666"}}>⏳ En attente</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Row 2: Top 5 Clients + Top 5 Users */}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"20px",marginBottom:"25px"}}>
                <div>
                  <div style={styles.cardTitle}>🏆 Clients les Plus Actifs — Top 5 <span style={{fontSize:"11px",color:"#999",fontWeight:"normal"}}>(clic pour filtrer)</span></div>
                  <ResponsiveContainer width="100%" height={210}>
                    <BarChart
                      data={Object.entries(byClient).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([client,tickets])=>({client,tickets,heures:(tickets*0.25).toFixed(2)}))}
                      layout="vertical" margin={{right:50}}
                      onClick={d=>{const c=d?.activePayload?.[0]?.payload?.client;if(c) handleSelectClient(c===selectedClient?null:c);}}
                      style={{cursor:"pointer"}}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
                      <XAxis type="number" stroke="#666" fontSize={11}/><YAxis dataKey="client" type="category" stroke="#666" width={60} fontSize={11}/>
                      <Tooltip contentStyle={{borderRadius:"8px"}} formatter={(v,n)=>[n==="Tickets"?v:`${v}h`,n]}/>
                      <Bar dataKey="tickets" name="Tickets" radius={[0,6,6,0]} label={<CustomBarLabel/>}>
                        {Object.entries(byClient).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([client],i)=>(
                          <Cell key={i} fill={COLORS[i%COLORS.length]} opacity={selectedClient&&selectedClient!==client?0.2:1} style={{cursor:"pointer",transition:"opacity 0.2s"}}/>
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div>
                  <div style={styles.cardTitle}>👥 Membres les Plus Actifs — Top 5</div>
                  <ResponsiveContainer width="100%" height={210}>
                    <BarChart
                      data={[...hoursByUser].sort((a,b)=>parseFloat(b.total_hours||0)-parseFloat(a.total_hours||0)).slice(0,5).map(u=>({name:u.full_name?.split(" ")[0],heures:parseFloat(u.total_hours||0).toFixed(1),tickets:u.total_tickets}))}
                      layout="vertical" margin={{right:50}}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
                      <XAxis type="number" stroke="#666" fontSize={11}/><YAxis dataKey="name" type="category" stroke="#666" width={70} fontSize={11}/>
                      <Tooltip contentStyle={{borderRadius:"8px"}}/>
                      <Bar dataKey="heures" name="Heures" radius={[0,6,6,0]} label={<CustomBarLabel/>}>
                        {[...hoursByUser].sort((a,b)=>parseFloat(b.total_hours||0)-parseFloat(a.total_hours||0)).slice(0,5).map((_,i)=>(
                          <Cell key={i} fill={COLORS[i%COLORS.length]}/>
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Activité Mensuelle */}
              <div style={styles.cardTitle}>
                📅 Activité Mensuelle — Tickets & Heures
                {activeFilter?<span style={{fontSize:"12px",color:"#C8102E",fontWeight:"normal"}}> — {activeFilter}</span>:""}
              </div>
              <ResponsiveContainer width="100%" height={260}>
                <ComposedChart data={byMonth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
                  <XAxis dataKey="mois" stroke="#666" fontSize={11}/><YAxis stroke="#666"/>
                  <Tooltip contentStyle={{borderRadius:"8px"}}/><Legend/>
                  <Bar dataKey="saas" fill="#C8102E" radius={[4,4,0,0]} name="Tickets SaaS" onClick={d=>{const c=d?.client;if(c)handleSelectClient(c);}}/>
                  <Bar dataKey="onprem" fill="#0f3460" radius={[4,4,0,0]} name="Tickets On-Prem"/>
                  <Line type="monotone" dataKey="heures" stroke="#28a745" strokeWidth={2.5} dot={{r:3}} name="Heures Chronos"/>
                </ComposedChart>
              </ResponsiveContainer>

              {/* Heatmap */}
              <div style={{...styles.card,marginTop:"25px"}}>
                <div style={styles.cardTitle}>
                  🌡️ Distribution Horaire de l'Activité SOC
                  {activeFilter&&<span style={{fontSize:"12px",color:"#C8102E",fontWeight:"normal",marginLeft:"8px"}}>— {activeFilter}</span>}
                </div>
                <p style={{fontSize:"12px",color:"#888",marginBottom:"14px",marginTop:"-8px"}}>
                  Répartition des entrées Chronos par jour de la semaine et par heure — {activeFilter?`filtré sur ${activeFilter}`:"toute l'équipe"}
                </p>
                <ActivityHeatmap timeEntries={timeEntries} selectedClient={activeFilter} onSelectClient={handleSelectClient}/>
              </div>

              {/* Jauges membres */}
              <div style={{...styles.cardTitle,marginTop:"25px"}}>👥 Charge de Travail par Membre SOC</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:"15px",marginBottom:"25px"}}>
                {hoursByUser.map(u=>{
                  const used=parseFloat(u.total_hours||0),max=parseFloat(u.max_hours_per_week||40);
                  const pct=Math.min((used/max)*100,100);
                  const color=pct>80?"#C8102E":pct>50?"#ff9800":"#28a745";
                  return(
                    <div key={u.user_id} style={{background:pct>=100?"#fff5f5":pct>=50?"#fffbf0":"#f0fff4",borderRadius:"12px",padding:"15px",boxShadow:"0 4px 15px rgba(0,0,0,0.08)",border:`2px solid ${color}`,textAlign:"center"}}>
                      <div style={{fontSize:"28px",marginBottom:"6px"}}>👤</div>
                      <div style={{fontWeight:"bold",fontSize:"13px",color:"#1a1a2e",marginBottom:"10px"}}>{u.full_name}</div>
                      <div style={{fontSize:"26px",fontWeight:"bold",color}}>{used.toFixed(2)}h</div>
                      <div style={{fontSize:"11px",color:"#666"}}>/ {max}h max</div>
                      <div style={{height:"6px",background:"#e0e0e0",borderRadius:"3px",margin:"8px 0"}}>
                        <div style={{height:"6px",background:color,borderRadius:"3px",width:`${pct}%`,transition:"width 0.5s"}}/>
                      </div>
                      <div style={{fontSize:"12px",color,fontWeight:"bold"}}>{pct>=100?"⚠️ Dépassé":`${pct.toFixed(0)}%`}</div>
                      <div style={{display:"flex",justifyContent:"space-around",marginTop:"8px",paddingTop:"8px",borderTop:"1px solid #e0e0e0"}}>
                        <div style={{textAlign:"center"}}><div style={{fontSize:"13px",fontWeight:"bold",color:"#C8102E"}}>{parseFloat(u.saas_hours||0).toFixed(2)}h</div><div style={{fontSize:"10px",color:"#999"}}>SaaS</div></div>
                        <div style={{textAlign:"center"}}><div style={{fontSize:"13px",fontWeight:"bold",color:"#0f3460"}}>{parseFloat(u.onprem_hours||0).toFixed(2)}h</div><div style={{fontSize:"10px",color:"#999"}}>OnPrem</div></div>
                        <div style={{textAlign:"center"}}><div style={{fontSize:"13px",fontWeight:"bold",color:"#28a745"}}>{u.total_tickets}</div><div style={{fontSize:"10px",color:"#999"}}>Tickets</div></div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Charge de Travail Quotidienne */}
              <div style={styles.cardTitle}>
                📈 Charge de Travail Quotidienne
                {activeFilter&&<span style={{fontSize:"12px",color:"#C8102E",fontWeight:"normal",marginLeft:"8px"}}>— {activeFilter}</span>}
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={lineData}>
                  <defs><linearGradient id="cH" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#C8102E" stopOpacity={0.3}/><stop offset="95%" stopColor="#C8102E" stopOpacity={0.02}/></linearGradient></defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
                  <XAxis dataKey="date" stroke="#666" fontSize={11}/><YAxis stroke="#666"/>
                  <Tooltip contentStyle={{borderRadius:"8px"}} formatter={v=>[`${parseFloat(v).toFixed(2)}h`,"Heures"]}/>
                  <Area type="monotone" dataKey="heures" stroke="#C8102E" strokeWidth={2.5} fill="url(#cH)" dot={{fill:"#C8102E",r:3}} name="Heures"/>
                </AreaChart>
              </ResponsiveContainer>

              {/* Analyse de Risque Clients */}
              <div style={{marginTop:"25px"}}>
                <ClientRetentionAI tickets={tickets} hoursByClient={hoursByClient} clientRules={clientRules} selectedClient={selectedClient} onSelectClient={handleSelectClient}/>
              </div>
            </div>
          )}

          {/* ═══ VUE SAAS ═══ */}
          {activeTab==="saas"&&(
            <div>
              <div style={{background:"#f0f7ff",border:"1px solid #7AAFD4",borderRadius:"8px",padding:"8px 14px",marginBottom:"16px",fontSize:"12px",color:"#0f3460"}}>
                💡 Clique sur un client dans les graphiques pour filtrer tous les visuels SaaS.
              </div>

              {/* Top 5 + Treemap */}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"20px",marginBottom:"20px"}}>
                <div>
                  <div style={styles.cardTitle}>🏆 Clients les Plus Actifs — Top 5 SaaS <span style={{fontSize:"11px",color:"#999",fontWeight:"normal"}}>(clic = filtre)</span></div>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={Object.entries(byClient).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([client,tickets])=>({client,tickets}))} layout="vertical" margin={{right:60}} onClick={d=>handleBarClick(d,false)}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
                      <XAxis type="number" stroke="#666"/><YAxis dataKey="client" type="category" stroke="#666" width={60} fontSize={11}/>
                      <Tooltip contentStyle={{borderRadius:"8px"}}/>
                      <Bar dataKey="tickets" name="Tickets" radius={[0,6,6,0]} label={<CustomBarLabel/>}>
                        {Object.entries(byClient).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([client],i)=>(
                          <Cell key={i} fill={COLORS[i%COLORS.length]} opacity={selectedClient&&selectedClient!==client?0.25:1} style={{cursor:"pointer"}}/>
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div>
                  <div style={styles.cardTitle}>🌳 Volume de Tickets par Client SaaS <span style={{fontSize:"11px",color:"#999",fontWeight:"normal"}}>(clic = filtre)</span></div>
                  <ResponsiveContainer width="100%" height={250}>
                    <Treemap data={treemapData} dataKey="value" nameKey="name"
                      content={<TreemapContent selectedClient={selectedClient} onSelectClient={handleSelectClient}/>}/>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Donut + Bar */}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"20px",marginBottom:"20px"}}>
                <div>
                  <div style={styles.cardTitle}>🍩 Distribution des Tickets SaaS <span style={{fontSize:"11px",color:"#999",fontWeight:"normal"}}>(clic = filtre)</span></div>
                  <ResponsiveContainer width="100%" height={250}>
                    <ClickablePie data={Object.entries(byClient).map(([n,v])=>({name:n,value:v})).sort((a,b)=>b.value-a.value).slice(0,8)} dataKey="value" nameKey="name" colors={COLORS} selectedClient={selectedClient} onSelectClient={handleSelectClient}/>
                  </ResponsiveContainer>
                </div>
                <div>
                  <div style={styles.cardTitle}>📊 Tous les Clients SaaS <span style={{fontSize:"11px",color:"#999",fontWeight:"normal"}}>(clic = filtre)</span></div>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={saasChartData.sort((a,b)=>b.tickets-a.tickets)} layout="vertical" onClick={d=>handleBarClick(d,false)}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
                      <XAxis type="number" stroke="#666"/><YAxis dataKey="client" type="category" stroke="#666" width={55} fontSize={10}/>
                      <Tooltip contentStyle={{borderRadius:"8px"}}/>
                      <Bar dataKey="tickets" fill="#C8102E" radius={[0,6,6,0]} name="Tickets">
                        {saasChartData.map(({client},i)=>(
                          <Cell key={i} fill={COLORS[i%COLORS.length]} opacity={selectedClient&&selectedClient!==client?0.25:1} style={{cursor:"pointer"}}/>
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Bullet Chart */}
              <div style={styles.card}>
                <BulletChart data={saasBulletData} title="🎯 Performance Clients SaaS vs Objectifs Contractuels" colorScheme="red" selectedClient={selectedClient} onSelectClient={handleSelectClient}/>
              </div>

              {/* Jauges */}
              <div style={styles.cardTitle}>🎯 Consommation Horaire vs Limite Contractuelle
                {selectedClient&&<span style={{fontSize:"12px",color:"#C8102E",fontWeight:"normal",marginLeft:"8px"}}>— {selectedClient}</span>}
              </div>
              {clientRules.filter(r=>r.used>=r.max).length>0&&<div style={{background:"#fff0f0",border:"1px solid #C8102E",borderRadius:"10px",padding:"10px 15px",marginBottom:"15px"}}><span style={{color:"#C8102E",fontWeight:"bold",fontSize:"13px"}}>⚠️ Dépassements : {clientRules.filter(r=>r.used>=r.max).map(r=>r.client).join(", ")}</span></div>}
              <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:"15px",marginBottom:"25px"}}>
                {clientRules.map(rule=>{
                  const pct=rule.used/rule.max;
                  const bc=pct>=1?"#C8102E":pct>=0.5?"#ff9800":"#28a745";
                  const isSelected=selectedClient===rule.client;
                  const isDimmed=selectedClient&&!isSelected;
                  return(
                    <div key={rule.client} onClick={()=>handleSelectClient(rule.client===selectedClient?null:rule.client)}
                      style={{background:isDimmed?"#f8f8f8":pct>=1?"#fff5f5":pct>=0.5?"#fffbf0":"#f0fff4",borderRadius:"12px",padding:"10px",boxShadow:isSelected?"0 0 0 3px #1a1a2e,0 4px 12px rgba(0,0,0,0.1)":"0 4px 12px rgba(0,0,0,0.06)",border:`2px solid ${isSelected?"#1a1a2e":isDimmed?"#e0e0e0":bc}`,display:"flex",flexDirection:"column",alignItems:"center",cursor:"pointer",opacity:isDimmed?0.25:1,transition:"all 0.2s"}}>
                      <Gauge value={rule.used.toFixed(2)} max={rule.max} label={rule.client}/>
                    </div>
                  );
                })}
              </div>

              {/* Table SaaS avec statut */}
              <div style={styles.cardTitle}>🎫 Tickets SaaS ({cfSaasTickets.length}){selectedClient&&<span style={{fontSize:"12px",color:"#C8102E",fontWeight:"normal",marginLeft:"8px"}}>— {selectedClient}</span>}</div>
              <table style={styles.table}>
                <thead><tr><th style={styles.th}>Jira Key</th><th style={styles.th}>Résumé</th><th style={styles.th}>Client</th><th style={styles.th}>Date</th><th style={styles.th}>Statut Limite</th></tr></thead>
                <tbody>{paginatedSaas.map((t,i)=>{
                  const rule=clientRules.find(r=>r.client===t.client_name);
                  const clientTickets=cfSaasTickets.filter(t2=>t2.client_name===t.client_name);
                  const idx=clientTickets.findIndex(t2=>t2.id===t.id);
                  const heuresApres=(idx+1)*0.25;
                  const heuresAvant=idx*0.25;
                  const depasse=rule&&heuresApres>rule.max;
                  const estCause=rule&&heuresAvant<=rule.max&&heuresApres>rule.max;
                  return(
                    <tr key={t.id} style={{background:depasse?"#fff5f5":i%2===0?"white":"#fafafa"}}>
                      <td style={styles.td}><span style={styles.badge("#C8102E")}>{t.jira_key}</span></td>
                      <td style={styles.td}>{t.summary?.substring(0,60)}...</td>
                      <td style={styles.td}><span style={styles.badge("#1a1a2e")}>{t.client_name||"—"}</span></td>
                      <td style={styles.td}>{t.outage_start?new Date(t.outage_start).toLocaleDateString():"—"}</td>
                      <td style={styles.td}>
                        {rule?(estCause?<span style={styles.badge("#ff9800")}>⚠️ Seuil dépassé ici</span>:depasse?<span style={styles.badge("#C8102E")}>🔴 Au-delà limite</span>:<span style={styles.badge("#28a745")}>✅ OK</span>):<span style={styles.badge("#6c757d")}>— Pas de règle</span>}
                      </td>
                    </tr>
                  );
                })}</tbody>
              </table>
              <Pagination total={cfSaasTickets.length} page={saasPage} onPage={setSaasPage}/>
            </div>
          )}

          {/* ═══ VUE ON-PREM ═══ */}
          {activeTab==="onprem"&&(
            <div>
              <div style={{background:"#f0f7ff",border:"1px solid #7AAFD4",borderRadius:"8px",padding:"8px 14px",marginBottom:"16px",fontSize:"12px",color:"#0f3460"}}>
                💡 Clique sur un groupe dans les graphiques pour filtrer tous les visuels On-Prem.
              </div>

              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"20px",marginBottom:"20px"}}>
                <div>
                  <div style={styles.cardTitle}>🕸️ Performance par Groupe On-Prem <span style={{fontSize:"11px",color:"#999",fontWeight:"normal"}}>(clic = filtre)</span></div>
                  <ResponsiveContainer width="100%" height={280}>
                    <RadarChart cx="50%" cy="50%" outerRadius={100} data={radarData}
                      onClick={d=>{if(d?.activePayload){const g=d.activePayload[0]?.payload?.group;if(g) handleSelectGroup(g===selectedGroup?null:g);}}}>
                      <PolarGrid stroke="#e0e0e0"/>
                      <PolarAngleAxis dataKey="group" tick={{fontSize:13,fontWeight:"bold",fill:"#1a1a2e"}} style={{cursor:"pointer"}}/>
                      <PolarRadiusAxis angle={90} tick={{fontSize:10}}/>
                      <Radar name="Tickets" dataKey="tickets" stroke="#C8102E" fill="#C8102E" fillOpacity={0.3} strokeWidth={2}/>
                      <Radar name="Heures" dataKey="heures" stroke="#0f3460" fill="#0f3460" fillOpacity={0.2} strokeWidth={2}/>
                      <Legend/><Tooltip contentStyle={{borderRadius:"8px"}}/>
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
                <div>
                  <div style={styles.cardTitle}>🍩 Distribution des Tickets On-Prem <span style={{fontSize:"11px",color:"#999",fontWeight:"normal"}}>(clic = filtre)</span></div>
                  <ResponsiveContainer width="100%" height={280}>
                    <ClickablePie data={onPremPieData} dataKey="value" nameKey="name" colors={ONPREM_COLORS} selectedClient={selectedGroup} onSelectClient={handleSelectGroup} innerRadius={70} outerRadius={110}/>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Bullet OnPrem */}
              <div style={styles.card}>
                <BulletChart data={onpremBulletData} title="🎯 Performance Groupes On-Prem vs Objectifs" colorScheme="blue" selectedClient={selectedGroup} onSelectClient={handleSelectGroup}/>
              </div>

              <div style={styles.cardTitle}>📊 Charge de Travail par Groupe On-Prem <span style={{fontSize:"11px",color:"#999",fontWeight:"normal"}}>(clic = filtre)</span></div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart
                  data={ONPREM_GROUPS.map(g=>({group:g,tickets:allOnPremTickets.filter(t=>t.group_name===g).length,heures:allOnPremTickets.filter(t=>t.group_name===g).length*0.25}))}
                  onClick={d=>{const g=d?.activePayload?.[0]?.payload?.group;if(g) handleSelectGroup(g===selectedGroup?null:g);}}
                  style={{cursor:"pointer"}}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
                  <XAxis dataKey="group" stroke="#666"/><YAxis stroke="#666"/>
                  <Tooltip contentStyle={{borderRadius:"8px"}}/><Legend/>
                  <Bar dataKey="tickets" fill="#0f3460" radius={[6,6,0,0]} name="Tickets">
                    {ONPREM_GROUPS.map((g,i)=>(<Cell key={i} fill={ONPREM_COLORS[i%ONPREM_COLORS.length]} opacity={selectedGroup&&selectedGroup!==g?0.2:1} style={{cursor:"pointer",transition:"opacity 0.2s"}}/>))}
                  </Bar>
                  <Bar dataKey="heures" fill="#C8102E" radius={[6,6,0,0]} name="Heures">
                    {ONPREM_GROUPS.map((g,i)=>(<Cell key={i} fill="#C8102E" opacity={selectedGroup&&selectedGroup!==g?0.2:1} style={{cursor:"pointer",transition:"opacity 0.2s"}}/>))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>

              {/* Jauges groupe */}
              <div style={{...styles.cardTitle,marginTop:"20px"}}>🎯 Consommation Horaire par Groupe
                {selectedGroup&&<span style={{fontSize:"12px",color:"#C8102E",fontWeight:"normal",marginLeft:"8px"}}>— {selectedGroup}</span>}
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:"15px",marginBottom:"25px"}}>
                {ONPREM_GROUPS.map((group,gi)=>{
                  const gT=allOnPremTickets.filter(t=>t.group_name===group).length;
                  const gH=gT*0.25,max=50;
                  const pct=Math.min((gH/max)*100,100);
                  const color=pct>80?"#C8102E":pct>50?"#ff9800":"#0f3460";
                  const isSelected=selectedGroup===group; const isDimmed=selectedGroup&&!isSelected;
                  return(
                    <div key={group} onClick={()=>handleSelectGroup(group===selectedGroup?null:group)}
                      style={{background:isDimmed?"#f8f8f8":"white",borderRadius:"12px",padding:"15px",boxShadow:isSelected?"0 0 0 3px #1a1a2e,0 4px 15px rgba(0,0,0,0.1)":"0 4px 15px rgba(0,0,0,0.08)",border:`2px solid ${isSelected?"#1a1a2e":isDimmed?"#e0e0e0":color}`,textAlign:"center",cursor:"pointer",opacity:isDimmed?0.25:1,transition:"all 0.2s",transform:isSelected?"scale(1.04)":"scale(1)"}}>
                      <div style={{fontSize:"24px",marginBottom:"6px"}}>🖥️</div>
                      <div style={{fontWeight:"bold",fontSize:"15px",color:isSelected?"#C8102E":"#1a1a2e",marginBottom:"8px"}}>{isSelected?"🎯 ":""}{group}</div>
                      <div style={{fontSize:"26px",fontWeight:"bold",color}}>{gH.toFixed(2)}h</div>
                      <div style={{fontSize:"11px",color:"#666"}}>/ {max}h max</div>
                      <div style={{height:"6px",background:"#e0e0e0",borderRadius:"3px",margin:"8px 0"}}>
                        <div style={{height:"6px",background:color,borderRadius:"3px",width:`${pct}%`}}/>
                      </div>
                      <div style={{fontSize:"12px",color:"#666"}}>{gT} tickets</div>
                    </div>
                  );
                })}
              </div>

              {/* Table OnPrem */}
              <div style={styles.cardTitle}>🎫 Tickets On-Prem ({cfOnPremTickets.length}){selectedGroup&&<span style={{fontSize:"12px",color:"#C8102E",fontWeight:"normal",marginLeft:"8px"}}>— {selectedGroup}</span>}</div>
              <table style={styles.table}>
                <thead><tr><th style={styles.th}>Jira Key</th><th style={styles.th}>Résumé</th><th style={styles.th}>Groupe</th><th style={styles.th}>Assigné à</th><th style={styles.th}>Date</th></tr></thead>
                <tbody>{cfOnPremTickets.slice((onpremPage-1)*PAGE_SIZE,onpremPage*PAGE_SIZE).map((t,i)=>(<tr key={t.id} style={{background:i%2===0?"white":"#fafafa"}}><td style={styles.td}><span style={styles.badge("#0f3460")}>{t.jira_key}</span></td><td style={styles.td}>{t.summary?.substring(0,60)}...</td><td style={styles.td}><span style={styles.badge("#1a1a2e")}>{t.group_name||"GIS"}</span></td><td style={styles.td}><span style={styles.badge("#666")}>{t.assignee_name||"—"}</span></td><td style={styles.td}>{t.outage_start?new Date(t.outage_start).toLocaleDateString():"—"}</td></tr>))}</tbody>
              </table>
              <Pagination total={cfOnPremTickets.length} page={onpremPage} onPage={setOnpremPage}/>
            </div>
          )}

          {/* ═══ VUE NON SYNCHRONISÉS ═══ */}
          {activeTab==="unsynced"&&(
            <div>
              <div style={styles.cardTitle}>⚠️ Tickets Non Synchronisés ({unsyncedTickets.length})</div>
              {unsyncedTickets.length===0?(
                <div style={{textAlign:"center",padding:"40px",color:"#28a745"}}><div style={{fontSize:"64px"}}>✅</div><div style={{fontSize:"18px",fontWeight:"bold"}}>Tous les tickets sont synchronisés !</div></div>
              ):(
                <>
                  <table style={styles.table}>
                    <thead><tr><th style={styles.th}>Jira Key</th><th style={styles.th}>Résumé</th><th style={styles.th}>Client</th><th style={styles.th}>Type</th><th style={styles.th}>Date</th></tr></thead>
                    <tbody>{unsyncedTickets.slice((unsyncedPage-1)*PAGE_SIZE,unsyncedPage*PAGE_SIZE).map((t,i)=>(<tr key={t.id} style={{background:i%2===0?"#fff5f5":"#fff0f0"}}><td style={styles.td}><span style={styles.badge("#ff9800")}>{t.jira_key}</span></td><td style={styles.td}>{t.summary?.substring(0,60)}...</td><td style={styles.td}><span style={styles.badge("#1a1a2e")}>{t.client_name||"—"}</span></td><td style={styles.td}><span style={styles.badge(t.ticket_type==="SAAS"?"#C8102E":"#0f3460")}>{t.ticket_type}</span></td><td style={styles.td}>{t.outage_start?new Date(t.outage_start).toLocaleDateString():"—"}</td></tr>))}</tbody>
                  </table>
                  <Pagination total={unsyncedTickets.length} page={unsyncedPage} onPage={setUnsyncedPage}/>
                </>
              )}
            </div>
          )}

          {/* ═══ VUE JIRA VS CHRONOS ═══ */}
          {activeTab==="comparison"&&(
            <div>
              <div style={{background:"linear-gradient(135deg,#1a1a2e,#0f3460)",borderRadius:"12px",padding:"20px",marginBottom:"20px",color:"white",textAlign:"center"}}>
                <div style={{fontSize:"28px"}}>📊</div>
                <div style={{fontSize:"18px",fontWeight:"bold"}}>Analyse des Écarts — Jira vs Chronos</div>
                <div style={{fontSize:"13px",opacity:0.8,marginTop:"6px"}}>Comparaison des heures estimées (Jira) vs heures réelles (Chronos)</div>
              </div>

              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"15px",marginBottom:"20px"}}>
                {[
                  {label:"MES HEURES JIRA",value:`${comparison.filter(c=>!selectedClient||c.client===selectedClient).reduce((a,c)=>a+parseFloat(c.jira_hours),0).toFixed(2)}h`,bg:"#C8102E",icon:"📋"},
                  {label:"MES HEURES CHRONOS",value:`${comparison.filter(c=>!selectedClient||c.client===selectedClient).reduce((a,c)=>a+parseFloat(c.chronos_hours),0).toFixed(2)}h`,bg:"#0f3460",icon:"⏱️"},
                  {label:"ÉCART TOTAL",value:`${comparison.filter(c=>!selectedClient||c.client===selectedClient).reduce((a,c)=>a+parseFloat(c.ecart),0).toFixed(2)}h`,bg:"#ff9800",icon:"📊"}
                ].map((k,i)=>(
                  <div key={i} style={{background:k.bg,borderRadius:"12px",padding:"20px",textAlign:"center",color:"white"}}>
                    <div style={{fontSize:"24px",marginBottom:"6px"}}>{k.icon}</div>
                    <div style={{fontSize:"11px",opacity:0.9,marginBottom:"8px"}}>{k.label}</div>
                    <div style={{fontSize:"32px",fontWeight:"bold"}}>{k.value}</div>
                    {selectedClient&&<div style={{fontSize:"11px",opacity:0.7,marginTop:"4px"}}>🎯 {selectedClient}</div>}
                  </div>
                ))}
              </div>

              <div style={styles.card}>
                <div style={styles.cardTitle}>📉 Analyse des Écarts — Jira vs Chronos <span style={{fontSize:"11px",color:"#999",fontWeight:"normal"}}>(clic = filtre)</span></div>
                <p style={{fontSize:"12px",color:"#888",marginTop:"-8px",marginBottom:"10px"}}>🟠 Sur-déclaré (Chronos {">"} Jira) · 🔴 Sous-déclaré (Chronos {"<"} Jira)</p>
                <WaterfallChart comparison={comparison} selectedClient={selectedClient} onSelectClient={handleSelectClient}/>
              </div>

              <div style={styles.cardTitle}>📊 Comparaison Heures Jira vs Chronos par Client <span style={{fontSize:"11px",color:"#999",fontWeight:"normal"}}>(clic = filtre)</span></div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={comparison} onClick={d=>handleBarClick(d,false)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
                  <XAxis dataKey="client" stroke="#666"/><YAxis stroke="#666"/>
                  <Tooltip contentStyle={{borderRadius:"8px"}}/><Legend/>
                  <Bar dataKey="jira_hours" fill="#C8102E" radius={[6,6,0,0]} name="Heures Jira">
                    {comparison.map(({client},i)=>(<Cell key={i} fill="#C8102E" opacity={selectedClient&&selectedClient!==client?0.25:1} style={{cursor:"pointer"}}/>))}
                  </Bar>
                  <Bar dataKey="chronos_hours" fill="#0f3460" radius={[6,6,0,0]} name="Heures Chronos">
                    {comparison.map(({client},i)=>(<Cell key={i} fill="#0f3460" opacity={selectedClient&&selectedClient!==client?0.25:1} style={{cursor:"pointer"}}/>))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>

              <div style={{...styles.cardTitle,marginTop:"20px"}}>📋 Tableau Détaillé des Écarts par Client
                {selectedClient&&<span style={{fontSize:"12px",color:"#C8102E",fontWeight:"normal",marginLeft:"8px"}}>— {selectedClient}</span>}
              </div>
              <table style={styles.table}>
                <thead><tr><th style={styles.th}>Client</th><th style={styles.th}>Tickets</th><th style={styles.th}>Heures Jira</th><th style={styles.th}>Heures Chronos</th><th style={styles.th}>Écart</th><th style={styles.th}>Statut</th></tr></thead>
                <tbody>
                  {[...comparison].filter(c=>!selectedClient||c.client===selectedClient).sort((a,b)=>Math.abs(b.ecart)-Math.abs(a.ecart)).map((c,i)=>{
                    const ecart=parseFloat(c.ecart);
                    return(
                      <tr key={c.client} style={{background:i%2===0?"white":"#fafafa",cursor:"pointer"}} onClick={()=>handleSelectClient(c.client===selectedClient?null:c.client)}>
                        <td style={styles.td}><span style={styles.badge("#1a1a2e")}>{c.client}</span></td>
                        <td style={styles.td}>{c.jira_tickets}</td>
                        <td style={styles.td}><span style={styles.badge("#C8102E")}>{c.jira_hours}h</span></td>
                        <td style={styles.td}><span style={styles.badge("#0f3460")}>{c.chronos_hours}h</span></td>
                        <td style={styles.td}><span style={{fontWeight:"bold",color:ecart>0?"#ff9800":ecart<0?"#C8102E":"#28a745"}}>{ecart>0?"+":""}{c.ecart}h</span></td>
                        <td style={styles.td}><span style={styles.badge(ecart>5?"#ff9800":ecart<-5?"#C8102E":"#28a745")}>{ecart>5?"⚠️ Sur-déclaré":ecart<-5?"❌ Sous-déclaré":"✅ OK"}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* ═══ VUE IA ═══ */}
          {activeTab==="ai"&&(
            <div>
              <div style={{background:"linear-gradient(135deg,#1a1a2e,#0f3460)",borderRadius:"12px",padding:"20px",marginBottom:"20px",color:"white",textAlign:"center"}}>
                <div style={{fontSize:"32px"}}>🤖</div>
                <div style={{fontSize:"18px",fontWeight:"bold"}}>Composante IA — Analyse Intelligente SOC</div>
                <div style={{fontSize:"13px",opacity:0.8}}>Prédiction • Anomalies • Forecast • Estimation de Complexité</div>
              </div>
              {aiError&&<div style={{padding:"12px 20px",background:"#fff3cd",border:"1px solid #ff9800",borderRadius:"8px",marginBottom:"20px",fontWeight:"bold"}}>{aiError}</div>}
              <div style={{display:"flex",gap:"12px",marginBottom:"25px",justifyContent:"center",flexWrap:"wrap"}}>
                {[["📊 Prédire la Charge","/ai/predict-workload",setAiPredictions,"#C8102E"],["🚨 Détecter Anomalies","/ai/detect-anomalies",setAiAnomalies,"#0f3460"],["🔮 Forecast 7 Jours","/ai/predict-7days",setAiForecast,"#28a745"],["⏱️ Estimer Complexité","/ai/estimate-by-type",setAiEstimation,"#6c757d"]].map(([lbl,ep,setter,color])=>(
                  <button key={lbl} onClick={()=>callAI(ep,setter)} disabled={aiLoading} style={{...styles.btn(aiLoading?"#ccc":color),padding:"12px 24px",fontSize:"14px"}}>{aiLoading?"⏳...":lbl}</button>
                ))}
                <button onClick={()=>{setShowChatbot(true);setActiveTab("global");}} style={{...styles.btn("#ff9800"),padding:"12px 24px",fontSize:"14px"}}>💬 Assistant IA</button>
              </div>
              {aiForecast&&<div style={{marginBottom:"25px"}}><div style={styles.cardTitle}>🔮 Prévision de Charge — 7 Prochains Jours</div><ResponsiveContainer width="100%" height={300}><LineChart data={forecastData}><CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/><XAxis dataKey="date" stroke="#666"/><YAxis stroke="#666"/><Tooltip contentStyle={{borderRadius:"8px"}}/><Legend/>{aiForecast.forecast.slice(0,5).map((c,i)=><Line key={c.client} type="monotone" dataKey={c.client} stroke={CLIENT_COLORS[i%CLIENT_COLORS.length]} strokeWidth={2.5} dot={{r:4}}/>)}</LineChart></ResponsiveContainer></div>}
              {aiPredictions&&<div style={{marginBottom:"25px"}}><div style={styles.cardTitle}>📊 Prédiction de Charge — Semaine Prochaine</div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"15px",marginBottom:"20px"}}><div style={{background:"#C8102E",borderRadius:"12px",padding:"20px",textAlign:"center",color:"white"}}><div style={{fontSize:"12px"}}>TICKETS PRÉVUS</div><div style={{fontSize:"36px",fontWeight:"bold"}}>{aiPredictions.total_tickets}</div></div><div style={{background:"#1a1a2e",borderRadius:"12px",padding:"20px",textAlign:"center",color:"white"}}><div style={{fontSize:"12px"}}>HEURES PRÉVUES</div><div style={{fontSize:"36px",fontWeight:"bold"}}>{aiPredictions.total_hours}h</div></div></div><ResponsiveContainer width="100%" height={250}><BarChart data={predChartData}><CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/><XAxis dataKey="client" stroke="#666"/><YAxis stroke="#666"/><Tooltip contentStyle={{borderRadius:"8px"}}/><Legend/><Bar dataKey="tickets" fill="#C8102E" radius={[6,6,0,0]} name="Tickets prévus"/><Bar dataKey="heures" fill="#0f3460" radius={[6,6,0,0]} name="Heures prévues"/></BarChart></ResponsiveContainer></div>}
              {aiAnomalies&&<div style={{marginBottom:"25px"}}><div style={styles.cardTitle}>🚨 Détection d'Anomalies — Isolation Forest</div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"15px",marginBottom:"20px"}}><div style={{background:"#1a1a2e",borderRadius:"12px",padding:"20px",textAlign:"center",color:"white"}}><div style={{fontSize:"12px"}}>JOURS ANALYSÉS</div><div style={{fontSize:"36px",fontWeight:"bold"}}>{aiAnomalies.total_analyzed}</div></div><div style={{background:"#C8102E",borderRadius:"12px",padding:"20px",textAlign:"center",color:"white"}}><div style={{fontSize:"12px"}}>ANOMALIES DÉTECTÉES</div><div style={{fontSize:"36px",fontWeight:"bold"}}>{aiAnomalies.anomalies_count}</div></div></div>{anomalyChart.length>0&&<ResponsiveContainer width="100%" height={200}><BarChart data={anomalyChart}><CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/><XAxis dataKey="client" stroke="#666"/><YAxis stroke="#666"/><Tooltip contentStyle={{borderRadius:"8px"}}/><Bar dataKey="anomalies" fill="#C8102E" radius={[6,6,0,0]} name="Anomalies"/></BarChart></ResponsiveContainer>}</div>}
              {aiEstimation&&<div style={{marginBottom:"25px"}}><div style={styles.cardTitle}>⏱️ Estimation de Complexité par Type de Ticket</div><div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"15px"}}>{[["HAUTE","complexity.high","#C8102E","≥0.5h"],["MOYENNE","complexity.medium","#ff9800","0.25-0.5h"],["FAIBLE","complexity.low","#28a745","0.25h"]].map(([lbl,key,color,sub])=>{const val=key.split(".").reduce((o,k)=>o[k],aiEstimation);return<div key={lbl} style={{background:color,borderRadius:"12px",padding:"20px",textAlign:"center",color:"white"}}><div style={{fontSize:"11px"}}>{lbl} COMPLEXITÉ</div><div style={{fontSize:"36px",fontWeight:"bold"}}>{val}</div><div style={{fontSize:"11px",opacity:0.8}}>tickets ({sub})</div></div>;})}</div></div>}
              {!aiPredictions&&!aiAnomalies&&!aiForecast&&!aiEstimation&&!aiError&&<div style={{textAlign:"center",padding:"60px",color:"#999"}}><div style={{fontSize:"64px"}}>🤖</div><div style={{fontSize:"18px",fontWeight:"bold"}}>Clique sur un bouton pour lancer l'analyse IA</div><div style={{fontSize:"13px",marginTop:"6px"}}>Powered by Random Forest & Isolation Forest</div></div>}
            </div>
          )}
        </div>

        {/* FILTRES TICKETS */}
        <div style={styles.card}>
          <div style={styles.cardTitle}>🔍 Filtres — Tickets ({filteredTickets.length})
            {activeFilter&&<span style={{fontSize:"12px",color:"#C8102E",fontWeight:"normal",marginLeft:"8px"}}>🎯 {activeFilter}</span>}
          </div>
          <div style={{display:"flex",alignItems:"center",flexWrap:"wrap",gap:"10px",marginBottom:"15px"}}>
            <select style={styles.filterSelect} value={filterType} onChange={e=>{setFilterType(e.target.value);setTicketPage(1);}}><option value="ALL">Tous les types</option><option value="SAAS">SaaS</option><option value="ONPREM">On-Prem</option></select>
            {filterType!=="ONPREM"&&<select style={styles.filterSelect} value={filterClient} onChange={e=>{setFilterClient(e.target.value);setTicketPage(1);}}><option value="ALL">Tous les clients</option>{[...new Set(saasTickets.map(t=>t.client_name).filter(Boolean))].map(c=><option key={c} value={c}>{c}</option>)}</select>}
            {filterType!=="SAAS"&&<select style={styles.filterSelect} value={filterGroup} onChange={e=>{setFilterGroup(e.target.value);setTicketPage(1);}}><option value="ALL">Tous les groupes</option>{ONPREM_GROUPS.map(g=><option key={g} value={g}>{g}</option>)}</select>}
            <button onClick={()=>{setFilterType("ALL");setFilterClient("ALL");setFilterGroup("ALL");setTicketPage(1);}} style={{padding:"8px 16px",background:"#666",color:"white",border:"none",borderRadius:"6px",cursor:"pointer"}}>Réinitialiser</button>
            {activeFilter&&<button onClick={clearFilter} style={{padding:"8px 16px",background:"#C8102E",color:"white",border:"none",borderRadius:"6px",cursor:"pointer",fontWeight:"bold"}}>✕ Effacer filtre cross</button>}
          </div>
          <table style={styles.table}>
            <thead><tr><th style={styles.th}>Jira Key</th><th style={styles.th}>Résumé</th><th style={styles.th}>Type</th><th style={styles.th}>Client / Groupe</th><th style={styles.th}>Date</th></tr></thead>
            <tbody>{paginatedTickets.map((t,i)=>(<tr key={t.id} style={{background:i%2===0?"white":"#fafafa"}}><td style={styles.td}><span style={styles.badge(t.ticket_type==="SAAS"?"#C8102E":"#0f3460")}>{t.jira_key}</span></td><td style={styles.td}>{t.summary?.substring(0,50)}...</td><td style={styles.td}><span style={styles.badge(t.ticket_type==="SAAS"?"#C8102E":"#0f3460")}>{t.ticket_type}</span></td><td style={styles.td}><span style={styles.badge("#1a1a2e")}>{t.client_name||t.group_name||"—"}</span></td><td style={styles.td}>{t.outage_start?new Date(t.outage_start).toLocaleDateString():"—"}</td></tr>))}</tbody>
          </table>
          <Pagination total={filteredTickets.length} page={ticketPage} onPage={setTicketPage}/>
        </div>

        {/* ENTRÉES DE TEMPS */}
        <div style={styles.card}>
          <div style={styles.cardTitle}>🕐 Mes Entrées de Temps Chronos ({cfTimeEntries.length})
            {activeFilter&&<span style={{fontSize:"12px",color:"#C8102E",fontWeight:"normal",marginLeft:"8px"}}>🎯 {activeFilter}</span>}
          </div>
          {editEntry&&(
            <div style={{position:"fixed",top:0,left:0,width:"100%",height:"100%",background:"rgba(0,0,0,0.6)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center"}}>
              <div style={{background:"white",borderRadius:"16px",padding:"30px",width:"420px",boxShadow:"0 20px 60px rgba(0,0,0,0.3)"}}>
                <div style={{fontSize:"18px",fontWeight:"bold",color:"#1a1a2e",marginBottom:"20px",borderBottom:"3px solid #C8102E",paddingBottom:"10px"}}>✏️ Modifier l'entrée #{editEntry.id}</div>
                {[["Heures","number","0.25","hours_logged",editForm.hours_logged],["Slot début","time","","slot_start",editForm.slot_start?.slice(0,5)],["Slot fin","time","","slot_end",editForm.slot_end?.slice(0,5)],["Date","date","","date",editForm.date]].map(([lbl,type,step,key,val])=>(
                  <div key={key} style={{marginBottom:"15px"}}>
                    <label style={{fontSize:"13px",fontWeight:"bold",color:"#666",display:"block",marginBottom:"5px"}}>{lbl}</label>
                    <input type={type} step={step||undefined} value={val} onChange={e=>setEditForm({...editForm,[key]:key.includes("slot")?e.target.value+":00":e.target.value})} style={{width:"100%",padding:"8px 12px",border:"2px solid #e0e0e0",borderRadius:"8px",fontSize:"14px",boxSizing:"border-box"}}/>
                  </div>
                ))}
                <div style={{display:"flex",gap:"10px",justifyContent:"flex-end"}}>
                  <button onClick={()=>setEditEntry(null)} style={{padding:"10px 20px",background:"#666",color:"white",border:"none",borderRadius:"8px",cursor:"pointer",fontWeight:"bold"}}>Annuler</button>
                  <button onClick={handleUpdateEntry} style={{padding:"10px 20px",background:"#28a745",color:"white",border:"none",borderRadius:"8px",cursor:"pointer",fontWeight:"bold"}}>✅ Sauvegarder</button>
                </div>
              </div>
            </div>
          )}
          <div style={{maxHeight:"400px",overflowY:"auto"}}>
            <table style={styles.table}>
              <thead><tr><th style={styles.th}>ID</th><th style={styles.th}>Client</th><th style={styles.th}>Type</th><th style={styles.th}>Slot Horaire</th><th style={styles.th}>Heures</th><th style={styles.th}>Date</th><th style={styles.th}>Synchronisé</th><th style={styles.th}>Actions</th></tr></thead>
              <tbody>{cfTimeEntries.slice(0,50).map((e,i)=>(<tr key={e.id} style={{background:i%2===0?"white":"#fafafa"}}><td style={styles.td}>{e.id}</td><td style={styles.td}><span style={styles.badge("#1a1a2e")}>{e.client_name||e.group_name||"—"}</span></td><td style={styles.td}><span style={styles.badge(e.ticket_type==="ONPREM"?"#0f3460":"#C8102E")}>{e.ticket_type||"SAAS"}</span></td><td style={styles.td}><span style={{fontSize:"12px",fontFamily:"monospace",background:"#f0f0f0",padding:"3px 8px",borderRadius:"4px"}}>{e.slot_start} → {e.slot_end}</span></td><td style={styles.td}><span style={styles.badge("#28a745")}>{e.hours_logged}h</span></td><td style={styles.td}>{e.date?e.date.toString().slice(0,10):"—"}</td><td style={styles.td}><span style={styles.badge(e.synced_to_chronos?"#28a745":"#ff9800")}>{e.synced_to_chronos?"✅ Oui":"⏳ Non"}</span></td><td style={styles.td}><div style={{display:"flex",gap:"6px"}}><button onClick={()=>handleEditEntry(e)} style={{padding:"4px 10px",background:"#0f3460",color:"white",border:"none",borderRadius:"5px",cursor:"pointer",fontSize:"12px",fontWeight:"bold"}}>✏️</button><button onClick={()=>handleDeleteEntry(e.id)} style={{padding:"4px 10px",background:"#C8102E",color:"white",border:"none",borderRadius:"5px",cursor:"pointer",fontSize:"12px",fontWeight:"bold"}}>🗑️</button></div></td></tr>))}</tbody>
            </table>
          </div>
          {cfTimeEntries.length>50&&<div style={{textAlign:"center",padding:"10px",color:"#666",fontSize:"13px"}}>Affichage des 50 premières entrées sur {cfTimeEntries.length}</div>}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;