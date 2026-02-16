export interface PageConfig {
  pageSize: string;
  orientation: 'portrait' | 'landscape';
  marginTop: number;
  marginRight: number;
  marginBottom: number;
  marginLeft: number;
}

export interface TemplateData {
  html: string;
  css: string;
  header: string;
  footer: string;
  options: PageConfig;
}

export interface PdfTemplate extends TemplateData {
  id?: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PdfTemplateDto {
  id?: string;
  name: string;
  data: TemplateData;
  created_at?: string;
  updated_at?: string;
  tenant_id?: string;
}
