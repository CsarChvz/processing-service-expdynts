import { ComparacionResultado } from "../types/expediente-queue.type.js";

export function formatMessage(data: ComparacionResultado): string {
    let message = "";

    try {
      if (data.nuevoRegistro) {
        message += "🆕 *¡Nuevo expediente detectado!*\n\n";
      } else if (data.haCambiado && data.data) {
        message +=
          "📝 *Se han detectado cambios en un expediente existente*\n\n";
      } else {
        return "✅ No se han detectado cambios en los expedientes monitoreados.";
      }

      if (data.data) {
        const expedienteExp = data.data.expediente?.exp || "";
        const expedienteFecha = data.data.expediente?.fecha || "";
        const juzgadoName = data.data.juzgado?.name || "";
        const juzgadoExtracto =
          data.data.extracto?.extracto_name || "";
        const telefono = data.data.atributosUsuario?.telefono || "";

        message += `*Expediente:* ${expedienteExp}\n`;
        message += `*Año:* ${expedienteFecha}\n`;
        message += `*Juzgado:* ${juzgadoName}\n`;
        message += `*Lugar:* ${juzgadoExtracto}\n`;

        if (telefono) {
          message += `*Teléfono de contacto:* ${telefono}\n`;
        }

        const cambiosRealizados = data.data.cambiosRealizados || [];
        if (cambiosRealizados.length > 0) {
          message += "\n*Cambios realizados:*\n";

          for (let i = 0; i < cambiosRealizados.length; i++) {
            const cambio = cambiosRealizados[i];
            if (!cambio) continue;

            message += `\n📋 *Cambio ${i + 1}:*\n`;

            const exp = cambio.EXP || "";
            const cveJuz = cambio.CVE_JUZ || "";
            const fchPro = cambio.FCH_PRO
              ? new Date(cambio.FCH_PRO).getTime()
              : null;
            const fchAcu = cambio.FCH_ACU
              ? new Date(cambio.FCH_ACU).getTime()
              : null;
            const fchRes = cambio.FCH_RES
              ? new Date(cambio.FCH_RES).getTime()
              : null;
            const boletin = cambio.BOLETIN || "";
            const boletin2 = cambio.BOLETIN2 || "";
            const boletin3 = cambio.BOLETIN3 || "";
            const descrip = cambio.DESCRIP || "";
            const actNames = cambio.act_names || "";
            const demNames = cambio.dem_names || "";
            const autNames = cambio.aut_names || "";
            const proNames = cambio.pro_names || "";

            message += `• *Expediente:* ${exp}\n`;
            message += `• *Juzgado:* ${cveJuz}\n`;
            if (fchPro) {
              message += `• *Fecha de procedimiento:* ${formatDate(fchPro)}\n`;
            }
            if (fchAcu) {
              message += `• *Fecha de acuerdo:* ${formatDate(fchAcu)}\n`;
            }
            if (fchRes) {
              message += `• *Fecha de resolución:* ${formatDate(fchRes)}\n`;
            }
            if (boletin) message += `• *Boletín principal:* ${boletin}\n`;
            if (boletin2) message += `• *Boletín secundario:* ${boletin2}\n`;
            if (boletin3) message += `• *Boletín terciario:* ${boletin3}\n`;
            if (descrip) message += `• *Descripción:* "${descrip}"\n`;
            if (actNames) message += `• *Actores:* ${actNames}\n`;
            if (demNames) message += `• *Demandados:* ${demNames}\n`;
            if (autNames) message += `• *Autoridades:* ${autNames}\n`;
            if (proNames) message += `• *Procedimiento:* ${proNames}\n`;
          }
        }
      }
    } catch (error) {
      console.error(
        `Error formateando mensaje: ${(error as Error).message}`,
      );
      message =
        "⚠️ Error al procesar la notificación. Por favor, consulte el sistema para más detalles.";
    }

    return message;
  }

  function formatDate(timestamp: number): string {
    try {
      const date = new Date(timestamp);
      return date.toLocaleDateString("es-MX", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "Fecha no disponible";
    }
  }
