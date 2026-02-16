import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TabsModule } from 'primeng/tabs';
import { MonacoEditorModule } from 'ngx-monaco-editor-v2';
import { LayoutService } from '../../../../layout/service/layout.service';

@Component({
  selector: 'app-code-editor',
  imports: [FormsModule, TabsModule, MonacoEditorModule],
  template: `
    <p-tabs value="html" class="h-full flex flex-col">
      <p-tablist>
        <p-tab value="html">
          <i class="pi pi-file mr-2"></i>
          Body
        </p-tab>
        <p-tab value="header">
          <i class="pi pi-arrow-up mr-2"></i>
          Header
        </p-tab>
        <p-tab value="footer">
          <i class="pi pi-arrow-down mr-2"></i>
          Footer
        </p-tab>
        <p-tab value="css">
          <i class="pi pi-palette mr-2"></i>
          CSS
        </p-tab>
      </p-tablist>
      <p-tabpanels class="flex-1 min-h-0">
        <p-tabpanel value="html" class="h-full p-0">
          <ngx-monaco-editor
            class="editor-container"
            [options]="htmlEditorOptions()"
            [ngModel]="htmlContent()"
            (ngModelChange)="htmlContentChange.emit($event)"
          />
        </p-tabpanel>
        <p-tabpanel value="header" class="h-full p-0">
          <ngx-monaco-editor
            class="editor-container"
            [options]="headerEditorOptions()"
            [ngModel]="headerContent()"
            (ngModelChange)="headerContentChange.emit($event)"
          />
        </p-tabpanel>
        <p-tabpanel value="footer" class="h-full p-0">
          <ngx-monaco-editor
            class="editor-container"
            [options]="footerEditorOptions()"
            [ngModel]="footerContent()"
            (ngModelChange)="footerContentChange.emit($event)"
          />
        </p-tabpanel>
        <p-tabpanel value="css" class="h-full p-0">
          <ngx-monaco-editor
            class="editor-container"
            [options]="cssEditorOptions()"
            [ngModel]="cssContent()"
            (ngModelChange)="cssContentChange.emit($event)"
          />
        </p-tabpanel>
      </p-tabpanels>
    </p-tabs>
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
    }

    .editor-container {
      height: 100%;
      min-height: 300px;
    }

    ::ng-deep .p-tabpanels {
      padding: 0 !important;
    }

    ::ng-deep .p-tabpanel {
      height: 100%;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CodeEditor {
  private readonly layoutService = inject(LayoutService);

  readonly htmlContent = input.required<string>();
  readonly cssContent = input.required<string>();
  readonly headerContent = input.required<string>();
  readonly footerContent = input.required<string>();

  readonly htmlContentChange = output<string>();
  readonly cssContentChange = output<string>();
  readonly headerContentChange = output<string>();
  readonly footerContentChange = output<string>();

  private readonly commonOptions = computed(() => ({
    theme: this.layoutService.isDarkTheme() ? 'vs-dark' : 'vs-light',
    automaticLayout: true,
    minimap: { enabled: false },
    fontSize: 14,
    lineNumbers: 'on' as const,
    scrollBeyondLastLine: false,
    wordWrap: 'on' as const,
  }));

  readonly htmlEditorOptions = computed(() => ({
    ...this.commonOptions(),
    language: 'html',
  }));

  readonly headerEditorOptions = computed(() => ({
    ...this.commonOptions(),
    language: 'html',
  }));

  readonly footerEditorOptions = computed(() => ({
    ...this.commonOptions(),
    language: 'html',
  }));

  readonly cssEditorOptions = computed(() => ({
    ...this.commonOptions(),
    language: 'css',
  }));
}
