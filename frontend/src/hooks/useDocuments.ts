'use client';

import { useCallback, useEffect, useState } from 'react';
import { ApiError } from '@/lib/api';
import * as documentsApi from '@/lib/api/documents';

export function useDocuments(projectId: string | null) {
  const [documents, setDocuments] = useState<documentsApi.ProjectDocument[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<documentsApi.ProjectDocument | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 20, total: 0, totalPages: 0 });

  const loadDocuments = useCallback(
    async (params: documentsApi.DocumentListParams = {}) => {
      if (!projectId) {
        setDocuments([]);
        setSelectedDocument(null);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const result = await documentsApi.listDocuments(projectId, params);
        setDocuments(result.documents);
        setPagination(result.pagination);
        setSelectedDocument((current) => result.documents.find((document) => document.id === current?.id) ?? result.documents[0] ?? null);
      } catch (requestError) {
        setError(requestError instanceof ApiError ? requestError.message : 'Unable to load documents');
      } finally {
        setLoading(false);
      }
    },
    [projectId]
  );

  useEffect(() => {
    void loadDocuments();
  }, [loadDocuments]);

  return {
    documents,
    selectedDocument,
    setSelectedDocument,
    loading,
    error,
    pagination,
    reload: loadDocuments,
  };
}
