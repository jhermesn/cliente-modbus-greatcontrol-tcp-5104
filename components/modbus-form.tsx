import type React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"

interface Preset {
    key: string
    label: string
    functionType: string
    start: number
    length: number
    parseAsFloats?: boolean
    defaultWriteData?: string
}

interface ModbusFormProps {
    isLoading: boolean
    functionType: string
    setFunctionType: (val: string) => void
    host: string
    setHost: (val: string) => void
    hostError: string
    port: number
    setPort: (val: number) => void
    portError: string
    tempStart: number
    setTempStart: (val: number) => void
    startError: string
    tempLength: number
    setTempLength: (val: number) => void
    lengthError: string
    multipleWriteData: string
    setMultipleWriteData: (val: string) => void
    writeDataError: string
    handleSubmit: (e?: React.FormEvent) => void
    submitButtonRef: React.RefObject<HTMLButtonElement>
    autoSubmit: boolean
    setAutoSubmit: (val: boolean) => void
    autoRefreshMs: number
    setAutoRefreshMs: (val: number) => void
    applyPreset: (presetKey: string) => void
    selectedPreset: string
    presets: Preset[]
}

export function ModbusForm({
                               isLoading,
                               functionType,
                               setFunctionType,
                               host,
                               setHost,
                               hostError,
                               port,
                               setPort,
                               portError,
                               tempStart,
                               setTempStart,
                               startError,
                               tempLength,
                               setTempLength,
                               lengthError,
                               multipleWriteData,
                               setMultipleWriteData,
                               writeDataError,
                               handleSubmit,
                               submitButtonRef,
                               autoSubmit,
                               setAutoSubmit,
                               autoRefreshMs,
                               setAutoRefreshMs,
                               applyPreset,
                               selectedPreset,
                               presets,
                           }: ModbusFormProps) {
    function getDataLabel(ft: string) {
        switch (ft) {
            case "writeSingleRegister":
                return "Valor (até 65535)"
            case "writeMultipleRegisters":
                return "Registros para escrever (sep. por vírgula)"
            default:
                return "Número de Registros"
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="presetSelect" className="text-white text-base">
                    Preconfigurações
                </Label>
                <Select
                    onValueChange={(val) => applyPreset(val)}
                    value={selectedPreset}
                    disabled={isLoading}
                >
                    <SelectTrigger id="presetSelect" className="bg-black border-gray-700 text-white text-base">
                        <SelectValue placeholder="Selecione um preset" />
                    </SelectTrigger>
                    <SelectContent className="bg-black border-gray-700 text-white max-h-64 overflow-auto">
                        {presets.map((p) => (
                            <SelectItem key={p.key} value={p.key}>
                                {p.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
                <Label htmlFor="functionType" className="text-white text-base">
                    Função Modbus
                </Label>
                <Select value={functionType} onValueChange={setFunctionType} disabled={isLoading}>
                    <SelectTrigger id="functionType" className="bg-black border-gray-700 text-white text-base">
                        <SelectValue placeholder="Selecionar função" />
                    </SelectTrigger>
                    <SelectContent className="bg-black border-gray-700 text-white">
                        <SelectItem value="readHoldingRegisters">Ler Registros de Retenção (03)</SelectItem>
                        <SelectItem value="readInputRegisters">Ler Registros de Entrada (04)</SelectItem>
                        <SelectItem value="writeSingleRegister">Escrever Registro Único (06)</SelectItem>
                        <SelectItem value="writeMultipleRegisters">Escrever Múltiplos Registros (16)</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
                <Label htmlFor="host" className="text-white text-base">
                    Endereço (TCP)
                </Label>
                <Input
                    id="host"
                    type="text"
                    required
                    value={host}
                    onChange={(e) => setHost(e.target.value)}
                    className={`bg-black border-gray-700 text-white text-base ${
                        hostError ? "border-red-500" : ""
                    }`}
                    placeholder="Ex: 192.168.2.88"
                    disabled={isLoading}
                />
                {hostError && <p className="text-red-500 text-xs">{hostError}</p>}
            </div>

            <div className="space-y-2">
                <Label htmlFor="port" className="text-white text-base">
                    Porta
                </Label>
                <Input
                    id="port"
                    type="number"
                    required
                    value={port}
                    onChange={(e) => setPort(Number(e.target.value))}
                    className={`bg-black border-gray-700 text-white text-base ${
                        portError ? "border-red-500" : ""
                    }`}
                    placeholder="502"
                    disabled={isLoading}
                />
                {portError && <p className="text-red-500 text-xs">{portError}</p>}
            </div>

            <div className="space-y-2">
                <Label htmlFor="start" className="text-white text-base">
                    Endereço Inicial
                </Label>
                <Input
                    id="start"
                    type="number"
                    required
                    value={tempStart}
                    onChange={(e) => setTempStart(Number(e.target.value))}
                    className={`bg-black border-gray-700 text-white text-base ${
                        startError ? "border-red-500" : ""
                    }`}
                    placeholder="Ex: 1"
                    disabled={isLoading}
                />
                {startError && <p className="text-red-500 text-xs">{startError}</p>}
            </div>

            <div className="space-y-2">
                <Label htmlFor="length" className="text-white text-base">
                    {getDataLabel(functionType)}
                </Label>

                {functionType === "writeMultipleRegisters" && (
                    <>
                        <Input
                            type="text"
                            value={multipleWriteData}
                            onChange={(e) => setMultipleWriteData(e.target.value)}
                            className={`bg-black border-gray-700 text-white text-base mb-2 ${
                                writeDataError ? "border-red-500" : ""
                            }`}
                            placeholder="Ex: 1000,0 (Upper=1000, Lower=0)"
                            disabled={isLoading}
                        />
                        {writeDataError && <p className="text-red-500 text-xs">{writeDataError}</p>}
                        <p className="text-gray-400 text-sm mb-2">
                            Separe os valores por vírgula. Ex: 1000,0. Range: -32768 até 65535.
                        </p>

                        <Input
                            id="length"
                            type="number"
                            required
                            value={tempLength}
                            onChange={(e) => setTempLength(Number(e.target.value))}
                            className={`bg-black border-gray-700 text-white text-base ${
                                lengthError ? "border-red-500" : ""
                            }`}
                            disabled={isLoading}
                        />
                        {lengthError && <p className="text-red-500 text-xs">{lengthError}</p>}
                    </>
                )}

                {functionType === "writeSingleRegister" && (
                    <>
                        <Input
                            type="text"
                            value={multipleWriteData}
                            onChange={(e) => setMultipleWriteData(e.target.value)}
                            className="bg-black border-gray-700 text-white text-base"
                            placeholder="Ex: 1"
                            disabled={isLoading}
                        />
                    </>
                )}

                {(functionType === "readHoldingRegisters" || functionType === "readInputRegisters") && (
                    <Input
                        id="length"
                        type="number"
                        required
                        value={tempLength}
                        onChange={(e) => setTempLength(Number(e.target.value))}
                        className={`bg-black border-gray-700 text-white text-base ${
                            lengthError ? "border-red-500" : ""
                        }`}
                        placeholder="Ex: 8"
                        disabled={isLoading}
                    />
                )}
            </div>

            <div className="space-y-2">
                <Label htmlFor="autoRefreshTime" className="text-white text-base">
                    Intervalo de Auto Refresh (ms)
                </Label>
                <Input
                    id="autoRefreshTime"
                    type="number"
                    required
                    value={autoRefreshMs}
                    onChange={(e) => setAutoRefreshMs(Number(e.target.value))}
                    className="bg-black border-gray-700 text-white text-base"
                    disabled={isLoading}
                />
            </div>

            <div className="flex items-center gap-4">
                <Button
                    type="submit"
                    ref={submitButtonRef}
                    className={`flex-1 ${
                        isLoading ? "bg-gray-700" : "bg-green-700 hover:bg-green-800"
                    } text-base font-medium text-white`}
                    disabled={isLoading || !!hostError || !!portError || !!startError || !!lengthError || !!writeDataError}
                >
                    {isLoading ? "Processando..." : "Executar"}
                </Button>
                <div className="flex items-center gap-2">
                    <Switch
                        id="auto-refresh"
                        checked={autoSubmit}
                        onCheckedChange={setAutoSubmit}
                        disabled={isLoading && autoSubmit}
                    />
                    <Label htmlFor="auto-refresh" className="text-white text-sm">
                        Automático
                    </Label>
                </div>
            </div>
        </form>
    )
}
