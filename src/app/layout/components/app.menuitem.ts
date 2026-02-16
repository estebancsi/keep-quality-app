import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  input,
  OnDestroy,
  OnInit,
  inject,
  signal,
  viewChild,
  AfterViewChecked,
} from '@angular/core';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { DomHandler } from 'primeng/dom';
import { TooltipModule } from 'primeng/tooltip';
import { CommonModule } from '@angular/common';
import { RippleModule } from 'primeng/ripple';
import { LayoutService } from '@/layout/service/layout.service';
import { MenuItem } from 'primeng/api';

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: '[app-menuitem]',
  imports: [CommonModule, RouterModule, RippleModule, TooltipModule],
  template: `
    <ng-container>
      @if (root() && item().visible !== false) {
        <div class="layout-menuitem-root-text">
          {{ item().label }}
        </div>
      }
      @if ((!item().routerLink || item().items) && item().visible !== false) {
        <a
          [attr.href]="item().url"
          (click)="itemClick($event)"
          (mouseenter)="onMouseEnter()"
          [class]="item()['class']"
          [attr.target]="item().target"
          tabindex="0"
          pRipple
          [pTooltip]="item().label"
          [tooltipDisabled]="!(!isSlim() && !isHorizontal() && root() && !active())"
        >
          <i [class]="item().icon" class="layout-menuitem-icon"></i>
          <span class="layout-menuitem-text">{{ item().label }}</span>
          @if (item().items) {
            <i class="pi pi-fw pi-angle-down layout-submenu-toggler"></i>
          }
        </a>
      }
      @if (item().routerLink && !item().items && item().visible !== false) {
        <a
          (click)="itemClick($event)"
          (mouseenter)="onMouseEnter()"
          [class]="item()['class']"
          [routerLink]="item().routerLink"
          routerLinkActive="active-route"
          [routerLinkActiveOptions]="
            item().routerLinkActiveOptions || {
              paths: 'exact',
              queryParams: 'ignored',
              matrixParams: 'ignored',
              fragment: 'ignored',
            }
          "
          [fragment]="item().fragment"
          [queryParamsHandling]="item().queryParamsHandling"
          [preserveFragment]="item().preserveFragment"
          [skipLocationChange]="item().skipLocationChange"
          [replaceUrl]="item().replaceUrl"
          [state]="item().state"
          [queryParams]="item().queryParams"
          [attr.target]="item().target"
          tabindex="0"
          pRipple
          [pTooltip]="item().label"
          [tooltipDisabled]="!(!isSlim() && !isHorizontal() && root())"
        >
          <i [class]="item().icon" class="layout-menuitem-icon"></i>
          <span class="layout-menuitem-text">{{ item().label }}</span>
          @if (item().items) {
            <i class="pi pi-fw pi-angle-down layout-submenu-toggler"></i>
          }
        </a>
      }
      @if (item().items && item().visible !== false) {
        <ul #submenu [attr.data-animation-state]="submenuAnimation()">
          @for (child of item().items; track child; let i = $index) {
            <li
              app-menuitem
              [item]="child"
              [index]="i"
              [parentKey]="key()"
              [class]="child['badgeClass']"
            ></li>
          }
        </ul>
      }
    </ng-container>
  `,
  styles: `
    :host ul {
      list-style-type: none;
      margin: 0;
      padding: 0;
    }

    /* Collapsed state - height: 0 equivalent */
    :host ul[data-animation-state='collapsed'] {
      max-height: 0;
      overflow: hidden;
      transition: max-height 400ms cubic-bezier(0.86, 0, 0.07, 1);
    }

    /* Expanded state - height: * equivalent */
    :host ul[data-animation-state='expanded'] {
      max-height: auto;
      transition: max-height 400ms cubic-bezier(0.86, 0, 0.07, 1);
    }

    /* Hidden state - display: none equivalent */
    :host ul[data-animation-state='hidden'] {
      display: none;
    }

    /* Visible state - display: block equivalent */
    :host ul[data-animation-state='visible'] {
      display: block;
    }

    /* Critical: allows grid to collapse to 0 */
    :host ul[data-animation-state='collapsed'] > li,
    :host ul[data-animation-state='expanded'] > li {
      min-height: 0;
    }
  `,
  host: {
    '[class.layout-root-menuitem]': 'root()',
    '[class.active-menuitem]': 'active()',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppMenuitem implements OnInit, OnDestroy, AfterViewChecked {
  layoutService = inject(LayoutService);
  router = inject(Router);

  item = input.required<MenuItem>();
  index = input<number>(0);
  root = input<boolean>(false);
  parentKey = input<string>('');

  submenu = viewChild<ElementRef>('submenu');

  active = signal(false);

  menuSourceSubscription: Subscription;
  menuResetSubscription: Subscription;

  key = signal<string>('');

  submenuAnimation = computed(() => {
    if (
      this.layoutService.isDesktop() &&
      (this.layoutService.isHorizontal() ||
        this.layoutService.isSlim() ||
        this.layoutService.isCompact())
    ) {
      return this.active() ? 'visible' : 'hidden';
    } else return this.root() ? 'expanded' : this.active() ? 'expanded' : 'collapsed';
  });

  isSlim = computed(() => this.layoutService.isSlim());
  isCompact = computed(() => this.layoutService.isCompact());
  isHorizontal = computed(() => this.layoutService.isHorizontal());

  get isDesktop() {
    return this.layoutService.isDesktop();
  }

  get isMobile() {
    return this.layoutService.isMobile();
  }

  constructor() {
    this.menuSourceSubscription = this.layoutService.menuSource$.subscribe((value) => {
      Promise.resolve(null).then(() => {
        if (value.routeEvent) {
          this.active.set(
            value.key === this.key() || value.key.startsWith(this.key() + '-') ? true : false,
          );
        } else {
          if (value.key !== this.key() && !value.key.startsWith(this.key() + '-')) {
            this.active.set(false);
          }
        }
      });
    });

    this.menuResetSubscription = this.layoutService.resetSource$.subscribe(() => {
      this.active.set(false);
    });

    this.router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe(() => {
      if (this.isCompact() || this.isSlim() || this.isHorizontal()) {
        this.active.set(false);
      } else {
        if (this.item().routerLink) {
          this.updateActiveStateFromRoute();
        }
      }
    });

    effect(() => {
      if (this.layoutService.isOverlay() && this.layoutService.isSidebarActive()) {
        if (this.item().routerLink) {
          this.updateActiveStateFromRoute();
        }
      }
    });

    // Handle submenu positioning for horizontal/slim/compact modes
    effect(() => {
      if (
        this.submenuAnimation() === 'visible' &&
        this.isDesktop &&
        (this.isHorizontal() || this.isSlim() || this.isCompact())
      ) {
        const submenuEl = this.submenu()?.nativeElement;
        if (submenuEl) {
          this.calculatePosition(submenuEl, submenuEl.parentElement);
        }
      }
    });
  }

  ngOnInit() {
    this.key.set(this.parentKey() ? this.parentKey() + '-' + this.index() : String(this.index()));

    if (!(this.isCompact() || this.isSlim() || this.isHorizontal()) && this.item().routerLink) {
      this.updateActiveStateFromRoute();
    }
  }

  ngAfterViewChecked() {
    if (
      this.root() &&
      this.active() &&
      this.isDesktop &&
      (this.isHorizontal() || this.isSlim() || this.isCompact())
    ) {
      const submenuEl = this.submenu()?.nativeElement;
      if (submenuEl) {
        this.calculatePosition(submenuEl, submenuEl.parentElement);
      }
    }
  }

  updateActiveStateFromRoute() {
    const activeRoute = this.router.isActive(this.item().routerLink[0], {
      paths: 'exact',
      queryParams: 'ignored',
      matrixParams: 'ignored',
      fragment: 'ignored',
    });

    if (activeRoute) {
      this.layoutService.onMenuStateChange({
        key: this.key(),
        routeEvent: true,
      });
    }
  }

  calculatePosition(overlay: HTMLElement, target: HTMLElement) {
    if (overlay) {
      const { left, top } = target.getBoundingClientRect();
      const [vWidth, vHeight] = [window.innerWidth, window.innerHeight];
      const [oWidth, oHeight] = [overlay.offsetWidth, overlay.offsetHeight];
      const scrollbarWidth = DomHandler.calculateScrollbarWidth();
      // reset
      overlay.style.top = '';
      overlay.style.left = '';

      if (this.layoutService.isHorizontal()) {
        const width = left + oWidth + scrollbarWidth;
        overlay.style.left = vWidth < width ? `${left - (width - vWidth)}px` : `${left}px`;
      } else if (this.layoutService.isSlim() || this.layoutService.isCompact()) {
        const height = top + oHeight;
        overlay.style.top = vHeight < height ? `${top - (height - vHeight)}px` : `${top}px`;
      }
    }
  }

  itemClick(event: Event) {
    if (this.item().disabled) {
      event.preventDefault();
      return;
    }

    if ((this.root() && this.isSlim()) || this.isHorizontal() || this.isCompact()) {
      this.layoutService.layoutState.update((val) => ({
        ...val,
        menuHoverActive: !val.menuHoverActive,
      }));
    }

    if (this.item().command) {
      this.item().command!({ originalEvent: event, item: this.item() });
    }

    if (this.item().items) {
      this.active.update((prev) => !prev);

      if (
        this.root() &&
        this.active() &&
        (this.isSlim() || this.isHorizontal() || this.isCompact())
      ) {
        this.layoutService.onOverlaySubmenuOpen();
      }
    } else {
      if (this.layoutService.isMobile()) {
        this.layoutService.layoutState.update((val) => ({
          ...val,
          staticMenuMobileActive: false,
        }));
      }

      if (this.isSlim() || this.isHorizontal() || this.isCompact()) {
        this.layoutService.reset();
        this.layoutService.layoutState.update((val) => ({
          ...val,
          menuHoverActive: false,
        }));
      }
    }

    this.layoutService.onMenuStateChange({ key: this.key() });
  }

  onMouseEnter() {
    if (
      this.root() &&
      (this.isSlim() || this.isHorizontal() || this.isCompact()) &&
      this.layoutService.isDesktop()
    ) {
      if (this.layoutService.layoutState().menuHoverActive) {
        this.active.set(true);
        this.layoutService.onMenuStateChange({ key: this.key() });
      }
    }
  }

  ngOnDestroy() {
    if (this.menuSourceSubscription) {
      this.menuSourceSubscription.unsubscribe();
    }

    if (this.menuResetSubscription) {
      this.menuResetSubscription.unsubscribe();
    }
  }
}
