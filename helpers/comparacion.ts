import { desc, eq } from "drizzle-orm";
import { ExpedienteObjeto } from "../types/expediente.type.js";
import { acuerdosHistorial, expedientes, extractos, juzgados, usuarioAttributes, usuarioExpedientes, usuarios } from "../schema.js";
import { ComparacionResultado, PropsAcuerdos } from "../types/expediente-queue.type.js";
import { db } from "../db.js";

export async function comparacionAcuerdos({
    usuarioExpediente,
    hashNuevo,
    acuerdosActuales,
}: PropsAcuerdos): Promise<ComparacionResultado> {
    
    const ultimoAcuerdo = await db
        .select()
        .from(acuerdosHistorial)
        .where(eq(acuerdosHistorial.usuarioExpedienteId, usuarioExpediente))
        .orderBy(desc(acuerdosHistorial.createdAt))
        .limit(1);

    const hashAnterior = ultimoAcuerdo[0]?.hash;

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

    const haCambiado = hashAnterior !== hashNuevo;

    if (haCambiado) {
        const acuerdosAnteriores = ultimoAcuerdo[0].acuerdos as ExpedienteObjeto[];
        
        const cambiosRealizados = detectarCambiosEnAcuerdos(
            acuerdosAnteriores,
            acuerdosActuales,
        );

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
            
            // Retornamos directamente la estructura completa. 
            // Esto es lo que la nueva cola consumirá.
            return {
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
        }
    }

    return {
        nuevoRegistro: false,
        haCambiado: false,
        mensaje: "El acuerdo es el mismo. No se creó un nuevo registro.",
    };
}

function detectarCambiosEnAcuerdos(
    acuerdosAnteriores: ExpedienteObjeto[] | undefined | null,
    acuerdosActuales: ExpedienteObjeto[] | undefined | null,
): ExpedienteObjeto[] {
    const cambios: ExpedienteObjeto[] = [];
    
    const anteriores = Array.isArray(acuerdosAnteriores) ? acuerdosAnteriores : [];
    const actuales = Array.isArray(acuerdosActuales) ? acuerdosActuales : [];

    if (anteriores.length === 0 && actuales.length === 0) return [];

    const mapaAcuerdosAnteriores = new Map<string, ExpedienteObjeto>();
    
    anteriores.forEach((acuerdo) => {
        if (!acuerdo) return;
        const clave = `${acuerdo.EXP}-${acuerdo.FCH_ACU}`;
        mapaAcuerdosAnteriores.set(clave, acuerdo);
    });

    actuales.forEach((acuerdoActual) => {
        if (!acuerdoActual) return;

        const clave = `${acuerdoActual.EXP}-${acuerdoActual.FCH_ACU}`;
        const acuerdoAnterior = mapaAcuerdosAnteriores.get(clave);

        if (!acuerdoAnterior) {
            cambios.push(acuerdoActual);
            return;
        }

        const camposRelevantes: (keyof ExpedienteObjeto)[] = [
            "DESCRIP", "NOTIFICACI", "BOLETIN", "BOLETIN2", "BOLETIN3",
            "TIPO", "DI", "FCH_RES", "act_names", "dem_names", "aut_names", "pro_names",
        ];

        const hayCambios = camposRelevantes.some((campo) => {
            const valAnterior = String(acuerdoAnterior[campo] ?? "").trim();
            const valActual = String(acuerdoActual[campo] ?? "").trim();
            return valAnterior !== valActual;
        });

        if (hayCambios) {
            cambios.push(acuerdoActual);
        }

        mapaAcuerdosAnteriores.delete(clave);
    });

    mapaAcuerdosAnteriores.forEach((acuerdoEliminado) => {
        cambios.push(acuerdoEliminado);
    });

    return cambios;
}