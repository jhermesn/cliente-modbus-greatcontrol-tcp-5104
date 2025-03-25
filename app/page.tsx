"use client"

import React, { useState, useEffect, useRef } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ModbusForm } from "@/components/modbus-form"
import { RegistersTab } from "@/components/registers-tab"
import { MonitoringTab } from "@/components/monitoring-tab"
import {fetchModbusData, updateModbusLogResponse} from "@/lib/api"
import { LogsTab } from "@/components/logs-tab"

const PRESETS = [
  {
    key: "roadSamplingValues",
    label: "Ler Valores de Amostra de Campo (51~58, 4 floats)",
    functionType: "readHoldingRegisters",
    start: 51,
    length: 8,
    parseAsFloats: true,
  },
  {
    key: "readPorts",
    label: "Ler Portas (212~213)",
    functionType: "readHoldingRegisters",
    start: 212,
    length: 2,
  },
  {
    key: "engQuantityOn",
    label: "Habilitar Quantidade Eng. (220=1)",
    functionType: "writeSingleRegister",
    start: 220,
    length: 1,
    defaultWriteData: "1",
  },
  {
    key: "engQuantityOff",
    label: "Desabilitar Quantiade Eng. (220=0)",
    functionType: "writeSingleRegister",
    start: 220,
    length: 1,
    defaultWriteData: "0",
  },
  {
    key: "setInputRange0",
    label: "Range = 0 (4-20mA/1-5V)",
    functionType: "writeSingleRegister",
    start: 221,
    length: 1,
    defaultWriteData: "0",
  },
  {
    key: "setInputRange1",
    label: "Range = 1 (0-20mA/0-5V/0-10V)",
    functionType: "writeSingleRegister",
    start: 221,
    length: 1,
    defaultWriteData: "1",
  },
  {
    key: "setLimitsCH1",
    label: "Definir Limites 1 (222~223)",
    functionType: "writeMultipleRegisters",
    start: 222,
    length: 2,
    defaultWriteData: "1000,0",
  },
  {
    key: "setLimitsCH2",
    label: "Definir Limites 2 (224~225)",
    functionType: "writeMultipleRegisters",
    start: 224,
    length: 2,
    defaultWriteData: "1000,0",
  },
  {
    key: "setLimitsCH3",
    label: "Definir Limites 3 (226~227)",
    functionType: "writeMultipleRegisters",
    start: 226,
    length: 2,
    defaultWriteData: "1000,0",
  },
  {
    key: "setLimitsCH4",
    label: "Definir Limites 4 (228~229)",
    functionType: "writeMultipleRegisters",
    start: 228,
    length: 2,
    defaultWriteData: "1000,0",
  },
  {
    key: "readRoadADC",
    label: "Ler Medida ADC (1~4)",
    functionType: "readHoldingRegisters",
    start: 1,
    length: 4,
  },
  {
    key: "readRoad05V",
    label: "Ler Medida 0-5V (9~12)",
    functionType: "readHoldingRegisters",
    start: 9,
    length: 4,
  },
  {
    key: "readRoad020mA",
    label: "Ler Medida 0-20mA (17~20)",
    functionType: "readHoldingRegisters",
    start: 17,
    length: 4,
  },
]

export default function Home() {
  const [host, setHost] = useState(process.env.DEFAULT_HOST || "192.168.2.88")
  const [port, setPort] = useState(parseInt(process.env.DEFAULT_PORT || "502", 10))
  const [functionType, setFunctionType] = useState("readHoldingRegisters")

  const [start, setStart] = useState(1)
  const [length, setLength] = useState(4)

  const [tempStart, setTempStart] = useState(start)
  const [tempLength, setTempLength] = useState(length)

  const [multipleWriteData, setMultipleWriteData] = useState("")

  const [parseAsFloats, setParseAsFloats] = useState(false)

  const [selectedPreset, setSelectedPreset] = useState("")

  const [hostError, setHostError] = useState("")
  const [portError, setPortError] = useState("")
  const [startError, setStartError] = useState("")
  const [lengthError, setLengthError] = useState("")
  const [writeDataError, setWriteDataError] = useState("")

  const [responseData, setResponseData] = useState<any>(null)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [manualTrigger, setManualTrigger] = useState(false)

  const [autoSubmit, setAutoSubmit] = useState(false)
  const [autoRefreshMs, setAutoRefreshMs] = useState(2000)
  const submitButtonRef = useRef<HTMLButtonElement>(null)

  const [chartUpdateTrigger, setChartUpdateTrigger] = useState(0)
  const [chartsData, setChartsData] = useState<{ [key: string]: any }>({})
  const [exibirApenasAtivos, setExibirApenasAtivos] = useState(false)
  const [lastUsedChartKeys, setLastUsedChartKeys] = useState<string[]>([])

  function applyPreset(presetKey: string) {
    setResponseData(null)
    setManualTrigger(false)
    setSelectedPreset(presetKey)
    const found = PRESETS.find((p) => p.key === presetKey)
    if (!found) return

    setFunctionType(found.functionType)
    setTempStart(found.start)
    setTempLength(found.length)

    if (
        (found.functionType === "writeSingleRegister" ||
            found.functionType === "writeMultipleRegisters") &&
        found.defaultWriteData
    ) {
      setMultipleWriteData(found.defaultWriteData)
    } else {
      setMultipleWriteData("")
    }
    setParseAsFloats(!!found.parseAsFloats)
  }

  function validateHost(value: string) {
    const ipPattern =
        /^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
    if (!ipPattern.test(value) && value !== "localhost") {
      setHostError("Por favor, insira um IP válido (ex: 192.168.2.88)")
      return false
    }
    setHostError("")
    return true
  }

  function validatePort(value: number) {
    if (value < 1 || value > 65535) {
      setPortError("A porta deve estar entre 1 e 65535")
      return false
    }
    setPortError("")
    return true
  }

  function validateStart(value: number) {
    if (value < 1) {
      setStartError("O endereço inicial deve ser >= 1")
      return false
    }
    setStartError("")
    return true
  }

  function validateLength(value: number) {
    if (value < 0 || value > 127) {
      setLengthError("O comprimento deve estar entre 0 e 127")
      return false
    }
    setLengthError("")
    return true
  }

  function validateWriteData(value: string) {
    if (functionType === "writeMultipleRegisters") {
      const values = value.split(",").map((v) => parseInt(v.trim(), 10))
      if (values.length !== tempLength) {
        setWriteDataError(`Você deve fornecer exatamente ${tempLength} valores (separados por vírgula).`)
        return false
      }
      if (values.some(isNaN) || values.some((v) => v < -32768 || v > 65535)) {
        setWriteDataError("Valores devem estar entre -32768 e +65535 (16 bits).")
        return false
      }
    }
    setWriteDataError("")
    return true
  }

  async function handleSubmit(e?: React.FormEvent) {
    const isManual = !!e
    if (isManual) {
      e?.preventDefault()
      setManualTrigger(true)
    } else {
      setManualTrigger(false)
    }

    const validHost = validateHost(host)
    const validPort = validatePort(port)
    const validStart = validateStart(tempStart)
    const validLength = validateLength(tempLength)
    const validWriteData =
        functionType === "writeMultipleRegisters" ? validateWriteData(multipleWriteData) : true

    if (!validHost || !validPort || !validStart || !validLength || !validWriteData) {
      return
    }

    setStart(tempStart)
    setLength(tempLength)

    setError("")
    setIsLoading(true)

    try {
      const data = await fetchModbusData({
        connectionType: "tcp",
        host,
        port,
        start: tempStart,
        length: tempLength,
        functionType,
        writeData: multipleWriteData,
      })

      if (!data.success) {
        throw new Error(data.error || "Erro desconhecido na comunicação Modbus")
      }

      const logId = data.logId
      const enrichedData: any = { ...data.data }

      if (parseAsFloats && data?.data?.valuesAsArray) {
        const raw = data.data.valuesAsArray
        const floatValues: number[] = []
        for (let i = 0; i < raw.length; i += 2) {
          const regHigh = raw[i]
          const regLow = raw[i + 1]
          const buf = Buffer.alloc(4)
          buf.writeUInt16BE(regHigh, 0)
          buf.writeUInt16BE(regLow, 2)
          floatValues.push(buf.readFloatBE(0))
        }
        data.data.parsedFloatValues = floatValues
        enrichedData.parsedFloatValues = floatValues
      }

      if (selectedPreset === "readRoadADC" && data?.data?.valuesAsArray) {
        data.data.parsedAdc = data.data.valuesAsArray.map((val: number) => {
          const possibleVolts = (val * 5.0) / 4095
          const possiblemA = (val * 20.0) / 4095
          return {
            raw: val,
            volts_0_5: Number(possibleVolts.toFixed(3)),
            mA_0_20: Number(possiblemA.toFixed(2)),
          }
        })
      }
      if (selectedPreset === "readRoad05V" && data?.data?.valuesAsArray) {
        data.data.parsed05V = data.data.valuesAsArray.map((val: number) =>
            Number((val / 1000).toFixed(3))
        )
      }
      if (selectedPreset === "readRoad020mA" && data?.data?.valuesAsArray) {
        data.data.parsed020mA = data.data.valuesAsArray.map((val: number) =>
            Number((val / 100).toFixed(2))
        )
      }

      if (logId) {
        try {
          await updateModbusLogResponse(logId, enrichedData)
        } catch {
          console.error("Falha ao atualizar logs do Modbus com os dados: ", error)
        }
      }

      setResponseData(data)

      const timeLabel = new Date().toLocaleTimeString("pt-BR", { hour12: false })
      const newChartsData = { ...chartsData }
      const updatedChartKeys: string[] = []

      if (data?.data?.valuesAsArray) {
        data.data.valuesAsArray.forEach((val: number, idx: number) => {
          const regAddress = tempStart + idx
          const regKey = `reg_${regAddress}`
          updatedChartKeys.push(regKey)

          if (!newChartsData[regKey]) {
            newChartsData[regKey] = {
              labels: [timeLabel],
              datasets: [
                {
                  label: `Registro ${regAddress}`,
                  data: [val],
                  borderColor: `hsl(${(regAddress * 70) % 360}, 70%, 50%)`,
                  backgroundColor: `hsla(${(regAddress * 70) % 360}, 70%, 50%, 0.7)`,
                  pointStyle: "circle",
                  pointRadius: 3,
                  showLine: true,
                  borderWidth: 2,
                  tension: 0.2,
                },
              ],
            }
          } else {
            newChartsData[regKey].labels.push(timeLabel)
            newChartsData[regKey].datasets[0].data.push(val)
            newChartsData[regKey].labels = newChartsData[regKey].labels.slice(-20)
            newChartsData[regKey].datasets[0].data =
                newChartsData[regKey].datasets[0].data.slice(-20)
          }
        })
      }

      if (parseAsFloats && data?.data?.parsedFloatValues) {
        data.data.parsedFloatValues.forEach((val: number, i: number) => {
          const floatAddress = tempStart + i * 2
          const chartKey = `float_${floatAddress}`
          updatedChartKeys.push(chartKey)

          if (!newChartsData[chartKey]) {
            newChartsData[chartKey] = {
              labels: [timeLabel],
              datasets: [
                {
                  label: `Float@${floatAddress}`,
                  data: [val],
                  borderColor: `hsl(${(floatAddress * 70) % 360}, 70%, 50%)`,
                  backgroundColor: `hsla(${(floatAddress * 70) % 360}, 70%, 50%, 0.7)`,
                  pointStyle: "circle",
                  pointRadius: 3,
                  showLine: true,
                  borderWidth: 2,
                  tension: 0.2,
                },
              ],
            }
          } else {
            newChartsData[chartKey].labels.push(timeLabel)
            newChartsData[chartKey].datasets[0].data.push(val)
            newChartsData[chartKey].labels = newChartsData[chartKey].labels.slice(-20)
            newChartsData[chartKey].datasets[0].data = newChartsData[chartKey].datasets[0].data.slice(-20)
          }
        })
      }

      if (data?.data?.parsedAdc) {
        data.data.parsedAdc.forEach((obj: any, idx: number) => {
          const regAddress = tempStart + idx

          const chartKeyV = `adcV_${regAddress}`
          updatedChartKeys.push(chartKeyV)
          if (!newChartsData[chartKeyV]) {
            newChartsData[chartKeyV] = {
              labels: [timeLabel],
              datasets: [
                {
                  label: `ADC@${regAddress} (V)`,
                  data: [obj.volts_0_5],
                  borderColor: `hsl(${(regAddress * 50) % 360}, 70%, 50%)`,
                  backgroundColor: `hsla(${(regAddress * 50) % 360}, 70%, 50%, 0.7)`,
                  pointStyle: "circle",
                  pointRadius: 3,
                  showLine: true,
                  borderWidth: 2,
                  tension: 0.2,
                },
              ],
            }
          } else {
            newChartsData[chartKeyV].labels.push(timeLabel)
            newChartsData[chartKeyV].datasets[0].data.push(obj.volts_0_5)
            newChartsData[chartKeyV].labels = newChartsData[chartKeyV].labels.slice(-20)
            newChartsData[chartKeyV].datasets[0].data =
                newChartsData[chartKeyV].datasets[0].data.slice(-20)
          }

          const chartKeymA = `adcMA_${regAddress}`
          updatedChartKeys.push(chartKeymA)
          if (!newChartsData[chartKeymA]) {
            newChartsData[chartKeymA] = {
              labels: [timeLabel],
              datasets: [
                {
                  label: `ADC@${regAddress} (mA)`,
                  data: [obj.mA_0_20],
                  borderColor: `hsl(${(regAddress * 50 + 180) % 360}, 70%, 50%)`,
                  backgroundColor: `hsla(${(regAddress * 50 + 180) % 360}, 70%, 50%, 0.7)`,
                  pointStyle: "circle",
                  pointRadius: 3,
                  showLine: true,
                  borderWidth: 2,
                  tension: 0.2,
                },
              ],
            }
          } else {
            newChartsData[chartKeymA].labels.push(timeLabel)
            newChartsData[chartKeymA].datasets[0].data.push(obj.mA_0_20)
            newChartsData[chartKeymA].labels = newChartsData[chartKeymA].labels.slice(-20)
            newChartsData[chartKeymA].datasets[0].data =
                newChartsData[chartKeymA].datasets[0].data.slice(-20)
          }
        })
      }

      if (data?.data?.parsed05V) {
        data.data.parsed05V.forEach((val: number, idx: number) => {
          const regAddress = tempStart + idx
          const chartKey = `road05v_${regAddress}`
          updatedChartKeys.push(chartKey)

          if (!newChartsData[chartKey]) {
            newChartsData[chartKey] = {
              labels: [timeLabel],
              datasets: [
                {
                  label: `0-5V@${regAddress}`,
                  data: [val],
                  borderColor: `hsl(${(regAddress * 60) % 360}, 70%, 50%)`,
                  backgroundColor: `hsla(${(regAddress * 60) % 360}, 70%, 50%, 0.7)`,
                  pointStyle: "circle",
                  pointRadius: 3,
                  showLine: true,
                  borderWidth: 2,
                  tension: 0.2,
                },
              ],
            }
          } else {
            newChartsData[chartKey].labels.push(timeLabel)
            newChartsData[chartKey].datasets[0].data.push(val)
            newChartsData[chartKey].labels = newChartsData[chartKey].labels.slice(-20)
            newChartsData[chartKey].datasets[0].data = newChartsData[chartKey].datasets[0].data.slice(-20)
          }
        })
      }

      if (data?.data?.parsed020mA) {
        data.data.parsed020mA.forEach((val: number, idx: number) => {
          const regAddress = tempStart + idx
          const chartKey = `road020mA_${regAddress}`
          updatedChartKeys.push(chartKey)

          if (!newChartsData[chartKey]) {
            newChartsData[chartKey] = {
              labels: [timeLabel],
              datasets: [
                {
                  label: `0-20mA@${regAddress}`,
                  data: [val],
                  borderColor: `hsl(${(regAddress * 60 + 120) % 360}, 70%, 50%)`,
                  backgroundColor: `hsla(${(regAddress * 60 + 120) % 360}, 70%, 50%, 0.7)`,
                  pointStyle: "circle",
                  pointRadius: 3,
                  showLine: true,
                  borderWidth: 2,
                  tension: 0.2,
                },
              ],
            }
          } else {
            newChartsData[chartKey].labels.push(timeLabel)
            newChartsData[chartKey].datasets[0].data.push(val)
            newChartsData[chartKey].labels = newChartsData[chartKey].labels.slice(-20)
            newChartsData[chartKey].datasets[0].data = newChartsData[chartKey].datasets[0].data.slice(-20)
          }
        })
      }

      setChartsData(newChartsData)
      setChartUpdateTrigger((prev) => prev + 1)
      setLastUsedChartKeys(updatedChartKeys)
    } catch (err: any) {
      setError(err.message || "Erro ao processar o request Modbus")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null
    if (autoSubmit && !isLoading) {
      interval = setInterval(() => {
        submitButtonRef.current?.click()
      }, autoRefreshMs)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [autoSubmit, isLoading, autoRefreshMs])

  const [activeTab, setActiveTab] = useState("registers")

  return (
      <div className="min-h-screen flex items-center justify-center bg-black p-4">
        <div className="w-full max-w-5xl bg-black rounded-lg shadow-lg p-8 border border-gray-800">
          <h1 className="text-3xl font-bold text-center text-white mb-6">
            Cliente Modbus Greatcontrol TCP-5104
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1 space-y-4">
              <ModbusForm
                  isLoading={isLoading}
                  functionType={functionType}
                  setFunctionType={setFunctionType}
                  host={host}
                  setHost={(val) => {
                    setHost(val)
                    validateHost(val)
                  }}
                  hostError={hostError}
                  port={port}
                  setPort={(val) => {
                    setPort(val)
                    validatePort(val)
                  }}
                  portError={portError}
                  tempStart={tempStart}
                  setTempStart={(val) => {
                    setTempStart(val)
                    validateStart(val)
                  }}
                  startError={startError}
                  tempLength={tempLength}
                  setTempLength={(val) => {
                    setTempLength(val)
                    validateLength(val)
                  }}
                  lengthError={lengthError}
                  multipleWriteData={multipleWriteData}
                  setMultipleWriteData={(val) => {
                    setMultipleWriteData(val)
                    if (functionType === "writeMultipleRegisters") {
                      validateWriteData(val)
                    }
                  }}
                  writeDataError={writeDataError}
                  handleSubmit={handleSubmit}
                  submitButtonRef={submitButtonRef}
                  autoSubmit={autoSubmit}
                  setAutoSubmit={setAutoSubmit}
                  autoRefreshMs={autoRefreshMs}
                  setAutoRefreshMs={setAutoRefreshMs}
                  applyPreset={applyPreset}
                  selectedPreset={selectedPreset}
                  presets={PRESETS}
              />

              {error && (
                  <Alert variant="destructive" className="mt-4 bg-red-900 border-red-700 text-white">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
              )}
            </div>

            <div className="md:col-span-2">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3 bg-gray-900">
                  <TabsTrigger
                      value="registers"
                      className="data-[state=active]:bg-gray-800 text-base"
                  >
                    Registros
                  </TabsTrigger>
                  <TabsTrigger
                      value="monitoring"
                      className="data-[state=active]:bg-gray-800 text-base"
                  >
                    Monitoramento
                  </TabsTrigger>
                  <TabsTrigger
                      value="logs"
                      className="data-[state=active]:bg-gray-800 text-base"
                  >
                    Logs
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="registers" className="mt-4">
                  {responseData && responseData.data ? (
                      <RegistersTab
                          responseData={responseData}
                          functionType={functionType}
                          start={start}
                          manualTrigger={manualTrigger}
                      />
                  ) : (
                      <Card className="bg-gray-900 border-gray-800 p-4">
                        <p className="text-gray-400 text-base">
                          Execute uma operação para visualizar os registros.
                        </p>
                      </Card>
                  )}
                </TabsContent>

                <TabsContent value="monitoring" className="mt-4">
                  <MonitoringTab
                      chartsData={chartsData}
                      chartUpdateTrigger={chartUpdateTrigger}
                      exibirApenasAtivos={exibirApenasAtivos}
                      setExibirApenasAtivos={setExibirApenasAtivos}
                      lastUsedChartKeys={lastUsedChartKeys}
                  />
                </TabsContent>

                <TabsContent value="logs" className="mt-4">
                  <LogsTab />
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </div>
  )
}
