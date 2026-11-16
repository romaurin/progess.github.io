(function(){
var $=function(s){return document.querySelector(s)};
var ROLE="s",GROUP="ПРГ 3-1",SCHGROUP="",SCH_EDIT=false,IC="assets/icons/",ME={id:0,name:"",ini:"",role:"",login:""};
var SUBJ=[];
var MON=["янв","фев","мар","апр","мая","июн","июл","авг","сен","окт","ноя","дек"];
var SEARCH='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>';
/* ---- данные с сервера ---- */
var DB={students:[],grades:[],works:[],users:[],schedule:[],subjects:[],news:[]};
var RN={a:"Администратор",d:"Директор",t:"Преподаватель",s:"Студент"},RC={a:"r",d:"p",t:"b",s:"g"};
function sch(){var g=SCHGROUP||GROUP,db=load();return (db.schedules&&Array.isArray(db.schedules[g]))?db.schedules[g]:(g===GROUP&&Array.isArray(db.schedule)?db.schedule:[])}
function load(){return DB}
function api(m,u,b){return fetch(u,{method:m,headers:b?{"Content-Type":"application/json"}:{},body:b?JSON.stringify(b):undefined,credentials:"same-origin"}).then(function(r){return r.json().catch(function(){return{}}).then(function(j){if(!r.ok){var er=new Error(j.error||"Ошибка");er.status=r.status;throw er}return j})})}
function refresh(){return api("GET","/api/db").then(function(d){DB=d;SUBJ=Array.isArray(d.subjects)?d.subjects:[];if(d.group)GROUP=d.group;render()})}
function fail(er){if(er.status===401)location.href="index.html";else toast(er.message)}
/* ---- утилиты ---- */
function avg(a){return a.length?a.reduce(function(x,y){return x+y},0)/a.length:null}
function f1(v){return v==null?"—":v.toFixed(1).replace(".",",")}
function chip(v){return'<span class="gr '+({5:"g",4:"b",3:"y",2:"r"}[v]||"")+'">'+v+'</span>'}
function dm(d){return d.slice(8)+" "+MON[+d.slice(5,7)-1]}
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})}
function p2(n){return(n<10?"0":"")+n}
function cap(s){return s.charAt(0).toUpperCase()+s.slice(1)}
function val(g){return g.v}
function sname(id){var s=load().students.filter(function(x){return x.id===id})[0];return s?esc(s.name):"—"}
function toast(m){var t=document.createElement("div");t.className="toast";t.textContent=m;document.body.appendChild(t);setTimeout(function(){t.remove()},3800)}
function csv(name,rows){var text=rows.map(function(row){return row.map(function(value){return '"'+String(value==null?"":value).replace(/"/g,'""')+'"'}).join(";")}).join("\r\n");var a=document.createElement("a");a.href=URL.createObjectURL(new Blob(["\ufeff"+text],{type:"text/csv;charset=utf-8"}));a.download=name;a.click();setTimeout(function(){URL.revokeObjectURL(a.href)},1000)}
function head(t,s,b,go){return'<div class="ph"><div><h1>'+t+'</h1><p class="sub">'+s+'</p></div>'+(b?'<button class="pb"'+(go?(go.indexOf("act:")===0?' data-act="'+go.slice(4)+'"':' data-go="'+go+'"'):'')+'>+ '+b+'</button>':'')+'</div>'}
function tbl(c,rows,e){return'<div class="tw"><table><thead><tr>'+c.map(function(x){return'<th>'+x+'</th>'}).join("")+'</tr></thead><tbody>'+(rows||'<tr><td class="em" colspan="'+c.length+'">'+e+'</td></tr>')+'</tbody></table></div>'}
function tools(f,extra){return'<div class="tools">'+(f||[]).map(function(x){return'<select><option>'+x+'</option></select>'}).join("")+'<label class="sr">'+SEARCH+'<input id="q" placeholder="Поиск"></label>'+(extra||"")+'</div>'}
function stat(ic,c,l,v,s){return'<div class="stat"><i class="ic '+c+'"><img src="'+IC+ic+'.png" alt=""></i><div><small>'+l+'</small><b>'+v+'</b>'+(s?'<em>'+s+'</em>':"")+'</div></div>'}
/* ---- страницы ---- */
var FI=["1 курс","Все предметы"];
var T={
journal:{t:"Мой журнал",s:"Электронный журнал успеваемости · "+GROUP+" · 2026/27",b:"Добавить заметку",f:FI,c:["№","Предмет","Преподаватель","Ср. балл"],e:"Записей пока нет"},
attendance:{t:"Посещаемость",s:"Сентябрь 2026",f:FI,c:["Предмет","Пропуски","Опозд."],e:"Отметок посещаемости пока нет"},
tasks:{t:"Задания",s:"Заданий на текущую неделю нет",b:"Загрузить работу",f:FI,c:["Срок","Предмет","Задание","Формат","Статус","Файл"],e:"Заданий пока нет"},
notifications:{t:"Уведомления",s:"Новых уведомлений нет",b:"Прочитать все",f:["Все категории","Все статусы"],c:["Дата","Категория","Событие","Подробности","Статус"],e:"Уведомлений пока нет"},
messages:{t:"Сообщения",s:"Переписка",b:"Новое сообщение",f:["Все собеседники","Все предметы"],c:["Собеседник","Предмет","Тема","Последнее сообщение","Дата","Новые"],e:"Сообщений пока нет"},
materials:{t:"Материалы",s:"Учебные файлы и ссылки преподавателей",f:FI,c:["Предмет","Преподаватель","Название","Формат","Добавлено","Статус","Открыть"],e:"Материалов пока нет"},
settings:{t:"Настройки",s:"Уведомления, безопасность и параметры электронного журнала",b:"Сохранить",f:["Уведомления","Все каналы"],c:["Настройка","Описание","Включено","Параметр"],e:"Настроек пока нет"}};
function tasks(){
 var w=load().works||[],c=T.tasks;
 var rows=w.slice().reverse().map(function(x){return'<tr><td class="mu">'+dm(x.d)+'</td><td>'+esc(x.s)+'</td><td><b>'+esc(x.t)+'</b>'+(ROLE==="t"?'<small>'+sname(x.sid)+'</small>':'')+'</td><td>'+esc(x.e)+' · '+x.z+'</td><td>'+(x.st==="ok"?'<span class="tag b">Проверено</span>':'<span class="tag g">Отправлено</span>')+'</td><td>'+(x.has?'<a class="fl" href="/api/works/'+x.id+'/file" download>'+esc(x.f)+'</a>':esc(x.f))+'</td><td style="white-space:nowrap">'+(x.has?'<a class="del lnk" href="/api/works/'+x.id+'/file" download>Скачать</a>':'')+(ROLE==="t"?'<button class="del chk" data-chk="'+x.id+'" data-on="'+(x.st==="ok"?"0":"1")+'">'+(x.st==="ok"?"Снять проверку":"Проверить")+'</button> ':'')+'<button class="del" data-delw="'+x.id+'">Удалить</button></td></tr>'}).join("");
 return head(c.t,w.length?"Отправлено работ: "+w.length:c.s,ROLE==="t"?"":"Загрузить работу","act:upload")+tools(c.f)+tbl(["Дата","Предмет","Работа","Формат","Статус","Файл",""],rows,c.e)}
var ATT={present:["Был","g"],absent:["Отсутствовал","r"],late:["Опоздал","y"]};
function attendancePage(){
 var db=load(),records=(db.attendance||[]).slice().sort(function(a,b){return a.d<b.d?1:a.d>b.d?-1:b.id-a.id}),today=new Date(),iso=today.getFullYear()+"-"+p2(today.getMonth()+1)+"-"+p2(today.getDate());
 if(ROLE==="t"||ROLE==="d"){
  var form='<div class="card fm" style="margin-bottom:18px"><div class="fg"><label>Студент<select id="as">'+db.students.map(function(s){return'<option value="'+s.id+'">'+esc(s.name)+'</option>'}).join("")+'</select></label><label>Предмет<select id="aj">'+SUBJ.map(function(s){return'<option>'+s+'</option>'}).join("")+'</select></label><label>Дата<input type="date" id="ad" value="'+iso+'"></label><label>Статус<select id="av"><option value="present">Был</option><option value="absent">Отсутствовал</option><option value="late">Опоздал</option></select></label></div><button class="pb" data-act="saveattendance">Сохранить отметку</button></div>';
  var rows=records.map(function(x){var st=ATT[x.status]||[x.status,"y"];return'<tr><td>'+sname(x.sid)+'</td><td>'+esc(x.s)+'</td><td class="mu">'+dm(x.d)+'</td><td><span class="tag '+st[1]+'">'+st[0]+'</span></td><td><button class="del" data-dela="'+x.id+'">Удалить</button></td></tr>'}).join("");
  var summary=db.students.map(function(s){var mine=records.filter(function(x){return x.sid===s.id});return'<tr><td><b>'+esc(s.name)+'</b></td><td>'+mine.filter(function(x){return x.status==="present"}).length+'</td><td>'+mine.filter(function(x){return x.status==="absent"}).length+'</td><td>'+mine.filter(function(x){return x.status==="late"}).length+'</td><td>'+mine.length+'</td></tr>'}).join("");
  return head("Посещаемость","Отметки группы · данные сохраняются сразу")+form+'<div class="tabs"><span class="sp"></span><button data-act="exportAttendance">Скачать CSV</button></div><h2 class="h2" style="margin-top:0">Сводка по группе</h2>'+tbl(["Студент","Был","Отсутствовал","Опоздал","Всего"],summary,"Студентов пока нет")+'<h2 class="h2">Последние отметки</h2>'+tbl(["Студент","Предмет","Дата","Статус",""],rows,"Отметок пока нет");
 }
 var mine=records.map(function(x){var st=ATT[x.status]||[x.status,"y"];return'<tr><td>'+esc(x.s)+'</td><td class="mu">'+dm(x.d)+'</td><td><span class="tag '+st[1]+'">'+st[0]+'</span></td></tr>'}).join("");
 return head("Посещаемость","Личная история посещения занятий")+'<div class="tabs"><span class="sp"></span><button data-act="exportAttendance">Скачать CSV</button></div>'+tbl(["Предмет","Дата","Статус"],mine,"Отметок пока нет");
}
function messagesPage(){
 var db=load(),msgs=(db.messages||[]).slice().sort(function(a,b){return b.id-a.id}),canGroup=ROLE==="t"||ROLE==="d";
 var opts=(ROLE!=="a"?'<option value="admin">Администратору</option>':"")+(canGroup?'<option value="group">Вся группа</option>':"")+(db.contacts||[]).map(function(x){return'<option value="'+x.id+'">'+esc(x.name)+' · '+(x.role==="s"?"студент":"преподаватель")+'</option>'}).join("");
 var form='<div class="card fm" style="margin-bottom:18px"><div class="fg2"><label>Получатель<select id="mt">'+opts+'</select></label><label>Тема<input id="ms" maxlength="120" placeholder="Например, Вопрос по заданию"></label></div><label>Сообщение<textarea id="mx" rows="4" maxlength="2000" placeholder="Напишите сообщение"></textarea></label><button class="pb" data-act="sendmsg">Отправить сообщение</button></div>';
 var rows=msgs.map(function(x){var incoming=x.to===ME.id;return'<tr><td><b>'+(incoming?esc(x.fromName):"Вы")+'</b><small>'+(x.group?"Вся группа":"Личное сообщение")+'</small></td><td>'+esc(x.subject)+'</td><td>'+esc(x.text)+'</td><td class="mu">'+dm(x.d)+'</td><td>'+(incoming&&!x.read?'<button class="del lnk" data-read="'+x.id+'">Прочитано</button>':(x.read?'<span class="tag g">Прочитано</span>':""))+'</td></tr>'}).join("");
 return head("Сообщения",msgs.length?"Переписка и объявления · "+msgs.length:"Начните переписку с преподавателем или группой")+form+tbl(["Собеседник","Тема","Сообщение","Дата",""],rows,"Сообщений пока нет");
}
function importPage(){return head("Импорт из Excel","Загрузите CSV из Excel для массового добавления данных")+'<div class="card fm"><div class="fg2"><label>Что импортировать<select id="ik"><option value="students">Студентов</option><option value="grades">Оценки</option><option value="schedule">Расписание</option></select></label><label>CSV-файл<input type="file" id="if" accept=".csv,text/csv"></label></div><p class="sub">Студенты: ФИО; Логин; Пароль; Группа. Оценки: Логин; Предмет; Дата; Тип; Оценка. Расписание: Группа;Время;ПН;ВТ;СР;ЧТ;ПТ. Ячейка: Предмет|Кабинет|Преподаватель. Также можно импортировать формат: Группа;День;Время;Кабинет;Дисциплина;Преподаватель. Преподаватель необязателен.</p><button class="pb" data-act="importcsv">Импортировать</button><div id="importResult"></div></div>'}
function modal(){
 var m=document.createElement("div");m.className="ov";m.id="mod";
 m.innerHTML='<div class="md"><h2>Загрузить работу</h2><div class="fm"><label>Предмет<select id="ws">'+SUBJ.map(function(x){return'<option>'+x+'</option>'}).join("")+'</select></label><label>Название работы<input id="wt" placeholder="Например, Практическая работа № 4"></label><label>Файл<input type="file" id="wf"></label></div><div class="mb"><button class="pb o" data-act="closem">Отмена</button><button class="pb" data-act="sendw">Отправить</button></div></div>';
 document.body.appendChild(m)}
function credModal(id,c){
 var m=document.createElement("div");m.className="ov";m.id="mod";
 m.innerHTML='<div class="md"><h2>Данные пользователя</h2><p class="sub" style="margin:-8px 0 14px">'+esc(c.name)+'</p>'+
 '<div class="cr"><span>Логин</span><b id="cl">'+esc(c.login)+'</b><button data-copy="cl">Копировать</button></div>'+
 (c.password?'<div class="cr"><span>Пароль</span><b id="cp">'+esc(c.password)+'</b><button data-copy="cp">Копировать</button></div>':'<div class="cr"><span>Пароль</span><b style="font-family:inherit;color:#64748b">не сохранён, задайте новый</b></div>')+
 '<div class="fm" style="margin-top:14px"><label>Новый пароль<input id="npw" placeholder="От 8 символов" autocomplete="off"></label></div>'+
 '<div class="mb"><button class="pb o" data-act="closem">Закрыть</button><button class="pb" data-act="setpw" data-id="'+id+'">Сменить пароль</button></div></div>';
 document.body.appendChild(m)}
function googleLinkModal(id,email){var m=document.createElement("div");m.className="ov";m.id="mod";m.innerHTML='<div class="md"><h2>Привязать Google</h2><p class="sub">Укажите подтверждённый Google email этого пользователя. Пустое поле снимет привязку.</p><div class="fm"><label>Email Google<input id="googleEmail" type="email" maxlength="254" value="'+esc(email)+'" placeholder="name@example.com" autocomplete="email"></label></div><div class="mb"><button class="pb o" data-act="closem">Отмена</button><button class="pb" data-act="saveGoogleLink" data-id="'+id+'">Сохранить</button></div></div>';document.body.appendChild(m)}
function gen(k){if(k==="tasks")return tasks();var c=T[k];return head(c.t,c.s,c.b)+tools(c.f)+tbl(c.c,"",c.e)}
function profEdit(){return'<h2 class="h2">Данные для входа</h2><div class="card fm"><div class="fg2"><label>ФИО<input id="pn" value="'+esc(ME.name)+'" maxlength="100"></label><label>Логин<input id="pl" value="'+esc(ME.login)+'" maxlength="64" autocomplete="off"></label><label>Новый пароль (если нужно сменить)<input id="pp" type="password" placeholder="От 8 символов" autocomplete="new-password"></label><label>Повторите новый пароль<input id="pp2" type="password" autocomplete="new-password"></label><label>Текущий пароль (обязательно)<input id="pc" type="password" autocomplete="current-password"></label></div><button class="pb" data-act="saveprof">Сохранить изменения</button></div>'}
function profile(){
 var adm=ROLE==="a"||ROLE==="d",db=load(),r=adm?[["ФИО",esc(ME.name)],["Роль",ME.role],["Логин",esc(ME.login)]]:[["ФИО",esc(ME.name)],[ROLE==="t"?"Группы":"Группа",ROLE==="t"?esc((db.teacherGroups||[]).join(", ")):GROUP],["Логин",esc(ME.login)],["Дата рождения","—"],["Электронная почта","—"],["Телефон","—"]];
 return head("Мой профиль",adm?"Учётная карточка":"Учётная и учебная карточка")+'<div class="card pc"><span class="ava big">'+ME.ini+'</span><div><b style="font-size:18px">'+esc(ME.name)+'</b><p class="sub">'+(adm?ME.role+' · ПК «Прогресс»':'Группа '+GROUP+' · ПК «Прогресс» · 2026/27 учебный год')+'</p></div></div>'+
 tbl(["Поле","Значение"],r.map(function(x){return'<tr><td class="mu">'+x[0]+'</td><td><b>'+x[1]+'</b></td></tr>'}).join(""))+(ROLE==="s"?"":profEdit())}
function schedule(){
 var db=load(),groups=db.groups||[GROUP];
 if(!SCHGROUP||groups.indexOf(SCHGROUP)<0)SCHGROUP=ROLE==="t"?((db.teacherGroups||[])[0]||GROUP):GROUP;
 var selected=SCHGROUP;
 var names=["Понедельник","Вторник","Среда","Четверг","Пятница"],keys=["ПН","ВТ","СР","ЧТ","ПТ"],data=sch(),total=0,rows="";
 if(data.length){
  names.forEach(function(day,dayIndex){
   data.forEach(function(r,index){
    var cell=String(r[dayIndex+1]||""),parts=cell.split("|"),subject=parts[0]||"",cabinet=parts[1]||"",teacher=parts.slice(2).join("|")||"";
    if(cell.trim())total++;
    rows+='<tr class="schedule-row'+(index===0?' day-start':'')+'">'+(index===0?'<td class="schedule-day" rowspan="'+data.length+'"><b>'+day+'</b><small>'+keys[dayIndex]+'</small></td>':'')+'<td class="schedule-number">'+(index+1)+'</td><td class="schedule-time">'+esc(r[0]||"")+'</td><td class="schedule-room">'+esc(cabinet)+'</td><td class="schedule-discipline">'+esc(subject)+'</td><td class="schedule-teacher">'+esc(teacher)+'</td></tr>';
   });
  });
 }
 var selector=ROLE==="t"||ROLE==="d"?'<label class="schedule-group">Группа<select id="schg">'+(ROLE==="t"?(db.teacherGroups||[]):groups).map(function(g){return'<option value="'+esc(g)+'"'+(g===selected?' selected':'')+'>'+esc(g)+'</option>'}).join('')+'</select></label>':'<span class="schedule-group-name">Группа <b>'+esc(selected)+'</b></span>';
 var sheet='<section class="schedule-sheet"><header class="schedule-sheet-head"><div><b>РАСПИСАНИЕ ЗАНЯТИЙ</b><span>Учебный год 2026/27</span></div><strong>'+esc(selected)+'</strong></header><div class="tw schedule-table-wrap"><table class="schedule-table"><thead><tr><th class="schedule-day-head">День недели</th><th class="schedule-number-head">№</th><th class="schedule-time-head">Время</th><th class="schedule-room-head">Кабинет №</th><th>Дисциплина</th><th>Ф.И.О. преподавателя</th></tr></thead><tbody>'+rows+'</tbody></table></div></section>';
 return head("Расписание","Занятия по дням недели · "+selected,"Скачать CSV","act:exportSchedule")+'<div class="schedule-controls">'+selector+(ROLE==="d"?'<button class="pb o" data-act="editSchedule">Изменить расписание</button>':'')+'</div>'+(data.length?sheet:'<div class="card empty-schedule"><h2>Расписание пока не создано</h2><p class="sub">Администратор ещё не создал расписание для группы '+esc(selected)+'.</p></div>')+(data.length?'<p class="sub schedule-count">Заполнено занятий: '+total+'</p>':'');
}
function schRow(r,i,teachers){var D=[1,2,3,4,5],ts=teachers||[],subjects=SUBJ||[];return'<tr><td class="tm"><input class="si tm" value="'+esc(r[0]||"")+'" maxlength="11" placeholder="08:30-10:00"><small>'+(i+1)+' пара</small></td>'+D.map(function(j){var p=(r[j]||"").split("|"),sel=p[2]||"",cur=p[0]||"",opts=subjects.slice();if(cur&&opts.indexOf(cur)<0)opts.unshift(cur);return'<td><select class="si subject" title="Предмет"><option value="">Предмет</option>'+opts.map(function(x){return'<option value="'+esc(x)+'"'+(x===cur?' selected':'')+'>'+esc(x)+(subjects.indexOf(x)<0?' (не добавлен администратором)':'')+'</option>'}).join("")+'</select><input class="si rm" placeholder="Каб." value="'+esc(p[1]||"")+'" maxlength="12"><select class="si teacher" title="Преподаватель"><option value="">Преподаватель не назначен</option>'+ts.map(function(t){return'<option value="'+esc(t.name)+'"'+(t.name===sel?' selected':'')+'>'+esc(t.name)+'</option>'}).join("")+'</select></td>'}).join("")+'</tr>'}
function scheduleEdit(){
 var D=["ПН","ВТ","СР","ЧТ","ПТ"],db=load(),groups=db.groups||[GROUP];
 if(!SCHGROUP||groups.indexOf(SCHGROUP)<0)SCHGROUP=groups[0];
 var teachers=(db.users||[]).filter(function(t){return t.role==="t"&&(t.groups||[]).indexOf(SCHGROUP)>=0});
 var existing=sch(),rows=existing.length?existing:Array.from({length:4},function(_,i){return["","","","","",""]});
 return head("Расписание групп","Создайте расписание отдельно для каждой группы · преподаватель выбирается для каждой пары")+
 '<div class="tools"><label style="min-width:240px">Группа<select id="schg">'+groups.map(function(g){return'<option value="'+esc(g)+'"'+(g===SCHGROUP?' selected':'')+'>'+esc(g)+'</option>'}).join("")+'</select></label><span class="sub" style="align-self:center">Сейчас редактируется: <b>'+esc(SCHGROUP)+'</b></span></div>'+
 '<div class="card" style="margin-bottom:14px"><b>'+esc(SCHGROUP)+'</b><div class="sub" style="margin-top:5px">Преподавателей, закреплённых за группой: '+(teachers.length?teachers.map(function(t){return esc(t.name)}).join(", "):"пока нет — добавьте преподавателя и назначьте ему эту группу")+'</div></div>'+
 '<div class="tw"><table id="sch"><thead><tr><th>Время</th>'+D.map(function(d){return'<th>'+d+'</th>'}).join("")+'</tr></thead><tbody>'+rows.map(function(r,i){return schRow(r,i,teachers)}).join("")+'</tbody></table></div>'+ 
 '<div class="add" style="margin-top:14px"><button class="pb o" data-act="addrow">+ Добавить пару</button><button class="pb o" data-act="delrow">Убрать последнюю</button><span style="flex:1"></span><button class="pb o" data-act="cancelSchedule">Отмена</button><button class="pb o" data-act="exportSchedule">Скачать CSV</button><button class="pb" data-act="savesch">Сохранить расписание</button></div>'+ 
 '<p class="sub">Расписание для этой группы пока '+(existing.length?'создано.':'не создано — заполните пары ниже и сохраните.')+' Предмет, кабинет и преподаватель можно указывать отдельно для каждого дня.</p>'}
var GSID=0;
var GSGROUP="";
function teacherJournal(){
 var db=load(),groups=db.teacherGroups&&db.teacherGroups.length?db.teacherGroups:[GROUP];
 if(groups.indexOf(GSGROUP)<0)GSGROUP=groups[0];
 var monthValue=new Date().getFullYear()+"-"+p2(new Date().getMonth()+1),monthInput=document.querySelector("#gm");
 if(monthInput&&/^\d{4}-\d{2}$/.test(monthInput.value))monthValue=monthInput.value;
 var year=+monthValue.slice(0,4),month=+monthValue.slice(5,7)-1,days=new Date(year,month+1,0).getDate(),subjectInput=document.querySelector("#gf"),subject=subjectInput?subjectInput.value:"";
 var students=db.students.filter(function(s){return s.group===GSGROUP}).sort(function(a,b){return a.name.localeCompare(b.name,"ru")});
 var records=db.grades.filter(function(g){return g.d.slice(0,7)===monthValue&&(!subject||g.s===subject)&&students.some(function(s){return s.id===g.sid})});
 var dayNames=["Вс","Пн","Вт","Ср","Чт","Пт","Сб"],dayHeads="";
 for(var day=1;day<=days;day++){var dow=new Date(year,month,day).getDay();dayHeads+='<th class="jday'+(dow===0||dow===6?' weekend':'')+'">'+day+'<small>'+dayNames[dow]+'</small></th>'}
 var rows=students.map(function(student,index){
  var mine=records.filter(function(g){return g.sid===student.id}),marks=mine.map(function(g){return g.v}),avgText=f1(avg(marks));
  var cells="";
  for(var n=1;n<=days;n++){
   var iso=monthValue+"-"+p2(n),inDay=mine.filter(function(g){return g.d===iso}).sort(function(a,b){return a.id-b.id});
   cells+='<td class="jmark">'+inDay.map(function(g){return'<span title="'+esc(g.s+" · "+g.t)+'">'+g.v+'</span>'}).join("")+'</td>';
  }
  return'<tr><td class="jnum">'+(index+1)+'</td><td class="jname">'+esc(student.name)+'</td>'+cells+'<td class="javg">'+avgText+'</td></tr>';
 }).join("");
 var controls='<div class="tools journal-tools"><label>Группа<select id="jgroup">'+groups.map(function(g){return'<option value="'+esc(g)+'"'+(g===GSGROUP?' selected':'')+'>'+esc(g)+'</option>'}).join("")+'</select></label><label>Предмет<select id="gf"><option value="">Все предметы</option>'+SUBJ.map(function(s){return'<option'+(s===subject?' selected':'')+'>'+esc(s)+'</option>'}).join("")+'</select></label><label>Месяц<input type="month" id="gm" value="'+monthValue+'"></label><button class="pb o" data-act="exportGrades">Скачать CSV</button><button class="pb" data-go="put">+ Добавить оценку</button></div>';
 var title='<div class="journal-caption"><div><strong>ЖУРНАЛ УСПЕВАЕМОСТИ</strong><span>Учебный год 2026/27 · '+esc(GSGROUP)+'</span></div><b>'+esc(SUBJ.length?(subject||"Все предметы"):"Предмет не добавлен")+' · '+new Date(year,month,1).toLocaleDateString("ru-RU",{month:"long",year:"numeric"})+'</b></div>';
 var table='<div class="tw journal-grid"><table><thead><tr><th class="jnum">№</th><th class="jname">Студент</th>'+dayHeads+'<th class="javg">Средний</th></tr></thead><tbody>'+(rows||'<tr><td class="em" colspan="'+(days+3)+'">'+(students.length?"Оценок пока нет":"Студентов в группе пока нет")+'</td></tr>')+'</tbody></table></div>';
 return head("Журнал успеваемости","Успеваемость группы · оценки по дням")+controls+'<section class="journal-sheet">'+title+table+'</section>';
}
function grades(){
 if(ROLE==="t")return teacherJournal();
 var db=load(),sid=ROLE==="t"?(db.students.some(function(s){return s.id===GSID})?GSID:(db.students[0]||{}).id):ME.id,my=db.grades.filter(function(g){return g.sid===sid}),ds=[],ty={};
 my.forEach(function(g){if(ds.indexOf(g.d)<0)ds.push(g.d);if(!ty[g.d])ty[g.d]=g.t});ds.sort();
 var subs=SUBJ.filter(function(s,i){return i<9||my.some(function(g){return g.s===s})});
 var th=["Предмет"].concat(ds.map(function(d){return dm(d)+'<small>'+ty[d]+'</small>'}),["Средний","Итог"]);
 var rows=my.length?subs.map(function(s){var gs=my.filter(function(g){return g.s===s}),a=avg(gs.map(val));
  return'<tr data-s="'+s+'"><td><b>'+s+'</b></td>'+ds.map(function(d){var x=gs.filter(function(g){return g.d===d}).pop();return'<td class="c">'+(x?chip(x.v):"—")+'</td>'}).join("")+'<td class="c">'+f1(a)+'</td><td class="c">'+(a==null?"—":chip(Math.round(a)))+'</td></tr>'}).join(""):"";
 var sel=ROLE==="t"?'<select id="gs">'+db.students.map(function(s){return'<option value="'+s.id+'"'+(s.id===sid?" selected":"")+'>'+esc(s.name)+'</option>'}).join("")+'</select>':'<select><option>1 курс</option></select>';
 var pj='<select id="gf"><option value="">Все предметы</option>'+SUBJ.map(function(s){return'<option>'+s+'</option>'}).join("")+'</select>';
 return head(ROLE==="t"?"Журнал успеваемости":"Оценки","Журнал успеваемости · I семестр · "+sname(sid))+
 '<div class="tools">'+sel+pj+'<label class="sr">'+SEARCH+'<input id="q" placeholder="Поиск"></label><button class="pb o" data-act="exportGrades">Скачать CSV</button>'+(ROLE==="t"?'<button class="pb" data-go="put">+ Добавить оценку</button>':'')+'</div>'+ 
 '<div class="leg"><span class="p">КР — контрольная</span><span class="b">СР — самостоятельная</span><span class="g">ДЗ — домашнее задание</span><span class="y">ПР — практическая</span></div>'+tbl(th,rows,"Оценок пока нет")}
var JOURNAL_FILTER="";
function studentJournalPage(){
 var db=load(),grades=db.grades.filter(function(g){return g.sid===ME.id}),subjects=Array.from(new Set((db.subjects||[]).concat(grades.map(function(g){return g.s})))).filter(Boolean).sort(function(a,b){return a.localeCompare(b,"ru")});
 if(subjects.indexOf(JOURNAL_FILTER)<0)JOURNAL_FILTER="";
 var ordered=grades.slice().sort(function(a,b){return a.d!==b.d?(a.d<b.d?1:-1):b.id-a.id}),visible=ordered.filter(function(g){return!JOURNAL_FILTER||g.s===JOURNAL_FILTER});
 var cards=subjects.map(function(subject){var mine=grades.filter(function(g){return g.s===subject}),latest=mine.slice().sort(function(a,b){return a.d<b.d?1:a.d>b.d?-1:b.id-a.id})[0];return'<article class="journal-subject"><div class="journal-subject-top"><b>'+esc(subject)+'</b><strong>'+f1(avg(mine.map(val)))+'</strong></div><small>'+mine.length+' '+(mine.length===1?'оценка':'оценок')+'</small>'+(latest?'<div class="journal-subject-latest">Последняя: '+dm(latest.d)+' · '+chip(latest.v)+'</div>':'<div class="journal-subject-empty">Оценок пока нет</div>')+'</article>'}).join("");
 var rows=visible.map(function(g){return'<tr><td class="mu">'+dm(g.d)+'</td><td><b>'+esc(g.s)+'</b></td><td>'+esc(g.t)+'</td><td class="c">'+chip(g.v)+'</td></tr>'}).join("");
 var filter='<div class="tools journal-filter"><label>Предмет<select id="journalSubject"><option value="">Все предметы</option>'+subjects.map(function(s){return'<option value="'+esc(s)+'"'+(JOURNAL_FILTER===s?' selected':'')+'>'+esc(s)+'</option>'}).join("")+'</select></label></div>';
 return head("Журнал оценок","Успеваемость по предметам · "+GROUP,"Скачать CSV","act:exportGrades")+'<section class="stats">'+stat("award","b","Средний балл",f1(avg(grades.map(val))),"Всего оценок: "+grades.length)+stat("book-open","g","Предметов",subjects.length)+stat("calendar-days","y","Последняя оценка",ordered.length?dm(ordered[0].d):"—")+'</section><h2 class="h2 journal-section-title">Предметы</h2><section class="journal-subjects">'+(cards||'<p class="em">Предметы пока не добавлены</p>')+'</section><h2 class="h2 journal-section-title">История оценок</h2>'+filter+tbl(["Дата","Предмет","Вид работы","Оценка"],rows,"Оценок по выбранному предмету пока нет")
}
function put(){
 var db=load(),t=new Date(),iso=t.getFullYear()+"-"+p2(t.getMonth()+1)+"-"+p2(t.getDate());
 var last=db.grades.slice().sort(function(a,b){return b.id-a.id}).slice(0,8).map(function(g){return'<tr><td>'+sname(g.sid)+'</td><td>'+g.s+'</td><td class="mu">'+dm(g.d)+'</td><td>'+g.t+'</td><td class="c">'+chip(g.v)+'</td><td><button class="del" data-del="'+g.id+'">Удалить</button></td></tr>'}).join("");
 return head("Выставить оценки","Оценка сразу сохраняется в базе данных")+'<div class="card fm"><div class="fg">'+
 '<label>Студент<select id="ps">'+db.students.map(function(s){return'<option value="'+s.id+'">'+esc(s.name)+'</option>'}).join("")+'</select></label>'+
 '<label>Предмет<select id="pj">'+SUBJ.map(function(s){return'<option>'+s+'</option>'}).join("")+'</select></label>'+
 '<label>Дата<input type="date" id="pd" value="'+iso+'"></label>'+
 '<label>Тип работы<select id="pt"><option>ДЗ</option><option>СР</option><option>ПР</option><option>КР</option></select></label></div>'+
 '<div class="rt">Оценка<div class="sg"><button data-v="5" class="on">5</button><button data-v="4">4</button><button data-v="3">3</button><button data-v="2">2</button></div></div>'+
 '<button class="pb" data-act="grade">Выставить оценку</button></div><h2 class="h2">Последние выставленные</h2>'+
 tbl(["Студент","Предмет","Дата","Тип","Оценка",""],last,"Оценок пока нет")}
var DBTAB="st";
function dbpage(){
 var db=load(),body;
 if(DBTAB==="st"){body='<div class="add"><input id="ns" placeholder="ФИО студента"><input id="nl" placeholder="Логин для входа" autocomplete="off"><input id="np" placeholder="Пароль, от 8 символов" autocomplete="off"><select id="sgroup">'+(db.groups||[]).map(function(g){return'<option value="'+esc(g)+'">'+esc(g)+'</option>'}).join("")+'</select><button class="pb" data-act="addst">Добавить студента</button></div>'+
  tbl(["Студент","Логин","Группа","Оценок","Ср. балл",""],db.students.map(function(s){var g=db.grades.filter(function(x){return x.sid===s.id});return'<tr><td><b>'+esc(s.name)+'</b></td><td class="mu">'+esc(s.login)+'</td><td>'+GROUP+'</td><td>'+g.length+'</td><td>'+f1(avg(g.map(val)))+'</td><td style="white-space:nowrap"><button class="del lnk" data-cred="'+s.id+'">Показать данные</button> <button class="del" data-dels="'+s.id+'">Удалить</button></td></tr>'}).join(""),"Студентов пока нет. Добавьте первого выше")}
 else{body=tbl(["Студент","Предмет","Дата","Тип","Оценка",""],db.grades.slice().sort(function(a,b){return a.d<b.d?1:a.d>b.d?-1:b.id-a.id}).map(function(g){return'<tr><td>'+sname(g.sid)+'</td><td>'+g.s+'</td><td class="mu">'+dm(g.d)+'</td><td>'+g.t+'</td><td class="c">'+chip(g.v)+'</td><td><button class="del" data-del="'+g.id+'">Удалить</button></td></tr>'}).join(""),"Оценок пока нет")}
 return head("База данных","Студенты и оценки · хранятся на сервере")+'<div class="tabs"><button data-tab="st" class="'+(DBTAB==="st"?"on":"")+'">Студенты ('+db.students.length+')</button><button data-tab="gr" class="'+(DBTAB==="gr"?"on":"")+'">Оценки ('+db.grades.length+')</button><span class="sp"></span><button data-act="csvStudents">Студенты CSV</button><button data-act="exportGrades">Оценки CSV</button></div>'+body}
function news(){
 var n=load().news||[],D=ROLE==="d";
 var form=D?'<div class="card fm" style="margin-bottom:16px"><div class="fg2" style="grid-template-columns:1fr"><label>Заголовок<input id="nt" maxlength="120" placeholder="Например, Изменение в расписании"></label><label>Текст<textarea id="nx" rows="3" maxlength="1000" placeholder="Что нужно сообщить преподавателям и студентам"></textarea></label></div><button class="pb" data-act="addnews">Опубликовать объявление</button></div>':"";
 var list=n.length?n.map(function(x){return'<div class="ls2 nw"><div><b>'+esc(x.title)+'</b><small>'+dm(x.d)+' · '+esc(x.by)+'</small><p class="nx">'+esc(x.text)+'</p></div>'+(D?'<button class="del" data-deln="'+x.id+'">Удалить</button>':"")+'</div>'}).join(""):'<p class="em">Объявлений пока нет</p>';
 return head("Уведомления",n.length?"Объявлений: "+n.length:"Новых уведомлений нет")+form+'<section class="card">'+list+'</section>'}
function newsMini(k){var n=(load().news||[]).slice(0,k||3);return n.length?n.map(function(x){return'<div class="ls2"><div>'+esc(x.title)+'<small>'+dm(x.d)+'</small></div></div>'}).join(""):'<p class="em">Новых уведомлений нет</p>'}
var CAL=0;
function cal(){
 var d=new Date(),y0=d.getFullYear(),m0=d.getMonth()+CAL,f=new Date(y0,m0,1),y=f.getFullYear(),m=f.getMonth(),fw=(f.getDay()+6)%7,dn=new Date(y,m+1,0).getDate(),pv=new Date(y,m,0).getDate(),h="";
 ["Пн","Вт","Ср","Чт","Пт","Сб","Вс"].forEach(function(x){h+='<span class="h">'+x+'</span>'});
 for(var i=fw-1;i>=0;i--)h+='<span class="o">'+(pv-i)+'</span>';
 for(var n=1;n<=dn;n++)h+='<span'+(CAL===0&&n===d.getDate()?' class="t"':"")+'>'+n+'</span>';
 return'<section class="card"><div class="calh"><h2>'+cap(f.toLocaleDateString("ru-RU",{month:"long",year:"numeric"}))+'</h2><span><button data-act="calp">‹</button><button data-act="caln">›</button></span></div><div class="cal">'+h+'</div></section>'}
function homeS(){
 var db=load(),my=db.grades.filter(function(g){return g.sid===ME.id}),a=avg(my.map(val)),now=new Date(),dw=(now.getDay()+6)%7,ls=[],hh=now.getHours();
 if(dw<5)sch().forEach(function(r){if(r[dw+1]){var p=r[dw+1].split("|");ls.push([r[0],p[0],p[1]])}});
 var col=["#2563eb","#10b981","#8b5cf6","#f59e0b"];
 var L=ls.length?ls.map(function(x,i){return'<div class="ls" style="border-color:'+col[i%4]+'"><b>'+x[0]+'</b><div>'+x[1]+'<small>Каб. '+x[2]+'</small></div></div>'}).join(""):'<p class="em">Сегодня занятий нет</p>';
 var last=my.slice().sort(function(x,y){return x.d!==y.d?(x.d<y.d?1:-1):y.id-x.id}).slice(0,5);
 var R=last.length?last.map(function(g){return'<div class="ls2"><div>'+g.s+'<small>'+dm(g.d)+' · '+g.t+'</small></div>'+chip(g.v)+'</div>'}).join(""):'<p class="em">Оценок пока нет</p>';
 var hi=hh<5?"Доброй ночи":hh<12?"Доброе утро":hh<18?"Добрый день":"Добрый вечер";
 var quick=quickActionsForRole().map(function(item){return '<a class="home-quick-action" href="'+item[0]+'"><span>'+item[1]+'</span><small>'+item[2]+'</small></a>'}).join("");
 var nextTasks=(db.works||[]).filter(function(w){return w.sid===ME.id}).slice(0,3).map(function(w){return '<div class="ls2"><div>'+esc(w.t||"Работа")+'<small>'+esc(w.s||"Предмет")+' · '+dm(w.d)+'</small></div><span class="tag '+(w.st==="ok"?"g":"y")+'">'+(w.st==="ok"?"Проверено":"На проверке")+'</span></div>'}).join("")||'<p class="em">Новых работ нет</p>';
 return head(hi+", "+ME.name.split(" ")[0]+"!",cap(now.toLocaleDateString("ru-RU",{weekday:"long",day:"numeric",month:"long",year:"numeric"})))+
 '<section class="home-quick-actions">'+quick+'</section>'+
 '<section class="stats">'+stat("award","b","Средний балл",f1(a),my.length?"Оценок: "+my.length:"")+stat("user-check","g","Посещаемость","—")+stat("book-open","y","Задолженности","0")+stat("square-pen","p","Задания",(db.works||[]).filter(function(w){return w.sid===ME.id}).length)+'</section>'+
 '<div class="grid"><div class="col"><section class="card"><h2>Ближайшие занятия</h2>'+L+'</section><section class="card"><h2>Последние оценки</h2>'+R+'</section><section class="card"><h2>Мои работы</h2>'+nextTasks+'</section></div>'+
 '<div class="col"><section class="card"><h2>Уведомления</h2>'+newsMini(3)+'</section><section class="card"><h2>Прогресс</h2><div class="chart"><p class="em">Средний балл по предметам: '+f1(a)+' · до конца семестра остаётся актуальная работа.</p></div></section>'+cal()+'</div></div>'}
function homeT(){
 var db=load(),all=avg(db.grades.map(val)),groupStudents=(db.students||[]).filter(function(s){return s.group===GROUP||!GROUP});
 var rows=groupStudents.map(function(s){var m=avg(db.grades.filter(function(g){return g.sid===s.id}).map(val));return'<tr><td>'+esc(s.name)+'</td><td class="c">'+f1(m)+'</td><td class="c">—</td><td class="c">0</td></tr>'}).join("");
 var quick=quickActionsForRole().map(function(item){return '<a class="home-quick-action" href="'+item[0]+'"><span>'+item[1]+'</span><small>'+item[2]+'</small></a>'}).join("");
 var pending=(db.works||[]).filter(function(w){return w.st!=="ok" && (db.students||[]).some(function(s){return s.id===w.sid && (s.group===GROUP||!GROUP)})}).length;
 var attendanceSummary=groupStudents.length?Math.round((groupStudents.length?groupStudents.length:1)*100/(groupStudents.length||1))+' %':'—';
 return head("Моя группа "+GROUP,"Информационные системы и программирование")+
 '<section class="home-quick-actions">'+quick+'</section>'+
 '<section class="stats">'+stat("award","b","Средний балл группы",f1(all),"Оценок: "+db.grades.length)+stat("user-check","g","Посещаемость",attendanceSummary)+stat("user-round","p","Студентов",groupStudents.length)+stat("square-pen","y","На проверке",pending)+'</section>'+
 '<div class="grid"><section class="card"><h2>Студенты группы</h2>'+tbl(["ФИО студента","Средний балл","Посещаемость","Долги"],rows,"Студентов пока нет")+'</section>'+
 '<div class="col"><section class="card"><h2>Быстрые действия</h2><div class="qa"><a class="a1" href="#put"><img src="'+IC+'award.png" alt="">Выставить оценки</a><a class="a2" href="#attendance"><img src="'+IC+'user-check.png" alt="">Отметить посещаемость</a><a class="a3" href="#messages"><img src="'+IC+'message-square.png" alt="">Написать группе</a></div></section><section class="card"><h2>Актуальные задачи</h2><p class="em">Проверить '+pending+' работ и обновить пометки по группе.</p></section></div></div>'}
function tagRole(r){return'<span class="tag '+RC[r]+'">'+RN[r]+'</span>'}
function homeD(){
 var db=load(),tc=(db.users||[]).filter(function(u){return u.role==="t"}),unch=db.works.filter(function(w){return w.st!=="ok"}).length,all=avg(db.grades.map(val));
 var rows=tc.map(function(u){return'<tr><td><b>'+esc(u.name)+'</b></td><td>'+(esc(u.subj)||"—")+'</td><td>'+esc((u.groups||[]).join(", "))+'</td><td class="mu">'+esc(u.login)+'</td></tr>'}).join("");
 var quick=quickActionsForRole().map(function(item){return '<a class="home-quick-action" href="'+item[0]+'"><span>'+item[1]+'</span><small>'+item[2]+'</small></a>'}).join("");
 return head("Кабинет директора","Информационные системы и программирование · "+GROUP)+
 '<section class="home-quick-actions">'+quick+'</section>'+
 '<section class="stats">'+stat("user-round","p","Студентов",db.students.length)+stat("user-check","g","Преподавателей",tc.length)+stat("award","b","Средний балл",f1(all),"Оценок: "+db.grades.length)+stat("square-pen","y","Работ на проверке",unch)+'</section>'+
 '<div class="grid"><section class="card"><h2>Преподаватели</h2>'+tbl(["ФИО","Предмет","Группы","Логин"],rows,"Преподавателей пока нет. Добавьте первого")+'</section>'+
 '<div class="col"><section class="card"><h2>Быстрые действия</h2><div class="qa"><a class="a1" href="#teachers"><img src="'+IC+'user-check.png" alt="">Добавить преподавателя</a><a class="a2" href="#schedule"><img src="'+IC+'calendar-days.png" alt="">Изменить расписание</a><a class="a3" href="#notifications"><img src="'+IC+'bell.png" alt="">Опубликовать объявление</a></div></section>'+
 '<section class="card"><h2>Последние объявления</h2>'+newsMini(3)+'</section></div></div>'}
function teachersPage(){
 var db=load(),tc=(db.users||[]).filter(function(u){return u.role==="t"});
 var add='<div class="add"><input id="ns" placeholder="ФИО преподавателя"><input id="nl" placeholder="Логин для входа" autocomplete="off"><input id="np" placeholder="Пароль, от 8 символов" autocomplete="off"><select id="nsj"><option value="">Предмет (необязательно)</option>'+SUBJ.map(function(s){return'<option>'+s+'</option>'}).join("")+'</select><label style="min-width:220px">Группы, которые ведёт<select id="tgroups" multiple size="2">'+(db.groups||[]).map(function(g){return'<option value="'+esc(g)+'">'+esc(g)+'</option>'}).join("")+'</select></label><button class="pb" data-act="addt">Добавить преподавателя</button></div>';
 var rows=tc.map(function(u){var gs=(u.groups||[]).join(", ");return'<tr><td><b>'+esc(u.name)+'</b></td><td class="mu">'+esc(u.login)+'</td><td>'+(esc(u.subj)||"—")+'</td><td>'+(esc(gs)||"—")+'</td><td style="white-space:nowrap"><button class="del lnk" data-cred="'+u.id+'">Сменить пароль</button> <button class="del" data-dels="'+u.id+'" data-cf="Удалить преподавателя «'+esc(u.name)+'»? Он больше не сможет войти." data-tm="Преподаватель удалён">Удалить</button></td></tr>'}).join("");
 return head("Преподаватели","Учётные записи преподавателей · группы закрепляются при создании")+add+tbl(["ФИО","Логин","Предмет","Группы",""],rows,"Преподавателей пока нет. Добавьте первого выше")}
function subjectsPage(){var db=load(),ss=db.subjects||[];var add='<div class="add"><input id="subjname" placeholder="Название предмета" maxlength="80"><button class="pb" data-act="addsubject">Добавить предмет</button></div>';var rows=ss.map(function(x,i){return'<tr><td><b>'+esc(x)+'</b></td><td><button class="del" data-delsubj="'+i+'">Удалить</button></td></tr>'}).join("");return head("Предметы","Предметы добавляет администратор. Только добавленные предметы появляются в расписании.")+add+tbl(["Предмет",""],rows,"Предметов пока нет — добавьте первый предмет выше")}
function accountsPage(){
 var us=load().users||[];
 var add='<div class="add"><input id="ns" placeholder="ФИО"><input id="nl" placeholder="Логин" autocomplete="off"><input id="np" placeholder="Пароль, от 8 символов" autocomplete="off"><select id="nr"><option value="d">Директор</option><option value="t" selected>Преподаватель</option><option value="s">Студент</option><option value="a">Администратор</option></select><select id="agroups" multiple size="2" title="Для преподавателя: группы, которые он ведёт">'+(load().groups||[]).map(function(g){return'<option value="'+esc(g)+'">'+esc(g)+'</option>'}).join("")+'</select><button class="pb" data-act="adda">Создать аккаунт</button></div>';
 var ord={a:0,d:1,t:2,s:3};us=us.slice().sort(function(x,y){return ord[x.role]-ord[y.role]||x.name.localeCompare(y.name,"ru")});
 var rows=us.map(function(u){var me=u.id===ME.id;return'<tr><td><input type="checkbox" data-user-select value="'+u.id+'"'+(me?' disabled title="Нельзя выбрать собственный аккаунт"':'')+'></td><td><b>'+esc(u.name)+'</b>'+(u.active===false?'<small><span class="tag r">Отключён</span></small>':'')+'</td><td class="mu">'+esc(u.login)+'</td><td>'+tagRole(u.role)+'</td><td><button class="del lnk" data-google-link="'+u.id+'" data-google-email="'+esc(u.googleEmail||'')+'">'+(u.googleEmail?esc(u.googleEmail):"Привязать Google")+'</button></td><td style="white-space:nowrap">'+(me?'<span class="mu">Это вы · данные в профиле</span>':'<button class="del lnk" data-cred="'+u.id+'">Данные / пароль</button> <button class="del" data-dels="'+u.id+'" data-cf="Удалить аккаунт «'+esc(u.name)+'»? Связанные оценки и работы тоже будут удалены." data-tm="Аккаунт удалён">Удалить</button>')+'</td></tr>'}).join("");
 var bulk='<section class="card bulk-users"><label><input type="checkbox" data-select-all> Выбрать все аккаунты, кроме текущего</label><div><button class="pb o" data-act="bulkDisable">Отключить</button><button class="pb o" data-act="bulkEnable">Включить</button><button class="pb o" data-act="bulkRevoke">Завершить сессии</button></div><p class="sub">Отключение запрещает новый вход и сразу отзывает активные сеансы.</p></section>';
 return head("Аккаунты","Все пользователи системы · "+us.length)+add+bulk+tbl(["","ФИО","Логин","Роль","Google email",""],rows,"Аккаунтов нет")}
function detectDefaultAccounts(users){var service=['teacher','roma','admin','director'];return (users||[]).filter(function(u){return service.indexOf((u.login||'').toLowerCase())>=0}).map(function(u){return {name:u.name,login:u.login,role:u.role}})}
function roleSummaryRows(users){
 var map={a:[],d:[],t:[],s:[]};(users||[]).forEach(function(u){if(map[u.role])map[u.role].push(u);});
 var rows=[['Роль','Количество','Логины']];
 Object.keys(map).forEach(function(key){var role=RN[key]||key;rows.push([role,map[key].length,map[key].map(function(u){return u.login||u.name}).join('; ')]);});
 return rows;
}
function adminToolsPage(){
 var db=load(),weak=detectDefaultAccounts(db.users||[]),rows=(db.users||[]).map(function(u){return '<tr><td><b>'+esc(u.name)+'</b></td><td class="mu">'+esc(u.login)+'</td><td>'+tagRole(u.role)+'</td><td>'+(u.googleEmail?esc(u.googleEmail):'—')+'</td><td>'+esc(u.group||u.groups&&u.groups.join(', ')||'—')+'</td></tr>'}).join(""),weakRows=weak.length?weak.map(function(u){return '<tr><td><b>'+esc(u.name)+'</b></td><td>'+esc(u.login)+'</td><td>'+tagRole(u.role)+'</td><td><span class="tag y">Служебный аккаунт</span></td></tr>'}).join(""):'<tr><td class="em" colspan="4">Служебные аккаунты не найдены</td></tr>';
 return head("Инструменты администратора","Сервисные операции, аудит доступа и быстрое резервное копирование")+
 '<div class="admin-tools-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px;margin-bottom:20px">'+
 ' <div class="card"><h2 class="h2" style="margin-top:0">Экспорт</h2><p class="sub">Выгрузить всех пользователей и их роли в CSV.</p><button class="pb o" data-act="exportAdminUsers">Скачать CSV</button></div>'+ 
 ' <div class="card"><h2 class="h2" style="margin-top:0">Роли</h2><p class="sub">Экспорт сводки по ролям для аудита и отчётности.</p><button class="pb o" data-act="exportRoleSummary">Скачать роли CSV</button></div>'+ 
 ' <div class="card"><h2 class="h2" style="margin-top:0">Резервная копия</h2><p class="sub">Сохранить текущее состояние базы данных в JSON.</p><button class="pb o" data-act="backupDb">Скачать backup</button></div>'+ 
 ' <div class="card"><h2 class="h2" style="margin-top:0">Проверка</h2><p class="sub">Проверить состояние базы, паролей и журналов без выхода из панели.</p><button class="pb o" data-act="runAudit">Проверить систему</button></div>'+ 
 ' <div class="card"><h2 class="h2" style="margin-top:0">Журнал</h2><p class="sub">Просмотреть входы, ошибки и действия администратора.</p><button class="pb o" data-act="openLogFromTools">Журнал событий</button></div>'+ 
 ' <div class="card"><h2 class="h2" style="margin-top:0">Сеансы</h2><p class="sub">Сбросить активные пользовательские сессии после смены прав или паролей.</p><button class="pb o" data-act="resetSessions">Сбросить сессии</button></div>'+ 
 ' <div class="card"><h2 class="h2" style="margin-top:0">Логи</h2><p class="sub">Полностью очистить журнал событий. Действие предназначено для администрирования.</p><button class="pb o" data-act="clearEvents">Очистить журнал</button></div>'+ 
 '</div>'+ 
 '<section class="card"><h2 class="h2" style="margin-top:0">Служебные аккаунты</h2>'+tbl(["Пользователь","Логин","Роль","Статус"],weakRows,"Служебные аккаунты не найдены")+'</section>'+ 
 '<section class="card" style="margin-top:18px"><h2 class="h2" style="margin-top:0">Список пользователей</h2>'+tbl(["ФИО","Логин","Роль","Google email","Группа / роли"],rows,"Пользователей пока нет")+'</section>';
}
function supportPage(){
 var requests=load().supportRequests||[],rows=requests.map(function(r){var resolved=r.status==="resolved";return'<article class="support-request"><div class="support-head"><div><b>'+esc(r.subject)+'</b><small>'+esc(r.name)+' · логин '+esc(r.login)+' · '+new Date(r.createdAt).toLocaleString("ru-RU")+'</small></div><span class="tag '+(resolved?'g':'y')+'">'+(resolved?'Закрыто':'Новое')+'</span></div><p><b>Контакт:</b> '+esc(r.contact)+'</p><p class="support-message">'+esc(r.text)+'</p><button class="pb o" data-support-id="'+r.id+'" data-support-status="'+r.status+'">'+(resolved?'Переоткрыть':'Отметить решённым')+'</button></article>'}).join("");
 return head("Обращения","Запросы с экрана входа и сообщения пользователей · "+requests.filter(function(r){return r.status!=="resolved"}).length+" новых")+'<section class="card support-list">'+(rows||'<p class="em">Обращений пока нет</p>')+'</section>'
}
function securityPage(){return head("Безопасность","Аудит входов по логинам, IP-адресам и активным сессиям")+'<div id="securityDashboard"><p class="em">Загружаю аудит...</p></div>'}
function loadSecurity(){api("GET","/api/admin/security").then(function(data){var el=$("#securityDashboard");if(!el)return;var events=data.events.map(function(e){var login=e.meta&&e.meta.login||e.u||"—",ip=e.meta&&e.meta.ip||"—",ok=e.k==="login";return'<tr><td>'+new Date(e.t).toLocaleString("ru-RU")+'</td><td><span class="tag '+(ok?'g':'y')+'">'+(ok?'Успешный вход':'Неудачный вход')+'</span></td><td>'+esc(login)+'</td><td>'+esc(e.meta&&RN[e.meta.role]||"—")+'</td><td>'+esc(ip)+'</td><td>'+esc(e.meta&&e.meta.method||"Пароль")+'</td></tr>'}).join(""),sessions=data.sessions.map(function(s){return'<tr><td><b>'+esc(s.name)+'</b></td><td>'+esc(s.login)+'</td><td>'+esc(RN[s.role]||s.role)+'</td><td>'+esc(s.ip)+'</td><td>'+(s.createdAt?new Date(s.createdAt).toLocaleString("ru-RU"):"До аудита")+'</td><td>'+new Date(s.expiresAt).toLocaleString("ru-RU")+'</td></tr>'}).join("");el.innerHTML='<section class="stats">'+stat("user-check","g","Активных сессий",data.sessions.length)+stat("user-round","y","Отключённых аккаунтов",data.disabled)+stat("bell","b","Событий входа",data.events.length,"до 200 последних")+'</section><section class="card"><h2>История входов</h2>'+tbl(["Время","Результат","Логин","Роль","IP","Способ"],events,"Входов пока нет")+'</section><section class="card" style="margin-top:18px"><h2>Активные сеансы</h2>'+tbl(["Пользователь","Логин","Роль","IP","Создан","Истекает"],sessions,"Активных сеансов нет")+'</section>'}).catch(fail)}
function homeA(){
 var db=load(),weak=detectDefaultAccounts(db.users||[]),summaryCount=(db.users||[]).length;
 return head("Состояние сайта","Проверка работы сервера, данных и безопасности")+
 '<div id="st"><p class="em">Проверяю…</p></div>'+ 
 '<section class="card" style="margin-top:18px"><h2 class="h2" style="margin-top:0">Дополнительные инструменты</h2><div class="admin-tools-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:14px">'+
 ' <button class="pb o" data-act="exportAdminUsers" style="justify-content:flex-start;padding:16px 18px;height:auto;text-align:left"><span><strong>Экспорт аккаунтов</strong><small style="display:block;color:inherit;opacity:.8;margin-top:3px">CSV со всеми пользователями</small></span></button>'+ 
 ' <button class="pb o" data-act="backupDb" style="justify-content:flex-start;padding:16px 18px;height:auto;text-align:left"><span><strong>Скачать backup</strong><small style="display:block;color:inherit;opacity:.8;margin-top:3px">JSON со всей базой данных</small></span></button>'+ 
 ' <button class="pb o" data-act="openAdminTools" style="justify-content:flex-start;padding:16px 18px;height:auto;text-align:left"><span><strong>Инструменты</strong><small style="display:block;color:inherit;opacity:.8;margin-top:3px">Аудит и служебные операции</small></span></button>'+ 
 ' <button class="pb o" data-act="openSecurity" style="justify-content:flex-start;padding:16px 18px;height:auto;text-align:left"><span><strong>Аудит входов</strong><small style="display:block;color:inherit;opacity:.8;margin-top:3px">IP, логины и активные сессии</small></span></button>'+ 
 ' <button class="pb o" data-act="openSupport" style="justify-content:flex-start;padding:16px 18px;height:auto;text-align:left"><span><strong>Обращения</strong><small style="display:block;color:inherit;opacity:.8;margin-top:3px">'+(db.supportRequests||[]).filter(function(r){return r.status!=="resolved"}).length+' требуют ответа</small></span></button>'+ 
 '</div></section>'+ 
 '<section class="card" style="margin-top:18px"><h2 class="h2" style="margin-top:0">Аудит безопасности</h2>'+tbl(["Параметр","Значение","Статус"],[ 
  '<tr><td><b>Пользователей</b></td><td>'+summaryCount+'</td><td><span class="tag g">Норма</span></td></tr>', 
  '<tr><td><b>Служебные аккаунты</b></td><td>'+(weak.length||0)+'</td><td>'+(weak.length?'<span class="tag y">Требуют проверки</span>':'<span class="tag g">В порядке</span>')+'</td></tr>', 
  '<tr><td><b>Журнал событий</b></td><td>Открыть аудит входов</td><td><a href="#security">Просмотр</a></td></tr>'
 ].join(""),"Данных пока нет")+'</section>'}
function fmtUp(s){var d=Math.floor(s/86400),h=Math.floor(s%86400/3600),m=Math.floor(s%3600/60);return(d?d+" д ":"")+(h||d?h+" ч ":"")+m+" мин"}
function paintStatus(s,ms){
 var el=$("#st");if(!el)return;
 var B={ok:["g","Всё работает","Проблем не найдено"],warn:["y","Работает, есть замечания","Посмотрите пункты со знаком «Внимание»"],bad:["r","Есть проблемы","Исправьте пункты с ошибками"]}[s.worst],c=s.cnt;
 var L={ok:'<span class="tag g">OK</span>',warn:'<span class="tag y">Внимание</span>',bad:'<span class="tag r">Ошибка</span>'};
 el.innerHTML='<div class="bn '+B[0]+'"><div><b>'+B[1]+'</b><small>'+B[2]+' · проверено '+new Date(s.now).toLocaleTimeString("ru-RU")+'</small></div><button class="pb o" data-act="recheck">Проверить снова</button></div>'+
 '<section class="stats">'+stat("home","b","Время работы",fmtUp(s.uptime),"Node "+esc(s.node))+stat("bell","g","Отклик сервера",ms+" мс")+stat("folder","p","Память сервера",Math.round(s.rss/1048576)+" МБ")+stat("settings","y","Свободно на диске",s.free==null?"—":(s.free/1073741824).toFixed(1).replace(".",",")+" ГБ")+'</section>'+
 '<section class="stats">'+stat("user-round","b","Пользователей",c.s+c.t+c.d+c.a,"студ. "+c.s+" · преп. "+c.t+" · дир. "+c.d+" · адм. "+c.a)+stat("award","g","Оценок",c.grades)+stat("square-pen","y","Работ",c.works,"не проверено: "+c.unchecked)+stat("user-check","p","Активных сессий",s.sessions,"входов за 24 ч: "+s.logins+" · неудачных: "+s.fails)+'</section>'+
 '<h2 class="h2" style="margin-top:6px">Проверки</h2>'+tbl(["Статус","Проверка","Результат"],s.checks.map(function(k){return'<tr><td>'+L[k.l]+'</td><td><b>'+esc(k.n)+'</b></td><td>'+esc(k.d)+'</td></tr>'}).join(""))}
function loadStatus(){var t0=Date.now();api("GET","/api/admin/status").then(function(s){paintStatus(s,Date.now()-t0)}).catch(fail)}
var EVS=[],KG={login:"login",fail:"fail",account:"chg",password:"chg",profile:"chg",schedule:"chg",news:"chg",error:"error"},KL={login:"Вход",fail:"Неудачный вход",chg:"Изменение",error:"Ошибка"},KC={login:"g",fail:"y",chg:"b",error:"r"};
function logPage(){return head("Журнал событий","Входы, изменения аккаунтов и ошибки сервера · последние 300 событий")+'<div class="tools"><select id="lf"><option value="">Все события</option><option value="login">Входы</option><option value="fail">Неудачные входы</option><option value="chg">Изменения</option><option value="error">Ошибки</option></select><button class="pb o" data-act="relog">Обновить</button></div><div id="lg"><p class="em">Загрузка…</p></div>'}
function paintLog(){var el=$("#lg");if(!el)return;var f=$("#lf").value,r=EVS.filter(function(e){return!f||KG[e.k]===f}).slice(0,200);
 el.innerHTML=tbl(["Время","Тип","Пользователь","Событие"],r.map(function(e){var g=KG[e.k]||"chg";return'<tr><td class="mu" style="white-space:nowrap">'+new Date(e.t).toLocaleString("ru-RU")+'</td><td><span class="tag '+KC[g]+'">'+KL[g]+'</span></td><td>'+(esc(e.u)||"—")+'</td><td>'+esc(e.x)+'</td></tr>'}).join(""),"Событий нет")}
function loadLog(){api("GET","/api/admin/events").then(function(d){EVS=d.events;paintLog()}).catch(fail)}
var PAGES={home:function(){return ROLE==="t"?homeT():ROLE==="d"?homeD():ROLE==="a"?homeA():homeS()},teachers:teachersPage,subjects:subjectsPage,accounts:accountsPage,tools:adminToolsPage,log:logPage,support:supportPage,security:securityPage,schedule:function(){return ROLE==="d"&&SCH_EDIT?scheduleEdit():schedule()},grades:grades,put:put,db:dbpage,attendance:attendancePage,messages:messagesPage,import:importPage,profile:profile};
["journal","attendance","tasks","notifications","messages","materials","settings"].forEach(function(k){PAGES[k]=function(){return gen(k)}});
PAGES.journal=studentJournalPage;
PAGES.notifications=news;
function settingsPage(){
 var lang=window.ProgressI18n?window.ProgressI18n.getLanguage():"ru";
 var theme=localStorage.getItem("progressTheme")||"light";
 var current=lang==="kk"?"KZ":"RU";
 var next=lang==="kk"?"RU":"KZ";
 return head("Настройки","Уведомления, безопасность и параметры электронного журнала")+
 '<section class="card settings-language"><div class="setrow"><div><h2 class="h2" style="margin:0 0 5px">Язык интерфейса</h2><p class="mu" style="margin:0">Выберите язык электронного журнала</p></div><button type="button" class="pb lang-setting" data-act="toggleLanguage">'+current+'</button></div></section>'+
 '<section class="card"><div class="setrow"><div><h2 class="h2" style="margin:0 0 5px">Тема интерфейса</h2><p class="mu" style="margin:0">Быстрый переключатель светлой и тёмной темы</p></div><button type="button" class="pb o" data-act="toggleTheme">'+(theme==="dark"?"Тёмная":"Светлая")+'</button></div></section>'+
 '<section class="card"><h2 class="h2">Параметры</h2><div class="setrow"><div><b>Уведомления</b><p class="mu">Настройки уведомлений электронного журнала</p></div><span class="tag g">Включено</span></div></section>';
}
PAGES.settings=settingsPage;
PAGES.attendance=attendancePage;
PAGES.messages=messagesPage;
PAGES.import=importPage;
var AFTER={home:function(){if(ROLE==="a")loadStatus()},log:function(){loadLog();$("#lf").onchange=paintLog},support:function(){},security:function(){loadSecurity()},journal:function(){var s=$("#journalSubject");if(s)s.onchange=function(){JOURNAL_FILTER=s.value;render()}},schedule:function(){var g=$("#schg");if(g)g.onchange=function(){SCHGROUP=g.value;render()}},grades:function(){
 var jg=$("#jgroup");if(jg)jg.onchange=function(){GSGROUP=jg.value;render()};
 var jf=$("#gf"),jm=$("#gm");if(jf)jf.onchange=render;if(jm)jm.onchange=render;
 var g=$("#gs");if(g)g.onchange=function(){GSID=+g.value;render()};
 function flt(){var q=$("#q").value.toLowerCase(),s=$("#gf").value;document.querySelectorAll("tbody tr[data-s]").forEach(function(r){var n=r.dataset.s;r.style.display=(!s||n===s)&&n.toLowerCase().indexOf(q)>=0?"":"none"})}
 $("#q").oninput=flt;$("#gf").onchange=flt}};
/* ---- оболочка ---- */
function shell(r,body){
 var m,b=[["profile","Мой профиль","user-round"],["settings","Настройки","settings"]];
 if(ROLE==="t")m=[["home","Главная","home"],["grades","Журнал успеваемости","book-open"],["put","Выставить оценки","award"],["db","База данных","folder"],["attendance","Посещаемость","user-check"],["schedule","Расписание","calendar-days"],["tasks","Задания","square-pen"],["notifications","Уведомления","bell"],["messages","Сообщения","message-square"]];
 else if(ROLE==="d"){m=[["home","Главная","home"],["teachers","Преподаватели","user-check"],["db","Студенты и оценки","folder"],["schedule","Расписание","calendar-days"],["attendance","Посещаемость","user-check"],["messages","Сообщения","message-square"],["import","Импорт CSV","folder"],["notifications","Объявления","bell"]];b=[b[0]]}
 else if(ROLE==="a"){m=[["home","Состояние сайта","home"],["accounts","Аккаунты","user-round"],["support","Обращения","message-square"],["security","Безопасность","settings"],["subjects","Предметы","book-open"],["import","Импорт CSV","folder"],["tools","Инструменты","settings"],["log","Журнал событий","book-open"]];b=[b[0]]}
 else m=[["home","Главная","home"],["journal","Журнал оценок","book-open"],["schedule","Расписание","calendar-days"],["grades","Оценки","award"],["attendance","Посещаемость","user-check"],["tasks","Задания","square-pen"],["notifications","Уведомления","bell"],["messages","Сообщения","message-square"],["materials","Материалы","folder"]];
 var adm=ROLE==="a"||ROLE==="d",BR={t:"ПАНЕЛЬ КУРАТОРА",d:"КАБИНЕТ ДИРЕКТОРА",a:"АДМИНИСТРАТОР",s:"ЭЛЕКТРОННЫЙ ЖУРНАЛ"}[ROLE];
 function a(x){return'<a href="#'+x[0]+'"'+(x[0]===r?' class="on"':"")+'><img src="'+IC+x[2]+'.png" alt="">'+x[1]+'</a>'}
 return'<aside class="nav"><div class="brand"><b>Progress</b><span>'+BR+'</span></div><button class="navskip prev" data-act="navprev" aria-label="Предыдущие разделы">‹</button><nav>'+m.map(a).join("")+'</nav><button class="navskip next" data-act="navnext" aria-label="Следующие разделы">›</button><nav class="bt">'+b.map(a).join("")+'<a href="index.html" class="out" data-act="logout"><img src="'+IC+'log-out.png" alt="">Выйти</a></nav><div class="gcard"><b>'+(adm?"ПК «Прогресс»":(ROLE==="t"?"Группы "+esc((DB.teacherGroups||[]).join(", ")):"Группа "+GROUP))+'</b>'+(adm?"Учебный год 2026/27":"ПК «Прогресс» · 2026/27")+'</div></aside>'+
 '<div><header class="top"><div class="search-wrap"><label class="sr">'+SEARCH+'<input id="globalSearch" placeholder="Поиск..." aria-label="Поиск"></label><div id="smartSearchResults" class="smart-search" hidden></div></div><div class="right"><img src="'+IC+'bell.png" alt="Уведомления"><div class="um"><button class="user" data-act="um" aria-haspopup="true"><span class="ava">'+ME.ini+'</span><div><b>'+ME.name+'</b><small>'+ME.role+(adm?'':(ROLE==='t'?' · '+esc((DB.teacherGroups||[]).join(', ')):' · '+GROUP))+'</small></div><i class="chev"></i></button><div class="umenu" id="umenu" hidden><a href="#profile"><img src="'+IC+'user-round.png" alt="">Мой профиль</a>'+(adm?"":'<a href="#settings"><img src="'+IC+'settings.png" alt="">Настройки</a>')+'<a href="index.html" class="out" data-act="logout"><img src="'+IC+'log-out.png" alt="">Выйти</a></div></div></div></header><main>'+body+'</main></div>'}
function render(){
 var r=(location.hash||"#home").slice(1);
 var AL={s:"home schedule grades journal attendance tasks notifications messages materials profile settings",t:"home grades put db attendance schedule tasks notifications messages profile settings",d:"home teachers db attendance messages schedule import notifications profile",a:"home accounts subjects import tools log support security profile"}[ROLE]||"home";
 if(!PAGES[r]||(" "+AL+" ").indexOf(" "+r+" ")<0)r="home";
 $("#app").innerHTML=shell(r,PAGES[r]());
 bindGlobalSearch();
 if(AFTER[r])AFTER[r]();
 if(window.ProgressI18n)window.ProgressI18n.apply();
}

function bindGlobalSearch(){
 var input=document.getElementById("globalSearch");
 var panel=document.getElementById("smartSearchResults");
 if(!input||!panel)return;
 input.oninput=function(){
  var q=input.value.trim();
  if(!q){panel.hidden=true;panel.innerHTML="";return}
  var db=load(),results=[];
  db.students&&db.students.forEach(function(s){if((s.name||"").toLowerCase().indexOf(q.toLowerCase())>=0||String(s.login||"").toLowerCase().indexOf(q.toLowerCase())>=0){results.push({type:"Студент",label:s.name,meta:s.group||"Группа",hash:"#db"})}});
  db.users&&db.users.filter(function(u){return u.role!=="s";}).forEach(function(u){if((u.name||"").toLowerCase().indexOf(q.toLowerCase())>=0||String(u.login||"").toLowerCase().indexOf(q.toLowerCase())>=0){results.push({type:"Личный кабинет",label:u.name,meta:u.role,hash:"#accounts"})}});
  (db.subjects||[]).forEach(function(s){if(String(s).toLowerCase().indexOf(q.toLowerCase())>=0){results.push({type:"Предмет",label:s,meta:"Список предметов",hash:"#subjects"})}});
  (db.works||[]).forEach(function(w){if(String(w.t||"").toLowerCase().indexOf(q.toLowerCase())>=0||String(w.s||"").toLowerCase().indexOf(q.toLowerCase())>=0){results.push({type:"Работа",label:w.t||"Работа",meta:w.s||"Предмет",hash:"#tasks"})}});
  (db.messages||[]).forEach(function(m){if(String(m.subject||"").toLowerCase().indexOf(q.toLowerCase())>=0||String(m.text||"").toLowerCase().indexOf(q.toLowerCase())>=0){results.push({type:"Сообщение",label:m.subject||"Без темы",meta:(DB.users||[]).find(function(u){return u.id===m.from})?.name||"",hash:"#messages"})}});
  var ql=q.toLowerCase();
  var dedup={};var unique=results.filter(function(item){var key=item.type+"|"+item.label+"|"+item.meta; if(dedup[key])return false; dedup[key]=true; return true;}).slice(0,8);
  if(!unique.length){panel.innerHTML='<div class="smart-empty">Ничего не найдено по запросу «'+esc(q)+'»</div>';panel.hidden=false;return}
  panel.innerHTML=unique.map(function(item){return '<div class="smart-search-item" data-search-go="'+esc(item.hash)+'"><div><strong>'+esc(item.label)+'</strong><small>'+esc(item.meta)+'</small></div><span class="smart-search-tag">'+esc(item.type)+'</span></div>'}).join("");
  panel.hidden=false;
 };
 input.onkeydown=function(e){if(e.key==="Escape"){panel.hidden=true;input.blur();}}
 panel.onclick=function(ev){var el=ev.target.closest("[data-search-go]"); if(!el)return; location.hash=el.dataset.searchGo; panel.hidden=true; input.value='';};
}

function applyTheme(){
 var theme=localStorage.getItem("progressTheme")||"light";
 document.body.classList.toggle("theme-dark",theme==="dark");
}

function quickActionsForRole(){
 var acts=[];
 if(ROLE==="s"){acts=[['#schedule','Ближайшие занятия','Смотреть расписание'],['#journal','Журнал оценок','Предметы и результаты'],['#tasks','Задания','Загрузить работу']];}
 else if(ROLE==="t"){acts=[['#put','Оценки','Выставить оценку'],['#attendance','Посещаемость','Отметить прогул'],['#messages','Сообщения','Написать группе']];}
 else if(ROLE==="d"){acts=[['#teachers','Преподаватели','Управление'],['#schedule','Расписание','Корректировка'],['#import','Импорт','CSV быстрый']];}
 else if(ROLE==="a"){acts=[['#accounts','Аккаунты','Управление'],['#subjects','Предметы','Редактирование'],['#tools','Инструменты','Резервные копии']];}
 return acts;
}
document.addEventListener("click",function(e){
 var um=$("#umenu");if(um&&(!e.target.closest(".um")||e.target.closest(".umenu a")))um.hidden=true;
 var t=e.target.closest("[data-go],[data-del],[data-delw],[data-chk],[data-deln],[data-dels],[data-delsubj],[data-cred],[data-copy],[data-tab],[data-act],[data-v],[data-dela],[data-read],[data-google-link],[data-select-all],[data-support-id]");if(!t)return;if(t.tagName==="BUTTON"||t.tagName==="A")e.preventDefault();
 var a=t.dataset.act;
 function done(m){return function(){toast(m);return refresh()}}
 if(a==="logout"){e.preventDefault();api("POST","/api/logout").catch(function(){}).then(function(){location.href="index.html"});return}
 if(a==="toggleLanguage"){var cur=window.ProgressI18n?window.ProgressI18n.getLanguage():"ru";if(window.ProgressI18n)window.ProgressI18n.setLanguage(cur==="ru"?"kk":"ru");render();return}
 if(a==="toggleTheme"){var next=(localStorage.getItem("progressTheme")||"light")==="dark"?"light":"dark";localStorage.setItem("progressTheme",next);applyTheme();render();return}
 if(a==="backupDb"){var payload={exportedAt:new Date().toISOString(),db:load()};var blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json;charset=utf-8"});var url=URL.createObjectURL(blob);var link=document.createElement("a");link.href=url;link.download="progress-backup-"+new Date().toISOString().slice(0,10)+".json";link.click();setTimeout(function(){URL.revokeObjectURL(url)},1000);toast("Резервная копия скачана");return}
 if(a==="exportAdminUsers"){var rows=[["ФИО","Логин","Роль","Группа/роль","Google email"]].concat((load().users||[]).map(function(u){return[u.name,u.login,u.role,(u.group||u.groups&&u.groups.join(', ')||"—"),(u.googleEmail||"—")]}));csv("admin-users.csv",rows);toast("CSV пользователей скачан");return}
 if(a==="exportRoleSummary"){var rows=roleSummaryRows(load().users||[]);csv("role-summary.csv",rows);toast("Сводка по ролям скачана");return}
 if(a==="runAudit"){api("GET","/api/admin/status").then(function(s){toast(s.worst==="ok"?"Проверка завершена: проблем не найдено":"Проверка завершена: есть замечания по безопасности");return render()}).catch(fail);return}
 if(a==="clearEvents"){if(!confirm("Очистить журнал событий? Это действие удаляет записи о входах и изменениях."))return;api("POST","/api/admin/events/clear").then(function(){toast("Журнал событий очищен");if(location.hash==="#log"){render();}return refresh()}).catch(fail);return}
 if(a==="resetSessions"){if(!confirm("Сбросить все активные сессии пользователей? Пользователям потребуется заново войти."))return;api("POST","/api/admin/sessions/reset").then(function(){toast("Активные сессии сброшены");return refresh()}).catch(fail);return}
 if(t.hasAttribute("data-select-all")){document.querySelectorAll("[data-user-select]").forEach(function(box){if(!box.disabled)box.checked=t.checked});return}
 if(a==="bulkDisable"||a==="bulkEnable"||a==="bulkRevoke"){
  var ids=Array.from(document.querySelectorAll("[data-user-select]:checked")).map(function(box){return+box.value});if(!ids.length){toast("Сначала выберите аккаунты");return}
  var action={bulkDisable:"disable",bulkEnable:"enable",bulkRevoke:"revoke"}[a],prompts={disable:"Отключить выбранные аккаунты и завершить их сеансы?",enable:"Включить выбранные аккаунты?",revoke:"Завершить все сеансы выбранных аккаунтов?"};
  if(!confirm(prompts[action]))return;api("POST","/api/admin/users/bulk",{action:action,ids:ids}).then(function(r){toast("Обработано аккаунтов: "+r.count);return refresh()}).catch(fail);return
 }
 if(t.dataset.supportId){var nextStatus=t.dataset.supportStatus==="resolved"?"new":"resolved";api("PUT","/api/admin/support-requests/"+t.dataset.supportId,{status:nextStatus}).then(done(nextStatus==="resolved"?"Обращение закрыто":"Обращение переоткрыто")).catch(fail);return}
 if(a==="openSecurity"){location.hash="#security";return}
 if(a==="openSupport"){location.hash="#support";return}
 if(a==="openAdminTools"){location.hash="#tools";return}
 if(a==="openLogFromTools"){location.hash="#log";return}
 if(t.dataset.go){location.hash=t.dataset.go;return}
 if(t.dataset.del){api("DELETE","/api/grades/"+t.dataset.del).then(done("Оценка удалена")).catch(fail);return}
 if(t.dataset.chk){var on=t.dataset.on==="1";api("PUT","/api/works/"+t.dataset.chk+"/check",{checked:on}).then(done(on?"Работа проверена":"Проверка снята")).catch(fail);return}
 if(t.dataset.delw){api("DELETE","/api/works/"+t.dataset.delw).then(done("Работа удалена")).catch(fail);return}
 if(t.dataset.dela){api("DELETE","/api/attendance/"+t.dataset.dela).then(done("Отметка удалена")).catch(fail);return}
 if(t.dataset.read){api("PUT","/api/messages/"+t.dataset.read+"/read",{}).then(done("Сообщение отмечено прочитанным")).catch(fail);return}
 if(t.dataset.delsubj!=null){api("DELETE","/api/subjects/"+t.dataset.delsubj).then(done("Предмет удалён")).catch(fail);return}
 if(t.dataset.dels){if(confirm(t.dataset.cf||"Удалить студента вместе с его оценками и работами?"))api("DELETE","/api/users/"+t.dataset.dels).then(done(t.dataset.tm||"Студент удалён")).catch(fail);return}
 if(t.dataset.deln){api("DELETE","/api/news/"+t.dataset.deln).then(done("Объявление удалено")).catch(fail);return}
 if(t.dataset.cred){api("GET","/api/users/"+t.dataset.cred+"/credentials").then(function(c){credModal(t.dataset.cred,c)}).catch(fail);return}
 if(t.dataset.googleLink){googleLinkModal(t.dataset.googleLink,t.dataset.googleEmail||"");return}
 if(t.dataset.copy){var tx=$("#"+t.dataset.copy).textContent;try{navigator.clipboard.writeText(tx).then(function(){toast("Скопировано")},function(){toast("Не удалось скопировать")})}catch(x){toast("Не удалось скопировать")}return}
 if(t.dataset.tab){DBTAB=t.dataset.tab;render();return}
 if(a==="saveGoogleLink"){api("PUT","/api/users/"+t.dataset.id+"/google-email",{email:$("#googleEmail").value}).then(function(){$("#mod").remove();toast("Google email сохранён");return refresh()}).catch(fail);return}
 if(a==="editSchedule"){SCH_EDIT=true;render();return}
 if(a==="cancelSchedule"){SCH_EDIT=false;render();return}
 if(t.dataset.v){document.querySelectorAll("[data-v]").forEach(function(b){b.classList.toggle("on",b===t)});return}
 if(a==="um"){um.hidden=!um.hidden}
 else if(a==="navprev"||a==="navnext"){var nav=document.querySelector(".nav nav:first-of-type");if(nav)nav.scrollBy({left:a==="navnext"?190:-190,behavior:"smooth"})}
 else if(a==="setpw"){api("PUT","/api/users/"+t.dataset.id+"/password",{password:$("#npw").value}).then(function(){$("#mod").remove();toast("Пароль изменён");return refresh()}).catch(fail)}
 else if(a==="upload"){modal()}
 else if(a==="closem"){$("#mod").remove()}
 else if(a==="sendw"){var wt=$("#wt").value.trim(),f=$("#wf").files[0];if(!wt||!f){toast("Укажите название и выберите файл");return}
  if(f.size>25*1048576){toast("Файл больше 25 МБ");return}
  var meta={s:$("#ws").value,t:wt,f:f.name,e:f.name.indexOf(".")<0?"Файл":f.name.split(".").pop().toUpperCase().slice(0,10)};
  fetch("/api/works",{method:"POST",headers:{"X-Meta":encodeURIComponent(JSON.stringify(meta)),"Content-Type":"application/octet-stream"},body:f,credentials:"same-origin"}).then(function(r){return r.json().catch(function(){return{}}).then(function(j){if(!r.ok){var er=new Error(j.error||"Ошибка загрузки");er.status=r.status;throw er}return j})})
   .then(function(){$("#mod").remove();toast("Работа отправлена");return refresh()}).catch(fail)}
 else if(a==="addsubject"){api("POST","/api/subjects",{name:$("#subjname").value}).then(done("Предмет добавлен")).catch(fail)}
 else if(a==="addt"){api("POST","/api/users",{role:"t",name:$("#ns").value,login:$("#nl").value,password:$("#np").value,subj:$("#nsj").value,groups:Array.from($("#tgroups").selectedOptions).map(function(o){return o.value})}).then(done("Преподаватель добавлен")).catch(fail)}
 else if(a==="adda"){api("POST","/api/users",{role:$("#nr").value,name:$("#ns").value,login:$("#nl").value,password:$("#np").value,groups:Array.from($("#agroups").selectedOptions).map(function(o){return o.value})}).then(done("Аккаунт создан")).catch(fail)}
 else if(a==="recheck"){loadStatus()}
 else if(a==="relog"){loadLog()}
 else if(a==="addnews"){api("POST","/api/news",{title:$("#nt").value,text:$("#nx").value}).then(done("Объявление опубликовано")).catch(fail)}
 else if(a==="addrow"){var tb=$("#sch tbody");if(tb.rows.length>=12){toast("Не больше 12 пар");return}var ts=(load().users||[]).filter(function(t){return t.role==="t"&&(t.groups||[]).indexOf(SCHGROUP)>=0});tb.insertAdjacentHTML("beforeend",schRow(["","","","","",""],tb.rows.length,ts))}
 else if(a==="delrow"){var tb2=$("#sch tbody");if(tb2.rows.length)tb2.deleteRow(tb2.rows.length-1)}
 else if(a==="savesch"){var rs=[].map.call(document.querySelectorAll("#sch tbody tr"),function(tr){var ins=tr.querySelectorAll("input"),sels=tr.querySelectorAll("select.teacher"),subs=tr.querySelectorAll("select.subject"),row=[ins[0].value.trim()];for(var day=0;day<5;day++){var sj=(subs[day]?subs[day].value:"").replace(/\|/g," "),rm=(ins[day*2+2]?ins[day*2+2].value:"").replace(/\|/g," "),teacher=(sels[day]?sels[day].value:"").replace(/\|/g," " );row.push(sj?(rm?(teacher?sj+"|"+rm+"|"+teacher:sj+"|"+rm):(teacher?sj+"||"+teacher:sj)):"")}return row});api("PUT","/api/schedule",{group:SCHGROUP,rows:rs}).then(done("Расписание группы сохранено")).catch(fail)}
 else if(a==="saveprof"){var np=$("#pp").value;if(np&&np!==$("#pp2").value){toast("Новые пароли не совпадают");return}if(!$("#pc").value){toast("Введите текущий пароль");return}
   api("PUT","/api/me",{name:$("#pn").value,login:$("#pl").value,password:np||undefined,current:$("#pc").value}).then(function(){toast("Данные сохранены");return api("GET","/api/me")}).then(function(u){setMe(u);return refresh()}).catch(fail)}
 else if(a==="calp"||a==="caln"){CAL+=a==="caln"?1:-1;render()}
 else if(a==="grade"){var v=document.querySelector("[data-v].on"),d=$("#pd").value;if(!d||!v){toast("Укажите дату и оценку");return}
  api("POST","/api/grades",{sid:+$("#ps").value,s:$("#pj").value,d:d,t:$("#pt").value,v:+v.dataset.v}).then(done("Оценка выставлена")).catch(fail)}
 else if(a==="addst"){api("POST","/api/students",{name:$("#ns").value,login:$("#nl").value,password:$("#np").value,group:$("#sgroup").value}).then(done("Студент добавлен")).catch(fail)}
 else if(a==="saveattendance"){api("POST","/api/attendance",{sid:+$("#as").value,s:$("#aj").value,d:$("#ad").value,status:$("#av").value}).then(done("Посещаемость сохранена")).catch(fail)}
 else if(a==="sendmsg"){if(!$("#mt").value||!$("#mx").value.trim()){toast("Выберите получателя и напишите сообщение");return}api("POST","/api/messages",{to:$("#mt").value,subject:$("#ms").value,text:$("#mx").value}).then(done("Сообщение отправлено")).catch(fail)}
 else if(a==="importcsv"){var f=$("#if").files[0];if(!f){toast("Выберите CSV-файл");return}f.text().then(function(text){return api("POST","/api/import",{kind:$("#ik").value,text:text})}).then(function(r){var report='<p class="sub">Импортировано: <b>'+r.count+'</b>'+(r.errors&&r.errors.length?'<br><span class="r">Ошибки: '+r.errors.map(esc).join("<br>")+'</span>':"")+'</p>';return refresh().then(function(){$("#importResult").innerHTML=report})}).catch(fail)}
 else if(a==="exportAttendance"){var db=load(),rows=[["Студент","Предмет","Дата","Статус"]].concat((db.attendance||[]).map(function(x){return[sname(x.sid),x.s,x.d,(ATT[x.status]||[x.status])[0]]}));csv("attendance.csv",rows);toast("Посещаемость выгружена")}
 else if(a==="exportSchedule"){var rows=[["Группа",SCHGROUP],["Время","ПН (предмет|каб.|преподаватель)","ВТ (предмет|каб.|преподаватель)","СР (предмет|каб.|преподаватель)","ЧТ (предмет|каб.|преподаватель)","ПТ (предмет|каб.|преподаватель)"]].concat(sch().map(function(r){return r.slice(0,6)}));csv("schedule-"+SCHGROUP.replace(/[^\wА-Яа-яЁё-]+/g,"-")+".csv",rows);toast("Расписание группы выгружено")}
 else if(a==="exportGrades"){var db=load(),sid=ROLE==="t"?+((document.querySelector("#gs")||{}).value||GSID):ME.id,rows=[["Студент","Предмет","Дата","Тип","Оценка"]].concat(db.grades.filter(function(g){return ROLE!=="t"||g.sid===sid}).map(function(g){return[sname(g.sid),g.s,g.d,g.t,g.v]}));csv("grades.csv",rows);toast("Журнал выгружен")}
 else if(a==="csvStudents"){var db=load();csv("students.csv",[["ФИО","Логин","Группа","Оценок","Средний балл"]].concat(db.students.map(function(s){var gs=db.grades.filter(function(g){return g.sid===s.id});return[s.name,s.login,GROUP,gs.length,f1(avg(gs.map(val)))]})));toast("Список студентов выгружен")}
});
window.addEventListener("hashchange",function(){window.scrollTo(0,0);render()});
function setMe(u){ROLE=u.role;ME={id:u.id,login:u.login,name:u.name,role:{a:"Администратор",d:"Директор",t:"Куратор",s:"Студент"}[u.role],ini:u.name.split(/\s+/).map(function(w){return w[0]}).slice(0,2).join("").toUpperCase()}}
applyTheme();
api("GET","/api/me").then(function(u){setMe(u);return refresh()}).catch(fail);
})();
