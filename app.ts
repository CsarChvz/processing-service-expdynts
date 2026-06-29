/* eslint-disable @typescript-eslint/no-explicit-any */
import { fetchExpediente } from './helpers/query.js';
import { generarHash } from './helpers/hash.js';
import { comparacionAcuerdos } from './helpers/comparacion.js';
import { ComparacionResultado } from './types/expediente-queue.type.js';

interface ProcessResult {
    id: string;
    processed: boolean;
    processingTime: number;
    result: string;
    resultadoComparacion?: ComparacionResultado; 
}

const processExpediente = async (payload: any): Promise<ProcessResult> => {
    const startTime = Date.now();
    const id = payload.data?.usuarioExpedientesId?.toString() || 'Desconocido';
    
    console.log(`🔄 Procesando expediente: ${id}`);

    let expedienteResult: any[] | null = null;
    let acuerdoHashed: string | null = null;
    let resultadoComparacion: ComparacionResultado | null = null;

    try {
        const { usuarioExpedientesId } = payload.data || {};
        
        console.log(`📊 Progreso exp ${id}: 10% - Iniciando proceso`);
        
        expedienteResult = await fetchExpediente(payload.data?.expediente?.url ?? "");
        console.log(`📊 Progreso exp ${id}: 40% - Expediente obtenido de fuente externa`);

        acuerdoHashed = await generarHash(JSON.stringify(expedienteResult));
        console.log(`📊 Progreso exp ${id}: 60% - Hash generado`);

        resultadoComparacion = await comparacionAcuerdos({
            acuerdosActuales: expedienteResult,
            hashNuevo: acuerdoHashed,
            usuarioExpediente: usuarioExpedientesId,
        });
        
        console.log(`📊 Progreso exp ${id}: 80% - Comparación completada`);
        console.log(`📊 Progreso exp ${id}: 100% - Proceso completado`);

        const processingTime = Date.now() - startTime;
        return {
            id,
            processed: true,
            processingTime,
            result: `Expediente ${id} procesado correctamente`,
            resultadoComparacion // <-- Retornamos el objeto completo para tomar decisiones arriba
        };

    } catch (error) {
        console.error(`❌ Error procesando exp ${id}: ${error instanceof Error ? error.message : 'Error desconocido'}`);
        
        const retries = payload.retries || 0;
        console.log(`🔄 Reintento ${retries + 1} para exp ${id}`);
        
        throw error;
    } finally {
        expedienteResult = null;
        resultadoComparacion = null;
        acuerdoHashed = null;
        console.log(`🧹 Limpieza de memoria completada para exp ${id}`);
    }
};

export const handler = async (event: any[]): Promise<any[]> => {
    const mensajesProcesados: any[] = [];
    console.log('🚀 Lambda receptora por lote iniciada');

    for (const record of event) {
        let body: any;
        const messageId = record.messageId || 'ID_Desconocido';

        try {
            body = typeof record.body === 'string' ? JSON.parse(record.body) : record.body;
            
            console.log("=====================================");
            console.log(`📨 Procesando mensaje ID: ${messageId}`);
            console.log("=====================================");

            const resultadoProceso = await processExpediente(body);
            body.estado = 'PROCESSED';
            // Enriquecemos el body original con los resultados
            body.fecha_procesamiento = new Date().toISOString();
            body.detalles_proceso = {
                id: resultadoProceso.id,
                processed: resultadoProceso.processed,
                processingTime: resultadoProceso.processingTime,
                result: resultadoProceso.result
            };

            // LÓGICA DE ENRUTAMIENTO PARA LA COLA DE NOTIFICACIONES:
            // Dependiendo de cómo esté configurado tu destino en EventBridge Pipes,
            // puedes agregar una bandera y la data para que el consumidor sepa qué hacer.
            if (resultadoProceso.resultadoComparacion?.haCambiado) {
                body.requiere_notificacion = true;
                body.estado = 'UPDATED';
                body.payload_notificacion = resultadoProceso.resultadoComparacion.data;
            } else {
                body.requiere_notificacion = false;
            }

            console.log(`✅ Item ${messageId} evaluado exitosamente como: ${body.estado}`);
            
            mensajesProcesados.push(body);

        } catch (error) {
            console.error(`❌ Error general procesando mensaje ${messageId}:`, error);
            
            if (!body) {
                body = { error_parsing: true, original_record: record };
            }
            body.estado = 'FAILED';
            body.fecha_procesamiento = new Date().toISOString();
            body.error_detalle = error instanceof Error ? error.message : 'Error desconocido';
            
            mensajesProcesados.push(body);
        }
    }

    return mensajesProcesados;
};