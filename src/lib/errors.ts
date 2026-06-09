export function getErrorMessage(error: unknown, fallback = "Erro inesperado.") {
  return error instanceof Error ? error.message : fallback;
}

export function getErrorCode(error: unknown) {
  if (typeof error !== "object" || error === null || !("code" in error)) {
    return undefined;
  }

  const { code } = error as { code?: unknown };
  return typeof code === "string" ? code : undefined;
}

export async function readApiError(response: Response, fallback: string) {
  const data: unknown = await response.json().catch(() => null);

  if (typeof data === "object" && data !== null && "error" in data) {
    const { error } = data as { error?: unknown };
    if (typeof error === "string") {
      return error;
    }
  }

  return fallback;
}
