const express=require("express");
const ModbusRTU=require("modbus-serial");
const path=require("path");
const app=express(), PORT=process.env.PORT||3000;
const cfg={host:process.env.MODBUS_HOST||"192.168.1.69",port:Number(process.env.MODBUS_PORT||502),unitId:Number(process.env.MODBUS_UNIT_ID||1)};
const REG={poolTemp:7487,ambientTemp:7497,pumpOutput:7119};
const client=new ModbusRTU(); let connecting=null;
async function conn(){if(client.isOpen)return;if(connecting)return connecting;connecting=client.connectTCP(cfg.host,{port:cfg.port}).then(()=>{client.setID(cfg.unitId);client.setTimeout(2000)});try{await connecting}finally{connecting=null}}
async function read(r,n=1){await conn();try{return (await client.readHoldingRegisters(r-1,n)).data}catch(e){try{client.close(()=>{})}catch(_){};throw e}}
function s32(a,b){return ((((a&65535)<<16)|(b&65535))|0)}
async function temp(r){const d=await read(r,2);return s32(d[0],d[1])/1000}
app.use(express.static(path.join(__dirname,"public")));
app.get("/api/status",async(req,res)=>{try{const pt=await temp(REG.poolTemp),at=await temp(REG.ambientTemp),p=(await read(REG.pumpOutput,1))[0];res.json({ok:true,poolTemp:pt,ambientTemp:at,pump:{raw:p,on:p!==0},registers:REG,inputScale:1000})}catch(e){res.status(503).json({ok:false,error:e.message,registers:REG,inputScale:1000})}});
app.listen(PORT,"0.0.0.0",()=>console.log("Greenair Pool Heating v0.2.0 on "+PORT));