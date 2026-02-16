import { Component, computed, inject } from '@angular/core';
import { LayoutService } from '@/layout/service/layout.service';
import { LogoWidget } from '@/pages/landing/components/logowidget';

@Component({
  selector: '[app-footer]',
  standalone: true,
  imports: [LogoWidget],
  template: `
    <div class="layout-footer">
      <div class="footer-logo-container">
        <logo-widget />
        <span class="footer-app-name">Keep Quality</span>
      </div>
      <span class="footer-copyright">&#169; Keep Quality - 2026</span>
    </div>
  `,
})
export class AppFooter {
  layoutService = inject(LayoutService);

  isDarkTheme = computed(() => this.layoutService.isDarkTheme());
}
