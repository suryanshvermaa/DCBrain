import { ApiError, getApiClient, type ApiErrorPayload } from '@/lib/api';

export interface DocumentOwner {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface ProjectDocument {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  category: string;
  status: 'QUEUED' | 'UPLOADED' | 'PROCESSING' | 'PROCESSED' | 'FAILED' | 'ARCHIVED';
  uploadedAt: string;
  processedAt: string | null;
  completedAt: string | null;
  owner: DocumentOwner;
  versions: Array<{
    id: string;
    version: number;
    filename: string;
    originalName: string;
    mimeType: string;
    size: number;
    createdAt: string;
  }>;
}

export interface DocumentListResponse {
  documents: ProjectDocument[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface DocumentListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  category?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

const api = getApiClient();

function normalizeUploadError(body: unknown): ApiErrorPayload {
  if (body && typeof body === 'object' && 'error' in body) {
    const error = (body as { error?: unknown }).error;
    if (error && typeof error === 'object') {
      const payload = error as { code?: unknown; message?: unknown };
      return {
        code: typeof payload.code === 'string' ? payload.code : undefined,
        message: typeof payload.message === 'string' ? payload.message : 'Upload failed',
      };
    }
  }

  return { message: 'Upload failed' };
}

export async function listDocuments(projectId: string, params: DocumentListParams = {}): Promise<DocumentListResponse> {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      searchParams.set(key, String(value));
    }
  });

  const suffix = searchParams.toString() ? `?${searchParams.toString()}` : '';
  return api.get<DocumentListResponse>(`/api/v1/projects/${projectId}/documents${suffix}`);
}

export async function getDocument(projectId: string, documentId: string): Promise<{ document: ProjectDocument }> {
  return api.get<{ document: ProjectDocument }>(`/api/v1/projects/${projectId}/documents/${documentId}`);
}

export async function getDownloadUrl(projectId: string, documentId: string): Promise<{ url: string; expiresInSeconds: number }> {
  return api.get<{ url: string; expiresInSeconds: number }>(`/api/v1/projects/${projectId}/documents/${documentId}/download-url`);
}

export async function deleteDocument(projectId: string, documentId: string): Promise<void> {
  await api.delete<void>(`/api/v1/projects/${projectId}/documents/${documentId}`);
}

export function uploadDocuments(
  projectId: string,
  files: File[],
  category: string,
  onProgress: (progress: number) => void
): Promise<{ documents: ProjectDocument[] }> {
  const formData = new FormData();
  files.forEach((file) => formData.append('files', file));
  if (category.trim()) {
    formData.append('category', category.trim());
  }

  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open('POST', `${api.getBaseUrl()}/api/v1/projects/${projectId}/documents/upload`);

    const token = api.getToken();
    if (token) {
      request.setRequestHeader('Authorization', `Bearer ${token}`);
    }

    request.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };

    request.onload = () => {
      const body = request.responseText ? JSON.parse(request.responseText) : null;
      if (request.status >= 200 && request.status < 300) {
        onProgress(100);
        resolve(body as { documents: ProjectDocument[] });
        return;
      }

      const error = normalizeUploadError(body);
      reject(new ApiError(error.message, request.status, error.code));
    };

    request.onerror = () => reject(new ApiError('Upload failed', 0));
    request.send(formData);
  });
}
