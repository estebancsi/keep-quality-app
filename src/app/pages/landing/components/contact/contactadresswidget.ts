import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-contact-adress-widget',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section
      class="max-w-7xl mx-auto px-6 py-24 border-t border-surface-200 dark:border-surface-800"
    >
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
        <div class="space-y-4">
          <h4 class="text-2xl font-black">Global Offices</h4>
          <p class="text-surface-500">
            Find us in major biotech hubs across the world. Our teams are available for on-site
            validation consulting.
          </p>
        </div>
        @for (data of contactInfo; track data.title) {
          <div
            class="group p-8 rounded-3xl bg-surface-100/50 dark:bg-surface-900/50 border border-transparent hover:border-primary-500/20 transition-all"
          >
            <i class="pi pi-map-marker text-primary-500 text-2xl mb-6"></i>
            <h5 class="text-xl font-bold mb-4">{{ data.title }}</h5>
            <p class="text-surface-600 dark:text-surface-400 mb-2">{{ data.address }}</p>
            <p class="font-bold text-primary-600 text-sm">{{ data.phone }}</p>
          </div>
        }
      </div>
    </section>
  `,
})
export class ContactAdressWidget {
  contactInfo = [
    {
      title: 'North America',
      address: '1200 Innovation Way, South San Francisco, CA 94080',
      phone: '+1 (415) 555-0123',
    },
    {
      title: 'Europe',
      address: 'Biotech Innovation Centre, Basel, Switzerland 4051',
      phone: '+41 61 555 7890',
    },
  ];
}
