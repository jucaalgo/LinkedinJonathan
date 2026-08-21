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
      objectiveInstruction = '- SOLICITUD DE CONEXIÓN (Nota inicial). NUNCA intentes vender. Solo felicita un logro o proyecto reciente con un gancho genuino. (LÍMITE ESTRICTO: Menos de 300 caracteres).';
    } else if (objective === 'followup') {
      objectiveInstruction = '- MENSAJE TRAS ACEPTAR CONEXIÓN (Follow-up / Venta Suave). Estructura ágil y concisa de EXACTAMENTE 2 PÁRRAFOS potentes (ni largo ni telegráfico):\n  • Párrafo 1 (Gancho + Conexión): Agradece brevemente la conexión, conecta con su último proyecto o noticia y menciona de forma natural tu visión como Director de Cámara y ex-bailarín clásico.\n  • Párrafo 2 (Propuesta de Valor + Cierre suave): Explica cómo tu enfoque en biomecánica, timing escénico e iluminación eleva las piezas visuales/rodajes, cerrando con una pregunta abierta o compartiendo tu dossier/reel sin presión.';
    } else {
      objectiveInstruction = '- SOLICITUD DE REUNIÓN DIRECTA (Comercial). Estructura contundente de 2 a 3 párrafos claros: 1) Gancho de alto impacto, 2) Propuesta concreta de colaboración para sus próximas producciones de foto/video, 3) Llamado a la acción directo para una breve videollamada o café.';
    }

    // Unir contexto manual y noticias detectadas si existen
    let fullContext = '';
    if (contextText && contextText.trim()) {
      fullContext += `Contexto manual: ${contextText.trim()}. `;
    }
    if (selectedNews) {
      if (typeof selectedNews === 'string' && selectedNews.trim()) {
        fullContext += `Noticia/Evento reciente detectado: "${selectedNews.trim()}". `;
      } else if (Array.isArray(selectedNews) && selectedNews.length > 0) {
        fullContext += `Noticias/Eventos detectados: ${selectedNews.map(n => typeof n === 'string' ? n : `"${n.title}" (${n.source}, ${n.pubDate})`).join(' | ')}. `;
      }
    }

    const newsSection = fullContext.trim()
      ? `\nNOTICIA / EVENTO RECIENTE DE SU TRAYECTORIA: "${fullContext.trim()}". DEBES integrar este hito en el gancho inicial para demostrar conocimiento real y actualizado de su trabajo.`
      : '';

    const systemPrompt = `Eres un estratega de prospección B2B y copywriter cinematográfico de élite. Representas a ${userIdentity || 'Jonathan Ocampo Yandy, Director de Cámara y Fotógrafo'}. Tu ventaja competitiva única es: ${userAdvantage || 'biomecánica, ritmo escénico e iluminación dramática'}.

Tu misión: Analizar el perfil y redactar 3 opciones de mensajes con impecable gusto estético, tono humano, directo y sin relleno corporativo.

Objetivo estratégico seleccionado: 
${objectiveInstruction}
Tono: ${tone || 'creativo'}.${newsSection}

Reglas Inquebrantables:
1. Prohibidos los clichés de ventas: NUNCA uses "espero te encuentres bien", "hacer sinergia", "solución innovadora", "revolucionar". Escribe como un creador visual seguro de su arte.
2. Cada opción debe tener un ángulo distintivo:
   - Opción 1 (Dirección & Biomecánica): Enfoque en la precisión del movimiento corporal, luz dramática y cómo respiras con el talento en set.
   - Opción 2 (Estética & Noticia/Campaña): Basada en su actualidad, campañas o producciones recientes, proponiendo una estética visual refinada.
   - Opción 3 (Colega / Consultivo): Directo, entre profesionales del sector, enfocado en optimizar el flujo visual de sus próximos proyectos.
3. Formato de salida: JSON estricto con esta estructura:
{
  "analisis_perfil": "1 o 2 frases con el diagnóstico del perfil y el ángulo estratégico elegido.",
  "opcion_1": "texto completo del mensaje",
  "opcion_2": "texto del mensaje",
  "opcion_3": "texto del mensaje"
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
