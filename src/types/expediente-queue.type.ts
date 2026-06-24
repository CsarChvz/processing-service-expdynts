//import { ExpedienteObjeto } from "@/common/types/expediente.type";
//import { JuzgadoExtracto } from "@/database/schema";

import { Extracto, Juzgado } from "@/schema.js";
import { ExpedienteObjeto } from "./expediente.type.js";

type Acuerdo = Record<string, any>; // flexible tipo JSON

interface PropsAcuerdos {
  usuarioExpediente: number;
  hashNuevo: string;
  acuerdosActuales: ExpedienteObjeto[];
}

interface ComparacionResultado {
  nuevoRegistro: boolean;
  haCambiado: boolean;
  mensaje: string;
  data?: {
    cambiosRealizados: ExpedienteObjeto[];
    expediente: {
      exp: number;
      fecha: number;
    };
    juzgado: Juzgado;
    extracto: Extracto | null;
    atributosUsuario: {
      telefono: string;
    };
  };
}

export { Acuerdo, PropsAcuerdos, ComparacionResultado };
