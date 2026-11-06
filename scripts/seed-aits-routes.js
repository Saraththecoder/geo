const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");

// Load .env.local
const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf8");
  envContent.split("\n").forEach((line) => {
    const t = line.trim();
    if (!t || t.startsWith("#")) return;
    const idx = t.indexOf("=");
    if (idx > -1) {
      let k = t.slice(0, idx).trim();
      let v = t.slice(idx + 1).trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1);
      }
      process.env[k] = v;
    }
  });
}

const projectId =
  process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "aitsbus";
const databaseURL =
  process.env.FIREBASE_DATABASE_URL ||
  process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL ||
  `https://${projectId}-default-rtdb.asia-southeast1.firebasedatabase.app`;

if (!admin.apps.length) {
  const privateKey = (process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, "\n");
  if (process.env.FIREBASE_CLIENT_EMAIL && privateKey) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey,
      }),
      databaseURL,
    });
  } else {
    admin.initializeApp({
      projectId,
      databaseURL,
    });
  }
}

const db = admin.firestore();

const AITS_CAMPUS_STOP = {
  id: "stop_aits_campus",
  name: "AITS Main Campus Entrance",
  pickupTime: "9:10 AM",
  lat: 13.6655,
  lng: 79.5005,
};

const OFFICIAL_ROUTES = [
  // 1. Srinivasapuram / Tiruchanur
  {
    id: "route_srinivasapuram_tiruchanur",
    name: "1. Srinivasapuram / Tiruchanur",
    busNumber: "1",
    plate: "AP 04 TX 1001",
    capacity: 55,
    stops: [
      { id: "stop_r1_srinivasapuram", name: "Srinivasapuram", pickupTime: "8:30 AM", lat: 13.616, lng: 79.432 },
      { id: "stop_r1_padmavathi_puram", name: "Padmavathi Puram", pickupTime: "8:30 AM", lat: 13.6145, lng: 79.435 },
      { id: "stop_r1_mango_market", name: "Mango Market", pickupTime: "8:35 AM", lat: 13.612, lng: 79.439 },
      { id: "stop_r1_tiruchanur", name: "Tiruchanur", pickupTime: "8:40 AM", lat: 13.608, lng: 79.444 },
      { id: "stop_r1_yogi_mallavaram", name: "Tiruchanur (Yogi Mallavaram)", pickupTime: "8:40 AM", lat: 13.606, lng: 79.4485 },
      { id: "stop_r1_daminedu", name: "Daminedu", pickupTime: "8:45 AM", lat: 13.615, lng: 79.462 },
      { id: "stop_r1_klm_circle", name: "KLM Circle", pickupTime: "8:50 AM", lat: 13.628, lng: 79.467 },
      { id: "stop_r1_sakshi", name: "Sakshi (Marri Gunta)", pickupTime: "8:55 AM", lat: 13.639, lng: 79.475 },
      { id: "stop_r1_renigunta_checkpost", name: "Renigunta Checkpost", pickupTime: "9:00 AM", lat: 13.648, lng: 79.488 },
      { ...AITS_CAMPUS_STOP, pickupTime: "9:10 AM" },
    ],
  },

  // 2. Annamayya Circle / Bairagipatteda
  {
    id: "route_annamayya_bairagipatteda",
    name: "2. Annamayya Circle / Bairagipatteda",
    busNumber: "2",
    plate: "AP 04 TX 1002",
    capacity: 55,
    stops: [
      { id: "stop_r2_annamayya_circle", name: "Annamayya Circle", pickupTime: "8:30 AM", lat: 13.621, lng: 79.412 },
      { id: "stop_r2_bairagipatteda", name: "Bairagipatteda", pickupTime: "8:30 AM", lat: 13.6225, lng: 79.4145 },
      { id: "stop_r2_kesavayanagunta", name: "Kesavayanagunta", pickupTime: "8:35 AM", lat: 13.624, lng: 79.419 },
      { id: "stop_r2_padmavathi_mandapam", name: "Padmavathi Kalyana Mandapam", pickupTime: "8:35 AM", lat: 13.626, lng: 79.421 },
      { id: "stop_r2_mrf_showroom", name: "MRF Show Room", pickupTime: "8:40 AM", lat: 13.6285, lng: 79.423 },
      { id: "stop_r2_tmc_circle", name: "TMC Circle", pickupTime: "8:45 AM", lat: 13.632, lng: 79.426 },
      { id: "stop_r2_korlagunta", name: "Korlagunta", pickupTime: "8:45 AM", lat: 13.635, lng: 79.432 },
      { id: "stop_r2_sk_fast_foods", name: "S K Fast Foods", pickupTime: "8:45 AM", lat: 13.6375, lng: 79.437 },
      { ...AITS_CAMPUS_STOP, pickupTime: "9:05 AM" },
    ],
  },

  // 3. Chandragiri (Via) Gandhi Road
  {
    id: "route_chandragiri_gandhi_road",
    name: "3. Chandragiri (Via) Gandhi Road",
    busNumber: "3",
    plate: "AP 04 TX 1003",
    capacity: 55,
    stops: [
      { id: "stop_r3_chandragiri", name: "Chandragiri", pickupTime: "8:05 AM", lat: 13.585, lng: 79.317 },
      { id: "stop_r3_thondavada", name: "Thondavada", pickupTime: "8:10 AM", lat: 13.597, lng: 79.34 },
      { id: "stop_r3_kaluru_cross", name: "Kaluru Cross", pickupTime: "8:15 AM", lat: 13.604, lng: 79.355 },
      { id: "stop_r3_perumalla_palle", name: "Perumalla Palle", pickupTime: "8:20 AM", lat: 13.611, lng: 79.37 },
      { id: "stop_r3_cherlopalle", name: "Cherlopalle", pickupTime: "8:20 AM", lat: 13.617, lng: 79.385 },
      { id: "stop_r3_thatithopu", name: "Thatithopu", pickupTime: "8:25 AM", lat: 13.622, lng: 79.395 },
      { id: "stop_r3_peruru", name: "Peruru", pickupTime: "8:25 AM", lat: 13.6235, lng: 79.4 },
      { id: "stop_r3_staff_quarters", name: "Staff Quarters", pickupTime: "8:25 AM", lat: 13.627, lng: 79.405 },
      { id: "stop_r3_vidya_nagar", name: "Vidya Nagar", pickupTime: "8:30 AM", lat: 13.629, lng: 79.408 },
      { id: "stop_r3_svu_red_bldgs", name: "S V University (Red Buildings)", pickupTime: "8:30 AM", lat: 13.632, lng: 79.405 },
      { id: "stop_r3_balaji_colony", name: "Balaji Colony", pickupTime: "8:30 AM", lat: 13.633, lng: 79.412 },
      { ...AITS_CAMPUS_STOP, pickupTime: "9:05 AM" },
    ],
  },

  // 4. Thummalagunta / Mahathi
  {
    id: "route_thummalagunta_mahathi",
    name: "4. Thummalagunta / Mahathi",
    busNumber: "4",
    plate: "AP 04 TX 1004",
    capacity: 55,
    stops: [
      { id: "stop_r4_thummalagunta", name: "Thummalagunta", pickupTime: "8:25 AM", lat: 13.62, lng: 79.39 },
      { id: "stop_r4_spmvv", name: "SPMVV", pickupTime: "8:30 AM", lat: 13.634, lng: 79.398 },
      { id: "stop_r4_padmavathi_college", name: "Padmavathi College (Circle)", pickupTime: "8:30 AM", lat: 13.6345, lng: 79.406 },
      { id: "stop_r4_west_church", name: "West Church", pickupTime: "8:35 AM", lat: 13.633, lng: 79.415 },
      { id: "stop_r4_mahathi", name: "Mahathi", pickupTime: "8:35 AM", lat: 13.6325, lng: 79.418 },
      { id: "stop_r4_jyothi_theatre", name: "Jyothi Theatre", pickupTime: "8:40 AM", lat: 13.63, lng: 79.4185 },
      { id: "stop_r4_ramakrishna_deluxe", name: "Ramakrishna Deluxe", pickupTime: "8:40 AM", lat: 13.628, lng: 79.419 },
      { id: "stop_r4_sv_medical_college", name: "S V Medical College", pickupTime: "8:40 AM", lat: 13.636, lng: 79.41 },
      { id: "stop_r4_srivari_sannidhi", name: "Srivari Sannidhi", pickupTime: "8:45 AM", lat: 13.637, lng: 79.421 },
      { id: "stop_r4_tmc_park", name: "TMC Park", pickupTime: "8:45 AM", lat: 13.635, lng: 79.425 },
      { id: "stop_r4_royal_oak", name: "Royal Oak (Furniture Show Room)", pickupTime: "8:50 AM", lat: 13.638, lng: 79.432 },
      { ...AITS_CAMPUS_STOP, pickupTime: "9:05 AM" },
    ],
  },

  // 5. Annarao Circle & Bhavani Nagar
  {
    id: "route_annarao_bhavani_nagar",
    name: "5. Annarao Circle & Bhavani Nagar",
    busNumber: "5",
    plate: "AP 04 TX 1005",
    capacity: 55,
    stops: [
      { id: "stop_r5_iskcon_temple", name: "ISKCON Temple", pickupTime: "8:30 AM", lat: 13.645, lng: 79.416 },
      { id: "stop_r5_annarao_circle", name: "Annarao Circle", pickupTime: "8:35 AM", lat: 13.641, lng: 79.42 },
      { id: "stop_r5_yasodha_nagar", name: "Yasodha Nagar (KT Road)", pickupTime: "8:40 AM", lat: 13.638, lng: 79.423 },
      { id: "stop_r5_varadaraja_nagar", name: "Varadaraja Nagar Petrol Bunk", pickupTime: "8:40 AM", lat: 13.6395, lng: 79.427 },
      { id: "stop_r5_ttd_admin", name: "TTD Admin Building", pickupTime: "8:40 AM", lat: 13.636, lng: 79.425 },
      { id: "stop_r5_incometax_off", name: "Incometax Off", pickupTime: "8:40 AM", lat: 13.635, lng: 79.428 },
      { id: "stop_r5_subhamasthu", name: "Subhamasthu (V V Mahal Rd)", pickupTime: "8:45 AM", lat: 13.632, lng: 79.422 },
      { id: "stop_r5_municipal_office", name: "Municipal Office", pickupTime: "8:45 AM", lat: 13.6305, lng: 79.42 },
      { id: "stop_r5_devendra_theatre", name: "Devendra Theatre", pickupTime: "8:45 AM", lat: 13.6315, lng: 79.425 },
      { id: "stop_r5_fish_market", name: "Fish Market", pickupTime: "8:45 AM", lat: 13.633, lng: 79.429 },
      { id: "stop_r5_sbi_leelamahal", name: "SBI (Leelamahal Junction)", pickupTime: "8:50 AM", lat: 13.637, lng: 79.431 },
      { id: "stop_r5_union_bank", name: "Union Bank of India (Karakambadi Rd)", pickupTime: "8:50 AM", lat: 13.642, lng: 79.445 },
      { id: "stop_r5_subbareddy_nagar", name: "Subbareddy Nagar", pickupTime: "8:55 AM", lat: 13.652, lng: 79.47 },
      { ...AITS_CAMPUS_STOP, pickupTime: "9:05 AM" },
    ],
  },

  // 6. RLY Kodur
  {
    id: "route_rly_kodur",
    name: "6. RLY Kodur",
    busNumber: "6",
    plate: "AP 04 TX 1006",
    capacity: 55,
    stops: [
      { id: "stop_r6_satram", name: "Satram", pickupTime: "8:00 AM", lat: 13.955, lng: 79.352 },
      { id: "stop_r6_hero_honda", name: "Hero Honda Show Room", pickupTime: "8:05 AM", lat: 13.952, lng: 79.353 },
      { id: "stop_r6_gangalamma_temple", name: "Gangalamma Temple", pickupTime: "8:05 AM", lat: 13.948, lng: 79.355 },
      { id: "stop_r6_sivalayam", name: "Sivalayam", pickupTime: "8:05 AM", lat: 13.945, lng: 79.356 },
      { id: "stop_r6_masjid", name: "Masjid", pickupTime: "8:10 AM", lat: 13.942, lng: 79.358 },
      { id: "stop_r6_toll_gate", name: "Toll Gate", pickupTime: "8:10 AM", lat: 13.92, lng: 79.37 },
      { id: "stop_r6_santhi_nagar", name: "Santhi Nagar", pickupTime: "8:15 AM", lat: 13.88, lng: 79.39 },
      { id: "stop_r6_mango_market", name: "Mango Market", pickupTime: "8:15 AM", lat: 13.86, lng: 79.4 },
      { id: "stop_r6_uppara_palli", name: "Uppara Palli", pickupTime: "8:20 AM", lat: 13.82, lng: 79.42 },
      { id: "stop_r6_lakshmigari_palli", name: "Lakshmigari Palli", pickupTime: "8:25 AM", lat: 13.78, lng: 79.44 },
      { id: "stop_r6_setti_gunta", name: "Setti Gunta", pickupTime: "8:25 AM", lat: 13.74, lng: 79.46 },
      { ...AITS_CAMPUS_STOP, pickupTime: "9:10 AM" },
    ],
  },

  // 7. Venkatagiri (From Venkatagiri – 2nd, 3rd & 4th B.Tech)
  {
    id: "route_venkatagiri",
    name: "7. Venkatagiri",
    busNumber: "7",
    plate: "AP 04 TX 1007",
    capacity: 55,
    stops: [
      { id: "stop_r7_old_bus_stand", name: "Old Bus Stand", pickupTime: "7:50 AM", lat: 13.962, lng: 79.582 },
      { id: "stop_r7_mro_office", name: "MRO Office", pickupTime: "7:50 AM", lat: 13.96, lng: 79.583 },
      { id: "stop_r7_tribhuvani_centre", name: "Tribhuvani Centre", pickupTime: "7:50 AM", lat: 13.958, lng: 79.584 },
      { id: "stop_r7_bus_stand_depot", name: "Bus Stand Depot", pickupTime: "7:55 AM", lat: 13.955, lng: 79.586 },
      { id: "stop_r7_rani_peta", name: "Rani Peta", pickupTime: "8:00 AM", lat: 13.95, lng: 79.587 },
      { id: "stop_r7_teachers_colony", name: "Teachers Colony", pickupTime: "8:00 AM", lat: 13.945, lng: 79.588 },
      { id: "stop_r7_cross_roads", name: "Cross Roads", pickupTime: "8:00 AM", lat: 13.94, lng: 79.59 },
      { id: "stop_r7_vallivedu_cross", name: "Vallivedu Cross Road", pickupTime: "8:05 AM", lat: 13.91, lng: 79.585 },
      { id: "stop_r7_pallam_pet", name: "Pallam Pet", pickupTime: "8:20 AM", lat: 13.82, lng: 79.57 },
      { id: "stop_r7_iiser", name: "IISER", pickupTime: "8:25 AM", lat: 13.712, lng: 79.548 },
      { id: "stop_r7_yerpedu", name: "Yerpedu", pickupTime: "8:35 AM", lat: 13.682, lng: 79.535 },
      { ...AITS_CAMPUS_STOP, pickupTime: "9:05 AM" },
    ],
  },

  // 8. Srikalahasthi
  {
    id: "route_srikalahasthi",
    name: "8. Srikalahasthi",
    busNumber: "8",
    plate: "AP 04 TX 1008",
    capacity: 55,
    stops: [
      { id: "stop_r8_skht_kannali", name: "SKHT (Kannali)", pickupTime: "7:50 AM", lat: 13.742, lng: 79.715 },
      { id: "stop_r8_bypass_arch", name: "Bypass Arch (Police Station)", pickupTime: "7:55 AM", lat: 13.744, lng: 79.712 },
      { id: "stop_r8_kasagarens", name: "Kasagarens", pickupTime: "7:55 AM", lat: 13.745, lng: 79.709 },
      { id: "stop_r8_bhasmarket", name: "SKHT (Bhasmarket)", pickupTime: "7:55 AM", lat: 13.746, lng: 79.706 },
      { id: "stop_r8_bahuderpet", name: "SKHT (Bahuderpet)", pickupTime: "7:55 AM", lat: 13.747, lng: 79.704 },
      { id: "stop_r8_seethalamma", name: "SKHT (Seethalamma Temple)", pickupTime: "7:55 AM", lat: 13.748, lng: 79.702 },
      { id: "stop_r8_fire_station", name: "SKHT (Fire Station)", pickupTime: "8:00 AM", lat: 13.749, lng: 79.7 },
      { id: "stop_r8_rtc_bus_stand", name: "SKHT (RTC Bus Stand)", pickupTime: "8:00 AM", lat: 13.75, lng: 79.698 },
      { id: "stop_r8_sai_baba", name: "Sai Baba Temple", pickupTime: "8:05 AM", lat: 13.751, lng: 79.697 },
      { id: "stop_r8_municipal_off", name: "Municipal Office", pickupTime: "8:05 AM", lat: 13.752, lng: 79.695 },
      { id: "stop_r8_vmc_circle", name: "VMC (Circle)", pickupTime: "8:05 AM", lat: 13.753, lng: 79.694 },
      { id: "stop_r8_next_showroom", name: "SKHT (Next Show Room)", pickupTime: "8:05 AM", lat: 13.7535, lng: 79.693 },
      { id: "stop_r8_berivari_mandapam", name: "SKHT (Berivari Mandapam)", pickupTime: "8:10 AM", lat: 13.754, lng: 79.692 },
      { id: "stop_r8_temple", name: "SKHT (Temple)", pickupTime: "8:10 AM", lat: 13.7545, lng: 79.691 },
      { id: "stop_r8_super_bazar", name: "SKHT (Super Bazar)", pickupTime: "8:10 AM", lat: 13.753, lng: 79.689 },
      { id: "stop_r8_bp_agraharam", name: "SKHT (BP Agraharam)", pickupTime: "8:10 AM", lat: 13.752, lng: 79.687 },
      { id: "stop_r8_srm_colony", name: "SKHT (SRM Colony)", pickupTime: "8:10 AM", lat: 13.751, lng: 79.685 },
      { id: "stop_r8_ponnalamma", name: "SKHT (Ponnalamma Temple)", pickupTime: "8:15 AM", lat: 13.75, lng: 79.683 },
      { id: "stop_r8_ntr_park", name: "SKHT (NTR Park)", pickupTime: "8:15 AM", lat: 13.749, lng: 79.68 },
      { id: "stop_r8_ap_seeds", name: "AP Seeds", pickupTime: "8:15 AM", lat: 13.748, lng: 79.678 },
      { id: "stop_r8_panagal", name: "SKHT (Panagal)", pickupTime: "8:15 AM", lat: 13.745, lng: 79.67 },
      { id: "stop_r8_mitta_kandriga", name: "Mitta Kandriga", pickupTime: "8:20 AM", lat: 13.74, lng: 79.655 },
      { id: "stop_r8_cherlopalli", name: "Cherlopalli", pickupTime: "8:20 AM", lat: 13.735, lng: 79.64 },
      { id: "stop_r8_thondamanadu", name: "Thondamanadu", pickupTime: "8:25 AM", lat: 13.73, lng: 79.62 },
      { id: "stop_r8_skims_b_school", name: "SKIMS B School", pickupTime: "8:25 AM", lat: 13.72, lng: 79.6 },
      { id: "stop_r8_chellapalem", name: "Chellapalem/Lanco Industries", pickupTime: "8:25 AM", lat: 13.71, lng: 79.58 },
      { id: "stop_r8_merlapaka", name: "Merlapaka", pickupTime: "8:30 AM", lat: 13.695, lng: 79.56 },
      { id: "stop_r8_yerpedu", name: "Yerpedu", pickupTime: "8:40 AM", lat: 13.682, lng: 79.535 },
      { id: "stop_r8_seetaramapeta", name: "Seetaramapeta", pickupTime: "8:40 AM", lat: 13.675, lng: 79.525 },
      { id: "stop_r8_mallavaram", name: "Mallavaram", pickupTime: "8:45 AM", lat: 13.67, lng: 79.515 },
      { id: "stop_r8_guttivari_palli", name: "Guttivari Palli", pickupTime: "8:50 AM", lat: 13.668, lng: 79.508 },
      { ...AITS_CAMPUS_STOP, pickupTime: "9:05 AM" },
    ],
  },

  // 9. TVS Show Room (Via) Renigunta
  {
    id: "route_tvs_renigunta",
    name: "9. TVS Show Room (Via) Renigunta",
    busNumber: "9",
    plate: "AP 04 TX 1009",
    capacity: 55,
    stops: [
      { id: "stop_r9_tvs_showroom", name: "TVS Show Room", pickupTime: "8:30 AM", lat: 13.626, lng: 79.433 },
      { id: "stop_r9_plr_convention", name: "PLR Convention Hall", pickupTime: "8:30 AM", lat: 13.627, lng: 79.438 },
      { id: "stop_r9_hotel_bliss", name: "Hotel Bliss", pickupTime: "8:40 AM", lat: 13.628, lng: 79.442 },
      { id: "stop_r9_kalanjali", name: "Kalanjali (Renigunta Rd)", pickupTime: "8:40 AM", lat: 13.629, lng: 79.446 },
      { id: "stop_r9_hero_honda", name: "Hero Honda Show Room", pickupTime: "8:40 AM", lat: 13.63, lng: 79.45 },
      { id: "stop_r9_postal_colony", name: "Postal Colony", pickupTime: "8:45 AM", lat: 13.632, lng: 79.455 },
      { id: "stop_r9_cotton_mill", name: "Cotton (Mill Renigunta Road)", pickupTime: "8:45 AM", lat: 13.634, lng: 79.462 },
      { id: "stop_r9_autonagar", name: "Autonagar", pickupTime: "8:45 AM", lat: 13.636, lng: 79.47 },
      { id: "stop_r9_narayanadri", name: "Narayanadri Hospital", pickupTime: "8:50 AM", lat: 13.638, lng: 79.478 },
      { id: "stop_r9_renigunta_estate", name: "Renigunta (Estate)", pickupTime: "8:50 AM", lat: 13.642, lng: 79.495 },
      { id: "stop_r9_renigunta", name: "Renigunta", pickupTime: "8:55 AM", lat: 13.65, lng: 79.512 },
      { ...AITS_CAMPUS_STOP, pickupTime: "9:10 AM" },
    ],
  },

  // 10. MR Palli / Gandhi Road
  {
    id: "route_mr_palli_gandhi_road",
    name: "10. MR Palli / Gandhi Road",
    busNumber: "10",
    plate: "AP 04 TX 1010",
    capacity: 55,
    stops: [
      { id: "stop_r10_mr_palli_ps", name: "MR Palli Police Station", pickupTime: "8:30 AM", lat: 13.612, lng: 79.405 },
      { id: "stop_r10_vaikuntapuram", name: "Vaikuntapuram Arch", pickupTime: "8:35 AM", lat: 13.615, lng: 79.408 },
      { id: "stop_r10_mr_palli_panchayat", name: "MR Palli Panchayathi Office", pickupTime: "8:35 AM", lat: 13.618, lng: 79.41 },
      { id: "stop_r10_mr_palli_circle", name: "MR Palli Circle", pickupTime: "8:40 AM", lat: 13.62, lng: 79.412 },
      { id: "stop_r10_krishnapuram_thana", name: "Krishnapuram Thana", pickupTime: "8:45 AM", lat: 13.625, lng: 79.418 },
      { id: "stop_r10_big_c_gandhi_road", name: "Big C Gandhi Road", pickupTime: "8:45 AM", lat: 13.628, lng: 79.419 },
      { id: "stop_r10_sridevi_complex", name: "Sridevi Complex", pickupTime: "8:45 AM", lat: 13.631, lng: 79.421 },
      { ...AITS_CAMPUS_STOP, pickupTime: "9:10 AM" },
    ],
  },
];

async function seedAITSRoutes() {
  console.info("🌱 Seeding AITS Official 10 Routes, Stops, and Fleet Buses into Firestore...");

  // Also include Central Library / CS Block stops for campus internal
  const campusStops = [
    { id: "stop_library", name: "Central Library (AITS)", pickupTime: "9:12 AM", lat: 13.6645, lng: 79.499 },
    { id: "stop_tech_park", name: "Computer Science & Engineering Block", pickupTime: "9:15 AM", lat: 13.6648, lng: 79.4998 },
  ];
  for (const cs of campusStops) {
    await db.collection("stops").doc(cs.id).set(cs, { merge: true });
  }

  let totalStops = 0;

  for (const routeDef of OFFICIAL_ROUTES) {
    const stopIds = [];
    const polyline = [];

    for (const stop of routeDef.stops) {
      stopIds.push(stop.id);
      polyline.push([stop.lat, stop.lng]);
      await db.collection("stops").doc(stop.id).set(stop, { merge: true });
      totalStops++;
    }

    // Save Route
    await db.collection("routes").doc(routeDef.id).set({
      id: routeDef.id,
      name: routeDef.name,
      stopIds,
      polyline,
      isActive: true,
      updatedAt: Date.now(),
    });

    // Save Bus
    const busId = `bus_${routeDef.busNumber}`;
    await db.collection("buses").doc(busId).set(
      {
        id: busId,
        number: routeDef.busNumber,
        plate: routeDef.plate,
        capacity: routeDef.capacity,
        routeId: routeDef.id,
        isActive: true,
      },
      { merge: true }
    );
  }

  console.info(`✓ Seeded ${OFFICIAL_ROUTES.length} routes and ${totalStops} stops`);

  // Ensure Bus #12 (Mohith's active bus) is mapped to Route 10 (MR Palli / Gandhi Road)
  await db.collection("buses").doc("bus_12").set(
    {
      id: "bus_12",
      number: "12",
      plate: "AP 04 TX 1012",
      capacity: 50,
      routeId: "route_mr_palli_gandhi_road",
      driverUid: "TvhUMPc06ScPk5f8ICHjf3ZEmE02", // Mohith
      isActive: true,
      updatedAt: Date.now(),
    },
    { merge: true }
  );

  // Update student Sarath's allocation so his designated stop is on Route 10
  const sarathUid = "hd8FCXX83KM0hwTYk92BbZIyLg72";
  await db.collection("users").doc(sarathUid).set(
    {
      allocatedBusId: "bus_12",
      stopId: "stop_r10_sridevi_complex",
      updatedAt: Date.now(),
    },
    { merge: true }
  );

  console.info("✓ Mapped Bus #12 to Route 10 (MR Palli / Gandhi Road)");
  console.info("✓ Mapped Student Sarath to Bus #12 (Stop: Sridevi Complex, 8:45 AM)");
  console.info("🎉 Database seeding complete!");
  process.exit(0);
}

seedAITSRoutes().catch((err) => {
  console.error("Seeding error:", err);
  process.exit(1);
});
