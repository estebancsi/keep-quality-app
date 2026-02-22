export type TestPhase = 'iq' | 'oq' | 'pq';

export interface TestProtocol {
  id: string;
  lifecycleProjectId: string;
  phase: TestPhase;
  customFieldValues?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export type TestPassFailStatus = 'pass' | 'fail' | 'n/a' | 'pending';

export interface TestVerification {
  id: string;
  testProtocolId: string;
  reference: string;
  objective?: string;
  acceptanceCriteria?: string;
  status?: TestPassFailStatus;
  traceUrsIds?: string[];
  traceFsCsIds?: string[];
  traceRiskIds?: string[];
  orderIndex?: number;
  testSteps?: TestStep[]; // Populated by application logic
  createdAt: string;
  updatedAt: string;
}

export interface TestStep {
  id: string;
  testVerificationId: string;
  stepNumber: string;
  action: string;
  dataToRecord: string;
  expectedResult: string;
  actualResult: string;
  status: TestPassFailStatus;
  orderIndex: number;
  createdAt?: string;
  updatedAt?: string;
}

// ─── DTOs (Database shape) ─────────────────────────────────

export interface TestProtocolDto {
  id: string;
  lifecycle_project_id: string;
  phase: string;
  custom_field_values: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface TestVerificationDto {
  id: string;
  test_protocol_id: string;
  reference: string;
  objective: string;
  acceptance_criteria: string;
  status: string;
  trace_urs_ids: string[];
  trace_fs_cs_ids: string[];
  trace_risk_ids: string[];
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface TestStepDto {
  id: string;
  test_verification_id: string;
  step_number: string;
  action: string;
  data_to_record: string;
  expected_result: string;
  actual_result: string;
  status: string;
  order_index: number;
  created_at: string;
  updated_at: string;
}
