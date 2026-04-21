export function isUnauthorizedError(error) {
  return Boolean(
    error?.isUnauthorized ||
      error?.status === 401 ||
      error?.status === 403 ||
      error?.response?.status === 401 ||
      error?.response?.status === 403
  );
}

function getRawErrorMessage(error) {
  return (
    error?.response?.data?.message ||
    error?.body?.message ||
    error?.message ||
    ""
  );
}

function hasMeaningfulMessage(message) {
  if (!message) {
    return false;
  }

  const normalized = String(message).trim().toLowerCase();
  return normalized !== "server error" &&
    normalized !== "network request failed" &&
    normalized !== "failed to fetch";
}

export function getErrorMessage(error, options = {}) {
  const {
    unauthorizedMessage,
    networkMessage,
    serverMessage,
    notFoundMessage,
    fallbackMessage = "Une erreur est survenue.",
  } = options;

  const status = error?.status || error?.response?.status;
  const rawMessage = getRawErrorMessage(error);

  if (isUnauthorizedError(error) && unauthorizedMessage) {
    return unauthorizedMessage;
  }

  if (status === 404 && notFoundMessage) {
    return notFoundMessage;
  }

  if (error?.isNetworkError || (!status && !error?.response)) {
    return networkMessage || fallbackMessage;
  }

  if (status >= 500) {
    return serverMessage || fallbackMessage;
  }

  if (hasMeaningfulMessage(rawMessage)) {
    return rawMessage;
  }

  return fallbackMessage;
}
