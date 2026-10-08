export type Role = 'lead' | 'rap' | 'group' | 'adlib' | 'harmony';
export type Timing = 'none' | 'estimated' | 'imported' | 'verified';
export type Policy = 'group-separate' | 'full-participation' | 'split-shared';
export type Style = 'style' | 'balanced' | 'vocal';
export type Member = { id: string; name: string; color: string; enabled: boolean; role: 'vocal' | 'rapper' | 'allrounder'; languages: string[]; tags: string[]; priority: number };
export type Segment = { id: string; text: string; section: string; role: Role; language: string; startMs?: number; endMs?: number; timing: Timing; memberIds: string[]; locked: boolean; tags: string[]; reason?: string };
export type Rules = { allMembers: boolean; chorusAll: boolean; strictLanguage: boolean; strictRole: boolean; strictTags: boolean; live: boolean; balance: number };
export type Project = { schemaVersion: 1; title: string; artist: string; mode: 'redistribution' | 'annotation'; members: Member[]; segments: Segment[]; rules: Rules; policy: Policy; includedRoles: Role[]; durationMs: number; style: Style; mediaName?: string };
export const roleLabels: Record<Role,string> = {lead:'主旋律',rap:'Rap',group:'合唱',adlib:'Ad-lib',harmony:'和声'};
export const sectionLabels = ['Intro','Verse 1','Pre-chorus','Chorus 1','Verse 2','Chorus 2','Bridge','Final chorus','Outro'];
export const policyLabels: Record<Policy,string> = {'group-separate':'合唱单列','full-participation':'参与全计','split-shared':'共享均分'};
export const styleLabels: Record<Style,string> = {style:'风格适配',balanced:'平衡参与',vocal:'主唱倾向'};
export const palette = ['#8ae9c4','#ad9af8','#f3b17c','#87c6f5','#f18da7','#e4d67e','#8fd8d8','#ceaae1','#b2d388','#eaa6ba','#9baefd','#e9bd85'];
export const uid = () => globalThis.crypto?.randomUUID?.() ?? `s-${Date.now()}-${Math.random().toString(36).slice(2)}`;
export function member(name:string,index:number,role:Member['role']='allrounder'):Member {return {id:uid(),name,color:palette[index%palette.length],enabled:true,role,languages:['zh','en'],tags:[],priority:50};}
export function blankProject():Project {return {schemaVersion:1,title:'未命名歌曲',artist:'',mode:'redistribution',members:[member('歌手 A',0),member('歌手 B',1)],segments:[],rules:{allMembers:true,chorusAll:false,strictLanguage:false,strictRole:false,strictTags:false,live:false,balance:55},policy:'group-separate',includedRoles:['lead','rap','group','adlib','harmony'],durationMs:180000,style:'style'};}
export function demoProject():Project {
 const p=blankProject();p.title='AFTER HOURS';p.artist='原创六人示例 · 演示时间';p.rules.chorusAll=true;p.durationMs=168000;
 p.members=[member('Mira',0,'vocal'),member('Jules',1,'vocal'),member('Ren',2,'rapper'),member('Sora',3),member('Alex',4,'rapper'),member('林夏',5,'vocal')];
 p.members[0].tags=['high','soft'];p.members[1].tags=['high','power'];p.members[3].tags=['soft'];p.members[5].tags=['soft'];
 const texts=[['Verse 1','lead','街灯把夜色折成一封信'],['Verse 1','lead','你说远方也有同样的星'],['Verse 1','rap','Cross the city, keep the rhythm in our feet'],['Verse 1','lead','把没说完的故事唱给你听'],['Pre-chorus','lead','Every voice becomes a little light'],['Pre-chorus','lead','等风经过，让回声再靠近'],['Chorus 1','group','We keep a little fire after hours'],['Chorus 1','group','今夜每一种声音都值得被听见'],['Verse 2','rap','翻过路口，让节拍带我向前'],['Verse 2','rap','No map, no script, just a song we share'],['Verse 2','lead','你把沉默写成新的和弦'],['Verse 2','lead','I hear the morning in your melody'],['Pre-chorus','lead','And every voice becomes a little light'],['Pre-chorus','lead','让心跳与这一刻一起共鸣'],['Chorus 2','group','We keep a little fire after hours'],['Chorus 2','group','今夜每一种声音都值得被听见'],['Bridge','lead','当城市安静，我们仍然歌唱'],['Bridge','lead','Let the last note find its way back home'],['Bridge','lead','你和我之间，不只一种答案'],['Bridge','lead','让所有微光汇成新的天亮'],['Final chorus','group','We keep a little fire after hours'],['Final chorus','group','今夜每一种声音都值得被听见'],['Outro','lead','Keep singing, until the morning comes'],['Outro','lead','带着我们的歌，再走过一遍']];
 p.segments=texts.map((a,i)=>({id:`demo-${i}`,text:a[2],section:a[0],role:a[1] as Role,language:/[\u4e00-\u9fff]/.test(a[2])?'zh':'en',startMs:4000+i*6500,endMs:4000+i*6500+5800,timing:'estimated',memberIds:[p.members[i%6].id],locked:false,tags:i===17?['high']:[]}));
 const result=allocate(p,'style');if(result.ok)p.segments=result.segments;return p;
}
export const timed = (s:Segment):boolean => Number.isFinite(s.startMs)&&Number.isFinite(s.endMs)&&s.startMs!>=0&&s.endMs!>s.startMs!;
export const solo = (s:Segment) => (s.role==='lead'||s.role==='rap')&&s.text.trim().length>0;
export function unionLength(ranges:[number,number][]):number {const sorted=ranges.filter(r=>r[1]>r[0]).sort((a,b)=>a[0]-b[0]);let sum=0,start=-1,end=-1;for(const [a,b]of sorted){if(start<0){start=a;end=b;}else if(a<=end)end=Math.max(end,b);else{sum+=end-start;start=a;end=b;}}return sum+(start<0?0:end-start);}
export function summarize(p:Project) {
 const ms=p.members.filter(m=>m.enabled);const ids=new Set(ms.map(m=>m.id));const segs=p.segments.filter(s=>p.includedRoles.includes(s.role));const useTime=segs.length>0&&segs.every(timed);
 const valid=(s:Segment)=>s.memberIds.filter(id=>ids.has(id));
 const individual=segs.filter(s=>p.policy!=='group-separate'||s.role!=='group');
 const values=new Map(ms.map(m=>[m.id,0]));
 if(useTime&&p.policy==='split-shared'){
  const bounds=[...new Set(individual.flatMap(s=>[s.startMs!,s.endMs!]))].sort((a,b)=>a-b);
  for(let i=0;i<bounds.length-1;i++){const [a,b]=[bounds[i],bounds[i+1]];const active=new Set(individual.filter(s=>s.startMs!<b&&s.endMs!>a).flatMap(valid));for(const id of active)values.set(id,values.get(id)!+(b-a)/active.size);}
 }else for(const m of ms){const parts=individual.filter(s=>valid(s).includes(m.id));values.set(m.id,useTime?unionLength(parts.map(s=>[s.startMs!,s.endMs!])):parts.reduce((n,s)=>n+(p.policy==='split-shared'?1/Math.max(1,valid(s).length):1),0));}
 const total=[...values.values()].reduce((a,b)=>a+b,0);
 const rows=ms.map(m=>({member:m,value:values.get(m.id)!,share:total?values.get(m.id)!/total*100:0,soloLines:p.segments.filter(s=>solo(s)&&s.memberIds.length===1&&s.memberIds[0]===m.id).length,lines:segs.filter(s=>valid(s).includes(m.id)).length})).sort((a,b)=>b.value-a.value);
 const squares=rows.reduce((n,r)=>n+r.value*r.value,0);const fairness=squares?total*total/(ms.length*squares)*100:null;
 const group=segs.filter(s=>s.role==='group');const groupValue=useTime?unionLength(group.map(s=>[s.startMs!,s.endMs!])):group.length;
 const known=segs.filter(timed);const coverage=unionLength(known.filter(s=>valid(s).length).map(s=>[s.startMs!,s.endMs!]));
 return {rows,total,useTime,fairness,groupValue,coverage,unassigned:segs.filter(s=>!valid(s).length).length,untimed:segs.filter(s=>!timed(s)).length,estimated:segs.some(s=>s.timing==='estimated'),unverified:segs.some(s=>s.timing==='imported'),missing:rows.filter(r=>r.soloLines===0).map(r=>r.member.name)};
}
export type Allocation = {ok:true;segments:Segment[]}|{ok:false;errors:string[]};
export function allocate(p:Project,style:Style):Allocation {
 const members=p.members.filter(m=>m.enabled);if(!members.length)return {ok:false,errors:['请至少启用一位成员。']};if(!p.segments.length)return {ok:false,errors:['请先导入或添加歌词。']};
 const segments=p.segments.map(s=>({...s,memberIds:[...s.memberIds],tags:[...s.tags]}));const errors:string[]=[];const idset=new Set(members.map(m=>m.id));
 const eligible=(s:Segment,m:Member)=> (!p.rules.strictLanguage||s.language==='und'||m.languages.includes(s.language))&&(!p.rules.strictRole||s.role!=='rap'||m.role!=='vocal')&&(!p.rules.strictTags||s.tags.every(t=>m.tags.includes(t)));
 const automaticGroup=(s:Segment)=>s.role==='group'||(p.rules.chorusAll&&!/pre|副歌前/i.test(s.section)&&/chorus|副歌/i.test(s.section)&&s.role==='lead');
 for(const s of segments){if(s.locked){if(s.memberIds.some(id=>!idset.has(id)))errors.push(`锁定句「${s.text.slice(0,20)}」包含未启用成员。`);if(!s.memberIds.length)errors.push('锁定句尚未指定演唱者。');for(const id of s.memberIds){const m=members.find(m=>m.id===id);if(m&&!eligible(s,m))errors.push(`锁定句与 ${m.name} 的硬规则冲突。`);}}else if(automaticGroup(s)){s.role='group';s.memberIds=members.filter(m=>eligible(s,m)).map(m=>m.id);if(!s.memberIds.length)errors.push(`合唱句「${s.text.slice(0,20)}」没有符合条件的成员。`);s.reason='合唱单独保留，个人独唱机会另行分配。';}else{s.memberIds=[];if(!members.some(m=>eligible(s,m)))errors.push(`「${s.text.slice(0,20)}」没有符合语言、Rap 或标签规则的候选。`);}}
 if(errors.length)return {ok:false,errors:[...new Set(errors)]};
 const free=segments.filter(s=>!s.locked&&s.role!=='group');const credited=new Set(segments.filter(s=>solo(s)&&s.memberIds.length===1).flatMap(s=>s.memberIds));const missing=members.filter(m=>!credited.has(m.id));
 const timeClash=(s:Segment,m:Member)=>p.rules.live&&solo(s)&&timed(s)&&segments.some(o=>o.id!==s.id&&solo(o)&&timed(o)&&o.memberIds.includes(m.id)&&o.startMs!<s.endMs!&&o.endMs!>s.startMs!);
 const weight=(s:Segment)=>timed(s)?(s.endMs!-s.startMs!)/1000:1;
 const score=(s:Segment,m:Member)=>{
  const load=segments.filter(o=>o.memberIds.length===1&&o.memberIds[0]===m.id&&solo(o)).reduce((n,o)=>n+weight(o),0);const matching=s.tags.filter(t=>m.tags.includes(t)).length;
  const roleFit=s.role==='rap'?(m.role==='rapper'?3:m.role==='allrounder'?1:-2):(m.role==='vocal'?1.5:m.role==='allrounder'?0.7:0);
  const balance=(style==='balanced'?1.8:style==='vocal'?0.23:0.55)*(p.rules.balance/55);
  const adjacent=segments.findIndex(o=>o.id===s.id);const previous=segments[adjacent-1];const continuity=previous?.memberIds.includes(m.id)?-0.4:0;
  return roleFit*(style==='vocal'?2.2:1)+matching*2+(m.languages.includes(s.language)?0.5:0)+m.priority/100*(style==='vocal'?1.5:0.5)-load*balance+continuity;
 };
 if(p.rules.allMembers){
  const pool=free.filter(s=>solo(s));if(pool.length<missing.length)return {ok:false,errors:[`还需要 ${missing.length} 个个人独唱句，当前只有 ${pool.length} 个可分配句。可拆句、关闭副歌合唱或关闭全员独唱。`]};
  const ordered=[...missing].sort((a,b)=>pool.filter(s=>eligible(s,a)).length-pool.filter(s=>eligible(s,b)).length);let attempts=0;
  const cover=(i:number):boolean=>{if(i===ordered.length)return true;if(++attempts>20000)return false;const m=ordered[i];const candidates=pool.filter(s=>!s.memberIds.length&&eligible(s,m)&&!timeClash(s,m)).sort((a,b)=>score(b,m)-score(a,m));for(const s of candidates){s.memberIds=[m.id];s.reason='保留全员实质性独唱机会；符合已开启的硬规则。';if(cover(i+1))return true;s.memberIds=[];}return false;};
  if(!cover(0))return {ok:false,errors:['未找到满足全员独唱和当前硬规则的草案。请检查成员语言/标签，或放宽条件。']};
 }
 for(const s of free){if(s.memberIds.length)continue;const candidates=members.filter(m=>eligible(s,m)&&!timeClash(s,m)).sort((a,b)=>score(s,b)-score(s,a)||members.indexOf(a)-members.indexOf(b));if(!candidates.length)return {ok:false,errors:[`「${s.text.slice(0,20)}」无法满足现场重叠限制。请调整时间或关闭现场限制。`]};const m=candidates[0];s.memberIds=[m.id];s.reason=`${styleLabels[style]}：${m.role==='rapper'&&s.role==='rap'?'Rap 标签匹配；':m.role==='vocal'&&s.role==='lead'?'主唱标签匹配；':''}${s.tags.some(t=>m.tags.includes(t))?'段落标签匹配；':''}综合当前个人负担与用户偏好。`;}
 if(p.rules.live){for(const s of segments.filter(s=>solo(s)&&timed(s))){for(const id of s.memberIds){const m=members.find(m=>m.id===id)!;if(timeClash(s,m))errors.push(`${m.name} 在重叠的主旋律/Rap 句中同时演唱。`);}}}return errors.length?{ok:false,errors:[...new Set(errors)]}:{ok:true,segments};
}
export function detectLanguage(text:string):string {return /[\u3040-\u30ff]/.test(text)?'ja':/[\uac00-\ud7af]/.test(text)?'ko':/[\u4e00-\u9fff]/.test(text)?'zh':/[a-zA-Z]/.test(text)?'en':'und';}
export function parseClock(text:string):number|undefined {const t=text.trim().replace(',','.');if(!t)return undefined;const parts=t.split(':').map(Number);if(parts.some(n=>!Number.isFinite(n)||n<0)||parts.length>3)return undefined;return Math.round(parts.reduce((n,x)=>n*60+x,0)*1000);}
export function clock(ms:number,decimals=false):string {const v=Math.max(0,ms)/1000;return `${Math.floor(v/60).toString().padStart(2,'0')}:${(Math.floor(v)%60).toString().padStart(2,'0')}${decimals?'.'+Math.floor(ms%1000/100).toString():''}`;}
const newSegment=(text:string,section:string,startMs?:number,endMs?:number,timing:Timing='none'):Segment=>({id:uid(),text,section,role:/rap/i.test(section)?'rap':'lead',language:detectLanguage(text),startMs,endMs,timing,memberIds:[],locked:false,tags:[]});
export function parseLyrics(input:string):Segment[]{
 if(input.length>100000)throw new Error('歌词过长，请控制在 100,000 字符以内。');
 const normalized=input.replace(/\r\n?/g,'\n').trim();if(!normalized)return [];
 const out:Segment[]=[];
 if(/\d{2}:\d{2}:\d{2}[,.]\d{3}\s*-->/.test(normalized)){
  for(const block of normalized.split(/\n\s*\n/)){const lines=block.split('\n');const i=lines.findIndex(x=>x.includes('-->'));if(i<0)continue;const times=lines[i].split('-->');const a=parseClock(times[0]),b=parseClock(times[1].trim().split(/\s/)[0]);const text=lines.slice(i+1).join(' ').replace(/<[^>]*>/g,'').trim();if(text&&a!==undefined&&b!==undefined&&b>a)out.push(newSegment(text,'Verse 1',a,b,'imported'));else throw new Error('SRT 中有非法时间区间或空歌词。');}
 }else if(/\[\d{1,3}:\d{2}(?:[.:]\d+)?\]/.test(normalized)){
  let section='Verse 1';const offset=Number(normalized.match(/\[offset:([+-]?\d+)\]/i)?.[1]??0);
  for(const line of normalized.split('\n')){const matches=[...line.matchAll(/\[(\d{1,3}):(\d{2})(?:[.:](\d+))?\]/g)];const clean=line.replace(/\[[^\]]*\]/g,'').trim();if(!matches.length){const heading=line.match(/^\[([^:]+)\]$/);if(heading)section=heading[1];continue;}for(const m of matches){const start=Math.max(0,Math.round((Number(m[1])*60+Number(m[2])+Number('0.'+(m[3]??'0')))*1000)+offset);if(clean)out.push(newSegment(clean,section,start));}}
  out.sort((a,b)=>a.startMs!-b.startMs!);for(let i=0;i<out.length-1;i++){if(out[i+1].startMs!>out[i].startMs!){out[i].endMs=out[i+1].startMs;out[i].timing='estimated';}}
 }else{let section='Verse 1';for(const line of normalized.split('\n')){const clean=line.trim();if(!clean)continue;const heading=clean.match(/^\[([^\]]+)\]$/);if(heading){section=heading[1];continue;}out.push(newSegment(clean,section));}}
 if(out.length>500)throw new Error('首版每首歌最多支持 500 个片段。');return out;
}
export function estimateTimes(segs:Segment[],durationMs:number):Segment[]{if(!Number.isFinite(durationMs)||durationMs<1000||durationMs>3600000)throw new Error('估时总长度应为 1–3600 秒。');if(segs.some(s=>s.locked))throw new Error('估时会改变时间，请先解除锁定句或逐句编辑。');const weights=segs.map(s=>Math.max(3,[...s.text.replace(/\s/g,'')].length));const sum=weights.reduce((a,b)=>a+b,0);let cursor=0;return segs.map((s,i)=>{const start=cursor;cursor=i===segs.length-1?durationMs:cursor+Math.round(durationMs*weights[i]/sum);return {...s,startMs:start,endMs:cursor,timing:'estimated'};});}
export function validateProject(value:unknown):Project{
 const p=value as Project;if(!p||typeof p!=='object'||p.schemaVersion!==1||!Array.isArray(p.members)||!Array.isArray(p.segments))throw new Error('不是有效的 Line Studio 项目文件。');
 if(p.members.length<1||p.members.length>50||p.segments.length>500)throw new Error('阵容支持 1–50 人，片段最多 500 个。');const ids=new Set<string>();
 for(const m of p.members){if(!m||typeof m.id!=='string'||ids.has(m.id)||typeof m.name!=='string'||!m.name.trim()||m.name.length>80||!/^#[0-9a-f]{6}$/i.test(m.color)||typeof m.enabled!=='boolean'||!['vocal','rapper','allrounder'].includes(m.role)||!Array.isArray(m.languages)||!m.languages.every(x=>typeof x==='string'&&x.length<20)||!Array.isArray(m.tags)||!m.tags.every(x=>typeof x==='string'&&x.length<80)||!Number.isFinite(m.priority)||m.priority<0||m.priority>100)throw new Error('成员资料不完整或格式错误。');ids.add(m.id);}
 const sids=new Set<string>();for(const s of p.segments){if(!s||typeof s.id!=='string'||sids.has(s.id)||typeof s.text!=='string'||s.text.length>4000||typeof s.section!=='string'||s.section.length>100||typeof s.language!=='string'||!Object.hasOwn(roleLabels,s.role)||!['none','estimated','imported','verified'].includes(s.timing)||typeof s.locked!=='boolean'||!Array.isArray(s.tags)||!s.tags.every(x=>typeof x==='string'&&x.length<80)||!Array.isArray(s.memberIds)||s.memberIds.some(id=>!ids.has(id))||new Set(s.memberIds).size!==s.memberIds.length)throw new Error('歌词片段格式错误。');sids.add(s.id);if((s.startMs!==undefined&&(!Number.isInteger(s.startMs)||s.startMs<0||s.startMs>3600000))||(s.endMs!==undefined&&(!Number.isInteger(s.endMs)||s.endMs<0||s.endMs>3600000))||(s.startMs!==undefined&&s.endMs!==undefined&&s.endMs<=s.startMs))throw new Error('时间区间必须在 0–3600 秒内且结束晚于开始。');}
 if(typeof p.title!=='string'||p.title.length>200||typeof p.artist!=='string'||p.artist.length>200||!['annotation','redistribution'].includes(p.mode)||!Object.hasOwn(policyLabels,p.policy)||!Object.hasOwn(styleLabels,p.style)||!Array.isArray(p.includedRoles)||!p.includedRoles.every(r=>Object.hasOwn(roleLabels,r))||!Number.isFinite(p.durationMs)||p.durationMs<0||p.durationMs>3600000)throw new Error('项目设置格式错误。');
 if(!p.rules||['allMembers','chorusAll','strictLanguage','strictRole','strictTags','live'].some(k=>typeof p.rules[k as keyof Rules]!=='boolean')||!Number.isFinite(p.rules.balance)||p.rules.balance<0||p.rules.balance>100)throw new Error('分配规则格式错误。');return structuredClone(p);
}
export function csvCell(v:unknown):string {let s=String(v??'');if(/^[\s]*[=+\-@]/.test(s))s="'"+s;return '"'+s.replaceAll('"','""')+'"';}
export function exportCsv(p:Project):string{return '\uFEFF'+[['句子','段落','类型','成员','开始秒','结束秒','时间状态','统计口径'],...p.segments.map(s=>[s.text,s.section,roleLabels[s.role],s.memberIds.map(id=>p.members.find(m=>m.id===id)?.name??'待分配').join(' / '),s.startMs===undefined?'':s.startMs/1000,s.endMs===undefined?'':s.endMs/1000,s.timing,policyLabels[p.policy]])].map(row=>row.map(csvCell).join(',')).join('\r\n');}
export function summaryText(p:Project):string {const s=summarize(p);return `${p.title} · ${p.mode==='redistribution'?'假想分配':'原曲标注'}\n${policyLabels[p.policy]} · ${s.useTime?(s.estimated?'估算秒数':s.unverified?'导入时间，待核对':'已核对时间'):'按句数统计，时间不完整'}\n`+s.rows.map((r,i)=>`${i+1}. ${r.member.name} — ${s.useTime?(r.value/1000).toFixed(1)+' 秒':r.value.toFixed(1)+' 句'} (${r.share.toFixed(1)}%)`).join('\n')+(p.policy==='group-separate'?`\nALL 合唱 — ${s.useTime?(s.groupValue/1000).toFixed(1)+' 秒':s.groupValue+' 句'}`:'');}
