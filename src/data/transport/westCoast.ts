// West coast transport data: North Goa, South Goa, Gokarna and Hampi.
// Checked Nov 2026 against confirmtkt.com / erail.in (trains), easemytrip.com (buses) and
// ixigo.com (flights). Timetables change, always confirm on IRCTC / redBus before booking.
// Times are at the station you board or leave from, not the train's first station.
import type { BusService, Corridor, DestinationAccess, FlightOption, TransportDataset } from './types';

const ct = (n: string) => `https://www.confirmtkt.com/train-schedule/${n}`;
const emt = (route: string) => `https://www.easemytrip.com/bus/${route}-bus-tickets/`;
const ixigo = (route: string) => `https://www.ixigo.com/${route}-flights`;

// ---------------------------------------------------------------------------------------------
// Last-mile access
// ---------------------------------------------------------------------------------------------

const access: DestinationAccess[] = [
  {
    destinationId: 'north-goa',
    arrivals: [
      {
        hub: 'Thivim railway station',
        kind: 'rail',
        code: 'THVM',
        lat: 15.6177,
        lon: 73.8706,
        distanceKm: 20,
        options: [
          { how: 'Taxi from outside the station (agree the fare first) or book a Goa Miles app cab', minutes: 40, costINR: [700, 1000], perVehicle: true },
          { how: 'Shared or local bus from the station road to Mapusa, then a Kadamba or private bus to Calangute', minutes: 75, costINR: [40, 80] },
        ],
      },
      {
        hub: 'Karmali railway station (Old Goa)',
        kind: 'rail',
        code: 'KRMI',
        lat: 15.4936,
        lon: 73.9224,
        distanceKm: 26,
        options: [
          { how: 'Taxi or Goa Miles app cab via Panaji', minutes: 50, costINR: [900, 1200], perVehicle: true },
        ],
      },
      {
        hub: 'Mapusa bus stand',
        kind: 'bus',
        lat: 15.5916,
        lon: 73.809,
        distanceKm: 9,
        options: [
          { how: 'Local bus to Calangute or Baga, leaves every few minutes from the same stand', minutes: 25, costINR: [20, 35] },
          { how: 'Taxi or Goa Miles app cab', minutes: 20, costINR: [400, 600], perVehicle: true },
        ],
      },
      {
        hub: 'Panaji Kadamba bus stand',
        kind: 'bus',
        lat: 15.4966,
        lon: 73.8358,
        distanceKm: 16,
        options: [
          { how: 'Local bus to Calangute (direct buses run through the day)', minutes: 40, costINR: [25, 40] },
          { how: 'Taxi or Goa Miles app cab', minutes: 30, costINR: [500, 800], perVehicle: true },
        ],
      },
      {
        hub: 'Goa Mopa airport (Manohar International)',
        kind: 'air',
        code: 'GOX',
        lat: 15.731,
        lon: 73.864,
        distanceKm: 35,
        options: [
          { how: 'Prepaid taxi or Goa Miles counter at arrivals', minutes: 55, costINR: [1400, 2000], perVehicle: true },
        ],
      },
      {
        hub: 'Goa Dabolim airport',
        kind: 'air',
        code: 'GOI',
        lat: 15.3808,
        lon: 73.8314,
        distanceKm: 42,
        options: [
          { how: 'Prepaid taxi or Goa Miles counter at arrivals', minutes: 70, costINR: [1300, 1800], perVehicle: true },
        ],
      },
    ],
    tips: [
      'Thivim is the closest railway station to Calangute, Baga and Anjuna. Madgaon is about 45 km away, so avoid it for North Goa if you have a choice.',
      'Goa has two airports. Mopa (GOX) is closer to North Goa; Dabolim (GOI) is closer to South Goa. Check which one your ticket says.',
      'Ola and Uber do not work in Goa. Use the Goa Miles app or the prepaid taxi counter, and agree the fare before getting into any other taxi.',
      'Renting a scooter is the cheapest way to get around once you arrive. Carry your driving licence; police checks are common.',
    ],
  },
  {
    destinationId: 'south-goa',
    arrivals: [
      {
        hub: 'Madgaon (Margao) railway station',
        kind: 'rail',
        code: 'MAO',
        lat: 15.2665,
        lon: 73.9693,
        distanceKm: 8,
        options: [
          { how: 'Prepaid taxi counter at the station exit or a Goa Miles app cab to Colva', minutes: 20, costINR: [400, 600], perVehicle: true },
          { how: 'Auto rickshaw from outside the station', minutes: 20, costINR: [250, 400], perVehicle: true },
        ],
      },
      {
        hub: 'Canacona railway station (for Palolem and Agonda)',
        kind: 'rail',
        code: 'CNO',
        lat: 15.0105,
        lon: 74.0465,
        distanceKm: 40,
        options: [
          { how: 'Auto rickshaw to Palolem beach (about 3 km)', minutes: 10, costINR: [150, 250], perVehicle: true },
          { how: 'Taxi to Colva', minutes: 60, costINR: [1300, 1700], perVehicle: true },
        ],
      },
      {
        hub: 'Margao Kadamba bus stand',
        kind: 'bus',
        lat: 15.2925,
        lon: 73.963,
        distanceKm: 7,
        options: [
          { how: 'Local bus to Colva, runs often in the daytime', minutes: 25, costINR: [20, 30] },
          { how: 'Taxi or Goa Miles app cab', minutes: 15, costINR: [300, 500], perVehicle: true },
        ],
      },
      {
        hub: 'Goa Dabolim airport',
        kind: 'air',
        code: 'GOI',
        lat: 15.3808,
        lon: 73.8314,
        distanceKm: 25,
        options: [
          { how: 'Prepaid taxi or Goa Miles counter at arrivals', minutes: 40, costINR: [900, 1300], perVehicle: true },
        ],
      },
      {
        hub: 'Goa Mopa airport (Manohar International)',
        kind: 'air',
        code: 'GOX',
        lat: 15.731,
        lon: 73.864,
        distanceKm: 75,
        options: [
          { how: 'Prepaid taxi or Goa Miles counter at arrivals', minutes: 110, costINR: [2800, 3600], perVehicle: true },
        ],
      },
    ],
    tips: [
      'Madgaon is the main station for Colva, Benaulim and Varca. For Palolem and Agonda get off at Canacona instead if your train stops there.',
      'If you fly, Dabolim (GOI) is much closer to South Goa than Mopa (GOX), which is about two hours away.',
      'Ola and Uber do not work in Goa. Use the prepaid taxi counter or the Goa Miles app.',
    ],
  },
  {
    destinationId: 'gokarna',
    arrivals: [
      {
        hub: 'Gokarna Road railway station',
        kind: 'rail',
        code: 'GOK',
        lat: 14.5187,
        lon: 74.3767,
        distanceKm: 10,
        options: [
          { how: 'Auto rickshaw from outside the station to Gokarna town', minutes: 20, costINR: [250, 400], perVehicle: true },
        ],
      },
      {
        hub: 'Kumta railway station',
        kind: 'rail',
        code: 'KT',
        lat: 14.4186,
        lon: 74.4064,
        distanceKm: 28,
        options: [
          { how: 'Auto rickshaw to Kumta bus stand, then a KSRTC bus to Gokarna', minutes: 60, costINR: [60, 120] },
          { how: 'Taxi or auto direct to Gokarna', minutes: 40, costINR: [700, 1100], perVehicle: true },
        ],
      },
      {
        hub: 'Gokarna bus stand (KSRTC)',
        kind: 'bus',
        lat: 14.5452,
        lon: 74.3183,
        distanceKm: 0.5,
        options: [
          { how: 'Walk to the town and Gokarna beach, or take an auto to Kudle or Om beach', minutes: 15, costINR: [100, 250], perVehicle: true },
        ],
      },
      {
        hub: 'Goa Dabolim airport',
        kind: 'air',
        code: 'GOI',
        lat: 15.3808,
        lon: 73.8314,
        distanceKm: 145,
        options: [
          { how: 'Pre-booked taxi straight to Gokarna', minutes: 200, costINR: [4000, 5500], perVehicle: true },
          { how: 'Taxi to Madgaon station, then a train to Gokarna Road or Kumta', minutes: 240, costINR: [600, 1500] },
        ],
      },
      {
        hub: 'Hubballi airport',
        kind: 'air',
        code: 'HBX',
        lat: 15.3617,
        lon: 75.0849,
        distanceKm: 165,
        options: [
          { how: 'Pre-booked taxi via Yellapur and Ankola', minutes: 240, costINR: [4500, 6000], perVehicle: true },
        ],
      },
    ],
    tips: [
      'Gokarna Road station is 10 km from town and has few facilities. Many trains reach it in the middle of the night, so prefer a train that arrives in daylight or book an auto in advance.',
      'Kumta has more trains than Gokarna Road and KSRTC buses to Gokarna, but it is about 28 km away.',
      'Kudle and Om beach are reached by auto or a short hill walk from the town. Do not walk the cliff paths after dark.',
    ],
  },
  {
    destinationId: 'hampi',
    arrivals: [
      {
        hub: 'Hosapete Junction railway station',
        kind: 'rail',
        code: 'HPT',
        lat: 15.2724,
        lon: 76.3893,
        distanceKm: 13,
        options: [
          { how: 'Auto rickshaw from outside the station to Hampi bazaar', minutes: 30, costINR: [250, 400], perVehicle: true },
          { how: 'Auto to Hosapete bus stand (about 1 km), then a KSRTC local bus to Hampi', minutes: 50, costINR: [40, 80] },
        ],
      },
      {
        hub: 'Hosapete central bus stand (KSRTC)',
        kind: 'bus',
        lat: 15.2688,
        lon: 76.3876,
        distanceKm: 13,
        options: [
          { how: 'KSRTC local bus to Hampi, runs about every 30 minutes in the daytime', minutes: 35, costINR: [20, 35] },
          { how: 'Auto rickshaw', minutes: 30, costINR: [250, 350], perVehicle: true },
        ],
      },
      {
        hub: 'Jindal Vijaynagar airport (Toranagallu)',
        kind: 'air',
        code: 'VDY',
        lat: 15.175,
        lon: 76.6332,
        distanceKm: 40,
        options: [
          { how: 'Pre-booked taxi (no regular buses from this small airport)', minutes: 60, costINR: [1500, 2200], perVehicle: true },
        ],
      },
      {
        hub: 'Hubballi airport',
        kind: 'air',
        code: 'HBX',
        lat: 15.3617,
        lon: 75.0849,
        distanceKm: 165,
        options: [
          { how: 'Taxi straight to Hampi', minutes: 210, costINR: [4500, 6000], perVehicle: true },
          { how: 'Auto to Hubballi station, then a train to Hosapete (Hampi Express or others)', minutes: 240, costINR: [300, 800] },
        ],
      },
    ],
    tips: [
      'Hosapete is the station and town for Hampi. Most stays are in Hampi bazaar or across the river at Hanumanahalli.',
      'Hampi is spread out. Hire an auto for the day or rent a bicycle or scooter in Hampi bazaar.',
      'It gets very hot from March to May. Start sightseeing early and carry water.',
    ],
  },
];

// ---------------------------------------------------------------------------------------------
// Shared bus and flight lists (same operators serve North and South Goa, drop point differs)
// ---------------------------------------------------------------------------------------------

const busesMumbaiToGoa = (drop: string): BusService[] => [
  { operator: 'Rajdhani Travels Corporation', type: 'Volvo AC Sleeper (2+1)', boarding: 'Borivali, Andheri, Dadar, Sion, Vashi, Panvel', drop, departs: '18:00-20:00', durationMin: 815, fareINR: [1200, 1800], government: false, source: emt('mumbai-to-goa') },
  { operator: 'Konkan Travels', type: 'AC Sleeper (2+1)', boarding: 'Borivali, Andheri, Dadar, Sion, Vashi, Panvel', drop, departs: '18:30-21:30', durationMin: 845, fareINR: [1150, 1800], government: false, source: emt('mumbai-to-goa') },
  { operator: 'Shree Giroba Travels', type: 'Non-AC Seater / Sleeper', boarding: 'Borivali, Andheri, Dadar, Sion, Panvel', drop, departs: '16:00-17:00', durationMin: 960, fareINR: [800, 1100], government: false, source: emt('mumbai-to-goa') },
];

const busesGoaToMumbai = (boarding: string): BusService[] => [
  { operator: 'Paulo Travels', type: 'AC Sleeper (2+1)', boarding, drop: 'Panvel, Vashi, Sion, Andheri, Borivali', departs: '19:00-20:00', durationMin: 880, fareINR: [1200, 1800], government: false, source: emt('goa-to-mumbai') },
  { operator: 'Naik Tours & Travels', type: 'AC Sleeper', boarding, drop: 'Panvel, Vashi, Sion, Andheri, Borivali', departs: '18:00-19:00', durationMin: 840, fareINR: [900, 1400], government: false, source: emt('goa-to-mumbai') },
  { operator: 'Dolphin Travel House', type: 'AC Sleeper', boarding, drop: 'Panvel, Vashi, Sion, Andheri, Borivali', departs: '13:00-14:00', durationMin: 840, fareINR: [1100, 1600], government: false, source: emt('goa-to-mumbai') },
];

const busesPuneToGoa = (drop: string): BusService[] => [
  { operator: 'IntrCity SmartBus', type: 'AC Sleeper with washroom', boarding: 'Swargate, Katraj, Wakad, Hinjewadi', drop, departs: '19:00-20:30', durationMin: 580, fareINR: [700, 1300], government: false, source: emt('pune-to-goa') },
  { operator: 'Dolphin Travel House', type: 'Bharat Benz AC Sleeper (2+1)', boarding: 'Swargate, Katraj, Wakad', drop, departs: '20:00-21:00', durationMin: 630, fareINR: [1000, 1500], government: false, source: emt('pune-to-goa') },
  { operator: 'Gogte Travels', type: 'Non-AC Sleeper', boarding: 'Swargate, Katraj', drop, departs: '19:00-20:00', durationMin: 690, fareINR: [700, 1000], government: false, source: emt('pune-to-goa') },
];

const busesGoaToPune = (boarding: string): BusService[] => [
  { operator: 'Kadamba Transport Corporation (KTCL)', type: 'AC Sleeper (2+1)', boarding, drop: 'Katraj, Swargate', departs: '17:00', durationMin: 705, fareINR: [1000, 1300], government: true, source: emt('goa-to-pune') },
  { operator: 'IntrCity SmartBus', type: 'AC Sleeper', boarding, drop: 'Katraj, Swargate, Wakad, Hinjewadi', departs: '20:00-21:00', durationMin: 590, fareINR: [1000, 1400], government: false, source: emt('goa-to-pune') },
  { operator: 'Dolphin Travel House', type: 'Bharat Benz AC Sleeper (2+1)', boarding, drop: 'Katraj, Swargate, Chandni Chowk', departs: '15:00', durationMin: 720, fareINR: [1000, 1500], government: false, source: emt('goa-to-pune') },
];

const busesBengaluruToGoa = (drop: string): BusService[] => [
  { operator: 'Paulo Travels', type: 'AC Seater / Sleeper', boarding: 'Majestic (Anand Rao Circle), Yeshwanthpur, Nelamangala', drop, departs: '19:30-20:30', durationMin: 680, fareINR: [800, 1500], government: false, source: emt('bangalore-to-goa') },
  { operator: 'Seabird Tourists', type: 'AC Sleeper', boarding: 'Majestic, Yeshwanthpur, Nelamangala', drop, departs: '18:30-19:30', durationMin: 780, fareINR: [850, 1500], government: false, source: emt('bangalore-to-goa') },
  { operator: 'VRL Travels', type: 'Non-AC Sleeper', boarding: 'Majestic, Yeshwanthpur, Nelamangala', drop, departs: '19:00-20:00', durationMin: 870, fareINR: [900, 1200], government: false, source: emt('bangalore-to-goa') },
];

const busesGoaToBengaluru = (boarding: string): BusService[] => [
  { operator: 'IntrCity SmartBus', type: 'AC Sleeper with washroom', boarding, drop: 'Yeshwanthpur, Majestic, Silk Board, Electronic City', departs: '15:30-19:30', durationMin: 720, fareINR: [700, 1300], government: false, source: emt('goa-to-bangalore') },
  { operator: 'SRS Travels', type: 'AC Sleeper', boarding, drop: 'Yeshwanthpur, Majestic, Silk Board', departs: '18:30-19:30', durationMin: 750, fareINR: [800, 1300], government: false, source: emt('goa-to-bangalore') },
  { operator: 'Seabird Tourists', type: 'Non-AC Sleeper', boarding, drop: 'Yeshwanthpur, Majestic', departs: '18:00-19:00', durationMin: 810, fareINR: [700, 1000], government: false, source: emt('goa-to-bangalore') },
];

const busesHyderabadToGoa = (drop: string): BusService[] => [
  { operator: 'IntrCity SmartBus', type: 'AC Sleeper with washroom', boarding: 'Lakdikapool, Ameerpet, Kukatpally, Miyapur', drop, departs: '19:00-20:00', durationMin: 925, fareINR: [1100, 1700], government: false, source: emt('hyderabad-to-goa') },
  { operator: 'PSR Travels Goa', type: 'AC Sleeper (2+1)', boarding: 'Lakdikapool, Ameerpet, Kukatpally, Miyapur', drop, departs: '21:00-21:30', durationMin: 880, fareINR: [1200, 1800], government: false, source: emt('hyderabad-to-goa') },
  { operator: 'FlixBus', type: 'AC Sleeper', boarding: 'Lakdikapool, Kukatpally, Miyapur, Patancheru', drop, departs: '16:00-18:00', durationMin: 1010, fareINR: [900, 1400], government: false, source: emt('hyderabad-to-goa') },
];

const busesGoaToHyderabad = (boarding: string): BusService[] => [
  { operator: 'IntrCity SmartBus', type: 'AC Sleeper with washroom', boarding, drop: 'Miyapur, Kukatpally, Ameerpet, Lakdikapul', departs: '15:30-16:30', durationMin: 925, fareINR: [1100, 1700], government: false, source: emt('goa-to-hyderabad') },
  { operator: 'PSR Travels Goa', type: 'AC Sleeper', boarding, drop: 'Miyapur, Kukatpally, Ameerpet, Lakdikapul', departs: '15:30-16:00', durationMin: 930, fareINR: [1100, 1700], government: false, source: emt('goa-to-hyderabad') },
  { operator: 'AR Group Vijaylaxmi Travels', type: 'Bharat Benz AC Sleeper', boarding, drop: 'Miyapur, Kukatpally, Ameerpet', departs: '16:00', durationMin: 900, fareINR: [1100, 1700], government: false, source: emt('goa-to-hyderabad') },
];

const busesChennaiToGoa = (drop: string): BusService[] => [
  { operator: 'SBM Transport', type: 'Bharat Benz AC Sleeper (2+1)', boarding: 'Koyambedu, Maduravoyal, Poonamallee', drop, departs: '15:30', durationMin: 1110, fareINR: [2800, 3500], government: false, source: emt('chennai-to-goa') },
  { operator: 'Seabird Tourists', type: 'AC Sleeper', boarding: 'Guindy, Vadapalani, Koyambedu', drop, departs: '13:30', durationMin: 1215, fareINR: [3000, 3500], government: false, source: emt('chennai-to-goa') },
];

const busesGoaToChennai = (boarding: string): BusService[] => [
  { operator: 'SBM Transport', type: 'Bharat Benz AC Sleeper (2+1)', boarding, drop: 'Poonamallee, Maduravoyal, Koyambedu', departs: '14:30', durationMin: 1070, fareINR: [3300, 3800], government: false, source: emt('goa-to-chennai') },
  { operator: 'VEEJEY Tours and Travels', type: 'AC Sleeper (2+1)', boarding, drop: 'Poonamallee, Koyambedu, Guindy', departs: '14:45', durationMin: 1105, fareINR: [3200, 3700], government: false, source: emt('goa-to-chennai') },
];

const busesGoaToGokarna = (boarding: string): BusService[] => [
  { operator: 'VVT Holidays', type: 'AC Volvo Seater', boarding, drop: 'Gokarna town, near KSRTC bus stand', departs: '14:30-15:00', durationMin: 260, fareINR: [900, 1200], government: false, source: emt('goa-to-gokarna') },
  { operator: 'VRL Travels', type: 'AC Sleeper', boarding, drop: 'Gokarna, Madangeri bus stop', departs: '15:30', durationMin: 255, fareINR: [1000, 1800], government: false, source: emt('goa-to-gokarna') },
];

const busesGokarnaToGoa = (drop: string): BusService[] => [
  { operator: 'Anand Travels', type: 'AC Sleeper (2+1)', boarding: 'Gokarna town near KSRTC bus stand, Madangeri', drop, departs: '05:00-05:30', durationMin: 175, fareINR: [600, 1000], government: false, source: emt('gokarna-to-goa') },
  { operator: 'Seabird Tourists', type: 'AC Volvo Multi-Axle Sleeper', boarding: 'Madangeri, Gokarna cross', drop, departs: '04:00-04:30', durationMin: 220, fareINR: [900, 1200], government: false, source: emt('gokarna-to-goa') },
  { operator: 'VVT Holidays', type: 'AC Volvo Seater', boarding: 'Gokarna town, Madangeri', drop, departs: '06:30', durationMin: 210, fareINR: [900, 1200], government: false, source: emt('gokarna-to-goa') },
];

const busesGoaToHampi = (boarding: string): BusService[] => [
  { operator: 'Advaith Tours and Travels', type: 'AC Sleeper (2+1)', boarding, drop: 'Hampi (Kamalapur) / Hosapete', departs: '18:30-19:00', durationMin: 645, fareINR: [1100, 1500], government: false, source: emt('goa-to-hampi') },
  { operator: 'National Travels Goa', type: 'AC Sleeper (2+1)', boarding, drop: 'Hampi', departs: '18:30-19:00', durationMin: 675, fareINR: [1200, 1600], government: false, source: emt('goa-to-hampi') },
  { operator: 'Seabird Tourists', type: 'AC Sleeper', boarding, drop: 'Hosapete', departs: '18:00', durationMin: 645, fareINR: [1300, 1700], government: false, source: emt('goa-to-hampi') },
];

const busesHampiToGoa = (drop: string): BusService[] => [
  { operator: 'National Travels Goa', type: 'AC Sleeper (2+1)', boarding: 'Hampi', drop, departs: '18:30', durationMin: 690, fareINR: [1200, 1600], government: false, source: emt('hampi-to-goa') },
  { operator: 'Advaith Tours and Travels', type: 'AC Sleeper (2+1)', boarding: 'Hampi', drop, departs: '21:00-21:30', durationMin: 655, fareINR: [1100, 1500], government: false, source: emt('hampi-to-goa') },
  { operator: 'Seabird Tourists', type: 'AC Sleeper', boarding: 'Hosapete', drop, departs: '20:45', durationMin: 675, fareINR: [1300, 1700], government: false, source: emt('hampi-to-goa') },
];

const fly = (fromAirport: string, toAirport: string, airlines: string[], durationMin: number, route: string): FlightOption => ({
  fromAirport,
  toAirport,
  airlines,
  durationMin,
  nonstop: true,
  source: ixigo(route),
});

// ---------------------------------------------------------------------------------------------
// Corridors
// ---------------------------------------------------------------------------------------------

const corridors: Corridor[] = [
  // ----- Mumbai <-> North Goa -----
  {
    from: 'Mumbai',
    to: 'north-goa',
    trains: [
      { number: '22229', name: 'CSMT Madgaon Vande Bharat Express', fromCode: 'CSMT', toCode: 'THVM', departs: '05:25', arrives: '12:03', arrivalDayOffset: 0, durationMin: 398, runsOn: ['Mon', 'Tue', 'Wed', 'Thu', 'Sat', 'Sun'], classes: ['CC', 'EC'], source: ct('22229') },
      { number: '12051', name: 'CSMT Madgaon Jan Shatabdi Express', fromCode: 'CSMT', toCode: 'THVM', departs: '05:10', arrives: '13:20', arrivalDayOffset: 0, durationMin: 490, runsOn: 'daily', classes: ['CC', '2S'], source: ct('12051') },
      { number: '10103', name: 'Mandovi Express', fromCode: 'CSMT', toCode: 'THVM', departs: '07:10', arrives: '17:30', arrivalDayOffset: 0, durationMin: 620, runsOn: 'daily', classes: ['1A', '2A', '3A', '3E', 'SL'], source: ct('10103') },
      { number: '10111', name: 'Konkan Kanya Express', fromCode: 'CSMT', toCode: 'THVM', departs: '23:02', arrives: '08:10', arrivalDayOffset: 1, durationMin: 548, runsOn: 'daily', classes: ['1A', '2A', '3A', 'SL', '2S'], source: ct('10111') },
    ],
    buses: busesMumbaiToGoa('Mapusa, Porvorim, Panaji'),
    flights: [fly('BOM', 'GOI', ['IndiGo', 'Air India', 'Air India Express'], 75, 'Mumbai-Goa')],
    advice: 'Take a daytime train (Vande Bharat, Jan Shatabdi or Mandovi Express) along the scenic Konkan coast and get off at Thivim, the closest station to Calangute. For an overnight trip, the Konkan Kanya Express reaches Thivim at about 8 am.',
  },
  {
    from: 'north-goa',
    to: 'Mumbai',
    trains: [
      { number: '22230', name: 'Madgaon CSMT Vande Bharat Express', fromCode: 'THVM', toCode: 'CSMT', departs: '15:22', arrives: '22:30', arrivalDayOffset: 0, durationMin: 428, runsOn: ['Mon', 'Tue', 'Wed', 'Thu', 'Sat', 'Sun'], classes: ['CC', 'EC'], source: ct('22230') },
      { number: '12052', name: 'Madgaon CSMT Jan Shatabdi Express', fromCode: 'THVM', toCode: 'CSMT', departs: '15:52', arrives: '00:10', arrivalDayOffset: 1, durationMin: 498, runsOn: 'daily', classes: ['CC', '2S'], source: ct('12052') },
      { number: '10104', name: 'Mandovi Express', fromCode: 'THVM', toCode: 'CSMT', departs: '10:08', arrives: '21:45', arrivalDayOffset: 0, durationMin: 697, runsOn: 'daily', classes: ['1A', '2A', '3A', '3E', 'SL'], source: ct('10104') },
      { number: '10112', name: 'Konkan Kanya Express', fromCode: 'THVM', toCode: 'CSMT', departs: '20:02', arrives: '05:40', arrivalDayOffset: 1, durationMin: 578, runsOn: 'daily', classes: ['1A', '2A', '3A', 'SL', '2S'], source: ct('10112') },
    ],
    buses: busesGoaToMumbai('Mapusa, Porvorim, Panaji'),
    flights: [fly('GOI', 'BOM', ['IndiGo', 'Air India', 'Air India Express'], 85, 'Goa-Mumbai')],
    advice: 'Board at Thivim. The Konkan Kanya Express is the easiest overnight option and reaches Mumbai CSMT at about 5:40 am; the Vande Bharat is the fastest daytime train.',
  },

  // ----- Mumbai <-> South Goa -----
  {
    from: 'Mumbai',
    to: 'south-goa',
    trains: [
      { number: '22229', name: 'CSMT Madgaon Vande Bharat Express', fromCode: 'CSMT', toCode: 'MAO', departs: '05:25', arrives: '13:10', arrivalDayOffset: 0, durationMin: 465, runsOn: ['Mon', 'Tue', 'Wed', 'Thu', 'Sat', 'Sun'], classes: ['CC', 'EC'], source: ct('22229') },
      { number: '12051', name: 'CSMT Madgaon Jan Shatabdi Express', fromCode: 'CSMT', toCode: 'MAO', departs: '05:10', arrives: '14:30', arrivalDayOffset: 0, durationMin: 560, runsOn: 'daily', classes: ['CC', '2S'], source: ct('12051') },
      { number: '10103', name: 'Mandovi Express', fromCode: 'CSMT', toCode: 'MAO', departs: '07:10', arrives: '19:30', arrivalDayOffset: 0, durationMin: 740, runsOn: 'daily', classes: ['1A', '2A', '3A', '3E', 'SL'], source: ct('10103') },
      { number: '10111', name: 'Konkan Kanya Express', fromCode: 'CSMT', toCode: 'MAO', departs: '23:02', arrives: '09:42', arrivalDayOffset: 1, durationMin: 640, runsOn: 'daily', classes: ['1A', '2A', '3A', 'SL', '2S'], source: ct('10111') },
    ],
    buses: busesMumbaiToGoa('Madgaon (Margao) KTC bus stand'),
    flights: [fly('BOM', 'GOI', ['IndiGo', 'Air India', 'Air India Express'], 75, 'Mumbai-Goa')],
    advice: 'All four trains end at Madgaon, about 20 minutes by taxi from Colva. The overnight Konkan Kanya Express is the most comfortable choice if you do not want to lose a day.',
  },
  {
    from: 'south-goa',
    to: 'Mumbai',
    trains: [
      { number: '22230', name: 'Madgaon CSMT Vande Bharat Express', fromCode: 'MAO', toCode: 'CSMT', departs: '14:40', arrives: '22:30', arrivalDayOffset: 0, durationMin: 470, runsOn: ['Mon', 'Tue', 'Wed', 'Thu', 'Sat', 'Sun'], classes: ['CC', 'EC'], source: ct('22230') },
      { number: '12052', name: 'Madgaon CSMT Jan Shatabdi Express', fromCode: 'MAO', toCode: 'CSMT', departs: '15:05', arrives: '00:10', arrivalDayOffset: 1, durationMin: 545, runsOn: 'daily', classes: ['CC', '2S'], source: ct('12052') },
      { number: '10104', name: 'Mandovi Express', fromCode: 'MAO', toCode: 'CSMT', departs: '09:15', arrives: '21:45', arrivalDayOffset: 0, durationMin: 750, runsOn: 'daily', classes: ['1A', '2A', '3A', '3E', 'SL'], source: ct('10104') },
      { number: '10112', name: 'Konkan Kanya Express', fromCode: 'MAO', toCode: 'CSMT', departs: '19:00', arrives: '05:40', arrivalDayOffset: 1, durationMin: 640, runsOn: 'daily', classes: ['1A', '2A', '3A', 'SL', '2S'], source: ct('10112') },
    ],
    buses: busesGoaToMumbai('Madgaon (Margao) KTC bus stand'),
    flights: [fly('GOI', 'BOM', ['IndiGo', 'Air India', 'Air India Express'], 85, 'Goa-Mumbai')],
    advice: 'Board at Madgaon, where all these trains start, so you get your seat without a rush. Konkan Kanya overnight or Vande Bharat in the afternoon are the easiest.',
  },

  // ----- Mumbai <-> Gokarna -----
  {
    from: 'Mumbai',
    to: 'gokarna',
    trains: [
      { number: '12133', name: 'CSMT Mangaluru Junction Superfast Express', fromCode: 'CSMT', toCode: 'KT', departs: '21:54', arrives: '09:28', arrivalDayOffset: 1, durationMin: 694, runsOn: 'daily', classes: ['2A', '3A', 'SL', '2S'], source: ct('12133') },
      { number: '12619', name: 'Matsyagandha Express', fromCode: 'LTT', toCode: 'GOK', departs: '15:10', arrives: '02:42', arrivalDayOffset: 1, durationMin: 692, runsOn: 'daily', classes: ['2A', '3A', '3E', 'SL'], source: ct('12619') },
      { number: '16345', name: 'Netravati Express', fromCode: 'LTT', toCode: 'KT', departs: '11:40', arrives: '00:40', arrivalDayOffset: 1, durationMin: 780, runsOn: 'daily', classes: ['2A', '3A', '3E', 'SL'], source: ct('16345') },
    ],
    buses: [
      { operator: 'Canara Pinto', type: 'Volvo AC Multi-Axle Sleeper (2+1)', boarding: 'Borivali, Andheri, Sion, Chembur, Vashi, Kalamboli', drop: 'Gokarna town near KSRTC bus stand', departs: '12:30-14:30', durationMin: 930, fareINR: [2000, 2800], government: false, source: emt('mumbai-to-gokarna') },
      { operator: 'Anand Travels', type: 'Volvo AC Multi-Axle Sleeper (2+1)', boarding: 'Borivali, Andheri, Sion, Vashi', drop: 'Gokarna town, Madangeri', departs: '13:00-13:30', durationMin: 850, fareINR: [2000, 2800], government: false, source: emt('mumbai-to-gokarna') },
    ],
    flights: [],
    advice: 'Take the overnight Mangaluru Express from CSMT and get off at Kumta at about 9:30 am, then a bus or taxi to Gokarna. The Matsyagandha stops at Gokarna Road itself, but at about 2:45 am. There are no flights; flying to Goa Dabolim and driving 3 hours is the air option.',
  },
  {
    from: 'gokarna',
    to: 'Mumbai',
    trains: [
      { number: '12620', name: 'Matsyagandha Express', fromCode: 'GOK', toCode: 'LTT', departs: '18:06', arrives: '06:35', arrivalDayOffset: 1, durationMin: 749, runsOn: 'daily', classes: ['2A', '3A', '3E', 'SL'], source: ct('12620') },
      { number: '12134', name: 'Mangaluru Junction CSMT Superfast Express', fromCode: 'KT', toCode: 'CSMT', departs: '17:02', arrives: '04:45', arrivalDayOffset: 1, durationMin: 703, runsOn: 'daily', classes: ['2A', '3A', 'SL'], source: ct('12134') },
      { number: '16346', name: 'Netravati Express', fromCode: 'KT', toCode: 'LTT', departs: '02:26', arrives: '17:05', arrivalDayOffset: 0, durationMin: 879, runsOn: 'daily', classes: ['2A', '3A', '3E', 'SL'], source: ct('16346') },
    ],
    buses: [
      { operator: 'Anand Travels', type: 'Volvo AC Multi-Axle Sleeper', boarding: 'Gokarna town near KSRTC bus stand, Madangeri', drop: 'Vashi, Chembur, Sion, Andheri, Borivali', departs: '16:30-18:30', durationMin: 770, fareINR: [1300, 3100], government: false, source: emt('gokarna-to-mumbai') },
      { operator: 'Prasanna Purple', type: 'Volvo 9600 AC Multi-Axle Sleeper (2+1)', boarding: 'Gokarna cross, Madangeri', drop: 'Vashi, Chembur, Sion, Andheri, Borivali', departs: '19:30-20:00', durationMin: 750, fareINR: [2500, 3200], government: false, source: emt('gokarna-to-mumbai') },
    ],
    flights: [],
    advice: 'The Matsyagandha Express leaves from Gokarna Road itself at about 6 pm and reaches Lokmanya Tilak Terminus (Kurla) early next morning, which is the simplest option.',
  },

  // ----- Mumbai <-> Hampi -----
  {
    from: 'Mumbai',
    to: 'hampi',
    trains: [
      { number: '11139', name: 'CSMT Hosapete Express', fromCode: 'CSMT', toCode: 'HPT', departs: '21:20', arrives: '12:50', arrivalDayOffset: 1, durationMin: 930, runsOn: 'daily', classes: ['1A', '2A', '3A', 'CC', 'SL'], source: ct('11139') },
    ],
    buses: [],
    flights: [],
    advice: 'The daily CSMT Hosapete Express (via Pune) is the only direct train and the easiest way; take an auto from Hosapete to Hampi (13 km). There are no direct flights to the Hampi area from Mumbai.',
  },
  {
    from: 'hampi',
    to: 'Mumbai',
    trains: [
      { number: '11140', name: 'Hosapete CSMT Express', fromCode: 'HPT', toCode: 'CSMT', departs: '13:40', arrives: '05:10', arrivalDayOffset: 1, durationMin: 930, runsOn: 'daily', classes: ['1A', '2A', '3A', 'CC', 'SL', '2S'], source: ct('11140') },
    ],
    buses: [],
    flights: [],
    advice: 'Take the daily Hosapete CSMT Express from Hosapete at 1:40 pm; it reaches Mumbai CSMT early next morning.',
  },

  // ----- Pune <-> North Goa -----
  {
    from: 'Pune',
    to: 'north-goa',
    trains: [
      { number: '12780', name: 'Goa Express', fromCode: 'PUNE', toCode: 'MAO', departs: '17:10', arrives: '05:40', arrivalDayOffset: 1, durationMin: 750, runsOn: 'daily', classes: ['1A', '2A', '3A', '3E', 'SL'], source: ct('12780') },
    ],
    buses: busesPuneToGoa('Mapusa, Panaji'),
    flights: [fly('PNQ', 'GOI', ['IndiGo'], 60, 'Pune-Goa')],
    advice: 'An overnight AC sleeper bus is the best choice for North Goa because it drops you at Mapusa or Panaji. The daily Goa Express only goes to Madgaon, about an hour by taxi from Calangute.',
  },
  {
    from: 'north-goa',
    to: 'Pune',
    trains: [
      { number: '12779', name: 'Goa Express', fromCode: 'MAO', toCode: 'PUNE', departs: '15:40', arrives: '04:15', arrivalDayOffset: 1, durationMin: 755, runsOn: 'daily', classes: ['1A', '2A', '3A', '3E', 'SL'], source: ct('12779') },
    ],
    buses: busesGoaToPune('Mapusa, Panaji (behind KTC bus stand)'),
    flights: [fly('GOI', 'PNQ', ['IndiGo'], 60, 'Goa-Pune')],
    advice: 'Take an overnight bus from Mapusa or Panaji; Kadamba, the Goa government bus company, runs an AC sleeper. The daily Goa Express leaves from Madgaon, about an hour south.',
  },

  // ----- Pune <-> South Goa -----
  {
    from: 'Pune',
    to: 'south-goa',
    trains: [
      { number: '12780', name: 'Goa Express', fromCode: 'PUNE', toCode: 'MAO', departs: '17:10', arrives: '05:40', arrivalDayOffset: 1, durationMin: 750, runsOn: 'daily', classes: ['1A', '2A', '3A', '3E', 'SL'], source: ct('12780') },
      { number: '22150', name: 'Pune Ernakulam Superfast Express', fromCode: 'PUNE', toCode: 'MAO', departs: '18:45', arrives: '05:40', arrivalDayOffset: 1, durationMin: 655, runsOn: ['Wed', 'Sun'], classes: ['2A', '3A', 'SL', '2S'], source: ct('22150') },
      { number: '11097', name: 'Poorna Express', fromCode: 'PUNE', toCode: 'MAO', departs: '22:50', arrives: '12:55', arrivalDayOffset: 1, durationMin: 845, runsOn: ['Sat'], classes: ['2A', '3A', 'SL'], source: ct('11097') },
    ],
    buses: busesPuneToGoa('Madgaon (Margao) KTC bus stand'),
    flights: [fly('PNQ', 'GOI', ['IndiGo'], 60, 'Pune-Goa')],
    advice: 'The daily overnight Goa Express reaches Madgaon at about 5:40 am, 20 minutes from Colva. It is the easiest and cheapest way for a first-timer.',
  },
  {
    from: 'south-goa',
    to: 'Pune',
    trains: [
      { number: '12779', name: 'Goa Express', fromCode: 'MAO', toCode: 'PUNE', departs: '15:40', arrives: '04:15', arrivalDayOffset: 1, durationMin: 755, runsOn: 'daily', classes: ['1A', '2A', '3A', '3E', 'SL'], source: ct('12779') },
      { number: '22149', name: 'Ernakulam Pune Superfast Express', fromCode: 'MAO', toCode: 'PUNE', departs: '17:10', arrives: '05:50', arrivalDayOffset: 1, durationMin: 760, runsOn: ['Tue', 'Fri'], classes: ['2A', '3A', 'SL'], source: ct('22149') },
      { number: '11098', name: 'Poorna Express', fromCode: 'MAO', toCode: 'PUNE', departs: '09:55', arrives: '23:00', arrivalDayOffset: 0, durationMin: 785, runsOn: ['Tue'], classes: ['2A', '3A', 'SL'], source: ct('11098') },
    ],
    buses: busesGoaToPune('Madgaon (Margao) KTC bus stand'),
    flights: [fly('GOI', 'PNQ', ['IndiGo'], 60, 'Goa-Pune')],
    advice: 'Take the daily Goa Express from Madgaon in the afternoon; it reaches Pune at about 4:15 am.',
  },

  // ----- Pune <-> Gokarna -----
  {
    from: 'Pune',
    to: 'gokarna',
    trains: [
      { number: '11097', name: 'Poorna Express', fromCode: 'PUNE', toCode: 'GOK', departs: '22:50', arrives: '14:36', arrivalDayOffset: 1, durationMin: 946, runsOn: ['Sat'], classes: ['2A', '3A', 'SL'], source: ct('11097') },
    ],
    buses: [],
    flights: [],
    advice: 'The only direct train is the weekly Poorna Express (Saturdays). On other days take the Goa Express or a bus to Madgaon, then a Konkan train or bus to Gokarna Road or Kumta.',
  },
  {
    from: 'gokarna',
    to: 'Pune',
    trains: [
      { number: '11098', name: 'Poorna Express', fromCode: 'GOK', toCode: 'PUNE', departs: '06:22', arrives: '23:00', arrivalDayOffset: 0, durationMin: 998, runsOn: ['Tue'], classes: ['2A', '3A', 'SL'], source: ct('11098') },
    ],
    buses: [],
    flights: [],
    advice: 'The only direct train is the weekly Poorna Express (Tuesdays). On other days go to Madgaon first by train or bus and take the daily Goa Express to Pune.',
  },

  // ----- Pune <-> Hampi -----
  {
    from: 'Pune',
    to: 'hampi',
    trains: [
      { number: '11139', name: 'CSMT Hosapete Express', fromCode: 'PUNE', toCode: 'HPT', departs: '01:10', arrives: '12:50', arrivalDayOffset: 0, durationMin: 700, runsOn: 'daily', classes: ['1A', '2A', '3A', 'CC', 'SL'], source: ct('11139') },
    ],
    buses: [],
    flights: [],
    advice: 'Take the daily CSMT Hosapete Express. It leaves Pune at 1:10 am, just after midnight, so book it for the date after the evening you go to the station.',
  },
  {
    from: 'hampi',
    to: 'Pune',
    trains: [
      { number: '11140', name: 'Hosapete CSMT Express', fromCode: 'HPT', toCode: 'PUNE', departs: '13:40', arrives: '01:05', arrivalDayOffset: 1, durationMin: 685, runsOn: 'daily', classes: ['1A', '2A', '3A', 'CC', 'SL', '2S'], source: ct('11140') },
    ],
    buses: [],
    flights: [],
    advice: 'The daily Hosapete CSMT Express leaves Hosapete at 1:40 pm and reaches Pune at about 1 am.',
  },

  // ----- Bengaluru <-> North Goa -----
  {
    from: 'Bengaluru',
    to: 'north-goa',
    trains: [
      { number: '17309', name: 'Yesvantpur Vasco da Gama Express', fromCode: 'YPR', toCode: 'MAO', departs: '15:30', arrives: '03:25', arrivalDayOffset: 1, durationMin: 715, runsOn: 'daily', classes: ['2A', '3A', 'SL', '2S'], source: ct('17309') },
      { number: '26655', name: 'Yesvantpur Madgaon Vande Bharat Express', fromCode: 'YPR', toCode: 'MAO', departs: '07:35', arrives: '20:55', arrivalDayOffset: 0, durationMin: 800, runsOn: ['Mon', 'Tue', 'Thu', 'Fri', 'Sat', 'Sun'], classes: ['CC', 'EC'], source: ct('26655') },
    ],
    buses: busesBengaluruToGoa('Mapusa, Panaji'),
    flights: [fly('BLR', 'GOI', ['IndiGo', 'Air India Express', 'Alliance Air'], 80, 'Bangalore-Goa')],
    advice: 'An overnight AC sleeper bus to Mapusa or a 1 hour 20 minute flight is best for North Goa. Trains from Bengaluru only go to Madgaon, about an hour by taxi from Calangute.',
  },
  {
    from: 'north-goa',
    to: 'Bengaluru',
    trains: [
      { number: '17310', name: 'Vasco da Gama Yesvantpur Express', fromCode: 'MAO', toCode: 'YPR', departs: '23:35', arrives: '12:35', arrivalDayOffset: 1, durationMin: 780, runsOn: 'daily', classes: ['2A', '3A', 'SL', '2S'], source: ct('17310') },
      { number: '26656', name: 'Madgaon Yesvantpur Vande Bharat Express', fromCode: 'MAO', toCode: 'YPR', departs: '08:20', arrives: '21:15', arrivalDayOffset: 0, durationMin: 775, runsOn: ['Mon', 'Tue', 'Wed', 'Fri', 'Sat', 'Sun'], classes: ['CC', 'EC'], source: ct('26656') },
    ],
    buses: busesGoaToBengaluru('Mapusa interstate bus stand, Panaji (Patto)'),
    flights: [fly('GOI', 'BLR', ['IndiGo', 'Air India Express', 'Alliance Air'], 80, 'Goa-Bangalore')],
    advice: 'Overnight buses leave from Mapusa and Panaji in the evening. Trains leave from Madgaon, so allow an hour to get there from North Goa.',
  },

  // ----- Bengaluru <-> South Goa -----
  {
    from: 'Bengaluru',
    to: 'south-goa',
    trains: [
      { number: '17309', name: 'Yesvantpur Vasco da Gama Express', fromCode: 'YPR', toCode: 'MAO', departs: '15:30', arrives: '03:25', arrivalDayOffset: 1, durationMin: 715, runsOn: 'daily', classes: ['2A', '3A', 'SL', '2S'], source: ct('17309') },
      { number: '26655', name: 'Yesvantpur Madgaon Vande Bharat Express', fromCode: 'YPR', toCode: 'MAO', departs: '07:35', arrives: '20:55', arrivalDayOffset: 0, durationMin: 800, runsOn: ['Mon', 'Tue', 'Thu', 'Fri', 'Sat', 'Sun'], classes: ['CC', 'EC'], source: ct('26655') },
    ],
    buses: busesBengaluruToGoa('Madgaon (Margao) KTC bus stand'),
    flights: [fly('BLR', 'GOI', ['IndiGo', 'Air India Express', 'Alliance Air'], 80, 'Bangalore-Goa')],
    advice: 'The daily Vasco Express reaches Madgaon at about 3:30 am, so the daytime Vande Bharat (arrives about 9 pm) or an overnight bus is easier. Dabolim airport is only 25 km from Colva.',
  },
  {
    from: 'south-goa',
    to: 'Bengaluru',
    trains: [
      { number: '26656', name: 'Madgaon Yesvantpur Vande Bharat Express', fromCode: 'MAO', toCode: 'YPR', departs: '08:20', arrives: '21:15', arrivalDayOffset: 0, durationMin: 775, runsOn: ['Mon', 'Tue', 'Wed', 'Fri', 'Sat', 'Sun'], classes: ['CC', 'EC'], source: ct('26656') },
      { number: '17310', name: 'Vasco da Gama Yesvantpur Express', fromCode: 'MAO', toCode: 'YPR', departs: '23:35', arrives: '12:35', arrivalDayOffset: 1, durationMin: 780, runsOn: 'daily', classes: ['2A', '3A', 'SL', '2S'], source: ct('17310') },
    ],
    buses: busesGoaToBengaluru('Madgaon (Margao) KTC bus stand'),
    flights: [fly('GOI', 'BLR', ['IndiGo', 'Air India Express', 'Alliance Air'], 80, 'Goa-Bangalore')],
    advice: 'Board at Madgaon. The daily overnight Vasco Express or the daytime Vande Bharat both work well.',
  },

  // ----- Bengaluru <-> Gokarna -----
  {
    from: 'Bengaluru',
    to: 'gokarna',
    trains: [
      { number: '16595', name: 'Panchaganga Express', fromCode: 'SBC', toCode: 'GOK', departs: '18:50', arrives: '06:57', arrivalDayOffset: 1, durationMin: 727, runsOn: 'daily', classes: ['1A', '2A', '3A', '3E', 'SL'], source: ct('16595') },
    ],
    buses: [
      { operator: 'Sri Durgamba Travels', type: 'Bharat Benz AC Sleeper (2+1)', boarding: 'Majestic (Anand Rao Circle), Yeshwanthpur, Nelamangala', drop: 'Gokarna bus stand', departs: '21:30-22:30', durationMin: 510, fareINR: [930, 1500], government: false, source: emt('bangalore-to-gokarna') },
      { operator: 'SRS Travels', type: 'Non-AC Sleeper', boarding: 'Majestic, Yeshwanthpur', drop: 'Gokarna bus stand', departs: '20:30-21:30', durationMin: 660, fareINR: [700, 1000], government: false, source: emt('bangalore-to-gokarna') },
      { operator: 'Anand Travels', type: 'AC Sleeper', boarding: 'Majestic, Yeshwanthpur', drop: 'Gokarna bus stand', departs: '18:00', durationMin: 665, fareINR: [1000, 1500], government: false, source: emt('bangalore-to-gokarna') },
    ],
    flights: [],
    advice: 'The daily Panchaganga Express from KSR Bengaluru reaches Gokarna Road at about 7 am, a very convenient time; take an auto 10 km into town.',
  },
  {
    from: 'gokarna',
    to: 'Bengaluru',
    trains: [
      { number: '16596', name: 'Panchaganga Express', fromCode: 'GOK', toCode: 'SBC', departs: '18:35', arrives: '07:15', arrivalDayOffset: 1, durationMin: 760, runsOn: 'daily', classes: ['1A', '2A', '3A', '3E', 'SL'], source: ct('16596') },
    ],
    buses: [
      { operator: 'Seabird Tourists', type: 'AC Sleeper / Non-AC Sleeper', boarding: 'Gokarna check post, Madangeri', drop: 'Yeshwanthpur, Majestic', departs: '19:00-20:30', durationMin: 630, fareINR: [600, 1000], government: false, source: emt('gokarna-to-bangalore') },
      { operator: 'Sri Durgamba Travels', type: 'Bharat Benz AC Sleeper (2+1)', boarding: 'Gokarna town, Madangeri', drop: 'Yeshwanthpur, Majestic, Silk Board', departs: '21:00', durationMin: 540, fareINR: [980, 1500], government: false, source: emt('gokarna-to-bangalore') },
    ],
    flights: [],
    advice: 'The daily Panchaganga Express leaves Gokarna Road at about 6:35 pm and reaches KSR Bengaluru at 7:15 am. Leave town by 5:45 pm to catch it.',
  },

  // ----- Bengaluru <-> Hampi -----
  {
    from: 'Bengaluru',
    to: 'hampi',
    trains: [
      { number: '16592', name: 'Hampi Express', fromCode: 'SBC', toCode: 'HPT', departs: '21:50', arrives: '07:00', arrivalDayOffset: 1, durationMin: 550, runsOn: 'daily', classes: ['1A', '2A', '3A', 'CC', 'SL'], source: ct('16592') },
      { number: '12649', name: 'Karnataka Sampark Kranti Express', fromCode: 'YPR', toCode: 'HPT', departs: '13:30', arrives: '22:45', arrivalDayOffset: 0, durationMin: 555, runsOn: ['Mon', 'Wed', 'Fri', 'Sat', 'Sun'], classes: ['1A', '2A', '3A', '3E', 'SL'], source: ct('12649') },
    ],
    buses: [
      { operator: 'KSRTC (Pallakki)', type: 'Non-AC Sleeper', boarding: 'Majestic (Kempegowda bus station), Yeshwanthpur, Nelamangala', drop: 'Hosapete, then Hampi bus station', departs: '22:59', durationMin: 450, fareINR: [800, 900], government: true, source: 'https://newsable.asianetnews.com/gallery/karnataka-news/ksrtc-bengaluru-to-hampi-pallakki-sleeper-bus-service-check-timings-route-fare-online-booking-details-here-x3n9e30' },
      { operator: 'Cauvery Travels', type: 'AC Sleeper', boarding: 'Anand Rao Circle, Yeshwanthpur, Nelamangala', drop: 'Hosapete, Kamalapur (Hampi)', departs: '22:00', durationMin: 450, fareINR: [800, 1200], government: false, source: emt('bangalore-to-hampi') },
      { operator: 'Greenline Travels', type: 'Volvo AC Sleeper', boarding: 'Anand Rao Circle, Yeshwanthpur', drop: 'Hosapete, Kamalapur (Hampi)', departs: '21:00', durationMin: 510, fareINR: [1100, 1500], government: false, source: emt('bangalore-to-hampi') },
    ],
    flights: [
      { fromAirport: 'BLR', toAirport: 'VDY', airlines: ['Star Air'], durationMin: 55, nonstop: true, source: 'https://www.flightsfrom.com/BLR-VDY' },
    ],
    advice: 'The daily overnight Hampi Express from KSR Bengaluru reaches Hosapete at 7 am; take an auto or the local bus 13 km to Hampi. KSRTC also runs a sleeper bus that goes all the way to Hampi.',
  },
  {
    from: 'hampi',
    to: 'Bengaluru',
    trains: [
      { number: '16591', name: 'Hampi Express', fromCode: 'HPT', toCode: 'SBC', departs: '21:10', arrives: '05:45', arrivalDayOffset: 1, durationMin: 515, runsOn: 'daily', classes: ['1A', '2A', '3A', 'CC', 'SL'], source: ct('16591') },
      { number: '12650', name: 'Karnataka Sampark Kranti Express', fromCode: 'HPT', toCode: 'YPR', departs: '17:35', arrives: '04:15', arrivalDayOffset: 1, durationMin: 640, runsOn: ['Mon', 'Tue', 'Wed', 'Fri', 'Sun'], classes: ['1A', '2A', '3A', '3E', 'SL'], source: ct('12650') },
    ],
    buses: [
      { operator: 'KSRTC (Pallakki)', type: 'Non-AC Sleeper', boarding: 'Hampi bus station (20:00), Hosapete (20:30)', drop: 'Majestic, then Shantinagar', departs: '20:00', durationMin: 510, fareINR: [800, 900], government: true, source: 'https://newsable.asianetnews.com/gallery/karnataka-news/ksrtc-bengaluru-to-hampi-pallakki-sleeper-bus-service-check-timings-route-fare-online-booking-details-here-x3n9e30' },
      { operator: 'Varad Lines', type: 'Bharat Benz AC Sleeper', boarding: 'Hampi Kamalapur, near Ambedkar Circle', drop: 'Majestic, Silk Board, Electronic City', departs: '22:45', durationMin: 375, fareINR: [800, 1200], government: false, source: emt('hampi-to-bangalore') },
      { operator: 'Go Tour Travels and Holidays', type: 'Scania AC Multi-Axle Sleeper', boarding: 'Hosapete, Station Road', drop: 'Majestic, Silk Board', departs: '21:50', durationMin: 465, fareINR: [700, 1200], government: false, source: emt('hampi-to-bangalore') },
    ],
    flights: [
      { fromAirport: 'VDY', toAirport: 'BLR', airlines: ['Star Air'], durationMin: 50, nonstop: true, source: 'https://www.flightsfrom.com/VDY-BLR' },
    ],
    advice: 'Take the daily Hampi Express from Hosapete at 9:10 pm; it reaches KSR Bengaluru at about 5:45 am.',
  },

  // ----- Hyderabad <-> North Goa -----
  {
    from: 'Hyderabad',
    to: 'north-goa',
    trains: [
      { number: '17021', name: 'Hyderabad Vasco da Gama Express', fromCode: 'SC', toCode: 'MAO', departs: '09:55', arrives: '04:15', arrivalDayOffset: 1, durationMin: 1100, runsOn: ['Thu'], classes: ['2A', '3A', 'SL'], source: ct('17021') },
      { number: '17322', name: 'Jasidih Vasco da Gama Express', fromCode: 'SC', toCode: 'MAO', departs: '19:05', arrives: '13:25', arrivalDayOffset: 1, durationMin: 1100, runsOn: ['Tue'], classes: ['2A', '3A', '3E', 'SL'], source: ct('17322') },
    ],
    buses: busesHyderabadToGoa('Mapusa, Panaji'),
    flights: [fly('HYD', 'GOI', ['IndiGo'], 75, 'Hyderabad-Goa')],
    advice: 'There is no daily train, only weekly ones that reach Madgaon, far from North Goa. Fly (about 1 hour 15 minutes) or take an overnight AC sleeper bus to Mapusa.',
  },
  {
    from: 'north-goa',
    to: 'Hyderabad',
    trains: [
      { number: '17040', name: 'Vasco da Gama Secunderabad Express', fromCode: 'MAO', toCode: 'SC', departs: '09:10', arrives: '04:00', arrivalDayOffset: 1, durationMin: 1130, runsOn: ['Thu', 'Sat'], classes: ['2A', '3A', 'SL'], source: ct('17040') },
      { number: '17022', name: 'Vasco da Gama Hyderabad Express', fromCode: 'MAO', toCode: 'SC', departs: '09:10', arrives: '03:30', arrivalDayOffset: 1, durationMin: 1100, runsOn: ['Fri'], classes: ['2A', '3A', 'SL', '2S'], source: ct('17022') },
      { number: '17321', name: 'Vasco da Gama Jasidih Express', fromCode: 'MAO', toCode: 'SC', departs: '05:05', arrives: '23:25', arrivalDayOffset: 0, durationMin: 1100, runsOn: ['Fri'], classes: ['2A', '3A', '3E', 'SL'], source: ct('17321') },
    ],
    buses: busesGoaToHyderabad('Mapusa interstate bus stand, Panaji (Patto)'),
    flights: [fly('GOI', 'HYD', ['IndiGo'], 65, 'Goa-Hyderabad')],
    advice: 'Fly from Dabolim or take an afternoon AC sleeper bus from Mapusa or Panaji. Trains run only a few days a week and leave from Madgaon.',
  },

  // ----- Hyderabad <-> South Goa -----
  {
    from: 'Hyderabad',
    to: 'south-goa',
    trains: [
      { number: '17021', name: 'Hyderabad Vasco da Gama Express', fromCode: 'SC', toCode: 'MAO', departs: '09:55', arrives: '04:15', arrivalDayOffset: 1, durationMin: 1100, runsOn: ['Thu'], classes: ['2A', '3A', 'SL'], source: ct('17021') },
      { number: '17322', name: 'Jasidih Vasco da Gama Express', fromCode: 'SC', toCode: 'MAO', departs: '19:05', arrives: '13:25', arrivalDayOffset: 1, durationMin: 1100, runsOn: ['Tue'], classes: ['2A', '3A', '3E', 'SL'], source: ct('17322') },
    ],
    buses: busesHyderabadToGoa('Madgaon (Margao) KTC bus stand'),
    flights: [fly('HYD', 'GOI', ['IndiGo'], 75, 'Hyderabad-Goa')],
    advice: 'Flying to Dabolim is quickest; it is only 25 km from Colva. If you prefer the train, the weekly Thursday and Tuesday trains from Secunderabad reach Madgaon the next day.',
  },
  {
    from: 'south-goa',
    to: 'Hyderabad',
    trains: [
      { number: '17040', name: 'Vasco da Gama Secunderabad Express', fromCode: 'MAO', toCode: 'SC', departs: '09:10', arrives: '04:00', arrivalDayOffset: 1, durationMin: 1130, runsOn: ['Thu', 'Sat'], classes: ['2A', '3A', 'SL'], source: ct('17040') },
      { number: '17022', name: 'Vasco da Gama Hyderabad Express', fromCode: 'MAO', toCode: 'SC', departs: '09:10', arrives: '03:30', arrivalDayOffset: 1, durationMin: 1100, runsOn: ['Fri'], classes: ['2A', '3A', 'SL', '2S'], source: ct('17022') },
      { number: '17321', name: 'Vasco da Gama Jasidih Express', fromCode: 'MAO', toCode: 'SC', departs: '05:05', arrives: '23:25', arrivalDayOffset: 0, durationMin: 1100, runsOn: ['Fri'], classes: ['2A', '3A', '3E', 'SL'], source: ct('17321') },
    ],
    buses: busesGoaToHyderabad('Madgaon (Margao) KTC bus stand'),
    flights: [fly('GOI', 'HYD', ['IndiGo'], 65, 'Goa-Hyderabad')],
    advice: 'Trains leave Madgaon in the morning on Thursday, Friday and Saturday and reach Secunderabad early next morning. On other days fly or take an afternoon sleeper bus.',
  },

  // ----- Hyderabad <-> Gokarna (no direct service) -----
  {
    from: 'Hyderabad',
    to: 'gokarna',
    trains: [],
    buses: [],
    flights: [],
    advice: 'No direct train or regular direct bus. Fly or take an overnight bus to Goa, then a Konkan train from Madgaon to Gokarna Road or Kumta (about 1.5 to 2 hours).',
  },
  {
    from: 'gokarna',
    to: 'Hyderabad',
    trains: [],
    buses: [],
    flights: [],
    advice: 'No direct train or regular direct bus. Take a train or bus to Madgaon in Goa, then fly from Dabolim or take a sleeper bus to Hyderabad.',
  },

  // ----- Hyderabad <-> Hampi -----
  {
    from: 'Hyderabad',
    to: 'hampi',
    trains: [
      { number: '12650', name: 'Karnataka Sampark Kranti Express', fromCode: 'KCG', toCode: 'HPT', departs: '08:30', arrives: '17:30', arrivalDayOffset: 0, durationMin: 540, runsOn: ['Mon', 'Tue', 'Wed', 'Fri', 'Sun'], classes: ['1A', '2A', '3A', '3E', 'SL'], source: ct('12650') },
      { number: '17039', name: 'Secunderabad Vasco da Gama Express', fromCode: 'SC', toCode: 'HPT', departs: '10:05', arrives: '19:50', arrivalDayOffset: 0, durationMin: 585, runsOn: ['Wed', 'Fri'], classes: ['2A', '3A', 'SL'], source: ct('17039') },
      { number: '17021', name: 'Hyderabad Vasco da Gama Express', fromCode: 'SC', toCode: 'HPT', departs: '09:55', arrives: '19:50', arrivalDayOffset: 0, durationMin: 595, runsOn: ['Thu'], classes: ['2A', '3A', 'SL'], source: ct('17021') },
      { number: '17071', name: 'Hyderabad Belagavi Express', fromCode: 'HYB', toCode: 'HPT', departs: '16:30', arrives: '03:55', arrivalDayOffset: 1, durationMin: 685, runsOn: ['Thu'], classes: ['1A', '2A', '3A', 'SL'], source: ct('17071') },
    ],
    buses: [
      { operator: 'Sri Durgambika Travels', type: 'Non-AC Sleeper', boarding: 'Miyapur, Kukatpally, Ameerpet, Mehdipatnam', drop: 'Hosapete, Kamalapur (Hampi)', departs: '22:30-23:00', durationMin: 525, fareINR: [750, 1100], government: false, source: emt('hyderabad-to-hampi') },
      { operator: 'Go Tour Travels and Holidays', type: 'AC Sleeper (2+1)', boarding: 'Miyapur, Kukatpally, Ameerpet', drop: 'Hosapete, Kamalapur (Hampi)', departs: '23:30-23:45', durationMin: 495, fareINR: [750, 1400], government: false, source: emt('hyderabad-to-hampi') },
      { operator: 'Abhay Bus', type: 'AC Sleeper (2+1)', boarding: 'Ameerpet, LB Nagar, Shamshabad', drop: 'Hampi (Kamalapur)', departs: '22:45', durationMin: 540, fareINR: [1000, 1400], government: false, source: emt('hyderabad-to-hampi') },
    ],
    flights: [],
    advice: 'Trains to Hosapete run only on some days of the week; check the live list for your date. Otherwise take an overnight sleeper bus that drops you near Hampi in the morning.',
  },
  {
    from: 'hampi',
    to: 'Hyderabad',
    trains: [
      { number: '12649', name: 'Karnataka Sampark Kranti Express', fromCode: 'HPT', toCode: 'KCG', departs: '22:50', arrives: '08:05', arrivalDayOffset: 1, durationMin: 555, runsOn: ['Mon', 'Wed', 'Fri', 'Sat', 'Sun'], classes: ['1A', '2A', '3A', '3E', 'SL'], source: ct('12649') },
      { number: '17040', name: 'Vasco da Gama Secunderabad Express', fromCode: 'HPT', toCode: 'SC', departs: '16:45', arrives: '04:00', arrivalDayOffset: 1, durationMin: 675, runsOn: ['Thu', 'Sat'], classes: ['2A', '3A', 'SL'], source: ct('17040') },
      { number: '17022', name: 'Vasco da Gama Hyderabad Express', fromCode: 'HPT', toCode: 'SC', departs: '16:45', arrives: '03:30', arrivalDayOffset: 1, durationMin: 645, runsOn: ['Fri'], classes: ['2A', '3A', 'SL', '2S'], source: ct('17022') },
      { number: '17072', name: 'Belagavi Hyderabad Express', fromCode: 'HPT', toCode: 'HYB', departs: '18:15', arrives: '07:00', arrivalDayOffset: 1, durationMin: 765, runsOn: ['Fri'], classes: ['1A', '2A', '3A', 'SL'], source: ct('17072') },
    ],
    buses: [
      { operator: 'Go Tour Travels and Holidays', type: 'AC Sleeper (2+1)', boarding: 'Hosapete Station Road, Hampi Kamalapur', drop: 'Shamshabad, Ameerpet, Kukatpally, Miyapur', departs: '20:45', durationMin: 510, fareINR: [750, 1400], government: false, source: emt('hampi-to-hyderabad') },
      { operator: 'Sri Durgambika Travels', type: 'Non-AC Sleeper', boarding: 'Kamalapur (Hampi)', drop: 'Ameerpet, Kukatpally, Miyapur', departs: '21:30', durationMin: 510, fareINR: [750, 1100], government: false, source: emt('hampi-to-hyderabad') },
      { operator: 'Greenline Travels', type: 'Non-AC Sleeper', boarding: 'Hosapete', drop: 'Ameerpet, Kukatpally, Miyapur', departs: '20:30', durationMin: 540, fareINR: [800, 1100], government: false, source: emt('hampi-to-hyderabad') },
    ],
    flights: [],
    advice: 'The overnight Sampark Kranti Express from Hosapete (5 days a week) reaches Kacheguda at about 8 am and is the easiest option.',
  },

  // ----- Chennai <-> Goa, Gokarna, Hampi -----
  {
    from: 'Chennai',
    to: 'north-goa',
    trains: [],
    buses: busesChennaiToGoa('Panaji, Mapusa'),
    flights: [fly('MAA', 'GOI', ['IndiGo'], 90, 'Chennai-Goa')],
    advice: 'No direct train. Flying is by far the easiest (about 1.5 hours). The bus takes 18 to 20 hours.',
  },
  {
    from: 'north-goa',
    to: 'Chennai',
    trains: [],
    buses: busesGoaToChennai('Mapusa, Porvorim, Panaji'),
    flights: [fly('GOI', 'MAA', ['IndiGo'], 95, 'Goa-Chennai')],
    advice: 'No direct train. Fly from Dabolim (about 1.5 hours); the bus takes around 18 hours.',
  },
  {
    from: 'Chennai',
    to: 'south-goa',
    trains: [],
    buses: busesChennaiToGoa('Margao').filter((b) => b.operator === 'Seabird Tourists'),
    flights: [fly('MAA', 'GOI', ['IndiGo'], 90, 'Chennai-Goa')],
    advice: 'No direct train. Fly to Dabolim, which is only 25 km from Colva.',
  },
  {
    from: 'south-goa',
    to: 'Chennai',
    trains: [],
    buses: busesGoaToChennai('Panaji, Ponda (board early, buses do not stop in Margao)'),
    flights: [fly('GOI', 'MAA', ['IndiGo'], 95, 'Goa-Chennai')],
    advice: 'No direct train. Fly from Dabolim, which is close to South Goa.',
  },
  {
    from: 'Chennai',
    to: 'gokarna',
    trains: [],
    buses: [],
    flights: [],
    advice: 'No direct service. Go to Bengaluru first, then take the daily Panchaganga Express to Gokarna Road, or fly to Goa and continue by train from Madgaon.',
  },
  {
    from: 'gokarna',
    to: 'Chennai',
    trains: [],
    buses: [],
    flights: [],
    advice: 'No direct service. Take the Panchaganga Express to Bengaluru, then a train or bus to Chennai, or go to Goa and fly from Dabolim.',
  },
  {
    from: 'Chennai',
    to: 'hampi',
    trains: [
      { number: '17314', name: 'Chennai Hubballi Express', fromCode: 'MAS', toCode: 'HPT', departs: '15:50', arrives: '01:40', arrivalDayOffset: 1, durationMin: 590, runsOn: ['Thu', 'Sat'], classes: ['1A', '2A', '3A', 'SL'], source: ct('17314') },
    ],
    buses: [],
    flights: [],
    advice: 'The direct train runs only twice a week and reaches Hosapete at about 1:40 am. On other days go to Bengaluru and take the overnight Hampi Express.',
  },
  {
    from: 'hampi',
    to: 'Chennai',
    trains: [
      { number: '17313', name: 'Hubballi Chennai Express', fromCode: 'HPT', toCode: 'MAS', departs: '23:55', arrives: '11:10', arrivalDayOffset: 1, durationMin: 675, runsOn: ['Wed', 'Fri'], classes: ['1A', '2A', '3A', 'SL'], source: ct('17313') },
    ],
    buses: [],
    flights: [],
    advice: 'The direct train runs on Wednesdays and Fridays. On other days take the Hampi Express to Bengaluru and change.',
  },

  // ----- Hops: North Goa <-> South Goa -----
  {
    from: 'north-goa',
    to: 'south-goa',
    trains: [
      { number: '10111', name: 'Konkan Kanya Express', fromCode: 'THVM', toCode: 'MAO', departs: '08:12', arrives: '09:42', arrivalDayOffset: 0, durationMin: 90, runsOn: 'daily', classes: ['1A', '2A', '3A', 'SL', '2S'], source: ct('10111') },
      { number: '12051', name: 'CSMT Madgaon Jan Shatabdi Express', fromCode: 'THVM', toCode: 'MAO', departs: '13:22', arrives: '14:30', arrivalDayOffset: 0, durationMin: 68, runsOn: 'daily', classes: ['CC', '2S'], source: ct('12051') },
      { number: '10103', name: 'Mandovi Express', fromCode: 'THVM', toCode: 'MAO', departs: '17:32', arrives: '19:30', arrivalDayOffset: 0, durationMin: 118, runsOn: 'daily', classes: ['1A', '2A', '3A', '3E', 'SL'], source: ct('10103') },
    ],
    buses: [],
    flights: [],
    advice: 'A taxi or Goa Miles cab takes about 1 to 1.5 hours. Kadamba buses run Mapusa to Panaji to Margao through the day and are very cheap. Trains from Thivim to Madgaon are an option if you are near the station.',
  },
  {
    from: 'south-goa',
    to: 'north-goa',
    trains: [
      { number: '10104', name: 'Mandovi Express', fromCode: 'MAO', toCode: 'THVM', departs: '09:15', arrives: '10:06', arrivalDayOffset: 0, durationMin: 51, runsOn: 'daily', classes: ['1A', '2A', '3A', '3E', 'SL'], source: ct('10104') },
      { number: '22230', name: 'Madgaon CSMT Vande Bharat Express', fromCode: 'MAO', toCode: 'THVM', departs: '14:40', arrives: '15:20', arrivalDayOffset: 0, durationMin: 40, runsOn: ['Mon', 'Tue', 'Wed', 'Thu', 'Sat', 'Sun'], classes: ['CC', 'EC'], source: ct('22230') },
      { number: '12052', name: 'Madgaon CSMT Jan Shatabdi Express', fromCode: 'MAO', toCode: 'THVM', departs: '15:05', arrives: '15:50', arrivalDayOffset: 0, durationMin: 45, runsOn: 'daily', classes: ['CC', '2S'], source: ct('12052') },
      { number: '10112', name: 'Konkan Kanya Express', fromCode: 'MAO', toCode: 'THVM', departs: '19:00', arrives: '20:00', arrivalDayOffset: 0, durationMin: 60, runsOn: 'daily', classes: ['1A', '2A', '3A', 'SL', '2S'], source: ct('10112') },
    ],
    buses: [],
    flights: [],
    advice: 'A taxi or Goa Miles cab takes about 1 to 1.5 hours. Kadamba buses run Margao to Panaji to Mapusa through the day. Trains from Madgaon to Thivim take under an hour, then a taxi to the beaches.',
  },

  // ----- Hops: South Goa <-> Gokarna -----
  {
    from: 'south-goa',
    to: 'gokarna',
    trains: [
      { number: '12133', name: 'CSMT Mangaluru Junction Superfast Express', fromCode: 'MAO', toCode: 'KT', departs: '07:40', arrives: '09:28', arrivalDayOffset: 0, durationMin: 108, runsOn: 'daily', classes: ['2A', '3A', 'SL', '2S'], source: ct('12133') },
      { number: '11097', name: 'Poorna Express', fromCode: 'MAO', toCode: 'GOK', departs: '13:35', arrives: '14:36', arrivalDayOffset: 0, durationMin: 61, runsOn: ['Sun'], classes: ['2A', '3A', 'SL'], source: ct('11097') },
      { number: '12619', name: 'Matsyagandha Express', fromCode: 'MAO', toCode: 'GOK', departs: '01:15', arrives: '02:42', arrivalDayOffset: 0, durationMin: 87, runsOn: 'daily', classes: ['2A', '3A', '3E', 'SL'], source: ct('12619') },
      { number: '16345', name: 'Netravati Express', fromCode: 'MAO', toCode: 'KT', departs: '22:42', arrives: '00:40', arrivalDayOffset: 1, durationMin: 118, runsOn: 'daily', classes: ['2A', '3A', '3E', 'SL'], source: ct('16345') },
    ],
    buses: busesGoaToGokarna('Margao, Cuncolim, Canacona'),
    flights: [],
    advice: 'Take the morning Mangaluru Express from Madgaon to Kumta (about 9:30 am), then a KSRTC bus or taxi to Gokarna. Avoid the night trains that reach Gokarna Road around 2 to 3 am.',
  },
  {
    from: 'gokarna',
    to: 'south-goa',
    trains: [
      { number: '12620', name: 'Matsyagandha Express', fromCode: 'GOK', toCode: 'MAO', departs: '18:06', arrives: '20:00', arrivalDayOffset: 0, durationMin: 114, runsOn: 'daily', classes: ['2A', '3A', '3E', 'SL'], source: ct('12620') },
      { number: '12134', name: 'Mangaluru Junction CSMT Superfast Express', fromCode: 'KT', toCode: 'MAO', departs: '17:02', arrives: '18:40', arrivalDayOffset: 0, durationMin: 98, runsOn: 'daily', classes: ['2A', '3A', 'SL'], source: ct('12134') },
      { number: '11098', name: 'Poorna Express', fromCode: 'GOK', toCode: 'MAO', departs: '06:22', arrives: '09:00', arrivalDayOffset: 0, durationMin: 158, runsOn: ['Tue'], classes: ['2A', '3A', 'SL'], source: ct('11098') },
      { number: '16346', name: 'Netravati Express', fromCode: 'KT', toCode: 'MAO', departs: '02:26', arrives: '04:35', arrivalDayOffset: 0, durationMin: 129, runsOn: 'daily', classes: ['2A', '3A', '3E', 'SL'], source: ct('16346') },
    ],
    buses: busesGokarnaToGoa('Canacona, Margao, Panaji, Mapusa'),
    flights: [],
    advice: 'The Matsyagandha Express from Gokarna Road at about 6 pm reaches Madgaon at 8 pm and is the simplest option. Early morning private buses also run to Margao.',
  },

  // ----- Hops: North Goa <-> Gokarna -----
  {
    from: 'north-goa',
    to: 'gokarna',
    trains: [
      { number: '12133', name: 'CSMT Mangaluru Junction Superfast Express', fromCode: 'KRMI', toCode: 'KT', departs: '06:30', arrives: '09:28', arrivalDayOffset: 0, durationMin: 178, runsOn: 'daily', classes: ['2A', '3A', 'SL', '2S'], source: ct('12133') },
      { number: '16345', name: 'Netravati Express', fromCode: 'THVM', toCode: 'KT', departs: '20:42', arrives: '00:40', arrivalDayOffset: 1, durationMin: 238, runsOn: 'daily', classes: ['2A', '3A', '3E', 'SL'], source: ct('16345') },
    ],
    buses: busesGoaToGokarna('Mapusa interstate bus stand, Porvorim, Panaji'),
    flights: [],
    advice: 'Take the early Mangaluru Express from Karmali (6:30 am) to Kumta, then a bus or taxi to Gokarna, or take an afternoon private bus from Mapusa or Panaji that goes straight to Gokarna.',
  },
  {
    from: 'gokarna',
    to: 'north-goa',
    trains: [
      { number: '12134', name: 'Mangaluru Junction CSMT Superfast Express', fromCode: 'KT', toCode: 'KRMI', departs: '17:02', arrives: '19:23', arrivalDayOffset: 0, durationMin: 141, runsOn: 'daily', classes: ['2A', '3A', 'SL'], source: ct('12134') },
      { number: '16346', name: 'Netravati Express', fromCode: 'KT', toCode: 'THVM', departs: '02:26', arrives: '05:38', arrivalDayOffset: 0, durationMin: 192, runsOn: 'daily', classes: ['2A', '3A', '3E', 'SL'], source: ct('16346') },
    ],
    buses: busesGokarnaToGoa('Panaji, Mapusa'),
    flights: [],
    advice: 'Take the Mangaluru Express from Kumta at 5 pm to Karmali (7:20 pm), then a taxi to the beaches. Early morning private buses from Gokarna also go to Panaji and Mapusa.',
  },

  // ----- Hops: North Goa <-> Hampi -----
  {
    from: 'north-goa',
    to: 'hampi',
    trains: [
      { number: '18048', name: 'Vasco da Gama Shalimar Amaravati Express', fromCode: 'MAO', toCode: 'HPT', departs: '07:00', arrives: '14:28', arrivalDayOffset: 0, durationMin: 448, runsOn: ['Tue', 'Thu', 'Fri', 'Sun'], classes: ['2A', '3A', 'SL'], source: ct('18048') },
      { number: '17040', name: 'Vasco da Gama Secunderabad Express', fromCode: 'MAO', toCode: 'HPT', departs: '09:10', arrives: '16:40', arrivalDayOffset: 0, durationMin: 450, runsOn: ['Thu', 'Sat'], classes: ['2A', '3A', 'SL'], source: ct('17040') },
      { number: '17022', name: 'Vasco da Gama Hyderabad Express', fromCode: 'MAO', toCode: 'HPT', departs: '09:10', arrives: '16:40', arrivalDayOffset: 0, durationMin: 450, runsOn: ['Fri'], classes: ['2A', '3A', 'SL', '2S'], source: ct('17022') },
      { number: '17321', name: 'Vasco da Gama Jasidih Express', fromCode: 'MAO', toCode: 'HPT', departs: '05:05', arrives: '12:32', arrivalDayOffset: 0, durationMin: 447, runsOn: ['Fri'], classes: ['2A', '3A', '3E', 'SL'], source: ct('17321') },
    ],
    buses: busesGoaToHampi('Mapusa, Panaji'),
    flights: [],
    advice: 'Trains leave from Madgaon (about an hour from North Goa) and cross the scenic Dudhsagar ghat; the Amaravati Express runs 4 days a week. An overnight AC sleeper bus from Mapusa or Panaji is the simpler choice.',
  },
  {
    from: 'hampi',
    to: 'north-goa',
    trains: [
      { number: '18047', name: 'Shalimar Vasco da Gama Amaravati Express', fromCode: 'HPT', toCode: 'MAO', departs: '06:20', arrives: '14:20', arrivalDayOffset: 0, durationMin: 480, runsOn: ['Mon', 'Wed', 'Thu', 'Sat'], classes: ['2A', '3A', 'SL'], source: ct('18047') },
      { number: '17322', name: 'Jasidih Vasco da Gama Express', fromCode: 'HPT', toCode: 'MAO', departs: '05:00', arrives: '13:25', arrivalDayOffset: 0, durationMin: 505, runsOn: ['Wed'], classes: ['2A', '3A', '3E', 'SL'], source: ct('17322') },
      { number: '17021', name: 'Hyderabad Vasco da Gama Express', fromCode: 'HPT', toCode: 'MAO', departs: '19:55', arrives: '04:15', arrivalDayOffset: 1, durationMin: 500, runsOn: ['Thu'], classes: ['2A', '3A', 'SL'], source: ct('17021') },
    ],
    buses: busesHampiToGoa('Panaji, Mapusa'),
    flights: [],
    advice: 'An overnight sleeper bus from Hampi drops you at Panaji or Mapusa in the morning. The Amaravati Express (4 days a week) is a good daytime train to Madgaon; take a taxi north from there.',
  },

  // ----- Hops: South Goa <-> Hampi (same trains, Madgaon is the natural station) -----
  {
    from: 'south-goa',
    to: 'hampi',
    trains: [
      { number: '18048', name: 'Vasco da Gama Shalimar Amaravati Express', fromCode: 'MAO', toCode: 'HPT', departs: '07:00', arrives: '14:28', arrivalDayOffset: 0, durationMin: 448, runsOn: ['Tue', 'Thu', 'Fri', 'Sun'], classes: ['2A', '3A', 'SL'], source: ct('18048') },
      { number: '17040', name: 'Vasco da Gama Secunderabad Express', fromCode: 'MAO', toCode: 'HPT', departs: '09:10', arrives: '16:40', arrivalDayOffset: 0, durationMin: 450, runsOn: ['Thu', 'Sat'], classes: ['2A', '3A', 'SL'], source: ct('17040') },
      { number: '17022', name: 'Vasco da Gama Hyderabad Express', fromCode: 'MAO', toCode: 'HPT', departs: '09:10', arrives: '16:40', arrivalDayOffset: 0, durationMin: 450, runsOn: ['Fri'], classes: ['2A', '3A', 'SL', '2S'], source: ct('17022') },
    ],
    buses: busesGoaToHampi('Margao, Verna'),
    flights: [],
    advice: 'Take a morning train from Madgaon to Hosapete (about 7.5 hours), then an auto to Hampi. On days without a train, take an overnight sleeper bus from Margao.',
  },
  {
    from: 'hampi',
    to: 'south-goa',
    trains: [
      { number: '18047', name: 'Shalimar Vasco da Gama Amaravati Express', fromCode: 'HPT', toCode: 'MAO', departs: '06:20', arrives: '14:20', arrivalDayOffset: 0, durationMin: 480, runsOn: ['Mon', 'Wed', 'Thu', 'Sat'], classes: ['2A', '3A', 'SL'], source: ct('18047') },
      { number: '17322', name: 'Jasidih Vasco da Gama Express', fromCode: 'HPT', toCode: 'MAO', departs: '05:00', arrives: '13:25', arrivalDayOffset: 0, durationMin: 505, runsOn: ['Wed'], classes: ['2A', '3A', '3E', 'SL'], source: ct('17322') },
    ],
    buses: busesHampiToGoa('Margao, Canacona'),
    flights: [],
    advice: 'The Amaravati Express leaves Hosapete at 6:20 am four days a week and reaches Madgaon at about 2:20 pm. Otherwise take an overnight sleeper bus to Margao.',
  },
];

export const DATA: TransportDataset = { hubs: [], access, corridors };
