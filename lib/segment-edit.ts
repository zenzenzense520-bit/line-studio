import {timed, uid, type Project, type Segment, type Timing} from './studio.ts';

function editable(project:Project, id:string):number {
 const index=project.segments.findIndex(s=>s.id===id);
 if(index<0)throw new Error('找不到这个片段。');
 if(project.segments[index].locked)throw new Error('请先解锁并保存，再修改片段结构或校时。');
 return index;
}

export function splitSegment(project:Project,id:string,offset:number,boundaryMs?:number):Project {
 const index=editable(project,id), source=project.segments[index];
 if(project.segments.length>=500)throw new Error('片段已达 500 个，无法继续拆分。');
 const boundaries=new Set([0,...Array.from(new Intl.Segmenter(undefined,{granularity:'grapheme'}).segment(source.text),s=>s.index+s.segment.length)]);
 if(!Number.isInteger(offset)||!boundaries.has(offset))throw new Error('请把光标放在两个完整字符之间。');
 const left=source.text.slice(0,offset).trim(),right=source.text.slice(offset).trim();
 if(!left||!right)throw new Error('请把光标放在句中，让拆开的两句都有歌词。');
 let cut:number|undefined;
 if(timed(source)) {
  cut=boundaryMs??Math.round(source.startMs!+(source.endMs!-source.startMs!)*[...left].length/([...left].length+[...right].length));
  if(!Number.isInteger(cut)||cut<=source.startMs!||cut>=source.endMs!)throw new Error('拆分时间必须位于这句的起止时间之间。');
 }else if(boundaryMs!==undefined)throw new Error('请先补全原句时间，再指定拆分时间。');
 const next=structuredClone(project), first=next.segments[index];
 const second:Segment={...structuredClone(first),id:uid(),text:right,startMs:cut,endMs:first.endMs};
 first.text=left;first.endMs=cut;
 const confidence:Timing=cut===undefined?'none':boundaryMs===undefined||source.timing==='none'?'estimated':source.timing;
 first.timing=second.timing=confidence;
 first.reason=second.reason='手动拆句；演唱归属沿用原句，可分别修改。';
 next.segments.splice(index+1,0,second);
 return next;
}

const sameSet=(a:string[],b:string[])=>a.length===b.length&&a.every(x=>b.includes(x));
export function mergeWithNext(project:Project,id:string):Project {
 const index=editable(project,id),a=project.segments[index],b=project.segments[index+1];
 if(!b)throw new Error('已经是最后一个片段。');
 editable(project,b.id);
 if(a.role!==b.role||a.section!==b.section||a.language!==b.language||!sameSet(a.memberIds,b.memberIds)||!sameSet(a.tags,b.tags))throw new Error('两句的成员、段落、类型、语言和标签须一致，调整后再合并。');
 const bothTimed=timed(a)&&timed(b),bothUntimed=[a.startMs,a.endMs,b.startMs,b.endMs].every(x=>x===undefined);
 if(!bothTimed&&!bothUntimed)throw new Error('请先补全两句时间，或清除两句时间后再合并。');
 if(bothTimed&&a.endMs!==b.startMs)throw new Error('两句时间须首尾相接，合并才不会改变演唱时长。');
 const text=a.text+'\n'+b.text;
 if(text.length>4000)throw new Error('合并后超过每个片段 4000 字符的上限。');
 const timing:Timing=bothUntimed?'none':a.timing==='estimated'||b.timing==='estimated'||a.timing==='none'||b.timing==='none'?'estimated':a.timing==='imported'||b.timing==='imported'?'imported':'verified';
 const next=structuredClone(project);
 next.segments.splice(index,2,{...next.segments[index],text,endMs:b.endMs,timing,reason:'手动合并相邻片段；演唱归属与时长保持一致。'});
 return next;
}

export function recordInterval(project:Project,id:string,startMs:number,endMs:number):Project {
 const index=editable(project,id);
 if(!Number.isInteger(startMs)||!Number.isInteger(endMs)||startMs<0||endMs<=startMs||endMs>3600000)throw new Error('结束应晚于开始，时间须在 0–60 分钟内。');
 const next=structuredClone(project);
 next.segments[index]={...next.segments[index],startMs,endMs,timing:'verified'};
 return next;
}
