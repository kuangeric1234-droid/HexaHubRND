-- Run this in Supabase SQL Editor
create table if not exists esign_requests (
  token text primary key,
  lease_id text not null,
  tenant_id text,
  status text default 'pending',
  signature_data text,
  signer_name text,
  signed_at timestamptz,
  created_at timestamptz default now()
);

alter table esign_requests enable row level security;
create policy "public all" on esign_requests for all to anon using (true) with check (true);
