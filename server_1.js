'use strict';
/* Сервер без внешних зависимостей: только встроенные модули Node.js */
const http=require('http'),https=require('https'),fs=require('fs'),path=require('path'),crypto=require('crypto');
const PORT=+process.env.PORT||3000,ROOT=path.join(__dirname,'public'),DIR=path.join(__dirname,'data'),FILE=path.join(DIR,'db.json');
const SUBJ=[];
const subjects=()=>Array.isArray(DB&&DB.subjects)?DB.subjects:[];
const TYPES=['КР','СР','ДЗ','ПР'];
const TIME_SLOT=/^\d{2}:\d{2}(?:-\d{2}:\d{2})?$/;
const DEFGROUP='ПРГ 3-1';
const ROLES={a:'Администратор',d:'Директор',t:'Преподаватель',s:'Студент'};
const CAN={a:['a','d','t','s'],d:['t','s'],t:['s']};
const LOGIN_RE=/^[\p{L}\p{N}._@+-]+$/u;
const DEF_SCH=[];
const STARTED=Date.now();
const E=(s,m)=>Object.assign(new Error(m),{status:s});
/* ---- ключ для обратимого хранения паролей (чтобы куратор мог их показать) ---- */
let KEY;
try{KEY=Buffer.from(process.env.SECRET_KEY||fs.readFileSync(path.join(DIR,'secret.key'),'utf8').trim(),'hex')}
catch(e){KEY=crypto.randomBytes(32);fs.mkdirSync(DIR,{recursive:true});fs.writeFileSync(path.join(DIR,'secret.key'),KEY.toString('hex'),{mode:0o600})}
function enc(pw){const iv=crypto.randomBytes(12),c=crypto.createCipheriv('aes-256-gcm',KEY,iv),ct=Buffer.concat([c.update(pw,'utf8'),c.final()]);return[iv,c.getAuthTag(),ct].map(b=>b.toString('hex')).join(':')}
function dec(s){try{const[i,t,c]=s.split(':').map(h=>Buffer.from(h,'hex')),d=crypto.createDecipheriv('aes-256-gcm',KEY,i);d.setAuthTag(t);return Buffer.concat([d.update(c),d.final()]).toString('utf8')}catch(e){return null}}
/* ---- журнал событий (data/events.log) ---- */
const EFILE=path.join(DIR,'events.log'),EV=[];
try{const L=fs.readFileSync(EFILE,'utf8').split('\n').filter(Boolean);L.slice(-300).forEach(l=>{try{EV.push(JSON.parse(l))}catch(e){}});
 if(L.length>2000)fs.writeFileSync(EFILE,EV.map(r=>JSON.stringify(r)).join('\n')+'\n')}catch(e){}
function ev(k,x,u,meta){const r={t:Date.now(),k,u:u||'',x:String(x).slice(0,200)};if(meta)r.meta=meta;EV.push(r);if(EV.length>300)EV.shift();try{fs.mkdirSync(DIR,{recursive:true});fs.appendFileSync(EFILE,JSON.stringify(r)+'\n')}catch(e){}}
/* ---- пароли: scrypt + уникальная соль ---- */
const hp=(pw,salt)=>crypto.scryptSync(pw,salt,64);
function mkUser(id,name,login,role,pw){const salt=crypto.randomBytes(16).toString('hex');const u={id,name,login,role,salt,hash:hp(pw,salt).toString('hex')};if(role==='s')u.pwe=enc(pw);return u}
function checkPw(u,pw){const a=hp(pw,u?u.salt:'0'.repeat(32)),b=Buffer.from(u?u.hash:'0'.repeat(128),'hex');return !!u&&crypto.timingSafeEqual(a,b)}
/* ---- база данных (JSON-файл) ---- */
function seed(){
 const ds=['2026-09-07','2026-09-09','2026-09-11','2026-09-14','2026-09-17','2026-09-21','2026-09-24'],ty=['ДЗ','СР','ПР','ДЗ','КР','ДЗ','ПР'];
 const grades=[];

 const users=[mkUser(1,'Елена Петровна','teacher','t',process.env.TEACHER_PASSWORD||'teacher123'),mkUser(2,'Рома Юрин','roma','s','roma12345')];users[0].groups=[DEFGROUP];users[1].group=DEFGROUP;
 return{users,groups:[DEFGROUP,'ПРГ 3-2'],subjects:[],schedule:[],schedules:{},grades:[],works:[],attendance:[],messages:[],supportRequests:[],next:{user:3,grade:1,work:1,attendance:1,message:1,supportRequest:1}};
}
let DB;
function saveDb(){fs.mkdirSync(DIR,{recursive:true});const t=FILE+'.tmp';fs.writeFileSync(t,JSON.stringify(DB));fs.renameSync(t,FILE)}
function loadDb(){
 if(!fs.existsSync(FILE)){DB=seed();DB.next.news=1;ensureDefaults();saveDb();return}
 try{DB=JSON.parse(fs.readFileSync(FILE,'utf8'))}
 catch(e){const bak=FILE+'.broken-'+Date.now();fs.copyFileSync(FILE,bak);console.error('db.json повреждён, копия: '+bak);DB=seed();saveDb()}
 DB.users=DB.users||[];DB.users.forEach(z=>{if(typeof z.active!=='boolean')z.active=true});DB.subjects=Array.isArray(DB.subjects)?DB.subjects:[];DB.grades=DB.grades||[];DB.works=DB.works||[];DB.attendance=DB.attendance||[];DB.messages=DB.messages||[];DB.supportRequests=Array.isArray(DB.supportRequests)?DB.supportRequests:[];DB.groups=Array.isArray(DB.groups)&&DB.groups.length?DB.groups:[DEFGROUP,'ПРГ 3-2'];DB.schedules=DB.schedules||{};DB.next=DB.next||{};
 DB.users.filter(z=>z.role==='s').forEach(z=>{if(!z.group||!DB.groups.includes(z.group))z.group=DEFGROUP});
 DB.users.filter(z=>z.role==='t').forEach(z=>{if(!Array.isArray(z.groups))z.groups=[DEFGROUP];z.groups=z.groups.filter(g=>DB.groups.includes(g));if(!z.groups.length)z.groups=[DEFGROUP]});
 if(!Array.isArray(DB.schedule))DB.schedule=[];
 if(!DB.schedules[DEFGROUP] && Array.isArray(DB.schedule) && DB.schedule.length)DB.schedules[DEFGROUP]=DB.schedule;
 DB.schedule=DB.schedules[DEFGROUP]||[];
 DB.next.user=DB.next.user||Math.max(0,...DB.users.map(z=>z.id))+1;DB.next.grade=DB.next.grade||Math.max(0,...DB.grades.map(z=>z.id))+1;DB.next.work=DB.next.work||Math.max(0,...DB.works.map(z=>z.id))+1;DB.next.attendance=DB.next.attendance||Math.max(0,...DB.attendance.map(z=>z.id))+1;DB.next.message=DB.next.message||Math.max(0,...DB.messages.map(z=>z.id))+1;DB.next.supportRequest=DB.next.supportRequest||Math.max(0,...DB.supportRequests.map(z=>z.id))+1;ensureDefaults()}
function ensureDefaults(){let ch=false;
 if(!Array.isArray(DB.schedule)){DB.schedule=[];ch=true}
 if(!Array.isArray(DB.subjects)){DB.subjects=[];ch=true}
 if(!Array.isArray(DB.news)){DB.news=[];ch=true}
 if(!DB.next.news){DB.next.news=1;ch=true}
 const add=(role,name,login,pw)=>{let l=login,i=1;while(DB.users.some(z=>z.login.toLowerCase()===l))l=login+(++i);DB.users.push(mkUser(DB.next.user++,name,l,role,pw));ch=true;console.log('Создан аккаунт: '+l+' ('+ROLES[role]+')')};
 if(!DB.users.some(z=>z.role==='a'))add('a','Системный администратор','admin',process.env.ADMIN_PASSWORD||'admin12345');
 if(!DB.users.some(z=>z.role==='d'))add('d','Андрей Викторович','director',process.env.DIRECTOR_PASSWORD||'director123');
 if(ch)saveDb()}
/* ---- файлы работ ---- */
const FILES=path.join(DIR,'files'),MAXF=25*1024*1024;
const fpath=id=>path.join(FILES,String(id)+'.bin');
function rmFile(id){try{fs.unlinkSync(fpath(id))}catch(e){}}
function rawBody(req,max){return new Promise((ok,no)=>{const a=[];let n=0;req.on('data',c=>{n+=c.length;if(n>max){no(E(413,'Файл больше 25 МБ'));req.destroy();return}a.push(c)});req.on('end',()=>ok(Buffer.concat(a)));req.on('error',()=>no(E(400,'Ошибка загрузки')))})}
/* ---- сессии и защита от подбора пароля ---- */
const SFILE=path.join(DIR,'sessions.json'),sessions=new Map(),fails=new Map();
const supportAttempts=new Map();
const auth=req=>{const c=/(?:^|;\s*)sid=([a-f0-9]{64})/.exec(req.headers.cookie||''),s=c&&sessions.get(c[1]);if(!s||s.exp<Date.now())return null;const user=DB.users.find(x=>x.id===s.uid);return user&&user.active!==false?user:null};
try{JSON.parse(fs.readFileSync(SFILE,'utf8')).forEach(a=>{if(a[1].exp>Date.now())sessions.set(a[0],a[1])})}catch(e){}
function saveSessions(){try{fs.mkdirSync(DIR,{recursive:true});fs.writeFileSync(SFILE,JSON.stringify([...sessions]),{mode:0o600})}catch(e){}}
const sidOf=req=>{const c=/(?:^|;\s*)sid=([a-f0-9]{64})/.exec(req.headers.cookie||'');return c&&c[1]};
function dropSessions(uid,keep){sessions.forEach((v,k)=>{if(v.uid===uid&&k!==keep)sessions.delete(k)});saveSessions()}
const SEC={'X-Content-Type-Options':'nosniff','X-Frame-Options':'DENY','Referrer-Policy':'same-origin'};
function send(res,code,obj,extra){res.writeHead(code,Object.assign({'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'},SEC,extra));res.end(JSON.stringify(obj))}
function body(req,max=1e5){return new Promise((ok,no)=>{if(!/^application\/json/.test(req.headers['content-type']||''))return no(E(415,'Нужен JSON'));let d='';req.on('data',c=>{d+=c;if(d.length>max){no(E(413,'Слишком большой запрос'));req.destroy()}});req.on('end',()=>{try{ok(JSON.parse(d||'{}'))}catch(e){no(E(400,'Некорректный JSON'))}})})}
function str(v,a,b,label,trim=true){if(typeof v!=='string')throw E(400,label+': обязательное поле');if(trim)v=v.trim();if(v.length<a||v.length>b)throw E(400,label+': от '+a+' до '+b+' символов');return v}
function httpsJson(url,method,data,headers){return new Promise((resolve,reject)=>{
 const bytes=data||'';const req=https.request(url,{method,headers:Object.assign({},headers||{},bytes?{'Content-Type':'application/x-www-form-urlencoded','Content-Length':Buffer.byteLength(bytes)}:{})},res=>{
  let raw='';res.setEncoding('utf8');res.on('data',chunk=>{raw+=chunk;if(raw.length>1e6)res.destroy(E(502,'Слишком большой ответ Google'))});
  res.on('end',()=>{let json;try{json=JSON.parse(raw||'{}')}catch(e){return reject(E(502,'Некорректный ответ Google'))}if(res.statusCode<200||res.statusCode>=300)return reject(E(502,'Google OAuth отклонил запрос'));resolve({json,headers:res.headers})});
 });
 req.setTimeout(10000,()=>req.destroy(E(504,'Google OAuth timeout')));req.on('error',e=>reject(e.status?e:E(502,'Не удалось связаться с Google OAuth')));if(bytes)req.write(bytes);req.end();
})}
function googleCookie(req,name,value,maxAge){return name+'='+value+'; HttpOnly; SameSite=Lax; Path=/; Max-Age='+maxAge+(req.headers['x-forwarded-proto']==='https'?'; Secure':'')}
function googleRedirect(res,status,cookies){res.writeHead(302,{'Location':'/index.html?auth='+encodeURIComponent(status),'Cache-Control':'no-store','Set-Cookie':cookies||[]});res.end()}
const googleStates=new Map();let googleKeys=[],googleKeysExpiry=0;
function cookieOf(req,name){const m=new RegExp('(?:^|;\\s*)'+name+'=([^;]*)').exec(req.headers.cookie||'');return m?m[1]:''}
async function verifyGoogleIdToken(idToken,nonce){
 const parts=String(idToken||'').split('.');if(parts.length!==3)throw E(401,'Некорректный ответ Google');
 let header,claims;try{header=JSON.parse(Buffer.from(parts[0],'base64url').toString('utf8'));claims=JSON.parse(Buffer.from(parts[1],'base64url').toString('utf8'))}catch(e){throw E(401,'Некорректный ответ Google')}
 if(header.alg!=='RS256'||!header.kid)throw E(401,'Недопустимая подпись Google');
 if(!googleKeys.length||googleKeysExpiry<Date.now()){
  const result=await httpsJson('https://www.googleapis.com/oauth2/v3/certs','GET');googleKeys=result.json.keys||[];
  const cache=(result.headers['cache-control']||'').match(/max-age=(\d+)/);googleKeysExpiry=Date.now()+Math.min(cache?+cache[1]:300,3600)*1000;
 }
 const key=googleKeys.find(k=>k.kid===header.kid&&k.kty==='RSA');if(!key)throw E(401,'Не удалось проверить подпись Google');
 let valid=false;try{const publicKey=crypto.createPublicKey({key,format:'jwk'});valid=crypto.verify('RSA-SHA256',Buffer.from(parts[0]+'.'+parts[1]),publicKey,Buffer.from(parts[2],'base64url'))}catch(e){}
 const now=Math.floor(Date.now()/1000),aud=Array.isArray(claims.aud)?claims.aud:[claims.aud];
 if(!valid||!['accounts.google.com','https://accounts.google.com'].includes(claims.iss)||!aud.includes(process.env.GOOGLE_CLIENT_ID)||(claims.azp&&claims.azp!==process.env.GOOGLE_CLIENT_ID)||+claims.exp<=now||+claims.iat>now+60||claims.nonce!==nonce||!(claims.email_verified===true||claims.email_verified==='true')||typeof claims.email!=='string')throw E(401,'Не удалось подтвердить аккаунт Google');
 return claims;
}
async function googleAuthRoute(req,res,u){
 const clientId=process.env.GOOGLE_CLIENT_ID,clientSecret=process.env.GOOGLE_CLIENT_SECRET,redirectUri=process.env.GOOGLE_REDIRECT_URI;
 if(req.method==='GET'&&u.pathname==='/auth/google'){
  if(!clientId||!clientSecret||!redirectUri)return googleRedirect(res,'google-unconfigured');
  const state=crypto.randomBytes(32).toString('base64url'),nonce=crypto.randomBytes(32).toString('base64url');
  for(const [key,value] of googleStates)if(value.exp<Date.now())googleStates.delete(key);
  googleStates.set(state,{nonce,exp:Date.now()+10*60*1000});
  const target=new URL('https://accounts.google.com/o/oauth2/v2/auth');
  target.searchParams.set('client_id',clientId);target.searchParams.set('redirect_uri',redirectUri);target.searchParams.set('response_type','code');
  target.searchParams.set('scope','openid email profile');target.searchParams.set('state',state);target.searchParams.set('nonce',nonce);target.searchParams.set('prompt','select_account');
  res.writeHead(302,{'Location':target.toString(),'Cache-Control':'no-store','Set-Cookie':googleCookie(req,'google_oauth_state',state,600)});return res.end();
 }
 if(req.method!=='GET'||u.pathname!=='/auth/google/callback')return false;
 const state=u.searchParams.get('state')||'',pending=googleStates.get(state),clear=googleCookie(req,'google_oauth_state','',0);
 if(u.searchParams.has('error')){if(state)googleStates.delete(state);return googleRedirect(res,'google-cancelled',clear)}
 if(!state||state!==cookieOf(req,'google_oauth_state')||!pending||pending.exp<Date.now()||!u.searchParams.get('code')){if(state)googleStates.delete(state);return googleRedirect(res,'google-error',clear)}
 googleStates.delete(state);
 try{
  const form=new URLSearchParams({code:u.searchParams.get('code'),client_id:clientId,client_secret:clientSecret,redirect_uri:redirectUri,grant_type:'authorization_code'}).toString();
  const token=await httpsJson('https://oauth2.googleapis.com/token','POST',form);
  const claims=await verifyGoogleIdToken(token.json.id_token,pending.nonce),email=claims.email.trim().toLowerCase();
  const user=DB.users.find(z=>String(z.googleEmail||'').toLowerCase()===email);
  if(!user){ev('fail','Вход Google: email не привязан','',{login:email,ip:req.socket.remoteAddress||'unknown'});return googleRedirect(res,'google-unlinked',clear)}
  if(user.active===false){ev('fail','Попытка входа отключённого аккаунта через Google',user.login,{login:user.login,ip:req.socket.remoteAddress||'unknown',reason:'disabled'});return googleRedirect(res,'google-disabled',clear)}
  const ip=req.socket.remoteAddress||'unknown',session=crypto.randomBytes(32).toString('hex');sessions.set(session,{uid:user.id,exp:Date.now()+8*36e5,createdAt:Date.now(),ip});saveSessions();
  ev('login','Вход в систему через Google ('+ROLES[user.role]+')',user.login,{login:user.login,ip,role:user.role,method:'google'});
  res.writeHead(302,{'Location':'/app.html','Cache-Control':'no-store','Set-Cookie':['sid='+session+'; HttpOnly; SameSite=Lax; Path=/; Max-Age=28800'+(req.headers['x-forwarded-proto']==='https'?'; Secure':''),clear]});return res.end();
 }catch(e){ev('error','Ошибка входа Google: '+(e&&e.message||'неизвестная ошибка'));return googleRedirect(res,'google-error',clear)}
}
function parseCsv(text){text=String(text||'').replace(/^\uFEFF/,'');const lines=text.split(/\r?\n/).filter(x=>x.trim()),out=[];lines.forEach(line=>{const row=[];let v='',q=false;for(let i=0;i<line.length;i++){const c=line[i];if(c==='"'&&line[i+1]==='"'){v+='"';i++}else if(c==='"')q=!q;else if(!q&&(c===';'||c===',')){row.push(v.trim());v=''}else v+=c}row.push(v.trim());out.push(row)});if(!out.length)return[];const head=out.shift().map(x=>x.toLowerCase());return out.map(row=>Object.fromEntries(head.map((key,i)=>[key,row[i]||''])))}
async function api(req,res,u){
 const m=req.method,p=u.pathname;let x;
 if(m==='POST'&&p==='/api/support-requests'){
  const ip=req.socket.remoteAddress||'unknown',now=Date.now(),recent=supportAttempts.get(ip)||[];
  const allowed=recent.filter(t=>now-t<15*60e3);if(allowed.length>=3)throw E(429,'Слишком много обращений. Попробуйте позже');
  const b=await body(req,12000),name=str(b.name,2,100,'Имя'),login=str(b.login,1,64,'Логин'),contact=str(b.contact,3,254,'Контакт'),subject=str(b.subject,2,80,'Тема'),text=str(b.message,10,2000,'Сообщение');
  allowed.push(now);supportAttempts.set(ip,allowed);
  const request={id:DB.next.supportRequest++,name,login,contact,subject,text,createdAt:new Date().toISOString(),status:'new'};
  DB.supportRequests.unshift(request);DB.supportRequests=DB.supportRequests.slice(0,500);saveDb();ev('support','Новое обращение №'+request.id+' · '+subject,login,{requestId:request.id});
  return send(res,201,{ok:true,id:request.id})
 }
 if(m==='POST'&&p==='/api/login'){
  const ip=req.socket.remoteAddress,f=fails.get(ip)||{n:0,t:Date.now()};
  if(Date.now()-f.t>6e4){f.n=0;f.t=Date.now()}
  if(f.n>=8)throw E(429,'Слишком много попыток. Подождите минуту');
  const b=await body(req),login=String(b.login||'').trim().toLowerCase(),user=DB.users.find(z=>z.login.toLowerCase()===login),ok=checkPw(user,String(b.password||''));
  if(!ok||user.active===false){f.n++;fails.set(ip,f);ev('fail','Неудачная попытка входа: '+login.slice(0,60),'',{login,ip,reason:user&&user.active===false?'disabled':'invalid'});throw E(401,'Неверный логин или пароль')}
  fails.delete(ip);ev('login','Вход в систему ('+ROLES[user.role]+')',user.login,{login:user.login,ip,role:user.role,method:'password'});const tok=crypto.randomBytes(32).toString('hex');sessions.set(tok,{uid:user.id,exp:Date.now()+8*36e5,createdAt:Date.now(),ip});saveSessions();
  const sec=req.headers['x-forwarded-proto']==='https'?'; Secure':'';
  return send(res,200,{ok:true,role:user.role},{'Set-Cookie':'sid='+tok+'; HttpOnly; SameSite=Lax; Path=/; Max-Age=28800'+sec});
 }
 if(m==='POST'&&p==='/api/logout'){const c=/(?:^|;\s*)sid=([a-f0-9]{64})/.exec(req.headers.cookie||'');if(c){sessions.delete(c[1]);saveSessions()}return send(res,200,{ok:true},{'Set-Cookie':'sid=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0'})}
 const me=auth(req);if(!me)throw E(401,'Требуется вход');
 const need=(...r)=>{if(!r.includes(me.role))throw E(403,'Недостаточно прав')},T=me.role==='t'||me.role==='d';
 const canManage=r=>(CAN[me.role]||[]).includes(r),pub=z=>({id:z.id,name:z.name,login:z.login,role:z.role,subj:z.subj||'',group:z.group||DEFGROUP,groups:Array.isArray(z.groups)?z.groups:[]});
 const tgt=id=>{const z=DB.users.find(u=>u.id===+id);if(!z||!canManage(z.role))throw E(404,'Пользователь не найден');return z};
 const chkLogin=(l,except)=>{if(!LOGIN_RE.test(l))throw E(400,'Логин: буквы, цифры и символы . _ - @ +, без пробелов');if(DB.users.some(z=>z.id!==except&&z.login.toLowerCase()===l))throw E(409,'Такой логин уже занят')};
 if(m==='PUT'&&(x=/^\/api\/users\/(\d+)\/google-email$/.exec(p))){need('a');const user=DB.users.find(z=>z.id===+x[1]);if(!user)throw E(404,'Пользователь не найден');const b=await body(req),email=String(b.email||'').trim().toLowerCase();if(email&&(email.length>254||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)))throw E(400,'Укажите корректный Google email');if(email&&DB.users.some(z=>z.id!==user.id&&String(z.googleEmail||'').toLowerCase()===email))throw E(409,'Этот Google email уже привязан к другому аккаунту');if(email)user.googleEmail=email;else delete user.googleEmail;saveDb();ev('account',email?'Привязан Google email для аккаунта '+user.login:'Удалена привязка Google email для аккаунта '+user.login,me.login);return send(res,200,{ok:true,email})}
 if(m==='GET'&&p==='/api/me')return send(res,200,{id:me.id,name:me.name,login:me.login,role:me.role});
 if(m==='PUT'&&p==='/api/me'){if(me.role==='s')throw E(403,'Недостаточно прав');
  const ip=req.socket.remoteAddress,f=fails.get(ip)||{n:0,t:Date.now()};if(Date.now()-f.t>6e4){f.n=0;f.t=Date.now()}
  if(f.n>=8)throw E(429,'Слишком много попыток. Подождите минуту');
  const b=await body(req);
  if(!checkPw(me,String(b.current||''))){f.n++;fails.set(ip,f);ev('fail','Неверный текущий пароль при смене данных',me.login);throw E(403,'Текущий пароль указан неверно')}
  fails.delete(ip);
  const name=b.name==null?me.name:str(b.name,2,100,'ФИО');let login=me.login;
  if(b.login!=null){login=str(b.login,3,64,'Логин').toLowerCase();chkLogin(login,me.id)}
  const pw=b.password?str(b.password,8,128,'Пароль',false):null,old=me.login;
  if(pw){me.salt=crypto.randomBytes(16).toString('hex');me.hash=hp(pw,me.salt).toString('hex');delete me.pwe;dropSessions(me.id,sidOf(req))}
  me.name=name;me.login=login;saveDb();
  ev('profile','Изменены данные: '+(login!==old?'логин '+old+' → '+login+'; ':'')+(pw?'пароль; ':'')+'ФИО',login);
  return send(res,200,{ok:true})}
 if(m==='GET'&&p==='/api/db'){
  const people=DB.users.filter(z=>z.active!==false&&z.id!==me.id&&((me.role==='s'&&(z.role==='t'||z.role==='d'))||((me.role==='t'||me.role==='d')&&z.role==='s'))).map(pub);
    const visible=DB.messages.filter(x=>x.from===me.id||x.to===me.id).map(x=>Object.assign({},x,{fromName:(DB.users.find(z=>z.id===x.from)||{}).name||'Удалённый пользователь',toName:(DB.users.find(z=>z.id===x.to)||{}).name||'Группа'}));
  return send(res,200,{
  students:DB.users.filter(z=>z.role==='s'&&(me.role!=='s'||z.id===me.id)).map(z=>({id:z.id,name:z.name,login:z.login,group:z.group||DEFGROUP})),
   grades:me.role==='a'?[]:DB.grades.filter(g=>T||g.sid===me.id),works:me.role==='a'?[]:DB.works.filter(w=>T||w.sid===me.id),
   attendance:me.role==='a'?[]:DB.attendance.filter(g=>T||g.sid===me.id),messages:visible,contacts:people,
  users:me.role==='a'||me.role==='d'?DB.users.filter(z=>canManage(z.role)||z.id===me.id).map(z=>Object.assign(pub(z),me.role==='a'?{googleEmail:z.googleEmail||'',active:z.active!==false}:{})):[],
    groups:DB.groups,subjects:subjects(),group:me.group||DEFGROUP,teacherGroups:Array.isArray(me.groups)?me.groups:[],schedule:DB.schedules[me.group||DEFGROUP]||[],schedules:(me.role==='t'||me.role==='d'||me.role==='a')?DB.schedules:null,news:DB.news,supportRequests:me.role==='a'?DB.supportRequests:[]});
 }
 if(m==='POST'&&(p==='/api/users'||p==='/api/students')){const b=await body(req),role=p==='/api/students'?'s':String(b.role||'s');
  if(!canManage(role))throw E(403,'Недостаточно прав');
  const name=str(b.name,2,100,'ФИО'),login=str(b.login,3,64,'Логин').toLowerCase(),pw=str(b.password,8,128,'Пароль',false);
  chkLogin(login,0);
  const u=mkUser(DB.next.user++,name,login,role,pw);
  if(role==='t'){if(b.subj && !subjects().includes(String(b.subj)))throw E(400,'Неизвестный предмет');if(b.subj)u.subj=String(b.subj);const gs=Array.isArray(b.groups)?b.groups.map(String).filter(g=>DB.groups.includes(g)):[];u.groups=gs.length?gs:[DEFGROUP]}
  if(role==='s')u.group=DB.groups.includes(String(b.group||''))?String(b.group):DEFGROUP;
  DB.users.push(u);saveDb();ev('account','Создан аккаунт: '+login+' ('+ROLES[role]+')',me.login);return send(res,201,{ok:true})}
 if(m==='GET'&&(x=/^\/api\/(?:users|students)\/(\d+)\/credentials$/.exec(p))){const z=tgt(x[1]);return send(res,200,{name:z.name,login:z.login,role:z.role,password:z.role==='s'&&z.pwe?dec(z.pwe):null})}
 if(m==='PUT'&&(x=/^\/api\/(?:users|students)\/(\d+)\/password$/.exec(p))){const z=tgt(x[1]);if(z.id===me.id)throw E(400,'Свой пароль меняйте в профиле');
  const pw=str((await body(req)).password,8,128,'Пароль',false);z.salt=crypto.randomBytes(16).toString('hex');z.hash=hp(pw,z.salt).toString('hex');if(z.role==='s')z.pwe=enc(pw);else delete z.pwe;
  dropSessions(z.id);saveDb();ev('password','Сброшен пароль: '+z.login,me.login);return send(res,200,{ok:true})}
 if(m==='DELETE'&&(x=/^\/api\/(?:users|students)\/(\d+)$/.exec(p))){const z=tgt(x[1]);if(z.id===me.id)throw E(400,'Нельзя удалить свой аккаунт');
  if(z.role==='a'&&DB.users.filter(u=>u.role==='a'&&u.id!==z.id&&u.active!==false).length===0)throw E(400,'Нельзя удалить последнего активного администратора');
  DB.users=DB.users.filter(u=>u.id!==z.id);DB.grades=DB.grades.filter(g=>g.sid!==z.id);DB.works.filter(w=>w.sid===z.id).forEach(w=>rmFile(w.id));DB.works=DB.works.filter(w=>w.sid!==z.id);
  dropSessions(z.id);saveDb();ev('account','Удалён аккаунт: '+z.login+' ('+ROLES[z.role]+')',me.login);return send(res,200,{ok:true})}
 if(m==='POST'&&p==='/api/subjects'){need('a');const b=await body(req),name=str(b.name,2,80,'Название предмета');if(DB.subjects.some(x=>x.toLowerCase()===name.toLowerCase()))throw E(409,'Такой предмет уже существует');DB.subjects.push(name);DB.subjects.sort((a,b)=>a.localeCompare(b,'ru'));saveDb();ev('subject','Добавлен предмет: '+name,me.login);return send(res,201,{ok:true,subject:name})}
 if(m==='DELETE'&&(x=/^\/api\/subjects\/(\d+)$/.exec(p))){need('a');const i=+x[1];if(i<0||i>=DB.subjects.length)throw E(404,'Предмет не найден');const name=DB.subjects[i];DB.subjects.splice(i,1);saveDb();ev('subject','Удалён предмет: '+name,me.login);return send(res,200,{ok:true})}
 if(m==='PUT'&&p==='/api/schedule'){need('d');const b=await body(req),group=String(b.group||'').trim(),rows=b.rows;
  if(!DB.groups.includes(group))throw E(400,'Выберите существующую группу');
  if(!Array.isArray(rows)||rows.length>12)throw E(400,'Не более 12 пар в день');
  const schedule=rows.map(r=>{if(!Array.isArray(r)||r.length!==6)throw E(400,'Некорректное расписание');const t=String(r[0]).trim();if(!TIME_SLOT.test(t))throw E(400,'Время указывайте в формате 08:30 или 08:30-10:00');
   return[t].concat(r.slice(1).map(c=>{c=String(c).replace(/\s+/g,' ').trim();if(c.length>70)throw E(400,'Слишком длинное название');if(c){const sj=c.split('|')[0].trim();if(sj&&!subjects().includes(sj))throw E(400,'Предмет не добавлен администратором: '+sj)}return c}))});
  DB.schedules[group]=schedule;DB.schedule=DB.schedules[DEFGROUP]||schedule;saveDb();ev('schedule','Расписание группы '+group+' обновлено',me.login);return send(res,200,{ok:true,group})}
 if(m==='POST'&&p==='/api/news'){need('d');const b=await body(req),title=str(b.title,2,120,'Заголовок'),text=str(b.text,1,1000,'Текст');
  DB.news.unshift({id:DB.next.news++,d:new Date().toISOString().slice(0,10),title,text,by:me.name});DB.news=DB.news.slice(0,100);saveDb();ev('news','Объявление: '+title,me.login);return send(res,201,{ok:true})}
 if(m==='DELETE'&&(x=/^\/api\/news\/(\d+)$/.exec(p))){need('d');DB.news=DB.news.filter(n=>n.id!==+x[1]);saveDb();return send(res,200,{ok:true})}
 if(m==='POST'&&p==='/api/attendance'){need('t','d');const b=await body(req);if(!DB.users.some(z=>z.id===+b.sid&&z.role==='s'))throw E(400,'Выберите студента');if(!subjects().includes(String(b.s)))throw E(400,'Неизвестный предмет');if(!/^(present|absent|late)$/.test(b.status))throw E(400,'Неизвестный статус посещаемости');if(!/^\d{4}-\d{2}-\d{2}$/.test(b.d||''))throw E(400,'Некорректная дата');const old=DB.attendance.find(x=>x.sid===+b.sid&&x.s===b.s&&x.d===b.d);if(old)old.status=b.status;else DB.attendance.push({id:DB.next.attendance++,sid:+b.sid,s:b.s,d:b.d,status:b.status});saveDb();ev('attendance','Посещаемость: '+b.s+' · '+b.status,me.login);return send(res,201,{ok:true})}
 if(m==='DELETE'&&(x=/^\/api\/attendance\/(\d+)$/.exec(p))){need('t','d');DB.attendance=DB.attendance.filter(z=>z.id!==+x[1]);saveDb();return send(res,200,{ok:true})}
 if(m==='POST'&&p==='/api/messages'){const b=await body(req);const text=str(b.text,1,2000,'Сообщение'),subject=str(b.subject||'Без темы',1,120,'Тема'),target=b.to==='admin'?'admin':b.to==='group'?'group':+b.to;
  if(target==='admin'&&me.role!=='a'){
   const admins=DB.users.filter(z=>z.role==='a'&&z.active!==false);if(!admins.length)throw E(503,'Нет активного администратора');
   const d=new Date().toISOString().slice(0,10);admins.forEach(to=>DB.messages.push({id:DB.next.message++,from:me.id,to:to.id,subject,text,d,read:false,adminRequest:true}));
   saveDb();ev('message','Обращение к администратору: '+subject,me.login);return send(res,201,{ok:true,count:admins.length})
  }
  if(me.role==='s'&&(!Number.isInteger(target)||!DB.users.some(z=>z.id===target&&(z.role==='t'||z.role==='d'))))throw E(400,'Выберите преподавателя');
  if((me.role==='t'||me.role==='d')&&target!=='group'&&(!Number.isInteger(target)||!DB.users.some(z=>z.id===target&&z.role==='s')))throw E(400,'Выберите студента');
  const recipients=target==='group'?DB.users.filter(z=>z.role==='s').map(z=>z.id):[target];if(!recipients.length)throw E(400,'Нет получателей');const d=new Date().toISOString().slice(0,10);recipients.forEach(to=>DB.messages.push({id:DB.next.message++,from:me.id,to,subject,text,d,read:false,group:target==='group'}));saveDb();ev('message','Отправлено сообщение: '+subject,me.login);return send(res,201,{ok:true,count:recipients.length})}
 if(m==='PUT'&&(x=/^\/api\/messages\/(\d+)\/read$/.exec(p))){const msg=DB.messages.find(z=>z.id===+x[1]&&z.to===me.id);if(!msg)throw E(404,'Сообщение не найдено');msg.read=true;saveDb();return send(res,200,{ok:true})}
 if(m==='POST'&&p==='/api/import'){need('a','d');const b=await body(req,5e6),kind=String(b.kind||''),rows=parseCsv(b.text),errors=[];let count=0;if(!['students','grades','schedule'].includes(kind)||!rows.length)throw E(400,'Выберите тип и непустой CSV');if(rows.length>1000)throw E(400,'Не более 1000 строк за импорт');
  if(kind==='students')rows.forEach((r,i)=>{try{const name=str(r.фио||r.name,2,100,'ФИО'),login=str(r.логин||r.login,3,64,'Логин').toLowerCase(),pw=str(r.пароль||r.password||'progress123',8,128,'Пароль',false),group=String(r.группа||r.group||DEFGROUP).trim();if(!DB.groups.includes(group))throw E(400,'Группа не найдена: '+group);chkLogin(login,0);const u=mkUser(DB.next.user++,name,login,'s',pw);u.group=group;DB.users.push(u);count++}catch(e){errors.push('Строка '+(i+2)+': '+e.message)}});
  if(kind==='grades')rows.forEach((r,i)=>{try{const user=DB.users.find(z=>z.role==='s'&&z.login.toLowerCase()===String(r.логин||r.login||'').toLowerCase());if(!user)throw E(400,'Студент не найден');const s=str(r.предмет||r.subject,2,60,'Предмет'),d=str(r.дата||r.date,10,10,'Дата'),t=str(r.тип||r.type,2,2,'Тип'),v=+String(r.оценка||r.grade);if(!subjects().includes(s)||!TYPES.includes(t)||![2,3,4,5].includes(v)||!/^\d{4}-\d{2}-\d{2}$/.test(d))throw E(400,'Неверные данные оценки');DB.grades.push({id:DB.next.grade++,sid:user.id,s,d,t,v});count++}catch(e){errors.push('Строка '+(i+2)+': '+e.message)}});
  if(kind==='schedule'){
   /* Поддерживаем два CSV-формата расписания:
      1) широкий: Группа;Время;ПН;ВТ;СР;ЧТ;ПТ, где ячейка = Предмет|Кабинет|Преподаватель
      2) обычный: Группа;День;Время;Кабинет;Дисциплина;Преподаватель
      Преподаватель необязателен и никогда не создаётся автоматически.
   */
   const first=rows[0]||{};
   const keys=Object.keys(first).map(x=>x.toLowerCase());
   const long=keys.some(k=>k==='день'||k==='day') && keys.some(k=>k==='дисциплина'||k==='discipline');
   let group=String(first.группа||first.group||DEFGROUP).trim();
   if(!DB.groups.includes(group)) errors.push('Группа не найдена: '+group);
   const normCell=(subject,cab,teacher)=>{
     subject=String(subject||'').trim();cab=String(cab||'').trim();teacher=String(teacher||'').trim();
     if(!subject)return '';
     if(!subjects().includes(subject))throw E(400,'Предмет не добавлен администратором: '+subject);
     if(teacher){const tu=DB.users.find(z=>z.role==='t'&&z.name===teacher);if(!tu)throw E(400,'Преподаватель не создан: '+teacher);if(Array.isArray(tu.groups)&&!tu.groups.includes(group))throw E(400,'Преподаватель '+teacher+' не закреплён за группой '+group)}
     return subject+(cab?'|'+cab:'')+(teacher?'|'+teacher:'');
   };
   if(long){
     const days={пн:1,понедельник:1,mon:1,monday:1,вт:2,вторник:2,tue:2,tuesday:2,ср:3,среда:3,wed:3,wednesday:3,чт:4,четверг:4,thu:4,thursday:4,пт:5,пятница:5,fri:5,friday:5};
     const map={};
     try{
      rows.forEach((r,i)=>{const tm=String(r.время||r.time||'').trim();if(!TIME_SLOT.test(tm))throw E(400,'Строка '+(i+2)+': неверное время');const day=days[String(r.день||r.day||'').trim().toLowerCase()];if(!day)throw E(400,'Строка '+(i+2)+': неверный день');const key=tm;if(!map[key])map[key]=[tm,'','','','',''];map[key][day]=normCell(r.дисциплина||r.discipline||r.предмет||r.subject,r.кабинет||r.cabinet||r['кабинет №']||'',r.преподаватель||r.teacher||'')});
      const schedule=Object.keys(map).sort().map(k=>map[k]);DB.schedules[group]=schedule;DB.schedule=DB.schedules[DEFGROUP]||schedule;count=schedule.length;
     }catch(e){errors.push(e.message)}
   }else{
     const schedule=[];
    rows.forEach((r,i)=>{const row=[r.время||r.time,r.пн||r.mon||'',r.вт||r.tue||'',r.ср||r.wed||'',r.чт||r.thu||'',r.пт||r.fri||''];if(!TIME_SLOT.test(String(row[0]||'')))errors.push('Строка '+(i+2)+': неверное время');for(let j=1;j<6;j++){const c=String(row[j]||'').trim();if(!c)continue;const parts=c.split('|');try{row[j]=normCell(parts[0],parts[1],parts.slice(2).join('|'))}catch(e){errors.push('Строка '+(i+2)+': '+e.message)}}schedule.push(row)});if(!errors.length){DB.schedules[group]=schedule;DB.schedule=DB.schedules[DEFGROUP]||schedule;count=schedule.length}
   }
  }
  saveDb();ev('import','Импорт '+kind+': '+count+' строк',me.login);return send(res,200,{ok:true,count,errors})}
 if(m==='GET'&&p==='/api/admin/events'){need('a');return send(res,200,{events:EV.slice().reverse()})}
 if(m==='GET'&&p==='/api/admin/security'){
  need('a');const recent=EV.filter(e=>e.k==='login'||e.k==='fail').slice(-200).reverse().map(e=>Object.assign({},e,{meta:e.meta||{login:e.u||'',ip:'—'}}));
  const active=[...sessions.entries()].filter(([,s])=>s.exp>Date.now()).map(([id,s])=>{const user=DB.users.find(z=>z.id===s.uid);return{id:id.slice(0,8),name:user&&user.name||'Удалённый пользователь',login:user&&user.login||'—',role:user&&user.role||'—',ip:s.ip||'—',createdAt:s.createdAt||null,expiresAt:s.exp}});
  return send(res,200,{events:recent,sessions:active,disabled:DB.users.filter(z=>z.active===false).length})
 }
 if(m==='POST'&&p==='/api/admin/users/bulk'){
  need('a');const b=await body(req),action=String(b.action||''),ids=Array.isArray(b.ids)?[...new Set(b.ids.map(Number))]:[];
  if(!['disable','enable','revoke'].includes(action))throw E(400,'Неизвестное массовое действие');
  if(!ids.length||ids.length>100||ids.some(id=>!Number.isInteger(id)||id<1))throw E(400,'Выберите от 1 до 100 аккаунтов');
  const users=ids.map(id=>DB.users.find(z=>z.id===id));if(users.some(z=>!z))throw E(404,'Некоторые аккаунты не найдены');
  if(action!=='enable'&&users.some(z=>z.id===me.id))throw E(400,'Нельзя отключить или завершить собственный сеанс');
  if(action==='disable'&&users.some(z=>z.role==='a'&&z.active!==false)&&DB.users.filter(z=>z.role==='a'&&z.active!==false&&!ids.includes(z.id)).length===0)throw E(400,'Нельзя отключить последнего активного администратора');
  users.forEach(user=>{if(action==='disable')user.active=false;else if(action==='enable')user.active=true;else dropSessions(user.id)});
  if(action==='disable'||action==='enable')users.filter(user=>action==='disable'||user.active===true).forEach(user=>{if(action==='disable')dropSessions(user.id)});
  if(action!=='revoke')saveDb();
  ev('account','Массовое действие «'+action+'»: '+users.map(z=>z.login).join(', '),me.login);
  return send(res,200,{ok:true,count:users.length})
 }
 if(m==='GET'&&p==='/api/admin/support-requests'){need('a');return send(res,200,{requests:DB.supportRequests})}
 if(m==='PUT'&&(x=/^\/api\/admin\/support-requests\/(\d+)$/.exec(p))){need('a');const item=DB.supportRequests.find(z=>z.id===+x[1]);if(!item)throw E(404,'Обращение не найдено');const b=await body(req);if(!['new','resolved'].includes(b.status))throw E(400,'Некорректный статус');item.status=b.status;item.resolvedAt=b.status==='resolved'?new Date().toISOString():null;saveDb();ev('support','Обращение №'+item.id+' '+(item.status==='resolved'?'закрыто':'переоткрыто'),me.login);return send(res,200,{ok:true})}
 if(m==='POST'&&p==='/api/admin/events/clear'){need('a');EV.length=0;try{fs.writeFileSync(EFILE,'')}catch(e){};return send(res,200,{ok:true})}
 if(m==='POST'&&p==='/api/admin/sessions/reset'){need('a');sessions.clear();saveSessions();return send(res,200,{ok:true})}
 if(m==='GET'&&p==='/api/admin/status'){need('a');return send(res,200,status())}
 if(m==='POST'&&p==='/api/grades'){need('t','d');const b=await body(req);
  if(!DB.users.some(z=>z.id===b.sid&&z.role==='s'))throw E(400,'Выберите студента');
  if(subjects().indexOf(b.s)<0)throw E(400,'Неизвестный предмет');if(TYPES.indexOf(b.t)<0)throw E(400,'Неизвестный тип работы');
  if(!/^\d{4}-\d{2}-\d{2}$/.test(b.d||''))throw E(400,'Некорректная дата');if(![2,3,4,5].includes(b.v))throw E(400,'Оценка от 2 до 5');
  DB.grades.push({id:DB.next.grade++,sid:b.sid,s:b.s,d:b.d,t:b.t,v:b.v});saveDb();return send(res,201,{ok:true})}
 if(m==='DELETE'&&(x=/^\/api\/grades\/(\d+)$/.exec(p))){need('t','d');DB.grades=DB.grades.filter(g=>g.id!==+x[1]);saveDb();return send(res,200,{ok:true})}
if(m==='POST'&&p==='/api/works'){need('s');let meta;try{meta=JSON.parse(decodeURIComponent(req.headers['x-meta']||''))}catch(e){throw E(400,'Некорректные данные')}
  if(SUBJ.indexOf(meta.s)<0)throw E(400,'Неизвестный предмет');
  const t=str(meta.t,1,120,'Название'),f=str(meta.f,1,200,'Файл'),e=str(meta.e,1,10,'Формат'),d=new Date().toISOString().slice(0,10),data=await rawBody(req,MAXF);
  if(!data.length)throw E(400,'Файл пустой');
  const id=DB.next.work++,z=data.length<1048576?Math.max(1,Math.round(data.length/1024))+' КБ':(data.length/1048576).toFixed(1).replace('.',',')+' МБ';
  fs.mkdirSync(FILES,{recursive:true});fs.writeFileSync(fpath(id),data);
  DB.works.push({id,sid:me.id,s:meta.s,t,f,e,z,d,has:1});saveDb();return send(res,201,{ok:true})}
 if(m==='GET'&&(x=/^\/api\/works\/(\d+)\/file$/.exec(p))){const w=DB.works.find(z=>z.id===+x[1]);if(!w||(!T&&w.sid!==me.id))throw E(404,'Работа не найдена');
  let d;try{d=fs.readFileSync(fpath(w.id))}catch(e){throw E(404,'Файл не сохранён на сервере')}
  res.writeHead(200,Object.assign({'Content-Type':'application/octet-stream','Content-Length':d.length,'Content-Disposition':"attachment; filename*=UTF-8''"+encodeURIComponent(w.f).replace(/['()]/g,escape),'Cache-Control':'no-store'},SEC));return res.end(d)}
 if(m==='PUT'&&(x=/^\/api\/works\/(\d+)\/check$/.exec(p))){need('t','d');const w=DB.works.find(z=>z.id===+x[1]);if(!w)throw E(404,'Работа не найдена');const b=await body(req);w.st=b.checked===false?'new':'ok';saveDb();return send(res,200,{ok:true})}
 if(m==='DELETE'&&(x=/^\/api\/works\/(\d+)$/.exec(p))){const w=DB.works.find(z=>z.id===+x[1]);if(!w||(!T&&w.sid!==me.id))throw E(404,'Работа не найдена');DB.works=DB.works.filter(z=>z!==w);rmFile(w.id);saveDb();return send(res,200,{ok:true})}
 throw E(404,'Не найдено');
}
/* ---- проверка работы сайта (для администратора) ---- */
const kb=n=>Math.max(1,Math.round(n/1024))+' КБ',mb=n=>(n/1048576).toFixed(1).replace('.',',')+' МБ';
const DEFPW={teacher:'teacher123',roma:'roma12345',admin:'admin12345',director:'director123'};
function status(){
 const ck=[],add=(lvl,name,detail)=>ck.push({l:lvl,n:name,d:detail});
 try{const sz=fs.statSync(FILE).size;JSON.parse(fs.readFileSync(FILE,'utf8'));add('ok','Файл базы данных','читается, размер '+kb(sz))}catch(e){add('bad','Файл базы данных','не читается: '+e.message)}
 try{const t=path.join(DIR,'.w'+Date.now());fs.writeFileSync(t,'1');fs.unlinkSync(t);add('ok','Запись на диск','папка data доступна для записи')}catch(e){add('bad','Запись на диск','нет доступа: '+e.message)}
 const ids=new Set(DB.users.map(z=>z.id)),og=DB.grades.filter(g=>!ids.has(g.sid)).length,ow=DB.works.filter(w=>!ids.has(w.sid)).length;
 add(og||ow?'warn':'ok','Целостность данных',og||ow?'оценок без студента: '+og+', работ без студента: '+ow:'все оценки и работы привязаны к существующим студентам');
 let miss=0,nf=0,fsz=0;DB.works.forEach(w=>{if(w.has){try{fsz+=fs.statSync(fpath(w.id)).size;nf++}catch(e){miss++}}});
 add(miss?'bad':'ok','Файлы работ',miss?'не найдено на диске: '+miss+' из '+(nf+miss):(nf?'все '+nf+' на месте, '+mb(fsz):'файлов пока нет'));
 const logins=DB.users.map(z=>z.login.toLowerCase()),dup=logins.length-new Set(logins).size;
 add(dup?'bad':'ok','Уникальность логинов',dup?'найдены повторяющиеся логины: '+dup:'повторов нет');
 const weak=DB.users.filter(u=>DEFPW[u.login.toLowerCase()]&&checkPw(u,DEFPW[u.login.toLowerCase()])).map(u=>u.login);
 add(weak.length?'warn':'ok','Пароли по умолчанию',weak.length?'не заменены у: '+weak.join(', ')+'. Смените их':'стандартные пароли заменены');
 add(DB.users.some(z=>z.role==='a')&&DB.users.some(z=>z.role==='d')?'ok':'bad','Служебные аккаунты','администратор и директор на месте');
 const day=Date.now()-864e5,er=EV.filter(e=>e.k==='error'&&e.t>day).length;
 add(er?'warn':'ok','Ошибки сервера за 24 часа',er?'было ошибок: '+er+' (см. журнал событий)':'ошибок нет');
 const worst=ck.some(c=>c.l==='bad')?'bad':ck.some(c=>c.l==='warn')?'warn':'ok';
 let free=null;try{if(fs.statfsSync){const f=fs.statfsSync(DIR);free=f.bavail*f.bsize}}catch(e){}
 const cnt=r=>DB.users.filter(z=>z.role===r).length;
 return{worst,checks:ck,now:Date.now(),uptime:Math.round(process.uptime()),node:process.version,rss:process.memoryUsage().rss,free,
  cnt:{s:cnt('s'),t:cnt('t'),d:cnt('d'),a:cnt('a'),grades:DB.grades.length,works:DB.works.length,unchecked:DB.works.filter(w=>w.st!=='ok').length,news:DB.news.length},
  sessions:[...sessions.values()].filter(v=>v.exp>Date.now()).length,
  logins:EV.filter(e=>e.k==='login'&&e.t>day).length,fails:EV.filter(e=>e.k==='fail'&&e.t>day).length}}
/* ---- статические файлы из ./public ---- */
const MIME={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.png':'image/png','.svg':'image/svg+xml','.ico':'image/x-icon'};
function serve(req,res,u){
 if(req.method!=='GET'&&req.method!=='HEAD'){res.writeHead(405);return res.end()}
 let p;try{p=decodeURIComponent(u.pathname)}catch(e){res.writeHead(400);return res.end()}
 if(p==='/')p='/index.html';
 const f=path.join(ROOT,path.normalize(p));
 if(f.indexOf(ROOT+path.sep)!==0){res.writeHead(403);return res.end()}
 fs.readFile(f,(e,d)=>{if(e){res.writeHead(404,{'Content-Type':'text/plain; charset=utf-8'});return res.end('Не найдено')}
  res.writeHead(200,Object.assign({'Content-Type':MIME[path.extname(f)]||'application/octet-stream','Cache-Control':'no-cache'},SEC));res.end(d)})}
loadDb();
http.createServer((req,res)=>{const u=new URL(req.url,'http://x');
 if(u.pathname==='/auth/google'||u.pathname==='/auth/google/callback')return googleAuthRoute(req,res,u).catch(e=>{ev('error','Google OAuth '+u.pathname+': '+(e&&e.message));googleRedirect(res,'google-error',googleCookie(req,'google_oauth_state','',0))});
 if(u.pathname.startsWith('/api/'))return api(req,res,u).catch(e=>{if(!e.status)ev('error',req.method+' '+u.pathname+': '+(e&&e.message));send(res,e.status||500,{error:e.status?e.message:'Ошибка сервера'})});
 serve(req,res,u)}).listen(PORT,()=>console.log('Progress: http://localhost:'+PORT));
