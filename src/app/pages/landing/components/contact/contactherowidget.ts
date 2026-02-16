import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { RadioButtonModule } from 'primeng/radiobutton';
import { TextareaModule } from 'primeng/textarea';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-contact-hero-widget',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    InputTextModule,
    RadioButtonModule,
    TextareaModule,
    ButtonModule,
  ],
  template: `
    <section class="max-w-7xl mx-auto px-6 py-24">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
        <div>
          <div class="badge mb-6">Expert Support</div>
          <h1 class="text-5xl md:text-7xl font-black tracking-tight mb-8">
            Let's discuss your <br />
            <span class="text-primary-600">Compliance Goals</span>
          </h1>
          <p class="text-xl text-surface-600 dark:text-surface-400 leading-relaxed mb-12">
            Whether you need a full validation protocol or just have a few questions about 21 CFR
            Part 11, our experts are here to help.
          </p>

          <div class="space-y-8">
            <div class="flex items-center gap-6">
              <div
                class="w-14 h-14 rounded-2xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600"
              >
                <i class="pi pi-envelope text-2xl"></i>
              </div>
              <div>
                <div class="text-sm font-bold text-surface-500 uppercase tracking-widest">
                  Email Us
                </div>
                <div class="text-xl font-bold">compliance&#64;keep-quality.com</div>
              </div>
            </div>
            <div class="flex items-center gap-6">
              <div
                class="w-14 h-14 rounded-2xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600"
              >
                <i class="pi pi-map-marker text-2xl"></i>
              </div>
              <div>
                <div class="text-sm font-bold text-surface-500 uppercase tracking-widest">
                  Visit HQ
                </div>
                <div class="text-xl font-bold">Validation Square, Biotech Park, CA</div>
              </div>
            </div>
          </div>
        </div>

        <div
          class="p-8 md:p-12 rounded-[3rem] border border-surface-200 dark:border-surface-800 bg-surface-0 dark:bg-surface-900 shadow-3xl"
        >
          <form class="space-y-8">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="flex flex-col gap-2">
                <label class="text-sm font-bold text-surface-700 dark:text-surface-300">Name</label>
                <input
                  pInputText
                  placeholder="Your Name"
                  class="w-full rounded-xl! bg-surface-50! dark:bg-surface-800! border-surface-200! dark:border-surface-700!"
                />
              </div>
              <div class="flex flex-col gap-2">
                <label class="text-sm font-bold text-surface-700 dark:text-surface-300"
                  >Email</label
                >
                <input
                  pInputText
                  placeholder="Email Address"
                  class="w-full rounded-xl! bg-surface-50! dark:bg-surface-800! border-surface-200! dark:border-surface-700!"
                />
              </div>
            </div>
            <div class="flex flex-col gap-2">
              <label class="text-sm font-bold text-surface-700 dark:text-surface-300"
                >Inquiry Type</label
              >
              <div class="flex flex-wrap gap-4 mt-2">
                @for (s of subjects; track s.key) {
                  <div
                    class="flex items-center gap-2 px-4 py-2 rounded-full border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800"
                  >
                    <p-radiobutton
                      [id]="s.key"
                      name="subject"
                      [(ngModel)]="selectedSubject"
                      [value]="s.name"
                    />
                    <label [for]="s.key" class="text-sm font-semibold cursor-pointer">{{
                      s.name
                    }}</label>
                  </div>
                }
              </div>
            </div>
            <div class="flex flex-col gap-2">
              <label class="text-sm font-bold text-surface-700 dark:text-surface-300"
                >Message</label
              >
              <textarea
                pTextarea
                placeholder="How can we assist with your compliance journey?"
                rows="5"
                class="w-full rounded-xl! bg-surface-50! dark:bg-surface-800! border-surface-200! dark:border-surface-700!"
              ></textarea>
            </div>
            <p-button
              label="Submit Inquiry"
              icon="pi pi-send"
              severity="primary"
              styleClass="w-full py-4! rounded-xl! font-bold!"
            />
          </form>
        </div>
      </div>
    </section>
  `,
})
export class ContactHeroWidget {
  selectedSubject = 'GxP Validation';

  subjects = [
    { name: 'GxP Validation', key: 'validation' },
    { name: 'Enterprise License', key: 'enterprise' },
    { name: 'Technical Support', key: 'support' },
  ];
}
