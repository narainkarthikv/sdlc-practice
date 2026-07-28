type RuntimeAppConfig = {
  VITE_API_BASE_URL?: string;
  VITE_AGENT_BASE_URL?: string;
};

declare global {
  interface Window {
    __APP_CONFIG__?: RuntimeAppConfig;
  }
}

function readRuntimeConfig(): RuntimeAppConfig {
  if (typeof window === "undefined") {
    return {};
  }

  return window.__APP_CONFIG__ ?? {};
}

function readConfiguredValue(
  runtimeValue: string | undefined,
  buildValue: string | undefined,
  fallback: string
) {
  const value = runtimeValue?.trim() || buildValue?.trim();
  return value || fallback;
}

export const apiBaseUrl = readConfiguredValue(
  readRuntimeConfig().VITE_API_BASE_URL,
  import.meta.env.VITE_API_BASE_URL,
  "https://todo-backend-143058686948.asia-south1.run.app"
);

export const agentBaseUrl = readConfiguredValue(
  readRuntimeConfig().VITE_AGENT_BASE_URL,
  import.meta.env.VITE_AGENT_BASE_URL,
  "https://todo-agents-143058686948.asia-south1.run.app"
);
