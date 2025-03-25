import { ModbusChart } from "@/components/modbus-chart"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

interface MonitoringTabProps {
    chartsData: { [key: string]: any }
    chartUpdateTrigger: number
    exibirApenasAtivos: boolean
    lastUsedChartKeys: string[]
    setExibirApenasAtivos: (val: boolean) => void
}

export function MonitoringTab({
                                  chartsData,
                                  chartUpdateTrigger,
                                  exibirApenasAtivos,
                                  lastUsedChartKeys,
                                  setExibirApenasAtivos,
                              }: MonitoringTabProps) {
    const allKeys = Object.keys(chartsData)
    const keysToRender = exibirApenasAtivos ? lastUsedChartKeys : allKeys

    return (
        <div className="bg-gray-900 p-4 rounded border border-gray-800">
            <h3 className="text-xl font-medium mb-4 text-white">Monitoramento em Série Temporal</h3>
            
            <div className="flex items-center justify-between mb-2">
                <Label className="text-white text-sm flex items-center gap-2">
                    <Switch
                        checked={exibirApenasAtivos}
                        onCheckedChange={setExibirApenasAtivos}
                    />
                    Mostrar apenas gráficos atualizados?
                </Label>
            </div>

            {keysToRender.length > 0 ? (
                <div className="space-y-6">
                    {keysToRender.map((chartKey) => {
                        const chartData = chartsData[chartKey]
                        const chartLabel = chartData?.datasets?.[0]?.label || chartKey
                        return (
                            <div
                                key={`${chartKey}_${chartUpdateTrigger}`}
                                className="h-[200px] w-full mb-6 bg-gray-800 p-3 rounded"
                            >
                                <h4 className="text-white text-sm mb-2 font-medium">{chartLabel}</h4>
                                <ModbusChart
                                    data={chartData}
                                    key={`chart_${chartKey}_${chartUpdateTrigger}`}
                                />
                            </div>
                        )
                    })}
                </div>
            ) : (
                <div className="h-[200px] w-full flex items-center justify-center bg-gray-800 rounded">
                    <p className="text-gray-400">Nenhum gráfico para exibir no momento.</p>
                </div>
            )}
        </div>
    )
}
