const fs = require('fs');

// Map section header titles to glossary keys
const mappings = {
    // OverviewTab
    'OverviewTab.jsx': {
        'Macro Trajectory': 'macro-trajectory',
        'Multi-Factor Risk Distribution': 'risk-distribution',
    },
    // InterschoolTab
    'InterschoolTab.jsx': {
        'National Performance Trajectory': 'national-trajectory',
        'Subject Strength Map': 'subject-heatmap',
        'Behavioral Health Profile': 'behavior-radar',
        'National Grade Distribution': 'grade-distribution',
        'CSEC Readiness & Risk Landscape': 'csec-risk',
    },
    // FactorScoreTab
    'FactorScoreTab.jsx': {
        'Quantified Student Profiles': 'factor-score',
        'Factor Model Breakdown': 'factor-score',
        'Cohort Factor Distribution': 'factor-score',
    },
    // DrawdownTab
    'DrawdownTab.jsx': {
        'Deepest Active Drawdowns': 'drawdown',
        'Recent Recoveries': 'drawdown',
    },
    // ClusterTab
    'ClusterTab.jsx': {
        '2D Factor Space Cluster Map': 'cluster',
        'Cluster Intelligence & Composition': 'cluster',
    },
    // ElasticityTab
    'ElasticityTab.jsx': {
        'Most Vulnerable (High Elasticity)': 'elasticity',
        'Most Resilient (Low Elasticity)': 'elasticity',
    },
    // MomentumTab
    'MomentumTab.jsx': {
        'Top Accelerators': 'momentum',
        'Top Decelerators': 'momentum',
        'AMF by Form Group': 'momentum',
    },
    // SubjectMomentumTab
    'SubjectMomentumTab.jsx': {
        'Cohort Selection': 'subject-momentum',
    },
    // SimulationTab
    'SimulationTab.jsx': {
        'Monte Carlo Forecast': 'simulation',
    },
    // ZScoreTab
    'ZScoreTab.jsx': {
        'Exceptional Outliers': 'zscore',
        'Critical Underperformers': 'zscore',
    },
    // CsecReadinessTab
    'CsecReadinessTab.jsx': {
        'Readiness Risk Matrix': 'csec',
        'Early Sit Candidates (Form 3 & 4)': 'csec',
    },
    // TrendsTab
    'TrendsTab.jsx': {
        'Performance Momentum': 'trends',
        'Most Improved': 'trends',
        'Steepest Decline': 'trends',
        'Plateaued (High Performers)': 'trends',
    },
    // CompareAndStemTab
    'CompareAndStemTab.jsx': {
        'Subject Profile (Radar)': 'class-compare',
        'Subject-by-Subject Comparison': 'class-compare',
        'STEM Score vs Overall Average': 'stem',
        'STEM Subject Averages': 'stem',
        'Top STEM Students': 'stem',
    },
    // CorrelationExplorerTab
    'CorrelationExplorerTab.jsx': {
        'Notable Outliers': 'correlation',
    },
};

const dir = 'src/components/hub';

for (const [file, titleMap] of Object.entries(mappings)) {
    const path = dir + '/' + file;
    let content = fs.readFileSync(path, 'utf8');
    let changed = false;
    
    for (const [title, key] of Object.entries(titleMap)) {
        // Match SectionHeader with this exact title (handling both quote styles and template literals)
        const escaped = title.replace(/[.*+?^${}()|[\]\\&]/g, '\\$&');
        
        // Pattern: SectionHeader title="Title" without existing infoKey
        const regex = new RegExp(
            `(<SectionHeader\\s+title=["'\`]${escaped}["'\`])(?!\\s+infoKey)`,
            'g'
        );
        const replacement = `$1 infoKey="${key}"`;
        const newContent = content.replace(regex, replacement);
        if (newContent !== content) {
            content = newContent;
            changed = true;
            console.log(`  ${file}: added infoKey="${key}" to "${title}"`);
        }
    }
    
    if (changed) {
        fs.writeFileSync(path, content);
        console.log(`✓ Patched ${file}`);
    }
}

console.log('\nDone!');
