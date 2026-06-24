import { desc, eq } from "drizzle-orm";
import { ExpedienteObjeto } from "../types/expediente.type.js";
import { acuerdosHistorial, expedientes, extractos, juzgados, usuarioAttributes, usuarioExpedientes, usuarios } from "../schema.js";
import { ComparacionResultado, PropsAcuerdos } from "../types/expediente-queue.type.js";
import { db } from "../db.js";
import { sendNotification } from "./notification.js";
import { formatMessage } from "./format.js";

export async function comparacionAcuerdos({
    usuarioExpediente,
    hashNuevo,
    acuerdosActuales,
}: PropsAcuerdos): Promise<ComparacionResultado> {
    
    // 1. Buscar el último hash guardado para ese expediente
    const ultimoAcuerdo = await db
        .select()
        .from(acuerdosHistorial)
        .where(eq(acuerdosHistorial.usuarioExpedienteId, usuarioExpediente))
        .orderBy(desc(acuerdosHistorial.createdAt))
        .limit(1);

    const hashAnterior = ultimoAcuerdo[0]?.hash;

    // ---------------------------------------------------------
    // CORRECCIÓN PRINCIPAL:
    // Drizzle devuelve un array vacío [] si no encuentra nada.
    // Validamos explícitamente si está vacío o si el índice 0 no existe.
    // ---------------------------------------------------------
    if (ultimoAcuerdo.length === 0 || !ultimoAcuerdo[0]) {
        await db.insert(acuerdosHistorial).values({
            acuerdos: acuerdosActuales,
            usuarioExpedienteId: usuarioExpediente,
            hash: hashNuevo,
            createdAt: new Date(),
        });

        return {
            nuevoRegistro: true,
            haCambiado: false,
            mensaje: "No existía historial previo, se creó uno nuevo.",
        };
    }

    // 3. Si ya hay un hash, se compara con el nuevo
    const haCambiado = hashAnterior !== hashNuevo;

    if (haCambiado) {
        // Ahora es seguro acceder a [0] porque ya pasó el if de arriba
        const acuerdosAnteriores = ultimoAcuerdo[0].acuerdos as ExpedienteObjeto[];
        
        const cambiosRealizados = detectarCambiosEnAcuerdos(
            acuerdosAnteriores,
            acuerdosActuales,
        );

        // 3.1 Guardamos el nuevo hash si ha cambiado
        const acuerdoHistorialNuevo = await db
            .insert(acuerdosHistorial)
            .values({
                acuerdos: acuerdosActuales,
                usuarioExpedienteId: usuarioExpediente,
                cambios_realizados: cambiosRealizados,
                hash: hashNuevo,
                createdAt: new Date(),
            })
            .returning({ userExpedienteId: acuerdosHistorial.usuarioExpedienteId });

        const userExpediente = await db
            .select({
                usuarioExpedientes: usuarioExpedientes,
                usuario: usuarios,
                attributes: usuarioAttributes,
                expediente: {
                    exp: expedientes.exp,
                    fecha: expedientes.fecha,
                    cve_juz: expedientes.cve_juz,
                    url: expedientes.url,
                },
                juzgado: juzgados,
                extracto: extractos,
            })
            .from(usuarioExpedientes)
            .where(eq(usuarioExpedientes.usuarioExpedientesId, acuerdoHistorialNuevo[0].userExpedienteId))
            .leftJoin(usuarios, eq(usuarioExpedientes.usuarioId, usuarios.usuarioId))
            .leftJoin(usuarioAttributes, eq(usuarios.usuarioId, usuarioAttributes.usuarioAttributeId))
            .leftJoin(expedientes, eq(usuarioExpedientes.expedienteId, expedientes.expedienteId))
            .leftJoin(juzgados, eq(expedientes.cve_juz, juzgados.juzgadoId))
            .leftJoin(extractos, eq(juzgados.extractoId, extractos.extractoId));

        const resultado = userExpediente[0];

        if (
            resultado?.expediente?.exp !== undefined &&
            resultado?.expediente?.fecha !== undefined &&
            resultado?.juzgado !== null
        ) {

            console.log("VALIDACION LOCA-----------")
            let textoWhatsApp: string | null = null;

            let content: ComparacionResultado = {
                nuevoRegistro: false,
                haCambiado: true,
                mensaje: "Nuevo acuerdo",
                data: {
                    cambiosRealizados,
                    atributosUsuario: {
                        telefono: resultado.attributes?.phoneNumber ?? "",
                    },
                    expediente: {
                        exp: resultado.expediente.exp,
                        fecha: resultado.expediente.fecha,
                    },
                    juzgado: resultado.juzgado,
                    extracto: resultado.extracto
                },
            };

            textoWhatsApp = formatMessage(content);
            await sendNotification('/api/sendText', {
                phone: resultado.attributes?.phoneNumber ?? "",
                text: textoWhatsApp ?? "",
            })

            return {
                nuevoRegistro: false,
                haCambiado: true,
                mensaje: "Nuevo acuerdo",
            };
        }

    }

    // 4. Si no ha cambiado, no hacemos nada
    return {
        nuevoRegistro: false,
        haCambiado: false,
        mensaje: "El acuerdo es el mismo. No se creó un nuevo registro.",
    };
}

// ---------------------------------------------------------
// FUNCIÓN AUXILIAR BLINDADA
// ---------------------------------------------------------
function detectarCambiosEnAcuerdos(
    acuerdosAnteriores: ExpedienteObjeto[] | undefined | null,
    acuerdosActuales: ExpedienteObjeto[] | undefined | null,
): ExpedienteObjeto[] {
    const cambios: ExpedienteObjeto[] = [];
    
    // Validación defensiva real usando Array.isArray
    const anteriores = Array.isArray(acuerdosAnteriores) ? acuerdosAnteriores : [];
    const actuales = Array.isArray(acuerdosActuales) ? acuerdosActuales : [];

    // Si ambos están vacíos, retorno rápido
    if (anteriores.length === 0 && actuales.length === 0) return [];

    // Crear un mapa de los acuerdos anteriores usando una clave compuesta
    const mapaAcuerdosAnteriores = new Map<string, ExpedienteObjeto>();
    
    anteriores.forEach((acuerdo) => {
        if (!acuerdo) return; // Protección contra nulos dentro del array
        const clave = `${acuerdo.EXP}-${acuerdo.FCH_ACU}`;
        mapaAcuerdosAnteriores.set(clave, acuerdo);
    });

    // Verificar cada acuerdo actual contra los anteriores
    actuales.forEach((acuerdoActual) => {
        if (!acuerdoActual) return; // Protección contra nulos

        const clave = `${acuerdoActual.EXP}-${acuerdoActual.FCH_ACU}`;
        const acuerdoAnterior = mapaAcuerdosAnteriores.get(clave);

        // Si no existe el acuerdo anterior con la misma clave, es nuevo
        if (!acuerdoAnterior) {
            cambios.push(acuerdoActual);
            return;
        }

        // Si existe, verificamos si algún campo relevante ha cambiado
        const camposRelevantes: (keyof ExpedienteObjeto)[] = [
            "DESCRIP", "NOTIFICACI", "BOLETIN", "BOLETIN2", "BOLETIN3",
            "TIPO", "DI", "FCH_RES", "act_names", "dem_names", "aut_names", "pro_names",
        ];

        const hayCambios = camposRelevantes.some((campo) => {
            // Normalizamos a string y trim para evitar falsos positivos por null vs undefined o espacios
            const valAnterior = String(acuerdoAnterior[campo] ?? "").trim();
            const valActual = String(acuerdoActual[campo] ?? "").trim();
            return valAnterior !== valActual;
        });

        if (hayCambios) {
            cambios.push(acuerdoActual);
        }

        // Eliminar del mapa para rastrear después los que fueron eliminados
        mapaAcuerdosAnteriores.delete(clave);
    });

    // Los acuerdos que quedaron en el mapa son los que ya no existen en la versión actual (eliminados)
    mapaAcuerdosAnteriores.forEach((acuerdoEliminado) => {
        cambios.push(acuerdoEliminado);
    });

    return cambios;
}