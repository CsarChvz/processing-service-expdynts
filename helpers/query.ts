import { eq } from 'drizzle-orm';
import { db } from '../db.js';
import { expedientes } from '../schema.js';
import { Acuerdo } from '../types/expediente-queue.type.js';
import { HttpsProxyAgent } from "https-proxy-agent";
import axios from 'axios';
import { ExpedienteObjeto } from '../types/expediente.type.js';

interface ContentMessage {
    phone: string;
    text: string;
}

async function sendNotification(endPoint: string, contentMessage: ContentMessage) {
    const notificationUrl = process.env.NOTIFICATION_URL;

    if (!notificationUrl) {
        throw new Error('La variable de entorno NOTIFICATION_URL no está definida.');
    }

    const payload = {
        chatId: contentMessage.phone + '@c.us',
        reply_to: null,
        text: contentMessage.text,
        linkPreview: true,
        linkPreviewHighQuality: false,
        session: 'default',
    };

    try {
        const result = await axios.post(notificationUrl + endPoint, payload, {
            headers: {
                accept: 'application/json',
                'Content-Type': 'application/json',
            },
        });
        return result.data;
    } catch (error) {
        // Aquí puedes manejar el error de forma más específica si lo necesitas
        if (axios.isAxiosError(error)) {
            console.error('Error al enviar la notificación:', error.message);
            if (error.response) {
                console.error('Datos de respuesta de error:', error.response.data);
                console.error('Estado de respuesta de error:', error.response.status);
            }
        } else {
            console.error('Error inesperado al enviar la notificación:', error);
        }
        throw error; // Re-lanza el error para que sea manejado por quien llame a la función
    }
}

// Actualización del campo acuerdos_json
async function updateAcuerdosExpediente(expedienteId: number, acuerdos: Acuerdo): Promise<void> {
    await db.update(expedientes).set({ acuerdos_json: acuerdos }).where(eq(expedientes.expedienteId, expedienteId));
}

async function fetchExpediente(url: string): Promise<ExpedienteObjeto[]> {
    // const login = 'a698053eb4a3eeaabac6';
    // const password = '9ce98dafba032b0f';
    // const host = 'gw.dataimpulse.com';
    // const port = '823'; // Este es un puerto HTTP/Socks/otro para el proxy
    const login = "brd-customer-hl_6e97d2e6-zone-try-country-mx";
    const password = "ffz23tieylxi";
    const host = "brd.superproxy.io";
    const port = "33335";
    // Construye la URL del proxy con autenticación
    const proxyUrl = `http://${login}:${password}@${host}:${port}/`;
    const httpsAgent = new HttpsProxyAgent(proxyUrl);
    console.log("URL--------------------",url)
    try {
      const result = await axios.get(url, {

        httpsAgent: httpsAgent,

      });
      console.log("RESULTADO:   -----")
      console.log(result)
      return result.data.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Error al obtener expediente:', error.message);
        if (error.response) {
          console.error('Datos de respuesta de error:', error.response.data);
          console.error('Estado de respuesta de error:', error.response.status);
        } else if (error.request) {
          console.error('No se recibió respuesta para la solicitud:', error.request);
        }
      } else {
        console.error('Ocurrió un error inesperado:', error);
      }
      throw error; // Re-lanza el error para que sea manejado por quien llama a la función
    }
  }
  
  export {fetchExpediente, sendNotification, updateAcuerdosExpediente}