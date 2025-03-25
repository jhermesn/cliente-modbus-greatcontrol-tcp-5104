import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const paramsResolved = await params
    const logId = parseInt( paramsResolved.id, 10)

    if (isNaN(logId)) {
      return NextResponse.json(
        { success: false, error: "ID de log inválido." },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { enrichedData } = body;

    if (!enrichedData) {
      return NextResponse.json(
        { success: false, error: "Não enviou dados corrigidos." },
        { status: 400 }
      );
    }

    const existingLog = await prisma.modbusLog.findUnique({
      where: { id: logId },
    });

    if (!existingLog) {
      return NextResponse.json(
        { success: false, error: "Log não encontrada" },
        { status: 404 }
      );
    }

    let updatedResponseData = enrichedData;
    if (existingLog.responseData && typeof existingLog.responseData === 'object' && !Array.isArray(existingLog.responseData)) {
      updatedResponseData = {
        ...existingLog.responseData as object,
        ...enrichedData,
      };
    }

    const updatedLog = await prisma.modbusLog.update({
      where: { id: logId },
      data: { responseData: updatedResponseData },
    });

    return NextResponse.json({
      success: true,
      data: updatedLog,
    });
  } catch (error: any) {
    console.error("Erro ao atualizar as logs do Modbus:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Erro ao atualizar as logs do Modbus" },
      { status: 500 }
    );
  }
}