import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-features-section-one-widget',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="py-24 px-6">
      <div class="max-w-7xl mx-auto flex flex-col md:flex-row-reverse items-center gap-20">
        <div class="flex-1">
          <div class="badge mb-6">Validation & E-Signatures</div>
          <h2 class="text-4xl md:text-5xl font-black tracking-tight mb-8">
            Automated compliance at every step.
          </h2>
          <p class="text-lg text-surface-600 dark:text-surface-400 leading-relaxed mb-10">
            Never worry about missing documentation or unverified changes. Every calculation is
            automatically cross-referenced against your master validation protocol, and approvals
            are sealed with multi-factor e-signatures.
          </p>
          <div class="space-y-6">
            <div class="flex items-start gap-4">
              <div
                class="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 shrink-0"
              >
                <i class="pi pi-check"></i>
              </div>
              <div>
                <h4 class="font-bold text-surface-900 dark:text-white">Continuous Validation</h4>
                <p class="text-surface-500">
                  Real-time status tracking against IQ/OQ/PQ requirements.
                </p>
              </div>
            </div>
            <div class="flex items-start gap-4">
              <div
                class="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 shrink-0"
              >
                <i class="pi pi-pencil"></i>
              </div>
              <div>
                <h4 class="font-bold text-surface-900 dark:text-white">Flexible Approval Flows</h4>
                <p class="text-surface-500">
                  Define multi-stage review processes tailored to your SOPs.
                </p>
              </div>
            </div>
          </div>
        </div>
        <div class="flex-1 flex justify-center scale-110">
          <div
            class="relative w-full max-w-sm aspect-square bg-linear-to-tr from-primary-500/20 to-indigo-500/20 rounded-[3rem] p-1 border border-white/10 shadow-2xl"
          >
            <div
              class="w-full h-full bg-surface-0 dark:bg-surface-950 rounded-[2.8rem] flex items-center justify-center overflow-hidden border border-surface-200 dark:border-surface-800"
            >
              <i class="pi pi-verified text-8xl text-primary-500/50"></i>
            </div>
          </div>
        </div>
      </div>
    </section>
  `,
})
export class FeaturesSectionOneWidget {}
