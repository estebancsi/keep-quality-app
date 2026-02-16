import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-pricing-hero-widget',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="max-w-7xl mx-auto px-6 py-24">
      <div class="text-center mb-20">
        <h1 class="text-5xl md:text-7xl font-black tracking-tight mb-8">
          Simple, Transparent <br />
          <span class="text-primary-600">Compliance Pricing</span>
        </h1>
        <p class="text-xl text-surface-600 dark:text-surface-400 max-w-2xl mx-auto">
          Choose the plan that fits your organization's regulatory needs. All plans include our core
          high-performance hyperformula engine.
        </p>

        <div
          class="inline-flex p-1 bg-surface-100 dark:bg-surface-900 rounded-2xl mt-12 mb-8 border border-surface-200 dark:border-surface-800"
        >
          <button
            (click)="isYearly = false"
            class="px-6 py-2 rounded-xl text-sm font-bold transition-all"
            [class]="
              !isYearly
                ? 'bg-surface-0 dark:bg-surface-800 shadow-sm text-primary-600'
                : 'text-surface-500'
            "
          >
            Monthly
          </button>
          <button
            (click)="isYearly = true"
            class="px-6 py-2 rounded-xl text-sm font-bold transition-all"
            [class]="
              isYearly
                ? 'bg-surface-0 dark:bg-surface-800 shadow-sm text-primary-600'
                : 'text-surface-500'
            "
          >
            Yearly <span class="ml-1 text-[10px] text-green-500">-20%</span>
          </button>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
        @for (data of pricingData; track data.type) {
          <div
            class="group p-8 md:p-10 rounded-[2.5rem] border border-surface-200 dark:border-surface-800 bg-surface-0 dark:bg-surface-900 hover:border-primary-500/50 hover:shadow-2xl hover:shadow-primary-500/10 transition-all duration-500 flex flex-col"
            [class.md:scale-105]="data.recommended"
            [class.border-primary-500/50]="data.recommended"
            [class.z-10]="data.recommended"
          >
            @if (data.recommended) {
              <div
                class="bg-primary-500 text-white text-[10px] font-black uppercase tracking-widest py-1 px-3 rounded-full w-fit absolute -top-3 left-1/2 -translate-x-1/2"
              >
                Most Popular
              </div>
            }
            <div class="text-xs font-black uppercase tracking-widest text-surface-500 mb-6">
              {{ data.type }}
            </div>
            <div class="mb-8">
              <span class="text-5xl font-black">{{
                data.price[isYearly ? 'yearly' : 'monthly']
              }}</span>
              <span class="text-surface-500 font-bold ml-2">/ {{ isYearly ? 'mo' : 'mo' }}</span>
              @if (isYearly) {
                <div class="text-[10px] text-green-600 font-bold mt-1">Billed annually</div>
              }
            </div>
            <p class="text-surface-600 dark:text-surface-400 mb-10 leading-relaxed text-sm">
              {{ data.description }}
            </p>
            <div class="flex-1 space-y-4 mb-10">
              @for (item of data.ingredients; track item) {
                <div class="flex items-center gap-3">
                  <i class="pi pi-check-circle text-primary-500 text-lg"></i>
                  <span class="text-sm font-semibold text-surface-700 dark:text-surface-300">{{
                    item
                  }}</span>
                </div>
              }
            </div>
            <button
              class="w-full py-4 rounded-2xl font-black tracking-tight transition-all duration-300"
              [class]="
                data.recommended
                  ? 'bg-primary-600 text-white hover:bg-primary-700'
                  : 'bg-surface-100 dark:bg-surface-800 hover:bg-surface-200 dark:hover:bg-surface-700'
              "
            >
              Get Started
            </button>
          </div>
        }
      </div>
    </section>
  `,
})
export class PricingHeroWidget {
  isYearly = true;

  pricingData = [
    {
      type: 'Starter',
      price: {
        yearly: '$49',
        monthly: '$59',
      },
      description:
        'Ideal for small labs or individual researcher projects needing local GxP compliance.',
      ingredients: ['1 Project', 'Full Audit Trail', 'E-Signatures (Limited)', 'Standard Support'],
    },
    {
      type: 'Professional',
      recommended: true,
      price: {
        yearly: '$199',
        monthly: '$249',
      },
      description: 'Designed for scaling departments requiring centralized validation protocols.',
      ingredients: [
        '10 Projects',
        'Role-Based Access',
        'Unlimited E-Signatures',
        'Priority 24/7 Support',
      ],
    },
    {
      type: 'Enterprise',
      price: {
        yearly: 'Custom',
        monthly: 'Custom',
      },
      description: 'For organizations with multi-site requirements and custom integration needs.',
      ingredients: [
        'Unlimited Projects',
        'Custom SSO/SAML',
        'Validation Documents',
        'Dedicated CSM',
      ],
    },
  ];
}
