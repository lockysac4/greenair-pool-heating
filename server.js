const express = require("express");
const path = require("path");
const crypto = require("crypto");
const app = express();
const PORT = process.env.PORT || 3000;
const GATEWAY_KEY = process.env.GATEWAY_KEY || "";
let latest = null;
app.use(express.json({limit:"32kb"}));
app.use(express.static(path.join(__dirname,"public")));
function safeEqual(a,b){const aa=Buffer.from(a||""),bb=Buffer.from(b||"");return aa.length===bb.length && crypto.timingSafeEqual(aa,bb)}
app.post("/api/gateway/update",(req,res)=>{const key=req.get("x-greenair-key")||"";if(!GATEWAY_KEY||!safeEqual(key,GATEWAY_KEY))return res.status(401).json({ok:false,error:"unauthorized"});const d=req.body||{};if(typeof d.poolTemp!=="number"||typeof d.ambientTemp!=="number"||typeof d.pumpOn!=="boolean")return res.status(400).json({ok:false,error:"invalid payload"});latest={poolTemp:d.poolTemp,ambientTemp:d.ambientTemp,pump:{on:d.pumpOn,raw:d.pumpRaw??null},gateway:d.gateway||"Greenair Windows Gateway",receivedAt:new Date().toISOString(),controller:d.controller||"192.168.1.69:502"};res.json({ok:true,receivedAt:latest.receivedAt})});
app.get("/api/status",(req,res)=>{if(!latest)return res.status(503).json({ok:false,error:"Waiting for Greenair Gateway"});const age=Date.now()-Date.parse(latest.receivedAt);if(age>30000)return res.status(503).json({ok:false,error:"Gateway stale",last:latest.receivedAt});res.json({ok:true,...latest})});
app.get("/api/config",(req,res)=>res.json({version:"0.3.0",transport:"Greenair Gateway",writesEnabled:false}));
app.listen(PORT,"0.0.0.0",()=>console.log("Greenair Pool Heating v0.3.0 on "+PORT));