import { getApiClient } from '@/lib/api';

export interface Vendor {
  id: string;
  name: string;
  contactName: string | null;
  onTimeDeliveryRate: number;
  qualityRate: number;
  complianceRate: number;
  overallScore: number;
  items?: ProcurementItem[];
}

export interface ProcurementItem {
  id: string;
  poNumber: string | null;
  lineItem: string | null;
  material: string;
  description: string | null;
  quantity: number;
  unit: string | null;
  status: 'IDENTIFIED' | 'RFQ' | 'PO_ISSUED' | 'IN_FABRICATION' | 'SHIPPED' | 'RECEIVED' | 'INSTALLED';
  orderDate: string | null;
  promisedDate: string | null;
  requiredOnSiteDate: string | null;
  actualDeliveryDate: string | null;
  vendorId: string | null;
  vendor?: Vendor | null;
  projectId: string;
}

const api = getApiClient();

export async function importProcurement(projectId: string, file: File): Promise<{ importedCount: number }> {
  const formData = new FormData();
  formData.append('file', file);

  return api.postForm<{ importedCount: number }>(`/api/v1/projects/${projectId}/procurement/import`, formData);
}

export async function getProcurementItems(projectId: string): Promise<{ items: ProcurementItem[] }> {
  return api.get<{ items: ProcurementItem[] }>(`/api/v1/projects/${projectId}/procurement`);
}

export async function getVendors(projectId: string): Promise<{ vendors: Vendor[] }> {
  return api.get<{ vendors: Vendor[] }>(`/api/v1/projects/${projectId}/procurement/vendors`);
}
