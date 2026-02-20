/**
 * This file contains hardcoded dummy JSON objects that implement the respective
 * frontend TypeScript interfaces for the PDF templates.
 * This data is used to generate the Variables tree in the PDF Template Editor,
 * helping users understand the available properties for template schemas.
 */

import { FsCsRequirement } from '@/modules/csv/fs-cs.interface';
import { RiskAnalysisItem } from '@/modules/csv/risk-analysis.interface';
import { UrsRequirement } from '@/modules/csv/urs.interface';

export const TEMPLATE_SCHEMAS: Record<string, unknown> = {
  // Add your dummy data objects here mapped to the template name.
  // Skip the customFields property as it is handled automatically by the service
  // Example:
  // 'my-template': { system: { name: 'Test', prop2: [1, 2] }, items: [{ id: 1 }] } as MyInterface
  'blank-template': {
    title: 'Sample Title',
    user: {
      firstName: 'John',
      lastName: 'Doe',
      roles: ['Admin', 'Manager'],
    },
    items: [
      { id: 1, name: 'Item A', price: 10.5 },
      { id: 2, name: 'Item B', price: 20.0 },
    ],
    metadata: {
      createdAt: '2023-10-27T10:00:00Z',
      isActive: true,
    },
  },
  'csv.urs_artifact': {
    system: {
      name: 'Sample System',
      version: '1.0.0',
      description: 'Sample description',
      category: '4',
    },
    items: [
      {
        code: 1,
        position: 1,
        description: 'Sample description',
        category: 'Functional',
        groupName: 'Sample group',
      },
    ] as UrsRequirement[],
  },
  'csv.spec.functional': {
    system: {
      name: 'Sample System',
      version: '1.0.0',
      description: 'Sample description',
      category: '4',
    },
    items: [
      {
        code: 1,
        position: 1,
        description: 'Sample description',
        groupName: 'Sample group',
      },
    ] as FsCsRequirement[],
  },
  'csv.spec.configuration': {
    system: {
      name: 'Sample System',
      version: '1.0.0',
      description: 'Sample description',
      category: '4',
    },
    items: [
      {
        code: 1,
        position: 1,
        description: 'Sample description',
        groupName: 'Sample group',
      },
    ] as FsCsRequirement[],
  },
  'csv.spec.design': {
    system: {
      name: 'Sample System',
      version: '1.0.0',
      description: 'Sample description',
      category: '4',
    },
    items: [
      {
        code: 1,
        position: 1,
        description: 'Sample description',
        groupName: 'Sample group',
      },
    ] as FsCsRequirement[],
  },
  'csv.risk_analysis_artifact': {
    system: {
      name: 'Sample System',
      version: '1.0.0',
      description: 'Sample description',
      category: '4',
    },
    items: [
      {
        code: 1,
        position: 1,
        failureMode: 'Sample failure mode',
        cause: 'Sample cause',
        effect: 'Sample effect',
        severity: 1,
        probability: 1,
        detectability: 1,
        rpn: 1,
        riskClass: 1,
        mitigation: 'Sample mitigation',
        traceUrs: [],
        traceFsCs: [],
      },
    ] as Partial<RiskAnalysisItem & { traceUrs: string[]; traceFsCs: string[] }>[],
  },
};
