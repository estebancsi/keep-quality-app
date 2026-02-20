import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TreeModule } from 'primeng/tree';
import { TreeNode, MessageService } from 'primeng/api';
import { TooltipModule } from 'primeng/tooltip';

@Component({
  selector: 'app-template-variables',
  standalone: true,
  imports: [CommonModule, TreeModule, TooltipModule],
  template: `
    <div class="p-3">
      <p class="text-sm text-surface-500 mb-3">
        Click on a variable to copy its Scriban syntax to your clipboard.
      </p>

      @if (treeNodes().length > 0) {
        <p-tree
          [value]="treeNodes()"
          selectionMode="single"
          (onNodeSelect)="onNodeSelect($event)"
          styleClass="w-full border-none p-0 bg-transparent"
        >
          <ng-template let-node pTemplate="default">
            <div
              class="flex items-center justify-between w-full"
              [pTooltip]="node.data.syntax"
              tooltipPosition="top"
            >
              <span class="font-medium font-mono text-sm">{{ node.label }}</span>
              @if (node.data.value !== null) {
                <span class="text-xs text-surface-400 truncate max-w-[150px] ml-2">
                  (e.g., {{ node.data.value }})
                </span>
              }
            </div>
          </ng-template>
        </p-tree>
      } @else {
        <div class="text-center p-4 text-surface-500">No variables found for this template.</div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TemplateVariables {
  private messageService = inject(MessageService);

  readonly schema = input<unknown>(null);

  readonly treeNodes = computed<TreeNode[]>(() => {
    const data = this.schema();
    if (!data || typeof data !== 'object') {
      return [];
    }
    return this.buildTree(data);
  });

  onNodeSelect(event: { originalEvent: Event; node: TreeNode }) {
    const node = event.node;
    if (node && node.data && node.data.syntax) {
      navigator.clipboard.writeText(node.data.syntax).then(() => {
        this.messageService.add({
          severity: 'info',
          summary: 'Copied',
          detail: 'Scriban syntax copied to clipboard',
          life: 2000,
        });
      });
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private buildTree(obj: any, parentPath = '', loopVar = ''): TreeNode[] {
    if (!obj || typeof obj !== 'object') return [];

    const nodes: TreeNode[] = [];
    const keys = Object.keys(obj);

    for (const key of keys) {
      const value = obj[key];
      const isArray = Array.isArray(value);

      let currentPath = '';
      if (loopVar) {
        currentPath = `${loopVar}.${key}`;
      } else if (parentPath) {
        currentPath = `${parentPath}.${key}`;
      } else {
        currentPath = key;
      }

      let scribanSyntax = '';
      if (isArray) {
        const nextLoopVar = key.endsWith('s') ? key.slice(0, -1) : `${key}_item`;
        scribanSyntax = `{{ for ${nextLoopVar} in ${currentPath} }}\n  ... \n{{ end }}`;
      } else {
        scribanSyntax = `{{ ${currentPath} }}`;
      }

      const node: TreeNode = {
        label: key,
        data: {
          path: currentPath,
          syntax: scribanSyntax,
          type: isArray ? 'array' : typeof value,
          value: typeof value !== 'object' ? String(value) : null,
        },
        expanded: true,
        icon: isArray
          ? 'pi pi-list font-semibold text-primary'
          : typeof value === 'object' && value !== null
            ? 'pi pi-folder font-semibold text-orange-500'
            : 'pi pi-tag font-semibold text-green-500',
      };

      if (isArray && value.length > 0) {
        const nextLoopVar = key.endsWith('s') ? key.slice(0, -1) : `${key}_item`;
        node.children = this.buildTree(value[0], currentPath, nextLoopVar);
      } else if (typeof value === 'object' && value !== null && !isArray) {
        node.children = this.buildTree(value, currentPath, '');
      }

      nodes.push(node);
    }

    return nodes;
  }
}
