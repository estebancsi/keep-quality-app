import { Component, computed, inject } from '@angular/core';
import { LayoutService } from '@/layout/service/layout.service';

@Component({
  selector: '[app-footer]',
  standalone: true,
  template: `
    <div class="layout-footer">
      <div class="footer-logo-container">
        <div
          class="logo-image w-8 h-8 rounded-xl bg-linear-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20"
        >
          <i class="pi pi-table text-xl"></i>
        </div>
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
