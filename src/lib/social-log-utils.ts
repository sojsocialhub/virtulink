// Helpers for Social Logs: product URL validation and account details text.

export function validateProductUrl(input: unknown): { valid: boolean; url: string } {
  const raw = typeof input === 'string' ? input.trim() : '';
  if (!raw) return { valid: true, url: '' };

  try {
    const parsed = new URL(raw);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return { valid: true, url: raw };
    }
  } catch {
    // Not a valid URL
  }

  return { valid: false, url: '' };
}

export function getAccountDetailsText(account: any): string {
  if (!account || typeof account !== 'object') return '';

  const combined = typeof account.accountDetails === 'string' ? account.accountDetails.trim() : '';
  if (combined) return combined;

  const lines: string[] = [];
  if (account.username) lines.push(`Account: ${account.username}`);
  if (account.email) lines.push(`Email: ${account.email}`);
  if (account.password) lines.push(`Password: ${account.password}`);
  if (account.extraDetails) lines.push(`Details: ${account.extraDetails}`);
  return lines.join('\n');
}
