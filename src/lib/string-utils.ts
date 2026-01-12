/**
 * Removes all dashes from a string
 * @param str - The input string
 * @returns The string with all dashes removed
 */
export function removeDashes(str: string): string {
  return str.replace(/-/g, '');
}

/**
 * Formats a UUID string by adding dashes in the correct positions
 * @param uuid - A 32-character UUID string without dashes
 * @returns The formatted UUID string with dashes (xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)
 * @example
 * formatUuid('d92eab24196548e591214f71fc0e766c') // Returns 'd92eab24-1965-48e5-9121-4f71fc0e766c'
 */
export function formatUuid(uuid: string): string {
  if (uuid.length !== 32) {
    throw new Error(`Invalid UUID length: expected 32 characters, got ${uuid.length}`);
  }

  return `${uuid.slice(0, 8)}-${uuid.slice(8, 12)}-${uuid.slice(12, 16)}-${uuid.slice(16, 20)}-${uuid.slice(20)}`;
}
