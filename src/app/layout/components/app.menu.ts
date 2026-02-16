import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AppMenuitem } from './app.menuitem';

@Component({
  selector: '[app-menu]',
  imports: [CommonModule, AppMenuitem, RouterModule],
  template: `
    <ul class="layout-menu">
      @for (item of model(); track item; let i = $index) {
        @if (!item.separator) {
          <li app-menuitem [item]="item" [index]="i" [root]="true"></li>
        }
        @if (item.separator) {
          <li class="menu-separator"></li>
        }
      }
    </ul>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppMenu {
  readonly model = signal<any[]>([
    {
      label: 'Main',
      icon: 'pi pi-home',
      items: [
        {
          label: 'Dashboard',
          icon: 'pi pi-fw pi-home',
          routerLink: ['/home'],
        },
      ],
    },
    {
      label: 'CSV',
      icon: 'pi pi-th-large',
      items: [
        {
          label: 'Computerized Systems',
          icon: 'pi pi-fw pi-desktop',
          routerLink: ['/csv'],
        },
      ],
    },
    {
      label: 'Management',
      icon: 'pi pi-fw pi-cog',
      items: [
        {
          label: 'PDF Templates',
          icon: 'pi pi-fw pi-file-pdf',
          routerLink: ['/pdf-templates'],
        },
      ],
    },
    {
      label: 'Organization',
      icon: 'pi pi-fw pi-building',
      items: [
        {
          label: 'Organization Settings',
          icon: 'pi pi-fw pi-building',
          routerLink: ['/organization/settings'],
        },
        {
          label: 'Users',
          icon: 'pi pi-fw pi-users',
          routerLink: ['/organization/users'],
        },
        {
          label: 'Audit Trail',
          icon: 'pi pi-fw pi-shield',
          routerLink: ['/audit-trail'],
        },
      ],
    },
  ]);
}
