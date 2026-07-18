import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

const url = Deno.env.get('SUPABASE_URL')!;
const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const admin = createClient(url, serviceKey, { auth: { persistSession: false } });
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
const escapeHtml = (value: unknown) => String(value ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]!));
const hash = async (token: string) => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token)))).map(b => b.toString(16).padStart(2, '0')).join('');

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    if (req.method === 'POST') {
      const auth = req.headers.get('Authorization');
      if (!auth) return json({ error: 'Authentication required.' }, 401);
      const userClient = createClient(url, anonKey, { global: { headers: { Authorization: auth } }, auth: { persistSession: false } });
      const { data: { user } } = await userClient.auth.getUser();
      if (!user) return json({ error: 'Invalid session.' }, 401);
      const { childId, expiresHours = 24, permissions } = await req.json();
      const { data: child } = await userClient.from('children').select('id').eq('id', childId).single();
      if (!child) return json({ error: 'Child record not found or access denied.' }, 403);
      const token = `${crypto.randomUUID()}${crypto.randomUUID().replaceAll('-', '')}`;
      const expires = new Date(Date.now() + Math.min(Math.max(Number(expiresHours), 1), 168) * 3600000).toISOString();
      const { error } = await userClient.from('share_links').insert({ child_id: childId, token_hash: await hash(token), label: 'Doctor summary', expires_at: expires, permissions: permissions || undefined, created_by: user.id });
      if (error) return json({ error: error.message }, 400);
      return json({ url: `${url}/functions/v1/doctor-share?token=${encodeURIComponent(token)}`, expiresAt: expires });
    }

    const token = new URL(req.url).searchParams.get('token');
    if (!token) return json({ error: 'Missing secure token.' }, 400);
    const { data: link } = await admin.from('share_links').select('*').eq('token_hash', await hash(token)).single();
    if (!link || link.status !== 'active' || new Date(link.expires_at) <= new Date() || (link.max_views && link.view_count >= link.max_views)) return json({ error: 'This link is invalid, expired or revoked.' }, 410);
    const childId = link.child_id;
    const [child, growth, vaccines, milestones, screenings, visits] = await Promise.all([
      admin.from('children').select('full_name,date_of_birth,blood_group,allergies,medical_conditions,pediatrician_name').eq('id', childId).single(),
      admin.from('growth_measurements').select('measured_at,weight_kg,length_height_cm,head_circumference_cm,source').eq('child_id', childId).order('measured_at',{ascending:false}).limit(10),
      admin.from('vaccination_records').select('vaccine_name,dose_label,due_date,administered_on,status').eq('child_id', childId).order('due_date',{ascending:false}).limit(30),
      admin.from('milestone_observations').select('custom_title,category,status,observed_on,notes').eq('child_id', childId).order('observed_on',{ascending:false}).limit(20),
      admin.from('mchat_screenings').select('screening_date,raw_score,risk_band,observations').eq('child_id', childId).order('screening_date',{ascending:false}).limit(5),
      admin.from('doctor_visits').select('visit_at,clinician_name,reason,observations,diagnosis,plan').eq('child_id', childId).order('visit_at',{ascending:false}).limit(10),
    ]);
    await admin.from('share_links').update({ view_count: link.view_count + 1, last_viewed_at: new Date().toISOString() }).eq('id', link.id);
    const c = child.data || {};
    const rows = (title: string, values: Record<string, unknown>[]) => `<section><h2>${escapeHtml(title)}</h2>${values.length ? values.map(v=>`<article>${Object.entries(v).map(([k,val])=>`<div><b>${escapeHtml(k.replaceAll('_',' '))}</b><span>${escapeHtml(Array.isArray(val)?val.join(', '):val)}</span></div>`).join('')}</article>`).join('') : '<p>No records shared.</p>'}</section>`;
    const html = `<!doctype html><html><head><meta name="viewport" content="width=device-width"><title>Private child health summary</title><style>body{margin:0;background:#edf3ef;color:#263933;font:15px system-ui}main{max-width:780px;margin:auto;padding:24px}.hero,section{background:#fff;border:1px solid #d8e3dc;border-radius:16px;padding:20px;margin:12px 0}.hero{background:#315f52;color:#fff}h1{margin:0 0 6px}h2{font-size:17px}article{padding:10px 0;border-top:1px solid #e5ece8}article div{display:grid;grid-template-columns:150px 1fr;gap:10px;padding:3px 0}b{text-transform:capitalize;color:#52675f}small{opacity:.75}@media(max-width:520px){article div{grid-template-columns:1fr}}</style></head><body><main><div class="hero"><small>Time-limited, read-only summary</small><h1>${escapeHtml(c.full_name)}</h1><div>DOB ${escapeHtml(c.date_of_birth)} · Blood group ${escapeHtml(c.blood_group || 'not recorded')}</div></div>${rows('Key profile',[{allergies:c.allergies,medical_conditions:c.medical_conditions,pediatrician:c.pediatrician_name}])}${rows('Growth',growth.data||[])}${rows('Vaccinations',vaccines.data||[])}${rows('Milestones',milestones.data||[])}${rows('Screenings',screenings.data||[])}${rows('Doctor visits',visits.data||[])}<p><small>Parent-generated summary. Verify all information with the treating clinician. This link expires ${escapeHtml(link.expires_at)}.</small></p></main></body></html>`;
    return new Response(html, { headers: { 'Content-Type':'text/html; charset=utf-8', 'Cache-Control':'no-store', 'X-Frame-Options':'DENY', 'Referrer-Policy':'no-referrer' } });
  } catch (error) { return json({ error: error instanceof Error ? error.message : 'Unexpected error.' }, 500); }
});
