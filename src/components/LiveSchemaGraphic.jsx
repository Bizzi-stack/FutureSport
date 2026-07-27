import React from 'react';
import './LiveSchemaGraphic.css';

const LiveSchemaGraphic = () => {
    return (
        <div className="live-schema-container">
            {/* SVG Connecting Lines between floaters */}
            <svg className="schema-lines" viewBox="0 0 800 800" fill="none">
                <path d="M 280 180 C 400 180, 400 280, 520 280" stroke="rgba(129, 140, 248, 0.3)" strokeWidth="2" strokeDasharray="4 4" />
                <path d="M 280 430 C 400 430, 400 280, 520 280" stroke="rgba(168, 85, 247, 0.3)" strokeWidth="2" strokeDasharray="4 4" />
                <path d="M 520 280 C 600 280, 600 500, 680 500" stroke="rgba(56, 189, 248, 0.3)" strokeWidth="2" />
                
                {/* Glowing dots at intersections */}
                <circle cx="280" cy="180" r="4" fill="#818cf8" />
                <circle cx="280" cy="430" r="4" fill="#a855f7" />
                <circle cx="520" cy="280" r="4" fill="#6366f1" />
                <circle cx="680" cy="500" r="4" fill="#38bdf8" />
            </svg>

            {/* floating table 1: Players */}
            <div className="schema-panel panel-students" style={{ animationDelay: '0s' }}>
                <div className="panel-header">
                   <div className="panel-icon student-icon"></div>
                   <span>players</span>
                   <div className="panel-badge">1,240 rows</div>
                </div>
                <div className="panel-body">
                    <div className="db-row"><span className="col-name">id</span> <span className="col-type">uuid [pk]</span></div>
                    <div className="db-row"><span className="col-name">first_name</span> <span className="col-type">varchar(50)</span></div>
                    <div className="db-row"><span className="col-name">last_name</span> <span className="col-type">varchar(50)</span></div>
                    <div className="db-row"><span className="col-name">enrollment_date</span> <span className="col-type">timestamp</span></div>
                    <div className="db-row"><span className="col-name">risk_level</span> <span className="col-type">enum</span></div>
                </div>
            </div>

            {/* floating table 2: Squads */}
            <div className="schema-panel panel-classes" style={{ animationDelay: '1.2s' }}>
                <div className="panel-header">
                   <div className="panel-icon class-icon"></div>
                   <span>squads</span>
                </div>
                <div className="panel-body">
                    <div className="db-row"><span className="col-name">id</span> <span className="col-type">uuid [pk]</span></div>
                    <div className="db-row"><span className="col-name">grade_level</span> <span className="col-type">int</span></div>
                    <div className="db-row"><span className="col-name">homeroom</span> <span className="col-type">varchar(10)</span></div>
                </div>
            </div>

            {/* floating table 3: Assessments */}
            <div className="schema-panel panel-assessments" style={{ animationDelay: '0.6s' }}>
                <div className="panel-header">
                   <div className="panel-icon assess-icon"></div>
                   <span>assessments</span>
                   <div className="panel-badge highlight">Active Sync</div>
                </div>
                <div className="panel-body">
                    <div className="db-row"><span className="col-name">id</span> <span className="col-type">uuid [pk]</span></div>
                    <div className="db-row active"><span className="col-name">player_id</span> <span className="col-type">uuid [ref: &gt; players.id]</span></div>
                    <div className="db-row"><span className="col-name">squad_id</span> <span className="col-type">uuid [ref: &gt; squads.id]</span></div>
                    <div className="db-row"><span className="col-name">matchday</span> <span className="col-type">varchar(20)</span></div>
                    <div className="db-row"><span className="col-name">score_percentage</span> <span className="col-type">decimal</span></div>
                </div>
            </div>

            {/* Source code block */}
            <div className="schema-code-block" style={{ animationDelay: '1.8s' }}>
                <div className="code-header">
                     <div className="mac-dots"><span></span><span></span><span></span></div>
                    <span>query_aggregation.sql</span>
                </div>
                <pre>
                    <code>
                        <span className="kw">SELECT</span> c.homeroom, <span className="fn">AVG</span>(a.score_percentage) <span className="kw">AS</span> squad_avg<br/>
                        <span className="kw">FROM</span> assessments a <br/>
                        <span className="kw">JOIN</span> squads c <span className="kw">ON</span> a.squad_id = c.id<br/>
                        <span className="kw">WHERE</span> a.matchday = <span className="str">'Matchday 1'</span><br/>
                        <span className="kw">GROUP BY</span> c.homeroom<br/>
                        <span className="kw">ORDER BY</span> squad_avg <span className="kw">DESC</span>;
                    </code>
                </pre>
            </div>
            
            {/* Ambient decorative glowing rings */}
            <div className="schema-ring ring-1"></div>
            <div className="schema-ring ring-2"></div>
        </div>
    );
};

export default LiveSchemaGraphic;
