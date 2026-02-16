import {
  Component,
  computed,
  ElementRef,
  inject,
  viewChild,
  ChangeDetectionStrategy,
} from '@angular/core';
import { AppMenu } from './app.menu';
import { LayoutService } from '@/layout/service/layout.service';
import { RouterModule } from '@angular/router';
import { AppTopbar } from '@/layout/components/app.topbar';
import { CommonModule } from '@angular/common';
import { LogoWidget } from '@/pages/landing/components/logowidget';

@Component({
  selector: '[app-sidebar]',
  imports: [CommonModule, AppMenu, RouterModule, AppTopbar, LogoWidget],
  template: `<div
    class="layout-sidebar"
    (mouseenter)="onMouseEnter()"
    (mouseleave)="onMouseLeave()"
  >
    <div class="sidebar-header">
      <a class="logo flex items-center" [routerLink]="['/']">
        <logo-widget />
      </a>
      <button class="layout-sidebar-anchor z-2" type="button" (click)="anchor()"></button>
    </div>

    <div #menuContainer class="layout-menu-container">
      <div app-menu></div>
    </div>
    @if (isHorizontal()) {
      <div app-topbar></div>
    }
  </div>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppSidebar {
  layoutService = inject(LayoutService);
  el = inject(ElementRef);

  timeout: any = null;

  isHorizontal = computed(() => this.layoutService.isHorizontal());

  menuTheme = computed(() => this.layoutService.layoutConfig().menuTheme);

  menuContainer = viewChild<ElementRef>('menuContainer');

  onMouseEnter() {
    if (!this.layoutService.layoutState().anchored) {
      if (this.timeout) {
        clearTimeout(this.timeout);
        this.timeout = null;
      }

      this.layoutService.layoutState.update((state) => {
        if (!state.sidebarActive) {
          return {
            ...state,
            sidebarActive: true,
          };
        }
        return state;
      });
    }
  }

  onMouseLeave() {
    if (!this.layoutService.layoutState().anchored) {
      if (!this.timeout) {
        this.timeout = setTimeout(() => {
          this.layoutService.layoutState.update((state) => {
            if (state.sidebarActive) {
              return {
                ...state,
                sidebarActive: false,
              };
            }
            return state;
          });
        }, 300);
      }
    }
  }

  anchor() {
    this.layoutService.layoutState.update((state) => ({
      ...state,
      anchored: !state.anchored,
    }));
  }
}
