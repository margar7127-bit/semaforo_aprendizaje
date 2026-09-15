import React, { useState } from 'react';
import { 
  CheckCircle2, AlertTriangle, XCircle, Send, UserCheck, 
  HelpCircle, Lock, Download, RefreshCw, BarChart2, Heart, Sparkles 
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { supabase } from './supabaseClient';

export default function App() {
  // Estado de vistas: 'estudiante' | 'docente'
  const [vista, setVista] = useState('estudiante');

  // Formulario Estudiante
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [evaluacion, setEvaluacion] = useState(null);
  const [preguntas, setPreguntas] = useState('');
  const [sentimiento, setSentimiento] = useState('');
  const [parteFavorita, setParteFavorita] = useState('');
  const [enviado, setEnviado] = useState(false);
  const [loadingGuardar, setLoadingGuardar] = useState(false);

  // Panel Docente
  const [password, setPassword] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [respuestas, setRespuestas] = useState([]);
  const [loadingRespuestas, setLoadingRespuestas] = useState(false);
  const [filtro, setFiltro] = useState('todos');

  const opcionesComprension = [
    {
      id: 'verde',
      label: '¡Entendí todo!',
      desc: 'Comprendí perfectamente el tema tratado hoy.',
      color: 'bg-emerald-50 border-emerald-500 text-emerald-700 hover:bg-emerald-100',
      activeColor: 'bg-emerald-600 text-white border-emerald-600 shadow-lg scale-105',
      icon: CheckCircle2,
      requierePreguntas: false,
    },
    {
      id: 'amarilla',
      label: 'Tengo algunas dudas',
      desc: 'Entendí la mayoría, pero aún me quedan vacíos.',
      color: 'bg-amber-50 border-amber-500 text-amber-700 hover:bg-amber-100',
      activeColor: 'bg-amber-500 text-white border-amber-500 shadow-lg scale-105',
      icon: AlertTriangle,
      requierePreguntas: true,
    },
    {
      id: 'roja',
      label: 'No entendí el tema',
      desc: 'Necesito refuerzo completo del tema de hoy.',
      color: 'bg-rose-50 border-rose-500 text-rose-700 hover:bg-rose-100',
      activeColor: 'bg-rose-600 text-white border-rose-600 shadow-lg scale-105',
      icon: XCircle,
      requierePreguntas: true,
    },
  ];

  const opcionesSentimiento = [
    { label: 'Motivado/a', emoji: '🚀' },
    { label: 'Entusiasmado/a', emoji: '🤩' },
    { label: 'Neutral', emoji: '😐' },
    { label: 'Confundido/a', emoji: '😕' },
    { label: 'Cansado/a', emoji: '😴' },
  ];

  // Enviar respuestas a Supabase
 const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nombre.trim() || !apellido.trim() || !evaluacion || !sentimiento) return;

    const opcionSeleccionada = opcionesComprension.find((o) => o.id === evaluacion);
    if (opcionSeleccionada?.requierePreguntas && !preguntas.trim()) return;

    setLoadingGuardar(true);

    try {
      const { data, error } = await supabase.from('evaluaciones').insert([
        {
          estudiante: `${nombre.trim()} ${apellido.trim()}`,
          nivel: evaluacion,
          preguntas: opcionSeleccionada?.requierePreguntas ? preguntas.trim() : 'Sin preguntas',
          sentimiento: sentimiento,
          parte_favorita: parteFavorita.trim() || 'No especificado',
        },
      ]);

      if (error) throw error;

      if (evaluacion === 'verde') {
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      }
      setEnviado(true);
    } catch (err) {
      console.error('--- DETALLE DEL ERROR DE SUPABASE ---');
      console.error(err);

      // Muestra el mensaje detallado que devuelve Supabase
      const mensajeError = err.message || err.error_description || JSON.stringify(err);
      alert(`Error al guardar: ${mensajeError}`);
    } finally {
      setLoadingGuardar(false);
    }
  };

  // Cargar respuestas para el docente
  const cargarRespuestas = async () => {
    setLoadingRespuestas(true);
    try {
      const { data, error } = await supabase
        .from('evaluaciones')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRespuestas(data || []);
    } catch (err) {
      console.error('Error al cargar respuestas:', err);
    } finally {
      setLoadingRespuestas(false);
    }
  };

  const handleLoginDocente = (e) => {
    e.preventDefault();
    if (password === 'docente123') { // Puedes cambiar la contraseña aquí
      setAuthenticated(true);
      cargarRespuestas();
    } else {
      alert('Contraseña incorrecta');
    }
  };

  // Exportar a CSV
  const exportarCSV = () => {
    if (respuestas.length === 0) return;
    const headers = ['ID', 'Fecha', 'Estudiante', 'Nivel Comprension', 'Sentimiento', 'Parte Favorita', 'Preguntas/Dudas'];
    const rows = respuestas.map((r) => [
      r.id,
      new Date(r.created_at).toLocaleString(),
      `"${r.estudiante}"`,
      r.nivel,
      `"${r.sentimiento || 'N/A'}"`,
      `"${(r.parte_favorita || '').replace(/"/g, '""')}"`,
      `"${(r.preguntas || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `reporte_clase_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const resetForm = () => {
    setNombre('');
    setApellido('');
    setEvaluacion(null);
    setPreguntas('');
    setSentimiento('');
    setParteFavorita('');
    setEnviado(false);
  };

  const requierePreguntas = opcionesComprension.find((o) => o.id === evaluacion)?.requierePreguntas;

  // Filtrado de respuestas para el docente
  const respuestasFiltradas = respuestas.filter((r) => {
    if (filtro === 'todos') return true;
    return r.nivel === filtro;
  });

  const conteoVerde = respuestas.filter((r) => r.nivel === 'verde').length;
  const conteoAmarillo = respuestas.filter((r) => r.nivel === 'amarilla').length;
  const conteoRojo = respuestas.filter((r) => r.nivel === 'roja').length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-between p-4 sm:p-6">
      
      {/* Selector superior de vista */}
      <div className="w-full max-w-2xl flex justify-end mb-4">
        <button
          onClick={() => setVista(vista === 'estudiante' ? 'docente' : 'estudiante')}
          className="text-xs bg-slate-200 hover:bg-slate-300 text-slate-700 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition font-medium"
        >
          {vista === 'estudiante' ? <Lock className="w-3.5 h-3.5" /> : <BarChart2 className="w-3.5 h-3.5" />}
          {vista === 'estudiante' ? 'Acceso Docente' : 'Vista Estudiante'}
        </button>
      </div>

      {/* VISTA ESTUDIANTE */}
      {vista === 'estudiante' && (
        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 max-w-2xl w-full p-6 sm:p-10 space-y-8 my-auto">
          {enviado ? (
            <div className="text-center space-y-4 py-8">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <UserCheck className="w-10 h-10" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800">¡Evaluación Enviada!</h2>
              <p className="text-slate-600">
                Gracias <span className="font-semibold text-slate-800">{nombre}</span>. Tus respuestas fueron registradas exitosamente.
              </p>
              <button
                onClick={resetForm}
                className="w-full mt-4 bg-slate-800 hover:bg-slate-900 text-white py-3 rounded-xl font-medium transition duration-200"
              >
                Enviar otra respuesta
              </button>
            </div>
          ) : (
            <>
              <div className="text-center space-y-2">
                <span className="inline-block bg-indigo-50 text-indigo-600 text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider">
                  Retroalimentación de Clase
                </span>
                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                  ¿Qué tal estuvo la clase de hoy?
                </h1>
                <p className="text-slate-500 text-sm">
                  Completa tus datos y cuéntanos tu experiencia.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Datos Personales */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Nombre <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. Pedro"
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 transition outline-none text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Apellido <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. Perez"
                      value={apellido}
                      onChange={(e) => setApellido(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 transition outline-none text-slate-800"
                    />
                  </div>
                </div>

                {/* Nivel de Comprensión (Semáforo) */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-slate-700">
                    1. ¿Cómo evaluaste la comprensión del tema? <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {opcionesComprension.map((item) => {
                      const Icon = item.icon;
                      const isSelected = evaluacion === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setEvaluacion(item.id)}
                          className={`p-5 rounded-2xl border-2 text-left transition-all duration-200 flex flex-col justify-between space-y-3 ${
                            isSelected ? item.activeColor : item.color
                          }`}
                        >
                          <div className="flex items-center justify-between w-full">
                            <Icon className="w-8 h-8" />
                            <div className={`w-4 h-4 rounded-full border-2 ${isSelected ? 'bg-white border-white' : 'border-current'}`} />
                          </div>
                          <div>
                            <h3 className="font-bold text-base">{item.label}</h3>
                            <p className={`text-xs mt-1 ${isSelected ? 'opacity-90' : 'opacity-75'}`}>{item.desc}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Preguntas/Dudas si no entendió o tiene vacíos */}
                {requierePreguntas && (
                  <div className="space-y-2 animate-fade-in">
                    <label className="block text-sm font-medium text-slate-700 flex items-center gap-1.5">
                      <HelpCircle className="w-4 h-4 text-amber-500" />
                      Escribe las preguntas o dudas que tienes <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      required
                      rows={3}
                      placeholder="Escribe de forma clara tus preguntas sobre el tema..."
                      value={preguntas}
                      onChange={(e) => setPreguntas(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 transition outline-none text-slate-800 resize-none"
                    />
                  </div>
                )}

                {/* Sentimiento durante la clase */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-slate-700 flex items-center gap-1.5">
                    <Heart className="w-4 h-4 text-rose-500" />
                    2. ¿Cómo te sentiste durante la clase? <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {opcionesSentimiento.map((s) => {
                      const isSelected = sentimiento === `${s.emoji} ${s.label}`;
                      return (
                        <button
                          key={s.label}
                          type="button"
                          onClick={() => setSentimiento(`${s.emoji} ${s.label}`)}
                          className={`px-4 py-2.5 rounded-xl border font-medium text-sm transition flex items-center gap-2 ${
                            isSelected
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow'
                              : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          <span>{s.emoji}</span>
                          <span>{s.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Parte Favorita de la Clase */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-indigo-500" />
                    3. ¿Cuál fue tu parte favorita de la clase?
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. El ejercicio práctico, las explicaciones con diagramas, etc."
                    value={parteFavorita}
                    onChange={(e) => setParteFavorita(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 transition outline-none text-slate-800"
                  />
                </div>

                {/* Botón de envío */}
                <button
                  type="submit"
                  disabled={
                    loadingGuardar ||
                    !nombre ||
                    !apellido ||
                    !evaluacion ||
                    !sentimiento ||
                    (requierePreguntas && !preguntas.trim())
                  }
                  className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-100 transition duration-200"
                >
                  <Send className="w-5 h-5" />
                  {loadingGuardar ? 'Guardando...' : 'Enviar Evaluación'}
                </button>
              </form>
            </>
          )}
        </div>
      )}

      {/* VISTA DOCENTE */}
      {vista === 'docente' && (
        <div className="w-full max-w-4xl my-auto">
          {!authenticated ? (
            <div className="bg-white rounded-3xl shadow-xl border border-slate-100 max-w-md mx-auto p-8 text-center space-y-6">
              <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto">
                <Lock className="w-7 h-7" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">Acceso Docente</h2>
              <form onSubmit={handleLoginDocente} className="space-y-4">
                <input
                  type="password"
                  placeholder="Ingresa la contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-center text-slate-800"
                />
                <button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-bold transition"
                >
                  Ingresar al Panel
                </button>
              </form>
            </div>
          ) : (
            <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-6 sm:p-8 space-y-6">
              {/* Encabezado Panel */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">Reporte de Evaluación de Clase</h1>
                  <p className="text-slate-500 text-sm">Resumen de respuestas recibidas en tiempo real.</p>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  <button
                    onClick={cargarRespuestas}
                    className="p-2.5 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 transition"
                    title="Actualizar datos"
                  >
                    <RefreshCw className={`w-5 h-5 ${loadingRespuestas ? 'animate-spin' : ''}`} />
                  </button>
                  <button
                    onClick={exportarCSV}
                    className="flex-1 sm:flex-initial bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-medium flex items-center justify-center gap-2 transition"
                  >
                    <Download className="w-4 h-4" /> Exportar CSV
                  </button>
                </div>
              </div>

              {/* Métrica Resumen */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-emerald-800">
                  <span className="text-xs font-semibold uppercase tracking-wider">Entendieron Todo</span>
                  <div className="text-3xl font-extrabold mt-1">{conteoVerde}</div>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-amber-800">
                  <span className="text-xs font-semibold uppercase tracking-wider">Tienen Dudas</span>
                  <div className="text-3xl font-extrabold mt-1">{conteoAmarillo}</div>
                </div>
                <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-rose-800">
                  <span className="text-xs font-semibold uppercase tracking-wider">No Entendieron</span>
                  <div className="text-3xl font-extrabold mt-1">{conteoRojo}</div>
                </div>
              </div>

              {/* Filtros */}
              <div className="flex gap-2 border-b border-slate-100 pb-3 text-sm">
                <button
                  onClick={() => setFiltro('todos')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition ${
                    filtro === 'todos' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Todos ({respuestas.length})
                </button>
                <button
                  onClick={() => setFiltro('verde')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition ${
                    filtro === 'verde' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-emerald-50'
                  }`}
                >
                  Verde ({conteoVerde})
                </button>
                <button
                  onClick={() => setFiltro('amarilla')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition ${
                    filtro === 'amarilla' ? 'bg-amber-500 text-white' : 'text-slate-600 hover:bg-amber-50'
                  }`}
                >
                  Amarillo ({conteoAmarillo})
                </button>
                <button
                  onClick={() => setFiltro('roja')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition ${
                    filtro === 'roja' ? 'bg-rose-600 text-white' : 'text-slate-600 hover:bg-rose-50'
                  }`}
                >
                  Rojo ({conteoRojo})
                </button>
              </div>

              {/* Lista de Registros */}
              <div className="space-y-4 max-h-[28rem] overflow-y-auto pr-1">
                {loadingRespuestas ? (
                  <p className="text-center text-slate-400 py-8">Cargando respuestas...</p>
                ) : respuestasFiltradas.length === 0 ? (
                  <p className="text-center text-slate-400 py-8">No hay respuestas registradas.</p>
                ) : (
                  respuestasFiltradas.map((item) => (
                    <div
                      key={item.id}
                      className="p-4 rounded-xl border border-slate-100 bg-slate-50 flex flex-col space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800">{item.estudiante}</span>
                          {item.sentimiento && (
                            <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md border border-indigo-100 font-medium">
                              {item.sentimiento}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                              item.nivel === 'verde'
                                ? 'bg-emerald-100 text-emerald-700'
                                : item.nivel === 'amarilla'
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-rose-100 text-rose-700'
                            }`}
                          >
                            {item.nivel === 'verde' ? 'Entendió todo' : item.nivel === 'amarilla' ? 'Dudas' : 'No entendió'}
                          </span>
                          <span className="text-xs text-slate-400">
                            {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>

                      {/* Detalles: Parte favorita */}
                      {item.parte_favorita && item.parte_favorita !== 'No especificado' && (
                        <div className="text-xs text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200/80">
                          <span className="font-semibold text-slate-500">Parte favorita: </span>
                          <span>{item.parte_favorita}</span>
                        </div>
                      )}

                      {/* Detalles: Preguntas/Dudas */}
                      {(item.nivel === 'amarilla' || item.nivel === 'roja') && (
                        <div className="bg-amber-50/60 p-2.5 rounded-lg border border-amber-200/60 text-xs text-slate-700">
                          <span className="font-semibold text-amber-800 block mb-0.5">Pregunta / Vacío reportado:</span>
                          {item.preguntas}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Pie de página */}
      <footer className="text-center text-xs text-slate-400 mt-6">
        Evaluación docente en tiempo real &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
}