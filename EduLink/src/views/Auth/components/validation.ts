
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// ── Registration password (strict) ────────────────────────────────────
export const validatePassword = (password: string): boolean => {
  const passwordRegex = /^(?=.*[0-9])(?=.*[!@#$%^&*(),.?":{}|<>])(?=.*[a-z])(?=.*[A-Z]).{8,}$/;
  return passwordRegex.test(password);
};
export const isLongEnough = (password: string): boolean => password.length >= 8;
export const hasNumber = (password: string): boolean => /\d/.test(password);
export const hasSymbol = (password: string): boolean => /[!@#$%^&*(),.?":{}|<>]/.test(password);
export const passwordsMatch = (password: string, confirmPassword: string): boolean => !!password && !!confirmPassword && password === confirmPassword;
export const isDisabled = (password: string, confirmPassword: string): boolean => !isLongEnough(password) || !hasNumber(password) || !hasSymbol(password) || !passwordsMatch(password, confirmPassword);

// ── Reset password (lenient — backend only requires 6+ chars) ────────
export const resetLongEnough = (password: string): boolean => password.length >= 6;
export const resetIsDisabled = (password: string, confirmPassword: string): boolean => !resetLongEnough(password) || !passwordsMatch(password, confirmPassword);
