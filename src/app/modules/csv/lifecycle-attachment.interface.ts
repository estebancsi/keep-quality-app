export type AttachmentStatus = 'publishing' | 'published' | 'failed';

export interface LifecycleAttachment {
  id: string;
  lifecycleProjectId: string;
  name: string;
  objectName: string;
  status: AttachmentStatus;
  contentType: string;
  fileSize: number | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LifecycleAttachmentDto {
  id: string;
  tenant_id: string;
  lifecycle_project_id: string;
  name: string;
  object_name: string;
  status: string;
  content_type: string;
  file_size: number | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}
