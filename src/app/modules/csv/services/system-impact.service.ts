import { inject, Injectable } from '@angular/core';
import { SupabaseService } from '@/core/services/supabase.service';
import { catchError, defer, map, Observable, throwError } from 'rxjs';
import { MessageService } from 'primeng/api';
import { OrganizationService } from '@/auth/organization.service';
import {
  SystemImpactAnswer,
  SystemImpactArtifact,
  SystemImpactArtifactDto,
  SystemImpactQuestion,
} from '../system-impact.interface';

@Injectable({
  providedIn: 'root',
})
export class SystemImpactService {
  private readonly supabase = inject(SupabaseService).client;
  private readonly messageService = inject(MessageService);
  private readonly orgService = inject(OrganizationService);

  // ─── Artifact ────────────────────────────────────────────

  /**
   * Fetch an existing System Impact artifact for the given lifecycle project.
   * Returns null if the artifact hasn't been created yet.
   */
  getArtifact(lifecycleProjectId: string): Observable<SystemImpactArtifact | null> {
    return defer(async () =>
      this.supabase
        .from('csv_system_impact_artifacts')
        .select('*')
        .eq('lifecycle_project_id', lifecycleProjectId)
        .maybeSingle(),
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data ? this.artifactToDomain(data as SystemImpactArtifactDto) : null;
      }),
      catchError((error) => this.handleError(error, 'Get System Impact Artifact')),
    );
  }

  /**
   * Create a new System Impact artifact, snapshotting the provided questions.
   * The snapshot is immutable — future template changes won't affect this artifact.
   */
  createArtifact(
    lifecycleProjectId: string,
    questionsSnapshot: SystemImpactQuestion[],
  ): Observable<SystemImpactArtifact> {
    const tenantId = this.orgService.activeOrganizationId();
    return defer(async () =>
      this.supabase
        .from('csv_system_impact_artifacts')
        .insert({
          tenant_id: tenantId,
          lifecycle_project_id: lifecycleProjectId,
          questions_snapshot: questionsSnapshot,
          answers: {},
        })
        .select('*')
        .single(),
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return this.artifactToDomain(data as SystemImpactArtifactDto);
      }),
      catchError((error) => this.handleError(error, 'Create System Impact Artifact')),
    );
  }

  /**
   * Persist the user's Yes/No answers and optional justifications.
   * Also derives and persists the GxP impact judgment:
   *  - `true`  if any answer is `true` (Yes)
   *  - `false` if all answered questions are `false` (No) and at least one is answered
   *  - `null`  if no question has been answered yet
   */
  updateAnswers(
    artifactId: string,
    answers: Record<string, SystemImpactAnswer>,
  ): Observable<SystemImpactArtifact> {
    const answered = Object.values(answers).filter((a) => a.answer !== null);
    const gxpImpact =
      answered.length === 0 ? null : answered.some((a) => a.answer === true);

    return defer(async () =>
      this.supabase
        .from('csv_system_impact_artifacts')
        .update({ answers, gxp_impact: gxpImpact })
        .eq('id', artifactId)
        .select('*')
        .single(),
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        this.messageService.add({
          severity: 'success',
          summary: 'Saved',
          detail: 'System Impact answers saved',
        });
        return this.artifactToDomain(data as SystemImpactArtifactDto);
      }),
      catchError((error) => this.handleError(error, 'Update System Impact Answers')),
    );
  }

  /**
   * Reload the artifact's questions snapshot from the latest template,
   * preserving answers for questions that are still present.
   */
  reloadSnapshot(
    artifactId: string,
    newQuestionsSnapshot: SystemImpactQuestion[],
    currentAnswers: Record<string, SystemImpactAnswer>,
  ): Observable<SystemImpactArtifact> {
    const newAnswers: Record<string, SystemImpactAnswer> = {};
    for (const q of newQuestionsSnapshot) {
      if (currentAnswers[q.code]) {
        newAnswers[q.code] = currentAnswers[q.code];
      }
    }

    const answered = Object.values(newAnswers).filter((a) => a.answer !== null);
    const gxpImpact =
      answered.length === 0 ? null : answered.some((a) => a.answer === true);

    return defer(async () =>
      this.supabase
        .from('csv_system_impact_artifacts')
        .update({
          questions_snapshot: newQuestionsSnapshot,
          answers: newAnswers,
          gxp_impact: gxpImpact,
        })
        .eq('id', artifactId)
        .select('*')
        .single(),
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        this.messageService.add({
          severity: 'success',
          summary: 'Template Reloaded',
          detail: 'System Impact questions synced with the latest template.',
        });
        return this.artifactToDomain(data as SystemImpactArtifactDto);
      }),
      catchError((error) => this.handleError(error, 'Reload System Impact Snapshot')),
    );
  }

  // ─── Mapping ─────────────────────────────────────────────

  private artifactToDomain(dto: SystemImpactArtifactDto): SystemImpactArtifact {
    return {
      id: dto.id,
      lifecycleProjectId: dto.lifecycle_project_id,
      questionsSnapshot: dto.questions_snapshot ?? [],
      answers: dto.answers ?? {},
      gxpImpact: dto.gxp_impact ?? null,
      createdBy: dto.created_by,
      updatedBy: dto.updated_by,
      createdAt: dto.created_at,
      updatedAt: dto.updated_at,
    };
  }

  // ─── Error handling ──────────────────────────────────────

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
