import type { Node } from '../types';

/**
 * Extract node ID from a link endpoint
 * Handles both object references and string/number IDs
 */
export const getLinkId = (linkEnd: Node | string | number): string => {
  if (typeof linkEnd === 'object' && linkEnd !== null) {
    return (linkEnd as Node).id;
  }
  return String(linkEnd);
};
