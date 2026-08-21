import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

function localApiPlugin() {
  return {
    name: 'local-api-plugin',
    configureServer(server) {
      // 1. Endpoint para escanear noticias orientadas 100% a la COMPAÑÍA / AGENCIA
      server.middlewares.use('/api/scan-news', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end(JSON.stringify({ error: 'Method not allowed' }));
          return;
        }

        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', async () => {
          try {
            const parsed = JSON.parse(body || '{}');
            const { profileText, apiKey } = parsed;
            const env = loadEnv('', process.cwd(), '');
            const keyToUse = apiKey || env.DEEPSEEK_API_KEY || env.VITE_DEEPSEEK_API_KEY;

            let searchQueries = [];
            let entityInfo = { name: '', company: '', sector: '' };

            if (keyToUse) {
              try {
                const extractionPrompt = `Eres un investigador de inteligencia comercial B2B para la industria audiovisual y publicitaria en España.
Analiza este perfil de LinkedIn e identifica:
1. El NOMBRE DE LA EMPRESA, AGENCIA DE PUBLICIDAD, PRODUCTORA AUDIOVISUAL, ESTUDIO O TEATRO / COMPAÑÍA DE ARTES ESCÉNICAS actual o más relevante donde trabaja o ha producido proyectos.
2. El nombre de la persona.
3. El sector principal.
4. Genera exactamente 2 consultas de búsqueda para Google News España que estén 100% ENFOCADAS EN LA EMPRESA/COMPAÑÍA y sus campañas, estrenos, premios o producciones recientes (NO busques nombres genéricos de personas si no van acompañados de su empresa).

Ejemplo de queries esperadas:
- '"NombreEmpresa" (campaña OR estreno OR spot OR producción OR premio OR festival)'
- '"NombreEmpresa" Madrid publicidad'

Devuelve SOLO un JSON con esta estructura exacta:
{
  "name": "Nombre de la persona",
  "company": "Nombre exacto de la empresa / agencia / productora",
  "sector": "Publicidad / Cine / Danza / Teatro / Moda",
  "queries": ["query 1", "query 2"]
}`;

                const extractRes = await fetch('https://api.deepseek.com/chat/completions', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${keyToUse}`
                  },
                  body: JSON.stringify({
                    model: 'deepseek-chat',
                    messages: [
                      { role: 'system', content: extractionPrompt },
                      { role: 'user', content: profileText }
                    ],
                    response_format: { type: 'json_object' }
                  })
                });

                if (extractRes.ok) {
                  const extractData = await extractRes.json();
                  const p = JSON.parse(extractData.choices[0].message.content);
                  entityInfo = { name: p.name || '', company: p.company || '', sector: p.sector || '' };
                  if (Array.isArray(p.queries)) searchQueries = p.queries;
                }
              } catch (_) {}
            }

            if (entityInfo.company && entityInfo.company.trim().length > 2) {
              const cleanCompany = entityInfo.company.replace(/[^\w\s\u00C0-\u017F]/gi, '').trim();
              searchQueries = [
                `"${cleanCompany}" (campaña OR estreno OR spot OR rodaje OR premio OR producción)`,
                `"${cleanCompany}" Madrid`
              ];
            } else if (searchQueries.length === 0) {
              const firstLine = (profileText || '').split('\n')[0] || '';
              searchQueries.push(`"${firstLine.substring(0, 30)}" (campaña OR estreno OR publicidad)`);
            }

            const newsResults = [];
            const seen = new Set();

            for (const query of searchQueries.slice(0, 2)) {
              if (!query || query.trim().length < 3 || newsResults.length >= 3) continue;
              try {
                const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(query + ' when:1y')}&hl=es&gl=ES&ceid=ES:es`;
                const rssRes = await fetch(rssUrl, {
                  headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
                });

                if (rssRes.ok) {
                  const xml = await rssRes.text();
                  const itemRegex = /<item>[\s\S]*?<title>(.*?)<\/title>[\s\S]*?<link>(.*?)<\/link>[\s\S]*?<pubDate>(.*?)<\/pubDate>[\s\S]*?(?:<source.*?>(.*?)<\/source>)?[\s\S]*?<\/item>/gi;
                  let match;

                  while ((match = itemRegex.exec(xml)) !== null && newsResults.length < 3) {
                    let title = match[1] ? match[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&#39;/g, "'") : '';
                    let link = match[2] || '';
                    let pubDate = match[3] || '';
                    let source = match[4] ? match[4].replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1') : 'Medio de Prensa';

                    let formattedDate = pubDate;
                    try {
                      formattedDate = new Date(pubDate).toLocaleDateString('es-ES', { month: 'short', year: 'numeric', day: 'numeric' });
                    } catch (_) {}

                    if (title && !seen.has(title)) {
                      seen.add(title);
                      newsResults.push({ title, link, pubDate: formattedDate, source, companyTarget: entityInfo.company });
                    }
                  }
                }
              } catch (_) {}
            }

            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ entity: entityInfo, news: newsResults.slice(0, 3) }));
          } catch (e) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: e.message }));
          }
        });
      });

      // 2. Endpoint para generar mensajes (1.200 - 1.800 caracteres)
      server.middlewares.use('/api/generate', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end(JSON.stringify({ error: 'Method not allowed' }));
          return;
        }

        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', async () => {
          try {
            const parsed = JSON.parse(body || '{}');
            const { profileText, contextText, selectedNews, objective, tone, apiKey, userIdentity, userAdvantage } = parsed;
            const env = loadEnv('', process.cwd(), '');
            const keyToUse = apiKey || env.DEEPSEEK_API_KEY || env.VITE_DEEPSEEK_API_KEY;

            if (!keyToUse) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Clave API de DeepSeek no proporcionada. Configúrala en la aplicación.' }));
              return;
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
1. APERTURA Y GANCHO CONTEXTUAL: Agradecimiento cálido por conectar. Análisis profundo de su trabajo, última campaña o hito reciente de su empresa (usando la noticia/contexto proporcionado). Demuestra que conoces su lenguaje visual.
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

            let fullContext = '';
            if (contextText && contextText.trim()) fullContext += `Contexto manual: ${contextText.trim()}. `;
            if (selectedNews && typeof selectedNews === 'string' && selectedNews.trim()) {
              fullContext += `Noticia/Evento de la compañía: "${selectedNews.trim()}". `;
            }

            const newsSection = fullContext.trim()
              ? `\nINFORMACIÓN DE ACTUALIDAD DE LA COMPAÑÍA/PROYECTOS: "${fullContext.trim()}". DEBES integrar este hito en el análisis inicial del mensaje.`
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
   - Opción 2 (Enfoque Narrativa Estética & Noticia/Actualidad de la Empresa): Desarrolla el mensaje anclado en su campaña o proyecto reciente, proponiendo una visión visual sofisticada.
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

            const resText = await response.text();
            res.statusCode = response.status;
            res.setHeader('Content-Type', 'application/json');
            if (!response.ok) {
              res.end(JSON.stringify({ error: `DeepSeek Error: ${resText}` }));
            } else {
              const data = JSON.parse(resText);
              const content = JSON.parse(data.choices[0].message.content);
              res.end(JSON.stringify(content));
            }
          } catch (e) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: e.message }));
          }
        });
      });
    }
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), localApiPlugin()],
})
