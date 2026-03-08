import { useState, useCallback } from 'react';
import * as storageService from '../services/storage.service';

interface UploadedFile {
  name: string;
  path: string;
  url: string;
  size: number;
  type: string;
}

export function useFileUpload(orgId: string, caseId: string, bucket?: string) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [error, setError] = useState<string | null>(null);

  const upload = useCallback(async (file: File, docType: string): Promise<UploadedFile> => {
    setUploading(true);
    setError(null);
    setProgress(10);
    try {
      const { path, url } = await storageService.uploadFile(file, orgId, caseId, docType, bucket);
      setProgress(100);
      const uploaded: UploadedFile = { name: file.name, path, url, size: file.size, type: file.type };
      setUploadedFiles(prev => [...prev, uploaded]);
      return uploaded;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setUploading(false);
      setProgress(0);
    }
  }, [orgId, caseId, bucket]);

  const uploadMultiple = useCallback(async (files: File[], docType: string): Promise<UploadedFile[]> => {
    setUploading(true);
    setError(null);
    const results: UploadedFile[] = [];
    try {
      for (let i = 0; i < files.length; i++) {
        setProgress(Math.round(((i) / files.length) * 100));
        const { path, url } = await storageService.uploadFile(files[i], orgId, caseId, docType, bucket);
        const uploaded: UploadedFile = { name: files[i].name, path, url, size: files[i].size, type: files[i].type };
        results.push(uploaded);
      }
      setUploadedFiles(prev => [...prev, ...results]);
      setProgress(100);
      return results;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setUploading(false);
      setProgress(0);
    }
  }, [orgId, caseId, bucket]);

  const remove = useCallback(async (path: string) => {
    await storageService.deleteFile(path, bucket);
    setUploadedFiles(prev => prev.filter(f => f.path !== path));
  }, [bucket]);

  return { uploading, progress, uploadedFiles, error, upload, uploadMultiple, remove };
}
