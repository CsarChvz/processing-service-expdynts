// /* eslint-disable @typescript-eslint/no-explicit-any */
// import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

// import { fetchExpediente } from './helpers/query.js';
// import { generarHash } from './helpers/hash.js';
// import { comparacionAcuerdos } from './helpers/comparacion.js';

// interface ProcessResult {
//     id: string;
//     processed: boolean;
//     processingTime: number;
//     result: string;
// }


// // Función auxiliar para parsear el payload
// const parsePayload = (event: APIGatewayProxyEvent): any => {
//     let payload: any;

//     if (typeof event.body === 'string') {
//         try {
//             payload = JSON.parse(event.body);
//         } catch (parseError) {
//             console.error('Error parseando body como JSON:', parseError);
//             throw new Error('Invalid JSON in body');
//         }
//     } else if (event.body && typeof event.body === 'object') {
//         payload = event.body;
//     } else {
//         payload = event;
//     }

//     return payload;
// };

// // Función auxiliar para crear respuesta HTTP
// const createResponse = (statusCode: number, message: string, data?: any): APIGatewayProxyResult => {
//     return {
//         statusCode,
//         headers: {
//             'Content-Type': 'application/json',
//             'Access-Control-Allow-Origin': '*',
//         },
//         body: JSON.stringify({
//             message,
//             timestamp: new Date().toISOString(),
//             ...data
//         }),
//     };
// };

// // Función principal de procesamiento (siguiendo la lógica del consumer)
// const processExpediente = async (payload: any): Promise<ProcessResult> => {
//     const startTime = Date.now();
//     const id = payload.data?.usuarioExpedientesId.toString();
    
//     console.log(`🔄 Procesando expediente: ${id}`);

//     // Variables tipadas explícitamente para evitar errores
//     let expedienteResult: any[] | null = null;
//     let acuerdoHashed: string | null = null;
//     let resultadoComparacion: any | null = null;

//     try {
//         const { usuarioExpedientesId, expedienteId,} = payload.data;
        
//         // Progreso: 10% - Iniciando proceso
//         console.log(`📊 Progreso exp ${id}: 10% - Iniciando proceso`);
//         console.log(payload)
//         // Aquí iría la lógica para obtener el expediente de fuente externa
//         expedienteResult = await fetchExpediente(payload.data?.expediente?.url ?? "");
//         // Progreso: 40% - Expediente obtenido
//         console.log(`📊 Progreso exp ${id}: 40% - Expediente obtenido de fuente externa`);

//         // Aquí iría la generación del hash
//         acuerdoHashed = await generarHash(JSON.stringify(expedienteResult));

//         // Progreso: 60% - Hash generado
//         console.log(`📊 Progreso exp ${id}: 60% - Hash generado`);

//         // Aquí iría la comparación de acuerdos
//         resultadoComparacion = await comparacionAcuerdos({
//             acuerdosActuales: expedienteResult,
//             hashNuevo: acuerdoHashed,
//             usuarioExpediente: usuarioExpedientesId,
//         });

//         console.log(resultadoComparacion)
//         // Progreso: 80% - Comparación completada
//         console.log(`📊 Progreso exp ${id}: 80% - Comparación completada`);

//         // // Condición para enviar notificación (vacía como solicitaste)
//         // if (resultadoComparacion && resultadoComparacion.haCambiado === true) {

//         //     await sendNotification('/api/sendText', {
//         //         phone: '',
//         //         text: ''
//         //     })
//         //     console.log(`🔔 Exp ${id}: Cambios detectados, se debería agregar a cola de notificaciones`);
//         // }

//         // Aquí iría la actualización de acuerdos del expediente
//         // await updateAcuerdosExpediente(expedienteId, expedienteResult);

//         // Progreso: 100% - Proceso completado
//         console.log(`📊 Progreso exp ${id}: 100% - Proceso completado`);

//         const processingTime = Date.now() - startTime;
//         return {
//             id,
//             processed: true,
//             processingTime,
//             result: `Expediente ${id} procesado correctamente`,
//         };

//     } catch (error) {
//         console.error(`❌ Error procesando exp ${id}: ${error instanceof Error ? error.message : 'Error desconocido'}`);
        
//         // Marcar como fallido y incrementar reintentos
//         const retries = (payload as any).retries || 0;
//         console.log(`🔄 Reintento ${retries + 1} para exp ${id}`);
        
//         throw error;
//     } finally {
//         // Limpieza segura de memoria
//         expedienteResult = null;
//         resultadoComparacion = null;
//         acuerdoHashed = null;
//         console.log(`🧹 Limpieza de memoria completada para exp ${id}`);
//     }
// };

// // Función principal del lambda
// export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
//     const startTime = Date.now();
    
//     try {
//         console.log('🚀 Lambda receptora iniciada');
//         console.log('📨 Evento recibido:', JSON.stringify(event, null, 2));

//         // Parsear y validar payload
//         const payload = parsePayload(event);
//         console.log('✅ Payload parseado correctamente:', JSON.stringify(payload, null, 2));

//         // Procesar expediente siguiendo la lógica del consumer
//         const result = await processExpediente(payload);

//         const totalProcessingTime = Date.now() - startTime;
//         console.log(`✅ Proceso completado en ${totalProcessingTime}ms`);

//         return createResponse(201, 'Expediente procesado exitosamente', {
//            // ...result,
//             totalProcessingTimeMs: totalProcessingTime
//         });

//     } catch (error) {
//         const processingTime = Date.now() - startTime;
//         console.error('❌ Error en lambda receptora:', error);
        
//         // Determinar código de estado basado en el tipo de error
//         const statusCode = error instanceof Error && error.message.includes('JSON') ? 400 : 
//                           error instanceof Error && error.message.includes('inválido') ? 400 : 500;
        
//         const errorMessage = error instanceof Error ? error.message : 'Error interno al procesar expediente';
        
//         return createResponse(statusCode, errorMessage, {
//             processingTimeMs: processingTime,
//             error: error instanceof Error ? error.name : 'UnknownError'
//         });
//     }
// };

// No necesitamos importar el AWS SDK aquí porque EventBridge maneja el transporte.
// Solo recibimos datos, transformamos y retornamos.

export const handler = async (event: any[]): Promise<any[]> => {
    const mensajesProcesados: any[] = [];

    for (const record of event) {
        try {
            // Pipes entrega el body de SQS como string JSON
            const body = JSON.parse(record.body);
            console.log("=====================================")
            console.log(body);
            console.log("=====================================")

            const messageId = record.messageId;
            const idProceso = body.id_proceso || 0;

            if (idProceso % 2 === 0) {
                body.estado = 'UPDATED';
            } else {
                body.estado = 'FAILED';
            }

            body.fecha_procesamiento = new Date().toISOString();

            console.log(`Item ${messageId} (ID: ${idProceso}) evaluado como: ${body.estado}`);
            
            mensajesProcesados.push(body);
        } catch (error) {
            console.error(`Error procesando mensaje:`, error);
        }
    }

    // El Pipe empujará este array hacia el Event Bus
    return mensajesProcesados;
};