/**
 * Run: node src/seedProducts.js
 * Seeds products with unique images (1 per product) and proper collectionStyles/themes.
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Product  = require('./models/Product');
const Category = require('./models/Category');

const MONGO_URI = process.env.MONGO_URI;
const VENDOR_ID = '69d9dd3a6abca9c44a6bbee0';

const slug = (s) => s.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
const u = (id) => `https://images.unsplash.com/photo-${id}?w=800&h=900&fit=crop&q=80&auto=format`;

// ── Unique Unsplash jewelry photo IDs ─────────────────────────────────────────
// Each product gets exactly ONE unique image — no repeats within same category

const RING_PHOTOS = [
  '1605100804763-247f67b3557e', // diamond solitaire ring white bg
  '1515562141207-7a88fb7ce338', // gold ring top-down
  '1535632787350-4e68ef0ac584', // hand with diamond ring
  '1524592094714-0f0654e359d3', // engagement ring close-up
  '1599643477877-530eb83abc8e', // pink sapphire ring
  '1553361442-ecc3b05e18b7',    // two wedding bands
  '1573408301690-84fd37a8c1f8', // solitaire on marble
  '1574258049359-b9b08c1c2a8f', // gold band close-up
  '1617038260897-41a4b57a9f18', // diamond eternity ring
  '1566992336557-2bf-f9152b47', // rose gold halo ring
  '1531995811006-35cb42e1a022', // oval diamond ring
  '1549880338-65ddcdfd017b',    // emerald cut ring
];

const EARRING_PHOTOS = [
  '1603561591411-07134e71a2a9', // pearl stud earrings white bg
  '1583937443866-1d36a5ef5ee7', // gold drop earrings
  '1568781222751-8d3428f1ffb4', // hoop earrings close-up
  '1506630268-ef1f507c44e3',    // chandelier earrings
  '1563290045-8d8c8f3e9df9',    // pearl drop earrings on white
  '1617038220319-233afe49f3c6', // gold hoops on marble
  '1589556763691-50cce70fb0a3', // diamond studs close-up
  '1640204016851-34f2a63c2e9a', // jhumka earrings
  '1563245372-f21724e3856d',    // dangle earrings
  '1507003211169-0a1dd7228f2d', // ear cuff earrings
  '1509631179647-0177331693ae', // gemstone earrings
];

const PENDANT_PHOTOS = [
  '1526559397742-96d0a8cf7e6e', // small diamond pendant
  '1598618844845-e4b5aa2c2ab8', // pendant necklace on neck
  '1651009185537-a7f76e0ae3e4', // heart pendant gold
  '1549298916-b41d501d3772',    // silver pendant charm
  '1589374527286-fd81765f3e5b', // cross pendant
  '1620367396-a990826e65f1',    // gemstone pendant
  '1525706820223-fc8917e2f93a', // religious pendant
  '1631556799-08-56-42-b36e-c16a0afb0bf7', // evil eye pendant
  '1611591411-07134e71a2a9',    // solitaire pendant
  '1543294001-f7cd5d7fb516',    // layered pendants
];

const NECKLACE_PHOTOS = [
  '1611085583191-a3b181a88401', // gold chain necklace
  '1541679857-6ba26c1d5e96',    // layered gold chains
  '1518611012118-696072aa579a', // tennis necklace close-up
  '1578091879584-59b3aa52dfb2', // pearl necklace
  '1601821765780-754fa98af1aa', // diamond line necklace
  '1586105449695-1e9e3e43b96c', // multi-strand necklace
  '1617038260897-41a4b57a9f18', // kundan necklace
  '1568781222751-8d3428f1ffb4', // choker necklace
  '1598618844845-e4b5aa2c2ab8', // pendant on neck
  '1519741497674-4f657de4a45e', // gold rope chain
  '1607077601595-de7aba4e6d68', // statement necklace
];

const BANGLE_PHOTOS = [
  '1543294001-f7cd5d7fb516',    // gold bangles stacked
  '1617038220319-233afe49f3c6', // gold bangle close-up
  '1620367396-a990826e65f1',    // kundan bangle
  '1607077601595-de7aba4e6d68', // diamond bangle
  '1568781222751-8d3428f1ffb4', // plain gold bangle
  '1555804778-5a81a77b4adc',    // silver bangle
  '1563290045-8d8c8f3e9df9',    // meenakari bangle
  '1589556763691-50cce70fb0a3', // antique bangle
  '1601821765780-754fa98af1aa', // temple bangle
  '1611085583191-a3b181a88401', // diamond-studded bangle
];

const BRACELET_PHOTOS = [
  '1535632787350-4e68ef0ac584', // tennis bracelet close-up
  '1549298916-b41d501d3772',    // silver charm bracelet
  '1571006682619-c17bb5f2e46f', // gold cuff bracelet
  '1617038260897-41a4b57a9f18', // diamond bracelet
  '1563245372-f21724e3856d',    // chain bracelet
  '1575584592-c67d2acfd3bc',    // beaded bracelet
  '1583937443866-1d36a5ef5ee7', // pearl bracelet
  '1606760227091-3dd870d97f1d', // layered bracelets
  '1524592094714-0f0654e359d3', // gold bangle bracelet
  '1603561591411-07134e71a2a9', // sapphire bracelet
];

const CHAIN_PHOTOS = [
  '1518611012118-696072aa579a', // gold rope chain close-up
  '1541679857-6ba26c1d5e96',    // figaro chain
  '1519741497674-4f657de4a45e', // box chain gold
  '1578091879584-59b3aa52dfb2', // curb chain
  '1601821765780-754fa98af1aa', // singapore chain
  '1611085583191-a3b181a88401', // wheat chain
  '1526559397742-96d0a8cf7e6e', // snake chain
  '1598618844845-e4b5aa2c2ab8', // rolo chain
  '1607077601595-de7aba4e6d68', // franco chain
  '1555804778-5a81a77b4adc',    // mariner chain
];

const NOSEPIN_PHOTOS = [
  '1603561591411-07134e71a2a9', // diamond nosepin
  '1583937443866-1d36a5ef5ee7', // gold nose ring
  '1568781222751-8d3428f1ffb4', // small stud nosepin
  '1563290045-8d8c8f3e9df9',    // kundan nosepin
  '1526559397742-96d0a8cf7e6e', // ruby nosepin
  '1617038220319-233afe49f3c6', // screw back nosepin
  '1599643477877-530eb83abc8e', // emerald nosepin
  '1524592094714-0f0654e359d3', // hoop nosepin
];

const MANGA_PHOTOS = [
  '1543294001-f7cd5d7fb516',    // black beads mangalsutra
  '1611085583191-a3b181a88401', // gold mangalsutra
  '1601821765780-754fa98af1aa', // diamond mangalsutra
  '1518611012118-696072aa579a', // traditional mangalsutra
  '1541679857-6ba26c1d5e96',    // modern mangalsutra
  '1519741497674-4f657de4a45e', // short mangalsutra
  '1578091879584-59b3aa52dfb2', // tanmaniya mangalsutra
  '1607077601595-de7aba4e6d68', // fancy mangalsutra
  '1617038220319-233afe49f3c6', // double-layer mangalsutra
  '1555804778-5a81a77b4adc',    // platinum mangalsutra
];

const ANKLET_PHOTOS = [
  '1583937443866-1d36a5ef5ee7', // gold anklet on foot
  '1535632787350-4e68ef0ac584', // silver anklet
  '1563245372-f21724e3856d',    // beaded anklet
  '1606760227091-3dd870d97f1d', // diamond anklet
  '1549298916-b41d501d3772',    // layered anklets
  '1575584592-c67d2acfd3bc',    // oxidised anklet
  '1617038260897-41a4b57a9f18', // gold chain anklet
  '1524592094714-0f0654e359d3', // gemstone anklet
];

const KADA_PHOTOS = [
  '1617038220319-233afe49f3c6', // broad gold kada
  '1543294001-f7cd5d7fb516',    // diamond kada
  '1568781222751-8d3428f1ffb4', // carved kada
  '1620367396-a990826e65f1',    // kundan kada
  '1611085583191-a3b181a88401', // plain gold kada
  '1605100804763-247f67b3557e', // antique kada
  '1607077601595-de7aba4e6d68', // silver kada
  '1556742049-0cfed4f6a45d',    // bangle-style kada
  '1515562141207-7a88fb7ce338', // men's kada
  '1563290045-8d8c8f3e9df9',    // temple kada
];

const CHARM_PHOTOS = [
  '1526559397742-96d0a8cf7e6e', // evil eye charm
  '1651009185537-a7f76e0ae3e4', // heart charm
  '1549298916-b41d501d3772',    // moon star charm
  '1589374527286-fd81765f3e5b', // cross charm
  '1620367396-a990826e65f1',    // flower charm
  '1524592094714-0f0654e359d3', // diamond charm
  '1566643269-e0c21e3fd0a1',    // infinity charm
  '1599643477877-530eb83abc8e', // birthstone charm
];

// ── Product definitions ────────────────────────────────────────────────────────
const PRODUCTS = {
  rings: [
    { title: 'Classic Solitaire Diamond Ring',  price: 42500, compare: 52000, stock: 15, img: RING_PHOTOS[0],  collectionStyles: ['Solitaire'], themes: ['Round'],    featured: true,  bestSeller: true,  newArrival: false, desc: 'Timeless round brilliant solitaire in 18KT white gold. IGI certified. Perfect for engagements.' },
    { title: 'Diamond Halo Engagement Ring',    price: 68000, compare: 82000, stock: 8,  img: RING_PHOTOS[1],  collectionStyles: ['Halo'],      themes: ['Round'],    featured: true,  bestSeller: false, newArrival: true,  desc: 'Stunning halo design with centre diamond surrounded by 18 micro-pavé stones. 18KT white gold.' },
    { title: 'Gold Band Ring 22KT',             price: 12500, compare: 15000, stock: 25, img: RING_PHOTOS[2],  collectionStyles: ['Plain Gold'], themes: ['Round'],   featured: false, bestSeller: true,  newArrival: false, desc: 'Classic plain gold band in 22KT yellow gold. Hallmarked. Comfortable fit.' },
    { title: 'Rose Gold Oval Solitaire Ring',   price: 35000, compare: 42000, stock: 10, img: RING_PHOTOS[3],  collectionStyles: ['Solitaire'], themes: ['Oval'],     featured: true,  bestSeller: false, newArrival: true,  desc: 'Pear-shaped diamond in rose gold bezel setting. Elegant and contemporary.' },
    { title: 'Three Stone Trilogy Ring',        price: 55000, compare: 68000, stock: 12, img: RING_PHOTOS[4],  collectionStyles: ['Trilogy'],   themes: ['Round'],    featured: false, bestSeller: true,  newArrival: false, desc: 'Past, present, future — three round brilliant diamonds in platinum-plated 18KT gold.' },
    { title: 'Emerald Cut Solitaire Ring',      price: 78000, compare: 95000, stock: 6,  img: RING_PHOTOS[5],  collectionStyles: ['Solitaire'], themes: ['Emerald'],  featured: true,  bestSeller: false, newArrival: true,  desc: 'Bold emerald-cut lab-grown diamond with tapered baguette side stones.' },
    { title: 'Floral Diamond Cocktail Ring',    price: 28000, compare: 34000, stock: 20, img: RING_PHOTOS[6],  collectionStyles: ['Cocktail'],  themes: ['Round'],    featured: false, bestSeller: false, newArrival: true,  desc: 'Delicate flower motif with diamond petals. 18KT yellow gold. Perfect everyday ring.' },
    { title: 'Gold Couple Band Ring 22KT',      price: 9800,  compare: 12000, stock: 30, img: RING_PHOTOS[7],  collectionStyles: ['Couple Bands'], themes: ['Round'], featured: false, bestSeller: true,  newArrival: false, desc: 'Elegant twisted rope design in 22KT gold. Lightweight and comfortable.' },
    { title: 'Oval Diamond Cocktail Ring',      price: 85000, compare: 102000,stock: 4,  img: RING_PHOTOS[8],  collectionStyles: ['Cocktail'],  themes: ['Oval'],     featured: true,  bestSeller: false, newArrival: false, desc: 'Large oval-cut diamond in open-gallery setting. 18KT white gold with micro-pavé band.' },
    { title: 'Eternity Diamond Band Ring',      price: 18500, compare: 22000, stock: 18, img: RING_PHOTOS[9],  collectionStyles: ['Eternity','Stackable'], themes: ['Round'], featured: false, bestSeller: true, newArrival: true, desc: 'Slim eternity band with 0.25ct TW diamonds. Stacks beautifully with engagement rings.' },
    { title: 'Cushion Cut Statement Ring',      price: 52000, compare: 64000, stock: 7,  img: RING_PHOTOS[10], collectionStyles: ['Statement'], themes: ['Cushion'],  featured: false, bestSeller: false, newArrival: true,  desc: 'Cushion-cut ruby centre with diamond halo. 18KT yellow gold. For the bold.' },
    { title: 'Stackable Princess Band',         price: 32000, compare: 38500, stock: 14, img: RING_PHOTOS[11], collectionStyles: ['Stackable'], themes: ['Princess'], featured: true,  bestSeller: true,  newArrival: false, desc: 'Princess-cut diamond infinity symbol design. Symbol of eternal love.' },
  ],

  earrings: [
    { title: 'Diamond Stud Earrings 18KT',      price: 18500, compare: 23000, stock: 30, img: EARRING_PHOTOS[0],  collectionStyles: ['Studs'],      themes: ['Round'],    featured: true,  bestSeller: true,  newArrival: false, desc: 'Classic round brilliant diamond studs in 18KT white gold push-back setting. 0.30ct TW.' },
    { title: 'Pearl Drop Earrings Gold',         price: 9800,  compare: 12500, stock: 22, img: EARRING_PHOTOS[1],  collectionStyles: ['Drops'],      themes: ['Oval'],     featured: true,  bestSeller: false, newArrival: false, desc: 'Freshwater pearl drop with diamond bail in 18KT gold. Timeless elegance for weddings.' },
    { title: 'Gold Hoop Earrings 22KT',          price: 14500, compare: 17500, stock: 35, img: EARRING_PHOTOS[2],  collectionStyles: ['Hoops'],      themes: ['Round'],    featured: false, bestSeller: true,  newArrival: false, desc: 'Classic polished gold hoops in 22KT yellow gold. Comfortable all-day wear.' },
    { title: 'Kundan Jhumka Earrings',           price: 22000, compare: 27000, stock: 15, img: EARRING_PHOTOS[3],  collectionStyles: ['Jhumka'],     themes: ['Round'],    featured: false, bestSeller: false, newArrival: true,  desc: 'Traditional Kundan meenakari jhumka in 22KT gold with emerald-green enamel.' },
    { title: 'Diamond Hoop Earrings 18KT',       price: 38000, compare: 46000, stock: 12, img: EARRING_PHOTOS[4],  collectionStyles: ['Hoops'],      themes: ['Round'],    featured: true,  bestSeller: true,  newArrival: false, desc: 'Inside-out diamond hoop earrings. 18KT white gold. 0.80ct TW brilliant cut.' },
    { title: 'Chandelier Diamond Drop Earrings', price: 45000, compare: 55000, stock: 8,  img: EARRING_PHOTOS[5],  collectionStyles: ['Chandelier'], themes: ['Pear'],     featured: false, bestSeller: false, newArrival: true,  desc: 'Multi-tier diamond chandelier drops for weddings. 18KT gold. 1.5ct TW.' },
    { title: 'Gold Huggie Hoop Earrings',        price: 7500,  compare: 9500,  stock: 28, img: EARRING_PHOTOS[6],  collectionStyles: ['Huggies'],    themes: ['Round'],    featured: false, bestSeller: true,  newArrival: true,  desc: 'Minimalist gold huggie ear hoops in 18KT yellow gold.' },
    { title: 'Rose Gold Heart Studs',            price: 12500, compare: 15000, stock: 20, img: EARRING_PHOTOS[7],  collectionStyles: ['Studs'],      themes: ['Heart'],    featured: false, bestSeller: false, newArrival: true,  desc: 'Tiny diamond heart studs in 18KT rose gold. Delicate and romantic.' },
    { title: 'Temple Jhumka Gold Earrings',      price: 32000, compare: 38000, stock: 10, img: EARRING_PHOTOS[8],  collectionStyles: ['Jhumka'],     themes: ['Oval'],     featured: true,  bestSeller: false, newArrival: false, desc: 'Traditional South Indian temple-work jhumka in 22KT gold with ruby and emerald.' },
    { title: 'Sapphire Statement Earrings',      price: 52000, compare: 63000, stock: 6,  img: EARRING_PHOTOS[9],  collectionStyles: ['Statement'],  themes: ['Oval'],     featured: false, bestSeller: false, newArrival: true,  desc: 'Royal blue sapphire with diamond halo drop. 18KT white gold. Certified sapphires.' },
    { title: 'Twisted Gold Hoop Earrings',       price: 18000, compare: 22000, stock: 25, img: EARRING_PHOTOS[10], collectionStyles: ['Hoops'],      themes: ['Round'],    featured: false, bestSeller: true,  newArrival: false, desc: 'Hammered texture twisted hoop in 22KT yellow gold. Modern meets traditional.' },
  ],

  pendants: [
    { title: 'Diamond Solitaire Pendant 18KT',   price: 15000, compare: 18500, stock: 25, img: PENDANT_PHOTOS[0], collectionStyles: ['Solitaire'], themes: ['Round'],    featured: true,  bestSeller: true,  newArrival: false, desc: 'Classic diamond solitaire pendant in 18KT white gold. 0.15ct brilliant cut.' },
    { title: 'Diamond Floral Pendant Set',        price: 65000, compare: 80000, stock: 5,  img: PENDANT_PHOTOS[1], collectionStyles: ['Floral'],    themes: ['Round'],    featured: true,  bestSeller: true,  newArrival: false, desc: 'Statement floral pendant with 1.2ct TW diamonds. 18KT white gold. For weddings.' },
    { title: 'Gold Heart Pendant 22KT',           price: 8500,  compare: 10500, stock: 30, img: PENDANT_PHOTOS[2], collectionStyles: ['Heart'],     themes: ['Heart'],    featured: false, bestSeller: false, newArrival: true,  desc: 'Classic gold heart pendant in 22KT yellow gold. Lightweight gift for loved ones.' },
    { title: 'Evil Eye Diamond Pendant',          price: 12000, compare: 15000, stock: 20, img: PENDANT_PHOTOS[3], collectionStyles: ['Evil Eye'],  themes: ['Oval'],     featured: false, bestSeller: true,  newArrival: false, desc: 'Evil eye pendant with central diamond in 18KT yellow gold. For protection.' },
    { title: 'Ganesh Gold Pendant 22KT',          price: 14000, compare: 17000, stock: 15, img: PENDANT_PHOTOS[4], collectionStyles: ['Religious'], themes: ['Round'],    featured: false, bestSeller: false, newArrival: false, desc: 'Intricately crafted Ganesh pendant in 22KT gold. Ideal for gifting.' },
    { title: 'Ruby Gemstone Pendant 18KT',        price: 28000, compare: 34000, stock: 10, img: PENDANT_PHOTOS[5], collectionStyles: ['Gemstone'],  themes: ['Oval'],     featured: true,  bestSeller: false, newArrival: true,  desc: 'Oval ruby pendant with diamond halo in 18KT yellow gold. Certified stone.' },
    { title: 'Om Gold Pendant 22KT',              price: 10500, compare: 13000, stock: 18, img: PENDANT_PHOTOS[6], collectionStyles: ['Religious'], themes: ['Round'],    featured: false, bestSeller: false, newArrival: false, desc: 'Sacred Om pendant in 22KT yellow gold. Traditional and elegant design.' },
    { title: 'Princess Cut Diamond Pendant',      price: 22000, compare: 27500, stock: 12, img: PENDANT_PHOTOS[7], collectionStyles: ['Solitaire'], themes: ['Princess'], featured: false, bestSeller: true,  newArrival: false, desc: 'Princess-cut solitaire pendant in 18KT white gold. Modern geometric design.' },
    { title: 'Emerald Teardrop Pendant',          price: 35000, compare: 43000, stock: 8,  img: PENDANT_PHOTOS[8], collectionStyles: ['Gemstone'],  themes: ['Pear'],     featured: true,  bestSeller: false, newArrival: true,  desc: 'Natural emerald teardrop with pavé diamond surround. 18KT gold setting.' },
    { title: 'Infinity Diamond Pendant',          price: 18500, compare: 22000, stock: 15, img: PENDANT_PHOTOS[9], collectionStyles: ['Infinity'],  themes: ['Round'],    featured: false, bestSeller: true,  newArrival: false, desc: 'Infinity symbol pendant with micro-pavé diamonds. Symbol of eternal love.' },
  ],

  necklaces: [
    { title: 'Kundan Choker Necklace',            price: 85000, compare: 105000,stock: 5,  img: NECKLACE_PHOTOS[0],  collectionStyles: ['Kundan','Choker'], themes: ['Round'],  featured: true,  bestSeller: true,  newArrival: false, desc: 'Royal Kundan choker with uncut diamonds and natural gemstones. 22KT gold base.' },
    { title: 'Diamond Tennis Necklace 18KT',      price: 125000,compare: 155000,stock: 4,  img: NECKLACE_PHOTOS[1],  collectionStyles: ['Tennis'],          themes: ['Round'],  featured: true,  bestSeller: false, newArrival: false, desc: 'Classic line necklace with 3ct TW round brilliant diamonds. 18KT white gold.' },
    { title: 'Rope Chain Necklace 22KT',          price: 22000, compare: 27000, stock: 20, img: NECKLACE_PHOTOS[2],  collectionStyles: ['Chain'],           themes: ['Round'],  featured: false, bestSeller: true,  newArrival: false, desc: 'Classic 22KT gold rope chain. 18-inch length. Perfect everyday necklace.' },
    { title: 'Pearl Strand Necklace Gold',        price: 45000, compare: 55000, stock: 10, img: NECKLACE_PHOTOS[3],  collectionStyles: ['Pearl'],           themes: ['Round'],  featured: false, bestSeller: false, newArrival: true,  desc: 'Freshwater pearl single-strand necklace with 22KT gold clasp.' },
    { title: 'Diamond Line Necklace 18KT',        price: 92000, compare: 112000,stock: 6,  img: NECKLACE_PHOTOS[4],  collectionStyles: ['Tennis'],          themes: ['Round'],  featured: true,  bestSeller: false, newArrival: true,  desc: 'Stunning diamond-by-the-yard necklace. 2ct TW. 18KT white gold.' },
    { title: 'Layered Gold Chain Set',            price: 38000, compare: 46000, stock: 12, img: NECKLACE_PHOTOS[5],  collectionStyles: ['Layered','Chain'], themes: ['Round'],  featured: false, bestSeller: true,  newArrival: false, desc: 'Two-layered gold chain set in 22KT yellow gold. Trendy and elegant.' },
    { title: 'Floral Diamond Necklace',           price: 95000, compare: 118000,stock: 3,  img: NECKLACE_PHOTOS[6],  collectionStyles: ['Floral'],          themes: ['Round'],  featured: true,  bestSeller: false, newArrival: true,  desc: 'Statement floral necklace with 2.5ct TW diamonds. 18KT white gold. For weddings.' },
    { title: 'Choker Diamond Gold Necklace',      price: 72000, compare: 88000, stock: 7,  img: NECKLACE_PHOTOS[7],  collectionStyles: ['Choker'],          themes: ['Round'],  featured: false, bestSeller: false, newArrival: false, desc: 'Diamond-studded choker in 18KT white gold. For festive occasions.' },
    { title: 'Gold Pendant Chain Necklace',       price: 28000, compare: 34000, stock: 15, img: NECKLACE_PHOTOS[8],  collectionStyles: ['Pendant','Chain'], themes: ['Oval'],   featured: false, bestSeller: true,  newArrival: false, desc: 'Diamond pendant on gold chain. 18KT white gold. All-occasion necklace.' },
    { title: 'Box Chain Necklace 22KT',           price: 18000, compare: 22000, stock: 25, img: NECKLACE_PHOTOS[9],  collectionStyles: ['Chain'],           themes: ['Round'],  featured: false, bestSeller: false, newArrival: true,  desc: 'Square box chain in 22KT yellow gold. 20-inch length. Sturdy and classic.' },
    { title: 'Emerald Pendant Necklace',          price: 55000, compare: 68000, stock: 8,  img: NECKLACE_PHOTOS[10], collectionStyles: ['Pendant','Gemstone'],themes: ['Emerald'],featured: true, bestSeller: false, newArrival: true, desc: 'Colombian emerald pendant with diamond surround. 18KT gold.' },
  ],

  bangles: [
    { title: 'Temple Gold Bangle Set 22KT',       price: 42000, compare: 52000, stock: 10, img: BANGLE_PHOTOS[0], collectionStyles: ['Temple'], themes: ['Round'],    featured: true,  bestSeller: true,  newArrival: false, desc: 'South Indian temple-work bangle set in 22KT gold. Set of 2 with ruby accents.' },
    { title: 'Diamond Bangle 18KT',               price: 85000, compare: 105000,stock: 5,  img: BANGLE_PHOTOS[1], collectionStyles: ['Diamond'],themes: ['Round'],    featured: true,  bestSeller: false, newArrival: false, desc: 'Full eternity diamond bangle in 18KT white gold. 1.20ct TW brilliant cut.' },
    { title: 'Plain Gold Bangle 22KT',             price: 18000, compare: 22000, stock: 30, img: BANGLE_PHOTOS[2], collectionStyles: ['Plain Gold'],themes: ['Round'],  featured: false, bestSeller: true,  newArrival: false, desc: 'Classic plain gold bangle in 22KT yellow gold. Hallmarked. Everyday wear.' },
    { title: 'Meenakari Floral Bangle',            price: 28000, compare: 34000, stock: 15, img: BANGLE_PHOTOS[3], collectionStyles: ['Meenakari'],themes: ['Round'],   featured: false, bestSeller: false, newArrival: true,  desc: 'Colorful meenakari enamel bangle in 22KT gold with floral patterns.' },
    { title: 'Antique Gold Bangle',                price: 22000, compare: 27000, stock: 20, img: BANGLE_PHOTOS[4], collectionStyles: ['Antique'], themes: ['Round'],   featured: false, bestSeller: false, newArrival: false, desc: 'Antique-finish oxidised gold bangle in 22KT. Traditional south Indian design.' },
    { title: 'Silver Bangle Pair',                 price: 5500,  compare: 7000,  stock: 35, img: BANGLE_PHOTOS[5], collectionStyles: ['Plain Gold'],themes: ['Round'],  featured: false, bestSeller: true,  newArrival: false, desc: 'Sterling silver plain bangle pair. 92.5 silver. Everyday ethnic wear.' },
    { title: 'Kundan Bangle Set Bridal',           price: 92000, compare: 115000,stock: 3,  img: BANGLE_PHOTOS[6], collectionStyles: ['Kundan'], themes: ['Round'],    featured: true,  bestSeller: false, newArrival: true,  desc: 'Bridal Kundan bangle set with uncut diamonds and emerald drops. Set of 2. 22KT.' },
    { title: 'Diamond Kada Bangle',                price: 68000, compare: 84000, stock: 6,  img: BANGLE_PHOTOS[7], collectionStyles: ['Diamond'],themes: ['Round'],    featured: false, bestSeller: false, newArrival: false, desc: 'Broad diamond-studded kada bangle in 18KT white gold. 1ct TW.' },
    { title: 'Ruby Gold Bangle 22KT',              price: 35000, compare: 43000, stock: 12, img: BANGLE_PHOTOS[8], collectionStyles: ['Gemstone'],themes: ['Round'],   featured: true,  bestSeller: false, newArrival: true,  desc: 'Ruby and diamond-studded bangle in 22KT gold. Festive and occasion wear.' },
    { title: 'Twisted Gold Bangle 22KT',           price: 15000, compare: 18500, stock: 22, img: BANGLE_PHOTOS[9], collectionStyles: ['Plain Gold'],themes: ['Round'],  featured: false, bestSeller: true,  newArrival: false, desc: 'Twisted rope-design gold bangle in 22KT. Lightweight. Daily wear.' },
  ],

  bracelets: [
    { title: 'Diamond Tennis Bracelet 18KT',       price: 85000, compare: 105000,stock: 6,  img: BRACELET_PHOTOS[0], collectionStyles: ['Tennis'],  themes: ['Round'],  featured: true,  bestSeller: true,  newArrival: false, desc: 'Classic four-prong set diamond tennis bracelet. 7-inch length. 3ct TW. 18KT white gold.' },
    { title: 'Gold Charm Bracelet 18KT',           price: 22000, compare: 27000, stock: 18, img: BRACELET_PHOTOS[1], collectionStyles: ['Chain'],   themes: ['Round'],  featured: false, bestSeller: true,  newArrival: false, desc: 'Delicate gold chain bracelet with diamond charm. 18KT yellow gold. 7-inch.' },
    { title: 'Gold Cuff Bracelet 22KT',            price: 38000, compare: 46000, stock: 10, img: BRACELET_PHOTOS[2], collectionStyles: ['Cuff'],    themes: ['Round'],  featured: false, bestSeller: false, newArrival: true,  desc: 'Wide cuff bracelet in 22KT yellow gold. Statement piece for festive occasions.' },
    { title: 'Diamond Line Bracelet 18KT',         price: 65000, compare: 80000, stock: 7,  img: BRACELET_PHOTOS[3], collectionStyles: ['Tennis'],  themes: ['Round'],  featured: true,  bestSeller: false, newArrival: false, desc: 'Diamond line bracelet in 18KT white gold. 1.5ct TW brilliant diamonds.' },
    { title: 'Sapphire Tennis Bracelet',           price: 95000, compare: 118000,stock: 4,  img: BRACELET_PHOTOS[4], collectionStyles: ['Tennis'],  themes: ['Oval'],   featured: true,  bestSeller: false, newArrival: false, desc: 'Royal blue sapphire and diamond tennis bracelet. 18KT white gold. Ceylon sapphires.' },
    { title: 'Pearl Chain Bracelet Gold',          price: 18000, compare: 22000, stock: 20, img: BRACELET_PHOTOS[5], collectionStyles: ['Pearl'],   themes: ['Round'],  featured: false, bestSeller: false, newArrival: true,  desc: 'Freshwater pearl bracelet with 18KT gold clasp. Elegant and timeless.' },
    { title: 'Emerald Gold Bracelet 18KT',         price: 52000, compare: 64000, stock: 8,  img: BRACELET_PHOTOS[6], collectionStyles: ['Gemstone'],themes: ['Emerald'],featured: false, bestSeller: false, newArrival: true,  desc: 'Colombian emerald bracelet with diamond accents. 18KT gold setting.' },
    { title: 'Layered Chain Bracelet Set',         price: 12000, compare: 15000, stock: 25, img: BRACELET_PHOTOS[7], collectionStyles: ['Chain'],   themes: ['Round'],  featured: false, bestSeller: true,  newArrival: false, desc: 'Layered gold chain bracelet set of 3 in 18KT yellow gold. Stacking style.' },
    { title: 'Ruby Diamond Bracelet 18KT',         price: 72000, compare: 88000, stock: 5,  img: BRACELET_PHOTOS[8], collectionStyles: ['Gemstone'],themes: ['Oval'],   featured: true,  bestSeller: false, newArrival: true,  desc: 'Ruby and diamond alternating bracelet. 18KT gold. For festive occasions.' },
    { title: 'Plain Gold Bracelet 22KT',           price: 16000, compare: 19500, stock: 28, img: BRACELET_PHOTOS[9], collectionStyles: ['Plain Gold'],themes: ['Round'], featured: false, bestSeller: true,  newArrival: false, desc: 'Simple plain gold bracelet in 22KT yellow gold. 7-inch length.' },
  ],

  chains: [
    { title: 'Rope Chain 22KT Yellow Gold',          price: 18000, compare: 22000, stock: 30, img: CHAIN_PHOTOS[0], collectionStyles: ['Rope'],    themes: ['Round'],  featured: false, bestSeller: true,  newArrival: false, desc: 'Classic rope chain in 22KT yellow gold. 20-inch length. Sturdy and lustrous.' },
    { title: 'Figaro Chain 22KT Gold',             price: 14000, compare: 17000, stock: 25, img: CHAIN_PHOTOS[1], collectionStyles: ['Figaro'],  themes: ['Round'],  featured: false, bestSeller: true,  newArrival: false, desc: 'Traditional Italian Figaro chain pattern in 22KT yellow gold. 18-inch.' },
    { title: 'Box Chain 22KT Gold',                price: 12000, compare: 15000, stock: 28, img: CHAIN_PHOTOS[2], collectionStyles: ['Box'],     themes: ['Round'],  featured: false, bestSeller: false, newArrival: true,  desc: 'Square box chain in 22KT yellow gold. 20-inch. Perfect for pendants.' },
    { title: 'Curb Chain 22KT Gold',               price: 16000, compare: 19500, stock: 20, img: CHAIN_PHOTOS[3], collectionStyles: ['Curb'],    themes: ['Round'],  featured: false, bestSeller: true,  newArrival: false, desc: 'Heavy curb chain in 22KT yellow gold. 22-inch. Bold and masculine.' },
    { title: 'Singapore Twist Chain 22KT',         price: 22000, compare: 27000, stock: 18, img: CHAIN_PHOTOS[4], collectionStyles: ['Singapore'],themes: ['Round'], featured: true,  bestSeller: false, newArrival: false, desc: 'Twisted Singapore chain in 22KT yellow gold. 18-inch. Light and elegant.' },
    { title: 'Wheat Chain 22KT Gold',              price: 19000, compare: 23000, stock: 22, img: CHAIN_PHOTOS[5], collectionStyles: ['Wheat'],   themes: ['Round'],  featured: false, bestSeller: false, newArrival: true,  desc: 'Intricate wheat/spiga chain in 22KT yellow gold. 20-inch. Delicate look.' },
    { title: 'Snake Chain 18KT White Gold',        price: 24000, compare: 29000, stock: 15, img: CHAIN_PHOTOS[6], collectionStyles: ['Snake'],   themes: ['Round'],  featured: true,  bestSeller: false, newArrival: false, desc: 'Sleek snake chain in 18KT white gold. 18-inch. Ultra-smooth surface.' },
    { title: 'Rolo Chain 22KT Gold',               price: 13000, compare: 16000, stock: 26, img: CHAIN_PHOTOS[7], collectionStyles: ['Rolo'],    themes: ['Round'],  featured: false, bestSeller: true,  newArrival: false, desc: 'Chunky rolo chain in 22KT yellow gold. 20-inch. Ideal base chain.' },
    { title: 'Franco Chain 22KT Gold',             price: 28000, compare: 34000, stock: 12, img: CHAIN_PHOTOS[8], collectionStyles: ['Franco'],  themes: ['Round'],  featured: false, bestSeller: false, newArrival: true,  desc: 'Heavy franco chain in 22KT yellow gold. 22-inch. Premium mens chain.' },
    { title: 'Mariner Chain 22KT Gold',            price: 20000, compare: 24500, stock: 20, img: CHAIN_PHOTOS[9], collectionStyles: ['Mariner'], themes: ['Round'],  featured: true,  bestSeller: false, newArrival: false, desc: 'Nautical-inspired mariner chain in 22KT gold. 20-inch. Distinctive oval links.' },
  ],

  nosepins: [
    { title: 'Diamond Nosepin 18KT',               price: 4500,  compare: 5800,  stock: 40, img: NOSEPIN_PHOTOS[0], collectionStyles: ['Studs'],     themes: ['Round'],  featured: true,  bestSeller: true,  newArrival: false, desc: 'Classic diamond nosepin in 18KT yellow gold. Screw-back fitting. 0.02ct.' },
    { title: 'Gold Nose Ring 22KT',                price: 3200,  compare: 4000,  stock: 50, img: NOSEPIN_PHOTOS[1], collectionStyles: ['Hoop'],      themes: ['Round'],  featured: false, bestSeller: true,  newArrival: false, desc: 'Traditional gold nose ring in 22KT yellow gold. L-shaped pin. Easy to wear.' },
    { title: 'Small Diamond Stud Nosepin',         price: 6800,  compare: 8500,  stock: 35, img: NOSEPIN_PHOTOS[2], collectionStyles: ['Studs'],     themes: ['Round'],  featured: false, bestSeller: false, newArrival: true,  desc: 'Tiny brilliant-cut diamond nosepin. 18KT white gold. Modern and elegant.' },
    { title: 'Kundan Nosepin Gold',                price: 5500,  compare: 7000,  stock: 25, img: NOSEPIN_PHOTOS[3], collectionStyles: ['Kundan'],    themes: ['Round'],  featured: false, bestSeller: false, newArrival: false, desc: 'Traditional Kundan uncut diamond nosepin in 22KT gold.' },
    { title: 'Ruby Nosepin 22KT Gold',             price: 5000,  compare: 6200,  stock: 30, img: NOSEPIN_PHOTOS[4], collectionStyles: ['Gemstone'],  themes: ['Round'],  featured: false, bestSeller: true,  newArrival: false, desc: 'Natural ruby nosepin in 22KT yellow gold. Vibrant red color.' },
    { title: 'Screw Back Diamond Nosepin',         price: 7500,  compare: 9200,  stock: 28, img: NOSEPIN_PHOTOS[5], collectionStyles: ['Studs'],     themes: ['Round'],  featured: true,  bestSeller: false, newArrival: true,  desc: 'Diamond nosepin with screw-back in 18KT white gold. Secure fit.' },
    { title: 'Emerald Nosepin 18KT',               price: 6500,  compare: 8000,  stock: 22, img: NOSEPIN_PHOTOS[6], collectionStyles: ['Gemstone'],  themes: ['Oval'],   featured: false, bestSeller: false, newArrival: false, desc: 'Natural emerald nosepin in 18KT gold. Rich green color. Classic design.' },
    { title: 'Hoop Nosepin Gold 22KT',             price: 4200,  compare: 5200,  stock: 38, img: NOSEPIN_PHOTOS[7], collectionStyles: ['Hoop'],      themes: ['Round'],  featured: false, bestSeller: true,  newArrival: false, desc: 'Tiny gold hoop nose ring in 22KT yellow gold. Seamless closure.' },
  ],

  mangalsutra: [
    { title: 'Black Beads Gold Mangalsutra',       price: 22000, compare: 27000, stock: 20, img: MANGA_PHOTOS[0], collectionStyles: ['Gold'],     themes: ['Round'],  featured: true,  bestSeller: true,  newArrival: false, desc: 'Traditional black bead mangalsutra in 22KT gold. 18-inch length.' },
    { title: 'Diamond Mangalsutra 18KT',           price: 55000, compare: 68000, stock: 8,  img: MANGA_PHOTOS[1], collectionStyles: ['Diamond'],  themes: ['Round'],  featured: true,  bestSeller: false, newArrival: false, desc: 'Contemporary diamond pendant mangalsutra. 1ct TW. 18KT white gold with black beads.' },
    { title: 'Gold Tanmaniya Mangalsutra',         price: 32000, compare: 39000, stock: 15, img: MANGA_PHOTOS[2], collectionStyles: ['Gold'],     themes: ['Round'],  featured: false, bestSeller: true,  newArrival: false, desc: 'Minimal gold tanmaniya mangalsutra in 22KT yellow gold. Modern daily wear.' },
    { title: 'Traditional Long Mangalsutra',       price: 48000, compare: 58000, stock: 10, img: MANGA_PHOTOS[3], collectionStyles: ['Gold'],     themes: ['Round'],  featured: false, bestSeller: false, newArrival: true,  desc: 'Long 24-inch black bead mangalsutra with 22KT gold design. Traditional style.' },
    { title: 'Short Diamond Mangalsutra',          price: 38000, compare: 46000, stock: 12, img: MANGA_PHOTOS[4], collectionStyles: ['Diamond'],  themes: ['Round'],  featured: false, bestSeller: false, newArrival: true,  desc: 'Short 16-inch diamond mangalsutra. 0.5ct TW. 18KT white gold with black beads.' },
    { title: 'Gold Zig-Zag Mangalsutra',           price: 28000, compare: 34000, stock: 18, img: MANGA_PHOTOS[5], collectionStyles: ['Gold'],     themes: ['Round'],  featured: false, bestSeller: true,  newArrival: false, desc: 'Unique zig-zag design mangalsutra in 22KT gold. Contemporary Indian bridal.' },
    { title: 'Ruby Diamond Mangalsutra',           price: 65000, compare: 80000, stock: 6,  img: MANGA_PHOTOS[6], collectionStyles: ['Diamond'],  themes: ['Round'],  featured: true,  bestSeller: false, newArrival: true,  desc: 'Ruby and diamond mangalsutra. 0.75ct diamond, natural ruby. 18KT gold.' },
    { title: 'Layered Gold Mangalsutra',           price: 42000, compare: 52000, stock: 10, img: MANGA_PHOTOS[7], collectionStyles: ['Gold'],     themes: ['Round'],  featured: false, bestSeller: false, newArrival: false, desc: 'Double-layered gold mangalsutra in 22KT yellow gold. Rich and traditional.' },
    { title: 'Platinum Diamond Mangalsutra',       price: 72000, compare: 88000, stock: 5,  img: MANGA_PHOTOS[8], collectionStyles: ['Diamond'],  themes: ['Round'],  featured: true,  bestSeller: false, newArrival: true,  desc: 'Modern platinum mangalsutra with diamond pendant. 1ct TW. For contemporary brides.' },
    { title: 'Fancy Designer Mangalsutra',         price: 35000, compare: 43000, stock: 14, img: MANGA_PHOTOS[9], collectionStyles: ['Gold'],     themes: ['Round'],  featured: false, bestSeller: true,  newArrival: false, desc: 'Designer floral pendant mangalsutra in 22KT gold with emerald accents.' },
  ],

  anklets: [
    { title: 'Gold Anklet 22KT Pair',              price: 8500,  compare: 10500, stock: 30, img: ANKLET_PHOTOS[0], collectionStyles: ['Plain Gold'],themes: ['Round'],  featured: false, bestSeller: true,  newArrival: false, desc: 'Classic plain gold anklet in 22KT. Pair. Adjustable 10-inch length.' },
    { title: 'Silver Anklet with Ghungroo',        price: 2500,  compare: 3200,  stock: 45, img: ANKLET_PHOTOS[1], collectionStyles: ['Silver'],    themes: ['Round'],  featured: false, bestSeller: true,  newArrival: false, desc: 'Traditional silver anklet with small bells (ghungroo). 92.5 silver. Pair.' },
    { title: 'Diamond Gold Anklet 18KT',           price: 35000, compare: 43000, stock: 8,  img: ANKLET_PHOTOS[2], collectionStyles: ['Diamond'],   themes: ['Round'],  featured: true,  bestSeller: false, newArrival: true,  desc: 'Diamond-studded gold anklet in 18KT yellow gold. 0.25ct TW. 10-inch.' },
    { title: 'Layered Gold Anklet Set',            price: 15000, compare: 18500, stock: 18, img: ANKLET_PHOTOS[3], collectionStyles: ['Layered'],   themes: ['Round'],  featured: false, bestSeller: false, newArrival: true,  desc: 'Three-layered gold anklet in 22KT yellow gold. 10-inch adjustable length.' },
    { title: 'Oxidised Silver Anklet Pair',        price: 3500,  compare: 4500,  stock: 35, img: ANKLET_PHOTOS[4], collectionStyles: ['Silver'],    themes: ['Round'],  featured: false, bestSeller: false, newArrival: false, desc: 'Oxidised antique-finish silver anklet pair. Ethnic boho style.' },
    { title: 'Kundan Gold Anklet 22KT',            price: 22000, compare: 27000, stock: 12, img: ANKLET_PHOTOS[5], collectionStyles: ['Kundan'],    themes: ['Round'],  featured: true,  bestSeller: false, newArrival: false, desc: 'Kundan-studded gold anklet in 22KT yellow gold. Bridal and festive.' },
    { title: 'Chain Anklet Gold 22KT',             price: 6500,  compare: 8000,  stock: 28, img: ANKLET_PHOTOS[6], collectionStyles: ['Chain'],     themes: ['Round'],  featured: false, bestSeller: true,  newArrival: false, desc: 'Thin chain anklet in 22KT yellow gold. 10-inch. Minimalist daily wear.' },
    { title: 'Gemstone Bead Anklet Gold',          price: 12000, compare: 15000, stock: 20, img: ANKLET_PHOTOS[7], collectionStyles: ['Gemstone'],  themes: ['Oval'],   featured: false, bestSeller: false, newArrival: true,  desc: 'Gold anklet with semi-precious gemstone beads. 22KT gold chain.' },
  ],

  kada: [
    { title: 'Broad Gold Kada 22KT',               price: 48000, compare: 58000, stock: 10, img: KADA_PHOTOS[0], collectionStyles: ['Plain Gold'], themes: ['Round'],  featured: false, bestSeller: true,  newArrival: false, desc: 'Broad plain gold kada in 22KT yellow gold. Traditional men\'s kada.' },
    { title: 'Diamond Kada 18KT',                  price: 95000, compare: 118000,stock: 4,  img: KADA_PHOTOS[1], collectionStyles: ['Diamond'],    themes: ['Round'],  featured: true,  bestSeller: false, newArrival: false, desc: 'Diamond-studded kada in 18KT white gold. 1.20ct TW. Statement bridal piece.' },
    { title: 'Carved Gold Kada 22KT',              price: 38000, compare: 46000, stock: 15, img: KADA_PHOTOS[2], collectionStyles: ['Antique'],    themes: ['Round'],  featured: false, bestSeller: false, newArrival: true,  desc: 'Intricately hand-carved gold kada in 22KT yellow gold. Traditional motifs.' },
    { title: 'Kundan Kada Bridal',                 price: 72000, compare: 88000, stock: 6,  img: KADA_PHOTOS[3], collectionStyles: ['Kundan'],     themes: ['Round'],  featured: true,  bestSeller: false, newArrival: true,  desc: 'Bridal Kundan kada with meenakari work. 22KT gold base. Uncut diamonds.' },
    { title: 'Plain Gold Kada 22KT Slim',          price: 22000, compare: 27000, stock: 25, img: KADA_PHOTOS[4], collectionStyles: ['Plain Gold'], themes: ['Round'],  featured: false, bestSeller: true,  newArrival: false, desc: 'Slim plain gold kada in 22KT yellow gold. Lightweight daily wear.' },
    { title: 'Antique Gold Kada',                  price: 42000, compare: 52000, stock: 10, img: KADA_PHOTOS[5], collectionStyles: ['Antique'],    themes: ['Round'],  featured: false, bestSeller: false, newArrival: false, desc: 'Antique-finish oxidised gold kada in 22KT. Traditional temple design.' },
    { title: 'Silver Kada Men\'s',                 price: 8500,  compare: 10500, stock: 30, img: KADA_PHOTOS[6], collectionStyles: ['Silver'],     themes: ['Round'],  featured: false, bestSeller: true,  newArrival: false, desc: 'Sterling silver men\'s kada. 92.5 silver. Heavy weight. Traditional style.' },
    { title: 'Diamond Bangle Kada 18KT',           price: 82000, compare: 100000,stock: 5,  img: KADA_PHOTOS[7], collectionStyles: ['Diamond'],    themes: ['Round'],  featured: true,  bestSeller: false, newArrival: true,  desc: 'Transitional bangle-kada hybrid in 18KT white gold with 1ct TW diamonds.' },
    { title: 'Men\'s Gold Sikh Kada 22KT',         price: 55000, compare: 68000, stock: 8,  img: KADA_PHOTOS[8], collectionStyles: ['Plain Gold'], themes: ['Round'],  featured: false, bestSeller: false, newArrival: false, desc: 'Traditional Sikh gold kada in 22KT yellow gold. Heavy broad design.' },
    { title: 'Temple Work Gold Kada',              price: 48000, compare: 58000, stock: 10, img: KADA_PHOTOS[9], collectionStyles: ['Temple'],     themes: ['Round'],  featured: false, bestSeller: true,  newArrival: false, desc: 'Temple-work gold kada with deity motifs. 22KT gold. South Indian design.' },
  ],

  charms: [
    { title: 'Evil Eye Diamond Charm',             price: 8500,  compare: 10500, stock: 35, img: CHARM_PHOTOS[0], collectionStyles: ['Evil Eye'], themes: ['Round'],  featured: true,  bestSeller: true,  newArrival: false, desc: 'Evil eye charm with central diamond in 18KT yellow gold. For protection.' },
    { title: 'Gold Heart Charm 18KT',              price: 5500,  compare: 7000,  stock: 40, img: CHARM_PHOTOS[1], collectionStyles: ['Heart'],    themes: ['Heart'],  featured: false, bestSeller: true,  newArrival: false, desc: 'Solid gold heart charm in 18KT yellow gold. Universal love symbol.' },
    { title: 'Moon Star Diamond Charm',            price: 7500,  compare: 9200,  stock: 28, img: CHARM_PHOTOS[2], collectionStyles: ['Celestial'],themes: ['Round'],  featured: false, bestSeller: false, newArrival: true,  desc: 'Crescent moon and star charm with tiny diamonds. 18KT gold. Celestial charm.' },
    { title: 'Gold Cross Charm 18KT',              price: 6500,  compare: 8000,  stock: 30, img: CHARM_PHOTOS[3], collectionStyles: ['Religious'],themes: ['Round'],  featured: false, bestSeller: false, newArrival: false, desc: 'Classic cross charm in 18KT yellow gold. Faith and devotion symbol.' },
    { title: 'Floral Diamond Charm',              price: 9500,  compare: 11500, stock: 22, img: CHARM_PHOTOS[4], collectionStyles: ['Floral'],   themes: ['Round'],  featured: false, bestSeller: false, newArrival: true,  desc: 'Tiny floral charm with pavé diamond petals. 18KT gold. Garden-inspired.' },
    { title: 'Diamond Letter Charm 18KT',         price: 12000, compare: 15000, stock: 20, img: CHARM_PHOTOS[5], collectionStyles: ['Letter'],   themes: ['Round'],  featured: true,  bestSeller: false, newArrival: true,  desc: 'Personalised diamond initial charm in 18KT white gold. Custom letter.' },
    { title: 'Infinity Diamond Charm',            price: 8000,  compare: 9800,  stock: 30, img: CHARM_PHOTOS[6], collectionStyles: ['Infinity'], themes: ['Round'],  featured: false, bestSeller: true,  newArrival: false, desc: 'Infinity loop charm with micro-pavé diamonds. 18KT gold. Eternal love.' },
    { title: 'Birthstone Gold Charm',             price: 7000,  compare: 8500,  stock: 25, img: CHARM_PHOTOS[7], collectionStyles: ['Gemstone'], themes: ['Round'],  featured: false, bestSeller: false, newArrival: false, desc: 'Birthstone charm in 18KT gold. Choose your gemstone. Personalised gifting.' },
  ],
};

// Lifestyle section slug overrides
const SLUG_OVERRIDES = {
  'kundan-choker-necklace':         'Kundan Choker Necklace',
  'temple-gold-bangle-set':         'Temple Gold Bangle Set 22KT',
  'pearl-drop-earrings':            'Pearl Drop Earrings Gold',
  'diamond-floral-pendant-set':     'Diamond Floral Pendant Set',
  'diamond-stud-earrings':          'Diamond Stud Earrings 18KT',
  'diamond-solitaire-pendant-18kt': 'Diamond Solitaire Pendant 18KT',
  'classic-solitaire-diamond-ring': 'Classic Solitaire Diamond Ring',
  'black-beads-gold-mangalsutra':   'Black Beads Gold Mangalsutra',
};

async function seed() {
  try {
    if (!MONGO_URI) throw new Error('MONGO_URI not set — check .env file');
    console.log('Connecting to:', MONGO_URI.substring(0, 40) + '...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    const cats = await Category.find().lean();
    const catMap = {};
    cats.forEach(c => { catMap[c.slug] = c._id; });

    await Product.deleteMany({});
    console.log('Cleared existing products');

    let total = 0;
    const skuSet = new Set();

    for (const [catSlug, products] of Object.entries(PRODUCTS)) {
      const categoryId = catMap[catSlug];
      if (!categoryId) { console.log(`  ⚠ Category not found: ${catSlug}`); continue; }

      const docs = products.map((p, idx) => {
        const matchedSlug = Object.entries(SLUG_OVERRIDES).find(([, t]) => t === p.title)?.[0];
        const productSlug = matchedSlug || slug(p.title);

        // Unique SKU
        let sku = `${catSlug.toUpperCase().slice(0, 3)}-${String(idx + 1).padStart(3, '0')}`;
        while (skuSet.has(sku)) sku += 'X';
        skuSet.add(sku);

        return {
          vendor:           new mongoose.Types.ObjectId(VENDOR_ID),
          title:            p.title,
          slug:             productSlug,
          sku,
          shortDescription: p.desc,
          description:      p.desc,
          category:         categoryId,
          price:            p.price,
          comparePrice:     p.compare,
          discount:         Math.round(((p.compare - p.price) / p.compare) * 100),
          stock:            p.stock,
          images: [
            { url: u(p.img), isPrimary: true, alt: p.title, sortOrder: 0 },
          ],
          status:           'approved',
          isActive:         true,
          isFeatured:       p.featured,
          isBestSeller:     p.bestSeller,
          isNewArrival:     p.newArrival,
          collectionStyles: p.collectionStyles || [],
          themes:           p.themes || [],
          rating:           +(3.8 + Math.random() * 1.2).toFixed(1),
          totalReviews:     Math.floor(Math.random() * 80) + 5,
          totalSold:        Math.floor(Math.random() * 200) + 10,
          freeShipping:     p.price > 25000,
          shippingDays:     p.price > 50000 ? 3 : 5,
        };
      });

      try {
        const result = await Product.insertMany(docs, { ordered: false });
        console.log(`  ✓ ${catSlug}: ${result.length} products`);
        total += result.length;
      } catch (e) {
        console.error(`  ✗ ${catSlug}: ${e.message}`);
        if (e.writeErrors) e.writeErrors.slice(0, 3).forEach(we => console.error('   -', we.errmsg));
      }
    }

    console.log(`\nTotal seeded: ${total} products`);
  } catch (err) {
    console.error('Seed error:', err.message);
  } finally {
    await mongoose.disconnect();
  }
}

seed();
