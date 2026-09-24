// List of common disposable/temporary email domains to block
const DISPOSABLE_DOMAINS = new Set([
  "tempmail.com",
  "temp-mail.org",
  "10minutemail.com",
  "10minutemail.net",
  "mailinator.com",
  "guerrillamail.com",
  "guerrillamailblock.com",
  "sharklasers.com",
  "throwawaymail.com",
  "yopmail.com",
  "yopmail.fr",
  "dispostable.com",
  "trashmail.com",
  "getairmail.com",
  "fakemailgenerator.com",
  "emailondeck.com",
  "generator.email",
  "crazymailing.com",
  "fakeinbox.com",
  "armyspy.com",
  "cuvox.de",
  "dayrep.com",
  "fleckens.hu",
  "gustr.com",
  "jourrapide.com",
  "rhyta.com",
  "superrito.com",
  "teleworm.us",
  "tinemail.com",
  "mytemp.email",
  "tempail.com",
  "mohmal.com",
  "inboxkitten.com",
  "burnerdkim.com",
]);

// Common placeholder/mock domains
const PLACEHOLDER_DOMAINS = new Set([
  "example.com",
  "test.com",
  "fake.com",
  "sample.com",
  "mock.com",
  "dummy.com",
]);

// Common typo corrections for major email providers
const COMMON_TYPOS = {
  "gmial.com": "gmail.com",
  "gamil.com": "gmail.com",
  "gmai.com": "gmail.com",
  "gmaill.com": "gmail.com",
  "gmeil.com": "gmail.com",
  "gmail.con": "gmail.com",
  "gmail.co": "gmail.com",
  "gmaik.com": "gmail.com",
  "gmai.co": "gmail.com",
  "hotmial.com": "hotmail.com",
  "hotmaill.com": "hotmail.com",
  "yaho.com": "yahoo.com",
  "yahooo.com": "yahoo.com",
  "outlok.com": "outlook.com",
  "iclud.com": "icloud.com",
};

/**
 * Validates whether an email/Gmail address is well-formed, plausible, and real.
 * Returns { isValid: boolean, error?: string, suggestion?: string }
 */
export function validateEmail(email) {
  if (!email || typeof email !== "string") {
    return { isValid: false, error: "Email address is required." };
  }

  const clean = email.trim().toLowerCase();

  // Basic RFC 5322-compatible pattern with valid TLD of at least 2 chars
  const basicRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  if (!basicRegex.test(clean)) {
    return { isValid: false, error: "Please enter a valid email address (e.g. name@example.com)." };
  }

  const parts = clean.split("@");
  if (parts.length !== 2) {
    return { isValid: false, error: "Email must contain exactly one '@' sign." };
  }

  const [username, domain] = parts;

  // Check for common domain typos
  if (COMMON_TYPOS[domain]) {
    const correction = `${username}@${COMMON_TYPOS[domain]}`;
    return {
      isValid: false,
      error: `Did you mean ${COMMON_TYPOS[domain]}?`,
      suggestion: correction,
    };
  }

  // Check TLD validity
  const domainParts = domain.split(".");
  const tld = domainParts[domainParts.length - 1];
  if (!tld || tld.length < 2 || !/^[a-z]+$/.test(tld)) {
    return { isValid: false, error: "Email domain has an invalid extension (e.g. .com, .org)." };
  }

  // Block disposable/temporary emails
  if (DISPOSABLE_DOMAINS.has(domain)) {
    return {
      isValid: false,
      error: "Temporary or disposable email addresses are not accepted. Please provide a real email.",
    };
  }

  // Block placeholder/test domains
  if (PLACEHOLDER_DOMAINS.has(domain)) {
    return {
      isValid: false,
      error: "Please enter your real personal or work email address.",
    };
  }

  // --- Strict Gmail Verification Rules ---
  if (domain === "gmail.com" || domain === "googlemail.com") {
    // Gmail characters rule: only alphanumeric and periods allowed
    if (!/^[a-z0-9.]+$/.test(username)) {
      return {
        isValid: false,
        error: "Gmail usernames can only contain letters, numbers, and periods (no special symbols).",
      };
    }

    // Cannot start or end with a period
    if (username.startsWith(".") || username.endsWith(".")) {
      return {
        isValid: false,
        error: "Gmail username cannot begin or end with a period.",
      };
    }

    // Cannot contain consecutive periods
    if (username.includes("..")) {
      return {
        isValid: false,
        error: "Gmail username cannot contain consecutive periods.",
      };
    }

    // Google requires Gmail usernames to be between 6 and 30 characters (periods do not count towards length in Gmail)
    const normalizedLength = username.replace(/\./g, "").length;
    if (normalizedLength < 6) {
      return {
        isValid: false,
        error: `Gmail usernames must be at least 6 characters long (currently ${normalizedLength}).`,
      };
    }
    if (normalizedLength > 30) {
      return {
        isValid: false,
        error: `Gmail usernames cannot exceed 30 characters (currently ${normalizedLength}).`,
      };
    }
  }

  return { isValid: true };
}
