import { supabase } from '../lib/supabase';

const DEFAULT_BUCKET = 'documents';

function buildPath(orgId: string, caseId: string, docType: string, filename: string): string {
  return `${orgId}/${caseId}/${docType}/${filename}`;
}

export async function uploadFile(
  file: File,
  orgId: string,
  caseId: string,
  docType: string,
  bucket: string = DEFAULT_BUCKET
): Promise<{ path: string; url: string }> {
  const timestamp = Date.now();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const filePath = buildPath(orgId, caseId, docType, `${timestamp}_${safeName}`);

  const { error } = await supabase.storage
    .from(bucket)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });
  if (error) throw error;

  const url = await getSignedUrl(filePath, bucket);
  return { path: filePath, url };
}

export async function getSignedUrl(path: string, bucket: string = DEFAULT_BUCKET, expiresIn: number = 3600): Promise<string> {
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn);
  if (error) throw error;
  return data.signedUrl;
}

export async function deleteFile(path: string, bucket: string = DEFAULT_BUCKET): Promise<void> {
  const { error } = await supabase.storage.from(bucket).remove([path]);
  if (error) throw error;
}

export async function listFiles(orgId: string, caseId: string, docType?: string, bucket: string = DEFAULT_BUCKET): Promise<string[]> {
  const prefix = docType ? `${orgId}/${caseId}/${docType}` : `${orgId}/${caseId}`;
  const { data, error } = await supabase.storage.from(bucket).list(prefix);
  if (error) throw error;
  return (data || []).map(f => `${prefix}/${f.name}`);
}
