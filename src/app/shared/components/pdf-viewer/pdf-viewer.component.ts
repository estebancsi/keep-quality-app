import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
  NgxExtendedPdfViewerModule,
  NgxExtendedPdfViewerService,
  pdfDefaultOptions,
} from 'ngx-extended-pdf-viewer';

@Component({
  selector: 'app-pdf-viewer',
  templateUrl: './pdf-viewer.component.html',
  imports: [NgxExtendedPdfViewerModule],
  providers: [NgxExtendedPdfViewerService],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PdfViewerComponent implements OnInit, OnDestroy {
  @Input() pdfBase64Src: string | undefined = undefined;
  @Input() pdfSrc: string = '/pdfs/Blank.pdf';
  @Output() pdfSrcChange = new EventEmitter<string>();

  constructor(
    private pdfService: NgxExtendedPdfViewerService,
    private cd: ChangeDetectorRef,
    private route: ActivatedRoute,
  ) {
    pdfDefaultOptions.doubleTapZoomFactor = '150%';
    pdfDefaultOptions.maxCanvasPixels = 4096 * 4096 * 5;
  }

  ngOnInit(): void {
    const srcUrl = this.route.snapshot.queryParamMap.get('src');
    if (srcUrl) {
      this.pdfSrc = srcUrl;
    }
  }

  ngOnDestroy(): void {
    var inputField = document.getElementById('fileInput');
    if (inputField) {
      inputField.remove();
    }
    var container = document.getElementById('printContainer');
    if (container) {
      container.remove();
    }
  }

  onSrcChange(src: string) {
    this.pdfSrcChange.emit(src);
  }
}
