import { type NextRequest, NextResponse } from "next/server"
import { logModbusRequest } from "@/lib/db/modbus-repository"
import { prisma } from "@/lib/db"

const DEFAULT_HOST = process.env.DEFAULT_HOST || "192.168.2.88"
const DEFAULT_PORT = process.env.DEFAULT_PORT || "502"
const CONNECTION_TIMEOUT_MS = parseInt(process.env.CONNECTION_TIMEOUT_MS || "10000", 10)

type ModbusRequestResult = {
  metrics: any
  response: {
    body: {
      valuesAsArray?: any[]
      valuesAsBuffer?: Buffer
    }
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const limit = parseInt(searchParams.get("limit") || "50")
    const host = searchParams.get("host")
    const functionType = searchParams.get("functionType")
    const isSuccess =
        searchParams.get("isSuccess") === "true"
            ? true
            : searchParams.get("isSuccess") === "false"
                ? false
                : undefined

    const where: any = {}
    if (host) where.host = host
    if (functionType) where.functionType = functionType
    if (isSuccess !== undefined) where.isSuccess = isSuccess

    const logs = await prisma.modbusLog.findMany({
      where,
      orderBy: {
        timestamp: "desc",
      },
      take: Math.min(limit, 100),
    })

    return NextResponse.json({ success: true, data: logs })
  } catch (error: any) {
    console.error("Erro ao buscar logs Modbus:", error)
    return NextResponse.json(
        { success: false, error: error.message || "Falha ao buscar logs" },
        { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  let requestData: {
    host: string;
    port: number;
    functionType: string;
    startAddress: number;
    length: number;
    writeData: string | undefined;
  } = {
    host: DEFAULT_HOST,
    port: parseInt(DEFAULT_PORT),
    functionType: "",
    startAddress: 0,
    length: 0,
    writeData: undefined
  }

  try {
    const body = await request.json()

    const connectionType: string = body.connectionType ?? "tcp"
    const host: string = body.host ?? DEFAULT_HOST
    const port: number = body.port ?? DEFAULT_PORT
    const start: number = body.start - 1
    const length: number = body.length
    const functionType: string = body.functionType
    const writeData: string | undefined = body.writeData

    requestData = {
      host,
      port,
      functionType,
      startAddress: start,
      length,
      writeData
    }

    if (!connectionType || connectionType !== "tcp") {
      return NextResponse.json({ success: false, error: "Apenas 'tcp' é suportado." }, { status: 400 })
    }

    if (typeof start !== "number" || typeof length !== "number") {
      await logRequestFailure(requestData, "Por favor, forneça 'start' e 'length' como números.", startTime)
      return NextResponse.json(
          { success: false, error: "Por favor, forneça 'start' e 'length' como números." },
          { status: 400 },
      )
    }

    const net = await import("net")
    const jsmodbus = await import("jsmodbus")

    return await handleTcpRequest({
      net: net,
      Modbus: jsmodbus,
      host,
      port,
      start,
      length,
      functionType,
      writeData,
      startTime,
      requestData,
    })
  } catch (err: any) {
    console.error("Erro geral no manipulador:", err)
    await logRequestFailure(requestData, err?.message ?? "Erro desconhecido.", startTime)
    return NextResponse.json({ success: false, error: err?.message ?? "Erro desconhecido." }, { status: 500 })
  }
}

async function logRequestFailure(requestData: any, errorMessage: string, startTime: number) {
  const executionTime = Date.now() - startTime
  await logModbusRequest({
    ...requestData,
    isSuccess: false,
    errorMessage,
    executionTime
  })
}

async function handleTcpRequest({
                                  net,
                                  Modbus,
                                  host,
                                  port,
                                  start,
                                  length,
                                  functionType,
                                  writeData,
                                  startTime,
                                  requestData,
                                }: {
  net: any
  Modbus: any
  host: string
  port: number
  start: number
  length: number
  functionType: string
  writeData?: string
  startTime: number
  requestData: any
}): Promise<NextResponse> {
  return new Promise<NextResponse>((resolve) => {
    try {
      const socket = new net.Socket()

      if (!Modbus || !Modbus.client || !Modbus.client.TCP) {
        console.error("O cliente Modbus não foi inicializado corretamente")
        logRequestFailure(requestData, "Falha na inicialização do cliente Modbus", startTime)
        return resolve(
            NextResponse.json({ success: false, error: "Falha na inicialização do cliente Modbus" }, { status: 500 }),
        )
      }

      const client = new Modbus.client.TCP(socket)
      const timer = setTimeout(() => {
        socket.destroy()
        console.error("Tempo esgotado: não foi possível conectar a tempo.")
        logRequestFailure(requestData, "Tempo de conexão esgotado.", startTime)
        resolve(NextResponse.json({ success: false, error: "Tempo de conexão esgotado." }, { status: 504 }))
      }, CONNECTION_TIMEOUT_MS)

      socket.on("connect", () => {
        clearTimeout(timer)

        executeModbusRequest(client, functionType, start, length, writeData)
            .then(({ metrics, response }: ModbusRequestResult) => {
              socket.end()
              const executionTime = Date.now() - startTime

              const valuesArray = response.body.valuesAsArray || []
              const responseData = {
                valuesAsArray: valuesArray,
                valuesAsBuffer: response.body.valuesAsBuffer
                    ? Buffer.from(response.body.valuesAsBuffer).toString("hex")
                    : null,
              }

              logModbusRequest({
                ...requestData,
                isSuccess: true,
                responseData,
                executionTime
              }).then(logResult => {
                resolve(
                    NextResponse.json({
                      success: true,
                      data: responseData,
                      metrics: metrics,
                      logId: logResult?.id
                    }),
                )
              }).catch(logError => {
                console.error("Falha ao registrar log na database:", logError);
                resolve(
                    NextResponse.json({
                      success: true,
                      data: responseData,
                      metrics: metrics
                    })
                )
              });
            })
            .catch((error) => {
              socket.end()
              const executionTime = Date.now() - startTime
              const errorMessage = handleModbusError(error, Modbus)

              console.error("Erro ao executar requisição Modbus:", error)

              logModbusRequest({
                ...requestData,
                isSuccess: false,
                errorMessage,
                executionTime
              })

              resolve(NextResponse.json({ success: false, error: handleModbusError(error, Modbus) }, { status: 500 }))
            })
      })

      socket.on("error", (err: { message: any }) => {
        clearTimeout(timer)
        console.error("Erro de socket:", err)
        logRequestFailure(requestData, `Erro de conexão: ${err.message}`, startTime)
        resolve(NextResponse.json({ success: false, error: `Erro de conexão: ${err.message}` }, { status: 500 }))
      })

      socket.connect({ host, port })
    } catch (err: any) {
      console.error("Erro na requisição TCP:", err)
      logRequestFailure(requestData, `Erro na requisição TCP: ${err.message}`, startTime)
      resolve(NextResponse.json({ success: false, error: `Erro na requisição TCP: ${err.message}` }, { status: 500 }))
    }
  })
}

function executeModbusRequest(
    client: any,
    functionType: string,
    start: number,
    length: number,
    writeData?: string,
): Promise<ModbusRequestResult> {
  switch (functionType) {
    case "readHoldingRegisters":
      return client.readHoldingRegisters(start, length) as Promise<ModbusRequestResult>
    case "readInputRegisters":
      return client.readInputRegisters(start, length) as Promise<ModbusRequestResult>
    case "writeSingleRegister":
      if (length >= 2 ** 16) {
        return Promise.reject(new Error("Valor do registro excede 16 bits."))
      }
      return client.writeSingleRegister(start, length) as Promise<ModbusRequestResult>
    case "writeMultipleRegisters":
      if (!writeData) {
        throw new Error("Dados de escrita ausentes para FC16 (writeMultipleRegisters).")
      }
      return handleWriteMultipleRegisters(client, start, length, writeData) as Promise<ModbusRequestResult>
    default:
      return Promise.reject(new Error("Função Modbus não suportada: " + functionType))
  }
}

function handleWriteMultipleRegisters(client: any, start: number, length: number, writeData: string) {
  const arrRegs = writeData.split(",").map((v) => Number.parseInt(v.trim(), 10))

  if (arrRegs.length !== length) {
    throw new Error("O número de registros não corresponde ao valor de 'length'.")
  }

  return client.writeMultipleRegisters(start, arrRegs)
}

function handleModbusError(err: any, Modbus: any): string {
  if (Modbus && Modbus.errors && Modbus.errors.isUserRequestError && Modbus.errors.isUserRequestError(err)) {
    switch (err.err) {
      case "OutOfSync":
        return "Erro de sincronização: " + err.message
      case "Protocol":
        return "Erro de protocolo: " + err.message
      case "Timeout":
        return "Tempo esgotado na operação Modbus: " + err.message
      case "ManuallyCleared":
        return "Operação cancelada: " + err.message
      case "ModbusException":
        return "Exceção Modbus: " + err.message
      case "Offline":
        return "Dispositivo offline: " + err.message
      case "crcMismatch":
        return "Erro de CRC: " + err.message
      default:
        return "Erro Modbus: " + err.message
    }
  } else if (Modbus && Modbus.errors && Modbus.errors.isInternalException && Modbus.errors.isInternalException(err)) {
    return `Erro interno: ${err.message}`
  } else {
    return `Erro desconhecido: ${err.message || "Sem detalhes disponíveis"}`
  }
}
