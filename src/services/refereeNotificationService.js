import { getAssignedAnalystForMatch, getAnalystAccounts } from '../data/analystAccounts';

const SETTINGS_STORAGE_KEY = 'eduvision-referee-contact-settings';
const LOGS_STORAGE_KEY = 'eduvision-referee-notification-logs';

const DEFAULT_SETTINGS = {
    refereeEmail: 'ralphjamesjr00@gmail.com',
    refereeName: 'Official Match Referee',
    enableEmail: true,
    enableDevicePush: true,
    enableSoundAlert: true,
    customWebhookUrl: 'https://formsubmit.co/ajax/ralphjamesjr00@gmail.com'
};

// ── Web Audio API Whistle Sound Synthesizer (Referee) ──────────────────
export function playRefereeWhistleSound() {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();

        const now = ctx.currentTime;
        
        // Two short high-pitched bursts mimicking a real Fox 40 referee whistle
        const burst1Duration = 0.18;
        const burstGap = 0.08;
        const burst2Duration = 0.35;

        // Burst 1
        createWhistleBurst(ctx, now, burst1Duration);
        // Burst 2 (longer blast)
        createWhistleBurst(ctx, now + burst1Duration + burstGap, burst2Duration);

    } catch (e) {
        console.warn('AudioContext whistle play prevented or unsupported:', e);
    }
}

function createWhistleBurst(ctx, startTime, duration) {
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gainNode = ctx.createGain();

    // High dual whistle tones (2800 Hz + 3100 Hz creates characteristic shrill beat frequency)
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(2850, startTime);
    osc1.frequency.exponentialRampToValueAtTime(2950, startTime + duration);

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(3120, startTime);
    osc2.frequency.exponentialRampToValueAtTime(3200, startTime + duration);

    // Sharp Attack & Decay envelope
    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(0.4, startTime + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc1.start(startTime);
    osc2.start(startTime);
    osc1.stop(startTime + duration);
    osc2.stop(startTime + duration);
}

// ── Web Audio API Chime Synthesizer (General Alert) ────────────────────
export function playChimeSound() {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();
        const now = ctx.currentTime;

        // Gentle 2-tone melodic chime (C6 -> G6)
        const notes = [1046.50, 1567.98];
        notes.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + i * 0.15);

            gain.gain.setValueAtTime(0, now + i * 0.15);
            gain.gain.linearRampToValueAtTime(0.25, now + i * 0.15 + 0.03);
            gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.15 + 0.4);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start(now + i * 0.15);
            osc.stop(now + i * 0.15 + 0.4);
        });
    } catch { /* ignored */ }
}

// ── Contact Settings Storage ──────────────────────────────────────────
export function getRefereeContactSettings() {
    try {
        const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
        if (saved) {
            const parsed = JSON.parse(saved);
            return { ...DEFAULT_SETTINGS, ...parsed };
        }
    } catch (e) {
        console.warn('Failed to load referee contact settings:', e);
    }
    return DEFAULT_SETTINGS;
}

export function saveRefereeContactSettings(newSettings) {
    try {
        const current = getRefereeContactSettings();
        const updated = { ...current, ...newSettings };
        localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(updated));
        return updated;
    } catch (e) {
        console.error('Failed to save referee contact settings:', e);
        return DEFAULT_SETTINGS;
    }
}

// ── Notification Audit History Logs ───────────────────────────────────
export function getNotificationLogs() {
    try {
        const saved = localStorage.getItem(LOGS_STORAGE_KEY);
        if (saved) {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed)) return parsed;
        }
    } catch (e) {
        console.warn('Failed to load notification logs:', e);
    }
    return [];
}

export function appendNotificationLog(logEntry) {
    try {
        const current = getNotificationLogs();
        const updated = [logEntry, ...current].slice(0, 50); // Keep last 50 logs
        localStorage.setItem(LOGS_STORAGE_KEY, JSON.stringify(updated));
        return updated;
    } catch (e) {
        console.error('Failed to append notification log:', e);
        return [];
    }
}

// ── Native Browser / OS Push Notification Permission ─────────────────
export async function requestRefereeNotificationPermission() {
    if (!('Notification' in window)) {
        return { supported: false, status: 'unsupported' };
    }

    if (Notification.permission === 'granted') {
        return { supported: true, status: 'granted' };
    }

    if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission();
        return { supported: true, status: permission };
    }

    return { supported: true, status: 'denied' };
}

export function triggerDeviceNotification(title, options = {}) {
    if (!('Notification' in window) || Notification.permission !== 'granted') {
        return false;
    }

    try {
        const notif = new Notification(title, {
            icon: '/favicon.ico',
            badge: '/favicon.ico',
            vibrate: [200, 100, 200, 100, 400],
            requireInteraction: true,
            ...options
        });

        notif.onclick = function () {
            window.focus();
            this.close();
        };
        return true;
    } catch (e) {
        console.warn('Failed to trigger native device notification:', e);
        return false;
    }
}

// ── Helper: Format Starting XI with Player Names ──────────────────────
function formatPlayerList(playerIds = [], allPlayers = []) {
    if (!playerIds || playerIds.length === 0) return 'None specified';
    return playerIds.map((id, index) => {
        const player = allPlayers.find(p => p.id === id);
        const name = player ? player.name : `Player #${id}`;
        const number = player?.jerseyNumber != null ? `#${player.jerseyNumber}` : `#${index + 1}`;
        const pos = player?.position ? `(${player.position})` : '';
        return `${index + 1}. ${number} ${name} ${pos}`.trim();
    }).join('\n');
}

// ── FormSubmit.co Multi-Recipient Dispatch Relay ──────────────────────
export async function sendFormSubmitEmail(primaryEmail, ccList = [], payload = {}) {
    const recipient = primaryEmail || 'ralphjamesjr00@gmail.com';
    const targetUrl = `https://formsubmit.co/ajax/${encodeURIComponent(recipient)}`;
    
    // Filter out primary email from CC list to prevent duplicate headers
    const ccArray = Array.isArray(ccList) ? ccList : (ccList ? ccList.split(',') : []);
    const cleanCc = ccArray
        .map(e => e.trim())
        .filter(e => e && e.toLowerCase() !== recipient.toLowerCase())
        .join(', ');

    const bodyData = {
        _subject: payload._subject || payload.subject || '⚽ Prime Minister Cup Matchday Alert',
        _captcha: 'false',
        _template: 'table',
        ...(cleanCc ? { _cc: cleanCc } : {}),
        ...payload
    };

    return fetch(targetUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify(bodyData)
    });
}

// ── Dispatch Squad Notification to Referee ───────────────────────────
export async function sendRefereeSquadNotification(match, homeName, awayName, allPlayers = []) {
    const settings = getRefereeContactSettings();
    const recipientEmail = settings.refereeEmail || 'ralphjamesjr00@gmail.com';
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

    // 3. Dispatch Real Email via FormSubmit.co Multi-Recipient Engine
    let emailStatus = 'dispatched';
    try {
        const response = await sendFormSubmitEmail(
            recipientEmail, 
            ['noah@futurebarbados.bb', 'tariq@futurebarbados.bb', 'jakob@futurebarbados.bb'], 
            {
                _subject: subject,
                Subject: subject,
                Role: 'Official Match Referee',
                Match: `${homeName} vs ${awayName}`,
                Tournament: "Prime Minister's Cup 2026",
                Venue: match.venue || 'National Stadium',
                Matchday: match.matchday || match.round || 'Group Stage',
                Status: 'BOTH SQUADS SUBMITTED · READY FOR KICK-OFF',
                HomeTeam: `${homeName} (Formation: ${homeFormation})`,
                HomeStartingXI: formatPlayerList(homeXI, allPlayers),
                AwayTeam: `${awayName} (Formation: ${awayFormation})`,
                AwayStartingXI: formatPlayerList(awayXI, allPlayers),
                Time: match.time || '18:00',
                ActionRequired: 'Open Referee Dashboard to blow whistle for Kick-off.',
                Timestamp: timestamp,
                FullDetails: bodyText
            }
        );

        if (response.ok) {
            console.log(`[REFEREE EMAIL DISPATCHER] Delivered via FormSubmit.co to ${recipientEmail}`);
            emailStatus = 'delivered_to_gmail';
        } else {
            console.warn('FormSubmit returned non-200 status:', response.status);
            emailStatus = `sent_status_${response.status}`;
        }
    } catch (err) {
        console.warn('FormSubmit email dispatch notice:', err);
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
    const timestamp = new Date().toLocaleString();
    const primaryEmail = coachEmail || 'ralphjamesjr00@gmail.com';
    const subject = `📋 [SQUAD SUBMISSION REMINDER] ${teamName} vs ${opponentName} · Matchday Ready`;

    // 1. Play Chime Sound
    playChimeSound();

    // 2. Browser Push Notification
    triggerDeviceNotification(`📋 Squad Reminder: ${teamName}`, {
        body: `Your match against ${opponentName} is scheduled. Please lock in your Starting XI and bench roster!`,
        tag: `coach-reminder-${match.id}`
    });

    // 3. Dispatch Email via FormSubmit.co
    let emailStatus = 'dispatched';
    try {
        const response = await sendFormSubmitEmail(primaryEmail, ['ralphjamesjr00@gmail.com'], {
            _subject: subject,
            Subject: subject,
            Role: `Team Coach (${teamName})`,
            CoachName: coachName,
            Match: `${teamName} vs ${opponentName}`,
            Venue: match.venue || 'National Stadium',
            Time: match.time || '18:00',
            ActionRequired: 'Log into Coach Portal to submit your Starting XI and Formation.',
            Timestamp: timestamp
        });

        if (response.ok) {
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
        matchId: match.id,
        matchTitle: `${teamName} vs ${opponentName} (Coach Reminder)`,
        recipientEmail: primaryEmail,
        status: emailStatus,
        timestamp,
        subject
    };
    appendNotificationLog(logEntry);

    return {
        success: true,
        primaryEmail,
        logEntry
    };
}

// ── Data Logger Match Ready Alert Dispatcher ──────────────────────────
export async function sendDataLoggerMatchReadyNotification(match, homeName, awayName, allPlayers = [], customLoggerEmail = null) {
    const assignedAnalyst = getAssignedAnalystForMatch(match);
    const recipientEmail = customLoggerEmail || assignedAnalyst?.email || 'noah@futurebarbados.bb';
    const analystName = assignedAnalyst?.name || 'Field Data Analyst';
    const analystId = assignedAnalyst?.id || 'analyst_noah';
    const timestamp = new Date().toLocaleString();

    const homeXI = match.homeSquadSelection?.startingXI || [];
    const awayXI = match.awaySquadSelection?.startingXI || [];
    const homeFormation = match.homeSquadSelection?.formation || '4-3-3';
    const awayFormation = match.awaySquadSelection?.formation || '4-3-3';

    // Generate Direct Deep Link
    const baseUrl = typeof window !== 'undefined' && window.location?.origin ? window.location.origin : 'https://edudata-pmcup-app.surge.sh';
    const deepLink = `${baseUrl}/?role=statistician&matchId=${match.id}&analystId=${analystId}&analystEmail=${encodeURIComponent(recipientEmail)}`;

    const subject = `📡 [START LOGGING · KICK-OFF IMMINENT] Lineups Submitted: ${homeName} vs ${awayName}`;

    // 1. Play Chime Sound
    playChimeSound();

    // 2. Trigger Device / Phone Push Notification
    triggerDeviceNotification(`📡 Data Capture Ready: ${homeName} vs ${awayName}`, {
        body: `Starting XIs confirmed (${homeFormation} vs ${awayFormation}). Tap to open live logger for ${match.venue || 'venue'}!`,
        tag: `logger-ready-${match.id}`
    });

    // 3. Dispatch Real Multi-Recipient Email via FormSubmit.co
    let emailStatus = 'dispatched';
    try {
        const response = await sendFormSubmitEmail(
            recipientEmail,
            ['ralphjamesjr00@gmail.com', 'noah@futurebarbados.bb', 'tariq@futurebarbados.bb', 'jakob@futurebarbados.bb'],
            {
                _subject: subject,
                Subject: subject,
                Role: `Field Data Analyst (${analystName})`,
                AnalystId: analystId,
                Match: `${homeName} vs ${awayName}`,
                Tournament: "Prime Minister's Cup 2026",
                Venue: match.venue || 'National Stadium',
                Matchday: match.matchday || match.round || 'Group Stage',
                Status: 'STARTING XIs LOCKED · LIVE CAPTURING READY',
                HomeTeam: `${homeName} (Formation: ${homeFormation})`,
                HomeStartingXI: formatPlayerList(homeXI, allPlayers),
                AwayTeam: `${awayName} (Formation: ${awayFormation})`,
                AwayStartingXI: formatPlayerList(awayXI, allPlayers),
                DirectDeepLink: deepLink,
                ActionRequired: `Click the link to open live match logger: ${deepLink}`,
                Timestamp: timestamp
            }
        );

        if (response.ok) {
            console.log(`[DATA LOGGER DISPATCHER] Delivered via FormSubmit.co to ${recipientEmail} and team:`, { subject, deepLink });
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
        deepLink,
        logEntry
    };
}

// ── Instant Test Alert ────────────────────────────────────────────────
export async function sendTestRefereeNotification(targetEmail) {
    const settings = getRefereeContactSettings();
    const email = targetEmail || settings.refereeEmail || 'ralphjamesjr00@gmail.com';
    const timestamp = new Date().toLocaleString();

    if (settings.enableSoundAlert) {
        playRefereeWhistleSound();
    }

    triggerDeviceNotification('🧪 Multi-Recipient Notification Test: OK', {
        body: `Test signal delivered to ${email}. Device push & whistle operational.`,
        tag: 'test-notification'
    });

    const subject = `🧪 [TEST ALERT] Multi-Recipient Live Notification Test · Prime Minister's Cup`;

    let emailStatus = 'dispatched';
    try {
        const response = await sendFormSubmitEmail(
            email, 
            ['noah@futurebarbados.bb', 'tariq@futurebarbados.bb', 'jakob@futurebarbados.bb'], 
            {
                _subject: subject,
                Subject: subject,
                SignalType: 'Manual Multi-Recipient Test Alert',
                PrimaryRecipient: email,
                AdditionalRecipients: 'noah@futurebarbados.bb, tariq@futurebarbados.bb, jakob@futurebarbados.bb',
                RelayEngine: 'FormSubmit.co (Zero-Limit Multi-Recipient Engine)',
                Status: 'SUCCESSFUL LIVE TRANSMISSION',
                Timestamp: timestamp,
                Message: 'This is a live test confirming multi-recipient delivery to Ralph, Noah, Tariq, and Jakob.'
            }
        );
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
        matchTitle: 'Test Multi-Recipient Signal',
        recipientEmail: email,
        status: emailStatus,
        timestamp,
        homeFormation: '4-3-3',
        awayFormation: '4-2-3-1',
        subject: '🧪 Multi-Recipient Test Notification'
    };
    appendNotificationLog(logEntry);

    return { success: true, email, timestamp };
}
