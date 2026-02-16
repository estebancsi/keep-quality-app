import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-features-section-two-widget',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="py-24 px-6 bg-surface-100/50 dark:bg-surface-900/50">
      <div class="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-20">
        <div class="flex-1">
          <div class="badge mb-6">Calculation & Precision</div>
          <h2 class="text-4xl md:text-5xl font-black tracking-tight mb-8">
            High-performance engine for mission-critical math.
          </h2>
          <p class="text-lg text-surface-600 dark:text-surface-400 leading-relaxed mb-10">
            Leverage the power of the Hyperformula engine to handle thousands of interlinked
            calculations with extreme precision. Optimized for scientific notation and high-decimal
            accuracy required in lab environments.
          </p>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-8">
            <div
              class="p-6 rounded-2xl bg-surface-0 dark:bg-surface-950 border border-surface-200 dark:border-surface-800"
            >
              <div class="font-bold mb-2">Scientific Precision</div>
              <p class="text-sm text-surface-500">
                Support for up to 20 decimal places and complex error handling.
              </p>
            </div>
            <div
              class="p-6 rounded-2xl bg-surface-0 dark:bg-surface-950 border border-surface-200 dark:border-surface-800"
            >
              <div class="font-bold mb-2">Formula Versioning</div>
              <p class="text-sm text-surface-500">
                Track and validate formula changes independently from your data.
              </p>
            </div>
          </div>
        </div>
        <div class="flex-1 flex justify-center">
          <div
            class="relative w-full max-w-sm aspect-video bg-surface-950 rounded-2xl overflow-hidden shadow-2xl border border-surface-800 flex items-center justify-center p-8"
          >
            <div class="text-primary-500 font-mono text-xl animate-pulse">
              f(x) = validated_sum(range_a1:z100)
            </div>
          </div>
        </div>
      </div>
    </section>
  `,
})
export class FeaturesSectionTwoWidget {}
