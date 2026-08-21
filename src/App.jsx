import React, { useState } from 'react';
import { Camera, Send, Copy, Loader2, Sparkles, User, Target, Key, Settings, X, Save, HelpCircle, BookOpen, Newspaper } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function App() {
  const [profileText, setProfileText] = useState('');
  const [contextText, setContextText] = useState('');
  const [objective, setObjective] = useState('conexion');
  const [tone, setTone] = useState('creativo');
  
  // Settings State
  const [apiKey, setApiKey] = useState(
    import.meta.env.VITE_DEEPSEEK_API_KEY || localStorage.getItem('vh_apiKey') || ''
  );
  const [userIdentity, setUserIdentity] = useState(
    localStorage.getItem('vh_identity') || 
    'Jonathan Ocampo Yandy, Director de Cámara y Fotógrafo en Madrid. Ex-bailarín clásico profesional (Conservatorio Mariemma).'
  );
  const [userAdvantage, setUserAdvantage] = useState(
    localStorage.getItem('vh_advantage') || 
    'Soy ex-bailarín clásico (Conservatorio Mariemma) convertido en Director de Cámara y Fotógrafo. Mi diferencial es la comprensión absoluta de la biomecánica, el ritmo y el espacio escénico. No solo diseño iluminación dramática, sino que "respiro" con el talento en set, anticipando el clímax del movimiento para crear piezas visuales impecables. Domino todo el flujo: desde la dirección de arte hasta el color grading (DaVinci Resolve).'
  );
  
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const saveSettings = () => {
    localStorage.setItem('vh_apiKey', apiKey);
    localStorage.setItem('vh_identity', userIdentity);
    localStorage.setItem('vh_advantage', userAdvantage);
    setShowSettings(false);
  };

  const generateMessages = async () => {
    if (!profileText.trim()) {
      setError('Por favor, pega el perfil del contacto.');
      return;
    }
    if (!apiKey) {
      setError('Se requiere la clave API de DeepSeek. Ábrela en Configuración.');
      setShowSettings(true);
      return;
    }

    setLoading(true);
    setError(null);
    setResults(null);

    const systemPrompt = `Eres un experto en ventas B2B y copywriting de élite. Eres ${userIdentity}. Tu mayor diferencial es: ${userAdvantage}.

Tu tarea es analizar el perfil de LinkedIn proporcionado y redactar 3 opciones de mensajes hiper-personalizados, con excelente ortografía, una estructura persuasiva y un desarrollo más robusto y maduro.

Objetivo estratégico del mensaje: 
${objective === 'conexion' ? '- ES UNA SOLICITUD DE CONEXIÓN. NUNCA vendas tus servicios aquí. Solo busca que acepten la solicitud elogiando su trabajo. (ATENCIÓN: Límite estricto de máximo 300 caracteres, ya que LinkedIn no permite notas más largas en conexiones).' : objective === 'followup' ? '- ES UN MENSAJE TRAS ACEPTAR LA CONEXIÓN (Follow-up). Este mensaje debe ser MÁS LARGO Y COMPLETO, estructurado en 3 párrafos. 1) Gancho/Contexto, 2) Soft Pitch profundo: Vincula tu diferencial técnico y artístico con lo que ellos hacen (habla de biomecánica, luz, dirección), 3) Llamado a la acción de baja fricción.' : '- ES UNA SOLICITUD DE REUNIÓN DIRECTA. Mensaje extenso, profesional y persuasivo. 1) Gancho, 2) Demuestra tu valor (por qué un ex-bailarín que opera cámara mejora sus producciones), 3) Propuesta concreta de colaboración, 4) Call to action para una videollamada.'}
Tono general: ${tone}.
${contextText.trim() ? `\nCONTEXTO CRÍTICO / NOTICIA: El usuario ha proveído esta información adicional sobre el contacto o su empresa: "${contextText}". DEBES incorporar inteligentemente esta noticia o contexto en el gancho inicial de tus mensajes para demostrar que estás al día con su trabajo.` : ''}

Reglas Estrictas:
1. Encuentra un "Gancho" específico en su perfil (o en el contexto/noticia provisto) para iniciar la conversación. MUESTRA que investigaste.
2. NUNCA uses clichés como "innovador", "revolucionario", "espero que estés bien", "juntos podemos hacer sinergia", "espero que este mensaje te encuentre bien". Escribe como un humano directo, inteligente y altamente profesional.
3. Las opciones deben ser estructuradas, legibles y completas (salvo en el caso de la conexión que debe ser corta):
   - Opción 1: Profundiza en el valor de tu técnica (dirección escénica, movimiento, iluminación) en relación a las producciones de su empresa.
   - Opción 2: Centrada fuertemente en el impacto estético de la Noticia/Contexto que el usuario te dio.
   - Opción 3: Un acercamiento más consultivo y enfocado en discutir los retos de sus producciones audiovisuales.
4. Devuelve la respuesta en formato JSON estricto con esta estructura:
{
  "analisis_perfil": "Breve análisis estratégico de por qué esta persona es un buen contacto y qué gancho vas a usar.",
  "opcion_1": "texto del mensaje",
  "opcion_2": "texto del mensaje",
  "opcion_3": "texto del mensaje"
}`;

    try {
      const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
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
        throw new Error('Error en la API. Verifica tu clave o tu conexión.');
      }

      const data = await response.json();
      const content = JSON.parse(data.choices[0].message.content);
      setResults(content);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-200 font-sans selection:bg-indigo-500/30">
      
      {/* HEADER */}
      <header className="border-b border-neutral-800 bg-neutral-900/50 p-6 flex justify-between items-center sticky top-0 z-10 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2 rounded-lg shadow-lg shadow-indigo-900/50">
            <Camera className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">Visual Hunter</h1>
            <p className="text-xs text-neutral-400 font-medium">Networking B2B Inteligente</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setShowHelp(true)}
            className="p-2 rounded-md bg-indigo-900/30 hover:bg-indigo-900/50 text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-2 border border-indigo-900/50"
          >
            <HelpCircle className="w-5 h-5" />
            <span className="text-sm font-medium hidden sm:inline">Guía de Acción</span>
          </button>
          <button 
            onClick={() => setShowSettings(true)}
            className="p-2 rounded-md hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors border border-transparent hover:border-neutral-700"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* HELP MODAL */}
      <AnimatePresence>
        {showHelp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-5 border-b border-neutral-800 flex justify-between items-center bg-neutral-900 sticky top-0 z-10">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-indigo-400" />
                  Manual Táctico: Paso a Paso
                </h2>
                <button onClick={() => setShowHelp(false)} className="text-neutral-500 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-8 overflow-y-auto custom-scrollbar">
                
                <section>
                  <h3 className="text-md font-bold text-indigo-400 mb-3 flex items-center gap-2">
                    <span className="bg-indigo-950 text-indigo-300 w-6 h-6 rounded-full flex items-center justify-center text-xs">1</span>
                    La Búsqueda Booleana en LinkedIn
                  </h3>
                  <p className="text-sm text-neutral-400 mb-3">Pega estas cadenas exactas en el buscador de LinkedIn y filtra por "Madrid":</p>
                  <div className="space-y-3">
                    <div className="bg-neutral-950 border border-neutral-800 p-3 rounded-lg relative group">
                      <p className="text-xs text-neutral-500 mb-1 font-medium">Para Publicidad / Comerciales:</p>
                      <code className="text-sm text-neutral-300 select-all font-mono">("Director Creativo" OR "Director de Arte") AND (Agencia OR Publicidad)</code>
                    </div>
                    <div className="bg-neutral-950 border border-neutral-800 p-3 rounded-lg relative group">
                      <p className="text-xs text-neutral-500 mb-1 font-medium">Para Teatro / Danza / Artes:</p>
                      <code className="text-sm text-neutral-300 select-all font-mono">("Productor" OR "Director de casting" OR "Event Manager") AND (Teatro OR Danza OR Artes Escénicas)</code>
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="text-md font-bold text-indigo-400 mb-3 flex items-center gap-2">
                    <span className="bg-indigo-950 text-indigo-300 w-6 h-6 rounded-full flex items-center justify-center text-xs">2</span>
                    Generar el Mensaje con Contexto
                  </h3>
                  <ul className="space-y-3 text-sm text-neutral-300 list-none pl-2 border-l-2 border-neutral-800">
                    <li className="pl-4 relative before:content-[''] before:absolute before:left-[-5px] before:top-[6px] before:w-2 before:h-2 before:bg-indigo-500 before:rounded-full">Copia el bloque de su "Experiencia" o "Acerca de" y pégalo en Datos del Prospecto.</li>
                    <li className="pl-4 relative before:content-[''] before:absolute before:left-[-5px] before:top-[6px] before:w-2 before:h-2 before:bg-indigo-500 before:rounded-full"><strong>¿Tienen alguna noticia reciente?</strong> Si acaban de lanzar una campaña o ganaron un premio, escríbelo en la caja de <em>Noticia/Contexto</em>.</li>
                    <li className="pl-4 relative before:content-[''] before:absolute before:left-[-5px] before:top-[6px] before:w-2 before:h-2 before:bg-indigo-500 before:rounded-full">Selecciona "Mensaje de Conexión" y haz clic en Generar.</li>
                  </ul>
                </section>

                <section>
                  <h3 className="text-md font-bold text-indigo-400 mb-3 flex items-center gap-2">
                    <span className="bg-indigo-950 text-indigo-300 w-6 h-6 rounded-full flex items-center justify-center text-xs">3</span>
                    El Envío y Seguimiento (Follow-up)
                  </h3>
                  <div className="bg-neutral-950/50 border border-neutral-800 rounded-lg p-4 text-sm text-neutral-300 space-y-4">
                    <p><strong>Día 1:</strong> Envía tu solicitud de conexión (Objetivo: <em>Mensaje de Conexión</em>). Recuerda: CERO VENTAS, solo buscar conectar por afinidad.</p>
                    <p><strong>Día 3-5 (Tras aceptar):</strong> Vuelve al Dashboard, pega su perfil de nuevo, pero ahora elige el objetivo <strong>"Venta Suave (Follow-up)"</strong>. Aquí SÍ la IA ofrecerá tus servicios como Director de Cámara.</p>
                    <p className="text-red-400 font-medium">⚠️ Regla de Oro: Si no responden a este segundo mensaje, NO insistas. Pasa al siguiente lead.</p>
                  </div>
                </section>

              </div>
              <div className="p-4 border-t border-neutral-800 bg-neutral-900 flex justify-end">
                <button 
                  onClick={() => setShowHelp(false)}
                  className="bg-neutral-800 hover:bg-neutral-700 text-white text-sm font-medium py-2 px-6 rounded-lg transition-colors"
                >
                  Entendido, ¡A cazar prospectos!
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SETTINGS MODAL */}
      <AnimatePresence>
        {showSettings && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-5 border-b border-neutral-800 flex justify-between items-center">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Settings className="w-5 h-5 text-indigo-400" />
                  Configuración del Sistema
                </h2>
                <button onClick={() => setShowSettings(false)} className="text-neutral-500 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-5 overflow-y-auto">
                
                <div>
                  <label className="block text-sm font-medium text-indigo-400 mb-1">DeepSeek API Key</label>
                  <p className="text-xs text-neutral-500 mb-2">Necesaria para generar los mensajes. Se guarda localmente.</p>
                  <div className="relative">
                    <Key className="w-4 h-4 text-neutral-500 absolute left-3 top-3" />
                    <input
                      type="password"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-lg pl-9 pr-4 py-2.5 text-sm focus:border-indigo-500 transition-colors text-neutral-200"
                      placeholder="sk-..."
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-indigo-400 mb-1">Tu Identidad / Biografía</label>
                  <p className="text-xs text-neutral-500 mb-2">¿Quién eres? La IA usará esto para presentarte.</p>
                  <textarea
                    value={userIdentity}
                    onChange={(e) => setUserIdentity(e.target.value)}
                    className="w-full h-24 bg-neutral-950 border border-neutral-800 rounded-lg p-3 text-sm focus:border-indigo-500 transition-colors text-neutral-200 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-indigo-400 mb-1">Tu Ventaja Injusta (Diferencial)</label>
                  <p className="text-xs text-neutral-500 mb-2">¿Qué te hace único? La IA usará esto como tu argumento de venta.</p>
                  <textarea
                    value={userAdvantage}
                    onChange={(e) => setUserAdvantage(e.target.value)}
                    className="w-full h-24 bg-neutral-950 border border-neutral-800 rounded-lg p-3 text-sm focus:border-indigo-500 transition-colors text-neutral-200 resize-none"
                  />
                </div>

              </div>
              <div className="p-5 border-t border-neutral-800 bg-neutral-950/50 flex justify-end">
                <button 
                  onClick={saveSettings}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2 px-6 rounded-lg flex items-center gap-2 transition-colors"
                >
                  <Save className="w-4 h-4" />
                  Guardar Cambios
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <main className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN - INPUT */}
        <section className="lg:col-span-5 space-y-6">
          <div className="bg-neutral-900 rounded-xl p-6 border border-neutral-800 shadow-xl">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-indigo-400" />
              Datos del Prospecto
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-2">
                  Perfil de LinkedIn (Copia y pega la Experiencia o el "Acerca de")
                </label>
                <textarea
                  value={profileText}
                  onChange={(e) => setProfileText(e.target.value)}
                  className="w-full h-32 bg-neutral-950 border border-neutral-800 rounded-lg p-4 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all resize-none text-neutral-300 shadow-inner"
                  placeholder="Ej: Director Creativo en Agencia X. Liderando campañas visuales..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-2 flex items-center gap-2">
                  <Newspaper className="w-4 h-4 text-neutral-500" />
                  Noticia o Contexto Reciente (Opcional)
                </label>
                <textarea
                  value={contextText}
                  onChange={(e) => setContextText(e.target.value)}
                  className="w-full h-24 bg-neutral-950 border border-neutral-800 rounded-lg p-4 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all resize-none text-neutral-300 shadow-inner"
                  placeholder="Ej: Acaban de lanzar una nueva campaña de moda, o han ganado un premio a mejor producción escénica..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-400 mb-2">Fase de Venta</label>
                  <select
                    value={objective}
                    onChange={(e) => setObjective(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-3 text-sm focus:outline-none focus:border-indigo-500 text-neutral-300"
                  >
                    <option value="conexion">1. Solicitar Conexión (Cero Ventas)</option>
                    <option value="followup">2. Mensaje tras aceptar (Venta Suave)</option>
                    <option value="reunion">3. Solicitar Reunión (Directo)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-400 mb-2">Tono</label>
                  <select
                    value={tone}
                    onChange={(e) => setTone(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-3 text-sm focus:outline-none focus:border-indigo-500 text-neutral-300"
                  >
                    <option value="creativo">Artístico / Creativo</option>
                    <option value="directo">Directo / Ejecutivo</option>
                    <option value="casual">Casual / Colega</option>
                  </select>
                </div>
              </div>

              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 bg-red-950/50 border border-red-900 rounded-lg text-red-400 text-sm"
                >
                  {error}
                </motion.div>
              )}

              <button
                onClick={generateMessages}
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50 shadow-lg shadow-indigo-900/20"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Generar Mensajes Estratégicos
                  </>
                )}
              </button>
            </div>
          </div>
        </section>

        {/* RIGHT COLUMN - OUTPUT */}
        <section className="lg:col-span-7">
          {!results && !loading && (
            <div className="h-full min-h-[400px] border-2 border-dashed border-neutral-800/60 rounded-xl flex flex-col items-center justify-center text-neutral-500 bg-neutral-900/20">
              <Target className="w-12 h-12 mb-4 opacity-20" />
              <p>Pega el perfil y el contexto para iniciar el análisis.</p>
            </div>
          )}

          {loading && (
            <div className="h-full min-h-[400px] border border-neutral-800 bg-neutral-900/50 rounded-xl flex flex-col items-center justify-center text-indigo-400">
              <Loader2 className="w-8 h-8 animate-spin mb-4" />
              <p className="animate-pulse font-medium">Cruzando datos del perfil y las noticias...</p>
            </div>
          )}

          {results && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="bg-indigo-950/20 border border-indigo-900/40 rounded-xl p-5 shadow-inner">
                <h3 className="text-sm font-semibold text-indigo-400 mb-2 flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Análisis Estratégico del Prospecto
                </h3>
                <p className="text-sm text-indigo-200/90 leading-relaxed">
                  {results.analisis_perfil}
                </p>
              </div>

              <div className="grid gap-4">
                {[
                  { title: "Opción 1: Centrado en Diferencial Técnico", text: results.opcion_1 },
                  { title: "Opción 2: Centrado en Contexto/Noticia", text: results.opcion_2 },
                  { title: "Opción 3: Casual y Networking", text: results.opcion_3 }
                ].map((opt, idx) => (
                  <motion.div 
                    key={idx} 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="bg-neutral-900 rounded-xl p-5 border border-neutral-800 hover:border-indigo-900/50 transition-colors group shadow-lg"
                  >
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                        {opt.title}
                      </span>
                      <button
                        onClick={() => copyToClipboard(opt.text)}
                        className="text-neutral-400 hover:text-white transition-colors flex items-center gap-1.5 text-xs font-medium bg-neutral-800 hover:bg-indigo-600 px-3 py-1.5 rounded-md opacity-0 group-hover:opacity-100 focus:opacity-100"
                      >
                        <Copy className="w-3 h-3" />
                        Copiar
                      </button>
                    </div>
                    <p className="text-neutral-300 text-sm leading-relaxed whitespace-pre-wrap">
                      {opt.text}
                    </p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;
