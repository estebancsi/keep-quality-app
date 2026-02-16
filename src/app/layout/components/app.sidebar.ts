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

@Component({
  selector: '[app-sidebar]',
  imports: [CommonModule, AppMenu, RouterModule, AppTopbar],
  template: `<div
    class="layout-sidebar"
    (mouseenter)="onMouseEnter()"
    (mouseleave)="onMouseLeave()"
  >
    <div class="sidebar-header">
      <a class="logo flex items-center" [routerLink]="['/']">
        <div
          class="logo-image w-10 h-10 rounded-xl bg-linear-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20"
        >
          <i class="pi pi-table text-xl"></i>
        </div>
        <span
          class="app-name text-2xl font-black tracking-tighter bg-clip-text text-transparent bg-linear-to-r from-surface-900 to-surface-600 dark:from-white dark:to-surface-400"
        >
          Keep Quality
        </span>
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
