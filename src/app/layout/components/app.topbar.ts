import { Component, computed, ElementRef, inject, effect, ViewChild } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { StyleClassModule } from 'primeng/styleclass';
import { OidcSecurityService } from 'angular-auth-oidc-client';
import { LayoutService } from '@/layout/service/layout.service';
import { AppBreadcrumb } from './app.breadcrumb';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { RippleModule } from 'primeng/ripple';
import { AvatarModule } from 'primeng/avatar';
import { OrgSwitcherComponent } from './org-switcher/org-switcher.component';
import { NotificationPanelComponent } from '@/modules/notifications/components/notification-panel';
import { NotificationService } from '@/modules/notifications/services/notification.service';

@Component({
  selector: '[app-topbar]',
  imports: [
    RouterModule,
    CommonModule,
    StyleClassModule,
    AppBreadcrumb,
    InputTextModule,
    ButtonModule,
    IconFieldModule,
    InputIconModule,
    RippleModule,
    AvatarModule,
    OrgSwitcherComponent,
    NotificationPanelComponent,
  ],
  template: `<div class="layout-topbar">
    <div class="topbar-left">
      <a tabindex="0" #menubutton type="button" class="menu-button" (click)="onMenuButtonClick()">
        <i class="pi pi-chevron-left"></i>
      </a>
      <img class="horizontal-logo" src="/layout/images/logo-light.svg" alt="keep-quality" />
      <span class="topbar-separator"></span>
      <div app-breadcrumb></div>
      <img
        class="mobile-logo"
        src="/layout/images/logo-{{ isDarkTheme() ? 'white' : 'dark' }}.svg"
        alt="diamond-layout"
      />
    </div>

    <div class="topbar-right">
      <ul class="topbar-menu">
        <li class="right-sidebar-item">
          <app-org-switcher></app-org-switcher>
        </li>
        <li class="right-sidebar-item">
          <a class="right-sidebar-button" (click)="toggleSearchBar()">
            <i class="pi pi-search"></i>
          </a>
        </li>
        <li class="right-sidebar-item">
          <p-button
            [icon]="layoutService.isDarkTheme() ? 'pi pi-sun' : 'pi pi-moon'"
            [text]="true"
            severity="secondary"
            (click)="layoutService.toggleDarkMode()"
            rounded="false"
          />
        </li>
        <app-notification-panel />
        <li class="profile-item static sm:relative">
          <a
            class="right-sidebar-button relative z-50"
            pStyleClass="@next"
            enterFromClass="hidden"
            enterActiveClass="animate-scalein"
            leaveActiveClass="animate-fadeout"
            leaveToClass="hidden"
            [hideOnOutsideClick]="true"
          >
            <p-avatar styleClass="w-10! h-10!" shape="circle">
              @if (userData()?.picture) {
                <img [src]="userData().picture" />
              } @else {
                <img src="/layout/images/profile.svg" />
              }
            </p-avatar>
          </a>
          <div
            class="list-none p-2 m-0 rounded-2xl border border-surface overflow-hidden absolute bg-surface-0 dark:bg-surface-900 hidden origin-top w-52 mt-2 right-0 z-999 top-auto shadow-[0px_56px_16px_0px_rgba(0,0,0,0.00),0px_36px_14px_0px_rgba(0,0,0,0.01),0px_20px_12px_0px_rgba(0,0,0,0.02),0px_9px_9px_0px_rgba(0,0,0,0.03),0px_2px_5px_0px_rgba(0,0,0,0.04)]"
          >
            <ul class="flex flex-col gap-1">
              <li>
                <a
                  class="label-small dark:text-surface-400 flex gap-2 py-2 px-2.5 rounded-lg items-center hover:bg-emphasis transition-colors duration-150 cursor-pointer"
                >
                  <i class="pi pi-user"></i>
                  <span>{{ userData()?.name || 'Profile' }}</span>
                </a>
              </li>
              <li>
                <a
                  class="label-small dark:text-surface-400 flex gap-2 py-2 px-2.5 rounded-lg items-center hover:bg-emphasis transition-colors duration-150 cursor-pointer"
                >
                  <i class="pi pi-cog"></i>
                  <span>Settings</span>
                </a>
              </li>
              <li>
                <a
                  class="label-small dark:text-surface-400 flex gap-2 py-2 px-2.5 rounded-lg items-center hover:bg-emphasis transition-colors duration-150 cursor-pointer"
                >
                  <i class="pi pi-calendar"></i>
                  <span>Calendar</span>
                </a>
              </li>
              <li>
                <a
                  class="label-small dark:text-surface-400 flex gap-2 py-2 px-2.5 rounded-lg items-center hover:bg-emphasis transition-colors duration-150 cursor-pointer"
                >
                  <i class="pi pi-inbox"></i>
                  <span>Inbox</span>
                </a>
              </li>
              <li>
                @if (isAuthenticated()) {
                  <a
                    class="label-small dark:text-surface-400 flex gap-2 py-2 px-2.5 rounded-lg items-center hover:bg-emphasis transition-colors duration-150 cursor-pointer"
                    (click)="logout()"
                  >
                    <i class="pi pi-power-off"></i>
                    <span>Log out</span>
                  </a>
                } @else {
                  <a
                    class="label-small dark:text-surface-400 flex gap-2 py-2 px-2.5 rounded-lg items-center hover:bg-emphasis transition-colors duration-150 cursor-pointer"
                    (click)="login()"
                  >
                    <i class="pi pi-sign-in"></i>
                    <span>Log in</span>
                  </a>
                }
              </li>
            </ul>
          </div>
        </li>
        <li class="right-sidebar-item">
          <a tabindex="0" class="right-sidebar-button" (click)="showRightMenu()">
            <i class="pi pi-align-right"></i>
          </a>
        </li>
      </ul>
    </div>
  </div>`,
})
export class AppTopbar {
  layoutService = inject(LayoutService);
  private readonly oidcSecurityService = inject(OidcSecurityService);
  private readonly notificationService = inject(NotificationService);

  userData = toSignal(this.oidcSecurityService.userData$.pipe(map((r) => r.userData)));
  isAuthenticated = toSignal(
    this.oidcSecurityService.isAuthenticated$.pipe(map((r) => r.isAuthenticated)),
  );

  isDarkTheme = computed(() => this.layoutService.isDarkTheme());

  @ViewChild('menubutton') menuButton!: ElementRef;

  constructor() {
    // Connect SSE when user is authenticated
    effect(() => {
      if (this.isAuthenticated()) {
        this.notificationService.connectSse();
      }
    });
  }

  onMenuButtonClick() {
    this.layoutService.onMenuToggle();
  }

  showRightMenu() {
    this.layoutService.toggleRightMenu();
  }

  onConfigButtonClick() {
    this.layoutService.showConfigSidebar();
  }

  toggleSearchBar() {
    this.layoutService.layoutState.update((value) => ({
      ...value,
      searchBarActive: !value.searchBarActive,
    }));
  }

  logout() {
    this.oidcSecurityService.logoff().subscribe();
  }

  login() {
    this.oidcSecurityService.authorize();
  }
}
