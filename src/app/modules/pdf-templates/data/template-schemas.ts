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
    organization: { id: 'org-123', name: 'Sample Organization' },
    lifecycle: {
      code: 1001,
      type: 'validation',
      status: 'in_progress',
      startDate: '2024-01-01',
      targetCompletionDate: '2024-12-31',
      actualCompletionDate: '2024-11-30',
      assignedTo: 'user-1',
      assignedToName: 'John Doe',
      notes: 'Sample notes',
    },
    system: {
      name: 'Sample System',
      code: 'SYS-001',
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
    organization: { id: 'org-123', name: 'Sample Organization' },
    lifecycle: {
      code: 1001,
      type: 'validation',
      status: 'in_progress',
      startDate: '2024-01-01',
      targetCompletionDate: '2024-12-31',
      actualCompletionDate: '2024-11-30',
      assignedTo: 'user-1',
      assignedToName: 'John Doe',
      notes: 'Sample notes',
    },
    system: {
      name: 'Sample System',
      code: 'SYS-001',
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
    organization: { id: 'org-123', name: 'Sample Organization' },
    lifecycle: {
      code: 1001,
      type: 'validation',
      status: 'in_progress',
      startDate: '2024-01-01',
      targetCompletionDate: '2024-12-31',
      actualCompletionDate: '2024-11-30',
      assignedTo: 'user-1',
      assignedToName: 'John Doe',
      notes: 'Sample notes',
    },
    system: {
      name: 'Sample System',
      code: 'SYS-001',
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
    organization: { id: 'org-123', name: 'Sample Organization' },
    lifecycle: {
      code: 1001,
      type: 'validation',
      status: 'in_progress',
      startDate: '2024-01-01',
      targetCompletionDate: '2024-12-31',
      actualCompletionDate: '2024-11-30',
      assignedTo: 'user-1',
      assignedToName: 'John Doe',
      notes: 'Sample notes',
    },
    system: {
      name: 'Sample System',
      code: 'SYS-001',
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
    organization: { id: 'org-123', name: 'Sample Organization' },
    lifecycle: {
      code: 1001,
      type: 'validation',
      status: 'in_progress',
      startDate: '2024-01-01',
      targetCompletionDate: '2024-12-31',
      actualCompletionDate: '2024-11-30',
      assignedTo: 'user-1',
      assignedToName: 'John Doe',
      notes: 'Sample notes',
    },
    system: {
      name: 'Sample System',
      code: 'SYS-001',
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
  'csv.validation_plan': {
    organization: { id: 'org-123', name: 'Sample Organization' },
    lifecycle: {
      code: 1001,
      type: 'validation',
      status: 'in_progress',
      startDate: '2024-01-01',
      targetCompletionDate: '2024-12-31',
      actualCompletionDate: '2024-11-30',
      assignedTo: 'user-1',
      assignedToName: 'John Doe',
      notes: 'Sample notes',
    },
    system: {
      name: 'Sample System',
      code: 'SYS-001',
      version: '1.0.0',
      description: 'Sample description',
      category: '4',
    },
    items: [],
  },
  'csv.test_protocol.iq': {
    organization: { id: 'org-123', name: 'Sample Organization' },
    lifecycle: {
      code: 1001,
      type: 'validation',
      status: 'in_progress',
      startDate: '2024-01-01',
      targetCompletionDate: '2024-12-31',
      actualCompletionDate: '2024-11-30',
      assignedTo: 'user-1',
      assignedToName: 'John Doe',
      notes: 'Sample notes',
    },
    system: {
      name: 'Sample System',
      code: 'SYS-001',
      version: '1.0.0',
      description: 'Sample description',
      category: '4',
    },
    items: [
      {
        id: 'verification-1',
        title: 'Sample Verification',
        testSteps: [
          {
            id: 'step-1',
            description: 'Sample Step',
            expectedResult: 'Sample Expected Result',
          },
        ],
      },
    ],
  },
  'csv.test_protocol.oq': {
    organization: { id: 'org-123', name: 'Sample Organization' },
    lifecycle: {
      code: 1001,
      type: 'validation',
      status: 'in_progress',
      startDate: '2024-01-01',
      targetCompletionDate: '2024-12-31',
      actualCompletionDate: '2024-11-30',
      assignedTo: 'user-1',
      assignedToName: 'John Doe',
      notes: 'Sample notes',
    },
    system: {
      name: 'Sample System',
      code: 'SYS-001',
      version: '1.0.0',
      description: 'Sample description',
      category: '4',
    },
    items: [
      {
        id: 'verification-1',
        title: 'Sample Verification',
        testSteps: [
          {
            id: 'step-1',
            description: 'Sample Step',
            expectedResult: 'Sample Expected Result',
          },
        ],
      },
    ],
  },
  'csv.test_protocol.pq': {
    organization: { id: 'org-123', name: 'Sample Organization' },
    lifecycle: {
      code: 1001,
      type: 'validation',
      status: 'in_progress',
      startDate: '2024-01-01',
      targetCompletionDate: '2024-12-31',
      actualCompletionDate: '2024-11-30',
      assignedTo: 'user-1',
      assignedToName: 'John Doe',
      notes: 'Sample notes',
    },
    system: {
      name: 'Sample System',
      code: 'SYS-001',
      version: '1.0.0',
      description: 'Sample description',
      category: '4',
    },
    items: [
      {
        id: 'verification-1',
        title: 'Sample Verification',
        testSteps: [
          {
            id: 'step-1',
            description: 'Sample Step',
            expectedResult: 'Sample Expected Result',
          },
        ],
      },
    ],
  },
};
