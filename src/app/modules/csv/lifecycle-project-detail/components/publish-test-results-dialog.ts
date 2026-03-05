import { ChangeDetectionStrategy, Component, effect, input, model, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TestPhase } from '../../test-protocol.interface';

@Component({
  selector: 'app-publish-test-results-dialog',
  imports: [FormsModule, DialogModule, ButtonModule, InputTextModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p-dialog
      header="Publish Test Results"
      [(visible)]="visible"
      [modal]="true"
      [style]="{ width: '450px' }"
    >
      <div class="flex flex-col gap-4 py-4">
        <p class="m-0 text-surface-600 dark:text-surface-400">
          The test results will be published as a PDF attachment for this lifecycle project. Once
          published, a notification will be sent.
        </p>
        <div class="flex flex-col gap-2">
          <label for="attachment-name" class="font-semibold text-sm">Document Name</label>
          <input
            pInputText
            id="attachment-name"
            [(ngModel)]="attachmentName"
            class="w-full"
            placeholder="e.g. Test Results IQ"
          />
        </div>
      </div>
      <ng-template pTemplate="footer">
        <div class="flex justify-end gap-2">
          <p-button
            label="Cancel"
            icon="pi pi-times"
            [text]="true"
            severity="secondary"
            (click)="visible.set(false)"
          />
          <p-button
            label="Publish"
            icon="pi pi-cloud-upload"
            (click)="onPublish()"
            [disabled]="!attachmentName.trim()"
            [loading]="publishing()"
          />
        </div>
      </ng-template>
    </p-dialog>
  `,
})
export class PublishTestResultsDialogComponent {
  readonly phase = input.required<TestPhase>();
  readonly visible = model(false);
  readonly publishing = input(false);
  readonly publish = output<{ name: string; phase: TestPhase }>();

  protected attachmentName = '';

  constructor() {
    effect(() => {
      if (this.visible()) {
        const ph = this.phase();
        this.attachmentName = `Test Results ${ph.toUpperCase()}`;
      }
    });
  }

  protected onPublish(): void {
    if (!this.attachmentName.trim()) return;
    this.publish.emit({
      name: this.attachmentName.trim(),
      phase: this.phase(),
    });
  }
}
