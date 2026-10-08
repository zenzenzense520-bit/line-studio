'use client';
import {ChevronLeft,ChevronRight,Timer,Upload,Lock} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Select,SelectContent,SelectItem,SelectTrigger,SelectValue} from '@/components/ui/select';
import {clock,timed,type Project} from '@/lib/studio';

const precise=(ms:number)=>clock(Math.round(ms))+'.'+String(Math.round(ms)%1000).padStart(3,'0');
export default function TimingEditor({project,currentId,head,pendingStart,ready,hasMedia,onSelect,onStart,onEnd,onCancel,onImport,onEdit}:{project:Project;currentId?:string;head:number;pendingStart?:number;ready:boolean;hasMedia:boolean;onSelect:(id:string)=>void;onStart:()=>void;onEnd:()=>void;onCancel:()=>void;onImport:()=>void;onEdit:()=>void}){
 const index=project.segments.findIndex(s=>s.id===currentId),segment=project.segments[index];
 const completed=project.segments.filter(s=>timed(s)&&s.timing==='verified').length;
 if(!segment)return <div className="empty-state"><Timer/><h3>先添加要校时的歌词</h3><p>导入歌词后，边听音频边记录每句起止点。</p></div>;
 return <div className="timing-view">
  <div className="timing-progress"><span>已核对 {completed} / {project.segments.length} 句</span><span>第 {index+1} 句</span></div>
  <Select value={segment.id} onValueChange={onSelect}><SelectTrigger aria-label="校时片段"><SelectValue/></SelectTrigger><SelectContent position="popper">{project.segments.map((s,i)=><SelectItem key={s.id} value={s.id}>{String(i+1).padStart(2,'0')} · {s.text.slice(0,36)}</SelectItem>)}</SelectContent></Select>
  <div className="timing-card"><div className="timing-caption"><span>{segment.section||'未分段'} · {segment.memberIds.map(id=>project.members.find(m=>m.id===id)?.name).filter(Boolean).join(' / ')||'待分配'}</span>{segment.locked&&<span><Lock size={12}/>已锁定</span>}</div><p className="timing-lyric">{segment.text}</p><div className="timing-existing">{timed(segment)?`${precise(segment.startMs!)} – ${precise(segment.endMs!)} · ${segment.timing==='verified'?'已核对':segment.timing==='estimated'?'估算':'待核对'}`:'尚未记录完整时间'}</div></div>
  <div className="timing-clock"><span>当前播放位置</span><strong>{precise(head)}</strong></div>
  <div className="timing-record-actions"><Button variant={pendingStart===undefined?'default':'outline'} disabled={!ready||segment.locked} onClick={onStart}><Timer/>{pendingStart===undefined?'记录开始':'重记开始'}<kbd>S</kbd></Button><Button disabled={!ready||segment.locked||pendingStart===undefined||Math.round(head)<=pendingStart} onClick={onEnd}>结束并下一句<kbd>E</kbd></Button></div>
  <p className="timing-pending" aria-live="polite">{pendingStart===undefined?'播放歌曲，在开口时记录开始，在收声时记录结束。':`开始点 ${precise(pendingStart)} · 等待记录结束`}</p>
  <div className="timing-navigation"><Button variant="ghost" disabled={index===0} onClick={()=>onSelect(project.segments[index-1].id)}><ChevronLeft/>上一句</Button>{pendingStart!==undefined?<button className="subtle-btn" onClick={onCancel}>取消本次记录</button>:<button className="subtle-btn" onClick={onEdit}>编辑本句</button>}<Button variant="ghost" disabled={index===project.segments.length-1} onClick={()=>onSelect(project.segments[index+1].id)}>下一句<ChevronRight/></Button></div>
  {!hasMedia?<div className="timing-import"><p>导入本地音频后开始听音校时。</p><Button variant="outline" onClick={onImport}><Upload/>导入音频</Button></div>:!ready?<p className="form-help">请等待音频载入；载入失败时可更换音频。</p>:<p className="form-help">用底部播放器播放、减速或暂停；S / E 快捷键在此页生效。记录结束后音频继续播放，每句校时可单独撤销。</p>}
  {segment.locked&&<p className="warning-text">请在歌词编辑中解锁此句，再记录时间。</p>}
 </div>;
}
