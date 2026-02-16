import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-section-two-widget',
  standalone: true,
  imports: [CommonModule, ButtonModule],
  template: `
    <section id="features" class="py-32 px-6">
      <div class="max-w-7xl mx-auto">
        <div class="flex flex-col md:flex-row justify-between items-end gap-6 mb-20">
          <div class="max-w-2xl">
            <h2 class="text-sm font-bold text-primary-500 uppercase tracking-widest mb-3">
              Core Capabilities
            </h2>
            <h3
              class="text-4xl md:text-5xl font-black tracking-tight text-surface-900 dark:text-white"
            >
              Everything you need for enterprise-grade data management.
            </h3>
          </div>
          <p-button
            label="Explore all features"
            [text]="true"
            icon="pi pi-chevron-right"
            iconPos="right"
          />
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <!-- Feature 1 -->
          <div
            class="group p-10 rounded-[2.5rem] border border-surface-200 dark:border-surface-800 bg-surface-0 dark:bg-surface-900 hover:border-primary-500/50 hover:shadow-2xl hover:shadow-primary-500/10 transition-all duration-500"
          >
            <div
              class="w-16 h-16 rounded-2xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400 mb-8 group-hover:scale-110 transition-transform"
            >
              <i class="pi pi-history text-3xl"></i>
            </div>
            <h4 class="text-2xl font-extrabold mb-4 text-surface-900 dark:text-white">
              Immuable Audit Trails
            </h4>
            <p class="text-surface-600 dark:text-surface-400 leading-relaxed text-lg">
              Every cell change, formula update, and data import is logged with a cryptographic
              timestamp and user ID. Non-repudiation is guaranteed by design.
            </p>
          </div>

          <!-- Feature 2 -->
          <div
            class="group p-10 rounded-[2.5rem] border border-surface-200 dark:border-surface-800 bg-surface-0 dark:bg-surface-900 hover:border-indigo-500/50 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-500"
          >
            <div
              class="w-16 h-16 rounded-2xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-8 group-hover:scale-110 transition-transform"
            >
              <i class="pi pi-shield text-3xl"></i>
            </div>
            <h4 class="text-2xl font-extrabold mb-4 text-surface-900 dark:text-white">
              Electronic Signatures
            </h4>
            <p class="text-surface-600 dark:text-surface-400 leading-relaxed text-lg">
              Approve datasets and result summaries with legally binding e-Signatures. Workflow
              stages ensure data is reviewed and locked before submission.
            </p>
          </div>

          <!-- Feature 3 -->
          <div
            class="group p-10 rounded-[2.5rem] border border-surface-200 dark:border-surface-800 bg-surface-0 dark:bg-surface-900 hover:border-cyan-500/50 hover:shadow-2xl hover:shadow-cyan-500/10 transition-all duration-500"
          >
            <div
              class="w-16 h-16 rounded-2xl bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center text-cyan-600 dark:text-cyan-400 mb-8 group-hover:scale-110 transition-transform"
            >
              <i class="pi pi-cog text-3xl"></i>
            </div>
            <h4 class="text-2xl font-extrabold mb-4 text-surface-900 dark:text-white">
              Hyperformula Engine
            </h4>
            <p class="text-surface-600 dark:text-surface-400 leading-relaxed text-lg">
              Enterprise-grade calculation engine supporting thousands of formulas with
              sub-millisecond latency. High-precision arithmetic for scientific data.
            </p>
          </div>
        </div>
      </div>
    </section>
  `,
})
export class SectionTwoWidget {}
