import { useEffect, useMemo, useState } from "react";
import "./CurriculumBuilder.css";
const PREFIX="educonnect.curriculum.v1.";
const EVENT="educonnect:curriculum-updated";
const key=(teacher,id)=>`${PREFIX}${encodeURIComponent(String(teacher||"").toLowerCase())}.${encodeURIComponent(String(id))}`;
const read=k=>{try{return JSON.parse(localStorage.getItem(k)||"null")}catch{return null}};
const uid=()=>crypto?.randomUUID?.()||`${Date.now()}-${Math.random().toString(36).slice(2)}`;
const qkey=(email,id)=>`educonnect.quiz.v1.${encodeURIComponent(String(email).toLowerCase())}.${encodeURIComponent(String(id))}`;
const akey=(email,id)=>`educonnect.assignments.v1.${encodeURIComponent(String(email).toLowerCase())}.${encodeURIComponent(String(id))}`;
const array=k=>{const v=read(k);return Array.isArray(v)?v:[]};
const DB="educonnect-curriculum-resources", STORE="files";
function resourceDb(){return new Promise((resolve,reject)=>{const req=indexedDB.open(DB,1);req.onupgradeneeded=()=>req.result.createObjectStore(STORE);req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error)})}
async function resource(action,mode="readonly"){const db=await resourceDb();try{return await new Promise((resolve,reject)=>{const tx=db.transaction(STORE,mode),r=action(tx.objectStore(STORE));r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);tx.onerror=()=>reject(tx.error)})}finally{db.close()}}
const put=(id,file)=>resource(s=>s.put(file,id),"readwrite");
const get=id=>resource(s=>s.get(id));
const del=id=>resource(s=>s.delete(id),"readwrite");
function download(file){const u=URL.createObjectURL(file),a=document.createElement("a");a.href=u;a.download=file.name||"resource";document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),1000)}
const empty=()=>({sections:[],resources:[],links:[]});
function useRevision(){const [n,setN]=useState(0);useEffect(()=>{const f=()=>setN(x=>x+1);["storage","focus",EVENT,"educonnect:quizzes-updated","educonnect:assignments-updated"].forEach(e=>window.addEventListener(e,f));return()=>["storage","focus",EVENT,"educonnect:quizzes-updated","educonnect:assignments-updated"].forEach(e=>window.removeEventListener(e,f))},[]);return n}
export default function CurriculumBuilder({role,email,courses=[],onAddLesson,onReorderLessons,onOpenLesson}){
  const [courseId,setCourseId]=useState("");
  const [sectionName,setSectionName]=useState("");
  const [lessonTitle,setLessonTitle]=useState("");
  const [lessonDescription,setLessonDescription]=useState("");
  const [chosenSection,setChosenSection]=useState("");
  const [message,setMessage]=useState("");
  const revision=useRevision();
  const course=courses.find(c=>String(c.id)===String(courseId))||courses[0];
  const teacher=role==="teacher"?email:course?.teacherEmail;
  const storageKey=course?key(teacher,course.id):"";
  const saved=useMemo(()=>storageKey?(read(storageKey)||empty()):empty(),[storageKey,revision]);
  const lessons=Array.isArray(course?.lessons)?course.lessons:Array.isArray(course?.lessonItems)?course.lessonItems:[];
  const sections=useMemo(()=>{
    const existing=saved.sections||[];
    const assigned=new Set(existing.flatMap(s=>s.lessonIds||[]).map(String));
    const missing=lessons.filter(l=>!assigned.has(String(l.id))).map(l=>String(l.id));
    return [...existing.map(s=>({...s,lessonIds:(s.lessonIds||[]).filter(id=>lessons.some(l=>String(l.id)===String(id)))})),
      ...(missing.length?[{id:"unassigned",title:"Unassigned Lessons",lessonIds:missing}]:[])];
  },[saved,lessons]);
  const quizzes=course?array(qkey(teacher,course.id)):[];
  const assignments=course?array(akey(teacher,course.id)):[];
  const persist=next=>{try{localStorage.setItem(storageKey,JSON.stringify(next));window.dispatchEvent(new Event(EVENT));setMessage("Curriculum saved.")}catch(e){setMessage(`Save failed: ${e.message}`)}};
  const addSection=()=>{if(!sectionName.trim()||!course)return;persist({...saved,sections:[...(saved.sections||[]),{id:uid(),title:sectionName.trim(),lessonIds:[]}]});setSectionName("")};
  const moveSection=(id,d)=>{const list=[...(saved.sections||[])],i=list.findIndex(s=>s.id===id),j=i+d;if(i<0||j<0||j>=list.length)return;[list[i],list[j]]=[list[j],list[i]];persist({...saved,sections:list})};
  const renameSection=s=>{const title=window.prompt("Section title",s.title)?.trim();if(!title)return;persist({...saved,sections:(saved.sections||[]).map(x=>x.id===s.id?{...x,title}:x)})};
  const removeSection=s=>{if(!window.confirm("Delete this section? Lessons will stay in the course as unassigned."))return;persist({...saved,sections:(saved.sections||[]).filter(x=>x.id!==s.id)})};
  const assignLesson=(lessonId,sectionId)=>{
    const actual=sectionId==="unassigned"?"":sectionId;
    let list=(saved.sections||[]).map(s=>({...s,lessonIds:(s.lessonIds||[]).filter(id=>String(id)!==String(lessonId))}));
    if(actual)list=list.map(s=>s.id===actual?{...s,lessonIds:[...s.lessonIds,String(lessonId)]}:s);
    persist({...saved,sections:list});
  };
  const moveLesson=(sectionId,lessonId,d)=>{
    const section=sections.find(s=>s.id===sectionId),ids=[...(section?.lessonIds||[])],i=ids.indexOf(String(lessonId)),j=i+d;
    if(i<0||j<0||j>=ids.length)return;
    [ids[i],ids[j]]=[ids[j],ids[i]];
    if(sectionId==="unassigned"){setMessage("Move this lesson into a section before reordering.");return}
    persist({...saved,sections:(saved.sections||[]).map(s=>s.id===sectionId?{...s,lessonIds:ids}:s)});
    onReorderLessons?.(course.id,sections.map(s=>s.id===sectionId?{...s,lessonIds:ids}:s).flatMap(s=>s.lessonIds));
  };
  const createLesson=()=>{
    if(!lessonTitle.trim()||!course||!onAddLesson)return;
    const id=uid();
    onAddLesson(course.id,{id,title:lessonTitle.trim(),description:lessonDescription.trim(),duration:"",isFreePreview:false});
    if(chosenSection){persist({...saved,sections:(saved.sections||[]).map(s=>s.id===chosenSection?{...s,lessonIds:[...(s.lessonIds||[]),String(id)]}:s)})}
    setLessonTitle("");setLessonDescription("");setMessage("Lesson added. Use the existing Lessons tab to attach its video.");
  };
  const addResource=async(lessonId,file)=>{
    if(!file)return;
    if(file.size>20*1024*1024){setMessage("Maximum file size is 20 MB.");return}
    if(!(/\.(pdf|txt|md|docx|pptx)$/i.test(file.name))){setMessage("Allowed: PDF, TXT, MD, DOCX, PPTX.");return}
    const id=uid();try{await put(id,file);persist({...saved,resources:[...(saved.resources||[]),{id,lessonId:String(lessonId),name:file.name,size:file.size}]})}catch(e){setMessage(`File save failed: ${e.message}`)}
  };
  const openResource=async r=>{try{const file=await get(r.id);if(!file)throw Error("File missing from this browser");download(file)}catch(e){setMessage(e.message)}};
  const removeResource=async r=>{try{await del(r.id);persist({...saved,resources:(saved.resources||[]).filter(x=>x.id!==r.id)})}catch(e){setMessage(e.message)}};
  const setLink=(sectionId,type,id,checked)=>{const rest=(saved.links||[]).filter(l=>!(l.sectionId===sectionId&&l.type===type&&String(l.id)===String(id)));persist({...saved,links:checked?[...rest,{sectionId,type,id:String(id)}]:rest})};
  return <div className="ecc-root"><div className="ecc-hero"><h2>Course Curriculum Builder</h2><p>Organize existing course lessons into sections, attach downloadable resources, and link your quizzes and assignments.</p></div>
    {!courses.length?<p>No {role==="teacher"?"created":"enrolled"} courses available.</p>:<>
    <label className="ecc-field">Course<select value={course?.id??""} onChange={e=>{setCourseId(e.target.value);setMessage("")}}>{courses.map(c=><option key={c.id} value={c.id}>{c.title}</option>)}</select></label>
    {role==="teacher"&&<div className="ecc-panel"><h3>Add Section</h3><div className="ecc-inline"><input value={sectionName} onChange={e=>setSectionName(e.target.value)} placeholder="e.g. React Fundamentals"/><button onClick={addSection}>Add Section</button></div>
      <h3>Add Video Lesson</h3><p className="ecc-hint">This creates a lesson in your existing course. Attach or edit its video using the original Lessons tab.</p>
      <div className="ecc-form"><input value={lessonTitle} onChange={e=>setLessonTitle(e.target.value)} placeholder="Lesson title"/><textarea value={lessonDescription} onChange={e=>setLessonDescription(e.target.value)} placeholder="Lesson description"/>
      <select value={chosenSection} onChange={e=>setChosenSection(e.target.value)}><option value="">Unassigned</option>{(saved.sections||[]).map(s=><option key={s.id} value={s.id}>{s.title}</option>)}</select><button onClick={createLesson}>Create Lesson</button></div></div>}
    <div className="ecc-panel"><h3>{role==="teacher"?"Curriculum Preview":"Course Curriculum"}</h3><p className="ecc-hint">Sections: {sections.length} · Lessons: {lessons.length}</p>
    {!sections.length?<p>No sections or lessons yet.</p>:sections.map((section,si)=><article className="ecc-section" key={section.id}><div className="ecc-section-head"><strong>{si+1}. {section.title}</strong>{role==="teacher"&&section.id!=="unassigned"&&<div className="ecc-actions">
      <button disabled={si===0} onClick={()=>moveSection(section.id,-1)}>↑ Section</button><button disabled={si===(saved.sections||[]).length-1} onClick={()=>moveSection(section.id,1)}>↓ Section</button><button onClick={()=>renameSection(section)}>Rename</button><button onClick={()=>removeSection(section)}>Delete</button></div>}</div>
      {(section.lessonIds||[]).map((lessonId,li)=>{const lesson=lessons.find(l=>String(l.id)===String(lessonId));if(!lesson)return null;return <div className="ecc-lesson" key={lessonId}>
        <div className="ecc-lesson-head"><div><strong>{li+1}. {lesson.title||"Untitled lesson"}</strong>{role==="student"&&<small className="ecc-progress">{lessons.findIndex(l=>String(l.id)===String(lessonId))<Number(course.completedLessons||0)?"✓ Completed":"Not completed"}</small>}<p>{lesson.description||"Video lesson"} {lesson.hasLocalVideo?"· Video attached":""}</p></div>
        {role==="student"&&onOpenLesson&&<button disabled={lessons.findIndex(l=>String(l.id)===String(lessonId))>Number(course.completedLessons||0)} onClick={()=>onOpenLesson(course.id,lessons.findIndex(l=>String(l.id)===String(lessonId)))}>Open Lesson</button>}</div>
        {role==="teacher"&&<div className="ecc-actions"><select value={section.id} onChange={e=>assignLesson(lessonId,e.target.value)}><option value="unassigned">Unassigned</option>{(saved.sections||[]).map(s=><option key={s.id} value={s.id}>{s.title}</option>)}</select>
        <button disabled={!li} onClick={()=>moveLesson(section.id,lessonId,-1)}>↑ Lesson</button><button disabled={li===section.lessonIds.length-1} onClick={()=>moveLesson(section.id,lessonId,1)}>↓ Lesson</button>
        <label className="ecc-upload">Attach resource<input type="file" accept=".pdf,.txt,.md,.docx,.pptx" onChange={e=>{addResource(lessonId,e.target.files?.[0]);e.target.value=""}}/></label></div>}
        {(saved.resources||[]).filter(r=>r.lessonId===String(lessonId)).map(r=><div className="ecc-resource" key={r.id}><span>📎 {r.name}</span><button onClick={()=>openResource(r)}>Download</button>{role==="teacher"&&<button onClick={()=>removeResource(r)}>Remove</button>}</div>)}
      </div>})}
      <div className="ecc-linked"><strong>Linked assessments</strong>
      {role==="teacher"?<div className="ecc-links">{quizzes.map(q=><label key={`q${q.id}`}><input type="checkbox" checked={(saved.links||[]).some(l=>l.sectionId===section.id&&l.type==="quiz"&&l.id===String(q.id))} onChange={e=>setLink(section.id,"quiz",q.id,e.target.checked)}/> Quiz: {q.title}</label>)}
      {assignments.map(a=><label key={`a${a.id}`}><input type="checkbox" checked={(saved.links||[]).some(l=>l.sectionId===section.id&&l.type==="assignment"&&l.id===String(a.id))} onChange={e=>setLink(section.id,"assignment",a.id,e.target.checked)}/> Assignment: {a.title}</label>)}
      {!quizzes.length&&!assignments.length&&<small>Create quizzes or assignments first using their existing tabs.</small>}</div>:
      <div className="ecc-links">{(saved.links||[]).filter(l=>l.sectionId===section.id).map(l=>{const a=(l.type==="quiz"?quizzes:assignments).find(x=>String(x.id)===l.id);return a?.published?<span key={l.type+l.id}>{l.type==="quiz"?"Quiz":"Assignment"}: {a.title}</span>:null})}</div>}</div>
    </article>)}</div>
    {message&&<p className="ecc-message" role="status">{message}</p>}
    <p className="ecc-hint">Frontend demo: sections, links and resource metadata use localStorage; file bytes use IndexedDB. Existing lesson completion is handled by the course player. Changes made here do not reset completed lessons, quizzes, assignments or learning paths.</p>
    </>}</div>
}
