import { prisma } from './index'

export type ModbusLogData = {
    host: string
    port: number
    functionType: string
    startAddress: number
    length: number
    writeData?: string
    responseData?: any
    isSuccess: boolean
    errorMessage?: string
    executionTime?: number
}

export async function logModbusRequest(data: ModbusLogData) {
    try {
        return await prisma.modbusLog.create({
            data: {
                host: data.host,
                port: data.port,
                functionType: data.functionType,
                startAddress: data.startAddress,
                length: data.length,
                writeData: data.writeData,
                responseData: data.responseData ? data.responseData : null,
                isSuccess: data.isSuccess,
                errorMessage: data.errorMessage,
                executionTime: data.executionTime
            }
        })
    } catch (error) {
        console.error("Failed to log Modbus request to database:", error)
        return null
    }
}