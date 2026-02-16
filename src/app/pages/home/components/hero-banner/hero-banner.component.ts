import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-hero-banner',
  imports: [CommonModule, RouterModule, ButtonModule],
  templateUrl: './hero-banner.component.html',
  styleUrl: './hero-banner.component.scss',
})
export class HeroBannerComponent {
  userName = input<string>('');
  coverImage = input<string>('/layout/images/vps_cover.png');

  getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  }
}
