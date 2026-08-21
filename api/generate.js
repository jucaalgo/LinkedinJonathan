export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { profileText, contextText, selectedNews, objective, tone, apiKey, userIdentity, userAdvantage } = req.body || {};

    const keyToUse = apiKey || process.env.DEEPSEEK_API_KEY || process.env.VITE_DEEPSEEK_API_KEY;

    if (!keyToUse) {
      return res.status(400).json({ error: 'Clave API de DeepSeek no configurada. Ingresa tu API Key en la configuración o en las variables de entorno de Vercel (DEEPSEEK_API_KEY).' });
    }

    let objectiveInstruction = '';
    if (objective === 'conexion') {
      objectiveInstruction = `OBJETIVO: SOLICITUD DE CONEXIÓN INICIAL (Nota en invitación de LinkedIn).
REGLA ESTRICTA DE LONGITUD: Máximo 290 caracteres (LinkedIn impone un límite infranqueable de 300 caracteres).
CONTENIDO: Elogio sincero y específico sobre su trabajo o noticia reciente. CERO intención de venta, solo conectar por afinidad artística/profesional.`;
    } else if (objective === 'followup') {
      objectiveInstruction = `OBJETIVO: MENSAJE TRAS ACEPTAR CONEXIÓN (Follow-up de Alto Impacto).
REGLA OBLIGATORIA DE EXTENSIÓN: El mensaje DEBE TENER ENTRE 1.200 Y 1.800 CARACTERES (aproximadamente 200 a 300 palabras). No escribas textos cortos o telegráficos; debe ser un mensaje completo, elocuente y exhaustivo.
ESTRUCTURA OBLIGATORIA EN PÁRRAFOS:
1. APERTURA Y GANCHO CONTEXTUAL: Agradecimiento cálido por conectar. Análisis profundo de su trabajo, última campaña o hito reciente (usando la noticia/contexto proporcionado). Demuestra que conoces su lenguaje visual.
2. EL DIFERENCIAL ARTÍSTICO Y BIOMECÁNICA: Explica con autoridad cómo tu background como ex-bailarín clásico profesional (Conservatorio Mariemma) se traduce en la dirección y operación de cámara. Detalla cómo entiendes la biomecánica, el ritmo del espacio escénico y cómo "respiras" con el talento en set para capturar el clímax del movimiento con precisión milimétrica.
3. DOMINIO TÉCNICO INTEGRAL: Menciona el diseño de iluminación dramática adaptada a la narrativa y el flujo completo hasta el color grading final en DaVinci Resolve para entregar un acabado cinematográfico de primer nivel sin necesidad de micromanagement.
4. CIERRE ELEGANTE Y DE BAJA FRICCIÓN: Propuesta de valor abierta para estar en su radar cuando surjan producciones que requieran este nivel de dinamismo corporal y lumínico, invitando a ver tu reel o dossier.`;
    } else {
      objectiveInstruction = `OBJETIVO: PROPUESTA COMERCIAL Y SOLICITUD DE REUNIÓN DIRECTA.
REGLA OBLIGATORIA DE EXTENSIÓN: ENTRE 1.200 Y 1.800 CARACTERES. Mensaje sólido, estructurado y de alta persuasión B2B.
ESTRUCTURA:
1. Gancho de alto impacto sobre sus producciones audiovisuales o publicitarias.
2. Demostración de valor: por qué un Director de Cámara especializado en biomecánica y artes escénicas resuelve los cuellos de botella en la dirección de actores/bailarines/talento en set.
3. Propuesta clara de sinergia para sus próximos rodajes o campañas.
4. Llamado a la acción directo para una breve videollamada o café esta semana.`;
    }

    // Contexto enriquecido
    let fullContext = '';
    if (contextText && contextText.trim()) {
      fullContext += `Contexto manual provisto: ${contextText.trim()}. `;
    }
    if (selectedNews && typeof selectedNews === 'string' && selectedNews.trim()) {
      fullContext += `Noticia/Evento de actualidad detectado: "${selectedNews.trim()}". `;
    }

    const newsSection = fullContext.trim()
      ? `\nINFORMACIÓN DE ACTUALIDAD Y PROYECTOS RECIENTES: "${fullContext.trim()}". DEBES integrar inteligentemente este hito en el análisis inicial del mensaje.`
      : '';

    const systemPrompt = `Eres un copywriter cinematográfico de élite y director de prospección B2B. Escribes en nombre de ${userIdentity || 'Jonathan Ocampo Yandy, Director de Cámara y Fotógrafo'}.
Diferencial clave del remitente: ${userAdvantage || 'Ex-bailarín clásico profesional (Mariemma), especialista en biomecánica, ritmo escénico, iluminación dramática y DaVinci Resolve'}.

${objectiveInstruction}

Tono general requerido: ${tone || 'creativo'} (profesional, culto, cinematográfico, seguro de su arte y sin clichés).${newsSection}

CRITERIOS DE EXCELENCIA DE REDACCIÓN:
1. PROHIBICIÓN ABSOLUTA DE CLICHÉS: NUNCA uses "espero te encuentres bien", "espero que este mensaje te encuentre bien", "hacer sinergia", "solución innovadora", "revolucionar". Escribe con la voz de un cineasta/fotógrafo con criterio estético de autor.
2. CUIDADO GRAMATICAL Y RIQUEZA LÉXICA: Puntuación impecable, transiciones fluidas entre párrafos, terminología precisa de dirección de cámara (ritmo, encuadre, biomecánica, etalonaje, esquemas de luz).
3. DISTINCIÓN DE LAS 3 VARIANTES:
   - Opción 1 (Enfoque Dirección de Cámara & Biomecánica): Enfatiza la coreografía de la cámara, el lenguaje del cuerpo y la anticipación del movimiento en set.
   - Opción 2 (Enfoque Narrativa Estética & Noticia/Actualidad): Desarrolla el mensaje anclado en su campaña o proyecto reciente, proponiendo una visión visual sofisticada.
   - Opción 3 (Enfoque Consultivo / Sinergia de Producción): Aborda los desafíos habituales en rodajes comerciales/escénicos y cómo tu visión integral agiliza y potencia la producción.
4. LONGITUD: Asegúrate de que las opciones 1, 2 y 3 para Follow-up y Reunión alcancen entre 1.200 y 1.800 caracteres cada una.

Formato de salida: JSON estricto con esta estructura:
{
  "analisis_perfil": "1 o 2 frases con el diagnóstico estratégico de la trayectoria del prospecto y el ángulo de entrada.",
  "opcion_1": "texto completo y desarrollado del mensaje",
  "opcion_2": "texto completo y desarrollado del mensaje",
  "opcion_3": "texto completo y desarrollado del mensaje"
}`;

    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${keyToUse}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Perfil del contacto:\n${profileText}` }
        ],
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({ error: `DeepSeek API Error: ${errorText}` });
    }

    const data = await response.json();
    const content = JSON.parse(data.choices[0].message.content);
    return res.status(200).json(content);
  } catch (error) {
    console.error('Error en /api/generate:', error);
    return res.status(500).json({ error: error.message || 'Error interno del servidor' });
  }
}
