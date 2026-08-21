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
    const { profileText, apiKey } = req.body || {};

    if (!profileText || !profileText.trim()) {
      return res.status(400).json({ error: 'Debes proporcionar el texto del perfil.' });
    }

    const keyToUse = apiKey || process.env.DEEPSEEK_API_KEY || process.env.VITE_DEEPSEEK_API_KEY;

    let searchQueries = [];
    let entityInfo = { name: '', company: '', sector: '' };

    // 1. Extraer entidades clave con DeepSeek
    if (keyToUse) {
      try {
        const extractionPrompt = `Analiza este perfil de LinkedIn y extrae con máxima precisión:
1. Nombre completo de la persona.
2. Empresa actual, productora, agencia, teatro o colectivo donde trabaja.
3. Sector artístico/comercial principal.
4. Genera exactamente 2 términos de búsqueda específicos para Google News España sobre sus proyectos, campañas, estrenos o premios recientes.

Devuelve SOLO JSON estricto:
{
  "name": "Nombre",
  "company": "Empresa o Colectivo",
  "sector": "Sector",
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
          const parsed = JSON.parse(extractData.choices[0].message.content);
          entityInfo = { name: parsed.name || '', company: parsed.company || '', sector: parsed.sector || '' };
          if (Array.isArray(parsed.queries) && parsed.queries.length > 0) {
            searchQueries = parsed.queries;
          }
        }
      } catch (e) {
        console.warn('Fallo en extracción IA:', e);
      }
    }

    // Fallback de queries si no se extrajeron con IA
    if (searchQueries.length === 0) {
      const lines = profileText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
      const firstLine = lines[0] || '';
      searchQueries.push(firstLine.substring(0, 35));
      if (entityInfo.company) searchQueries.push(`${entityInfo.company} Madrid`);
    }

    // 2. Consultar Google News RSS (Estrictamente las 3 noticias más recientes)
    const newsResults = [];
    const seenTitles = new Set();

    for (const query of searchQueries.slice(0, 2)) {
      if (!query || query.trim().length < 3 || newsResults.length >= 3) continue;
      try {
        const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(query + ' when:1y')}&hl=es&gl=ES&ceid=ES:es`;
        const rssRes = await fetch(rssUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });

        if (rssRes.ok) {
          const xmlText = await rssRes.text();
          const itemRegex = /<item>[\s\S]*?<title>(.*?)<\/title>[\s\S]*?<link>(.*?)<\/link>[\s\S]*?<pubDate>(.*?)<\/pubDate>[\s\S]*?(?:<source.*?>(.*?)<\/source>)?[\s\S]*?<\/item>/gi;
          let match;

          while ((match = itemRegex.exec(xmlText)) !== null && newsResults.length < 3) {
            let title = match[1] ? match[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&#39;/g, "'") : '';
            let link = match[2] || '';
            let pubDate = match[3] || '';
            let source = match[4] ? match[4].replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1') : 'Medio de Prensa';

            let formattedDate = pubDate;
            try {
              const d = new Date(pubDate);
              formattedDate = d.toLocaleDateString('es-ES', { month: 'short', year: 'numeric', day: 'numeric' });
            } catch (_) {}

            if (title && !seenTitles.has(title)) {
              seenTitles.add(title);
              newsResults.push({
                title,
                link,
                pubDate: formattedDate,
                source,
                queryMatched: query
              });
            }
          }
        }
      } catch (err) {
        console.warn(`Error en query ${query}:`, err);
      }
    }

    // Devolver estrictamente máximo 3 noticias
    return res.status(200).json({
      entity: entityInfo,
      news: newsResults.slice(0, 3),
      count: Math.min(newsResults.length, 3)
    });

  } catch (error) {
    console.error('Error en /api/scan-news:', error);
    return res.status(500).json({ error: error.message || 'Error al escanear noticias' });
  }
}
