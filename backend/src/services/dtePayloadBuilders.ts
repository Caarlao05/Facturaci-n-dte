export const buildDTEPayload = (
  dteType: string,
  customerRecord: any,
  customerEmail: string,
  items: any[],
  generationCode: string,
  numeroControl: string,
  totals: any
): any => {
  const commonIdentificacion = {
    version: dteType === '14' ? 1 : 3, // Simplificación
    ambiente: "01",
    tipoDte: dteType,
    numeroControl: numeroControl,
    codigoGeneracion: generationCode,
    tipoModelo: 1,
    tipoOperacion: 1,
    tipoContingencia: null,
    motivoContin: null,
    fecEmi: new Date().toISOString().split('T')[0],
    horEmi: new Date().toISOString().split('T')[1].substring(0,8),
    tipoMoneda: "USD"
  };

  const commonEmisor = {
    nit: "06141004241015",
    nrc: "3420439",
    nombre: "G&G SOLUTIONS, SOCIEDAD POR ACCIONES SIMPLIFICADA DE CAPITAL VARIABLE",
    nombreComercial: "G&G SOLUTIONS",
    codActividad: "62020",
    descActividad: "Consultorías y gestión de servicios informáticos",
    codEstable: "M001",
    codEstableMH: "M001",
    codPuntoVenta: "1",
    codPuntoVentaMH: "P001",
    direccion: { departamento: "05", municipio: "28", complemento: "CALLE ITSHUATAN, POLIGONO J -33" },
    telefono: "78688228",
    correo: "rafaelgomez@ggsolutionssv.com",
    tipoEstablecimiento: "02"
  };

  if (dteType === '14') {
    return {
      identificacion: { ...commonIdentificacion, version: 1 },
      emisor: commonEmisor,
      sujetoExcluido: {
        tipoDocumento: "13", // DUI
        numDocumento: customerRecord.dui || "00000000-0",
        nombre: customerRecord.name,
        codActividad: customerRecord.economicActivityCode || "10005",
        descActividad: "Servicios Varios",
        direccion: { departamento: "06", municipio: "14", complemento: "San Salvador" },
        telefono: "22222222",
        correo: customerEmail || "sujeto@excluido.com"
      },
      cuerpoDocumento: items.map((item, idx) => ({
        numItem: idx + 1,
        tipoItem: 1,
        cantidad: item.qty,
        codigo: null,
        uniMedida: 59,
        descripcion: item.desc,
        precioUni: Number(item.price.toFixed(2)),
        montoDescu: 0,
        compra: Number((item.qty * item.price).toFixed(2))
      })),
      resumen: {
        totalCompra: Number(totals.subTotal.toFixed(2)),
        descu: 0,
        totalDescu: 0,
        subTotal: Number(totals.subTotal.toFixed(2)),
        ivaRete1: 0,
        reteRenta: Number(totals.renta.toFixed(2)),
        totalPagar: Number(totals.totalPagar.toFixed(2)),
        totalLetras: "TOTAL EN LETRAS MOCK",
        condicionOperacion: 2
      },
      apendice: null
    };
  }

  // Comunes para 01, 03, 05, 11
  let dtePayload: any = {
    identificacion: commonIdentificacion,
    emisor: commonEmisor,
    receptor: {
      nit: (customerRecord.nit || "00000000000000").replace(/-/g, ''),
      nrc: customerRecord.nrc || null,
      nombre: customerRecord.name,
      nombreComercial: null,
      codActividad: customerRecord.economicActivityCode || "64199",
      descActividad: "Otras actividades",
      direccion: { departamento: "06", municipio: "23", complemento: "SAN SALVADOR" },
      telefono: "22222222",
      correo: customerEmail || "receptor@cliente.com"
    },
    cuerpoDocumento: items.map((item, idx) => ({
      numItem: idx + 1,
      tipoItem: 1,
      cantidad: item.qty,
      codigo: null,
      codTributo: null,
      numeroDocumento: null,
      uniMedida: 59,
      descripcion: item.desc,
      precioUni: Number(item.price.toFixed(2)),
      montoDescu: 0,
      ventaNoSuj: 0,
      ventaExenta: 0,
      ventaGravada: Number((item.qty * item.price).toFixed(2)),
      tributos: ['01', '11'].includes(dteType) ? null : ["20"],
      psv: 0,
      noGravado: 0
    })),
    resumen: {
      condicionOperacion: 2,
      descuExenta: 0,
      descuGravada: 0,
      descuNoSuj: 0,
      ivaPerci1: 0,
      ivaRete1: Number(totals.ivaRete1.toFixed(2)),
      reteRenta: 0,
      montoTotalOperacion: Number(totals.montoTotalOperacion.toFixed(2)),
      numPagoElectronico: null,
      pagos: null,
      porcentajeDescuento: 0,
      saldoFavor: 0,
      subTotal: Number(totals.subTotal.toFixed(2)),
      subTotalVentas: Number(totals.subTotal.toFixed(2)),
      totalDescu: 0,
      totalExenta: 0,
      totalGravada: Number(totals.subTotal.toFixed(2)),
      totalLetras: "TOTAL EN LETRAS MOCK",
      totalNoGravado: 0,
      totalNoSuj: 0,
      totalPagar: Number(totals.totalPagar.toFixed(2)),
      tributos: ['01', '11'].includes(dteType) ? null : [{ codigo: "20", descripcion: "Impuesto al Valor Agregado 13%", valor: Number(totals.totalTaxes.toFixed(2)) }]
    },
    extension: {
      docuEntrega: null,
      docuRecibe: null,
      nombEntrega: null,
      nombRecibe: null,
      observaciones: "Condiciones estandar",
      placaVehiculo: null
    },
    apendice: null,
    documentoRelacionado: null,
    otrosDocumentos: null,
    ventaTercero: null
  };

  // Ajustes de FCF
  if (dteType === '01') {
    dtePayload.identificacion.version = 1;
    dtePayload.receptor.tipoDocumento = "36"; // NIT
    dtePayload.receptor.numDocumento = dtePayload.receptor.nit;
  }

  // Ajustes de Exportación (11)
  if (dteType === '11') {
    dtePayload.identificacion.version = 1;
    dtePayload.receptor.tipoDocumento = "37"; // Otro (Extranjero)
    dtePayload.receptor.numDocumento = (customerRecord.nit || "EX-001").replace(/-/g, '');
    dtePayload.receptor.nombre = customerRecord.name;
    dtePayload.receptor.descActividad = "Exportación de Servicios/Bienes";
    dtePayload.receptor.codActividad = "10005"; // Código genérico aplicable internacionalmente o mapeado
    // Obligatorio en DTE 11:
    dtePayload.extension.observaciones = `Incoterm: ${customerRecord.incoterm || 'FOB'}`;
    dtePayload.apendice = [
      { campo: "PaisDestino", etiqueta: "País de Destino", valor: customerRecord.paisDestino || "USA" }
    ];
  }

  // Ajustes de Nota de Crédito
  if (dteType === '05' || dteType === '06') {
    dtePayload.documentoRelacionado = [{
      tipoDocumento: "03", // Asumimos que modifica un CCF por defecto
      tipoGeneracion: 2,
      numeroDocumento: customerRecord.docRelacionado,
      fechaEmision: new Date().toISOString().split('T')[0]
    }];
    dtePayload.extension.observaciones = customerRecord.motivoContin;
  }

  return dtePayload;
};
