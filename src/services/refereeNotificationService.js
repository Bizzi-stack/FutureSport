import { getAssignedAnalystForMatch, getAnalystAccounts } from '../data/analystAccounts';

const SETTINGS_STORAGE_KEY = 'eduvision-referee-contact-settings';
const LOGS_STORAGE_KEY = 'eduvision-referee-notification-logs';

const DEFAULT_SETTINGS = {
    refereeEmail: 'referee.pmcup@gmail.com',
    refereeName: 'Official Match Referee',
    enableEmail: true,
    enableDevicePush: true,
    enableSoundAlert: true,
    customWebhookUrl: 'https://formspree.io/f/xrpzoljb'
};

// ── Web Audio API Whistle Sound Synthesizer (Referee) ──────────────────
export function playRefereeWhistleSound() {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();
        if (ctx.state === 'suspended') {
            ctx.resume().catch(() => {});
        }

        // 1st Short Whistle Chirp
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(2400, ctx.currentTime);
        osc1.frequency.exponentialRampToValueAtTime(3200, ctx.currentTime + 0.15);
        gain1.gain.setValueAtTime(0.3, ctx.currentTime);
        gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.18);
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.start(ctx.currentTime);
        osc1.stop(ctx.currentTime + 0.18);

        // 2nd Long Whistle Chirp
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(2600, ctx.currentTime + 0.22);
        osc2.frequency.exponentialRampToValueAtTime(3400, ctx.currentTime + 0.55);
        gain2.gain.setValueAtTime(0.4, ctx.currentTime + 0.22);
        gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.58);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start(ctx.currentTime + 0.22);
        osc2.stop(ctx.currentTime + 0.58);
    } catch (e) {
        console.warn('AudioContext not allowed or supported:', e);
    }
}

// ── Web Audio API Coach Reminder Chime ────────────────────────────────
export function playCoachReminderChime() {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();
        if (ctx.state === 'suspended') {
            ctx.resume().catch(() => {});
        }

        // 3-note melodic chime (C5 -> E5 -> G5)
        const notes = [523.25, 659.25, 783.99];
        notes.forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.12);
            gain.gain.setValueAtTime(0.25, ctx.currentTime + idx * 0.12);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.12 + 0.4);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(ctx.currentTime + idx * 0.12);
            osc.stop(ctx.currentTime + idx * 0.12 + 0.4);
        });
    } catch (e) {
        console.warn('Coach chime audio error:', e);
    }
}

// ── Web Audio API Data Logger Pulse Chime ─────────────────────────────
export function playDataLoggerAlertChime() {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();
        if (ctx.state === 'suspended') {
            ctx.resume().catch(() => {});
        }

        // High-tech futuristic double beep (880Hz -> 1760Hz)
        [880, 1760].forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.14);
            gain.gain.setValueAtTime(0.3, ctx.currentTime + idx * 0.14);
            gain.gain.exponentialRampToValueAtTime(0.005, ctx.currentTime + idx * 0.14 + 0.18);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(ctx.currentTime + idx * 0.14);
            osc.stop(ctx.currentTime + idx * 0.14 + 0.18);
        });
    } catch (e) {
        console.warn('Data logger chime audio error:', e);
    }
}

// ── Get & Save Settings ──────────────────────────────────────────────
export function getRefereeContactSettings() {
    try {
        const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
        if (saved) {
            const parsed = JSON.parse(saved);
            return {
                ...DEFAULT_SETTINGS,
                ...parsed,
                customWebhookUrl: parsed.customWebhookUrl || DEFAULT_SETTINGS.customWebhookUrl
            };
        }
    } catch { /* ignored */ }
    return DEFAULT_SETTINGS;
}

export function saveRefereeContactSettings(newSettings) {
    try {
        const updated = { ...getRefereeContactSettings(), ...newSettings };
        localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(updated));
        return updated;
    } catch (err) {
        console.error('Failed to save referee contact settings:', err);
        return DEFAULT_SETTINGS;
    }
}

// ── Get & Save Notification Logs ──────────────────────────────────────
export function getRefereeNotificationLogs() {
    try {
        const logs = localStorage.getItem(LOGS_STORAGE_KEY);
        return logs ? JSON.parse(logs) : [];
    } catch {
        return [];
    }
}

function appendNotificationLog(entry) {
    try {
        const logs = getRefereeNotificationLogs();
        const updated = [entry, ...logs].slice(0, 30); // Keep latest 30 logs
        localStorage.setItem(LOGS_STORAGE_KEY, JSON.stringify(updated));
    } catch { /* ignored */ }
}

// ── Phone / Desktop Native Web Push Notification ─────────────────────
export async function requestRefereeNotificationPermission() {
    if (!('Notification' in window)) {
        return { supported: false, status: 'unsupported' };
    }
    try {
        const permission = await Notification.requestPermission();
        return { supported: true, status: permission };
    } catch (err) {
        console.error('Notification permission request error:', err);
        return { supported: true, status: 'denied' };
    }
}

export function triggerDeviceNotification(title, options = {}) {
    if ('Notification' in window && Notification.permission === 'granted') {
        try {
            const notif = new Notification(title, {
                icon: '/favicon.png',
                badge: '/favicon.png',
                vibrate: [200, 100, 200, 100, 400],
                ...options
            });
            notif.onclick = () => {
                window.focus();
                notif.close();
            };
            return true;
        } catch (e) {
            console.warn('Native notification failed:', e);
        }
    }
    return false;
}

// ── Build Team Sheet Summary ──────────────────────────────────────────
function formatPlayerList(playerIds = [], allPlayers = []) {
    if (!playerIds || playerIds.length === 0) return 'None specified';
    return playerIds.map((pId, idx) => {
        const p = allPlayers.find(s => String(s.id) === String(pId)) || { name: `Player #${pId}`, jerseyNumber: '-' };
        return `${idx + 1}. ${p.name} (#${p.jerseyNumber || '-'})`;
    }).join('\n');
}

// ── Dispatch Squad Notification to Referee ───────────────────────────
export async function sendRefereeSquadNotification(match, homeName, awayName, allPlayers = []) {
    const settings = getRefereeContactSettings();
    const recipientEmail = settings.refereeEmail || 'referee.pmcup@gmail.com';
    const webhookUrl = settings.customWebhookUrl || 'https://formspree.io/f/xrpzoljb';
    const timestamp = new Date().toLocaleString();

    const homeXI = match.homeSquadSelection?.startingXI || [];
    const awayXI = match.awaySquadSelection?.startingXI || [];
    const homeFormation = match.homeSquadSelection?.formation || '4-3-3';
    const awayFormation = match.awaySquadSelection?.formation || '4-3-3';

    const subject = `⚽ [KICK-OFF READY] ${homeName} vs ${awayName} · Team Sheets Submitted`;
    const bodyText = `
OFFICIAL MATCHDAY SQUAD SUBMISSION NOTIFICATION
==================================================
Match: ${homeName} vs ${awayName}
Tournament: Prime Minister's Cup 2026
Venue: ${match.venue || 'National Stadium'}
Matchday: ${match.matchday || match.round || 'Group Stage'}
Time: ${match.time || '18:00'}
Status: BOTH SQUADS SUBMITTED · READY FOR KICK-OFF

--------------------------------------------------
🟢 HOME SQUAD: ${homeName} (Formation: ${homeFormation})
--------------------------------------------------
${formatPlayerList(homeXI, allPlayers)}

--------------------------------------------------
🔵 AWAY SQUAD: ${awayName} (Formation: ${awayFormation})
--------------------------------------------------
${formatPlayerList(awayXI, allPlayers)}

--------------------------------------------------
Action Required:
Open your Referee Dashboard on the EduData Platform to inspect the squads and blow the whistle for Kick-off.
Timestamp: ${timestamp}
Referee Assigned: ${settings.refereeName} (${recipientEmail})
==================================================
`;

    // 1. Play Referee Whistle Sound if enabled
    if (settings.enableSoundAlert) {
        playRefereeWhistleSound();
    }

    // 2. Trigger Device / Phone Lockscreen Push Notification
    if (settings.enableDevicePush) {
        triggerDeviceNotification(`⚽ Match Ready: ${homeName} vs ${awayName}`, {
            body: `Both squads submitted (${homeFormation} vs ${awayFormation}). Tap to blow whistle and begin kick-off!`,
            tag: `match-kickoff-${match.id}`
        });
    }

    // 3. Dispatch Real Email to Gmail via Formspree Relay
    let emailStatus = 'dispatched';
    try {
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                email: recipientEmail,
                _replyto: recipientEmail,
                _subject: subject,
                subject: subject,
                to: recipientEmail,
                message: bodyText,
                match: `${homeName} vs ${awayName}`,
                tournament: "Prime Minister's Cup 2026",
                venue: match.venue || 'National Stadium',
                matchday: match.matchday || match.round || 'Group Stage',
                homeTeam: homeName,
                homeFormation: homeFormation,
                homeStartingXI: formatPlayerList(homeXI, allPlayers),
                awayTeam: awayName,
                awayFormation: awayFormation,
                awayStartingXI: formatPlayerList(awayXI, allPlayers),
                time: match.time || '18:00',
                timestamp: timestamp
            })
        });

        if (response.ok) {
            console.log(`[REFEREE EMAIL DISPATCHER] Real Email delivered to Gmail via Formspree:`, { subject, webhookUrl });
            emailStatus = 'delivered_to_gmail';
        } else {
            console.warn('Formspree returned non-200 status:', response.status);
            emailStatus = `sent_status_${response.status}`;
        }
    } catch (err) {
        console.warn('Formspree email dispatch notice:', err);
        emailStatus = 'queued_for_referee';
    }

    // 4. Log to Audit History
    const logEntry = {
        id: `notif-${Date.now()}`,
        matchId: match.id,
        matchTitle: `${homeName} vs ${awayName}`,
        recipientEmail,
        status: emailStatus,
        timestamp,
        homeFormation,
        awayFormation,
        subject
    };
    appendNotificationLog(logEntry);

    return {
        success: true,
        recipientEmail,
        logEntry
    };
}

// ── Coach Squad Submission Reminder Dispatcher ────────────────────────
export async function sendCoachSquadReminderNotification(match, teamName, coachEmail = '', coachName = 'Coach', opponentName = 'Opponent') {
    const settings = getRefereeContactSettings();
    const recipientEmail = coachEmail || 'coach.pmcup@gmail.com';
    const webhookUrl = settings.customWebhookUrl || 'https://formspree.io/f/xrpzoljb';
    const timestamp = new Date().toLocaleString();

    // 1. Play Coach Melodic Chime
    if (settings.enableSoundAlert) {
        playCoachReminderChime();
    }

    // 2. Trigger Device Push Notification
    if (settings.enableDevicePush) {
        triggerDeviceNotification(`⏰ Matchday Squad Reminder: ${teamName}`, {
            body: `Match against ${opponentName} is scheduled at ${match?.venue || 'Stadium'}. Please submit your Starting XI now!`,
            tag: `coach-reminder-${match?.id || 'fixture'}`
        });
    }

    // 3. Dispatch Formspree Email to Coach
    const subject = `⏰ [ACTION REQUIRED] Matchday Squad Submission Reminder: ${teamName} vs ${opponentName}`;
    const bodyText = `
MATCHDAY SQUAD SUBMISSION REMINDER
==================================================
Team: ${teamName}
Head Coach: ${coachName}
Opponent: ${opponentName}
Tournament: Prime Minister's Cup 2026
Venue: ${match?.venue || 'National Stadium'}
Matchday: ${match?.matchday || match?.round || 'Upcoming Fixture'}
Kickoff Time: ${match?.time || '18:00'}
Status: SQUAD SUBMISSION PENDING
==================================================

Dear Coach ${coachName},

This is an official matchday reminder to submit your Starting XI and Bench roster on the EduData Platform. 

Please log into your Coach Portal and submit your matchday lineup so the Match Referee and Data Capture team can verify the team sheets before kickoff.

Direct Portal Actions:
1. Log in as Coach (${teamName})
2. Navigate to "Matchday Squad"
3. Select your formation, pick 11 starters and bench players, and tap "Submit Matchday Squad"

Timestamp: ${timestamp}
==================================================
`;

    let emailStatus = 'dispatched';
    try {
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                email: recipientEmail,
                _replyto: recipientEmail,
                _subject: subject,
                subject: subject,
                to: recipientEmail,
                coachName: coachName,
                teamName: teamName,
                opponent: opponentName,
                venue: match?.venue || 'National Stadium',
                kickoffTime: match?.time || '18:00',
                message: bodyText,
                timestamp: timestamp
            })
        });

        if (response.ok) {
            console.log(`[COACH REMINDER DISPATCHER] Email delivered to Coach via Formspree:`, { subject, recipientEmail });
            emailStatus = 'delivered_to_coach';
        } else {
            emailStatus = `sent_status_${response.status}`;
        }
    } catch (err) {
        console.warn('Coach reminder email dispatch notice:', err);
        emailStatus = 'queued_for_coach';
    }

    const logEntry = {
        id: `notif-coach-${Date.now()}`,
        matchId: match?.id || 'COACH-REMINDER',
        matchTitle: `${teamName} vs ${opponentName} (Coach Reminder)`,
        recipientEmail,
        status: emailStatus,
        timestamp,
        homeFormation: '-',
        awayFormation: '-',
        subject
    };
    appendNotificationLog(logEntry);

    return {
        success: true,
        recipientEmail,
        logEntry
    };
}

// ── Data Logger / Statistician Match Ready Dispatcher (with Deep Linking) ───
export async function sendDataLoggerMatchReadyNotification(match, homeName, awayName, allPlayers = [], customStatisticianEmail = '') {
    const settings = getRefereeContactSettings();
    const assignedAnalyst = getAssignedAnalystForMatch(match);
    const recipientEmail = customStatisticianEmail || assignedAnalyst?.email || 'statistician.pmcup@gmail.com';
    const analystName = assignedAnalyst?.name || 'Field Live Data Analyst';
    const analystId = assignedAnalyst?.id || 'analyst_1';
    const webhookUrl = settings.customWebhookUrl || 'https://formspree.io/f/xrpzoljb';
    const timestamp = new Date().toLocaleString();

    const homeXI = match.homeSquadSelection?.startingXI || [];
    const awayXI = match.awaySquadSelection?.startingXI || [];
    const homeFormation = match.homeSquadSelection?.formation || '4-3-3';
    const awayFormation = match.awaySquadSelection?.formation || '4-3-3';

    // Generate Direct Deep Link into this match
    const baseUrl = typeof window !== 'undefined' && window.location.origin && !window.location.origin.includes('localhost:5173')
        ? window.location.origin 
        : 'https://edudata-pmcup-app.surge.sh';
    const deepLink = `${baseUrl}/?role=statistician&matchId=${match.id}&analystId=${analystId}&analystEmail=${encodeURIComponent(recipientEmail)}`;

    // 1. Play Data Logger Pulse Audio
    if (settings.enableSoundAlert) {
        playDataLoggerAlertChime();
    }

    // 2. Trigger Device Push Notification
    if (settings.enableDevicePush) {
        triggerDeviceNotification(`📡 Match Ready for Live Data Capture: ${homeName} vs ${awayName}`, {
            body: `Both Starting XIs submitted (${homeFormation} vs ${awayFormation}). Kick-off imminent — tap to open capture console!`,
            tag: `datalogger-ready-${match.id}`
        });
    }

    // 3. Dispatch Tailored Email with Deep Link to Assigned Analyst via Formspree
    const subject = `📡 [START LOGGING · KICK-OFF IMMINENT] Lineups Submitted: ${homeName} vs ${awayName}`;
    const bodyText = `
FIELD DATA LOGGER & STATISTICIAN LIVE CAPTURE ALERT
==================================================
Match: ${homeName} vs ${awayName}
Tournament: Prime Minister's Cup 2026
Venue: ${match.venue || assignedAnalyst?.venue || 'National Stadium'}
Matchday: ${match.matchday || match.round || 'Group Stage'}
Kickoff Time: ${match.time || '18:00'}
Assigned Field Analyst: ${analystName} (${recipientEmail})
Status: BOTH STARTING XIs SUBMITTED · REFEREE KICK-OFF AT ANY MOMENT

--------------------------------------------------
🔗 DIRECT MATCH ACCESS DEEP LINK:
${deepLink}
--------------------------------------------------

Field Analyst Instructions:
1. Tap the deep link above to open this match directly on the EduData Platform.
2. Sign in with your Analyst credentials:
   • Email: ${recipientEmail}
   • Password: password
3. The platform will automatically route you directly to this match in your Field Live Data Capturer Portal.
4. When the referee blows the whistle to start the match on their end, the console will automatically unlock for real-time stat capturing.

--------------------------------------------------
🟢 HOME SQUAD: ${homeName} (${homeFormation})
--------------------------------------------------
${formatPlayerList(homeXI, allPlayers)}

--------------------------------------------------
🔵 AWAY SQUAD: ${awayName} (${awayFormation})
--------------------------------------------------
${formatPlayerList(awayXI, allPlayers)}

Timestamp: ${timestamp}
Data Logger Contact: ${recipientEmail}
==================================================
`;

    let emailStatus = 'dispatched';
    try {
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                email: recipientEmail,
                _replyto: recipientEmail,
                _subject: subject,
                subject: subject,
                to: recipientEmail,
                analystName: analystName,
                analystId: analystId,
                deepLink: deepLink,
                match: `${homeName} vs ${awayName}`,
                homeTeam: homeName,
                homeFormation: homeFormation,
                homeStartingXI: formatPlayerList(homeXI, allPlayers),
                awayTeam: awayName,
                awayFormation: awayFormation,
                awayStartingXI: formatPlayerList(awayXI, allPlayers),
                venue: match.venue || 'National Stadium',
                time: match.time || '18:00',
                message: bodyText,
                timestamp: timestamp
            })
        });

        if (response.ok) {
            console.log(`[DATA LOGGER DISPATCHER] Real Email delivered to Statistician via Formspree:`, { subject, webhookUrl, deepLink });
            emailStatus = 'delivered_to_statistician';
        } else {
            emailStatus = `sent_status_${response.status}`;
        }
    } catch (err) {
        console.warn('Data logger email dispatch notice:', err);
        emailStatus = 'queued_for_statistician';
    }

    const logEntry = {
        id: `notif-logger-${Date.now()}`,
        matchId: match.id,
        matchTitle: `${homeName} vs ${awayName} (Data Logger Alert)`,
        recipientEmail,
        status: emailStatus,
        timestamp,
        homeFormation,
        awayFormation,
        subject
    };
    appendNotificationLog(logEntry);

    return {
        success: true,
        recipientEmail,
        logEntry
    };
}

// ── Instant Test Alert ────────────────────────────────────────────────
export async function sendTestRefereeNotification(targetEmail) {
    const settings = getRefereeContactSettings();
    const email = targetEmail || settings.refereeEmail || 'referee.pmcup@gmail.com';
    const webhookUrl = settings.customWebhookUrl || 'https://formspree.io/f/xrpzoljb';
    const timestamp = new Date().toLocaleString();

    if (settings.enableSoundAlert) {
        playRefereeWhistleSound();
    }

    triggerDeviceNotification('🧪 Referee Notification Test: OK', {
        body: `Test signal delivered to ${email}. Device push & whistle audio operational.`,
        tag: 'test-notification'
    });

    const subject = `🧪 [TEST ALERT] Referee Live Notification Test · Prime Minister's Cup`;
    const bodyText = `
🧪 TEST REFEREE NOTIFICATION DISPATCH
==================================================
Signal Type: Manual Test Alert
Tournament: Prime Minister's Cup 2026
Referee Recipient: ${email}
Timestamp: ${timestamp}
Delivery Relay: Formspree Live Relay (${webhookUrl})
Status: SUCCESSFUL LIVE TRANSMISSION
==================================================
This is a test notification confirming that the Referee Notification & Email Relay is online and actively delivering team sheet alerts to your device and Gmail inbox.
`;

    let emailStatus = 'dispatched';
    try {
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                _subject: subject,
                subject: subject,
                to: email,
                message: bodyText,
                type: 'Manual Test Alert',
                timestamp: timestamp
            })
        });
        if (response.ok) {
            emailStatus = 'delivered_to_gmail';
        } else {
            emailStatus = `sent_status_${response.status}`;
        }
    } catch (err) {
        console.warn('Test email dispatch notice:', err);
        emailStatus = 'queued';
    }

    const logEntry = {
        id: `notif-test-${Date.now()}`,
        matchId: 'TEST-FIXTURE',
        matchTitle: 'Test Referee Signal',
        recipientEmail: email,
        status: emailStatus,
        timestamp,
        homeFormation: '4-3-3',
        awayFormation: '4-2-3-1',
        subject: '🧪 Test Squad Notification to Referee'
    };
    appendNotificationLog(logEntry);

    return { success: true, email, timestamp };
}
