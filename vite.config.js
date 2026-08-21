import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

function localApiPlugin() {
  return {
    name: 'local-api-plugin',
    configureServer(server) {
      // 1. Endpoint para escanear noticias
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
                const extractionPrompt = `Analiza este perfil de LinkedIn y extrae:
1. Nombre completo de la persona.
2. Empresa actual, productora, agencia o teatro donde trabaja.
3. Sector principal (ej: Publicidad, Danza, Teatro, Cine, Moda).
4. Genera exactamente 2 términos de búsqueda en Google News (en español) para encontrar noticias recientes, campañas o eventos relacionados con esta persona o su empresa en España.

Devuelve SOLO un JSON con esta estructura exacta:
{
  "name": "Nombre",
  "company": "Empresa",
  "sector": "Sector",
  "queries": ["término 1", "término 2"]
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

            if (searchQueries.length === 0) {
              const firstLine = (profileText || '').split('\n')[0] || '';
              searchQueries.push(firstLine.substring(0, 35));
            }

            const newsResults = [];
            const seen = new Set();

            for (const query of searchQueries.slice(0, 2)) {
              if (!query || query.trim().length < 3) continue;
              try {
                const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(query + ' when:1y')}&hl=es&gl=ES&ceid=ES:es`;
                const rssRes = await fetch(rssUrl, {
                  headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
                });

                if (rssRes.ok) {
                  const xml = await rssRes.text();
                  const itemRegex = /<item>[\s\S]*?<title>(.*?)<\/title>[\s\S]*?<link>(.*?)<\/link>[\s\S]*?<pubDate>(.*?)<\/pubDate>[\s\S]*?(?:<source.*?>(.*?)<\/source>)?[\s\S]*?<\/item>/gi;
                  let match;

                  while ((match = itemRegex.exec(xml)) !== null && newsResults.length < 5) {
                    let title = match[1] ? match[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').replace(/&quot;/g, '"').replace(/&amp;/g, '&') : '';
                    let link = match[2] || '';
                    let pubDate = match[3] || '';
                    let source = match[4] ? match[4].replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1') : 'Medio de Prensa';

                    let formattedDate = pubDate;
                    try {
                      formattedDate = new Date(pubDate).toLocaleDateString('es-ES', { month: 'short', year: 'numeric', day: 'numeric' });
                    } catch (_) {}

                    if (title && !seen.has(title)) {
                      seen.add(title);
                      newsResults.push({ title, link, pubDate: formattedDate, source });
                    }
                  }
                }
              } catch (_) {}
            }

            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ entity: entityInfo, news: newsResults }));
          } catch (e) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: e.message }));
          }
        });
      });

      // 2. Endpoint para generar mensajes
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
              objectiveInstruction = '- SOLICITUD DE CONEXIÓN (Nota inicial). NUNCA intentes vender. Solo felicita un logro o proyecto reciente con un gancho genuino. (LÍMITE ESTRICTO: Menos de 300 caracteres).';
            } else if (objective === 'followup') {
              objectiveInstruction = '- MENSAJE TRAS ACEPTAR CONEXIÓN (Follow-up / Venta Suave). Estructura ágil y concisa de EXACTAMENTE 2 PÁRRAFOS potentes:\n  • Párrafo 1 (Gancho + Conexión): Agradece brevemente la conexión, conecta con su último proyecto o noticia y menciona de forma natural tu visión como Director de Cámara y ex-bailarín clásico.\n  • Párrafo 2 (Propuesta de Valor + Cierre suave): Explica cómo tu enfoque en biomecánica, timing escénico e iluminación eleva las piezas visuales/rodajes, cerrando con una pregunta abierta o compartiendo tu dossier/reel sin presión.';
            } else {
              objectiveInstruction = '- SOLICITUD DE REUNIÓN DIRECTA (Comercial). Estructura contundente de 2 a 3 párrafos claros: 1) Gancho de alto impacto, 2) Propuesta concreta de colaboración para sus próximas producciones de foto/video, 3) Llamado a la acción directo para una breve videollamada o café.';
            }

            let fullContext = '';
            if (contextText && contextText.trim()) fullContext += `Contexto: ${contextText.trim()}. `;
            if (selectedNews && typeof selectedNews === 'string' && selectedNews.trim()) {
              fullContext += `Noticia/Evento reciente: "${selectedNews.trim()}". `;
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
