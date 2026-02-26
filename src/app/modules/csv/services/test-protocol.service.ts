import { inject, Injectable } from '@angular/core';
import { SupabaseService } from '@/core/services/supabase.service';
import { catchError, defer, map, Observable, switchMap, throwError } from 'rxjs';
import { MessageService } from 'primeng/api';
import { OrganizationService } from '@/auth/organization.service';
import {
  TestProtocol,
  TestProtocolDto,
  TestPhase,
  TestVerification,
  TestVerificationDto,
  TestStep,
  TestStepDto,
  TestPassFailStatus,
} from '../test-protocol.interface';

@Injectable({
  providedIn: 'root',
})
export class TestProtocolService {
  private readonly supabase = inject(SupabaseService).client;
  private readonly messageService = inject(MessageService);
  private readonly orgService = inject(OrganizationService);

  // ─── Artifacts (Protocols) ──────────────────────────

  getOrCreateArtifact(lifecycleProjectId: string, phase: TestPhase): Observable<TestProtocol> {
    return defer(async () =>
      this.supabase
        .from('csv_test_protocols')
        .select('*')
        .eq('lifecycle_project_id', lifecycleProjectId)
        .eq('phase', phase)
        .maybeSingle(),
    ).pipe(
      switchMap(({ data, error }) => {
        if (error) throw error;
        if (data) return [this.protocolToDomain(data as TestProtocolDto)];

        const tenantId = this.orgService.activeOrganizationId();
        return defer(async () =>
          this.supabase
            .from('csv_test_protocols')
            .insert({
              tenant_id: tenantId,
              lifecycle_project_id: lifecycleProjectId,
              phase,
            })
            .select('*')
            .single(),
        ).pipe(
          map(({ data: created, error: insertError }) => {
            if (insertError) throw insertError;
            return this.protocolToDomain(created as TestProtocolDto);
          }),
        );
      }),
      catchError((error) => this.handleError(error, `Get/Create Test Protocol - ${phase}`)),
    );
  }

  updateArtifactCustomFields(
    protocolId: string,
    customFieldValues: Record<string, unknown>,
  ): Observable<TestProtocol> {
    return defer(async () =>
      this.supabase
        .from('csv_test_protocols')
        .update({ custom_field_values: customFieldValues })
        .eq('id', protocolId)
        .select('*')
        .single(),
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        this.messageService.add({
          severity: 'success',
          summary: 'Saved',
          detail: 'Test Protocol properties updated',
        });
        return this.protocolToDomain(data as TestProtocolDto);
      }),
      catchError((error) => this.handleError(error, 'Update Protocol Custom Fields')),
    );
  }

  // ─── Verifications (Test Cases/Scripts) ────────────

  loadVerifications(protocolId: string): Observable<TestVerification[]> {
    return defer(async () =>
      this.supabase
        .from('csv_test_verifications')
        .select('*')
        .eq('test_protocol_id', protocolId)
        .order('order_index', { ascending: true }),
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return (data as TestVerificationDto[]).map(this.verificationToDomain.bind(this));
      }),
      catchError((error) => this.handleError(error, 'Load Test Verifications')),
    );
  }

  saveVerification(
    verification: Partial<TestVerification>,
    protocolId: string,
  ): Observable<TestVerification> {
    // Determine max order if new
    return defer(async () => {
      let order = verification.orderIndex;
      if (order === undefined) {
        const { data } = await this.supabase
          .from('csv_test_verifications')
          .select('order_index')
          .eq('test_protocol_id', protocolId)
          .order('order_index', { ascending: false })
          .limit(1);
        order = data && data.length > 0 ? data[0].order_index + 1 : 0;
      }

      const payload = {
        test_protocol_id: protocolId,
        reference: verification.reference ?? '',
        objective: verification.objective ?? '',
        acceptance_criteria: verification.acceptanceCriteria ?? '',
        status: verification.status ?? 'pending',
        trace_urs_ids: verification.traceUrsIds ?? [],
        trace_fs_cs_ids: verification.traceFsCsIds ?? [],
        trace_risk_ids: verification.traceRiskIds ?? [],
        order_index: order,
        ...(this.orgService.activeOrganizationId() && {
          tenant_id: this.orgService.activeOrganizationId(),
        }),
      };

      let req;
      if (verification.id) {
        req = this.supabase
          .from('csv_test_verifications')
          .update(payload)
          .eq('id', verification.id)
          .select('*')
          .single();
      } else {
        req = this.supabase.from('csv_test_verifications').insert(payload).select('*').single();
      }
      return req;
    }).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return this.verificationToDomain(data as TestVerificationDto);
      }),
      catchError((error) => this.handleError(error, 'Save Test Verification')),
    );
  }

  deleteVerification(verificationId: string): Observable<void> {
    return defer(async () =>
      this.supabase.from('csv_test_verifications').delete().eq('id', verificationId),
    ).pipe(
      map(({ error }) => {
        if (error) throw error;
      }),
      catchError((error) => this.handleError(error, 'Delete Test Verification')),
    );
  }

  bulkSortVerifications(updates: { id: string; orderIndex: number }[]): Observable<void> {
    return defer(async () => {
      for (const update of updates) {
        await this.supabase
          .from('csv_test_verifications')
          .update({ order_index: update.orderIndex })
          .eq('id', update.id);
      }
    }).pipe(catchError((error) => this.handleError(error, 'Sort Verifications')));
  }

  // ─── Test Steps ──────────────────────────────────────

  loadTestSteps(verificationId: string): Observable<TestStep[]> {
    return defer(async () =>
      this.supabase
        .from('csv_test_steps')
        .select('*')
        .eq('test_verification_id', verificationId)
        .order('order_index', { ascending: true }),
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return (data as TestStepDto[]).map(this.stepToDomain.bind(this));
      }),
      catchError((error) => this.handleError(error, 'Load Test Steps')),
    );
  }

  saveTestStep(step: Partial<TestStep>, verificationId: string): Observable<TestStep> {
    return defer(async () => {
      let order = step.orderIndex;
      if (order === undefined) {
        const { data } = await this.supabase
          .from('csv_test_steps')
          .select('order_index')
          .eq('test_verification_id', verificationId)
          .order('order_index', { ascending: false })
          .limit(1);
        order = data && data.length > 0 ? data[0].order_index + 1 : 0;
      }

      const payload = {
        test_verification_id: verificationId,
        step_number: step.stepNumber ?? '1.0',
        action: step.action ?? '',
        data_to_record: step.dataToRecord ?? '',
        expected_result: step.expectedResult ?? '',
        actual_result: step.actualResult ?? '',
        status: step.status ?? 'pending',
        order_index: order,
        attachment_urls:
          step.attachmentUrls?.map((a) => ({
            object_name: a.objectName,
            public_url: a.publicUrl,
            expires_at: a.expiresAt,
          })) ?? null,
        ...(this.orgService.activeOrganizationId() && {
          tenant_id: this.orgService.activeOrganizationId(),
        }),
      };

      let req;
      if (step.id) {
        req = this.supabase
          .from('csv_test_steps')
          .update(payload)
          .eq('id', step.id)
          .select('*')
          .single();
      } else {
        req = this.supabase.from('csv_test_steps').insert(payload).select('*').single();
      }
      return req;
    }).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return this.stepToDomain(data as TestStepDto);
      }),
      catchError((error) => this.handleError(error, 'Save Test Step')),
    );
  }

  deleteTestStep(stepId: string): Observable<void> {
    return defer(async () => this.supabase.from('csv_test_steps').delete().eq('id', stepId)).pipe(
      map(({ error }) => {
        if (error) throw error;
      }),
      catchError((error) => this.handleError(error, 'Delete Test Step')),
    );
  }

  bulkSortTestSteps(updates: { id: string; orderIndex: number }[]): Observable<void> {
    return defer(async () => {
      for (const update of updates) {
        await this.supabase
          .from('csv_test_steps')
          .update({ order_index: update.orderIndex })
          .eq('id', update.id);
      }
    }).pipe(catchError((error) => this.handleError(error, 'Sort Test Steps')));
  }

  // ─── Mapping Functions ──────────────────────────────

  private protocolToDomain(dto: TestProtocolDto): TestProtocol {
    return {
      id: dto.id,
      lifecycleProjectId: dto.lifecycle_project_id,
      phase: dto.phase as TestPhase,
      customFieldValues: dto.custom_field_values,
      createdAt: dto.created_at,
      updatedAt: dto.updated_at,
    };
  }

  private verificationToDomain(dto: TestVerificationDto): TestVerification {
    return {
      id: dto.id,
      testProtocolId: dto.test_protocol_id,
      reference: dto.reference,
      objective: dto.objective,
      acceptanceCriteria: dto.acceptance_criteria,
      status: dto.status as TestPassFailStatus,
      traceUrsIds: dto.trace_urs_ids,
      traceFsCsIds: dto.trace_fs_cs_ids,
      traceRiskIds: dto.trace_risk_ids,
      orderIndex: dto.order_index,
      createdAt: dto.created_at,
      updatedAt: dto.updated_at,
    };
  }

  private stepToDomain(dto: TestStepDto): TestStep {
    return {
      id: dto.id,
      testVerificationId: dto.test_verification_id,
      stepNumber: dto.step_number,
      action: dto.action,
      dataToRecord: dto.data_to_record,
      expectedResult: dto.expected_result,
      actualResult: dto.actual_result,
      status: dto.status as TestPassFailStatus,
      orderIndex: dto.order_index,
      attachmentUrls:
        dto.attachment_urls?.map((a) => ({
          objectName: a.object_name,
          publicUrl: a.public_url,
          expiresAt: a.expires_at,
        })) ?? [],
      createdAt: dto.created_at,
      updatedAt: dto.updated_at,
    };
  }

  // ─── Error handling ─────────────────────────────────

  private handleError(error: unknown, summary: string): Observable<never> {
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
    console.error(`[${summary}]`, errorMessage);
    this.messageService.add({
      severity: 'error',
      summary: 'Error',
      detail: errorMessage,
    });
    return throwError(() => new Error(errorMessage));
  }
}
