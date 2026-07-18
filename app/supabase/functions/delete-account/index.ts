import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const url = Deno.env.get('SUPABASE_URL')!;
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const auth = req.headers.get('Authorization');
  if (!auth) return new Response(JSON.stringify({error:'Authentication required.'}),{status:401,headers:{...corsHeaders,'Content-Type':'application/json'}});
  const userClient = createClient(url, anonKey, { global:{headers:{Authorization:auth}}, auth:{persistSession:false} });
  const { data:{user} } = await userClient.auth.getUser();
  if (!user) return new Response(JSON.stringify({error:'Invalid session.'}),{status:401,headers:{...corsHeaders,'Content-Type':'application/json'}});
  const admin = createClient(url, serviceKey, { auth:{persistSession:false} });
  const { data: families } = await admin.from('families').select('id').eq('owner_user_id',user.id);
  const familyIds = (families||[]).map(f=>f.id);
  if (familyIds.length) {
    const { data: children } = await admin.from('children').select('id').in('family_id',familyIds);
    const childIds = (children||[]).map(c=>c.id);
    if (childIds.length) {
      const [{data:docs},{data:memories},{data:milestones}] = await Promise.all([
        admin.from('medical_documents').select('storage_path').in('child_id',childIds),
        admin.from('memory_events').select('media_paths').in('child_id',childIds),
        admin.from('milestone_observations').select('media_paths').in('child_id',childIds),
      ]);
      const documentPaths=(docs||[]).map(d=>d.storage_path).filter(Boolean);
      const mediaPaths=[...(memories||[]),...(milestones||[])].flatMap(x=>x.media_paths||[]).filter(Boolean);
      if(documentPaths.length) await admin.storage.from('medical-documents').remove(documentPaths);
      if(mediaPaths.length) await admin.storage.from('child-media').remove(mediaPaths);
    }
  }
  const { error } = await admin.auth.admin.deleteUser(user.id);
  return new Response(JSON.stringify(error?{error:error.message}:{deleted:true}),{status:error?500:200,headers:{...corsHeaders,'Content-Type':'application/json'}});
});
