import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContactHeroWidget } from './components/contact/contactherowidget';
import { ContactAdressWidget } from './components/contact/contactadresswidget';
import { TestimonialWidget } from './components/testimonialwidget';

@Component({
  selector: 'app-contact-page',
  standalone: true,
  imports: [CommonModule, ContactHeroWidget, ContactAdressWidget, TestimonialWidget],
  template: `
    <div
      class="min-h-screen bg-surface-50 dark:bg-surface-950 text-surface-950 dark:text-surface-0 transition-colors duration-500 overflow-x-hidden pt-20"
    >
      <!-- Background Ambient Glows -->
      <div class="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
        <div
          class="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary-500/10 dark:bg-primary-500/20 blur-[150px] rounded-full animate-pulse"
        ></div>
        <div
          class="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-500/10 dark:bg-indigo-500/20 blur-[150px] rounded-full animate-pulse"
          style="animation-delay: 2s"
        ></div>
      </div>

      <main class="animate-fade-in">
        <app-contact-hero-widget />
        <app-contact-adress-widget />
        <app-testimonial-widget />
      </main>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContactPage {}
