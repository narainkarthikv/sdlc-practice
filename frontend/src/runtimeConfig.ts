function readConfiguredValue(value: string | undefined, fallback: string) {
  const trimmed = value?.trim();
  return trimmed || fallback;
}

export const apiBaseUrl = readConfiguredValue(import.meta.env.VITE_API_BASE_URL, "/api");

export const agentBaseUrl = readConfiguredValue(import.meta.env.VITE_AGENT_BASE_URL, "/agents");
