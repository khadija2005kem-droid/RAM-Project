export function normalizeInvoiceStatus(status) {
  const value = String(status || "").toLowerCase().trim();

  if (value === "paid" || value === "payee" || value === "accepted") return "paid";
  if (value === "pending" || value === "en attente" || value === "en_attente") return "pending";
  if (value === "unpaid" || value === "non payee" || value === "non_payee" || value === "rejected") {
    return "unpaid";
  }

  return value;
}

export function getTranslatedInvoiceStatus(status, t) {
  const normalizedStatus = normalizeInvoiceStatus(status);

  const statusMap = {
    paid: t("status.payee"),
    unpaid: t("status.non_payee"),
    pending: t("status.en_attente"),
  };

  return statusMap[normalizedStatus] || status;
}
