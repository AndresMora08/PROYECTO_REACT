import React, { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import PageMeta from "../../components/common/PageMeta";
import { Modal } from "../../components/ui/modal";
import { useModal } from "../../hooks/useModal";
import Button from "../../components/ui/button/Button";
import { BoxCubeIcon, ListIcon } from "../../icons";
import { DataTable, TableColumn } from "../../components/tables/BasicTables/DataTable";
import { Carrera } from "../../models/Carrera";
import { Subject } from "../../models/Asignatura";
import { AsignaturaPlan, DetallesPlan, PlanEstudio, VersionPlanEstudio } from "../../models/PlanEstudio";
import { planEstudioService } from "../../service/planEstudioService";

const PlanEstudioPage: React.FC = () => {
  const { isOpen, openModal, closeModal } = useModal();
  const { isOpen: isHistoryOpen, openModal: openHistoryModal, closeModal: closeHistoryModal } = useModal();

  const [currentView, setCurrentView] = useState<"list" | "edit">("list");
  const [carreras, setCarreras] = useState<Carrera[]>([]);
  const [catalogo, setCatalogo] = useState<Subject[]>([]);
  const [terminoBusqueda, setTerminoBusqueda] = useState("");
  const [planSeleccionado, setPlanSeleccionado] = useState<PlanEstudio | null>(null);
  const [carreraSeleccionada, setCarreraSeleccionada] = useState<Carrera | null>(null);
  const [draftSubjects, setDraftSubjects] = useState<AsignaturaPlan[]>([]);
  const [hasPendingChanges, setHasPendingChanges] = useState(false);

  const fireAlert = (options: any, text?: string, icon?: any) => {
    const config =
      typeof options === "object"
        ? options
        : {
            title: options,
            text,
            icon,
          };

    return Swal.fire({
      ...config,
      didOpen: () => {
        const container = Swal.getContainer();
        if (container) {
          container.style.zIndex = "200000";
        }

        if (typeof config.didOpen === "function") {
          config.didOpen(Swal.getPopup() as HTMLElement);
        }
      },
    });
  };

  const formatDateTime = (value?: string) => {
    if (!value) return "No disponible";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;
    return parsed.toLocaleString();
  };

  useEffect(() => {
    const fetchInitialData = async () => {
      const [dataCarreras, dataSubjects] = await Promise.all([
        planEstudioService.getCarreras(),
        planEstudioService.getSubjects(),
      ]);

      setCarreras(dataCarreras);
      setCatalogo(dataSubjects);
    };

    fetchInitialData();
  }, []);

  const hydratePlan = async (plan: PlanEstudio) => {
    const subjects = await planEstudioService.getSubjectsByPlan(plan.id);
    return { ...plan, subjects: subjects as AsignaturaPlan[] };
  };

  const cargarPlanParaCarrera = async (carrera: Carrera) => {
    setCarreraSeleccionada(carrera);

    try {
      const planes = await planEstudioService.getPlanesPorCarrera(carrera.id);
      const planesOrdenados = [...planes].sort((a, b) => b.year - a.year);
      const planActivo = planesOrdenados.find((p) => p.is_published) ?? planesOrdenados[0];

      if (planActivo) {
        const planConAsignaturas = await hydratePlan(planActivo);
        const historial = await Promise.all(
          planesOrdenados.map(async (plan) => {
            const subjects = await planEstudioService.getSubjectsByPlan(plan.id);
            return {
              id: plan.id,
              study_plan_id: plan.id,
              version_number: plan.year,
              state: plan.is_published ? "vigente" : "borrador",
              subjects: subjects as AsignaturaPlan[],
              published_at: plan.is_published ? plan.updated_at : plan.created_at,
              created_at: plan.created_at,
              updated_at: plan.updated_at,
            } as VersionPlanEstudio;
          })
        );

        setPlanSeleccionado({ ...planConAsignaturas, history: historial });
        setDraftSubjects(planConAsignaturas.subjects ?? []);
        setHasPendingChanges(false);
      } else {
        setPlanSeleccionado(null);
        setDraftSubjects([]);
        setHasPendingChanges(false);

        const { isConfirmed } = await fireAlert({
          title: "Sin Plan de Estudios",
          text: "Desea inicializar el primer plan de estudios para esta carrera?",
          icon: "question",
          showCancelButton: true,
          confirmButtonText: "Si, crear plan",
        });

        if (isConfirmed) {
          try {
            const nuevoPlan = await planEstudioService.crearPlan(carrera.id, carrera.name, new Date().getFullYear());
            if (nuevoPlan) {
              await fireAlert("Listo", "Plan inicial creado correctamente.", "success");
              await cargarPlanParaCarrera(carrera);
            }
          } catch (error: any) {
            const msg = error?.message || "No se pudo crear el plan de estudios.";
            fireAlert("Error al crear", msg, "error");
          }
        }
      }
    } catch (error) {
      console.error("Fallo al cargar plan:", error);
      fireAlert("Error", "No se pudo cargar la informacion del plan.", "error");
    }

    setCurrentView("edit");
  };

  const manejarEliminarAsignatura = async (subjectId: string) => {
    if (!planSeleccionado) return;

    const result = await fireAlert({
      title: "Estas seguro?",
      text: "Esta accion quitara la asignatura del borrador local. El cambio solo se aplica al publicar una nueva version.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Si, eliminar",
      cancelButtonText: "Cancelar",
    });

    if (result.isConfirmed) {
      const nextDraft = draftSubjects.filter((subject) => subject.id !== subjectId);
      setDraftSubjects(nextDraft);
      setHasPendingChanges(true);
      fireAlert("Eliminado", "La asignatura fue retirada del borrador local.", "success");
    }
  };

  const manejarVincularAsignatura = async (asignatura: Subject) => {
    if (!planSeleccionado) return;

    try {
      const subjectId = asignatura.id || (asignatura as any)._id;
      if (!subjectId) {
        fireAlert("Error", "La asignatura seleccionada no tiene un ID valido.", "error");
        return;
      }

      const alreadyIncluded = draftSubjects.some((subject) => subject.id === subjectId);
      if (alreadyIncluded) {
        fireAlert("Sin cambios", "La asignatura ya forma parte del borrador actual.", "info");
        return;
      }

      setDraftSubjects((current) => [...current, asignatura as AsignaturaPlan]);
      setHasPendingChanges(true);
      closeModal();
      fireAlert({
        title: "Asignatura agregada",
        text: `La asignatura ${asignatura.name} fue anadida al borrador local.`,
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (error: any) {
      console.error(error);
      fireAlert("Error", error?.message || "No se pudo vincular la asignatura.", "error");
    }
  };

  const publicarPlanActual = async () => {
    if (!planSeleccionado || !carreraSeleccionada) return;

    if (!hasPendingChanges) {
      fireAlert("Sin cambios pendientes", "No hay modificaciones en el borrador para publicar.", "info");
      return;
    }

    const siguienteVersion =
      Math.max(
        planSeleccionado.year,
        ...(planSeleccionado.history?.map((version) => version.version_number) ?? [])
      ) + 1;

    const result = await fireAlert({
      title: "Publicar nueva version",
      text: `Se creara la version ${siguienteVersion} con ${draftSubjects.length} asignatura(s) y reemplazara la version anterior como vigente.`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Si, publicar",
      cancelButtonText: "Cancelar",
    });

    if (!result.isConfirmed) return;

    try {
      const nuevoPlan = await planEstudioService.crearPlan(
        carreraSeleccionada.id,
        carreraSeleccionada.name,
        siguienteVersion
      );

      if (!nuevoPlan) {
        throw new Error("No se pudo crear la nueva version del plan.");
      }

      for (const subject of draftSubjects) {
        const subjectId = subject.id || (subject as any)._id;
        if (!subjectId) continue;
        await planEstudioService.vincularAsignatura(nuevoPlan.id, subjectId);
      }

      await planEstudioService.publicarPlan(nuevoPlan.id);
      await fireAlert("Publicado", "La nueva version del plan fue publicada correctamente.", "success");
      await cargarPlanParaCarrera(carreraSeleccionada);
    } catch (error: any) {
      console.error(error);
      fireAlert("Error", error?.message || "No se pudo publicar el plan.", "error");
    }
  };

  const goBackToList = () => {
    setCurrentView("list");
    setCarreraSeleccionada(null);
    setPlanSeleccionado(null);
    setDraftSubjects([]);
    setHasPendingChanges(false);
  };

  const catalogoFiltrado = useMemo(() => {
    const query = terminoBusqueda.toLowerCase().trim();
    if (!query) return catalogo;
    return catalogo.filter(
      (s) => s.name.toLowerCase().includes(query) || s.code.toLowerCase().includes(query)
    );
  }, [catalogo, terminoBusqueda]);

  const careerColumns: TableColumn<Carrera>[] = [
    { header: "Name", key: "name", render: (c) => <span className="font-semibold text-gray-800 dark:text-white/90">{c.name}</span> },
    { header: "Code", key: "code" },
    { header: "Updated At", key: "updated_at", render: (c: any) => formatDateTime(c.updated_at ?? c.updatedAt) },
    {
      header: "Actions",
      key: "actions",
      render: (c) => (
        <Button variant="outline" size="sm" onClick={() => cargarPlanParaCarrera(c)}>
          Gestionar Plan
        </Button>
      ),
    },
  ];

  const subjectColumns: TableColumn<AsignaturaPlan>[] = [
    { header: "Subject", key: "name", render: (s) => <span className="font-medium text-gray-800 dark:text-white/90">{s.name}</span> },
    { header: "Code", key: "code", render: (s) => <span className="text-gray-500 font-mono text-xs">{s.code}</span> },
    { header: "Credits", key: "credits" },
    {
      header: "Acciones",
      key: "actions",
      render: (s) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => manejarEliminarAsignatura(s.id)}
            className="text-gray-400 hover:text-error-500 transition-colors p-2"
            title="Eliminar"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      ),
    },
  ];

  const historyColumns: TableColumn<VersionPlanEstudio>[] = [
    { header: "Version Year", key: "version_number", render: (v) => <span className="font-semibold text-gray-800 dark:text-white">{v.version_number}</span> },
    {
      header: "Estado",
      key: "state",
      render: (v) => (
        <span className={`px-2 py-0.5 rounded text-xs ${v.state === "vigente" ? "bg-success-500/10 text-success-500" : "bg-warning-500/10 text-warning-500"}`}>
          {v.state === "vigente" ? "Publicado" : "Borrador"}
        </span>
      ),
    },
    { header: "Subjects", key: "subjects", render: (v) => v.subjects.length },
    { header: "Credits", key: "credits", render: (v) => v.subjects.reduce((acc, s) => acc + (s.credits || 0), 0) },
    { header: "Creada", key: "created_at", render: (v) => formatDateTime(v.created_at) },
    { header: "Publicada/Act.", key: "updated_at", render: (v) => formatDateTime(v.published_at) },
  ];

  const catalogColumns: TableColumn<Subject>[] = [
    { header: "Code", key: "code", render: (a) => <span className="font-mono text-xs text-gray-500">{a.code}</span> },
    { header: "Name", key: "name", render: (a) => <span className="text-sm font-medium text-gray-800 dark:text-white/90">{a.name}</span> },
    { header: "Credits", key: "credits" },
    {
      header: "",
      key: "add",
      render: (a) => (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            manejarVincularAsignatura(a);
          }}
          className="text-brand-500 hover:text-brand-600 transition-colors p-1"
          title="Anadir al plan"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </button>
      ),
    },
  ];

  const renderListView = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">Gestion Academica</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Seleccione una carrera para gestionar su plan de estudios.</p>
        </div>
      </div>
      <DataTable title="Carreras" columns={careerColumns} data={carreras} emptyMessage="No hay carreras registradas en el sistema." />
    </div>
  );

  const renderEditView = () => {
    const totalCredits = draftSubjects.reduce((acc, s) => acc + (s.credits || 0), 0);

    const detalles: DetallesPlan = {
      career: carreraSeleccionada?.name || "",
      year:
        hasPendingChanges
          ? Math.max(
              planSeleccionado?.year || 0,
              ...(planSeleccionado?.history?.map((version) => version.version_number) ?? [])
            ) + 1
          : planSeleccionado?.year || 0,
      is_active: Boolean(planSeleccionado?.is_published) && !hasPendingChanges,
      total_subjects: draftSubjects.length,
      total_credits: totalCredits,
      last_update: formatDateTime(planSeleccionado?.created_at),
      updated_by: "Backend academico",
    };

    const filasDetalles = [
      { atributo: "Carrera", valor: detalles.career },
      { atributo: "Nombre del plan", valor: planSeleccionado?.name || "N/A" },
      { atributo: "Ano", valor: detalles.year },
      { atributo: "Estado", valor: hasPendingChanges ? "Borrador local con cambios pendientes" : detalles.is_active ? "Publicado" : "Borrador" },
      { atributo: "Asignaturas", valor: detalles.total_subjects },
      { atributo: "Total creditos", valor: detalles.total_credits },
      { atributo: "Fecha base de la version", valor: detalles.last_update },
    ];

    const columnasDetalles: TableColumn<(typeof filasDetalles)[0]>[] = [
      { header: "Atributo", key: "atributo" },
      { header: "Valor", key: "valor", render: (f) => <span className="font-semibold text-gray-800 dark:text-white/90">{f.valor}</span> },
    ];

    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <button onClick={goBackToList} className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full transition-colors text-gray-500">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">{carreraSeleccionada?.name}</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {planSeleccionado?.name} - {detalles.year}
                <span className={`ml-2 px-2 py-0.5 rounded text-xs ${
                  hasPendingChanges
                    ? "bg-warning-500/10 text-warning-500"
                    : planSeleccionado?.is_published
                      ? "bg-success-500/10 text-success-500"
                      : "bg-warning-500/10 text-warning-500"
                }`}>
                  {hasPendingChanges ? "Borrador local" : planSeleccionado?.is_published ? "Publicado" : "Borrador"}
                </span>
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" size="sm" onClick={openHistoryModal}>
              <ListIcon className="w-4 h-4 mr-2" /> Historial
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={publicarPlanActual}
            >
              <BoxCubeIcon className="w-4 h-4 mr-2" /> Publicar Nueva Version
            </Button>
          </div>
        </div>

        <div className="flex flex-col xl:flex-row gap-6 items-start">
          <div className="flex-1 space-y-4 w-full">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">Asignaturas del plan</h2>
              <Button variant="primary" size="sm" onClick={openModal}>
                + Vincular Asignatura
              </Button>
            </div>

            <DataTable
              columns={subjectColumns}
              data={draftSubjects}
              emptyMessage="Este plan de estudios no tiene asignaturas vinculadas aun."
            />

            {hasPendingChanges && (
              <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
                Estas viendo un borrador local. Los cambios no afectan la version vigente hasta publicar una nueva version.
              </p>
            )}

            <div className="flex justify-end p-4 bg-gray-50 dark:bg-white/[0.02] rounded-xl border border-gray-200 dark:border-gray-800">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Total de creditos del plan:
                <span className="text-brand-500 text-lg ml-2 font-bold">{totalCredits}</span>
              </p>
            </div>
          </div>

          <div className="w-full xl:w-96 space-y-4 shrink-0">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">Detalles del Plan</h2>
            <DataTable columns={columnasDetalles} data={filasDetalles} />
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <PageMeta
        title="Gestor de Plan de Estudios | Academico"
        description="Gestion de planes de estudio alineada al backend academico."
      />

      {currentView === "list" ? renderListView() : renderEditView()}

      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[500px] p-6">
        <div className="flex flex-col">
          <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Anadir Asignatura al Plan</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1">Buscar en Catalogo</label>
              <input
                type="text"
                placeholder="Ej: Matematicas, Fisica..."
                value={terminoBusqueda}
                onChange={(e) => setTerminoBusqueda(e.target.value)}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent px-4 py-2 text-sm focus:border-brand-500 outline-none"
              />
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400">
              Los creditos se toman de la asignatura global del catalogo. El backend actual no permite guardar creditos ni semestre sugerido por asignatura dentro del plan de estudios.
            </p>
          </div>

          <div className="mt-4 max-h-[350px] overflow-y-auto custom-scrollbar">
            <DataTable columns={catalogColumns} data={catalogoFiltrado} emptyMessage="No se encontraron asignaturas en el catalogo global." />
          </div>

          <div className="flex justify-end gap-3 mt-8">
            <Button variant="outline" size="sm" onClick={closeModal}>Cancelar</Button>
            <Button variant="primary" size="sm" onClick={closeModal}>Finalizar</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={isHistoryOpen} onClose={closeHistoryModal} className="max-w-[850px] p-6">
        <div className="flex flex-col space-y-6">
          <h3 className="text-xl font-bold text-gray-800 dark:text-white">Planes registrados para la carrera</h3>

          <DataTable
            columns={historyColumns}
            data={planSeleccionado?.history || []}
            emptyMessage="No hay planes registrados para esta carrera."
          />

          <div className="w-full flex justify-end border-t border-gray-200 dark:border-gray-800 pt-4">
            <Button variant="primary" size="sm" onClick={closeHistoryModal}>Cerrar</Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default PlanEstudioPage;
