import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { PageConfig } from '../../interfaces/pdf-templates.types';
import { SelectButtonModule } from 'primeng/selectbutton';
import { FormsModule } from '@angular/forms';

// Page dimensions in mm (real physical sizes)
const PAGE_DIMENSIONS: Record<string, { width: number; height: number }> = {
  A4: { width: 210, height: 297 },
  A3: { width: 297, height: 420 },
  Letter: { width: 215.9, height: 279.4 },
  Legal: { width: 215.9, height: 355.6 },
  Tabloid: { width: 279.4, height: 431.8 },
};

// Standard conversion: 1 inch = 25.4 mm, screen is typically 96 DPI
const MM_TO_PX = 96 / 25.4; // ~3.78 px per mm

@Component({
  selector: 'app-template-preview',
  imports: [SelectButtonModule, FormsModule],
  template: `
    <div class="preview-container h-full flex flex-col">
      <div class="preview-toolbar p-3 border-b border-surface flex items-center gap-2">
        <i class="pi pi-eye"></i>
        <span class="font-semibold">Preview</span>
        <span class="text-sm text-muted-color">
          {{ pageConfig().pageSize }} ({{ pageDimensionsMm().width }}×{{
            pageDimensionsMm().height
          }}mm)
        </span>
        <div class="ml-auto flex items-center gap-2">
          <span class="text-sm text-muted-color">Zoom:</span>
          <p-selectbutton
            [options]="zoomOptions"
            [(ngModel)]="zoomLevel"
            optionLabel="label"
            optionValue="value"
            size="small"
          />
        </div>
      </div>
      <div class="preview-content flex-1 overflow-auto p-4 flex justify-center items-start">
        <div
          class="page-wrapper"
          [style.transform]="'scale(' + zoomLevel() + ')'"
          [style.transformOrigin]="'top center'"
        >
          <div
            class="page-container"
            [style.width.px]="pageDimensionsPx().width"
            [style.height.px]="pageDimensionsPx().height"
          >
            <!-- Header Zone -->
            <div
              class="header-zone"
              [style.height.px]="marginsPx().top"
              [style.paddingLeft.px]="0"
              [style.paddingRight.px]="0"
              [innerHTML]="safeHeader()"
            ></div>

            <!-- Body Content -->
            <div
              class="body-zone"
              [style.paddingLeft.px]="marginsPx().left"
              [style.paddingRight.px]="marginsPx().right"
            >
              <iframe
                class="preview-iframe"
                sandbox="allow-same-origin"
                [srcdoc]="safeTemplate()"
              ></iframe>
            </div>

            <!-- Footer Zone -->
            <div
              class="footer-zone"
              [style.height.px]="marginsPx().bottom"
              [style.paddingLeft.px]="0"
              [style.paddingRight.px]="0"
              [innerHTML]="safeFooter()"
            ></div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: `
    :host {
      display: block;
      background: var(--p-surface-ground);
    }

    .preview-container {
      background: var(--p-surface-card);
    }

    .preview-toolbar {
      background: var(--p-surface-section);
    }

    .preview-content {
      background: var(--p-surface-ground);
    }

    .page-wrapper {
      transition: transform 0.2s ease;
    }

    .page-container {
      background: white;
      box-shadow:
        0 4px 6px -1px rgb(0 0 0 / 0.1),
        0 2px 4px -2px rgb(0 0 0 / 0.1),
        0 0 0 1px rgb(0 0 0 / 0.05);
      border-radius: 2px;
      display: flex;
      flex-direction: column;
      box-sizing: border-box;
    }

    .header-zone {
      width: 100%;
      display: flex;
      align-items: start;
      box-sizing: border-box;
      flex-shrink: 0;
    }

    .body-zone {
      flex: 1;
      min-height: 0;
      overflow: hidden;
      box-sizing: border-box;
      zoom: 0.9;
    }

    .footer-zone {
      width: 100%;
      display: flex;
      align-items: end;
      box-sizing: border-box;
      flex-shrink: 0;
    }

    .preview-iframe {
      width: 100%;
      height: 100%;
      border: none;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TemplatePreview {
  readonly htmlContent = input.required<string>();
  readonly cssContent = input.required<string>();
  readonly headerContent = input.required<string>();
  readonly footerContent = input.required<string>();
  readonly pageConfig = input.required<PageConfig>();
  readonly combinedTemplate = input.required<string>();

  readonly zoomLevel = signal(0.75);

  readonly zoomOptions = [
    { label: '50%', value: 0.5 },
    { label: '75%', value: 0.75 },
    { label: '100%', value: 1 },
    { label: '125%', value: 1.25 },
    { label: '150%', value: 1.5 },
  ];

  constructor(private readonly sanitizer: DomSanitizer) {}

  readonly pageDimensionsMm = computed(() => {
    const config = this.pageConfig();
    const base = PAGE_DIMENSIONS[config.pageSize] || PAGE_DIMENSIONS['A4'];

    let width = base.width;
    let height = base.height;

    // Swap for landscape
    if (config.orientation === 'landscape') {
      [width, height] = [height, width];
    }

    return {
      width: Math.round(width),
      height: Math.round(height),
    };
  });

  readonly pageDimensionsPx = computed(() => {
    const mm = this.pageDimensionsMm();

    // Convert mm to pixels at 96 DPI (standard screen resolution)
    return {
      width: Math.round(mm.width * MM_TO_PX),
      height: Math.round(mm.height * MM_TO_PX),
    };
  });

  readonly marginsPx = computed(() => {
    const config = this.pageConfig();
    return {
      top: Math.round(config.marginTop * MM_TO_PX),
      right: Math.round(config.marginRight * MM_TO_PX),
      bottom: Math.round(config.marginBottom * MM_TO_PX),
      left: Math.round(config.marginLeft * MM_TO_PX),
    };
  });

  readonly safeTemplate = computed((): SafeHtml => {
    return this.sanitizer.bypassSecurityTrustHtml(this.combinedTemplate());
  });

  readonly safeHeader = computed((): SafeHtml => {
    // Strip HTML comments from header content for display
    const content = this.headerContent().replace(/<!--[\s\S]*?-->/g, '');
    return this.sanitizer.bypassSecurityTrustHtml(content);
  });

  readonly safeFooter = computed((): SafeHtml => {
    // Strip HTML comments and replace Puppeteer placeholders for preview
    let content = this.footerContent().replace(/<!--[\s\S]*?-->/g, '');
    // Replace Puppeteer class placeholders with example values
    content = content
      .replace(/<span class="pageNumber"><\/span>/g, '<span>1</span>')
      .replace(/<span class="totalPages"><\/span>/g, '<span>5</span>');
    return this.sanitizer.bypassSecurityTrustHtml(content);
  });
}
