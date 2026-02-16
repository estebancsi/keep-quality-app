import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-section-three-widget',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section
      id="security"
      class="py-32 bg-linear-to-b from-surface-0 to-surface-100 dark:from-surface-950 dark:to-surface-900 overflow-hidden"
    >
      <div class="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center gap-16">
        <div class="flex-1 order-2 md:order-1 relative">
          <div
            class="absolute -top-10 -left-10 w-64 h-64 bg-primary-500/20 blur-[100px] rounded-full"
          ></div>
          <div
            class="relative p-8 rounded-3xl border border-surface-200 dark:border-surface-800 bg-surface-0/50 dark:bg-surface-900/50 backdrop-blur-md shadow-2xl"
          >
            <div class="flex flex-col gap-6">
              <div
                class="flex items-center gap-4 p-4 rounded-2xl bg-primary-500/5 border border-primary-500/10"
              >
                <i class="pi pi-lock text-primary-500 text-xl"></i>
                <div>
                  <div class="font-bold text-surface-900 dark:text-white">
                    Role-Based Access Control
                  </div>
                  <div class="text-sm text-surface-500">
                    Granular permissions for Viewers, Editors, and QA.
                  </div>
                </div>
              </div>
              <div
                class="flex items-center gap-4 p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/10"
              >
                <i class="pi pi-server text-indigo-500 text-xl"></i>
                <div>
                  <div class="font-bold text-surface-900 dark:text-white">
                    Single Source of Truth
                  </div>
                  <div class="text-sm text-surface-500">
                    Centralized database for all organizational data.
                  </div>
                </div>
              </div>
              <div
                class="flex items-center gap-4 p-4 rounded-2xl bg-cyan-500/5 border border-cyan-500/10"
              >
                <i class="pi pi-sync text-cyan-500 text-xl"></i>
                <div>
                  <div class="font-bold text-surface-900 dark:text-white">Real-time Validation</div>
                  <div class="text-sm text-surface-500">
                    Immediate feedback on data entry errors.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="flex-1 order-1 md:order-2">
          <h2 class="text-sm font-bold text-primary-500 uppercase tracking-widest mb-3">
            Enterprise Governance
          </h2>
          <h3
            class="text-4xl md:text-5xl font-black tracking-tight text-surface-900 dark:text-white mb-6"
          >
            Total control over your organization's data.
          </h3>
          <p class="text-xl text-surface-600 dark:text-surface-400 leading-relaxed mb-8">
            Manage spreadsheets across multiple departments, laboratories, and sites. Centralize
            results from various sources while ensuring that every piece of data is validated and
            compliant.
          </p>
          <ul class="flex flex-col gap-4">
            <li
              class="flex items-center gap-3 font-semibold text-surface-800 dark:text-surface-200"
            >
              <i class="pi pi-check-circle text-primary-500"></i>
              Centralized Spreadsheet Repository
            </li>
            <li
              class="flex items-center gap-3 font-semibold text-surface-800 dark:text-surface-200"
            >
              <i class="pi pi-check-circle text-primary-500"></i>
              Automated Data Aggregation
            </li>
            <li
              class="flex items-center gap-3 font-semibold text-surface-800 dark:text-surface-200"
            >
              <i class="pi pi-check-circle text-primary-500"></i>
              Standardized Templates for QA
            </li>
          </ul>
        </div>
      </div>
    </section>
  `,
})
export class SectionThreeWidget {}
