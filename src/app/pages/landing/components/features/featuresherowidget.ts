import { Component } from '@angular/core';

@Component({
  selector: 'app-features-hero-widget',
  standalone: true,
  imports: [],
  template: `
    <section class="relative py-24 px-6 overflow-hidden">
      <div class="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-16">
        <div class="flex-1">
          <div
            class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider mb-6"
          >
            Capabilities Deep-Dive
          </div>
          <h1 class="text-5xl md:text-7xl font-black tracking-tight leading-none mb-8">
            Engineered for <br />
            <span class="text-primary-600 dark:text-primary-400">Regulated Excellence</span>
          </h1>
          <p class="text-xl text-surface-600 dark:text-surface-400 max-w-2xl leading-relaxed">
            Go beyond simple formulas. Keep Quality provides a robust framework for calculation
            validation, workflow orchestration, and long-term data integrity.
          </p>
        </div>
        <div class="flex-1 relative group perspective-1000">
          <div
            class="relative rounded-3xl border border-surface-200 dark:border-surface-800 bg-surface-0 dark:bg-surface-900 p-12 shadow-2xl transition-transform duration-500 group-hover:rotate-y-2 group-hover:rotate-x-2"
          >
            <div class="flex flex-col gap-6">
              <div
                class="h-4 w-1/2 bg-surface-100 dark:bg-surface-800 rounded-full animate-pulse"
              ></div>
              <div
                class="h-4 w-3/4 bg-surface-100 dark:bg-surface-800 rounded-full animate-pulse"
              ></div>
              <div
                class="h-4 w-2/3 bg-surface-100 dark:bg-surface-800 rounded-full animate-pulse"
              ></div>
              <div class="mt-8 flex gap-4">
                <div class="h-12 w-32 bg-primary-500/20 rounded-xl"></div>
                <div class="h-12 w-32 bg-surface-100 dark:bg-surface-800 rounded-xl"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  `,
})
export class FeaturesHeroWidget {}
