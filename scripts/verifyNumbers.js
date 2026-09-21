import fs from 'fs';
const data = JSON.parse(fs.readFileSync('src/data/pmcScrapedData.json', 'utf8'));

// Expected numbers from DOCX
const deaconsExpected = [
  { name: 'KALIQ LASHLEY', num: 1 },
  { name: 'XAVIER BAYNE', num: 11 },
  { name: 'KEBRA BRUCE', num: 17 },
  { name: 'SEMAJ BEST', num: 14 },
  { name: 'RON PILE', num: 0 },
  { name: 'TEVIN BAKER-SAVOURY', num: 10 },
  { name: 'SANTRO SPRINGER', num: 5 },
  { name: 'ANICO HAYNES', num: 19 },
  { name: 'KENNY MAYNARD', num: 9 },
  { name: 'JUSTIN COX', num: 22 },
  { name: 'NATHANIEL MAYNARD', num: 20 },
  { name: 'DEMARIO NURSE', num: 4 },
  { name: 'SHAMAINE RICHARDS', num: 8 },
  { name: 'TYRELL WICKHAM', num: 25 },
  { name: 'SHAQUON HAYNES', num: 12 },
  { name: 'DENILSON HARTE', num: 14 },
  { name: 'MATTHEW DAVIS', num: null },
  { name: 'JONATHAN GOLLOP', num: null },
  { name: 'KESHON RICE', num: null },
  { name: 'CHRISTIAN HERRERA', num: null },
  { name: 'BAGGIO ALLEYNE', num: null },
  { name: 'SHAKUR PHILLIPS', num: null },
  { name: 'JAYDEN CARTER', num: null },
  { name: 'ANDRE GIBSON', num: 5 },
  { name: 'STAFON IFILL', num: 21 },
  { name: 'EDLAMAR FORDE', num: null },
  { name: 'DANICO WATSON', num: 3 },
  { name: 'KIRON PADMORE', num: null },
];

const chickmontExpected = [
  { name: 'DANTE DURRANT', num: null },
  { name: 'TERELL EASTMOND', num: 2 },
  { name: 'AHMAL HARPER', num: 6 },
  { name: 'OMAR DOUGLAS', num: 29 },
  { name: 'DEMAR STONE', num: 19 },
  { name: 'DASHAWN GRIFFITH', num: 5 },
  { name: 'ROBINHO HUSBANDS', num: 8 },
  { name: 'NATHAN HUNTE', num: 15 },
  { name: 'NORRIN CORBIN', num: 10 },
  { name: 'WADE GIBSON', num: 4 },
  { name: 'RICO NURSE', num: 12 },
  { name: 'JARED RICE', num: 9 },
  { name: 'JASON BAILEY', num: 20 },
  { name: 'DANIEL DRUMMOND', num: 25 },
  { name: 'DEMARIO CUNNINGHAM', num: 13 },
  { name: 'RASHANE THOMPSON', num: null },
  { name: 'TERRIKE SMALL', num: 11 },
  { name: 'DARIO COX', num: 7 },
  { name: 'RIVALDO GRAHAM', num: 3 },
];

function verify(teamId, teamName, expected) {
  console.log(`\n=== ${teamName} (Team ${teamId}) ===`);
  let mismatches = 0;
  let missing = 0;
  expected.forEach(e => {
    const player = data.players.find(p =>
      p.teamId === teamId && p.name.toUpperCase().includes(e.name.toUpperCase())
    );
    if (!player) {
      console.log(`  MISSING IN DB: ${e.name} (expected #${e.num})`);
      missing++;
      return;
    }
    const actual = player.jerseyNumber;
    const exp = e.num;
    if (actual !== exp && !(actual == null && exp == null)) {
      console.log(`  MISMATCH: ${player.name} -> DB has #${actual}, DOCX says #${exp}`);
      mismatches++;
    } else {
      console.log(`  OK: ${player.name} -> #${actual ?? '-'}`);
    }
  });
  console.log(`  --- ${expected.length} players checked. ${mismatches} mismatches, ${missing} missing ---`);
}

verify(29, 'DEACONS FC', deaconsExpected);
verify(30, 'CHICKMONT', chickmontExpected);
