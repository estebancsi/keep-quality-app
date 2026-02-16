import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-pricing-compare-widget',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="max-w-7xl mx-auto px-6 py-24 mb-32">
      <div class="text-center mb-16">
        <h4 class="text-3xl font-black mb-4">Detailed Plan Comparison</h4>
        <p class="text-surface-500">Every detail reviewed for your compliance team.</p>
      </div>

      <div
        class="overflow-hidden rounded-4xl border border-surface-200 dark:border-surface-800 bg-surface-0 dark:bg-surface-900 shadow-xl"
      >
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-surface-50 dark:bg-surface-950/50">
                <th class="p-8 font-black text-xl">Core Features</th>
                @for (plan of plans; track plan) {
                  <th
                    class="p-8 text-center font-black text-xl text-primary-600 dark:text-primary-400"
                  >
                    {{ plan }}
                  </th>
                }
              </tr>
            </thead>
            <tbody>
              @for (detail of planDetails; track detail.feature) {
                <tr
                  class="border-t border-surface-200 dark:border-surface-800 hover:bg-surface-50/50 dark:hover:bg-surface-800/30 transition-colors"
                >
                  <td class="p-8">
                    <div class="font-bold text-surface-900 dark:text-white mb-1">
                      {{ detail.feature }}
                    </div>
                    <div class="text-xs text-surface-500">{{ detail.description }}</div>
                  </td>
                  @for (value of detail.values; track value) {
                    <td
                      class="p-8 text-center font-semibold text-surface-700 dark:text-surface-300"
                    >
                      @if (value === '_yes') {
                        <i class="pi pi-check text-green-500 text-lg"></i>
                      } @else if (value === '_no') {
                        <i class="pi pi-times text-surface-300 dark:text-surface-700"></i>
                      } @else {
                        {{ value }}
                      }
                    </td>
                  }
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </section>
  `,
})
export class PricingCompareWidget {
  plans = ['Starter', 'Professional', 'Enterprise'];

  planDetails = [
    {
      feature: 'Projects',
      description: 'Maximum number of spreadsheet projects',
      values: ['1', '10', 'Unlimited'],
    },
    {
      feature: 'Immutable Audit Trail',
      description: '21 CFR Part 11 compliant logs',
      values: ['_yes', '_yes', '_yes'],
    },
    {
      feature: 'E-Signatures',
      description: 'Electronic approvals via SSO',
      values: ['Limited', '_yes', '_yes'],
    },
    {
      feature: 'Hyperformula Engine',
      description: 'High-precision math processing',
      values: ['_yes', '_yes', '_yes'],
    },
    {
      feature: 'Validation Protocols',
      description: 'IQ/OQ/PQ documentation support',
      values: ['_no', 'Partial', '_yes'],
    },
    {
      feature: 'Granular RBAC',
      description: 'Editor/Viewer/QA role sets',
      values: ['_no', '_yes', '_yes'],
    },
    {
      feature: 'Single Sign-On (SSO)',
      description: 'SAML, OAuth2 integration',
      values: ['_no', '_no', '_yes'],
    },
    {
      feature: 'Support SLA',
      description: 'Guaranteed response times',
      values: ['Standard', '24h', '1h Priority'],
    },
  ];
}
