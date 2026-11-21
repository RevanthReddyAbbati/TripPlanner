// Curated excursions near each catalog destination: places worth a half-day, a day trip or a
// night that are not in the destination's own place list. Coordinates were checked against
// OpenStreetMap (Nominatim). Distances and times are typical by road from the destination centre.
// Entry fees are for Indian adults and change; transport is a per-person round-trip range from a
// shared bus or train (low) to a taxi shared by two (high).
import type { Interest } from '../types';

export type IdealVisit = 'half-day' | 'day-trip' | 'overnight';

export interface Excursion {
  id: string;
  name: string;
  nearDestinationId: string;
  lat: number;
  lon: number;
  /** Road distance from the destination centre, km. */
  distanceKm: number;
  /** Typical one-way travel time, minutes. */
  travelMin: number;
  howToGet: string;
  bestFor: Interest[];
  idealVisit: IdealVisit;
  entryCostINR: number;
  /** Per person, round trip: [bus or train, taxi shared by two]. */
  transportCostINR: [number, number];
  why: string;
  /** Best months (1–12). Omitted when it is fine all year. */
  season?: number[];
  priority: number;
}

/** Round-trip per person: bus at ~₹1.2/km each way, taxi at ~₹14/km shared by two (minimum fare ₹1,500). */
function fare(km: number): [number, number] {
  const bus = Math.max(60, Math.round((km * 2 * 1.2) / 10) * 10);
  const taxi = Math.round(Math.max(1500, km * 2 * 14) / 2 / 50) * 50;
  return [bus, taxi];
}

type Draft = Omit<Excursion, 'transportCostINR'> & { transportCostINR?: [number, number] };
const x = (d: Draft): Excursion => ({ ...d, transportCostINR: d.transportCostINR ?? fare(d.distanceKm) });

const WINTER = [11, 12, 1, 2, 3];

export const EXCURSIONS: Excursion[] = [
  // ---------------------------------------------------------------- North Goa
  x({
    id: 'ng-arambol', name: 'Arambol Beach', nearDestinationId: 'north-goa', lat: 15.679, lon: 73.705,
    distanceKm: 24, travelMin: 50, idealVisit: 'half-day', bestFor: ['beaches', 'nature'], entryCostINR: 0, priority: 4, season: WINTER,
    howToGet: 'Taxi or rented scooter up the coast via Siolim and Morjim. Buses run from Mapusa to Arambol.',
    why: 'Laid-back northern beach with a freshwater lake behind it and drum circles at sunset.',
  }),
  x({
    id: 'ng-divar', name: 'Divar Island', nearDestinationId: 'north-goa', lat: 15.5251, lon: 73.9078,
    distanceKm: 22, travelMin: 45, idealVisit: 'half-day', bestFor: ['history', 'culture', 'nature'], entryCostINR: 0, priority: 3,
    howToGet: 'Drive or take a bus to Old Goa, then the free government ferry across to the island (scooters and cars allowed).',
    why: 'Quiet island of old Portuguese houses and paddy fields, reached by a free ferry.',
  }),
  x({
    id: 'ng-chorao', name: 'Chorao Island and Salim Ali Bird Sanctuary', nearDestinationId: 'north-goa', lat: 15.5394, lon: 73.8847,
    distanceKm: 20, travelMin: 45, idealVisit: 'half-day', bestFor: ['nature'], entryCostINR: 50, priority: 3, season: [11, 12, 1, 2],
    howToGet: 'Free ferry from Ribandar jetty to Chorao; the sanctuary entrance is a short walk from the landing. Go early morning.',
    why: 'Mangrove channels where you can spot kingfishers, herons and crocodiles from a canoe.',
  }),
  x({
    id: 'ng-tambdi-surla', name: 'Tambdi Surla Mahadev Temple', nearDestinationId: 'north-goa', lat: 15.439, lon: 74.2525,
    distanceKm: 70, travelMin: 120, idealVisit: 'day-trip', bestFor: ['history', 'spiritual', 'nature'], entryCostINR: 0, priority: 4,
    howToGet: 'Taxi via Ponda and Mollem. Pair it with a Dudhsagar Falls jeep safari from Collem on the same day.',
    why: 'Twelfth-century Kadamba stone temple, the oldest surviving temple in Goa, deep in the forest.',
  }),

  // ---------------------------------------------------------------- South Goa
  x({
    id: 'sg-cola', name: 'Cola Beach', nearDestinationId: 'south-goa', lat: 15.0593, lon: 73.9702,
    distanceKm: 40, travelMin: 60, idealVisit: 'half-day', bestFor: ['beaches', 'nature'], entryCostINR: 0, priority: 4, season: WINTER,
    howToGet: 'Taxi or scooter towards Agonda; the last stretch is a rough dirt track, then a short walk down.',
    why: 'Secluded beach with a freshwater lagoon right behind the sand.',
  }),
  x({
    id: 'sg-galgibaga', name: 'Galgibaga Beach', nearDestinationId: 'south-goa', lat: 14.966, lon: 74.0467,
    distanceKm: 45, travelMin: 70, idealVisit: 'half-day', bestFor: ['beaches', 'nature'], entryCostINR: 0, priority: 3, season: WINTER,
    howToGet: 'Taxi or scooter south past Palolem towards Polem; there are almost no shops, so carry water.',
    why: 'Clean, empty beach where Olive Ridley turtles nest in winter.',
  }),
  x({
    id: 'sg-cotigao', name: 'Cotigao Wildlife Sanctuary', nearDestinationId: 'south-goa', lat: 14.9612, lon: 74.1513,
    distanceKm: 50, travelMin: 75, idealVisit: 'half-day', bestFor: ['nature', 'adventure'], entryCostINR: 50, priority: 3,
    howToGet: 'Taxi from Margao or Palolem to the gate near Poinguinim. Go at opening time for birds and cooler trails.',
    why: 'Forest sanctuary with tree-top watchtowers, close to Palolem.',
  }),
  x({
    id: 'sg-netravali', name: 'Netravali Bubbling Lake', nearDestinationId: 'south-goa', lat: 15.0942, lon: 74.2091,
    distanceKm: 45, travelMin: 75, idealVisit: 'half-day', bestFor: ['nature', 'spiritual'], entryCostINR: 0, priority: 3,
    howToGet: 'Taxi via Quepem into the Netravali forest; combine with the Mainapi waterfall trail after the monsoon.',
    why: 'Temple pond where streams of bubbles rise from the bottom, in a quiet forest village.',
  }),

  // ---------------------------------------------------------------- Gokarna
  x({
    id: 'gk-murudeshwar', name: 'Murudeshwar', nearDestinationId: 'gokarna', lat: 14.1008, lon: 74.5054,
    distanceKm: 75, travelMin: 105, idealVisit: 'day-trip', bestFor: ['spiritual', 'beaches'], entryCostINR: 0, priority: 5,
    howToGet: 'Train from Gokarna Road or Kumta to Murdeshwar station, or a KSRTC bus along NH66. A taxi round trip is easiest for a group.',
    why: 'Giant Shiva statue and a 20-storey temple tower on a headland over the Arabian Sea.',
  }),
  x({
    id: 'gk-honnavar', name: 'Honnavar mangrove boardwalk and Sharavathi backwaters', nearDestinationId: 'gokarna', lat: 14.3159, lon: 74.4324,
    distanceKm: 40, travelMin: 60, idealVisit: 'half-day', bestFor: ['nature'], entryCostINR: 50, priority: 3,
    howToGet: 'KSRTC bus or taxi south on NH66 to Honnavar; local boatmen run trips on the Sharavathi river.',
    why: 'Mangrove boardwalk and boat rides on the river backwaters, rarely crowded.',
  }),
  x({
    id: 'gk-jog', name: 'Jog Falls', nearDestinationId: 'gokarna', lat: 14.2293, lon: 74.8123,
    distanceKm: 120, travelMin: 180, idealVisit: 'day-trip', bestFor: ['nature'], entryCostINR: 0, priority: 4, season: [7, 8, 9, 10, 11, 12],
    howToGet: 'Taxi via Honnavar up the ghat road. Buses exist but connections are slow; leave early.',
    why: 'One of the highest waterfalls in India, at its most dramatic in the months after the monsoon.',
  }),
  x({
    id: 'gk-karwar', name: 'Karwar and Rabindranath Tagore Beach', nearDestinationId: 'gokarna', lat: 14.8164, lon: 74.1262,
    distanceKm: 60, travelMin: 80, idealVisit: 'half-day', bestFor: ['beaches', 'history'], entryCostINR: 50, priority: 2,
    howToGet: 'On NH66 towards Goa, so it is easy to stop on the way. Trains and KSRTC buses also run from Gokarna Road and Kumta.',
    why: 'Long town beach with a warship museum, a handy stop between Goa and Gokarna.',
  }),

  // ---------------------------------------------------------------- Hampi
  x({
    id: 'hp-badami', name: 'Badami Cave Temples', nearDestinationId: 'hampi', lat: 15.9184, lon: 75.6844,
    distanceKm: 140, travelMin: 180, idealVisit: 'day-trip', bestFor: ['history'], entryCostINR: 25, priority: 5,
    howToGet: 'Hire a taxi for the day from Hampi or Hosapete and do Badami, Pattadakal and Aihole together. Start by 7 AM.',
    why: 'Sixth-century cave temples cut into red sandstone above a lake, the heart of the Chalukya circuit.',
  }),
  x({
    id: 'hp-pattadakal', name: 'Pattadakal temples', nearDestinationId: 'hampi', lat: 15.9484, lon: 75.816,
    distanceKm: 135, travelMin: 180, idealVisit: 'day-trip', bestFor: ['history'], entryCostINR: 40, priority: 4,
    howToGet: 'Part of the same taxi day as Badami and Aihole; it sits between the two.',
    why: 'UNESCO group of Chalukya temples that mix northern and southern Indian styles.',
  }),
  x({
    id: 'hp-aihole', name: 'Aihole', nearDestinationId: 'hampi', lat: 16.0268, lon: 75.8835,
    distanceKm: 140, travelMin: 180, idealVisit: 'day-trip', bestFor: ['history'], entryCostINR: 25, priority: 3,
    howToGet: 'Last stop on the Badami and Pattadakal taxi day; the Durga temple is the highlight.',
    why: 'Often called the cradle of Indian temple architecture, with dozens of early temples.',
  }),
  x({
    id: 'hp-tb-dam', name: 'Tungabhadra Dam', nearDestinationId: 'hampi', lat: 15.2636, lon: 76.3337,
    distanceKm: 20, travelMin: 35, idealVisit: 'half-day', bestFor: ['nature'], entryCostINR: 20, priority: 3,
    howToGet: 'Auto or taxi from Hampi or Hosapete; local buses go from Hosapete bus stand.',
    why: 'Huge dam with gardens and sunset views over the reservoir.',
  }),
  x({
    id: 'hp-daroji', name: 'Daroji Sloth Bear Sanctuary', nearDestinationId: 'hampi', lat: 15.2744, lon: 76.5625,
    distanceKm: 30, travelMin: 50, idealVisit: 'half-day', bestFor: ['nature'], entryCostINR: 100, priority: 3,
    howToGet: 'Taxi or auto from Kamalapur; reach the watchtower by 3:30 PM, when bears come out to feed.',
    why: 'Watch wild sloth bears from a hilltop hide in the late afternoon.',
  }),

  // ---------------------------------------------------------------- Coorg
  x({
    id: 'cg-nagarhole', name: 'Nagarhole National Park', nearDestinationId: 'coorg', lat: 12.0599, lon: 76.1541,
    distanceKm: 90, travelMin: 135, idealVisit: 'day-trip', bestFor: ['nature', 'adventure'], entryCostINR: 600, priority: 4, season: [10, 11, 12, 1, 2, 3, 4, 5],
    howToGet: 'Taxi to the forest department safari counter at Veeranahosahalli or Nanachi gate; book safaris online in advance.',
    why: 'Tiger and elephant reserve with forest department safaris at dawn and dusk.',
  }),
  x({
    id: 'cg-iruppu', name: 'Iruppu Falls', nearDestinationId: 'coorg', lat: 11.9668, lon: 75.9839,
    distanceKm: 95, travelMin: 150, idealVisit: 'day-trip', bestFor: ['nature', 'spiritual'], entryCostINR: 50, priority: 3,
    howToGet: 'Taxi via Virajpet and Gonikoppal; can be paired with Nagarhole on the same day.',
    why: 'Forest waterfall beside the Rameshwara temple on the edge of Nagarhole.',
  }),
  x({
    id: 'cg-bhagamandala', name: 'Bhagamandala', nearDestinationId: 'coorg', lat: 12.3857, lon: 75.529,
    distanceKm: 35, travelMin: 60, idealVisit: 'half-day', bestFor: ['spiritual'], entryCostINR: 0, priority: 3,
    howToGet: 'Taxi or KSRTC bus from Madikeri; it is on the road to Talakaveri, so visit both together.',
    why: 'Temple town at the meeting point of three rivers.',
  }),
  x({
    id: 'cg-harangi', name: 'Harangi Dam', nearDestinationId: 'coorg', lat: 12.4929, lon: 75.9057,
    distanceKm: 35, travelMin: 50, idealVisit: 'half-day', bestFor: ['nature'], entryCostINR: 20, priority: 2,
    howToGet: 'Taxi or bus towards Kushalnagar; combine with Dubare and Bylakuppe.',
    why: 'Quiet reservoir and gardens near Kushalnagar.',
  }),

  // ---------------------------------------------------------------- Mysuru
  x({
    id: 'my-ranganathittu', name: 'Ranganathittu Bird Sanctuary', nearDestinationId: 'mysuru', lat: 12.4281, lon: 76.6536,
    distanceKm: 19, travelMin: 35, idealVisit: 'half-day', bestFor: ['nature'], entryCostINR: 100, priority: 4,
    howToGet: 'Auto or taxi towards Srirangapatna; boat rides start near the entrance. Go early morning.',
    why: 'Boat rides past nesting storks, pelicans and crocodiles on the Kaveri islets.',
  }),
  x({
    id: 'my-srirangapatna', name: 'Srirangapatna', nearDestinationId: 'mysuru', lat: 12.4226, lon: 76.6849,
    distanceKm: 18, travelMin: 30, idealVisit: 'half-day', bestFor: ['history', 'spiritual'], entryCostINR: 0, priority: 4,
    howToGet: 'Frequent buses and trains from Mysuru; an auto or taxi is easiest for hopping between sites.',
    why: "Tipu Sultan's island capital, with the old Ranganathaswamy temple and fort ruins.",
  }),
  x({
    id: 'my-somanathapura', name: 'Somanathapura Keshava Temple', nearDestinationId: 'mysuru', lat: 12.2758, lon: 76.8816,
    distanceKm: 38, travelMin: 60, idealVisit: 'half-day', bestFor: ['history'], entryCostINR: 25, priority: 4,
    howToGet: 'Taxi from Mysuru; buses are infrequent. Pair it with Talakadu on the same trip.',
    why: 'Star-shaped Hoysala temple with some of the finest stone carving in Karnataka.',
  }),
  x({
    id: 'my-talakadu', name: 'Talakadu', nearDestinationId: 'mysuru', lat: 12.192, lon: 77.0294,
    distanceKm: 50, travelMin: 75, idealVisit: 'half-day', bestFor: ['history', 'spiritual'], entryCostINR: 0, priority: 2,
    howToGet: 'Taxi via T. Narasipura, ideally after Somanathapura.',
    why: 'Temples half buried in sand dunes on the banks of the Kaveri.',
  }),
  x({
    id: 'my-gaganachukki', name: 'Gaganachukki and Bharachukki Falls', nearDestinationId: 'mysuru', lat: 12.2934, lon: 77.1688,
    distanceKm: 80, travelMin: 120, idealVisit: 'day-trip', bestFor: ['nature'], entryCostINR: 0, priority: 3, season: [7, 8, 9, 10, 11],
    howToGet: 'Taxi via Malavalli to Shivanasamudra; both falls are a few kilometres apart.',
    why: 'Twin waterfalls of the Kaveri, roaring in the months after the monsoon.',
  }),
  x({
    id: 'my-bandipur', name: 'Bandipur National Park', nearDestinationId: 'mysuru', lat: 11.7867, lon: 76.4207,
    distanceKm: 80, travelMin: 105, idealVisit: 'day-trip', bestFor: ['nature', 'adventure'], entryCostINR: 600, priority: 4,
    howToGet: 'Taxi or KSRTC bus towards Gundlupet; forest department bus and jeep safaris run from the Bandipur reception.',
    why: 'Tiger and elephant reserve with forest department safaris.',
  }),

  // ---------------------------------------------------------------- Pondicherry
  x({
    id: 'pd-mahabalipuram', name: 'Mahabalipuram', nearDestinationId: 'pondicherry', lat: 12.6166, lon: 80.1992,
    distanceKm: 95, travelMin: 120, idealVisit: 'day-trip', bestFor: ['history', 'beaches'], entryCostINR: 40, priority: 5,
    howToGet: 'Taxi or TNSTC/ECR bus up the coast road; it also works as a stop on the way to or from Chennai.',
    why: 'UNESCO Shore Temple and rock carvings beside the sea.',
  }),
  x({
    id: 'pd-chidambaram', name: 'Chidambaram Nataraja Temple', nearDestinationId: 'pondicherry', lat: 11.3993, lon: 79.6937,
    distanceKm: 65, travelMin: 100, idealVisit: 'day-trip', bestFor: ['spiritual', 'history'], entryCostINR: 0, priority: 4,
    howToGet: 'Bus or taxi south via Cuddalore; pair with Pichavaram mangroves, 15 km away.',
    why: 'Ancient Nataraja temple with a golden roof, one of the great Shiva shrines of the south.',
  }),
  x({
    id: 'pd-pichavaram', name: 'Pichavaram Mangrove Forest', nearDestinationId: 'pondicherry', lat: 11.4182, lon: 79.8021,
    distanceKm: 70, travelMin: 105, idealVisit: 'day-trip', bestFor: ['nature'], entryCostINR: 200, priority: 4,
    howToGet: 'Taxi via Chidambaram; rowing boats leave from the Tamil Nadu tourism boat house.',
    why: 'Row through narrow channels of one of the largest mangrove forests in the world.',
  }),
  x({
    id: 'pd-gingee', name: 'Gingee Fort', nearDestinationId: 'pondicherry', lat: 12.2506, lon: 79.3975,
    distanceKm: 70, travelMin: 105, idealVisit: 'day-trip', bestFor: ['history', 'adventure'], entryCostINR: 25, priority: 3,
    howToGet: 'Taxi or bus via Tindivanam; the Rajagiri climb is steep, so start early.',
    why: 'Citadel spread across three hills, a stiff climb with sweeping views.',
  }),

  // ---------------------------------------------------------------- Munnar
  x({
    id: 'mn-eravikulam', name: 'Eravikulam National Park', nearDestinationId: 'munnar', lat: 10.2275, lon: 77.0743,
    distanceKm: 15, travelMin: 40, idealVisit: 'half-day', bestFor: ['nature'], entryCostINR: 200, priority: 5, season: [4, 5, 6, 7, 8, 9, 10, 11, 12, 1],
    howToGet: 'Taxi or auto to the Fifth Mile counter; a park bus takes you up to Rajamalai. Closed for Nilgiri tahr calving, usually February and March.',
    why: 'Rolling grassland home to the rare Nilgiri tahr, with views of Anamudi.',
  }),
  x({
    id: 'mn-marayoor', name: 'Marayoor', nearDestinationId: 'munnar', lat: 10.2757, lon: 77.162,
    distanceKm: 40, travelMin: 75, idealVisit: 'half-day', bestFor: ['nature', 'history'], entryCostINR: 0, priority: 3,
    howToGet: 'Taxi past Eravikulam towards Marayoor; KSRTC buses also run from Munnar town.',
    why: 'Sandalwood forests, prehistoric dolmens and jaggery making in a dry rain-shadow valley.',
  }),
  x({
    id: 'mn-thekkady', name: 'Thekkady (Periyar Tiger Reserve)', nearDestinationId: 'munnar', lat: 9.5805, lon: 77.1811,
    distanceKm: 90, travelMin: 180, idealVisit: 'overnight', bestFor: ['nature', 'adventure', 'food'], entryCostINR: 300, priority: 4,
    howToGet: 'KSRTC bus or taxi via Poopara and Kumily; stay a night to catch the morning boat ride on Periyar lake.',
    why: 'Lake boat rides, spice plantations and guided forest walks in a tiger reserve.',
  }),

  // ---------------------------------------------------------------- Alleppey
  x({
    id: 'al-fort-kochi', name: 'Fort Kochi', nearDestinationId: 'alleppey', lat: 9.9676, lon: 76.2422,
    distanceKm: 60, travelMin: 105, idealVisit: 'day-trip', bestFor: ['history', 'culture', 'food'], entryCostINR: 0, priority: 5,
    howToGet: 'Train or KSRTC bus to Ernakulam, then a ferry or auto to Fort Kochi. A taxi takes about 1.5 hours.',
    why: 'Chinese fishing nets, Jew Town, colonial streets and evening Kathakali shows.',
  }),
  x({
    id: 'al-varkala', name: 'Varkala Cliff', nearDestinationId: 'alleppey', lat: 8.7333, lon: 76.7053,
    distanceKm: 110, travelMin: 165, idealVisit: 'overnight', bestFor: ['beaches', 'nature'], entryCostINR: 0, priority: 4, season: WINTER,
    howToGet: 'Train from Alappuzha to Varkala Sivagiri (about 2 hours), then an auto to the cliff.',
    why: 'Red laterite cliffs above a long beach, with cafes along the cliff path.',
  }),
  x({
    id: 'al-thekkady', name: 'Thekkady (Periyar Tiger Reserve)', nearDestinationId: 'alleppey', lat: 9.5805, lon: 77.1811,
    distanceKm: 140, travelMin: 240, idealVisit: 'overnight', bestFor: ['nature', 'adventure'], entryCostINR: 300, priority: 3,
    howToGet: 'KSRTC bus or taxi via Kottayam and Kumily; stay a night.',
    why: 'Spice gardens and lake boat rides in the hills, a cool change from the backwaters.',
  }),

  // ---------------------------------------------------------------- Ooty
  x({
    id: 'ot-coonoor', name: "Coonoor and Sim's Park", nearDestinationId: 'ooty', lat: 11.3563, lon: 76.7998,
    distanceKm: 19, travelMin: 45, idealVisit: 'half-day', bestFor: ['nature'], entryCostINR: 30, priority: 4,
    howToGet: 'Ride the Nilgiri toy train from Ooty to Coonoor (book ahead), or take a bus or taxi down the ghat road.',
    why: 'Quieter hill town with a hillside botanical park and tea estate viewpoints.',
  }),
  x({
    id: 'ot-mudumalai', name: 'Mudumalai (Theppakadu)', nearDestinationId: 'ooty', lat: 11.581, lon: 76.5852,
    distanceKm: 36, travelMin: 90, idealVisit: 'day-trip', bestFor: ['nature', 'adventure'], entryCostINR: 340, priority: 4,
    howToGet: 'Taxi down the Kalhatty ghat (36 hairpin bends, taxis only) or the longer Gudalur road by bus; safaris start at Theppakadu.',
    why: 'Elephant camp and forest department safaris in the Mudumalai tiger reserve.',
  }),
  x({
    id: 'ot-bandipur', name: 'Bandipur National Park', nearDestinationId: 'ooty', lat: 11.7867, lon: 76.4207,
    distanceKm: 80, travelMin: 150, idealVisit: 'day-trip', bestFor: ['nature'], entryCostINR: 600, priority: 2,
    howToGet: 'Taxi via Mudumalai on the Mysuru road; easiest as a stop on the way to or from Mysuru.',
    why: 'Adjoining tiger reserve, good if you are heading on to Mysuru anyway.',
  }),

  // ---------------------------------------------------------------- Udaipur
  x({
    id: 'ud-chittorgarh', name: 'Chittorgarh Fort', nearDestinationId: 'udaipur', lat: 24.8817, lon: 74.6467,
    distanceKm: 115, travelMin: 135, idealVisit: 'day-trip', bestFor: ['history'], entryCostINR: 40, priority: 5,
    howToGet: 'Train or bus from Udaipur City to Chittaurgarh Junction, then an auto up to the fort. A taxi day trip is simplest.',
    why: 'Vast hilltop fort with the Tower of Victory and Rani Padmini\'s palace.',
  }),
  x({
    id: 'ud-kumbhalgarh', name: 'Kumbhalgarh Fort', nearDestinationId: 'udaipur', lat: 25.1527, lon: 73.5863,
    distanceKm: 85, travelMin: 135, idealVisit: 'day-trip', bestFor: ['history'], entryCostINR: 40, priority: 5,
    howToGet: 'Taxi for the day; combine with Ranakpur, about an hour further on.',
    why: 'Hill fort ringed by one of the longest continuous walls in the world.',
  }),
  x({
    id: 'ud-ranakpur', name: 'Ranakpur Jain Temple', nearDestinationId: 'udaipur', lat: 25.139, lon: 73.4684,
    distanceKm: 95, travelMin: 150, idealVisit: 'day-trip', bestFor: ['spiritual', 'history'], entryCostINR: 0, priority: 4,
    howToGet: 'Same taxi day as Kumbhalgarh. Non-Jain visitors are usually allowed in from noon; cover shoulders and knees.',
    why: 'White marble temple with more than a thousand carved pillars, no two alike.',
  }),
  x({
    id: 'ud-eklingji', name: 'Eklingji Temple', nearDestinationId: 'udaipur', lat: 24.7469, lon: 73.7233,
    distanceKm: 22, travelMin: 40, idealVisit: 'half-day', bestFor: ['spiritual', 'history'], entryCostINR: 0, priority: 3,
    howToGet: 'Auto or taxi north on the Nathdwara road; check the darshan timings, it closes in the afternoon.',
    why: 'Carved temple complex of the Mewar rulers\' family deity.',
  }),
  x({
    id: 'ud-mount-abu', name: 'Mount Abu', nearDestinationId: 'udaipur', lat: 24.5924, lon: 72.7082,
    distanceKm: 165, travelMin: 210, idealVisit: 'overnight', bestFor: ['nature', 'spiritual'], entryCostINR: 0, priority: 3,
    howToGet: 'Bus or taxi; trains stop at Abu Road, 28 km below the town.',
    why: "Rajasthan's only hill station, with the Dilwara Jain temples and Nakki Lake.",
  }),

  // ---------------------------------------------------------------- Jaipur
  x({
    id: 'jp-abhaneri', name: 'Chand Baori, Abhaneri', nearDestinationId: 'jaipur', lat: 27.0073, lon: 76.6066,
    distanceKm: 95, travelMin: 120, idealVisit: 'half-day', bestFor: ['history'], entryCostINR: 25, priority: 4,
    howToGet: 'Taxi on the Agra road; it is a natural stop if you drive on to Agra or Bhangarh.',
    why: 'Thirteen-storey stepwell with thousands of steps in perfect geometric rows.',
  }),
  x({
    id: 'jp-bhangarh', name: 'Bhangarh Fort', nearDestinationId: 'jaipur', lat: 27.0955, lon: 76.2878,
    distanceKm: 85, travelMin: 135, idealVisit: 'day-trip', bestFor: ['history', 'adventure'], entryCostINR: 25, priority: 3,
    howToGet: 'Taxi via Dausa; combine with Abhaneri. Entry is not allowed after sunset.',
    why: 'Ruined 17th-century town, famous as the most haunted fort in India.',
  }),
  x({
    id: 'jp-pushkar', name: 'Pushkar', nearDestinationId: 'jaipur', lat: 26.4876, lon: 74.5578,
    distanceKm: 145, travelMin: 165, idealVisit: 'overnight', bestFor: ['spiritual', 'culture'], entryCostINR: 0, priority: 4,
    howToGet: 'Train or bus to Ajmer, then a 30-minute bus or taxi over the hill to Pushkar.',
    why: 'Holy lake town with bathing ghats, the Brahma temple and a famous camel fair around November.',
  }),
  x({
    id: 'jp-sambhar', name: 'Sambhar Salt Lake', nearDestinationId: 'jaipur', lat: 26.9498, lon: 75.0683,
    distanceKm: 90, travelMin: 120, idealVisit: 'half-day', bestFor: ['nature'], entryCostINR: 0, priority: 2, season: [11, 12, 1, 2],
    howToGet: 'Taxi via Phulera; go in winter for flamingos and the salt pans at sunset.',
    why: 'Largest inland salt lake in India, dotted with flamingos in winter.',
  }),
  x({
    id: 'jp-neemrana', name: 'Neemrana Fort Palace', nearDestinationId: 'jaipur', lat: 27.9938, lon: 76.3884,
    distanceKm: 150, travelMin: 180, idealVisit: 'overnight', bestFor: ['history', 'adventure'], entryCostINR: 0, priority: 2,
    howToGet: 'On the Delhi highway, so it suits a stop between Delhi and Jaipur. Day visits need a booking.',
    why: 'Fifteenth-century hill fort turned heritage hotel, with a zipline tour.',
  }),

  // ---------------------------------------------------------------- Manali
  x({
    id: 'ml-kasol', name: 'Kasol', nearDestinationId: 'manali', lat: 32.0104, lon: 77.3166,
    distanceKm: 75, travelMin: 150, idealVisit: 'overnight', bestFor: ['nature', 'adventure'], entryCostINR: 0, priority: 4,
    howToGet: 'HRTC bus or taxi to Bhuntar, then up the Parvati valley road.',
    why: 'Riverside village in the Parvati valley with cafes and an easy walk to Chalal.',
  }),
  x({
    id: 'ml-manikaran', name: 'Manikaran Sahib', nearDestinationId: 'manali', lat: 32.0269, lon: 77.3449,
    distanceKm: 80, travelMin: 165, idealVisit: 'day-trip', bestFor: ['spiritual'], entryCostINR: 0, priority: 3,
    howToGet: 'A few kilometres past Kasol on the same road; combine both.',
    why: 'Gurudwara and temples built over hot springs, with free langar.',
  }),
  x({
    id: 'ml-sissu', name: 'Sissu', nearDestinationId: 'manali', lat: 32.4689, lon: 77.1323,
    distanceKm: 40, travelMin: 75, idealVisit: 'half-day', bestFor: ['nature'], entryCostINR: 0, priority: 4, season: [4, 5, 6, 7, 8, 9, 10],
    howToGet: 'Taxi through the Atal Tunnel into Lahaul. Check road status in winter; snow can close the route.',
    why: 'Waterfall and wide Lahaul valley views just beyond the Atal Tunnel.',
  }),
  x({
    id: 'ml-kullu', name: 'Kullu and Beas river rafting', nearDestinationId: 'manali', lat: 31.9579, lon: 77.1089,
    distanceKm: 40, travelMin: 75, idealVisit: 'half-day', bestFor: ['adventure', 'shopping'], entryCostINR: 600, priority: 2, season: [3, 4, 5, 6, 9, 10],
    howToGet: 'Bus or taxi down the valley; rafting points are around Pirdi near Kullu.',
    why: 'River rafting on the Beas and shawl weaving units on the way back.',
  }),

  // ---------------------------------------------------------------- Rishikesh
  x({
    id: 'rk-mussoorie', name: 'Mussoorie', nearDestinationId: 'rishikesh', lat: 30.4569, lon: 78.0783,
    distanceKm: 80, travelMin: 165, idealVisit: 'overnight', bestFor: ['nature'], entryCostINR: 0, priority: 4,
    howToGet: 'Bus or taxi via Dehradun; stay a night to enjoy the Mall Road and Gun Hill without rushing.',
    why: 'Hill station with long views of the Doon valley and the Himalaya.',
  }),
  x({
    id: 'rk-kempty', name: 'Kempty Falls', nearDestinationId: 'rishikesh', lat: 30.4871, lon: 78.0361,
    distanceKm: 95, travelMin: 180, idealVisit: 'day-trip', bestFor: ['nature'], entryCostINR: 0, priority: 2,
    howToGet: '15 km beyond Mussoorie; best combined with a Mussoorie visit.',
    why: 'Popular waterfall below Mussoorie with pools for a splash.',
  }),
  x({
    id: 'rk-devprayag', name: 'Devprayag', nearDestinationId: 'rishikesh', lat: 30.1461, lon: 78.5986,
    distanceKm: 72, travelMin: 120, idealVisit: 'day-trip', bestFor: ['spiritual', 'nature'], entryCostINR: 0, priority: 4,
    howToGet: 'Shared jeep, bus or taxi up the Badrinath highway along the river.',
    why: 'Sacred confluence where the Alaknanda and Bhagirathi join to become the Ganga.',
  }),
  x({
    id: 'rk-rajaji', name: 'Rajaji National Park', nearDestinationId: 'rishikesh', lat: 30.1107, lon: 78.3334,
    distanceKm: 25, travelMin: 45, idealVisit: 'half-day', bestFor: ['nature', 'adventure'], entryCostINR: 400, priority: 3, season: [11, 12, 1, 2, 3, 4, 5, 6],
    howToGet: 'Taxi to the Chilla gate; jeep safaris run morning and afternoon. Closed in the monsoon.',
    why: 'Elephant reserve with jeep safaris right next to Rishikesh.',
  }),
  x({
    id: 'rk-robbers-cave', name: "Robber's Cave (Guchhupani)", nearDestinationId: 'rishikesh', lat: 30.3787, lon: 78.0635,
    distanceKm: 50, travelMin: 90, idealVisit: 'half-day', bestFor: ['nature', 'adventure'], entryCostINR: 35, priority: 2,
    howToGet: 'Bus or taxi to Dehradun, then an auto to Anarwala; wear sandals, you wade through the stream.',
    why: 'Narrow gorge where you walk through a cold stream between rock walls.',
  }),
];

export function excursionsFor(destinationId: string): Excursion[] {
  return EXCURSIONS.filter((e) => e.nearDestinationId === destinationId);
}
