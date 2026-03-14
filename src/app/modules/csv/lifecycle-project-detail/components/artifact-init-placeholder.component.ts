import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-artifact-init-placeholder',
  imports: [ButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="flex flex-col items-center gap-4 py-16"
      role="region"
      [attr.aria-label]="label() + ' not initialized'"
    >
      <i class="pi pi-play-circle text-6xl text-primary-300 dark:text-primary-600" aria-hidden="true"></i>
      <div class="flex flex-col items-center gap-1 text-center">
        <p class="text-surface-700 dark:text-surface-300 font-semibold text-lg m-0">
          {{ label() }} not initialized
        </p>
        <p class="text-surface-500 m-0 text-sm">
          This artifact hasn't been created yet. Initialize it to start working.
        </p>
      </div>
      <p-button
        label="Initialize"
        icon="pi pi-play"
        [loading]="initializing()"
        (click)="initialize.emit()"
        [attr.aria-label]="'Initialize ' + label()"
      />
    </div>
  `,
})
export class ArtifactInitPlaceholderComponent {
  readonly label = input.required<string>();
  readonly initializing = input<boolean>(false);
  readonly initialize = output<void>();
}
