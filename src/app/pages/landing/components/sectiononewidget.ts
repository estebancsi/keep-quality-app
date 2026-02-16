import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-section-one-widget',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section
      id="compliance"
      class="py-20 bg-surface-100/30 dark:bg-surface-900/30 border-y border-surface-200 dark:border-surface-800"
    >
      <div class="max-w-7xl mx-auto px-6 text-center">
        <p class="text-sm font-bold uppercase tracking-widest text-surface-500 mb-12">
          Adhering to the World's Strictest Standards
        </p>
        <div
          class="flex flex-wrap justify-center items-center gap-12 md:gap-20 opacity-60 dark:opacity-40 grayscale hover:grayscale-0 transition-all"
        >
          <div class="flex flex-col items-center gap-2">
            <span class="text-2xl font-black text-surface-900 dark:text-white">FDA 21 CFR</span>
            <span class="text-xs font-bold text-surface-500">Part 11 Compliant</span>
          </div>
          <div class="flex flex-col items-center gap-2">
            <span class="text-2xl font-black text-surface-900 dark:text-white">GxP</span>
            <span class="text-xs font-bold text-surface-500">Validated SaaS</span>
          </div>
          <div class="flex flex-col items-center gap-2">
            <span class="text-2xl font-black text-surface-900 dark:text-white">EU Annex 11</span>
            <span class="text-xs font-bold text-surface-500">Standards Ready</span>
          </div>
          <div class="flex flex-col items-center gap-2">
            <span class="text-2xl font-black text-surface-900 dark:text-white">HIPAA</span>
            <span class="text-xs font-bold text-surface-500">Data Security</span>
          </div>
          <div class="flex flex-col items-center gap-2">
            <span class="text-2xl font-black text-surface-900 dark:text-white">ISO 27001</span>
            <span class="text-xs font-bold text-surface-500">Certified Infrastructure</span>
          </div>
        </div>
      </div>
    </section>
  `,
})
export class SectionOneWidget {}
