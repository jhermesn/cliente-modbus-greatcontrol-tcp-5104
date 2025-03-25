"use client"

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface RegistersTabProps {
    responseData: any
    functionType: string
    start: number
    manualTrigger: boolean
}

export function RegistersTab({ responseData, functionType, start, manualTrigger }: RegistersTabProps) {
    const isReadFunction =
        functionType === "readHoldingRegisters" || functionType === "readInputRegisters"

    return (
        <div className="bg-gray-900 p-4 rounded border border-gray-800">
            <h3 className="text-xl font-medium mb-4 text-white">Valores dos Registros</h3>

            {responseData.data.parsedFloatValues && (
                <div className="mb-4 p-2 border border-gray-700 rounded bg-gray-800">
                    <h4 className="text-white font-bold text-sm mb-2">Interpretado como float (IEEE 754)</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {responseData.data.parsedFloatValues.map((val: number, idx: number) => (
                            <div key={idx} className="bg-gray-700 p-3 rounded text-white text-center">
                                <p className="text-sm font-semibold">Float #{idx + 1}</p>
                                <p className="text-xl">{val.toFixed(3)}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {responseData.data.parsedAdc && (
                <div className="mb-4 p-2 border border-gray-700 rounded bg-gray-800">
                    <h4 className="text-white font-bold text-sm mb-2">Interpretado como ADC (0..4095)</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {responseData.data.parsedAdc.map(
                            (item: { raw: number; volts_0_5: number; mA_0_20: number }, idx: number) => (
                                <div key={idx} className="bg-gray-700 p-3 rounded text-white text-sm">
                                    <p className="font-semibold mb-1">Reg #{start + idx}</p>
                                    <p>Raw: {item.raw}</p>
                                    <p>Possível Voltagem (0-5V): {item.volts_0_5.toFixed(3)} V</p>
                                    <p>Possível Corrente (0-20mA): {item.mA_0_20.toFixed(2)} mA</p>
                                </div>
                            )
                        )}
                    </div>
                </div>
            )}

            {responseData.data.parsed05V && (
                <div className="mb-4 p-2 border border-gray-700 rounded bg-gray-800">
                    <h4 className="text-white font-bold text-sm mb-2">Interpretado (0..5V)</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {responseData.data.parsed05V.map((val: number, idx: number) => (
                            <div key={idx} className="bg-gray-700 p-3 rounded text-white text-sm">
                                <p className="font-semibold mb-1">Reg #{start + idx}</p>
                                <p>{val.toFixed(3)} V</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {responseData.data.parsed020mA && (
                <div className="mb-4 p-2 border border-gray-700 rounded bg-gray-800">
                    <h4 className="text-white font-bold text-sm mb-2">Interpretado (0..20mA)</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {responseData.data.parsed020mA.map((val: number, idx: number) => (
                            <div key={idx} className="bg-gray-700 p-3 rounded text-white text-sm">
                                <p className="font-semibold mb-1">Reg #{start + idx}</p>
                                <p>{val.toFixed(2)} mA</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {isReadFunction ? (
                responseData.data.valuesAsArray && responseData.data.valuesAsArray.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {responseData.data.valuesAsArray.map((val: number, idx: number) => {
                            const regAddress = start + idx
                            return (
                                <TooltipProvider key={idx}>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <div
                                                className="w-full aspect-square bg-gray-800 text-white flex flex-col items-center justify-center rounded-md hover:bg-gray-700 cursor-default border border-gray-700 relative"
                                                style={{
                                                    borderColor: `hsla(${(regAddress * 70) % 360}, 70%, 50%, 0.5)`,
                                                    borderWidth: "2px",
                                                }}
                                            >
                        <span className="absolute top-1 left-2 text-xs text-gray-400">
                          #{regAddress}
                        </span>
                                                <span className="text-2x1 font-medium">{val}</span>
                                            </div>
                                        </TooltipTrigger>
                                        <TooltipContent className="bg-black border-gray-700 text-white">
                                            <div className="text-sm space-y-1">
                                                <p className="font-semibold">Registro {regAddress}</p>
                                                <p>Valor: {val}</p>
                                                <p>Hex: 0x{val.toString(16).toUpperCase().padStart(4, "0")}</p>
                                                <p>Binário: {val.toString(2).padStart(16, "0")}</p>
                                            </div>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            )
                        })}
                    </div>
                ) : (
                    <div className="bg-gray-800 p-4 rounded border border-gray-700">
                        <p className="text-yellow-400 text-base">
                            Nenhum dado de registro recebido. Verifique se o dispositivo está respondendo.
                        </p>
                    </div>
                )
            ) : (
                <div className="bg-gray-800 p-4 rounded border border-green-700">
                    {manualTrigger ? (
                        <p className="text-green-400 text-base">Operação de escrita executada com sucesso!</p>
                    ) : (
                        <p className="text-gray-400 text-base">(Escrita via Auto Refresh)</p>
                    )}
                </div>
            )}

            {responseData.metrics && (
                <div className="mt-4 text-sm text-gray-400">
                    <span className="font-semibold">Tempo de Transferência:</span>{" "}
                    {responseData.metrics.transferTime}ms
                </div>
            )}
        </div>
    )
}
