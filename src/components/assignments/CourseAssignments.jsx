import { useEffect, useMemo, useState } from 'react';
import { notifyEnrolledStudents } from '../../utils/demoNotifications';
import { ASSIGNMENT_EVENT, assignmentKey, submissionKey, norm, read, save, uid, allSubmissions, getAttachment, downloadFile } from './assignmentStorage';
import './CourseAssignments.css';
import StudentCourseAssignments from './StudentCourseAssignments';

function useChanges(){const [version,setVersion]=useState(0);useEffect(()=>{const fn=()=>setVersion(v=>v+1);window.addEventListener(ASSIGNMENT_EVENT,fn);window.addEventListener('storage',fn);window.addEventListener('focus',fn);return()=>{window.removeEventListener(ASSIGNMENT_EVENT,fn);window.removeEventListener('storage',fn);window.removeEventListener('focus',fn);};},[]);return version;}
const blank = () => ({id:uid(),title:'',instructions:'',dueAt:'',maxMarks:100,published:false,createdAt:new Date().toISOString()});
const prettyDate = date => date ? new Date(date).toLocaleString() : 'No deadline';
async function getFile(row,setMessage){if(!row.fileId)return;try{const file=await getAttachment(row.fileId);if(!file)throw Error('Attachment not found in this browser.');downloadFile(file);}catch(err){setMessage(err.message||'Could not open file.');}}
function Teacher({email,courses}){
  const version=useChanges();const [courseId,setCourseId]=useState('');const [editing,setEditing]=useState(null);const [selectedId,setSelectedId]=useState('');const [marks,setMarks]=useState('');const [feedback,setFeedback]=useState('');const [message,setMessage]=useState('');
  const selected=courses.find(c=>String(c.id)===String(courseId))||courses[0];
  const assignments=useMemo(()=>selected?read(assignmentKey(email,selected.id)):[],[email,selected?.id,version]);
  const submissions=useMemo(()=>allSubmissions(),[version]);
  const selectedSubmission=submissions.find(s=>s.id===selectedId);
  const persistAssignment=()=>{
    const title=editing.title.trim(),instructions=editing.instructions.trim(),maxMarks=Number(editing.maxMarks);
    if(!title||!instructions||!Number.isInteger(maxMarks)||maxMarks<1||maxMarks>10000){setMessage('Title, instructions and valid maximum marks (1–10000) are required.');return;}
    if(editing.dueAt && !Number.isFinite(new Date(editing.dueAt).getTime())){setMessage('Enter a valid deadline.');return;}
    const previous=assignments.find(a=>a.id===editing.id);
    const justPublished=Boolean(editing.published&&!previous?.published);
    const item={...editing,title,instructions,maxMarks,teacherEmail:email,courseId:selected.id,updatedAt:new Date().toISOString(),publishedAt:justPublished?new Date().toISOString():previous?.publishedAt};
    save(assignmentKey(email,selected.id),previous?assignments.map(a=>a.id===item.id?item:a):[...assignments,item]);
    if(justPublished)notifyEnrolledStudents(email,selected.id,{id:`assignment-published:${item.id}:${item.publishedAt}`,type:'assignment',title:'New assignment available',message:`${item.title} is now available in ${selected.title||'your course'}.`,link:'course-assignments'});
    setEditing(null);setMessage('Assignment saved.');
  };
  const togglePublish=a=>{const publishing=!a.published;const updated={...a,published:publishing,publishedAt:publishing?new Date().toISOString():a.publishedAt};save(assignmentKey(email,selected.id),assignments.map(item=>item.id===a.id?updated:item));if(publishing)notifyEnrolledStudents(email,selected.id,{id:`assignment-published:${updated.id}:${updated.publishedAt}`,type:'assignment',title:'New assignment available',message:`${updated.title} is now available in ${selected.title||'your course'}.`,link:'course-assignments'});};
  const remove=a=>{if(!window.confirm(`Delete "${a.title}"? Past submissions will be retained.`))return;save(assignmentKey(email,selected.id),assignments.filter(x=>x.id!==a.id));setMessage('Assignment deleted.');};
  const grade=()=>{
    if(!selectedSubmission)return;const assignment=assignments.find(a=>a.id===selectedSubmission.assignmentId);
    if(!assignment){setMessage('Select the assignment course to grade.');return;}
    const score=Number(marks);if(marks===''||!Number.isFinite(score)||score<0||score>Number(assignment.maxMarks)){setMessage(`Marks must be between 0 and ${assignment.maxMarks}.`);return;}
    const key=submissionKey(selectedSubmission.studentEmail,selectedSubmission.assignmentId);
    save(key,read(key).map(s=>s.id===selectedSubmission.id?{...s,marks:score,feedback:feedback.trim(),gradedAt:new Date().toISOString(),gradedBy:email}:s));
    setSelectedId('');setMarks('');setFeedback('');setMessage('Grade and feedback saved.');
  };
  const courseSubmissions=submissions.filter(s=>String(s.courseId)===String(selected?.id)&&norm(s.teacherEmail)===norm(email));
  return <div className="edca-root"><header className="edca-hero"><small>INSTRUCTOR TOOLS</small><h2>Course Assignments & Submissions</h2><p>Create assignments, review submissions and provide grades and feedback.</p></header>
    {!courses.length?<section className="edca-panel">Create a course before adding assignments.</section>:<>
      <label className="edca-label">Select course<select value={selected?String(selected.id):''} onChange={e=>{setCourseId(e.target.value);setEditing(null);setSelectedId('');}}>{courses.map(c=><option key={String(c.id)} value={String(c.id)}>{c.title||'Untitled course'}</option>)}</select></label>
      {message&&<p className="edca-message" role="status">{message}</p>}
      {!editing&&<button className="edca-primary" type="button" onClick={()=>{setEditing(blank());setMessage('');}}>+ Create Assignment</button>}
      {editing&&<section className="edca-panel"><h3>{assignments.some(a=>a.id===editing.id)?'Edit Assignment':'New Assignment'}</h3>
        <label className="edca-label">Title<input value={editing.title} maxLength={140} onChange={e=>setEditing(x=>({...x,title:e.target.value}))}/></label>
        <label className="edca-label">Instructions<textarea rows="5" value={editing.instructions} onChange={e=>setEditing(x=>({...x,instructions:e.target.value}))}/></label>
        <div className="edca-grid"><label className="edca-label">Due date (optional)<input type="datetime-local" value={editing.dueAt} onChange={e=>setEditing(x=>({...x,dueAt:e.target.value}))}/></label><label className="edca-label">Maximum marks<input type="number" min="1" max="10000" value={editing.maxMarks} onChange={e=>setEditing(x=>({...x,maxMarks:e.target.value}))}/></label></div>
        <label className="edca-check"><input type="checkbox" checked={editing.published} onChange={e=>setEditing(x=>({...x,published:e.target.checked}))}/> Published for enrolled students</label>
        <div className="edca-actions"><button type="button" className="edca-primary" onClick={persistAssignment}>Save Assignment</button><button type="button" onClick={()=>setEditing(null)}>Cancel</button></div></section>}
      <section className="edca-panel"><h3>Assignments ({assignments.length})</h3>{!assignments.length?<p>No assignments yet.</p>:assignments.map(a=><article className="edca-item" key={a.id}><div><strong>{a.title}</strong><p>{a.published?'Published':'Draft'} · Due: {prettyDate(a.dueAt)} · Max {a.maxMarks} marks</p><small>{courseSubmissions.filter(s=>s.assignmentId===a.id).length} submissions</small></div><div className="edca-actions"><button type="button" onClick={()=>{setEditing({...a});setMessage('');}}>Edit</button><button type="button" onClick={()=>togglePublish(a)}>{a.published?'Unpublish':'Publish'}</button><button type="button" onClick={()=>remove(a)}>Delete</button></div></article>)}</section>
      <section className="edca-panel"><h3>Student Submissions ({courseSubmissions.length})</h3>{!courseSubmissions.length?<p>No submissions yet.</p>:[...courseSubmissions].sort((a,b)=>String(b.submittedAt).localeCompare(String(a.submittedAt))).map(s=>{
        const assignment=assignments.find(a=>a.id===s.assignmentId);return <article className="edca-item" key={s.id}><div><strong>{assignment?.title||s.assignmentTitle}</strong><p>Student: {s.studentEmail} · Submitted: {prettyDate(s.submittedAt)} {s.late?'· Late':''}</p><p>{s.answer||'File submission only'}</p>{s.fileId&&<button type="button" onClick={()=>getFile(s,setMessage)}>Download {s.fileName||'attachment'}</button>}<small>{s.gradedAt?`Graded: ${s.marks}/${assignment?.maxMarks||s.maxMarks} · ${s.feedback||'No feedback'}`:'Not graded'}</small></div><button type="button" onClick={()=>{setSelectedId(s.id);setMarks(s.marks??'');setFeedback(s.feedback||'');}}>Grade</button></article>;
      })}</section>
      {selectedSubmission&&<section className="edca-panel"><h3>Grade Submission</h3><p>{selectedSubmission.studentEmail} — {selectedSubmission.assignmentTitle}</p><label className="edca-label">Marks<input type="number" min="0" max={assignments.find(a=>a.id===selectedSubmission.assignmentId)?.maxMarks||selectedSubmission.maxMarks} value={marks} onChange={e=>setMarks(e.target.value)}/></label><label className="edca-label">Feedback<textarea rows="4" value={feedback} onChange={e=>setFeedback(e.target.value)}/></label><div className="edca-actions"><button type="button" className="edca-primary" onClick={grade}>Save Grade</button><button type="button" onClick={()=>setSelectedId('')}>Cancel</button></div></section>}
    </>}
    <p className="edca-note">Browser-local demo only. Submissions and grades are visible only in this browser; no real backend sync.</p></div>;
}
export default function CourseAssignments({role,email,courses=[],...props}){return role==='teacher'?<Teacher email={email} courses={courses}/>:<StudentCourseAssignments key={email} email={email} courses={courses} {...props}/>;}
