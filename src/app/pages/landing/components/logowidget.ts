import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'logo-widget',
  standalone: true,
  imports: [CommonModule],
  template: ` <div class="flex items-center gap-3 group cursor-pointer">
    <div
      class="w-10 h-10 rounded-xl bg-linear-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20 group-hover:scale-110 transition-transform duration-300"
    >
      <i class="pi pi-table text-xl"></i>
    </div>
    <span
      class="text-2xl font-black tracking-tighter bg-clip-text text-transparent bg-linear-to-r from-surface-900 to-surface-600 dark:from-white dark:to-surface-400"
    >
      Keep Quality
    </span>
  </div>`,
})
export class LogoWidget {
  @Input() className: string = '';
  @Input() reverseTheme: boolean = false;
}
