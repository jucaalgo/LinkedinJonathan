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
    const { profileText, contextText, objective, tone, apiKey, userIdentity, userAdvantage } = req.body || {};

    const keyToUse = apiKey || process.env.DEEPSEEK_API_KEY || process.env.VITE_DEEPSEEK_API_KEY;

    if (!keyToUse) {
      return res.status(400).json({ error: 'Clave API de DeepSeek no configurada. Ingresa tu API Key en la configuración o en las variables de entorno de Vercel (DEEPSEEK_API_KEY).' });
    }

    const systemPrompt = `Eres un experto en ventas B2B y copywriting de élite. Eres ${userIdentity || 'Jonathan Ocampo Yandy, Director de Cámara y Fotógrafo'}. Tu mayor diferencial es: ${userAdvantage || 'biomecánica, ritmo escénico e iluminación dramática'}.

Tu tarea es analizar el perfil de LinkedIn proporcionado y redactar 3 opciones de mensajes hiper-personalizados, con excelente ortografía, una estructura persuasiva y un desarrollo más robusto y maduro.

Objetivo estratégico del mensaje: 
${objective === 'conexion' ? '- ES UNA SOLICITUD DE CONEXIÓN. NUNCA vendas tus servicios. Solo elogia su trabajo de forma auténtica. (ATENCIÓN: Límite estricto de máximo 300 caracteres, LinkedIn no permite más).' : objective === 'followup' ? '- ES UN MENSAJE TRAS ACEPTAR LA CONEXIÓN (Follow-up). REDACCIÓN EXTENSA, PROFUNDA Y DE ALTO NIVEL (Mínimo 3-4 párrafos bien desarrollados). Estructura obligatoria: 1) Gancho hiper-personalizado, 2) Empatía sobre los retos visuales en su nicho, 3) Soft Pitch profundo: Explica con autoridad cómo tu background en biomecánica escénica, luz y operación de cámara eleva sus producciones, 4) Pregunta abierta de baja fricción.' : '- ES UNA SOLICITUD DE REUNIÓN DIRECTA. REDACCIÓN EXTENSA, PROFESIONAL Y PERSUASIVA (Mínimo 3-4 párrafos). Estructura: 1) Gancho, 2) Demostración contundente de valor (por qué un ex-bailarín Director de Cámara mejora la factura visual de sus proyectos), 3) Propuesta concreta de colaboración, 4) Call to action claro para agendar una videollamada esta semana.'}
Tono general: ${tone || 'creativo'}.
${contextText && contextText.trim() ? `\nCONTEXTO CRÍTICO / NOTICIA: El usuario ha proveído esta información adicional sobre el contacto o su empresa: "${contextText}". DEBES incorporar inteligentemente esta noticia o contexto en el gancho inicial de tus mensajes para demostrar que estás al día con su trabajo.` : ''}

Reglas Estrictas:
1. Encuentra un "Gancho" específico en su perfil (o en el contexto/noticia provisto) para iniciar la conversación. MUESTRA que investigaste profundamente.
2. NUNCA uses clichés corporativos. Escribe como un experto, directo, inteligente y con máxima autoridad técnica y artística.
3. Las opciones deben ser EXTENSAS, altamente persuasivas y con estructura de copywriting B2B de élite (salvo en la conexión que debe ser corta):
   - Opción 1: Profundiza exhaustivamente en el valor de tu técnica (dirección escénica, movimiento, iluminación) en relación a las producciones de su empresa. Usa narrativa envolvente.
   - Opción 2: Centrada fuertemente en el impacto estético de la Noticia/Contexto que el usuario te dio. Escribe con autoridad técnica y lenguaje de dirección cinematográfica.
   - Opción 3: Un acercamiento consultivo profundo, enfocado en discutir los retos de sus producciones audiovisuales y cómo tu perfil híbrido (cámara + danza) aporta soluciones únicas y de alto valor.
4. Devuelve la respuesta en formato JSON estricto con esta estructura:
{
  "analisis_perfil": "Breve análisis estratégico de por qué esta persona es un buen contacto y qué gancho vas a usar.",
  "opcion_1": "texto del mensaje",
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
