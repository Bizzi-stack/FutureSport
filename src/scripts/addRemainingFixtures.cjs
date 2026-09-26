const fs = require('fs');
const path = require('path');
const https = require('https');

const initialMatchesPath = path.join(__dirname, '../data/pmcInitialMatches.json');
const initialMatches = JSON.parse(fs.readFileSync(initialMatchesPath, 'utf8'));

const { PMC_SCHOOLS } = require('../utils/pmcDataLoader.js');

const rawFixtures = [
  { no: 13, day: 'Sat, Sept 26', home: 'Pro-Shottas', away: 'Technique FC', grp: 'C', venue: 'Checker Hall', time: '19:00', date: '2026-09-26T23:00:00.000Z' },
  { no: 14, day: 'Sat, Sept 26', home: 'L&R United', away: 'Paradise', grp: 'C', venue: 'Checker Hall', time: '21:00', date: '2026-09-27T01:00:00.000Z' },
  { no: 15, day: 'Sun, Sept 27', home: 'Cave Hill', away: 'Notre Dame', grp: 'E', venue: 'Checker Hall', time: '19:00', date: '2026-09-27T23:00:00.000Z' },
  { no: 16, day: 'Sun, Sept 27', home: 'Bagatelle', away: 'Wales', grp: 'E', venue: 'Checker Hall', time: '21:00', date: '2026-09-28T01:00:00.000Z' },
  { no: 17, day: 'Tue, Sept 29', home: 'Kickstart', away: 'Black Spurs', grp: 'A', venue: 'Speightstown', time: '19:00', date: '2026-09-29T23:00:00.000Z' },
  { no: 18, day: 'Tue, Sept 29', home: 'Empire', away: 'Parish Land', grp: 'A', venue: 'Speightstown', time: '21:00', date: '2026-09-30T01:00:00.000Z' },
  { no: 19, day: 'Thu, Oct 1', home: 'St Andrew Lions', away: 'Ivy Rovers', grp: 'B', venue: "Hoyte's Village", time: '19:00', date: '2026-10-01T23:00:00.000Z' },
  { no: 20, day: 'Thu, Oct 1', home: 'Brittons Hill', away: 'Pinelands', grp: 'B', venue: "Hoyte's Village", time: '21:00', date: '2026-10-02T01:00:00.000Z' },
  { no: 21, day: 'Sat, Oct 3', home: 'Chickmont', away: 'Wotton', grp: 'D', venue: 'Friendship', time: '19:00', date: '2026-10-03T23:00:00.000Z' },
  { no: 22, day: 'Sat, Oct 3', home: 'Deacons', away: 'Ellerton', grp: 'D', venue: 'Friendship', time: '21:00', date: '2026-10-04T01:00:00.000Z' },
  { no: 23, day: 'Sun, Oct 4', home: 'White Hall', away: 'UWI Black Birds', grp: 'F', venue: 'Speightstown', time: '19:00', date: '2026-10-04T23:00:00.000Z' },
  { no: 24, day: 'Sun, Oct 4', home: 'Atlas United', away: 'Pride of Gall Hill', grp: 'F', venue: 'Speightstown', time: '21:00', date: '2026-10-05T01:00:00.000Z' },
  { no: 25, day: 'Sat, Oct 10', home: 'L&R United', away: 'Pro Shottas', grp: 'C', venue: 'Speightstown', time: '17:00', date: '2026-10-10T21:00:00.000Z' },
  { no: 26, day: 'Sat, Oct 10', home: 'Paradise', away: 'Technique', grp: 'C', venue: 'Speightstown', time: '21:00', date: '2026-10-11T01:00:00.000Z' },
  { no: 27, day: 'Sun, Oct 11', home: 'Notre Dame', away: 'Bagatelle', grp: 'E', venue: 'Speightstown', time: '16:00', date: '2026-10-11T20:00:00.000Z' },
  { no: 28, day: 'Sun, Oct 11', home: 'Cave Hill', away: 'Wales', grp: 'E', venue: 'Speightstown', time: '20:00', date: '2026-10-12T00:00:00.000Z' },
  { no: 29, day: 'Tue, Oct 13', home: 'Parish Land', away: 'Black Spurs', grp: 'A', venue: 'Glebe', time: '21:00', date: '2026-10-14T01:00:00.000Z' },
  { no: 30, day: 'Thu, Oct 15', home: 'Kickstart', away: 'Empire', grp: 'A', venue: 'Briar Hall', time: '21:00', date: '2026-10-16T01:00:00.000Z' },
  { no: 31, day: 'Sat, Oct 17', home: 'Pinelands', away: 'St Andrew Lions', grp: 'B', venue: 'Orange Hill', time: '21:00', date: '2026-10-18T01:00:00.000Z' },
  { no: 32, day: 'Sun, Oct 18', home: 'Ivy Rovers', away: 'Brittons Hill', grp: 'B', venue: 'Friendship', time: '21:00', date: '2026-10-19T01:00:00.000Z' },
  { no: 33, day: 'Tue, Oct 20', home: 'Ellerton', away: 'Chickmont', grp: 'D', venue: "Hoyte's Village", time: '21:00', date: '2026-10-21T01:00:00.000Z' },
  { no: 34, day: 'Thu, Oct 22', home: 'Wotton', away: 'Deacons', grp: 'D', venue: 'Glebe', time: '21:00', date: '2026-10-23T01:00:00.000Z' },
  { no: 35, day: 'Sat, Oct 24', home: 'White Hall', away: 'Atlas', grp: 'F', venue: 'Speightstown', time: '21:00', date: '2026-10-25T01:00:00.000Z' },
  { no: 36, day: 'Sun, Oct 25', home: 'UWI', away: 'Pride of Gall Hill', grp: 'F', venue: 'Speightstown', time: '21:00', date: '2026-10-26T01:00:00.000Z' }
];

const teamLookup = {
  'Pro-Shottas': 'pmc-club-4',
  'Pro Shottas': 'pmc-club-4',
  'Technique FC': 'pmc-club-19',
  'Technique': 'pmc-club-19',
  'L&R United': 'pmc-club-7',
  'Paradise': 'pmc-club-14',
  'Cave Hill': 'pmc-club-26',
  'Notre Dame': 'pmc-club-11',
  'Bagatelle': 'pmc-club-18',
  'Wales': 'pmc-club-21',
  'Kickstart': 'pmc-club-13',
  'Black Spurs': 'pmc-club-25',
  'Empire': 'pmc-club-15',
  'Parish Land': 'pmc-club-24',
  'St Andrew Lions': 'pmc-club-1',
  'Ivy Rovers': 'pmc-club-28',
  'Brittons Hill': 'pmc-club-5',
  'Pinelands': 'pmc-club-27',
  'Chickmont': 'pmc-club-30',
  'Wotton': 'pmc-club-10',
  'Deacons': 'pmc-club-29',
  'Ellerton': 'pmc-club-2',
  'White Hall': 'pmc-club-22',
  'UWI Black Birds': 'pmc-club-17',
  'UWI': 'pmc-club-17',
  'Atlas United': 'pmc-club-8',
  'Atlas': 'pmc-club-8',
  'Pride of Gall Hill': 'pmc-club-9'
};

const schoolMap = new Map(PMC_SCHOOLS.map(s => [s.id, s]));

const newFixtures = rawFixtures.map(f => {
  const hId = teamLookup[f.home];
  const aId = teamLookup[f.away];
  const hSchool = schoolMap.get(hId);
  const aSchool = schoolMap.get(aId);

  if (!hSchool) throw new Error(`Missing home school for ${f.home} (id: ${hId})`);
  if (!aSchool) throw new Error(`Missing away school for ${f.away} (id: ${aId})`);

  return {
    id: `pmc-fixture-${f.no}`,
    matchNumber: f.no,
    date: f.date,
    time: f.time,
    year: '2026-2027',
    round: `Group ${f.grp} · Match ${f.no}`,
    matchday: `Matchday ${Math.ceil(f.no / 2)}`,
    venue: f.venue,
    group: `Group ${f.grp}`,
    homeTeamId: hId,
    awayTeamId: aId,
    homeTeam: hSchool.name,
    awayTeam: aSchool.name,
    status: 'upcoming',
    homeScore: 0,
    awayScore: 0,
    events: [],
    timeline: [],
    playerStats: {},
    teamSheetApproved: false,
    homeSquadSelection: null,
    awaySquadSelection: null,
    assignedReferees: ['ref_n_greaves', 'ref_i_watkins', 'ref_s_thorne'],
    liveState: {
      period: '1H',
      isRunning: false,
      elapsedOffset: 0,
      playerStats: {},
      timeline: []
    }
  };
});

console.log(`Generated ${newFixtures.length} new fixtures.`);

// Merge with initialMatches without duplicates
const existingMap = new Map(initialMatches.map(m => [m.id, m]));
newFixtures.forEach(m => {
  existingMap.set(m.id, m);
});

const mergedInitial = Array.from(existingMap.values());
fs.writeFileSync(initialMatchesPath, JSON.stringify(mergedInitial, null, 2), 'utf8');
console.log(`Updated ${initialMatchesPath} with ${mergedInitial.length} total fixtures.`);

// Sync to Supabase Cloud
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5eGNidnplcHR3cGxpZGt3bW9iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQxNjgxMjIsImV4cCI6MjA5OTc0NDEyMn0.gLn1Zd-1dXfJFjAD6Jyu66Sn9Hh6qHGnditwKhPfmjk';
const getUrl = 'https://ayxcbvzeptwplidkwmob.supabase.co/rest/v1/pmc_matches_state?id=eq.global_matches&select=*';

https.get(getUrl, { headers: { apikey: key, Authorization: 'Bearer ' + key } }, (res) => {
  let data = '';
  res.on('data', c => data += c);
  res.on('end', () => {
    try {
      const rows = JSON.parse(data);
      const cloudMatches = rows[0]?.data?.matches || [];
      const cloudMap = new Map(cloudMatches.map(m => [m.id, m]));

      // Merge new fixtures into cloud matches (preserve any finished/live matches in cloud)
      mergedInitial.forEach(m => {
        if (!cloudMap.has(m.id)) {
          cloudMap.set(m.id, m);
        } else {
          const existing = cloudMap.get(m.id);
          // If existing is not finished/live, refresh its home/away/venue metadata
          if (existing.status !== 'completed' && existing.status !== 'live' && existing.status !== 'approved' && existing.status !== 'refereed') {
            cloudMap.set(m.id, { ...existing, ...m });
          }
        }
      });

      const finalCloudList = Array.from(cloudMap.values());
      console.log(`Total fixtures to push to Supabase Cloud: ${finalCloudList.length}`);

      const postData = JSON.stringify({
        id: 'global_matches',
        data: { matches: finalCloudList, updatedAt: Date.now() },
        updated_at: new Date().toISOString()
      });

      const postReq = https.request('https://ayxcbvzeptwplidkwmob.supabase.co/rest/v1/pmc_matches_state', {
        method: 'POST',
        headers: {
          apikey: key,
          Authorization: 'Bearer ' + key,
          'Content-Type': 'application/json',
          'Prefer': 'resolution=merge-duplicates'
        }
      }, (postRes) => {
        console.log('Supabase Cloud update response code:', postRes.statusCode);
      });

      postReq.on('error', e => console.error('Cloud POST error:', e));
      postReq.write(postData);
      postReq.end();
    } catch (e) {
      console.error('Error during cloud sync:', e);
    }
  });
});
