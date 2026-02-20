/**
 * This file contains hardcoded dummy JSON objects that implement the respective
 * frontend TypeScript interfaces for the PDF templates.
 * This data is used to generate the Variables tree in the PDF Template Editor,
 * helping users understand the available properties for Scriban schemas.
 */

export const TEMPLATE_SCHEMAS: Record<string, unknown> = {
  // Add your dummy data objects here mapped to the template name.
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
};
