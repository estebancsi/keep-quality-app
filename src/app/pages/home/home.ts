import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeroBannerComponent } from './components/hero-banner/hero-banner.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, HeroBannerComponent],
  template: `
    <div class="p-6">
      <app-hero-banner></app-hero-banner>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"></div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
    `,
  ],
})
export class Home {}
