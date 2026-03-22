/**
 * Time Canvas Demo — Human Civilization 500 BCE to present
 *
 * 10 nested timelines, ~50 infodots with Wikimedia Commons public-domain images.
 * Uses TimeCanvas (the domain wrapper) rather than ChronoCanvas directly.
 */

import { TimeCanvas } from 'chronocanvas';
import type { TimeCanvasTimeline } from 'chronocanvas';

// ─────────────────────────────────────────────────────────────────────────────
// Data
// ─────────────────────────────────────────────────────────────────────────────

const WORLD_HISTORY: TimeCanvasTimeline = {
  title: 'Human Civilization',
  start: '-0500-01-01',
  end:   'present',

  timelines: [

    // ── Ancient World (-500 → 500) ─────────────────────────────────────────
    {
      title: 'Ancient World',
      start: '-0500-01-01',
      end:   '0500-01-01',

      timelines: [

        // Classical Greece & Rome
        {
          title: 'Classical Greece & Rome',
          start: '-0500-01-01',
          end:   '0476-09-04',
          infodots: [
            {
              title: 'Battle of Marathon',
              time:  '-0490-09-12',
              image: { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/25/Battle_of_marathon.png/320px-Battle_of_marathon.png' },
              text:  'Greek city-states repel the Persian invasion. A defining moment for Western democracy.',
            },
            {
              title: 'Parthenon completed',
              time:  '-0432-01-01',
              image: { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/da/The_Parthenon_in_Athens.jpg/320px-The_Parthenon_in_Athens.jpg' },
              text:  'Crowning achievement of Classical Athens, dedicated to the goddess Athena.',
            },
            {
              title: 'Death of Socrates',
              time:  '-0399-01-01',
              image: { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/David_-_The_Death_of_Socrates.jpg/320px-David_-_The_Death_of_Socrates.jpg' },
              text:  'The philosopher is condemned and executes himself with hemlock, inspiring Plato\'s dialogues.',
            },
            {
              title: 'Plato\'s Academy founded',
              time:  '-0387-01-01',
              image: { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/Plato-raphael.jpg/240px-Plato-raphael.jpg' },
              text:  'First institution of higher learning in the Western world, operating for nearly 900 years.',
            },
            {
              title: 'Alexander the Great',
              time:  '-0323-06-10',
              image: { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/40/Alexander_the_Great_mosaic.jpg/320px-Alexander_the_Great_mosaic.jpg' },
              text:  'Death of Alexander at 32. His conquests spread Greek culture from Egypt to Central Asia.',
            },
            {
              title: 'Julius Caesar assassinated',
              time:  '-0044-03-15',
              image: { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Vincenzo_Camuccini_-_La_morte_di_Cesare.jpg/320px-Vincenzo_Camuccini_-_La_morte_di_Cesare.jpg' },
              text:  '"Et tu, Brute?" Caesar\'s murder triggers the end of the Roman Republic.',
            },
            {
              title: 'Augustus — first Roman Emperor',
              time:  '-0027-01-16',
              image: { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/eb/Statue-Augustus.jpg/200px-Statue-Augustus.jpg' },
              text:  'Octavian becomes Augustus, founding the Roman Empire and beginning the Pax Romana.',
            },
            {
              title: 'Colosseum opens',
              time:  '0080-01-01',
              image: { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/de/Colosseo_2020.jpg/320px-Colosseo_2020.jpg' },
              text:  'The largest amphitheatre ever built, seating 50 000 spectators for gladiatorial games.',
            },
            {
              title: 'Fall of Western Rome',
              time:  '0476-09-04',
              image: { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/00/Thomas_Cole_-_The_Course_of_Empire_Destruction_-_1836.jpg/320px-Thomas_Cole_-_The_Course_of_Empire_Destruction_-_1836.jpg' },
              text:  'Romulus Augustulus deposed by Odoacer. End of the Roman Empire in the West.',
            },
          ],
        },

        // Hellenistic Science
        {
          title: 'Hellenistic Science',
          start: '-0323-01-01',
          end:   '0150-01-01',
          infodots: [
            {
              title: 'Euclid\'s Elements',
              time:  '-0300-01-01',
              image: { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/af/Oxyrhynchus_papyrus_with_Euclid%27s_Elements.jpg/240px-Oxyrhynchus_papyrus_with_Euclid%27s_Elements.jpg' },
              text:  'Geometry codified in 13 books. The most influential mathematics textbook ever written.',
            },
            {
              title: 'Archimedes',
              time:  '-0250-01-01',
              image: { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Domenico-Fetti_Archimedes_1620.jpg/240px-Domenico-Fetti_Archimedes_1620.jpg' },
              text:  'Pioneer of calculus concepts, hydrostatics, and the lever. "Give me a place to stand…"',
            },
            {
              title: 'Eratosthenes measures Earth',
              time:  '-0240-01-01',
              image: { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1f/Eratosthenes_measure_of_Earth_circumference.svg/240px-Eratosthenes_measure_of_Earth_circumference.svg.png' },
              text:  'Using shadows and geometry, he calculates Earth\'s circumference to within 2% accuracy.',
            },
            {
              title: 'Library of Alexandria',
              time:  '-0283-01-01',
              image: { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/64/Ancientlibraryalex.jpg/320px-Ancientlibraryalex.jpg' },
              text:  'The largest library in the ancient world, housing hundreds of thousands of scrolls.',
            },
            {
              title: 'Ptolemy\'s Almagest',
              time:  '0150-01-01',
              image: { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Ptolemy_1476_with_armillary_sphere.jpg/240px-Ptolemy_1476_with_armillary_sphere.jpg' },
              text:  'Mathematical model of the cosmos that dominated astronomy for 1 400 years.',
            },
          ],
        },

      ], // end Ancient World timelines

      infodots: [
        {
          title: 'Confucius',
          time:  '-0479-04-11',
          image: { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Confucius_Tang_Dynasty.jpg/200px-Confucius_Tang_Dynasty.jpg' },
          text:  'Death of Confucius. His philosophy of ethics, social harmony, and moral governance shapes East Asian civilization.',
        },
      ],
    },

    // ── Medieval Period (500 → 1400) ───────────────────────────────────────
    {
      title: 'Medieval Period',
      start: '0500-01-01',
      end:   '1400-01-01',

      timelines: [

        // Islamic Golden Age
        {
          title: 'Islamic Golden Age',
          start: '0750-01-01',
          end:   '1258-02-10',
          infodots: [
            {
              title: 'House of Wisdom, Baghdad',
              time:  '0830-01-01',
              image: { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/67/Bayt_al-Hikma.jpg/320px-Bayt_al-Hikma.jpg' },
              text:  'Grand library and translation centre. Greek classics preserved and extended.',
            },
            {
              title: 'Al-Khwarizmi — Algebra',
              time:  '0820-01-01',
              image: { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/16/Al-Khwarizmi_portrait.jpg/200px-Al-Khwarizmi_portrait.jpg' },
              text:  '"Al-Kitāb al-mukhtaṣar" introduces algebra. The word "algorithm" derives from his name.',
            },
            {
              title: 'Ibn Sina — Canon of Medicine',
              time:  '1025-01-01',
              image: { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/Avicenna_medicine.jpg/200px-Avicenna_medicine.jpg' },
              text:  'Encyclopaedic medical text used in European universities until the 17th century.',
            },
            {
              title: 'Al-Biruni measures Earth',
              time:  '1020-01-01',
              image: { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Al-Biruni.jpg/200px-Al-Biruni.jpg' },
              text:  'Calculates Earth\'s circumference using a novel trigonometric method from a mountain peak.',
            },
            {
              title: 'Ibn al-Haytham — Optics',
              time:  '1011-01-01',
              image: { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/63/Ibn_al-Haytham.png/200px-Ibn_al-Haytham.png' },
              text:  '"Book of Optics" establishes the scientific method and founds modern optics.',
            },
            {
              title: 'Fall of Baghdad',
              time:  '1258-02-10',
              image: { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/26/Invasion_of_Baghdad_by_the_Mongols_1258.jpeg/320px-Invasion_of_Baghdad_by_the_Mongols_1258.jpeg' },
              text:  'Mongol sack of Baghdad ends the Abbasid Caliphate and the Golden Age.',
            },
          ],
        },

      ], // end Medieval timelines

      infodots: [
        {
          title: 'Magna Carta',
          time:  '1215-06-15',
          image: { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ee/Magna_Carta_%28British_Library_Cotton_MS_Augustus_II.106%29.jpg/240px-Magna_Carta_%28British_Library_Cotton_MS_Augustus_II.106%29.jpg' },
          text:  'King John of England signs the Great Charter, establishing that the king is subject to the rule of law.',
        },
        {
          title: 'Black Death',
          time:  '1347-10-01',
          image: { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/Yersinia_pestis_fluorescent.jpeg/240px-Yersinia_pestis_fluorescent.jpeg' },
          text:  'Bubonic plague kills 30–60% of Europe\'s population. Accelerates social and economic change.',
        },
        {
          title: 'Gutenberg Press',
          time:  '1440-01-01',
          image: { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/Gutenberg_Bible%2C_Lenox_Copy%2C_New_York_Public_Library%2C_2009._Pic_01.jpg/240px-Gutenberg_Bible%2C_Lenox_Copy%2C_New_York_Public_Library%2C_2009._Pic_01.jpg' },
          text:  'Movable type printing press democratises knowledge and launches the Information Age.',
        },
      ],
    },

    // ── Early Modern (1400 → 1800) ─────────────────────────────────────────
    {
      title: 'Early Modern',
      start: '1400-01-01',
      end:   '1800-01-01',

      timelines: [

        // Renaissance
        {
          title: 'Renaissance',
          start: '1400-01-01',
          end:   '1600-01-01',
          infodots: [
            {
              title: 'Botticelli — Birth of Venus',
              time:  '1485-01-01',
              image: { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/26/Sandro_Botticelli_-_La_nascita_di_Venere_-_Google_Art_Project_-_edited.jpg/320px-Sandro_Botticelli_-_La_nascita_di_Venere_-_Google_Art_Project_-_edited.jpg' },
              text:  'Iconic Renaissance painting; mythological scene executed in the new humanist style.',
            },
            {
              title: 'Leonardo — Vitruvian Man',
              time:  '1490-01-01',
              image: { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/Da_Vinci_Vitruve_Luc_Viatour.jpg/240px-Da_Vinci_Vitruve_Luc_Viatour.jpg' },
              text:  'Study of ideal human proportions, combining art and science in a single drawing.',
            },
            {
              title: 'Columbus reaches Americas',
              time:  '1492-10-12',
              image: { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/Landing_of_Columbus_%282%29.jpg/320px-Landing_of_Columbus_%282%29.jpg' },
              text:  'First European contact with the Americas begins the Columbian Exchange.',
            },
            {
              title: 'Michelangelo — Sistine Chapel',
              time:  '1512-10-31',
              image: { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5b/Michelangelo_-_Creation_of_Adam_%28cropped%29.jpg/320px-Michelangelo_-_Creation_of_Adam_%28cropped%29.jpg' },
              text:  'The ceiling of the Sistine Chapel is unveiled, a masterpiece of Renaissance painting.',
            },
            {
              title: 'Magellan circumnavigates Earth',
              time:  '1522-09-06',
              image: { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/27/Magellan_Elcano_Expedition.jpg/320px-Magellan_Elcano_Expedition.jpg' },
              text:  'First voyage to circumnavigate the globe proves Earth is round.',
            },
          ],
        },

        // Scientific Revolution
        {
          title: 'Scientific Revolution',
          start: '1543-01-01',
          end:   '1750-01-01',
          infodots: [
            {
              title: 'Copernicus — Heliocentric Model',
              time:  '1543-01-01',
              image: { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f5/Nikolaus_Kopernikus.jpg/200px-Nikolaus_Kopernikus.jpg' },
              text:  '"De revolutionibus" places the Sun at the centre of the solar system.',
            },
            {
              title: 'Galileo\'s Telescope',
              time:  '1610-01-07',
              image: { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/56/Galileo_moon_phases.jpg/240px-Galileo_moon_phases.jpg' },
              text:  'First astronomical use of a telescope; discovers Jupiter\'s moons and defends Copernicus.',
            },
            {
              title: 'Kepler\'s Laws of Planetary Motion',
              time:  '1609-01-01',
              image: { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ed/Johannes_Kepler_1610.jpg/200px-Johannes_Kepler_1610.jpg' },
              text:  'Mathematical laws describing elliptical planetary orbits, foundational to astronomy.',
            },
            {
              title: 'Newton — Principia Mathematica',
              time:  '1687-07-05',
              image: { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3b/Portrait_of_Sir_Isaac_Newton%2C_1689.jpg/200px-Portrait_of_Sir_Isaac_Newton%2C_1689.jpg' },
              text:  'Laws of motion and universal gravitation. One of the greatest scientific works ever published.',
            },
            {
              title: 'Halley predicts comet return',
              time:  '1705-01-01',
              image: { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Halley%27s_Comet_1986.jpg/320px-Halley%27s_Comet_1986.jpg' },
              text:  'Edmond Halley correctly predicts the return of a comet using Newton\'s laws.',
            },
          ],
        },

      ], // end Early Modern timelines
    },

    // ── Modern Era (1800 → present) ────────────────────────────────────────
    {
      title: 'Modern Era',
      start: '1800-01-01',
      end:   'present',

      timelines: [

        // 20th Century
        {
          title: '20th Century',
          start: '1895-01-01',
          end:   '2001-01-01',
          infodots: [
            {
              title: 'Röntgen — X-Rays',
              time:  '1895-11-08',
              image: { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/Roentgen_X-ray_of_hand.jpg/200px-Roentgen_X-ray_of_hand.jpg' },
              text:  'First medical X-ray image. Röntgen wins the first Nobel Prize in Physics.',
            },
            {
              title: 'Wright Brothers — First Flight',
              time:  '1903-12-17',
              image: { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/First_flight2.jpg/320px-First_flight2.jpg' },
              text:  '12 seconds at Kitty Hawk. The age of powered aviation begins.',
            },
            {
              title: 'Einstein — Special Relativity',
              time:  '1905-09-26',
              image: { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/Albert_Einstein_Head.jpg/200px-Albert_Einstein_Head.jpg' },
              text:  'E = mc². Space, time, and energy are unified in a single elegant theory.',
            },
            {
              title: 'Fleming — Penicillin',
              time:  '1928-09-03',
              image: { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Penicillium_mold_growing.jpg/240px-Penicillium_mold_growing.jpg' },
              text:  'Accidental discovery of the world\'s first antibiotic saves hundreds of millions of lives.',
            },
            {
              title: 'Watson & Crick — DNA Double Helix',
              time:  '1953-04-25',
              image: { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/DNA_Structure%2BKey%2BLabelled.pn_NoBB.png/200px-DNA_Structure%2BKey%2BLabelled.pn_NoBB.png' },
              text:  'The structure of DNA is revealed. The molecular basis of heredity is understood.',
            },
            {
              title: 'Sputnik — Space Age begins',
              time:  '1957-10-04',
              image: { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/be/Sputnik_asm.jpg/240px-Sputnik_asm.jpg' },
              text:  'First artificial satellite launches humanity into the Space Age.',
            },
            {
              title: 'Moon Landing',
              time:  '1969-07-20',
              image: { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/Aldrin_Apollo_11_original.jpg/240px-Aldrin_Apollo_11_original.jpg' },
              text:  '"One small step for man…" Apollo 11 lands on the Moon.',
            },
            {
              title: 'World Wide Web',
              time:  '1989-03-12',
              image: { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b2/WWW_logo_by_Robert_Cailliau.svg/240px-WWW_logo_by_Robert_Cailliau.svg.png' },
              text:  'Tim Berners-Lee proposes the Web at CERN. The information age goes global.',
            },
          ],
        },

      ], // end Modern Era timelines

      infodots: [
        {
          title: 'Steam Engine — Watt',
          time:  '1769-01-05',
          image: { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/45/SteamEngine_Boulton%26Watt_1784.jpg/320px-SteamEngine_Boulton%26Watt_1784.jpg' },
          text:  'James Watt\'s improved steam engine powers the Industrial Revolution.',
        },
        {
          title: 'Darwin — Origin of Species',
          time:  '1859-11-24',
          image: { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ae/Darwins_finches_by_Gould.jpg/240px-Darwins_finches_by_Gould.jpg' },
          text:  'Natural selection explained. The unifying theory of all biology.',
        },
        {
          title: 'Edison — Light Bulb',
          time:  '1879-10-22',
          image: { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Edison_Light_Bulb.jpg/200px-Edison_Light_Bulb.jpg' },
          text:  'First practical incandescent light bulb demonstrated. Electrification of the world begins.',
        },
        {
          title: 'Human Genome Project complete',
          time:  '2003-04-14',
          image: { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/37/Genome_valves.jpg/240px-Genome_valves.jpg' },
          text:  'Complete sequence of human DNA published. A new era of medicine and biology opens.',
        },
      ],
    },

  ], // end root timelines
};

// ─────────────────────────────────────────────────────────────────────────────
// Setup
// ─────────────────────────────────────────────────────────────────────────────

const container = document.getElementById('canvas-container')!;
const loading   = document.getElementById('loading')!;

const tc = new TimeCanvas(container, {
  ellipticalZoomDuration:      7000,
  ellipticalZoomZoomoutFactor: 0.55,
  zoomLevelFactor:             1.3,
});

(window as any).tc = tc;

// Load data immediately — layout is synchronous
tc.setData(WORLD_HISTORY);
tc.fitToView(true);
loading.style.display = 'none';

// ─────────────────────────────────────────────────────────────────────────────
// Era jump buttons — zoom to each level-1 timeline
// Pre-computed from the date ranges mapped onto the 10 000-unit virtual canvas
// ─────────────────────────────────────────────────────────────────────────────

// The root spans -500 → ~2025 = 2525 years total.
// virtualX(year) = (year - (-500)) / 2525 * 10000 - 5000
function eraCenter(startYear: number, endYear: number): { centerX: number; centerY: number; scale: number } {
  const rootStart = -500;
  const rootEnd   = new Date().getFullYear();
  const span      = rootEnd - rootStart;
  const toVX      = (y: number) => (y - rootStart) / span * 10000 - 5000;

  const x1 = toVX(startYear);
  const x2 = toVX(endYear);
  return {
    centerX: (x1 + x2) / 2,
    centerY: 0,
    // scale: fit width into ~80% of viewport
    scale: (x2 - x1) * 1.25 / (container.clientWidth || 1200),
  };
}

document.getElementById('btn-fit')!.onclick         = () => tc.fitToView();
document.getElementById('btn-ancient')!.onclick     = () => tc.zoomTo(eraCenter(-500,  500));
document.getElementById('btn-medieval')!.onclick    = () => tc.zoomTo(eraCenter( 500, 1400));
document.getElementById('btn-early-modern')!.onclick = () => tc.zoomTo(eraCenter(1400, 1800));
document.getElementById('btn-modern')!.onclick      = () => tc.zoomTo(eraCenter(1800, new Date().getFullYear()));

// ESC key fits all
window.addEventListener('keydown', e => {
  if (e.key === 'Escape') tc.fitToView();
});

window.addEventListener('resize', () => tc.updateViewport());
