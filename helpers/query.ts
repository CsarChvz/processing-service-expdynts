import { eq } from 'drizzle-orm';
import { db } from '../db.js';
import { expedientes } from '../schema.js';
import { Acuerdo } from '../types/expediente-queue.type.js';
import { HttpsProxyAgent } from 'https-proxy-agent';
import axios from 'axios';
import { ExpedienteObjeto } from '../types/expediente.type.js';

/**
 * Actualiza los acuerdos de un expediente en la base de datos.
 */
async function updateAcuerdosExpediente(expedienteId: number, acuerdos: Acuerdo): Promise<void> {
    await db.update(expedientes)
        .set({ acuerdos_json: acuerdos })
        .where(eq(expedientes.expedienteId, expedienteId));
}

/**
 * Obtiene la información de un expediente a través de un proxy.
 */
async function fetchExpediente(url: string): Promise<ExpedienteObjeto[]> {
    const login = process.env.PROXY_LOGIN;
    const password = process.env.PROXY_PASSWORD;
    const host = process.env.PROXY_HOST || 'brd.superproxy.io';
    const port = process.env.PROXY_PORT || '33335';

    if (!login || !password) {
        throw new Error('Faltan las variables de entorno PROXY_LOGIN o PROXY_PASSWORD.');
    }

    const proxyUrl = `http://${login}:${password}@${host}:${port}/`;
    const httpsAgent = new HttpsProxyAgent(proxyUrl);

    try {
        const result = await axios.get(url, {
            httpsAgent,
            timeout: 15000, 
        });
        
        return result.data.data;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error(`Error al obtener expediente (${url}):`, error.message);
            if (error.response) {
                console.error('Detalles de respuesta:', error.response.status, error.response.data);
            }
        } else {
            console.error('Ocurrió un error inesperado al hacer fetch del expediente:', error);
        }
        throw error;
    }
}
  
export { fetchExpediente, updateAcuerdosExpediente };