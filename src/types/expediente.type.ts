interface ExpedienteObjeto {
  EXP: string;
  CVE_JUZ: string;
  FCH_PRO: string;
  FCH_ACU: string;
  BOLETIN: string | null | number;
  BOLETIN2?: string | null | number;
  BOLETIN3?: string | null | number;
  TIPO: string;
  NOTIFICACI: string;
  DI: string;
  FCH_RES: string | null;
  DESCRIP: string;
  act_names: string;
  dem_names: string;
  aut_names?: string;
  pro_names?: string;
}

export { ExpedienteObjeto };
