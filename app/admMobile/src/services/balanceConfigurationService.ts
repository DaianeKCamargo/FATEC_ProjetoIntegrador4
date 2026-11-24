const COLLECTION_POINTS_API_URL = (
  process.env.EXPO_PUBLIC_COLLECTION_POINTS_API_URL ||
  "https://apiqrcodepoints.vercel.app"
).replace(/\/+$/, "");

const BALANCE_URL = "http://192.168.4.1";

type BalanceResponse = {
  message?: string;
  factor?: number;
  measuredWeight?: number;
};

export type CollectionPoint = {
  id: number;
  name: string;
  status: "APROVADO";
  address: {
    street: string;
    number: string;
    district: string;
    city: string;
  };
};

export async function getCollectionPoints(): Promise<CollectionPoint[]> {
  const response = await fetch(`${COLLECTION_POINTS_API_URL}/pontos`);
  const result = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      result?.message || "Não foi possível carregar os pontos de coleta."
    );
  }

  if (!Array.isArray(result)) {
    throw new Error("A API retornou uma lista de pontos inválida.");
  }

  return result;
}

async function postToBalance(
  path: string,
  input: Record<string, string | number>
): Promise<BalanceResponse> {
  const controller = new AbortController();
  const timeoutMs = path === "/calibrate" ? 100000 : 20000;
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${BALANCE_URL}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
      signal: controller.signal,
    });
    const result = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(
        result?.message || "O ESP32 não aceitou a configuração."
      );
    }

    return result ?? {};
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      if (path === "/configure") {
        throw new Error(
          "A balança não confirmou a configuração a tempo. Ela pode ter salvo os dados e reiniciado; aguarde até 30 segundos e verifique se conectou ao Wi-Fi."
        );
      }

      if (path === "/calibrate") {
        throw new Error(
          "A calibragem demorou mais que o esperado. Mantenha o peso parado e tente novamente."
        );
      }

      throw new Error(
        "A balança não respondeu. Conecte o celular à rede TamPets-Config e tente novamente."
      );
    }

    if (
      path === "/configure" &&
      error instanceof Error &&
      /cancel|fetch failed|network request failed/i.test(error.message)
    ) {
      throw new Error(
        "A conexão com a balança foi interrompida antes da confirmação. Ela pode ter salvo os dados e reiniciado; aguarde até 30 segundos e verifique o Wi-Fi."
      );
    }

    if (error instanceof TypeError) {
      if (path === "/configure") {
        throw new Error(
          "A conexão com a balança foi interrompida antes da confirmação. Ela pode ter salvo os dados e reiniciado; aguarde até 30 segundos e verifique o Wi-Fi."
        );
      }

      throw new Error(
        "Não foi possível acessar a balança. Conecte o celular à rede TamPets-Config e tente novamente."
      );
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export async function configureBalance(input: {
  ssid: string;
  password: string;
  pontoId: number;
}): Promise<void> {
  await postToBalance("/configure", {
    ...input,
    pontoId: String(input.pontoId),
  });
}

export async function tareBalance(): Promise<void> {
  await postToBalance("/tare", {});
}

export async function calibrateBalance(
  referenceWeight: number
): Promise<{ factor: number; measuredWeight: number }> {
  const result = await postToBalance("/calibrate", { referenceWeight });

  if (typeof result.factor !== "number" || !Number.isFinite(result.factor)) {
    throw new Error("A balança não retornou um fator de calibração válido.");
  }

  if (
    typeof result.measuredWeight !== "number" ||
    !Number.isFinite(result.measuredWeight)
  ) {
    throw new Error("A balança não retornou a leitura verificada do peso.");
  }

  return {
    factor: result.factor,
    measuredWeight: result.measuredWeight,
  };
}
