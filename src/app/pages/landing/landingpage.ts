import { Component, ChangeDetectionStrategy } from '@angular/core';
import { HeroWidget } from './components/herowidget';
import { SectionOneWidget } from './components/sectiononewidget';
import { SectionTwoWidget } from './components/sectiontwowidget';
import { SectionThreeWidget } from './components/sectionthreewidget';
import { CtaWidget } from './components/ctawidget';

@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [HeroWidget, SectionOneWidget, SectionTwoWidget, SectionThreeWidget, CtaWidget],
  template: `
    <div
      class="min-h-screen bg-surface-50 dark:bg-surface-950 text-surface-950 dark:text-surface-0 transition-colors duration-500 overflow-x-hidden"
    >
      <!-- Background Ambient Glows -->
      <div class="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
        <div
          class="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary-500/10 dark:bg-primary-500/20 blur-[150px] rounded-full animate-pulse"
        ></div>
        <div
          class="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-cyan-500/10 dark:bg-cyan-500/20 blur-[150px] rounded-full animate-pulse"
          style="animation-delay: 2s"
        ></div>
      </div>

      <main>
        <app-hero-widget />
        <app-section-one-widget />
        <app-section-two-widget />
        <app-section-three-widget />
        <app-cta-widget />
      </main>
    </div>

    <style>
      @keyframes fade-in {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }
      @keyframes slide-up {
        from {
          opacity: 0;
          transform: translateY(30px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      .animate-fade-in {
        animation: fade-in 1s cubic-bezier(0.16, 1, 0.3, 1) forwards;
      }
      .animate-slide-up {
        animation: slide-up 1s cubic-bezier(0.16, 1, 0.3, 1) forwards;
      }
      .perspective-1000 {
        perspective: 1000px;
      }
      .rotate-x-1 {
        transform: rotateX(2deg);
      }
      .-rotate-y-1 {
        transform: rotateY(-2deg);
      }
    </style>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LandingPage {}
