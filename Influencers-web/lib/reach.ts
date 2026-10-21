export function webLink(value: string) {
  if (/^https?:\/\//i.test(value)) return value;
  if (value.includes('.')) return `https://${value.replace(/^\/+/, '')}`;
  return value;
}

export function whatsappLink(phone: string) {
  let digits = phone.replace(/\D/g, '');
  if (digits.startsWith('00')) digits = digits.slice(2);
  if (digits.startsWith('0')) digits = `964${digits.slice(1)}`;
  return `https://wa.me/${digits}`;
}

export function safeNext(value: string | null, locale: string) {
  if (!value) return '';
  if (!value.startsWith(`/${locale}`)) return '';
  if (value.startsWith('//') || value.includes('://')) return '';
  return value;
}
