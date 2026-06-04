/* ══════════════════════════════════
   FORMACIÓN — CERTIFICACIONES, CAPACITACIONES Y HABILITACIONES
══════════════════════════════════ */

const CAT_ICONS = {
  'Láser Depilación':'⚡','Radiofrecuencia / HIFU':'💜',
  'Pressoterapia':'🌊','Electroestimulación':'⚡','General':'📋',
};
const MAT_ICONS = {manual:'📖',video:'🎬',guia:'📋',protocolo:'⚕️',presentacion:'📊',otro:'📌'};
const CAP_RESULTADO = {aprobada:'✅ Aprobada',pendiente:'⏳ Pendiente',no_aprobada:'❌ No aprobada'};
const HAB_ESTADOS   = {activa:'✅ Activa',suspendida:'⏸ Suspendida',vencida:'⛔ Vencida'};
const HAB_API_CATEGORIAS = {
  'Láser Depilación':'laser_diodo',
  'Radiofrecuencia / HIFU':'hifu',
  'Pressoterapia':'Pressoterapia',
  'Electroestimulación':'electroestimulacion',
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
const EVALUACIONES_TECNICAS = [EVAL_LASER_BASICO, EVAL_LASER_INTERMEDIO, EVAL_LASER_AVANZADO, EVAL_NDYAG_BASICO, EVAL_NDYAG_INTERMEDIO, EVAL_NDYAG_AVANZADO, EVAL_PRESOTERAPIA, EVAL_HIFU_BASICO, EVAL_HIFU_INTERMEDIO, EVAL_HIFU_AVANZADO];

// ── Core helpers ──
function getMaterial(id){ return (DB.get('materiales')||[]).find(m=>m.id===parseInt(id)); }
function catPill(cat){
  const cls={'Láser Depilación':'cat-laser','Radiofrecuencia / HIFU':'cat-hifu',
             'Pressoterapia':'cat-presso','Electroestimulación':'cat-electro','General':'cat-laser'};
  return `<span class="cat-pill ${cls[cat]||''}">${CAT_ICONS[cat]||'📋'} ${cat}</span>`;
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
  const mats=(DB.get('materiales')||[]).filter(m=>
    (!matFilter || m.categoria===matFilter) &&
    (!matTipoFilter || matTipoFilter==='test' || m.tipo===matTipoFilter)
  );
  const cats=['Láser Depilación','Radiofrecuencia / HIFU','Pressoterapia','Electroestimulación','General'];

  const bycat=cats.map(cat=>{
    const items=mats.filter(m=>m.categoria===cat);
    if(!items.length) return '';
    return `<div class="table-container" style="margin-bottom:16px">
      <div style="padding:12px 16px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between">
        <div style="font-size:13px;font-weight:700;color:var(--text)">${catPill(cat)}</div>
        <span style="font-size:12px;color:var(--text3)">${items.filter(m=>m.estado==='activo').length} activos</span>
      </div>
      ${items.map(m=>`<div class="material-row">
        <div class="material-icon">${MAT_ICONS[m.tipo]||'📌'}</div>
        <div class="material-body">
          <div class="material-title">${m.titulo}</div>
          <div class="material-sub">${m.desc||'—'}</div>
        </div>
        <div style="display:flex;align-items:center;gap:8px;flex-shrink:0">
          <span class="badge ${m.obligatorio==='obligatorio'?'badge-obligatorio':'badge-opcional'}">${m.obligatorio==='obligatorio'?'Obligatorio':'Opcional'}</span>
          <span class="badge ${m.estado==='activo'?'badge-green':'badge-gray'}">${m.estado}</span>
          ${m.url?`<a href="${m.url}" target="_blank" class="action-btn" style="color:var(--blue)">🔗 Ver</a>`:''}
          ${isSuperAdmin()||canEdit()?`<button class="action-btn" onclick="openMaterialModal(${m.id})" style="margin-left:2px">✏️</button>`:''}
        </div>
      </div>`).join('')}
    </div>`;
  }).join('');

  const evalBlock = (!matTipoFilter || matTipoFilter==='test') ? renderEvaluaciones() : '';
  const matsBlock = matTipoFilter==='test' ? '' : (bycat ||
    `<div class="empty-state"><div class="icon">📚</div><h3>Sin materiales</h3></div>`
  );
  document.getElementById('materialesContent').innerHTML = evalBlock + matsBlock;
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
    obs:`${evaluacion.titulo}: ${correctas}/${evaluacion.preguntas.length} (${resultado.porcentaje}%).`,
    responsable:currentUser?.email||'—',
    ts:resultado.ts,
  });
  DB.set('capacitaciones',caps);

  // Evaluaciones HIFU: solo nivel avanzado habilita y certifica; básico e intermedio solo informe
  const esHIFU = evaluacion.id.startsWith('hifu-');
  const esLaser = evaluacion.id.startsWith('laser-');
  const esNdYAG = evaluacion.id.startsWith('ndyag-');
  const esHabilitante = (!esHIFU && !esLaser && !esNdYAG) || evaluacion.id === 'hifu-avanzado' || evaluacion.id === 'laser-avanzado' || evaluacion.id === 'ndyag-avanzado';

  if(aprobada && esHabilitante){
    try{
      const saved=await api('/api/operadoras/'+opId+'/habilitaciones',{
        method:'POST',
        body:JSON.stringify({
          equipo_categoria:HAB_API_CATEGORIAS[evaluacion.categoria],
          categoria:evaluacion.categoria,
          estado:'activa',
          fecha_otorgamiento:today(),
          obs:`Habilitación automática por evaluación aprobada: ${correctas}/${evaluacion.preguntas.length}.`,
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
  }else if(aprobada && (esHIFU || esLaser || esNdYAG)){
    // Niveles básico e intermedio: solo informe, sin habilitación
    auditLog('CREATE','evaluacion',nId,`${op?.nombre||'Op #'+opId} aprobó ${evaluacion.titulo} ${correctas}/${evaluacion.preguntas.length}`);
    const nivel = evaluacion.nivel || '';
    const cert = esHIFU ? 'HIFU' : esNdYAG ? 'Nd:YAG' : 'Depilación Láser';
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

function openMaterialModal(id){
  document.getElementById('modalMaterialTitle').textContent = id ? 'Editar Material' : 'Nuevo Material';
  if(id){
    const m=getMaterial(id); if(!m)return;
    sv('materialId',m.id); sv('materialTitulo',m.titulo); sv('materialTipo',m.tipo);
    sv('materialCategoria',m.categoria); sv('materialDesc',m.desc||'');
    sv('materialUrl',m.url||''); sv('materialEstado',m.estado); sv('materialObligatorio',m.obligatorio);
  } else {
    sv('materialId',''); sv('materialTitulo',''); sv('materialTipo','manual');
    sv('materialCategoria','General'); sv('materialDesc',''); sv('materialUrl','');
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
  const CATS=['Láser Depilación','Radiofrecuencia / HIFU','Pressoterapia','Electroestimulación'];
  const habs=getHabilitacionesByOp(operadoraId);
  return `<div class="info-card full">
    <h4 style="display:flex;align-items:center;justify-content:space-between">
      ✅ Habilitaciones Técnicas
      ${canEdit()?`<button class="btn-add" style="font-size:12px;padding:5px 10px" onclick="openHabilitacionModal(${operadoraId})">+ Habilitar</button>`:''}
    </h4>
    <div class="hab-grid">
      ${CATS.map(cat=>{
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
  const otros = EVALUACIONES_TECNICAS.filter(e => !e.id.startsWith('laser-') && !e.id.startsWith('hifu-') && !e.id.startsWith('ndyag-'));

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

  const ndyag = EVALUACIONES_TECNICAS.filter(e => e.id.startsWith('ndyag-'));
  return rowsOtros
    + renderCertificacionGroup(allResultados, laser, '#1976d2', '⚡', 'Certificación Depilación Láser')
    + renderCertificacionGroup(allResultados, ndyag, '#0097a7', '🔵', 'Certificación Nd:YAG')
    + renderCertificacionGroup(allResultados, hifu,  '#9c27b0', '💜', 'Certificación HIFU');
}
