// Univa Idle - Proof of Concept
// Type 0 → Type I progression

// ============================================================================
// HERO CARD SYSTEM
// ============================================================================

const HERO_ACHIEVEMENTS = {
  nodeHarvester: {
    name: 'Node Harvester',
    desc: 'Harvest resource nodes',
    icon: '🌍',
    baseBonus: 0.001, // 0.1% per level
    bonusType: 'energyRate',
    bonusDesc: 'Energy Generation',
  },
  bulkBuyer: {
    name: 'Bulk Buyer',
    desc: 'Purchase upgrades',
    icon: '💰',
    baseBonus: 0.001, // 0.1% per level
    bonusType: 'costReduction',
    bonusDesc: 'Cost Reduction',
  },
  clickMaster: {
    name: 'Click Master',
    desc: 'Manual clicks',
    icon: '👆',
    baseBonus: 0.002, // 0.2% per level
    bonusType: 'clickPower',
    bonusDesc: 'Click Power',
  },
  prestigeVeteran: {
    name: 'Prestige Veteran',
    desc: 'Complete prestiges',
    icon: '⚡',
    baseBonus: 0.005, // 0.5% per level
    bonusType: 'prestigeGain',
    bonusDesc: 'Prestige Currency',
  },
  survivor: {
    name: 'Survivor',
    desc: 'Survive cataclysms',
    icon: '🛡️',
    baseBonus: 0.003, // 0.3% per level
    bonusType: 'survivalBonus',
    bonusDesc: 'Survival Structures',
  },
};

const RANK_NAMES = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Uranium', 'Diamond', 'Obsidian', 'Mythril', 'Adamantite'];
const RANK_MULTIPLIER = 1.5; // Each rank within a badge is 1.5x stronger
const BADGE_MULTIPLIER = 2.0; // Each badge tier is 2x stronger than previous

// Hero Card stored separately from game saves
let heroCard = {
  name: 'Wanderer',
  totalLevel: 0,
  achievements: {},
};

// Initialize hero achievements
Object.keys(HERO_ACHIEVEMENTS).forEach(key => {
  heroCard.achievements[key] = {
    level: 0,
    rank: 0, // 0-99 within current badge
    badge: 0, // 0 = Bronze, 1 = Silver, etc.
    totalCompletions: 0,
  };
});

function loadHeroCard() {
  try {
    const saved = localStorage.getItem('univaHero');
    if (saved) {
      const data = JSON.parse(saved);
      heroCard.name = data.name || 'Wanderer';
      heroCard.totalLevel = data.totalLevel || 0;
      
      // Load achievements
      if (data.achievements) {
        Object.keys(heroCard.achievements).forEach(key => {
          if (data.achievements[key]) {
            heroCard.achievements[key] = {
              level: data.achievements[key].level || 0,
              rank: data.achievements[key].rank || 0,
              badge: data.achievements[key].badge || 0,
              totalCompletions: data.achievements[key].totalCompletions || 0,
            };
          }
        });
      }
    }
  } catch (e) {
    console.error('Failed to load hero card:', e);
  }
}

function saveHeroCard() {
  localStorage.setItem('univaHero', JSON.stringify(heroCard));
}

function getAchievementRankName(badge) {
  return RANK_NAMES[badge] || `Badge ${badge}`;
}

function getAchievementBonus(achievementKey) {
  const achievement = heroCard.achievements[achievementKey];
  const def = HERO_ACHIEVEMENTS[achievementKey];
  if (!achievement || !def) return 0;
  
  const rankMultiplier = Math.pow(RANK_MULTIPLIER, achievement.rank);
  const badgeMultiplier = Math.pow(BADGE_MULTIPLIER, achievement.badge);
  return def.baseBonus * achievement.level * rankMultiplier * badgeMultiplier;
}

function getTotalAchievementBonus(bonusType) {
  let total = 0;
  Object.keys(HERO_ACHIEVEMENTS).forEach(key => {
    const def = HERO_ACHIEVEMENTS[key];
    if (def.bonusType === bonusType) {
      total += getAchievementBonus(key);
    }
  });
  return total;
}

function incrementAchievement(achievementKey) {
  const achievement = heroCard.achievements[achievementKey];
  if (!achievement) return;
  
  achievement.level++;
  achievement.totalCompletions++;
  heroCard.totalLevel++;
  
  // Check if can prestige (level 100 within current rank)
  if (achievement.level >= 100) {
    // Don't auto-prestige, let player choose
  }
  
  saveHeroCard();
  updateHeroCardUI();
}

function prestigeAchievement(achievementKey) {
  const achievement = heroCard.achievements[achievementKey];
  if (!achievement || achievement.level < 100) return;
  
  achievement.rank++;
  achievement.level = 0;
  
  // Check if rank reached 100 - advance to next badge
  if (achievement.rank >= 100) {
    achievement.badge++;
    achievement.rank = 0;
    
    const badgeName = getAchievementRankName(achievement.badge);
    showAchievementNotification(
      `${HERO_ACHIEVEMENTS[achievementKey].name} Badge Up!`,
      `Advanced to ${badgeName} badge!`
    );
  } else {
    const badgeName = getAchievementRankName(achievement.badge);
    showAchievementNotification(
      `${HERO_ACHIEVEMENTS[achievementKey].name} Rank Up!`,
      `${badgeName} Rank ${achievement.rank}!`
    );
  }
  
  saveHeroCard();
  updateHeroCardUI();
}

function getHeroRank() {
  // Calculate hero badge based on average achievement badge
  let totalBadge = 0;
  let count = 0;
  
  Object.keys(heroCard.achievements).forEach(key => {
    const achievement = heroCard.achievements[key];
    if (achievement.totalCompletions > 0) {
      totalBadge += achievement.badge;
      count++;
    }
  });
  
  if (count === 0) return 0;
  return Math.floor(totalBadge / count);
}

function updateHeroCardUI() {
  const heroRank = getHeroRank();
  const heroRankName = getAchievementRankName(heroRank);
  
  const heroInfoEl = document.getElementById('hero-info');
  if (!heroInfoEl) return;
  
  let html = `
    <div style="text-align: center; margin-bottom: 10px;">
      <div style="font-size: 20px; color: #ff0;">⭐ ${heroCard.name}</div>
      <div style="font-size: 12px; color: #0af;">${heroRankName} Hero</div>
      <div style="font-size: 10px; color: #088;">Total Level: ${heroCard.totalLevel}</div>
    </div>
  `;
  
  Object.keys(HERO_ACHIEVEMENTS).forEach(key => {
    const def = HERO_ACHIEVEMENTS[key];
    const achievement = heroCard.achievements[key];
    const badgeName = getAchievementRankName(achievement.badge);
    const bonus = getAchievementBonus(key);
    const canPrestige = achievement.level >= 100;
    
    html += `
      <div style="background: rgba(0,170,255,0.05); border: 1px solid #0af; border-radius: 3px; padding: 8px; margin: 5px 0;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <span style="font-size: 16px;">${def.icon}</span>
            <span style="color: #0ff; font-weight: bold;">${def.name}</span>
          </div>
          <div style="text-align: right; font-size: 10px;">
            <div style="color: #fa0;">${badgeName}</div>
            <div style="color: #0aa;">Rank ${achievement.rank}/100</div>
            <div style="color: #088;">Lv.${achievement.level}/100</div>
          </div>
        </div>
        <div style="font-size: 10px; color: #888; margin-top: 3px;">${def.desc}</div>
        <div style="font-size: 11px; color: #0f0; margin-top: 3px;">
          +${(bonus * 100).toFixed(2)}% ${def.bonusDesc}
        </div>
        ${canPrestige ? `
          <button class="prestige-achievement-btn" data-achievement="${key}" style="
            width: 100%;
            margin-top: 5px;
            padding: 4px;
            background: linear-gradient(135deg, #f80, #fa0);
            border: 1px solid #fc0;
            color: #000;
            font-weight: bold;
            font-size: 10px;
            cursor: pointer;
            border-radius: 3px;
          ">⬆️ PRESTIGE ${achievement.rank >= 99 ? `TO ${getAchievementRankName(achievement.badge + 1)} BADGE` : 'RANK'}</button>
        ` : ''}
      </div>
    `;
  });
  
  heroInfoEl.innerHTML = html;
  
  // Add event listeners to prestige buttons
  heroInfoEl.querySelectorAll('.prestige-achievement-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const achievementKey = btn.dataset.achievement;
      prestigeAchievement(achievementKey);
    });
  });
}

// ============================================================================
// GAME STATE
// ============================================================================
const game = {
  // Resources
  energy: 0,
  matter: 0,
  info: 0,

  // Rates (per second)
  energyRate: 10,  // Start with 10/s instead of 1/s
  matterRate: 0,
  infoRate: 0,

  // Reach (total energy generated, for prestige)
  reach: 0,

  // Prestige currencies
  archivedData: 0,      // From Asteroid Impact
  hardenedBlueprints: 0, // From Solar Flare
  geneticArchives: 0,    // From Gamma Ray Burst

  // Cataclysm state
  cataclysm: {
    active: false,
    type: null,           // 'asteroid', 'solarFlare', 'gammaRay'
    progress: 0,          // 0-1, how close to threshold
    warningShown: false,
    crisisMode: false,
  },

  // Survival structures
  survivalBunkers: 0,
  dataArchives: 0,
  seedVaults: 0,

  // Kardashev progress
  kardashevTier: 0,
  kardashevProgress: 0, // 0-1

  // Projects
  projects: {},
  activeProjects: [], // Projects currently being built

  // Tech tree
  techs: {},

  // Challenges
  challenges: {},
  challengeCompletions: {}, // Track how many times each challenge completed

  // Upgrades
  upgrades: {
    // Energy upgrades
    energyCollector: { level: 0, baseCost: 10, costMult: 1.12, baseProduction: 2, category: 'energy' },
    solarPanel: { level: 0, baseCost: 100, costMult: 1.12, baseProduction: 10, category: 'energy' },
    fusionReactor: { level: 0, baseCost: 1000, costMult: 1.13, baseProduction: 50, category: 'energy' },
    dysonComponent: { level: 0, baseCost: 10000, costMult: 1.14, baseProduction: 250, category: 'energy' },

    autoClicker: { level: 0, baseCost: 500, costMult: 1.3, baseProduction: 0, category: 'energy' },
    clickBoost: { level: 0, baseCost: 50, costMult: 1.2, baseProduction: 0, category: 'energy' },

    // Matter upgrades
    matterExtractor: { level: 0, baseCost: 1e6, costMult: 1.25, baseProduction: 1, category: 'matter', unlockAt: 1e6 },

    // Info upgrades
    infoProcessor: { level: 0, baseCost: 1e9, costMult: 1.25, baseProduction: 1, category: 'info', unlockAt: 1e9 },

    // Survival structures (one-time purchases)
    survivalBunker: { level: 0, baseCost: 10000, costMult: 1, baseProduction: 0, category: 'matter', unlockAt: 7e5, maxLevel: 10, isSurvival: true },
    dataArchive: { level: 0, baseCost: 5000, costMult: 1, baseProduction: 0, category: 'matter', unlockAt: 7e5, maxLevel: 5, isSurvival: true },
    seedVault: { level: 0, baseCost: 20000, costMult: 1, baseProduction: 0, category: 'matter', unlockAt: 7e5, maxLevel: 3, isSurvival: true },
  },

  // Nodes in solar system
  nodes: [],

  // Camera/orbital position
  earthOrbitAngle: 0, // Earth's position around sun
  sunDistance: 400, // Distance from center to sun

  // Click power
  clickPower: 1,

  // Click combo system
  clickCombo: 0,
  lastClickTime: 0,
  comboDecayTime: 2000, // 2 seconds to maintain combo

  // Last update time
  lastUpdate: Date.now(),

  // Buy mode
  buyMode: 1, // 1, 10, or 'max'

  // Achievements
  achievements: {
    bulkBuyer: false,      // Unlock Buy 10x (buy 25 upgrades)
    maxBuyer: false,       // Unlock Buy Max (buy 100 upgrades)
    nodeHarvester: false,  // Harvest 10 nodes
    // More achievements can be added here
  },
  totalUpgradesPurchased: 0,
};

// ============================================================================
// CONSTANTS
// ============================================================================

const KARDASHEV_THRESHOLDS = {
  0: { threshold: 0, next: 1e18, goal: 'Master Planetary Energy' },
  1: { threshold: 1e18, next: 1e26, goal: 'Harness Stellar Output' },
  2: { threshold: 1e26, next: 1e37, goal: 'Control Galactic Energy' },
  3: { threshold: 1e37, next: Infinity, goal: 'Transcend Physical Reality' },
};

const CATACLYSM_THRESHOLDS = {
  asteroid: { threshold: 1e6, name: 'Asteroid Impact', warning: 'Planetary defense systems detect incoming object' },
  solarFlare: { threshold: 1e9, name: 'Solar Flare', warning: 'Coronal mass ejection probability: CRITICAL' },
  gammaRay: { threshold: 1e12, name: 'Gamma Ray Burst', warning: 'Nearby supernova detected. Radiation wave incoming' },
};
const UPGRADE_DEFINITIONS = {
  energyCollector: {
    name: 'Energy Collector',
    desc: 'Basic energy harvesting',
    icon: '⚡',
    resource: 'energy',
  },
  solarPanel: {
    name: 'Solar Panel',
    desc: 'Harness stellar radiation',
    icon: '☀️',
    resource: 'energy',
  },
  fusionReactor: {
    name: 'Fusion Reactor',
    desc: 'Nuclear fusion power',
    icon: '⚛️',
    resource: 'energy',
  },
  dysonComponent: {
    name: 'Dyson Component',
    desc: 'Stellar megastructure piece',
    icon: '🛰️',
    resource: 'energy',
  },
  autoClicker: {
    name: 'Auto-Harvester',
    desc: 'Automatically harvest nodes',
    icon: '🤖',
    resource: 'energy',
  },
  clickBoost: {
    name: 'Click Amplifier',
    desc: 'Boost manual click power',
    icon: '👆',
    resource: 'energy',
  },
  matterExtractor: {
    name: 'Matter Extractor',
    desc: 'Extract physical resources',
    icon: '🔩',
    resource: 'energy',
    unlockAt: 1e6,
  },
  infoProcessor: {
    name: 'Info Processor',
    desc: 'Process information',
    icon: '💡',
    resource: 'energy',
    unlockAt: 1e9,
  },
  survivalBunker: {
    name: 'Survival Bunker',
    desc: '+10% prestige currency, protects 5% Matter',
    icon: '🏰',
    resource: 'matter',
    unlockAt: 1e11,
  },
  dataArchive: {
    name: 'Data Archive',
    desc: '+5% prestige currency, keeps 1 tech',
    icon: '💾',
    resource: 'matter',
    unlockAt: 1e11,
  },
  seedVault: {
    name: 'Seed Vault',
    desc: '+15% prestige currency, faster recovery',
    icon: '🌱',
    resource: 'matter',
    unlockAt: 1e11,
  },
};

// ============================================================================
// PROJECTS SYSTEM
// ============================================================================

const PROJECT_DEFINITIONS = {
  // Type 0 Projects
  orbitalHabitat: {
    name: 'Orbital Habitat',
    desc: 'Space station for population growth',
    icon: '🛸',
    tier: 0,
    unlockAt: 5e6,
    requirements: { energy: 1e7, matter: 5e3, info: 1e3 },
    buildTime: 60, // seconds
    rewards: { energyRate: 1.1, matterRate: 1.05 },
    rewardDesc: '+10% Energy, +5% Matter',
  },
  planetaryNetwork: {
    name: 'Planetary Network',
    desc: 'Global communication infrastructure',
    icon: '🌐',
    tier: 0,
    unlockAt: 1e7,
    requirements: { energy: 5e7, matter: 1e4, info: 5e3 },
    buildTime: 90,
    rewards: { infoRate: 1.2 },
    rewardDesc: '+20% Information',
  },
  matterSynthesizer: {
    name: 'Matter Synthesizer',
    desc: 'Convert energy to matter efficiently',
    icon: '⚗️',
    tier: 0,
    unlockAt: 5e7,
    requirements: { energy: 1e8, matter: 5e4, info: 1e4 },
    buildTime: 120,
    rewards: { matterRate: 1.25 },
    rewardDesc: '+25% Matter generation',
  },

  // Type I Projects
  dysonSwarm: {
    name: 'Dyson Swarm',
    desc: 'Solar collectors orbiting the star',
    icon: '☀️',
    tier: 1,
    unlockAt: 1e18,
    requirements: { energy: 1e19, matter: 1e6, info: 1e5 },
    buildTime: 300,
    rewards: { energyRate: 2.0 },
    rewardDesc: '+100% Energy generation',
  },
  stellarForge: {
    name: 'Stellar Forge',
    desc: 'Harness stellar core for exotic matter',
    icon: '🔥',
    tier: 1,
    unlockAt: 5e18,
    requirements: { energy: 5e19, matter: 5e6, info: 5e5 },
    buildTime: 600,
    rewards: { matterRate: 2.0, unlockExotic: true },
    rewardDesc: '+100% Matter, unlock Exotic Matter',
  },
  warpGate: {
    name: 'Warp Gate',
    desc: 'Faster-than-light travel network',
    icon: '🌀',
    tier: 1,
    unlockAt: 1e19,
    requirements: { energy: 1e20, matter: 1e7, info: 1e6 },
    buildTime: 900,
    rewards: { allRates: 1.5 },
    rewardDesc: '+50% all resource generation',
  },
};

// Initialize projects state
Object.keys(PROJECT_DEFINITIONS).forEach(key => {
  game.projects[key] = {
    completed: false,
    progress: 0, // 0-1
    startTime: 0,
  };
});

// ============================================================================
// TECH TREE SYSTEM
// ============================================================================

const TECH_DEFINITIONS = {
  // ============================================================================
  // TYPE 0 - PLANETARY MASTERY (~150-200 nodes)
  // ============================================================================
  
  // ===== MATERIALS BRANCH (180°) =====
  
  // TIER 1: Basic Materials (Ring 1)
  materials_metallurgy: {
    name: 'Metallurgy',
    desc: 'Metal extraction & processing',
    branch: 'materials',
    tier: 0,
    position: { angle: 180, ring: 1 },
    requirements: { reach: 1e6 },
    cost: { info: 500 },
    bonus: { matterRate: 1.05 },
  },
  materials_iron: {
    name: 'Iron Smelting',
    desc: 'Basic structural metal',
    branch: 'materials',
    tier: 0,
    position: { angle: 175, ring: 1.3 },
    requirements: { reach: 1e6, techs: ['materials_metallurgy'] },
    cost: { info: 600 },
    bonus: { matterRate: 1.03 },
  },
  materials_aluminum: {
    name: 'Aluminum Extraction',
    desc: 'Lightweight metal',
    branch: 'materials',
    tier: 0,
    position: { angle: 185, ring: 1.3 },
    requirements: { reach: 1e6, techs: ['materials_metallurgy'] },
    cost: { info: 600 },
    bonus: { matterRate: 1.03 },
  },
  materials_copper: {
    name: 'Copper Refining',
    desc: 'Conductive metal',
    branch: 'materials',
    tier: 0,
    position: { angle: 180, ring: 1.6 },
    requirements: { reach: 1.2e6, techs: ['materials_metallurgy'] },
    cost: { info: 700 },
    bonus: { matterRate: 1.03 },
  },
  
  materials_semiconductors: {
    name: 'Semiconductor Theory',
    desc: 'Electronic materials',
    branch: 'materials',
    tier: 0,
    position: { angle: 170, ring: 1.5 },
    requirements: { reach: 1.5e6 },
    cost: { info: 800 },
    bonus: { infoRate: 1.05 },
  },
  materials_silicon: {
    name: 'Silicon Purification',
    desc: 'High-purity silicon',
    branch: 'materials',
    tier: 0,
    position: { angle: 165, ring: 1.8 },
    requirements: { reach: 1.5e6, techs: ['materials_semiconductors'] },
    cost: { info: 900 },
    bonus: { infoRate: 1.03 },
  },
  materials_doping: {
    name: 'Semiconductor Doping',
    desc: 'N-type & P-type materials',
    branch: 'materials',
    tier: 0,
    position: { angle: 175, ring: 1.9 },
    requirements: { reach: 1.8e6, techs: ['materials_silicon'] },
    cost: { info: 1000 },
    bonus: { infoRate: 1.03 },
  },
  
  // TIER 2: Advanced Materials (Ring 2-2.5)
  materials_alloys: {
    name: 'Alloy Engineering',
    desc: 'Mixed metal compounds',
    branch: 'materials',
    tier: 0,
    position: { angle: 180, ring: 2 },
    requirements: { reach: 3e6, techs: ['materials_iron', 'materials_aluminum'] },
    cost: { info: 2000 },
    bonus: { matterRate: 1.08 },
  },
  materials_steel: {
    name: 'High-Strength Steel',
    desc: 'Iron-carbon alloy',
    branch: 'materials',
    tier: 0,
    position: { angle: 175, ring: 2.3 },
    requirements: { reach: 3e6, techs: ['materials_alloys', 'materials_iron'] },
    cost: { info: 2200 },
    bonus: { matterRate: 1.05 },
  },
  materials_titanium: {
    name: 'Titanium Alloys',
    desc: 'Lightweight & strong',
    branch: 'materials',
    tier: 0,
    position: { angle: 185, ring: 2.3 },
    requirements: { reach: 3.5e6, techs: ['materials_alloys'] },
    cost: { info: 2500 },
    bonus: { matterRate: 1.05 },
  },
  materials_superalloys: {
    name: 'Nickel Superalloys',
    desc: 'High-temperature materials',
    branch: 'materials',
    tier: 0,
    position: { angle: 180, ring: 2.6 },
    requirements: { reach: 4e6, techs: ['materials_steel', 'materials_titanium'] },
    cost: { info: 3000 },
    bonus: { matterRate: 1.06 },
  },
  
  materials_composites: {
    name: 'Composite Materials',
    desc: 'Multi-material structures',
    branch: 'materials',
    tier: 0,
    position: { angle: 170, ring: 2.2 },
    requirements: { reach: 3.5e6, techs: ['materials_alloys'] },
    cost: { info: 2500 },
    bonus: { matterRate: 1.06 },
  },
  materials_carbon_fiber: {
    name: 'Carbon Fiber',
    desc: 'Lightweight composite',
    branch: 'materials',
    tier: 0,
    position: { angle: 165, ring: 2.5 },
    requirements: { reach: 4e6, techs: ['materials_composites'] },
    cost: { info: 2800 },
    bonus: { matterRate: 1.04 },
  },
  materials_ceramics: {
    name: 'Advanced Ceramics',
    desc: 'Heat-resistant materials',
    branch: 'materials',
    tier: 0,
    position: { angle: 175, ring: 2.5 },
    requirements: { reach: 4e6, techs: ['materials_composites'] },
    cost: { info: 2800 },
    bonus: { matterRate: 1.04 },
  },
  
  // TIER 3: Nanomaterials (Ring 3-3.5)
  materials_nanotech: {
    name: 'Nanotechnology',
    desc: 'Molecular-scale engineering',
    branch: 'materials',
    tier: 0,
    position: { angle: 180, ring: 3 },
    requirements: { reach: 8e6, techs: ['materials_superalloys', 'materials_carbon_fiber'] },
    cost: { info: 5000 },
    bonus: { matterRate: 1.12 },
  },
  materials_graphene: {
    name: 'Graphene Production',
    desc: 'Single-layer carbon',
    branch: 'materials',
    tier: 0,
    position: { angle: 175, ring: 3.3 },
    requirements: { reach: 9e6, techs: ['materials_nanotech'] },
    cost: { info: 6000 },
    bonus: { matterRate: 1.06 },
  },
  materials_carbon_nanotubes: {
    name: 'Carbon Nanotubes',
    desc: 'Cylindrical carbon structures',
    branch: 'materials',
    tier: 0,
    position: { angle: 185, ring: 3.3 },
    requirements: { reach: 9e6, techs: ['materials_nanotech'] },
    cost: { info: 6000 },
    bonus: { matterRate: 1.06 },
  },
  materials_quantum_dots: {
    name: 'Quantum Dots',
    desc: 'Nanoscale semiconductors',
    branch: 'materials',
    tier: 0,
    position: { angle: 180, ring: 3.6 },
    requirements: { reach: 1e7, techs: ['materials_graphene', 'materials_carbon_nanotubes'] },
    cost: { info: 7000 },
    bonus: { infoRate: 1.08 },
  },
  
  // TIER 4: Smart Materials (Ring 4-4.5)
  materials_programmable: {
    name: 'Programmable Matter',
    desc: 'Shape-shifting materials',
    branch: 'materials',
    tier: 0,
    position: { angle: 180, ring: 4 },
    requirements: { reach: 3e7, techs: ['materials_quantum_dots'] },
    cost: { info: 15000 },
    bonus: { matterRate: 1.2 },
  },
  materials_shape_memory: {
    name: 'Shape Memory Alloys',
    desc: 'Temperature-responsive metals',
    branch: 'materials',
    tier: 0,
    position: { angle: 175, ring: 4.3 },
    requirements: { reach: 3.5e7, techs: ['materials_programmable'] },
    cost: { info: 18000 },
    bonus: { matterRate: 1.08 },
  },
  materials_self_healing: {
    name: 'Self-Healing Materials',
    desc: 'Auto-repair structures',
    branch: 'materials',
    tier: 0,
    position: { angle: 185, ring: 4.3 },
    requirements: { reach: 3.5e7, techs: ['materials_programmable'] },
    cost: { info: 18000 },
    bonus: { matterRate: 1.08 },
  },
  materials_metamaterials: {
    name: 'Metamaterials',
    desc: 'Engineered properties',
    branch: 'materials',
    tier: 0,
    position: { angle: 180, ring: 4.6 },
    requirements: { reach: 4e7, techs: ['materials_shape_memory', 'materials_self_healing'] },
    cost: { info: 20000 },
    bonus: { matterRate: 1.1 },
  },
  
  // TIER 5: Exotic Materials (Ring 5)
  materials_exotic: {
    name: 'Exotic Matter Theory',
    desc: 'Beyond normal physics',
    branch: 'materials',
    tier: 0,
    position: { angle: 180, ring: 5 },
    requirements: { reach: 8e7, techs: ['materials_metamaterials'] },
    cost: { info: 40000 },
    bonus: { matterRate: 1.5 },
  },
  materials_negative_mass: {
    name: 'Negative Mass Materials',
    desc: 'Repulsive gravity',
    branch: 'materials',
    tier: 0,
    position: { angle: 175, ring: 5.3 },
    requirements: { reach: 9e7, techs: ['materials_exotic'] },
    cost: { info: 50000 },
    bonus: { matterRate: 1.15 },
  },
  materials_strange_matter: {
    name: 'Strange Matter',
    desc: 'Quark-based materials',
    branch: 'materials',
    tier: 0,
    position: { angle: 185, ring: 5.3 },
    requirements: { reach: 9e7, techs: ['materials_exotic'] },
    cost: { info: 50000 },
    bonus: { energyRate: 1.15 },
  },
  
  // ===== COMPUTING BRANCH (0°) =====
  
  // TIER 1: Digital Foundation (Ring 1)
  computing_logic: {
    name: 'Digital Logic',
    desc: 'Binary computation',
    branch: 'computing',
    tier: 0,
    position: { angle: 0, ring: 1 },
    requirements: { reach: 1e6 },
    cost: { info: 500 },
    bonus: { infoRate: 1.05 },
  },
  computing_transistors: {
    name: 'Transistor Technology',
    desc: 'Electronic switches',
    branch: 'computing',
    tier: 0,
    position: { angle: -5, ring: 1.3 },
    requirements: { reach: 1.2e6, techs: ['computing_logic', 'materials_silicon'] },
    cost: { info: 700 },
    bonus: { infoRate: 1.04 },
  },
  computing_integrated_circuits: {
    name: 'Integrated Circuits',
    desc: 'Chips with multiple components',
    branch: 'computing',
    tier: 0,
    position: { angle: 5, ring: 1.3 },
    requirements: { reach: 1.5e6, techs: ['computing_transistors'] },
    cost: { info: 900 },
    bonus: { infoRate: 1.04 },
  },
  
  computing_architecture: {
    name: 'Computer Architecture',
    desc: 'System design',
    branch: 'computing',
    tier: 0,
    position: { angle: 0, ring: 1.6 },
    requirements: { reach: 1.8e6, techs: ['computing_integrated_circuits'] },
    cost: { info: 1100 },
    bonus: { infoRate: 1.06 },
  },
  computing_processors: {
    name: 'Microprocessors',
    desc: 'CPU technology',
    branch: 'computing',
    tier: 0,
    position: { angle: -5, ring: 1.9 },
    requirements: { reach: 2e6, techs: ['computing_architecture'] },
    cost: { info: 1300 },
    bonus: { infoRate: 1.05 },
  },
  computing_memory: {
    name: 'Memory Systems',
    desc: 'Data storage',
    branch: 'computing',
    tier: 0,
    position: { angle: 5, ring: 1.9 },
    requirements: { reach: 2e6, techs: ['computing_architecture'] },
    cost: { info: 1300 },
    bonus: { infoRate: 1.05 },
  },
  
  // TIER 2: Advanced Computing (Ring 2-2.5)
  computing_parallel: {
    name: 'Parallel Processing',
    desc: 'Multiple simultaneous operations',
    branch: 'computing',
    tier: 0,
    position: { angle: 0, ring: 2 },
    requirements: { reach: 3e6, techs: ['computing_processors'] },
    cost: { info: 2000 },
    bonus: { infoRate: 1.1 },
  },
  computing_multicore: {
    name: 'Multi-Core Processors',
    desc: 'Multiple CPUs on one chip',
    branch: 'computing',
    tier: 0,
    position: { angle: -5, ring: 2.3 },
    requirements: { reach: 3.5e6, techs: ['computing_parallel'] },
    cost: { info: 2500 },
    bonus: { infoRate: 1.06 },
  },
  computing_gpu: {
    name: 'Graphics Processing Units',
    desc: 'Massively parallel computation',
    branch: 'computing',
    tier: 0,
    position: { angle: 5, ring: 2.3 },
    requirements: { reach: 3.5e6, techs: ['computing_parallel'] },
    cost: { info: 2500 },
    bonus: { infoRate: 1.06 },
  },
  
  computing_storage: {
    name: 'Data Storage',
    desc: 'Persistent memory',
    branch: 'computing',
    tier: 0,
    position: { angle: 0, ring: 2.6 },
    requirements: { reach: 4e6, techs: ['computing_memory'] },
    cost: { info: 3000 },
    bonus: { infoRate: 1.08 },
  },
  computing_ssd: {
    name: 'Solid State Drives',
    desc: 'Flash memory storage',
    branch: 'computing',
    tier: 0,
    position: { angle: -5, ring: 2.9 },
    requirements: { reach: 4.5e6, techs: ['computing_storage'] },
    cost: { info: 3500 },
    bonus: { infoRate: 1.05 },
  },
  computing_optical: {
    name: 'Optical Storage',
    desc: 'Laser-based data',
    branch: 'computing',
    tier: 0,
    position: { angle: 5, ring: 2.9 },
    requirements: { reach: 4.5e6, techs: ['computing_storage'] },
    cost: { info: 3500 },
    bonus: { infoRate: 1.05 },
  },
  
  // TIER 3: Artificial Intelligence (Ring 3-3.5)
  computing_ai: {
    name: 'AI Theory',
    desc: 'Machine intelligence',
    branch: 'computing',
    tier: 0,
    position: { angle: 0, ring: 3 },
    requirements: { reach: 8e6, techs: ['computing_multicore', 'computing_gpu'] },
    cost: { info: 5000 },
    bonus: { allRates: 1.15 },
  },
  computing_machine_learning: {
    name: 'Machine Learning',
    desc: 'Pattern recognition',
    branch: 'computing',
    tier: 0,
    position: { angle: -5, ring: 3.3 },
    requirements: { reach: 9e6, techs: ['computing_ai'] },
    cost: { info: 6000 },
    bonus: { infoRate: 1.08 },
  },
  computing_neural_nets: {
    name: 'Neural Networks',
    desc: 'Brain-inspired computing',
    branch: 'computing',
    tier: 0,
    position: { angle: 5, ring: 3.3 },
    requirements: { reach: 9e6, techs: ['computing_ai'] },
    cost: { info: 6000 },
    bonus: { infoRate: 1.08 },
  },
  computing_deep_learning: {
    name: 'Deep Learning',
    desc: 'Multi-layer networks',
    branch: 'computing',
    tier: 0,
    position: { angle: 0, ring: 3.6 },
    requirements: { reach: 1e7, techs: ['computing_neural_nets'] },
    cost: { info: 7000 },
    bonus: { infoRate: 1.1 },
  },
  
  // TIER 4: Quantum Computing (Ring 4-4.5)
  computing_quantum: {
    name: 'Quantum Computing Theory',
    desc: 'Superposition & entanglement',
    branch: 'computing',
    tier: 0,
    position: { angle: 0, ring: 4 },
    requirements: { reach: 3e7, techs: ['computing_deep_learning'] },
    cost: { info: 15000 },
    bonus: { infoRate: 1.25 },
  },
  computing_qubits: {
    name: 'Qubit Technology',
    desc: 'Quantum bits',
    branch: 'computing',
    tier: 0,
    position: { angle: -5, ring: 4.3 },
    requirements: { reach: 3.5e7, techs: ['computing_quantum', 'materials_quantum_dots'] },
    cost: { info: 18000 },
    bonus: { infoRate: 1.12 },
  },
  computing_quantum_gates: {
    name: 'Quantum Gates',
    desc: 'Quantum logic operations',
    branch: 'computing',
    tier: 0,
    position: { angle: 5, ring: 4.3 },
    requirements: { reach: 3.5e7, techs: ['computing_qubits'] },
    cost: { info: 18000 },
    bonus: { infoRate: 1.12 },
  },
  computing_quantum_error: {
    name: 'Quantum Error Correction',
    desc: 'Stabilize quantum states',
    branch: 'computing',
    tier: 0,
    position: { angle: 0, ring: 4.6 },
    requirements: { reach: 4e7, techs: ['computing_quantum_gates'] },
    cost: { info: 20000 },
    bonus: { infoRate: 1.15 },
  },
  
  // TIER 5: Consciousness (Ring 5)
  computing_consciousness: {
    name: 'Digital Consciousness',
    desc: 'Artificial minds',
    branch: 'computing',
    tier: 0,
    position: { angle: 0, ring: 5 },
    requirements: { reach: 8e7, techs: ['computing_quantum_error'] },
    cost: { info: 40000 },
    bonus: { infoRate: 1.5 },
  },
  computing_brain_interface: {
    name: 'Brain-Computer Interface',
    desc: 'Direct neural connection',
    branch: 'computing',
    tier: 0,
    position: { angle: -5, ring: 5.3 },
    requirements: { reach: 9e7, techs: ['computing_consciousness'] },
    cost: { info: 50000 },
    bonus: { infoRate: 1.2 },
  },
  computing_mind_upload: {
    name: 'Mind Uploading',
    desc: 'Transfer consciousness to digital',
    branch: 'computing',
    tier: 0,
    position: { angle: 5, ring: 5.3 },
    requirements: { reach: 9e7, techs: ['computing_brain_interface'] },
    cost: { info: 50000 },
    bonus: { allRates: 1.3 },
  },
};

// Initialize tech state
Object.keys(TECH_DEFINITIONS).forEach(key => {
  game.techs[key] = {
    researched: false,
  };
});

// ============================================================================
// CHALLENGES SYSTEM
// ============================================================================

const CHALLENGE_DEFINITIONS = {
  speedRun: {
    name: 'Speed Run',
    desc: 'Reach target in limited time',
    icon: '⚡',
    unlockAt: 1e9,
    maxCompletions: 10,
    getGoal: (completions) => ({
      reach: 1e9 * Math.pow(2, completions), // 1B, 2B, 4B, 8B, etc.
      timeLimit: Math.max(300, 1800 - completions * 150) // 30min down to 5min
    }),
    reward: { energyRate: 1.1 },
    rewardDesc: '+10% Energy per completion',
    getDesc: (completions) => {
      const goal = CHALLENGE_DEFINITIONS.speedRun.getGoal(completions);
      const minutes = Math.floor(goal.timeLimit / 60);
      return `Reach ${formatNumber(goal.reach)} in under ${minutes} minutes`;
    }
  },
  minimalist: {
    name: 'Minimalist',
    desc: 'Reach target with limited upgrades',
    icon: '🎯',
    unlockAt: 1e9,
    maxCompletions: 10,
    getGoal: (completions) => ({
      reach: 1e9 * Math.pow(1.5, completions), // 1B, 1.5B, 2.25B, etc.
      maxUpgrades: Math.max(5, 10 - completions) // 10 down to 5
    }),
    reward: { costReduction: 0.95 },
    rewardDesc: '-5% all costs per completion',
    getDesc: (completions) => {
      const goal = CHALLENGE_DEFINITIONS.minimalist.getGoal(completions);
      return `Reach ${formatNumber(goal.reach)} with max ${goal.maxUpgrades} upgrade levels`;
    }
  },
  pacifist: {
    name: 'Pacifist',
    desc: 'Reach target without manual clicks',
    icon: '☮️',
    unlockAt: 1e9,
    maxCompletions: 10,
    getGoal: (completions) => ({
      reach: 1e9 * Math.pow(1.8, completions), // 1B, 1.8B, 3.24B, etc.
      noClicks: true
    }),
    reward: { autoHarvest: 1.15 },
    rewardDesc: '+15% auto-harvest per completion',
    getDesc: (completions) => {
      const goal = CHALLENGE_DEFINITIONS.pacifist.getGoal(completions);
      return `Reach ${formatNumber(goal.reach)} without manual clicks`;
    }
  },
  survivor: {
    name: 'Survivor',
    desc: 'Survive to target without evacuating',
    icon: '🛡️',
    unlockAt: 1e10,
    maxCompletions: 10,
    getGoal: (completions) => ({
      reach: 1e10 * Math.pow(2, completions), // 10B, 20B, 40B, etc.
      noPrestige: true
    }),
    reward: { survivalBonus: 1.2 },
    rewardDesc: '+20% prestige currency per completion',
    getDesc: (completions) => {
      const goal = CHALLENGE_DEFINITIONS.survivor.getGoal(completions);
      return `Survive to ${formatNumber(goal.reach)} without evacuating`;
    }
  },
};

// Initialize challenge state
Object.keys(CHALLENGE_DEFINITIONS).forEach(key => {
  game.challenges[key] = {
    active: false,
    startTime: 0,
    clickCount: 0,
  };
  game.challengeCompletions[key] = 0;
});

// ============================================================================
// CANVAS & RENDERING
// ============================================================================

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
let width, height, centerX, centerY;

function resizeCanvas() {
  const container = document.getElementById('main-container');
  width = canvas.width = container.offsetWidth;
  height = canvas.height = container.offsetHeight;
  centerX = width / 2;
  centerY = height / 2;
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// ============================================================================
// NODE SYSTEM
// ============================================================================

function initNodes() {
  // Sun - off to the side, the next goal
  game.nodes.push({
    id: 'sun',
    name: 'Sol',
    type: 'star',
    x: 0, // Will be calculated based on Earth's orbit
    y: 0,
    radius: 60,
    color: '#ff0',
    state: 'uncontacted',
    isSun: true,
  });
  
  // Earth at center of camera - the current goal for Type 0→I
  game.nodes.push({
    id: 'earth',
    name: 'Earth',
    type: 'planet',
    x: centerX,
    y: centerY,
    radius: 40,
    color: '#0af',
    state: 'absorbed',
    harvestProgress: 0,
    resources: { energy: 0 },
    passiveEnergy: 10,
    isGoal: true,
    isHome: true,
  });
  
  // Resource nodes orbiting Earth
  const resourceNodes = [
    { name: 'Luna', distance: 100, angle: 0, radius: 15, color: '#aaa', passive: 3 },
    { name: 'Mars Colony', distance: 180, angle: 60, radius: 18, color: '#f44', passive: 5 },
    { name: 'Asteroid Mining', distance: 140, angle: 120, radius: 12, color: '#666', passive: 2 },
    { name: 'Venus Station', distance: 220, angle: 180, radius: 20, color: '#fa8', passive: 6 },
    { name: 'Jupiter Outpost', distance: 280, angle: 240, radius: 35, color: '#da8', passive: 12 },
    { name: 'Saturn Rings', distance: 320, angle: 300, radius: 30, color: '#fc8', passive: 10 },
  ];
  
  resourceNodes.forEach((node, i) => {
    const angle = (node.angle * Math.PI) / 180;
    game.nodes.push({
      id: `resource-${i}`,
      name: node.name,
      type: 'resource',
      x: centerX + Math.cos(angle) * node.distance,
      y: centerY + Math.sin(angle) * node.distance,
      radius: node.radius,
      color: node.color,
      state: 'uncontacted',
      harvestProgress: 0,
      regenerationTime: 0,  // Time until can harvest again
      maxRegenTime: 30,     // 30 seconds to regenerate
      harvestCount: 0,      // How many times harvested
      orbitDistance: node.distance,
      orbitAngle: node.angle,
      resources: { energy: Math.floor(Math.random() * 1000) + 500 },
      passiveEnergy: node.passive * 2,  // Double passive energy
    });
  });
}

function updateNodes(dt) {
  // Update Earth's orbit around sun (slow rotation)
  game.earthOrbitAngle += dt * 2; // degrees per second
  
  // Update sun position based on Earth's orbit
  const sunAngle = (game.earthOrbitAngle * Math.PI) / 180;
  const sun = game.nodes[0];
  sun.x = centerX + Math.cos(sunAngle) * game.sunDistance;
  sun.y = centerY + Math.sin(sunAngle) * game.sunDistance;
  
  game.nodes.forEach(node => {
    // Skip sun
    if (node.isSun) return;
    
    // Rotate orbiting nodes around Earth
    if (node.orbitDistance) {
      node.orbitAngle += dt * 10; // degrees per second
      const angle = (node.orbitAngle * Math.PI) / 180;
      node.x = centerX + Math.cos(angle) * node.orbitDistance;
      node.y = centerY + Math.sin(angle) * node.orbitDistance;
    }
    
    // Update harvesting (faster)
    if (node.state === 'harvesting') {
      node.harvestProgress += dt * 0.5; // 2 seconds to harvest (was 5)
      if (node.harvestProgress >= 1) {
        node.state = 'absorbed';
        node.harvestProgress = 0;
        
        // Determine if this was auto-harvest or manual
        const isAutoHarvest = node.autoHarvested || false;
        node.autoHarvested = false; // Reset flag
        
        let energyGain;
        if (isAutoHarvest) {
          // Auto-harvest: scale with energy rate (5 seconds worth of production)
          const autoHarvestBonus = getChallengeBonus('autoHarvest');
          energyGain = Math.floor(game.energyRate * 5 * autoHarvestBonus);
        } else {
          // Manual harvest: use click power with diminishing returns
          node.harvestCount++;
          const diminishingFactor = Math.pow(0.7, node.harvestCount - 1);
          energyGain = Math.floor(game.clickPower * diminishingFactor);
        }
        
        game.energy += energyGain;
        
        // Show harvest feedback
        const feedback = document.createElement('div');
        feedback.className = 'click-feedback';
        feedback.textContent = `+${formatNumber(energyGain)} ⚡`;
        feedback.style.left = (node.x + canvas.offsetLeft) + 'px';
        feedback.style.top = (node.y + canvas.offsetTop - 50) + 'px';
        feedback.style.color = isAutoHarvest ? '#0af' : '#ff0';
        document.body.appendChild(feedback);
        setTimeout(() => feedback.remove(), 1000);
        
        // Start regeneration timer
        node.regenerationTime = node.maxRegenTime;
      }
    }
    
    // Regeneration for absorbed nodes
    if (node.state === 'absorbed' && node.regenerationTime > 0) {
      node.regenerationTime -= dt;
      if (node.regenerationTime <= 0) {
        node.state = 'uncontacted'; // Can harvest again
        node.regenerationTime = 0;
      }
    }
    
    // Auto-harvest if auto-clicker owned
    if (game.upgrades.autoClicker.level > 0 && node.state === 'uncontacted') {
      // Auto-harvest from Earth
      const earth = game.nodes[1]; // Earth is second node
      const dist = Math.hypot(node.x - earth.x, node.y - earth.y);
      const reach = 50 + game.upgrades.autoClicker.level * 20;
      if (dist < reach) {
        node.state = 'harvesting';
        node.autoHarvested = true; // Flag for no diminishing returns
      }
    }
  });
}

function renderNodes() {
  game.nodes.forEach(node => {
    ctx.save();
    
    // Sun rendering
    if (node.isSun) {
      // Pulsing glow
      const pulse = Math.sin(Date.now() / 500) * 0.2 + 0.8;
      ctx.shadowBlur = 50 * pulse;
      ctx.shadowColor = '#ff0';
      
      // Sun body
      ctx.fillStyle = '#ff0';
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
      ctx.fill();
      
      // Sun label
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#ff0';
      ctx.font = '14px Courier New';
      ctx.textAlign = 'center';
      ctx.fillText('Sol (Next Goal)', node.x, node.y - node.radius - 15);
      
      return;
    }
    
    // Orbital path (skip for Earth)
    if (node.orbitDistance) {
      ctx.strokeStyle = 'rgba(0, 255, 255, 0.1)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(centerX, centerY, node.orbitDistance, 0, Math.PI * 2);
      ctx.stroke();
    }
    
    // Goal planet (Earth) - special rendering
    if (node.isGoal) {
      // Pulsing glow based on progress
      const pulse = Math.sin(Date.now() / 1000) * 0.2 + 0.8;
      const glowIntensity = 20 + (game.kardashevProgress * 30);
      ctx.shadowBlur = glowIntensity * pulse;
      ctx.shadowColor = node.color;
      
      // Planet body
      ctx.fillStyle = node.color;
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
      ctx.fill();
      
      // Progress ring around Earth
      if (game.kardashevProgress > 0) {
        ctx.strokeStyle = '#0ff';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius + 10, 0, Math.PI * 2 * game.kardashevProgress);
        ctx.stroke();
      }
      
      // Name
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#0ff';
      ctx.font = '16px Courier New';
      ctx.textAlign = 'center';
      ctx.fillText(node.name + ' (Current Goal)', node.x, node.y - node.radius - 15);
    } else {
      // Resource nodes
      if (node.state === 'absorbed') {
        // Check if regenerating
        if (node.regenerationTime > 0) {
          // Regenerating - pulsing blue
          const pulse = Math.sin(Date.now() / 300) * 0.3 + 0.7;
          ctx.shadowBlur = 10 * pulse;
          ctx.shadowColor = '#0af';
          ctx.fillStyle = '#0af';
        } else {
          // Ready to harvest again - bright glow
          ctx.shadowBlur = 20;
          ctx.shadowColor = '#0f0';
          ctx.fillStyle = node.color;
        }
      } else if (node.state === 'harvesting') {
        ctx.shadowBlur = 12;
        ctx.shadowColor = '#ff0';
        ctx.fillStyle = '#ff0';
      } else {
        // Uncontacted - dim
        ctx.fillStyle = '#444';
      }
      
      // Node circle
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
      ctx.fill();
      
      // Harvesting progress
      if (node.state === 'harvesting') {
        ctx.strokeStyle = '#ff0';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius + 5, 0, Math.PI * 2 * node.harvestProgress);
        ctx.stroke();
        
        // Energy tendrils to Earth
        const earth = game.nodes[1];
        ctx.strokeStyle = 'rgba(255, 255, 0, 0.5)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(node.x, node.y);
        ctx.lineTo(earth.x, earth.y);
        ctx.stroke();
      }
      
      // Node name and status
      if (node.state !== 'uncontacted' || node.harvestCount > 0) {
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#aaa';
        ctx.font = '11px Courier New';
        ctx.textAlign = 'center';
        ctx.fillText(node.name, node.x, node.y - node.radius - 8);
        
        // Show regeneration timer or ready status
        if (node.regenerationTime > 0) {
          ctx.fillStyle = '#0af';
          ctx.font = '10px Courier New';
          ctx.fillText(`⏱ ${Math.ceil(node.regenerationTime)}s`, node.x, node.y + node.radius + 15);
        } else if (node.state === 'absorbed' && node.harvestCount > 0) {
          ctx.fillStyle = '#0f0';
          ctx.font = '10px Courier New';
          ctx.fillText('✓ READY', node.x, node.y + node.radius + 15);
        }
        
        // Show harvest count
        if (node.harvestCount > 0) {
          ctx.fillStyle = '#888';
          ctx.font = '9px Courier New';
          ctx.fillText(`×${node.harvestCount}`, node.x, node.y + node.radius + 26);
        }
      }
    }
    
    ctx.restore();
  });
}

// ============================================================================
// CATACLYSM SYSTEM
// ============================================================================

function updateCataclysm() {
  // Determine which cataclysm we're approaching
  let nextCataclysm = null;
  let threshold = 0;
  
  if (game.reach >= 7e5 && game.reach < 1e9) {
    nextCataclysm = 'asteroid';
    threshold = 1e6;
  } else if (game.reach >= 7e8 && game.reach < 1e12) {
    nextCataclysm = 'solarFlare';
    threshold = 1e9;
  } else if (game.reach >= 7e11) {
    nextCataclysm = 'gammaRay';
    threshold = 1e12;
  }
  
  if (nextCataclysm) {
    game.cataclysm.type = nextCataclysm;
    game.cataclysm.progress = Math.min(1, game.reach / threshold);
    
    // Warning phase (70-90%)
    if (game.cataclysm.progress >= 0.7 && !game.cataclysm.warningShown) {
      game.cataclysm.warningShown = true;
      showCataclysmWarning(nextCataclysm);
    }
    
    // Crisis phase (90%+)
    if (game.cataclysm.progress >= 0.9) {
      game.cataclysm.crisisMode = true;
    }
  } else {
    game.cataclysm.type = null;
    game.cataclysm.progress = 0;
    game.cataclysm.warningShown = false;
    game.cataclysm.crisisMode = false;
  }
}

function showCataclysmWarning(type) {
  const data = CATACLYSM_THRESHOLDS[type];
  console.log(`⚠️ CATACLYSM WARNING: ${data.name}`);
  console.log(data.warning);
  
  // Show warning UI
  const warningEl = document.getElementById('cataclysm-warning');
  if (warningEl) {
    warningEl.style.display = 'block';
    warningEl.innerHTML = `
      <h3>⚠️ ${data.name} Approaching</h3>
      <p>${data.warning}</p>
      <p>Progress: ${Math.floor(game.cataclysm.progress * 100)}%</p>
    `;
  }
}

function getCataclysmInfo() {
  // Check which cataclysm we're approaching (70% warning threshold)
  if (game.reach >= 7e5 && game.reach < 1e6) {
    return { type: 'asteroid', ...CATACLYSM_THRESHOLDS.asteroid };
  } else if (game.reach >= 7e8 && game.reach < 1e9) {
    return { type: 'solarFlare', ...CATACLYSM_THRESHOLDS.solarFlare };
  } else if (game.reach >= 7e11 && game.reach < 1e12) {
    return { type: 'gammaRay', ...CATACLYSM_THRESHOLDS.gammaRay };
  }
  
  // Also check if we're past a threshold (can still evacuate)
  if (game.reach >= 1e6 && game.reach < 1e9) {
    return { type: 'asteroid', ...CATACLYSM_THRESHOLDS.asteroid };
  } else if (game.reach >= 1e9 && game.reach < 1e12) {
    return { type: 'solarFlare', ...CATACLYSM_THRESHOLDS.solarFlare };
  } else if (game.reach >= 1e12) {
    return { type: 'gammaRay', ...CATACLYSM_THRESHOLDS.gammaRay };
  }
  
  return null;
}

function getTimingBonus() {
  const progress = game.cataclysm.progress;
  if (progress < 0.90) return 1.5;
  if (progress < 0.95) return 1.25;
  if (progress < 0.99) return 1.1;
  return 1.0;
}

function getCostMultiplier() {
  if (!game.cataclysm.crisisMode) return 1.0;
  
  const progress = game.cataclysm.progress;
  if (progress < 0.95) return 1.5;
  if (progress < 0.99) return 3.0;
  return 10.0;
}

function calculatePrestigeCurrency(type) {
  const thresholds = {
    asteroid: 1e6,
    solarFlare: 1e9,
    gammaRay: 1e12,
  };
  
  const threshold = thresholds[type];
  const base = Math.pow(game.reach / threshold, 1/3);
  
  // Survival bonus
  let survivalBonus = 1.0;
  survivalBonus += game.upgrades.survivalBunker.level * 0.1;
  survivalBonus += game.upgrades.dataArchive.level * 0.05;
  survivalBonus += game.upgrades.seedVault.level * 0.15;
  
  // Early evacuation bonus
  const progress = game.cataclysm.progress;
  let evacuationBonus = 0;
  if (progress < 0.90) evacuationBonus = 0.5;
  else if (progress < 0.95) evacuationBonus = 0.25;
  else if (progress < 0.99) evacuationBonus = 0.1;
  
  return Math.floor(base * survivalBonus * (1 + evacuationBonus));
}

function triggerCataclysm(type) {
  const gain = calculatePrestigeCurrency(type);
  
  // Add prestige currency
  if (type === 'asteroid') game.archivedData += gain;
  else if (type === 'solarFlare') game.hardenedBlueprints += gain;
  else if (type === 'gammaRay') game.geneticArchives += gain;
  
  // Show cataclysm cutscene
  showCataclysmCutscene(type, gain);
  
  // Track prestige for hero achievement
  incrementAchievement('prestigeVeteran');
  incrementAchievement('survivor');
  
  // Reset progress
  resetAfterCataclysm(type);
  
  // Recalculate rates with new bonuses
  calculateRates();
  updateUpgradesList();
  saveGame();
}

function showCataclysmCutscene(type, gain) {
  const messages = {
    asteroid: [
      'IMPACT DETECTED',
      'Planetary surface compromised',
      'Evacuation protocols successful',
      `Archived Data recovered: +${gain}`,
      'Survivors emerge from bunkers...',
      'Rebuilding begins.'
    ],
    solarFlare: [
      'CORONAL MASS EJECTION',
      'EMP wave detected',
      'All electronics offline',
      `Hardened Blueprints preserved: +${gain}`,
      'Faraday-caged archives intact...',
      'Restoration in progress.'
    ],
    gammaRay: [
      'GAMMA RAY BURST',
      'Lethal radiation detected',
      'Surface sterilized',
      `Genetic Archives secured: +${gain}`,
      'DNA banks intact...',
      'Repopulation initiated.'
    ]
  };
  
  console.log(`\n=== ${CATACLYSM_THRESHOLDS[type].name.toUpperCase()} ===`);
  messages[type].forEach(msg => console.log(msg));
  console.log('===\n');
  
  // TODO: Add visual cutscene
}

function resetAfterCataclysm(type) {
  // Calculate what survives
  const matterSurvival = game.upgrades.survivalBunker.level * 0.05;
  const survivedMatter = game.matter * matterSurvival;
  
  // Reset resources
  game.energy = 0;
  game.matter = survivedMatter;
  game.info = 0;
  game.reach = 0;
  game.kardashevProgress = 0;
  
  // Reset most upgrades
  Object.keys(game.upgrades).forEach(key => {
    const upgrade = game.upgrades[key];
    // Keep survival structures
    if (!upgrade.isSurvival) {
      upgrade.level = 0;
    }
  });
  
  // Reset nodes
  game.nodes.forEach(node => {
    if (!node.isHome && !node.isSun) {
      node.state = 'uncontacted';
      node.harvestProgress = 0;
    }
  });
  
  // Reset cataclysm state
  game.cataclysm.active = false;
  game.cataclysm.type = null;
  game.cataclysm.progress = 0;
  game.cataclysm.warningShown = false;
  game.cataclysm.crisisMode = false;
}

// ============================================================================
// GAME LOOP
// ============================================================================

function gameLoop() {
  const now = Date.now();
  const dt = (now - game.lastUpdate) / 1000; // seconds
  game.lastUpdate = now;
  
  // Update resources
  game.energy += game.energyRate * dt;
  game.matter += game.matterRate * dt;
  game.info += game.infoRate * dt;
  game.reach += game.energyRate * dt;
  
  // Decay click combo
  if (Date.now() - game.lastClickTime > game.comboDecayTime) {
    game.clickCombo = 0;
  }
  
  // Update Kardashev progress
  game.kardashevProgress = Math.min(1, game.reach / KARDASHEV_THRESHOLDS[game.kardashevTier].next);
  
  // Update cataclysm state
  updateCataclysm();
  
  // Update nodes
  updateNodes(dt);
  
  // Update projects
  updateProjects(dt);
  
  // Check achievements
  checkAchievements();
  
  // Check challenge completion
  checkChallengeCompletion();
  
  // Render
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, width, height);
  
  // Stars background
  ctx.fillStyle = '#fff';
  for (let i = 0; i < 100; i++) {
    const x = (i * 137.5) % width;
    const y = (i * 217.3) % height;
    ctx.fillRect(x, y, 1, 1);
  }
  
  renderNodes();
  
  // Update UI
  updateUI();
  
  // Update upgrade affordability every 10 frames (without recreating cards)
  if (!game.upgradeUpdateCounter) game.upgradeUpdateCounter = 0;
  game.upgradeUpdateCounter++;
  if (game.upgradeUpdateCounter >= 10) {
    updateUpgradeAffordability();
    game.upgradeUpdateCounter = 0;
  }
  
  // Update challenge list every 30 frames (1 second at 30fps) if any challenge is active
  if (!game.challengeUpdateCounter) game.challengeUpdateCounter = 0;
  const hasActiveChallenge = Object.values(game.challenges).some(c => c.active);
  if (hasActiveChallenge) {
    game.challengeUpdateCounter++;
    if (game.challengeUpdateCounter >= 30) {
      updateChallengesList();
      game.challengeUpdateCounter = 0;
    }
  }
  
  requestAnimationFrame(gameLoop);
}
// ============================================================================
// PROJECTS SYSTEM FUNCTIONS
// ============================================================================

function updateProjects(dt) {
  game.activeProjects.forEach((projectKey, index) => {
    const project = game.projects[projectKey];
    const def = PROJECT_DEFINITIONS[projectKey];

    if (!project || !def) return;

    const elapsed = (Date.now() - project.startTime) / 1000;
    project.progress = Math.min(1, elapsed / def.buildTime);

    if (project.progress >= 1) {
      // Project complete!
      project.completed = true;
      project.progress = 1;
      game.activeProjects.splice(index, 1);

      // Apply rewards
      applyProjectRewards(projectKey);

      // Show notification
      showAchievementNotification(`${def.icon} ${def.name} Complete!`, def.rewardDesc, {
        icon: def.icon,
        windowId: 'projects-window'
      });

      // Recalculate rates
      calculateRates();
      updateProjectsList();
    }
  });
}

function startProject(projectKey) {
  const project = game.projects[projectKey];
  const def = PROJECT_DEFINITIONS[projectKey];

  if (!project || !def) return;
  if (project.completed) return;
  if (game.activeProjects.includes(projectKey)) return;

  // Check requirements
  const reqs = def.requirements;
  if (game.energy < reqs.energy || game.matter < (reqs.matter || 0) || game.info < (reqs.info || 0)) {
    return;
  }

  // Deduct costs
  game.energy -= reqs.energy;
  if (reqs.matter) game.matter -= reqs.matter;
  if (reqs.info) game.info -= reqs.info;

  // Start project
  project.startTime = Date.now();
  project.progress = 0;
  game.activeProjects.push(projectKey);

  updateProjectsList();
}

function applyProjectRewards(projectKey) {
  const def = PROJECT_DEFINITIONS[projectKey];
  if (!def || !def.rewards) return;

  // Store rewards for rate calculation
  if (!game.projectBonuses) game.projectBonuses = {};
  game.projectBonuses[projectKey] = def.rewards;
}

function getProjectBonus(type) {
  if (!game.projectBonuses) return 1;

  let multiplier = 1;
  Object.values(game.projectBonuses).forEach(rewards => {
    if (rewards[type]) {
      multiplier *= rewards[type];
    }
    if (rewards.allRates && type.endsWith('Rate')) {
      multiplier *= rewards.allRates;
    }
  });

  return multiplier;
}

function updateProjectsList() {
  const container = document.getElementById('projects-list');
  if (!container) return;

  container.innerHTML = '';

  Object.keys(PROJECT_DEFINITIONS).forEach(key => {
    const def = PROJECT_DEFINITIONS[key];
    const project = game.projects[key];

    // Check unlock
    if (game.reach < def.unlockAt) return;
    if (project.completed) return;

    const reqs = def.requirements;
    const canAfford = game.energy >= reqs.energy &&
                     game.matter >= (reqs.matter || 0) &&
                     game.info >= (reqs.info || 0);

    const isActive = game.activeProjects.includes(key);

    const card = document.createElement('div');
    card.className = 'project-card' + (canAfford && !isActive ? '' : ' disabled');

    let content = `
      <h3>${def.icon} ${def.name}</h3>
      <p>${def.desc}</p>
      <div class="project-requirements">
        <div>⚡ ${formatNumber(reqs.energy)}</div>
        ${reqs.matter ? `<div>🔩 ${formatNumber(reqs.matter)}</div>` : ''}
        ${reqs.info ? `<div>💡 ${formatNumber(reqs.info)}</div>` : ''}
      </div>
      <div class="project-time">⏱ ${def.buildTime}s</div>
      <div class="project-reward">${def.rewardDesc}</div>
    `;

    if (isActive) {
      const percent = Math.floor(project.progress * 100);
      content += `
        <div class="project-progress-bar">
          <div class="project-progress-fill" style="width: ${percent}%"></div>
        </div>
        <div class="project-progress-text">${percent}%</div>
      `;
    } else {
      content += `<button class="project-start-btn" ${canAfford ? '' : 'disabled'}>Start Project</button>`;
    }

    card.innerHTML = content;

    if (!isActive) {
      const btn = card.querySelector('.project-start-btn');
      if (btn) {
        btn.addEventListener('click', () => startProject(key));
      }
    }

    container.appendChild(card);
  });
}

// ============================================================================
// TECH TREE FUNCTIONS
// ============================================================================

function researchTech(techKey) {
  const tech = game.techs[techKey];
  const def = TECH_DEFINITIONS[techKey];

  if (!tech || !def) return;
  if (tech.researched) return;

  // Check requirements
  if (game.reach < def.requirements.reach) return;

  // Check prerequisite techs
  if (def.requirements.techs) {
    const allResearched = def.requirements.techs.every(t => game.techs[t]?.researched);
    if (!allResearched) return;
  }

  // Check cost
  if (game.info < def.cost.info) return;

  // Deduct cost
  game.info -= def.cost.info;

  // Research tech
  tech.researched = true;

  // Show notification
  showAchievementNotification(`${def.icon} ${def.name} Researched!`, def.desc, {
    icon: def.icon,
    windowId: 'tech-tree-window'
  });

  // Recalculate rates
  calculateRates();
  updateTechTree();
}

function getTechBonus(type) {
  let multiplier = 1;

  Object.keys(TECH_DEFINITIONS).forEach(key => {
    const tech = game.techs[key];
    const def = TECH_DEFINITIONS[key];

    if (tech.researched && def.bonus) {
      if (def.bonus[type]) {
        multiplier *= def.bonus[type];
      }
      if (def.bonus.allRates && type.endsWith('Rate')) {
        multiplier *= def.bonus.allRates;
      }
    }
  });

  return multiplier;
}

// Tech Tree Canvas State
const techTreeState = {
  canvas: null,
  ctx: null,
  offsetX: 0,
  offsetY: 0,
  scale: 1,
  isDragging: false,
  dragStartX: 0,
  dragStartY: 0,
  hoveredNode: null,
  selectedNode: null,
};

function initTechTreeCanvas() {
  const svg = document.getElementById('tech-tree-svg');
  const group = document.getElementById('tech-tree-group');
  if (!svg || !group) return;
  
  techTreeState.svg = svg;
  techTreeState.group = group;
  
  // Set initial viewBox (will be updated on render)
  svg.setAttribute('viewBox', '-500 -500 1000 1000');
  
  let isPanning = false;
  let startPoint = { x: 0, y: 0 };
  let currentViewBox = { x: -500, y: -500, width: 1000, height: 1000 };
  
  // Mouse events for pan/zoom
  svg.addEventListener('mousedown', (e) => {
    const clickedNode = e.target.closest('[data-tech-key]');
    if (clickedNode) {
      const techKey = clickedNode.dataset.techKey;
      techTreeState.selectedNode = techKey;
      handleTechNodeClick(techKey);
      updateTechTree();
    } else {
      isPanning = true;
      startPoint = { x: e.clientX, y: e.clientY };
      svg.style.cursor = 'grabbing';
    }
  });
  
  svg.addEventListener('mousemove', (e) => {
    if (isPanning) {
      const dx = (e.clientX - startPoint.x) * (currentViewBox.width / svg.clientWidth);
      const dy = (e.clientY - startPoint.y) * (currentViewBox.height / svg.clientHeight);
      
      currentViewBox.x -= dx;
      currentViewBox.y -= dy;
      
      svg.setAttribute('viewBox', `${currentViewBox.x} ${currentViewBox.y} ${currentViewBox.width} ${currentViewBox.height}`);
      
      startPoint = { x: e.clientX, y: e.clientY };
    } else {
      // Check hover
      const hoveredNode = e.target.closest('[data-tech-key]');
      const techKey = hoveredNode?.dataset.techKey || null;
      
      if (techKey !== techTreeState.hoveredNode) {
        techTreeState.hoveredNode = techKey;
        updateTechTree();
        
        if (techKey) {
          showTechTooltip(techKey);
        } else {
          hideTechTooltip();
        }
      }
    }
  });
  
  svg.addEventListener('mouseup', () => {
    isPanning = false;
    svg.style.cursor = 'grab';
  });
  
  svg.addEventListener('mouseleave', () => {
    isPanning = false;
    svg.style.cursor = 'grab';
    hideTechTooltip();
  });
  
  svg.addEventListener('wheel', (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 1.1 : 0.9;
    
    // Zoom towards mouse position
    const rect = svg.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const svgX = currentViewBox.x + (mouseX / svg.clientWidth) * currentViewBox.width;
    const svgY = currentViewBox.y + (mouseY / svg.clientHeight) * currentViewBox.height;
    
    currentViewBox.width *= delta;
    currentViewBox.height *= delta;
    
    currentViewBox.x = svgX - (mouseX / svg.clientWidth) * currentViewBox.width;
    currentViewBox.y = svgY - (mouseY / svg.clientHeight) * currentViewBox.height;
    
    svg.setAttribute('viewBox', `${currentViewBox.x} ${currentViewBox.y} ${currentViewBox.width} ${currentViewBox.height}`);
  });
  
  // Reset view button
  const resetBtn = document.getElementById('tech-tree-reset-view');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      currentViewBox = { x: -500, y: -500, width: 1000, height: 1000 };
      svg.setAttribute('viewBox', `${currentViewBox.x} ${currentViewBox.y} ${currentViewBox.width} ${currentViewBox.height}`);
      updateTechTree();
    });
  }
  
  // Tier selector
  const tierSelect = document.getElementById('tech-tier-select');
  if (tierSelect) {
    tierSelect.addEventListener('change', () => {
      updateTechTree();
    });
  }
  
  updateTechTree();
}

function getTechNodeAtPosition(x, y) {
  const currentTier = parseInt(document.getElementById('tech-tier-select')?.value || '0');
  
  for (const key of Object.keys(TECH_DEFINITIONS)) {
    const def = TECH_DEFINITIONS[key];
    if (def.tier !== currentTier) continue;
    
    const pos = getTechNodePosition(key);
    const dx = x - pos.x;
    const dy = y - pos.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist < 30 * techTreeState.scale) {
      return key;
    }
  }
  
  return null;
}

function getTechNodePosition(techKey) {
  const def = TECH_DEFINITIONS[techKey];
  const angle = (def.position.angle * Math.PI) / 180;
  const radius = def.position.ring * 200; // World space - fixed size
  
  // World space coordinates (center at 0,0)
  const worldX = Math.cos(angle) * radius;
  const worldY = Math.sin(angle) * radius;
  
  // Transform to screen space
  return worldToScreen(worldX, worldY);
}

function worldToScreen(worldX, worldY) {
  // Apply scale and offset to convert world coords to screen coords
  const canvas = techTreeState.canvas;
  const screenX = worldX * techTreeState.scale + techTreeState.offsetX;
  const screenY = worldY * techTreeState.scale + techTreeState.offsetY;
  return { x: screenX, y: screenY };
}

function screenToWorld(screenX, screenY) {
  // Convert screen coords back to world coords
  const worldX = (screenX - techTreeState.offsetX) / techTreeState.scale;
  const worldY = (screenY - techTreeState.offsetY) / techTreeState.scale;
  return { x: worldX, y: worldY };
}

function handleTechNodeClick(techKey) {
  const tech = game.techs[techKey];
  const def = TECH_DEFINITIONS[techKey];
  
  if (tech.researched) return;
  
  // Check if unlocked
  const meetsReach = game.reach >= def.requirements.reach;
  const meetsPrereqs = !def.requirements.techs ||
                      def.requirements.techs.every(t => game.techs[t]?.researched);
  const unlocked = meetsReach && meetsPrereqs;
  
  if (!unlocked) return;
  
  // Try to research
  researchTech(techKey);
}

function showTechTooltip(techKey) {
  const tooltip = document.getElementById('tech-tooltip');
  if (!tooltip) return;
  
  const def = TECH_DEFINITIONS[techKey];
  const tech = game.techs[techKey];
  
  const meetsReach = game.reach >= def.requirements.reach;
  const meetsPrereqs = !def.requirements.techs ||
                      def.requirements.techs.every(t => game.techs[t]?.researched);
  const unlocked = meetsReach && meetsPrereqs;
  const canAfford = game.info >= def.cost.info;
  
  let statusText = '';
  if (tech.researched) {
    statusText = '<div style="color: #0f0;">✓ RESEARCHED</div>';
  } else if (!unlocked) {
    statusText = '<div style="color: #888;">🔒 LOCKED</div>';
    if (!meetsReach) {
      statusText += `<div style="color: #666; font-size: 10px;">Reach: ${formatNumber(def.requirements.reach)}</div>`;
    }
    if (def.requirements.techs && !meetsPrereqs) {
      statusText += '<div style="color: #666; font-size: 10px;">Requires prerequisites</div>';
    }
  } else if (!canAfford) {
    statusText = '<div style="color: #fa0;">Insufficient Info</div>';
  } else {
    statusText = '<div style="color: #0f0;">Click to research</div>';
  }
  
  tooltip.innerHTML = `
    <div style="font-size: 14px; color: #0ff; margin-bottom: 5px;">${def.name}</div>
    <div style="font-size: 11px; color: #aaa; margin-bottom: 5px;">${def.desc}</div>
    <div style="font-size: 11px; color: #0aa; margin-bottom: 5px;">Cost: ${formatNumber(def.cost.info)} 💡</div>
    ${statusText}
  `;
  
  // Anchor to bottom-right corner of tech tree window
  tooltip.style.display = 'block';
  tooltip.style.right = '10px';
  tooltip.style.bottom = '10px';
  tooltip.style.left = 'auto';
  tooltip.style.top = 'auto';
}

function hideTechTooltip() {
  const tooltip = document.getElementById('tech-tooltip');
  if (tooltip) {
    tooltip.style.display = 'none';
  }
}

function updateTechTree() {
  const group = techTreeState.group;
  if (!group) return;
  
  const currentTier = parseInt(document.getElementById('tech-tier-select')?.value || '0');
  
  // Clear existing content
  group.innerHTML = '';
  
  // Branch colors
  const branchColors = {
    computing: '#0af',
    biotech: '#0f8',
    energy: '#fa0',
    materials: '#a0f',
    propulsion: '#f08',
    sensors: '#0ff',
    core: '#fff',
  };
  
  // Draw connection lines first
  Object.keys(TECH_DEFINITIONS).forEach(key => {
    const def = TECH_DEFINITIONS[key];
    if (def.tier !== currentTier) return;
    
    const angle = (def.position.angle * Math.PI) / 180;
    const radius = def.position.ring * 200;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    
    const branchColor = branchColors[def.branch] || '#0af';
    
    // Draw lines to prerequisites
    if (def.requirements.techs) {
      def.requirements.techs.forEach(prereqKey => {
        const prereqDef = TECH_DEFINITIONS[prereqKey];
        if (prereqDef && prereqDef.tier === currentTier) {
          const prereqAngle = (prereqDef.position.angle * Math.PI) / 180;
          const prereqRadius = prereqDef.position.ring * 200;
          const prereqX = Math.cos(prereqAngle) * prereqRadius;
          const prereqY = Math.sin(prereqAngle) * prereqRadius;
          
          const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
          line.setAttribute('x1', prereqX);
          line.setAttribute('y1', prereqY);
          line.setAttribute('x2', x);
          line.setAttribute('y2', y);
          line.setAttribute('stroke', game.techs[key].researched ? branchColor : 'rgba(100, 100, 120, 0.3)');
          line.setAttribute('stroke-width', '2');
          group.appendChild(line);
        }
      });
    }
    
    // Draw line to center for ring 1 nodes
    if (def.position.ring === 1) {
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', '0');
      line.setAttribute('y1', '0');
      line.setAttribute('x2', x);
      line.setAttribute('y2', y);
      line.setAttribute('stroke', game.techs[key].researched ? branchColor : 'rgba(100, 100, 120, 0.3)');
      line.setAttribute('stroke-width', '2');
      group.appendChild(line);
    }
  });
  
  // Draw center node
  const centerLabel = currentTier === 0 ? 'Type 0' : currentTier === 1 ? 'Type I' : 'Type II';
  const centerCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  centerCircle.setAttribute('cx', '0');
  centerCircle.setAttribute('cy', '0');
  centerCircle.setAttribute('r', '50');
  centerCircle.setAttribute('fill', '#0af');
  centerCircle.setAttribute('stroke', '#0ff');
  centerCircle.setAttribute('stroke-width', '3');
  group.appendChild(centerCircle);
  
  const centerText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  centerText.setAttribute('x', '0');
  centerText.setAttribute('y', '0');
  centerText.setAttribute('text-anchor', 'middle');
  centerText.setAttribute('dominant-baseline', 'middle');
  centerText.setAttribute('fill', '#000');
  centerText.setAttribute('font-family', 'Courier New');
  centerText.setAttribute('font-size', '14');
  centerText.setAttribute('font-weight', 'bold');
  centerText.textContent = centerLabel;
  group.appendChild(centerText);
  
  // Draw tech nodes
  Object.keys(TECH_DEFINITIONS).forEach(key => {
    const def = TECH_DEFINITIONS[key];
    const tech = game.techs[key];
    if (def.tier !== currentTier) return;
    
    const angle = (def.position.angle * Math.PI) / 180;
    const radius = def.position.ring * 200;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    
    const branchColor = branchColors[def.branch] || '#0af';
    
    // Check status
    const meetsReach = game.reach >= def.requirements.reach;
    const meetsPrereqs = !def.requirements.techs ||
                        def.requirements.techs.every(t => game.techs[t]?.researched);
    const unlocked = meetsReach && meetsPrereqs;
    const canAfford = game.info >= def.cost.info;
    
    // Node color based on state
    let fillColor, strokeColor;
    if (tech.researched) {
      fillColor = branchColor;
      strokeColor = '#fff';
    } else if (!unlocked) {
      fillColor = '#111';
      strokeColor = '#333';
    } else if (canAfford) {
      fillColor = '#024';
      strokeColor = branchColor;
    } else {
      fillColor = '#012';
      strokeColor = '#044';
    }
    
    // Create node group
    const nodeGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    nodeGroup.setAttribute('data-tech-key', key);
    nodeGroup.style.cursor = 'pointer';
    
    // Highlight if hovered or selected
    if (key === techTreeState.hoveredNode || key === techTreeState.selectedNode) {
      const glow = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      glow.setAttribute('cx', x);
      glow.setAttribute('cy', y);
      glow.setAttribute('r', '35');
      glow.setAttribute('fill', 'none');
      glow.setAttribute('stroke', strokeColor);
      glow.setAttribute('stroke-width', '2');
      glow.setAttribute('opacity', '0.5');
      nodeGroup.appendChild(glow);
    }
    
    // Draw node circle
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', x);
    circle.setAttribute('cy', y);
    circle.setAttribute('r', '30');
    circle.setAttribute('fill', fillColor);
    circle.setAttribute('stroke', strokeColor);
    circle.setAttribute('stroke-width', '2');
    nodeGroup.appendChild(circle);
    
    // Draw abbreviated name in node
    const words = def.name.split(' ');
    const abbrev = words.length > 1 ? words.map(w => w[0]).join('') : def.name.substring(0, 3);
    
    const abbrevText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    abbrevText.setAttribute('x', x);
    abbrevText.setAttribute('y', y);
    abbrevText.setAttribute('text-anchor', 'middle');
    abbrevText.setAttribute('dominant-baseline', 'middle');
    abbrevText.setAttribute('fill', tech.researched ? '#000' : '#fff');
    abbrevText.setAttribute('font-family', 'Courier New');
    abbrevText.setAttribute('font-size', '10');
    abbrevText.textContent = abbrev.toUpperCase();
    nodeGroup.appendChild(abbrevText);
    
    // Draw full name below node
    const nameText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    nameText.setAttribute('x', x);
    nameText.setAttribute('y', y + 45);
    nameText.setAttribute('text-anchor', 'middle');
    nameText.setAttribute('fill', '#aaa');
    nameText.setAttribute('font-family', 'Courier New');
    nameText.setAttribute('font-size', '9');
    nameText.textContent = def.name;
    nodeGroup.appendChild(nameText);
    
    group.appendChild(nodeGroup);
  });
}

// ============================================================================
// CHALLENGES FUNCTIONS
// ============================================================================

function startChallenge(challengeKey) {
  const challenge = game.challenges[challengeKey];
  const def = CHALLENGE_DEFINITIONS[challengeKey];

  if (!challenge || !def) return;
  if (challenge.active) return;
  if (game.challengeCompletions[challengeKey] >= def.maxCompletions) return;

  if (!confirm(`Start ${def.name} challenge?\n\n${def.desc}\n\nThis will HARD RESET all progress!`)) {
    return;
  }

  // Hard reset
  hardReset();

  // Activate challenge
  challenge.active = true;
  challenge.startTime = Date.now();
  challenge.clickCount = 0;

  showAchievementNotification(`Challenge Started: ${def.name}`, def.desc);
  updateChallengesList();
}

function checkChallengeCompletion() {
  Object.keys(CHALLENGE_DEFINITIONS).forEach(key => {
    const challenge = game.challenges[key];
    const def = CHALLENGE_DEFINITIONS[key];

    if (!challenge.active) return;

    const completions = game.challengeCompletions[key] || 0;
    const goal = def.getGoal(completions);
    let completed = false;
    let failed = false;

    // Check failure conditions FIRST (before reach goal)
    if (goal.timeLimit) {
      const elapsed = (Date.now() - challenge.startTime) / 1000;
      if (elapsed > goal.timeLimit) {
        failed = true;
      }
    }
    
    if (goal.maxUpgrades) {
      const totalLevels = Object.values(game.upgrades).reduce((sum, u) => sum + u.level, 0);
      if (totalLevels > goal.maxUpgrades) {
        failed = true;
      }
    }
    
    if (goal.noClicks && challenge.clickCount > 0) {
      failed = true;
    }
    
    if (goal.noPrestige) {
      if (game.archivedData > 0 || game.hardenedBlueprints > 0 || game.geneticArchives > 0) {
        failed = true;
      }
    }

    // Check completion (only if not failed and reached goal)
    if (!failed && goal.reach && game.reach >= goal.reach) {
      completed = true;
    }

    if (completed) {
      completeChallenge(key);
    } else if (failed) {
      failChallenge(key);
    }
  });
}

function completeChallenge(challengeKey) {
  const challenge = game.challenges[challengeKey];
  const def = CHALLENGE_DEFINITIONS[challengeKey];

  challenge.active = false;
  game.challengeCompletions[challengeKey]++;

  showAchievementNotification(
    `${def.icon} Challenge Complete!`,
    `${def.name} completed ${game.challengeCompletions[challengeKey]}/${def.maxCompletions} times!`,
    { icon: def.icon, windowId: 'challenges-window' }
  );

  // Recalculate rates with new bonuses
  calculateRates();
  updateChallengesList();
  saveGame();
}

function failChallenge(challengeKey) {
  const challenge = game.challenges[challengeKey];
  const def = CHALLENGE_DEFINITIONS[challengeKey];

  challenge.active = false;

  showAchievementNotification(
    `Challenge Failed: ${def.name}`,
    'Better luck next time!',
    { icon: '❌', type: 'error', windowId: 'challenges-window' }
  );

  updateChallengesList();
}

function getChallengeBonus(type) {
  let multiplier = 1;
  let reduction = 1;

  Object.keys(CHALLENGE_DEFINITIONS).forEach(key => {
    const def = CHALLENGE_DEFINITIONS[key];
    const completions = game.challengeCompletions[key] || 0;

    if (completions > 0 && def.reward) {
      if (def.reward[type]) {
        multiplier *= Math.pow(def.reward[type], completions);
      }
      if (type === 'costReduction' && def.reward.costReduction) {
        reduction *= Math.pow(def.reward.costReduction, completions);
      }
    }
  });

  return type === 'costReduction' ? reduction : multiplier;
}

function updateChallengesList() {
  const container = document.getElementById('challenges-list');
  if (!container) return;

  container.innerHTML = '';

  Object.keys(CHALLENGE_DEFINITIONS).forEach(key => {
    const def = CHALLENGE_DEFINITIONS[key];
    const challenge = game.challenges[key];
    const completions = game.challengeCompletions[key] || 0;

    // Check unlock
    if (game.reach < def.unlockAt && completions === 0) return;

    const maxed = completions >= def.maxCompletions;
    const goal = def.getGoal(completions);
    const desc = def.getDesc ? def.getDesc(completions) : def.desc;

    const card = document.createElement('div');
    card.className = 'challenge-card' + (challenge.active ? ' active' : maxed ? ' maxed' : '');

    let statusHtml = '';
    if (challenge.active) {
      // Show detailed progress for active challenge
      let progress = 0;
      let progressText = '';
      
      if (goal.reach) {
        progress = Math.min(100, (game.reach / goal.reach) * 100);
        progressText = `Reach: ${formatNumber(game.reach)} / ${formatNumber(goal.reach)}`;
      }
      
      if (goal.timeLimit) {
        const elapsed = (Date.now() - challenge.startTime) / 1000;
        const remaining = Math.max(0, goal.timeLimit - elapsed);
        const minutes = Math.floor(remaining / 60);
        const seconds = Math.floor(remaining % 60);
        progressText += `<br>Time: ${minutes}:${seconds.toString().padStart(2, '0')}`;
      }
      
      if (goal.maxUpgrades) {
        const totalLevels = Object.values(game.upgrades).reduce((sum, u) => sum + u.level, 0);
        progressText += `<br>Upgrades: ${totalLevels} / ${goal.maxUpgrades}`;
      }
      
      if (goal.noClicks) {
        progressText += `<br>Clicks: ${challenge.clickCount} (must be 0)`;
      }
      
      statusHtml = `
        <div class="challenge-active-status">
          <div class="challenge-progress-bar">
            <div class="challenge-progress-fill" style="width: ${progress}%"></div>
          </div>
          <div class="challenge-progress-details">${progressText}</div>
        </div>
      `;
    } else if (maxed) {
      statusHtml = '<div class="challenge-maxed">✓ MAXED</div>';
    } else {
      statusHtml = '<button class="challenge-start-btn">Start Challenge</button>';
    }

    card.innerHTML = `
      <h3>${def.icon} ${def.name}</h3>
      <p>${desc}</p>
      <div class="challenge-completions">${completions}/${def.maxCompletions} completions</div>
      <div class="challenge-reward">${def.rewardDesc}</div>
      ${statusHtml}
    `;

    if (!challenge.active && !maxed) {
      const btn = card.querySelector('.challenge-start-btn');
      if (btn) {
        btn.addEventListener('click', () => startChallenge(key));
      }
    }

    container.appendChild(card);
  });
}

function hardReset() {
  // Reset everything except hero card and challenge completions
  game.energy = 0;
  game.matter = 0;
  game.info = 0;
  game.reach = 0;
  game.kardashevProgress = 0;
  game.kardashevTier = 0;

  // Reset prestige currencies
  game.archivedData = 0;
  game.hardenedBlueprints = 0;
  game.geneticArchives = 0;

  // Reset upgrades
  Object.keys(game.upgrades).forEach(key => {
    game.upgrades[key].level = 0;
  });

  // Reset projects
  Object.keys(game.projects).forEach(key => {
    game.projects[key].completed = false;
    game.projects[key].progress = 0;
  });
  game.activeProjects = [];
  game.projectBonuses = {};

  // Reset techs
  Object.keys(game.techs).forEach(key => {
    game.techs[key].researched = false;
  });

  // Reset nodes
  game.nodes.forEach(node => {
    if (!node.isHome && !node.isSun) {
      node.state = 'uncontacted';
      node.harvestProgress = 0;
      node.harvestCount = 0;
      node.regenerationTime = 0;
    }
  });

  // Reset achievements (but keep hero card)
  game.achievements = {
    bulkBuyer: false,
    maxBuyer: false,
    nodeHarvester: false,
  };
  game.totalUpgradesPurchased = 0;

  calculateRates();
  updateUpgradesList();
  updateProjectsList();
  updateTechTree();
  updateChallengesList();
}

// ============================================================================
// GAME LOOP
// ============================================================================

// ============================================================================
// UI UPDATES
// ============================================================================

function formatNumber(num) {
  if (num < 1000) return Math.floor(num).toString();
  if (num < 1e6) return (num / 1e3).toFixed(2) + 'K';
  if (num < 1e9) return (num / 1e6).toFixed(2) + 'M';
  if (num < 1e12) return (num / 1e9).toFixed(2) + 'B';
  if (num < 1e15) return (num / 1e12).toFixed(2) + 'T';
  return num.toExponential(2);
}

function updateUI() {
  // Resources
  document.getElementById('energy-amount').textContent = formatNumber(game.energy);
  document.getElementById('energy-rate').textContent = formatNumber(game.energyRate);
  
  // Show/hide secondary resources
  if (game.reach >= 1e6) {
    document.getElementById('matter-resource').style.display = 'flex';
    document.getElementById('matter-amount').textContent = formatNumber(game.matter);
    document.getElementById('matter-rate').textContent = formatNumber(game.matterRate);
  }
  
  if (game.reach >= 1e9) {
    document.getElementById('info-resource').style.display = 'flex';
    document.getElementById('info-amount').textContent = formatNumber(game.info);
    document.getElementById('info-rate').textContent = formatNumber(game.infoRate);
  }
  
  // Kardashev progress
  const tierData = KARDASHEV_THRESHOLDS[game.kardashevTier];
  const nextThreshold = tierData.next;
  game.kardashevProgress = Math.min(1, game.reach / nextThreshold);
  
  document.getElementById('kardashev-progress').style.width = (game.kardashevProgress * 100) + '%';
  document.getElementById('kardashev-label').textContent = `Type ${game.kardashevTier} Civilization`;
  document.getElementById('kardashev-goal').textContent = `Goal: ${tierData.goal}`;
  document.getElementById('kardashev-target').textContent = `${formatNumber(game.reach)} / ${formatNumber(nextThreshold)}`;
  
  // Stats panel
  document.getElementById('stat-reach').textContent = formatNumber(game.reach);
  const totalHarvests = game.nodes.reduce((sum, n) => sum + (n.harvestCount || 0), 0);
  document.getElementById('stat-harvests').textContent = totalHarvests;
  document.getElementById('stat-combo').textContent = `×${game.clickCombo || 1}`;
  
  // Prestige bonuses in header
  const hasPrestige = game.archivedData > 0 || game.hardenedBlueprints > 0 || game.geneticArchives > 0;
  const hudPrestige = document.getElementById('hud-prestige');
  
  if (hasPrestige) {
    hudPrestige.style.display = 'flex';
    
    if (game.archivedData > 0) {
      document.getElementById('archived-data-display').style.display = 'flex';
      document.getElementById('archived-data-amount').textContent = game.archivedData.toFixed(1);
    }
    
    if (game.hardenedBlueprints > 0) {
      document.getElementById('blueprints-display').style.display = 'flex';
      document.getElementById('blueprints-amount').textContent = game.hardenedBlueprints.toFixed(1);
    }
    
    if (game.geneticArchives > 0) {
      document.getElementById('archives-display').style.display = 'flex';
      document.getElementById('archives-amount').textContent = game.geneticArchives.toFixed(1);
    }
  }
  
  // Cataclysm warning
  const cataclysm = getCataclysmInfo();
  if (cataclysm) {
    // Show cataclysm window
    if (WindowManager.windows['cataclysm'] && !WindowManager.windows['cataclysm'].state.visible) {
      WindowManager.showWindow('cataclysm');
    }
    
    document.getElementById('cataclysm-type').textContent = cataclysm.name;
    document.getElementById('cataclysm-progress').textContent = Math.floor(game.cataclysm.progress * 100);
    
    const gain = calculatePrestigeCurrency(cataclysm.type);
    document.getElementById('prestige-gain').textContent = formatNumber(gain);
    
    const timingBonus = getTimingBonus();
    document.getElementById('timing-bonus').textContent = `×${timingBonus.toFixed(2)}`;
    
    document.getElementById('evacuate-btn').disabled = gain < 1;
  } else {
    // Hide cataclysm window
    if (WindowManager.windows['cataclysm'] && WindowManager.windows['cataclysm'].state.visible) {
      WindowManager.hideWindow('cataclysm');
    }
  }
  
  // Challenge indicator
  const activeChallenge = Object.keys(game.challenges).find(key => game.challenges[key].active);
  const hudChallenge = document.getElementById('hud-challenge');
  
  if (activeChallenge) {
    const challenge = game.challenges[activeChallenge];
    const def = CHALLENGE_DEFINITIONS[activeChallenge];
    const completions = game.challengeCompletions[activeChallenge] || 0;
    const goal = def.getGoal(completions);
    
    hudChallenge.style.display = 'flex';
    
    // Build challenge name with key info
    let challengeText = def.name;
    
    if (goal.maxUpgrades) {
      const totalLevels = Object.values(game.upgrades).reduce((sum, u) => sum + u.level, 0);
      challengeText += ` (${totalLevels}/${goal.maxUpgrades})`;
    } else if (goal.timeLimit) {
      const elapsed = (Date.now() - challenge.startTime) / 1000;
      const remaining = Math.max(0, goal.timeLimit - elapsed);
      const minutes = Math.floor(remaining / 60);
      const seconds = Math.floor(remaining % 60);
      challengeText += ` (${minutes}:${seconds.toString().padStart(2, '0')})`;
    } else if (goal.noClicks) {
      challengeText += ` (${challenge.clickCount} clicks)`;
    }
    
    document.getElementById('challenge-name').textContent = challengeText;
    
    // Calculate progress based on challenge type
    let progress = 0;
    if (goal.reach) {
      progress = Math.min(100, (game.reach / goal.reach) * 100);
    }
    
    document.getElementById('challenge-progress-text').textContent = `${Math.floor(progress)}%`;
  } else {
    hudChallenge.style.display = 'none';
  }
}

function updateUpgradesList() {
  const categories = ['energy', 'matter', 'info'];
  const costMultiplier = getCostMultiplier();
  
  categories.forEach(category => {
    const container = document.getElementById(`${category}-upgrades`);
    
    // Store existing cards to avoid recreating
    const existingCards = {};
    container.querySelectorAll('.upgrade-card').forEach(card => {
      const key = card.dataset.upgradeKey;
      if (key) existingCards[key] = card;
    });
    
    const newCards = [];
    
    Object.keys(game.upgrades).forEach(key => {
      const upgrade = game.upgrades[key];
      const def = UPGRADE_DEFINITIONS[key];
      
      // Filter by category
      if (upgrade.category !== category) return;
      
      // Check unlock
      if (upgrade.unlockAt && game.reach < upgrade.unlockAt) return;
      
      // Check max level
      if (upgrade.maxLevel && upgrade.level >= upgrade.maxLevel) return;
      
      const baseCost = Math.floor(upgrade.baseCost * Math.pow(upgrade.costMult, upgrade.level));
      const cost = Math.floor(baseCost * costMultiplier);
      const resourceType = def.resource || 'energy';
      const currentResource = resourceType === 'energy' ? game.energy :
                              resourceType === 'matter' ? game.matter :
                              game.info;
      
      // Calculate cost for current buy mode
      let displayCost = cost;
      let buyAmount = 1;
      
      if (game.buyMode !== 1) {
        let totalCost = 0;
        let count = 0;
        let tempLevel = upgrade.level;
        const targetCount = game.buyMode === 'max' ? 1000 : game.buyMode;
        
        while (count < targetCount) {
          if (upgrade.maxLevel && tempLevel >= upgrade.maxLevel) break;
          
          const tempBaseCost = Math.floor(upgrade.baseCost * Math.pow(upgrade.costMult, tempLevel));
          const tempCost = Math.floor(tempBaseCost * costMultiplier);
          
          if (game.buyMode === 'max' && totalCost + tempCost > currentResource) break;
          
          totalCost += tempCost;
          count++;
          tempLevel++;
        }
        
        // If we can't afford any, show the cost of 1
        if (count === 0) {
          displayCost = cost;
          buyAmount = 1;
        } else {
          displayCost = totalCost;
          buyAmount = count;
        }
      }
      
      const canAfford = currentResource >= displayCost && buyAmount > 0;
      
      // Calculate production display
      let productionText = '';
      if (upgrade.baseProduction > 0) {
        const production = upgrade.baseProduction;
        productionText = `<p>+${formatNumber(production)}/s per level</p>`;
      } else if (key === 'clickBoost') {
        productionText = `<p>Click power: ${formatNumber(game.clickPower)} (+${upgrade.level * 50}%)</p>`;
        productionText += `<p>Current combo: ×${game.clickCombo || 1}</p>`;
      } else if (key === 'autoClicker') {
        productionText = `<p>Auto-harvest range: ${50 + upgrade.level * 20}</p>`;
      } else if (upgrade.isSurvival) {
        productionText = `<p>Prestige bonus: +${upgrade.level * (key === 'survivalBunker' ? 10 : key === 'dataArchive' ? 5 : 15)}%</p>`;
      }
      
      let costDisplay = `${formatNumber(displayCost)} ${resourceType.charAt(0).toUpperCase() + resourceType.slice(1)}`;
      if (game.buyMode !== 1 && buyAmount > 1) {
        costDisplay += ` <span style="color: #0aa;">(×${buyAmount})</span>`;
      }
      if (costMultiplier > 1) {
        costDisplay += ` <span style="color: #f44;">(×${costMultiplier.toFixed(1)} crisis)</span>`;
      }
      
      // Reuse existing card or create new one
      let card = existingCards[key];
      if (card) {
        // Update existing card
        card.className = 'upgrade-card' + (canAfford ? '' : ' disabled');
        card.innerHTML = `
          <h3>${def.icon} ${def.name} <span class="upgrade-level">Lv.${upgrade.level}${upgrade.maxLevel ? `/${upgrade.maxLevel}` : ''}</span></h3>
          <p>${def.desc}</p>
          ${productionText}
          <div class="upgrade-cost">Cost: ${costDisplay}</div>
        `;
        delete existingCards[key];
      } else {
        // Create new card
        card = document.createElement('div');
        card.className = 'upgrade-card' + (canAfford ? '' : ' disabled');
        card.dataset.upgradeKey = key;
        card.innerHTML = `
          <h3>${def.icon} ${def.name} <span class="upgrade-level">Lv.${upgrade.level}${upgrade.maxLevel ? `/${upgrade.maxLevel}` : ''}</span></h3>
          <p>${def.desc}</p>
          ${productionText}
          <div class="upgrade-cost">Cost: ${costDisplay}</div>
        `;
        card.onclick = () => buyUpgrade(key);
      }
      
      newCards.push({ key, card });
    });
    
    // Remove cards that no longer exist
    Object.values(existingCards).forEach(card => card.remove());
    
    // Append new cards in order
    container.innerHTML = '';
    newCards.forEach(({ card }) => container.appendChild(card));
  });
  
  // Show/hide windows based on unlocks (only auto-show once)
  if (game.reach >= 1e6 && WindowManager.windows['matter-upgrades-window']) {
    if (!WindowManager.windows['matter-upgrades-window'].state.visible && !WindowManager.windows['matter-upgrades-window'].state.autoShown) {
      WindowManager.showWindow('matter-upgrades-window');
    }
  }
  if (game.reach >= 1e9 && WindowManager.windows['info-upgrades-window']) {
    if (!WindowManager.windows['info-upgrades-window'].state.visible && !WindowManager.windows['info-upgrades-window'].state.autoShown) {
      WindowManager.showWindow('info-upgrades-window');
    }
  }
  if (game.reach >= 5e6 && WindowManager.windows['projects-window']) {
    if (!WindowManager.windows['projects-window'].state.visible && !WindowManager.windows['projects-window'].state.autoShown) {
      WindowManager.showWindow('projects-window');
    }
  }
  if (game.reach >= 1e6 && WindowManager.windows['tech-tree-window']) {
    if (!WindowManager.windows['tech-tree-window'].state.visible && !WindowManager.windows['tech-tree-window'].state.autoShown) {
      WindowManager.showWindow('tech-tree-window');
    }
  }
  if (game.reach >= 1e9 && WindowManager.windows['challenges-window']) {
    if (!WindowManager.windows['challenges-window'].state.visible && !WindowManager.windows['challenges-window'].state.autoShown) {
      WindowManager.showWindow('challenges-window');
    }
  }
}

function updateUpgradeAffordability() {
  const costMultiplier = getCostMultiplier();
  
  document.querySelectorAll('.upgrade-card').forEach(card => {
    const key = card.dataset.upgradeKey;
    if (!key) return;
    
    const upgrade = game.upgrades[key];
    const def = UPGRADE_DEFINITIONS[key];
    if (!upgrade || !def) return;
    
    const resourceType = def.resource || 'energy';
    const currentResource = resourceType === 'energy' ? game.energy :
                            resourceType === 'matter' ? game.matter :
                            game.info;
    
    // Calculate cost for current buy mode
    const baseCost = Math.floor(upgrade.baseCost * Math.pow(upgrade.costMult, upgrade.level));
    let displayCost = Math.floor(baseCost * costMultiplier);
    let buyAmount = 1;
    
    if (game.buyMode !== 1) {
      let totalCost = 0;
      let count = 0;
      let tempLevel = upgrade.level;
      const targetCount = game.buyMode === 'max' ? 1000 : game.buyMode;
      
      while (count < targetCount) {
        if (upgrade.maxLevel && tempLevel >= upgrade.maxLevel) break;
        
        const tempBaseCost = Math.floor(upgrade.baseCost * Math.pow(upgrade.costMult, tempLevel));
        const tempCost = Math.floor(tempBaseCost * costMultiplier);
        
        if (game.buyMode === 'max' && totalCost + tempCost > currentResource) break;
        
        totalCost += tempCost;
        count++;
        tempLevel++;
      }
      
      // If we can't afford any, show the cost of 1
      if (count === 0) {
        displayCost = Math.floor(baseCost * costMultiplier);
        buyAmount = 1;
      } else {
        displayCost = totalCost;
        buyAmount = count;
      }
    }
    
    const canAfford = currentResource >= displayCost && buyAmount > 0;
    
    // Update affordability class
    if (canAfford) {
      card.classList.remove('disabled');
    } else {
      card.classList.add('disabled');
    }
    
    // Update cost display
    const costEl = card.querySelector('.upgrade-cost');
    if (costEl) {
      let costDisplay = `${formatNumber(displayCost)} ${resourceType.charAt(0).toUpperCase() + resourceType.slice(1)}`;
      if (game.buyMode !== 1 && buyAmount > 1) {
        costDisplay += ` <span style="color: #0aa;">(×${buyAmount})</span>`;
      }
      if (costMultiplier > 1) {
        costDisplay += ` <span style="color: #f44;">(×${costMultiplier.toFixed(1)} crisis)</span>`;
      }
      costEl.innerHTML = `Cost: ${costDisplay}`;
    }
  });
}

// ============================================================================
// UPGRADE SYSTEM
// ============================================================================

function buyUpgrade(key) {
  const upgrade = game.upgrades[key];
  const def = UPGRADE_DEFINITIONS[key];
  const costMultiplier = getCostMultiplier();
  
  // Check max level for survival structures
  if (upgrade.maxLevel && upgrade.level >= upgrade.maxLevel) {
    return;
  }
  
  const resourceType = def?.resource || 'energy';
  const currentResource = resourceType === 'energy' ? game.energy :
                          resourceType === 'matter' ? game.matter :
                          game.info;
  
  // Calculate how many to buy
  let buyCount = game.buyMode === 'max' ? 0 : game.buyMode;
  
  if (game.buyMode === 'max') {
    // Calculate max affordable
    let totalCost = 0;
    let count = 0;
    let tempLevel = upgrade.level;
    
    while (true) {
      if (upgrade.maxLevel && tempLevel >= upgrade.maxLevel) break;
      
      const baseCost = Math.floor(upgrade.baseCost * Math.pow(upgrade.costMult, tempLevel));
      const cost = Math.floor(baseCost * costMultiplier);
      
      if (totalCost + cost > currentResource) break;
      
      totalCost += cost;
      count++;
      tempLevel++;
      
      if (count > 1000) break; // Safety limit
    }
    
    buyCount = count;
  }
  
  if (buyCount === 0) return;
  
  // Calculate total cost for buyCount
  let totalCost = 0;
  for (let i = 0; i < buyCount; i++) {
    if (upgrade.maxLevel && upgrade.level + i >= upgrade.maxLevel) break;
    
    const baseCost = Math.floor(upgrade.baseCost * Math.pow(upgrade.costMult, upgrade.level + i));
    const cost = Math.floor(baseCost * costMultiplier);
    totalCost += cost;
  }
  
  // Check if can afford
  if (currentResource >= totalCost) {
    // Deduct cost
    if (resourceType === 'energy') game.energy -= totalCost;
    else if (resourceType === 'matter') game.matter -= totalCost;
    else game.info -= totalCost;
    
    // Add levels
    const actualBuyCount = upgrade.maxLevel ? 
      Math.min(buyCount, upgrade.maxLevel - upgrade.level) : 
      buyCount;
    upgrade.level += actualBuyCount;
    
    // Track total purchases for achievements
    game.totalUpgradesPurchased += actualBuyCount;
    
    // Track bulk buyer hero achievement (only when actually buying)
    for (let i = 0; i < actualBuyCount; i++) {
      incrementAchievement('bulkBuyer');
    }
    
    checkAchievements();
    
    // Recalculate rates
    calculateRates();
    updateUpgradesList();
  }
}

function calculateRates() {
  game.energyRate = 10; // Base rate (increased from 1)
  
  // Add upgrade production
  game.energyRate += game.upgrades.energyCollector.level * game.upgrades.energyCollector.baseProduction;
  game.energyRate += game.upgrades.solarPanel.level * game.upgrades.solarPanel.baseProduction;
  game.energyRate += game.upgrades.fusionReactor.level * game.upgrades.fusionReactor.baseProduction;
  game.energyRate += game.upgrades.dysonComponent.level * game.upgrades.dysonComponent.baseProduction;
  
  // Add passive energy from absorbed nodes
  game.nodes.forEach(node => {
    if (node.state === 'absorbed' && node.passiveEnergy) {
      game.energyRate += node.passiveEnergy;
    }
  });
  
  // Multipliers at certain levels (x2 at 10, 25, 50, 100)
  const getMultiplier = (level) => {
    let mult = 1;
    if (level >= 10) mult *= 2;
    if (level >= 25) mult *= 2;
    if (level >= 50) mult *= 2;
    if (level >= 100) mult *= 2;
    return mult;
  };
  
  game.energyRate *= getMultiplier(game.upgrades.energyCollector.level);
  
  // Click power (much stronger, scales with passive rate)
  const baseClickPower = Math.max(game.energyRate * 5, 100); // 5 seconds of passive or minimum 100
  game.clickPower = Math.floor(baseClickPower + game.upgrades.clickBoost.level * baseClickPower * 0.5);
  
  // Matter rate
  game.matterRate = game.upgrades.matterExtractor.level * game.upgrades.matterExtractor.baseProduction;
  
  // Info rate
  game.infoRate = game.upgrades.infoProcessor.level * game.upgrades.infoProcessor.baseProduction;
  
  // Apply prestige bonuses
  const archivedBonus = 1 + (game.archivedData * 0.01);
  const blueprintBonus = 1 + (game.hardenedBlueprints * 0.02);
  const archiveBonus = 1 + (game.geneticArchives * 0.05);
  
  game.energyRate *= archivedBonus * blueprintBonus * archiveBonus;
  game.matterRate *= archivedBonus * blueprintBonus * archiveBonus;
  game.infoRate *= archivedBonus * blueprintBonus * archiveBonus;
  
  // Apply hero card bonuses
  const heroEnergyBonus = 1 + getTotalAchievementBonus('energyRate');
  game.energyRate *= heroEnergyBonus;
  game.matterRate *= heroEnergyBonus;
  game.infoRate *= heroEnergyBonus;
  
  const heroClickBonus = 1 + getTotalAchievementBonus('clickPower');
  game.clickPower = Math.floor(game.clickPower * heroClickBonus);
  
  // Apply project bonuses
  game.energyRate *= getProjectBonus('energyRate');
  game.matterRate *= getProjectBonus('matterRate');
  game.infoRate *= getProjectBonus('infoRate');
  
  // Apply tech bonuses
  game.energyRate *= getTechBonus('energyRate');
  game.matterRate *= getTechBonus('matterRate');
  game.infoRate *= getTechBonus('infoRate');
  
  // Apply challenge bonuses
  game.energyRate *= getChallengeBonus('energyRate');
  game.matterRate *= getChallengeBonus('matterRate');
  game.infoRate *= getChallengeBonus('infoRate');
  
  // Store the actual multiplier for display
  game.prestigeMultiplier = archivedBonus * blueprintBonus * archiveBonus;
}

// ============================================================================
// ACHIEVEMENTS
// ============================================================================

function checkAchievements() {
  let newAchievement = false;
  
  // Bulk Buyer - unlock Buy 10x
  if (!game.achievements.bulkBuyer && game.totalUpgradesPurchased >= 25) {
    game.achievements.bulkBuyer = true;
    newAchievement = true;
    showAchievementNotification('Bulk Buyer', 'Buy 10x mode unlocked!');
  }
  
  // Max Buyer - unlock Buy Max
  if (!game.achievements.maxBuyer && game.totalUpgradesPurchased >= 100) {
    game.achievements.maxBuyer = true;
    newAchievement = true;
    showAchievementNotification('Max Buyer', 'Buy Max mode unlocked!');
  }
  
  // Node Harvester
  const totalHarvests = game.nodes.reduce((sum, n) => sum + (n.harvestCount || 0), 0);
  if (!game.achievements.nodeHarvester && totalHarvests >= 10) {
    game.achievements.nodeHarvester = true;
    newAchievement = true;
    showAchievementNotification('Node Harvester', 'Harvested 10 nodes!');
  }
  
  // Hero Card achievements (repeatable) - only track harvests here
  if (totalHarvests > (game.lastHarvestCount || 0)) {
    incrementAchievement('nodeHarvester');
    game.lastHarvestCount = totalHarvests;
  }
  
  if (newAchievement) {
    updateBuyModeButtons();
  }
}

function showAchievementNotification(title, desc, options = {}) {
  const defaults = {
    icon: '🏆',
    type: 'success',
    windowId: null,
  };
  
  const config = { ...defaults, ...options };
  
  WindowManager.showToast(desc, {
    title: title,
    icon: config.icon,
    type: config.type,
    duration: 3000,
    windowId: config.windowId,
  });
}

function updateBuyModeButtons() {
  // Update all buy mode buttons across all windows
  const buy10Btns = document.querySelectorAll('[data-mode="10"]');
  const buyMaxBtns = document.querySelectorAll('[data-mode="max"]');
  
  buy10Btns.forEach(btn => {
    if (game.achievements.bulkBuyer) {
      btn.disabled = false;
      btn.style.opacity = '1';
    } else {
      btn.disabled = true;
      btn.style.opacity = '0.3';
      btn.title = 'Locked: Purchase 25 upgrades';
    }
  });
  
  buyMaxBtns.forEach(btn => {
    if (game.achievements.maxBuyer) {
      btn.disabled = false;
      btn.style.opacity = '1';
    } else {
      btn.disabled = true;
      btn.style.opacity = '0.3';
      btn.title = 'Locked: Purchase 100 upgrades';
    }
  });
}

// ============================================================================
// CLICK HANDLING
// ============================================================================

canvas.addEventListener('click', (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  
  let clickedSomething = false;
  
  // Check if clicked on a node
  game.nodes.forEach(node => {
    const dist = Math.hypot(x - node.x, y - node.y);
    if (dist < node.radius) {
      clickedSomething = true;
      
      // Can click uncontacted nodes to start harvest
      if (node.state === 'uncontacted') {
        node.state = 'harvesting';
      } 
      // Can click absorbed nodes for energy (even if regenerating)
      else if (node.state === 'absorbed') {
        // Check for pacifist challenge - fail immediately on click
        const pacifistChallenge = game.challenges['pacifist'];
        if (pacifistChallenge && pacifistChallenge.active) {
          pacifistChallenge.clickCount++;
          failChallenge('pacifist');
          return; // Don't process the click
        }
        
        // Track clicks for other challenges
        Object.keys(game.challenges).forEach(key => {
          if (game.challenges[key].active && key !== 'pacifist') {
            game.challenges[key].clickCount++;
          }
        });
        
        // Update combo
        const now = Date.now();
        if (now - game.lastClickTime < game.comboDecayTime) {
          game.clickCombo++;
        } else {
          game.clickCombo = 1;
        }
        game.lastClickTime = now;
        
        // Calculate click bonus with combo multiplier
        const comboMultiplier = 1 + (game.clickCombo * 0.1); // +10% per combo
        const clickGain = Math.floor(game.clickPower * comboMultiplier);
        game.energy += clickGain;
        
        // Track clicks for hero achievement
        incrementAchievement('clickMaster');
        
        // Visual feedback
        const feedback = document.createElement('div');
        feedback.className = 'click-feedback';
        if (game.clickCombo > 1) {
          feedback.innerHTML = `+${formatNumber(clickGain)}<br><span style="font-size: 14px;">×${game.clickCombo} COMBO!</span>`;
          feedback.style.color = game.clickCombo > 5 ? '#ff0' : '#0f0';
        } else {
          feedback.textContent = `+${formatNumber(clickGain)}`;
        }
        feedback.style.left = e.clientX + 'px';
        feedback.style.top = e.clientY + 'px';
        document.body.appendChild(feedback);
        setTimeout(() => feedback.remove(), 1000);
      }
    }
  });
  
  // If didn't click a node, reset combo
  if (!clickedSomething) {
    game.clickCombo = 0;
  }
});

// Tooltip
canvas.addEventListener('mousemove', (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  const tooltip = document.getElementById('node-tooltip');
  
  let hoveredNode = null;
  game.nodes.forEach(node => {
    const dist = Math.hypot(x - node.x, y - node.y);
    if (dist < node.radius) {
      hoveredNode = node;
    }
  });
  
  if (hoveredNode) {
    tooltip.className = 'tooltip visible';
    tooltip.style.left = (e.clientX + 10) + 'px';
    tooltip.style.top = (e.clientY + 10) + 'px';
    
    let content = `<strong>${hoveredNode.name}</strong><br>State: ${hoveredNode.state}<br>`;
    
    if (hoveredNode.state === 'uncontacted') {
      const energyGain = hoveredNode.resources.energy / Math.pow(1.5, hoveredNode.harvestCount);
      content += `Energy: ${Math.floor(energyGain)}<br>`;
      content += `Passive: +${hoveredNode.passiveEnergy}/s when absorbed<br>`;
      content += `Harvested: ${hoveredNode.harvestCount} times`;
    } else if (hoveredNode.state === 'absorbed') {
      content += `Generating: +${hoveredNode.passiveEnergy}/s<br>`;
      if (hoveredNode.regenerationTime > 0) {
        content += `Regenerating: ${Math.ceil(hoveredNode.regenerationTime)}s<br>`;
      } else {
        content += `Click for +${game.clickPower} energy`;
      }
    }
    
    tooltip.innerHTML = content;
  } else {
    tooltip.className = 'tooltip';
  }
});

// ============================================================================
// ASCENSION
// ============================================================================

document.getElementById('evacuate-btn')?.addEventListener('click', () => {
  const cataclysm = getCataclysmInfo();
  if (!cataclysm) return;
  
  const gain = calculatePrestigeCurrency(cataclysm.type);
  if (gain < 1) return;
  
  const timingBonus = getTimingBonus();
  const bonusText = timingBonus > 1 ? ` (×${timingBonus.toFixed(2)} timing bonus!)` : '';
  
  if (confirm(`Evacuate and survive the ${cataclysm.name}?\n\nGain: ${gain} prestige currency${bonusText}\n\nThis will reset your progress but grant permanent bonuses.`)) {
    triggerCataclysm(cataclysm.type);
  }
});

// Legacy ascension button (will be removed later)
document.getElementById('ascend-btn')?.addEventListener('click', () => {
  const essenceGain = Math.floor(Math.pow(game.reach / 1e12, 1/3));
  if (essenceGain < 1) return;
  
  if (confirm(`Ascend and gain ${essenceGain} Essence?\n\nThis will reset your progress but grant permanent bonuses.`)) {
    game.essence += essenceGain;
    
    // Reset
    game.energy = 0;
    game.matter = 0;
    game.info = 0;
    game.reach = 0;
    game.kardashevProgress = 0;
    
    // Reset upgrades
    Object.keys(game.upgrades).forEach(key => {
      game.upgrades[key].level = 0;
    });
    
    // Reset nodes
    game.nodes.forEach(node => {
      if (node.id !== 'home') {
        node.state = 'uncontacted';
        node.harvestProgress = 0;
      }
    });
    
    calculateRates();
    updateUpgradesList();
    saveGame();
  }
});

// Export save
document.getElementById('export-btn')?.addEventListener('click', () => {
  const saveData = localStorage.getItem('univaIdle');
  if (!saveData) {
    alert('No save data found!');
    return;
  }
  
  const blob = new Blob([saveData], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `univa-idle-save-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
});

// Import save
document.getElementById('import-btn')?.addEventListener('click', () => {
  document.getElementById('import-file').click();
});

document.getElementById('import-file')?.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const saveData = JSON.parse(event.target.result);
      localStorage.setItem('univaIdle', JSON.stringify(saveData));
      alert('Save imported successfully! Reloading...');
      location.reload();
    } catch (err) {
      alert('Failed to import save: Invalid file format');
      console.error(err);
    }
  };
  reader.readAsText(file);
});

// ============================================================================
// SAVE/LOAD
// ============================================================================

function saveGame() {
  // Create a clean save object with only what we need
  const saveData = {
    energy: game.energy,
    matter: game.matter,
    info: game.info,
    reach: game.reach,
    kardashevTier: game.kardashevTier,
    kardashevProgress: game.kardashevProgress,
    
    // Prestige currencies
    archivedData: game.archivedData,
    hardenedBlueprints: game.hardenedBlueprints,
    geneticArchives: game.geneticArchives,
    
    // Achievements
    achievements: game.achievements,
    totalUpgradesPurchased: game.totalUpgradesPurchased,
    
    // Upgrades
    upgrades: {},
    
    // Projects
    projects: game.projects,
    activeProjects: game.activeProjects,
    projectBonuses: game.projectBonuses,
    
    // Tech tree
    techs: game.techs,
    
    // Challenges
    challenges: game.challenges,
    challengeCompletions: game.challengeCompletions,
    
    // Node states
    nodes: game.nodes.map(n => ({
      id: n.id,
      state: n.state,
      harvestProgress: n.harvestProgress,
      regenerationTime: n.regenerationTime,
      harvestCount: n.harvestCount,
    })),
  };
  
  // Save upgrade levels
  Object.keys(game.upgrades).forEach(key => {
    saveData.upgrades[key] = { level: game.upgrades[key].level };
  });
  
  localStorage.setItem('univaIdle', JSON.stringify(saveData));
}

function loadGame() {
  try {
    const saved = localStorage.getItem('univaIdle');
    if (saved) {
      const data = JSON.parse(saved);
      
      // Load resources
      game.energy = data.energy || 0;
      game.matter = data.matter || 0;
      game.info = data.info || 0;
      game.reach = data.reach || 0;
      game.kardashevTier = data.kardashevTier || 0;
      game.kardashevProgress = data.kardashevProgress || 0;
      
      // Load prestige currencies
      game.archivedData = data.archivedData || 0;
      game.hardenedBlueprints = data.hardenedBlueprints || 0;
      game.geneticArchives = data.geneticArchives || 0;
      
      // Load achievements
      if (data.achievements) {
        Object.keys(game.achievements).forEach(key => {
          if (data.achievements[key] !== undefined) {
            game.achievements[key] = data.achievements[key];
          }
        });
      }
      game.totalUpgradesPurchased = data.totalUpgradesPurchased || 0;
      
      // Load upgrades
      if (data.upgrades) {
        Object.keys(game.upgrades).forEach(key => {
          if (data.upgrades[key]) {
            game.upgrades[key].level = data.upgrades[key].level || 0;
          }
        });
      }
      
      // Load node states
      if (data.nodes && data.nodes.length === game.nodes.length) {
        data.nodes.forEach((savedNode, i) => {
          if (game.nodes[i] && savedNode.id === game.nodes[i].id) {
            game.nodes[i].state = savedNode.state || 'uncontacted';
            game.nodes[i].harvestProgress = savedNode.harvestProgress || 0;
            game.nodes[i].regenerationTime = savedNode.regenerationTime || 0;
            game.nodes[i].harvestCount = savedNode.harvestCount || 0;
          }
        });
      }
      
      // Load projects
      if (data.projects) {
        Object.keys(game.projects).forEach(key => {
          if (data.projects[key]) {
            game.projects[key] = data.projects[key];
          }
        });
      }
      if (data.activeProjects) {
        game.activeProjects = data.activeProjects;
      }
      if (data.projectBonuses) {
        game.projectBonuses = data.projectBonuses;
      }
      
      // Load techs (with migration for new tech definitions)
      if (data.techs) {
        Object.keys(game.techs).forEach(key => {
          if (data.techs[key]) {
            game.techs[key] = data.techs[key];
          }
          // If tech doesn't exist in save, it's already initialized to { researched: false }
        });
      }
      
      // Load challenges
      if (data.challenges) {
        Object.keys(game.challenges).forEach(key => {
          if (data.challenges[key]) {
            game.challenges[key] = data.challenges[key];
          }
        });
      }
      if (data.challengeCompletions) {
        game.challengeCompletions = data.challengeCompletions;
      }
      
      game.lastUpdate = Date.now();
    }
  } catch (e) {
    console.error('Failed to load save:', e);
    localStorage.removeItem('univaIdle');
  }
}

// Auto-save every 10 seconds
setInterval(saveGame, 10000);

// ============================================================================
// INITIALIZATION
// ============================================================================

initNodes();
loadHeroCard();
loadGame();
initializeWindows();
calculateRates();
updateUpgradesList();
updateBuyModeButtons();
updateHeroCardUI();
updateProjectsList();
updateTechTree();
updateChallengesList();
gameLoop();





// ============================================================================
// INITIALIZE MODULAR UI
// ============================================================================

function initializeWindows() {
  // Initialize window manager
  WindowManager.init();
  
  const hudHeight = document.getElementById('hud').offsetHeight;
  
  // Create Hero Card Window
  const heroContent = document.createElement('div');
  heroContent.id = 'hero-info';
  heroContent.style.fontSize = '12px';
  heroContent.style.height = '100%';
  heroContent.style.overflow = 'auto';
  heroContent.innerHTML = 'Loading...';
  
  WindowManager.createWindow('hero', {
    title: 'Hero Card',
    x: 10,
    y: hudHeight + 10,
    width: 280,
    height: 500,
    minHeight: 200,
    content: heroContent,
  });
  
  // Create Cataclysm Window (hidden by default)
  const cataclysmContent = document.createElement('div');
  cataclysmContent.id = 'cataclysm-info';
  cataclysmContent.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: space-between; gap: 15px;">
      <div style="flex: 1;">
        <div><strong id="cataclysm-type" style="font-size: 13px; color: #f80;">Asteroid Impact</strong></div>
        <div style="font-size: 11px; color: #888; margin-top: 2px;">Progress: <span id="cataclysm-progress">0</span>%</div>
      </div>
      <div style="flex: 1; font-size: 11px; text-align: center;">
        <div>Gain: <span id="prestige-gain" style="color: #0af;">0</span></div>
        <div style="margin-top: 2px;">Bonus: <span id="timing-bonus" style="color: #0f0;">×1.00</span></div>
      </div>
      <div style="flex: 1;">
        <button id="evacuate-btn" class="evacuate-btn" disabled style="width: 100%; padding: 6px; font-size: 11px;">Evacuate</button>
        <div style="font-size: 9px; color: #666; text-align: center; margin-top: 2px;">Early = bonus</div>
      </div>
    </div>
  `;
  
  WindowManager.createWindow('cataclysm', {
    title: '⚠️ Cataclysm Warning',
    x: window.innerWidth / 2 - 200,
    y: hudHeight + 50,
    width: 400,
    height: 100,
    minHeight: 100,
    content: cataclysmContent,
    visible: false,
  });
  
  // Create Energy Upgrades Window
  const energyUpgradesContent = document.createElement('div');
  energyUpgradesContent.innerHTML = `
    <div class="buy-mode">
      <button class="buy-mode-btn active" data-mode="1">Buy 1</button>
      <button class="buy-mode-btn" data-mode="10">Buy 10</button>
      <button class="buy-mode-btn" data-mode="max">Buy Max</button>
    </div>
    <div id="energy-upgrades" class="upgrade-tab-content active"></div>
  `;
  
  WindowManager.createWindow('energy-upgrades-window', {
    title: '⚡ Energy Upgrades',
    x: window.innerWidth - 330,
    y: hudHeight + 10,
    width: 320,
    height: 600,
    minHeight: 300,
    content: energyUpgradesContent,
  });
  
  // Create Matter Upgrades Window (hidden by default)
  const matterUpgradesContent = document.createElement('div');
  matterUpgradesContent.innerHTML = `
    <div class="buy-mode">
      <button class="buy-mode-btn active" data-mode="1">Buy 1</button>
      <button class="buy-mode-btn" data-mode="10">Buy 10</button>
      <button class="buy-mode-btn" data-mode="max">Buy Max</button>
    </div>
    <div id="matter-upgrades" class="upgrade-tab-content active"></div>
  `;
  
  WindowManager.createWindow('matter-upgrades-window', {
    title: '🔩 Matter Upgrades',
    x: window.innerWidth - 660,
    y: hudHeight + 10,
    width: 320,
    height: 600,
    minHeight: 300,
    content: matterUpgradesContent,
    visible: false,
  });
  
  // Create Info Upgrades Window (hidden by default)
  const infoUpgradesContent = document.createElement('div');
  infoUpgradesContent.innerHTML = `
    <div class="buy-mode">
      <button class="buy-mode-btn active" data-mode="1">Buy 1</button>
      <button class="buy-mode-btn" data-mode="10">Buy 10</button>
      <button class="buy-mode-btn" data-mode="max">Buy Max</button>
    </div>
    <div id="info-upgrades" class="upgrade-tab-content active"></div>
  `;
  
  WindowManager.createWindow('info-upgrades-window', {
    title: '💡 Info Upgrades',
    x: window.innerWidth - 990,
    y: hudHeight + 10,
    width: 320,
    height: 600,
    minHeight: 300,
    content: infoUpgradesContent,
    visible: false,
  });
  
  // Create Projects Window (hidden by default)
  const projectsContent = document.createElement('div');
  projectsContent.innerHTML = `
    <div id="projects-list" style="height: 100%; overflow-y: auto;"></div>
  `;
  
  WindowManager.createWindow('projects-window', {
    title: '🏗️ Projects',
    x: 300,
    y: hudHeight + 10,
    width: 350,
    height: 500,
    minHeight: 300,
    content: projectsContent,
    visible: false,
  });
  
  // Create Tech Tree Window (hidden by default)
  const techTreeContent = document.createElement('div');
  techTreeContent.innerHTML = `
    <div class="tech-tier-selector" style="margin-bottom: 10px; display: flex; gap: 10px; align-items: center;">
      <select id="tech-tier-select" style="flex: 1; padding: 5px; background: rgba(0,0,0,0.5); color: #0ff; border: 1px solid #0af;">
        <option value="0">Type 0 - Planetary</option>
        <option value="1">Type I - Stellar</option>
        <option value="2">Type II - Galactic</option>
      </select>
      <button id="tech-tree-reset-view" style="padding: 5px 10px; background: rgba(0,100,200,0.5); color: #0af; border: 1px solid #0af; cursor: pointer;">Reset View</button>
    </div>
    <svg id="tech-tree-svg" style="width: 100%; height: calc(100% - 50px); display: block; cursor: grab; background: #000;">
      <g id="tech-tree-group"></g>
    </svg>
    <div id="tech-tooltip" style="position: absolute; display: none; background: rgba(0,20,40,0.95); border: 1px solid #0af; padding: 10px; border-radius: 4px; pointer-events: none; z-index: 1000; max-width: 250px;"></div>
  `;
  
  WindowManager.createWindow('tech-tree-window', {
    title: '🔬 Tech Tree',
    x: 50,
    y: hudHeight + 10,
    width: 800,
    height: 700,
    minHeight: 500,
    minWidth: 600,
    content: techTreeContent,
    visible: false,
  });
  
  // Create Challenges Window (hidden by default)
  const challengesContent = document.createElement('div');
  challengesContent.innerHTML = `
    <div style="margin-bottom: 10px; padding: 10px; background: rgba(255,100,100,0.1); border: 1px solid #f44; border-radius: 3px;">
      <strong style="color: #f44;">⚠️ WARNING</strong>
      <p style="font-size: 11px; margin: 5px 0 0 0;">Challenges perform a HARD RESET. All progress, prestige currencies, and upgrades will be wiped. Only Hero Card and previous challenge completions persist.</p>
    </div>
    <div id="challenges-list" style="height: calc(100% - 80px); overflow-y: auto;"></div>
  `;
  
  WindowManager.createWindow('challenges-window', {
    title: '🎯 Challenges',
    x: window.innerWidth - 380,
    y: hudHeight + 200,
    width: 370,
    height: 500,
    minHeight: 300,
    content: challengesContent,
    visible: false,
  });
  
  // Set up event listeners after windows are created
  setupWindowEventListeners();
  setupMenuSystem();
  // Load saved layout AFTER windows are created
  WindowManager.loadLayout();
  
  // Initialize tech tree canvas
  setTimeout(() => {
    initTechTreeCanvas();
    
    // Set up tier selector
    const tierSelect = document.getElementById('tech-tier-select');
    if (tierSelect) {
      tierSelect.addEventListener('change', () => {
        updateTechTree();
      });
    }
  }, 100);
}

function setupWindowEventListeners() {
  // Buy mode switching (for all upgrade windows)
  document.querySelectorAll('.buy-mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const mode = btn.dataset.mode;
      
      // Check if locked
      if (btn.disabled) return;
      
      game.buyMode = mode === 'max' ? 'max' : parseInt(mode);
      
      // Update ALL buy mode buttons across all windows
      document.querySelectorAll('.buy-mode-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll(`.buy-mode-btn[data-mode="${mode}"]`).forEach(b => b.classList.add('active'));
      
      // Refresh upgrade list to show new costs
      updateUpgradesList();
    });
  });
  
  // Evacuate button
  const evacuateBtn = document.getElementById('evacuate-btn');
  if (evacuateBtn) {
    evacuateBtn.addEventListener('click', () => {
      const cataclysm = getCataclysmInfo();
      if (!cataclysm) return;
      
      const gain = calculatePrestigeCurrency(cataclysm.type);
      if (gain < 1) return;
      
      const timingBonus = getTimingBonus();
      const bonusText = timingBonus > 1 ? ` (×${timingBonus.toFixed(2)} timing bonus!)` : '';
      
      if (confirm(`Evacuate and survive the ${cataclysm.name}?\n\nGain: ${gain} prestige currency${bonusText}\n\nThis will reset your progress but grant permanent bonuses.`)) {
        triggerCataclysm(cataclysm.type);
      }
    });
  }
  
  // Export button
  const exportBtn = document.getElementById('export-btn');
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      const saveData = localStorage.getItem('univaIdle');
      if (!saveData) {
        alert('No save data found!');
        return;
      }
      
      const blob = new Blob([saveData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `univa-idle-save-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  // Import button
  const importBtn = document.getElementById('import-btn');
  const importFile = document.getElementById('import-file');
  if (importBtn && importFile) {
    importBtn.addEventListener('click', () => {
      importFile.click();
    });
    
    importFile.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const saveData = JSON.parse(event.target.result);
          localStorage.setItem('univaIdle', JSON.stringify(saveData));
          alert('Save imported successfully! Reloading...');
          location.reload();
        } catch (err) {
          alert('Failed to import save: Invalid file format');
          console.error(err);
        }
      };
      reader.readAsText(file);
    });
  }
  
  // Tech tier selector
  const techTierSelect = document.getElementById('tech-tier-select');
  if (techTierSelect) {
    techTierSelect.addEventListener('change', () => {
      updateTechTree();
    });
  }
}


// ============================================================================
// MENU SYSTEM
// ============================================================================

function setupMenuSystem() {
  const menuBtn = document.getElementById('menu-btn');
  const menuDropdown = document.getElementById('menu-dropdown');
  
  // Toggle menu
  menuBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const isVisible = menuDropdown.style.display === 'block';
    menuDropdown.style.display = isVisible ? 'none' : 'block';
  });
  
  // Close menu when clicking outside
  document.addEventListener('click', (e) => {
    if (!menuDropdown.contains(e.target) && e.target !== menuBtn) {
      menuDropdown.style.display = 'none';
    }
  });
  
  // Menu item actions
  document.querySelectorAll('.menu-item').forEach(item => {
    item.addEventListener('click', () => {
      const action = item.dataset.action;
      menuDropdown.style.display = 'none';
      handleMenuAction(action);
    });
  });
}

function showCalculationsBreakdown() {
  // Calculate all bonuses
  const archivedBonus = 1 + (game.archivedData * 0.01);
  const blueprintBonus = 1 + (game.hardenedBlueprints * 0.02);
  const archiveBonus = 1 + (game.geneticArchives * 0.05);
  const prestigeTotal = archivedBonus * blueprintBonus * archiveBonus;
  
  const heroEnergyBonus = 1 + getTotalAchievementBonus('energyRate');
  const heroClickBonus = 1 + getTotalAchievementBonus('clickPower');
  
  const projectEnergyBonus = getProjectBonus('energyRate');
  const projectMatterBonus = getProjectBonus('matterRate');
  const projectInfoBonus = getProjectBonus('infoRate');
  
  const techEnergyBonus = getTechBonus('energyRate');
  const techMatterBonus = getTechBonus('matterRate');
  const techInfoBonus = getTechBonus('infoRate');
  
  const challengeEnergyBonus = getChallengeBonus('energyRate');
  const challengeMatterBonus = getChallengeBonus('matterRate');
  const challengeInfoBonus = getChallengeBonus('infoRate');
  const challengeCostReduction = getChallengeBonus('costReduction');
  
  // Base rates before multipliers
  let baseEnergy = 10;
  baseEnergy += game.upgrades.energyCollector.level * game.upgrades.energyCollector.baseProduction;
  baseEnergy += game.upgrades.solarPanel.level * game.upgrades.solarPanel.baseProduction;
  baseEnergy += game.upgrades.fusionReactor.level * game.upgrades.fusionReactor.baseProduction;
  baseEnergy += game.upgrades.dysonComponent.level * game.upgrades.dysonComponent.baseProduction;
  
  game.nodes.forEach(node => {
    if (node.state === 'absorbed' && node.passiveEnergy) {
      baseEnergy += node.passiveEnergy;
    }
  });
  
  const getMultiplier = (level) => {
    let mult = 1;
    if (level >= 10) mult *= 2;
    if (level >= 25) mult *= 2;
    if (level >= 50) mult *= 2;
    if (level >= 100) mult *= 2;
    return mult;
  };
  baseEnergy *= getMultiplier(game.upgrades.energyCollector.level);
  
  const baseMatter = game.upgrades.matterExtractor.level * game.upgrades.matterExtractor.baseProduction;
  const baseInfo = game.upgrades.infoProcessor.level * game.upgrades.infoProcessor.baseProduction;
  
  // Final rates
  const finalEnergy = baseEnergy * prestigeTotal * heroEnergyBonus * projectEnergyBonus * techEnergyBonus * challengeEnergyBonus;
  const finalMatter = baseMatter * prestigeTotal * heroEnergyBonus * projectMatterBonus * techMatterBonus * challengeMatterBonus;
  const finalInfo = baseInfo * prestigeTotal * heroEnergyBonus * projectInfoBonus * techInfoBonus * challengeInfoBonus;
  
  // Click power breakdown
  const baseClickPower = Math.max(game.energyRate * 5, 100);
  const clickWithBoost = baseClickPower + game.upgrades.clickBoost.level * baseClickPower * 0.5;
  const finalClickPower = Math.floor(clickWithBoost * heroClickBonus);
  
  showInfoModal('Calculations Breakdown', `
    <div style="max-height: 500px; overflow-y: auto;">
      <h3>⚡ Energy Generation: ${formatNumber(finalEnergy)}/s</h3>
      <div style="margin-left: 15px; font-size: 11px; color: #aaa;">
        <p>Base Rate: ${formatNumber(baseEnergy)}/s</p>
        <p style="margin-left: 10px;">• Starting: 10/s</p>
        <p style="margin-left: 10px;">• Energy Collectors: +${game.upgrades.energyCollector.level * game.upgrades.energyCollector.baseProduction}/s</p>
        <p style="margin-left: 10px;">• Solar Panels: +${game.upgrades.solarPanel.level * game.upgrades.solarPanel.baseProduction}/s</p>
        <p style="margin-left: 10px;">• Fusion Reactors: +${game.upgrades.fusionReactor.level * game.upgrades.fusionReactor.baseProduction}/s</p>
        <p style="margin-left: 10px;">• Dyson Components: +${game.upgrades.dysonComponent.level * game.upgrades.dysonComponent.baseProduction}/s</p>
        <p style="margin-left: 10px;">• Absorbed Nodes: +${game.nodes.filter(n => n.state === 'absorbed').reduce((sum, n) => sum + (n.passiveEnergy || 0), 0)}/s</p>
        <p style="margin-left: 10px;">• Collector Milestone: ×${getMultiplier(game.upgrades.energyCollector.level).toFixed(2)}</p>
        <p>Prestige Multiplier: ×${prestigeTotal.toFixed(3)}</p>
        <p style="margin-left: 10px;">• Archived Data (${game.archivedData.toFixed(1)}): ×${archivedBonus.toFixed(3)}</p>
        <p style="margin-left: 10px;">• Hardened Blueprints (${game.hardenedBlueprints.toFixed(1)}): ×${blueprintBonus.toFixed(3)}</p>
        <p style="margin-left: 10px;">• Genetic Archives (${game.geneticArchives.toFixed(1)}): ×${archiveBonus.toFixed(3)}</p>
        <p>Hero Bonus: ×${heroEnergyBonus.toFixed(3)}</p>
        ${projectEnergyBonus !== 1 ? `<p>Project Bonus: ×${projectEnergyBonus.toFixed(3)}</p>` : ''}
        ${techEnergyBonus !== 1 ? `<p>Tech Bonus: ×${techEnergyBonus.toFixed(3)}</p>` : ''}
        ${challengeEnergyBonus !== 1 ? `<p>Challenge Bonus: ×${challengeEnergyBonus.toFixed(3)}</p>` : ''}
      </div>
      
      ${game.reach >= 1e6 ? `
        <h3>🔩 Matter Generation: ${formatNumber(finalMatter)}/s</h3>
        <div style="margin-left: 15px; font-size: 11px; color: #aaa;">
          <p>Base Rate: ${formatNumber(baseMatter)}/s</p>
          <p style="margin-left: 10px;">• Matter Extractors: ${game.upgrades.matterExtractor.level} × ${game.upgrades.matterExtractor.baseProduction}/s</p>
          <p>Prestige Multiplier: ×${prestigeTotal.toFixed(3)}</p>
          <p>Hero Bonus: ×${heroEnergyBonus.toFixed(3)}</p>
          ${projectMatterBonus !== 1 ? `<p>Project Bonus: ×${projectMatterBonus.toFixed(3)}</p>` : ''}
          ${techMatterBonus !== 1 ? `<p>Tech Bonus: ×${techMatterBonus.toFixed(3)}</p>` : ''}
          ${challengeMatterBonus !== 1 ? `<p>Challenge Bonus: ×${challengeMatterBonus.toFixed(3)}</p>` : ''}
        </div>
      ` : ''}
      
      ${game.reach >= 1e9 ? `
        <h3>💡 Information Generation: ${formatNumber(finalInfo)}/s</h3>
        <div style="margin-left: 15px; font-size: 11px; color: #aaa;">
          <p>Base Rate: ${formatNumber(baseInfo)}/s</p>
          <p style="margin-left: 10px;">• Info Processors: ${game.upgrades.infoProcessor.level} × ${game.upgrades.infoProcessor.baseProduction}/s</p>
          <p>Prestige Multiplier: ×${prestigeTotal.toFixed(3)}</p>
          <p>Hero Bonus: ×${heroEnergyBonus.toFixed(3)}</p>
          ${projectInfoBonus !== 1 ? `<p>Project Bonus: ×${projectInfoBonus.toFixed(3)}</p>` : ''}
          ${techInfoBonus !== 1 ? `<p>Tech Bonus: ×${techInfoBonus.toFixed(3)}</p>` : ''}
          ${challengeInfoBonus !== 1 ? `<p>Challenge Bonus: ×${challengeInfoBonus.toFixed(3)}</p>` : ''}
        </div>
      ` : ''}
      
      <h3>👆 Click Power: ${formatNumber(finalClickPower)}</h3>
      <div style="margin-left: 15px; font-size: 11px; color: #aaa;">
        <p>Base: ${formatNumber(baseClickPower)}</p>
        <p style="margin-left: 10px;">• 5 seconds of energy generation (min 100)</p>
        <p>Click Amplifier Bonus: +${(game.upgrades.clickBoost.level * 50)}%</p>
        <p>With Amplifier: ${formatNumber(clickWithBoost)}</p>
        <p>Hero Click Bonus: ×${heroClickBonus.toFixed(3)}</p>
        <p>Combo Multiplier: ×${(1 + game.clickCombo * 0.1).toFixed(2)} (current)</p>
      </div>
      
      ${challengeCostReduction !== 1 ? `
        <h3>💰 Cost Reduction</h3>
        <div style="margin-left: 15px; font-size: 11px; color: #aaa;">
          <p>Challenge Bonus: ×${challengeCostReduction.toFixed(3)} (${((1 - challengeCostReduction) * 100).toFixed(1)}% cheaper)</p>
        </div>
      ` : ''}
    </div>
  `);
}

function handleMenuAction(action) {
  switch (action) {
    case 'how-to-play':
      showInfoModal('How to Play', `
        <h3>Basic Gameplay</h3>
        <p>Click on planets to harvest energy instantly. Absorbed planets generate passive energy over time.</p>
        <p>Purchase upgrades to increase your energy generation rate.</p>
        
        <h3>Reach</h3>
        <p>Reach is the total amount of energy you've generated. It never decreases and determines your progress toward the next Kardashev tier.</p>
        
        <h3>Combo System</h3>
        <p>Click planets rapidly to build a combo multiplier. Each consecutive click within 2 seconds increases your click power by 10%.</p>
        
        <h3>Node Regeneration</h3>
        <p>After harvesting a node, it enters a 30-second cooldown. Each harvest gives 70% of the previous amount (diminishing returns).</p>
      `);
      break;
      
    case 'mechanics':
      showInfoModal('Mechanics Guide', `
        <h3>Cataclysms & Prestige</h3>
        <p>At 1M, 1B, and 1T reach, cataclysmic events threaten your civilization:</p>
        <ul>
          <li>Asteroid Impact (1M) - Grants Archived Data</li>
          <li>Solar Flare (1B) - Grants Hardened Blueprints</li>
          <li>Gamma Ray Burst (1T) - Grants Genetic Archives</li>
        </ul>
        <p>Evacuate early for timing bonuses! The earlier you evacuate (70-90% progress), the more prestige currency you gain.</p>
        
        <h3>Prestige Currencies</h3>
        <p>Each prestige currency provides permanent multipliers to all resource generation:</p>
        <ul>
          <li>Archived Data: +1% per point</li>
          <li>Hardened Blueprints: +2% per point</li>
          <li>Genetic Archives: +5% per point</li>
        </ul>
        
        <h3>Hero Card</h3>
        <p>Your hero persists across all prestiges. Complete achievements to gain permanent bonuses:</p>
        <ul>
          <li>Node Harvester: +0.1% energy per level</li>
          <li>Bulk Buyer: +0.1% cost reduction per level</li>
          <li>Click Master: +0.2% click power per level</li>
          <li>Prestige Veteran: +0.5% prestige currency per level</li>
          <li>Survivor: +0.3% survival bonus per level</li>
        </ul>
        <p>At level 100, prestige an achievement to advance its rank. Each rank makes bonuses 1.5x stronger!</p>
        
        <h3>Kardashev Scale</h3>
        <p>Progress through civilization tiers by increasing your reach:</p>
        <ul>
          <li>Type 0 → I: Master Planetary Energy (1e18)</li>
          <li>Type I → II: Harness Stellar Output (1e26)</li>
          <li>Type II → III: Control Galactic Energy (1e37)</li>
        </ul>
      `);
      break;
      
    case 'statistics':
      const totalHarvests = game.nodes.reduce((sum, n) => sum + (n.harvestCount || 0), 0);
      const totalPrestiges = (game.archivedData > 0 ? 1 : 0) + 
                            (game.hardenedBlueprints > 0 ? 1 : 0) + 
                            (game.geneticArchives > 0 ? 1 : 0);
      
      showInfoModal('Statistics', `
        <h3>Current Run</h3>
        <p>Total Reach: ${formatNumber(game.reach)}</p>
        <p>Nodes Harvested: ${totalHarvests}</p>
        <p>Upgrades Purchased: ${game.totalUpgradesPurchased}</p>
        <p>Best Combo: ${game.clickCombo || 1}×</p>
        
        <h3>All Time</h3>
        <p>Hero Level: ${heroCard.totalLevel}</p>
        <p>Prestige Currencies: ${totalPrestiges} types unlocked</p>
        <p>Archived Data: ${game.archivedData.toFixed(2)}</p>
        <p>Hardened Blueprints: ${game.hardenedBlueprints.toFixed(2)}</p>
        <p>Genetic Archives: ${game.geneticArchives.toFixed(2)}</p>
        
        <h3>Multipliers</h3>
        <p>Prestige Bonus: ×${(game.prestigeMultiplier || 1).toFixed(3)}</p>
        <p>Hero Energy Bonus: +${(getTotalAchievementBonus('energyRate') * 100).toFixed(2)}%</p>
        <p>Hero Click Bonus: +${(getTotalAchievementBonus('clickPower') * 100).toFixed(2)}%</p>
      `);
      break;
      
    case 'calculations':
      showCalculationsBreakdown();
      break;
      
    case 'reset':
      if (confirm('Reset ALL progress? This will delete your save, prestige currencies, and hero card. This cannot be undone!')) {
        if (confirm('Are you absolutely sure? Type "RESET" in the next prompt to confirm.')) {
          const confirmation = prompt('Type RESET to confirm:');
          if (confirmation === 'RESET') {
            localStorage.removeItem('univaIdle');
            localStorage.removeItem('univaHero');
            location.reload();
          }
        }
      }
      break;
  }
}

function showInfoModal(title, content) {
  const modal = document.createElement('div');
  modal.className = 'info-modal';
  modal.innerHTML = `
    <div class="info-modal-content">
      <h2>${title}</h2>
      ${content}
      <button class="info-modal-close">Close</button>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Close on button click
  modal.querySelector('.info-modal-close').addEventListener('click', () => {
    modal.remove();
  });
  
  // Close on background click
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  });
  
  // Close on Escape key
  const escapeHandler = (e) => {
    if (e.key === 'Escape') {
      modal.remove();
      document.removeEventListener('keydown', escapeHandler);
    }
  };
  document.addEventListener('keydown', escapeHandler);
}
