import crypto from 'crypto';

const SUPABASE_URL         = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const BUCKET               = 'marketplace';

export async function getPresignedUploadUrl(fileExtension: string): Promise<{ uploadUrl: string; objectUrl: string; key: string }> {
  const key = `listings/${crypto.randomUUID()}.${fileExtension}`;

  const res = await fetch(
    `${SUPABASE_URL}/storage/v1/object/upload/sign/${BUCKET}/${key}`,
    {
      method:  'POST',
      headers: {
        Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
        apikey:         SUPABASE_SERVICE_KEY,
      },
    },
  );

  if (!res.ok) throw new Error(`Supabase Storage error: ${await res.text()}`);

  const data      = await res.json() as { url: string };
  const uploadUrl = `${SUPABASE_URL}/storage/v1${data.url}`;
  const objectUrl = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${key}`;

  return { uploadUrl, objectUrl, key };
}

export async function deleteStorageObject(key: string): Promise<void> {
  await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}`, {
    method:  'DELETE',
    headers: {
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      apikey:         SUPABASE_SERVICE_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ prefixes: [key] }),
  });
}
