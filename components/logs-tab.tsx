import React, { useEffect, useState} from "react";
import { fetchModbusLogs } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronDownIcon, ChevronRightIcon } from "@radix-ui/react-icons"

export function LogsTab() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Record<number, boolean>>({});
  const [filter, setFilter] = useState<{
    host?: string;
    functionType?: string;
    isSuccess?: boolean;
  }>({});
  const [limit] = useState(50);

  useEffect(() => {
    loadLogs();
  }, [filter]);

  async function loadLogs() {
    setLoading(true);
    try {
      const result = await fetchModbusLogs({
        limit,
        ...filter
      });

      if (result.success) {
        setLogs(result.data);
      }
    } catch (error) {
      console.error("Falha ao carregar as logs:", error);
    } finally {
      setLoading(false);
    }
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleString();
  }

  function toggleRow(id: number) {
    setExpandedRows(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  }

  function formatResponseData(responseData: any) {
    if (!responseData) return "Sem dados";

    if (responseData.parsedFloatValues?.length > 0) {
      const values = responseData.parsedFloatValues;
      const formattedValues = values.map((val: number) =>
          !Number.isInteger(val)
              ? val.toFixed(2)
              : val
      );

      if (values.length <= 4) {
        return `${formattedValues.join(", ")} (float)`;
      }
      return `${formattedValues.slice(0, 2).join(", ")}... (${values.length} float vals.)`;
    } else if (responseData.valuesAsArray) {
      const values = responseData.valuesAsArray;
      if (values.length <= 4) {
        return values.join(", ");
      }
      return `${values.slice(0, 2).join(", ")}... (${values.length} vals.)`;
    }

    return "Dados disponíveis";
  }

  return (
      <Card className="bg-gray-900 border-gray-800 p-4">
        <div className="mb-4 flex flex-wrap gap-2 items-center">
          <h3 className="text-xl font-medium text-white">Logs do Modbus</h3>

          <div className="flex-grow"></div>

          <Select
              value={filter.functionType || "all"}
              onValueChange={(value) => setFilter({...filter, functionType: value === "all" ? undefined : value})}>
            <SelectTrigger className="w-[180px] bg-gray-800">
              <SelectValue placeholder="Tipo de função" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="readHoldingRegisters">Read Holding Registers</SelectItem>
              <SelectItem value="readInputRegisters">Read Input Registers</SelectItem>
              <SelectItem value="writeSingleRegister">Write Single Register</SelectItem>
              <SelectItem value="writeMultipleRegisters">Write Multiple Registers</SelectItem>
            </SelectContent>
          </Select>

          <Select
              value={filter.isSuccess === undefined ? "all" : filter.isSuccess ? "true" : "false"}
              onValueChange={(value) => setFilter({...filter, isSuccess:
                    value === "all" ? undefined : value === "true"
              })}>
            <SelectTrigger className="w-[180px] bg-gray-800">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="true">Sucesso</SelectItem>
              <SelectItem value="false">Erro</SelectItem>
            </SelectContent>
          </Select>

          <Button onClick={loadLogs} disabled={loading}>
            {loading ? "Carregando..." : "Atualizar"}
          </Button>
        </div>

        <div className="rounded border border-gray-700 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-800 hover:bg-gray-800">
                <TableHead className="text-white w-8"></TableHead>
                <TableHead className="text-white">Horário</TableHead>
                <TableHead className="text-white">Host:Porta</TableHead>
                <TableHead className="text-white">Função</TableHead>
                <TableHead className="text-white">Endereço</TableHead>
                <TableHead className="text-white">Tamanho</TableHead>
                <TableHead className="text-white">Dados</TableHead>
                <TableHead className="text-white">Status</TableHead>
                <TableHead className="text-white">Tempo (ms)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-gray-400">
                      {loading ? "Carregando logs..." : "Nenhum log encontrado."}
                    </TableCell>
                  </TableRow>
              )}

              {logs.map((log) => (
                  <React.Fragment key={log.id}>
                    <TableRow className="hover:bg-gray-800 cursor-pointer" onClick={() => toggleRow(log.id)}>
                      <TableCell>
                        {expandedRows[log.id] ?
                            <ChevronDownIcon className="h-4 w-4 text-gray-400" /> :
                            <ChevronRightIcon className="h-4 w-4 text-gray-400" />
                        }
                      </TableCell>
                      <TableCell className="text-gray-200">{formatDate(log.timestamp)}</TableCell>
                      <TableCell className="text-gray-200">{log.host}:{log.port}</TableCell>
                      <TableCell className="text-gray-200">{log.functionType}</TableCell>
                      <TableCell className="text-gray-200">{log.startAddress + 1}</TableCell>
                      <TableCell className="text-gray-200">{log.length}</TableCell>
                      <TableCell className="text-gray-200">
                        {log.responseData ? formatResponseData(log.responseData) : "-"}
                      </TableCell>
                      <TableCell>
                        <Badge className={log.isSuccess ? "bg-green-700" : "bg-red-700"}>
                          {log.isSuccess ? "Sucesso" : "Erro"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-200">{log.executionTime}</TableCell>
                    </TableRow>

                    {expandedRows[log.id] && (
                        <TableRow>
                          <TableCell colSpan={9} className="p-4 bg-gray-800">
                            <div className="text-sm text-gray-300">
                              <h4 className="font-medium mb-2">Dados completos:</h4>
                              <pre className="bg-gray-900 p-2 rounded overflow-auto max-h-60">
              {JSON.stringify(log.responseData, null, 2) || "Sem dados"}
            </pre>
                            </div>
                          </TableCell>
                        </TableRow>
                    )}
                  </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
  );
}