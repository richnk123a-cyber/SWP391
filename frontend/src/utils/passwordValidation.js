export function getPasswordError(password) {
  if (!password) return 'Vui lòng nhập mật khẩu.';
  const missing = [];
  if (password.length < 8) missing.push('ít nhất 8 ký tự');
  if (!/[A-Z]/.test(password)) missing.push('1 chữ hoa');
  if (!/[a-z]/.test(password)) missing.push('1 chữ thường');
  if (!/[0-9]/.test(password)) missing.push('1 chữ số');
  if (!/[^A-Za-z0-9\s]/.test(password)) missing.push('1 ký tự đặc biệt');
  if (password.length > 100) return 'Mật khẩu không được vượt quá 100 ký tự.';
  return missing.length ? `Mật khẩu cần có ${missing.join(', ')}.` : '';
}
