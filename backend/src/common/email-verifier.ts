import * as dns from 'node:dns/promises';
import { BadRequestException } from '@nestjs/common';

const DISPOSABLE_DOMAINS = new Set([
  'tempmail.com',
  'temp-mail.org',
  '10minutemail.com',
  '10minutemail.net',
  'mailinator.com',
  'guerrillamail.com',
  'sharklasers.com',
  'throwawaymail.com',
  'yopmail.com',
  'dispostable.com',
  'trashmail.com',
  'emailondeck.com',
  'generator.email',
  'fakeinbox.com',
  'mohmal.com',
]);

const PLACEHOLDER_DOMAINS = new Set([
  'example.com',
  'test.com',
  'fake.com',
  'sample.com',
  'dummy.com',
]);

const TYPO_DOMAINS: Record<string, string> = {
  'gmial.com': 'gmail.com',
  'gamil.com': 'gmail.com',
  'gmai.com': 'gmail.com',
  'gmaill.com': 'gmail.com',
  'gmeil.com': 'gmail.com',
  'gmail.con': 'gmail.com',
  'gmail.co': 'gmail.com',
  'hotmial.com': 'hotmail.com',
  'yaho.com': 'yahoo.com',
  'outlok.com': 'outlook.com',
};

/**
 * Validates whether an email/Gmail address is real, has correct syntax,
 * follows Gmail username policies, and has active DNS MX records.
 */
export async function verifyRealEmail(email?: string): Promise<void> {
  if (!email || !email.trim()) return;

  const clean = email.trim().toLowerCase();

  // Basic RFC format
  const basicRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  if (!basicRegex.test(clean)) {
    throw new BadRequestException('Invalid email address format.');
  }

  const [username, domain] = clean.split('@');

  // Check typo
  if (TYPO_DOMAINS[domain]) {
    throw new BadRequestException(
      `Invalid email domain. Did you mean ${TYPO_DOMAINS[domain]}?`,
    );
  }

  // Block disposable and placeholder domains
  if (DISPOSABLE_DOMAINS.has(domain)) {
    throw new BadRequestException(
      'Temporary and disposable email addresses are not permitted. Please provide a real email.',
    );
  }

  if (PLACEHOLDER_DOMAINS.has(domain)) {
    throw new BadRequestException(
      'Please provide your genuine personal or contact email address.',
    );
  }

  // Strict Gmail rules
  if (domain === 'gmail.com' || domain === 'googlemail.com') {
    if (!/^[a-z0-9.]+$/.test(username)) {
      throw new BadRequestException(
        'Gmail addresses can only contain letters, numbers, and periods.',
      );
    }
    if (username.startsWith('.') || username.endsWith('.')) {
      throw new BadRequestException(
        'Gmail addresses cannot start or end with a period.',
      );
    }
    if (username.includes('..')) {
      throw new BadRequestException(
        'Gmail addresses cannot contain consecutive periods.',
      );
    }

    const lengthWithoutDots = username.replace(/\./g, '').length;
    if (lengthWithoutDots < 6) {
      throw new BadRequestException(
        `Gmail username must be at least 6 characters long (got ${lengthWithoutDots}).`,
      );
    }
    if (lengthWithoutDots > 30) {
      throw new BadRequestException(
        `Gmail username cannot exceed 30 characters (got ${lengthWithoutDots}).`,
      );
    }
  }

  // DNS MX Record lookup (verifies domain actively receives emails)
  try {
    const records = await dns.resolveMx(domain);
    if (!records || records.length === 0) {
      throw new BadRequestException(
        `The email domain '@${domain}' does not have active mail servers (no MX records found).`,
      );
    }
  } catch (err) {
    if (err instanceof BadRequestException) throw err;
    throw new BadRequestException(
      `The email domain '@${domain}' does not exist or cannot receive mail.`,
    );
  }
}
