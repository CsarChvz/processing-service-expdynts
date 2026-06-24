import { 
    SQSClient, 
    SendMessageCommand, 
    ReceiveMessageCommand, 
    DeleteMessageCommand 
} from "@aws-sdk/client-sqs";

// IMPORTANTE: Reemplaza estas URLs con los Outputs que te dé Terraform
const COLA_A_URL = "https://sqs.us-east-1.amazonaws.com//processing-service-expdynts-cola-a-origen"
const COLA_B_URL = "https://sqs.us-east-1.amazonaws.com//processing-service-expdynts-cola-b-destino"

const sqs = new SQSClient({ region: "us-east-1" });

const inyectarMensajes = async (n: number) => {
    console.log(`\n--- Inyectando ${n} mensajes en Cola A ---`);
    for (let i = 1; i <= n; i++) {
        const msg = { id_proceso: i, datos: 'test_data_ts' };
        await sqs.send(new SendMessageCommand({
            QueueUrl: COLA_A_URL,
            MessageBody: JSON.stringify(msg)
        }));
    }
    console.log("Inyección completada.\n");
};

const observarFlujo = async (nEsperados: number) => {
    console.log("--- Observando llegada a Cola B (Solo deben llegar los pares) ---");
    let recibidos = 0;
    const objetivo = Math.floor(nEsperados / 2); // Esperamos la mitad
    
    while (recibidos < objetivo) {
        const response = await sqs.send(new ReceiveMessageCommand({
            QueueUrl: COLA_B_URL,
            MaxNumberOfMessages: 1,
            WaitTimeSeconds: 5 // Long polling
        }));
        
        if (response.Messages && response.Messages.length > 0) {
            for (const msg of response.Messages) {
                const body = JSON.parse(msg.Body!);
                // EventBridge envuelve el body en la llave 'detail'
                const datosFinales = body.detail || body; 
                
                recibidos++;
                console.log(`[${recibidos}/${objetivo}] Recibido en Cola B: ID ${datosFinales.id_proceso} | Estado: ${datosFinales.estado}`);
                
                // Eliminar el mensaje
                await sqs.send(new DeleteMessageCommand({
                    QueueUrl: COLA_B_URL,
                    ReceiptHandle: msg.ReceiptHandle!
                }));
            }
        } else {
            console.log("Sondeando la cola...");
        }
    }
    console.log("\n¡Prueba finalizada con éxito! El Event Bus filtró correctamente.");
};

// Función principal autoejecutable
(async () => {
    try {
        await inyectarMensajes(30);
        await observarFlujo(30);
    } catch (error) {
        console.error("Error durante la ejecución:", error);
    }
})();