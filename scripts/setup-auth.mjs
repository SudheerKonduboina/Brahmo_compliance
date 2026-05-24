import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import ws from 'ws';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read .env.local manually
const envPath = path.resolve(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    let val = match[2].trim();
    // Remove surrounding quotes if they exist
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
    env[match[1].trim()] = val;
  }
});

const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseKey = env['SUPABASE_SERVICE_ROLE_KEY'];

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

global.WebSocket = ws;

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const DEMO_USERS = [
  { email: 'partner@brahmo.ai', password: 'Partner123!', name: 'Sarah Chen', role: 'partner', oldId: 'u3000000-0000-0000-0000-000000000003' },
  { email: 'priya@brahmo.ai', password: 'Associate123!', name: 'Priya Singh', role: 'associate', oldId: 'u1000000-0000-0000-0000-000000000001' },
  { email: 'rahul@brahmo.ai', password: 'Associate123!', name: 'Rahul Patel', role: 'associate', oldId: 'u2000000-0000-0000-0000-000000000002' },
  { email: 'sonia@brahmo.ai', password: 'Associate123!', name: 'Sonia Rodriguez', role: 'associate', oldId: 'u4000000-0000-0000-0000-000000000004' }
];

async function setup() {
  console.log('Setting up demo users in Supabase Auth...');
  const idMap = {};

  for (const user of DEMO_USERS) {
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) {
      console.error('Failed to list users:', listError);
      process.exit(1);
    }
    const existing = users?.find(u => u.email === user.email);
    
    let userId;
    if (existing) {
      console.log(`Updating ${user.email}...`);
      const { data, error } = await supabase.auth.admin.updateUserById(existing.id, {
        password: user.password,
        app_metadata: { role: user.role }
      });
      if (error) { console.error('Error updating user:', error); process.exit(1); }
      userId = data.user.id;
    } else {
      console.log(`Creating ${user.email}...`);
      const { data, error } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
        app_metadata: { role: user.role }
      });
      if (error) { console.error('Error creating user:', error); process.exit(1); }
      userId = data.user.id;
    }
    idMap[user.oldId] = userId;
  }

  const seedPath = path.resolve(__dirname, '../supabase/seed.sql');
  let seedContent = fs.readFileSync(seedPath, 'utf8');
  for (const [oldId, newId] of Object.entries(idMap)) {
    seedContent = seedContent.replace(new RegExp(oldId, 'g'), newId);
  }
  fs.writeFileSync(seedPath, seedContent);
  console.log('✅ Updated seed.sql with real Auth UUIDs!');
}
setup().catch(console.error);
