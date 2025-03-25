interface ModbusRequestParams {
  connectionType?: string
  host?: string
  port?: number
  start: number
  length: number
  functionType: string
  writeData?: string
}

export async function fetchModbusLogs(params: {
  limit?: number;
  host?: string;
  functionType?: string;
  isSuccess?: boolean;
}) {
  try {
    const queryParams = new URLSearchParams();
    if (params.limit) queryParams.set('limit', params.limit.toString());
    if (params.host) queryParams.set('host', params.host);
    if (params.functionType) queryParams.set('functionType', params.functionType);
    if (params.isSuccess !== undefined) queryParams.set('isSuccess', params.isSuccess.toString());

    const url = `/api/modbus?${queryParams.toString()}`;
    const response = await fetch(url);

    if (!response.ok) {
      const errorText = await response.text();
      try {
        const errorJson = JSON.parse(errorText);
        throw new Error(errorJson.error || `Erro no servidor: ${response.status}`);
      } catch (parseError) {
        throw new Error(`Erro no servidor: ${errorText || response.statusText || response.status}`);
      }
    }

    return await response.json();
  } catch (error: any) {
    console.error("Erro ao pegar logs do Modbus:", error);
    throw new Error(error.message || "Erro de conexão.");
  }
}

export async function updateModbusLogResponse(logId: number, enrichedData: any) {
  try {
    const response = await fetch(`/api/modbus/${logId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enrichedData }),
    });

    if (!response.ok) {
      console.error("Falha ao atualizar a resposta dos logs Modbus");
    }

    return await response.json();
  } catch (error: any) {
    console.error("Falha ao atualizar os logs Modbus:", error);
  }
}

export async function fetchModbusData(params: ModbusRequestParams) {
  try {
    const requestParams = {
      connectionType: "tcp",
      ...params,
    }

    const response = await fetch("/api/modbus", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestParams),
    })

    if (!response.ok) {
      const errorText = await response.text()
      try {
        const errorJson = JSON.parse(errorText)
        throw new Error(errorJson.error || `Erro no servidor: ${response.status}`)
      } catch (parseError) {
        throw new Error(`Erro no servidor: ${errorText || response.statusText || response.status}`)
      }
    }

    return await response.json()
  } catch (error: any) {
    console.error("Erro ao pegar os dados Modbus:", error)
    throw new Error(error.message || "Erro de conexão.")
  }
}