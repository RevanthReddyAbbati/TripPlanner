// North and Rajasthan transport data: Udaipur, Jaipur, Manali and Rishikesh.
//
// Checked Nov 2026. Timetables change, so always confirm on IRCTC (trains) and redBus or the
// state transport site (buses) before you travel.
//
// Train times, running days and classes were read from each train's erail.in page (the `source`
// URL). Bus operators, departure windows and starting fares were read from ixigo bus route pages
// (or rome2rio where noted); bus fares are typical ranges and move with season and seat type.
// Flight airlines and block times were read from ixigo route pages. Last-mile minutes and costs
// are typical local rates, not quotes.

import type {
  BusService,
  Corridor,
  DestinationAccess,
  FlightOption,
  TrainClass,
  TrainService,
  TransportDataset,
  Weekday,
} from './types';

const erail = (n: string) => `https://erail.in/train-enquiry/${n}`;
const ixBus = (slug: string) => `https://www.ixigo.com/buses/${slug}-sts`;
const ixFly = (slug: string) => `https://ixigo.com/cheap-flights/${slug}`;

function train(
  number: string,
  name: string,
  fromCode: string,
  toCode: string,
  departs: string,
  arrives: string,
  arrivalDayOffset: number,
  durationMin: number,
  runsOn: Weekday[] | 'daily',
  classes: TrainClass[],
): TrainService {
  return { number, name, fromCode, toCode, departs, arrives, arrivalDayOffset, durationMin, runsOn, classes, source: erail(number) };
}

function fly(fromAirport: string, toAirport: string, airlines: string[], durationMin: number, slug: string, nonstop = true): FlightOption {
  return { fromAirport, toAirport, airlines, durationMin, nonstop, source: ixFly(slug) };
}

const EXCEPT_TUE: Weekday[] = ['Mon', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const EXCEPT_MON: Weekday[] = ['Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// ---------------------------------------------------------------------------------------------
// Arrival hubs and last mile
// ---------------------------------------------------------------------------------------------

const access: DestinationAccess[] = [
  {
    destinationId: 'udaipur',
    arrivals: [
      {
        hub: 'Udaipur City railway station',
        kind: 'rail',
        code: 'UDZ',
        lat: 24.5706,
        lon: 73.7069,
        distanceKm: 3,
        options: [
          { how: 'Auto-rickshaw from outside the station to the old city or Lake Pichola area', minutes: 15, costINR: [100, 200], perVehicle: true },
          { how: 'Ola or Uber cab booked from the station forecourt', minutes: 15, costINR: [150, 300], perVehicle: true },
        ],
      },
      {
        hub: 'Udaipur RSRTC central bus stand (Udaipole)',
        kind: 'bus',
        lat: 24.5786,
        lon: 73.7186,
        distanceKm: 2,
        options: [
          { how: 'Auto-rickshaw from the bus stand to the old city', minutes: 10, costINR: [80, 150], perVehicle: true },
        ],
      },
      {
        hub: 'Maharana Pratap Airport (Dabok)',
        kind: 'air',
        code: 'UDR',
        lat: 24.6177,
        lon: 73.8961,
        distanceKm: 22,
        options: [
          { how: 'Prepaid taxi from the counter inside arrivals', minutes: 40, costINR: [600, 900], perVehicle: true },
          { how: 'Ola or Uber cab from the airport pickup zone', minutes: 40, costINR: [500, 800], perVehicle: true },
        ],
      },
    ],
    tips: [
      'Most trains arrive at Udaipur City (UDZ). Agree the auto fare before you sit down, or use an app cab.',
      'Overnight trains from Delhi (Mewar Express, Chetak Express) arrive early morning, so book a hotel that allows early check-in or leaves your bags.',
      'Trains from Ahmedabad leave from Asarva (ASV), not Ahmedabad Junction. Check the station on your ticket.',
    ],
  },
  {
    destinationId: 'jaipur',
    arrivals: [
      {
        hub: 'Jaipur Junction railway station',
        kind: 'rail',
        code: 'JP',
        lat: 26.9196,
        lon: 75.7878,
        distanceKm: 2,
        options: [
          { how: 'Auto-rickshaw from the station to MI Road or the old city (Hawa Mahal is about 5 km)', minutes: 15, costINR: [100, 200], perVehicle: true },
          { how: 'Ola or Uber cab from the station pickup area', minutes: 15, costINR: [120, 250], perVehicle: true },
        ],
      },
      {
        hub: 'Gandhinagar Jaipur railway station',
        kind: 'rail',
        code: 'GADJ',
        lat: 26.8775,
        lon: 75.8053,
        distanceKm: 5,
        options: [
          { how: 'Auto-rickshaw or app cab to the city centre', minutes: 20, costINR: [120, 250], perVehicle: true },
        ],
      },
      {
        hub: 'Sindhi Camp central bus stand',
        kind: 'bus',
        lat: 26.9226,
        lon: 75.7992,
        distanceKm: 1.5,
        options: [
          { how: 'Auto-rickshaw to MI Road or the old city', minutes: 10, costINR: [80, 150], perVehicle: true },
        ],
      },
      {
        hub: 'Jaipur International Airport (Sanganer)',
        kind: 'air',
        code: 'JAI',
        lat: 26.8242,
        lon: 75.8122,
        distanceKm: 11,
        options: [
          { how: 'Prepaid taxi from the arrivals counter', minutes: 30, costINR: [400, 700], perVehicle: true },
          { how: 'Ola or Uber cab from the airport pickup zone', minutes: 30, costINR: [300, 550], perVehicle: true },
        ],
      },
    ],
    tips: [
      'Many Delhi trains stop at both Gandhinagar Jaipur (GADJ) and Jaipur Junction (JP). Get off at JP unless your hotel is in south Jaipur.',
      'Buses from Delhi and Udaipur usually drop at Sindhi Camp, which is close to the station and MI Road.',
      'Jaipur is only 4 to 5 hours from Delhi by train, so a morning Shatabdi or an evening Rajdhani beats flying once you count airport time.',
    ],
  },
  {
    destinationId: 'manali',
    arrivals: [
      {
        hub: 'Manali HRTC bus stand (Mall Road)',
        kind: 'bus',
        lat: 32.2418,
        lon: 77.1886,
        distanceKm: 0.3,
        options: [
          { how: 'Walk to Mall Road hotels', minutes: 5, costINR: [0, 0] },
          { how: 'Taxi from the stand to Old Manali or Vashisht', minutes: 15, costINR: [200, 400], perVehicle: true },
        ],
      },
      {
        hub: 'Kullu-Manali Airport (Bhuntar)',
        kind: 'air',
        code: 'KUU',
        lat: 31.8767,
        lon: 77.1544,
        distanceKm: 50,
        options: [
          { how: 'Taxi from outside the airport to Manali', minutes: 105, costINR: [1500, 2500], perVehicle: true },
          { how: 'HRTC local bus from Bhuntar bus stand (short walk) to Manali', minutes: 150, costINR: [100, 150] },
        ],
      },
      {
        hub: 'Chandigarh railway station (nearest major railhead)',
        kind: 'rail',
        code: 'CDG',
        lat: 30.7024,
        lon: 76.8215,
        distanceKm: 300,
        options: [
          { how: 'Go to ISBT Sector 43 and take an HRTC or private bus to Manali', minutes: 540, costINR: [500, 1700] },
          { how: 'Hire a taxi from Chandigarh to Manali', minutes: 510, costINR: [5500, 8000], perVehicle: true },
        ],
      },
      {
        hub: 'Kalka railway station',
        kind: 'rail',
        code: 'KLK',
        lat: 30.839,
        lon: 76.937,
        distanceKm: 285,
        options: [
          { how: 'Hire a taxi from Kalka to Manali; there is no direct bus from the station', minutes: 510, costINR: [5500, 8000], perVehicle: true },
        ],
      },
      {
        hub: 'Joginder Nagar railway station (narrow-gauge line from Pathankot)',
        kind: 'rail',
        lat: 31.989,
        lon: 76.788,
        distanceKm: 165,
        options: [
          { how: 'Taxi via Mandi to Manali. The slow toy train to Joginder Nagar is a scenic ride, not a practical route', minutes: 240, costINR: [3500, 5000], perVehicle: true },
        ],
      },
    ],
    tips: [
      'There is no railway line near Manali. Most people take an overnight Volvo bus from Delhi (about 12 to 14 hours) and arrive in the morning.',
      'Book the government HRTC Volvo (Himsuta) on the HRTC website or redBus a few days ahead, especially in May, June and December.',
      'If you come by train, Chandigarh is the practical railhead. Kalka and Joginder Nagar are closer on the map but have poor onward links.',
      'Flights to Bhuntar are few, small and often cancelled in bad weather, so keep a bus as backup.',
    ],
  },
  {
    destinationId: 'rishikesh',
    arrivals: [
      {
        hub: 'Yog Nagari Rishikesh railway station',
        kind: 'rail',
        code: 'YNRK',
        lat: 30.0899,
        lon: 78.2512,
        distanceKm: 2.5,
        options: [
          { how: 'Auto or e-rickshaw to Tapovan or Laxman Jhula (about 6 km)', minutes: 20, costINR: [150, 300], perVehicle: true },
          { how: 'Shared auto (vikram) towards Ram Jhula', minutes: 20, costINR: [20, 50] },
        ],
      },
      {
        hub: 'Haridwar Junction railway station',
        kind: 'rail',
        code: 'HW',
        lat: 29.948,
        lon: 78.1606,
        distanceKm: 25,
        options: [
          { how: 'Taxi from the station to Rishikesh', minutes: 50, costINR: [800, 1300], perVehicle: true },
          { how: 'Bus from Haridwar bus stand (opposite the station) to Rishikesh', minutes: 60, costINR: [40, 80] },
        ],
      },
      {
        hub: 'Rishikesh ISBT bus stand (near Natraj Chowk)',
        kind: 'bus',
        lat: 30.0996,
        lon: 78.2891,
        distanceKm: 2,
        options: [
          { how: 'Auto or e-rickshaw to Ram Jhula, Laxman Jhula or Tapovan', minutes: 15, costINR: [100, 250], perVehicle: true },
        ],
      },
      {
        hub: 'Dehradun Jolly Grant Airport',
        kind: 'air',
        code: 'DED',
        lat: 30.1897,
        lon: 78.1803,
        distanceKm: 20,
        options: [
          { how: 'Prepaid taxi from the arrivals counter to Rishikesh', minutes: 40, costINR: [800, 1200], perVehicle: true },
          { how: 'Ola or Uber cab from the airport', minutes: 40, costINR: [700, 1100], perVehicle: true },
        ],
      },
    ],
    tips: [
      'Many fast trains (Shatabdi, Jan Shatabdi) stop at Haridwar, not Rishikesh. Haridwar to Rishikesh is a 45 to 60 minute ride.',
      'The Yoga Express, Doon Express and Hemkunt Express run all the way to Yog Nagari Rishikesh (YNRK).',
      'Jolly Grant Airport is closer to Rishikesh than to Dehradun city, so flying in from far away is easy.',
    ],
  },
];

// ---------------------------------------------------------------------------------------------
// Corridors (one direction each)
// ---------------------------------------------------------------------------------------------

const bus = (b: Omit<BusService, 'source'> & { source: string }): BusService => b;

const corridors: Corridor[] = [
  // ---------------- Delhi <-> Jaipur ----------------
  {
    from: 'Delhi',
    to: 'jaipur',
    trains: [
      train('12015', 'Ajmer Shatabdi Express', 'NDLS', 'JP', '06:10', '10:40', 0, 270, 'daily', ['CC', 'EC']),
      train('12958', 'Swarna Jayanti Rajdhani Express', 'NDLS', 'JP', '19:55', '23:45', 0, 230, 'daily', ['1A', '2A', '3A']),
      train('12986', 'Jaipur Double Decker Express', 'DEE', 'JP', '17:25', '22:00', 0, 275, 'daily', ['CC', 'EC']),
    ],
    buses: [
      bus({ operator: 'RSRTC (Rajasthan Roadways)', type: 'Ordinary, AC and Volvo seater', boarding: 'Kashmere Gate ISBT or Sarai Kale Khan', drop: 'Sindhi Camp bus stand', departs: '02:15–23:40, many daily', durationMin: 330, fareINR: [319, 900], government: true, source: ixBus('delhi-jaipur') }),
      bus({ operator: 'NueGo', type: 'Electric AC seater', boarding: 'Kashmere Gate ISBT or Anand Vihar', drop: 'Sindhi Camp or 200 Feet Bypass', departs: '06:30–23:55', durationMin: 325, fareINR: [450, 900], government: false, source: ixBus('delhi-jaipur') }),
    ],
    flights: [fly('DEL', 'JAI', ['IndiGo', 'Air India', 'Air India Express'], 45, 'new-delhi-jaipur-del-jai')],
    advice: 'Take the Ajmer Shatabdi in the morning or the Rajdhani in the evening; both are under 5 hours and drop you at Jaipur Junction. Flying is not faster once you add airport time.',
  },
  {
    from: 'jaipur',
    to: 'Delhi',
    trains: [
      train('12016', 'Ajmer Shatabdi Express', 'JP', 'NDLS', '17:35', '22:30', 0, 295, 'daily', ['CC', 'EC']),
      train('12985', 'Jaipur Double Decker Express', 'JP', 'DEE', '05:45', '10:25', 0, 280, 'daily', ['CC', 'EC']),
      train('12957', 'Swarna Jayanti Rajdhani Express', 'JP', 'NDLS', '02:50', '07:30', 0, 280, 'daily', ['1A', '2A', '3A']),
    ],
    buses: [
      bus({ operator: 'RSRTC (Rajasthan Roadways)', type: 'Ordinary, AC and Volvo seater', boarding: 'Sindhi Camp bus stand', drop: 'Kashmere Gate ISBT, Sarai Kale Khan or RK Ashram', departs: '00:55–23:59, many daily', durationMin: 345, fareINR: [319, 900], government: true, source: ixBus('jaipur-delhi') }),
      bus({ operator: 'NueGo', type: 'Electric AC seater', boarding: 'Sindhi Camp or 200 Feet Bypass', drop: 'Kashmere Gate ISBT or Anand Vihar', departs: '05:30–23:59', durationMin: 355, fareINR: [450, 900], government: false, source: ixBus('jaipur-delhi') }),
    ],
    flights: [fly('JAI', 'DEL', ['IndiGo', 'Air India', 'Air India Express'], 55, 'jaipur-new-delhi-jai-del')],
    advice: 'The evening Ajmer Shatabdi (17:35) gets you to New Delhi by 22:30. The Double Decker at 05:45 suits an early start.',
  },

  // ---------------- Delhi <-> Udaipur ----------------
  {
    from: 'Delhi',
    to: 'udaipur',
    trains: [
      train('12963', 'Mewar Express', 'NZM', 'UDZ', '18:25', '07:30', 1, 785, 'daily', ['1A', '2A', '3A', 'SL', '3E']),
      train('20473', 'Chetak Express', 'DEE', 'UDZ', '19:40', '07:48', 1, 728, 'daily', ['1A', '2A', '3A', 'SL']),
    ],
    buses: [
      bus({ operator: 'zingbus plus', type: 'AC Semi-Sleeper / Sleeper', boarding: 'Kashmere Gate ISBT or other Delhi points shown at booking', drop: 'Udaipole or Surajpole', departs: '20:45', durationMin: 820, fareINR: [749, 1500], government: false, source: ixBus('delhi-udaipur') }),
      bus({ operator: 'Shrinath Solitaire Premium Class', type: 'AC Sleeper', boarding: 'Delhi points shown at booking', drop: 'Udaipole or Surajpole', departs: '17:30–19:00', durationMin: 735, fareINR: [900, 2500], government: false, source: ixBus('delhi-udaipur') }),
    ],
    flights: [fly('DEL', 'UDR', ['IndiGo', 'Air India', 'Air India Express', 'Akasa Air'], 75, 'new-delhi-udaipur-del-udr')],
    advice: 'The overnight Mewar Express from Hazrat Nizamuddin is the easiest: sleep on the train and wake up in Udaipur. Book 3A or 2A. If short on time, a 75 minute flight is common and well served.',
  },
  {
    from: 'udaipur',
    to: 'Delhi',
    trains: [
      train('12964', 'Mewar Express', 'UDZ', 'NZM', '18:30', '06:50', 1, 740, 'daily', ['1A', '2A', '3A', 'SL', '3E']),
      train('20474', 'Chetak Express', 'UDZ', 'DEE', '17:00', '05:05', 1, 725, 'daily', ['1A', '2A', '3A', 'SL']),
    ],
    buses: [
      bus({ operator: 'RSRTC (Rajasthan Roadways)', type: 'Seater', boarding: 'Udaipur central bus stand', drop: 'Delhi (Kashmere Gate ISBT area)', departs: '16:30', durationMin: 900, fareINR: [785, 1100], government: true, source: ixBus('udaipur-delhi') }),
      bus({ operator: 'Shrinath Solitaire Premium Class', type: 'AC Sleeper', boarding: 'Udaipole or Fatehpura Circle', drop: 'Kashmere Gate ISBT, RK Ashram or Anand Vihar', departs: '20:15–22:00', durationMin: 650, fareINR: [900, 2500], government: false, source: ixBus('udaipur-delhi') }),
    ],
    flights: [fly('UDR', 'DEL', ['IndiGo', 'Air India', 'Air India Express'], 65, 'udaipur-new-delhi-udr-del')],
    advice: 'Take the Mewar Express at 18:30 and reach Hazrat Nizamuddin next morning. Flights take about an hour.',
  },

  // ---------------- Delhi <-> Manali ----------------
  {
    from: 'Delhi',
    to: 'manali',
    trains: [],
    buses: [
      bus({ operator: 'HRTC (Himachal Roadways), incl. Himsuta Volvo', type: 'Volvo AC Semi-Sleeper and ordinary', boarding: 'Kashmere Gate ISBT', drop: 'Manali HRTC bus stand', departs: '06:40–22:45 (Volvos mostly in the evening)', durationMin: 780, fareINR: [895, 1650], government: true, source: ixBus('delhi-manali') }),
      bus({ operator: 'zingbus plus', type: 'Volvo AC Semi-Sleeper', boarding: 'Majnu Ka Tilla, Kashmere Gate or other Delhi points shown at booking', drop: 'Manali private bus parking', departs: '08:00–23:40', durationMin: 720, fareINR: [800, 2000], government: false, source: ixBus('delhi-manali') }),
    ],
    flights: [fly('DEL', 'KUU', ['Alliance Air'], 190, 'new-delhi-kullu-del-kuu', false)],
    advice: 'There is no train to Manali. Take an overnight Volvo bus from Delhi (HRTC Himsuta from Kashmere Gate, or a private Volvo) and arrive in the morning. Flights to Bhuntar are few, currently shown with a stop, and weather-dependent.',
  },
  {
    from: 'manali',
    to: 'Delhi',
    trains: [],
    buses: [
      bus({ operator: 'HRTC (Himachal Roadways), incl. Himsuta Volvo', type: 'Volvo AC Semi-Sleeper and ordinary', boarding: 'Manali HRTC bus stand', drop: 'Kashmere Gate ISBT', departs: '13:30–21:30', durationMin: 828, fareINR: [895, 1650], government: true, source: ixBus('manali-delhi') }),
      bus({ operator: 'IntrCity SmartBus', type: 'AC Semi-Sleeper', boarding: 'Manali (point shown at booking)', drop: 'Kashmere Gate ISBT, Majnu Ka Tilla or other Delhi points', departs: '18:30–20:30', durationMin: 695, fareINR: [800, 1800], government: false, source: ixBus('manali-delhi') }),
      bus({ operator: 'zingbus plus', type: 'Volvo AC Semi-Sleeper', boarding: 'Manali private bus parking', drop: 'Majnu Ka Tilla, Kashmere Gate or other Delhi points', departs: '09:35–22:35', durationMin: 720, fareINR: [800, 2000], government: false, source: ixBus('manali-delhi') }),
    ],
    flights: [fly('KUU', 'DEL', ['Alliance Air'], 190, 'kullu-new-delhi-kuu-del', false)],
    advice: 'No train. Book an evening Volvo from Manali (HRTC or private) to reach Delhi early next morning.',
  },

  // ---------------- Delhi <-> Rishikesh ----------------
  {
    from: 'Delhi',
    to: 'rishikesh',
    trains: [
      train('12017', 'Dehradun Shatabdi Express', 'NDLS', 'HW', '06:45', '11:35', 0, 290, 'daily', ['CC', 'EC']),
      train('12055', 'Dehradun Jan Shatabdi Express', 'NDLS', 'HW', '15:20', '19:27', 0, 247, 'daily', ['CC', '2S']),
      train('19031', 'Yoga Express', 'DLI', 'YNRK', '05:05', '12:25', 0, 440, 'daily', ['1A', '2A', '3A', 'SL', '3E']),
    ],
    buses: [
      bus({ operator: 'UTC (Uttarakhand Transport Corporation)', type: 'Ordinary and AC seater', boarding: 'Kashmere Gate ISBT', drop: 'Rishikesh ISBT', departs: 'Through the day', durationMin: 360, fareINR: [420, 900], government: true, source: ixBus('delhi-rishikesh') }),
      bus({ operator: 'UPSRTC', type: 'Seater', boarding: 'Kashmere Gate ISBT or Anand Vihar', drop: 'Rishikesh ISBT', departs: '04:21–22:58', durationMin: 389, fareINR: [434, 700], government: true, source: ixBus('delhi-rishikesh') }),
      bus({ operator: 'zingbus plus', type: 'AC Seater / Semi-Sleeper', boarding: 'Kashmere Gate, Majnu Ka Tilla or Anand Vihar', drop: 'Rishikesh (Natraj Chowk area)', departs: '02:40–23:50', durationMin: 320, fareINR: [342, 703], government: false, source: ixBus('delhi-rishikesh') }),
    ],
    flights: [fly('DEL', 'DED', ['IndiGo', 'Air India'], 50, 'new-delhi-dehradun-del-ded')],
    advice: 'Take the Dehradun Shatabdi to Haridwar and a taxi or bus for the last 25 km, or the Yoga Express straight to Yog Nagari Rishikesh. Buses from Kashmere Gate take about 6 hours.',
  },
  {
    from: 'rishikesh',
    to: 'Delhi',
    trains: [
      train('12018', 'Dehradun Shatabdi Express', 'HW', 'NDLS', '18:07', '22:50', 0, 283, 'daily', ['CC', 'EC']),
      train('12056', 'Dehradun Jan Shatabdi Express', 'HW', 'NDLS', '06:29', '11:05', 0, 276, 'daily', ['CC', '2S']),
      train('19032', 'Yoga Express', 'YNRK', 'DLI', '14:55', '22:00', 0, 425, 'daily', ['1A', '2A', '3A', 'SL', '3E']),
    ],
    buses: [
      bus({ operator: 'UTC (Uttarakhand Transport Corporation)', type: 'Ordinary and AC seater', boarding: 'Rishikesh ISBT', drop: 'Kashmere Gate ISBT', departs: 'Through the day', durationMin: 360, fareINR: [420, 900], government: true, source: ixBus('rishikesh-delhi') }),
      bus({ operator: 'UPSRTC', type: 'Seater', boarding: 'Rishikesh ISBT', drop: 'Kashmere Gate ISBT or Anand Vihar', departs: '10:59–21:00', durationMin: 400, fareINR: [446, 700], government: true, source: ixBus('rishikesh-delhi') }),
      bus({ operator: 'zingbus plus', type: 'AC Seater / Semi-Sleeper', boarding: 'Rishikesh (Natraj Chowk area)', drop: 'Kashmere Gate, Majnu Ka Tilla or Anand Vihar', departs: '00:00–23:50', durationMin: 310, fareINR: [308, 659], government: false, source: ixBus('rishikesh-delhi') }),
    ],
    flights: [fly('DED', 'DEL', ['IndiGo', 'Air India'], 50, 'dehradun-new-delhi-ded-del')],
    advice: 'Go to Haridwar (45 to 60 minutes) for the evening Dehradun Shatabdi at 18:07, or take the Yoga Express from Yog Nagari Rishikesh at 14:55.',
  },

  // ---------------- Mumbai <-> Udaipur ----------------
  {
    from: 'Mumbai',
    to: 'udaipur',
    trains: [
      train('22901', 'Bandra Terminus Udaipur City Superfast Express', 'BDTS', 'UDZ', '23:25', '14:40', 1, 915, ['Tue', 'Thu', 'Sat'], ['1A', '2A', '3A', 'SL', '3E']),
    ],
    buses: [
      bus({ operator: 'Falcon Bus', type: 'Volvo / Bharat Benz AC Sleeper', boarding: 'Mumbai points shown at booking (Borivali, Andheri, Sion and others)', drop: 'Udaipole or Surajpole', departs: '20:00–21:30', durationMin: 877, fareINR: [2660, 3130], government: false, source: ixBus('mumbai-udaipur') }),
      bus({ operator: 'Shrinath Solitaire Premium Class', type: 'AC Sleeper', boarding: 'Mumbai points shown at booking', drop: 'Udaipole or Surajpole', departs: '16:30–18:00', durationMin: 872, fareINR: [1800, 3000], government: false, source: ixBus('mumbai-udaipur') }),
    ],
    flights: [fly('BOM', 'UDR', ['IndiGo', 'Air India', 'Akasa Air'], 85, 'mumbai-udaipur-bom-udr')],
    advice: 'Flying is the easy choice at under 1.5 hours. The direct train runs only three days a week from Bandra Terminus, so plan around it.',
  },
  {
    from: 'udaipur',
    to: 'Mumbai',
    trains: [
      train('22902', 'Udaipur City Bandra Terminus Superfast Express', 'UDZ', 'BDTS', '20:50', '13:35', 1, 1005, ['Wed', 'Fri', 'Sun'], ['1A', '2A', '3A', 'SL', '3E']),
    ],
    buses: [
      bus({ operator: 'Falcon Bus', type: 'Volvo / Bharat Benz AC Sleeper', boarding: 'Udaipole or Fatehpura Circle', drop: 'Mumbai points (Borivali, Andheri, Bandra East, Sion)', departs: '16:00–18:00', durationMin: 877, fareINR: [2400, 2940], government: false, source: ixBus('udaipur-mumbai') }),
      bus({ operator: 'Paliwal Travels', type: 'AC Sleeper', boarding: 'Udaipur points shown at booking', drop: 'Mumbai points shown at booking', departs: '16:30–18:30', durationMin: 810, fareINR: [1400, 2500], government: false, source: ixBus('udaipur-mumbai') }),
    ],
    flights: [fly('UDR', 'BOM', ['IndiGo', 'Air India', 'Akasa Air'], 70, 'udaipur-mumbai-udr-bom')],
    advice: 'Fly, or take the overnight Bandra Terminus Superfast on Wednesday, Friday or Sunday.',
  },

  // ---------------- Mumbai <-> Jaipur ----------------
  {
    from: 'Mumbai',
    to: 'jaipur',
    trains: [
      train('12955', 'Mumbai Central Jaipur Superfast Express', 'MMCT', 'JP', '19:05', '12:00', 1, 1015, 'daily', ['1A', '2A', '3A', 'SL']),
      train('14702', 'Aravali Express', 'BDTS', 'JP', '21:00', '17:45', 1, 1245, 'daily', ['2A', '3A', 'SL', '3E']),
    ],
    buses: [],
    flights: [fly('BOM', 'JAI', ['IndiGo', 'Air India', 'Air India Express', 'Akasa Air'], 100, 'mumbai-jaipur-bom-jai')],
    advice: 'Many daily non-stop flights take under 2 hours. By train, the daily Jaipur Superfast from Mumbai Central is an overnight run arriving at noon.',
  },
  {
    from: 'jaipur',
    to: 'Mumbai',
    trains: [
      train('12956', 'Jaipur Mumbai Central Superfast Express', 'JP', 'MMCT', '14:00', '06:55', 1, 1015, 'daily', ['1A', '2A', '3A', 'SL']),
      train('14701', 'Aravali Express', 'JP', 'BDTS', '09:25', '06:15', 1, 1250, 'daily', ['2A', '3A', 'SL', '3E']),
    ],
    buses: [],
    flights: [fly('JAI', 'BOM', ['IndiGo', 'Air India', 'Air India Express'], 110, 'jaipur-mumbai-jai-bom')],
    advice: 'Fly, or take the 14:00 Jaipur Mumbai Central Superfast to reach Mumbai next morning.',
  },

  // ---------------- Mumbai <-> Rishikesh ----------------
  {
    from: 'Mumbai',
    to: 'rishikesh',
    trains: [
      train('19019', 'Bandra Terminus Haridwar Express', 'BDTS', 'HW', '00:20', '07:50', 1, 1890, 'daily', ['1A', '2A', '3A', 'SL', '3E']),
      train('12171', 'Lokmanya Tilak Terminus Haridwar AC Express', 'LTT', 'HW', '07:55', '12:35', 1, 1720, ['Mon', 'Thu'], ['1A', '2A', '3A']),
    ],
    buses: [],
    flights: [fly('BOM', 'DED', ['IndiGo'], 135, 'mumbai-dehradun-bom-ded')],
    advice: 'Fly to Dehradun (Jolly Grant), which is only 20 km from Rishikesh. Trains take more than a day and stop at Haridwar. Note that the 19019 leaves at 00:20, just after midnight, so board on the night before the date on your ticket.',
  },
  {
    from: 'rishikesh',
    to: 'Mumbai',
    trains: [
      train('19020', 'Haridwar Bandra Terminus Express', 'HW', 'BDTS', '13:30', '22:30', 1, 1980, 'daily', ['1A', '2A', '3A', 'SL', '3E']),
      train('12172', 'Haridwar Lokmanya Tilak Terminus AC Express', 'HW', 'LTT', '17:20', '21:30', 1, 1690, ['Tue', 'Fri'], ['1A', '2A', '3A']),
    ],
    buses: [],
    flights: [fly('DED', 'BOM', ['IndiGo', 'Air India'], 150, 'dehradun-mumbai-ded-bom')],
    advice: 'Fly from Dehradun Jolly Grant, 40 minutes from Rishikesh. Trains leave from Haridwar and take more than a day.',
  },

  // ---------------- Ahmedabad <-> Udaipur ----------------
  {
    from: 'Ahmedabad',
    to: 'udaipur',
    trains: [
      train('26903', 'Surat Udaipur City Vande Bharat Express', 'ASV', 'UDZ', '09:30', '13:40', 0, 250, EXCEPT_TUE, ['CC', 'EC']),
      train('20988', 'Asarva Udaipur City Superfast Express', 'ASV', 'UDZ', '06:40', '12:10', 0, 330, 'daily', ['2A', '3A', 'CC', 'SL', '2S']),
      train('19316', 'Virbhumi Express', 'ASV', 'UDZ', '14:10', '20:10', 0, 360, 'daily', ['1A', '2A', '3A', 'SL']),
    ],
    buses: [
      bus({ operator: 'GSRTC (Gujarat ST)', type: 'Ordinary and AC seater', boarding: 'Ahmedabad (Gita Mandir) central bus station', drop: 'Udaipur central bus stand', departs: '00:15–23:30', durationMin: 300, fareINR: [262, 600], government: true, source: ixBus('ahmedabad-udaipur') }),
      bus({ operator: 'RSRTC (Rajasthan Roadways)', type: 'Ordinary and AC seater', boarding: 'Ahmedabad (Gita Mandir) central bus station', drop: 'Udaipur central bus stand', departs: '04:30–22:45', durationMin: 300, fareINR: [303, 650], government: true, source: ixBus('ahmedabad-udaipur') }),
      bus({ operator: 'Shrinath Solitaire Premium Class', type: 'AC Seater / Sleeper', boarding: 'Paldi, Gita Mandir or Iskcon Circle', drop: 'Udaipole or Surajpole', departs: '05:30–23:45', durationMin: 291, fareINR: [600, 1200], government: false, source: ixBus('ahmedabad-udaipur') }),
    ],
    flights: [],
    advice: 'Take the Vande Bharat (not on Tuesdays) or the morning Superfast from Asarva station in Ahmedabad, not Ahmedabad Junction. Buses also run all day and take about 5 hours.',
  },
  {
    from: 'udaipur',
    to: 'Ahmedabad',
    trains: [
      train('26904', 'Udaipur City Surat Vande Bharat Express', 'UDZ', 'ASV', '15:35', '19:25', 0, 230, EXCEPT_TUE, ['CC', 'EC']),
      train('20987', 'Udaipur City Asarva Superfast Express', 'UDZ', 'ASV', '16:20', '21:45', 0, 325, 'daily', ['2A', '3A', 'CC', 'SL', '2S']),
      train('19315', 'Virbhumi Express', 'UDZ', 'ASV', '04:30', '10:40', 0, 370, 'daily', ['1A', '2A', '3A', 'SL']),
    ],
    buses: [
      bus({ operator: 'GSRTC (Gujarat ST)', type: 'Ordinary and AC seater', boarding: 'Udaipur central bus stand', drop: 'Ahmedabad (Gita Mandir) central bus station', departs: '05:00–21:30', durationMin: 300, fareINR: [265, 600], government: true, source: ixBus('udaipur-ahmedabad') }),
      bus({ operator: 'RSRTC (Rajasthan Roadways)', type: 'Ordinary and AC seater', boarding: 'Udaipur central bus stand', drop: 'Ahmedabad (Gita Mandir) central bus station', departs: '05:30–23:45', durationMin: 300, fareINR: [311, 650], government: true, source: ixBus('udaipur-ahmedabad') }),
      bus({ operator: 'Shrinath Travel Agency', type: 'AC Seater / Sleeper', boarding: 'Udaipole or Fatehpura Circle', drop: 'Paldi, Gita Mandir or Iskcon Circle', departs: '01:20–23:55', durationMin: 318, fareINR: [600, 1200], government: false, source: ixBus('udaipur-ahmedabad') }),
    ],
    flights: [],
    advice: 'The afternoon Vande Bharat (not on Tuesdays) reaches Asarva in under 4 hours. Asarva is in east Ahmedabad; take an app cab onward.',
  },

  // ---------------- Ahmedabad <-> Jaipur ----------------
  {
    from: 'Ahmedabad',
    to: 'jaipur',
    trains: [
      train('12957', 'Swarna Jayanti Rajdhani Express', 'SBIB', 'JP', '19:20', '02:40', 1, 440, 'daily', ['1A', '2A', '3A']),
      train('12915', 'Ashram Express', 'SBIB', 'JP', '19:45', '04:20', 1, 515, 'daily', ['1A', '2A', '3A', 'SL', '3E']),
      train('14702', 'Aravali Express', 'ADI', 'JP', '04:35', '17:45', 0, 790, 'daily', ['2A', '3A', 'SL', '3E']),
    ],
    buses: [
      bus({ operator: 'RSRTC (Rajasthan Roadways)', type: 'Seater and sleeper', boarding: 'Ahmedabad (Gita Mandir) central bus station', drop: 'Sindhi Camp bus stand', departs: '04:30–17:30', durationMin: 780, fareINR: [774, 1300], government: true, source: ixBus('ahmedabad-jaipur') }),
      bus({ operator: 'Shrinath Solitaire Premium Class', type: 'AC Sleeper', boarding: 'Paldi, Gita Mandir or Iskcon Circle', drop: 'Sindhi Camp or 200 Feet Bypass', departs: '15:30–17:00', durationMin: 667, fareINR: [1200, 2500], government: false, source: ixBus('ahmedabad-jaipur') }),
    ],
    flights: [fly('AMD', 'JAI', ['IndiGo'], 95, 'ahmedabad-jaipur-amd-jai')],
    advice: 'Take the overnight Rajdhani or Ashram Express from Sabarmati (SBIB), a few km north of Ahmedabad Junction. Non-stop IndiGo flights take about 1.5 hours.',
  },
  {
    from: 'jaipur',
    to: 'Ahmedabad',
    trains: [
      train('12958', 'Swarna Jayanti Rajdhani Express', 'JP', 'SBIB', '23:55', '08:05', 1, 490, 'daily', ['1A', '2A', '3A']),
      train('12916', 'Ashram Express', 'JP', 'SBIB', '20:25', '05:45', 1, 560, 'daily', ['1A', '2A', '3A', 'SL', '3E']),
      train('14701', 'Aravali Express', 'JP', 'ADI', '09:25', '21:40', 0, 735, 'daily', ['2A', '3A', 'SL', '3E']),
    ],
    buses: [
      bus({ operator: 'RSRTC (Rajasthan Roadways)', type: 'Seater and sleeper', boarding: 'Sindhi Camp bus stand', drop: 'Ahmedabad (Gita Mandir) central bus station', departs: '03:30–21:30', durationMin: 780, fareINR: [777, 1300], government: true, source: ixBus('jaipur-ahmedabad') }),
      bus({ operator: 'Shrinath Solitaire Premium Class', type: 'AC Sleeper', boarding: 'Sindhi Camp or 200 Feet Bypass', drop: 'Paldi, Gita Mandir or Iskcon Circle', departs: '01:00–23:30', durationMin: 622, fareINR: [1200, 2500], government: false, source: ixBus('jaipur-ahmedabad') }),
    ],
    flights: [fly('JAI', 'AMD', ['IndiGo'], 95, 'jaipur-ahmedabad-jai-amd')],
    advice: 'Take the Ashram Express or Rajdhani overnight to Sabarmati, or fly IndiGo non-stop.',
  },

  // ---------------- Jaipur <-> Udaipur (city and hop share one entry each way) ----------------
  {
    from: 'Jaipur',
    to: 'udaipur',
    trains: [
      train('20993', 'Jaipur Udaipur City Superfast Express', 'JP', 'UDZ', '06:10', '13:30', 0, 440, 'daily', ['2A', '3A', 'CC', 'SL', '2S']),
      train('12992', 'Jaipur Udaipur City Superfast Express', 'JP', 'UDZ', '14:10', '21:48', 0, 458, 'daily', ['2A', '3A', 'CC', '2S', '3E']),
      train('19665', 'Khajuraho Udaipur City Express', 'JP', 'UDZ', '22:50', '06:55', 1, 485, 'daily', ['1A', '2A', '3A', 'SL', '3E']),
    ],
    buses: [
      bus({ operator: 'RSRTC (Rajasthan Roadways)', type: 'Ordinary, AC and Volvo seater', boarding: 'Sindhi Camp bus stand', drop: 'Udaipur central bus stand', departs: '00:20–22:55, many daily', durationMin: 480, fareINR: [474, 1000], government: true, source: ixBus('jaipur-udaipur') }),
      bus({ operator: 'Shrinath Solitaire Premium Class', type: 'AC Seater / Sleeper', boarding: 'Sindhi Camp or 200 Feet Bypass', drop: 'Udaipole or Surajpole', departs: '01:00–23:30', durationMin: 375, fareINR: [700, 1500], government: false, source: ixBus('jaipur-udaipur') }),
    ],
    flights: [],
    advice: 'Take the 06:10 Superfast for a daytime trip or the 22:50 overnight train to wake up in Udaipur. RSRTC buses leave Sindhi Camp all day.',
  },
  {
    from: 'udaipur',
    to: 'Jaipur',
    trains: [
      train('12991', 'Udaipur City Jaipur Superfast Express', 'UDZ', 'JP', '06:00', '13:40', 0, 460, 'daily', ['2A', '3A', 'CC', '2S', '3E']),
      train('20994', 'Udaipur City Jaipur Superfast Express', 'UDZ', 'JP', '15:05', '22:25', 0, 440, 'daily', ['2A', '3A', 'CC', 'SL', '2S']),
      train('19666', 'Udaipur City Khajuraho Express', 'UDZ', 'JP', '21:50', '05:40', 1, 470, 'daily', ['1A', '2A', '3A', 'SL', '3E']),
    ],
    buses: [
      bus({ operator: 'RSRTC (Rajasthan Roadways)', type: 'Ordinary, AC and Volvo seater', boarding: 'Udaipur central bus stand', drop: 'Sindhi Camp bus stand', departs: '05:15–23:00, many daily', durationMin: 480, fareINR: [474, 1000], government: true, source: ixBus('udaipur-jaipur') }),
      bus({ operator: 'Shrinath Solitaire Premium Class', type: 'AC Seater / Sleeper', boarding: 'Udaipole or Fatehpura Circle', drop: 'Sindhi Camp or 200 Feet Bypass', departs: '20:15–22:00', durationMin: 375, fareINR: [700, 1500], government: false, source: ixBus('udaipur-jaipur') }),
    ],
    flights: [],
    advice: 'The 06:00 Superfast reaches Jaipur by lunch; the 21:50 overnight train arrives early morning.',
  },

  // ---------------- Chandigarh <-> Manali ----------------
  {
    from: 'Chandigarh',
    to: 'manali',
    trains: [],
    buses: [
      bus({ operator: 'HRTC (Himachal Roadways)', type: 'Ordinary, AC Himdhara and Volvo', boarding: 'ISBT Sector 43, Chandigarh', drop: 'Manali HRTC bus stand', departs: 'Day and night services; check times on the HRTC site', durationMin: 485, fareINR: [500, 1700], government: true, source: 'https://www.rome2rio.com/s/Isbt-43/Man%C4%81li' }),
    ],
    flights: [],
    advice: 'There is no train to Manali. From Chandigarh take an HRTC bus from ISBT Sector 43 (about 8 hours) or hire a taxi. Volvo buses from Delhi also pass through Chandigarh in the evening.',
  },
  {
    from: 'manali',
    to: 'Chandigarh',
    trains: [],
    buses: [
      bus({ operator: 'HRTC (Himachal Roadways)', type: 'Ordinary and AC Himdhara', boarding: 'Manali HRTC bus stand', drop: 'ISBT Sector 43, Chandigarh', departs: 'About every 2 hours; check times on the HRTC site', durationMin: 480, fareINR: [490, 1000], government: true, source: 'https://www.rome2rio.com/s/Man%C4%81li/Chandigarh' }),
      bus({ operator: 'Maa Chamunda Holidays', type: 'AC Semi-Sleeper', boarding: 'Manali bus stand or private bus parking', drop: 'Chandigarh (point shown at booking)', departs: '18:00', durationMin: 425, fareINR: [900, 1200], government: false, source: ixBus('manali-chandigarh') }),
    ],
    flights: [],
    advice: 'No train. HRTC buses run through the day from Manali bus stand to Chandigarh ISBT 43; allow 7 to 8 hours.',
  },

  // ---------------- Chandigarh <-> Rishikesh ----------------
  {
    from: 'Chandigarh',
    to: 'rishikesh',
    trains: [
      train('14610', 'Hemkunt Express', 'CDG', 'YNRK', '02:05', '08:30', 0, 385, 'daily', ['2A', '3A', 'SL', '3E']),
      train('14632', 'Amritsar Dehradun Express', 'CDG', 'HW', '02:30', '07:25', 0, 295, 'daily', ['3A', 'SL']),
    ],
    buses: [
      bus({ operator: 'HRTC (Himachal Roadways)', type: 'Ordinary seater', boarding: 'ISBT Sector 43, Chandigarh', drop: 'Rishikesh ISBT', departs: 'A few services daily; check HRTC', durationMin: 300, fareINR: [188, 500], government: true, source: ixBus('chandigarh-rishikesh') }),
      bus({ operator: 'BT Travels (Brham Travels)', type: 'AC Seater / Sleeper', boarding: 'ISBT Sector 43 or Zirakpur', drop: 'Rishikesh', departs: '21:30', durationMin: 300, fareINR: [599, 900], government: false, source: ixBus('chandigarh-rishikesh') }),
    ],
    flights: [],
    advice: 'The Hemkunt Express runs daily to Yog Nagari Rishikesh, but it leaves Chandigarh at 02:05. A daytime bus from ISBT Sector 43 (about 5 hours) is more comfortable.',
  },
  {
    from: 'rishikesh',
    to: 'Chandigarh',
    trains: [
      train('14609', 'Hemkunt Express', 'YNRK', 'CDG', '17:20', '22:00', 0, 280, 'daily', ['2A', '3A', 'SL', '3E']),
      train('14631', 'Dehradun Amritsar Express', 'HW', 'CDG', '21:47', '02:26', 1, 279, 'daily', ['3A', 'SL']),
    ],
    buses: [
      bus({ operator: 'City Land Travels', type: 'AC Seater / Sleeper', boarding: 'Rishikesh (point shown at booking)', drop: 'ISBT Sector 43 or Zirakpur', departs: '18:30–21:00', durationMin: 350, fareINR: [829, 1200], government: false, source: ixBus('rishikesh-chandigarh') }),
    ],
    flights: [],
    advice: 'Take the Hemkunt Express at 17:20 from Yog Nagari Rishikesh; it reaches Chandigarh at 22:00.',
  },

  // ---------------- Lucknow <-> Rishikesh ----------------
  {
    from: 'Lucknow',
    to: 'rishikesh',
    trains: [
      train('13009', 'Doon Express', 'LKO', 'YNRK', '20:35', '07:10', 1, 635, 'daily', ['1A', '2A', '3A', 'SL']),
      train('15119', 'Banaras Dehradun Express', 'LKO', 'HW', '16:15', '03:25', 1, 670, 'daily', ['1A', '2A', '3A', 'SL', '3E']),
      train('22545', 'Lucknow Dehradun Vande Bharat Express', 'LJN', 'HW', '05:15', '12:05', 0, 410, EXCEPT_MON, ['CC', 'EC']),
    ],
    buses: [],
    flights: [fly('LKO', 'DED', ['IndiGo'], 75, 'lucknow-dehradun-lko-ded')],
    advice: 'The overnight Doon Express from Lucknow (Charbagh) runs right into Yog Nagari Rishikesh. For a day trip, the Vande Bharat leaves Lucknow Junction (code LJN, next to Charbagh) at 05:15, except Mondays, and reaches Haridwar at noon.',
  },
  {
    from: 'rishikesh',
    to: 'Lucknow',
    trains: [
      train('13010', 'Doon Express', 'YNRK', 'LKO', '20:55', '08:40', 1, 705, 'daily', ['1A', '2A', '3A', 'SL']),
      train('15120', 'Dehradun Banaras Express', 'HW', 'LKO', '20:30', '07:50', 1, 680, 'daily', ['1A', '2A', '3A', 'SL', '3E']),
      train('22546', 'Dehradun Lucknow Vande Bharat Express', 'HW', 'LJN', '15:36', '22:40', 0, 424, EXCEPT_MON, ['CC', 'EC']),
    ],
    buses: [],
    flights: [fly('DED', 'LKO', ['IndiGo'], 65, 'dehradun-lucknow-ded-lko')],
    advice: 'Take the overnight Doon Express from Yog Nagari Rishikesh at 20:55, or the afternoon Vande Bharat from Haridwar (not on Mondays).',
  },

  // ---------------- Kolkata <-> Jaipur ----------------
  {
    from: 'Kolkata',
    to: 'jaipur',
    trains: [
      train('12987', 'Sealdah Ajmer Superfast Express', 'SDAH', 'JP', '22:55', '23:15', 1, 1460, 'daily', ['1A', '2A', '3A', 'SL', '3E']),
      train('12307', 'Howrah Jodhpur Express', 'HWH', 'JP', '23:30', '23:35', 1, 1445, ['Tue', 'Wed', 'Sat', 'Sun'], ['1A', '2A', '3A', 'SL']),
    ],
    buses: [],
    flights: [fly('CCU', 'JAI', ['IndiGo'], 150, 'kolkata-jaipur-ccu-jai')],
    advice: 'Fly IndiGo non-stop in about 2.5 hours. The daily Sealdah Ajmer Superfast takes about 24 hours and reaches Jaipur late at night, so book your hotel for that night.',
  },
  {
    from: 'jaipur',
    to: 'Kolkata',
    trains: [
      train('12988', 'Ajmer Sealdah Superfast Express', 'JP', 'SDAH', '14:25', '15:50', 1, 1525, 'daily', ['1A', '2A', '3A', 'SL']),
    ],
    buses: [],
    flights: [fly('JAI', 'CCU', ['IndiGo'], 130, 'jaipur-kolkata-jai-ccu')],
    advice: 'Fly non-stop, or take the daily Ajmer Sealdah Superfast at 14:25 to reach Sealdah next afternoon.',
  },

  // ---------------- Kolkata <-> Rishikesh ----------------
  {
    from: 'Kolkata',
    to: 'rishikesh',
    trains: [
      train('13009', 'Doon Express', 'HWH', 'YNRK', '20:25', '07:10', 2, 2085, 'daily', ['1A', '2A', '3A', 'SL']),
      train('13037', 'Kumbha Express', 'HWH', 'HW', '13:00', '15:50', 1, 1610, ['Mon', 'Wed', 'Thu', 'Sat', 'Sun'], ['1A', '2A', '3A', 'SL', '3E']),
    ],
    buses: [],
    flights: [],
    advice: 'There is no non-stop flight; fly to Delhi or Dehradun with a change, or take the Kumbha Express to Haridwar (about 27 hours). The daily Doon Express goes all the way to Yog Nagari Rishikesh but takes nearly 35 hours.',
  },
  {
    from: 'rishikesh',
    to: 'Kolkata',
    trains: [
      train('13010', 'Doon Express', 'YNRK', 'HWH', '20:55', '07:00', 2, 2045, 'daily', ['1A', '2A', '3A', 'SL']),
      train('13038', 'Kumbha Express', 'HW', 'HWH', '23:43', '03:15', 2, 1652, ['Mon', 'Tue', 'Thu', 'Fri', 'Sun'], ['1A', '2A', '3A', 'SL', '3E']),
    ],
    buses: [],
    flights: [],
    advice: 'No non-stop flight. The Kumbha Express from Haridwar is the faster train; the Doon Express starts right at Yog Nagari Rishikesh.',
  },

  // ---------------- Hyderabad <-> Jaipur ----------------
  {
    from: 'Hyderabad',
    to: 'jaipur',
    trains: [
      train('12720', 'Hyderabad Jaipur Superfast Express', 'SC', 'JP', '20:55', '05:25', 2, 1950, ['Mon', 'Wed'], ['2A', '3A', 'SL']),
      train('17020', 'Hyderabad Hisar Express', 'SC', 'JP', '15:40', '05:35', 2, 2275, ['Sat'], ['1A', '2A', '3A', 'SL']),
    ],
    buses: [],
    flights: [fly('HYD', 'JAI', ['IndiGo'], 115, 'hyderabad-jaipur-hyd-jai')],
    advice: 'Fly IndiGo non-stop in about 2 hours. Direct trains run only on a few days a week and take more than 32 hours.',
  },
  {
    from: 'jaipur',
    to: 'Hyderabad',
    trains: [
      train('12719', 'Jaipur Hyderabad Superfast Express', 'JP', 'SC', '15:30', '00:09', 2, 1959, ['Wed', 'Fri'], ['2A', '3A', 'SL']),
      train('17019', 'Hisar Hyderabad Express', 'JP', 'SC', '15:20', '06:20', 2, 2340, ['Tue'], ['1A', '2A', '3A', 'SL']),
    ],
    buses: [],
    flights: [fly('JAI', 'HYD', ['IndiGo'], 110, 'jaipur-hyderabad-jai-hyd')],
    advice: 'Fly non-stop. The direct trains run only on set days and arrive after midnight on the second night.',
  },

  // ---------------- Hyderabad <-> Udaipur ----------------
  {
    from: 'Hyderabad',
    to: 'udaipur',
    trains: [],
    buses: [],
    flights: [fly('HYD', 'UDR', ['IndiGo'], 105, 'hyderabad-udaipur-hyd-udr')],
    advice: 'There is no direct train. Fly IndiGo non-stop (about 1 hour 45 minutes), or take a train to Jaipur or Ahmedabad and change.',
  },
  {
    from: 'udaipur',
    to: 'Hyderabad',
    trains: [],
    buses: [],
    flights: [fly('UDR', 'HYD', ['IndiGo'], 95, 'udaipur-hyderabad-udr-hyd')],
    advice: 'No direct train. Fly IndiGo non-stop.',
  },

  // ---------------- Bengaluru <-> Jaipur ----------------
  {
    from: 'Bengaluru',
    to: 'jaipur',
    trains: [
      train('12975', 'Mysuru Jaipur Superfast Express', 'SBC', 'JP', '13:00', '06:45', 2, 2505, ['Thu', 'Sat'], ['1A', '2A', '3A', 'CC', 'SL', '3E']),
    ],
    buses: [],
    flights: [fly('BLR', 'JAI', ['IndiGo', 'Air India Express', 'Akasa Air'], 150, 'bengaluru-jaipur-blr-jai')],
    advice: 'Fly non-stop in about 2.5 hours. The only direct train runs twice a week and takes almost two days.',
  },
  {
    from: 'jaipur',
    to: 'Bengaluru',
    trains: [
      train('12976', 'Jaipur Mysuru Superfast Express', 'JP', 'SBC', '19:35', '12:50', 2, 2475, ['Mon', 'Wed'], ['1A', '2A', '3A', 'CC', 'SL', '3E']),
    ],
    buses: [],
    flights: [fly('JAI', 'BLR', ['IndiGo', 'Akasa Air', 'Air India Express'], 145, 'jaipur-bengaluru-jai-blr')],
    advice: 'Fly non-stop. The direct train runs on Mondays and Wednesdays and takes about 41 hours.',
  },

  // ---------------- Rishikesh <-> Manali (hop) ----------------
  {
    from: 'rishikesh',
    to: 'manali',
    trains: [],
    buses: [
      bus({ operator: 'City Land Travels', type: 'Volvo AC Semi-Sleeper', boarding: 'Rishikesh (Natraj Chowk or bus stand area)', drop: 'Manali private bus parking', departs: '20:30', durationMin: 650, fareINR: [829, 1500], government: false, source: ixBus('rishikesh-manali') }),
      bus({ operator: 'Laxmi Holidays', type: 'Volvo AC Semi-Sleeper', boarding: 'Rishikesh (Natraj Chowk or bus stand area)', drop: 'Manali private bus parking', departs: '21:30', durationMin: 720, fareINR: [699, 1500], government: false, source: ixBus('rishikesh-manali') }),
    ],
    flights: [],
    advice: 'No train. Take an overnight private Volvo from Natraj Chowk in Rishikesh; it reaches Manali next morning.',
  },
  {
    from: 'manali',
    to: 'rishikesh',
    trains: [],
    buses: [
      bus({ operator: 'City Land Travels', type: 'Volvo AC Semi-Sleeper', boarding: 'Manali bus stand or private bus parking', drop: 'Rishikesh (Natraj Chowk)', departs: '19:30', durationMin: 660, fareINR: [1000, 1500], government: false, source: ixBus('manali-rishikesh') }),
      bus({ operator: 'Kohli Tours & Travels', type: 'AC Semi-Sleeper', boarding: 'Manali bus stand or private bus parking', drop: 'Rishikesh (Natraj Chowk)', departs: '20:15', durationMin: 630, fareINR: [1000, 1500], government: false, source: ixBus('manali-rishikesh') }),
    ],
    flights: [],
    advice: 'No train. Overnight private Volvos leave Manali around 19:00 to 20:30 and arrive in Rishikesh early morning.',
  },
];

export const DATA: TransportDataset = { hubs: [], access, corridors };
