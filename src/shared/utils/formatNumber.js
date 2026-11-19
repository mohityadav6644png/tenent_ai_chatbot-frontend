export function formatNumber(value, locale = 'en') {
  return new Intl.NumberFormat(locale).format(value);
}
