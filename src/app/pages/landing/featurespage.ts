import { Component, ChangeDetectionStrategy } from '@angular/core';
import { FeaturesHeroWidget } from './components/features/featuresherowidget';
import { FeaturesSectionOneWidget } from './components/features/featuressectiononewidget';
import { FeaturesSectionTwoWidget } from './components/features/featuressectiontwowidget';
import { CtaWidget } from './components/ctawidget';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-features-page',
  standalone: true,
  imports: [
    CommonModule,
    FeaturesHeroWidget,
    FeaturesSectionOneWidget,
    FeaturesSectionTwoWidget,
    CtaWidget,
  ],
  template: `
    <div
      class="min-h-screen bg-surface-50 dark:bg-surface-950 text-surface-950 dark:text-surface-0 transition-colors duration-500 overflow-x-hidden pt-20"
    >
      <!-- Background Ambient Glows -->
      <div class="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
        <div
          class="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-500/10 dark:bg-indigo-500/20 blur-[150px] rounded-full animate-pulse"
        ></div>
        <div
          class="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary-500/10 dark:bg-primary-500/20 blur-[150px] rounded-full animate-pulse"
          style="animation-delay: 2s"
        ></div>
      </div>

      <main class="animate-fade-in">
        <app-features-hero-widget />
        <app-features-section-one-widget />
        <app-features-section-two-widget />
        <app-cta-widget />
      </main>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeaturesPage {}
