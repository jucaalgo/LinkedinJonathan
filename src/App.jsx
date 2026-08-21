import React, { useState } from 'react';
import { 
  Camera, 
  Send, 
  Copy, 
  Check, 
  Loader2, 
  Sparkles, 
  User, 
  Target, 
  Key, 
  Settings, 
  X, 
  Save, 
  HelpCircle, 
  BookOpen, 
  Newspaper, 
  Film, 
  Flame, 
  ChevronRight, 
  Layers, 
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function App() {
  const [profileText, setProfileText] = useState('');
  const [contextText, setContextText] = useState('');
  const [objective, setObjective] = useState('followup');
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
  const [copiedIndex, setCopiedIndex] = useState(null);

  const saveSettings = () => {
    localStorage.setItem('vh_apiKey', apiKey);
    localStorage.setItem('vh_identity', userIdentity);
    localStorage.setItem('vh_advantage', userAdvantage);
    setShowSettings(false);
  };

  const generateMessages = async () => {
    if (!profileText.trim()) {
      setError('Por favor, pega el perfil o la trayectoria del contacto.');
      return;
    }

    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          profileText,
          contextText,
          objective,
          tone,
          apiKey,
          userIdentity,
          userAdvantage
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al conectar con el servidor.');
      }

      setResults(data);
    } catch (err) {
      console.error('Generation error:', err);
      setError(err.message || 'Error de conexión. Verifica tu clave o la configuración en Vercel.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2500);
  };

  return (
    <div className="min-h-screen bg-[#07080c] text-slate-100 font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      
      {/* BACKGROUND AMBIENT GLOW */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl" />
        <div className="absolute top-1/3 right-10 w-80 h-80 bg-violet-600/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 left-1/3 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
      </div>

      {/* HEADER */}
      <header className="relative z-20 border-b border-white/[0.08] bg-[#0b0d14]/80 backdrop-blur-xl px-6 py-4 sticky top-0">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          
          {/* Logo & Title */}
          <div className="flex items-center gap-3.5">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-700 flex items-center justify-center shadow-lg shadow-indigo-500/25 ring-1 ring-white/20">
                <Film className="w-5 h-5 text-white" />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full ring-2 ring-[#0b0d14] animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold tracking-tight text-white font-['Outfit']">Visual Hunter</h1>
                <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  Studio AI
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">Prospección & Dirección de Cámara B2B</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5">
            <button 
              onClick={() => setShowHelp(true)}
              className="px-3.5 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-white transition-all text-xs font-semibold flex items-center gap-2 border border-white/[0.08] hover:border-indigo-500/40 cursor-pointer"
            >
              <BookOpen className="w-4 h-4 text-indigo-400" />
              <span className="hidden sm:inline">Guía de Acción</span>
            </button>

            <button 
              onClick={() => setShowSettings(true)}
              className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-white transition-all border border-white/[0.08] hover:border-indigo-500/40 cursor-pointer"
              title="Configuración de Perfil & API"
            >
              <Settings className="w-4 h-4 text-slate-300" />
            </button>
          </div>

        </div>
      </header>

      {/* HELP MODAL */}
      <AnimatePresence>
        {showHelp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="glass-panel rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[85vh] border border-white/10"
            >
              <div className="p-5 border-b border-white/10 flex justify-between items-center bg-[#0e111a]">
                <h2 className="text-base font-bold text-white flex items-center gap-2.5 font-['Outfit']">
                  <BookOpen className="w-5 h-5 text-indigo-400" />
                  Manual Táctico de Prospección
                </h2>
                <button 
                  onClick={() => setShowHelp(false)} 
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-6 overflow-y-auto text-sm text-slate-300">
                
                {/* Step 1 */}
                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-2">
                  <div className="flex items-center gap-2 text-indigo-400 font-bold font-['Outfit']">
                    <span className="w-6 h-6 rounded-lg bg-indigo-500/20 flex items-center justify-center text-xs text-indigo-300">1</span>
                    Búsqueda Booleana en LinkedIn (Filtro: Madrid)
                  </div>
                  <p className="text-xs text-slate-400">Pega esto en el buscador de LinkedIn para encontrar decisores:</p>
                  <div className="space-y-2 pt-1 font-mono text-xs">
                    <div className="p-2.5 rounded-lg bg-black/40 border border-white/5 text-slate-300 select-all">
                      ("Director Creativo" OR "Director de Arte") AND (Agencia OR Publicidad)
                    </div>
                    <div className="p-2.5 rounded-lg bg-black/40 border border-white/5 text-slate-300 select-all">
                      ("Productor" OR "Director de Producción" OR "Line Producer") AND (Audiovisual OR Cine OR Danza)
                    </div>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-2">
                  <div className="flex items-center gap-2 text-indigo-400 font-bold font-['Outfit']">
                    <span className="w-6 h-6 rounded-lg bg-indigo-500/20 flex items-center justify-center text-xs text-indigo-300">2</span>
                    El Embudo en 2 Fases (No vendas al conectar)
                  </div>
                  <ul className="text-xs space-y-2 text-slate-300 list-disc list-inside">
                    <li><strong className="text-indigo-300">Fase 1 (Conexión):</strong> Mensaje corto (menos de 300 caracteres). Solo elogia un proyecto o felicita por su trayectoria. Cero ofertas comerciales.</li>
                    <li><strong className="text-indigo-300">Fase 2 (Tras aceptar):</strong> A los 2 o 3 días, envías el mensaje de 2 párrafos que genera esta app, vinculando la biomecánica de la danza con la dirección de cámara.</li>
                  </ul>
                </div>

                {/* Step 3 */}
                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-2">
                  <div className="flex items-center gap-2 text-indigo-400 font-bold font-['Outfit']">
                    <span className="w-6 h-6 rounded-lg bg-indigo-500/20 flex items-center justify-center text-xs text-indigo-300">3</span>
                    La Clave: El Campo "Noticia o Contexto"
                  </div>
                  <p className="text-xs text-slate-400">
                    Si el director acaba de estrenar un videoclip, un comercial o una obra de teatro, copia ese dato en la caja de <em>Noticia</em>. La IA lo usará de rompehielos de alta categoría.
                  </p>
                </div>

              </div>

              <div className="p-4 border-t border-white/10 bg-[#0b0d14] flex justify-end">
                <button 
                  onClick={() => setShowHelp(false)}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold py-2.5 px-5 rounded-xl transition-all shadow-lg shadow-indigo-600/30"
                >
                  Cerrar y Empezar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SETTINGS MODAL */}
      <AnimatePresence>
        {showSettings && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="glass-panel rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh] border border-white/10"
            >
              <div className="p-5 border-b border-white/10 flex justify-between items-center bg-[#0e111a]">
                <h2 className="text-base font-bold text-white flex items-center gap-2 font-['Outfit']">
                  <Settings className="w-5 h-5 text-indigo-400" />
                  Configuración del Sistema
                </h2>
                <button 
                  onClick={() => setShowSettings(false)} 
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-5 overflow-y-auto text-xs">
                
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="font-semibold text-indigo-300">DeepSeek API Key (Opcional si está en Vercel)</label>
                    <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" /> Encriptada localmente
                    </span>
                  </div>
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors font-mono"
                    placeholder="sk-..."
                  />
                  <p className="text-[11px] text-slate-500 mt-1">Si agregaste la variable en Vercel, no necesitas rellenar este campo.</p>
                </div>

                <div>
                  <label className="block font-semibold text-indigo-300 mb-1.5">Identidad Profesional</label>
                  <textarea
                    value={userIdentity}
                    onChange={(e) => setUserIdentity(e.target.value)}
                    className="w-full h-20 bg-black/40 border border-white/10 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors resize-none leading-relaxed"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-indigo-300 mb-1.5">Ventaja Injusta (Diferencial de Venta)</label>
                  <textarea
                    value={userAdvantage}
                    onChange={(e) => setUserAdvantage(e.target.value)}
                    className="w-full h-28 bg-black/40 border border-white/10 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors resize-none leading-relaxed"
                  />
                </div>

              </div>

              <div className="p-4 border-t border-white/10 bg-[#0b0d14] flex justify-end">
                <button 
                  onClick={saveSettings}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5 px-6 rounded-xl flex items-center gap-2 text-xs transition-all shadow-lg shadow-indigo-600/30"
                >
                  <Save className="w-4 h-4" />
                  Guardar Preferencias
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MAIN CONTAINER */}
      <main className="relative z-10 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
        
        {/* LEFT COLUMN: INPUTS */}
        <section className="lg:col-span-5 space-y-6">
          <div className="glass-panel rounded-2xl p-5 sm:p-6 border border-white/[0.08] shadow-2xl space-y-5">
            
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3.5">
              <h2 className="text-sm font-bold text-white tracking-wide uppercase font-['Outfit'] flex items-center gap-2">
                <User className="w-4 h-4 text-indigo-400" />
                Datos del Prospecto
              </h2>
              <span className="text-[11px] text-slate-500 font-medium">Paso 1 de 2</span>
            </div>

            {/* Profile Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Perfil de LinkedIn (Experiencia / Acerca de)
              </label>
              <textarea
                value={profileText}
                onChange={(e) => setProfileText(e.target.value)}
                className="w-full h-32 glass-input rounded-xl p-3.5 text-xs focus:outline-none transition-all resize-none text-slate-200 placeholder:text-slate-600 leading-relaxed font-sans"
                placeholder="Pega aquí el texto del perfil del Director de Arte, Productor o Creativo..."
              />
            </div>

            {/* Context / News Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
                <Newspaper className="w-3.5 h-3.5 text-indigo-400" />
                Noticia, Campaña o Contexto Reciente <span className="text-slate-500 font-normal">(Opcional)</span>
              </label>
              <textarea
                value={contextText}
                onChange={(e) => setContextText(e.target.value)}
                className="w-full h-20 glass-input rounded-xl p-3.5 text-xs focus:outline-none transition-all resize-none text-slate-200 placeholder:text-slate-600 leading-relaxed"
                placeholder="Ej: Acaban de lanzar el anuncio de primavera de Loewe, o estrenaron obra en Teatros del Canal..."
              />
            </div>

            {/* Phase Selector */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-300">
                Fase de Prospección
              </label>
              <div className="grid grid-cols-1 gap-2">
                {[
                  { id: 'conexion', label: '1. Solicitud de Conexión', desc: '< 300 caracteres · Cero Ventas' },
                  { id: 'followup', label: '2. Tras Aceptar (Venta Suave)', desc: '2 Párrafos ágiles · Biomecánica & Cámara' },
                  { id: 'reunion', label: '3. Solicitud de Reunión', desc: 'Comercial · Directo a videollamada' }
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setObjective(item.id)}
                    className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
                      objective === item.id 
                        ? 'bg-indigo-600/15 border-indigo-500/50 text-white shadow-sm' 
                        : 'bg-white/[0.02] border-white/[0.05] text-slate-400 hover:bg-white/[0.04] hover:text-slate-200'
                    }`}
                  >
                    <div>
                      <p className={`text-xs font-semibold ${objective === item.id ? 'text-indigo-300' : 'text-slate-300'}`}>
                        {item.label}
                      </p>
                      <p className="text-[10px] text-slate-500">{item.desc}</p>
                    </div>
                    {objective === item.id && (
                      <div className="w-2 h-2 rounded-full bg-indigo-400 shadow-sm shadow-indigo-400" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Tone Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Tono del Copy
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'creativo', label: 'Cinemático' },
                  { id: 'directo', label: 'Ejecutivo' },
                  { id: 'casual', label: 'Colega' }
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTone(t.id)}
                    className={`py-2 px-3 rounded-lg text-xs font-medium border transition-all text-center cursor-pointer ${
                      tone === t.id
                        ? 'bg-white/10 border-indigo-400/40 text-white'
                        : 'bg-white/[0.02] border-white/[0.05] text-slate-400 hover:bg-white/[0.05]'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs leading-relaxed"
              >
                {error}
              </motion.div>
            )}

            {/* Action Submit */}
            <button
              onClick={generateMessages}
              disabled={loading}
              className="w-full bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-xl shadow-indigo-600/25 cursor-pointer font-['Outfit'] tracking-wide text-sm"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Analizando con DeepSeek...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-indigo-200" />
                  <span>Generar 3 Opciones de Mensaje</span>
                </>
              )}
            </button>

          </div>
        </section>

        {/* RIGHT COLUMN: RESULTS */}
        <section className="lg:col-span-7 space-y-6">
          
          {/* Empty State */}
          {!results && !loading && (
            <div className="h-full min-h-[460px] glass-panel rounded-2xl border border-white/[0.06] flex flex-col items-center justify-center p-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center mb-4 text-slate-500">
                <Target className="w-8 h-8 opacity-40" />
              </div>
              <h3 className="text-base font-bold text-slate-200 font-['Outfit'] mb-1">Centro de Redacción Estratégica</h3>
              <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
                Pega el perfil de un director de arte o productor a la izquierda y genera 3 variantes de copywriting listas para enviar.
              </p>
            </div>
          )}

          {/* Loading Skeleton */}
          {loading && (
            <div className="h-full min-h-[460px] glass-panel rounded-2xl border border-white/[0.06] flex flex-col items-center justify-center p-8 text-center space-y-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin" />
                <Film className="w-6 h-6 text-indigo-400 absolute inset-0 m-auto animate-pulse" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-200 font-['Outfit']">Cruzando datos con tu ventaja competitiva...</p>
                <p className="text-xs text-slate-500 mt-1">Sintetizando biomecánica, timing escénico e iluminación en 2 párrafos.</p>
              </div>
            </div>
          )}

          {/* Results Render */}
          {results && (
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-5"
            >
              {/* Strategic Diagnosis Card */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-950/40 via-violet-950/30 to-transparent border border-indigo-500/20 shadow-lg">
                <div className="flex items-center gap-2 mb-1.5">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-300 font-['Outfit']">
                    Diagnóstico del Contacto
                  </h3>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {results.analisis_perfil}
                </p>
              </div>

              {/* 3 Message Cards */}
              <div className="space-y-4">
                {[
                  { 
                    tag: 'Opción 1: Enfoque Biomecánica & Dirección', 
                    icon: '🎬', 
                    text: results.opcion_1 
                  },
                  { 
                    tag: 'Opción 2: Enfoque Campaña & Actualidad', 
                    icon: '✨', 
                    text: results.opcion_2 
                  },
                  { 
                    tag: 'Opción 3: Enfoque Colega & Consultivo', 
                    icon: '🤝', 
                    text: results.opcion_3 
                  }
                ].map((item, idx) => (
                  <motion.div 
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.08 }}
                    className="glass-card rounded-2xl p-5 border border-white/[0.08] hover:border-indigo-500/30 transition-all shadow-xl group relative"
                  >
                    <div className="flex items-center justify-between border-b border-white/[0.06] pb-3 mb-3.5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{item.icon}</span>
                        <span className="text-xs font-bold text-indigo-300 font-['Outfit']">
                          {item.tag}
                        </span>
                      </div>
                      
                      <button
                        onClick={() => copyToClipboard(item.text, idx)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                          copiedIndex === idx
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : 'bg-white/[0.05] hover:bg-indigo-600 text-slate-300 hover:text-white border border-white/10'
                        }`}
                      >
                        {copiedIndex === idx ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span>¡Copiado!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copiar</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="text-xs text-slate-200 leading-relaxed whitespace-pre-line font-sans">
                      {item.text}
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-white/[0.04] flex justify-between items-center text-[10px] text-slate-500">
                      <span>Estructura de 2 párrafos concisos</span>
                      <span>{item.text?.length || 0} caracteres</span>
                    </div>
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
