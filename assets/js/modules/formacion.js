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
const EVALUACIONES_TECNICAS = [EVAL_LASER_BASICO, EVAL_LASER_INTERMEDIO, EVAL_LASER_AVANZADO, EVAL_NDYAG_BASICO, EVAL_NDYAG_INTERMEDIO, EVAL_NDYAG_AVANZADO, EVAL_SOPRANO_BASICO, EVAL_SOPRANO_INTERMEDIO, EVAL_SOPRANO_AVANZADO, EVAL_EXILIS_BASICO, EVAL_EXILIS_INTERMEDIO, EVAL_EXILIS_AVANZADO, EVAL_EMSCULPT_BASICO, EVAL_EMSCULPT_INTERMEDIO, EVAL_EMSCULPT_AVANZADO, EVAL_HYDRAFACIAL_BASICO, EVAL_HYDRAFACIAL_AVANZADO, EVAL_BRONCEADO_BASICO, EVAL_BRONCEADO_AVANZADO, EVAL_PRESOTERAPIA, EVAL_HIFU_BASICO, EVAL_HIFU_INTERMEDIO, EVAL_HIFU_AVANZADO];

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
  const esExilis = evaluacion.id.startsWith('exilis-');
  const esEmsculpt = evaluacion.id.startsWith('emsculpt-');
  const esHydrafacial = evaluacion.id.startsWith('hydrafacial-');
  const esSoprano = evaluacion.id.startsWith('soprano-');
  const esBronceado = evaluacion.id.startsWith('bronceado-');
  const esHabilitante = (!esHIFU && !esLaser && !esNdYAG && !esExilis && !esEmsculpt && !esHydrafacial && !esSoprano && !esBronceado) || ['hifu-avanzado','laser-avanzado','ndyag-avanzado','exilis-avanzado','emsculpt-avanzado','hydrafacial-avanzado','soprano-avanzado','bronceado-avanzado'].includes(evaluacion.id);

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
  }else if(aprobada && (esHIFU || esLaser || esNdYAG || esExilis || esEmsculpt || esHydrafacial || esSoprano || esBronceado)){
    // Niveles básico e intermedio: solo informe, sin habilitación
    auditLog('CREATE','evaluacion',nId,`${op?.nombre||'Op #'+opId} aprobó ${evaluacion.titulo} ${correctas}/${evaluacion.preguntas.length}`);
    const nivel = evaluacion.nivel || '';
    const cert = esHIFU ? 'HIFU' : esNdYAG ? 'Nd:YAG' : esExilis ? 'Exilis Elite' : esEmsculpt ? 'Emsculpt' : esHydrafacial ? 'HydraFacial' : esSoprano ? 'Soprano Titanium ICE' : esBronceado ? 'Bronceado Orgánico' : 'Depilación Láser';
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
  const otros = EVALUACIONES_TECNICAS.filter(e => !e.id.startsWith('laser-') && !e.id.startsWith('hifu-') && !e.id.startsWith('ndyag-') && !e.id.startsWith('exilis-') && !e.id.startsWith('emsculpt-') && !e.id.startsWith('hydrafacial-') && !e.id.startsWith('soprano-') && !e.id.startsWith('bronceado-'));

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

  const ndyag       = EVALUACIONES_TECNICAS.filter(e => e.id.startsWith('ndyag-'));
  const soprano     = EVALUACIONES_TECNICAS.filter(e => e.id.startsWith('soprano-'));
  const exilis      = EVALUACIONES_TECNICAS.filter(e => e.id.startsWith('exilis-'));
  const emsculpt    = EVALUACIONES_TECNICAS.filter(e => e.id.startsWith('emsculpt-'));
  const hydrafacial = EVALUACIONES_TECNICAS.filter(e => e.id.startsWith('hydrafacial-'));
  const bronceado   = EVALUACIONES_TECNICAS.filter(e => e.id.startsWith('bronceado-'));
  return rowsOtros
    + renderCertificacionGroup(allResultados, laser,       '#1976d2', '⚡', 'Certificación Depilación Láser')
    + renderCertificacionGroup(allResultados, ndyag,       '#0097a7', '🔵', 'Certificación Nd:YAG')
    + renderCertificacionGroup(allResultados, soprano,     '#c62828', '🔴', 'Certificación Soprano Titanium ICE')
    + renderCertificacionGroup(allResultados, exilis,      '#e65100', '🔶', 'Certificación Exilis Elite')
    + renderCertificacionGroup(allResultados, emsculpt,    '#2e7d32', '💪', 'Certificación Emsculpt')
    + renderCertificacionGroup(allResultados, hydrafacial, '#00838f', '💧', 'Certificación HydraFacial')
    + renderCertificacionGroup(allResultados, bronceado,   '#f9a825', '🌟', 'Certificación Bronceado Orgánico')
    + renderCertificacionGroup(allResultados, hifu,        '#9c27b0', '💜', 'Certificación HIFU');
}
