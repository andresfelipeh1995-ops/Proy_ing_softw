export function normalizeList(data) {
  return Array.isArray(data) ? data : (data?.content ?? []);
}

const moneyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

const compactFormatter = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});

export function formatMoney(value) {
  return moneyFormatter.format(Number(value) || 0);
}

export function formatNumber(value, digits = 2) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: digits,
  }).format(Number(value) || 0);
}

export function formatCompact(value) {
  return compactFormatter.format(Number(value) || 0);
}

export function formatPercent(value, { signed = true } = {}) {
  const number = Number(value) || 0;
  const prefix = signed && number > 0 ? "+" : "";
  return `${prefix}${number.toFixed(2)}%`;
}

export function formatDate(value) {
  if (!value) return "—";
  return new Date(`${value}`.length <= 10 ? `${value}T00:00:00` : value)
    .toLocaleDateString("es-CO", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
    .replace(".", "");
}

export function formatDateTime(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString("es-CO", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

export function formatLongDate(value) {
  if (!value) return "—";

  const label = new Date(
    `${value}`.length <= 10 ? `${value}T00:00:00` : value,
  ).toLocaleDateString("es-CO", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function toNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

export function percentClass(value) {
  const number = Number(value) || 0;
  if (number > 0) return "text-success";
  if (number < 0) return "text-danger";
  return "text-muted";
}
