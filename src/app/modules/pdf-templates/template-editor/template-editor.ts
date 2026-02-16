import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SplitterModule } from 'primeng/splitter';
import { CodeEditor } from '../components/code-editor/code-editor';
import { PageOptions } from '../components/page-options/page-options';
import { TemplatePreview } from '../components/template-preview/template-preview';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { ActivatedRoute } from '@angular/router';
import { MessageService } from 'primeng/api';
import { PageConfig, TemplateData, PdfTemplate } from '../interfaces/pdf-templates.types';
import { PdfTemplatesService } from '../services/pdf-templates.service';

@Component({
  selector: 'app-template-editor',
  imports: [
    FormsModule,
    SplitterModule,
    CodeEditor,
    PageOptions,
    TemplatePreview,
    ButtonModule,
    TooltipModule,
  ],
  template: `
    <div class="template-editor h-full flex flex-col">
      <div class="toolbar flex items-center gap-2 p-3 border-b border-surface">
        <h2 class="text-xl font-semibold m-0">PDF Template Editor</h2>
        <div class="flex-1"></div>
        <p-button
          icon="pi pi-download"
          severity="secondary"
          [outlined]="true"
          pTooltip="Export Template"
          tooltipPosition="bottom"
          (onClick)="exportTemplate()"
        />
        <p-button
          icon="pi pi-upload"
          severity="secondary"
          [outlined]="true"
          pTooltip="Import Template"
          tooltipPosition="bottom"
          (onClick)="fileInput.click()"
        />
        <input
          #fileInput
          type="file"
          accept=".json"
          class="hidden"
          (change)="importTemplate($event)"
        />
        <p-button
          label="Save Template"
          icon="pi pi-save"
          severity="primary"
          (onClick)="saveTemplate()"
        />
      </div>

      <p-splitter [panelSizes]="[40, 60]" [minSizes]="[25, 35]" class="flex-1" styleClass="h-full">
        <ng-template #panel>
          <div class="editor-panel h-full flex flex-col overflow-auto">
            <app-code-editor
              [htmlContent]="htmlContent()"
              [cssContent]="cssContent()"
              [headerContent]="headerContent()"
              [footerContent]="footerContent()"
              (htmlContentChange)="htmlContent.set($event)"
              (cssContentChange)="cssContent.set($event)"
              (headerContentChange)="headerContent.set($event)"
              (footerContentChange)="footerContent.set($event)"
              class="flex-1 min-h-0"
            />
            <app-page-options [config]="pageConfig()" (configChange)="pageConfig.set($event)" />
          </div>
        </ng-template>
        <ng-template #panel>
          <app-template-preview
            [htmlContent]="htmlContent()"
            [cssContent]="cssContent()"
            [headerContent]="headerContent()"
            [footerContent]="footerContent()"
            [pageConfig]="pageConfig()"
            [combinedTemplate]="combinedTemplate()"
            class="h-full"
          />
        </ng-template>
      </p-splitter>
    </div>
  `,
  styles: `
    :host {
      display: block;
      height: calc(
        100vh - 15rem
      ); /* Accounts for Topbar, Breadcrumb, Footer, and Content Padding */
    }

    .template-editor {
      background: var(--p-surface-ground);
    }

    .toolbar {
      background: var(--p-surface-card);
    }

    .editor-panel {
      background: var(--p-surface-card);
    }

    .hidden {
      display: none;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TemplateEditor {
  private route = inject(ActivatedRoute);
  private pdfService = inject(PdfTemplatesService);
  private messageService = inject(MessageService);

  readonly fileInputRef = viewChild<ElementRef<HTMLInputElement>>('fileInput');
  readonly currentTemplateName = signal<string | null>(null);

  constructor() {
    this.route.queryParams.subscribe((params) => {
      const templateName = params['templateName'];
      if (templateName) {
        this.currentTemplateName.set(templateName);
        this.loadTemplateByName(templateName);
      }
    });
  }

  readonly htmlContent = signal(`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>PDF Template</title>
</head>
<body>
  <main>
    <h1>Document Title</h1>
    <p>Your content goes here.</p>
  </main>
</body>
</html>`);

  readonly headerContent = signal(`<!-- Puppeteer Header Template -->
<!-- Available variables: date, title, url, pageNumber, totalPages -->
<div style="font-size: 10px; width: 100%; height:100%; text-align: center; border-bottom: 1px solid #ddd; padding: 5px 0;">
  <span style="color: #007bff; font-weight: bold;">Company Name</span>
  <span style="float: right; color: #666;">Document Title</span>
</div>`);

  readonly footerContent = signal(`<!-- Puppeteer Footer Template -->
<!-- Available variables: date, title, url, pageNumber, totalPages -->
<div style="font-size: 10px; width: 100%; height:100%; text-align: center; border-top: 1px solid #ddd; padding: 5px 0;">
  <span class="pageNumber"></span> of <span class="totalPages"></span>
</div>`);

  readonly cssContent = signal(`body {
  font-family: Arial, sans-serif;
  margin: 0;
  padding: 0;
  color: #333;
}

main {
  line-height: 1.6;
}`);

  readonly pageConfig = signal<PageConfig>({
    pageSize: 'Letter',
    orientation: 'portrait',
    marginTop: 20,
    marginRight: 20,
    marginBottom: 20,
    marginLeft: 20,
  });

  readonly combinedTemplate = computed(() => {
    const html = this.htmlContent();
    const css = this.cssContent();

    // Inject CSS into HTML head
    const styleTag = `<style>${css}</style>`;
    if (html.includes('</head>')) {
      return html.replace('</head>', `${styleTag}</head>`);
    }
    return `${styleTag}${html}`;
  });

  saveTemplate(): void {
    const templateData = this.getTemplateData();
    const name = this.currentTemplateName();

    if (!name) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Warning',
        detail: 'Please provide a template name in the URL (e.g. ?templateName=my-template)',
      });
      return;
    }

    const template: PdfTemplate = {
      ...templateData,
      name: name,
    };

    this.pdfService.saveTemplate(template).subscribe({
      next: (saved) => {
        console.log('Template saved successfully', saved);
      },
      error: (err: unknown) => {
        console.error('Failed to save template', err);
      },
    });
  }

  exportTemplate(): void {
    const template = this.getTemplateData();
    const json = JSON.stringify(template, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = 'pdf-template.json';
    link.click();

    URL.revokeObjectURL(url);
  }

  importTemplate(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const template = JSON.parse(reader.result as string) as TemplateData;
        this.loadTemplate(template);
      } catch (e) {
        console.error('Failed to parse template file:', e);
      }
    };
    reader.readAsText(file);

    // Reset input for re-importing the same file
    input.value = '';
  }

  private getTemplateData(): TemplateData {
    return {
      html: this.htmlContent(),
      css: this.cssContent(),
      header: this.headerContent(),
      footer: this.footerContent(),
      options: this.pageConfig(),
    };
  }

  private loadTemplate(template: TemplateData): void {
    if (template.html) this.htmlContent.set(template.html);
    if (template.css) this.cssContent.set(template.css);
    if (template.header) this.headerContent.set(template.header);
    if (template.footer) this.footerContent.set(template.footer);
    if (template.options) this.pageConfig.set(template.options);
  }

  private loadTemplateByName(name: string) {
    this.pdfService.getTemplateByName(name).subscribe({
      next: (template) => {
        if (template) {
          this.loadTemplate(template);
        } else {
          console.log('Template not found, using default blank template');
        }
      },
      error: (err: unknown) => {
        console.error('Failed to load template', err);
      },
    });
  }
}
