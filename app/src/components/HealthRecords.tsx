import { useCallback, useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import {
  Activity, Baby, Bell, CalendarClock, Check, ChevronRight, ClipboardList, Download,
  FileHeart, FileUp, HeartPulse, Image, Loader2, LockKeyhole, LogOut, Plus, RefreshCw,
  Ruler, Share2, ShieldCheck, Stethoscope, Trash2, Users, X,
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import type { Session } from '@supabase/supabase-js';
import { isMchatLicensed, isSupabaseConfigured, privateFileUrl, safeFileName, supabase } from '../lib/supabase';
import { documentTypes, trackerTypes, type ChildProfile, type HealthRow } from '../types/health';

type Tab = 'overview' | 'profile' | 'trackers' | 'growth' | 'development' | 'clinical' | 'files' | 'timeline' | 'sharing';
type Notice = { kind: 'ok' | 'error'; text: string } | null;

const emptyChild = {
  full_name: '', date_of_birth: '', gender: '', blood_group: '', birth_weight_kg: '', birth_length_cm: '',
  gestational_age_weeks: '', premature: false, allergies: '', medical_conditions: '', pediatrician_name: '',
  pediatrician_phone: '', emergency_contact_name: '', emergency_contact_phone: '', father_height_cm: '', mother_height_cm: '',
};

const ageText = (dob: string) => {
  const days = Math.max(0, Math.floor((Date.now() - new Date(`${dob}T00:00:00`).getTime()) / 86400000));
  if (days < 60) return `${days} days`;
  const months = Math.floor(days / 30.4375);
  return months < 24 ? `${months} months` : `${Math.floor(months / 12)} years ${months % 12} months`;
};

const eventDate = (row: Record<string, unknown>) => String(row.event_at || row.measured_at || row.visit_at || row.event_date || row.document_date || row.screening_date || row.created_at || '');
const displayDate = (value: unknown) => value ? new Date(String(value)).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: String(value).includes('T') ? 'short' : undefined }) : '—';

function AuthPanel({ onSession }: { onSession: (session: Session) => void }) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!supabase) return;
    setBusy(true); setMessage('');
    const result = mode === 'signup'
      ? await supabase.auth.signUp({ email, password, options: { data: { full_name: name } } })
      : await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (result.error) return setMessage(result.error.message);
    if (result.data.session) onSession(result.data.session);
    else setMessage('Check your email to confirm your account, then sign in.');
  };

  return <div className="health-auth-wrap">
    <form className="health-auth card" onSubmit={submit}>
      <div className="health-auth-icon"><ShieldCheck /></div>
      <h2>{mode === 'signin' ? 'Open your family health record' : 'Create a private family account'}</h2>
      <p>Your child profiles, documents and tracking history are stored privately and protected by account access.</p>
      {mode === 'signup' && <label>Parent or caregiver name<input value={name} onChange={e => setName(e.target.value)} required /></label>}
      <label>Email address<input type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} required /></label>
      <label>Password<input type="password" minLength={8} autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} value={password} onChange={e => setPassword(e.target.value)} required /></label>
      {message && <div className="health-inline-message">{message}</div>}
      <button className="btn-primary health-wide" disabled={busy}>{busy ? <Loader2 className="spin" /> : <LockKeyhole />} {mode === 'signin' ? 'Sign in securely' : 'Create account'}</button>
      <button type="button" className="health-link" onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}>
        {mode === 'signin' ? 'New here? Create an account' : 'Already have an account? Sign in'}
      </button>
      <small>Not for emergencies. Call local emergency services or seek urgent medical care when needed.</small>
    </form>
  </div>;
}

export function HealthRecords() {
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [children, setChildren] = useState<ChildProfile[]>([]);
  const [childId, setChildId] = useState('');
  const [tab, setTab] = useState<Tab>('overview');
  const [rows, setRows] = useState<Record<string, HealthRow[]>>({});
  const [definitions, setDefinitions] = useState<HealthRow[]>([]);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);
  const child = children.find(item => item.id === childId) || null;

  useEffect(() => {
    if (!supabase) { setAuthReady(true); return; }
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setAuthReady(true); });
    const { data } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => data.subscription.unsubscribe();
  }, []);

  const loadChildren = useCallback(async () => {
    if (!supabase || !session) return;
    const { data, error } = await supabase.from('children').select('*').is('archived_at', null).order('created_at');
    if (error) return setNotice({ kind: 'error', text: error.message });
    const list = (data || []) as ChildProfile[];
    setChildren(list);
    setChildId(current => list.some(c => c.id === current) ? current : (list[0]?.id || ''));
  }, [session]);

  const loadRecords = useCallback(async () => {
    if (!supabase || !childId) return;
    setBusy(true);
    const specs = [
      ['growth', 'growth_measurements', 'measured_at'], ['trackers', 'tracker_entries', 'event_at'],
      ['milestones', 'milestone_observations', 'created_at'], ['screenings', 'mchat_screenings', 'screening_date'],
      ['vaccines', 'vaccination_records', 'due_date'], ['visits', 'doctor_visits', 'visit_at'],
      ['documents', 'medical_documents', 'document_date'], ['memories', 'memory_events', 'event_date'],
      ['reminders', 'reminders', 'due_at'], ['timeline', 'timeline_events', 'event_at'], ['shares', 'share_links', 'created_at'],
    ] as const;
    const results = await Promise.all(specs.map(async ([key, table, order]) => {
      const result = await supabase!.from(table).select('*').eq('child_id', childId).order(order, { ascending: false });
      return [key, result] as const;
    }));
    const next: Record<string, HealthRow[]> = {};
    for (const [key, result] of results) {
      if (result.error) setNotice({ kind: 'error', text: result.error.message });
      next[key] = (result.data || []) as HealthRow[];
    }
    const defs = await supabase.from('milestone_definitions').select('*').order('age_months').order('sort_order');
    setDefinitions((defs.data || []) as HealthRow[]);
    setRows(next); setBusy(false);
  }, [childId]);

  useEffect(() => { if (session) loadChildren(); }, [session, loadChildren]);
  useEffect(() => { if (childId) loadRecords(); }, [childId, loadRecords]);

  const save = async (table: string, payload: Record<string, unknown>, timeline?: { type: string; title: string; summary?: string }) => {
    if (!supabase || !session || !childId) return false;
    setBusy(true); setNotice(null);
    const { data, error } = await supabase.from(table).insert({ ...payload, child_id: childId, created_by: session.user.id }).select('id').single();
    if (error) { setBusy(false); setNotice({ kind: 'error', text: error.message }); return false; }
    if (timeline) await supabase.from('timeline_events').insert({ child_id: childId, created_by: session.user.id, event_at: payload.event_at || payload.measured_at || payload.visit_at || `${payload.event_date || payload.document_date || payload.screening_date || new Date().toISOString()}`, event_type: timeline.type, title: timeline.title, summary: timeline.summary || null, linked_table: table, linked_record_id: data.id });
    setNotice({ kind: 'ok', text: 'Saved to the private health record.' });
    await loadRecords(); setBusy(false); return true;
  };

  const remove = async (table: string, id: string, storage?: { bucket: string; path: string }) => {
    if (!supabase || !confirm('Delete this record permanently?')) return;
    setBusy(true);
    if (storage) await supabase.storage.from(storage.bucket).remove([storage.path]);
    const { error } = await supabase.from(table).delete().eq('id', id);
    setNotice(error ? { kind: 'error', text: error.message } : { kind: 'ok', text: 'Record deleted.' });
    await loadRecords(); setBusy(false);
  };

  if (!isSupabaseConfigured) return <div className="health-empty card"><LockKeyhole /><h2>Secure records are ready to connect</h2><p>The interface and database integration are installed. Add this project’s Supabase URL and publishable key to activate sign-in and private records.</p></div>;
  if (!authReady) return <div className="health-loading"><Loader2 className="spin" /> Opening secure records…</div>;
  if (!session) return <AuthPanel onSession={setSession} />;

  return <div className="health-shell fade-in-up">
    <header className="health-head">
      <div><span className="health-kicker">Private family health record</span><h1>My child’s care</h1></div>
      <div className="health-head-actions">
        {children.length > 0 && <select aria-label="Selected child" value={childId} onChange={e => setChildId(e.target.value)}>{children.map(c => <option key={c.id} value={c.id}>{c.full_name} · {ageText(c.date_of_birth)}</option>)}</select>}
        <button className="icon-btn" title="Refresh" onClick={() => { loadChildren(); loadRecords(); }}><RefreshCw size={17} /></button>
        <button className="icon-btn" title="Sign out" onClick={() => supabase?.auth.signOut()}><LogOut size={17} /></button>
      </div>
    </header>
    {notice && <div className={`health-notice ${notice.kind}`}><span>{notice.text}</span><button onClick={() => setNotice(null)}><X size={15} /></button></div>}
    {children.length === 0 ? <ChildForm session={session} onSaved={loadChildren} /> : <>
      <nav className="health-tabs" aria-label="Health record sections">
        {([
          ['overview','Overview',HeartPulse],['profile','Child',Baby],['trackers','Daily logs',ClipboardList],['growth','Growth',Ruler],
          ['development','Development',Activity],['clinical','Clinical',Stethoscope],['files','Files & memories',FileHeart],
          ['timeline','Timeline',CalendarClock],['sharing','Share & privacy',Share2],
        ] as const).map(([id,label,Icon]) => <button key={id} className={tab === id ? 'active' : ''} onClick={() => setTab(id)}><Icon size={17}/>{label}</button>)}
      </nav>
      {busy && <div className="health-sync"><Loader2 className="spin" size={15}/> Syncing securely…</div>}
      {tab === 'overview' && child && <Overview child={child} rows={rows} onOpen={setTab} />}
      {tab === 'profile' && child && <ChildForm session={session} child={child} onSaved={loadChildren} />}
      {tab === 'trackers' && <Trackers rows={rows.trackers || []} onSave={save} onDelete={remove} />}
      {tab === 'growth' && child && <Growth child={child} rows={rows.growth || []} onSave={save} onDelete={remove} />}
      {tab === 'development' && <Development definitions={definitions} milestones={rows.milestones || []} screenings={rows.screenings || []} onSave={save} onDelete={remove} />}
      {tab === 'clinical' && <Clinical vaccines={rows.vaccines || []} visits={rows.visits || []} reminders={rows.reminders || []} onSave={save} onDelete={remove} />}
      {tab === 'files' && <Files childId={childId} userId={session.user.id} documents={rows.documents || []} memories={rows.memories || []} onSave={save} onDelete={remove} />}
      {tab === 'timeline' && <HealthTimeline rows={rows} />}
      {tab === 'sharing' && child && <Sharing child={child} rows={rows} userId={session.user.id} onRefresh={loadRecords} onNotice={setNotice} />}
    </>}
  </div>;
}

function ChildForm({ session, child, onSaved }: { session: Session; child?: ChildProfile; onSaved: () => Promise<void> }) {
  const [form, setForm] = useState<Record<string, string | boolean>>(() => child ? {
    ...emptyChild, full_name: child.full_name, date_of_birth: child.date_of_birth, gender: child.gender || '', blood_group: child.blood_group || '', premature: child.premature,
    pediatrician_name: child.pediatrician_name || '', pediatrician_phone: child.pediatrician_phone || '', emergency_contact_name: child.emergency_contact_name || '', emergency_contact_phone: child.emergency_contact_phone || '', allergies: child.allergies?.join(', ') || '', medical_conditions: child.medical_conditions?.join(', ') || '',
    birth_weight_kg: child.birth_weight_kg?.toString() || '', birth_length_cm: child.birth_length_cm?.toString() || '', gestational_age_weeks: child.gestational_age_weeks?.toString() || '', father_height_cm: child.father_height_cm?.toString() || '', mother_height_cm: child.mother_height_cm?.toString() || '',
  } : emptyChild);
  const [busy, setBusy] = useState(false);
  const set = (key: string, value: string | boolean) => setForm(prev => ({ ...prev, [key]: value }));
  const submit = async (e: FormEvent) => {
    e.preventDefault(); if (!supabase) return; setBusy(true);
    const numeric = (key: string) => form[key] === '' ? null : Number(form[key]);
    const payload = { ...form, allergies: String(form.allergies).split(',').map(v=>v.trim()).filter(Boolean), medical_conditions: String(form.medical_conditions).split(',').map(v=>v.trim()).filter(Boolean), birth_weight_kg: numeric('birth_weight_kg'), birth_length_cm: numeric('birth_length_cm'), gestational_age_weeks: numeric('gestational_age_weeks'), father_height_cm: numeric('father_height_cm'), mother_height_cm: numeric('mother_height_cm') };
    if (child) await supabase.from('children').update(payload).eq('id', child.id);
    else {
      const membership = await supabase.from('family_members').select('family_id').eq('user_id', session.user.id).eq('status','active').limit(1).single();
      if (membership.data) await supabase.from('children').insert({ ...payload, family_id: membership.data.family_id, created_by: session.user.id });
    }
    setBusy(false); await onSaved();
  };
  return <form className="health-section card" onSubmit={submit}><SectionTitle icon={Baby} title={child ? 'Child profile' : 'Add your first child'} text="Keep key medical and emergency details together." />
    <div className="health-form-grid">
      <label>Child’s full name<input value={String(form.full_name)} onChange={e=>set('full_name',e.target.value)} required /></label>
      <label>Date of birth<input type="date" value={String(form.date_of_birth)} onChange={e=>set('date_of_birth',e.target.value)} required /></label>
      <label>Gender<input value={String(form.gender)} onChange={e=>set('gender',e.target.value)} /></label>
      <label>Blood group<input value={String(form.blood_group)} onChange={e=>set('blood_group',e.target.value)} placeholder="e.g. O+" /></label>
      <label>Birth weight (kg)<input type="number" step="0.001" value={String(form.birth_weight_kg)} onChange={e=>set('birth_weight_kg',e.target.value)} /></label>
      <label>Birth length (cm)<input type="number" step="0.1" value={String(form.birth_length_cm)} onChange={e=>set('birth_length_cm',e.target.value)} /></label>
      <label>Gestational age (weeks)<input type="number" step="0.1" value={String(form.gestational_age_weeks)} onChange={e=>set('gestational_age_weeks',e.target.value)} /></label>
      <label className="health-check"><input type="checkbox" checked={Boolean(form.premature)} onChange={e=>set('premature',e.target.checked)} /> Born premature</label>
      <label className="span-2">Known allergies, separated by commas<input value={String(form.allergies)} onChange={e=>set('allergies',e.target.value)} /></label>
      <label className="span-2">Medical conditions, separated by commas<input value={String(form.medical_conditions)} onChange={e=>set('medical_conditions',e.target.value)} /></label>
      <label>Pediatrician<input value={String(form.pediatrician_name)} onChange={e=>set('pediatrician_name',e.target.value)} /></label>
      <label>Pediatrician phone<input value={String(form.pediatrician_phone)} onChange={e=>set('pediatrician_phone',e.target.value)} /></label>
      <label>Emergency contact<input value={String(form.emergency_contact_name)} onChange={e=>set('emergency_contact_name',e.target.value)} /></label>
      <label>Emergency phone<input value={String(form.emergency_contact_phone)} onChange={e=>set('emergency_contact_phone',e.target.value)} /></label>
      <label>Father’s height (cm)<input type="number" step="0.1" value={String(form.father_height_cm)} onChange={e=>set('father_height_cm',e.target.value)} /></label>
      <label>Mother’s height (cm)<input type="number" step="0.1" value={String(form.mother_height_cm)} onChange={e=>set('mother_height_cm',e.target.value)} /></label>
    </div><button className="btn-primary" disabled={busy}>{busy ? <Loader2 className="spin"/> : <Check/>} Save child profile</button>
  </form>;
}

function Overview({ child, rows, onOpen }: { child: ChildProfile; rows: Record<string, HealthRow[]>; onOpen: (tab: Tab)=>void }) {
  const openReminders = (rows.reminders || []).filter(r => !r.completed_at && !r.dismissed_at);
  const latestGrowth = rows.growth?.[0];
  return <div className="health-section"><div className="health-hero card"><div><span>Today’s family view</span><h2>{child.full_name} is {ageText(child.date_of_birth)}</h2><p>{child.premature ? 'Prematurity is noted in the profile. ' : ''}{child.allergies?.length ? `Allergies: ${child.allergies.join(', ')}.` : 'No allergies recorded.'}</p></div><Baby size={54}/></div>
    <div className="health-stat-grid">
      <Stat icon={Bell} label="Upcoming" value={openReminders.length} text={openReminders[0] ? String(openReminders[0].title) : 'No open reminders'} onClick={()=>onOpen('clinical')}/>
      <Stat icon={Ruler} label="Latest growth" value={latestGrowth?.weight_kg ? `${latestGrowth.weight_kg} kg` : '—'} text={latestGrowth ? displayDate(latestGrowth.measured_at) : 'Add a measurement'} onClick={()=>onOpen('growth')}/>
      <Stat icon={Activity} label="Milestones" value={(rows.milestones || []).filter(r=>r.status==='achieved').length} text="Recorded as achieved" onClick={()=>onOpen('development')}/>
      <Stat icon={FileHeart} label="Documents" value={(rows.documents || []).length} text="Private files" onClick={()=>onOpen('files')}/>
    </div>
    <div className="health-two-col"><div className="card"><h3>Quick actions</h3>{[['Log feeding','trackers'],['Add growth','growth'],['Record vaccine','clinical'],['Upload report','files']] .map(([label,dest])=><button className="health-row-button" key={label} onClick={()=>onOpen(dest as Tab)}><span>{label}</span><ChevronRight/></button>)}</div>
      <div className="card"><h3>Care summary</h3><KeyValue k="Blood group" v={child.blood_group || 'Not recorded'}/><KeyValue k="Pediatrician" v={child.pediatrician_name || 'Not recorded'}/><KeyValue k="Emergency contact" v={child.emergency_contact_name || 'Not recorded'}/><KeyValue k="Records in timeline" v={String((rows.timeline || []).length)}/></div></div>
  </div>;
}

function Trackers({ rows, onSave, onDelete }: { rows: HealthRow[]; onSave: Function; onDelete: Function }) {
  const [type,setType]=useState('feeding'); const [date,setDate]=useState(new Date().toISOString().slice(0,16)); const [value,setValue]=useState(''); const [unit,setUnit]=useState(''); const [notes,setNotes]=useState('');
  const submit=async(e:FormEvent)=>{e.preventDefault();if(await onSave('tracker_entries',{tracker_type:type,event_at:new Date(date).toISOString(),title:trackerTypes.find(t=>t[0]===type)?.[1],value_number:value?Number(value):null,value_unit:unit||null,notes},{type,title:`${trackerTypes.find(t=>t[0]===type)?.[1]} logged`,summary:notes})){setValue('');setNotes('');}};
  return <div className="health-section"><form className="card" onSubmit={submit}><SectionTitle icon={ClipboardList} title="Daily care trackers" text="Choose only the logs useful to your family. Entries remain separate from clinician measurements."/><div className="health-form-grid"><label>Tracker<select value={type} onChange={e=>setType(e.target.value)}>{trackerTypes.map(t=><option key={t[0]} value={t[0]}>{t[1]}</option>)}</select></label><label>Date and time<input type="datetime-local" value={date} onChange={e=>setDate(e.target.value)} required/></label><label>Value<input type="number" step="any" value={value} onChange={e=>setValue(e.target.value)} placeholder="Optional"/></label><label>Unit<input value={unit} onChange={e=>setUnit(e.target.value)} placeholder="ml, min, °C…"/></label><label className="span-2">Notes<textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Colour, symptoms, medicine name, sleep quality…"/></label></div><button className="btn-primary"><Plus/> Add entry</button></form><RecordList rows={rows} titleKey="title" dateKey="event_at" detail={r=>[r.value_number,r.value_unit,r.notes].filter(Boolean).join(' ')} onDelete={r=>onDelete('tracker_entries',r.id)}/></div>;
}

function Growth({ child, rows, onSave, onDelete }: { child: ChildProfile; rows: HealthRow[]; onSave: Function; onDelete: Function }) {
  const [date,setDate]=useState(new Date().toISOString().slice(0,16)); const [weight,setWeight]=useState(''); const [height,setHeight]=useState(''); const [head,setHead]=useState(''); const [source,setSource]=useState('parent');
  const midParent = child.father_height_cm && child.mother_height_cm ? { boy:(child.father_height_cm+child.mother_height_cm+13)/2, girl:(child.father_height_cm+child.mother_height_cm-13)/2 } : null;
  const submit=async(e:FormEvent)=>{e.preventDefault();if(await onSave('growth_measurements',{measured_at:new Date(date).toISOString(),weight_kg:weight?Number(weight):null,length_height_cm:height?Number(height):null,head_circumference_cm:head?Number(head):null,source},{type:'growth',title:'Growth measurement added',summary:`${weight||'—'} kg · ${height||'—'} cm`})) {setWeight('');setHeight('');setHead('');}};
  return <div className="health-section"><form className="card" onSubmit={submit}><SectionTitle icon={Ruler} title="Growth record" text="Parent-entered and clinician measurements are labelled separately. Percentiles should use validated WHO/IAP charts and clinician interpretation."/><div className="health-form-grid"><label>Measured at<input type="datetime-local" value={date} onChange={e=>setDate(e.target.value)} required/></label><label>Source<select value={source} onChange={e=>setSource(e.target.value)}><option value="parent">Parent</option><option value="doctor">Medical professional</option></select></label><label>Weight (kg)<input type="number" step="0.001" value={weight} onChange={e=>setWeight(e.target.value)}/></label><label>Length/height (cm)<input type="number" step="0.1" value={height} onChange={e=>setHeight(e.target.value)}/></label><label>Head circumference (cm)<input type="number" step="0.1" value={head} onChange={e=>setHead(e.target.value)}/></label></div><button className="btn-primary"><Plus/> Save measurement</button></form>
    {midParent && <div className="card health-calm"><h3>Mid-parental height estimate</h3><p>Boy: about {midParent.boy.toFixed(1)} cm · Girl: about {midParent.girl.toFixed(1)} cm. This is a rough clinical estimate of adult target height, usually considered with a range of about ±8.5 cm; it is not a prediction or growth diagnosis.</p></div>}
    <GrowthPlot rows={rows} />
    <RecordList rows={rows} title={r=>`${r.weight_kg||'—'} kg · ${r.length_height_cm||'—'} cm`} dateKey="measured_at" detail={r=>`${r.head_circumference_cm ? `Head ${r.head_circumference_cm} cm · `:''}${r.source==='doctor'?'Medical professional':'Parent entry'}`} onDelete={r=>onDelete('growth_measurements',r.id)}/></div>;
}

function GrowthPlot({rows}:{rows:HealthRow[]}) {
  const ordered=[...rows].reverse().filter(r=>r.weight_kg||r.length_height_cm);
  if(ordered.length<2)return <div className="card health-calm"><h3>Growth chart</h3><p>Add at least two measurements to see a personal trend. A trend line is not a percentile chart and does not diagnose growth problems.</p></div>;
  const points=(key:string)=>ordered.map((r,i)=>({x:30+(i*Math.max(1,300/(ordered.length-1))),v:Number(r[key]||0)})).filter(p=>p.v>0);
  const line=(key:string,min:number,max:number)=>points(key).map(p=>`${p.x},${165-((p.v-min)/Math.max(1,max-min))*125}`).join(' ');
  const weights=points('weight_kg').map(p=>p.v), heights=points('length_height_cm').map(p=>p.v);
  return <div className="card"><h3>Personal measurement trend</h3><svg className="health-growth-plot" viewBox="0 0 360 190" role="img" aria-label="Personal weight and height trend"><line x1="30" y1="165" x2="340" y2="165"/><line x1="30" y1="25" x2="30" y2="165"/>{weights.length>1&&<polyline className="weight" points={line('weight_kg',Math.min(...weights),Math.max(...weights))}/>} {heights.length>1&&<polyline className="height" points={line('length_height_cm',Math.min(...heights),Math.max(...heights))}/>}<text x="35" y="183">Oldest</text><text x="300" y="183">Latest</text></svg><div className="health-chart-legend"><span className="weight">Weight</span><span className="height">Length/height</span></div><small>Personal trend only. Ask your clinician to plot measurements on the appropriate WHO/IAP chart.</small></div>;
}

function Development({ definitions, milestones, screenings, onSave, onDelete }: { definitions:HealthRow[]; milestones:HealthRow[]; screenings:HealthRow[]; onSave:Function; onDelete:Function }) {
  const [definition,setDefinition]=useState(''); const [status,setStatus]=useState('emerging'); const [date,setDate]=useState(new Date().toISOString().slice(0,10)); const [notes,setNotes]=useState('');
  const [score,setScore]=useState(''); const [observations,setObservations]=useState('');
  const chosen=definitions.find(d=>d.id===definition);
  const addMilestone=async(e:FormEvent)=>{e.preventDefault();if(!chosen)return;if(await onSave('milestone_observations',{definition_id:chosen.id,category:chosen.category,status,observed_on:date,notes},{type:'milestone',title:String(chosen.title),summary:`${status}${notes?` · ${notes}`:''}`})){setNotes('');}};
  const saveScreen=async(e:FormEvent)=>{e.preventDefault();const n=Number(score);const band=n<=2?'low':n<=7?'moderate':'high';if(await onSave('mchat_screenings',{status:'completed',raw_score:n,risk_band:band,screening_date:new Date().toISOString().slice(0,10),observations,completed_at:new Date().toISOString(),disclaimer_accepted_at:new Date().toISOString()},{type:'screening',title:'M-CHAT-R/F result recorded',summary:`${band} likelihood band; score ${n}`})){setScore('');setObservations('');}};
  return <div className="health-section"><form className="card" onSubmit={addMilestone}><SectionTitle icon={Activity} title="Development and milestones" text="Record what you see across movement, language, social and cognitive development. This supports—not replaces—developmental screening."/><div className="health-form-grid"><label className="span-2">Milestone<select value={definition} onChange={e=>setDefinition(e.target.value)} required><option value="">Select age and milestone</option>{definitions.map(d=><option key={d.id} value={d.id}>{String(d.age_months)} months · {String(d.category)} · {String(d.title)}</option>)}</select></label><label>Status<select value={status} onChange={e=>setStatus(e.target.value)}><option value="not_observed">Not observed</option><option value="emerging">Emerging</option><option value="achieved">Achieved</option><option value="concern">Concern</option></select></label><label>Observed on<input type="date" value={date} onChange={e=>setDate(e.target.value)}/></label><label className="span-2">Notes<textarea value={notes} onChange={e=>setNotes(e.target.value)}/></label></div><button className="btn-primary"><Plus/> Save observation</button></form>
    <RecordList rows={milestones} title={r=>String(definitions.find(d=>d.id===r.definition_id)?.title||r.custom_title||'Milestone')} dateKey="observed_on" detail={r=>`${r.status} · ${r.notes||'No notes'}`} onDelete={r=>onDelete('milestone_observations',r.id)}/>
    <form className="card" onSubmit={saveScreen}><SectionTitle icon={ClipboardList} title="M-CHAT-R/F screening record" text="For children 16–30 months. This is a screening tool, not a diagnosis."/>
      {!isMchatLicensed && <div className="health-license"><LockKeyhole/><div><strong>Questionnaire permission required</strong><p>The publisher requires a licence before questions may be reproduced in an app. Complete the official tool with your clinician or at the official source, then securely record the total here.</p><a href="https://www.mchatscreen.com/mchat-rf/" target="_blank" rel="noreferrer">Open official M-CHAT-R/F source</a></div></div>}
      <div className="health-form-grid"><label>Total score (0–20)<input type="number" min="0" max="20" value={score} onChange={e=>setScore(e.target.value)} required/></label><label className="span-2">Parent observations<textarea value={observations} onChange={e=>setObservations(e.target.value)}/></label></div><div className="health-warning">A result must be interpreted with the official scoring and follow-up process. Discuss concerns, regression, or a positive screen with your child’s clinician.</div><button className="btn-primary"><Check/> Save screening result</button></form>
    <RecordList rows={screenings} title={r=>`M-CHAT-R/F · ${r.risk_band || 'in progress'} likelihood`} dateKey="screening_date" detail={r=>`Score ${r.raw_score ?? '—'} · ${r.observations||'No observations'}`} onDelete={r=>onDelete('mchat_screenings',r.id)}/></div>;
}

function Clinical({ vaccines, visits, reminders, onSave, onDelete }: { vaccines:HealthRow[]; visits:HealthRow[]; reminders:HealthRow[]; onSave:Function; onDelete:Function }) {
  const [mode,setMode]=useState<'vaccine'|'visit'|'reminder'>('vaccine'); const [form,setForm]=useState<Record<string,string>>({date:new Date().toISOString().slice(0,10),name:'',notes:'',extra:''});
  const submit=async(e:FormEvent)=>{e.preventDefault();let ok=false;if(mode==='vaccine')ok=await onSave('vaccination_records',{vaccine_name:form.name,due_date:form.date,status:form.extra?'given':'due',administered_on:form.extra||null,notes:form.notes},{type:'vaccine',title:`Vaccine: ${form.name}`,summary:form.extra?`Given ${form.extra}`:`Due ${form.date}`});if(mode==='visit')ok=await onSave('doctor_visits',{visit_at:new Date(`${form.date}T09:00`).toISOString(),reason:form.name,clinician_name:form.extra||null,observations:form.notes},{type:'visit',title:`Doctor visit: ${form.name}`,summary:form.notes});if(mode==='reminder')ok=await onSave('reminders',{reminder_type:'care',title:form.name,due_at:new Date(`${form.date}T09:00`).toISOString()},{type:'reminder',title:form.name});if(ok)setForm({...form,name:'',notes:'',extra:''});};
  return <div className="health-section"><form className="card" onSubmit={submit}><SectionTitle icon={Stethoscope} title="Vaccines, visits and reminders" text="Keep due dates, administered details and clinical visits together."/><div className="health-segment">{(['vaccine','visit','reminder'] as const).map(m=><button type="button" className={mode===m?'active':''} onClick={()=>setMode(m)} key={m}>{m}</button>)}</div><div className="health-form-grid"><label>{mode==='vaccine'?'Vaccine name':mode==='visit'?'Reason for visit':'Reminder title'}<input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required/></label><label>{mode==='vaccine'?'Due date':'Date'}<input type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})} required/></label>{mode!=='reminder'&&<><label>{mode==='vaccine'?'Given on (optional)':'Clinician'}<input type={mode==='vaccine'?'date':'text'} value={form.extra} onChange={e=>setForm({...form,extra:e.target.value})}/></label><label className="span-2">Notes<textarea value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})}/></label></>}</div><button className="btn-primary"><Plus/> Save {mode}</button></form>
    <RecordList rows={[...vaccines,...visits,...reminders].sort((a,b)=>eventDate(b).localeCompare(eventDate(a)))} title={r=>String(r.vaccine_name||r.reason||r.title)} date={r=>displayDate(r.due_date||r.visit_at||r.due_at)} detail={r=>String(r.notes||r.observations||r.status||r.reminder_type||'')} onDelete={r=>onDelete(r.vaccine_name?'vaccination_records':r.reason?'doctor_visits':'reminders',r.id)}/></div>;
}

function Files({ childId,userId,documents,memories,onSave,onDelete }: { childId:string;userId:string;documents:HealthRow[];memories:HealthRow[];onSave:Function;onDelete:Function }) {
  const [kind,setKind]=useState<'document'|'memory'>('document'); const [file,setFile]=useState<File|null>(null); const [title,setTitle]=useState(''); const [date,setDate]=useState(new Date().toISOString().slice(0,10)); const [category,setCategory]=useState('Other'); const [notes,setNotes]=useState(''); const [progress,setProgress]=useState(0);
  const upload=async(e:FormEvent)=>{e.preventDefault();if(!supabase||!file)return;const allowed=kind==='document'?['application/pdf','image/jpeg','image/png','image/heic','image/heif']:['image/jpeg','image/png','image/heic','image/heif','video/mp4','video/quicktime'];if(!allowed.includes(file.type))return alert('This file type is not supported.');const max=kind==='document'?25:50;if(file.size>max*1024*1024)return alert(`Maximum file size is ${max} MB.`);setProgress(20);const bucket=kind==='document'?'medical-documents':'child-media';const path=`${childId}/${userId}/${crypto.randomUUID()}-${safeFileName(file.name)}`;const result=await supabase.storage.from(bucket).upload(path,file,{contentType:file.type,upsert:false});if(result.error){setProgress(0);return alert(result.error.message);}setProgress(75);const ok=kind==='document'?await onSave('medical_documents',{storage_path:path,file_name:file.name,mime_type:file.type,size_bytes:file.size,category,document_date:date,title:title||file.name,notes},{type:'document',title:title||file.name,summary:category}):await onSave('memory_events',{event_date:date,category,title:title||'Family memory',caption:notes,media_paths:[path]},{type:'memory',title:title||'Family memory',summary:notes});setProgress(ok?100:0);setFile(null);setTitle('');setNotes('');setTimeout(()=>setProgress(0),700);};
  const open=async(bucket:string,path:string)=>window.open(await privateFileUrl(bucket,path),'_blank','noopener,noreferrer');
  return <div className="health-section"><form className="card" onSubmit={upload}><SectionTitle icon={FileUp} title="Private files and memories" text="Medical files and family media use separate private storage. Signed preview links expire automatically."/><div className="health-segment"><button type="button" className={kind==='document'?'active':''} onClick={()=>setKind('document')}>Medical document</button><button type="button" className={kind==='memory'?'active':''} onClick={()=>setKind('memory')}>Photo or video memory</button></div><div className="health-form-grid"><label>Title<input value={title} onChange={e=>setTitle(e.target.value)} /></label><label>Date<input type="date" value={date} onChange={e=>setDate(e.target.value)} required/></label><label>Category{kind==='document'?<select value={category} onChange={e=>setCategory(e.target.value)}>{documentTypes.map(t=><option key={t}>{t}</option>)}</select>:<input value={category} onChange={e=>setCategory(e.target.value)}/>}</label><label className="span-2">Notes or caption<textarea value={notes} onChange={e=>setNotes(e.target.value)}/></label><label className="span-2 health-file">Choose {kind==='document'?'PDF or image':'photo or video'}<input type="file" accept={kind==='document'?'.pdf,.jpg,.jpeg,.png,.heic,.heif':'image/*,video/mp4,video/quicktime'} onChange={e=>setFile(e.target.files?.[0]||null)} required/><span>{file?.name||'No file selected'}</span></label></div>{progress>0&&<div className="health-progress"><span style={{width:`${progress}%`}}/></div>}<button className="btn-primary"><FileUp/> Upload privately</button></form>
    <div className="health-gallery">{memories.map(r=><article className="card" key={r.id}><Image/><div><strong>{String(r.title)}</strong><small>{displayDate(r.event_date)} · {String(r.category)}</small><p>{String(r.caption||'')}</p></div><button className="health-link" onClick={()=>open('child-media',String((r.media_paths as string[])?.[0]))}>Preview</button><button className="icon-btn" onClick={()=>onDelete('memory_events',r.id,{bucket:'child-media',path:String((r.media_paths as string[])?.[0])})}><Trash2/></button></article>)}</div>
    <RecordList rows={documents} titleKey="title" dateKey="document_date" detail={r=>`${r.category} · ${r.file_name}`} action={(r)=><button className="health-link" onClick={()=>open('medical-documents',String(r.storage_path))}>Preview / download</button>} onDelete={r=>onDelete('medical_documents',r.id,{bucket:'medical-documents',path:String(r.storage_path)})}/></div>;
}

function HealthTimeline({ rows }: { rows:Record<string,HealthRow[]> }) {
  const [filter,setFilter]=useState('all');const all=useMemo(()=>(Object.entries(rows).filter(([k])=>!['timeline','shares'].includes(k)).flatMap(([type,list])=>list.map(r=>({...r,_type:type,_date:eventDate(r)}))) as Array<HealthRow & {_type:string;_date:string}>).sort((a,b)=>b._date.localeCompare(a._date)),[rows]);const shown=filter==='all'?all:all.filter(r=>r._type===filter);
  return <div className="health-section card"><SectionTitle icon={CalendarClock} title="Unified health timeline" text="Every record is sorted by the event date, not the upload date."/><label className="health-filter">Show<select value={filter} onChange={e=>setFilter(e.target.value)}><option value="all">Everything</option>{['growth','trackers','milestones','screenings','vaccines','visits','documents','memories','reminders'].map(x=><option key={x} value={x}>{x}</option>)}</select></label><div className="timeline-list">{shown.length===0?<Empty/>:shown.map(r=><div className="timeline-item" key={`${r._type}-${r.id}`}><span/><div><small>{displayDate(r._date)} · {r._type}</small><strong>{String(r.title||r.vaccine_name||r.reason||r.tracker_type||r.file_name||'Health record')}</strong><p>{String(r.notes||r.summary||r.observations||'')}</p></div></div>)}</div></div>;
}

function Sharing({ child, rows, userId, onRefresh, onNotice }: { child:ChildProfile;rows:Record<string,HealthRow[]>;userId:string;onRefresh:()=>Promise<void>;onNotice:(n:Notice)=>void }) {
  const [expiry,setExpiry]=useState('24'); const [inviteEmail,setInviteEmail]=useState(''); const [inviteRole,setInviteRole]=useState('caregiver'); const [members,setMembers]=useState<HealthRow[]>([]);
  const loadMembers=useCallback(async()=>{if(!supabase)return;const {data}=await supabase.from('family_members').select('*').eq('family_id',child.family_id).order('created_at');setMembers((data||[]) as HealthRow[]);},[child.family_id]);
  useEffect(()=>{loadMembers();},[loadMembers]);
  const exportPdf=()=>{const pdf=new jsPDF();pdf.setFontSize(18);pdf.text(`${child.full_name} — Health summary`,15,18);pdf.setFontSize(10);let y=28;const line=(label:string,value:string)=>{pdf.setFont('helvetica','bold');pdf.text(label,15,y);pdf.setFont('helvetica','normal');pdf.text(value.slice(0,120),55,y);y+=7;if(y>280){pdf.addPage();y=18;}};line('DOB',child.date_of_birth);line('Age',ageText(child.date_of_birth));line('Blood group',child.blood_group||'Not recorded');line('Allergies',child.allergies?.join(', ')||'None recorded');line('Conditions',child.medical_conditions?.join(', ')||'None recorded');line('Pediatrician',child.pediatrician_name||'Not recorded');for(const r of rows.growth?.slice(0,5)||[])line('Growth',`${displayDate(r.measured_at)} — ${r.weight_kg||'—'} kg, ${r.length_height_cm||'—'} cm`);for(const r of rows.vaccines?.slice(0,12)||[])line('Vaccine',`${r.vaccine_name} — ${r.status} ${r.administered_on||r.due_date||''}`);pdf.setFontSize(8);pdf.text('Parent-generated summary. Verify all medical information with the treating clinician.',15,290);pdf.save(`${safeFileName(child.full_name)}-health-summary.pdf`);};
  const createLink=async()=>{if(!supabase)return;const {data,error}=await supabase.functions.invoke('doctor-share',{body:{childId:child.id,expiresHours:Number(expiry)}});if(error)return onNotice({kind:'error',text:error.message});await navigator.clipboard.writeText(data.url);onNotice({kind:'ok',text:'Secure link copied. It will expire automatically.'});await onRefresh();};
  const revoke=async(id:string)=>{if(!supabase)return;await supabase.from('share_links').update({status:'revoked',revoked_at:new Date().toISOString()}).eq('id',id).eq('created_by',userId);await onRefresh();};
  const invite=async(e:FormEvent)=>{e.preventDefault();if(!supabase)return;const {error}=await supabase.from('family_members').insert({family_id:child.family_id,invited_email:inviteEmail,role:inviteRole,status:'invited',invited_by:userId});if(error)return onNotice({kind:'error',text:error.message});setInviteEmail('');onNotice({kind:'ok',text:'Family access invitation saved. It activates when that email creates an account.'});await loadMembers();};
  const removeMember=async(id:string)=>{if(!supabase||!confirm('Remove this person’s family access?'))return;const {error}=await supabase.from('family_members').delete().eq('id',id);onNotice(error?{kind:'error',text:error.message}:{kind:'ok',text:'Family access removed.'});await loadMembers();};
  const deleteAccount=async()=>{if(!confirm('Permanently delete your account and all family data? This cannot be undone.'))return;const {error}=await supabase!.functions.invoke('delete-account');onNotice(error?{kind:'error',text:error.message}:{kind:'ok',text:'Account deletion started.'});};
  return <div className="health-section"><div className="card"><SectionTitle icon={Share2} title="Doctor sharing" text="Create a limited-time, read-only summary link. You remain in control and can revoke it early."/><div className="health-form-grid"><label>Link expires after<select value={expiry} onChange={e=>setExpiry(e.target.value)}><option value="1">1 hour</option><option value="24">24 hours</option><option value="72">3 days</option><option value="168">7 days</option></select></label></div><div className="health-actions"><button className="btn-primary" onClick={createLink}><Share2/> Create secure link</button><button className="btn-secondary" onClick={exportPdf}><Download/> Export doctor PDF</button></div>{(rows.shares||[]).map(r=><div className="health-share-row" key={r.id}><div><strong>{String(r.label||'Doctor summary')}</strong><small>{String(r.status)} · expires {displayDate(r.expires_at)} · {String(r.view_count||0)} views</small></div>{String(r.status)==='active'&&<button className="health-link danger" onClick={()=>revoke(r.id)}>Revoke</button>}</div>)}</div>
    <form className="card" onSubmit={invite}><SectionTitle icon={Users} title="Family and clinician access" text="Parents can grant a caregiver write access or a doctor read-only access. Access can be removed at any time."/><div className="health-form-grid"><label>Email address<input type="email" value={inviteEmail} onChange={e=>setInviteEmail(e.target.value)} required/></label><label>Role<select value={inviteRole} onChange={e=>setInviteRole(e.target.value)}><option value="caregiver">Caregiver</option><option value="doctor">Doctor (read-only)</option></select></label></div><button className="btn-primary"><Users/> Add access invitation</button>{members.map(m=><div className="health-share-row" key={m.id}><div><strong>{String(m.invited_email||'Registered family member')}</strong><small>{String(m.role)} · {String(m.status)}</small></div>{String(m.role)!=='parent'&&<button type="button" className="health-link danger" onClick={()=>removeMember(m.id)}>Remove</button>}</div>)}</form>
    <div className="card"><SectionTitle icon={ShieldCheck} title="Privacy and data control" text="Records are private by default. Access is checked for every database row and storage object."/><ul className="health-security-list"><li><LockKeyhole/>Encrypted transfer and private cloud storage</li><li><Users/>Parent, caregiver and doctor roles</li><li><ClipboardList/>Change history for sensitive records</li><li><ShieldCheck/>No advertising use and no OCR processing</li></ul><button className="btn-secondary danger" onClick={deleteAccount}><Trash2/> Delete my account and family data</button></div></div>;
}

function SectionTitle({icon:Icon,title,text}:{icon:typeof Baby;title:string;text:string}){return <div className="health-title"><div><Icon/></div><span><h2>{title}</h2><p>{text}</p></span></div>}
function Stat({icon:Icon,label,value,text,onClick}:{icon:typeof Baby;label:string;value:string|number;text:string;onClick:()=>void}){return <button className="health-stat card" onClick={onClick}><Icon/><span>{label}</span><strong>{value}</strong><small>{text}</small></button>}
function KeyValue({k,v}:{k:string;v:string}){return <div className="health-key-value"><span>{k}</span><strong>{v}</strong></div>}
function Empty(){return <div className="health-empty-inline"><FileHeart/><p>No records here yet.</p></div>}
function RecordList({rows,title,titleKey,date,dateKey,detail,action,onDelete}:{rows:HealthRow[];title?:(r:HealthRow)=>string;titleKey?:string;date?:(r:HealthRow)=>string;dateKey?:string;detail:(r:HealthRow)=>string;action?:(r:HealthRow)=>React.ReactNode;onDelete:(r:HealthRow)=>void}){return <div className="card health-record-list"><h3>Saved history</h3>{rows.length===0?<Empty/>:rows.map(r=><article key={r.id}><div><small>{date?date(r):displayDate(dateKey?r[dateKey]:r.created_at)}</small><strong>{title?title(r):String(r[titleKey||'title']||'Record')}</strong><p>{detail(r)}</p></div>{action?.(r)}<button className="icon-btn" title="Delete" onClick={()=>onDelete(r)}><Trash2 size={16}/></button></article>)}</div>}
