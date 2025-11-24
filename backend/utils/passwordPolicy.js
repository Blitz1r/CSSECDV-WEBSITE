// Password policy utility: configurable via env, with sane defaults
// Env vars (optional):
//   PASSWORD_MIN_LENGTH (default 12)
//   PASSWORD_MAX_LENGTH (default 128)
//   PASSWORD_REQUIRE_UPPER (default true)
//   PASSWORD_REQUIRE_LOWER (default true)
//   PASSWORD_REQUIRE_DIGIT (default true)
//   PASSWORD_REQUIRE_SPECIAL (default true)

function getPolicy() {
  const envBool = (v, d) => (v === undefined ? d : String(v).toLowerCase() === 'true');
  return {
    minLength: Number(process.env.PASSWORD_MIN_LENGTH) || 8,
    maxLength: Number(process.env.PASSWORD_MAX_LENGTH) || 128,
    requireUpper: envBool(process.env.PASSWORD_REQUIRE_UPPER, true),
    requireLower: envBool(process.env.PASSWORD_REQUIRE_LOWER, true),
    requireDigit: envBool(process.env.PASSWORD_REQUIRE_DIGIT, true),
    requireSpecial: envBool(process.env.PASSWORD_REQUIRE_SPECIAL, true)
  };
}

function validatePassword(password) {
  const p = getPolicy();
  const errors = [];
  if (typeof password !== 'string') {
    return { valid: false, errors: ['Password must be a string'] };
  }
  if (password.length < p.minLength) errors.push(`Password must be at least ${p.minLength} characters long`);
  if (password.length > p.maxLength) errors.push(`Password must be at most ${p.maxLength} characters long`);
  if (p.requireUpper && !/[A-Z]/.test(password)) errors.push('At least one uppercase letter required');
  if (p.requireLower && !/[a-z]/.test(password)) errors.push('At least one lowercase letter required');
  if (p.requireDigit && !/[0-9]/.test(password)) errors.push('At least one digit required');
  if (p.requireSpecial && !/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(password)) errors.push('At least one special character required');
  if (/\s/.test(password)) errors.push('Password may not contain whitespace');
  return { valid: errors.length === 0, errors };
}

function describePolicy() {
  const p = getPolicy();
  const parts = [
    `Length ${p.minLength}-${p.maxLength}`,
    p.requireUpper ? 'uppercase' : null,
    p.requireLower ? 'lowercase' : null,
    p.requireDigit ? 'digit' : null,
    p.requireSpecial ? 'special character' : null,
    'no spaces'
  ].filter(Boolean);
  return `Password must include: ${parts.join(', ')}`;
}

module.exports = { getPolicy, validatePassword, describePolicy };
