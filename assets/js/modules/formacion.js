/* ══════════════════════════════════
   FORMACIÓN — CERTIFICACIONES, CAPACITACIONES Y HABILITACIONES
══════════════════════════════════ */

const CAT_ICONS = {
  'Láser Depilación':'⚡','Radiofrecuencia / HIFU':'💜',
  'Pressoterapia':'🌊','Electroestimulación':'⚡','General':'📋',
  'Bioseguridad':'📚','Skincare':'📚','Atención al Cliente':'📚',
  'Masajes':'💆','Cavitación':'💆','Criolipólisis':'💆','Emsculpt':'💆','Bronceado':'💆',
  'Aparatología':'🏅','Láser':'🏅','Nd:YAG':'🏅','Soprano':'🏅','Exilis':'🏅','HydraFacial':'🏅','HIFU':'🏅',
};
const MAT_ICONS = {manual:'📖',video:'🎬',guia:'📋',protocolo:'⚕️',presentacion:'📊',otro:'📌'};
const CAP_RESULTADO = {aprobada:'✅ Aprobada',pendiente:'⏳ Pendiente',no_aprobada:'❌ No aprobada'};
const HAB_ESTADOS   = {activa:'✅ Activa',suspendida:'⏸ Suspendida',vencida:'⛔ Vencida'};
const HAB_API_CATEGORIAS = {
  'Láser Depilación':'laser_diodo',
  'Radiofrecuencia / HIFU':'hifu',
  'Pressoterapia':'Pressoterapia',
  'Electroestimulación':'electroestimulacion',
  'Bioseguridad':'bioseguridad',
  'Skincare':'skincare',
  'Atención al Cliente':'atencion_cliente',
  'Masajes':'masajes',
  'Cavitación':'cavitacion',
  'Criolipólisis':'criolipolisis',
  'Emsculpt':'emsculpt',
  'Bronceado':'bronceado',
  'Aparatología':'aparatologia',
  'Láser':'laser',
  'Nd:YAG':'nd_yag',
  'Soprano':'soprano',
  'Exilis':'exilis',
  'HydraFacial':'hydrafacial',
  'HIFU':'hifu',
};
const EVAL_LASER_BASICO = {
  id:'laser-basico',
  titulo:'Test Básico — Depilación Láser',
  categoria:'Láser Depilación',
  nivel:'Básico',
  minimoAprobacion:10,
  preguntas:[
    {q:'¿En qué se basa el principio de la depilación láser?',o:['Termólisis selectiva: el láser calienta la melanina del folículo sin dañar la piel circundante','Congelación del folículo piloso','Exfoliación química de la raíz','Corriente eléctrica que destruye el bulbo'],c:0},
    {q:'¿En qué fase del ciclo del vello es efectivo el láser?',o:['Catágena','Telógena','Anágena','Exógena'],c:2},
    {q:'¿Por qué se necesitan varias sesiones de depilación láser?',o:['Porque el láser pierde potencia con el uso','Porque no todos los vellos están en fase anágena al mismo tiempo','Porque la piel necesita descanso entre sesiones','Porque el equipo se calienta y hay que apagarlo'],c:1},
    {q:'¿Cuántas sesiones se recomiendan generalmente?',o:['1-2 sesiones','3-4 sesiones','6-8 sesiones','20 sesiones'],c:2},
    {q:'¿Qué tipo de vello responde mejor al láser?',o:['Vello rubio fino','Vello blanco o canoso','Vello oscuro y grueso','Vello rojizo'],c:2},
    {q:'¿Cuál es la contraindicación más importante?',o:['Piel hidratada','Piel bronceada o con exposición solar reciente','Piel con vello oscuro','Piel con vello fino'],c:1},
    {q:'¿Qué longitud de onda usa el láser Alexandrita?',o:['532 nm','755 nm','1064 nm','810 nm'],c:1},
    {q:'¿Qué se debe hacer antes de una sesión?',o:['Depilarse con cera','Exponerse al sol para activar la melanina','Afeitar la zona 24-48 horas antes','Aplicar crema depilatoria'],c:2},
    {q:'¿El láser elimina el vello de forma permanente?',o:['Sí, con una sola sesión','Logra reducción permanente significativa con el ciclo completo','No, el vello siempre vuelve igual','Solo funciona en hombres'],c:1},
    {q:'¿Qué sensación es normal durante la sesión?',o:['Ninguna sensación','Calor y pinchazos similares a un elástico','Frío intenso','Entumecimiento total'],c:1},
    {q:'¿Con qué frecuencia se realizan las sesiones en cuerpo?',o:['Cada semana','Cada 15 días siempre','Cada 4-8 semanas según la zona','Cada 6 meses'],c:2},
    {q:'¿Qué cuidado es esencial después de cada sesión?',o:['Exponerse al sol para activar los resultados','Aplicar protector solar SPF 50+ y evitar el sol','Usar cera para eliminar los restos de vello','Aplicar agua caliente en la zona'],c:1},
  ],
};
const EVAL_LASER_INTERMEDIO = {
  id:'laser-intermedio',
  titulo:'Test Intermedio — Depilación Láser',
  categoria:'Láser Depilación',
  nivel:'Intermedio',
  minimoAprobacion:10,
  preguntas:[
    {q:'¿Cuál es la diferencia entre el láser diodo 808 nm y el Nd:YAG 1064 nm?',o:['El diodo es para pieles oscuras y el Nd:YAG para pieles claras','El diodo 808 nm es versátil para pieles intermedias; el Nd:YAG 1064 nm es más seguro en pieles oscuras tipo IV-VI','Son idénticos en resultados','El Nd:YAG no funciona en vello oscuro'],c:1},
    {q:'¿Qué es la fluencia en depilación láser?',o:['La velocidad de disparo del láser','La energía entregada por unidad de área (J/cm²)','La frecuencia de la luz','El tamaño del spot'],c:1},
    {q:'¿Por qué el láser no es efectivo en vello blanco o rubio claro?',o:['Porque ese vello es más grueso','Porque no contiene melanina suficiente para absorber la energía','Porque crece más rápido','Porque está en fase telógena siempre'],c:1},
    {q:'¿Qué es el spot size y cómo afecta el tratamiento?',o:['Es la temperatura del láser','Es el diámetro del haz; un spot mayor cubre más área y penetra más profundo','Es la duración del pulso','Es el número de disparos por sesión'],c:1},
    {q:'¿Cuál es el riesgo principal en pieles fototipos IV-VI con láser de alta fluencia?',o:['Mayor crecimiento del vello','Hiperpigmentación o hipopigmentación post-inflamatoria','Alergia al gel conductor','Caída del cabello'],c:1},
    {q:'¿Qué es la duración del pulso y por qué importa?',o:['El tiempo total de la sesión','El tiempo de cada disparo; debe ser menor al tiempo de relajación térmica del folículo','La frecuencia de los disparos','La potencia máxima del equipo'],c:1},
    {q:'¿Qué zona del cuerpo suele requerir más sesiones?',o:['Piernas','Zona hormonal (bikini, axilas, cara en mujeres)','Espalda','Brazos'],c:1},
    {q:'¿Cuál es la diferencia entre depilación láser e IPL?',o:['Son exactamente lo mismo','El láser emite luz monocromática coherente; el IPL emite luz pulsada de amplio espectro, siendo menos preciso','El IPL es más potente que el láser','El láser es más barato que el IPL'],c:1},
    {q:'¿Qué cuidado debe tener una paciente que usa retinoides antes de la sesión?',o:['No hay ningún cuidado especial','Suspender los retinoides 5-7 días antes para evitar hipersensibilidad','Aplicar más retinoide para potenciar el efecto','Usar retinoide inmediatamente después'],c:1},
    {q:'¿Qué es el efecto de peppering en depilación láser?',o:['Un efecto decorativo en la piel','Puntos oscuros temporales cuando el vello tratado emerge fragmentado antes de caer','Una quemadura superficial','Un patrón de disparo del equipo'],c:1},
    {q:'¿Cuándo está contraindicado el láser en mujeres con vello facial?',o:['Nunca','Durante embarazo, con medicación fotosensibilizante activa o patología hormonal no controlada','Solo en mujeres mayores de 50 años','Solo si la piel es clara'],c:1},
    {q:'¿Cuál es el intervalo recomendado entre sesiones en la cara?',o:['Cada 2 semanas','Cada 3-4 semanas','Cada 3 meses','Cada 6 meses'],c:1},
  ],
};
const EVAL_LASER_AVANZADO = {
  id:'laser-avanzado',
  titulo:'Test Avanzado — Depilación Láser',
  categoria:'Láser Depilación',
  nivel:'Avanzado',
  minimoAprobacion:10,
  preguntas:[
    {q:'¿Qué es el tiempo de relajación térmica (TRT)?',o:['El tiempo que tarda el equipo en enfriarse','El tiempo que tarda la estructura objetivo en perder la mitad del calor absorbido; el pulso debe ser ≤ TRT para confinamiento selectivo','La duración total de la sesión','El intervalo entre sesiones'],c:1},
    {q:'¿Qué mecanismo explica que el Nd:YAG 1064 nm sea más seguro en fototipos altos?',o:['Tiene menos potencia','A 1064 nm la absorción por melanina es mucho menor, reduciendo el riesgo de daño epidérmico','Tiene un spot más pequeño','Genera menos calor en total'],c:1},
    {q:'¿Qué es la teoría del cromóforo competitivo?',o:['Es una teoría obsoleta','La melanina epidérmica compite con la folicular por absorber energía láser, reduciendo eficacia y aumentando riesgo en pieles oscuras','Es el mecanismo por el que el láser destruye el colágeno','Solo aplica al IPL'],c:1},
    {q:'¿Cómo afecta el ciclo hormonal al resultado del láser en mujeres?',o:['No tiene ningún efecto','Los andrógenos estimulan folículos latentes; en SOP el vello regenera, requiriendo más sesiones y mantenimiento','Los estrógenos potencian el efecto del láser','Solo afecta a mujeres menopáusicas'],c:1},
    {q:'¿Qué diferencia al láser SHR del modo convencional?',o:['El SHR usa mayor fluencia por disparo','El SHR aplica múltiples pulsos de baja fluencia en movimiento, calentando el folículo gradualmente','El SHR solo funciona en pieles claras','El SHR es menos efectivo'],c:1},
    {q:'¿Cuál es la base histológica del daño permanente al folículo?',o:['Se destruye la cutícula del vello','Se produce necrosis térmica del bulge y/o la papila dérmica, eliminando la capacidad regenerativa','Se calcifica la raíz del vello','Se destruye solo la vaina radicular externa'],c:1},
    {q:'¿Qué es la hipertricosis paradójica inducida por láser?',o:['Un error de calibración del equipo','El aumento del crecimiento de vello en zonas adyacentes, posiblemente por fluencias subóptimas que estimulan en lugar de destruir','Un efecto buscado en tratamientos capilares','La caída total del vello corporal'],c:1},
    {q:'¿Cómo se determina la fluencia correcta en el test de parche?',o:['Se usa siempre la fluencia máxima','Se aplican disparos con fluencia creciente evaluando eritema perifólicular (adecuado) vs quemadura (exceso) a las 24-48 horas','Se usa la fluencia del fabricante sin ajustar','Se elige la fluencia más baja siempre'],c:1},
    {q:'¿Qué rol cumple el sistema de enfriamiento en la depilación láser?',o:['Solo mejora el confort del paciente','Protege la epidermis, permitiendo usar fluencias más altas con mayor seguridad','Aumenta la absorción del láser en el folículo','No tiene efecto real en la seguridad'],c:1},
    {q:'¿Cuál es la diferencia clínica entre hipopigmentación e hiperpigmentación post-láser?',o:['Son exactamente lo mismo','La hiperpigmentación es aumento de melanina reactiva (generalmente reversible); la hipopigmentación es destrucción de melanocitos (más permanente y difícil de tratar)','La hipopigmentación es más común','Ambas desaparecen solas en 1 semana'],c:1},
    {q:'¿Qué deben conocer los operadores sobre protección ocular?',o:['No es necesaria ninguna protección','Operador y paciente deben usar gafas certificadas para la longitud de onda específica; la exposición ocular puede causar daño retinal irreversible','Solo el operador necesita protección','Solo con potencias mayores de 100W'],c:1},
    {q:'¿Qué consideración especial requiere la zona perianal o genital?',o:['No hay ninguna consideración especial','Requiere consentimiento informado específico, parámetros conservadores, evitar mucosa directa y verificar ausencia de lesiones activas (HPV, herpes)','Solo se puede tratar en mujeres','El láser no funciona en esa zona'],c:1},
  ],
};
const EVAL_DEPILACION_LASER = EVAL_LASER_BASICO;
const EVAL_PRESOTERAPIA = {
  id:'presoterapia-basico',
  titulo:'Test básico de Presoterapia',
  categoria:'Pressoterapia',
  minimoAprobacion:23,
  preguntas:[
    {q:'¿Qué es la presoterapia?',o:['Un tratamiento con láser','Un sistema de compresión neumática secuencial','Una técnica de peeling químico','Una forma de depilación'],c:1},
    {q:'¿Cuál es uno de los objetivos principales de la presoterapia?',o:['Estimular drenaje linfático y retorno venoso','Broncear la piel','Eliminar tatuajes','Cortar el vello'],c:0},
    {q:'¿Qué sensación suele percibir la persona durante el tratamiento?',o:['Compresión rítmica o presión progresiva','Quemazón intensa obligatoria','Descarga eléctrica fuerte','Dolor punzante permanente'],c:0},
    {q:'¿Qué debe hacerse antes de iniciar una sesión?',o:['Evaluar antecedentes y contraindicaciones','Aplicar ácidos fuertes','Vendar la zona sin revisar','Indicar ayuno estricto'],c:0},
    {q:'¿Cuál es una contraindicación importante?',o:['Piernas cansadas sin patología','Trombosis venosa profunda o sospecha de trombosis','Sensación de retención leve','Uso de crema hidratante'],c:1},
    {q:'En caso de insuficiencia cardíaca descompensada, ¿qué corresponde?',o:['Aplicar más presión','Realizar igual','No realizar sin autorización médica','Hacer solo 5 minutos sin consultar'],c:2},
    {q:'¿Qué se debe hacer si hay infección activa, heridas abiertas o inflamación importante?',o:['Evitar la zona y no realizar si hay riesgo','Aplicar máxima presión','Cubrir con plástico y continuar','Ignorar si no duele'],c:0},
    {q:'¿La presoterapia reemplaza una evaluación médica en patologías circulatorias?',o:['Sí','No','Solo en verano','Depende del color de piel'],c:1},
    {q:'¿Qué debe controlar la operadora durante la sesión?',o:['Comodidad, presión, dolor, mareo o molestias','Solo el reloj','La temperatura ambiente únicamente','Que la persona no hable'],c:0},
    {q:'Si la paciente siente dolor intenso, hormigueo fuerte o malestar, ¿qué se debe hacer?',o:['Continuar','Aumentar presión','Detener o pausar y evaluar','Cambiar de música'],c:2},
    {q:'¿Qué presión debe elegirse al inicio en una persona nueva?',o:['La más alta','Una presión progresiva y tolerable','Cualquier presión','Sin importar antecedentes'],c:1},
    {q:'¿Cuál es una zona habitual de trabajo?',o:['Piernas','Párpados','Cuero cabelludo','Dientes'],c:0},
    {q:'¿Qué recomendación posterior suele ser adecuada?',o:['Hidratación y movimiento suave si corresponde','No tomar agua nunca','Exposición solar intensa obligatoria','Alcohol inmediato'],c:0},
    {q:'¿En embarazo se debe aplicar presoterapia sin consultar?',o:['Sí, siempre','No, requiere criterio profesional/médico según caso','Solo con presión máxima','Es obligatorio en todos los embarazos'],c:1},
    {q:'¿Qué dato debe registrarse en la ficha?',o:['Programa, presión, duración, zona y observaciones','Color de uñas','Canción escuchada','Marca del perfume'],c:0},
    {q:'¿Qué objetivo estético puede acompañar la presoterapia?',o:['Mejorar sensación de pesadez y edema leve','Eliminar lunares','Reemplazar cirugía','Cambiar color de ojos'],c:0},
    {q:'¿Qué debe revisarse en las botas o mangas antes de usarlas?',o:['Higiene, estado general, cierres y conexiones','Que estén perfumadas','Que tengan maquillaje','Que pesen más'],c:0},
    {q:'¿Cómo debe colocarse el accesorio?',o:['Ajustado correctamente, sin pliegues excesivos ni dolor','Lo más apretado posible','Suelto y torcido','Encima de objetos en bolsillos'],c:0},
    {q:'¿Qué condición requiere especial cuidado o derivación?',o:['Varices importantes, dolor, calor o hinchazón unilateral','Piernas normales','Cansancio leve sin otros síntomas','Piel hidratada'],c:0},
    {q:'¿Qué NO debe prometer la operadora?',o:['Resultados progresivos y realistas','Curación de enfermedades circulatorias','Sensación de alivio posible','Tratamiento complementario'],c:1},
    {q:'¿Qué hacer si una pierna está mucho más hinchada, roja o dolorida que la otra?',o:['Aplicar presión alta','No tratar y derivar/consultar','Masajear fuerte','Continuar normal'],c:1},
    {q:'¿Cuál es una buena práctica de higiene?',o:['Limpiar/desinfectar accesorios según protocolo entre pacientes','Usar las botas sin limpiar','Compartir prendas húmedas','Guardar mojado el equipo'],c:0},
    {q:'¿La presoterapia debe adaptarse a cada paciente?',o:['Sí, según condición, tolerancia y objetivo','No, todos igual','Solo según edad','Solo según altura'],c:0},
    {q:'¿Qué conducta es correcta ante una contraindicación o duda?',o:['Realizar igual','Consultar responsable o derivar antes de tratar','Ocultarlo en la ficha','Hacer menos minutos sin avisar'],c:1},
    {q:'¿Qué indica una operadora responsable?',o:['Que la paciente avise cualquier molestia durante la sesión','Que soporte todo dolor','Que no se puede pausar','Que no importa la historia clínica'],c:0},
  ],
};
const EVAL_HIFU_BASICO = {
  id:'hifu-basico',
  titulo:'Test Básico — HIFU (High Intensity Focused Ultrasound)',
  categoria:'Radiofrecuencia / HIFU',
  nivel:'Básico',
  minimoAprobacion:10,
  preguntas:[
    {q:'¿Qué significa la sigla HIFU?',o:['High Intensity Focused Ultrasound','High Impact Frequency Unit','Heat Infrared Fusion Unit','Hybrid Intense Focal Ultrasound'],c:0},
    {q:'¿Qué tipo de energía utiliza el HIFU?',o:['Luz láser','Ondas de ultrasonido','Radiofrecuencia','Corriente eléctrica'],c:1},
    {q:'¿En qué capa actúa principalmente el HIFU con cartucho de 4.5 mm?',o:['Epidermis','Dermis superficial','SMAS y dermis profunda','Tejido subcutáneo graso'],c:2},
    {q:'¿Para qué se usa el HIFU en estética corporal?',o:['Hidratación profunda','Reducción de grasa localizada y reafirmación','Exfoliación química','Bronceado artificial'],c:1},
    {q:'¿Cuántas sesiones se recomiendan para el HIFU facial?',o:['1 sesión cada 6-12 meses','1 sesión por semana durante 1 mes','3 sesiones diarias','10 sesiones seguidas'],c:0},
    {q:'¿Qué le ocurre al tejido graso en el punto focal durante una sesión de HIFU corporal?',o:['Se congela y cristaliza','Se oxigena y regenera','Se destruye por calor intenso (necrosis térmica)','Se comprime mecánicamente sin daño celular'],c:2},
    {q:'¿El HIFU es un procedimiento invasivo?',o:['Sí, requiere incisiones','No, es completamente no invasivo','Sí, requiere anestesia general','Sí, usa agujas'],c:1},
    {q:'¿Cuál es el efecto principal a nivel celular?',o:['Aumenta el riego sanguíneo superficial','Produce coagulación térmica y necrosis puntual del tejido','Congela los adipocitos','Oxigena las células'],c:1},
    {q:'¿Cuándo se notan los resultados del HIFU facial?',o:['Mismo día','A los 2-3 días','Entre 1 y 3 meses','Al año de la sesión'],c:2},
    {q:'¿Qué contraindicación absoluta tiene el HIFU?',o:['Piel seca','Marcapasos o implantes metálicos en la zona','Manchas solares','Poros dilatados'],c:1},
    {q:'¿Qué cartucho se usa para tratar el SMAS?',o:['1.5 mm','3 mm','4.5 mm','7 mm'],c:2},
    {q:'¿Cuál es la sensación más frecuente durante la sesión?',o:['No se siente nada','Calor y pinchazos internos','Frío intenso','Corriente eléctrica'],c:1},
  ],
};
const EVAL_HIFU_INTERMEDIO = {
  id:'hifu-intermedio',
  titulo:'Test Intermedio — HIFU',
  categoria:'Radiofrecuencia / HIFU',
  nivel:'Intermedio',
  minimoAprobacion:10,
  preguntas:[
    {q:'¿Qué principio físico explica la destrucción selectiva de tejido?',o:['Cavitación acústica y efecto térmico focal','Efecto fotoeléctrico','Ionización de plasma','Resonancia magnética'],c:0},
    {q:'¿Cuál es la diferencia entre HIFU 3D y 4D?',o:['El 4D emite múltiples líneas en diferentes profundidades en una sola pasada','El 3D usa láser','El 4D es más frío','No hay diferencia real'],c:0},
    {q:'¿En qué capa actúa el cartucho de 1.5 mm?',o:['SMAS','Hipodermis','Dermis superficial / unión dermoepidérmica','Músculo orbicular'],c:2},
    {q:'¿Qué ocurre con los adipocitos destruidos por HIFU corporal?',o:['Son eliminados por el sistema linfático y hepático','Quedan calcificados','Se convierten en fibroblastos','Son absorbidos por el músculo'],c:0},
    {q:'¿Cuántas líneas tiene un cartucho estándar de HIFU?',o:['100','300','500-1000','50'],c:2},
    {q:'¿Por qué el HIFU no daña la epidermis?',o:['La epidermis no conduce ultrasonido','El punto focal se forma solo a la profundidad programada','Usa gel protector especial','Emite frío simultáneamente'],c:1},
    {q:'¿Para qué se usa el cartucho de 8 mm?',o:['Dermis','SMAS facial','Tejido adiposo profundo corporal','Periostio óseo'],c:2},
    {q:'¿Qué complicación surge si se aplica HIFU sobre relleno de AH reciente?',o:['Mayor efecto lifting','Degradación o irregularidades del relleno','Aumento de volumen','Alergia al gel'],c:1},
    {q:'¿Qué parámetro define la energía por punto de disparo?',o:['Voltaje (V)','Joules (J) por punto','Hertz (Hz)','Nanómetros'],c:1},
    {q:'¿Cuánto tiempo esperar para exposición solar post-HIFU?',o:['Inmediatamente','48-72 horas con SPF 50+','2 semanas sin protector','El sol no afecta'],c:1},
    {q:'¿Qué frecuencia usan los cartuchos faciales de HIFU?',o:['1 MHz','4-7 MHz','20 MHz','0.5 MHz'],c:1},
    {q:'¿En qué tipo de piel está contraindicado el HIFU?',o:['Piel madura mayor de 40 años','Heridas activas, infecciones o acné inflamatorio severo','Hiperpigmentación','Piel con vello facial'],c:1},
  ],
};
const EVAL_HIFU_AVANZADO = {
  id:'hifu-avanzado',
  titulo:'Test Avanzado — HIFU',
  categoria:'Radiofrecuencia / HIFU',
  nivel:'Avanzado',
  minimoAprobacion:10,
  preguntas:[
    {q:'¿Cuál es el mecanismo molecular por el que el HIFU estimula síntesis de colágeno?',o:['Activa melanocitos','El calor desnaturaliza colágeno existente, desencadenando síntesis de colágeno tipo I y III','Aumenta ATP mitocondrial directamente','Inhibe metaloproteinasas permanentemente'],c:1},
    {q:'¿Qué diferencia al HIFU del ultrasonido diagnóstico en intensidad?',o:['El diagnóstico usa 0.1-1 W/cm², el HIFU 100-10.000 W/cm²','Son idénticos','HIFU usa menos potencia','El diagnóstico usa mayor potencia'],c:0},
    {q:'¿Qué es el umbral de cavitación en HIFU?',o:['Temperatura mínima para fundir grasa','Presión acústica mínima para formar y colapsar microburbuchas','Número mínimo de disparos','Profundidad máxima alcanzable'],c:1},
    {q:'¿Por qué el HIFU corporal requiere parámetros distintos al facial?',o:['Menos terminaciones nerviosas','La grasa corporal es más profunda y requiere cartuchos de mayor profundidad y energía','No tiene SMAS','La piel no reacciona al calor'],c:1},
    {q:'¿Cómo se llama la absorción selectiva de ultrasonido en tejido graso?',o:['Reflectancia acústica preferencial','Impedancia acústica diferencial','Efecto piezoeléctrico reverso','Resonancia lipídica'],c:1},
    {q:'¿Qué es el parámetro ISPTA en HIFU?',o:['Índice de seguridad para tejidos ácidos','Intensidad espacial pico temporal promedio en el punto focal','Intensidad superficial por tiempo','Índice de saturación proteica'],c:1},
    {q:'¿Cuál es la complicación más grave por mala técnica de HIFU facial?',o:['Eritema transitorio','Lesión del nervio facial o parálisis temporal','Deshidratación severa','Caída de cabello'],c:1},
    {q:'¿Qué protocolo es correcto para la zona periorbital?',o:['Cartucho 4.5 mm, máxima energía','Cartucho 1.5 mm con energía reducida y protección ocular','Cartucho 8 mm, alta energía','Está absolutamente prohibido'],c:1},
    {q:'¿Cómo afecta la frecuencia del transductor a la profundidad de penetración?',o:['Mayor frecuencia = mayor profundidad','Menor frecuencia = mayor profundidad','La frecuencia no afecta','Mayor frecuencia = menor calor'],c:1},
    {q:'¿Qué marcadores histológicos confirman la respuesta al HIFU?',o:['Aumento de melanina','Zonas TUAZ, infiltrado inflamatorio y aumento de colágeno tipo I','Disminución de fibroblastos','No deja huella histológica'],c:1},
    {q:'¿Qué ventaja tienen los cartuchos de disparo lineal (VMAX)?',o:['Menor calor','Emiten línea continua en un movimiento, reduciendo tiempo y mejorando uniformidad','Mayor profundidad','Eliminan necesidad de gel'],c:1},
    {q:'¿Cuál es la base científica para combinar HIFU con radiofrecuencia?',o:['No tiene base científica','HIFU actúa en profundidad (SMAS/grasa) y RF en dermis superficial — capas complementarias','La RF enfría el HIFU','La RF amplifica ultrasonido'],c:1},
  ],
};
const EVAL_NDYAG_BASICO = {
  id:'ndyag-basico',
  titulo:'Test Básico — Láser Nd:YAG',
  categoria:'Láser Depilación',
  nivel:'Básico',
  minimoAprobacion:10,
  preguntas:[
    {q:'¿Qué significa Nd:YAG?',o:['Neodymium-doped Yttrium Aluminium Garnet','Neutral Dynamic Yellow Adjustable Gain','Non-destructive Yielding Active Gel','Nano-density Yttrium Argon Generator'],c:0},
    {q:'¿A qué longitud de onda opera el láser Nd:YAG para depilación?',o:['532 nm','755 nm','810 nm','1064 nm'],c:3},
    {q:'¿Para qué tipo de piel está especialmente indicado el Nd:YAG?',o:['Solo para pieles muy claras (fototipo I)','Pieles oscuras (fototipos IV-VI) por su menor absorción epidérmica de melanina','Solo para pieles con vello rubio','Exclusivamente para la zona facial'],c:1},
    {q:'¿Por qué el Nd:YAG es más seguro en pieles oscuras que el láser Alexandrita?',o:['Porque tiene menor potencia en general','Porque a 1064 nm la melanina epidérmica absorbe mucho menos energía, reduciendo el riesgo de quemaduras','Porque penetra menos profundo','Porque el spot es más pequeño'],c:1},
    {q:'¿Qué sensación es habitual durante una sesión de Nd:YAG?',o:['No se siente absolutamente nada','Calor intenso y pinchazos más pronunciados que otros láseres, por su mayor penetración','Solo frío por el sistema de enfriamiento','Hormigueo eléctrico suave'],c:1},
    {q:'¿Cuál es la preparación correcta antes de una sesión de Nd:YAG?',o:['Broncearse para activar la melanina','Afeitar la zona 24-48 horas antes y evitar exposición solar','Aplicar cera el día anterior','No hacer ninguna preparación especial'],c:1},
    {q:'¿Qué tipo de vello puede tratar el Nd:YAG que otros láseres no pueden tan bien?',o:['Vello blanco o canoso','Vello en pieles muy oscuras donde otros láseres generarían riesgo de quemadura','Vello rubio','Vello muy fino y transparente'],c:1},
    {q:'¿El Nd:YAG puede usarse para otras aplicaciones además de depilación?',o:['No, solo sirve para depilación','Sí, también para tratamiento de lesiones vasculares, rejuvenecimiento y pigmentaciones','Solo para depilación y nada más','Solo para uso médico hospitalario'],c:1},
    {q:'¿Qué cuidado post-sesión es indispensable con el Nd:YAG?',o:['Exponerse al sol para ver mejor los resultados','Aplicar protector solar SPF 50+ y evitar exposición solar directa','Usar cera para eliminar restos de vello','Aplicar agua caliente en la zona tratada'],c:1},
    {q:'¿Cuántas sesiones se necesitan generalmente con Nd:YAG?',o:['1 sola sesión es suficiente','3 sesiones máximo','6-8 sesiones o más según la zona y el fototipo','20 sesiones mínimo'],c:2},
    {q:'¿Cuál es una contraindicación para el uso del Nd:YAG?',o:['Piel oscura (fototipo V-VI)','Piel bronceada activamente, heridas abiertas o infección en la zona','Vello oscuro y grueso','Ser mayor de 18 años'],c:1},
    {q:'¿Qué protección ocular se requiere durante la sesión de Nd:YAG?',o:['No se necesita ninguna','Lentes de sol comunes','Gafas certificadas para 1064 nm tanto para el operador como para el paciente','Solo el operador necesita protección'],c:2},
  ],
};
const EVAL_NDYAG_INTERMEDIO = {
  id:'ndyag-intermedio',
  titulo:'Test Intermedio — Láser Nd:YAG',
  categoria:'Láser Depilación',
  nivel:'Intermedio',
  minimoAprobacion:10,
  preguntas:[
    {q:'¿Por qué el Nd:YAG penetra más profundo que el Alexandrita 755 nm?',o:['Porque tiene mayor potencia de salida','A mayor longitud de onda, menor absorción por melanina y agua, lo que permite mayor penetración en el tejido','Porque el spot es más grande','Porque usa pulsos más cortos'],c:1},
    {q:'¿Qué es la fluencia y por qué es crítica en el Nd:YAG?',o:['La velocidad de movimiento del cabezal','La energía por unidad de área (J/cm²); en Nd:YAG se usan fluencias más altas que en otros láseres para compensar la menor absorción por melanina','La frecuencia de repetición de disparos','El tamaño del spot'],c:1},
    {q:'¿Cuál es el intervalo recomendado entre sesiones de Nd:YAG en zona corporal?',o:['Cada semana','Cada 15 días','Cada 6-8 semanas, siguiendo el ciclo de crecimiento del vello','Cada 6 meses'],c:2},
    {q:'¿Qué riesgo específico existe al usar Nd:YAG sobre piel muy oscura con fluencia excesiva?',o:['Ningún riesgo específico','Hipopigmentación por destrucción de melanocitos epidérmicos, más difícil de tratar que la hiperpigmentación','Solo eritema transitorio','Aumento del crecimiento del vello'],c:1},
    {q:'¿Qué es el modo de disparo QS (Q-Switched) en Nd:YAG y para qué se usa en estética?',o:['Es el modo estándar de depilación','Es un modo de pulsos ultracortos (nanosegundos) usado para eliminación de tatuajes y pigmentaciones, no para depilación','Es el modo de mayor energía para depilación profunda','Es el modo de enfriamiento del equipo'],c:1},
    {q:'¿Por qué el Nd:YAG requiere fluencias más altas que el diodo 808 nm para lograr el mismo efecto?',o:['Porque el equipo es menos potente','Porque a 1064 nm la absorción por melanina es significativamente menor, requiriendo más energía para destruir el folículo','Porque el spot es más pequeño','Porque la piel oscura refleja más la luz'],c:1},
    {q:'¿Qué papel cumple el sistema de enfriamiento (contact cooling o criógeno) en el Nd:YAG?',o:['Solo para confort del paciente','Protege la epidermis permitiendo usar fluencias más altas, esencial dado que el Nd:YAG penetra profundo y genera calor considerable en tejidos intermedios','No tiene efecto real','Aumenta la absorción del láser'],c:1},
    {q:'¿Cuándo está indicado el Nd:YAG sobre el láser diodo para depilación?',o:['Siempre, es superior en todos los casos','En fototipos IV-VI donde el riesgo de daño epidérmico con diodo o alexandrita es mayor','Solo en zonas faciales','Nunca, el diodo siempre es mejor'],c:1},
    {q:'¿Qué es la hipertricosis paradójica y por qué puede ocurrir con Nd:YAG?',o:['Un error de calibración','Estimulación de folículos adyacentes por fluencias subóptimas; más frecuente en pieles oscuras con vello fino donde la energía activa en lugar de destruir','Un efecto decorativo buscado','La caída total del vello corporal'],c:1},
    {q:'¿Qué deben verificar antes de tratar una zona con Nd:YAG si la paciente usa medicación?',o:['Solo si la medicación es para el corazón','Verificar fotosensibilizantes (tetraciclinas, isotretinoína, etc.) que aumentan el riesgo de reacciones adversas y pueden contraindicar el tratamiento','Solo anticoagulantes','No hay medicación que contraindique el láser'],c:1},
    {q:'¿Qué diferencia práctica hay entre tratar con Nd:YAG en modo milisegundos (ms) vs nanosegundos (ns)?',o:['No hay diferencia práctica','Los ms se usan para depilación (destrucción térmica del folículo); los ns (Q-Switched) para fragmentar pigmentos de tatuajes y melanina superficial sin efecto sobre el folículo','Los ns son más efectivos para depilación','Los ms solo sirven para rejuvenecimiento'],c:1},
    {q:'¿Qué zona del cuerpo presenta mayor desafío para el Nd:YAG y por qué?',o:['Las piernas, por su tamaño','La zona hormonal (mentón, patillas, línea alba en mujeres) por la influencia androgénica que puede regenerar el vello tratado','La espalda, por el grosor de la piel','Los brazos, por el vello fino'],c:1},
  ],
};
const EVAL_NDYAG_AVANZADO = {
  id:'ndyag-avanzado',
  titulo:'Test Avanzado — Láser Nd:YAG',
  categoria:'Láser Depilación',
  nivel:'Avanzado',
  minimoAprobacion:10,
  preguntas:[
    {q:'¿Cuál es el coeficiente de absorción de la melanina a 1064 nm comparado con 755 nm?',o:['Es igual en ambas longitudes de onda','A 1064 nm el coeficiente de absorción de la melanina es aproximadamente 5-10 veces menor que a 755 nm, lo que explica la mayor seguridad epidérmica pero la necesidad de mayor fluencia','A 1064 nm la melanina absorbe más energía','El coeficiente no tiene relación con la longitud de onda'],c:1},
    {q:'¿Cómo determina el TRT (tiempo de relajación térmica) los parámetros del pulso en Nd:YAG?',o:['El TRT no aplica al Nd:YAG','El pulso debe ser ≤ TRT del folículo (~10-100 ms) para confinar el calor en el objetivo; el Nd:YAG usa pulsos en este rango para depilación segura','El TRT solo importa en equipos de baja potencia','El TRT del Nd:YAG es siempre de 1 segundo'],c:1},
    {q:'¿Qué fenómeno físico explica la mayor penetración del Nd:YAG 1064 nm en tejido biológico?',o:['Mayor reflexión en la superficie','Menor coeficiente de scattering y absorción por los cromóforos tisulares a 1064 nm, resultando en menor atenuación y mayor penetración efectiva','Mayor temperatura de emisión','El spot más pequeño que concentra la energía'],c:1},
    {q:'¿Cuál es el mecanismo histológico por el que el Nd:YAG logra depilación definitiva?',o:['Destrucción de la cutícula del vello únicamente','Necrosis térmica del bulge (células madre foliculares) y la papila dérmica mediante calor focal a 1064 nm, con menor absorción epidérmica','Congelación del bulbo folicular','Destrucción química del folículo por el gel conductor'],c:1},
    {q:'¿Qué es la tecnología de pulso largo (Long Pulse) en Nd:YAG y cuál es su ventaja para depilación?',o:['Pulsos de más de 1 segundo que queman la piel','Pulsos de 10-100 ms que permiten calentamiento gradual del folículo respetando el TRT, generando necrosis selectiva sin dañar estructuras adyacentes','Pulsos ultracortos para mayor precisión','Pulsos continuos sin descanso térmico'],c:1},
    {q:'¿Cómo se combina el Nd:YAG con el diodo 808 nm en equipos de doble longitud de onda?',o:['No se pueden combinar','El diodo actúa con mayor eficacia sobre la melanina folicular y el Nd:YAG protege la epidermis en fototipos altos; la combinación amplía el rango seguro de tratamiento en una sola sesión','Se usan en sesiones separadas siempre','El Nd:YAG reemplaza completamente al diodo'],c:1},
    {q:'¿Qué consideraciones especiales requiere el tratamiento con Nd:YAG en zona de barba masculina?',o:['No hay consideraciones especiales','La barba tiene folículos más profundos, vello más grueso y alta carga androgénica; requiere fluencias más altas, más sesiones y los resultados nunca son 100% definitivos por la estimulación hormonal continua','El Nd:YAG no funciona en barba','Solo se puede tratar con Alexandrita en barba'],c:1},
    {q:'¿Qué es el test de parche con Nd:YAG y cómo se interpreta la respuesta tisular?',o:['Es solo un requisito burocrático sin valor clínico','Se aplican disparos con fluencia creciente; eritema perifólicular y edema leve = respuesta correcta; ampollas, despigmentación inmediata o blanqueamiento = fluencia excesiva. Se individualiza el parámetro antes del tratamiento completo','Se usa siempre la fluencia máxima sin test previo','Solo se realiza en la primera sesión de por vida'],c:1},
    {q:'¿Cuál es la base científica del uso de Nd:YAG para tratamiento de lesiones vasculares además de depilación?',o:['No tiene base científica para lesiones vasculares','A 1064 nm existe buena absorción por la oxihemoglobina, permitiendo la fotocoagulación selectiva de vasos sanguíneos superficiales sin dañar significativamente la epidermis','El Nd:YAG solo absorbe melanina','Las lesiones vasculares se tratan con ultrasonido'],c:1},
    {q:'¿Qué implica la regulación de seguridad láser clase IV para el operador de Nd:YAG?',o:['No hay regulación específica para láseres estéticos','El Nd:YAG es un láser clase IV; implica obligatoriedad de EPP certificado (gafas de OD adecuado para 1064 nm), señalización de área, protocolo de seguridad y capacitación documentada del operador','Solo se necesita tener cuidado general','La regulación solo aplica a hospitales'],c:1},
    {q:'¿Cómo afecta la profundidad focal del Nd:YAG al tratamiento de folículos en zonas con tejido adiposo grueso (espalda, muslos)?',o:['No afecta, la profundidad es siempre la misma','A 1064 nm la mayor penetración permite alcanzar folículos profundos en zonas con mayor espesor de tejido; puede requerir ajuste de fluencia para compensar la atenuación en tejido más grueso','El Nd:YAG no puede tratar folículos profundos','En zonas gruesas el láser no penetra'],c:1},
    {q:'¿Qué diferencia al Nd:YAG pulsado en modo largo del Nd:YAG Q-Switched en términos de aplicación clínica en estética?',o:['Son idénticos en aplicación','El Nd:YAG Long Pulse (ms) genera calor difuso para depilación y lesiones vasculares; el Q-Switched (ns) genera ondas de presión fotoacústicas para fragmentar pigmentos de tatuajes y melanosomas. Son mecanismos y aplicaciones clínicas completamente distintos','El Q-Switched es mejor para depilación','El Long Pulse es mejor para tatuajes'],c:1},
  ],
};
const EVAL_EXILIS_BASICO = {
  id:'exilis-basico',
  titulo:'Test Básico — Exilis Elite',
  categoria:'Radiofrecuencia / HIFU',
  nivel:'Básico',
  minimoAprobacion:10,
  preguntas:[
    {q:'¿Qué tecnologías combina el equipo Exilis Elite?',o:['Láser y crioterapia','Radiofrecuencia monopolar y ultrasonido focalizado','Luz pulsada intensa y corriente galvánica','Cavitación y electropuntura'],c:1},
    {q:'¿Para qué se usa principalmente el Exilis Elite?',o:['Depilación definitiva','Rejuvenecimiento facial, reafirmación y reducción de grasa localizada sin cirugía','Eliminación de tatuajes','Tratamiento de acné activo'],c:1},
    {q:'¿El Exilis Elite es un procedimiento invasivo?',o:['Sí, requiere incisiones','Sí, requiere anestesia local','No, es completamente no invasivo','Sí, usa agujas'],c:2},
    {q:'¿Qué sensación describe habitualmente el paciente durante el tratamiento?',o:['Dolor intenso y quemadura','Frío intenso en toda la zona','Calor suave y agradable, como una piedra tibia deslizándose por la piel','Corriente eléctrica fuerte'],c:2},
    {q:'¿Cuántas sesiones se recomiendan generalmente con Exilis Elite?',o:['1 sola sesión','10 sesiones diarias','4 a 6 sesiones por zona','20 sesiones mínimo'],c:2},
    {q:'¿Con qué frecuencia se realizan las sesiones de Exilis Elite?',o:['Cada 24 horas','Cada 7 a 21 días según la zona y el protocolo','Una vez al año','Cada 3 meses'],c:1},
    {q:'¿En qué zonas del cuerpo se puede aplicar el Exilis Elite?',o:['Solo en el rostro','Solo en piernas y abdomen','Cara, cuello, escote y zonas corporales como abdomen, muslos y brazos','Solo en zonas con celulitis severa'],c:2},
    {q:'¿Cuál es la temperatura objetivo en los tejidos durante el tratamiento corporal?',o:['20-25 °C','40-43 °C','70-80 °C','100 °C'],c:1},
    {q:'¿Qué cuidado es recomendable después de cada sesión de Exilis?',o:['Exposición solar directa para potenciar el efecto','Hidratación abundante (2-3 litros de agua en las siguientes 24 horas) y aplicar crema hidratante','Ayuno estricto de 24 horas','Evitar toda actividad física por 2 semanas'],c:1},
    {q:'¿Cuál es una contraindicación para el uso del Exilis Elite?',o:['Piel con flacidez leve','Marcapasos, implantes metálicos en la zona o embarazo','Tener más de 30 años','Usar crema hidratante habitualmente'],c:1},
    {q:'¿Qué efecto tiene la radiofrecuencia del Exilis sobre el colágeno?',o:['Lo destruye permanentemente','Estimula los fibroblastos para sintetizar nuevo colágeno, mejorando firmeza y elasticidad','Lo congela para tensar la piel','No tiene efecto sobre el colágeno'],c:1},
    {q:'¿Cuándo se empiezan a notar los resultados del Exilis Elite?',o:['Nunca, los resultados son solo estéticos temporales','Algunos días después de la primera sesión con mejora progresiva en las siguientes sesiones','Solo después de 20 sesiones','Al año de finalizar el tratamiento'],c:1},
  ],
};
const EVAL_EXILIS_INTERMEDIO = {
  id:'exilis-intermedio',
  titulo:'Test Intermedio — Exilis Elite',
  categoria:'Radiofrecuencia / HIFU',
  nivel:'Intermedio',
  minimoAprobacion:10,
  preguntas:[
    {q:'¿Cómo actúa la radiofrecuencia monopolar del Exilis Elite en el tejido?',o:['Destruye células por congelación','Genera corriente eléctrica alterna que produce calor por resistencia tisular, estimulando fibroblastos y síntesis de colágeno en dermis profunda','Actúa solo en la superficie epidérmica','Emite luz para fotoestimular las células'],c:1},
    {q:'¿Qué función cumple el ultrasonido en el Exilis Elite?',o:['Solo mejora el confort del paciente','Permite acceder a capas más profundas de grasa, generando efecto mecánico y térmico sobre el tejido adiposo, complementando la acción de la radiofrecuencia','Enfría la piel durante el tratamiento','Desinfecta la zona tratada'],c:1},
    {q:'¿Qué es el sistema de control de temperatura integrado en el Exilis Elite?',o:['Un termómetro manual que usa el operador','Un sistema automático que monitoriza la temperatura de la piel en tiempo real ajustando la energía para mantenerse en el rango terapéutico y evitar quemaduras','Un sistema de alarma que detiene el equipo si hay dolor','Solo una guía visual sin función de control real'],c:1},
    {q:'¿Cuál es la diferencia entre el aplicador facial y el corporal del Exilis Elite?',o:['Son idénticos, solo cambia el nombre','El facial tiene menor superficie de contacto y parámetros más delicados para zonas sensibles; el corporal tiene mayor área de cobertura y energía para tejidos más profundos','El facial usa ultrasonido y el corporal solo radiofrecuencia','El corporal es más frío que el facial'],c:1},
    {q:'¿Qué es la impedancia inteligente en el Exilis Elite?',o:['Un modo de ahorro de energía del equipo','Un sistema que ajusta automáticamente la entrega de energía según la resistencia del tejido de cada paciente, optimizando la eficacia y la seguridad','Un tipo de corriente galvánica especial','Una función decorativa del panel de control'],c:1},
    {q:'¿Por qué se divide la zona a tratar en cuadrículas de aproximadamente 10x10 cm en el protocolo Exilis?',o:['Para hacer el tratamiento más rápido','Para asegurar cobertura uniforme y dosis de energía homogénea en toda la zona, evitando áreas sin tratar o con exceso de energía','Para que el paciente pueda ver el progreso','Solo es una sugerencia estética del fabricante'],c:1},
    {q:'¿Qué efecto tiene el sistema de enfriamiento gradual del Exilis sobre la epidermis?',o:['Congela la grasa superficial','Protege la epidermis del daño térmico mientras la energía penetra en las capas más profundas, permitiendo trabajar con mayor seguridad','Aumenta la temperatura superficial','No tiene efecto real sobre la epidermis'],c:1},
    {q:'¿Qué zonas del rostro responden mejor al tratamiento con Exilis Elite facial?',o:['Solo la frente','Mejillas, óvalo facial, cuello, zona periocular y escote, donde la flacidez y las arrugas responden bien al calor estimulante de colágeno','Solo los labios','Solo la nariz'],c:1},
    {q:'¿Qué tratamientos complementan bien al Exilis Elite para potenciar resultados corporales?',o:['Cera depilatoria y crema solar','Cavitación, criolipólisis o carboxiterapia en sesiones diferenciadas, que actúan sobre distintas capas o mecanismos del tejido adiposo','Solo dieta hipocalórica sin ningún otro tratamiento','Electrólisis y depilación láser'],c:1},
    {q:'¿Cuál es el perfil de paciente ideal para el Exilis Elite?',o:['Pacientes con obesidad severa que buscan reemplazar la cirugía bariátrica','Personas con flacidez leve a moderada, arrugas o pequeñas áreas de grasa localizada que buscan mejora no invasiva','Pacientes con enfermedades dermatológicas activas severas','Solo pacientes mayores de 60 años'],c:1},
    {q:'¿Qué recomendación nutricional acompaña al tratamiento con Exilis para optimizar resultados?',o:['Dieta hipercalórica rica en grasas','Dieta hipocalórica rica en proteínas con suplementación de aminoácidos específicos para favorecer la síntesis de colágeno','Ayuno intermitente estricto durante el tratamiento','No hay recomendación nutricional específica'],c:1},
    {q:'¿Por qué el Exilis Elite es una buena opción post-liposucción?',o:['Porque elimina los hematomas quirúrgicos','Porque actúa sobre la flacidez residual y la piel suelta que queda tras eliminar el volumen graso, reafirmando y mejorando la textura sin nueva cirugía','Porque desinfecta la zona operada','Porque duplica la eliminación de grasa lograda en la cirugía'],c:1},
  ],
};
const EVAL_EXILIS_AVANZADO = {
  id:'exilis-avanzado',
  titulo:'Test Avanzado — Exilis Elite',
  categoria:'Radiofrecuencia / HIFU',
  nivel:'Avanzado',
  minimoAprobacion:10,
  preguntas:[
    {q:'¿Cuál es el mecanismo molecular por el que la radiofrecuencia del Exilis estimula la síntesis de colágeno?',o:['Activa melanocitos para producir melanina','El calor generado por la RF desnaturaliza parcialmente las fibras de colágeno existentes, activando fibroblastos que sintetizan nuevo colágeno tipo I y III en el proceso de reparación tisular','Congela las células para inducir apoptosis','Inhibe las metaloproteinasas de forma permanente'],c:1},
    {q:'¿Cómo actúa el ultrasonido del Exilis Elite a nivel del tejido adiposo profundo?',o:['Solo produce calor superficial','El efecto mecánico de las ondas ultrasónicas genera cavitación y calor en el tejido adiposo profundo, disruptando membranas de adipocitos y facilitando la lipólisis, complementando la acción de la RF en capas más superficiales','Congela los adipocitos como en criolipólisis','Destruye el tejido adiposo por corriente eléctrica'],c:1},
    {q:'¿Qué diferencia al Exilis Elite de la radiofrecuencia fraccionada en términos de mecanismo?',o:['Son idénticos','La RF fraccionada genera microlesiones térmicas puntuales en patrones separados; el Exilis aplica calor uniforme y controlado en toda la zona mediante movimiento continuo del aplicador, con monitorización de temperatura en tiempo real','El Exilis es menos efectivo que la RF fraccionada','La RF fraccionada solo funciona en rostro'],c:1},
    {q:'¿Qué rol cumple la placa de retorno (plaquita de transmisión) en el Exilis Elite monopolar?',o:['Es solo un accesorio de sujeción','Completa el circuito eléctrico de la radiofrecuencia monopolar: la corriente fluye desde el aplicador a través del tejido hasta la placa de retorno colocada en una zona opuesta, generando calor en todo el trayecto tisular','No tiene ninguna función eléctrica','Solo mide la temperatura de la piel'],c:1},
    {q:'¿Por qué el Exilis Elite es más seguro para la epidermis que otras RF de alta energía sin control de temperatura?',o:['Porque usa menor energía en total','El sistema de monitorización de temperatura en tiempo real, combinado con el enfriamiento simultáneo, permite mantener la epidermis en rangos seguros mientras las capas profundas alcanzan temperatura terapéutica','Porque el aplicador nunca toca la piel','Porque solo actúa a 1 mm de profundidad'],c:1},
    {q:'¿Cuál es la base biofísica que explica por qué el ultrasonido puede tratar capas grasas que la RF sola no alcanza eficazmente?',o:['El ultrasonido es más caliente que la RF','El ultrasonido penetra selectivamente en tejido adiposo por su mayor coeficiente de absorción ultrasónica comparado con dermis y músculo, permitiendo focalizar energía en capas más profundas donde la RF pierde eficacia por atenuación','El ultrasonido tiene mayor longitud de onda','El ultrasonido actúa solo en la superficie'],c:1},
    {q:'¿Qué implicaciones clínicas tiene la flacidez severa (grado III-IV) para el protocolo Exilis?',o:['Se trata igual que la flacidez leve','La flacidez severa puede requerir más sesiones, parámetros de mayor energía o combinación con otros procedimientos; el Exilis tiene límites en casos muy avanzados donde puede ser necesario derivar a procedimientos quirúrgicos','El Exilis siempre resuelve cualquier grado de flacidez','La flacidez severa contraindica el Exilis'],c:1},
    {q:'¿Cómo interactúa el calor del Exilis con las fibras de elastina además del colágeno?',o:['No tiene efecto sobre la elastina','El calor terapéutico también estimula la síntesis de elastina por los fibroblastos, mejorando la elasticidad y la capacidad de retracción de la piel, complementando el efecto sobre el colágeno','Destruye la elastina permanentemente','Solo actúa sobre colágeno tipo II'],c:1},
    {q:'¿Qué consideraciones especiales requiere el tratamiento Exilis en la zona periocular?',o:['No hay consideraciones especiales, se trata igual que el resto del rostro','La zona periocular requiere aplicadores específicos de menor tamaño, parámetros de energía reducidos y mayor cuidado para evitar el calor excesivo cercano al globo ocular; algunos protocolos incluyen protección ocular','Se contraindica completamente en esa zona','Solo se puede tratar con ultrasonido, no con RF'],c:1},
    {q:'¿Cuál es el fundamento científico de combinar Exilis Elite con carboxiterapia en protocolos corporales?',o:['No tiene fundamento científico','La carboxiterapia mejora la microcirculación y la oxigenación tisular, potenciando el metabolismo de los lípidos liberados por la acción del Exilis; actúan en mecanismos complementarios sobre el tejido adiposo y la flacidez','Son incompatibles en el mismo ciclo de tratamiento','La carboxiterapia enfría el efecto del Exilis'],c:1},
    {q:'¿Qué parámetros debe ajustar el operador según el fototipo y el grosor del tejido en el Exilis Elite?',o:['No se ajusta ningún parámetro, el equipo lo hace todo automáticamente','La potencia de RF y ultrasonido, la velocidad de movimiento del aplicador y la temperatura objetivo; pieles más finas o sensibles requieren parámetros más conservadores; tejidos más gruesos pueden requerir mayor energía y más tiempo por cuadrícula','Solo se ajusta el tiempo de sesión','Solo se ajusta si el paciente siente dolor'],c:1},
    {q:'¿Por qué el Exilis Elite está contraindicado sobre zonas con implantes de silicona o rellenos recientes?',o:['No está contraindicado en esas zonas','El calor generado por la RF puede alterar la integridad de los implantes de silicona o degradar/desplazar rellenos inyectables; se debe evitar tratar directamente sobre estas estructuras o esperar el tiempo recomendado post-procedimiento','Es obligatorio tratar sobre los implantes para mejores resultados','Los rellenos potencian el efecto del Exilis'],c:1},
  ],
};
const EVAL_EMSCULPT_BASICO = {
  id:'emsculpt-basico',
  titulo:'Test Básico — Emsculpt',
  categoria:'Electroestimulación',
  nivel:'Básico',
  minimoAprobacion:10,
  preguntas:[
    {q:'¿Qué tecnología utiliza el Emsculpt?',o:['Radiofrecuencia monopolar','Ultrasonido focalizado de alta intensidad','Electromagnetic High Intensity Focused Energy (HIFEM) — campo electromagnético de alta intensidad','Corriente galvánica continua'],c:2},
    {q:'¿Cuál es el principal objetivo del Emsculpt?',o:['Eliminar grasa por congelación','Estimular contracciones musculares supramáximas para tonificar músculo y reducir grasa localizada simultáneamente','Depilación definitiva de zonas corporales','Rejuvenecimiento facial con colágeno'],c:1},
    {q:'¿Cuántas contracciones musculares equivale una sesión de Emsculpt?',o:['100 abdominales','1.000 contracciones','Aproximadamente 20.000 contracciones musculares supramáximas en 30 minutos','500 sentadillas'],c:2},
    {q:'¿El Emsculpt es un procedimiento invasivo?',o:['Sí, requiere agujas','Sí, requiere anestesia local','No, es completamente no invasivo','Sí, requiere incisiones pequeñas'],c:2},
    {q:'¿En qué zonas del cuerpo se aplica principalmente el Emsculpt?',o:['Solo en el rostro','Abdomen, glúteos, brazos (bíceps/tríceps) y muslos','Solo en piernas','Exclusivamente en la zona lumbar'],c:1},
    {q:'¿Cuántas sesiones se recomiendan para ver resultados con Emsculpt?',o:['1 sola sesión','20 sesiones diarias','4 sesiones de 30 minutos espaciadas cada 2-3 días, en un período de 2 semanas','10 sesiones semanales'],c:2},
    {q:'¿Qué sensación describe el paciente durante la sesión de Emsculpt?',o:['Dolor intenso e insoportable','Contracciones musculares intensas acompañadas de sensación de calor, similares a un entrenamiento muy exigente','Frío intenso en toda la zona','Corriente eléctrica dolorosa en la piel'],c:1},
    {q:'¿El Emsculpt puede usarse en personas con marcapasos?',o:['Sí, sin ningún problema','Solo si el marcapasos es moderno','No, el campo electromagnético contraindica su uso en personas con marcapasos o dispositivos electrónicos implantados','Solo con supervisión médica directa'],c:2},
    {q:'¿Cuándo se empiezan a notar los resultados del Emsculpt?',o:['Inmediatamente durante la sesión','2-4 semanas después del tratamiento completo, con mejora progresiva hasta los 3 meses','A los 2 años','Solo si se combina con cirugía'],c:1},
    {q:'¿Qué cuidado post-sesión es recomendable tras el Emsculpt?',o:['Reposo absoluto de 48 horas','Evitar ejercicio intenso las primeras 24-48 horas, hidratarse bien y mantener una alimentación saludable','Ayuno de 24 horas','Exposición solar para activar el músculo'],c:1},
    {q:'¿Para qué tipo de paciente está indicado el Emsculpt?',o:['Solo para personas con obesidad severa','Personas con peso saludable o cercano al ideal que buscan tonificación muscular y reducción de grasa localizada sin cirugía','Solo para deportistas de élite','Solo para personas mayores de 60 años'],c:1},
    {q:'¿Cuál es una contraindicación absoluta del Emsculpt?',o:['Tener músculo desarrollado','Embarazo, dispositivos metálicos implantados o marcapasos en la zona a tratar','Realizar ejercicio habitualmente','Tener menos de 30 años'],c:1},
  ],
};
const EVAL_EMSCULPT_INTERMEDIO = {
  id:'emsculpt-intermedio',
  titulo:'Test Intermedio — Emsculpt',
  categoria:'Electroestimulación',
  nivel:'Intermedio',
  minimoAprobacion:10,
  preguntas:[
    {q:'¿Qué son las contracciones supramáximas que genera el Emsculpt?',o:['Contracciones similares a las del ejercicio voluntario normal','Contracciones de mayor intensidad que las que el sistema nervioso puede generar voluntariamente; reclutan casi el 100% de las fibras musculares simultáneamente, algo imposible con el ejercicio convencional','Contracciones eléctricas superficiales de la piel','Microcontracciones imperceptibles que solo actúan en la grasa'],c:1},
    {q:'¿Qué proceso metabólico explica la reducción de grasa localizada durante el Emsculpt?',o:['La grasa se elimina por sudoración durante el tratamiento','Las contracciones musculares intensas generan alta demanda energética que desencadena lipólisis local acelerada, con liberación de ácidos grasos que son metabolizados','La corriente electromagnética congela los adipocitos','La radiofrecuencia asociada funde la grasa'],c:1},
    {q:'¿Cuál es la diferencia entre el Emsculpt y la electroestimulación muscular (EMS) convencional?',o:['Son exactamente lo mismo','El Emsculpt usa HIFEM de alta intensidad que genera contracciones supramáximas en músculos profundos; la EMS convencional usa corrientes de baja intensidad que solo alcanzan músculos superficiales con contracciones subóptimas','El Emsculpt es más barato que la EMS','La EMS es más efectiva que el Emsculpt'],c:1},
    {q:'¿Qué cambios histológicos produce el Emsculpt en el tejido muscular?',o:['Destruye las fibras musculares permanentemente','Hipertrofia de las fibras musculares existentes e hiperplasia (aumento del número de fibras); estudios muestran un aumento promedio del 16% de masa muscular','Solo produce calor sin cambio estructural','Convierte fibras tipo II en tipo I'],c:1},
    {q:'¿Por qué el Emsculpt requiere sesiones cada 2-3 días y no diarias?',o:['Por razones económicas únicamente','El músculo necesita tiempo de recuperación entre sesiones de contracciones supramáximas; las sesiones muy seguidas no permiten la reparación y adaptación muscular necesaria para el remodelado','Porque el equipo necesita recargarse','Porque la grasa necesita ese tiempo para eliminarse'],c:1},
    {q:'¿Qué porcentaje promedio de reducción de grasa abdominal reportan los estudios clínicos del Emsculpt?',o:['1-2%','Aproximadamente 19% de reducción de grasa abdominal según estudios clínicos controlados','50% en una sola sesión','Solo funciona en personas muy delgadas, no hay datos de reducción'],c:1},
    {q:'¿Cuál es la diferencia entre el Emsculpt original y el Emsculpt NEO?',o:['No hay diferencia, son el mismo equipo','El Emsculpt NEO agrega radiofrecuencia sincronizada al HIFEM, permitiendo reducción de grasa adicional por calor y construcción muscular en la misma sesión, ampliando los resultados','El NEO solo funciona en glúteos','El NEO es una versión más antigua'],c:1},
    {q:'¿Cómo actúa el Emsculpt sobre el diástasis abdominal (separación de rectos)?',o:['Lo empeora al contraer demasiado fuerte','Las contracciones supramáximas fortalecen la musculatura central incluyendo los rectos, lo que puede reducir la diástasis en casos leves a moderados; casos severos pueden requerir evaluación médica previa','No tiene ningún efecto sobre la diástasis','Solo funciona si hay diástasis severa'],c:1},
    {q:'¿Qué tipo de fibras musculares se ven más beneficiadas por el Emsculpt?',o:['Solo las fibras tipo I (lentas)','Las fibras tipo II (rápidas o de contracción rápida) responden especialmente bien por su mayor capacidad de hipertrofia; también se benefician las fibras tipo I por el volumen de contracciones','Solo las fibras superficiales','El Emsculpt no diferencia entre tipos de fibras'],c:1},
    {q:'¿Qué consideración debe tenerse al tratar la zona abdominal con Emsculpt en mujeres?',o:['No hay consideraciones específicas para mujeres','Verificar que no estén embarazadas, que no tengan DIU metálico en la zona de influencia, y evaluar si hay diástasis significativa que requiera protocolo específico','Solo verificar que no tengan marcapasos','El Emsculpt no puede usarse en mujeres'],c:1},
    {q:'¿Por qué el Emsculpt no reemplaza la dieta y el ejercicio?',o:['Sí los reemplaza completamente','El Emsculpt es un complemento: tonifica y reduce grasa localizada, pero los resultados se mantienen y potencian con hábitos saludables; sin dieta adecuada el tejido adiposo general puede aumentar','No tiene relación con la dieta','Solo funciona si se hace ejercicio intenso en paralelo'],c:1},
    {q:'¿Cuánto tiempo duran los resultados del Emsculpt sin mantenimiento?',o:['Los resultados son permanentes sin ningún mantenimiento','Los resultados pueden durar 6-12 meses; se recomiendan sesiones de mantenimiento periódicas y actividad física regular para prolongar los beneficios','Solo duran 1 semana','Los resultados son inmediatos pero desaparecen al día siguiente'],c:1},
  ],
};
const EVAL_EMSCULPT_AVANZADO = {
  id:'emsculpt-avanzado',
  titulo:'Test Avanzado — Emsculpt',
  categoria:'Electroestimulación',
  nivel:'Avanzado',
  minimoAprobacion:10,
  preguntas:[
    {q:'¿Cuál es el mecanismo biofísico por el que el HIFEM genera contracciones supramáximas?',o:['Estimula el sistema nervioso central directamente','El campo electromagnético de alta intensidad induce corrientes eléctricas en el tejido muscular que despolarizar las membranas de las células musculares, generando potenciales de acción y contracción sin necesidad de mediación del sistema nervioso voluntario','Calienta el músculo hasta producir espasmo','Envía corriente galvánica directa al músculo'],c:1},
    {q:'¿Qué evidencia científica respalda la eficacia del Emsculpt para reducción de grasa?',o:['No existen estudios clínicos','Múltiples estudios controlados con ultrasonido y MRI muestran reducción promedio de aproximadamente 19% de grasa abdominal y 16% de aumento de masa muscular en el protocolo estándar de 4 sesiones','Solo estudios anecdóticos sin control','Los estudios son financiados solo por el fabricante sin datos verificables'],c:1},
    {q:'¿Cómo el Emsculpt NEO combina HIFEM y RF y qué ventaja clínica ofrece?',o:['Los aplica en sesiones separadas','Sincroniza la RF y el HIFEM en la misma sesión: la RF calienta el tejido adiposo facilitando su reducción mientras el HIFEM contrae el músculo, logrando mayor reducción de grasa (aproximadamente 30%) y construcción muscular en menos tiempo','El NEO usa RF para anestesiar y HIFEM para el efecto principal','Son tecnologías incompatibles aplicadas por separado en el mismo equipo'],c:1},
    {q:'¿Por qué el Emsculpt es más efectivo que el ejercicio convencional para reclutar fibras musculares?',o:['Porque usa más energía que el ejercicio','El sistema nervioso voluntario tiene un límite fisiológico en el reclutamiento de unidades motoras (60-70% en atletas de élite); el HIFEM bypasea este límite activando casi el 100% de las fibras simultáneamente, generando estrés mecánico imposible de lograr voluntariamente','Porque el ejercicio es contraproducente','El ejercicio recluta más fibras que el Emsculpt'],c:1},
    {q:'¿Cuál es el mecanismo molecular de la apoptosis de adipocitos inducida por el Emsculpt?',o:['Los adipocitos mueren por congelación','Las contracciones supramáximas generan alta demanda de ácidos grasos libres; la lipólisis acelerada produce concentraciones elevadas de ácidos grasos que superan la capacidad metabólica local, desencadenando apoptosis de adipocitos por lipotoxicidad','Los adipocitos son destruidos mecánicamente por las contracciones','La RF asociada funde la membrana de los adipocitos'],c:1},
    {q:'¿Qué criterios de exclusión específicos deben verificarse antes de aplicar Emsculpt en zona abdominal?',o:['Solo verificar el peso del paciente','Embarazo, DIU metálico, hernia abdominal activa, implantes metálicos en la zona, marcapasos, epilepsia, neoplasias activas, infecciones o lesiones cutáneas en el área y diástasis severa (evaluar caso por caso)','Solo verificar que no tengan marcapasos','No hay criterios de exclusión específicos'],c:1},
    {q:'¿Cómo se diferencia el remodelado muscular del Emsculpt del producido por el entrenamiento de fuerza convencional a nivel histológico?',o:['Son idénticos histológicamente','El Emsculpt produce hipertrofia e hiperplasia simultáneas; el entrenamiento de fuerza convencional produce principalmente hipertrofia. El HIFEM genera daño muscular difuso en todas las fibras simultáneamente, mientras el ejercicio recluta fibras secuencialmente','El entrenamiento produce más hiperplasia que el Emsculpt','El Emsculpt no produce cambios histológicos verificables'],c:1},
    {q:'¿Qué parámetros deben ajustarse en el protocolo Emsculpt para glúteos vs abdomen?',o:['Son exactamente iguales, no hay diferencia','El aplicador para glúteos tiene diferente geometría; la intensidad puede ajustarse según la tolerancia; el protocolo glúteo busca primariamente hipertrofia mientras el abdominal equilibra tonificación y reducción de grasa; el posicionamiento del paciente también varía','Solo varía el tiempo de sesión','Solo varía si el paciente tiene dolor'],c:1},
    {q:'¿Cuál es la base fisiológica de la sensación de agujetas (DOMS) post-Emsculpt?',o:['Las agujetas son señal de que el equipo funcionó mal','El DOMS post-Emsculpt responde al mismo mecanismo que el ejercicio: microlesiones en las fibras musculares por las contracciones supramáximas, respuesta inflamatoria local y síntesis proteica para reparación; indica respuesta muscular correcta al tratamiento','Las agujetas indican quemadura del músculo','El Emsculpt no produce agujetas nunca'],c:1},
    {q:'¿Cómo interactúa el Emsculpt con la criolipólisis en protocolos combinados?',o:['Son incompatibles y nunca se combinan','La criolipólisis elimina adipocitos por frío y puede hacerse antes o después del Emsculpt; el Emsculpt potencia la tonificación muscular en la zona tratada; la combinación aborda simultaneamente reducción de grasa profunda y tonificación muscular','El Emsculpt anula el efecto de la criolipólisis','Solo se combinan si el paciente tiene obesidad'],c:1},
    {q:'¿Qué implicaciones tiene el campo electromagnético del Emsculpt sobre implantes metálicos no relacionados con la zona tratada?',o:['Solo afecta implantes en la zona exacta de tratamiento','El campo electromagnético puede extenderse más allá de la zona de aplicación; implantes metálicos, DIU, marcapasos u otros dispositivos electrónicos en un radio relevante deben evaluarse caso por caso; el operador debe conocer la distribución del campo del equipo','Los implantes metálicos no interactúan con campos magnéticos','Solo afecta implantes de titanio'],c:1},
    {q:'¿Cuál es la evidencia sobre el uso del Emsculpt en rehabilitación y fortalecimiento post-quirúrgico?',o:['Está completamente contraindicado en cualquier contexto postquirúrgico','Estudios exploratorios muestran potencial para recuperación muscular post-cirugía (ej. post-liposucción, post-parto cuando está cicatrizado) para restablecer tono muscular; requiere evaluación médica previa y protocolo conservador adaptado al estado del paciente','Se puede usar inmediatamente tras cualquier cirugía','No existe ninguna evidencia sobre uso post-quirúrgico'],c:1},
  ],
};
const EVAL_HYDRAFACIAL_BASICO = {
  id:'hydrafacial-basico',
  titulo:'Test Básico — HydraFacial',
  categoria:'General',
  nivel:'Básico',
  minimoAprobacion:10,
  preguntas:[
    {q:'¿Qué es el HydraFacial?',o:['Un tratamiento de depilación facial con láser','Un tratamiento facial no invasivo que combina limpieza, exfoliación, extracción e hidratación profunda en un solo procedimiento','Un peeling químico profundo con tiempo de recuperación','Un masaje facial con corriente eléctrica'],c:1},
    {q:'¿Cuáles son las 3 fases principales del tratamiento HydraFacial?',o:['Limpieza, bronceado y tonificación','Limpieza/exfoliación, extracción de impurezas e infusión de sueros hidratantes y antioxidantes','Depilación, hidratación y masaje','Peeling, láser y radiofrecuencia'],c:1},
    {q:'¿El HydraFacial es un procedimiento invasivo?',o:['Sí, requiere anestesia local','Sí, usa microagujas','No, es completamente no invasivo y no requiere tiempo de recuperación','Sí, deja la piel en carne viva'],c:2},
    {q:'¿Para qué tipo de piel está indicado el HydraFacial?',o:['Solo para piel grasa con acné severo','Solo para piel madura mayor de 50 años','Es apto para todo tipo de piel: grasa, seca, mixta, sensible y madura','Solo para pieles claras sin manchas'],c:2},
    {q:'¿Cuánto dura una sesión estándar de HydraFacial?',o:['5 minutos','30 a 60 minutos según el protocolo y los potenciadores añadidos','3 horas','Solo 10 minutos'],c:1},
    {q:'¿Con qué frecuencia se recomienda realizar el HydraFacial para mantenimiento?',o:['Una vez en la vida','Cada 2 años','Mensualmente o cada 4-6 semanas para resultados óptimos de mantenimiento','Cada semana obligatoriamente'],c:2},
    {q:'¿Qué sensación describe el paciente durante el HydraFacial?',o:['Dolor intenso y ardor','Calor extremo similar a una quemadura','Sensación suave de succión y humedad, generalmente muy confortable','Corriente eléctrica molesta'],c:2},
    {q:'¿Qué tipo de sueros se infunden durante el HydraFacial?',o:['Solo agua destilada','Ácidos fuertes sin diluir','Sueros con antioxidantes, péptidos, ácido hialurónico y otros activos según el objetivo del tratamiento','Aceites minerales espesos'],c:2},
    {q:'¿Cuándo se notan los resultados del HydraFacial?',o:['Recién al mes','A los 6 meses','Inmediatamente después del tratamiento con piel más luminosa, hidratada y uniforme','Solo después de 10 sesiones'],c:2},
    {q:'¿Cuál es una contraindicación del HydraFacial?',o:['Piel deshidratada','Tener más de 30 años','Rosacea activa severa, herpes activo, quemaduras solares recientes o heridas abiertas en la zona a tratar','Usar hidratante habitualmente'],c:2},
    {q:'¿Qué cuidado post-HydraFacial es esencial?',o:['Exposición solar inmediata para potenciar el efecto','Aplicar maquillaje espeso inmediatamente','Protector solar SPF 50+ y evitar exposición solar directa las primeras 24-48 horas','Lavar la cara con agua muy caliente'],c:2},
    {q:'¿Puede realizarse HydraFacial antes de un evento importante?',o:['No, deja la piel muy roja por días','Solo si se hace 2 semanas antes','Sí, es ideal realizarlo 1-2 días antes ya que no genera tiempo de inactividad y deja la piel luminosa','Solo si se combina con maquillaje permanente'],c:2},
  ],
};
const EVAL_HYDRAFACIAL_AVANZADO = {
  id:'hydrafacial-avanzado',
  titulo:'Test Avanzado — HydraFacial',
  categoria:'General',
  nivel:'Avanzado',
  minimoAprobacion:10,
  preguntas:[
    {q:'¿Cuál es el mecanismo de la punta Vortex del HydraFacial y cómo logra la extracción sin irritar?',o:['Usa presión mecánica manual del operador','La punta en espiral genera un vórtice de succión que simultáneamente exfolia, desprende impurezas y las aspira hacia el recipiente de residuos, distribuyendo la presión uniformemente para minimizar irritación','Usa corriente eléctrica para disolver las impurezas','La presión es tan alta que rompe los poros'],c:1},
    {q:'¿Qué función cumplen los ácidos glicólico y salicílico en la fase de exfoliación del HydraFacial?',o:['Solo hidratan la piel superficialmente','El ácido glicólico (AHA) exfolia la capa córnea rompiendo los enlaces entre corneocitos; el salicílico (BHA) penetra en los poros disolviendo sebum y queratina acumulada, preparando la piel para la extracción e infusión','Son solo vehículos para transportar los sueros','Solo actúan como conservantes de los sueros'],c:1},
    {q:'¿Cómo deben adaptarse los sueros del HydraFacial según el fototipo y las necesidades de la piel?',o:['Siempre se usa el mismo protocolo estándar sin variación','Se seleccionan potenciadores (boosters) específicos: vitamina C y antioxidantes para manchas y luminosidad, ácido hialurónico para hidratación, péptidos para anti-aging, o activos específicos para acné según el diagnóstico cutáneo','Solo varía la duración del tratamiento','Solo se adapta en pieles con acné severo'],c:1},
    {q:'¿Qué precaución especial requiere el HydraFacial en pieles con rosácea leve?',o:['Está completamente contraindicado en rosácea','Se puede realizar con parámetros de succión reducidos, evitando zonas de eritema activo, usando sueros calmantes y evitando activos irritantes; siempre evaluar la fase de la rosácea','Se aplica con máxima succión para limpiar los capilares','No hay ninguna precaución especial'],c:1},
    {q:'¿Por qué el HydraFacial es compatible con pieles sensibles a diferencia de otros peelings?',o:['Porque no usa ningún ácido','La combinación de exfoliación mecánica suave con ácidos a concentraciones bajas, succión controlada e infusión inmediata de activos calmantes e hidratantes minimiza la irritación y el tiempo de exposición de los ácidos en la piel','Porque usa corriente eléctrica en lugar de ácidos','Porque solo actúa en la epidermis más superficial sin ningún efecto real'],c:1},
    {q:'¿Cómo se integra el HydraFacial en un protocolo anti-aging completo?',o:['Es suficiente como único tratamiento para todos los signos de envejecimiento','Se combina con radiofrecuencia, HIFU, peelings médicos o bioestimuladores según la profundidad del envejecimiento: el HydraFacial aporta hidratación, luminosidad y textura mientras otros tratamientos actúan en capas más profundas','Solo funciona como tratamiento único','No se puede combinar con ningún otro tratamiento'],c:1},
    {q:'¿Qué activos del suero LED/antioxidante del HydraFacial tienen evidencia para reducción de pigmentación?',o:['Solo la glicerina','Vitamina C estabilizada, ácido kójico, niacinamida y extractos botánicos antioxidantes que inhiben la tirosinasa y neutralizan radicales libres, reduciendo la producción y oxidación de melanina','Solo el agua de rosas','Los conservantes del suero'],c:1},
    {q:'¿Cuándo está contraindicado el HydraFacial en una paciente que usa retinoides?',o:['Nunca, los retinoides potencian el efecto','Si usa retinoides tópicos de alta concentración o isotretinoína oral activa; se debe suspender los retinoides 5-7 días antes para evitar hipersensibilidad y riesgo de irritación excesiva por la exfoliación combinada','Solo si la paciente es menor de 18 años','Los retinoides no tienen ninguna interacción con el HydraFacial'],c:1},
    {q:'¿Qué diferencia al HydraFacial de una limpieza facial convencional en términos de resultados clínicos?',o:['Son equivalentes en resultados','El HydraFacial combina exfoliación química controlada, extracción por vórtice e infusión de activos en presión, logrando penetración superior de los ingredientes activos y resultados clínicamente más significativos en hidratación, textura y luminosidad que la limpieza manual','La limpieza convencional es más efectiva','Solo difieren en el precio'],c:1},
    {q:'¿Qué protocolo específico existe para tratar hiperpigmentación con HydraFacial?',o:['No existe protocolo para hiperpigmentación','Se usa el booster Britenol o equivalentes con alfa-arbutina y extracto de guanábana, combinando la exfoliación con ácido glicólico que aumenta la renovación celular y la infusión de inhibidores de tirosinasa para reducir progresivamente las manchas','Solo funciona si se combina con láser en la misma sesión','La hiperpigmentación no responde al HydraFacial'],c:1},
    {q:'¿Cómo debe adaptarse el protocolo HydraFacial para piel con acné activo leve-moderado?',o:['Se contraindica completamente en acné activo','Se priorizan activos con ácido salicílico para la limpieza de poros, se evita la succión excesiva sobre lesiones inflamadas activas, se infunden sueros con niacinamida y zinc reguladores del sebo, y se evita tratar pústulas o quistes activos directamente','Se aplica máxima succión para vaciar todas las lesiones','Se agrega peróxido de benzoilo al suero'],c:1},
    {q:'¿Qué ventaja clínica ofrece la infusión de ácido hialurónico durante el HydraFacial comparado con su aplicación tópica convencional?',o:['No hay ninguna diferencia','La apertura del poro post-exfoliación y la presión de infusión del HydraFacial permiten que el ácido hialurónico penetre más profundamente en la dermis superficial comparado con la aplicación tópica convencional que queda en la superficie epidérmica','El ácido hialurónico tópico penetra igual de profundo','El HydraFacial destruye el ácido hialurónico por la succión'],c:1},
  ],
};
const EVAL_SOPRANO_BASICO = {
  id:'soprano-basico',
  titulo:'Test Básico — Diodo Soprano Titanium ICE',
  categoria:'Láser Depilación',
  nivel:'Básico',
  minimoAprobacion:10,
  preguntas:[
    {q:'¿Qué tecnología utiliza el Soprano Titanium ICE para la depilación?',o:['Luz pulsada intensa (IPL)','Triple longitud de onda diodo (755 nm Alexandrita + 810 nm Diodo + 1064 nm Nd:YAG) con sistema ICE de enfriamiento simultáneo','Radiofrecuencia monopolar','Ultrasonido focalizado'],c:1},
    {q:'¿Qué significa ICE en el Soprano Titanium ICE?',o:['Integrated Cooling Energy — sistema de enfriamiento integrado en el cabezal que enfría la piel simultáneamente al disparo','Intense Concentrated Energy','Internal Circuit Engine','Infrared Cooling Element'],c:0},
    {q:'¿Cuál es la ventaja principal del sistema ICE del Soprano?',o:['Aumenta la potencia del láser','Permite tratar la piel bronceada sin ningún riesgo','Protege la epidermis del calor durante el disparo, haciendo el tratamiento más cómodo y seguro, especialmente en pieles oscuras','Solo sirve para decoración del equipo'],c:2},
    {q:'¿Qué modo de disparo usa el Soprano Titanium ICE?',o:['Pulso único de alta energía fija','Modo SHR (Super Hair Removal) de disparos múltiples en movimiento a baja fluencia acumulativa','Solo disparos puntuales manuales','Modo automático sin intervención del operador'],c:1},
    {q:'¿Para qué fototipos de piel está indicado el Soprano Titanium ICE?',o:['Solo para fototipos I y II (pieles muy claras)','Solo para fototipos IV-VI','Para todos los fototipos I-VI, incluyendo pieles bronceadas, gracias a la triple longitud de onda y el sistema ICE','Solo para pieles sin vello oscuro'],c:2},
    {q:'¿Qué sensación es habitual durante el tratamiento con Soprano Titanium ICE?',o:['Dolor intenso similar a quemaduras','Sensación de calor progresivo con enfriamiento simultáneo, mucho más tolerable que láseres convencionales de pulso único','Frío intenso sin ningún calor','Corriente eléctrica en la piel'],c:1},
    {q:'¿Qué preparación debe hacer el paciente antes de una sesión con Soprano?',o:['Broncearse para activar la melanina del folículo','Depilarse con cera el día anterior','Afeitar la zona 24-48 horas antes y evitar exposición solar al menos 2 semanas previas','Aplicar crema depilatoria el mismo día'],c:2},
    {q:'¿Cuántas sesiones se necesitan generalmente con el Soprano Titanium ICE?',o:['1 sola sesión definitiva','6 a 8 sesiones espaciadas según el ciclo del vello de cada zona','20 sesiones mínimo','Solo 2 sesiones en total'],c:1},
    {q:'¿Cuál es la contraindicación más importante para el Soprano Titanium ICE?',o:['Tener vello oscuro y piel clara','Embarazo, marcapasos, implantes metálicos en la zona y lesiones activas en el área a tratar','Ser mayor de 25 años','Usar protector solar habitualmente'],c:1},
    {q:'¿Qué cuidado es indispensable después de cada sesión?',o:['Exposición solar directa para ver los resultados','Protector solar SPF 50+ y evitar exposición solar y calor intenso (sauna, vapor) las primeras 48 horas','Cera para eliminar el vello tratado','Aplicar agua muy caliente en la zona'],c:1},
    {q:'¿Qué hace que el Soprano Titanium ICE sea más rápido que otros equipos de depilación láser?',o:['Usa mayor potencia que destruye todos los folículos de una vez','El cabezal grande y el modo SHR permiten tratar áreas extensas en menos tiempo con movimiento continuo','El equipo trabaja solo sin operador','Solo es más rápido en piernas'],c:1},
    {q:'¿Qué protección ocular se requiere durante la sesión con Soprano Titanium ICE?',o:['No se necesita ninguna protección','Lentes de sol comunes','Gafas de protección certificadas para las longitudes de onda del equipo tanto para el operador como para el paciente','Solo el operador necesita protección'],c:2},
  ],
};
const EVAL_SOPRANO_INTERMEDIO = {
  id:'soprano-intermedio',
  titulo:'Test Intermedio — Diodo Soprano Titanium ICE',
  categoria:'Láser Depilación',
  nivel:'Intermedio',
  minimoAprobacion:10,
  preguntas:[
    {q:'¿Cómo actúan simultáneamente las 3 longitudes de onda del Soprano Titanium?',o:['Se usan en sesiones separadas, no simultáneamente','755 nm (Alexandrita) actúa en la melanina superficial del folículo; 810 nm (Diodo) penetra en profundidad media; 1064 nm (Nd:YAG) alcanza folículos profundos y es seguro en pieles oscuras. La emisión simultánea cubre todo el espectro de profundidades y fototipos','Las 3 longitudes actúan exactamente igual','Solo el 810 nm tiene efecto real sobre el folículo'],c:1},
    {q:'¿Qué ventaja clínica ofrece la triple longitud de onda sobre los equipos monolongitud de onda?',o:['No ofrece ninguna ventaja clínica comprobada','Permite tratar eficazmente todo el rango de fototipos y profundidades foliculares en un solo equipo, reduciendo el riesgo en pieles oscuras y mejorando la eficacia en vellos de diferentes profundidades','Solo es una estrategia de marketing','Es más rápido pero menos efectivo'],c:1},
    {q:'¿Cómo funciona el modo SHR (Super Hair Removal) del Soprano en comparación con el modo HR convencional?',o:['SHR usa pulsos únicos de máxima energía','SHR aplica múltiples disparos de baja fluencia en movimiento continuo, acumulando calor progresivamente en el folículo (calentamiento in-motion); HR usa pulsos únicos de mayor energía en posición estática. SHR es más cómodo y seguro en pieles oscuras','Son exactamente iguales en mecanismo','HR es más moderno que SHR'],c:1},
    {q:'¿Cuál es la temperatura óptima que debe alcanzar el folículo durante el tratamiento SHR con Soprano?',o:['20-30 °C','37 °C (temperatura corporal normal)','Entre 45-50 °C acumulativos en el folículo para lograr la destrucción térmica sin dañar la epidermis gracias al ICE','100 °C para garantizar la destrucción'],c:2},
    {q:'¿Cómo se ajusta la fluencia en el Soprano según el fototipo de Fitzpatrick?',o:['La fluencia es siempre la misma para todos los fototipos','A mayor fototipo (piel más oscura), se reduce la fluencia y se prioriza el Nd:YAG 1064 nm; en fototipos bajos (piel clara) se puede usar mayor fluencia con 755 nm y 810 nm','Se usa siempre la fluencia máxima','Solo varía la velocidad de movimiento'],c:1},
    {q:'¿Qué es el cabezal "In-Motion" del Soprano y cómo debe usarse correctamente?',o:['Es un cabezal estático que se coloca y no se mueve','Es un cabezal que se desliza continuamente en movimiento circular o lineal sobre la piel, disparando a alta frecuencia; debe mantenerse siempre en contacto y movimiento para distribuir el calor uniformemente y evitar acumulación térmica excesiva','Se usa golpeando la piel repetidamente','Solo funciona en zonas pequeñas'],c:1},
    {q:'¿Por qué el Soprano Titanium ICE puede tratar piel ligeramente bronceada con mayor seguridad que otros equipos?',o:['Porque tiene menos potencia','La combinación del sistema ICE que protege la epidermis y la triple longitud de onda permite ajustar parámetros para reducir el riesgo de daño epidérmico, aunque siempre se debe evaluar el grado de bronceado','El bronceado no afecta ningún láser','Porque usa solo Nd:YAG en pieles bronceadas'],c:1},
    {q:'¿Cuál es el intervalo correcto entre sesiones de Soprano para la zona del cuerpo?',o:['Cada semana','Cada 15 días siempre','Cada 6-8 semanas para zonas corporales (ciclo anágeno más largo) y cada 4 semanas para zonas faciales','Cada 6 meses'],c:2},
    {q:'¿Qué indica el "efecto peppering" 7-14 días después de una sesión con Soprano?',o:['Una quemadura superficial que requiere consulta médica','La aparición de puntos oscuros que representan el vello destruido emergiendo hacia la superficie antes de caer; es señal de respuesta correcta al tratamiento','Que el equipo no funcionó correctamente','Que se debe aumentar la fluencia en la próxima sesión'],c:1},
    {q:'¿Qué contraindicación relativa requiere evaluación especial antes de usar el Soprano?',o:['Tener la piel hidratada','Uso de medicación fotosensibilizante (tetraciclinas, isotretinoína), patología hormonal activa no controlada (SOP) o antecedentes de queloides en la zona','Hacer ejercicio regularmente','Usar desodorante en axilas'],c:1},
    {q:'¿Cómo debe tratarse la zona de tatuajes con el Soprano Titanium ICE?',o:['Se trata igual que el resto de la piel','Se debe evitar disparar sobre el tatuaje ya que los pigmentos absorben la energía láser pudiendo decolorar o dañar el tatuaje; se puede tratar el vello alrededor del tatuaje con cuidado','Se aumenta la fluencia sobre el tatuaje para mejor resultado','Los tatuajes no interactúan con el láser diodo'],c:1},
    {q:'¿Qué ventaja ofrece el Soprano Titanium ICE para el tratamiento de zonas extensas como espalda o piernas completas?',o:['No tiene ventajas especiales en zonas extensas','El cabezal grande combinado con el modo SHR in-motion permite cubrir grandes superficies rápidamente sin perder eficacia, reduciendo significativamente el tiempo de sesión comparado con equipos de disparo puntual','Solo es rápido en zonas pequeñas','El tamaño del cabezal no influye en el tiempo'],c:1},
  ],
};
const EVAL_SOPRANO_AVANZADO = {
  id:'soprano-avanzado',
  titulo:'Test Avanzado — Diodo Soprano Titanium ICE',
  categoria:'Láser Depilación',
  nivel:'Avanzado',
  minimoAprobacion:10,
  preguntas:[
    {q:'¿Cuál es el fundamento físico del calentamiento acumulativo en el modo SHR del Soprano Titanium?',o:['Cada disparo individual destruye el folículo de forma independiente','Los múltiples pulsos de baja fluencia elevan progresivamente la temperatura del folículo por debajo del umbral de daño epidérmico en cada pulso individual, pero acumulando calor hasta superar el umbral de necrosis folicular (45-50 °C); el ICE simultáneo mantiene la epidermis por debajo del umbral de daño','El calentamiento es aleatorio sin control térmico','El folículo no necesita alcanzar temperatura específica'],c:1},
    {q:'¿Cómo interactúan las 3 longitudes de onda del Soprano con los diferentes cromóforos del tejido?',o:['Todas actúan sobre el mismo cromóforo de la misma manera','755 nm tiene máxima absorción por melanina (ideal para folículos superficiales en pieles claras); 810 nm equilibra absorción por melanina y penetración (versatilidad); 1064 nm tiene mínima absorción epidérmica pero penetra más profundo (seguridad en pieles oscuras y folículos profundos)','Solo la melanina del vello absorbe energía','Las 3 longitudes tienen coeficientes de absorción idénticos'],c:1},
    {q:'¿Qué implica el TRT (tiempo de relajación térmica) en el diseño del modo SHR del Soprano?',o:['El TRT no aplica al modo SHR','Los pulsos individuales del SHR son más cortos que el TRT de la epidermis pero la frecuencia de repetición permite que el calor se acumule en el folículo (mayor masa térmica) más que en la epidermis (menor masa, se disipa más rápido); el ICE acelera la disipación epidérmica ampliando el margen de seguridad','El TRT solo importa en equipos de pulso único','El SHR ignora el TRT por diseño'],c:1},
    {q:'¿Cuál es la diferencia clínica entre tratar con el Soprano en modo SHR vs modo HR en piel de fototipo V?',o:['Son equivalentes en seguridad y eficacia','En fototipo V, el SHR es significativamente más seguro: la fluencia individual baja reduce la absorción por la melanina epidérmica oscura en cada pulso, mientras el ICE mantiene la temperatura epidérmica en rango seguro; el HR de pulso único requiere fluencias más altas con mayor riesgo de hipopigmentación','El HR es siempre preferido en pieles oscuras','No hay diferencia por fototipo'],c:1},
    {q:'¿Qué es la hipertricosis paradójica y en qué contexto puede ocurrir con el Soprano Titanium?',o:['Un efecto buscado para densificar el vello','Estimulación de crecimiento de vello en zonas adyacentes al área tratada, posiblemente por fluencias subóptimas que activan folículos latentes; más frecuente en pieles oscuras con vello fino; solución: aumentar fluencia o cambiar protocolo','Un error de calibración del equipo','La caída total del vello post-sesión'],c:1},
    {q:'¿Cómo debe evaluarse la respuesta tisular correcta durante el tratamiento con Soprano Titanium ICE?',o:['No se evalúa durante el tratamiento','Se busca eritema perifólicular leve e inmediato durante/post-sesión como señal de respuesta correcta. Ausencia total de reacción indica fluencia insuficiente; eritema difuso, edema excesivo o cambios epidérmicos indican fluencia excesiva; se ajusta en tiempo real','Se evalúa solo al mes de la sesión','El dolor del paciente es el único indicador'],c:1},
    {q:'¿Qué protocolo es correcto para el tratamiento de zona facial masculina (barba) con Soprano Titanium ICE?',o:['Se trata igual que cualquier otra zona corporal','La barba masculina tiene folículos más profundos, vello muy grueso y alta densidad; requiere fluencias más altas, mayor número de sesiones (puede superar 10), y nunca se logra resultado 100% definitivo por la alta carga androgénica; se recomienda al paciente expectativas realistas','El Soprano no puede tratar barba masculina','Se usa solo el modo HR en barba nunca SHR'],c:1},
    {q:'¿Qué consideración técnica especifica el protocolo para el tratamiento de zona perianal con Soprano Titanium ICE?',o:['No hay consideraciones especiales','Requiere consentimiento informado específico, parámetros conservadores (menor fluencia en mucosa adyacente), verificación de ausencia de lesiones activas (herpes, HPV), posicionamiento adecuado del paciente y cuidado especial para no irradiar mucosa directamente','Se usa máxima fluencia para mejor resultado','El Soprano no puede tratar esa zona'],c:1},
    {q:'¿Cómo afecta el SOP (síndrome de ovario poliquístico) a los resultados del Soprano Titanium ICE y qué se debe comunicar a la paciente?',o:['El SOP no tiene ningún efecto sobre los resultados','El exceso androgénico del SOP estimula continuamente nuevos folículos terminales; aunque el Soprano destruye los folículos tratados, nuevos pueden activarse; se debe informar que el tratamiento requerirá más sesiones, mantenimientos periódicos y que los resultados son más limitados sin tratamiento hormonal paralelo','El Soprano es más efectivo en pacientes con SOP','El SOP mejora la absorción del láser'],c:1},
    {q:'¿Cuál es la base científica del sistema de enfriamiento por contacto del ICE y cómo protege la epidermis durante el SHR?',o:['El enfriamiento solo sirve para el confort del paciente','El enfriamiento por contacto extrae calor de la epidermis continuamente durante el tratamiento, reduciendo su temperatura por debajo del umbral de daño (aproximadamente 45 °C) mientras el calor se acumula en el folículo más profundo; la conductividad térmica diferencial entre epidermis enfriada y folículo profundo crea el gradiente térmico selectivo que hace posible el SHR seguro','El enfriamiento reduce la eficacia del tratamiento','El ICE solo actúa antes del disparo, no durante'],c:1},
    {q:'¿Qué ventaja ofrece el Soprano Titanium ICE sobre el Soprano XL o versiones anteriores para protocolos de zonas oscuras?',o:['No hay diferencias significativas entre versiones','El Titanium integra las 3 longitudes de onda en un solo cabezal (vs aplicadores separados en versiones anteriores), mejora el sistema ICE y optimiza el algoritmo de control de temperatura en tiempo real, permitiendo protocolos más seguros y eficaces en todo el rango de fototipos en menos tiempo','El Soprano XL es superior al Titanium','Las versiones anteriores son más precisas'],c:1},
    {q:'¿Cómo debe documentarse correctamente cada sesión de Soprano Titanium ICE en la ficha del paciente?',o:['Solo se registra si hubo algún incidente','Se documenta: zona tratada, fototipo evaluado, parámetros usados (fluencia J/cm², frecuencia Hz, modo SHR/HR), número de pasadas, respuesta tisular observada, incidencias si las hay, recomendaciones post-sesión y fecha de próxima sesión','Solo se registra el nombre de la zona','La documentación es opcional y no tiene valor clínico'],c:1},
  ],
};
const EVAL_BRONCEADO_BASICO = {
  id:'bronceado-basico',
  titulo:'Test Básico — Bronceado Orgánico',
  categoria:'General',
  nivel:'Básico',
  minimoAprobacion:10,
  preguntas:[
    {q:'¿Qué es el bronceado orgánico o autobronceante?',o:['Un bronceado obtenido por exposición solar controlada','Un método de coloración temporal de la piel mediante activos naturales como la DHA que reacciona con las proteínas de la epidermis sin exposición a rayos UV','Un tatuaje temporal de color marrón','Un tratamiento con láser que oscurece la piel'],c:1},
    {q:'¿Cuál es el ingrediente activo principal del bronceado orgánico?',o:['Melanina sintética inyectada','DHA (dihidroxiacetona), un azúcar derivado de plantas que reacciona con los aminoácidos de la capa córnea produciendo coloración marrón','Yodo y agua oxigenada','Betacaroteno aplicado en forma de spray'],c:1},
    {q:'¿El bronceado orgánico protege la piel del sol?',o:['Sí, equivale a SPF 50','Sí, protege completamente de los rayos UV','No, no proporciona protección solar; es solo coloración cosmética y debe complementarse siempre con protector solar','Solo protege de rayos UVA'],c:2},
    {q:'¿Cuánto tiempo tarda en desarrollarse el color del bronceado orgánico?',o:['Es instantáneo al aplicarlo','Entre 4 y 8 horas para ver el color completo, con desarrollo progresivo hasta las 24 horas','Tarda 3 días en aparecer','El color aparece solo después de lavarse'],c:1},
    {q:'¿Cuánto dura el bronceado orgánico en la piel?',o:['Es permanente','Solo dura 24 horas','Entre 5 y 10 días según el tipo de piel, la preparación y los cuidados posteriores','Dura exactamente 30 días'],c:2},
    {q:'¿Qué preparación es esencial antes de aplicar el bronceado orgánico?',o:['Broncearse al sol para activar la melanina','Exfoliar bien la piel 24 horas antes para eliminar células muertas y lograr un resultado uniforme','Aplicar crema hidratante espesa justo antes del tratamiento','Depilarse con cera el mismo día'],c:1},
    {q:'¿Cuánto tiempo debe esperar el cliente antes de ducharse tras la aplicación?',o:['Puede ducharse inmediatamente','Entre 6 y 12 horas según el producto y el nivel de color deseado','Exactamente 2 minutos','No puede ducharse en 3 días'],c:1},
    {q:'¿Qué zonas requieren menor cantidad de producto durante la aplicación?',o:['Las piernas y el abdomen','Rodillas, codos, tobillos y muñecas, por ser zonas de piel más gruesa y seca que absorben más producto y oscurecen desproporcionadamente','Solo la cara','Solo las axilas'],c:1},
    {q:'¿Qué ropa debe usar el cliente después de la aplicación?',o:['Ropa ajustada oscura para que no se note','Ropa suelta, oscura y holgada para evitar marcas y manchas mientras el producto se desarrolla','Ropa blanca para ver el resultado','No importa el tipo de ropa'],c:1},
    {q:'¿Cuál es una contraindicación del bronceado orgánico?',o:['Tener piel oscura naturalmente','Alergia conocida a la DHA o componentes del producto, heridas abiertas o irritación activa en la zona a tratar','Ser mayor de 30 años','Usar desodorante habitualmente'],c:1},
    {q:'¿Qué cuidado post-aplicación prolonga el bronceado orgánico?',o:['Exfoliar diariamente para renovar el color','Hidratación diaria de la piel, evitar baños largos con agua muy caliente y no exfoliar hasta que el cliente quiera eliminar el bronceado','Exposición solar directa para fijar el color','Aplicar aceite mineral en abundancia'],c:1},
    {q:'¿Se puede aplicar bronceado orgánico sobre piel con psoriasis activa?',o:['Sí, sin ningún problema','Sí, mejora la psoriasis','No, las lesiones activas de psoriasis contraindican la aplicación; el resultado sería irregular y puede irritar las lesiones','Solo si las lesiones son pequeñas'],c:2},
  ],
};
const EVAL_BRONCEADO_AVANZADO = {
  id:'bronceado-avanzado',
  titulo:'Test Avanzado — Bronceado Orgánico',
  categoria:'General',
  nivel:'Avanzado',
  minimoAprobacion:10,
  preguntas:[
    {q:'¿Cuál es el mecanismo químico por el que la DHA produce coloración en la piel?',o:['Estimula los melanocitos para producir melanina','La DHA reacciona con los grupos amino libres de los aminoácidos de la queratina en la capa córnea mediante la reacción de Maillard (glicación), produciendo compuestos coloreados llamados melanoidinas que generan el tono marrón','Oxida la hemoglobina superficial de los capilares','Se une a los lípidos de la membrana celular y los oscurece'],c:1},
    {q:'¿Por qué el resultado del bronceado orgánico varía según el tipo de piel?',o:['No varía, es siempre igual en todos los tipos de piel','El contenido de aminoácidos en la queratina varía según el tipo de piel, el pH cutáneo y el grosor de la capa córnea; pieles más secas o con mayor capa córnea pueden absorber más DHA y oscurecer desproporcionadamente en ciertas zonas','Solo varía el color, no la intensidad','La variación es solo estética sin base científica'],c:1},
    {q:'¿Cómo debe adaptarse la técnica de aplicación en spray para lograr un resultado uniforme en zonas difíciles como rodillas y codos?',o:['Se aplica más producto en esas zonas para compensar','Se aplica una capa más fina y se difumina inmediatamente con guante o esponja; se puede aplicar una capa de hidratante ligero previo en esas zonas para reducir la absorción excesiva de DHA en piel más gruesa','Se evitan completamente esas zonas','Se aplica con pincel fino en lugar de spray'],c:1},
    {q:'¿Qué pH cutáneo favorece un resultado más oscuro y duradero con la DHA?',o:['pH alcalino (mayor de 7)','pH ácido (menor de 5.5) ya que la reacción de Maillard se ve favorecida en ambiente ligeramente ácido; por eso se recomienda no aplicar desodorante o productos alcalinos antes del tratamiento','pH neutro exactamente de 7','El pH no tiene ningún efecto sobre el resultado'],c:0},
    {q:'¿Cómo se gestiona la aplicación del bronceado orgánico en clientes con piel muy clara (fototipo I) vs piel más oscura (fototipo IV)?',o:['Se aplica el mismo protocolo sin variación','En fototipos claros se puede usar DHA de mayor concentración para lograr el resultado deseado; en fototipos oscuros se recomienda concentración menor o igual para evitar tonos anaranjados o poco naturales; además el desarrollo del color será más sutil en pieles más oscuras','Solo funciona en fototipos I y II','En fototipos oscuros se duplica la dosis'],c:1},
    {q:'¿Qué causa el tono anaranjado no deseado en el bronceado orgánico y cómo se previene?',o:['Es inevitable en todos los casos','El tono anaranjado ocurre por exceso de DHA, mala exfoliación previa, piel muy seca o concentración inadecuada para el fototipo; se previene con buena preparación de la piel, concentración correcta de DHA y formulaciones con pigmentos correctores (bronzers) que compensan el tono','Solo ocurre en pieles oscuras','Solo se puede corregir con maquillaje'],c:1},
    {q:'¿Cómo se combina correctamente el bronceado orgánico con otros tratamientos estéticos en un protocolo?',o:['No se puede combinar con ningún otro tratamiento','El bronceado orgánico debe realizarse después de depilación láser (mínimo 48-72 horas), después de tratamientos exfoliantes (mínimo 24-48 horas) y antes de tratamientos hidratantes; nunca el mismo día que peelings o radiofrecuencia que pueden alterar el pH y la reacción de la DHA','Se puede hacer el mismo día que cualquier tratamiento','Debe hacerse siempre antes de la depilación'],c:1},
    {q:'¿Qué diferencia a los productos de bronceado orgánico con DHA natural (caña de azúcar/remolacha) vs DHA sintética en términos de resultado?',o:['No hay ninguna diferencia práctica','La DHA de origen natural puede tener mayor biocompatibilidad y menor riesgo de irritación; algunas formulaciones naturales incluyen activos botánicos que mejoran la uniformidad y durabilidad; sin embargo la concentración y el vehículo (gel, mousse, spray) impactan más en el resultado final que el origen de la DHA','La DHA sintética siempre da mejor resultado','La DHA natural no funciona en pieles claras'],c:0},
    {q:'¿Cómo debe manejarse una reacción alérgica post-aplicación de bronceado orgánico?',o:['Aplicar más producto para cubrir la reacción','Retirar el producto con agua abundante, aplicar calmante sin fragancia, consultar al paciente sobre alergias conocidas y derivar si la reacción es severa; registrar el incidente y contraindicar el producto en futuras sesiones','Esperar a que la reacción desaparezca sola sin hacer nada','Aplicar crema con corticoides sin consultar'],c:1},
    {q:'¿Qué técnica de aplicación en cabina garantiza la mayor uniformidad en todo el cuerpo?',o:['Aplicar en cualquier orden sin técnica específica','Aplicar de abajo hacia arriba (pies a cabeza), en secciones, con movimientos circulares y lineales uniformes, difuminando inmediatamente bordes y zonas de transición; el operador debe usar guantes para evitar teñir las manos y verificar la cobertura antes de que el cliente se vista','Aplicar solo en las zonas que pide el cliente','Usar brocha gruesa en lugar de guante o spray'],c:1},
    {q:'¿Qué diferencia al bronceado orgánico profesional de cabina del autobronceante de farmacia y qué valor agregado ofrece el servicio profesional?',o:['Son exactamente lo mismo','El servicio profesional usa formulaciones de mayor calidad y concentración, técnica de aplicación experta que garantiza uniformidad, preparación adecuada de la piel, personalización según fototipo y objetivo del cliente, y asesoramiento en cuidados posteriores; el resultado es significativamente más natural, uniforme y duradero','Solo difieren en el precio','El de farmacia siempre da mejor resultado'],c:1},
    {q:'¿Cómo se evalúa y certifica la competencia técnica de una operadora en bronceado orgánico según estándares de calidad?',o:['Solo con un examen teórico sin práctica','La evaluación debe incluir conocimiento teórico del mecanismo de la DHA, protocolos de preparación y aplicación, manejo de contraindicaciones, técnica práctica supervisada con resultado uniforme y natural, y capacidad de asesoramiento al cliente; la certificación acredita que la operadora puede ofrecer el servicio con calidad y seguridad','Solo se requiere haber aplicado una vez','No existe certificación para bronceado orgánico'],c:1},
  ],
};
const EVAL_APARATOLOGIA_BASICO = {
  id:'aparatologia-basico',
  titulo:'Test Nivel 1 — Introducción a la Aparatología Estética',
  categoria:'General',
  nivel:'Básico',
  minimoAprobacion:10,
  preguntas:[
    {q:'¿Qué se entiende por aparatología estética?',o:['El uso de maquillaje y cosméticos profesionales','El conjunto de equipos y tecnologías que aplican energías físicas (láser, ultrasonido, radiofrecuencia, etc.) para mejorar la apariencia y el bienestar sin cirugía','Solo los equipos de depilación láser','Cualquier herramienta de masaje manual'],c:1},
    {q:'¿Cuál es el primer paso antes de realizar cualquier tratamiento con aparatología?',o:['Encender el equipo y comenzar directamente','Realizar una anamnesis completa: antecedentes médicos, medicación, contraindicaciones y consentimiento informado del cliente','Elegir el programa del equipo según el área','Aplicar el gel conductor sin más preparación'],c:1},
    {q:'¿Qué es el consentimiento informado y por qué es obligatorio?',o:['Un formulario opcional que firman solo clientes mayores de 60 años','Un documento donde el cliente declara conocer el tratamiento, sus beneficios, riesgos y contraindicaciones; es obligatorio por protección legal y ética del operador y el cliente','Solo se requiere para tratamientos de láser','Un comprobante de pago del servicio'],c:1},
    {q:'¿Cuál es una contraindicación general que aplica a casi todos los equipos de aparatología?',o:['Tener piel hidratada','Embarazo, marcapasos o implantes electrónicos activos en la zona a tratar','Ser mayor de 18 años','Haber tomado agua antes de la sesión'],c:1},
    {q:'¿Qué norma básica de higiene debe cumplirse en el uso de equipos de aparatología?',o:['No es necesario limpiar los accesorios entre clientes si no hay suciedad visible','Limpiar y desinfectar todos los accesorios y cabezales de contacto entre cada cliente según el protocolo del fabricante','Solo limpiar al final del día','Solo desinfectar si el cliente lo solicita'],c:1},
    {q:'¿Qué se debe hacer si un cliente presenta una contraindicación durante la anamnesis?',o:['Realizar el tratamiento de todas formas si el cliente lo pide','Reducir la potencia a la mitad y continuar','No realizar el tratamiento y explicar al cliente el motivo; derivar si corresponde','Ignorarlo si la contraindicación parece leve'],c:1},
    {q:'¿Qué significa EPP en el contexto de la aparatología estética?',o:['Equipo de Potencia Programable','Equipo de Protección Personal: guantes, gafas certificadas, ropa adecuada que protegen al operador durante el uso de equipos','Estándar de Protocolo Profesional','Evaluación de Parámetros del equipo'],c:1},
    {q:'¿Por qué es importante conocer el tipo de piel del cliente antes de aplicar aparatología?',o:['Solo para elegir el color del gel conductor','Porque el fototipo, la sensibilidad y las condiciones de la piel determinan qué tratamientos son seguros y qué parámetros deben usarse para evitar efectos adversos','No influye en el tratamiento','Solo importa en tratamientos faciales'],c:1},
    {q:'¿Qué debe hacerse si durante un tratamiento el cliente expresa dolor intenso o malestar?',o:['Pedirle que aguante porque es normal','Continuar pero hablar con el cliente para distraerlo','Detener el tratamiento inmediatamente, evaluar la situación y ajustar parámetros o suspender la sesión','Aumentar la potencia para terminar más rápido'],c:2},
    {q:'¿Cuál es la función del gel conductor en equipos de ultrasonido o radiofrecuencia?',o:['Solo hidrata la piel durante el tratamiento','Facilita el contacto entre el cabezal y la piel, permite la transmisión eficiente de la energía y evita la fricción y el calor excesivo superficial','Es solo decorativo y puede omitirse','Solo sirve para que el cabezal se deslice'],c:1},
    {q:'¿Qué información debe registrarse en la ficha del cliente después de cada sesión?',o:['Solo el nombre del cliente y la fecha','Zona tratada, equipo utilizado, parámetros aplicados, respuesta de la piel, incidencias observadas y recomendaciones post-sesión','Solo si hubo algún problema','Solo la forma de pago'],c:1},
    {q:'¿Por qué se recomienda hacer un test de parche antes de aplicar un nuevo tratamiento o equipo a un cliente?',o:['Para que el cliente conozca el equipo','Para evaluar la respuesta individual de la piel al tratamiento en una zona pequeña antes de tratar el área completa, identificando posibles reacciones adversas','Es solo un requisito burocrático sin valor real','Solo se hace en tratamientos de láser'],c:1},
  ],
};
const EVAL_APARATOLOGIA_INTERMEDIO = {
  id:'aparatologia-intermedio',
  titulo:'Test Nivel 2 — Aplicación Práctica en Aparatología Estética',
  categoria:'General',
  nivel:'Intermedio',
  minimoAprobacion:10,
  preguntas:[
    {q:'¿Cómo se determina el parámetro de energía correcto para cada cliente en un equipo de aparatología?',o:['Se usa siempre la potencia máxima para mejores resultados','Se evalúa el fototipo, el área a tratar, la sensibilidad individual y las indicaciones del fabricante; se comienza con parámetros conservadores y se ajusta según la respuesta tisular del cliente','Se usa siempre la mínima potencia por seguridad','El equipo lo determina automáticamente sin intervención del operador'],c:1},
    {q:'¿Qué diferencia existe entre un tratamiento facial y uno corporal en términos de parámetros?',o:['Son exactamente iguales','Los tratamientos faciales requieren generalmente menor energía, mayor precisión y cabezales más pequeños por la mayor sensibilidad de la piel facial y la proximidad a estructuras delicadas; los corporales permiten mayor energía y cabezales más grandes','Solo varía el tiempo de sesión','El tratamiento corporal siempre es más seguro'],c:1},
    {q:'¿Cómo debe posicionarse el cliente para optimizar la seguridad y la eficacia del tratamiento?',o:['En cualquier posición que el operador prefiera','En una posición cómoda que permita acceso completo a la zona, evite tensiones musculares y facilite la correcta aplicación del equipo; algunas tecnologías requieren posiciones específicas (placa de retorno, zonas de alcance)','Solo importa la posición en tratamientos faciales','El posicionamiento no influye en el resultado'],c:1},
    {q:'¿Qué es el protocolo de tratamiento y por qué debe seguirse?',o:['Una sugerencia opcional del fabricante','La secuencia estandarizada de pasos (preparación, aplicación, finalización y cuidados post) que garantiza la seguridad, eficacia y reproducibilidad del tratamiento; su seguimiento protege al cliente y al operador','Solo sirve para los equipos más caros','Solo importa en la primera sesión'],c:1},
    {q:'¿Cómo se evalúa la respuesta tisular correcta durante un tratamiento de radiofrecuencia?',o:['El cliente debe sentir dolor para confirmar que funciona','Se busca eritema leve y uniforme en la zona tratada, temperatura agradable de calor profundo sin quemadura superficial, y el cliente debe sentir calor tolerable; ausencia de reacción puede indicar parámetros insuficientes','Solo se evalúa al mes del tratamiento','No hay forma de evaluar la respuesta durante el tratamiento'],c:1},
    {q:'¿Qué debe hacer el operador si nota una reacción inusual en la piel durante el tratamiento (enrojecimiento excesivo, ampollas, cambio de color)?',o:['Continuar y ver si mejora','Reducir levemente la potencia y seguir','Detener inmediatamente, retirar el equipo, aplicar calmante si corresponde, registrar la incidencia y evaluar si se requiere atención médica','Aumentar el gel y continuar'],c:2},
    {q:'¿Cómo se comunican correctamente los cuidados post-tratamiento al cliente?',o:['Solo verbalmente al final, sin documentar','De forma clara, verbal y escrita si es posible, explicando qué puede sentir (eritema leve, sensibilidad), qué debe hacer (protector solar, hidratación) y qué debe evitar (sol, calor, exfoliación) según el tratamiento realizado','No es necesario dar instrucciones post-tratamiento','Solo se indican si el cliente pregunta'],c:1},
    {q:'¿Cómo debe manejarse un cliente que llega con expectativas poco realistas sobre los resultados de la aparatología?',o:['Prometerle los resultados que pide para no perder la venta','Explicar honestamente qué puede lograr el tratamiento, en cuántas sesiones y con qué mantenimiento; establecer expectativas reales protege la confianza del cliente y la reputación del servicio','Ignorar sus expectativas y realizar el tratamiento','Decirle que es imposible lograr cualquier resultado'],c:1},
    {q:'¿Qué cuidado especial requiere el tratamiento de zonas con cicatrices recientes?',o:['Tratar directamente sobre la cicatriz para mejorarla sin evaluación previa','Evaluar el tiempo de cicatrización (generalmente mínimo 6-12 meses para cicatrices maduras), evitar zonas con cicatrices queloides o hipertróficas activas y consultar protocolo específico del equipo para esa condición','Las cicatrices no afectan el tratamiento','Solo se evitan las cicatrices en zona facial'],c:1},
    {q:'¿Qué implica la responsabilidad profesional del operador de aparatología estética?',o:['Solo operar el equipo correctamente','Conocer el equipo, sus indicaciones y contraindicaciones; realizar anamnesis completa; respetar protocolos; documentar cada sesión; comunicar resultados realistas; reconocer y manejar efectos adversos; y derivar cuando excede su competencia','Solo es responsable si el cliente firma el consentimiento','La responsabilidad recae solo en el fabricante del equipo'],c:1},
    {q:'¿Cómo se realiza el mantenimiento básico de un equipo de aparatología entre sesiones?',o:['No requiere mantenimiento entre sesiones','Limpiar y desinfectar cabezales y accesorios según protocolo del fabricante, verificar que los cables y conexiones estén en buen estado, chequear que los parámetros vuelvan a valores iniciales y guardar correctamente los accesorios','Solo limpiar una vez por semana','El fabricante realiza todo el mantenimiento'],c:1},
    {q:'¿Qué debe hacer el operador cuando un cliente pregunta si puede combinar su tratamiento con un medicamento que está tomando?',o:['Decirle que todos los medicamentos son compatibles','Responder que no es competencia del operador decidir y derivar la consulta a un médico; el operador puede identificar fotosensibilizantes o contraindicaciones conocidas pero nunca dar consejo médico','Buscar en internet y responder inmediatamente','Continuar el tratamiento sin evaluar la medicación'],c:1},
  ],
};
const EVAL_APARATOLOGIA_AVANZADO = {
  id:'aparatologia-avanzado',
  titulo:'Test Nivel 3 — Habilitación en Aparatología Estética',
  categoria:'General',
  nivel:'Avanzado',
  minimoAprobacion:10,
  preguntas:[
    {q:'¿Cómo se diseña un plan de tratamiento integral con aparatología para un cliente con flacidez facial moderada y grasa localizada abdominal?',o:['Se elige un solo equipo para todo','Se diseña un protocolo diferenciado: para el rostro puede indicarse HIFU o radiofrecuencia para estimular colágeno y mejorar tono; para abdomen puede combinarse HIFU corporal o Exilis para grasa con Emsculpt para tonificación; se planifican sesiones, frecuencia e indicadores de progreso','Se aplica el equipo más caro disponible','Se trata todo en una sola sesión con un solo equipo'],c:1},
    {q:'¿Cuál es el fundamento para no combinar ciertos tratamientos de aparatología en la misma sesión?',o:['Es solo una restricción comercial','Algunos tratamientos generan calor, inflamación o cambios en el pH cutáneo que pueden interferir con otros; por ejemplo, no se recomienda combinar peelings exfoliantes con láser el mismo día, ni radiofrecuencia sobre zonas recién tratadas con rellenos; el operador debe conocer las interacciones entre tratamientos','Todos los tratamientos son siempre compatibles el mismo día','Solo importa si el cliente tiene piel sensible'],c:1},
    {q:'¿Cómo evalúa el operador avanzado la evolución del cliente a lo largo del ciclo de tratamiento?',o:['Solo preguntando cómo se siente','Mediante fotografías estandarizadas antes/durante/después, registro de parámetros en ficha, evaluación objetiva de la respuesta tisular en cada sesión, y comparación con los objetivos iniciales; los indicadores permiten ajustar el protocolo si no se logra la respuesta esperada','Solo al finalizar el tratamiento completo','No es necesario evaluar la evolución'],c:1},
    {q:'¿Qué criterio debe aplicar el operador cuando un cliente solicita aumentar la potencia más allá del protocolo recomendado?',o:['Siempre complacer al cliente y aumentar la potencia','Explicar que los protocolos están diseñados para maximizar eficacia y seguridad; trabajar fuera de los parámetros recomendados aumenta el riesgo de efectos adversos sin necesariamente mejorar el resultado; la seguridad del cliente es prioridad','Aumentar solo un poco para no perder al cliente','Dejar que el cliente decida siempre'],c:1},
    {q:'¿Cómo se maneja correctamente la detección de una lesión cutánea sospechosa (mancha irregular, lesión elevada) en la zona a tratar?',o:['Tratar alrededor y no preguntar al cliente','Evitar tratar directamente sobre la lesión, comunicar al cliente que ha observado algo que requiere evaluación médica y recomendar que consulte un dermatólogo antes de continuar; documentar la observación en la ficha','Aplicar menor potencia sobre la lesión','Fotografiar y subir a redes sociales para pedir opinión'],c:1},
    {q:'¿Cuál es la diferencia entre efectos secundarios esperables y complicaciones que requieren derivación médica en aparatología?',o:['No existe diferencia, todo es normal','Los efectos esperables son transitorios y proporcionales al tratamiento (eritema leve, sensibilidad, edema leve post-sesión); las complicaciones son reacciones desproporcionadas, persistentes o inesperadas (quemaduras, hipopigmentación, reacciones alérgicas severas, dolor persistente) que requieren evaluación médica','Solo hay complicaciones en equipos de alta potencia','Todo dolor es una complicación que requiere derivación'],c:1},
    {q:'¿Qué implica la actualización continua en aparatología estética para un operador certificado?',o:['No es necesaria, la certificación es permanente sin actualización','Mantenerse informado sobre nuevas tecnologías, actualizaciones de protocolos, evidencia científica emergente y cambios regulatorios; asistir a capacitaciones periódicas; la aparatología evoluciona rápidamente y el conocimiento desactualizado puede representar riesgo para el cliente','Solo actualizar cuando el equipo lo pide','La actualización es solo para médicos'],c:1},
    {q:'¿Cómo se gestiona un cliente que experimentó una reacción adversa leve en una sesión anterior y quiere continuar el tratamiento?',o:['Realizar el mismo tratamiento con los mismos parámetros','Investigar la causa de la reacción, ajustar los parámetros (menor energía, menor tiempo, diferente protocolo), realizar test de parche en la sesión actual, obtener consentimiento informado actualizado documentando el antecedente y monitorear de cerca durante la sesión','Suspender el tratamiento definitivamente sin evaluar','Cambiar de equipo sin analizar la causa'],c:1},
    {q:'¿Qué consideraciones éticas debe tener el operador de aparatología al asesorar sobre tratamientos?',o:['Recomendar siempre el tratamiento más caro','Recomendar solo los tratamientos que sean apropiados para las necesidades y objetivos del cliente, con honestidad sobre resultados esperables, sin presión de venta; respetar la autonomía del cliente para decidir y priorizar siempre su bienestar por sobre los intereses comerciales','Prometer siempre los mejores resultados','El asesoramiento ético solo aplica en contextos médicos'],c:1},
    {q:'¿Cómo impacta la correcta documentación en la calidad del servicio y la protección legal del operador?',o:['La documentación no tiene valor legal ni clínico','La ficha completa (anamnesis, consentimiento, parámetros, evolución, incidencias) permite dar seguimiento personalizado, detectar patrones de respuesta, proteger legalmente al operador ante reclamos, y garantizar continuidad del servicio si otro operador atiende al cliente','Solo importa si hay un problema','La documentación es obligatoria solo en clínicas médicas'],c:1},
    {q:'¿Qué habilidades blandas son esenciales para un operador certificado en aparatología estética?',o:['Solo el conocimiento técnico del equipo','Comunicación efectiva y empática con el cliente, escucha activa para entender sus objetivos y preocupaciones, manejo de expectativas, trabajo en equipo, actitud de mejora continua y criterio para reconocer los límites de su competencia y derivar cuando corresponde','Solo importa la rapidez en la aplicación','Las habilidades blandas no tienen relación con la aparatología'],c:1},
    {q:'¿Qué distingue a un operador de aparatología estética certificado de uno sin formación?',o:['Solo el precio que cobra','El operador certificado posee conocimiento teórico validado, dominio de protocolos seguros, capacidad de identificar contraindicaciones, criterio para ajustar parámetros, responsabilidad profesional documentada y compromiso con la actualización continua; esto garantiza tratamientos más seguros, eficaces y con menor riesgo de efectos adversos','Solo la cantidad de años de experiencia','El certificado es solo un papel sin valor real'],c:1},
  ],
};
const EVAL_MASAJES_BASICO = {
  id:'masajes-basico',
  titulo:'Test Básico — Masajes y Drenaje Linfático',
  categoria:'General',
  nivel:'Básico',
  minimoAprobacion:10,
  preguntas:[
    {q:'¿Qué es el drenaje linfático manual (DLM)?',o:['Un masaje profundo de tejidos musculares','Una técnica de masaje suave y rítmica que estimula la circulación del sistema linfático para eliminar toxinas, reducir edemas y mejorar el sistema inmune','Un tratamiento con equipos de presoterapia únicamente','Un masaje deportivo de alta presión'],c:1},
    {q:'¿Cuál es la presión correcta para aplicar el drenaje linfático manual?',o:['Presión fuerte y profunda para activar el flujo','Presión muy suave, superficial y rítmica que no supere los 30-40 mmHg, suficiente para mover la linfa sin comprimir los vasos linfáticos','Presión media similar a un masaje sueco','Depende del equipo que se use'],c:1},
    {q:'¿En qué dirección debe realizarse el drenaje linfático?',o:['En cualquier dirección, no importa','Siempre hacia los ganglios linfáticos más cercanos, siguiendo la dirección del flujo linfático natural','De distal a proximal en todos los casos sin excepción','De arriba hacia abajo siempre'],c:1},
    {q:'¿Cuál es una contraindicación absoluta del drenaje linfático?',o:['Piel seca o deshidratada','Trombosis venosa profunda activa, infección aguda en la zona o cáncer sin autorización médica','Celulitis leve','Retención de líquidos sin patología'],c:1},
    {q:'¿Para qué se usa el masaje de tejido profundo?',o:['Para activar el sistema linfático superficial','Para liberar tensiones en capas musculares profundas, nódulos de tensión y adherencias en tejido conectivo','Para eliminar grasa localizada directamente','Para estimular la producción de colágeno'],c:1},
    {q:'¿Qué es el masaje sueco y cuáles son sus maniobras principales?',o:['Un masaje exclusivamente con piedras calientes','Una técnica de masaje clásico que incluye deslizamientos (effleurage), amasamiento (petrissage), fricción, percusión y vibración para relajar músculos y mejorar la circulación','Un protocolo exclusivo de drenaje linfático','Un masaje facial sin contacto'],c:1},
    {q:'¿Qué beneficio tiene el masaje en el contexto de tratamientos estéticos corporales?',o:['No tiene relación con los tratamientos estéticos','Mejora la circulación y el drenaje linfático, reduce la retención de líquidos, potencia los resultados de otros tratamientos y mejora la apariencia de la piel y la celulitis','Solo sirve para relajación sin efecto estético','Solo funciona en mujeres mayores de 50 años'],c:1},
    {q:'¿Qué preparación requiere el cliente antes de una sesión de drenaje linfático?',o:['Ayuno de 12 horas','Hidratación adecuada, evitar comidas muy abundantes 1-2 horas antes y comunicar cualquier condición médica relevante','Bronceado previo para activar la piel','Exfoliación intensa el mismo día'],c:1},
    {q:'¿Qué recomendación post-sesión es esencial tras el drenaje linfático?',o:['Exposición solar directa para potenciar el efecto','Beber abundante agua (mínimo 1.5-2 litros) para facilitar la eliminación de toxinas movilizadas durante el tratamiento','Evitar tomar agua las primeras 4 horas','Realizar actividad física intensa inmediatamente'],c:1},
    {q:'¿En qué condición estética es especialmente beneficioso el drenaje linfático?',o:['En piel con manchas pigmentadas','En celulitis, retención de líquidos, piernas pesadas, edemas post-quirúrgicos y como complemento de tratamientos reductores','En arrugas profundas de expresión','En piel con acné activo severo'],c:1},
    {q:'¿Cuánto dura generalmente una sesión de drenaje linfático corporal completo?',o:['5-10 minutos','60 a 90 minutos para un protocolo completo de cuerpo entero','Solo 15 minutos','3 horas mínimo'],c:1},
    {q:'¿Qué debe verificar el operador antes de iniciar el masaje si el cliente tiene varices?',o:['No hay ninguna consideración especial con varices','Evaluar el grado de las varices; las varices importantes, inflamadas o con tromboflebitis contraindican el masaje en esa zona; varices leves pueden tratarse con técnicas muy suaves y sin presión directa sobre las venas','Las varices siempre contraindican todo tipo de masaje','Solo verificar si hay dolor'],c:1},
  ],
};
const EVAL_MASAJES_INTERMEDIO = {
  id:'masajes-intermedio',
  titulo:'Test Intermedio — Masajes y Drenaje Linfático',
  categoria:'General',
  nivel:'Intermedio',
  minimoAprobacion:10,
  preguntas:[
    {q:'¿Cuál es la diferencia entre el drenaje linfático según el método Vodder y el método Leduc?',o:['Son exactamente iguales','El método Vodder usa movimientos circulares y espirales con variación de presión rítmica; el método Leduc usa movimientos de llamada y reabsorción más específicos para capturar y evacuar la linfa; ambos son efectivos con diferencias técnicas en la secuencia y el tipo de maniobra','El método Leduc es solo para post-operatorio','El método Vodder usa equipos y el Leduc es manual'],c:1},
    {q:'¿Cómo se adapta el protocolo de drenaje linfático en el contexto post-quirúrgico (post-liposucción o post-abdominoplastia)?',o:['Igual que un drenaje estético normal','Se inicia más temprano (generalmente desde las 48-72 horas si no hay contraindicación médica), con presiones muy suaves sobre la zona operada, evitando puntos de sutura, adaptando la posición del cliente y coordinando con el cirujano el protocolo específico','Solo puede hacerse después de 3 meses','El post-quirúrgico contraindica el drenaje linfático'],c:1},
    {q:'¿Qué es el edema y cómo actúa el drenaje linfático para reducirlo?',o:['El edema es grasa acumulada que el drenaje elimina directamente','El edema es acumulación de líquido intersticial por desequilibrio entre filtración capilar y reabsorción linfática; el DLM estimula los linfangiones a contraerse y aumenta la capacidad de transporte linfático, movilizando el exceso de líquido hacia los ganglios para su eliminación','El drenaje solo reduce la apariencia sin efecto real','El edema se elimina solo con presoterapia'],c:1},
    {q:'¿Cómo se combina el masaje reductivo con los tratamientos de aparatología corporal?',o:['Nunca se combinan','El masaje reductivo puede realizarse antes del tratamiento para activar la circulación y preparar los tejidos, o después para potenciar la eliminación de metabolitos; la combinación con HIFU, cavitación o Emsculpt amplía los resultados en protocolos de remodelado corporal','Solo se combina con criolipólisis','El masaje anula el efecto de la aparatología'],c:1},
    {q:'¿Cuáles son las maniobras específicas del masaje reductivo y anticelulítico?',o:['Solo effleurage suave','Amasamiento profundo, rodamiento de piel (pellizco-rodillo), vacuumterapia manual, percusiones y fricciones profundas que buscan romper los tabiques fibrosos de la celulitis, activar la microcirculación y estimular la lipólisis local','Solo vibraciones suaves','Únicamente deslizamientos sin presión'],c:1},
    {q:'¿Qué es la fibrosis post-quirúrgica y cómo se trata con masaje?',o:['Es una complicación sin tratamiento posible','Es la formación de tejido cicatrizal excesivo en capas profundas post-cirugía que genera induración y ondulaciones; se trata con masaje profundo, técnicas de liberación miofascial y drenaje linfático; requiere protocolo progresivo iniciando suave y aumentando la profundidad según tolerancia','Solo se trata con más cirugía','El masaje empeora la fibrosis'],c:1},
    {q:'¿Cuántas sesiones de drenaje linfático se recomiendan en un protocolo post-liposucción?',o:['Solo 1 sesión','1 sesión única al mes','Entre 10 y 20 sesiones en las primeras semanas post-cirugía (frecuencia diaria o cada 2 días inicialmente, luego semanal) según el criterio del cirujano y la evolución del paciente','Solo si hay dolor intenso'],c:1},
    {q:'¿Qué es la técnica de rodamiento de piel y cuál es su objetivo en el tratamiento anticelulítico?',o:['Una técnica de masaje facial','Una maniobra en la que se toma un pliegue de piel entre los dedos y se desliza progresivamente, buscando liberar las adherencias del tejido subcutáneo, mejorar la microcirculación y romper los tabiques fibrosos que generan el aspecto de naranja de la celulitis','Una técnica de masaje deportivo profundo','Una maniobra de drenaje linfático ganglionar'],c:1},
    {q:'¿Cómo se diferencia el masaje de relajación del masaje terapéutico en el contexto estético?',o:['Son exactamente iguales','El masaje de relajación busca bienestar general, reducción del estrés y tensión muscular superficial con presiones suaves; el masaje terapéutico tiene objetivos específicos (reducir fibrosis, tratar celulitis, reducir edema) con técnicas dirigidas y mayor profundidad según el objetivo clínico','El masaje de relajación es más efectivo para celulitis','Solo el terapéutico se realiza en estética'],c:1},
    {q:'¿Qué contraindicación relativa debe evaluarse en el masaje corporal de una clienta embarazada?',o:['El embarazo no contraindica ningún tipo de masaje','El masaje profundo, las percusiones y las presiones intensas están contraindicadas; se puede realizar masaje suave de relajación y drenaje linfático adaptado en ciertas etapas del embarazo, evitando zonas como abdomen en primeras semanas y puntos de acupresión; siempre con autorización médica','Solo se contraindica el masaje facial','El embarazo contraindica absolutamente cualquier masaje'],c:1},
    {q:'¿Cómo se integra el masaje facial en un protocolo de rejuvenecimiento no invasivo?',o:['El masaje facial no tiene efecto en rejuvenecimiento','El masaje facial mejora la circulación, oxigena los tejidos, tonifica los músculos faciales (especialmente técnicas como el masaje Kobido o lifting facial manual), reduce la tensión que genera arrugas de expresión y potencia la absorción de activos cosméticos; se integra como complemento de radiofrecuencia, HydraFacial o HIFU facial','Solo funciona como relajación sin efecto rejuvenecedor','El masaje facial empeora las arrugas'],c:1},
    {q:'¿Qué parámetros debe registrar el operador en la ficha tras una sesión de drenaje linfático o masaje terapéutico?',o:['Solo el nombre del cliente y la fecha','Técnica aplicada, zonas tratadas, presión y profundidad utilizada, respuesta del cliente (tolerancia, sensaciones, cambios observados), objetivos del protocolo y evolución respecto a sesiones anteriores','Solo si hubo alguna queja','No es necesario registrar nada en masajes'],c:1},
  ],
};
const EVAL_MASAJES_AVANZADO = {
  id:'masajes-avanzado',
  titulo:'Test Avanzado — Masajes y Drenaje Linfático',
  categoria:'General',
  nivel:'Avanzado',
  minimoAprobacion:10,
  preguntas:[
    {q:'¿Cuál es la base fisiológica del funcionamiento del sistema linfático y cómo la estimula el drenaje manual?',o:['El sistema linfático funciona por presión arterial igual que el circulatorio','Los linfangiones (segmentos del vaso linfático con músculo liso) se contraen autónomamente a un ritmo de 6-12 veces por minuto; el DLM aumenta la frecuencia de contracción por estiramiento mecánico de la pared vascular, incrementando el flujo linfático hasta 10 veces por encima del basal','El sistema linfático no tiene motricidad propia','El DLM solo mueve la linfa por presión externa sin efecto sobre los linfangiones'],c:1},
    {q:'¿Cómo se diseña un protocolo completo de drenaje linfático post-liposucción abdominal con resultados óptimos?',o:['Se aplica el mismo protocolo estándar de drenaje estético','Se inicia con apertura de ganglios inguinales y axilares, se drena de forma centrípeta con presiones muy suaves las primeras sesiones (48-72 h post-cirugía si autoriza el cirujano), progresando en profundidad y añadiendo técnicas de liberación de fibrosis a partir de la 3ª-4ª semana; se coordina con el equipo médico y se documenta la evolución del edema y la fibrosis en cada sesión','Se empieza con presión máxima para reducir el edema rápido','El drenaje post-lipo no tiene un protocolo específico'],c:1},
    {q:'¿Qué es la insuficiencia linfática y cuándo debe derivarse el cliente a un médico especialista?',o:['Es solo retención de líquidos que se trata siempre con DLM sin derivación','La insuficiencia linfática es la incapacidad del sistema linfático de transportar la carga linfática; cuando el edema es persistente, unilateral, duro, no responde al DLM o se acompaña de otros síntomas (calor, enrojecimiento, induración, dolor) debe derivarse al médico para descartar linfedema secundario, trombosis o patología oncológica','Nunca se deriva, el operador trata todo','Solo se deriva si el cliente lo pide'],c:1},
    {q:'¿Cuál es el mecanismo por el que el masaje anticelulítico actúa sobre la celulitis grado III-IV?',o:['Destruye las células de grasa directamente','Las técnicas de presión profunda y rodamiento buscan: a) romper mecánicamente los tabiques fibrosos que generan el aspecto irregular; b) activar la microcirculación para mejorar el intercambio metabólico; c) estimular la lipólisis local por activación adrenérgica; resultados limitados en grado IV que requiere combinación con aparatología','El masaje solo mejora la apariencia sin efecto estructural','El masaje es igual de efectivo en todos los grados de celulitis'],c:1},
    {q:'¿Cómo se integra el masaje Kobido en un protocolo de rejuvenecimiento facial avanzado?',o:['El Kobido es solo un masaje de relajación sin efecto rejuvenecedor','El Kobido es una técnica japonesa ancestral que combina maniobras de tonificación muscular facial, drenaje linfático, estimulación de puntos de acupresión y técnicas de liberación de tensiones; activa la microcirculación, oxigena los tejidos, tonifica la musculatura facial y mejora la textura cutánea; se integra como preparación o complemento de RF facial o HIFU potenciando la síntesis de colágeno','El Kobido solo funciona en personas de origen asiático','El Kobido está contraindicado con otros tratamientos faciales'],c:1},
    {q:'¿Cuál es la diferencia clínica entre el linfedema primario y el secundario y cómo afecta al protocolo de DLM?',o:['Son exactamente iguales clínicamente','El linfedema primario es de origen congénito o idiopático (malformación linfática); el secundario es consecuencia de daño linfático adquirido (post-quirúrgico, post-oncológico, infeccioso); ambos requieren DLM especializado (terapia descongestiva compleja) con protocolo médico supervisado; el operador estético debe derivar y solo actuar bajo indicación del médico especialista','El operador estético trata ambos tipos sin derivación','El DLM está contraindicado en el linfedema primario'],c:1},
    {q:'¿Qué es la terapia descongestiva compleja (TDC) y cuál es el rol del DLM en ella?',o:['Es solo el drenaje linfático sin otras técnicas','La TDC es el estándar de tratamiento del linfedema que combina: DLM especializado, vendaje compresivo multicapa, ejercicios específicos y cuidados de la piel; el DLM es un componente esencial pero no suficiente solo; el operador estético puede aplicar DLM como complemento pero la TDC completa requiere fisioterapeuta especializado','La TDC es solo para post-quirúrgico estético','El DLM reemplaza completamente a la TDC'],c:1},
    {q:'¿Cómo debe adaptarse el protocolo de masaje en un cliente oncológico con autorización médica?',o:['Se aplica el mismo protocolo que a cualquier cliente','Se usan técnicas muy suaves, se evitan zonas irradiadas o con ganglios extirpados, se contraindica el DLM sin autorización médica específica por riesgo de diseminación; con autorización médica el DLM puede mejorar el linfedema post-mastectomía; cada caso requiere protocolo individualizado coordinado con el oncólogo','El masaje está absolutamente contraindicado en oncología','Solo se puede dar masaje en remisión completa de 10 años'],c:1},
    {q:'¿Cuál es la evidencia científica sobre la eficacia del drenaje linfático manual en el linfedema post-mastectomía?',o:['No existe evidencia científica','Múltiples revisiones sistemáticas y metaanálisis muestran que el DLM como parte de la TDC es efectivo para reducir el volumen del linfedema, mejorar la calidad de vida y reducir la sensación de pesadez; la evidencia es más sólida para la TDC completa que para el DLM aislado','El DLM es contraproducente en post-mastectomía','Solo hay evidencia anecdótica sin estudios controlados'],c:1},
    {q:'¿Qué es la liberación miofascial y cómo se aplica en el contexto del masaje terapéutico estético?',o:['Es una técnica de masaje superficial de relajación','Es una técnica que aplica presiones sostenidas y lentas sobre las fascias (tejido conectivo que envuelve músculos y órganos) para liberar restricciones, adherencias y tensiones acumuladas; en estética se usa para tratar fibrosis post-quirúrgica, tensiones que generan arrugas de expresión y mejorar la movilidad tisular','Es exclusiva de la fisioterapia deportiva','Solo se aplica en la zona lumbar'],c:1},
    {q:'¿Cómo documenta y evalúa el operador avanzado la evolución del edema en un protocolo de drenaje linfático?',o:['Solo pregunta al cliente si se siente mejor','Usa mediciones objetivas: circunferencias con cinta métrica en puntos anatómicos fijos antes y después de cada sesión, fotografía estandarizada, registro de la consistencia del edema (blando/duro) y respuesta al signo de Godet (fóvea); la evolución guía los ajustes del protocolo','No es necesario medir, es suficiente la percepción visual','Solo mide al inicio y al final del ciclo completo'],c:1},
    {q:'¿Qué distingue a un operador certificado en masajes y drenaje linfático para el contexto de la estética avanzada?',o:['Solo haber tomado un curso básico de masajes','El dominio de múltiples técnicas (DLM, masaje sueco, reductivo, miofascial, Kobido), capacidad de diseñar protocolos personalizados según el objetivo (post-quirúrgico, anticelulítico, drenante, rejuvenecedor), identificación de contraindicaciones y límites de competencia, documentación rigurosa y criterio para integrar el masaje en protocolos combinados con aparatología','Solo conocer el drenaje linfático básico','La certificación no tiene valor en el contexto de la estética'],c:1},
  ],
};
const EVAL_CAVITACION_BASICO = {
  id:'cavitacion-basico',
  titulo:'Test Básico — Cavitación Ultrasónica',
  categoria:'Radiofrecuencia / HIFU',
  nivel:'Básico',
  minimoAprobacion:10,
  preguntas:[
    {q:'¿Qué es la cavitación ultrasónica?',o:['Un tratamiento con láser para eliminar grasa','Una técnica no invasiva que usa ondas de ultrasonido de baja frecuencia para generar microburbuchas en el tejido adiposo que al colapsar destruyen los adipocitos','Un masaje profundo con vibración mecánica','Un tratamiento de radiofrecuencia monopolar'],c:1},
    {q:'¿A qué frecuencia operan generalmente los equipos de cavitación ultrasónica estética?',o:['1-3 MHz (alta frecuencia)','40 kHz a 1 MHz (baja frecuencia), siendo 40 kHz la más usada para reducción de grasa localizada','10 MHz','500 Hz (baja frecuencia audible)'],c:1},
    {q:'¿Qué ocurre con los adipocitos destruidos durante la cavitación?',o:['Se eliminan inmediatamente por los poros de la piel','Los lípidos liberados son transportados por el sistema linfático y metabolizados por el hígado','Se convierten en músculo','Quedan calcificados en el tejido'],c:1},
    {q:'¿Es invasiva la cavitación ultrasónica?',o:['Sí, requiere pequeñas incisiones','Sí, usa agujas para introducir el ultrasonido','No, es completamente no invasiva','Sí, requiere anestesia local'],c:2},
    {q:'¿Para qué está indicada principalmente la cavitación ultrasónica?',o:['Depilación definitiva','Reducción de grasa localizada y celulitis en zonas corporales específicas','Rejuvenecimiento facial','Eliminación de manchas pigmentadas'],c:1},
    {q:'¿Qué se debe aplicar en la piel antes de usar el cabezal de cavitación?',o:['Nada, el cabezal funciona en seco','Gel conductor para facilitar la transmisión del ultrasonido y evitar fricción','Aceite mineral espeso','Crema anestésica'],c:1},
    {q:'¿Cuál es una contraindicación absoluta de la cavitación ultrasónica?',o:['Tener celulitis leve','Embarazo, marcapasos, implantes metálicos en la zona o enfermedades hepáticas graves','Piel hidratada','Haber comido 2 horas antes'],c:1},
    {q:'¿Cuántas sesiones se recomiendan generalmente en un protocolo de cavitación?',o:['1 sola sesión','Entre 6 y 10 sesiones espaciadas cada 7-15 días','50 sesiones diarias','Solo 2 sesiones en total'],c:1},
    {q:'¿Qué recomendación post-sesión es esencial después de la cavitación?',o:['Ayuno de 24 horas','Beber abundante agua (mínimo 1.5-2 litros) para facilitar la eliminación de los lípidos por el sistema linfático y renal','Exposición solar directa','Evitar tomar agua las primeras 6 horas'],c:1},
    {q:'¿En qué zona NO debe aplicarse la cavitación ultrasónica?',o:['Abdomen','Muslos y caderas','Zona cervical, cabeza, corazón, columna vertebral y sobre órganos vitales','Brazos'],c:2},
    {q:'¿Con qué tratamiento se combina frecuentemente la cavitación para potenciar resultados?',o:['Depilación láser en la misma sesión','Radiofrecuencia o drenaje linfático post-sesión para eliminar los lípidos liberados y reafirmar la piel','HydraFacial facial','Bronceado orgánico'],c:1},
    {q:'¿Cuándo se empiezan a notar los resultados de la cavitación?',o:['Inmediatamente durante la sesión con reducción visible','A partir de la 3ª-4ª sesión con mejora progresiva, siendo más visible al completar el ciclo','Solo después de 20 sesiones','Al año de finalizar el tratamiento'],c:1},
  ],
};
const EVAL_CAVITACION_AVANZADO = {
  id:'cavitacion-avanzado',
  titulo:'Test Avanzado — Cavitación Ultrasónica',
  categoria:'Radiofrecuencia / HIFU',
  nivel:'Avanzado',
  minimoAprobacion:10,
  preguntas:[
    {q:'¿Cuál es el mecanismo físico de la cavitación acústica y cómo destruye los adipocitos?',o:['El ultrasonido calienta directamente la grasa hasta fundirla','Las ondas de ultrasonido de baja frecuencia generan ciclos alternos de presión positiva y negativa en el líquido intersticial; en la fase negativa se forman microburbuchas de vapor que colapsan violentamente (cavitación inercial) generando ondas de choque mecánicas que rompen las membranas de los adipocitos adyacentes','El ultrasonido congela selectivamente los adipocitos','Las ondas electromagnéticas disuelven la grasa'],c:1},
    {q:'¿Por qué la cavitación actúa selectivamente sobre el tejido adiposo y no daña otros tejidos?',o:['No es selectiva, daña todos los tejidos por igual','El tejido adiposo tiene mayor contenido de lípidos y menor elasticidad que el tejido muscular o la dermis; su menor cohesión celular lo hace más susceptible a la cavitación; además la baja frecuencia usada (40 kHz) favorece la formación de microburbuchas en tejidos blandos lipídicos con menor riesgo en tejidos más densos y elásticos','La selectividad es solo marketing, no tiene base científica','Solo daña los tejidos superficiales'],c:1},
    {q:'¿Qué rol cumple el hígado en el proceso de eliminación post-cavitación y por qué es una contraindicación la hepatopatía grave?',o:['El hígado no participa en la eliminación post-cavitación','Los triglicéridos y ácidos grasos liberados por los adipocitos destruidos son transportados por el sistema linfático al torrente circulatorio y metabolizados por el hígado; en hepatopatías graves la capacidad de metabolizar esta carga lipídica está comprometida, pudiendo generar daño hepático adicional','Los lípidos se eliminan solo por la orina sin participación hepática','El hígado solo actúa si se hacen más de 5 sesiones'],c:1},
    {q:'¿Cómo se diseña un protocolo combinado de cavitación y radiofrecuencia para remodelado corporal?',o:['Se aplican en el mismo pase simultáneamente con el mismo cabezal','Se aplica primero la cavitación para destruir adipocitos y luego la radiofrecuencia en la misma sesión para reafirmar la piel y estimular colágeno en la zona tratada; el calor de la RF también potencia la circulación y el drenaje de los lípidos liberados','Se usan en sesiones separadas sin relación entre sí','La RF se aplica antes de la cavitación siempre'],c:1},
    {q:'¿Qué diferencia a la cavitación de la criolipólisis en términos de mecanismo y perfil de paciente?',o:['Son exactamente iguales en mecanismo','La cavitación destruye adipocitos por implosión mecánica de microburbuchas (efecto inmediato sobre el tejido); la criolipólisis los destruye por apoptosis inducida por frío (efecto más lento, 2-3 meses); la cavitación es más versátil en zonas y más rápida en resultados; la criolipólisis es más precisa para bolsas de grasa bien delimitadas','La criolipólisis usa ultrasonido y la cavitación usa frío','Son incompatibles en el mismo ciclo de tratamiento'],c:1},
    {q:'¿Por qué se recomienda espaciar las sesiones de cavitación cada 7-15 días y no hacerlas diariamente?',o:['Por razones económicas únicamente','El hígado necesita tiempo para metabolizar la carga lipídica generada en cada sesión; además el tejido necesita recuperarse del estrés mecánico; sesiones muy seguidas pueden sobrecargar el sistema de eliminación y reducir la eficacia','El equipo necesita recargarse entre sesiones','La piel necesita ese tiempo para regenerarse'],c:1},
    {q:'¿Cómo afecta el índice de masa corporal (IMC) a los resultados de la cavitación?',o:['No afecta en absoluto','La cavitación está indicada para grasa localizada en personas con IMC cercano al normal o con sobrepeso leve; en obesidad importante los resultados son limitados y el tratamiento puede ser insuficiente; el operador debe establecer expectativas realistas y no presentar la cavitación como alternativa a la pérdida de peso general','La cavitación funciona mejor en personas con obesidad severa','El IMC alto potencia los resultados de la cavitación'],c:1},
    {q:'¿Qué parámetros deben ajustarse en la cavitación según la zona a tratar?',o:['Los parámetros son siempre iguales para todas las zonas','La frecuencia (zonas más superficiales como cara requieren mayor frecuencia; zonas corporales profundas usan 40 kHz), la intensidad según la profundidad del tejido adiposo, el tiempo de aplicación por zona y la velocidad de movimiento del cabezal para distribuir uniformemente la energía','Solo varía el tiempo de sesión','Solo se ajusta si el cliente siente dolor'],c:1},
    {q:'¿Qué complicación puede surgir por aplicar cavitación con el cabezal estático (sin movimiento) en el mismo punto?',o:['No hay ningún riesgo si el gel es suficiente','La concentración excesiva de energía en un punto puede generar quemaduras internas, daño tisular no deseado más allá del adiposo y dolor intenso; el cabezal debe mantenerse siempre en movimiento lento y continuo durante la aplicación','Solo puede producir eritema leve superficial','Solo ocurre con equipos de alta potencia'],c:1},
    {q:'¿Cómo se integra la cavitación en un protocolo combinado con HIFU corporal?',o:['No se pueden combinar en el mismo ciclo','Se pueden combinar en el mismo protocolo: la cavitación actúa en el tejido adiposo superficial-medio y el HIFU corporal en el tejido adiposo profundo (8-13 mm); aplicados en sesiones separadas o en el mismo protocolo (generalmente cavitación primero, HIFU después) amplifican la reducción de grasa en distintas capas','Se aplican siempre el mismo día en el mismo pase','El HIFU anula el efecto de la cavitación'],c:1},
    {q:'¿Cómo evalúa el operador avanzado la eficacia del protocolo de cavitación en el seguimiento del cliente?',o:['Solo preguntando cómo se siente el cliente','Mediante mediciones objetivas con cinta métrica en puntos anatómicos fijos antes de cada sesión, fotografía estandarizada, registro de parámetros usados y comparación con la medición inicial; la reducción de centímetros es el indicador principal de eficacia','Solo al finalizar el ciclo completo','La eficacia no puede evaluarse objetivamente'],c:1},
    {q:'¿Qué consideración especial debe tenerse al combinar cavitación con un plan alimentario del cliente?',o:['La alimentación no tiene ninguna relación con los resultados','Para maximizar la eliminación de los lípidos liberados se recomienda una dieta moderada en grasas saturadas y alcohol los días de sesión y siguientes; el hígado debe poder metabolizar la carga lipídica sin sobrecarga; el exceso calórico puede reponer los adipocitos destruidos y reducir los resultados a largo plazo','Se debe hacer ayuno total el día de la sesión','Se recomienda una dieta alta en grasas para potenciar el efecto'],c:1},
  ],
};
const EVAL_SKINCARE_BASICO = {
  id:'skincare-basico',
  titulo:'Test Básico — Skincare y Cuidado de la Piel',
  categoria:'General',
  nivel:'Básico',
  minimoAprobacion:10,
  preguntas:[
    {q:'¿Cuáles son las capas principales de la piel de afuera hacia adentro?',o:['Dermis, epidermis e hipodermis','Epidermis, dermis e hipodermis (tejido subcutáneo)','Hipodermis, dermis y epidermis','Epidermis, hipodermis y dermis'],c:1},
    {q:'¿Qué función cumple la barrera cutánea de la epidermis?',o:['Solo dar color a la piel','Proteger al organismo de agentes externos (bacterias, UV, químicos) y regular la pérdida de agua transepidérmica (TEWL)','Solo producir melanina','Almacenar grasa corporal'],c:1},
    {q:'¿Qué es el fototipo de Fitzpatrick y para qué se usa en estética?',o:['La edad biológica de la piel','Una escala del I al VI que clasifica la piel según su respuesta a la exposición solar y el contenido de melanina; guía la elección de tratamientos y parámetros de equipos','Solo sirve para elegir el color del maquillaje','Una medición del grosor de la dermis'],c:1},
    {q:'¿Qué es el pH de la piel y cuál es su valor normal?',o:['La temperatura superficial de la piel, normalmente 37°C','El grado de acidez de la superficie cutánea; su valor normal es ligeramente ácido, entre 4.5 y 5.5, formando el manto ácido que protege de bacterias y hongos','La hidratación interna de la dermis','El nivel de colágeno en la piel'],c:1},
    {q:'¿Cuáles son los 4 tipos de piel principales?',o:['Clara, oscura, mixta y bronceada','Normal, seca, grasa y mixta','Joven, madura, sensible y envejecida','Hidratada, deshidratada, grasa y fina'],c:1},
    {q:'¿Qué es el SPF y qué significa en protector solar?',o:['Skin Pigmentation Factor — factor de pigmentación','Sun Protection Factor — indica cuánto tiempo más protege la piel de las quemaduras UVB comparado con la piel sin protección','Super Penetrating Formula — fórmula de penetración profunda','Skin Pore Filter — filtro de poros'],c:1},
    {q:'¿Por qué es obligatorio el uso de protector solar SPF 50+ después de la mayoría de tratamientos estéticos?',o:['Solo por estética, no tiene función real','Los tratamientos estéticos aumentan la sensibilidad de la piel a la radiación UV, incrementando el riesgo de hiperpigmentación, quemaduras y daño en la renovación celular estimulada por el tratamiento','Solo es necesario en verano','Solo si el cliente va a la playa'],c:1},
    {q:'¿Qué es la hidratación vs la nutrición de la piel y en qué se diferencian?',o:['Son exactamente lo mismo','La hidratación aporta agua a la piel (humectantes como ácido hialurónico); la nutrición aporta lípidos y ácidos grasos que refuerzan la barrera cutánea (emolientes como aceites y ceramidas); la piel puede necesitar uno, el otro o ambos según su condición','La hidratación es solo para piel seca','La nutrición es solo para piel madura'],c:1},
    {q:'¿Qué es la exfoliación y cuál es su función en el cuidado de la piel?',o:['Una técnica de maquillaje','La eliminación de células muertas de la capa córnea para mejorar la textura, favorecer la renovación celular, mejorar la penetración de activos y dar luminosidad; puede ser física (mecánica) o química (AHA, BHA)','Solo sirve para tratar el acné','Una técnica exclusiva de tratamientos médicos'],c:1},
    {q:'¿Cuál es el orden correcto de aplicación de productos en una rutina de skincare básica?',o:['Crema, sérum, limpiador y protector solar','Limpieza, tónico/agua micelar, sérum, hidratante y protector solar (de mañana)','Protector solar, limpieza y crema','Sérum, limpieza, tónico y crema'],c:1},
    {q:'¿Qué es el colágeno y qué papel cumple en la piel?',o:['Un pigmento que da color a la piel','Una proteína estructural de la dermis que aporta firmeza, elasticidad y soporte a la piel; su producción disminuye con la edad generando arrugas y flacidez','Una vitamina que hidrata la piel','Una grasa que lubrica la superficie cutánea'],c:1},
    {q:'¿Por qué es importante conocer el tipo de piel del cliente antes de recomendar productos o tratamientos?',o:['Solo para elegir el color del gel conductor','Cada tipo de piel tiene necesidades diferentes; usar productos o tratamientos inadecuados puede generar reacciones adversas, empeorar condiciones existentes o reducir la eficacia del tratamiento','No importa, todos los productos funcionan en todos los tipos de piel','Solo importa para tratamientos faciales'],c:1},
  ],
};
const EVAL_SKINCARE_INTERMEDIO = {
  id:'skincare-intermedio',
  titulo:'Test Intermedio — Skincare y Cuidado de la Piel',
  categoria:'General',
  nivel:'Intermedio',
  minimoAprobacion:10,
  preguntas:[
    {q:'¿Qué son los AHA y BHA y cuál es la diferencia en su acción exfoliante?',o:['Son lo mismo, solo cambia el nombre comercial','Los AHA (alfa-hidroxiácidos, ej: glicólico, láctico) son hidrosolubles y actúan en la superficie de la piel exfoliando la capa córnea; los BHA (beta-hidroxiácidos, ej: salicílico) son liposolubles y penetran en los poros disolviendo sebo y queratina, ideales para piel grasa y acnéica','Los AHA son para piel seca y los BHA para piel oscura','Los BHA son más suaves que los AHA siempre'],c:1},
    {q:'¿Qué es el ácido hialurónico y cómo actúa en la piel?',o:['Un ácido exfoliante que elimina células muertas','Un polisacárido humectante que puede retener hasta 1000 veces su peso en agua; atrae y retiene humedad en la dermis y epidermis mejorando la hidratación, el volumen y la elasticidad de la piel','Una proteína que forma colágeno','Un filtro solar que protege de los rayos UV'],c:1},
    {q:'¿Cómo se prepara la piel correctamente antes de un tratamiento de aparatología?',o:['No requiere preparación previa','Limpieza profunda para eliminar maquillaje, sebo e impurezas; si el protocolo lo indica, exfoliación suave; y asegurarse de que la piel esté libre de productos que puedan interferir con el equipo (aceites antes de RF, cremas antes de láser)','Solo aplicar gel conductor directamente','Broncearse previamente para activar la piel'],c:1},
    {q:'¿Qué cuidados post-tratamiento son comunes a la mayoría de procedimientos estéticos?',o:['Exposición solar inmediata y exfoliación vigorosa','Evitar exposición solar directa, aplicar protector solar SPF 50+, usar productos calmantes e hidratantes, evitar activos irritantes (retinoides, AHA concentrados) las primeras 24-72 horas y no exfoliar hasta que la piel se recupere','Aplicar maquillaje espeso inmediatamente','Lavar la zona con agua muy caliente'],c:1},
    {q:'¿Qué es la niacinamida y cuáles son sus beneficios en skincare?',o:['Un ácido exfoliante agresivo para piel grasa','Una forma de vitamina B3 con múltiples beneficios: regula el sebo, minimiza los poros, reduce la hiperpigmentación, refuerza la barrera cutánea y tiene propiedades antiinflamatorias; es bien tolerada por casi todos los tipos de piel','Un filtro solar químico','Una vitamina solo para piel madura mayor de 50 años'],c:1},
    {q:'¿Cómo se manifiesta la piel deshidratada y cómo se diferencia de la piel seca?',o:['Son exactamente lo mismo','La piel seca es un tipo de piel (produce poco sebo, es constitucional); la piel deshidratada es una condición temporal de falta de agua que puede afectar a cualquier tipo de piel incluyendo la grasa; la deshidratación se manifiesta con tirantez, opacidad, líneas finas y aspecto apagado','La piel deshidratada siempre se descama','Solo la piel seca puede estar deshidratada'],c:1},
    {q:'¿Qué activos están contraindicados en piel sensible o reactiva?',o:['El agua y el ácido hialurónico','Ácidos en concentraciones altas (glicólico >10%, retinol en inicio de uso), fragancias, alcohol desnaturalizado en alta proporción y algunos filtros solares químicos; se prefieren fórmulas con activos calmantes como alantoína, centella asiática, pantenol y bisabolol','Todos los activos naturales','Solo los productos con fragancia sintética'],c:1},
    {q:'¿Qué es el retinol y qué precauciones debe tener el operador al saber que un cliente lo usa?',o:['Un humectante suave sin efectos secundarios','Un derivado de la vitamina A que acelera la renovación celular y estimula el colágeno; adelgaza temporalmente la epidermis y aumenta la fotosensibilidad; el cliente debe suspenderlo 5-7 días antes de tratamientos con láser, peelings o cavitación para evitar reacciones adversas','Un filtro solar muy efectivo','Un activo que no interactúa con ningún tratamiento estético'],c:1},
    {q:'¿Cómo afecta la alimentación y la hidratación al estado de la piel?',o:['No tiene ninguna relación con la piel','Una alimentación rica en antioxidantes, ácidos grasos esenciales y vitaminas (C, E, A) y la hidratación adecuada (mínimo 1.5-2 litros de agua diarios) son fundamentales para la síntesis de colágeno, la integridad de la barrera cutánea y la renovación celular; el tabaco, el alcohol y el exceso de azúcar aceleran el envejecimiento cutáneo','Solo importa la hidratación tópica','La alimentación solo afecta al acné'],c:1},
    {q:'¿Qué es la melanina y cómo se relaciona con las manchas cutáneas?',o:['Una proteína de la dermis que aporta firmeza','Un pigmento producido por los melanocitos que determina el color de la piel; su sobreproducción localizada por exposición UV, inflamación o cambios hormonales genera manchas (hiperpigmentación); los tratamientos estéticos buscan inhibir la tirosinasa (enzima clave en la síntesis de melanina) para reducir las manchas','Un lípido que lubrica la superficie de la piel','Una vitamina que protege de los rayos UV'],c:1},
    {q:'¿Qué es el efecto rebote en piel grasa y cómo se evita?',o:['No existe el efecto rebote en piel grasa','La piel grasa sobre-limpiada o sobre-exfoliada puede responder produciendo más sebo como mecanismo de defensa; se evita con una rutina equilibrada que hidrate adecuadamente (incluso la piel grasa necesita hidratación ligera) y no elimine completamente el manto lipídico natural','Solo ocurre con productos de farmacia','Es inevitable y no tiene solución'],c:1},
    {q:'¿Cómo debe adaptarse el protocolo de skincare pre y post tratamiento según el tipo de piel?',o:['El mismo protocolo para todos los tipos de piel','Se personaliza según el tipo y condición: piel grasa puede tolerar limpieza más profunda y AHA antes del tratamiento; piel seca o sensible requiere preparación más suave y mayor énfasis en hidratación y calmantes post-tratamiento; piel madura necesita activos antiaging y mayor hidratación en el protocolo post-sesión','Solo varía el tiempo de limpieza','Solo importa en tratamientos faciales no corporales'],c:1},
  ],
};
const EVAL_SKINCARE_AVANZADO = {
  id:'skincare-avanzado',
  titulo:'Test Avanzado — Skincare y Cuidado de la Piel',
  categoria:'General',
  nivel:'Avanzado',
  minimoAprobacion:10,
  preguntas:[
    {q:'¿Cuál es el mecanismo molecular por el que el retinol estimula la síntesis de colágeno?',o:['Hidrata directamente las fibras de colágeno existentes','El retinol se convierte en ácido retinoico en la piel, que se une a los receptores nucleares RAR/RXR activando la transcripción de genes que estimulan fibroblastos para sintetizar colágeno tipo I y III, e inhibe las metaloproteinasas (MMP) que degradan el colágeno existente','El retinol congela las fibras de colágeno para preservarlas','El retinol solo actúa en la superficie sin efecto en dermis profunda'],c:1},
    {q:'¿Cómo interactúa la vitamina C (ácido ascórbico) con el colágeno y qué forma es más estable?',o:['La vitamina C no tiene relación con el colágeno','La vitamina C es cofactor esencial en la hidroxilación de prolina y lisina, pasos necesarios para la síntesis y estabilidad del colágeno; también inhibe la tirosinasa reduciendo manchas y actúa como antioxidante; el ácido ascórbico puro (L-ascórbico) es el más activo pero menos estable; los derivados (ascorbil glucósido, vitamina C encapsulada) son más estables con menor eficacia relativa','La vitamina C solo hidrata sin efecto sobre el colágeno','Todas las formas de vitamina C son igualmente estables y efectivas'],c:1},
    {q:'¿Qué es la TEWL (pérdida de agua transepidérmica) y cómo se relaciona con la barrera cutánea?',o:['La cantidad de agua que bebemos diariamente','La cantidad de agua que se evapora desde la piel hacia el exterior; una barrera cutánea íntegra minimiza la TEWL; cuando la barrera está comprometida (piel atópica, eccema, tratamientos agresivos) la TEWL aumenta generando deshidratación, irritación e inflamación','La hidratación de la dermis profunda medida por ultrasonido','El nivel de ácido hialurónico en la piel'],c:1},
    {q:'¿Cómo se diseña un protocolo de skincare integrado antes y después de un ciclo de HIFU facial?',o:['No requiere protocolo de skincare específico','Pre-HIFU: suspender retinoides 5-7 días antes, exfoliar suavemente 48-72 horas antes, hidratación óptima, SPF diario; post-HIFU: activos calmantes (centella, pantenol, niacinamida), hidratación intensa, SPF 50+ mínimo 4 semanas, evitar AHA/retinol 1-2 semanas, incorporar vitamina C y péptidos a las 2 semanas para potenciar la neocolagenogénesis','Solo aplicar crema hidratante sin más consideraciones','Solo se cuida la piel si hay reacción adversa'],c:1},
    {q:'¿Qué es la inflamación de bajo grado (inflammaging) y cómo impacta en el envejecimiento cutáneo?',o:['Es solo una reacción alérgica temporal','Es un estado de inflamación crónica y subclínica que aumenta con la edad; activa las MMP que degradan colágeno y elastina, altera la función de los fibroblastos y acelera la senescencia celular; se aborda con antioxidantes (vitamina C, E, resveratrol), activos antiinflamatorios y protección solar estricta','Solo afecta a personas con enfermedades autoinmunes','No tiene relación con el envejecimiento cutáneo visible'],c:1},
    {q:'¿Cómo se integra el skincare en un protocolo de tratamiento de hiperpigmentación post-inflamatoria (PIH)?',o:['Solo se usa protector solar y nada más','Se combina: protección solar estricta SPF 50+ (paso más importante), inhibidores de tirosinasa (vitamina C, ácido kójico, alfa-arbutina, niacinamida), exfoliantes suaves (AHA a baja concentración) para acelerar la renovación celular y eliminar la melanina depositada; se evita cualquier irritante que pueda reactivar la inflamación y empeorar la PIH','Se aplica ácido glicólico concentrado directamente sobre las manchas','La PIH no responde a ningún tratamiento tópico'],c:1},
    {q:'¿Qué son los péptidos en skincare y cómo actúan a nivel celular?',o:['Son solo humectantes sin efecto biológico real','Son cadenas cortas de aminoácidos que actúan como mensajeros celulares; los péptidos señalizadores estimulan fibroblastos para producir colágeno; los péptidos transportadores llevan oligoelementos al tejido; los péptidos neurotransmisores inhiben la contracción muscular (efecto botox-like); su eficacia depende de la estabilidad, concentración y capacidad de penetración en la formulación','Son vitaminas del grupo B aplicadas tópicamente','Son filtros solares de nueva generación'],c:1},
    {q:'¿Cómo afecta el microbioma cutáneo a la salud de la piel y qué implica para el skincare?',o:['El microbioma no existe en la piel','La piel alberga miles de millones de microorganismos (bacterias, hongos) que en equilibrio protegen de patógenos, modulan la inflamación y mantienen el pH; el desequilibrio (disbiosis) se asocia a acné, rosácea, dermatitis atópica; un skincare agresivo puede alterar el microbioma; productos con prebióticos y probióticos buscan restaurar el equilibrio','El microbioma solo existe en el intestino','El microbioma debe eliminarse con productos antibacterianos potentes'],c:1},
    {q:'¿Cuál es la diferencia entre filtros solares físicos (minerales) y químicos y cuándo se prefiere cada uno?',o:['Son exactamente iguales en mecanismo','Los filtros físicos (óxido de zinc, dióxido de titanio) reflejan y dispersan la radiación UV; los químicos la absorben y convierten en calor; los físicos son preferibles en pieles sensibles, reactivas, embarazadas y post-tratamiento por menor riesgo de irritación; los químicos son más estéticos (menor residuo blanco) y pueden ser preferibles en uso diario en pieles tolerantes','Los filtros químicos siempre son más seguros','Los filtros físicos no protegen de UVA'],c:1},
    {q:'¿Cómo se evalúa la integridad de la barrera cutánea en la práctica estética y qué activos la restauran?',o:['Solo se evalúa con análisis de laboratorio médico','Se evalúa clínicamente por signos de compromiso de barrera: tirantez, eritema, descamación, sensibilidad aumentada, TEWL elevada (medible con tewameter); se restaura con ceramidas (reconstituyen los lípidos intercelulares), ácidos grasos esenciales, colesterol y activos como pantenol, alantoína y centella asiática que calman e hidratan sin irritar','La barrera cutánea no puede evaluarse sin equipos médicos','Solo se restaura con prescripción médica'],c:1},
    {q:'¿Qué es el ciclo de renovación celular de la piel y cómo varía con la edad?',o:['Es siempre de 28 días independientemente de la edad','Es el proceso por el que los queratinocitos migran desde la capa basal hasta la superficie y se descaman; dura aproximadamente 28 días en adultos jóvenes, se alarga a 45-60 días con la edad; esto explica por qué la piel madura responde más lentamente a los tratamientos y por qué la exfoliación controlada es más importante en piel madura','El ciclo de renovación no existe, la piel no se renueva','Solo dura 7 días en cualquier edad'],c:1},
    {q:'¿Cómo debe asesorar el operador certificado en skincare a un cliente sobre el cuidado de su piel en el contexto de un ciclo de tratamientos estéticos?',o:['Solo recomendar el protector solar y nada más','Diseñar una rutina personalizada según el tipo de piel, los tratamientos que recibe y los objetivos; educar sobre la importancia de la preparación pre-tratamiento, los cuidados post-sesión específicos para cada procedimiento, el uso correcto de activos sinérgicos con los tratamientos (vitamina C + colágeno post-HIFU, niacinamida + SPF post-láser) y los hábitos que potencian o sabotean los resultados; el skincare correcto multiplica la eficacia de los tratamientos estéticos','El cuidado de la piel es responsabilidad exclusiva del cliente','El operador no debe asesorar sobre skincare, es rol del dermatólogo'],c:1},
  ],
};
const EVAL_CRIOLIPOLISIS_BASICO = {
  id:'criolipolisis-basico',
  titulo:'Test Básico — Criolipólisis',
  categoria:'Radiofrecuencia / HIFU',
  nivel:'Básico',
  minimoAprobacion:10,
  preguntas:[
    {q:'¿Qué es la criolipólisis?',o:['Un tratamiento de láser para quemar grasa','Una técnica no invasiva que aplica frío controlado para destruir células de grasa por apoptosis sin dañar la piel ni tejidos circundantes','Un masaje profundo con hielo','Un tratamiento de radiofrecuencia con enfriamiento'],c:1},
    {q:'¿Cuál es el principio biológico de la criolipólisis?',o:['Las células de grasa se congelan y explotan inmediatamente','Los adipocitos son más sensibles al frío que otros tejidos; a temperaturas de entre -5°C y -10°C entran en apoptosis (muerte celular programada) mientras la piel y el músculo no se dañan','El frío aumenta el metabolismo de la grasa','El frío endurece la grasa para eliminarla por presión'],c:1},
    {q:'¿Es invasiva la criolipólisis?',o:['Sí, requiere incisiones pequeñas','Sí, usa agujas de frío','No, es completamente no invasiva','Sí, requiere anestesia local'],c:2},
    {q:'¿Cuándo se ven los resultados de la criolipólisis?',o:['Inmediatamente después de la sesión','A los 2-3 días','Entre 4 y 12 semanas después del tratamiento, cuando el organismo elimina los adipocitos destruidos','Al año de la sesión'],c:2},
    {q:'¿Para qué está indicada la criolipólisis?',o:['Para tratar la obesidad severa','Para reducir bolsas de grasa localizada resistentes a la dieta y el ejercicio en personas con peso cercano al normal','Para eliminar celulitis de forma definitiva','Para reafirmar la piel flácida principalmente'],c:1},
    {q:'¿Cuántas sesiones se necesitan generalmente por zona con criolipólisis?',o:['10 sesiones mínimo','1 a 2 sesiones por zona, con posibilidad de repetir a los 3 meses si se desea mayor reducción','20 sesiones seguidas','Una sesión diaria durante un mes'],c:1},
    {q:'¿Cuál es una contraindicación absoluta de la criolipólisis?',o:['Tener piel hidratada','Crioglobulinemia, enfermedad de Raynaud, urticaria por frío, embarazo o heridas abiertas en la zona','Ser mayor de 30 años','Hacer ejercicio regularmente'],c:1},
    {q:'¿Qué sensación es normal durante la sesión de criolipólisis?',o:['Dolor intenso insoportable desde el inicio','Calor extremo y quemadura','Frío intenso inicial, succión del cabezal y progresiva disminución de la sensación por entumecimiento de la zona','Corriente eléctrica fuerte'],c:2},
    {q:'¿Qué se recomienda hacer inmediatamente después de retirar el aplicador de criolipólisis?',o:['Aplicar calor intenso para descongelar la zona','Masajear la zona tratada durante 2-3 minutos para romper los cristales de grasa y potenciar el resultado','Aplicar hielo adicional para prolongar el efecto','No tocar la zona bajo ninguna circunstancia'],c:1},
    {q:'¿En qué zonas del cuerpo se aplica más comúnmente la criolipólisis?',o:['Solo en el rostro','Abdomen, flancos (cartucheras), espalda, papada, muslos internos y externos, y brazos','Solo en piernas','Exclusivamente en la zona lumbar'],c:1},
    {q:'¿Puede la criolipólisis tratar a una persona con obesidad severa?',o:['Sí, es el tratamiento ideal para la obesidad','No está indicada para obesidad; es para grasa localizada en personas con IMC cercano al normal o con sobrepeso leve','Solo si el médico lo autoriza sin restricciones','Sí, si se hacen suficientes sesiones'],c:1},
    {q:'¿Qué efecto secundario transitorio es normal después de la criolipólisis?',o:['Pérdida de sensibilidad permanente','Enrojecimiento, hematomas leves, entumecimiento temporal y sensibilidad en la zona tratada que desaparece en días a semanas','Quemaduras profundas','Aumento de volumen permanente'],c:1},
  ],
};
const EVAL_CRIOLIPOLISIS_INTERMEDIO = {
  id:'criolipolisis-intermedio',
  titulo:'Test Intermedio — Criolipólisis',
  categoria:'Radiofrecuencia / HIFU',
  nivel:'Intermedio',
  minimoAprobacion:10,
  preguntas:[
    {q:'¿Cuál es el mecanismo exacto por el que el frío destruye selectivamente los adipocitos en criolipólisis?',o:['El frío congela y cristaliza todas las células por igual','A temperaturas entre -5°C y -10°C los lípidos dentro de los adipocitos se cristalizan antes que el agua en otros tejidos; esto desencadena una cascada apoptótica en el adipocito que culmina en su muerte programada en las semanas siguientes; los tejidos circundantes (piel, músculo, nervios) son más resistentes al frío y no se dañan','Los adipocitos se congelan y estallan inmediatamente','El frío activa enzimas que disuelven la grasa directamente'],c:1},
    {q:'¿Qué es la PAH (hiperplasia adiposa paradójica) y en qué pacientes ocurre con mayor frecuencia?',o:['Es la reducción normal de grasa post-criolipólisis','Es una complicación rara donde la grasa tratada aumenta de volumen en lugar de reducirse, posiblemente por estimulación de células madre adiposas; ocurre más frecuentemente en hombres y en zona abdominal; requiere tratamiento con liposucción','Es el resultado esperado del tratamiento','Es una reacción alérgica al frío del cabezal'],c:1},
    {q:'¿Cómo se elimina la grasa destruida por la criolipólisis del organismo?',o:['Se elimina por los poros de la piel','Los adipocitos en apoptosis son fagocitados por macrófagos; los lípidos liberados son transportados por el sistema linfático al torrente circulatorio y metabolizados por el hígado en un proceso que dura entre 4 y 12 semanas','Se elimina inmediatamente por la orina','Se calcifica y queda en el tejido permanentemente'],c:1},
    {q:'¿Por qué el masaje post-criolipólisis de 2-3 minutos es importante para el resultado?',o:['Solo sirve para el confort del paciente','Estudios clínicos muestran que el masaje inmediato post-sesión puede aumentar la eficacia del tratamiento hasta un 68%; la manipulación mecánica de los tejidos fríos favorece la ruptura de los cristales de grasa y potencia la respuesta inflamatoria apoptótica','El masaje no tiene ningún efecto demostrado','El masaje puede dañar los tejidos fríos y debe evitarse'],c:1},
    {q:'¿Qué diferencia al aplicador de vacío (succión) del aplicador plano en criolipólisis?',o:['Solo cambia la forma, el efecto es idéntico','El aplicador de vacío succiona el tejido adiposo dentro del cabezal permitiendo tratar pliegues de grasa más gruesos (abdomen, flancos); el aplicador plano se usa sin succión para zonas más planas o donde no hay suficiente tejido para succionar (espalda baja, brazos, papada)','El aplicador plano es más efectivo en todos los casos','El aplicador de vacío solo se usa en el rostro'],c:1},
    {q:'¿Cuánto porcentaje de reducción de grasa por zona reportan los estudios clínicos de criolipólisis?',o:['1-2% por sesión','Entre el 20-25% de reducción de la capa de grasa en la zona tratada por sesión según estudios con ultrasonido y MRI','80-90% en una sola sesión','No hay estudios clínicos que validen la eficacia'],c:1},
    {q:'¿Cómo se combina la criolipólisis con la radiofrecuencia en protocolos corporales?',o:['Son incompatibles y nunca se combinan','Se puede aplicar radiofrecuencia en sesiones posteriores (mínimo 2-4 semanas después) para reafirmar la piel sobre la zona tratada con criolipólisis, ya que la reducción de volumen puede dejar la piel algo flácida; la combinación aborda reducción de grasa y reafirmación en el mismo ciclo','Se aplican siempre el mismo día','La RF anula el efecto de la criolipólisis'],c:1},
    {q:'¿Qué temperatura alcanza el tejido durante una sesión estándar de criolipólisis y por cuánto tiempo?',o:['0°C durante 5 minutos','Entre -5°C y -10°C en el tejido adiposo durante 35 a 60 minutos según el protocolo y el fabricante','20°C durante 2 horas','-40°C durante 10 minutos'],c:1},
    {q:'¿Cómo afecta el IMC del cliente a la selección del protocolo de criolipólisis?',o:['El IMC no influye en el protocolo','Un IMC alto (>30) con grandes volúmenes de grasa puede requerir múltiples aplicadores simultáneos o sesiones en varias zonas; la criolipólisis no es adecuada para reducción de peso general; el operador debe establecer expectativas realistas y recomendar cambios de hábitos paralelos','En IMC alto se usa mayor temperatura de frío','El IMC no tiene relación con los resultados'],c:1},
    {q:'¿Qué cuidado especial requiere el tratamiento de criolipólisis en la zona de papada?',o:['Se trata igual que el abdomen','La papada requiere un aplicador específico de menor tamaño; la zona es más sensible y vascularizada; se debe verificar que no haya alteraciones tiroideas, ganglios inflamados ni patología cervical; el tiempo de sesión puede ser menor y los parámetros más conservadores por la delicadeza de la zona','No hay ninguna consideración especial en papada','La papada está contraindicada para criolipólisis'],c:1},
    {q:'¿Qué contraindicación relativa debe evaluarse especialmente en criolipólisis antes de iniciar el tratamiento?',o:['El color del cabello del cliente','Diabetes con neuropatía periférica (reduce la sensibilidad al frío), trastornos de la coagulación, medicación anticoagulante, lesiones cutáneas activas en la zona y antecedentes de crioglobulinemia o urticaria por frío','Realizar ejercicio moderado','Haber comido 1 hora antes'],c:1},
    {q:'¿Qué protocolo de seguimiento es recomendable después de una sesión de criolipólisis?',o:['No requiere seguimiento','Revisión fotográfica y de medidas a las 4-6 semanas para evaluar cambios iniciales, y evaluación final a los 3 meses para valorar el resultado completo; si se desea mayor reducción puede planificarse una segunda sesión; se recomienda mantener hábitos saludables para preservar resultados','Solo llamar al cliente si se queja','Revisión al año sin controles intermedios'],c:1},
  ],
};
const EVAL_CRIOLIPOLISIS_AVANZADO = {
  id:'criolipolisis-avanzado',
  titulo:'Test Avanzado — Criolipólisis',
  categoria:'Radiofrecuencia / HIFU',
  nivel:'Avanzado',
  minimoAprobacion:10,
  preguntas:[
    {q:'¿Cuál es la base científica que explica por qué los adipocitos son más vulnerables al frío que otros tejidos?',o:['Los adipocitos tienen menos agua que otros tejidos','Los triglicéridos que componen los adipocitos tienen un punto de cristalización más alto que el agua intracelular de otros tipos celulares; a temperaturas entre -5°C y -10°C los lípidos se cristalizan y generan estrés mecánico en la membrana celular desencadenando la cascada apoptótica, mientras las células con mayor contenido acuoso (piel, músculo, nervios) permanecen en estado líquido y no se dañan','Los adipocitos son más grandes y absorben más frío','Los adipocitos no tienen mecanismos de reparación celular'],c:1},
    {q:'¿Cuál es el mecanismo inmunológico involucrado en la eliminación de los adipocitos post-criolipólisis?',o:['Los adipocitos se disuelven químicamente sin participación inmune','La apoptosis de los adipocitos desencadena una respuesta inflamatoria organizada: macrófagos y otras células del sistema inmune infiltran la zona y fagocitan los restos celulares; este proceso inflamatorio controlado es el que genera la reducción progresiva visible entre semanas 4 y 12; difiere de la necrosis (muerte celular descontrolada e inflamatoria)','Los adipocitos se eliminan sin participación del sistema inmune','La respuesta inmune acelera el proceso a las 24 horas'],c:1},
    {q:'¿Cuál es la hipótesis más aceptada sobre el mecanismo de la hiperplasia adiposa paradójica (PAH)?',o:['Es causada por mala técnica del operador','Se cree que el estrés criogénico activa células madre adiposas (preadipocitos) en lugar de destruirlas, estimulando su diferenciación y proliferación; la mayor incidencia en hombres y en abdomen sugiere una mayor densidad de preadipocitos en esas zonas; aún se investiga el mecanismo exacto','Es una reacción alérgica al metal del cabezal','Es producida por un error en la temperatura del equipo'],c:1},
    {q:'¿Cómo se diseña un protocolo de criolipólisis con múltiples aplicadores simultáneos para optimizar resultados?',o:['No se pueden usar múltiples aplicadores simultáneamente','Se mapean las zonas a tratar, se seleccionan aplicadores compatibles con las zonas objetivo, se verifica que el equipo soporte uso simultáneo, se establece el orden de colocación para maximizar cobertura y se monitorea cada aplicador durante la sesión; el uso simultáneo reduce el tiempo total y puede mejorar la simetría del resultado','Solo se usa un aplicador por sesión siempre','Los aplicadores simultáneos reducen la eficacia'],c:1},
    {q:'¿Qué evidencia científica respalda la criolipólisis como tratamiento estético no invasivo?',o:['No existe evidencia científica publicada','Múltiples ensayos clínicos controlados, revisiones sistemáticas y estudios con imágenes (ultrasonido, MRI) demuestran reducción de la capa de grasa del 20-25% por sesión; la FDA aprobó la criolipólisis para reducción de grasa en múltiples zonas; la evidencia es sólida para grasa localizada en candidatos apropiados','Solo hay estudios del fabricante sin validación independiente','La evidencia científica es solo anecdótica'],c:1},
    {q:'¿Cómo se diferencia la criolipólisis de la liposucción en términos de mecanismo, resultado y perfil de candidato?',o:['Son equivalentes en todos los aspectos','La liposucción elimina físicamente los adipocitos mediante succión quirúrgica con resultado inmediato y mayor magnitud; la criolipólisis destruye adipocitos por frío con resultado progresivo (4-12 semanas) y menor magnitud por sesión; la liposucción tiene mayor tiempo de recuperación y riesgo quirúrgico; la criolipólisis es ideal para grasa localizada moderada sin requerir cirugía; no son intercambiables para grandes volúmenes','La criolipólisis es más efectiva que la liposucción siempre','Son exactamente iguales en resultado final'],c:1},
    {q:'¿Qué implicaciones tiene la respuesta inflamatoria post-criolipólisis para el protocolo de seguimiento?',o:['La inflamación post-criolipólisis no tiene implicaciones clínicas','La inflamación controlada es parte del mecanismo de eliminación; puede manifestarse como edema, eritema y sensibilidad en las primeras semanas; el operador debe informar al cliente que estos signos son normales y parte del proceso; el seguimiento a las 4-6 semanas permite evaluar el progreso y distinguir la respuesta normal de posibles complicaciones (PAH, reacción cutánea excesiva)','La inflamación indica que el tratamiento no funcionó','La inflamación requiere siempre tratamiento médico inmediato'],c:1},
    {q:'¿Cómo debe el operador avanzado evaluar si un cliente es candidato apropiado para criolipólisis vs otros tratamientos reductores?',o:['Todos los clientes son candidatos sin evaluación','Se evalúa: IMC (candidatos ideales cercanos al peso normal con grasa localizada), consistencia de la grasa (pellizcable = candidato; dura/fibrosa = menos respuesta), zona objetivo (algunas responden mejor que otras), expectativas del cliente y condiciones médicas; si el volumen es grande o la grasa es muy dura puede ser más adecuada cavitación, HIFU corporal o derivación a cirujano','La evaluación no es necesaria, cualquier persona es candidata','Solo se evalúa el IMC, nada más'],c:1},
    {q:'¿Qué protocolo combinado tiene mayor evidencia para tratamiento de grasa abdominal localizada?',o:['Solo criolipólisis sin ningún complemento','La combinación de criolipólisis (reducción volumétrica de grasa) seguida de radiofrecuencia (reafirmación cutánea) y drenaje linfático (potenciación de la eliminación linfática de lípidos) tiene respaldo clínico como protocolo integral; el intervalo entre criolipólisis y RF debe ser mínimo 2-4 semanas para no interferir con el proceso inflamatorio de eliminación','Solo ejercicio después de la criolipólisis','La criolipólisis y la cavitación en el mismo día de la misma zona'],c:1},
    {q:'¿Cuál es la consideración de seguridad más importante al usar aplicadores de criolipólisis con sistema de vacío?',o:['El ruido del equipo durante la sesión','Verificar que no haya pliegues de piel atrapados irregularmente en el aplicador, monitorear la temperatura durante toda la sesión, asegurarse de que el cliente comunique cualquier sensación de dolor intenso (más allá del frío tolerable) y verificar el estado de la piel al retirar el aplicador; quemaduras por frío pueden ocurrir si la temperatura baja excesivamente o si la colocación es incorrecta','El nivel de ruido del equipo','Solo verificar que el gel esté aplicado correctamente'],c:1},
    {q:'¿Cómo documenta el operador avanzado la evolución del cliente en un ciclo de criolipólisis para garantizar resultados reproducibles?',o:['Solo documenta si el cliente lo pide','Fotografías estandarizadas (misma iluminación, ángulo y posición) antes de la primera sesión y a las 4, 8 y 12 semanas post-sesión; mediciones con cinta métrica en puntos anatómicos fijos; registro de parámetros del equipo (temperatura, tiempo, zona, aplicador); evaluación subjetiva del cliente; comparación sistemática que permita ajustar el protocolo y demostrar objetivamente los resultados','Solo una foto antes y una después','No es necesaria documentación en criolipólisis'],c:1},
    {q:'¿Qué distingue a un operador certificado en criolipólisis de uno sin formación específica en esta tecnología?',o:['Solo haber usado el equipo una vez','El operador certificado conoce el mecanismo de acción y sus limitaciones, selecciona correctamente los candidatos, aplica los protocolos con parámetros seguros, identifica y comunica posibles complicaciones (PAH, quemaduras por frío, efectos paradójicos), realiza el seguimiento correcto, documenta objetivamente y sabe combinar la criolipólisis en protocolos integrales; esto garantiza seguridad y resultados óptimos para el cliente','Solo conocer el precio del equipo','La certificación no cambia la forma de aplicar el tratamiento'],c:1},
  ],
};
const EVAL_ATENCION_BASICO = {
  id:'atencion-basico',
  titulo:'Test Básico — Atención al Cliente y Ventas en Estética',
  categoria:'General',
  nivel:'Básico',
  minimoAprobacion:10,
  preguntas:[
    {q:'¿Cuál es la forma correcta de saludar a una clienta nueva en Uruguay?',o:['Ignorarla hasta que se acerque a preguntar','Recibirla con un saludo cálido, llamarla por su nombre si ya lo conocemos, hacer contacto visual y ofrecerle asiento; en Uruguay el trato cercano y el tuteo es habitual y genera confianza desde el primer momento','Solo saludar si la clienta saluda primero','Atenderla solo por WhatsApp para no interrumpir el trabajo'],c:1},
    {q:'¿Qué es la escucha activa y por qué es clave en la atención estética?',o:['Escuchar música de fondo durante la sesión','Prestar atención plena a lo que dice la clienta, sin interrumpir, haciendo preguntas de seguimiento y validando sus preocupaciones; permite entender sus objetivos reales y generar confianza','Solo escuchar la queja si es muy grave','Responder rápido sin escuchar para ser más eficiente'],c:1},
    {q:'¿Cómo debe manejarse una clienta que llega tarde a su turno en Uruguay?',o:['Cancelarle el turno sin explicación','Recibirla con amabilidad, explicarle el tiempo disponible y hacer lo posible dentro del tiempo restante; en Uruguay la puntualidad es flexible y el trato humano siempre primero','Cobrarle el doble por la demora','Ignorar la tardanza y hacer la sesión completa sin importar si hay otra clienta esperando'],c:1},
    {q:'¿Qué información básica debe recabarse en la primera consulta con una clienta?',o:['Solo el nombre y el método de pago','Nombre, contacto, objetivos estéticos, antecedentes médicos relevantes, medicación actual, contraindicaciones y expectativas; esta información guía el plan de tratamiento y protege legalmente a la operadora','Solo preguntar qué tratamiento quiere','Solo verificar si puede pagar'],c:1},
    {q:'¿Cómo se explica el precio de un tratamiento en Uruguay sin que la clienta lo perciba como caro?',o:['Decirle el precio sin explicación y esperar','Presentar el valor del servicio antes del precio: explicar qué incluye, cuántas sesiones, qué resultados puede esperar y por qué vale lo que vale; en Uruguay el boca a boca es clave y una clienta que entiende el valor se convierte en recomendadora','Bajar el precio siempre que la clienta pida descuento','Evitar hablar de precios hasta el final de la sesión'],c:1},
    {q:'¿Cuál es la importancia de confirmar los turnos por WhatsApp en Uruguay?',o:['No es necesario confirmar, las clientas son responsables','Es fundamental: la mayoría de las uruguayas usa WhatsApp como canal principal; confirmar el turno 24 horas antes reduce las ausencias, demuestra profesionalismo y abre la puerta a recordar cuidados pre-sesión','Solo confirmar por llamada telefónica','Solo confirmar en redes sociales'],c:1},
    {q:'¿Cómo se maneja una clienta insatisfecha con un resultado en Uruguay?',o:['Ignorar el reclamo y esperar que se olvide','Escuchar con empatía sin ponerse a la defensiva, validar su percepción, explicar el proceso realista del tratamiento y ofrecer una solución concreta (nueva sesión de evaluación, ajuste del protocolo); en Uruguay el trato directo y honesto es valorado','Culpar a la clienta por no seguir los cuidados','Devolverle el dinero sin evaluar el caso'],c:1},
    {q:'¿Qué significa "fidelizar" a una clienta en el contexto de la estética uruguaya?',o:['Obligarla a comprar más servicios','Construir una relación de confianza y largo plazo donde la clienta vuelve por sus propios resultados, recomienda el servicio a amigas y familia, y se siente valorada más allá de la transacción comercial','Solo ofrecerle descuentos permanentes','Agregarla a grupos de WhatsApp sin su permiso'],c:1},
    {q:'¿Qué red social es la más efectiva para captar clientas en Uruguay actualmente?',o:['Solo Facebook para mayores de 50','Instagram y WhatsApp son las más efectivas para el rubro estético en Uruguay; Instagram para mostrar resultados y generar confianza; WhatsApp para la comunicación directa y el agendamiento','Solo Twitter','Solo TikTok para menores de 18'],c:1},
    {q:'¿Cómo debe presentarse un plan de sesiones a una clienta uruguaya?',o:['Decirle que compre todas las sesiones de golpe sin explicar','Explicar claramente cuántas sesiones se recomiendan, con qué frecuencia, qué resultados puede esperar en cada etapa y cuánto representa la inversión total; la claridad genera confianza y facilita la decisión','Solo decir el precio total sin detallar','Prometer resultados garantizados para cerrar la venta'],c:1},
    {q:'¿Qué actitud debe tener la operadora cuando una clienta compara sus precios con los de la competencia?',o:['Atacar a la competencia','Escuchar con calma, reconocer que hay opciones en el mercado y explicar en qué se diferencia su servicio (calidad, atención, resultados, seguimiento); en Uruguay la reputación y el trato personal valen más que el precio más bajo','Bajar el precio inmediatamente','Enojarse y terminar la conversación'],c:1},
    {q:'¿Por qué es importante el seguimiento post-sesión con la clienta?',o:['No es necesario el seguimiento una vez terminada la sesión','Demuestra profesionalismo y cuidado genuino; permite detectar reacciones adversas a tiempo, reforzar los cuidados post-tratamiento, mantener la relación y abrir la puerta a la próxima sesión; en Uruguay una operadora que hace seguimiento genera recomendaciones espontáneas','Solo hacer seguimiento si la clienta se queja','El seguimiento es intrusivo y debe evitarse'],c:1},
  ],
};
const EVAL_ATENCION_INTERMEDIO = {
  id:'atencion-intermedio',
  titulo:'Test Intermedio — Atención al Cliente y Ventas en Estética',
  categoria:'General',
  nivel:'Intermedio',
  minimoAprobacion:10,
  preguntas:[
    {q:'¿Qué es el "boca a boca" en Uruguay y cómo se potencia desde la operadora?',o:['Una técnica de marketing digital','La recomendación espontánea entre conocidas, amigas y familia; es el canal de captación más efectivo en Uruguay; se potencia brindando resultados reales, atención personalizada, seguimiento post-sesión y haciendo sentir especial a cada clienta para que cuente su experiencia','Solo funciona en ciudades grandes','Se potencia con descuentos agresivos'],c:1},
    {q:'¿Cómo se aplica la venta consultiva en estética con clientas uruguayas?',o:['Ofrecer todos los servicios disponibles en la primera consulta','Escuchar el objetivo de la clienta, hacer preguntas que permitan entender su situación real, y recomendar solo lo que realmente necesita y puede beneficiarle; la honestidad en la recomendación genera confianza a largo plazo y es más valorada en Uruguay que la venta agresiva','Vender el tratamiento más caro siempre','No hacer preguntas para no incomodar a la clienta'],c:1},
    {q:'¿Cómo debe manejarse la objeción "es muy caro" de una clienta uruguaya?',o:['Bajar el precio inmediatamente','Escuchar sin interrumpir, validar la preocupación ("entiendo que es una inversión"), reformular el valor ("son X sesiones que incluyen Y y Z"), ofrecer opciones de pago si existen y no presionar; muchas uruguayas comparan precio y valor, no solo precio','Decirle que si es cara no está para este servicio','Ignorar la objeción y continuar explicando el tratamiento'],c:1},
    {q:'¿Qué papel juegan los testimonios y resultados en la captación de clientas en Uruguay?',o:['No tienen ningún impacto en la decisión de compra','Son el factor más poderoso; mostrar fotos de antes y después (con consentimiento), compartir experiencias reales de clientas satisfechas y reseñas auténticas en redes genera la confianza necesaria para que una clienta nueva dé el primer paso; en Uruguay la autenticidad pesa más que la publicidad','Solo importan los descuentos, no los resultados','Los testimonios negativos son más importantes que los positivos'],c:1},
    {q:'¿Cómo se construye una agenda ordenada y eficiente en Uruguay considerando la cultura local?',o:['Agendar sin límite de clientas por día','Dejar márgenes entre turnos (10-15 min) para imprevistos; en Uruguay las clientas suelen charlar y la puntualidad es flexible; tener una política de turnos clara (confirmación, cancelación, llegada tarde) comunicada con amabilidad desde el inicio evita conflictos y burnout de la operadora','Solo trabajar por orden de llegada sin turnos','Agendar todos los turnos juntos sin descanso'],c:1},
    {q:'¿Cómo se comunica un aumento de precios a clientas frecuentes en Uruguay sin perderlas?',o:['Aumentar los precios sin avisar y esperar que no noten','Comunicarlo con anticipación (al menos 2 semanas), explicando el motivo (costos, calidad, nuevos servicios), agradeciendo su fidelidad y si es posible respetando el precio anterior para sesiones ya reservadas; el trato honesto y el reconocimiento a la clienta frecuente son clave en Uruguay','Aumentar solo a clientas nuevas y mantener el precio a las frecuentes para siempre','Justificar el aumento solo si preguntan'],c:1},
    {q:'¿Qué es el upselling y cómo aplicarlo éticamente en estética con clientas uruguayas?',o:['Obligar a la clienta a comprar más de lo que necesita','Ofrecer un servicio complementario o superior que genuinamente agrega valor al objetivo de la clienta (ej: agregar drenaje linfático después de criolipólisis para potenciar resultados); debe hacerse de forma natural, explicando el beneficio real, sin presión y solo cuando tiene sentido para esa clienta específica','Vender el servicio más caro siempre','No ofrecer nada adicional bajo ninguna circunstancia'],c:1},
    {q:'¿Cómo se gestiona una clienta que cancela frecuentemente sus turnos en Uruguay?',o:['Eliminarla de la agenda sin avisar','Hablar con ella con amabilidad, entender el motivo (muchas veces es económico o de organización), ofrecer opciones (turnos más flexibles, recordatorios adicionales) y si persiste establecer una política de reserva o seña que proteja el tiempo de la operadora','Cobrarle una multa alta','Ignorar las cancelaciones y seguir agendando'],c:1},
    {q:'¿Cómo se diferencia una operadora de las demás en un mercado estético competitivo en Uruguay?',o:['Solo bajando precios','Con atención personalizada, resultados reales, seguimiento genuino, conocimiento técnico demostrable, puntualidad, profesionalismo en la comunicación y creación de un vínculo de confianza; en Uruguay la diferenciación por calidad de trato es más sostenible que la guerra de precios','Solo con publicidad en redes sociales','Solo ofreciendo los equipos más modernos'],c:1},
    {q:'¿Qué significa respetar los tiempos y el ritmo de decisión de una clienta uruguaya?',o:['Presionarla para que decida en el momento','Entender que muchas clientas uruguayas necesitan tiempo para consultar con su pareja, evaluar su presupuesto o simplemente pensarlo; dar espacio sin presión, ofrecer información clara y estar disponible para responder dudas por WhatsApp genera más confianza que la venta de presión','Decirle que la oferta vence en 24 horas siempre','No darle información hasta que decida comprar'],c:1},
    {q:'¿Cómo se manejan las expectativas de una clienta que busca resultados inmediatos en tratamientos como HIFU o criolipólisis?',o:['Prometerle resultados inmediatos para cerrar la venta','Explicar con honestidad los tiempos reales del tratamiento (HIFU: 1-3 meses; criolipólisis: 4-12 semanas), mostrar casos reales con esos tiempos, y enmarcar la espera como parte del proceso natural del cuerpo; una clienta bien informada tiene expectativas reales y queda más satisfecha','Evitar hablar de tiempos para no asustarla','Decirle que depende de ella sin dar información concreta'],c:1},
    {q:'¿Por qué es importante que la operadora cuide su propia imagen personal y la de su espacio de trabajo en Uruguay?',o:['No importa la imagen si el equipo es bueno','En Uruguay el ambiente del rubro estético es muy visual; la operadora es su propia carta de presentación; una apariencia cuidada, un espacio limpio y ordenado y una comunicación profesional en redes transmiten confianza antes de que la clienta pruebe el servicio; la primera impresión abre puertas que el boca a boca cierra','Solo importa el equipo que usa','La imagen solo importa en Montevideo, no en el interior'],c:1},
  ],
};
const EVAL_ATENCION_AVANZADO = {
  id:'atencion-avanzado',
  titulo:'Test Avanzado — Atención al Cliente y Ventas en Estética',
  categoria:'General',
  nivel:'Avanzado',
  minimoAprobacion:10,
  preguntas:[
    {q:'¿Cómo se diseña una estrategia de fidelización para clientas de interior del Uruguay donde la comunidad es pequeña y el boca a boca es aún más poderoso?',o:['Igual que en Montevideo, no hay diferencia','En el interior la red de conocidas es más densa y un error se difunde más rápido que en la capital; la estrategia debe priorizar la confianza, el trato personalísimo, el conocimiento de las clientas por nombre y situación personal, el seguimiento cercano y la discreción absoluta; una operadora del interior que trata bien a sus clientas genera una red de recomendaciones que puede sostener todo su negocio','Solo ofrecer precios más bajos que Montevideo','No tiene sentido fidelizar en el interior porque las clientas son pocas'],c:1},
    {q:'¿Cómo se construye una propuesta de valor clara para una operadora de DepiMóvil en Uruguay?',o:['Decir que es la más barata del mercado','Identificar qué hace diferente a esa operadora específica (equipos, atención, especialización, resultados, zona geográfica, horarios flexibles), articularlo en un mensaje claro y consistente en todos sus canales (WhatsApp, Instagram, boca a boca) y demostrarlo con resultados reales y testimonios; en Uruguay la propuesta de valor se construye sobre la confianza y la consistencia','Copiar la comunicación de otras operadoras','La propuesta de valor no es necesaria en estética'],c:1},
    {q:'¿Qué estrategia de comunicación en WhatsApp Business es más efectiva para operadoras estéticas uruguayas?',o:['Enviar mensajes masivos de promociones todos los días','Usar mensajes personalizados (nombre de la clienta, referencia a su tratamiento), recordatorios de turno 24 horas antes, seguimiento post-sesión, contenido de valor ocasional (cuidados, tips) y responder rápido; los grupos masivos de promociones generan saturación y baja el valor percibido; en Uruguay la comunicación directa y personalizada es más efectiva','Solo responder cuando la clienta escribe primero','Usar solo emojis sin texto para ser más moderna'],c:1},
    {q:'¿Cómo se maneja una reseña negativa en redes sociales de una clienta uruguaya insatisfecha?',o:['Eliminar la reseña y bloquear a la clienta','Responder públicamente con amabilidad y profesionalismo, agradeciendo la devolución, validando su experiencia y ofreciendo resolver el problema de forma privada; en Uruguay una respuesta empática y profesional a una crítica puede generar más confianza en potenciales clientas que una página sin ninguna reseña negativa','Ignorar la reseña completamente','Responder de forma agresiva defendiendo el servicio'],c:1},
    {q:'¿Cómo se aplica la psicología del precio en el mercado estético uruguayo?',o:['El precio más bajo siempre gana','El precio comunica calidad; precios muy bajos pueden generar desconfianza ("si es tan barato, ¿será bueno?"); en Uruguay el rango de precio medio-alto con valor claramente comunicado funciona bien; ofrecer opciones (pack de sesiones con descuento vs sesión suelta) permite que la clienta elija su punto de entrada sin sentirse presionada','Solo los precios altos funcionan en Uruguay','El precio no influye en la decisión de la clienta uruguaya'],c:1},
    {q:'¿Qué es el customer journey en estética y cómo se optimiza para clientas uruguayas?',o:['Un recorrido turístico por salones de belleza','El mapa de todos los puntos de contacto de la clienta con la operadora: desde que ve una publicación o le recomiendan el servicio, hasta la consulta, la primera sesión, el seguimiento y la recomendación a otras; optimizarlo implica cuidar cada punto (respuesta rápida en Instagram, bienvenida cálida, sesión profesional, seguimiento por WhatsApp) para que la experiencia sea positiva en todo el recorrido','Solo importa la sesión en sí','El customer journey es solo para grandes empresas'],c:1},
    {q:'¿Cómo se gestionan los momentos de alta demanda estacional en Uruguay (verano, antes de carnaval, fiestas)?',o:['Aceptar todas las clientas sin límite y después cancelar','Planificar con anticipación: comunicar disponibilidad limitada con tiempo, priorizar clientas frecuentes, ofrecer reservas anticipadas, ajustar los precios si corresponde y gestionar expectativas sobre tiempos de espera; en Uruguay los picos de demanda son predecibles (previo a temporada de playa, carnaval, fiestas de fin de año) y pueden convertirse en oportunidad si se gestionan bien','No hacer nada especial en temporada alta','Subir los precios sin avisar en temporada'],c:1},
    {q:'¿Cómo se construye autoridad y confianza en redes sociales para una operadora estética uruguaya?',o:['Publicar solo fotos de equipos y precios','Combinar contenido educativo (cómo funciona tal tratamiento, qué esperar, cuidados), resultados reales con consentimiento, detrás de escena que humaniza el servicio, testimonios auténticos y presencia consistente; en Uruguay la autenticidad supera a la producción excesiva; una operadora que muestra su trabajo real genera más confianza que una cuenta con fotos perfectas pero impersonales','Solo publicar promociones y descuentos','No usar redes sociales porque son pérdida de tiempo'],c:1},
    {q:'¿Cómo se aborda el tema de la diversidad corporal y la autoestima con clientas uruguayas en el contexto estético?',o:['Ignorar el tema y solo hablar de resultados físicos','La clienta uruguaya valora que la operadora la trate con respeto independientemente de su cuerpo; el enfoque debe ser el bienestar y los objetivos personales de cada clienta, no el ideal estético impuesto; usar lenguaje inclusivo, evitar comentarios sobre el cuerpo que no sean solicitados y centrar la conversación en cómo el tratamiento ayuda a alcanzar el objetivo de esa clienta específica','Decirle a la clienta qué debería cambiar de su cuerpo','Evitar hablar de bienestar y enfocarse solo en la venta'],c:1},
    {q:'¿Qué métricas debe seguir una operadora uruguaya para evaluar la salud de su negocio estético?',o:['Solo el dinero que entra cada mes','Tasa de retorno de clientas (% que vuelven después de la primera sesión), promedio de sesiones por clienta, tasa de cancelaciones y ausencias, nuevas clientas por mes y su fuente (boca a boca, redes, búsqueda), ticket promedio y satisfacción percibida; estas métricas permiten tomar decisiones informadas sobre qué funciona y qué mejorar','Solo el número total de seguidores en Instagram','Las métricas no son necesarias en un negocio chico'],c:1},
    {q:'¿Cómo se maneja el límite profesional con clientas uruguayas que buscan más que un servicio estético (contención emocional, amistad)?',o:['Ser la terapeuta de todas las clientas sin límite','Cultivar una relación cálida y cercana (que es natural en Uruguay) sin perder el rol profesional; escuchar con empatía, validar emociones sin convertirse en confidente de problemas personales profundos, y si la clienta necesita apoyo emocional significativo, referirla con calidez a los recursos adecuados; el vínculo humano es un activo del negocio pero los límites profesionales protegen a ambas partes','No tener ningún tipo de relación personal con las clientas','Hablar solo de los tratamientos y nunca de nada personal'],c:1},
    {q:'¿Qué distingue a una operadora certificada en atención al cliente y ventas de una que no tiene esta formación, en el contexto del mercado estético uruguayo?',o:['Solo el precio que cobra por sus servicios','Una operadora con esta formación sabe recibir, escuchar, comunicar valor, manejar objeciones, fidelizar, gestionar conflictos y crecer su negocio de forma sostenible; entiende la cultura uruguaya (cercanía, confianza, boca a boca, WhatsApp) y adapta su comunicación; combina el conocimiento técnico del tratamiento con la habilidad de construir relaciones duraderas que sostienen un negocio rentable a largo plazo','Solo conocer más técnicas de tratamiento','La certificación en ventas no tiene valor en estética'],c:1},
  ],
};
const EVAL_BIOSEGURIDAD_BASICO = {
  id:'bioseguridad-basico',
  titulo:'Test Básico — Bioseguridad e Higiene en Estética',
  categoria:'General',
  nivel:'Básico',
  minimoAprobacion:10,
  preguntas:[
    {q:'¿Qué es la bioseguridad en el contexto de la estética profesional?',o:['Solo lavar las manos antes de trabajar','El conjunto de normas, procedimientos y prácticas destinadas a prevenir la transmisión de infecciones, proteger la salud de la operadora y la clienta, y garantizar un ambiente de trabajo seguro e higiénico','Solo usar guantes durante los tratamientos','El mantenimiento del equipo de aparatología'],c:1},
    {q:'¿Cuáles son las vías de transmisión de infecciones más relevantes en un centro estético?',o:['Solo el aire del ambiente','Contacto directo (piel-piel, sangre), contacto indirecto (instrumentos, superficies contaminadas) y gotas respiratorias; las más relevantes en estética son el contacto directo e indirecto con material biológico','Solo por usar el mismo equipo','Solo si la clienta tiene una enfermedad conocida'],c:1},
    {q:'¿Cuál es la técnica correcta de lavado de manos clínico antes de atender a una clienta?',o:['Enjuagarse rápido con agua','Mojar manos, aplicar jabón, frotar durante mínimo 20 segundos cubriendo palmas, dorso, entre dedos, nudillos y muñecas, enjuagar bien y secar con papel descartable; es la medida más efectiva de prevención de infecciones','Solo usar alcohol en gel sin agua','Solo lavarse si se ve suciedad visible'],c:1},
    {q:'¿Qué diferencia existe entre limpiar, desinfectar y esterilizar?',o:['Son sinónimos, significan lo mismo','Limpiar elimina suciedad visible; desinfectar elimina la mayoría de microorganismos patógenos con productos químicos; esterilizar elimina absolutamente todos los microorganismos incluyendo esporas; el nivel requerido depende del tipo de material y su uso','Solo la esterilización es necesaria en estética','Limpiar es suficiente para todos los instrumentos'],c:1},
    {q:'¿Qué elementos de protección personal (EPP) son básicos para una operadora estética?',o:['Solo el uniforme de trabajo','Guantes descartables para procedimientos con contacto con piel o fluidos, protección ocular cuando hay riesgo de salpicaduras y mascarilla en procedimientos que lo requieran; el EPP protege tanto a la operadora como a la clienta','Solo guantes para depilación con cera','Los EPP no son necesarios en estética, solo en hospitales'],c:1},
    {q:'¿Cómo deben desinfectarse los cabezales de los equipos de aparatología entre clientas?',o:['Solo limpiarlos con un trapo seco','Limpiar primero con paño húmedo para eliminar restos de gel o producto, luego desinfectar con el producto indicado por el fabricante (alcohol 70%, solución desinfectante específica), dejar actuar el tiempo necesario y secar antes del siguiente uso','Solo desinfectarlos al final del día','No necesitan desinfección porque no tienen contacto con sangre'],c:1},
    {q:'¿Qué se debe hacer con las sábanas y toallas usadas en cada sesión?',o:['Reutilizarlas hasta que se vean sucias','Cambiarlas entre cada clienta y lavarlas con agua caliente y detergente; en estética profesional usar sábanas descartables es la opción más higiénica y práctica','Solo cambiarlas una vez por día','Solo cambiarlas si la clienta lo pide'],c:1},
    {q:'¿Cómo debe mantenerse la camilla de tratamiento en términos de higiene?',o:['Solo limpiarla con agua al finalizar el día','Cubrir con sábana o papel descartable para cada clienta, desinfectar la superficie de la camilla entre clientas (especialmente si hubo contacto con piel descubierta) y limpiar en profundidad al final de la jornada','Solo limpiarla cuando hay manchas visibles','No necesita limpieza si se usa sábana'],c:1},
    {q:'¿Qué debe hacerse si una clienta presenta una herida abierta, infección cutánea activa o lesión sospechosa en la zona a tratar?',o:['Tratar igual, no afecta al resultado','No realizar el tratamiento en esa zona, explicar el motivo con respeto y recomendar que consulte un médico antes de continuar; una herida abierta o infección es contraindicación y tratar sobre ella puede empeorar el cuadro y generar una infección cruzada','Solo usar más gel para proteger','Cubrir con cinta y tratar igual'],c:1},
    {q:'¿Cómo se eliminan correctamente los residuos generados en una sesión estética (guantes usados, gasas, papel)?',o:['En cualquier papelera sin distinción','Los residuos no contaminados (papel, envases) van a la basura común; los residuos con potencial biológico (guantes con restos de fluidos, apósitos con sangre) deben manejarse como residuos de riesgo biológico según la normativa local; nunca mezclar con basura doméstica si hay riesgo de contaminación','Tirarlos al inodoro','Quemarlos en el patio'],c:1},
    {q:'¿Por qué es importante ventilar el espacio de trabajo en estética?',o:['Solo para que huela bien','La ventilación adecuada reduce la concentración de microorganismos en el aire, elimina vapores de productos químicos y mejora el confort de la clienta y la operadora; un ambiente con buena circulación de aire es más seguro e higiénico','La ventilación no tiene relación con la higiene','Solo ventilar en verano cuando hace calor'],c:1},
    {q:'¿Qué debe verificarse sobre el estado de salud de la operadora antes de atender clientas?',o:['Nada, siempre se trabaja igual','Si la operadora tiene síntomas de infección respiratoria, conjuntivitis, lesiones cutáneas infectadas o gastrointestinal aguda debe evaluarse si puede atender con las protecciones adecuadas o si es mejor reagendar; la operadora enferma puede transmitir infecciones a las clientas','Solo verificar si tiene fiebre alta','El estado de salud de la operadora no afecta a las clientas'],c:1},
  ],
};
const EVAL_BIOSEGURIDAD_INTERMEDIO = {
  id:'bioseguridad-intermedio',
  titulo:'Test Intermedio — Bioseguridad e Higiene en Estética',
  categoria:'General',
  nivel:'Intermedio',
  minimoAprobacion:10,
  preguntas:[
    {q:'¿Cuál es la diferencia entre antiséptico y desinfectante y cuándo se usa cada uno?',o:['Son exactamente lo mismo','El antiséptico se aplica sobre tejido vivo (piel de la clienta) para reducir microorganismos; el desinfectante se aplica sobre superficies inertes (camilla, instrumentos, cabezales); no son intercambiables: un desinfectante no debe aplicarse en la piel y un antiséptico no es suficientemente potente para superficies','Los antisépticos son más fuertes que los desinfectantes','Solo los desinfectantes son necesarios en estética'],c:1},
    {q:'¿Qué concentración de alcohol etílico es más efectiva para desinfección en estética?',o:['Alcohol puro al 100%','Alcohol al 70-75% en solución acuosa; el agua potencia la acción bactericida del alcohol al facilitar su penetración en la membrana celular bacteriana; el alcohol puro al 100% es menos efectivo porque desnaturaliza la proteína superficial sin penetrar','Alcohol al 30%','Cualquier concentración es igual de efectiva'],c:1},
    {q:'¿Cómo se realiza el proceso de desinfección de alto nivel para instrumental semicrítico en estética?',o:['Solo lavarlo con agua y jabón','Limpiar primero para eliminar materia orgánica, luego sumergir en solución desinfectante de alto nivel (glutaraldehído, ácido peracético o hipoclorito según el material) durante el tiempo indicado por el fabricante, enjuagar con agua estéril o destilada, secar y guardar en envase limpio y cerrado','Solo usar alcohol al 70%','No es necesario el desinfectante de alto nivel en estética'],c:1},
    {q:'¿Qué es el Staphylococcus aureus resistente a la meticilina (MRSA) y por qué es relevante en estética?',o:['Una bacteria que solo afecta a hospitales','Un patógeno resistente a antibióticos que puede transmitirse por contacto con piel o superficies contaminadas; relevante en estética porque el contacto cutáneo frecuente y el uso compartido de equipos mal desinfectados puede favorecer su transmisión; la desinfección correcta de superficies y el uso de EPP previene su propagación','No es relevante en estética bajo ninguna circunstancia','Solo afecta a personas mayores'],c:1},
    {q:'¿Cómo se gestiona correctamente el stock y la vigencia de productos desinfectantes en un centro estético?',o:['Se usan hasta que se acaben sin revisar','Verificar fecha de vencimiento al recibir y antes de usar, respetar las diluciones indicadas por el fabricante, preparar soluciones frescas según las instrucciones (muchos desinfectantes pierden eficacia a las 24-48 horas de preparados), almacenar en lugares frescos y oscuros y registrar el stock para no quedarse sin insumos críticos','Solo verificar si huele bien','Los desinfectantes no tienen fecha de vencimiento'],c:1},
    {q:'¿Qué protocolo debe seguirse ante un accidente con material potencialmente contaminado (pinchazo, corte, contacto con fluido)?',o:['Ignorarlo si es pequeño','Lavar inmediatamente con agua y jabón abundante (no frotar), aplicar antiséptico, reportar el accidente, evaluar el riesgo de transmisión según el tipo de exposición y el estado de salud conocido de la clienta, y consultar a un médico para evaluar profilaxis post-exposición si corresponde','Solo poner alcohol y seguir trabajando','Solo reportarlo si hay mucho sangrado'],c:1},
    {q:'¿Por qué el hongo Trichophyton (causa de hongos en uñas y pie de atleta) es relevante en servicios de pedicura estética?',o:['No es relevante en estética','Es un dermatofito altamente contagioso que puede transmitirse por instrumentos mal esterilizados, superficies húmedas y material compartido; en pedicura, los instrumentos que contactan uñas y piel del pie deben estar esterilizados o ser descartables; el no cumplimiento puede generar infecciones fúngicas en otras clientas','Solo afecta a personas inmunocomprometidas','Solo se transmite por contacto directo piel a piel, no por instrumentos'],c:1},
    {q:'¿Cómo debe limpiarse y mantenerse el área de trabajo entre sesiones para cumplir estándares de higiene profesional?',o:['Solo barrer el piso al finalizar el día','Retirar residuos de la sesión anterior, cambiar la sábana o papel de la camilla, desinfectar superficies de contacto (camilla, mesa de instrumentos, apoyos), lavar manos, preparar instrumentos limpios y desinfectados para la próxima clienta; el tiempo entre clientas debe planificarse para permitir este protocolo','Solo limpiar si hay manchas visibles','La limpieza entre clientas no es necesaria si no hubo procedimientos invasivos'],c:1},
    {q:'¿Qué normativa uruguaya regula la habilitación y las condiciones de higiene de los establecimientos estéticos?',o:['No existe ninguna normativa en Uruguay','El MSP (Ministerio de Salud Pública) y las Intendencias regulan la habilitación de establecimientos estéticos; exigen condiciones mínimas de infraestructura, higiene, ventilación, manejo de residuos y capacitación del personal; operar sin habilitación es ilegal y puede generar sanciones','Solo la Intendencia de Montevideo regula esto','La normativa solo aplica a clínicas médicas, no a centros estéticos'],c:1},
    {q:'¿Cómo debe manejarse la ropa de trabajo (uniforme) de la operadora desde una perspectiva de bioseguridad?',o:['Usar la misma ropa personal todos los días','Usar uniforme exclusivo para el trabajo, no salir con él a espacios públicos, lavarlo frecuentemente con agua caliente (60°C o más) y separado de ropa personal; el uniforme puede portar microorganismos del ambiente de trabajo que se transportan al exterior o viceversa','No es necesario uniforme específico','Solo cambiarlo cuando está visiblemente sucio'],c:1},
    {q:'¿Qué medidas de higiene son específicas para el manejo de ceras en el servicio de depilación?',o:['No hay medidas específicas para ceras','No reutilizar cera contaminada con restos de piel o vellos (usar siempre espátulas limpias y descartarlas después de cada pasada), usar cera en pot individual por clienta o limpiar y desinfectar el calentador entre clientas, no introducir la espátula usada de vuelta en el pot compartido; la cera contaminada puede transmitir infecciones por estafilococos y otros patógenos','Usar la misma espátula para toda la sesión','La cera caliente esteriliza automáticamente cualquier contaminante'],c:1},
    {q:'¿Cómo se documenta el protocolo de bioseguridad en un centro estético profesional?',o:['No es necesario documentar, basta con hacerlo','Se documenta en un manual de procedimientos que incluye: protocolos de limpieza y desinfección por área, frecuencia, productos usados y diluciones, manejo de residuos, uso de EPP, protocolo de accidentes y formación del personal; la documentación es exigida en inspecciones sanitarias y demuestra el compromiso del establecimiento con la seguridad','Solo documentar si hubo un accidente','La documentación es solo para empresas grandes'],c:1},
  ],
};
const EVAL_BIOSEGURIDAD_AVANZADO = {
  id:'bioseguridad-avanzado',
  titulo:'Test Avanzado — Bioseguridad e Higiene en Estética',
  categoria:'General',
  nivel:'Avanzado',
  minimoAprobacion:10,
  preguntas:[
    {q:'¿Cuál es la diferencia entre infección cruzada, autoinfección y reinfección en el contexto estético y cómo se previene cada una?',o:['Son exactamente lo mismo','La infección cruzada ocurre entre clientas por instrumentos o superficies contaminadas (prevención: desinfección entre clientas); la autoinfección es cuando la propia clienta contamina zonas sanas desde zonas infectadas (prevención: evaluar antes de tratar); la reinfección es cuando una clienta ya tratada vuelve a infectarse (prevención: tratar la causa raíz y el entorno); cada una requiere estrategias de prevención específicas','Solo la infección cruzada existe en estética','Todas se previenen solo con guantes'],c:1},
    {q:'¿Cuál es el fundamento microbiológico del uso de alcohol al 70% vs hipoclorito de sodio en desinfección de superficies estéticas?',o:['Son equivalentes para todas las superficies','El alcohol al 70% desnaturaliza proteínas bacterianas y disuelve lípidos de membranas virales; es efectivo en bacterias vegetativas y virus con envoltura pero ineficaz contra esporas y virus sin envoltura; el hipoclorito de sodio es oxidante más amplio, efectivo contra más microorganismos incluyendo esporas, pero corrosivo para algunos materiales; la elección depende del tipo de superficie y el nivel de descontaminación requerido','El hipoclorito siempre es mejor que el alcohol','El alcohol es siempre superior al hipoclorito'],c:1},
    {q:'¿Qué es la cadena de infección y en qué eslabón puede intervenir más efectivamente una operadora estética?',o:['Es un concepto solo médico sin aplicación en estética','La cadena incluye: agente infeccioso, reservorio, puerta de salida, vía de transmisión, puerta de entrada y huésped susceptible; la operadora puede interrumpir la cadena principalmente en la vía de transmisión (desinfección, EPP, técnica aséptica) y en la puerta de entrada (integridad de piel, no tratar zonas lesionadas); actuar en múltiples eslabones simultáneamente maximiza la prevención','Solo se puede intervenir en el agente infeccioso','La cadena de infección no aplica en estética no invasiva'],c:1},
    {q:'¿Cómo se diseña un programa completo de bioseguridad para un centro estético con múltiples operadoras en Uruguay?',o:['No es necesario un programa formal','Se diseña con: manual de procedimientos de higiene y desinfección por área, cronograma de limpieza profunda, registro de incidentes, política de EPP, protocolo de manejo de accidentes, formación inicial y continua de operadoras, auditorías periódicas internas y preparación para inspecciones del MSP/Intendencia; en Uruguay la habilitación sanitaria requiere condiciones mínimas y el programa demuestra cumplimiento','Solo un cartel con instrucciones en el baño','Solo aplicar lo mínimo para pasar la inspección'],c:1},
    {q:'¿Qué riesgos específicos de bioseguridad presenta el tratamiento con láser o IPL y cómo se mitigan?',o:['El láser no genera riesgos de bioseguridad','El humo generado por la vaporización del tejido puede contener partículas biológicas viables (virus del papiloma, bacterias); la protección incluye mascarilla con filtro adecuado (N95 o específica para humo de láser), sistema de evacuación de humos del equipo, ventilación adecuada de la cabina y protección ocular certificada para la longitud de onda del equipo','Solo se necesitan guantes','El humo del láser no contiene material biológico'],c:1},
    {q:'¿Cómo evalúa el impacto de un brote de infección en un centro estético y cuáles son los pasos de respuesta?',o:['Esperar a que pase solo sin intervenir','Identificar los casos (clientas o operadoras afectadas), determinar el agente probable y la vía de transmisión, revisar todos los protocolos de higiene en busca de fallas, desinfección profunda del establecimiento, comunicar a las autoridades sanitarias si corresponde, informar a las clientas potencialmente expuestas y documentar todo el proceso de respuesta y las medidas correctivas implementadas','Solo desinfectar más frecuente y continuar','Solo actuar si el MSP lo exige'],c:1},
    {q:'¿Qué implica el concepto de "precauciones universales" y cómo se aplica en estética?',o:['Solo usar guantes con clientas que declaran tener enfermedades','Tratar a TODAS las clientas como potencialmente portadoras de agentes infecciosos independientemente de su apariencia o antecedentes declarados; esto implica usar EPP siempre, desinfectar entre clientas siempre y seguir los protocolos sin excepción; es el estándar de oro de la bioseguridad porque muchas infecciones son asintomáticas o no declaradas','Solo aplicar precauciones extra con clientas de riesgo conocido','Las precauciones universales son solo para entornos médicos'],c:1},
    {q:'¿Cómo afecta la humedad y la temperatura del ambiente en un centro estético al crecimiento de microorganismos?',o:['No tienen ningún efecto sobre los microorganismos','Los microorganismos crecen mejor en ambientes húmedos y cálidos; una humedad relativa elevada (>60%) favorece el crecimiento de hongos y bacterias en superficies; la temperatura entre 20-37°C es óptima para la mayoría de patógenos; mantener el ambiente ventilado, seco y a temperatura controlada es parte de la estrategia de bioseguridad pasiva','Solo la suciedad visible favorece el crecimiento microbiano','La temperatura solo importa para los equipos de aparatología'],c:1},
    {q:'¿Qué consideraciones de bioseguridad específicas aplican al tratamiento de clientas inmunocomprometidas (VIH, quimioterapia, diabetes descompensada)?',o:['Se tratan exactamente igual que cualquier clienta','Las clientas inmunocomprometidas tienen mayor susceptibilidad a infecciones y menor capacidad de respuesta; requieren evaluación médica previa para confirmar que el tratamiento es seguro, precauciones adicionales de asepsia, evitar procedimientos que comprometan la barrera cutánea, mayor seguimiento post-sesión y derivación inmediata ante cualquier signo de infección; el riesgo fluye en ambas direcciones','Solo requieren guantes adicionales','Los inmunocomprometidos están contraindicados para todos los tratamientos estéticos'],c:1},
    {q:'¿Qué es la vigilancia epidemiológica en el contexto de un centro estético y cuándo debe activarse?',o:['Es exclusivamente una función del Ministerio de Salud','Es el monitoreo activo de la salud de clientas y operadoras para detectar patrones inusuales de infecciones o reacciones adversas asociadas a los tratamientos; debe activarse cuando dos o más clientas presentan la misma infección o reacción en un período cercano y en relación al mismo servicio; obliga a revisar protocolos, desinfectar exhaustivamente y reportar al MSP si corresponde','No aplica en estética, solo en hospitales','Solo activarla si la clienta presenta fiebre alta'],c:1},
    {q:'¿Cómo se certifica la competencia en bioseguridad de una operadora estética en Uruguay y por qué es relevante?',o:['No existe certificación en bioseguridad para estética en Uruguay','La formación y certificación en bioseguridad demuestra que la operadora conoce y aplica los protocolos correctos; aunque Uruguay no tiene una certificación única obligatoria para estética, el MSP y las Intendencias pueden requerir evidencia de formación en inspecciones; una operadora certificada reduce el riesgo legal ante un accidente o infección, protege su reputación y genera confianza en las clientas','Solo los médicos necesitan certificación en bioseguridad','La certificación solo importa para trabajar en hospitales'],c:1},
    {q:'¿Cuál es el rol de la operadora en la educación de las clientas sobre higiene relacionada con los tratamientos?',o:['No es rol de la operadora educar sobre higiene','La operadora debe informar a la clienta sobre cuidados de higiene pre y post tratamiento (no rasurar zonas con irritación, mantener la zona tratada limpia, no tocar con manos sucias, reportar cualquier signo de infección); una clienta informada es parte activa de la prevención; la educación fortalece la confianza, mejora los resultados y reduce el riesgo de complicaciones infecciosas','Solo informar si la clienta pregunta','La higiene post-tratamiento es responsabilidad exclusiva de la clienta'],c:1},
  ],
};
const EVAL_RF_BASICO = {
  id:'rf-basico',
  titulo:'Test Básico — Radiofrecuencia Corporal y Facial',
  categoria:'Radiofrecuencia / HIFU',
  nivel:'Básico',
  minimoAprobacion:10,
  preguntas:[
    {q:'¿Qué es la radiofrecuencia (RF) en estética?',o:['Un tipo de láser para eliminar manchas','Una tecnología que usa corriente eléctrica alterna de alta frecuencia que genera calor en los tejidos por resistencia, estimulando el colágeno y mejorando la piel sin cirugía','Un ultrasonido de alta intensidad','Una técnica de masaje con vibración eléctrica'],c:1},
    {q:'¿Cuál es el efecto principal de la radiofrecuencia sobre la piel?',o:['Elimina grasa de forma permanente en una sesión','Estimula los fibroblastos para producir nuevo colágeno y elastina, mejorando la firmeza, la flacidez y la textura de la piel','Depila el vello definitivamente','Blanquea las manchas pigmentadas'],c:1},
    {q:'¿En qué capa de la piel actúa principalmente la radiofrecuencia?',o:['Solo en la epidermis superficial','En la dermis profunda y el tejido subcutáneo, donde se encuentran los fibroblastos y las fibras de colágeno','Solo en la hipodermis grasa','En el músculo únicamente'],c:1},
    {q:'¿Es invasiva la radiofrecuencia estética?',o:['Sí, requiere agujas para penetrar','Sí, requiere anestesia local','No, es completamente no invasiva en su modalidad estética','Sí, deja cicatrices temporales'],c:2},
    {q:'¿Cuál es la sensación habitual durante la radiofrecuencia?',o:['Dolor intenso y quemadura inmediata','Calor progresivo y agradable en la zona tratada, similar a una piedra caliente','Frío intenso','Corriente eléctrica dolorosa en la superficie'],c:1},
    {q:'¿Para qué indicaciones se usa la radiofrecuencia facial?',o:['Depilación facial definitiva','Rejuvenecimiento, reafirmación, reducción de arrugas y mejora de la flacidez facial y del cuello','Eliminación de manchas pigmentadas profundas','Tratamiento del acné activo severo'],c:1},
    {q:'¿Para qué indicaciones se usa la radiofrecuencia corporal?',o:['Solo para reducción de grasa','Reafirmación de piel flácida, reducción de celulitis, mejora del contorno corporal y complemento post-tratamientos reductores como criolipólisis o cavitación','Depilación corporal','Solo para espalda y abdomen'],c:1},
    {q:'¿Cuántas sesiones se recomiendan generalmente en un protocolo de radiofrecuencia?',o:['1 sola sesión es suficiente','Entre 6 y 10 sesiones espaciadas cada 7-15 días, seguidas de mantenimientos periódicos','20 sesiones diarias','Solo 2 sesiones en total'],c:1},
    {q:'¿Cuándo se empiezan a notar los resultados de la radiofrecuencia?',o:['Inmediatamente con resultado definitivo','Algunos resultados se notan desde las primeras sesiones, con mejora progresiva; el máximo resultado se ve entre 1 y 3 meses al completar el ciclo por la neocolagenogénesis','Solo al año de tratamiento','Los resultados son solo temporales de 24 horas'],c:1},
    {q:'¿Cuál es una contraindicación absoluta de la radiofrecuencia?',o:['Tener flacidez leve','Marcapasos, implantes metálicos activos en la zona, embarazo o tumores malignos','Piel con arrugas finas','Ser mayor de 40 años'],c:1},
    {q:'¿Qué cuidado post-sesión es esencial tras la radiofrecuencia?',o:['Exposición solar directa para fijar el calor','Hidratación, protector solar SPF 50+ y evitar exposición solar y calor intenso las primeras 48 horas','Exfoliación agresiva inmediata','Aplicar hielo durante 2 horas'],c:1},
    {q:'¿Qué gel o medio de contacto se usa durante la radiofrecuencia?',o:['Aceite mineral espeso','Gel conductor específico que facilita el deslizamiento del cabezal, mejora la transmisión de la energía y protege la epidermis','Crema hidratante común','No se necesita ningún medio de contacto'],c:1},
  ],
};
const EVAL_RF_INTERMEDIO = {
  id:'rf-intermedio',
  titulo:'Test Intermedio — Radiofrecuencia Corporal y Facial',
  categoria:'Radiofrecuencia / HIFU',
  nivel:'Intermedio',
  minimoAprobacion:10,
  preguntas:[
    {q:'¿Cuál es la diferencia entre radiofrecuencia monopolar, bipolar y multipolar?',o:['Solo cambia el nombre comercial, el efecto es idéntico','La monopolar usa un electrodo activo y una placa de retorno; la corriente atraviesa tejidos profundos (mayor penetración); la bipolar usa dos electrodos en el mismo cabezal con penetración más superficial y controlada; la multipolar combina varios electrodos para cobertura uniforme; cada modalidad tiene indicaciones específicas según profundidad y zona','La monopolar es siempre más segura','La bipolar solo funciona en rostro'],c:1},
    {q:'¿Qué es la impedancia tisular y cómo influye en el resultado de la radiofrecuencia?',o:['La temperatura superficial de la piel','La resistencia que ofrece el tejido al paso de la corriente eléctrica; varía según el tipo de tejido (grasa vs músculo vs dermis) y el contenido de agua; la RF genera más calor en tejidos de mayor impedancia; conocer esto permite ajustar la potencia según el área','El nivel de colágeno en la dermis','No tiene relación con el resultado'],c:1},
    {q:'¿Cuál es la temperatura terapéutica objetivo en el tejido durante la radiofrecuencia?',o:['20-30°C (temperatura ambiente)','37°C (temperatura corporal normal)','Entre 40-45°C en dermis profunda para estimular fibroblastos sin dañar tejidos; superar los 45°C puede causar quemaduras','70°C para máxima eficacia'],c:2},
    {q:'¿Cómo se diferencia el protocolo de RF facial del corporal?',o:['Son exactamente iguales','En facial se usan cabezales más pequeños, potencias más bajas, movimientos más precisos y se evitan zonas delicadas como párpados y labios; en corporal se usan cabezales más grandes, mayor potencia y se cubren zonas extensas con movimientos más amplios','Solo varía el tiempo de sesión','El corporal siempre usa más potencia sin importar la zona'],c:1},
    {q:'¿Por qué la radiofrecuencia es un complemento ideal post-criolipólisis o post-cavitación?',o:['No tiene ninguna relación con esos tratamientos','Después de reducir volumen graso con criolipólisis o cavitación, la piel puede quedar con cierta flacidez; la RF actúa en la dermis reafirmando y estimulando colágeno en la zona, completando el remodelado corporal','La RF anula el efecto de la criolipólisis','Solo se usa antes de esos tratamientos'],c:1},
    {q:'¿Qué es el efecto de "tightening" inmediato post-RF y a qué se debe?',o:['Es solo un efecto placebo','Es la contracción inmediata de las fibras de colágeno existentes por el calor; da una sensación de firmeza transitoria que se nota al finalizar la sesión; el efecto duradero viene semanas después por la neocolagenogénesis','Es el resultado definitivo del tratamiento','Es un signo de quemadura superficial'],c:1},
    {q:'¿Cómo debe adaptarse el protocolo de RF en piel muy fina o sensible?',o:['Con mayor potencia para compensar el grosor','Con potencia reducida, movimiento más rápido del cabezal, mayor cantidad de gel y monitoreo continuo de la respuesta de la piel; la piel fina tiene menor tolerancia al calor y mayor riesgo de quemadura con parámetros estándar','Igual que cualquier otro tipo de piel','La RF está contraindicada en piel fina'],c:1},
    {q:'¿Qué es la RF fraccionada y en qué se diferencia de la RF continua?',o:['Son exactamente iguales','La RF fraccionada aplica energía en microzonas separadas dejando tejido intacto entre ellas, generando microlesiones que estimulan la regeneración con menor tiempo de recuperación; la RF continua aplica energía de forma uniforme en toda la zona con menor downtime pero efecto más gradual','La RF fraccionada es siempre más segura','La RF continua genera mejores resultados siempre'],c:1},
    {q:'¿Cuánto debe moverse el cabezal de RF durante la aplicación y por qué?',o:['Debe mantenerse quieto en cada punto durante 60 segundos','Debe moverse de forma continua y uniforme para distribuir el calor homogéneamente y evitar la acumulación térmica excesiva en un punto que podría causar quemaduras; la velocidad de movimiento varía según la potencia y el protocolo','Solo se mueve al cambiar de zona','El movimiento reduce la eficacia del tratamiento'],c:1},
    {q:'¿Qué contraindicación relativa debe evaluarse en una clienta con rellenos de ácido hialurónico recientes?',o:['No hay ninguna consideración','El calor de la RF puede degradar o desplazar el relleno inyectable; se recomienda esperar mínimo 2-4 semanas post-relleno antes de aplicar RF sobre esa zona, o evitar directamente la zona si el relleno es reciente','La RF potencia el efecto del relleno','Se contraindica para siempre si tiene rellenos'],c:1},
    {q:'¿Cómo se evalúa la respuesta correcta de la piel durante la RF?',o:['El dolor intenso es señal de eficacia','Eritema leve y uniforme en la zona tratada, calor tolerable referido por la clienta y temperatura superficial controlada; ausencia total de reacción puede indicar potencia insuficiente; eritema intenso, dolor agudo o cambios epidérmicos indican exceso de energía','No hay forma de evaluar la respuesta en tiempo real','Solo se evalúa al mes del tratamiento'],c:1},
    {q:'¿Qué zona del rostro requiere mayor precaución al aplicar radiofrecuencia y por qué?',o:['Las mejillas porque tienen más grasa','La zona periorbital (contorno de ojos) por la proximidad al globo ocular, el menor grosor de la piel y la mayor sensibilidad; se usan parámetros muy reducidos, cabezales específicos y en algunos protocolos protección ocular','La frente porque tiene más arrugas','El cuello porque es más largo'],c:1},
  ],
};
const EVAL_RF_AVANZADO = {
  id:'rf-avanzado',
  titulo:'Test Avanzado — Radiofrecuencia Corporal y Facial',
  categoria:'Radiofrecuencia / HIFU',
  nivel:'Avanzado',
  minimoAprobacion:10,
  preguntas:[
    {q:'¿Cuál es el mecanismo molecular por el que la RF estimula la síntesis de colágeno a largo plazo?',o:['El calor hidrata directamente las fibras de colágeno','El calor desnaturaliza parcialmente las fibras de colágeno existentes en la dermis; esto activa fibroblastos que responden sintetizando nuevo colágeno tipo I y III como parte del proceso de reparación; simultáneamente inhibe las metaloproteinasas (MMP) que degradan el colágeno; el proceso completo de neocolagenogénesis tarda entre 4-12 semanas','La RF congela las células para preservar el colágeno','El calor activa directamente los genes del colágeno sin intervención celular'],c:1},
    {q:'¿Qué diferencia biofísica existe entre la RF monopolar y la RF bipolar en términos de distribución del campo eléctrico en el tejido?',o:['Son idénticas en distribución del campo','En RF monopolar el campo eléctrico se distribuye desde el electrodo activo hasta la placa de retorno pasando por todo el tejido intermedio (mayor profundidad de penetración, hasta 20mm); en RF bipolar el campo se concentra entre los dos electrodos del cabezal (penetración más superficial, 2-4mm, mayor control); la elección depende de la profundidad del tejido objetivo','La monopolar siempre es más superficial','La bipolar penetra más profundo que la monopolar'],c:1},
    {q:'¿Cómo interactúa la RF con el tejido adiposo en el contexto de tratamientos reductores?',o:['La RF no tiene efecto sobre el tejido adiposo','El calor generado por la RF en el tejido adiposo puede activar la lipólisis (liberación de ácidos grasos de los adipocitos) y mejorar la microcirculación local; en aplicaciones corporales a mayor profundidad, la RF complementa la acción de cavitación o criolipólisis actuando en capas más superficiales del tejido adiposo y en la dermis que los cubre','La RF destruye adipocitos igual que la cavitación','La RF no puede tratar el tejido adiposo de ninguna forma'],c:1},
    {q:'¿Cuál es la base científica de combinar RF con otras tecnologías en protocolos de remodelado corporal facial?',o:['La combinación es solo marketing sin base científica','La sinergia se basa en actuar en capas diferentes del tejido: HIFU en profundidad (SMAS/grasa profunda), RF en dermis media-profunda, y técnicas superficiales en epidermis; cada tecnología tiene su capa objetivo y su mecanismo específico; la combinación genera una estimulación integral de toda la columna tisular imposible con una sola tecnología','Son incompatibles por interferencia electromagnética','La combinación reduce la eficacia de cada tecnología'],c:1},
    {q:'¿Qué es el tiempo de relajación térmica del colágeno y cómo guía el diseño del protocolo de RF?',o:['Es el tiempo que tarda la piel en enfriarse visiblemente','Es el tiempo que tarda el colágeno en disipar el 50% del calor absorbido; para el colágeno dérmico es de varios segundos; esto permite diseñar ciclos de calentamiento y pausa que acumulan calor en la dermis sin superar el umbral de daño tisular; el movimiento continuo del cabezal distribuye el calor aprovechando este principio','Solo importa para el láser, no para la RF','El colágeno no tiene tiempo de relajación térmica'],c:1},
    {q:'¿Cómo se diseña un protocolo de RF facial completo para rejuvenecimiento en una clienta de fototipo III con flacidez moderada?',o:['Se aplica la máxima potencia en toda la cara por igual','Se realiza diagnóstico cutáneo previo; se selecciona RF multipolar o combinada; se inicia con potencia media ajustada al fototipo III, aumentando progresivamente según tolerancia; se tratan por zonas (frente, mejillas, contorno mandibular, cuello) con movimientos uniformes; temperatura objetivo 40-42°C; se complementa con RF fraccionada si hay textura; protocolo de 8 sesiones cada 10 días con mantenimiento mensual post-ciclo','Igual que para fototipo I sin ajustes','Solo se trata el contorno mandibular en flacidez moderada'],c:1},
    {q:'¿Por qué la RF puede ser más segura que el HIFU en zonas con rellenos previos de mayor antigüedad (más de 6 meses)?',o:['No hay diferencia de seguridad entre RF e HIFU sobre rellenos','Los rellenos maduros (más de 6 meses) están más integrados al tejido y son relativamente más resistentes al calor difuso de la RF que a los puntos focales de alta temperatura del HIFU; sin embargo ambas tecnologías requieren precaución; la RF con parámetros moderados sobre rellenos estables tiene menor riesgo que el HIFU cuyo calor focal puede degradar o desplazar el relleno más fácilmente','El HIFU es siempre más seguro sobre rellenos','Ambas están absolutamente contraindicadas sobre rellenos de cualquier antigüedad'],c:1},
    {q:'¿Cómo afecta el contenido de agua de los tejidos a la eficacia de la RF y qué implica para la preparación del cliente?',o:['El contenido de agua no afecta la RF','Los tejidos bien hidratados tienen mejor conductividad eléctrica y responden más eficientemente a la RF; la deshidratación aumenta la impedancia y puede reducir la eficacia o distribuir el calor irregularmente; se recomienda que el cliente esté bien hidratado antes de la sesión y el operador debe usar gel conductor adecuado','La deshidratación mejora el resultado de la RF','Solo importa la hidratación de la piel superficial'],c:1},
    {q:'¿Qué complicación puede surgir de aplicar RF con potencia excesiva en zona de papada sin control de temperatura?',o:['Solo eritema leve que desaparece en minutos','Quemadura dérmica con posible hipopigmentación, fibrosis o cicatriz; la papada tiene piel más fina y sensible con poca grasa de amortiguación; requiere parámetros conservadores, movimiento constante y monitoreo de temperatura superficial; las quemaduras por RF en papada pueden dejar secuelas visibles difíciles de tratar','El exceso de potencia solo reduce la eficacia','La papada tolera siempre mayor potencia que otras zonas'],c:1},
    {q:'¿Cuál es la evidencia clínica que respalda el uso de RF para laxitud cutánea facial leve-moderada?',o:['No existe evidencia científica para RF en rejuvenecimiento','Múltiples estudios controlados y revisiones sistemáticas demuestran mejoría estadísticamente significativa en laxitud cutánea facial medida por histología (aumento de colágeno), ecografía dérmica y escalas clínicas validadas; el nivel de evidencia es mayor para RF monopolar y fraccionada; los resultados son más predecibles en laxitud leve-moderada que en severa','Solo hay evidencia anecdótica','Los estudios muestran que la RF no funciona mejor que el placebo'],c:1},
    {q:'¿Cómo documenta y evalúa el operador avanzado la evolución de una clienta en un ciclo de RF facial?',o:['Solo pregunta si se siente mejor','Fotografías estandarizadas (misma iluminación, ángulo, distancia) antes del ciclo y después de cada 3 sesiones; medición de elasticidad con cutómetro si está disponible; evaluación clínica de firmeza y textura; registro de parámetros usados en cada sesión; comparación objetiva al finalizar el ciclo y a los 3 meses post-ciclo para evaluar la neocolagenogénesis completa','Solo una foto antes y otra después del ciclo completo','La RF no tiene indicadores objetivos de evolución'],c:1},
    {q:'¿Qué distingue a un operador certificado en RF corporal y facial de uno sin formación específica?',o:['Solo haber usado el equipo varias veces','El operador certificado conoce la física de la RF, las diferencias entre modalidades, los parámetros seguros por zona y fototipo, la temperatura terapéutica objetivo, las contraindicaciones e interacciones con otros tratamientos, la técnica de aplicación correcta, la evaluación de la respuesta tisular en tiempo real y la integración de la RF en protocolos combinados; esto garantiza eficacia, seguridad y resultados reproducibles','Tener el equipo más moderno','La certificación no cambia los resultados clínicos'],c:1},
  ],
};
const EVAL_GESTION_BASICO = {
  id:'gestion-basico',
  titulo:'Test Básico — Gestión de Agenda y Administración del Centro Estético',
  categoria:'General',
  nivel:'Básico',
  minimoAprobacion:10,
  preguntas:[
    {q:'¿Por qué es importante tener una agenda organizada como operadora estética en Uruguay?',o:['Solo para saber cuántas clientas vienen por día','Una agenda bien organizada evita superposiciones, reduce cancelaciones, mejora la puntualidad, permite planificar los ingresos y genera una imagen profesional que las clientas uruguayas valoran y recomiendan','Solo si se trabaja en una clínica grande','La agenda no influye en la rentabilidad del negocio'],c:1},
    {q:'¿Qué información mínima debe registrarse al agendar un turno?',o:['Solo el nombre de la clienta','Nombre, teléfono de contacto, servicio solicitado, duración estimada, fecha y hora; idealmente también si es clienta nueva o frecuente para preparar la atención adecuada','Solo el servicio y la hora','Solo el teléfono para confirmar'],c:1},
    {q:'¿Cuál es la política de cancelación más adecuada para una operadora independiente en Uruguay?',o:['No tener ninguna política y aceptar todo','Comunicar con anticipación que se requiere aviso de cancelación con al menos 24 horas; esto protege el tiempo de la operadora sin ser agresivo; en Uruguay el trato debe ser firme pero amable','Cobrar multa alta ante cualquier cancelación','Cancelar el turno si llega 1 minuto tarde'],c:1},
    {q:'¿Cómo debe manejarse el tiempo entre turnos para evitar retrasos acumulados?',o:['No dejar ningún tiempo entre clientas para maximizar ingresos','Reservar 10-15 minutos entre turnos para limpieza, preparación del espacio y pequeños retrasos; en Uruguay las clientas suelen charlar y la puntualidad es flexible; el margen evita el efecto dominó de retrasos','Dejar 1 hora entre cada clienta','Solo dejar tiempo si el tratamiento es largo'],c:1},
    {q:'¿Qué es un no-show y cómo afecta a una operadora independiente en Uruguay?',o:['Una clienta que llega puntual','Una clienta que no se presenta sin avisar; genera pérdida de tiempo e ingresos; se maneja con confirmación por WhatsApp 24 horas antes y opcionalmente una política de seña para tratamientos largos','No tiene impacto económico real','Solo ocurre con clientas nuevas'],c:1},
    {q:'¿Cuál es la ventaja de usar una herramienta digital para gestionar la agenda?',o:['Solo las clínicas grandes necesitan herramientas digitales','Permite acceder desde el celular, enviar recordatorios automáticos, ver disponibilidad en tiempo real, registrar el historial de clientas y evitar errores de superposición','Las herramientas digitales son muy complicadas','Solo sirven si se tiene más de 10 clientas por día'],c:1},
    {q:'¿Cómo se calcula el precio de un servicio para asegurar rentabilidad?',o:['Copiar el precio de la competencia','Sumar el costo directo (insumos, gel, sábanas, energía proporcional), el costo de tiempo (valor hora de la operadora) y un margen de ganancia; muchas operadoras subestiman su valor hora y trabajan a pérdida sin darse cuenta','Poner el precio más bajo posible','El precio lo decide solo la clienta'],c:1},
    {q:'¿Qué es el ticket promedio y por qué es un indicador importante?',o:['El precio del tratamiento más caro','El promedio de lo que gasta cada clienta por visita; subirlo no requiere más clientas sino más valor por visita','Solo importa en grandes clínicas','Es el precio mínimo que cobra la operadora'],c:1},
    {q:'¿Por qué es importante registrar los insumos consumidos por sesión?',o:['Solo para saber cuánto gel se usa','Para calcular el costo real de cada tratamiento, detectar desperdicios, hacer pedidos anticipados y no quedarse sin insumos en el momento inadecuado','Los insumos son siempre el mismo costo fijo','Solo para clínicas con stock grande'],c:1},
    {q:'¿Cuál es la diferencia entre ingreso y ganancia en un centro estético?',o:['Son exactamente lo mismo','El ingreso es todo lo que entra; la ganancia es lo que queda después de restar todos los costos; muchas operadoras en Uruguay confunden ambos y creen ganar más de lo que realmente ganan','La ganancia siempre es el 50% del ingreso','Solo importa el ingreso total'],c:1},
    {q:'¿Cómo debe manejarse el cobro en una operadora independiente uruguaya?',o:['Solo efectivo, sin registro','Ofrecer múltiples formas de pago (efectivo, transferencia, mercadopago); registrar cada cobro aunque sea en una planilla simple; el registro protege ante dudas y permite ver la evolución real del negocio','Solo por transferencia bancaria','No es necesario registrar los cobros'],c:1},
    {q:'¿Cuál es la importancia de la ficha de clienta en la administración del centro estético?',o:['Solo es útil para tratamientos médicos','Es la base de la personalización y la continuidad del servicio; registrar el historial de tratamientos, reacciones, preferencias y objetivos permite dar seguimiento real y demostrar profesionalismo','Solo sirve para clientas con muchas sesiones','La ficha es obligatoria solo en clínicas con médicos'],c:1},
  ],
};
const EVAL_GESTION_INTERMEDIO = {
  id:'gestion-intermedio',
  titulo:'Test Intermedio — Gestión de Agenda y Administración del Centro Estético',
  categoria:'General',
  nivel:'Intermedio',
  minimoAprobacion:10,
  preguntas:[
    {q:'¿Cómo se calcula el punto de equilibrio mensual de una operadora estética independiente?',o:['No se puede calcular en un negocio pequeño','Es el ingreso mínimo necesario para cubrir todos los costos fijos más los costos variables proporcionales; saber el punto de equilibrio permite conocer cuántas sesiones mínimas se necesitan vender por mes para no perder dinero','Solo se calcula en empresas grandes','Es siempre el 50% del ingreso máximo posible'],c:1},
    {q:'¿Qué estrategia de paquetes o planes de sesiones mejora la rentabilidad y fidelización en Uruguay?',o:['No ofrecer paquetes, solo sesiones sueltas','Ofrecer packs de sesiones con pequeño descuento; asegura ingresos anticipados, compromete a la clienta con el ciclo completo y mejora resultados; en Uruguay las clientas valoran sentir que hacen una buena inversión','Ofrecer descuentos del 50% para atraer clientas','Solo ofrecer paquetes a clientas frecuentes'],c:1},
    {q:'¿Cómo se gestiona el stock de insumos para evitar faltantes sin sobrestock?',o:['Comprar en grandes cantidades siempre','Llevar un registro básico de stock, definir un punto de reposición y conocer el tiempo de entrega del proveedor; en Uruguay los proveedores pueden tener demoras','Comprar solo cuando se acaba','El stock no es responsabilidad de la operadora'],c:1},
    {q:'¿Qué implica la facturación en Uruguay para una operadora estética independiente?',o:['No es necesario facturar en servicios estéticos','En Uruguay toda actividad económica debe ser declarada; las operadoras independientes pueden trabajar como monotributistas; emitir recibos no solo es una obligación legal sino que da imagen profesional','Solo facturar si el cliente lo pide','La facturación solo aplica a clínicas con más de 5 empleados'],c:1},
    {q:'¿Cómo se diferencia un costo fijo de un costo variable en el negocio estético?',o:['Son iguales, todos los costos son fijos','El costo fijo se paga siempre independientemente de cuántas sesiones se hagan (alquiler, cuota del equipo); el costo variable cambia con el volumen (gel, sábanas, guantes); conocer ambos permite calcular el precio real','Solo existen costos variables en estética','El alquiler es un costo variable'],c:1},
    {q:'¿Qué es la tasa de retorno de clientas y cómo se mejora?',o:['El porcentaje de clientas que pagan en efectivo','El porcentaje de clientas que vuelven después de la primera sesión; se mejora con seguimiento post-sesión, recordatorio de próximo turno, resultados reales y trato personalizado','Solo importa para negocios con más de 100 clientas','No se puede medir en un negocio pequeño'],c:1},
    {q:'¿Cómo se maneja la relación con proveedores de insumos estéticos en Uruguay?',o:['Comprar siempre al proveedor más barato sin evaluar calidad','Evaluar calidad, precio, tiempo de entrega y condiciones de pago; tener al menos 2 proveedores alternativos para insumos críticos; en Uruguay el mercado de insumos estéticos es relativamente pequeño y las referencias importan','Solo comprar en el exterior por internet','Los proveedores no tienen ninguna influencia en la calidad del servicio'],c:1},
    {q:'¿Qué información debe incluir una planilla básica de control de ingresos?',o:['Solo el total mensual','Fecha, clienta, servicio realizado, forma de pago, monto cobrado y observaciones; permite identificar los servicios más rentables y preparar declaraciones impositivas','Solo los montos en efectivo','No es necesario llevar planilla'],c:1},
    {q:'¿Cómo se establece una política de precios actualizada en Uruguay considerando la inflación?',o:['Mantener los mismos precios para siempre','Revisar los precios al menos cada 6 meses considerando la variación del IPC y el aumento de insumos; en Uruguay la inflación afecta especialmente los insumos importados; una operadora que no actualiza precios trabaja cada vez más por menos','Aumentar los precios un 100% cada año','Solo aumentar si la competencia lo hace primero'],c:1},
    {q:'¿Qué es el valor de vida del cliente (CLV) y por qué importa en estética?',o:['El precio de la sesión más cara','El ingreso total que genera una clienta durante toda su relación con la operadora; justifica invertir en fidelización y calidad de servicio más que en captación permanente de clientas nuevas','Solo importa en cadenas de franquicias','No aplica a negocios estéticos pequeños'],c:1},
    {q:'¿Cómo se organiza el espacio físico de trabajo para maximizar la eficiencia?',o:['No importa la organización si el tratamiento es bueno','Un espacio ordenado con los insumos accesibles reduce los tiempos muertos entre clientas, transmite profesionalismo y facilita el cumplimiento de los protocolos de higiene','Solo importa la decoración estética','El orden del espacio no influye en la calidad del servicio'],c:1},
    {q:'¿Qué ventaja tiene llevar un registro histórico de tratamientos por clienta?',o:['Ninguna ventaja práctica','Permite ver la evolución, detectar patrones de respuesta, recordar contraindicaciones, personalizar el protocolo y proteger legalmente ante reclamos','Solo sirve para clientas con tratamientos médicos','Es demasiado trabajo para un negocio pequeño'],c:1},
  ],
};
const EVAL_GESTION_AVANZADO = {
  id:'gestion-avanzado',
  titulo:'Test Avanzado — Gestión de Agenda y Administración del Centro Estético',
  categoria:'General',
  nivel:'Avanzado',
  minimoAprobacion:10,
  preguntas:[
    {q:'¿Cómo se diseña un plan de negocio básico para una operadora estética independiente en Uruguay?',o:['No es necesario planificar en un negocio pequeño','Incluye: descripción del servicio y público objetivo, análisis de costos fijos y variables, proyección de ingresos, cálculo del punto de equilibrio, estrategia de captación y fidelización, y plan de crecimiento a 12 meses; tener un plan escrito multiplica las probabilidades de sostenibilidad','Solo las grandes clínicas necesitan plan de negocio','Un plan de negocio es solo para solicitar préstamos'],c:1},
    {q:'¿Cómo se implementa un sistema de seguimiento de métricas clave en un centro estético pequeño?',o:['Las métricas son para empresas grandes','Con una planilla simple: registrar semanalmente nuevas clientas, sesiones realizadas, ingresos totales, tasa de retorno, no-shows y ticket promedio; revisar mensualmente para detectar tendencias','Solo medir ingresos totales mensuales','Las métricas no aportan valor en negocios pequeños'],c:1},
    {q:'¿Qué implica la delegación en el contexto de una operadora que crece e incorpora otra operadora en Uruguay?',o:['Delegar es perder el control del negocio','Implica documentar los protocolos y estándares de atención, seleccionar a la persona adecuada, capacitarla correctamente y hacer seguimiento; en Uruguay el crecimiento requiere pasar de hacerlo todo a liderar un equipo manteniendo la calidad del servicio','Solo se puede delegar tareas administrativas','Delegar significa que la operadora deja de trabajar'],c:1},
    {q:'¿Cómo se gestiona el flujo de caja mensual para evitar problemas de liquidez?',o:['Solo contar el dinero al final del mes','Proyectar los ingresos esperados y los gastos comprometidos; en Uruguay los meses de verano y post-fiestas pueden tener baja demanda; prever estos ciclos evita sobresaltos financieros','El flujo de caja solo importa con empleados','Usar todo el dinero que entra sin planificación'],c:1},
    {q:'¿Qué estrategia de diversificación de servicios es más recomendable para una operadora independiente en Uruguay?',o:['Ofrecer todos los servicios posibles desde el inicio','Especializarse primero en 2-3 servicios y dominarlos antes de ampliar; agregar servicios complementarios que compartan equipos o clientas para maximizar el valor por clienta sin multiplicar los costos; la especialización genera reputación y el boca a boca en Uruguay','Nunca diversificar, solo hacer un servicio','Comprar todos los equipos disponibles'],c:1},
    {q:'¿Cómo se establece una estrategia de fijación de precios competitiva en Uruguay?',o:['Siempre ser el más barato del mercado','Investigar el rango de precios del mercado local, posicionarse en el rango que corresponde a la calidad ofrecida, calcular que el precio cubra costos más margen y comunicar el valor; en Uruguay el precio medio-alto bien justificado es más sostenible que la guerra de precios','Copiar exactamente los precios de la competencia','El precio lo dicta únicamente el mercado'],c:1},
    {q:'¿Qué es el marketing de referidos y cómo se implementa en una operadora estética uruguaya?',o:['Publicar en redes sociales sin estrategia','Un programa donde clientas satisfechas reciben un beneficio por referir nuevas clientas; en Uruguay el boca a boca ya ocurre naturalmente pero formalizarlo con un incentivo lo potencia; debe ser sostenible económicamente','Solo funciona en cadenas grandes','Los programas de referidos son ilegales en Uruguay'],c:1},
    {q:'¿Cómo se planifica la inversión en un nuevo equipo estético para una operadora independiente uruguaya?',o:['Comprar el equipo más caro disponible','Calcular el ROI: cuántas sesiones necesita hacer para recuperar la inversión; evaluar la demanda real en su zona, el precio de mercado del servicio y si puede financiarse sin comprometer la liquidez','Comprar el equipo más barato para reducir riesgo','La inversión en equipos no requiere análisis'],c:1},
    {q:'¿Qué implica la gestión de la reputación online para una operadora estética en Uruguay?',o:['Las reseñas online no importan en Uruguay','Monitorear y responder reseñas en Google y Facebook, solicitar reseñas a clientas satisfechas, mantener perfiles actualizados y responder consultas rápidamente; en Uruguay el mercado estético es muy referido por búsqueda en Instagram y Google Maps','Solo responder si hay una crítica muy negativa','La reputación online se construye sola'],c:1},
    {q:'¿Cómo se maneja el burnout frecuente en operadoras estéticas independientes?',o:['Trabajar más horas para generar más ingresos','Reconocer las señales (agotamiento, falta de motivación), establecer límites de horario y días de descanso, calcular correctamente los precios para no sobrecargar la agenda; la sostenibilidad del negocio depende de la salud de la operadora','El burnout no existe en trabajos vocacionales','Solo ocurre en empleadas, no en independientes'],c:1},
    {q:'¿Qué criterios debe evaluar una operadora para decidir si formalizar su actividad en Uruguay?',o:['La formalización nunca conviene a una operadora pequeña','Evaluar el volumen de ingresos, los beneficios de la formalización (acceso a crédito, facturación, cobertura FONASA, jubilación) y los costos impositivos; en Uruguay el monotributo es el camino más común y protege a la operadora','Solo formalizarse si tiene empleados','La formalización siempre genera más costos que beneficios'],c:1},
    {q:'¿Cuál es la diferencia entre gestionar un centro propio y alquilar espacio en otro centro en Uruguay?',o:['Son exactamente lo mismo económicamente','En centro propio los costos fijos son mayores pero el control y el crecimiento potencial son totales; alquilando espacio los costos fijos son menores y la flexibilidad mayor; la elección depende del volumen de clientas, el capital disponible y los objetivos; en Uruguay el modelo de alquiler de sillón es creciente','Siempre es mejor tener local propio','Alquilar espacio siempre es más rentable'],c:1},
  ],
};
const EVALUACIONES_TECNICAS = [EVAL_APARATOLOGIA_BASICO, EVAL_APARATOLOGIA_INTERMEDIO, EVAL_APARATOLOGIA_AVANZADO, EVAL_SKINCARE_BASICO, EVAL_SKINCARE_INTERMEDIO, EVAL_SKINCARE_AVANZADO, EVAL_ATENCION_BASICO, EVAL_ATENCION_INTERMEDIO, EVAL_ATENCION_AVANZADO, EVAL_GESTION_BASICO, EVAL_GESTION_INTERMEDIO, EVAL_GESTION_AVANZADO, EVAL_BIOSEGURIDAD_BASICO, EVAL_BIOSEGURIDAD_INTERMEDIO, EVAL_BIOSEGURIDAD_AVANZADO, EVAL_MASAJES_BASICO, EVAL_MASAJES_INTERMEDIO, EVAL_MASAJES_AVANZADO, EVAL_LASER_BASICO, EVAL_LASER_INTERMEDIO, EVAL_LASER_AVANZADO, EVAL_NDYAG_BASICO, EVAL_NDYAG_INTERMEDIO, EVAL_NDYAG_AVANZADO, EVAL_SOPRANO_BASICO, EVAL_SOPRANO_INTERMEDIO, EVAL_SOPRANO_AVANZADO, EVAL_CAVITACION_BASICO, EVAL_CAVITACION_AVANZADO, EVAL_CRIOLIPOLISIS_BASICO, EVAL_CRIOLIPOLISIS_INTERMEDIO, EVAL_CRIOLIPOLISIS_AVANZADO, EVAL_RF_BASICO, EVAL_RF_INTERMEDIO, EVAL_RF_AVANZADO, EVAL_EXILIS_BASICO, EVAL_EXILIS_INTERMEDIO, EVAL_EXILIS_AVANZADO, EVAL_EMSCULPT_BASICO, EVAL_EMSCULPT_INTERMEDIO, EVAL_EMSCULPT_AVANZADO, EVAL_HYDRAFACIAL_BASICO, EVAL_HYDRAFACIAL_AVANZADO, EVAL_BRONCEADO_BASICO, EVAL_BRONCEADO_AVANZADO, EVAL_PRESOTERAPIA, EVAL_HIFU_BASICO, EVAL_HIFU_INTERMEDIO, EVAL_HIFU_AVANZADO];
const CERT_NIVELES = [
  {
    id:'nivel-1',
    titulo:'Nivel 1',
    subtitulo:'Fundamentos',
    icon:'📚',
    certs:['Bioseguridad','Skincare','Atención al Cliente'],
  },
  {
    id:'nivel-2',
    titulo:'Nivel 2',
    subtitulo:'Técnicas Corporales',
    icon:'💆',
    certs:['Masajes','Cavitación','Criolipólisis','Emsculpt','Bronceado'],
  },
  {
    id:'nivel-3',
    titulo:'Nivel 3',
    subtitulo:'Aparatología Avanzada',
    icon:'🏅',
    certs:['Aparatología','Láser','Nd:YAG','Soprano','Exilis','HydraFacial','HIFU'],
  },
];
const CERT_KEYWORDS = {
  'Bioseguridad':['bioseguridad','higiene','desinfeccion','desinfección','seguridad'],
  'Skincare':['skincare','skin care','facial','piel','limpieza facial'],
  'Atención al Cliente':['atencion al cliente','atención al cliente','cliente','recepcion','recepción'],
  'Masajes':['masaje','masajes','drenaje'],
  'Cavitación':['cavitacion','cavitación'],
  'Criolipólisis':['criolipolisis','criolipólisis','crio'],
  'Emsculpt':['emsculpt','ems','electroestimulacion','electroestimulación'],
  'Bronceado':['bronceado','bronceador'],
  'Aparatología':['aparatologia','aparatología','equipo','equipos'],
  'Láser':['laser','láser','depilacion laser','depilación láser','laser depilacion','láser depilación'],
  'Nd:YAG':['nd:yag','nd yag','ndyag','ndyac'],
  'Soprano':['soprano','titanium','ice'],
  'Exilis':['exilis'],
  'HydraFacial':['hydrafacial','hidrofacial','hydra facial'],
  'HIFU':['hifu','12d','22d','liposonix'],
};
const CAPACITACION_REGLAS = {
  descansoDias: 7,
  maxHabilitacionesDia: 3,
};

// ── Core helpers ──
function getMaterial(id){ return (DB.get('materiales')||[]).find(m=>m.id===parseInt(id)); }
function catPill(cat){
  const cls={'Láser Depilación':'cat-laser','Radiofrecuencia / HIFU':'cat-hifu',
             'Pressoterapia':'cat-presso','Electroestimulación':'cat-electro','General':'cat-laser',
             'Bioseguridad':'cat-fund','Skincare':'cat-fund','Atención al Cliente':'cat-fund',
             'Masajes':'cat-body','Cavitación':'cat-body','Criolipólisis':'cat-body','Emsculpt':'cat-body','Bronceado':'cat-body',
             'Aparatología':'cat-advanced','Láser':'cat-advanced','Nd:YAG':'cat-advanced','Soprano':'cat-advanced',
             'Exilis':'cat-advanced','HydraFacial':'cat-advanced','HIFU':'cat-advanced'};
  return `<span class="cat-pill ${cls[cat]||''}">${CAT_ICONS[cat]||'📋'} ${cat}</span>`;
}
function normCertText(v){
  return String(v||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
}
function materialCertText(m){
  return normCertText([m.titulo,m.categoria,m.desc,m.tipo].filter(Boolean).join(' '));
}
function certMatchesText(cert,text){
  const terms=[cert].concat(CERT_KEYWORDS[cert]||[]).map(normCertText);
  return terms.some(term=>term&&text.includes(term));
}
function certMatchesMaterial(cert,m){
  const text=materialCertText(m);
  if(certMatchesText(cert,text)) return true;
  if(cert==='Láser' && m.categoria==='Láser Depilación') return true;
  if(cert==='HIFU' && m.categoria==='Radiofrecuencia / HIFU') return true;
  if(cert==='Emsculpt' && m.categoria==='Electroestimulación') return true;
  return false;
}
function certMatchesEvaluacion(cert,ev){
  const text=materialCertText({titulo:ev.titulo,categoria:ev.categoria,desc:''});
  if(certMatchesText(cert,text)) return true;
  if(cert==='Láser' && ev.categoria==='Láser Depilación') return true;
  if(cert==='HIFU' && ev.categoria==='Radiofrecuencia / HIFU') return true;
  return false;
}
function certPassesFilter(cert,items,evals){
  if(!matFilter) return true;
  if(cert===matFilter) return true;
  if(items.some(m=>m.categoria===matFilter || certMatchesMaterial(matFilter,m))) return true;
  if(evals.some(ev=>ev.categoria===matFilter || certMatchesEvaluacion(matFilter,ev))) return true;
  return false;
}
function renderCertMaterialRow(m){
  return `<div class="material-row cert-subrow">
    <div class="material-icon">${MAT_ICONS[m.tipo]||'📌'}</div>
    <div class="material-body">
      <div class="material-title">${m.titulo}</div>
      <div class="material-sub">${m.desc||'—'}</div>
    </div>
    <div class="cert-actions">
      <span class="badge ${m.obligatorio==='obligatorio'?'badge-obligatorio':'badge-opcional'}">${m.obligatorio==='obligatorio'?'Obligatorio':'Opcional'}</span>
      <span class="badge ${m.estado==='activo'?'badge-green':'badge-gray'}">${m.estado}</span>
      ${m.url?`<a href="${m.url}" target="_blank" class="action-btn" style="color:var(--blue)">🔗 Ver</a>`:''}
      ${isSuperAdmin()||canEdit()?`<button class="action-btn" onclick="openMaterialModal(${m.id})" style="margin-left:2px">✏️</button>`:''}
    </div>
  </div>`;
}
function certEscapeHTML(value){
  if(typeof escapeHTML==='function') return escapeHTML(value);
  return String(value??'').replace(/[&<>"']/g,function(ch){
    return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[ch];
  });
}
function renderCertEvaluacionRow(ev,allResultados){
  const resultados=allResultados.filter(r=>r.evaluacionId===ev.id);
  const aprobadasEv=resultados.filter(r=>r.estado==='aprobada').length;
  const opIdActual=getOperadoraIdCapacitacionActual();
  const regla=opIdActual ? validarReglasCapacitacion(opIdActual,ev) : {ok:true,motivos:[]};
  const bloqueada=opIdActual && !regla.ok && !puedeOmitirReglasCapacitacion();
  const accion=puedeTomarEvaluacion()
    ? bloqueada
      ? `<button class="action-btn" disabled title="${certEscapeHTML(regla.motivos.join(' '))}" style="opacity:.55;cursor:not-allowed">Bloqueada</button>`
      : `<button class="action-btn" onclick="openEvaluacionModal('${ev.id}')" style="color:var(--blue)">Tomar evaluación</button>`
    : '';
  return `<div class="material-row cert-subrow">
    <div class="material-icon">🧪</div>
    <div class="material-body">
      <div class="material-title">${ev.titulo}</div>
      <div class="material-sub">${ev.preguntas.length} preguntas multiple choice. Aprobación: ${ev.minimoAprobacion}/${ev.preguntas.length}. ${aprobadasEv} aprobadas · ${resultados.length} intentos.${bloqueada?` ${certEscapeHTML(regla.motivos[0]||'Acceso bloqueado por criterio de capacitación.')}`:''}</div>
    </div>
    <div class="cert-actions">
      <span class="badge badge-obligatorio">Obligatorio</span>
      <span class="badge badge-green">${ev.categoria}</span>
      ${accion}
    </div>
  </div>`;
}

function getOperadoraIdCapacitacionActual(){
  if(typeof isOperadoraUser==='function' && isOperadoraUser() && !isSuperAdmin() && !canEdit()){
    return parseInt(currentUser?.operadora_id)||0;
  }
  return 0;
}
function puedeOmitirReglasCapacitacion(){
  return !!(isSuperAdmin() || canEdit());
}
function normalizarFechaCapacitacion(v){
  const raw=String(v||'').slice(0,10);
  return /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : '';
}
function diasEntreFechas(a,b){
  const da=new Date(`${normalizarFechaCapacitacion(a)}T00:00:00`);
  const db=new Date(`${normalizarFechaCapacitacion(b)}T00:00:00`);
  if(Number.isNaN(da.getTime())||Number.isNaN(db.getTime())) return 999;
  return Math.floor((db-da)/(24*60*60*1000));
}
function fechaMasDias(fecha,dias){
  const d=new Date(`${normalizarFechaCapacitacion(fecha)}T00:00:00`);
  if(Number.isNaN(d.getTime())) return '';
  d.setDate(d.getDate()+dias);
  return d.toISOString().slice(0,10);
}
function evalCertBaseId(ev){
  return String(ev?.id||'').replace(/-(basico|intermedio|avanzado)$/,'');
}
function evalNivelIndex(ev){
  const id=String(ev?.id||'');
  if(id.endsWith('-basico')) return 0;
  if(id.endsWith('-intermedio')) return 1;
  if(id.endsWith('-avanzado')) return 2;
  const nivel=normCertText(ev?.nivel||'');
  if(nivel.includes('basico')) return 0;
  if(nivel.includes('intermedio')) return 1;
  if(nivel.includes('avanzado')) return 2;
  return 0;
}
function evaluacionesPreviasRequeridas(ev){
  const base=evalCertBaseId(ev);
  const nivel=evalNivelIndex(ev);
  return EVALUACIONES_TECNICAS
    .filter(e=>evalCertBaseId(e)===base && evalNivelIndex(e)<nivel)
    .sort((a,b)=>evalNivelIndex(a)-evalNivelIndex(b));
}
function evaluacionAprobadaPorOperadora(opId,evId){
  return getEvaluacionResultados().some(r=>
    parseInt(r.operadoraId)===parseInt(opId) &&
    r.evaluacionId===evId &&
    r.estado==='aprobada'
  );
}
function capacitacionesAprobadasOperadora(opId){
  return (DB.get('capacitaciones')||[]).filter(c=>
    parseInt(c.operadoraId)===parseInt(opId) &&
    c.resultado==='aprobada'
  );
}
function ultimaCapacitacionAprobada(opId){
  const caps=capacitacionesAprobadasOperadora(opId)
    .map(c=>({fecha:normalizarFechaCapacitacion(c.fecha||c.ts),titulo:c.obs||c.categoria||'capacitación'}))
    .filter(c=>c.fecha)
    .sort((a,b)=>b.fecha.localeCompare(a.fecha));
  return caps[0]||null;
}
function capacitacionesAprobadasEnFecha(opId,fecha){
  const ymd=normalizarFechaCapacitacion(fecha);
  return capacitacionesAprobadasOperadora(opId).filter(c=>normalizarFechaCapacitacion(c.fecha||c.ts)===ymd).length;
}
function validarReglasCapacitacion(opId,evaluacion){
  const motivos=[];
  const hoy=today();
  const previas=evaluacionesPreviasRequeridas(evaluacion);
  const faltantes=previas.filter(ev=>!evaluacionAprobadaPorOperadora(opId,ev.id));
  if(faltantes.length){
    motivos.push(`Debe aprobar primero: ${faltantes.map(ev=>ev.nivel||ev.titulo).join(', ')}.`);
  }
  const ultima=ultimaCapacitacionAprobada(opId);
  if(ultima){
    const pasaron=diasEntreFechas(ultima.fecha,hoy);
    if(pasaron<CAPACITACION_REGLAS.descansoDias){
      const desde=fechaMasDias(ultima.fecha,CAPACITACION_REGLAS.descansoDias);
      motivos.push(`Debe descansar ${CAPACITACION_REGLAS.descansoDias} días entre capacitaciones. Próxima disponible: ${fmtDate(desde)}.`);
    }
  }
  const hechasHoy=capacitacionesAprobadasEnFecha(opId,hoy);
  if(hechasHoy>=CAPACITACION_REGLAS.maxHabilitacionesDia){
    motivos.push(`Máximo diario alcanzado: ${CAPACITACION_REGLAS.maxHabilitacionesDia} habilitaciones/capacitaciones aprobadas en un día.`);
  }
  return {ok:!motivos.length,motivos};
}
function confirmarExcepcionCapacitacion(opId,evaluacion,regla){
  if(regla.ok) return true;
  if(!puedeOmitirReglasCapacitacion()) return false;
  const op=getOp(opId);
  const nombre=op ? `${op.nombre||''} ${op.apellido||''}`.trim() : `operadora #${opId}`;
  return confirm(`Esta capacitación está bloqueada para ${nombre} por criterio interno:\n\n- ${regla.motivos.join('\n- ')}\n\n¿Autorizar excepción administrativa para "${evaluacion.titulo}"?`);
}

// ── Habilitación check ──
function estaHabilitada(operadoraId, categoria){
  const habs=(DB.get('habilitaciones')||[]).filter(
    h=>h.operadoraId===parseInt(operadoraId) && h.categoria===categoria
  );
  const activa=habs.find(h=>h.estado==='activa');
  if(activa) return {ok:true,msg:`Habilitada desde ${fmtDate(activa.fecha)}.`};
  const susp=habs.find(h=>h.estado==='suspendida');
  if(susp) return {ok:false,msg:'Habilitación suspendida.'};
  if(habs.length) return {ok:false,msg:'Habilitación vencida.'};
  return {ok:false,msg:'Sin habilitación para esta categoría.'};
}

function getHabilitacionesByOp(operadoraId){
  return (DB.get('habilitaciones')||[]).filter(h=>h.operadoraId===parseInt(operadoraId));
}
function getCapacitacionesByOp(operadoraId){
  return (DB.get('capacitaciones')||[]).filter(c=>c.operadoraId===parseInt(operadoraId));
}

// ── Materiales ──
let matFilter='';
let matTipoFilter='';
function puedeTomarEvaluacion(){
  return !!(isSuperAdmin() || canEdit() || (typeof isOperadoraUser === 'function' && isOperadoraUser()));
}
function renderMateriales(){
  const mats=(DB.get('materiales')||[]).filter(m=>!matTipoFilter || matTipoFilter==='test' || m.tipo===matTipoFilter);
  const evals=(!matTipoFilter || matTipoFilter==='test') ? EVALUACIONES_TECNICAS : [];
  const allResultados=getEvaluacionResultados();
  const intentos=allResultados.length;
  const aprobadas=allResultados.filter(r=>r.estado==='aprobada').length;
  const niveles=CERT_NIVELES.map((nivel,nivelIndex)=>{
    const certs=nivel.certs.map(cert=>{
      const items=matTipoFilter==='test' ? [] : mats.filter(m=>certMatchesMaterial(cert,m));
      const evs=evals.filter(ev=>certMatchesEvaluacion(cert,ev));
      if(!certPassesFilter(cert,items,evs)) return '';
      const total=items.length+evs.length;
      return `<details class="cert-item">
        <summary class="cert-item-summary">
          <span class="cert-item-title">${cert}</span>
          <span class="cert-count">${total ? `${total} contenido${total===1?'':'s'}` : 'Sin contenido cargado'}</span>
        </summary>
        <div class="cert-item-body">
          ${evs.map(ev=>renderCertEvaluacionRow(ev,allResultados)).join('')}
          ${items.map(renderCertMaterialRow).join('')}
          ${!total?`<div class="cert-empty">
            <span>Preparado para cargar materiales, videos o tests de ${cert}.</span>
            ${isSuperAdmin()||canEdit()?`<button class="action-btn" onclick="openMaterialModal(null,'${cert}')">+ Agregar material</button>`:''}
          </div>`:''}
        </div>
      </details>`;
    }).filter(Boolean).join('');
    if(!certs) return '';
    return `<details class="cert-level" ${nivelIndex===0?'open':''}>
      <summary class="cert-level-summary">
        <span class="cert-level-icon">${nivel.icon}</span>
        <span>
          <span class="cert-level-title">${nivel.titulo}</span>
          <span class="cert-level-subtitle">${nivel.subtitulo}</span>
        </span>
        <span class="cert-level-total">${nivel.certs.length} certificaciones</span>
      </summary>
      <div class="cert-level-body">${certs}</div>
    </details>`;
  }).filter(Boolean).join('');
  const header=`<div class="cert-overview">
    <div>
      <div class="cert-overview-title">Mapa de certificaciones DepiMóvil</div>
      <div class="cert-overview-sub">Niveles colapsables con certificaciones individuales, tests y materiales asociados.</div>
    </div>
    <div class="cert-overview-stats">
      <span>${aprobadas} aprobadas</span>
      <span>${intentos} intentos</span>
    </div>
  </div>`;
  document.getElementById('materialesContent').innerHTML = header + (niveles ||
    `<div class="empty-state"><div class="icon">📚</div><h3>Sin certificaciones para el filtro seleccionado</h3></div>`
  );
}
function filterMateriales(cat){ matFilter=cat; renderMateriales(); }
function filterMaterialesTipo(tipo){ matTipoFilter=tipo || ''; renderMateriales(); }

function getEvaluacionResultados(){
  return DB.get('evaluaciones_resultados')||[];
}
function getEvaluacionById(id){
  return EVALUACIONES_TECNICAS.find(e=>e.id===id);
}

async function emitirCertificadoOperadora(opId, resultado, evaluacion){
  try{
    const resp=await api('/api/operadoras/'+opId+'/certificados',{
      method:'POST',
      body:JSON.stringify({
        categoria:evaluacion.categoria,
        evaluacion_id:evaluacion.id,
        evaluacion_titulo:evaluacion.titulo,
        resultado_id:resultado.id,
        correctas:resultado.correctas,
        total:resultado.total,
        porcentaje:resultado.porcentaje,
      })
    });
    const docs=DB.get('documentos_certificados')||[];
    if(resp.documento){
      DB.set('documentos_certificados',[resp.documento,...docs.filter(d=>parseInt(d.id)!==parseInt(resp.documento.id))]);
    }
    if(resp.whatsapp?.enviado){
      showToast('🏅 Certificado emitido y enviado por WhatsApp');
    }else if(resp.whatsapp?.omitido){
      showToast('🏅 Certificado ya emitido; WhatsApp no duplicado');
    }else if(resp.whatsapp?.error){
      showToast('🏅 Certificado emitido. WhatsApp pendiente: '+resp.whatsapp.error,'warn');
    }else{
      showToast('🏅 Certificado emitido y WhatsApp en cola');
    }
    return resp;
  }catch(e){
    showToast('⚠️ La habilitación quedó activa, pero no se pudo emitir/enviar el certificado: '+e.message,'warn');
    return null;
  }
}

function renderEvaluaciones(){
  const allResultados=getEvaluacionResultados();
  const intentos=allResultados.length;
  const aprobadas=allResultados.filter(r=>r.estado==='aprobada').length;
  return `<div class="table-container" style="margin-bottom:16px">
    <div style="padding:12px 16px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap">
      <div>
        <div style="font-size:13px;font-weight:700;color:var(--text)">📝 Evaluaciones Técnicas</div>
        <div style="font-size:12px;color:var(--text3);margin-top:3px">Tests internos de habilitación técnica. Al aprobar, registra capacitación y habilitación automática.</div>
      </div>
      <span style="font-size:12px;color:var(--text3)">${aprobadas} aprobadas · ${intentos} intentos</span>
    </div>
    ${renderEvaluacionesRows(allResultados)}
  </div>`;
}

function openEvaluacionModal(evaluacionId){
  if(!puedeTomarEvaluacion()){showToast('⚠️ Sin permisos','warn');return;}
  const evaluacion=getEvaluacionById(evaluacionId);
  if(!evaluacion) return;
  const ops=(DB.get('operadoras')||[]).filter(o=>o.estado==='activa');
  const isOpUser=typeof isOperadoraUser==='function'&&isOperadoraUser()&&!isSuperAdmin()&&!canEdit();
  const opId=isOpUser ? parseInt(currentUser?.operadora_id) : 0;
  const opActual=opId ? (getOp(opId)||ops.find(o=>parseInt(o.id)===opId)) : null;
  if(isOpUser&&!opId){showToast('⚠️ Tu usuario no tiene ficha de operadora vinculada','warn');return;}
  if(isOpUser){
    const regla=validarReglasCapacitacion(opId,evaluacion);
    if(!regla.ok){
      showToast('⚠️ '+regla.motivos[0],'warn');
      return;
    }
  }
  document.getElementById('evalId').value=evaluacionId;
  document.getElementById('evalTitulo').textContent=evaluacion.titulo;
  const evalOpWrap=document.getElementById('evalOperadora')?.closest('.form-field');
  if(evalOpWrap) evalOpWrap.style.display=isOpUser?'none':'';
  document.getElementById('evalOperadora').innerHTML=isOpUser
    ? `<option value="${opId}" selected>${opActual ? `${opActual.nombre||''} ${opActual.apellido||''}`.trim() : 'Mi ficha'}</option>`
    : `<option value="">Seleccionar operadora...</option>`+
      ops.map(o=>`<option value="${o.id}">${o.nombre} ${o.apellido}</option>`).join('');
  document.getElementById('evalResumen').innerHTML=
    `Aprobación mínima: <strong>${evaluacion.minimoAprobacion}/${evaluacion.preguntas.length}</strong>. Si aprueba, queda habilitada para <strong>${evaluacion.categoria}</strong>.`;
  document.getElementById('evalPreguntas').innerHTML=evaluacion.preguntas.map((p,i)=>`
    <div style="padding:12px 0;border-bottom:1px solid var(--border)">
      <div style="font-size:13px;font-weight:700;color:var(--text);margin-bottom:8px">${i+1}. ${p.q}</div>
      <div style="display:grid;gap:7px">
        ${p.o.map((op,j)=>`<label style="display:flex;align-items:flex-start;gap:8px;font-size:13px;color:var(--text2);line-height:1.35;cursor:pointer">
          <input type="radio" name="eval_q_${i}" value="${j}" style="margin-top:2px"/>
          <span>${op}</span>
        </label>`).join('')}
      </div>
    </div>`).join('');
  openModal('modalEvaluacion');
}

async function saveEvaluacionTecnica(){
  const evaluacion=getEvaluacionById(gv('evalId'));
  if(!evaluacion){showToast('⚠️ Evaluación no encontrada','warn');return;}
  const opId=parseInt(gv('evalOperadora'));
  if(!opId){showToast('⚠️ Seleccioná una operadora','warn');return;}
  const reglaCapacitacion=validarReglasCapacitacion(opId,evaluacion);
  const excepcionAdministrativa=!reglaCapacitacion.ok && confirmarExcepcionCapacitacion(opId,evaluacion,reglaCapacitacion);
  if(!reglaCapacitacion.ok && !excepcionAdministrativa){
    showToast('⚠️ '+reglaCapacitacion.motivos[0],'warn');
    return;
  }
  let correctas=0;
  const respuestas=[];
  for(let i=0;i<evaluacion.preguntas.length;i++){
    const checked=document.querySelector(`input[name="eval_q_${i}"]:checked`);
    if(!checked){showToast(`⚠️ Falta responder la pregunta ${i+1}`,'warn');return;}
    const valor=parseInt(checked.value);
    respuestas.push(valor);
    if(valor===evaluacion.preguntas[i].c) correctas++;
  }
  const aprobada=correctas>=evaluacion.minimoAprobacion;
  const op=getOp(opId);
  const resultados=getEvaluacionResultados();
  const nId=Math.max(0,...resultados.map(r=>parseInt(r.id)||0))+1;
  const resultado={
    id:nId,
    evaluacionId:evaluacion.id,
    titulo:evaluacion.titulo,
    operadoraId:opId,
    categoria:evaluacion.categoria,
    fecha:today(),
    correctas,
    total:evaluacion.preguntas.length,
    porcentaje:Math.round((correctas/evaluacion.preguntas.length)*100),
    estado:aprobada?'aprobada':'no_aprobada',
    respuestas,
    responsable:currentUser?.email||'—',
    ts:new Date().toISOString(),
  };
  resultados.push(resultado);
  DB.set('evaluaciones_resultados',resultados);

  const caps=DB.get('capacitaciones')||[];
  const capId=Math.max(0,...caps.map(c=>parseInt(c.id)||0))+1;
  caps.push({
    id:capId,
    operadoraId:opId,
    categoria:evaluacion.categoria,
    fecha:today(),
    resultado:aprobada?'aprobada':'no_aprobada',
    modalidad:'evaluacion',
    obs:`${evaluacion.titulo}: ${correctas}/${evaluacion.preguntas.length} (${resultado.porcentaje}%).${excepcionAdministrativa?' Excepción administrativa autorizada.':''}`,
    responsable:currentUser?.email||'—',
    ts:resultado.ts,
  });
  DB.set('capacitaciones',caps);

  // Evaluaciones HIFU: solo nivel avanzado habilita y certifica; básico e intermedio solo informe
  const esHIFU = evaluacion.id.startsWith('hifu-');
  const esLaser = evaluacion.id.startsWith('laser-');
  const esNdYAG = evaluacion.id.startsWith('ndyag-');
  const esExilis = evaluacion.id.startsWith('exilis-');
  const esEmsculpt = evaluacion.id.startsWith('emsculpt-');
  const esHydrafacial = evaluacion.id.startsWith('hydrafacial-');
  const esSoprano = evaluacion.id.startsWith('soprano-');
  const esBronceado = evaluacion.id.startsWith('bronceado-');
  const esAparatologia = evaluacion.id.startsWith('aparatologia-');
  const esMasajes = evaluacion.id.startsWith('masajes-');
  const esCavitacion = evaluacion.id.startsWith('cavitacion-');
  const esSkincare = evaluacion.id.startsWith('skincare-');
  const esCriolipolisis = evaluacion.id.startsWith('criolipolisis-');
  const esAtencion = evaluacion.id.startsWith('atencion-');
  const esBioseguridad = evaluacion.id.startsWith('bioseguridad-');
  const esRF = evaluacion.id.startsWith('rf-');
  const esGestion = evaluacion.id.startsWith('gestion-');
  const esHabilitante = (!esHIFU && !esLaser && !esNdYAG && !esExilis && !esEmsculpt && !esHydrafacial && !esSoprano && !esBronceado && !esAparatologia && !esMasajes && !esCavitacion && !esSkincare && !esCriolipolisis && !esAtencion && !esBioseguridad && !esRF && !esGestion) || ['hifu-avanzado','laser-avanzado','ndyag-avanzado','exilis-avanzado','emsculpt-avanzado','hydrafacial-avanzado','soprano-avanzado','bronceado-avanzado','aparatologia-avanzado','masajes-avanzado','cavitacion-avanzado','skincare-avanzado','criolipolisis-avanzado','atencion-avanzado','bioseguridad-avanzado','rf-avanzado','gestion-avanzado'].includes(evaluacion.id);

  if(aprobada && esHabilitante){
    try{
      const saved=await api('/api/operadoras/'+opId+'/habilitaciones',{
        method:'POST',
        body:JSON.stringify({
          equipo_categoria:HAB_API_CATEGORIAS[evaluacion.categoria],
          categoria:evaluacion.categoria,
          estado:'activa',
          fecha_otorgamiento:today(),
          obs:`Habilitación automática por evaluación aprobada: ${correctas}/${evaluacion.preguntas.length}.${excepcionAdministrativa?' Excepción administrativa autorizada.':''}`,
        })
      });
      const habs=(DB.get('habilitaciones')||[]).filter(h=>!(h.id&&saved.id&&parseInt(h.id)===parseInt(saved.id)));
      habs.push(typeof mapHabilitacion==='function' ? mapHabilitacion(saved) : {
        id:saved.id,operadoraId:opId,categoria:evaluacion.categoria,fecha:today(),estado:'activa',ts:resultado.ts
      });
      DB.set('habilitaciones',habs);
      auditLog('CREATE','evaluacion',nId,`${op?.nombre||'Op #'+opId} aprobó ${correctas}/${evaluacion.preguntas.length}`);
      showToast(`✅ Evaluación aprobada (${correctas}/${evaluacion.preguntas.length}). Operadora habilitada.`);
      await emitirCertificadoOperadora(opId,resultado,evaluacion);
    }catch(e){
      showToast('⚠️ Aprobó, pero no se pudo crear la habilitación: '+e.message,'warn');
    }
  }else if(aprobada && (esHIFU || esLaser || esNdYAG || esExilis || esEmsculpt || esHydrafacial || esSoprano || esBronceado || esAparatologia || esMasajes || esCavitacion || esSkincare || esCriolipolisis || esAtencion || esBioseguridad || esRF || esGestion)){
    // Niveles básico e intermedio: solo informe, sin habilitación
    auditLog('CREATE','evaluacion',nId,`${op?.nombre||'Op #'+opId} aprobó ${evaluacion.titulo} ${correctas}/${evaluacion.preguntas.length}`);
    const nivel = evaluacion.nivel || '';
    const cert = esHIFU ? 'HIFU' : esNdYAG ? 'Nd:YAG' : esExilis ? 'Exilis Elite' : esEmsculpt ? 'Emsculpt' : esHydrafacial ? 'HydraFacial' : esSoprano ? 'Soprano Titanium ICE' : esBronceado ? 'Bronceado Orgánico' : esAparatologia ? 'Aparatología Estética' : esMasajes ? 'Masajes y Drenaje Linfático' : esCavitacion ? 'Cavitación Ultrasónica' : esSkincare ? 'Skincare y Cuidado de la Piel' : esCriolipolisis ? 'Criolipólisis' : esAtencion ? 'Atención al Cliente y Ventas en Estética' : esBioseguridad ? 'Bioseguridad e Higiene en Estética' : esRF ? 'Radiofrecuencia Corporal y Facial' : esGestion ? 'Gestión de Agenda y Administración' : 'Depilación Láser';
    showToast(`✅ Nivel ${nivel} aprobado (${correctas}/${evaluacion.preguntas.length}). Para obtener la habilitación ${cert} debés completar los 3 niveles.`);
  }else{
    auditLog('CREATE','evaluacion',nId,`${op?.nombre||'Op #'+opId} no aprobó ${correctas}/${evaluacion.preguntas.length}`);
    showToast(`❌ No aprobada (${correctas}/${evaluacion.preguntas.length}). No se otorgó habilitación.`,'warn');
  }
  closeModal('modalEvaluacion');
  renderMateriales();
  const fichaEl=document.getElementById('view-operadora-ficha');
  if(fichaEl&&fichaEl.classList.contains('active')) showOpFicha(opId);
}
function saveEvaluacionLaser(){
  return saveEvaluacionTecnica();
}

function openEvaluacionFromHash(){
  const hash = String(window.location.hash || '');
  const match = hash.match(/^#test=([^&]+)/);
  if(!match) return false;
  const evaluacionId = decodeURIComponent(match[1] || '');
  const evaluacion = getEvaluacionById(evaluacionId);
  if(!evaluacion) return false;
  if(typeof navigate === 'function') navigate('materiales');
  window.history.replaceState({},'',window.location.pathname + window.location.search);
  setTimeout(function(){ openEvaluacionModal(evaluacionId); }, 250);
  return true;
}

function openMaterialModal(id,categoriaSugerida){
  document.getElementById('modalMaterialTitle').textContent = id ? 'Editar Material' : 'Nuevo Material';
  if(id){
    const m=getMaterial(id); if(!m)return;
    sv('materialId',m.id); sv('materialTitulo',m.titulo); sv('materialTipo',m.tipo);
    sv('materialCategoria',m.categoria); sv('materialDesc',m.desc||'');
    sv('materialUrl',m.url||''); sv('materialEstado',m.estado); sv('materialObligatorio',m.obligatorio);
  } else {
    sv('materialId',''); sv('materialTitulo',''); sv('materialTipo','manual');
    sv('materialCategoria',categoriaSugerida||'General'); sv('materialDesc',''); sv('materialUrl','');
    sv('materialEstado','activo'); sv('materialObligatorio','obligatorio');
  }
  openModal('modalMaterial');
}

function saveMaterial(){
  const titulo=gv('materialTitulo').trim();
  if(!titulo){showToast('⚠️ El título es obligatorio','warn');return;}
  const mats=DB.get('materiales')||[];
  const id=gv('materialId');
  const data={titulo,tipo:gv('materialTipo'),categoria:gv('materialCategoria'),
    desc:gv('materialDesc').trim(),url:gv('materialUrl').trim(),
    estado:gv('materialEstado'),obligatorio:gv('materialObligatorio')};
  if(id){
    const ii=mats.findIndex(m=>m.id===parseInt(id));
    mats[ii]={...mats[ii],...data};
    auditLog('UPDATE','material',parseInt(id),titulo);
    showToast('✅ Material actualizado');
  } else {
    const nId=Math.max(0,...mats.map(m=>m.id))+1;
    mats.push({id:nId,...data,creadoEn:today()});
    auditLog('CREATE','material',nId,titulo);
    showToast('✅ Material creado');
  }
  DB.set('materiales',mats);
  closeModal('modalMaterial');
  renderMateriales();
}

// ── Capacitaciones ──
function openCapacitacionModal(operadoraId){
  if(!isSuperAdmin()&&!canEdit()){showToast('⚠️ Sin permisos','warn');return;}
  const ops=(DB.get('operadoras')||[]).filter(o=>o.estado==='activa');
  document.getElementById('capOpSelector').innerHTML=
    ops.map(o=>`<option value="${o.id}">${o.nombre} ${o.apellido}</option>`).join('');
  if(operadoraId){
    sv('capOperadoraId',operadoraId);
    sv('capOpSelector',operadoraId);
    document.getElementById('capOpWrap').style.display='none';
  } else {
    document.getElementById('capOpWrap').style.display='block';
  }
  sv('capId',''); sv('capFecha',today()); sv('capResultado','aprobada');
  sv('capModalidad','presencial'); sv('capObs','');
  openModal('modalCapacitacion');
}

function saveCapacitacion(){
  const opId=parseInt(gv('capOpSelector')||gv('capOperadoraId'));
  if(!opId){showToast('⚠️ Seleccioná una operadora','warn');return;}
  const caps=DB.get('capacitaciones')||[];
  const nId=Math.max(0,...caps.map(c=>c.id))+1;
  const op=getOp(opId);
  caps.push({
    id:nId, operadoraId:opId, categoria:gv('capCategoria'),
    fecha:gv('capFecha')||today(), resultado:gv('capResultado'),
    modalidad:gv('capModalidad'), obs:gv('capObs').trim(),
    responsable:currentUser?.email||'—', ts:new Date().toISOString(),
  });
  DB.set('capacitaciones',caps);
  auditLog('CREATE','capacitacion',nId,`${op?.nombre||'Op #'+opId} — ${gv('capCategoria')} — ${gv('capResultado')}`);
  closeModal('modalCapacitacion');
  showToast('✅ Capacitación registrada');
  // Refresh ficha if open
  const fichaEl=document.getElementById('view-operadora-ficha');
  if(fichaEl&&fichaEl.classList.contains('active')) showOpFicha(opId);
}

// ── Habilitaciones ──
function openHabilitacionModal(operadoraId){
  if(!isSuperAdmin()&&!canEdit()){showToast('⚠️ Sin permisos','warn');return;}
  const ops=(DB.get('operadoras')||[]).filter(o=>o.estado==='activa');
  document.getElementById('habOpSelector').innerHTML=
    ops.map(o=>`<option value="${o.id}">${o.nombre} ${o.apellido}</option>`).join('');
  if(operadoraId){
    sv('habOperadoraId',operadoraId);
    sv('habOpSelector',operadoraId);
    document.getElementById('habOpWrap').style.display='none';
  } else {
    document.getElementById('habOpWrap').style.display='block';
  }
  sv('habId',''); sv('habFecha',today()); sv('habEstado','activa'); sv('habObs','');
  openModal('modalHabilitacion');
}

async function saveHabilitacion(){
  const opId=parseInt(gv('habOpSelector')||gv('habOperadoraId'));
  const cat=gv('habCategoria');
  if(!opId){showToast('⚠️ Seleccioná una operadora','warn');return;}
  if(!cat){showToast('⚠️ Seleccioná una categoría','warn');return;}
  const op=getOp(opId);
  const payload={
    equipo_categoria:HAB_API_CATEGORIAS[cat]||cat,
    categoria:cat,
    estado:gv('habEstado'),
    fecha_otorgamiento:gv('habFecha')||today(),
    obs:gv('habObs').trim(),
  };
  try{
    const saved=await api('/api/operadoras/'+opId+'/habilitaciones',{method:'POST',body:JSON.stringify(payload)});
    const habs=(DB.get('habilitaciones')||[]).filter(h=>!(h.id&&saved.id&&parseInt(h.id)===parseInt(saved.id)));
    habs.push(mapHabilitacion(saved));
    DB.set('habilitaciones',habs);
    auditLog('CREATE','habilitacion',saved.id,`${op?.nombre||'Op #'+opId} → ${cat}`);
    closeModal('modalHabilitacion');
    showToast(`✅ Habilitada: ${op?.nombre||''} para ${cat}`);
    const fichaEl=document.getElementById('view-operadora-ficha');
    if(fichaEl&&fichaEl.classList.contains('active')) showOpFicha(opId);
  }catch(e){
    showToast('❌ Error guardando habilitación: '+e.message,'error');
  }
}

// ── Panel HTML helpers for fichas ──
function renderHabPanel(operadoraId){
  const habs=getHabilitacionesByOp(operadoraId);
  const categorias=CERT_NIVELES.flatMap(n=>n.certs);
  return `<div class="info-card full">
    <h4 style="display:flex;align-items:center;justify-content:space-between">
      ✅ Habilitaciones Técnicas
      ${canEdit()?`<button class="btn-add" style="font-size:12px;padding:5px 10px" onclick="openHabilitacionModal(${operadoraId})">+ Habilitar</button>`:''}
    </h4>
    <div class="hab-levels">
      ${CERT_NIVELES.map(nivel=>{
        const activas=nivel.certs.filter(cat=>estaHabilitada(operadoraId,cat).ok).length;
        return `<details class="hab-level" ${activas?'open':''}>
          <summary class="hab-level-summary">
            <span>${nivel.icon} ${nivel.titulo} — ${nivel.subtitulo}</span>
            <span>${activas}/${nivel.certs.length}</span>
          </summary>
          <div class="hab-grid">
            ${nivel.certs.map(cat=>{
              const chk=estaHabilitada(operadoraId,cat);
              const hab=habs.filter(h=>h.categoria===cat).slice(-1)[0];
              return `<div class="hab-card ${chk.ok?'enabled':'disabled-hab'}">
                <div class="hc-cat">${CAT_ICONS[cat]||'📋'} ${cat}</div>
                <div class="hc-status" style="color:${chk.ok?'var(--green)':'var(--red)'}">
                  ${chk.ok?'✅ Habilitada':'❌ Sin habilitación'}
                </div>
                ${hab?`<div class="hc-date">Desde: ${fmtDate(hab.fecha)}</div>`:''}
                ${hab&&hab.estado!=='activa'?`<div class="hc-date" style="color:var(--red)">${HAB_ESTADOS[hab.estado]||hab.estado}</div>`:''}
              </div>`;
            }).join('')}
          </div>
        </details>`;
      }).join('')}
    </div>
    ${habs.some(h=>h.categoria&&!categorias.includes(h.categoria))?`<div class="hab-grid" style="margin-top:10px">
      ${habs.filter(h=>h.categoria&&!categorias.includes(h.categoria)).map(h=>`<div class="hab-card ${h.estado==='activa'?'enabled':'disabled-hab'}">
        <div class="hc-cat">${CAT_ICONS[h.categoria]||'📋'} ${h.categoria}</div>
        <div class="hc-status" style="color:${h.estado==='activa'?'var(--green)':'var(--red)'}">${HAB_ESTADOS[h.estado]||h.estado}</div>
        ${h.fecha?`<div class="hc-date">Desde: ${fmtDate(h.fecha)}</div>`:''}
      </div>`).join('')}
    </div>`:''}
    ${habs.length?`<details style="margin-top:12px"><summary style="font-size:12px;color:var(--text3);cursor:pointer">Ver historial (${habs.length})</summary>
      <div style="margin-top:8px">${habs.sort((a,b)=>b.ts.localeCompare(a.ts)).map(h=>`
        <div style="padding:8px 0;border-bottom:1px solid var(--border);font-size:12px;display:flex;align-items:center;gap:10px">
          ${catPill(h.categoria)}
          <span class="badge ${h.estado==='activa'?'badge-green':h.estado==='suspendida'?'badge-yellow':'badge-red'}">${HAB_ESTADOS[h.estado]||h.estado}</span>
          <span style="color:var(--text3)">${fmtDate(h.fecha)}</span>
          <span style="color:var(--text3)">${h.responsable?.split('@')[0]||''}</span>
        </div>`).join('')}
      </div></details>`:''}
  </div>`;
}

function renderCapPanel(operadoraId){
  const caps=getCapacitacionesByOp(operadoraId).sort((a,b)=>b.ts.localeCompare(a.ts));
  const resColor={aprobada:'var(--green)',pendiente:'var(--yellow)',no_aprobada:'var(--red)'};
  return `<div class="info-card full">
    <h4 style="display:flex;align-items:center;justify-content:space-between">
      📋 Capacitaciones (${caps.length})
      ${canEdit()?`<button class="btn-add" style="font-size:12px;padding:5px 10px" onclick="openCapacitacionModal(${operadoraId})">+ Registrar</button>`:''}
    </h4>
    ${!caps.length?`<div style="color:var(--text3);font-size:13px;padding:8px 0">Sin capacitaciones registradas.</div>`:''}
    ${caps.map(cap=>`<div class="cap-row">
      <div class="cr-head">
        ${catPill(cap.categoria)}
        <span style="font-size:12px;font-weight:700;color:${resColor[cap.resultado]||'var(--text)'}">
          ${CAP_RESULTADO[cap.resultado]||cap.resultado}
        </span>
        <span style="font-size:11px;color:var(--text3)">${fmtDate(cap.fecha)} · ${cap.modalidad}</span>
      </div>
      ${cap.obs?`<div class="cr-body">${cap.obs}</div>`:''}
    </div>`).join('')}
  </div>`;
}

function renderMaqHabPanel(maquinaId){
  const maq=getMaq(maquinaId); if(!maq||!maq.categoria) return '';
  const ops=DB.get('operadoras')||[];
  const habilitadas=ops.filter(o=>estaHabilitada(o.id,maq.categoria).ok);
  return `<div class="info-card full">
    <h4>✅ Operadoras Habilitadas para "${maq.categoria}"</h4>
    ${!habilitadas.length?`<div style="color:var(--text3);font-size:13px;padding:8px 0">Ninguna operadora habilitada para esta categoría.</div>`:''}
    <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:4px">
      ${habilitadas.map(o=>`<button class="action-btn" onclick="showOpFicha(${o.id})" style="display:flex;align-items:center;gap:6px">
        <span style="font-size:12px">👩</span> ${o.nombre} ${o.apellido}
      </button>`).join('')}
    </div>
  </div>`;
}

// ── Helper render evaluaciones con agrupamiento por certificación ──
function renderCertificacionGroup(allResultados, evs, color, icono, titulo){
  const nivelBadge = {Básico:'badge-green',Intermedio:'badge-yellow',Avanzado:'badge-red'};
  const aprobadas = evs.filter(ev=>allResultados.some(r=>r.evaluacionId===ev.id&&r.estado==='aprobada')).length;
  const completo = aprobadas === evs.length;
  const rows = evs.map(ev=>{
    const resultados=allResultados.filter(r=>r.evaluacionId===ev.id);
    const aprobada=resultados.some(r=>r.estado==='aprobada');
    const intentos=resultados.length;
    return `<div class="material-row" style="padding-left:24px;border-left:3px solid ${aprobada?'var(--green)':'var(--border)'}">
      <div class="material-icon">${aprobada?'✅':'🧪'}</div>
      <div class="material-body">
        <div class="material-title">${ev.titulo}</div>
        <div class="material-sub">${ev.preguntas.length} preguntas · Aprobación: ${ev.minimoAprobacion}/${ev.preguntas.length} · ${aprobada?'<strong style=\'color:var(--green)\'>Aprobada ✅</strong>':'Pendiente'} · ${intentos} intentos</div>
      </div>
      <div style="display:flex;align-items:center;gap:8px;flex-shrink:0">
        <span class="badge ${nivelBadge[ev.nivel]||'badge-green'}">${ev.nivel||''}</span>
        ${puedeTomarEvaluacion()?`<button class="action-btn" onclick="openEvaluacionModal('${ev.id}')" style="color:var(--blue)">Tomar evaluación</button>`:''}
      </div>
    </div>`;
  }).join('');
  const uid = titulo.replace(/\s+/g,'_');
  return `<div style="border-left:4px solid ${color};margin:0">
    <div style="padding:12px 16px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;cursor:pointer;background:var(--bg2,#f8f8f8)"
         onclick="toggleCertGroup('${uid}')">
      <div>
        <div style="font-size:13px;font-weight:700;color:var(--text)">${icono} ${titulo} — 3 Niveles</div>
        <div style="font-size:12px;color:var(--text3);margin-top:3px">
          ${completo?'<strong style="color:var(--green)">¡Certificación completa!</strong>':`${aprobadas}/3 niveles aprobados. El nivel 3 otorga habilitación y certificado.`}
        </div>
      </div>
      <span id="arrow_${uid}" style="font-size:16px;transition:transform .2s">▶</span>
    </div>
    <div id="group_${uid}" style="display:none">${rows}</div>
  </div>`;
}
function toggleCertGroup(uid){
  const el=document.getElementById('group_'+uid);
  const ar=document.getElementById('arrow_'+uid);
  if(!el) return;
  const open=el.style.display!=='none';
  el.style.display=open?'none':'block';
  if(ar) ar.style.transform=open?'':'rotate(90deg)';
}
function renderEvaluacionesRows(allResultados){
  const laser = EVALUACIONES_TECNICAS.filter(e => e.id.startsWith('laser-'));
  const hifu  = EVALUACIONES_TECNICAS.filter(e => e.id.startsWith('hifu-'));
  const otros = EVALUACIONES_TECNICAS.filter(e => !e.id.startsWith('laser-') && !e.id.startsWith('hifu-') && !e.id.startsWith('ndyag-') && !e.id.startsWith('exilis-') && !e.id.startsWith('emsculpt-') && !e.id.startsWith('hydrafacial-') && !e.id.startsWith('soprano-') && !e.id.startsWith('bronceado-') && !e.id.startsWith('aparatologia-') && !e.id.startsWith('masajes-') && !e.id.startsWith('cavitacion-') && !e.id.startsWith('skincare-') && !e.id.startsWith('criolipolisis-') && !e.id.startsWith('atencion-') && !e.id.startsWith('bioseguridad-') && !e.id.startsWith('rf-') && !e.id.startsWith('gestion-'));

  const nivelBadge = {Básico:'badge-green',Intermedio:'badge-yellow',Avanzado:'badge-red'};

  const rowsOtros = otros.map(ev=>{
    const resultados=allResultados.filter(r=>r.evaluacionId===ev.id);
    const aprobadas=resultados.filter(r=>r.estado==='aprobada').length;
    return `<div class="material-row">
      <div class="material-icon">🧪</div>
      <div class="material-body">
        <div class="material-title">${ev.titulo}</div>
        <div class="material-sub">${ev.preguntas.length} preguntas. Aprobación: ${ev.minimoAprobacion}/${ev.preguntas.length}. ${aprobadas} aprobadas · ${resultados.length} intentos.</div>
      </div>
      <div style="display:flex;align-items:center;gap:8px;flex-shrink:0">
        <span class="badge badge-obligatorio">Obligatorio</span>
        <span class="badge badge-green">${ev.categoria}</span>
        ${puedeTomarEvaluacion()?`<button class="action-btn" onclick="openEvaluacionModal('${ev.id}')" style="color:var(--blue)">Tomar evaluación</button>`:''}
      </div>
    </div>`;
  }).join('');

  const ndyag        = EVALUACIONES_TECNICAS.filter(e => e.id.startsWith('ndyag-'));
  const soprano      = EVALUACIONES_TECNICAS.filter(e => e.id.startsWith('soprano-'));
  const exilis       = EVALUACIONES_TECNICAS.filter(e => e.id.startsWith('exilis-'));
  const emsculpt     = EVALUACIONES_TECNICAS.filter(e => e.id.startsWith('emsculpt-'));
  const hydrafacial  = EVALUACIONES_TECNICAS.filter(e => e.id.startsWith('hydrafacial-'));
  const bronceado    = EVALUACIONES_TECNICAS.filter(e => e.id.startsWith('bronceado-'));
  const aparatologia = EVALUACIONES_TECNICAS.filter(e => e.id.startsWith('aparatologia-'));
  const masajes      = EVALUACIONES_TECNICAS.filter(e => e.id.startsWith('masajes-'));
  const cavitacion   = EVALUACIONES_TECNICAS.filter(e => e.id.startsWith('cavitacion-'));
  const skincare     = EVALUACIONES_TECNICAS.filter(e => e.id.startsWith('skincare-'));
  const criolipolisis= EVALUACIONES_TECNICAS.filter(e => e.id.startsWith('criolipolisis-'));
  const atencion     = EVALUACIONES_TECNICAS.filter(e => e.id.startsWith('atencion-'));
  const bioseguridad = EVALUACIONES_TECNICAS.filter(e => e.id.startsWith('bioseguridad-'));
  const rf           = EVALUACIONES_TECNICAS.filter(e => e.id.startsWith('rf-'));
  const gestion      = EVALUACIONES_TECNICAS.filter(e => e.id.startsWith('gestion-'));

  // Agrupador de nivel
  function renderNivelCategoria(uid, titulo, subtitulo, color, grupos){
    const rows = grupos.map(g => renderCertificacionGroup(allResultados, g.evs, g.color, g.icono, g.nombre)).join('');
    return `<div style="border:2px solid ${color};border-radius:12px;margin-bottom:12px;overflow:hidden">
      <div style="background:${color};padding:12px 16px;display:flex;align-items:center;justify-content:space-between;cursor:pointer"
           onclick="toggleCertGroup('nivel_${uid}')">
        <div>
          <div style="font-size:14px;font-weight:700;color:#fff">${titulo}</div>
          <div style="font-size:12px;color:rgba(255,255,255,.8);margin-top:2px">${subtitulo}</div>
        </div>
        <span id="arrow_nivel_${uid}" style="font-size:18px;color:#fff;transition:transform .2s">▶</span>
      </div>
      <div id="group_nivel_${uid}" style="display:none">${rows}</div>
    </div>`;
  }

  return rowsOtros
    + renderNivelCategoria('1', '📚 Nivel 1 — Fundamentos', 'Bases para cualquier operadora: higiene, piel y atención al cliente', '#455a64', [
        {evs:bioseguridad,  color:'#558b2f', icono:'🛡️', nombre:'Certificación Bioseguridad e Higiene'},
        {evs:skincare,      color:'#ad1457', icono:'✨', nombre:'Certificación Skincare y Cuidado de la Piel'},
        {evs:atencion,      color:'#f57f17', icono:'📋', nombre:'Certificación Atención al Cliente y Ventas'},
        {evs:gestion,       color:'#00695c', icono:'📊', nombre:'Certificación Gestión de Agenda y Administración'},
      ])
    + renderNivelCategoria('2', '💆 Nivel 2 — Técnicas Corporales', 'Masajes, drenaje, reducción y bronceado', '#4527a0', [
        {evs:masajes,       color:'#6a1b9a', icono:'💆', nombre:'Certificación Masajes y Drenaje Linfático'},
        {evs:cavitacion,    color:'#0288d1', icono:'🌊', nombre:'Certificación Cavitación Ultrasónica'},
        {evs:criolipolisis, color:'#00acc1', icono:'❄️', nombre:'Certificación Criolipólisis'},
        {evs:emsculpt,      color:'#2e7d32', icono:'💪', nombre:'Certificación Emsculpt'},
        {evs:bronceado,     color:'#f9a825', icono:'🌟', nombre:'Certificación Bronceado Orgánico'},
      ])
    + renderNivelCategoria('3', '🏅 Nivel 3 — Aparatología Avanzada', 'Equipos de alta tecnología: láser, HIFU, RF y más', '#1a237e', [
        {evs:aparatologia,  color:'#37474f', icono:'🏅', nombre:'Certificación en Aparatología Estética'},
        {evs:rf,            color:'#7b1fa2', icono:'📡', nombre:'Certificación Radiofrecuencia Corporal y Facial'},
        {evs:laser,         color:'#1976d2', icono:'⚡', nombre:'Certificación Depilación Láser'},
        {evs:ndyag,         color:'#0097a7', icono:'🔵', nombre:'Certificación Nd:YAG'},
        {evs:soprano,       color:'#c62828', icono:'🔴', nombre:'Certificación Soprano Titanium ICE'},
        {evs:exilis,        color:'#e65100', icono:'🔶', nombre:'Certificación Exilis Elite'},
        {evs:hydrafacial,   color:'#00838f', icono:'💧', nombre:'Certificación HydraFacial'},
        {evs:hifu,          color:'#9c27b0', icono:'💜', nombre:'Certificación HIFU'},
      ]);
}
