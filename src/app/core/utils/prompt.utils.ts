/**
 * Replaces {{ placeholder }} strings in a given template with deeply mapped values
 * from the provided context object.
 *
 * @param template The string containing placeholders (e.g. "Hello {{ user.name }}")
 * @param context The object containing data used in replacement
 * @returns The hydrated string
 */
export function hydratePrompt(template: string, context: Record<string, unknown>): string {
  if (!template) return '';

  return template.replace(/\{\{(?:&nbsp;|\s)*([\w.]+)(?:&nbsp;|\s)*\}\}/g, (match, path) => {
    const keys = path.split('.');
    let value: unknown = context;

    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = (value as Record<string, unknown>)[key];
      } else {
        // If path is not found, leave the placeholder intact.
        return match;
      }
    }

    // Handle various value types
    return typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value);
  });
}
