/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from 'axios';

type ContentMessage = {
    phone: string;
    text: string;
};

export async function sendNotification(endPoint: string, contentMessage: ContentMessage): Promise<any> {
    const payload = {
        chatId: `${contentMessage.phone}@c.us`,
        reply_to: null,
        text: contentMessage.text,
        linkPreview: true,
        linkPreviewHighQuality: false,
        session: 'default',
    };

    const baseUrl = process.env.NOTIFICATION_URL;
    if (!baseUrl) {
        throw new Error('NOTIFICATION_URL no está definida en las variables de entorno');
    }

    try {
        const { data } = await axios.post(`${baseUrl}${endPoint}`, payload, {
            headers: {
                accept: 'application/json',
                'Content-Type': 'application/json',
            },
            // Si necesitas timeout:
            // timeout: 5000,
        });
        return data; // la respuesta del servicio externo
    } catch (error) {
        console.error('Error al enviar notificación:', error);
        throw error; // re-lanza para que el caller lo maneje
    }
}
