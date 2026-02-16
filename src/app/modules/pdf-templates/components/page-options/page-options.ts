import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PanelModule } from 'primeng/panel';
import { SelectModule } from 'primeng/select';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectButtonModule } from 'primeng/selectbutton';
import { FluidModule } from 'primeng/fluid';
import { PageConfig } from '../../interfaces/pdf-templates.types';

interface SelectOption {
  label: string;
  value: string;
}

@Component({
  selector: 'app-page-options',
  imports: [
    FormsModule,
    PanelModule,
    SelectModule,
    InputNumberModule,
    SelectButtonModule,
    FluidModule,
  ],
  template: `
    <p-panel header="Page Options" [toggleable]="true" [collapsed]="true">
      <p-fluid>
        <div class="grid grid-cols-2 gap-4">
          <div class="flex flex-col gap-2">
            <label for="pageSize">Page Size</label>
            <p-select
              id="pageSize"
              [options]="pageSizes"
              [ngModel]="config().pageSize"
              (ngModelChange)="updateConfig('pageSize', $event)"
              placeholder="Select size"
              appendTo="body"
            />
          </div>

          <div class="flex flex-col gap-2">
            <label>Orientation</label>
            <p-selectbutton
              [options]="orientations"
              [ngModel]="config().orientation"
              (ngModelChange)="updateConfig('orientation', $event)"
              optionLabel="label"
              optionValue="value"
            />
          </div>

          <div class="flex flex-col gap-2">
            <label for="marginTop">Margin Top (mm)</label>
            <p-inputnumber
              id="marginTop"
              [ngModel]="config().marginTop"
              (ngModelChange)="updateConfig('marginTop', $event)"
              [min]="0"
              [max]="100"
            />
          </div>

          <div class="flex flex-col gap-2">
            <label for="marginBottom">Margin Bottom (mm)</label>
            <p-inputnumber
              id="marginBottom"
              [ngModel]="config().marginBottom"
              (ngModelChange)="updateConfig('marginBottom', $event)"
              [min]="0"
              [max]="100"
            />
          </div>

          <div class="flex flex-col gap-2">
            <label for="marginLeft">Margin Left (mm)</label>
            <p-inputnumber
              id="marginLeft"
              [ngModel]="config().marginLeft"
              (ngModelChange)="updateConfig('marginLeft', $event)"
              [min]="0"
              [max]="100"
            />
          </div>

          <div class="flex flex-col gap-2">
            <label for="marginRight">Margin Right (mm)</label>
            <p-inputnumber
              id="marginRight"
              [ngModel]="config().marginRight"
              (ngModelChange)="updateConfig('marginRight', $event)"
              [min]="0"
              [max]="100"
            />
          </div>
        </div>
      </p-fluid>
    </p-panel>
  `,
  styles: `
    :host {
      display: block;
      border-top: 1px solid var(--p-surface-border);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageOptions {
  readonly config = input.required<PageConfig>();
  readonly configChange = output<PageConfig>();

  readonly pageSizes: SelectOption[] = [
    { label: 'A4', value: 'A4' },
    { label: 'A3', value: 'A3' },
    { label: 'Letter', value: 'Letter' },
    { label: 'Legal', value: 'Legal' },
    { label: 'Tabloid', value: 'Tabloid' },
  ];

  readonly orientations: SelectOption[] = [
    { label: 'Portrait', value: 'portrait' },
    { label: 'Landscape', value: 'landscape' },
  ];

  updateConfig<K extends keyof PageConfig>(key: K, value: PageConfig[K]): void {
    this.configChange.emit({
      ...this.config(),
      [key]: value,
    });
  }
}
