export interface AttachmentCache {
  objectName: string;
  publicUrl: string; // The signed URL
  expiresAt: string; // ISO date string
}

export interface AttachmentCacheDto {
  object_name: string;
  public_url: string;
  expires_at: string;
}
