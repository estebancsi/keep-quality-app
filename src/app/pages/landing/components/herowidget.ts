import { CommonModule, NgOptimizedImage } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { HorizontalGridWidget } from './horizontalgridwidget';
import { LayoutService } from '@/layout/service/layout.service';
import { RouterLink } from '@angular/router';
import { OidcSecurityService } from 'angular-auth-oidc-client';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-hero-widget',
  standalone: true,
  imports: [CommonModule, HorizontalGridWidget, RouterLink, ButtonModule, NgOptimizedImage],
  template: `
    <section class="relative pt-32 pb-32 px-6 overflow-hidden">
      <app-horizontal-grid-widget
        class="top-108 lg:top-104 opacity-20"
      ></app-horizontal-grid-widget>

      <div class="relative z-10 max-w-7xl mx-auto flex flex-col items-center text-center gap-10">
        <!-- Hero Badge -->
        <div
          class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-500/10 text-primary-600 dark:text-primary-400 text-sm font-semibold border border-primary-500/20 backdrop-blur-md animate-fade-in"
        >
          <span class="flex h-2 w-2 relative">
            <span
              class="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"
            ></span>
            <span class="relative inline-flex rounded-full h-2 w-2 bg-primary-500"></span>
          </span>
          @if (isAuthenticated()) {
            Welcome back, {{ userData()?.userData?.name || userData()?.userData?.email }}!
          } @else {
            GxP Compliant & FDA 21 CFR Part 11 Ready
          }
        </div>

        <!-- Headline -->
        <h1 class="text-6xl md:text-8xl font-black tracking-tight leading-[1.05] animate-slide-up">
          Precision Data.<br />
          <span
            class="bg-clip-text text-transparent bg-linear-to-r from-primary-600 via-indigo-500 to-cyan-500"
          >
            Compliance Guaranteed.
          </span>
        </h1>

        <!-- Description -->
        <p
          class="text-xl md:text-2xl text-surface-600 dark:text-surface-400 max-w-3xl leading-relaxed animate-slide-up"
          style="animation-delay: 100ms"
        >
          The first online spreadsheet platform built specifically for regulated industries. Combine
          high-performance calculations with uncompromising regulatory rigor.
        </p>

        <!-- CTAs -->
        <div
          class="flex flex-col sm:flex-row items-center gap-5 mt-4 animate-slide-up"
          style="animation-delay: 200ms"
        >
          @if (isAuthenticated()) {
            <p-button
              label="Go to Dashboard"
              size="large"
              routerLink="/home"
              icon="pi pi-th-large"
              iconPos="right"
              class="shadow-2xl shadow-primary-500/40"
              styleClass="!px-8 !py-4 !text-lg !font-bold"
            />
            <p-button
              label="View Worksheets"
              [outlined]="true"
              size="large"
              severity="secondary"
              icon="pi pi-table"
              styleClass="!px-8 !py-4 !text-lg !font-bold"
              routerLink="/worksheets/instrumental"
            />
          } @else {
            <p-button
              label="Start Your Free Trial"
              size="large"
              (click)="login()"
              icon="pi pi-arrow-right"
              iconPos="right"
              class="shadow-2xl shadow-primary-500/40"
              styleClass="!px-8 !py-4 !text-lg !font-bold"
            />
            <p-button
              label="Request a Demo"
              [outlined]="true"
              size="large"
              severity="secondary"
              icon="pi pi-play"
              styleClass="!px-8 !py-4 !text-lg !font-bold"
              routerLink="/home"
            />
          }
        </div>

        <!-- Perspective Dashboard Mockup -->
        <div
          class="relative mt-20 w-full max-w-5xl group perspective-1000 animate-fade-in"
          style="animation-delay: 400ms"
        >
          <div
            class="absolute inset-0 bg-primary-500/30 blur-[120px] rounded-full scale-90 opacity-40 group-hover:opacity-60 transition-opacity duration-1000"
          ></div>
          <div
            class="relative rounded-2xl border border-surface-200 dark:border-surface-700 bg-surface-0 dark:bg-surface-900 shadow-3xl overflow-hidden transform group-hover:rotate-x-1 group-hover:-rotate-y-1 transition-transform duration-700"
          >
            <img
              ngSrc="images/hero-dashboard.png"
              alt="Keep Quality Dashboard Interface"
              width="1024"
              height="600"
              class="w-full h-auto opacity-90 group-hover:opacity-100 transition-opacity"
              priority
            />
          </div>
        </div>
      </div>
    </section>
  `,
})
export class HeroWidget {
  layoutService = inject(LayoutService);
  private readonly oidcSecurityService = inject(OidcSecurityService);

  isAuthenticated = toSignal(
    this.oidcSecurityService.isAuthenticated$.pipe(map((result) => result.isAuthenticated)),
    { initialValue: false },
  );

  userData = toSignal(this.oidcSecurityService.userData$, { initialValue: null });

  login() {
    this.oidcSecurityService.authorize();
  }
}
