import { useState } from 'react';
import type { Tab } from './types';
import { useClassroomState } from './hooks/use-classroom-state';
import { usePairingStats } from './hooks/use-pairing-stats';
import { useStudentMeta } from './hooks/use-student-meta';
import { Header } from './components/layout/Header';
import { TabNav } from './components/layout/TabNav';
import { ClassroomView } from './components/classroom/ClassroomView';
import { HistoryPanel } from './components/history/HistoryPanel';
import { PairingMatrix } from './components/matrix/PairingMatrix';
import { StudentsPanel } from './components/students/StudentsPanel';
import { ConfigPanel } from './components/config/ConfigPanel';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('classroom');
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        totalStudents={state.config.totalStudents}
        completedRounds={state.completedRoundIndices.length}
        totalRounds={state.allRounds.length}
      />
      <TabNav activeTab={activeTab} onTabChange={setActiveTab} />

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
    </div>
  );
}

export default App;
