// Test simulation run in Node.js
const { MANAGERS_DATA } = require('./data.js');

// Mock browser objects for Node.js test
global.sounds = {
    playWhistle: () => {},
    playKick: () => {},
    playCheer: () => {},
    playSkill: () => {},
    playSave: () => {}
};

const { MatchEngine } = require('./engine.js');

const homeMgr = MANAGERS_DATA.find(m => m.id === 'kim'); // Kim Swoo-geun
const awayMgr = MANAGERS_DATA.find(m => m.id === 'mies'); // Mies van der Rohe

const homeSquad = homeMgr.buildings.slice(0, 11);
const awaySquad = awayMgr.buildings.slice(0, 11);

const match = new MatchEngine(
    { name: 'Le Corbusier FC', manager: homeMgr, startingXI: homeSquad },
    { name: 'Zaha Hadid FC', manager: awayMgr, startingXI: awaySquad },
    {
        speed: 0, // instant
        onComplete: (res) => {
            console.log(`Match finished! Score: ${res.homeScore} : ${res.awayScore}`);
            console.log(`MOM: ${res.mom.name} (Rating: ${res.mom.matchRating})`);
            console.log(`Total events: ${res.events.length}`);
            console.log(`Home Shots: ${res.stats.home.shots}, Away Shots: ${res.stats.away.shots}`);
            console.log(`Possession: Home ${res.stats.home.possession}% - Away ${res.stats.away.possession}%`);
        }
    }
);

match.start();
console.log('Node test completed successfully!');
