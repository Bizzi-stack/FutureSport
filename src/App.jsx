import { useState, useEffect, useRef, useMemo } from 'react';
// Logo removed
import GradeTable from './components/GradeTable';
import InsightsPanel from './components/InsightsPanel';
import BehaviorPanel from './components/BehaviorPanel';
import BehaviorTable from './components/BehaviorTable';
import AddSubjectModal from './components/AddSubjectModal';
import AddStudentModal from './components/AddStudentModal';
import SettingsPanel, { useSettings } from './components/SettingsPanel';
import StudentProfileDrawer from './components/StudentProfileDrawer';
import { ALL_STUDENTS, YEARS, TERMS, SUBJECTS as DEFAULT_SUBJECTS, TEAMS, SCHOOLS, getTeamStudents } from './data/mockData';
import { exportClassReport } from './utils/exportReport';
import DataHub from './components/DataHub';
import NationalHub from './components/NationalHub';
import MatchCentre from './components/MatchCentre';
import AdminLandingPage from './components/AdminLandingPage';
import TeacherDashboard from './components/TeacherDashboard';
import PrincipalDashboard from './components/PrincipalDashboard';
import ImportCsvModal from './components/ImportCsvModal';
import DataEntryPanel from './components/DataEntryPanel';
import LogShotModal from './components/LogShotModal';
import CustomSelect from './components/CustomSelect';
import SchoolPlayerRegistration from './components/admin/SchoolPlayerRegistration';
import CompetitionAdmin from './components/admin/CompetitionAdmin';
import SchoolAdminDashboard from './components/school/SchoolAdminDashboard';
import RefereeDashboard from './components/referee/RefereeDashboard';
import CommissionerDashboard from './components/commissioner/CommissionerDashboard';
import FourthOfficialDashboard from './components/referee/FourthOfficialDashboard';

// ── Icons (inline SVG) ──────────────────────────────────────────────
const DownloadIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);
const PlusIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);
const GearIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);
const ChevronDown = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

// ── Styled Select Wrapper ───────────────────────────────────────────
function NavSelect({ value, onChange, options, labelFn }) {
  return (
    <CustomSelect
      value={value}
      onChange={onChange}
      options={options.map(o => ({ value: o, label: labelFn ? labelFn(o) : o }))}
      selectStyle={{
        padding: '8px 32px 8px 16px',
        borderRadius: '20px',
        fontSize: '13px',
        fontWeight: '600',
        minWidth: '130px',
        boxShadow: 'var(--shadow-sm)'
      }}
    />
  );
}

// ── Tab Button ──────────────────────────────────────────────────────
function TabBtn({ active, onClick, children }) {
  return (
    <button onClick={onClick} style={{
      padding: '8px 20px',
      borderRadius: '8px',
      fontSize: '13px',
      fontWeight: '600',
      background: active ? 'rgba(37,99,235,0.18)' : 'transparent',
      color: active ? 'var(--primary-light)' : 'var(--text-muted)',
      border: active ? '1px solid rgba(37,99,235,0.35)' : '1px solid transparent',
      transition: 'all 0.2s',
    }}>
      {children}
    </button>
  );
}
function migrateTermsToMatchdays(students) {
  if (!Array.isArray(students)) return [];
  return students.map(student => {
    if (!student) return student;
    const newStudent = { ...student };
    if (newStudent.performance && typeof newStudent.performance === 'object') {
      const newPerf = {};
      Object.keys(newStudent.performance).forEach(year => {
        newPerf[year] = {};
        if (newStudent.performance[year] && typeof newStudent.performance[year] === 'object') {
          Object.keys(newStudent.performance[year]).forEach(term => {
            if (term && typeof term === 'string') {
              const newTerm = term.replace('Term ', 'Matchday ');
              newPerf[year][newTerm] = newStudent.performance[year][term];
            }
          });
        }
      });
      newStudent.performance = newPerf;
    }
    if (newStudent.matchStats && typeof newStudent.matchStats === 'object') {
      const newStats = {};
      Object.keys(newStudent.matchStats).forEach(year => {
        newStats[year] = {};
        if (newStudent.matchStats[year] && typeof newStudent.matchStats[year] === 'object') {
          Object.keys(newStudent.matchStats[year]).forEach(term => {
            if (term && typeof term === 'string') {
              const newTerm = term.replace('Term ', 'Matchday ');
              newStats[year][newTerm] = newStudent.matchStats[year][term];
            }
          });
        }
      });
      newStudent.matchStats = newStats;
    }
    if (Array.isArray(newStudent.shotLogs)) {
      newStudent.shotLogs = newStudent.shotLogs.map(shot => {
        if (shot && shot.term && typeof shot.term === 'string') {
          return {
            ...shot,
            term: shot.term.replace('Term ', 'Matchday ')
          };
        }
        return shot;
      });
    }
    return newStudent;
  });
}

function cleanStudentsForSave(students) {
  if (!Array.isArray(students)) return [];
  return students.map(s => {
    if (!s) return s;
    const userShotLogs = (s.shotLogs || []).filter(shot => shot && shot.id && String(shot.id).includes('-u-'));
    return {
      id: s.id,
      name: s.name,
      schoolId: s.schoolId,
      teamAssignments: s.teamAssignments,
      performance: s.performance,
      matchStats: s.matchStats,
      extracurriculars: s.extracurriculars,
      jerseyNumber: s.jerseyNumber,
      shotLogs: userShotLogs,
      // Save registration details
      dob: s.dob,
      gender: s.gender,
      position: s.position,
      preferredFoot: s.preferredFoot,
      medicalInfo: s.medicalInfo,
      emergencyContact: s.emergencyContact,
      status: s.status,
      rejectionReason: s.rejectionReason,
      documents: s.documents,
    };
  });
}

function loadAndMergeStudents(savedList) {
  if (!savedList || !Array.isArray(savedList)) return ALL_STUDENTS;
  const migratedList = migrateTermsToMatchdays(savedList);
  return migratedList.map(savedStudent => {
    if (!savedStudent) return savedStudent;
    const baseStudent = ALL_STUDENTS.find(b => b && String(b.id) === String(savedStudent.id));
    if (baseStudent) {
      const mockShots = (baseStudent.shotLogs || []).filter(shot => shot && shot.id && !String(shot.id).includes('-u-'));
      const userShots = (savedStudent.shotLogs || []).filter(shot => shot && shot.id && String(shot.id).includes('-u-'));
      return {
        ...baseStudent,
        name: savedStudent.name,
        schoolId: savedStudent.schoolId,
        teamAssignments: savedStudent.teamAssignments || baseStudent.teamAssignments,
        performance: savedStudent.performance || baseStudent.performance,
        matchStats: savedStudent.matchStats || baseStudent.matchStats,
        extracurriculars: savedStudent.extracurriculars || baseStudent.extracurriculars,
        jerseyNumber: savedStudent.jerseyNumber,
        shotLogs: [...mockShots, ...userShots],
        // Merge registration details
        dob: savedStudent.dob !== undefined ? savedStudent.dob : baseStudent.dob,
        gender: savedStudent.gender !== undefined ? savedStudent.gender : baseStudent.gender,
        position: savedStudent.position !== undefined ? savedStudent.position : baseStudent.position,
        preferredFoot: savedStudent.preferredFoot !== undefined ? savedStudent.preferredFoot : baseStudent.preferredFoot,
        medicalInfo: savedStudent.medicalInfo !== undefined ? savedStudent.medicalInfo : baseStudent.medicalInfo,
        emergencyContact: savedStudent.emergencyContact !== undefined ? savedStudent.emergencyContact : baseStudent.emergencyContact,
        status: savedStudent.status !== undefined ? savedStudent.status : baseStudent.status,
        rejectionReason: savedStudent.rejectionReason !== undefined ? savedStudent.rejectionReason : baseStudent.rejectionReason,
        documents: savedStudent.documents !== undefined ? savedStudent.documents : baseStudent.documents,
      };
    } else {
      return savedStudent;
    }
  });
}

const DEFAULT_MATCHES = [
  {
    id: 'scheduled-seed-1',
    homeTeamId: 's1-team-U14',
    awayTeamId: 's2-team-U14',
    ageGroup: 'U14',
    matchday: 'Matchday 1',
    venue: 'Harrison College Field',
    referee: 'Michael Beckles',
    commissioner: 'Sarah Rollins',
    status: 'scheduled',
    homeScore: 0,
    awayScore: 0,
    playerStats: {},
    timeline: [],
    date: new Date(Date.now() + 86400000).toISOString()
  },
  {
    id: 'scheduled-seed-2',
    homeTeamId: 's3-team-U14',
    awayTeamId: 's1-team-U14',
    ageGroup: 'U14',
    matchday: 'Matchday 1',
    venue: 'Combermere Grounds',
    referee: 'Dave Yearwood',
    commissioner: 'Karen Thorne',
    status: 'scheduled',
    homeScore: 0,
    awayScore: 0,
    playerStats: {},
    timeline: [],
    date: new Date(Date.now() + 172800000).toISOString()
  },
  {
    id: 'scheduled-seed-3',
    homeTeamId: 's1-team-U16',
    awayTeamId: 's2-team-U16',
    ageGroup: 'U16',
    matchday: 'Matchday 1',
    venue: 'National Stadium',
    referee: 'Adrian Hunte',
    commissioner: 'Sarah Rollins',
    status: 'scheduled',
    homeScore: 0,
    awayScore: 0,
    playerStats: {},
    timeline: [],
    date: new Date(Date.now() + 86400000).toISOString()
  },
  {
    id: 'scheduled-seed-4',
    homeTeamId: 's1-team-U19',
    awayTeamId: 's2-team-U19',
    ageGroup: 'U19',
    matchday: 'Matchday 1',
    venue: 'National Stadium',
    referee: 'Michael Beckles',
    commissioner: 'Karen Thorne',
    status: 'scheduled',
    homeScore: 0,
    awayScore: 0,
    playerStats: {},
    timeline: [],
    date: new Date(Date.now() + 86400000).toISOString()
  },
  {
    id: 'scheduled-seed-5',
    homeTeamId: 's2-team-U19',
    awayTeamId: 's3-team-U19',
    ageGroup: 'U19',
    matchday: 'Matchday 1',
    venue: 'Queens College Arena',
    referee: 'Dave Yearwood',
    commissioner: 'Sarah Rollins',
    status: 'scheduled',
    homeScore: 0,
    awayScore: 0,
    playerStats: {},
    timeline: [],
    date: new Date(Date.now() + 172800000).toISOString()
  }
];

// ── Main App ────────────────────────────────────────────────────────
function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [selectedTournament, setSelectedTournament] = useState('PMC'); // 'PMC' | 'NSSL'
  const [allStudents, setAllStudents] = useState(() => {
    try {
      const saved = localStorage.getItem('eduvision-students');
      if (saved) {
        return loadAndMergeStudents(JSON.parse(saved));
      }
    } catch (err) {
      console.error("Error loading eduvision-students from localStorage:", err);
    }
    return ALL_STUDENTS;
  });

  useEffect(() => {
    try {
      const cleaned = cleanStudentsForSave(allStudents);
      localStorage.setItem('eduvision-students', JSON.stringify(cleaned));
    } catch { /* ignored */ }
  }, [allStudents]);
  const [allTeams, setAllTeams] = useState(() => {
    try {
      const saved = localStorage.getItem('eduvision-teams');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return TEAMS;
  });

  useEffect(() => {
    try {
      localStorage.setItem('eduvision-teams', JSON.stringify(allTeams));
    } catch {}
  }, [allTeams]);

  const [allSchools, setAllSchools] = useState(() => {
    try {
      const saved = localStorage.getItem('eduvision-schools');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return SCHOOLS;
  });

  useEffect(() => {
    try {
      localStorage.setItem('eduvision-schools', JSON.stringify(allSchools));
    } catch {}
  }, [allSchools]);

  const handleUpdateSchool = (schoolId, updatedInfo) => {
    setAllSchools(prev => prev.map(s => s.id === schoolId ? { ...s, ...updatedInfo } : s));
  };

  const [selectedSchool, setSelectedSchool] = useState(() => {
    return (allSchools && allSchools.length > 0) ? allSchools[0].id : 's1';
  });
  const [selectedClassroom, setSelectedClassroom] = useState(() => {
    const defaultSchool = (allSchools && allSchools.length > 0) ? allSchools[0].id : 's1';
    return allTeams.find(c => c.schoolId === defaultSchool)?.id || '';
  });
  const [selectedYear, setSelectedYear] = useState(YEARS[YEARS.length - 1]);
  const [selectedTerm, setSelectedTerm] = useState(TERMS[0]);
  const [subjects, setSubjects] = useState(DEFAULT_SUBJECTS);
  const [showAddSubject, setShowAddSubject] = useState(false);
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [activeTab, setActiveTab] = useState('performance');
  const [showDataHub, setShowDataHub] = useState(false);
  const [showNationalHub, setShowNationalHub] = useState(false);
  const [showImportCsv, setShowImportCsv] = useState(false);
  const [showMatchCentre, setShowMatchCentre] = useState(false);
  const [matches, setMatches] = useState(() => {
    try {
      const saved = localStorage.getItem('eduvision-matches');
      if (saved) return JSON.parse(saved);
    } catch (err) {
      console.error('Error loading matches:', err);
    }
    return DEFAULT_MATCHES;
  });

  useEffect(() => {
    try {
      localStorage.setItem('eduvision-matches', JSON.stringify(matches));
    } catch { /* ignored */ }
  }, [matches]);

  const { settings, updateSettings, resetSettings } = useSettings();
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [logShotTarget, setLogShotTarget] = useState(null); // { student, year, term }
  const [adminTab, setAdminTab] = useState('registrations'); // 'registrations' | 'competitions' | 'data_entry'

  const handleAddMatches = (newMatches) => {
    setMatches(prev => [...prev, ...newMatches]);
  };

  const [searchQuery, setSearchQuery] = useState('');
  const searchContainerRef = useRef(null);

  const searchResults = useMemo(() => {
    if (searchQuery.trim().length < 2) return [];
    const query = searchQuery.toLowerCase();
    return allStudents.filter(s => s.name.toLowerCase().includes(query)).slice(0, 8);
  }, [allStudents, searchQuery]);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setSearchQuery('');
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleLogShot = (result, x, y, goalType) => {
    if (!logShotTarget) return;
    const { student, year, term } = logShotTarget;

    const newShot = {
      id: `${student.id}-${year}-${term}-u-${Date.now()}`,
      year,
      term,
      result,
      x,
      y,
      goalType: goalType || 'foot',
      timestamp: Date.now()
    };

    const updatedStudents = allStudents.map(s => {
      if (String(s.id) !== String(student.id)) return s;
      
      const newS = { 
        ...s, 
        shotLogs: [...(s.shotLogs || []), newShot],
        performance: { ...s.performance } 
      };

      if (!newS.performance[year]) newS.performance[year] = {};
      newS.performance[year] = { 
        ...newS.performance[year], 
        [term]: { ...(newS.performance[year][term] || {}) } 
      };

      const current = newS.performance[year][term];
      current['Shots'] = (current['Shots'] || 0) + 1;
      
      if (result === 'goal' || result === 'saved') {
        current['Shots on Target'] = (current['Shots on Target'] || 0) + 1;
      }
      if (result === 'goal') {
        current['Goals'] = (current['Goals'] || 0) + 1;
      }
      
      if (current['Shots'] > 0) {
        const accuracy = Math.round(((current['Shots on Target'] || 0) / current['Shots']) * 100);
        current['Shot Accuracy'] = accuracy;
      }

      return newS;
    });

    setAllStudents(updatedStudents);
    
    // Also update selectedStudent reference if drawer is open
    if (selectedStudent && String(selectedStudent.id) === String(student.id)) {
      const updatedSel = updatedStudents.find(s => String(s.id) === String(student.id));
      setSelectedStudent(updatedSel);
    }
    
    setLogShotTarget(null);
  };

  // Filter students for the currently selected team + year
  const students = selectedSchool === 'ALL' ? [] : getTeamStudents(allStudents, selectedClassroom, selectedYear);
  const currentClassroom = TEAMS.find(c => c.id === selectedClassroom);

  const handleSchoolChange = (e) => {
    const newSchoolId = e.target.value;
    setSelectedSchool(newSchoolId);
    if (newSchoolId !== 'ALL') {
      const firstClass = allTeams.find(c => c.schoolId === newSchoolId);
      if (firstClass) setSelectedClassroom(firstClass.id);
    }
  };

  const schoolClassrooms = selectedSchool === 'ALL' ? [] : allTeams.filter(c => c.schoolId === selectedSchool);
  const currentSchool = allSchools.find(s => s.id === selectedSchool) || { name: 'All Academies' };

  // Merge an updated subset of students back into the master list
  const handleDataUpdate = (updatedSubset) =>
    setAllStudents(prev => prev.map(s => updatedSubset.find(u => String(u.id) === String(s.id)) || s));

  const handleAddSubject   = (name) => { if (!name || subjects.includes(name)) return; setSubjects(prev => [...prev, name]); setShowAddSubject(false); };
  const handleRemoveSubject = (name) => setSubjects(prev => prev.filter(s => s !== name));

  const handleAddTeam = (teamInfo) => {
    const newTeamId = `${teamInfo.schoolId}-team-${teamInfo.ageGroup}-${teamInfo.gender.toLowerCase()}-${Date.now()}`;
    const newTeam = {
      id: newTeamId,
      name: teamInfo.name,
      customName: teamInfo.customName,
      schoolId: teamInfo.schoolId,
      gender: teamInfo.gender,
      ageGroup: teamInfo.ageGroup
    };
    setAllTeams(prev => [...prev, newTeam]);
    setSelectedClassroom(newTeamId); // automatically switch to newly created squad!
  };

  const handleAddPlayer = (playerInfo) => {
    const maxId = allStudents.reduce((m, s) => Math.max(m, s.id), 0);
    const newPlayer = {
      id: maxId + 1,
      name: playerInfo.name,
      schoolId: selectedSchool,
      teamAssignments: { [selectedYear]: selectedClassroom },
      performance: {},
      matchStats: {},
      extracurriculars: [],
      dob: playerInfo.dob,
      gender: playerInfo.gender,
      position: playerInfo.position,
      preferredFoot: playerInfo.preferredFoot,
      jerseyNumber: playerInfo.jerseyNumber,
      medicalInfo: playerInfo.medicalInfo,
      emergencyContact: playerInfo.emergencyContact,
      status: 'pending'
    };
    setAllStudents(prev => [...prev, newPlayer]);
  };

  const handleAddStudent = (fullName) => {
    const maxId = allStudents.reduce((m, s) => Math.max(m, s.id), 0);
    setAllStudents(prev => [...prev, {
      id: maxId + 1,
      name: fullName,
      teamAssignments: { [selectedYear]: selectedClassroom },
      performance: {},
      matchStats: {},
      extracurriculars: [],
    }]);
    setShowAddStudent(false);
  };

  const handleRemoveStudent = (id) => {
    const s = allStudents.find(st => String(st.id) === String(id));
    if (!s || !window.confirm(`Remove "${s.name}" from ${currentClassroom?.name}?`)) return;
    setAllStudents(prev => prev.filter(st => String(st.id) !== String(id)));
  };

  const handleTransferStudent = (studentId, newClassroomId) => {
    setAllStudents(prev => prev.map(s => {
      if (String(s.id) === String(studentId)) {
        return {
          ...s,
          teamAssignments: {
            ...s.teamAssignments,
            [selectedYear]: newClassroomId
          }
        };
      }
      return s;
    }));
    setSelectedStudent(null);
  };

  // CSV Import handler
  const handleCsvImport = (mergedStudents, newSubjects) => {
    // Merge students: update existing, add new
    setAllStudents(prev => {
      const updated = [...prev];
      for (const imported of mergedStudents) {
        const idx = updated.findIndex(s => s.name.toLowerCase() === imported.name.toLowerCase());
        if (idx >= 0) {
          updated[idx] = imported; // replace with merged version
        } else {
          updated.push(imported); // add new
        }
      }
      return updated;
    });
    // Add any new subjects that don't exist yet
    if (newSubjects && newSubjects.length > 0) {
      setSubjects(prev => {
        const existing = new Set(prev.map(s => s.toLowerCase()));
        const toAdd = newSubjects.filter(s => !existing.has(s.toLowerCase()));
        return toAdd.length > 0 ? [...prev, ...toAdd] : prev;
      });
    }
  };

  // ── Match Centre: End Match handler ──────────────────────────────
  const handleEndMatch = (matchResult) => {
    const matchId = matchResult.id || `match-${Date.now()}`;
    setMatches(prev => {
      const exists = prev.some(m => m.id === matchId);
      if (exists) {
        return prev.map(m => m.id === matchId ? { ...m, ...matchResult, status: 'completed', date: new Date().toISOString() } : m);
      } else {
        return [...prev, { id: matchId, ...matchResult, status: 'completed', date: new Date().toISOString() }];
      }
    });
  };

  // ── Dynamic Match Update & Standings Propagation ───────────────────
  const handleUpdateMatch = (updatedMatch) => {
    setMatches(prev => prev.map(m => m.id === updatedMatch.id ? updatedMatch : m));

    // Propagate statistics only if the match transitions to 'approved'
    if (updatedMatch.status === 'approved') {
      const { playerStats, matchday } = updatedMatch;
      if (playerStats) {
        setAllStudents(prev => prev.map(student => {
          const stats = playerStats[String(student.id)];
          if (!stats) return student;

          const newStudent = { ...student };
          // Merge performance stats
          if (!newStudent.performance) newStudent.performance = {};
          if (!newStudent.performance[selectedYear]) newStudent.performance[selectedYear] = {};
          const md = matchday || selectedTerm;
          if (!newStudent.performance[selectedYear][md]) newStudent.performance[selectedYear][md] = {};
          const perf = { ...newStudent.performance[selectedYear][md] };

          const perfStats = ['Goals', 'Assists', 'Shots on Target', 'Shots', 'Pass Completed',
            'Successful Dribbles', 'Successful Clearances', 'Successful Blocks',
            'Corners Taken', 'Freekicks Taken', 'Penalties Taken', 'Successful Tackles',
            'Saves', 'Penalties Saved', 'Free Kick Saves', 'Goals Conceded', 'Punches', 'High Claims'];
          perfStats.forEach(stat => {
            if (stats[stat]) perf[stat] = (perf[stat] || 0) + stats[stat];
          });

          // Float stats — add raw values
          ['Tackles Per Game', 'Interceptions Per Game', 'Shots Per Game'].forEach(stat => {
            if (stats[stat]) perf[stat] = (perf[stat] || 0) + stats[stat];
          });

          // Recalculate Shot Accuracy
          if (perf['Shots'] > 0) {
            perf['Shot Accuracy'] = Math.round(((perf['Shots on Target'] || 0) / perf['Shots']) * 100);
          }
          newStudent.performance[selectedYear] = { ...newStudent.performance[selectedYear], [md]: perf };

          // Merge matchStats (discipline + playtime)
          if (!newStudent.matchStats) newStudent.matchStats = {};
          if (!newStudent.matchStats[selectedYear]) newStudent.matchStats[selectedYear] = {};
          if (!newStudent.matchStats[selectedYear][md]) newStudent.matchStats[selectedYear][md] = {};
          const ms = { ...newStudent.matchStats[selectedYear][md] };
          ms.gamesPlayed = (ms.gamesPlayed || 0) + 1;
          if (stats.minutesPlayed) ms.minutesPlayed = (ms.minutesPlayed || 0) + stats.minutesPlayed;
          if (stats.yellowCards) ms.yellowCards = (ms.yellowCards || 0) + stats.yellowCards;
          if (stats.redCards) ms.redCards = (ms.redCards || 0) + stats.redCards;
          newStudent.matchStats[selectedYear] = { ...newStudent.matchStats[selectedYear], [md]: ms };

          // Merge shot logs from timeline
          const playerShots = (updatedMatch.timeline || [])
            .filter(event => Number(event.playerId) === Number(student.id) && (event.type === 'goal' || event.type === 'shotOnTarget' || event.type === 'shotMissed'))
            .map((event, index) => {
              let resultType = 'miss';
              if (event.type === 'goal') {
                resultType = event.goalType === 'own-goal' ? 'miss' : 'goal';
              } else if (event.type === 'shotOnTarget') {
                resultType = 'saved';
              }

              return {
                id: `${student.id}-${selectedYear}-${md}-u-${Date.now()}-${index}`,
                year: selectedYear,
                term: md,
                result: resultType,
                x: event.x != null ? event.x : 50,
                y: event.y != null ? event.y : 50,
                goalType: event.goalType || null,
                timestamp: Date.now()
              };
            });

          if (playerShots.length > 0) {
            newStudent.shotLogs = [...(newStudent.shotLogs || []), ...playerShots];
          }

          return newStudent;
        }));
      }
    }
  };

  if (!isAuthenticated || !userRole) {
    return <AdminLandingPage 
      allTeams={allTeams}
      allSchools={allSchools}
      onLogin={(role, coachTeamId) => {
      setUserRole(role);
      let activeSchool = selectedSchool;

      if (role === 'coach' && coachTeamId) {
        // Coach chose a specific team at login
        const teamObj = allTeams.find(t => t.id === coachTeamId);
        if (teamObj) {
            activeSchool = teamObj.schoolId;
            setSelectedSchool(activeSchool);
            setSelectedClassroom(coachTeamId);
        }
      } else {
        if (role === 'school_admin' || role === 'teacher' || role === 'principal') {
            if (selectedSchool === 'ALL') {
            activeSchool = allSchools[0].id;
            setSelectedSchool(activeSchool);
            }
        }
        if (role === 'principal' || role === 'school_admin') {
            setSelectedClassroom('ALL');
        } else if (role === 'teacher') {
            const firstClass = allTeams.find(c => c.schoolId === activeSchool);
            if (firstClass) setSelectedClassroom(firstClass.id);
        }
      }
      setIsAuthenticated(true);
    }} />;
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 1, overflow: 'hidden' }}>

      {/* ── Top Header ───────────────────────────────────────────── */}
      <header style={{
        height: '90px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 32px',
        borderBottom: 'var(--border)',
        background: 'var(--bg-panel)',
        backdropFilter: 'blur(20px)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        {/* Logo + Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '4px',
            background: 'rgba(0, 38, 127, 0.35)', border: '1px solid rgba(255, 199, 38, 0.4)',
            padding: '4px', borderRadius: '12px'
          }}>
            <button
              onClick={() => setSelectedTournament('PMC')}
              style={{
                padding: '6px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: '800',
                background: selectedTournament === 'PMC' ? '#FFC726' : 'transparent',
                color: selectedTournament === 'PMC' ? '#00267F' : 'var(--text-secondary)',
                border: 'none', cursor: 'pointer', transition: 'all 0.2s', outline: 'none'
              }}
            >
              🏆 Prime Minister's Cup
            </button>
            <button
              onClick={() => setSelectedTournament('NSSL')}
              style={{
                padding: '6px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: '800',
                background: selectedTournament === 'NSSL' ? 'rgba(255,255,255,0.1)' : 'transparent',
                color: selectedTournament === 'NSSL' ? 'var(--text-primary)' : 'var(--text-secondary)',
                border: 'none', cursor: 'pointer', transition: 'all 0.2s', outline: 'none'
              }}
            >
              ⚽ National League
            </button>
          </div>
        </div>

        {/* Centre — Search */}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', position: 'relative' }} ref={searchContainerRef}>
          <div style={{ 
            display: 'flex', alignItems: 'center', gap: '8px', 
            background: 'rgba(255,255,255,0.05)', border: 'var(--border)', 
            padding: '8px 16px', borderRadius: '20px', width: '400px',
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            <input 
              type="text" 
              placeholder="Search players..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '13px', color: 'var(--text-primary)', width: '100%', fontWeight: '500' }} 
            />
          </div>
          {searchQuery.trim().length >= 2 && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '400px',
              marginTop: '6px',
              background: 'var(--bg-surface)',
              border: 'var(--border)',
              borderRadius: '12px',
              boxShadow: 'var(--shadow-lg)',
              zIndex: 1000,
              maxHeight: '300px',
              overflowY: 'auto',
              padding: '4px 0'
            }}>
              {searchResults.length > 0 ? (
                searchResults.map(player => {
                  const latestYear = Object.keys(player.teamAssignments || {}).sort().pop();
                  const displayYear = latestYear || selectedYear;
                  const teamObj = allTeams.find(t => t.id === player.teamAssignments?.[displayYear]);
                  const schoolObj = allSchools.find(s => s.id === player.schoolId);
                  return (
                    <div 
                      key={player.id}
                      onClick={() => {
                        setSelectedStudent(player);
                        setSearchQuery('');
                      }}
                      style={{
                        padding: '10px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        borderBottom: '1px solid rgba(255,255,255,0.02)',
                        transition: 'background 0.15s ease'
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>{player.name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          {schoolObj?.name || 'Unknown Club'} · {teamObj?.name || 'Unassigned'}
                        </div>
                      </div>
                      {player.jerseyNumber && (
                        <span style={{
                          fontSize: '10px',
                          fontWeight: '800',
                          padding: '2px 6px',
                          borderRadius: '99px',
                          background: 'rgba(37,99,235,0.15)',
                          color: 'var(--primary-light)'
                        }}>
                          #{player.jerseyNumber}
                        </span>
                      )}
                    </div>
                  );
                })
              ) : (
                <div style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center' }}>
                  No players found
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right — Actions */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>


          {(userRole === 'referee' || userRole === 'statistician' || userRole === 'super_admin') && (
            <button
              onClick={() => setShowMatchCentre(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: '7px',
                padding: '8px 16px',
                background: 'rgba(34,197,94,0.12)',
                color: '#4ade80',
                border: '1px solid rgba(34,197,94,0.25)',
                borderRadius: '10px',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                fontFamily: 'inherit',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(34,197,94,0.22)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(34,197,94,0.12)'; }}
            >
              ⚽ Match Centre
            </button>
          )}

          {(userRole === 'analyst' || userRole === 'statistician' || userRole === 'super_admin' || userRole === 'league_admin') && (
            <button
              onClick={() => setShowDataHub(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: '7px',
                padding: '8px 16px',
                background: 'rgba(99,102,241,0.15)',
                color: '#a5b4fc',
                border: '1px solid rgba(99,102,241,0.3)',
                borderRadius: '10px',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                fontFamily: 'inherit',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.25)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.15)'; }}
            >
              Raw Data Sandbox
            </button>
          )}

          <button
            onClick={() => setShowSettings(true)}
            style={{
              width: '38px', height: '38px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '10px',
              color: 'var(--text-secondary)',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
            title="Settings"
          >
            <GearIcon />
          </button>

          <button
            onClick={() => setUserRole(null)}
            style={{
              width: '38px', height: '38px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: '10px',
              color: '#ef4444',
              marginLeft: '4px',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.2)'; e.currentTarget.style.color = '#f87171'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; e.currentTarget.style.color = '#ef4444'; }}
            title="Log Out"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
          </button>
        </div>
      </header>

      {/* ── Main Content ─────────────────────────────────────────── */}
      <main style={{ flex: 1, padding: '20px 28px 24px', width: '100%', minWidth: 0, display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto', minHeight: 0 }}>

        {/* Page Title & Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', flexShrink: 0, marginBottom: '16px' }}>
          <div>
            <p style={{ fontSize: '11px', fontWeight: '600', letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Football Performance Dashboard
            </p>
            <h1 style={{ fontSize: '36px', fontWeight: '800', letterSpacing: '-0.5px', lineHeight: 1.1, color: 'var(--text-primary)', margin: '0 0 6px 0' }}>
              {selectedSchool === 'ALL' ? 'Global Overview' : currentClassroom?.name}
            </h1>
            <span style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-secondary)' }}>
                {selectedSchool === 'ALL' ? `${currentSchool.name} · Open Data Hub for Analytics` : `${currentSchool.name} · ${currentClassroom?.ageGroup || ''} · ${students.length} players`}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '12px', position: 'relative', zIndex: 10 }}>
             {/* Context Selectors */}
             <CustomSelect
               value={selectedSchool}
               onChange={handleSchoolChange}
               disabled={userRole === 'coach'}
               placeholder="Select Academy..."
               options={[
                 { value: 'ALL', label: 'All Academies' },
                 ...allSchools.map(s => ({ value: s.id, label: s.name }))
               ]}
               selectStyle={{
                 padding: '8px 32px 8px 16px',
                 borderRadius: '20px',
                 fontSize: '13px',
                 fontWeight: '600',
                 boxShadow: 'var(--shadow-sm)',
               }}
             />

             {/* Team selector */}
             <CustomSelect
               value={selectedClassroom}
               onChange={e => setSelectedClassroom(e.target.value)}
               disabled={selectedSchool === 'ALL' || userRole === 'coach'}
               placeholder="Select Squad..."
               options={[
                 ...((userRole === 'principal' || userRole === 'school_admin') ? [{ value: 'ALL', label: 'All Squads' }] : []),
                 ...schoolClassrooms.map(c => ({ value: c.id, label: c.name }))
               ]}
               selectStyle={{
                 padding: '8px 32px 8px 16px',
                 borderRadius: '20px',
                 fontSize: '13px',
                 fontWeight: '600',
                 boxShadow: 'var(--shadow-sm)',
               }}
               style={{
                 opacity: selectedSchool === 'ALL' ? 0.5 : 1,
               }}
             />

             <NavSelect value={selectedYear} onChange={e => setSelectedYear(e.target.value)} options={YEARS} />

             {/* Actions */}
             {selectedSchool !== 'ALL' && (
               <>
                 <button onClick={() => setShowAddStudent(true)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 20px', background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-primary)', border: 'var(--border)', borderRadius: '20px', fontSize: '13px', fontWeight: '600', boxShadow: 'var(--shadow-sm)', cursor: 'pointer' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}> Add Player </button>
                 <button onClick={() => exportClassReport(students, subjects, selectedYear, selectedTerm, currentClassroom?.name, settings)} style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '8px 20px', background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-primary)', border: 'var(--border)', borderRadius: '20px', fontSize: '13px', fontWeight: '600', boxShadow: 'var(--shadow-sm)', cursor: 'pointer' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}> Export CSV </button>
                 <button onClick={() => setShowImportCsv(true)} style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '8px 20px', background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-primary)', border: 'var(--border)', borderRadius: '20px', fontSize: '13px', fontWeight: '600', boxShadow: 'var(--shadow-sm)', cursor: 'pointer' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg> Upload CSV </button>
               </>
             )}
          </div>
        </div>

        {/* ── Dashboard Grid ──────────────────────────────────────── */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr', 
          gap: '20px', flex: 1, minHeight: 0 
        }}>

          {/* Super Admin & League Admin Tabbed Layout */}
          {(userRole === 'super_admin' || userRole === 'league_admin') && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: 1, minHeight: 0 }}>
              <div style={{ display: 'flex', gap: '4px', background: 'rgba(255, 255, 255, 0.03)', padding: '4px', borderRadius: '10px', width: 'fit-content', border: 'var(--border)' }}>
                {[
                  { id: 'registrations', label: '📋 School & Player Registrations' },
                  { id: 'competitions', label: '🛡️ Competition Setup' },
                  { id: 'data_entry', label: '📊 Raw Data Sandbox' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setAdminTab(tab.id)}
                    style={{
                      padding: '8px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: '700',
                      background: adminTab === tab.id ? 'rgba(255,255,255,0.08)' : 'transparent',
                      color: adminTab === tab.id ? 'var(--text-primary)' : 'var(--text-secondary)',
                      cursor: 'pointer', transition: 'all 0.2s', border: 'none', outline: 'none'
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              
              <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
                {adminTab === 'registrations' && (
                  <SchoolPlayerRegistration
                    allPlayers={allStudents}
                    onDataUpdate={setAllStudents}
                    schools={SCHOOLS}
                    teams={allTeams}
                  />
                )}

                {adminTab === 'competitions' && (
                  <CompetitionAdmin
                    schools={allSchools}
                    teams={allTeams}
                    matches={matches}
                    allStudents={allStudents}
                    year={selectedYear}
                    onAddMatches={handleAddMatches}
                  />
                )}

                {adminTab === 'data_entry' && (
                  <DataEntryPanel
                    students={students}
                    year={selectedYear}
                    term={selectedTerm}
                    subjects={subjects}
                    settings={settings}
                    onDataUpdate={handleDataUpdate}
                    onRemoveSubject={handleRemoveSubject}
                    onRemoveStudent={handleRemoveStudent}
                    onStudentClick={setSelectedStudent}
                    onAddSubjectClick={() => setShowAddSubject(true)}
                    onOpenLogShotModal={(student, yr, tr) => setLogShotTarget({ student, year: yr, term: tr })}
                  />
                )}
              </div>
            </div>
          )}

          {/* Coach & Teacher View */}
          {(userRole === 'teacher' || userRole === 'coach' || (userRole === 'principal' && selectedClassroom !== 'ALL')) && (
              <TeacherDashboard 
                  students={students} 
                  year={selectedYear} 
                  term={selectedTerm} 
                  subjects={subjects}
                  settings={settings}
                  selectedClassroom={selectedClassroom}
                  onStudentClick={setSelectedStudent} 
                  onDataUpdate={handleDataUpdate}
                  onRemoveSubject={handleRemoveSubject}
                  onRemoveStudent={handleRemoveStudent}
                  onAddSubjectClick={() => setShowAddSubject(true)}
                  onOpenLogShotModal={(student, yr, tr) => setLogShotTarget({ student, year: yr, term: tr })}
                  schoolId={selectedSchool}
                  schools={allSchools}
                  allTeams={allTeams}
                  onAddTeam={handleAddTeam}
                  onAddPlayer={handleAddPlayer}
                  userRole={userRole}
                  matches={matches}
                  allPlayers={allStudents}
                  onUpdateMatch={handleUpdateMatch}
              />
          )}

          {/* Principal View */}
          {(userRole === 'principal' && selectedClassroom === 'ALL') && (
              <PrincipalDashboard
                  students={students}
                  allStudents={allStudents}
                  selectedSchool={selectedSchool}
                  year={selectedYear}
                  term={selectedTerm}
              />
          )}

          {/* School Administrator View */}
          {userRole === 'school_admin' && (
              <SchoolAdminDashboard
                  schoolId={selectedSchool}
                  schools={allSchools}
                  allPlayers={allStudents}
                  allTeams={allTeams}
                  matches={matches}
                  onUpdateSchool={handleUpdateSchool}
                  onDataUpdate={setAllStudents}
              />
          )}

          {/* Referee View */}
          {userRole === 'referee' && (
              <RefereeDashboard
                  matches={matches}
                  schools={allSchools}
                  allPlayers={allStudents}
                  year={selectedYear}
                  onUpdateMatch={handleUpdateMatch}
              />
          )}

          {/* Fourth Official View */}
          {userRole === 'fourth_official' && (
              <FourthOfficialDashboard
                  matches={matches}
                  schools={allSchools}
                  allPlayers={allStudents}
                  onUpdateMatch={handleUpdateMatch}
              />
          )}

          {/* Match Commissioner View */}
          {userRole === 'commissioner' && (
              <CommissionerDashboard
                  matches={matches}
                  schools={allSchools}
                  allTeams={allTeams}
                  onUpdateMatch={handleUpdateMatch}
                  onAddMatches={handleAddMatches}
              />
          )}

          {/* Statistician & Analyst View */}
          {(userRole === 'analyst' || userRole === 'statistician') && (
              <DataEntryPanel
                  students={students}
                  year={selectedYear}
                  term={selectedTerm}
                  subjects={subjects}
                  settings={settings}
                  onDataUpdate={handleDataUpdate}
                  onRemoveSubject={handleRemoveSubject}
                  onRemoveStudent={handleRemoveStudent}
                  onStudentClick={setSelectedStudent}
                  onAddSubjectClick={() => setShowAddSubject(true)}
                  onOpenLogShotModal={(student, yr, tr) => setLogShotTarget({ student, year: yr, term: tr })}
              />
          )}
        </div>
      </main>

      {/* ── Modals ─────────────────────────────────────────────────── */}
      {logShotTarget && (
        <LogShotModal
          student={logShotTarget.student}
          year={logShotTarget.year}
          term={logShotTarget.term}
          onSave={handleLogShot}
          onClose={() => setLogShotTarget(null)}
        />
      )}
      {showAddSubject && <AddSubjectModal onAdd={handleAddSubject} onClose={() => setShowAddSubject(false)} existingSubjects={subjects} />}
      {showAddStudent && <AddStudentModal onAdd={handleAddStudent} onClose={() => setShowAddStudent(false)} existingNames={students.map(s => s.name)} />}
      {showSettings && <SettingsPanel settings={settings} onUpdate={updateSettings} onReset={resetSettings} onClose={() => setShowSettings(false)} />}
      {selectedStudent && (
        <StudentProfileDrawer
          student={selectedStudent}
          subjects={subjects}
          settings={settings}
          onClose={() => setSelectedStudent(null)}
          onTransferStudent={handleTransferStudent}
          selectedYear={selectedYear}
          allSquadStudents={students}
        />
      )}

      {showDataHub && (
        <DataHub
          year={selectedYear}
          term={selectedTerm}
          selectedSchool={selectedSchool}
          onClose={() => setShowDataHub(false)}
          onStudentClick={setSelectedStudent}
        />
      )}

      {showNationalHub && (
        <NationalHub
          year={selectedYear}
          term={selectedTerm}
          onClose={() => setShowNationalHub(false)}
          onStudentClick={setSelectedStudent}
        />
      )}

      {showMatchCentre && (userRole === 'referee' || userRole === 'statistician' || userRole === 'super_admin') && (
        <MatchCentre
          allStudents={allStudents}
          year={selectedYear}
          term={selectedTerm}
          matches={matches}
          onEndMatch={handleEndMatch}
          onUpdateMatch={handleUpdateMatch}
          onClose={() => setShowMatchCentre(false)}
        />
      )}

      {showImportCsv && (
        <ImportCsvModal
          onImport={handleCsvImport}
          onClose={() => setShowImportCsv(false)}
          selectedYear={selectedYear}
          selectedTerm={selectedTerm}
          selectedClassroom={selectedClassroom}
          existingStudents={allStudents}
        />
      )}
    </div>
  );
}

export default App;
