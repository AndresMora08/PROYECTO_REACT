import React, { useState, useEffect } from "react";
import PageMeta from "../../components/common/PageMeta";
import { Modal } from "../../components/ui/modal";
import { useModal } from "../../hooks/useModal";
import Button from "../../components/ui/button/Button";
import { ListIcon, BoxCubeIcon } from "../../icons";

import { Carrera } from "../../models/Carrera";
import { PlanEstudio, AsignaturaPlan, EstadoPlan, DetallesPlan, VersionPlanEstudio } from "../../models/PlanEstudio";
import { DataTable, TableColumn } from "../../components/tables/BasicTables/DataTable";
/* MODIFICADO: Importación del servicio y SweetAlert para manejo de errores/éxito */
import { planEstudioService } from "../../service/planEstudioService";
import Swal from "sweetalert2";
import { Subject } from "../../models/Asignatura";

const PlanEstudioPage: React.FC = () => {
  /* --------------------------------------------------------------------------------------- */
  /* ESTADOS DEL COMPONENTE                                                                  */
  /* --------------------------------------------------------------------------------------- */
  const { isOpen, openModal, closeModal } = useModal();
  
  /* Estados para la edición de asignaturas */
  const { isOpen: isEditOpen, openModal: openEditModal, closeModal: closeEditModal } = useModal();
  const [asignaturaEnEdicion, setAsignaturaEnEdicion] = useState<AsignaturaPlan | null>(null);

  /*Estados para la publicación de nueva versión */
  const { isOpen: isPublishModalOpen, openModal: openPublishModal, closeModal: closePublishModal } = useModal();
  const [añoNuevaVersion, setAñoNuevaVersion] = useState<number>(0);

  /* Estado para el Historial de Versiones */
  const { isOpen: isHistoryOpen, openModal: openHistoryModal, closeModal: closeHistoryModal } = useModal();

  /* Gestión de vistas y selección de carrera */
  // Vista actual: 'list' (carreras) o 'edit' (plan de carrera seleccionada)
  const [currentView, setCurrentView] = useState<'list' | 'edit'>('list');
  
  // Carreras disponibles (Mock)
  const [carreras, setCarreras] = useState<Carrera[]>([]);
  
  // Catálogo global de asignaturas para búsqueda (Mock)
  const [catalogo] = useState<Subject[]>([]);

  // Plan actualmente en gestión
  const [planSeleccionado, setPlanSeleccionado] = useState<PlanEstudio | null>(null);
  
  // Carrera seleccionada
  const [carreraSeleccionada, setCarreraSeleccionada] = useState<Carrera | null>(null);
  
  /* MODIFICADO: Sustitución de Mock Data por llamada al servicio en useEffect */
  useEffect(() => {
    const fetchInitialData = async () => {
      // Cargamos carreras reales desde el backend
      const dataCarreras = await planEstudioService.getCarreras();
      setCarreras(dataCarreras);
      
      // Nota: El catálogo de asignaturas se cargará cuando el modal se abra o aquí si es global
    };

    fetchInitialData();
  }, []);

  /* MODIFICADO: Función para cargar el plan real al seleccionar una carrera */
  const cargarPlanParaCarrera = async (carrera: Carrera) => {
    setCarreraSeleccionada(carrera);
    
    // Llamada al servicio para obtener el plan vigente
    const plan = await planEstudioService.getPlanVigente(carrera.id);
    
    if (plan) {
      // Si existe el plan, también cargamos su historial de versiones
      const historial = await planEstudioService.getHistorialVersiones(plan.id);
      setPlanSeleccionado({ ...plan, versionesHistorico: historial });
    } else {
      setPlanSeleccionado(null);
      Swal.fire("Aviso", "Esta carrera aún no tiene un plan de estudios vigente configurado.", "info");
    }
    
    setCurrentView('edit');
  };

  /* MODIFICADO: Manejo real de eliminación de asignatura vinculado al backend */
  const manejarEliminarAsignatura = async (idVinculacion: string) => {
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: "Esta acción desvinculará la asignatura del plan actual.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      const exito = await planEstudioService.desvincularAsignatura(idVinculacion);
      if (exito) {
        Swal.fire('Eliminado', 'La asignatura ha sido desvinculada.', 'success');
        // Refrescamos los datos del plan
        if (carreraSeleccionada) cargarPlanParaCarrera(carreraSeleccionada);
      } else {
        Swal.fire('Error', 'No se pudo eliminar. Es posible que existan inscripciones activas (Regla E1).', 'error');
      }
    }
  };

  /* MODIFICADO: Persistencia real de la edición de asignatura */
  const manejarGuardarEdicion = async () => {
    if (planSeleccionado && asignaturaEnEdicion) {
      const exito = await planEstudioService.actualizarAsignaturaVinculada(
        asignaturaEnEdicion.id, 
        asignaturaEnEdicion
      );
      
      if (exito) {
        await Swal.fire('Guardado', 'Los cambios se han persistido correctamente.', 'success');
        closeEditModal();
        // Recargar datos para ver cambios reflejados
        if (carreraSeleccionada) cargarPlanParaCarrera(carreraSeleccionada);
      } else {
        Swal.fire('Error', 'Hubo un problema al actualizar la asignatura.', 'error');
      }
    }
  };

  /* MODIFICADO: Proceso de publicación conectado al Backend */
  const manejarConfirmarPublicacion = async () => {
    if (planSeleccionado) {
      const res = await planEstudioService.publicarNuevaVersion(planSeleccionado.id, añoNuevaVersion);
      if (res) {
        Swal.fire('¡Publicado!', `Se ha generado la versión ${añoNuevaVersion} con éxito.`, 'success');
        closePublishModal();
        if (carreraSeleccionada) cargarPlanParaCarrera(carreraSeleccionada);
      } else {
        Swal.fire('Error', 'No se pudo publicar la versión. Verifique los datos.', 'error');
      }
    }
  };

  const goBackToList = () => {
    setCurrentView('list');
    setCarreraSeleccionada(null);
    setPlanSeleccionado(null);
  };

  /* Acción para cargar datos en el modal y editar */
  const manejarEditarAsignatura = (asigPlan: AsignaturaPlan) => {
    setAsignaturaEnEdicion({ ...asigPlan });
    openEditModal();
  };
  // E2: Plan sin ninguna Asignatura vinculada -> no se permite publicar.
  const manejarAbrirModalPublicar = () => {
    if (!planSeleccionado || !planSeleccionado.asignaturasVigentes || planSeleccionado.asignaturasVigentes.length === 0) {
      alert("ERROR (E2): No se permite publicar un plan sin asignaturas.");
      return;
    }
    /* INICIO DE MODIFICACIÓN: Abrir modal de publicación */
    setAñoNuevaVersion(planSeleccionado.numeroVersionActual + 1); // Sugerir el año siguiente
    openPublishModal();
    /* FIN DE MODIFICACIÓN */
  };

  /* ========================================================================================= */
  /* DEFINICIÓN DE COLUMNAS PARA LAS TABLAS (USANDO EL MOLDE MODULAR)                          */
  /* ----------------------------------------------------------------------------------------- */

  // Configuración de columnas para la tabla de Carreras
  const careerColumns: TableColumn<Carrera>[] = [
    { header: "Nombre de Carrera", key: "nombre", render: (c) => <span className="font-semibold text-gray-800 dark:text-white/90">{c.nombre}</span> },
    { header: "Código", key: "codigo" },
    { header: "Última Actualización", key: "updatedAt" },
    { header: "Acciones", key: "actions", render: (c) => (
      <Button variant="outline" size="sm" onClick={() => cargarPlanParaCarrera(c)}>
        Gestionar Plan
      </Button>
    ) },
  ];

  // Configuración de columnas para la tabla de Asignaturas del Plan seleccionado
  const subjectColumns: TableColumn<AsignaturaPlan>[] = [
    /* INICIO DE MODIFICACIÓN: Separación de Código y Nombre */
    { header: "Asignatura", key: "nombre", render: (s) => (
      <span className="font-medium text-gray-800 dark:text-white/90">{s.asignatura?.name}</span>
    )},
    { header: "Código", key: "codigo", render: (s) => (
      <span className="text-gray-500 font-mono text-xs">{s.asignatura?.code || s.asignaturaId}</span>
    )},
    /* FIN DE MODIFICACIÓN */
    { header: "Créditos", key: "creditos" },
    { header: "Semestre Sugerido", key: "semestreSugerido", render: (s) => (
      <span className="px-2 py-1 bg-gray-100 dark:bg-white/10 rounded text-xs">Semestre {s.semestreSugerido}</span>
    )},
    { header: "Acciones", key: "actions", render: (s) => (
      /* INICIO DE MODIFICACIÓN: Grupo de acciones con Editar y Eliminar */
      <div className="flex items-center gap-2">
        <button 
          onClick={() => manejarEditarAsignatura(s)}
          className="text-gray-400 hover:text-brand-500 transition-colors p-2"
          title="Editar Asignatura"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
        </button>
        <button 
          onClick={() => manejarEliminarAsignatura(s.id)}
          className="text-gray-400 hover:text-error-500 transition-colors p-2"
          title={s.tieneInscripcionesActivas ? "Bloqueado: Tiene inscripciones" : "Eliminar"}
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
      /* FIN DE MODIFICACIÓN */
    )},
  ];

  // Configuración de columnas para la tabla de Historial de Versiones
  const historyColumns: TableColumn<VersionPlanEstudio>[] = [
    { header: "Año Versión", key: "numeroVersion", render: (v) => <span className="font-semibold text-gray-800 dark:text-white">{v.numeroVersion}</span> },
    { header: "Estado Actual", key: "estado", render: (v) => (
      <span className={`px-2 py-0.5 rounded text-xs ${v.estado === EstadoPlan.HISTORICO ? 'bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-400' : 'bg-success-500/10 text-success-500'}`}>
        {v.estado.charAt(0).toUpperCase() + v.estado.slice(1)}
      </span>
    )},
    { header: "N° Asignaturas", key: "asignaturas", render: (v) => v.asignaturas?.length || 0 },
    { header: "Créditos", key: "creditos", render: (v) => v.asignaturas?.reduce((acc, a) => acc + (a.creditos || 0), 0) || 0 },
    { header: "Fecha Publicación", key: "fechaVigencia" },
  ];

  /*Configuración de la Tabla Genérica para el Formulario de Edición */
  const editFormColumns: TableColumn<any>[] = [
    { header: "", key: "etiqueta" },
    { 
      header: "", 
      key: "valor", 
      render: (row) => (
        <input 
          type={row.key === 'creditos' || row.key === 'semestreSugerido' ? 'number' : 'text'}
          className="w-full bg-transparent border-b border-gray-300 dark:border-gray-700 focus:border-brand-500 outline-none px-2 py-1 text-sm text-gray-800 dark:text-white"
          value={row.valor}
          onChange={(e) => {
            const val = e.target.value;
            setAsignaturaEnEdicion(prev => {
              if (!prev) return null;
              const next = { ...prev };
              if (row.key === 'nombre' || row.key === 'codigo') {
                next.asignatura = { ...prev.asignatura!, [row.key === 'nombre' ? 'nombre' : 'codigo']: val };
              } else {
                (next as any)[row.key] = (row.key === 'creditos' || row.key === 'semestreSugerido') ? Number(val) : val;
              }
              return next;
            });
          }}
        />
      )
    }
  ];

  const editFormData = asignaturaEnEdicion ? [
    { etiqueta: "Nombre de Asignatura", valor: asignaturaEnEdicion.asignatura?.name, key: "nombre" },
    { etiqueta: "Código Interno", valor: asignaturaEnEdicion.asignatura?.code, key: "codigo" },
    { etiqueta: "Semestre Sugerido", valor: asignaturaEnEdicion.semestreSugerido, key: "semestreSugerido" },
    { etiqueta: "Créditos en el Plan", valor: asignaturaEnEdicion.creditos, key: "creditos" },
  ] : [];

  // Configuración de columnas para la tabla de catálogo (dentro del modal)
  const catalogColumns: TableColumn<Subject>[] = [
    { header: "", key: "codigo", render: (a) => <span className="font-mono text-xs text-gray-500">{a.code}</span> },
    { header: "", key: "nombre", render: (a) => <span className="text-sm font-medium text-gray-800 dark:text-white/90">{a.name}</span> },
    { header: "", key: "creditosBase" },
    { 
      header: "", 
      key: "add", 
      render: (a) => (
        <button 
          onClick={() => console.log("Asignatura seleccionada para añadir:", a)}
          className="text-brand-500 hover:text-brand-600 transition-colors p-1"
          title="Añadir al plan"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
        </button>
      ) 
    },
  ];

  /*Configuración de la Tabla Genérica para el Formulario de Publicación */
  const publishFormColumns: TableColumn<any>[] = [
    { header: "", key: "etiqueta" },
    { 
      header: "", 
      key: "valor", 
      render: (row) => {
        if (row.key === 'añoNuevaVersion') {
          return (
            <input 
              type="number"
              className="w-full bg-transparent border-b border-gray-300 dark:border-gray-700 focus:border-brand-500 outline-none px-2 py-1 text-sm text-gray-800 dark:text-white"
              value={añoNuevaVersion}
              onChange={(e) => setAñoNuevaVersion(Number(e.target.value))}
            />
          );
        }
        return <span className="text-gray-800 dark:text-white/90">{row.valor}</span>;
      }
    }
  ];

  const publishFormData = [
    { etiqueta: "Año de la nueva versión", valor: añoNuevaVersion, key: "añoNuevaVersion" },
    { etiqueta: "Advertencia", valor: `Al publicar una nueva versión se reemplazará la versión anterior (${planSeleccionado?.numeroVersionActual}) como la vigente.`, key: "advertencia" },
  ];

  /* --------------------------------------------------------------------------------------- */
  /* RENDERIZADO DE VISTAS                                                                   */
  /* --------------------------------------------------------------------------------------- */
  
  // Vista 1: Listado de Carreras para elegir qué plan gestionar
  const renderListView = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">Gestión Académica</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Seleccione una carrera para gestionar su plan de estudios vigente.</p>
        </div>
      </div>
      {/* ----------------------------------------------------------------------------------- */}
      {/* MODIFICACIÓN: Uso de GenericTable para el listado de Carreras                       */}
      {/* ----------------------------------------------------------------------------------- */}
      <DataTable 
        title="Carreras" 
        columns={careerColumns} 
        data={carreras} 
        emptyMessage="No hay carreras registradas en el sistema." 
      />
    </div>
  );

  // Vista 2: Gestión del Plan de Estudios de la carrera seleccionada
  const renderEditView = () => {
    const totalCreditos = planSeleccionado?.asignaturasVigentes?.reduce((acc, s) => acc + s.creditos, 0) || 0;

    // Preparamos los datos basados en la interfaz DetallesPlan
    const detalles: DetallesPlan = {
      carrera: carreraSeleccionada?.nombre || "",
      añoVersion: planSeleccionado?.numeroVersionActual || 0,
      estado: planSeleccionado?.estado === EstadoPlan.VIGENTE,
      totalAsignaturas: planSeleccionado?.asignaturasVigentes?.length || 0,
      totalCreditos: totalCreditos,
      ultimaActualizacion: planSeleccionado?.updatedAt || "No disponible",
      actualizadoPor: "Administrador Central", // Mock de usuario
    };

    // Transformamos los detalles en filas para la GenericTable
    const filasDetalles = [
      { atributo: "Carrera", valor: detalles.carrera },
      { atributo: "Año Versión", valor: detalles.añoVersion },
      { atributo: "Estado", valor: detalles.estado ? "Vigente" : "Borrador" },
      { atributo: "Asignaturas", valor: detalles.totalAsignaturas },
      { atributo: "Total Créditos", valor: detalles.totalCreditos },
      { atributo: "Actualizado", valor: detalles.ultimaActualizacion },
      { atributo: "Responsable", valor: detalles.actualizadoPor },
    ];

    const columnasDetalles: TableColumn<(typeof filasDetalles)[0]>[] = [
      { header: "Atributo", key: "atributo" },
      { header: "Valor", key: "valor", render: (f) => <span className="font-semibold text-gray-800 dark:text-white/90">{f.valor}</span> },
    ];

    return (
      <div className="space-y-6">
        {/* Cabecera del Gestor de Plan */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <button onClick={goBackToList} className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full transition-colors text-gray-500">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">
                {carreraSeleccionada?.nombre}
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Versión {planSeleccionado?.numeroVersionActual} • Estado: 
                <span className={`ml-2 px-2 py-0.5 rounded text-xs ${planSeleccionado?.estado === EstadoPlan.VIGENTE ? 'bg-success-500/10 text-success-500' : 'bg-warning-500/10 text-warning-500'}`}>
                  {planSeleccionado?.estado === EstadoPlan.VIGENTE ? 'Vigente (Activo)' : 'Borrador'}
                </span>
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" size="sm" onClick={openHistoryModal}>
              <ListIcon className="w-4 h-4 mr-2" /> Historial
            </Button>
          <Button variant="primary" size="sm" onClick={manejarAbrirModalPublicar}>
              <BoxCubeIcon className="w-4 h-4 mr-2" /> Publicar Nueva Versión
            </Button>
          </div>
        </div>

        {/* Contenido Principal con Grid/Flex para tabla y detalles */}
        <div className="flex flex-col xl:flex-row gap-6 items-start">
          {/* Tabla de Asignaturas del Plan (Izquierda) */}
          <div className="flex-1 space-y-4 w-full">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">Estructura Curricular</h2>
              <Button variant="primary" size="sm" onClick={openModal}>
                + Vincular Asignatura
              </Button>
            </div>

            <DataTable 
              columns={subjectColumns} 
              data={planSeleccionado?.asignaturasVigentes || []} 
              emptyMessage="Este plan de estudios no tiene asignaturas vinculadas aún." 
            />

            <div className="flex justify-end p-4 bg-gray-50 dark:bg-white/[0.02] rounded-xl border border-gray-200 dark:border-gray-800">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Total de Créditos del Plan: <span className="text-brand-500 text-lg ml-2 font-bold">
                  {totalCreditos}
                </span>
              </p>        
            </div>
          </div>
          {/* Tabla de Detalles del Plan (Derecha) */}
          <div className="w-full xl:w-96 space-y-4 shrink-0">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">Detalles del Plan</h2>
            <DataTable 
              columns={columnasDetalles} 
              data={filasDetalles} 
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <PageMeta
        title="Gestor de Plan de Estudios | Académico"
        description="Gestión integral de planes de estudio, vinculación de asignaturas y control de versiones."
      />

      {/* Switcher dinámico basado en el estado del componente */}
      {currentView === 'list' ? renderListView() : renderEditView()}

      {/* Modal para Agregar Asignatura*/}
      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[500px] p-6">
        <div className="flex flex-col">
          <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Añadir Asignatura al Plan</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1">Buscar en Catálogo</label>
              <input 
                type="text" 
                placeholder="Ej: Matemáticas, Física..." 
                className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent px-4 py-2 text-sm focus:border-brand-500 outline-none"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              
            </div>
          </div>

          <div className="mt-4 max-h-[350px] overflow-y-auto custom-scrollbar">
            <DataTable 
              columns={catalogColumns} 
              data={catalogo} 
              emptyMessage="No se encontraron asignaturas en el catálogo global."
            />
          </div>

          <div className="flex justify-end gap-3 mt-8">
            <Button variant="outline" size="sm" onClick={closeModal}>Cancelar</Button>
            <Button variant="primary" size="sm" onClick={closeModal}>Vincular Asignatura</Button>
          </div>
        </div>
      </Modal>

      {/*Modal para Editar Asignatura existente en el plan */}
      <Modal isOpen={isEditOpen} onClose={closeEditModal} className="max-w-[600px] p-6">
        <div className="flex flex-col">
          <DataTable 
            title="Editar Asignatura del Plan" 
            columns={editFormColumns} 
            data={editFormData} 
          />
          
          <div className="flex justify-end gap-3 mt-8">
            <Button variant="outline" size="sm" onClick={closeEditModal}>Cancelar</Button>
            <Button variant="primary" size="sm" onClick={manejarGuardarEdicion}>Guardar Cambios</Button>
          </div>
        </div>
      </Modal>

      {/*Modal para Publicar Nueva Versión */}
      <Modal isOpen={isPublishModalOpen} onClose={closePublishModal} className="max-w-[600px] p-6">
        <div className="flex flex-col">
          <DataTable 
            title="Publicar Nueva Versión del Plan de Estudios" 
            columns={publishFormColumns} 
            data={publishFormData} 
          />
          
          <div className="flex justify-end gap-3 mt-8">
            <Button variant="outline" size="sm" onClick={closePublishModal}>Cancelar</Button>
            <Button variant="primary" size="sm" onClick={manejarConfirmarPublicacion}>Publicar</Button>
          </div>
        </div>
      </Modal>

      {/* Modal para Historial de Versiones */}
      <Modal isOpen={isHistoryOpen} onClose={closeHistoryModal} className="max-w-[850px] p-6">
        <div className="flex flex-col space-y-6">
          <h3 className="text-xl font-bold text-gray-800 dark:text-white">Historial de versiones</h3>
          
          <DataTable 
            columns={historyColumns} 
            data={planSeleccionado?.versionesHistorico || []} 
            emptyMessage="No hay versiones anteriores registradas para esta carrera."
          />

          <div className="flex flex-col items-center gap-4">
            <Button variant="outline" size="sm" onClick={() => alert("Cargando listado completo de versiones...")}>
              Ver todas las versiones
            </Button>
            <div className="w-full flex justify-end border-t border-gray-200 dark:border-gray-800 pt-4">
              <Button variant="primary" size="sm" onClick={closeHistoryModal}>Cerrar</Button>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default PlanEstudioPage;
