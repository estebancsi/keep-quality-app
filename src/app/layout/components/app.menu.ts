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
      label: 'Worksheets',
      icon: 'pi pi-th-large',
      items: [
        {
          label: 'Instrumental Analysis',
          icon: 'pi pi-fw pi-chart-bar',
          routerLink: ['/worksheets/instrumental'],
        },
        {
          label: 'Dissolution',
          icon: 'pi pi-fw pi-filter',
          routerLink: ['/worksheets/dissolution'],
          visible: false,
        },
        {
          label: 'Volumetry',
          icon: 'pi pi-fw pi-gauge',
          routerLink: ['/worksheets/volumetry'],
          visible: false,
        },
        {
          label: 'Average Weight',
          icon: 'pi pi-fw pi-file',
          routerLink: ['/worksheets/average-weight'],
          visible: false,
        },
      ],
    },
    {
      label: 'Vitalis',
      icon: 'pi pi-fw pi-building',
      items: [
        {
          label: 'Bases de Datos',
          icon: 'pi pi-fw pi-database',
          // visible: await this.authService.checkPermissionAsync(['bases_datos']),
          items: [
            {
              label: 'Muestras FQ',
              icon: 'pi pi-fw pi-database',
              routerLink: ['/vit/bases-datos/muestras-fq'],
              // visible: await this.authService.checkPermissionAsync(['bases_datos.fq']),
            },
            {
              label: 'Microbiología',
              icon: 'pi pi-fw pi-folder',
              // visible: await this.authService.checkPermissionAsync(['bases_datos.mb']),
              items: [
                {
                  label: 'Planes de Trabajo MB',
                  icon: 'pi pi-fw pi-database',
                  routerLink: ['/vit/bases-datos/planes-trabajo-mb'],
                  // visible: await this.authService.checkPermissionAsync(['bases_datos.mb.muestras']),
                },
                {
                  label: 'Muestras MB',
                  icon: 'pi pi-fw pi-database',
                  routerLink: ['/vit/bases-datos/muestras-mb'],
                  // visible: await this.authService.checkPermissionAsync(['bases_datos.mb.muestras']),
                },
                {
                  label: 'Especificaciones MB',
                  icon: 'pi pi-fw pi-database',
                  routerLink: ['/vit/bases-datos/especificaciones-mb'],
                  // visible: await this.authService.checkPermissionAsync([
                  //   'bases_datos.mb.especificaciones',
                  // ]),
                },
              ],
            },
            {
              label: 'Muestras ME',
              icon: 'pi pi-fw pi-database',
              // visible: await this.authService.checkPermissionAsync(['bases_datos.me']),
            },
          ],
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
