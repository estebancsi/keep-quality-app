import {
  Component,
  output,
  model,
  computed,
  signal,
  ChangeDetectionStrategy,
  effect,
  input,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { TreeModule } from 'primeng/tree';
import { TreeNode } from 'primeng/api';
import {
  ExportData,
  ExportUrsRequirement,
  ExportFsCsRequirement,
} from '../../services/artifact-import-export.service';

@Component({
  selector: 'app-artifact-import-dialog',
  imports: [CommonModule, DialogModule, ButtonModule, TreeModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p-dialog
      header="Import Artifacts"
      [(visible)]="visible"
      [modal]="true"
      [style]="{ width: '60vw' }"
      [draggable]="false"
      [resizable]="false"
      (onHide)="onHide()"
    >
      <div class="flex flex-col gap-4">
        <p class="text-surface-600 dark:text-surface-300">
          Select the items you want to import. Tracing relationships will be preserved for selected
          items. Unselected URS requirements will result in broken traces for dependent FS/CS
          requirements.
        </p>

        <div class="flex gap-2">
          <p-button
            label="Select All"
            icon="pi pi-check-square"
            size="small"
            [text]="true"
            (click)="selectAll()"
          />
          <p-button
            label="Deselect All"
            icon="pi pi-stop"
            size="small"
            [text]="true"
            (click)="deselectAll()"
            severity="secondary"
          />
        </div>

        <div class="border rounded-md p-2 h-96 overflow-y-auto">
          <p-tree
            [value]="nodes()"
            selectionMode="checkbox"
            [selection]="selectedNodes()"
            (selectionChange)="onSelectionChange($event)"
            [filter]="true"
            filterMode="strict"
            placeholder="Filter items..."
          />
        </div>

        <div class="flex justify-end gap-2 mt-4">
          <p-button label="Cancel" (click)="close()" severity="secondary" [text]="true" />
          <p-button
            label="Import Selected"
            (click)="confirmImport()"
            [disabled]="selectedNodes().length === 0"
          />
        </div>
      </div>
    </p-dialog>
  `,
})
export class ArtifactImportDialogComponent {
  visible = model(false);
  importData = input<ExportData | null>(null);

  confirm = output<{
    ursReqsToImport: ExportUrsRequirement[];
    fsCsReqsToImport: ExportFsCsRequirement[];
  }>();

  selectedNodes = signal<TreeNode[]>([]);

  nodes = computed(() => {
    const data = this.importData();
    if (!data) return [];

    return this.buildTree(data);
  });

  constructor() {
    // Effect to auto-select all nodes when the 'nodes' computed signal changes
    effect(
      () => {
        const currentNodes = this.nodes();
        if (currentNodes.length > 0) {
          this.selectedNodes.set(this.getAllNodes(currentNodes));
        } else {
          this.selectedNodes.set([]);
        }
      },
      { allowSignalWrites: true },
    );
  }

  close(): void {
    this.visible.set(false);
  }

  selectAll(): void {
    this.selectedNodes.set(this.getAllNodes(this.nodes()));
  }

  deselectAll(): void {
    this.selectedNodes.set([]);
  }

  onHide(): void {
    this.visible.set(false);
  }

  onSelectionChange(event: unknown): void {
    if (Array.isArray(event)) {
      this.selectedNodes.set(event as TreeNode[]);
    } else if (event) {
      this.selectedNodes.set([event as TreeNode]);
    } else {
      this.selectedNodes.set([]);
    }
  }

  confirmImport(): void {
    const ursReqsToImport: ExportUrsRequirement[] = [];
    const fsCsReqsToImport: ExportFsCsRequirement[] = [];

    const selected = this.selectedNodes();
    if (!selected) return;

    selected.forEach((node) => {
      if (node.data) {
        if (node.data.type === 'URS') {
          ursReqsToImport.push(node.data.req);
        } else if (node.data.type === 'FS_CS') {
          fsCsReqsToImport.push(node.data.req);
        }
      }
    });

    this.confirm.emit({
      ursReqsToImport,
      fsCsReqsToImport,
    });
    this.close();
  }

  private buildTree(data: ExportData): TreeNode[] {
    const rootNodes: TreeNode[] = [];

    if (data.urs?.requirements?.length) {
      const ursChildren: TreeNode[] = data.urs.requirements.map((req) => ({
        label: `[${req.code}] ${req.category} - ${req.description.substring(0, 50)}${req.description.length > 50 ? '...' : ''}`,
        data: { type: 'URS', req },
        key: `urs_${req.tempId}`,
        leaf: true,
      }));

      rootNodes.push({
        label: 'User Requirements (URS)',
        expanded: true,
        children: ursChildren,
        key: 'root_urs',
        selectable: true,
      });
    }

    if (data.fsCs?.requirements?.length) {
      const types = new Set(data.fsCs.requirements.map((r) => r.reqType));
      const fsCsRootChildren: TreeNode[] = [];

      types.forEach((type) => {
        const typeReqs = data.fsCs!.requirements.filter((r) => r.reqType === type);
        const children: TreeNode[] = typeReqs.map((req, idx) => ({
          label: `[${req.code}] ${req.category ? req.category + ' - ' : ''}${req.description.substring(0, 50)}...`,
          data: { type: 'FS_CS', req },
          key: `fscs_${type}_${idx}`,
          leaf: true,
        }));

        fsCsRootChildren.push({
          label: `${type} Specifications`,
          expanded: true,
          children: children,
          key: `group_${type}`,
          selectable: true,
        });
      });

      rootNodes.push({
        label: 'Functional / Config / Design Specs',
        expanded: true,
        children: fsCsRootChildren,
        key: 'root_fscs',
        selectable: true,
      });
    }

    return rootNodes;
  }

  private getAllNodes(nodes: TreeNode[]): TreeNode[] {
    let all: TreeNode[] = [];
    for (const node of nodes) {
      all.push(node);
      if (node.children) {
        all = all.concat(this.getAllNodes(node.children));
      }
    }
    return all;
  }
}
