import { useState } from 'react';
import type { AppMode, Tab, ProjectTab } from './types';
import { useClassroomState } from './hooks/use-classroom-state';
import { usePairingStats } from './hooks/use-pairing-stats';
import { useStudentMeta } from './hooks/use-student-meta';
import { useProjectsState } from './hooks/use-projects-state';
import { useTeamStats } from './hooks/use-team-stats';
import { clearAll } from './lib/storage';
import { Header } from './components/layout/Header';
import { ModeSwitcher } from './components/layout/ModeSwitcher';
import { TabNav } from './components/layout/TabNav';
import { ClassroomView } from './components/classroom/ClassroomView';
import { HistoryPanel } from './components/history/HistoryPanel';
import { PairingMatrix } from './components/matrix/PairingMatrix';
import { StudentsPanel } from './components/students/StudentsPanel';
import { ConfigPanel } from './components/config/ConfigPanel';
import { ProjectListPanel } from './components/projects/ProjectListPanel';
import { TeamView } from './components/projects/TeamView';
import { ProjectHistoryPanel } from './components/projects/ProjectHistoryPanel';
import { TeamCoverageMatrix } from './components/projects/TeamCoverageMatrix';

const CLASSROOM_TABS: { id: Tab; label: string }[] = [
  { id: 'classroom', label: 'Classroom' },
  { id: 'students', label: 'Students' },
  { id: 'history', label: 'History' },
  { id: 'matrix', label: 'Matrix' },
  { id: 'config', label: 'Config' },
];

const PROJECT_TABS: { id: ProjectTab; label: string }[] = [
  { id: 'projects', label: 'Projects' },
  { id: 'teams', label: 'Teams' },
  { id: 'history', label: 'History' },
  { id: 'matrix', label: 'Matrix' },
];

function App() {
  const [mode, setMode] = useState<AppMode>('classroom');
  const [activeTab, setActiveTab] = useState<Tab>('classroom');
  const [activeProjectTab, setActiveProjectTab] = useState<ProjectTab>('projects');

  const {
    state,
    currentRound,
    canShuffleNext,
    canGoPrev,
    canGoNext,
    shuffleNext,
    viewRound,
    viewPrev,
    viewNext,
    updateConfig,
  } = useClassroomState();

  const stats = usePairingStats(state);
  const { metaMap, updateStudent, getDisplayName } = useStudentMeta(state.config.totalStudents);

  const projects = useProjectsState();
  const teamStats = useTeamStats(projects.activeProject);

  const projectLabel = projects.activeProject
    ? `${projects.activeProject.config.courseName} — ${projects.activeProject.config.projectName}`
    : undefined;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        mode={mode}
        totalStudents={state.config.totalStudents}
        completedRounds={
          mode === 'classroom'
            ? state.completedRoundIndices.length
            : projects.activeProject?.completedRoundIndices.length ?? 0
        }
        totalRounds={
          mode === 'classroom'
            ? state.allRounds.length
            : projects.activeProject?.allRounds.length ?? 0
        }
        projectLabel={projectLabel}
        onReset={() => { clearAll(); location.reload(); }}
      />
      <ModeSwitcher mode={mode} onModeChange={setMode} />

      {mode === 'classroom' ? (
        <>
          <TabNav tabs={CLASSROOM_TABS} activeTab={activeTab} onTabChange={setActiveTab} />
          <main className="pb-8">
            {activeTab === 'classroom' && (
              <ClassroomView
                round={currentRound}
                config={state.config}
                currentViewIndex={state.currentViewIndex}
                completedCount={state.completedRoundIndices.length}
                canShuffleNext={canShuffleNext}
                canGoPrev={canGoPrev}
                canGoNext={canGoNext}
                onShuffleNext={shuffleNext}
                onPrev={viewPrev}
                onNext={viewNext}
                getDisplayName={getDisplayName}
                studentMeta={metaMap}
              />
            )}
            {activeTab === 'students' && (
              <StudentsPanel
                totalStudents={state.config.totalStudents}
                metaMap={metaMap}
                onUpdateStudent={updateStudent}
              />
            )}
            {activeTab === 'history' && (
              <HistoryPanel
                allRounds={state.allRounds}
                completedRoundIndices={state.completedRoundIndices}
                currentViewIndex={state.currentViewIndex}
                onViewRound={viewRound}
                onSwitchToClassroom={() => setActiveTab('classroom')}
              />
            )}
            {activeTab === 'matrix' && (
              <PairingMatrix stats={stats} totalStudents={state.config.totalStudents} getDisplayName={getDisplayName} />
            )}
            {activeTab === 'config' && (
              <ConfigPanel currentConfig={state.config} onApply={updateConfig} />
            )}
          </main>
        </>
      ) : (
        <>
          <TabNav tabs={PROJECT_TABS} activeTab={activeProjectTab} onTabChange={setActiveProjectTab} />
          <main className="pb-8">
            {activeProjectTab === 'projects' && (
              <ProjectListPanel
                projects={projects.state.projects}
                activeProjectId={projects.state.activeProjectId}
                onAddProject={projects.addProject}
                onSelectProject={projects.selectProject}
                onRemoveProject={projects.removeProject}
                onSwitchToTeams={() => setActiveProjectTab('teams')}
              />
            )}
            {activeProjectTab === 'teams' && (
              projects.activeProject ? (
                <TeamView
                  project={projects.activeProject}
                  currentRound={projects.currentRound}
                  canShuffleNext={projects.canShuffleNext}
                  canGoPrev={projects.canGoPrev}
                  canGoNext={projects.canGoNext}
                  onShuffleNext={projects.shuffleNext}
                  onPrev={projects.viewPrev}
                  onNext={projects.viewNext}
                  getDisplayName={getDisplayName}
                />
              ) : (
                <div className="max-w-2xl mx-auto p-4">
                  <p className="text-gray-400 text-sm">Select or create a project first.</p>
                </div>
              )
            )}
            {activeProjectTab === 'history' && (
              projects.activeProject ? (
                <ProjectHistoryPanel
                  project={projects.activeProject}
                  onViewRound={projects.viewRound}
                  onSwitchToTeams={() => setActiveProjectTab('teams')}
                />
              ) : (
                <div className="max-w-2xl mx-auto p-4">
                  <p className="text-gray-400 text-sm">Select a project to view history.</p>
                </div>
              )
            )}
            {activeProjectTab === 'matrix' && (
              projects.activeProject && teamStats ? (
                <TeamCoverageMatrix
                  stats={teamStats}
                  totalStudents={projects.activeProject.config.totalStudents}
                  getDisplayName={getDisplayName}
                />
              ) : (
                <div className="max-w-2xl mx-auto p-4">
                  <p className="text-gray-400 text-sm">Select a project to view coverage.</p>
                </div>
              )
            )}
          </main>
        </>
      )}
    </div>
  );
}

export default App;
