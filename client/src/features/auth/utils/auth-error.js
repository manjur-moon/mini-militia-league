export function getAuthErrorMessage(error, fallbackMessage) {
  return error?.message ?? error?.error?.message ?? fallbackMessage;
}
