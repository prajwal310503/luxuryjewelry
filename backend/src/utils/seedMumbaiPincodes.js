/**
 * Seed all Mumbai pincodes into the Pincode collection.
 * Run: node src/utils/seedMumbaiPincodes.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const Pincode  = require('../models/Pincode');

const MUMBAI_PINCODES = [
  // ── South Mumbai (Mumbai City) ──────────────────────────────────────────────
  '400001', // Fort, CST, GPO
  '400002', // Kalbadevi, Masjid Bunder
  '400003', // Mandvi, Dongri
  '400004', // Girgaon, Chowpatty
  '400005', // Colaba, Cuffe Parade, Nariman Point
  '400006', // Malabar Hill, Walkeshwar
  '400007', // Grant Road, Mazgaon
  '400008', // Byculla
  '400009', // Mazgaon, Reay Road
  '400010', // Parel
  '400011', // Curry Road, Lalbaug
  '400012', // Dadar West
  '400013', // Dadar East
  '400014', // Naigaon, Matunga West
  '400015', // Sewri (East)
  '400016', // Mahim
  '400017', // Dharavi
  '400018', // Worli
  '400019', // Sion West
  '400020', // Churchgate, Nariman Point
  '400021', // Wadala
  '400022', // King's Circle, Matunga East
  '400023', // Shivaji Park area
  '400024', // Chembur West
  '400025', // Sion East
  '400026', // Lower Parel (north)
  '400027', // Sewri
  '400028', // Dadar Colony
  '400029', // Mahim (east pocket)
  '400030', // Worli Sea Face
  '400031', // Lower Parel
  '400032', // Elphinstone Road
  '400033', // Reay Road, Dockyard
  '400034', // Cotton Green
  '400036', // Antop Hill, Wadala East
  '400037', // Chembur (east pocket)
  '400038', // Govandi (north)
  '400039', // Ghatla

  // ── Western Suburbs ─────────────────────────────────────────────────────────
  '400049', // Bandra West
  '400050', // Bandra East, Bandra Kurla Complex (BKC)
  '400051', // Khar West
  '400052', // Santacruz West
  '400053', // Vile Parle West
  '400054', // Andheri West
  '400055', // Juhu, JVPD
  '400056', // Andheri East
  '400057', // Jogeshwari West
  '400058', // Jogeshwari East
  '400059', // Goregaon West
  '400060', // Goregaon East, SEEPZ
  '400061', // Malad West
  '400062', // Malad East
  '400063', // Kandivali West
  '400064', // Kandivali East
  '400065', // Borivali West
  '400066', // Borivali East
  '400067', // Dahisar East
  '400068', // Dahisar West

  // ── Eastern Suburbs ─────────────────────────────────────────────────────────
  '400070', // Kurla West
  '400071', // Kurla East
  '400072', // Ghatkopar West
  '400074', // Ghatkopar East
  '400075', // Vikhroli West
  '400076', // Bhandup West
  '400077', // Bhandup East
  '400078', // Kanjurmarg
  '400079', // Mulund West
  '400080', // Mulund East
  '400081', // Powai, Chandivali
  '400082', // Vikhroli East
  '400083', // Bhandup (central)
  '400084', // Santacruz East
  '400086', // Chembur East
  '400087', // Govandi, Shivaji Nagar
  '400088', // Mankhurd
  '400089', // Trombay, BARC Colony
  '400090', // Chembur (south)
  '400091', // Ghatkopar (pocket)
  '400092', // Andheri East (MIDC)
  '400093', // Sakinaka, Andheri East
  '400094', // Chakala, Andheri East
  '400097', // Vile Parle East
  '400099', // Santacruz East (pocket)

  // ── Extended Mumbai / Island City pockets ───────────────────────────────────
  '400101', // Dahanu Road area / Borivali pocket
  '400102', // Kandivali pocket
  '400103', // Malad pocket
  '400104', // Goregaon pocket

  // ── Thane Municipal Corporation (MMR) ───────────────────────────────────────
  '400601', // Thane West
  '400602', // Thane East
  '400603', // Thane (Naupada)
  '400604', // Kalwa
  '400605', // Mumbra, Kausa
  '400606', // Diva
  '400607', // Shilphata, Balkum
  '400608', // Mira Road East
  '400609', // Bhayander East
  '400610', // Bhayander West
  '400611', // Vasai East
  '400612', // Nallasopara East
  '400613', // Virar West
  '400614', // Bhayander (south pocket)
  '400615', // Mira Road West

  // ── Navi Mumbai (NMMC / CIDCO area) ─────────────────────────────────────────
  '400701', // Nerul, Seawoods
  '400702', // Kopar Khairane
  '400703', // CBD Belapur, Sector 11
  '400704', // Kharghar
  '400705', // Panvel (south)
  '400706', // Panvel (north)
  '400707', // Panvel (east)
  '400708', // Airoli
  '400709', // Ghansoli
  '400710', // Sanpada, Turbhe
];

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  const ops = MUMBAI_PINCODES.map((p) => ({
    updateOne: {
      filter: { pincode: p },
      update:  { $set: { pincode: p } },
      upsert:  true,
    },
  }));

  const result = await Pincode.bulkWrite(ops);
  console.log(`Done — ${result.upsertedCount} new, ${result.matchedCount} already existed`);
  console.log(`Total Mumbai pincodes in DB: ${MUMBAI_PINCODES.length}`);

  await mongoose.disconnect();
}

run().catch((err) => { console.error(err); process.exit(1); });
