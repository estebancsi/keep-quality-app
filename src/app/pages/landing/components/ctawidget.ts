import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { OidcSecurityService } from 'angular-auth-oidc-client';
import { RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';

@Component({
  selector: 'app-cta-widget',
  standalone: true,
  imports: [CommonModule, ButtonModule, RouterLink],
  template: `
    <section class="py-32 px-6">
      <div
        class="max-w-5xl mx-auto rounded-[3rem] bg-linear-to-br from-primary-600 to-indigo-700 p-12 md:p-24 text-center text-white relative overflow-hidden shadow-3xl"
      >
        <div
          class="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2"
        ></div>
        <div
          class="absolute bottom-0 left-0 w-64 h-64 bg-cyan-400/20 blur-[100px] rounded-full translate-y-1/2 -translate-x-1/2"
        ></div>

        <h2 class="text-4xl md:text-6xl font-black mb-8 relative z-10">
          Ready to modernize your GxP workflows?
        </h2>
        <p class="text-xl opacity-90 mb-12 max-w-2xl mx-auto relative z-10">
          Join leading pharmaceutical and biotech companies who trust Keep Quality for their
          critical laboratory and clinical data.
        </p>
        <div class="flex flex-col sm:flex-row justify-center gap-4 relative z-10">
          @if (isAuthenticated()) {
            <p-button
              label="Go to Dashboard"
              severity="secondary"
              size="large"
              routerLink="/home"
              styleClass="!bg-white !text-primary-600 !hover:bg-surface-100 !border-none !px-10 !py-4 !text-lg !font-bold"
            />
          } @else {
            <p-button
              label="Get Started Now"
              severity="secondary"
              size="large"
              (click)="login()"
              styleClass="!bg-white !text-primary-600 !hover:bg-surface-100 !border-none !px-10 !py-4 !text-lg !font-bold"
            />
          }
          <p-button
            label="Contact Sales"
            [outlined]="true"
            severity="secondary"
            size="large"
            styleClass="!text-white !border-white/50 !hover:bg-white/10 !px-10 !py-4 !text-lg !font-bold"
          />
        </div>
      </div>
    </section>
  `,
})
export class CtaWidget {
  private readonly oidcSecurityService = inject(OidcSecurityService);

  isAuthenticated = toSignal(
    this.oidcSecurityService.isAuthenticated$.pipe(map((result: any) => result.isAuthenticated)),
    { initialValue: false },
  );

  login() {
    this.oidcSecurityService.authorize();
  }
}
