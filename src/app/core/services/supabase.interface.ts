export interface SbPaginationParams {
  first: number;
  rows: number;
  sortField?: string;
  sortOrder?: number;
  filters?: {
    field: string;
    value: any;
    matchMode: string;
  }[];
  globalFilter?: string;
  globalFilterFields?: string[];
}

export interface SbPaginatedResponse<T> {
  data: T[];
  totalRecords: number;
}
