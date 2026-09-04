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
import { PMC_SCHOOLS, PMC_TEAMS, PMC_STUDENTS, PMC_MATCHES, PMC_YEARS } from './utils/pmcDataLoader';
import { pushMatchesToCloud, subscribeToRealtimeSync } from './utils/realtimeSync';
import { exportClassReport } from './utils/exportReport';
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
import StatisticianDashboard from './components/statistician/StatisticianDashboard';
import { sendRefereeSquadNotification, sendDataLoggerMatchReadyNotification } from './services/refereeNotificationService';
import { getOfficialsByRole, findOfficial } from './data/matchOfficialAccounts';
import { getAnalystAccounts, findAnalystByEmailOrId } from './data/analystAccounts';

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
  if (!savedList || !Array.isArray(savedList) || savedList.length === 0) return ALL_STUDENTS;
  const migratedList = migrateTermsToMatchdays(savedList);

  const baseIds = new Set(ALL_STUDENTS.map(b => b && String(b.id)));
  
  // Update base students with any saved edits
  const mergedBase = ALL_STUDENTS.map(baseStudent => {
    if (!baseStudent) return baseStudent;
    const savedStudent = migratedList.find(s => s && String(s.id) === String(baseStudent.id));
    if (!savedStudent) return baseStudent;

    const mockShots = (baseStudent.shotLogs || []).filter(shot => shot && shot.id && !String(shot.id).includes('-u-'));
    const userShots = (savedStudent.shotLogs || []).filter(shot => shot && shot.id && String(shot.id).includes('-u-'));

    return {
      ...baseStudent,
      name: savedStudent.name || baseStudent.name,
      schoolId: savedStudent.schoolId || baseStudent.schoolId,
      teamAssignments: savedStudent.teamAssignments || baseStudent.teamAssignments,
      performance: savedStudent.performance || baseStudent.performance,
      matchStats: savedStudent.matchStats || baseStudent.matchStats,
      extracurriculars: savedStudent.extracurriculars || baseStudent.extracurriculars,
      jerseyNumber: savedStudent.jerseyNumber != null ? savedStudent.jerseyNumber : baseStudent.jerseyNumber,
      shotLogs: [...mockShots, ...userShots],
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
  });

  // Preserve any newly registered custom players added by user
  const customSaved = migratedList.filter(s => s && s.id && !baseIds.has(String(s.id)));
  const result = [...mergedBase, ...customSaved];
  return result.length > 0 ? result : ALL_STUDENTS;
}

function sanitizeMatchState(matchList) {
  if (!Array.isArray(matchList)) return [];
  return matchList;
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
    status: 'live',
    currentHalf: '1H',
    matchTime: '24:30',
    homeScore: 1,
    awayScore: 0,
    homeSquadSelection: {
      startingXI: ['s1-p1', 's1-p2', 's1-p3', 's1-p4', 's1-p5', 's1-p6', 's1-p7', 's1-p8', 's1-p9', 's1-p10', 's1-p11'],
      benchPlayers: ['s1-p12', 's1-p13', 's1-p14', 's1-p15', 's1-p16'],
      formation: '4-3-3'
    },
    awaySquadSelection: {
      startingXI: ['s2-p1', 's2-p2', 's2-p3', 's2-p4', 's2-p5', 's2-p6', 's2-p7', 's2-p8', 's2-p9', 's2-p10', 's2-p11'],
      benchPlayers: ['s2-p12', 's2-p13', 's2-p14', 's2-p15'],
      formation: '4-2-3-1'
    },
    liveState: {
      period: '1H',
      isRunning: true,
      elapsedOffset: 24 * 60 + 30,
      possession: {
        homeSecs: 820,
        awaySecs: 650,
        activeSide: 'home'
      }
    },
    playerStats: {},
    timeline: [
      {
        id: 'ev-seed-1',
        elapsed: 12 * 60,
        period: '1H',
        type: 'goal',
        playerId: 's1-p9',
        playerName: 'Marcus Harrison',
        team: 'home',
        goalType: 'foot'
      }
    ],
    date: new Date().toISOString()
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
    homeSquadSelection: null,
    awaySquadSelection: null,
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
    homeSquadSelection: null,
    awaySquadSelection: null,
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
    homeSquadSelection: null,
    awaySquadSelection: null,
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
    homeSquadSelection: null,
    awaySquadSelection: null,
    playerStats: {},
    timeline: [],
    date: new Date(Date.now() + 172800000).toISOString()
  }
];

// ── Main App ────────────────────────────────────────────────────────
function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    try {
      return sessionStorage.getItem('eduvision-authenticated') === 'true';
    } catch { return false; }
  });
  const [userRole, setUserRole] = useState(() => {
    try {
      return sessionStorage.getItem('eduvision-role') || null;
    } catch { return null; }
  });
  const [currentAnalyst, setCurrentAnalyst] = useState(() => {
    try {
      const saved = sessionStorage.getItem('eduvision-current-analyst');
      if (saved) return JSON.parse(saved);
      const params = new URLSearchParams(window.location.search);
      const analystIdParam = params.get('analystId') || params.get('analystEmail');
      if (analystIdParam) return findOfficial('statistician', analystIdParam);
    } catch { /* ignored */ }
    return getOfficialsByRole('statistician')[0];
  });
  const [currentReferee, setCurrentReferee] = useState(() => {
    try {
      const saved = sessionStorage.getItem('eduvision-current-referee');
      if (saved) return JSON.parse(saved);
    } catch { /* ignored */ }
    return getOfficialsByRole('referee')[0];
  });
  const [currentFourthOfficial, setCurrentFourthOfficial] = useState(() => {
    try {
      const saved = sessionStorage.getItem('eduvision-current-fourth-official');
      if (saved) return JSON.parse(saved);
    } catch { /* ignored */ }
    return getOfficialsByRole('fourth_official')[0];
  });
  const [directMatchId, setDirectMatchId] = useState(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      return params.get('matchId') || null;
    } catch { return null; }
  });
  const [selectedTournament, setSelectedTournament] = useState(() => {
    try {
      return sessionStorage.getItem('eduvision-tournament') || 'PMC';
    } catch { return 'PMC'; }
  });
  const [allStudents, setAllStudents] = useState(() => {
    try {
      const saved = localStorage.getItem('eduvision-students');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return loadAndMergeStudents(parsed);
        }
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

  const [pmcStudents, setPmcStudents] = useState(() => {
    try {
      const saved = localStorage.getItem('eduvision-pmc-students-v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (err) {
      console.error("Error loading eduvision-pmc-students:", err);
    }
    return PMC_STUDENTS;
  });

  useEffect(() => {
    try {
      localStorage.setItem('eduvision-pmc-students-v1', JSON.stringify(pmcStudents));
    } catch {}
  }, [pmcStudents]);
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
    try {
      const saved = sessionStorage.getItem('eduvision-school');
      if (saved) return saved;
    } catch {}
    const initialTourn = (typeof window !== 'undefined' && sessionStorage.getItem('eduvision-tournament')) || 'PMC';
    const schoolList = initialTourn === 'PMC' ? PMC_SCHOOLS : (allSchools && allSchools.length > 0 ? allSchools : SCHOOLS);
    return (schoolList && schoolList.length > 0) ? schoolList[0].id : 's1';
  });

  const [selectedClassroom, setSelectedClassroom] = useState(() => {
    try {
      const saved = sessionStorage.getItem('eduvision-classroom');
      if (saved) return saved;
    } catch {}
    const initialTourn = (typeof window !== 'undefined' && sessionStorage.getItem('eduvision-tournament')) || 'PMC';
    const teamList = initialTourn === 'PMC' ? PMC_TEAMS : (allTeams && allTeams.length > 0 ? allTeams : TEAMS);
    const schoolList = initialTourn === 'PMC' ? PMC_SCHOOLS : (allSchools && allSchools.length > 0 ? allSchools : SCHOOLS);
    const defaultSchool = (schoolList && schoolList.length > 0) ? schoolList[0].id : 's1';
    return teamList.find(c => c.schoolId === defaultSchool)?.id || '';
  });

  const [selectedYear, setSelectedYear] = useState(() => {
    return '2026-2027';
  });
  const [selectedTerm, setSelectedTerm] = useState('Matchday 1');

  // Session persistence across hard refreshes
  useEffect(() => {
    try {
      if (isAuthenticated && userRole) {
        sessionStorage.setItem('eduvision-authenticated', 'true');
        sessionStorage.setItem('eduvision-role', userRole);
        sessionStorage.setItem('eduvision-tournament', selectedTournament);
        sessionStorage.setItem('eduvision-school', selectedSchool);
        sessionStorage.setItem('eduvision-classroom', selectedClassroom);
        if (currentAnalyst) {
          sessionStorage.setItem('eduvision-current-analyst', JSON.stringify(currentAnalyst));
        }
        if (currentReferee) {
          sessionStorage.setItem('eduvision-current-referee', JSON.stringify(currentReferee));
        }
        if (currentFourthOfficial) {
          sessionStorage.setItem('eduvision-current-fourth-official', JSON.stringify(currentFourthOfficial));
        }
      } else {
        sessionStorage.removeItem('eduvision-authenticated');
        sessionStorage.removeItem('eduvision-role');
        sessionStorage.removeItem('eduvision-current-analyst');
        sessionStorage.removeItem('eduvision-current-referee');
        sessionStorage.removeItem('eduvision-current-fourth-official');
      }
    } catch {}
  }, [isAuthenticated, userRole, selectedTournament, selectedSchool, selectedClassroom, currentAnalyst, currentReferee, currentFourthOfficial]);
  const [subjects, setSubjects] = useState(DEFAULT_SUBJECTS);
  const [showAddSubject, setShowAddSubject] = useState(false);
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [activeTab, setActiveTab] = useState('performance');
  const [showNationalHub, setShowNationalHub] = useState(false);
  const [showImportCsv, setShowImportCsv] = useState(false);
  const [showMatchCentre, setShowMatchCentre] = useState(false);
  const [matches, setMatches] = useState(() => {
    try {
      const saved = localStorage.getItem('eduvision-matches');
      if (saved) return sanitizeMatchState(JSON.parse(saved));
    } catch (err) {
      console.error('Error loading matches:', err);
    }
    return sanitizeMatchState(DEFAULT_MATCHES);
  });

  const [pmcMatches, setPmcMatches] = useState(() => {
    try {
      const saved = localStorage.getItem('eduvision-pmc-matches-v3');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const hasPmcClub = parsed.some(m => 
            String(m.homeTeamId).includes('pmc-club') || 
            String(m.id).includes('pmc') || 
            String(m.homeTeam).includes('Bagatelle') || 
            String(m.homeTeam).includes('Kickstart') || 
            String(m.homeTeam).includes('Technique')
          );
          if (hasPmcClub) {
            return sanitizeMatchState(parsed);
          }
        }
      }
    } catch (err) {
      console.error('Error loading PMC matches:', err);
    }
    return sanitizeMatchState(PMC_MATCHES);
  });

  // LocalStorage persistence for matches
  useEffect(() => {
    try {
      localStorage.setItem('eduvision-matches', JSON.stringify(matches));
    } catch { /* ignored */ }
  }, [matches]);

  useEffect(() => {
    try {
      localStorage.setItem('eduvision-pmc-matches-v3', JSON.stringify(pmcMatches));
    } catch { /* ignored */ }
  }, [pmcMatches]);

  // Realtime Cross-Device Synchronization
  useEffect(() => {
    const unsubscribe = subscribeToRealtimeSync((cloudMatches) => {
      if (cloudMatches && Array.isArray(cloudMatches) && cloudMatches.length > 0) {
        const sanitizedCloud = sanitizeMatchState(cloudMatches);
        if (selectedTournament === 'PMC') {
          setPmcMatches(sanitizedCloud);
        } else {
          setMatches(sanitizedCloud);
        }
      }
    });
    return unsubscribe;
  }, [selectedTournament]);



  const { settings, updateSettings, resetSettings } = useSettings();
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [logShotTarget, setLogShotTarget] = useState(null); // { student, year, term }
  const [adminTab, setAdminTab] = useState(() => selectedTournament === 'PMC' ? 'pmc_approvals' : 'registrations');

  const adminTabs = useMemo(() => {
    if (selectedTournament === 'PMC') {
      return [
        { id: 'pmc_approvals', label: 'PMC Match Verification & Approvals' },
        { id: 'competitions', label: 'PMC Fixtures & Standings' },
        { id: 'club_rosters', label: 'Senior Club Roster Directory' }
      ];
    }
    return [
      { id: 'registrations', label: 'School & Player Registrations' },
      { id: 'competitions', label: 'Competition Setup' }
    ];
  }, [selectedTournament]);

  useEffect(() => {
    if (selectedTournament === 'PMC' && !['pmc_approvals', 'competitions', 'club_rosters', 'data_entry'].includes(adminTab)) {
      setAdminTab('pmc_approvals');
    } else if (selectedTournament !== 'PMC' && !['registrations', 'competitions', 'data_entry'].includes(adminTab)) {
      setAdminTab('registrations');
    }
  }, [selectedTournament, adminTab]);

  const handleAddMatches = (newMatches) => {
    const addFn = prev => {
      const next = [...prev, ...newMatches];
      pushMatchesToCloud(next);
      return next;
    };
    if (selectedTournament === 'PMC') {
      setPmcMatches(addFn);
    }
    setMatches(addFn);
  };

  const handleResetPmcMatches = () => {
    const sanitized = sanitizeMatchState(PMC_MATCHES);
    setPmcMatches(sanitized);
    try {
      localStorage.setItem('eduvision-pmc-matches-v2', JSON.stringify(sanitized));
      pushMatchesToCloud(sanitized);
    } catch {}
  };

  // Derive active tournament datasets
  const displaySchools = useMemo(() => selectedTournament === 'PMC' ? PMC_SCHOOLS : allSchools, [selectedTournament, allSchools]);
  const displayTeams = useMemo(() => selectedTournament === 'PMC' ? PMC_TEAMS : allTeams, [selectedTournament, allTeams]);
  const displayStudents = useMemo(() => selectedTournament === 'PMC' ? pmcStudents : allStudents, [selectedTournament, pmcStudents, allStudents]);
  const displayMatches = useMemo(() => selectedTournament === 'PMC' ? pmcMatches : matches, [selectedTournament, pmcMatches, matches]);
  const displayYears = useMemo(() => selectedTournament === 'PMC' ? PMC_YEARS : YEARS, [selectedTournament]);

  // Auto-switch active school, classroom, and year when changing tournament mode
  useEffect(() => {
    if (selectedTournament === 'PMC') {
      setSelectedYear('2026-2027');
    } else {
      setSelectedYear(YEARS[YEARS.length - 1]);
    }
    if (displaySchools && displaySchools.length > 0) {
      const firstSchool = displaySchools[0].id;
      setSelectedSchool(firstSchool);
      const firstTeam = displayTeams.find(c => c.schoolId === firstSchool);
      if (firstTeam) setSelectedClassroom(firstTeam.id);
      else setSelectedClassroom('');
    }
  }, [selectedTournament]);

  // Filter students for the currently selected team + year
  const students = useMemo(() => {
    if (selectedSchool === 'ALL') return displayStudents;
    if (selectedClassroom && selectedClassroom !== 'ALL') {
      const teamSts = getTeamStudents(displayStudents, selectedClassroom, selectedYear);
      if (teamSts.length > 0) return teamSts;
    }
    return displayStudents.filter(s => s.schoolId === selectedSchool);
  }, [displayStudents, selectedSchool, selectedClassroom, selectedYear]);

  const [searchQuery, setSearchQuery] = useState('');
  const searchContainerRef = useRef(null);

  const searchResults = useMemo(() => {
    if (searchQuery.trim().length < 2) return [];
    const query = searchQuery.toLowerCase();
    const searchable = userRole === 'coach' ? students : displayStudents;
    return searchable.filter(s => s.name.toLowerCase().includes(query)).slice(0, 8);
  }, [displayStudents, students, searchQuery, userRole]);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setSearchQuery('');
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);
  const currentClassroom = displayTeams.find(c => c.id === selectedClassroom);

  const handleSchoolChange = (e) => {
    const newSchoolId = e.target.value;
    setSelectedSchool(newSchoolId);
    if (newSchoolId !== 'ALL') {
      const firstClass = displayTeams.find(c => c.schoolId === newSchoolId);
      if (firstClass) setSelectedClassroom(firstClass.id);
    }
  };

  const schoolClassrooms = selectedSchool === 'ALL' ? [] : displayTeams.filter(c => c.schoolId === selectedSchool);
  const currentSchool = displaySchools.find(s => s.id === selectedSchool) || { name: 'All Academies' };

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
    const isPmc = selectedTournament === 'PMC';
    const currentList = isPmc ? pmcStudents : allStudents;
    const maxId = currentList.reduce((m, s) => Math.max(m, Number(s.id) || 0), 0);
    const newId = maxId + 1;
    const newPid = playerInfo.playerId || `PID-${isPmc ? 'PMC' : '2026'}-${String(newId).padStart(5, '0')}`;

    const newPlayer = {
      id: newId,
      playerId: newPid,
      name: playerInfo.name,
      schoolId: playerInfo.schoolId || selectedSchool,
      teamAssignments: { [selectedYear]: selectedClassroom },
      performance: {},
      matchStats: {},
      extracurriculars: [],
      dob: playerInfo.dob || '2008-01-01',
      age: playerInfo.age || 18,
      gender: playerInfo.gender || 'Boy',
      position: playerInfo.position || 'Midfielder',
      preferredFoot: playerInfo.preferredFoot || 'Right',
      jerseyNumber: playerInfo.jerseyNumber != null ? Number(playerInfo.jerseyNumber) : null,
      medicalInfo: playerInfo.medicalInfo || 'None',
      emergencyContact: playerInfo.emergencyContact || 'Team Staff',
      documents: playerInfo.documents || { birthCertificate: true, schoolEnrollment: true },
      status: playerInfo.status || 'approved'
    };

    if (isPmc) {
      setPmcStudents(prev => [...prev, newPlayer]);
    } else {
      setAllStudents(prev => [...prev, newPlayer]);
    }
    return newPlayer;
  };

  const handleImportPlayers = (newPlayersList) => {
    if (!Array.isArray(newPlayersList) || newPlayersList.length === 0) return;
    const isPmc = selectedTournament === 'PMC';

    const enrichPlayer = (p, idx, baseMaxId) => {
      const pId = Number(p.id) || (baseMaxId + idx + 1);
      const pidStr = p.playerId || `PID-${isPmc ? 'PMC' : '2026'}-${String(pId).padStart(5, '0')}`;
      return {
        ...p,
        id: pId,
        playerId: pidStr,
        schoolId: p.schoolId || selectedSchool,
        teamAssignments: p.teamAssignments || { [selectedYear]: selectedClassroom },
        status: p.status || 'approved'
      };
    };

    if (isPmc) {
      setPmcStudents(prev => {
        const baseMax = prev.reduce((m, s) => Math.max(m, Number(s.id) || 0), 0);
        const existingIds = new Set(prev.map(p => String(p.id)));
        const existingPids = new Set(prev.map(p => String(p.playerId)));
        
        const toAdd = newPlayersList.map((p, i) => enrichPlayer(p, i, baseMax))
          .filter(p => !existingIds.has(String(p.id)) && !existingPids.has(String(p.playerId)));
        return [...prev, ...toAdd];
      });
    } else {
      setAllStudents(prev => {
        const baseMax = prev.reduce((m, s) => Math.max(m, Number(s.id) || 0), 0);
        const existingIds = new Set(prev.map(p => String(p.id)));
        const existingPids = new Set(prev.map(p => String(p.playerId)));
        
        const toAdd = newPlayersList.map((p, i) => enrichPlayer(p, i, baseMax))
          .filter(p => !existingIds.has(String(p.id)) && !existingPids.has(String(p.playerId)));
        return [...prev, ...toAdd];
      });
    }
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
    const endFn = prev => {
      const exists = prev.some(m => m.id === matchId);
      const next = exists
        ? prev.map(m => m.id === matchId ? { ...m, ...matchResult, status: 'completed', date: new Date().toISOString() } : m)
        : [...prev, { id: matchId, ...matchResult, status: 'completed', date: new Date().toISOString() }];
      pushMatchesToCloud(next);
      return next;
    };
    setPmcMatches(endFn);
    setMatches(endFn);
  };

  // ── Dynamic Match Update & Standings Propagation ───────────────────
  const handleUpdateMatch = (updatedMatch) => {
    const prevMatch = (pmcMatches || []).find(m => m.id === updatedMatch.id);
    const wasBothReady = !!prevMatch?.homeSquadSelection && !!prevMatch?.awaySquadSelection;
    const isNowBothReady = !!updatedMatch?.homeSquadSelection && !!updatedMatch?.awaySquadSelection;

    if (!wasBothReady && isNowBothReady) {
      const schoolsList = displaySchools || allSchools || [];
      const homeSc = schoolsList.find(s => s.id === updatedMatch.homeTeamId || s.rawId === updatedMatch.homeTeamId);
      const awaySc = schoolsList.find(s => s.id === updatedMatch.awayTeamId || s.rawId === updatedMatch.awayTeamId);
      const homeName = homeSc?.name || updatedMatch.homeTeam || 'Home Team';
      const awayName = awaySc?.name || updatedMatch.awayTeam || 'Away Team';
      try {
        sendRefereeSquadNotification(updatedMatch, homeName, awayName, displayStudents || allStudents);
        sendDataLoggerMatchReadyNotification(updatedMatch, homeName, awayName, displayStudents || allStudents);
      } catch (err) {
        console.warn('Match ready notifications warning:', err);
      }
    }

    const updateFn = prev => {
      const next = prev.map(m => m.id === updatedMatch.id ? { ...m, ...updatedMatch } : m);
      pushMatchesToCloud(next);
      return next;
    };
    setPmcMatches(updateFn);
    setMatches(updateFn);

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
      allTeams={displayTeams}
      allSchools={displaySchools}
      pmcTeams={PMC_TEAMS}
      pmcSchools={PMC_SCHOOLS}
      nsslTeams={TEAMS}
      nsslSchools={SCHOOLS}
      selectedTournament={selectedTournament}
      setSelectedTournament={setSelectedTournament}
      onLogin={(role, coachTeamId, officialProfile, deepLinkedMatchId) => {
        setUserRole(role);
        let activeSchool = selectedSchool;

        if (role === 'referee') {
          const ref = officialProfile || getOfficialsByRole('referee')[0];
          setCurrentReferee(ref);
        } else if (role === 'fourth_official') {
          const fo = officialProfile || getOfficialsByRole('fourth_official')[0];
          setCurrentFourthOfficial(fo);
        } else if (role === 'statistician') {
          const acc = officialProfile || getOfficialsByRole('statistician')[0];
          setCurrentAnalyst(acc);
          if (deepLinkedMatchId) {
            setDirectMatchId(deepLinkedMatchId);
          }
        }

        if (role === 'coach' && coachTeamId) {
          // Coach chose a specific team at login
          const teamObj = displayTeams.find(t => t.id === coachTeamId);
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
        {/* Logo + Brand / Locked Tournament Session Indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            background: selectedTournament === 'PMC' ? 'rgba(0, 38, 127, 0.45)' : 'rgba(37, 99, 235, 0.15)',
            border: selectedTournament === 'PMC' ? '1px solid rgba(255, 199, 38, 0.5)' : '1px solid rgba(37, 99, 235, 0.4)',
            padding: '6px 14px', borderRadius: '12px'
          }}>
            <span style={{
              fontSize: '13px', fontWeight: '800',
              color: selectedTournament === 'PMC' ? '#FFC726' : 'var(--primary-light)'
            }}>
              {selectedTournament === 'PMC' ? "Prime Minister's Cup" : "National Schools League"}
            </span>
            <span style={{
              fontSize: '10px', fontWeight: '700', padding: '2px 8px', borderRadius: '6px',
              background: 'rgba(255,255,255,0.1)', color: 'var(--text-secondary)',
              display: 'flex', alignItems: 'center', gap: '4px'
            }} title="Tournament mode is locked during session. Log out to switch tournaments.">
              Active Session
            </span>
            {selectedTournament === 'PMC' && (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm("Reset PMC fixtures back to official default schedule (Bagatelle, Technique, Kickstart, UWI, Wales, Paradise)?")) {
                    handleResetPmcMatches();
                  }
                }}
                style={{
                  fontSize: '10px', fontWeight: '800', padding: '3px 9px', borderRadius: '6px',
                  background: 'rgba(255, 199, 38, 0.2)', color: '#FFC726',
                  border: '1px solid rgba(255, 199, 38, 0.4)', cursor: 'pointer',
                  marginLeft: '4px'
                }}
                title="Restore default Prime Minister's Cup fixture schedule"
              >
                Reset PMC Schedule
              </button>
            )}
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
              Match Centre
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
        {!['statistician', 'fourth_official', 'referee', 'commissioner'].includes(userRole) && (
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
                 placeholder="Select Academy / Club..."
                 options={[
                   { value: 'ALL', label: 'All Academies / Clubs' },
                   ...displaySchools.map(s => ({ value: s.id, label: s.name }))
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

               <NavSelect value={selectedYear} onChange={e => setSelectedYear(e.target.value)} options={displayYears} />

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
        )}

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
                {adminTabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setAdminTab(tab.id)}
                    style={{
                      padding: '8px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: '700',
                      background: adminTab === tab.id ? (selectedTournament === 'PMC' ? 'rgba(255, 199, 38, 0.18)' : 'rgba(255,255,255,0.08)') : 'transparent',
                      color: adminTab === tab.id ? (selectedTournament === 'PMC' ? '#FFC726' : 'var(--text-primary)') : 'var(--text-secondary)',
                      cursor: 'pointer', transition: 'all 0.2s', border: adminTab === tab.id && selectedTournament === 'PMC' ? '1px solid rgba(255, 199, 38, 0.35)' : 'none', outline: 'none'
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              
              <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
                {adminTab === 'pmc_approvals' && (
                  <CommissionerDashboard
                    matches={displayMatches}
                    schools={displaySchools}
                    allTeams={displayTeams}
                    allStudents={displayStudents}
                    onUpdateMatch={handleUpdateMatch}
                    onAddMatches={handleAddMatches}
                  />
                )}

                {(adminTab === 'registrations' || adminTab === 'club_rosters') && (
                  <SchoolPlayerRegistration
                    allPlayers={displayStudents}
                    onDataUpdate={selectedTournament === 'PMC' ? setPmcStudents : setAllStudents}
                    onImportPlayers={handleImportPlayers}
                    schools={displaySchools}
                    teams={displayTeams}
                    selectedTournament={selectedTournament}
                  />
                )}

                {adminTab === 'competitions' && (
                  <CompetitionAdmin
                    schools={displaySchools}
                    teams={displayTeams}
                    matches={displayMatches}
                    allStudents={displayStudents}
                    year={selectedYear}
                    onUpdateMatch={handleUpdateMatch}
                    onAddMatches={handleAddMatches}
                    selectedTournament={selectedTournament}
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
                  schools={displaySchools}
                  allTeams={displayTeams}
                  onAddTeam={handleAddTeam}
                  onAddPlayer={handleAddPlayer}
                  onImportPlayers={handleImportPlayers}
                  userRole={userRole}
                  matches={displayMatches}
                  allPlayers={displayStudents}
                  onUpdateMatch={handleUpdateMatch}
              />
          )}

          {/* Principal View */}
          {(userRole === 'principal' && selectedClassroom === 'ALL') && (
              <PrincipalDashboard
                  students={students}
                  allStudents={displayStudents}
                  selectedSchool={selectedSchool}
                  year={selectedYear}
                  term={selectedTerm}
              />
          )}

          {/* School Administrator View */}
          {userRole === 'school_admin' && (
              <SchoolAdminDashboard
                  schoolId={selectedSchool}
                  schools={displaySchools}
                  allPlayers={displayStudents}
                  allTeams={displayTeams}
                  matches={displayMatches}
                  onUpdateSchool={handleUpdateSchool}
                  onDataUpdate={setAllStudents}
              />
          )}

          {/* Referee View */}
          {userRole === 'referee' && (
              <RefereeDashboard
                  matches={displayMatches}
                  schools={displaySchools}
                  allPlayers={displayStudents}
                  year={selectedYear}
                  currentReferee={currentReferee}
                  onUpdateMatch={handleUpdateMatch}
                  onLogout={() => {
                      setUserRole(null);
                      setCurrentReferee(null);
                  }}
              />
          )}

          {/* Fourth Official View */}
          {userRole === 'fourth_official' && (
              <FourthOfficialDashboard
                  matches={displayMatches}
                  schools={displaySchools}
                  allPlayers={displayStudents}
                  currentOfficial={currentFourthOfficial}
                  onUpdateMatch={handleUpdateMatch}
                  onLogout={() => {
                      setUserRole(null);
                      setCurrentFourthOfficial(null);
                  }}
              />
          )}

          {/* Match Commissioner View */}
          {userRole === 'commissioner' && (
              <CommissionerDashboard
                  matches={displayMatches}
                  schools={displaySchools}
                  allTeams={displayTeams}
                  onUpdateMatch={handleUpdateMatch}
                  onAddMatches={handleAddMatches}
              />
          )}

          {/* Field Live Data Capturer (Statistician View) */}
          {userRole === 'statistician' && (
              <StatisticianDashboard
                  matches={displayMatches}
                  schools={displaySchools}
                  allPlayers={displayStudents}
                  year={selectedYear}
                  currentAnalyst={currentAnalyst}
                  initialDirectMatchId={directMatchId}
                  onClearDirectMatchId={() => setDirectMatchId(null)}
                  onUpdateMatch={handleUpdateMatch}
                  onEndMatch={handleEndMatch}
                  onLogout={() => {
                      setUserRole(null);
                      setCurrentAnalyst(null);
                      setDirectMatchId(null);
                  }}
              />
          )}

          {/* Analyst Raw Data Sandbox View */}
          {userRole === 'analyst' && (
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
          allStudents={displayStudents}
          year={selectedYear}
          term={selectedTerm}
          matches={displayMatches}
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
