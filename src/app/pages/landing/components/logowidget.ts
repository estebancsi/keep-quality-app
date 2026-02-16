import { LayoutService } from '@/layout/service/layout.service';
import { CommonModule } from '@angular/common';
import { Component, computed, inject, Input } from '@angular/core';

@Component({
  selector: 'logo-widget',
  standalone: true,
  imports: [CommonModule],
  template: ` <div class="flex items-center gap-3 group cursor-pointer">
    <div
      class="w-10 h-10 flex items-center justify-center text-white group-hover:scale-110 transition-transform duration-300"
    >
      <img [src]="logoSrc()" alt="Logo" class="w-full h-full object-contain" />
    </div>
  </div>`,
})
export class LogoWidget {
  private readonly layoutService = inject(LayoutService);

  readonly logoSrc = computed(() => {
    return this.layoutService.isDarkTheme()
      ? '/layout/images/logo-dark.svg'
      : '/layout/images/logo-light.svg';
  });
}
