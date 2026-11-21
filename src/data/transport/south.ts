import type { BusService, FlightOption, TransportDataset } from './types';

// South India transport data for Coorg, Mysuru, Pondicherry, Munnar, Alleppey and Ooty.
// Checked Nov 2026. Train numbers, names, times, run days and classes were read from the
// erail.in "trains between stations" page given in each `source`. Bus operators, types,
// observed departure times, durations and fares were read from AbhiBus / ixigo route pages
// on the same dates. Flight routes were checked against each airport's Wikipedia page.
// Timetables and fares change: always confirm on IRCTC (trains) and redBus / AbhiBus /
// the state transport website (buses) before you travel.

const AB = 'https://www.abhibus.com/buses/';
const IX = 'https://www.ixigo.com/buses/';
const WIKI = 'https://en.wikipedia.org/wiki/';

const ksrtcKA = 'KSRTC (Karnataka)';
const ksrtcKL = 'KSRTC (Kerala)';

/** Non-stop flight helper. Durations are typical block times. */
const fly = (from: string, to: string, airlines: string[], durationMin: number, page: string): FlightOption => ({
  fromAirport: from,
  toAirport: to,
  airlines,
  durationMin,
  nonstop: true,
  source: WIKI + page,
});

const bus = (b: BusService): BusService => b;

export const DATA: TransportDataset = {
  hubs: [],

  access: [
    {
      destinationId: 'mysuru',
      arrivals: [
        {
          hub: 'Mysuru Junction railway station',
          kind: 'rail',
          code: 'MYS',
          lat: 12.3164,
          lon: 76.646,
          distanceKm: 2,
          options: [
            { how: 'Prepaid auto from the stand outside the main exit to the palace area', minutes: 10, costINR: [60, 120], perVehicle: true },
            { how: 'App cab (Ola / Uber / Rapido) from the station forecourt', minutes: 10, costINR: [100, 200], perVehicle: true },
          ],
        },
        {
          hub: 'Mysuru Suburban (KSRTC) bus stand',
          kind: 'bus',
          lat: 12.3086,
          lon: 76.6566,
          distanceKm: 1.5,
          options: [
            { how: 'Walk to the palace and Sayyaji Rao Road, it is close by', minutes: 15, costINR: [0, 0] },
            { how: 'Auto rickshaw from outside the bus stand', minutes: 7, costINR: [50, 100], perVehicle: true },
          ],
        },
        {
          hub: 'Mysuru Airport (Mandakalli)',
          kind: 'air',
          code: 'MYQ',
          lat: 12.23,
          lon: 76.6558,
          distanceKm: 12,
          options: [
            { how: 'Taxi or app cab from the terminal to the city centre', minutes: 25, costINR: [400, 700], perVehicle: true },
          ],
        },
      ],
      tips: [
        'Bengaluru to Mysuru is one of the busiest short train routes in India: there are many trains a day, so you rarely need to book weeks ahead except on festival weekends.',
        'During Dasara (usually October) trains, buses and hotels fill up fast. Book early if your dates overlap.',
        'The railway station and the suburban bus stand are both close to the palace, so an auto is all you need on arrival.',
      ],
    },
    {
      destinationId: 'coorg',
      arrivals: [
        {
          hub: 'Madikeri KSRTC bus stand',
          kind: 'bus',
          lat: 12.423,
          lon: 75.7398,
          distanceKm: 0.5,
          options: [
            { how: 'Walk into town, or take an auto to your homestay', minutes: 10, costINR: [50, 150], perVehicle: true },
          ],
        },
        {
          hub: 'Mysuru Junction railway station (nearest railhead)',
          kind: 'rail',
          code: 'MYS',
          lat: 12.3164,
          lon: 76.646,
          distanceKm: 120,
          options: [
            { how: 'Auto to Mysuru Suburban bus stand, then a KSRTC bus to Madikeri', minutes: 210, costINR: [250, 550] },
            { how: 'Taxi from Mysuru straight to Madikeri', minutes: 180, costINR: [3000, 4500], perVehicle: true },
          ],
        },
        {
          hub: 'Kannur International Airport',
          kind: 'air',
          code: 'CNN',
          lat: 11.9186,
          lon: 75.5472,
          distanceKm: 90,
          options: [
            { how: 'Pre-booked taxi from the airport over the Western Ghats to Madikeri', minutes: 150, costINR: [3000, 4500], perVehicle: true },
          ],
        },
        {
          hub: 'Mangaluru International Airport',
          kind: 'air',
          code: 'IXE',
          lat: 12.9613,
          lon: 74.8901,
          distanceKm: 140,
          options: [
            { how: 'Taxi from the airport to Madikeri via Sullia', minutes: 210, costINR: [3500, 5000], perVehicle: true },
            { how: 'Taxi or bus to Mangaluru KSRTC bus stand, then a KSRTC bus to Madikeri', minutes: 270, costINR: [300, 700] },
          ],
        },
      ],
      tips: [
        'Coorg has no railway station. The nearest railhead is Mysuru (about 3 hours by road).',
        'From Bengaluru the simplest option is a direct KSRTC bus to Madikeri (about 5.5 hours). Buses also leave Mysuru for Madikeri through the morning.',
        'Many homestays are 10 to 30 km outside Madikeri. Ask your host to arrange a pickup from the bus stand.',
        'Roads are narrow and winding, and the monsoon (June to September) brings very heavy rain and occasional landslides.',
      ],
    },
    {
      destinationId: 'pondicherry',
      arrivals: [
        {
          hub: 'Puducherry railway station',
          kind: 'rail',
          code: 'PDY',
          lat: 11.9271,
          lon: 79.8274,
          distanceKm: 1.5,
          options: [
            { how: 'Auto rickshaw to White Town or the beach road', minutes: 10, costINR: [80, 150], perVehicle: true },
          ],
        },
        {
          hub: 'Puducherry New Bus Stand',
          kind: 'bus',
          lat: 11.9353,
          lon: 79.8125,
          distanceKm: 2,
          options: [
            { how: 'Auto rickshaw to White Town', minutes: 10, costINR: [80, 150], perVehicle: true },
          ],
        },
        {
          hub: 'Villupuram Junction railway station',
          kind: 'rail',
          code: 'VM',
          lat: 11.942,
          lon: 79.4924,
          distanceKm: 38,
          options: [
            { how: 'Auto to Villupuram bus stand, then a frequent government bus to Puducherry', minutes: 75, costINR: [40, 120] },
            { how: 'Taxi from the station to Puducherry', minutes: 50, costINR: [1000, 1500], perVehicle: true },
          ],
        },
        {
          hub: 'Chennai International Airport',
          kind: 'air',
          code: 'MAA',
          lat: 12.9941,
          lon: 80.1709,
          distanceKm: 140,
          options: [
            { how: 'Prepaid or app taxi from the airport via the East Coast Road or GST Road', minutes: 200, costINR: [3000, 4500], perVehicle: true },
          ],
        },
      ],
      tips: [
        'Only a few trains reach Puducherry itself. Villupuram Junction, 38 km away, has many more, and buses to Puducherry leave it all day.',
        'From Chennai, the daily Egmore to Puducherry trains are cheap but unreserved (general seating). Buses are quicker and more comfortable.',
        'Auroville is about 10 km north of town; hire a scooter or an auto for the day.',
      ],
    },
    {
      destinationId: 'munnar',
      arrivals: [
        {
          hub: 'Munnar KSRTC bus stand',
          kind: 'bus',
          lat: 10.0846,
          lon: 77.0619,
          distanceKm: 1,
          options: [
            { how: 'Auto rickshaw or jeep taxi to your hotel', minutes: 10, costINR: [60, 200], perVehicle: true },
          ],
        },
        {
          hub: 'Aluva railway station',
          kind: 'rail',
          code: 'AWY',
          lat: 10.11,
          lon: 76.3497,
          distanceKm: 110,
          options: [
            { how: 'Walk or auto to Aluva KSRTC bus stand, then a KSRTC bus to Munnar via Kothamangalam and Adimali', minutes: 240, costINR: [180, 300] },
            { how: 'Taxi from the station up the ghat road to Munnar', minutes: 210, costINR: [3000, 4000], perVehicle: true },
          ],
        },
        {
          hub: 'Ernakulam Junction railway station',
          kind: 'rail',
          code: 'ERS',
          lat: 9.969,
          lon: 76.2896,
          distanceKm: 125,
          options: [
            { how: 'Auto to Ernakulam KSRTC bus stand (near the station) or Vyttila hub, then a KSRTC bus to Munnar', minutes: 270, costINR: [200, 320] },
            { how: 'Taxi from Ernakulam to Munnar', minutes: 240, costINR: [3200, 4500], perVehicle: true },
          ],
        },
        {
          hub: 'Kottayam railway station',
          kind: 'rail',
          code: 'KTYM',
          lat: 9.58,
          lon: 76.53,
          distanceKm: 140,
          options: [
            { how: 'Taxi from Kottayam to Munnar', minutes: 270, costINR: [3500, 5000], perVehicle: true },
          ],
        },
        {
          hub: 'Cochin International Airport',
          kind: 'air',
          code: 'COK',
          lat: 10.152,
          lon: 76.4019,
          distanceKm: 105,
          options: [
            { how: 'Prepaid taxi from the arrivals hall to Munnar', minutes: 210, costINR: [3000, 4000], perVehicle: true },
            { how: 'Taxi or feeder bus to Aluva or Angamaly, then a KSRTC bus to Munnar', minutes: 270, costINR: [250, 600] },
          ],
        },
      ],
      tips: [
        'Munnar has no railway station. Arrive by train at Aluva or Ernakulam, or fly into Kochi, then go up by bus or taxi.',
        'The last 60 km is a steep, winding ghat road. If you get motion sickness, take a tablet before you leave and sit near the front.',
        'Try to arrive in daylight: mist, rain and wild elephants make night driving on the ghat roads risky.',
      ],
    },
    {
      destinationId: 'alleppey',
      arrivals: [
        {
          hub: 'Alappuzha railway station',
          kind: 'rail',
          code: 'ALLP',
          lat: 9.4925,
          lon: 76.3197,
          distanceKm: 3,
          options: [
            { how: 'Auto rickshaw to the town, boat jetty or Finishing Point houseboat area', minutes: 10, costINR: [80, 150], perVehicle: true },
          ],
        },
        {
          hub: 'Alappuzha KSRTC bus stand',
          kind: 'bus',
          lat: 9.4998,
          lon: 76.3398,
          distanceKm: 0.5,
          options: [
            { how: 'Walk; the public boat jetty is right next to the bus stand', minutes: 5, costINR: [0, 0] },
            { how: 'Auto rickshaw to your homestay or houseboat point', minutes: 10, costINR: [60, 150], perVehicle: true },
          ],
        },
        {
          hub: 'Cochin International Airport',
          kind: 'air',
          code: 'COK',
          lat: 10.152,
          lon: 76.4019,
          distanceKm: 80,
          options: [
            { how: 'Prepaid taxi from the arrivals hall to Alappuzha', minutes: 135, costINR: [2200, 3200], perVehicle: true },
            { how: 'Airport bus or taxi to Vyttila hub, then a KSRTC bus to Alappuzha', minutes: 180, costINR: [150, 600] },
          ],
        },
      ],
      tips: [
        'Houseboats usually check in around noon and check out the next morning. Plan to reach Alappuzha by late morning.',
        'Kochi (Ernakulam) is only about 1 to 1.5 hours away by train or KSRTC bus, so it is easy to combine the two.',
        'The station is about 3 km from the town centre and jetty; take an auto rather than walking with luggage.',
      ],
    },
    {
      destinationId: 'ooty',
      arrivals: [
        {
          hub: 'Udhagamandalam (Ooty) railway station',
          kind: 'rail',
          code: 'UAM',
          lat: 11.4058,
          lon: 76.6966,
          distanceKm: 0.5,
          options: [
            { how: 'Walk or take an auto to your hotel', minutes: 10, costINR: [60, 150], perVehicle: true },
          ],
        },
        {
          hub: 'Ooty central bus stand',
          kind: 'bus',
          lat: 11.4077,
          lon: 76.6977,
          distanceKm: 0.5,
          options: [
            { how: 'Auto rickshaw or taxi from the stand next to the railway station', minutes: 10, costINR: [60, 150], perVehicle: true },
          ],
        },
        {
          hub: 'Mettupalayam railway station (toy train start)',
          kind: 'rail',
          code: 'MTP',
          lat: 11.289,
          lon: 76.944,
          distanceKm: 50,
          options: [
            { how: 'Nilgiri Mountain Railway toy train 56136 from the same station, leaves 07:10 and reaches Ooty around noon (book on IRCTC)', minutes: 285, costINR: [0, 0] },
            { how: 'Government or KSRTC bus from Mettupalayam bus stand up the ghat road', minutes: 120, costINR: [60, 120] },
            { how: 'Taxi from the station to Ooty', minutes: 100, costINR: [1800, 2800], perVehicle: true },
          ],
        },
        {
          hub: 'Coimbatore Junction railway station',
          kind: 'rail',
          code: 'CBE',
          lat: 10.996,
          lon: 76.967,
          distanceKm: 85,
          options: [
            { how: 'Bus from Gandhipuram bus stand to Ooty via Mettupalayam', minutes: 180, costINR: [100, 150] },
            { how: 'Taxi from Coimbatore to Ooty', minutes: 160, costINR: [2500, 3500], perVehicle: true },
          ],
        },
        {
          hub: 'Coimbatore International Airport',
          kind: 'air',
          code: 'CJB',
          lat: 11.03,
          lon: 77.0434,
          distanceKm: 88,
          options: [
            { how: 'Prepaid taxi from the airport to Ooty', minutes: 160, costINR: [2500, 3500], perVehicle: true },
          ],
        },
      ],
      tips: [
        'The toy train (Nilgiri Mountain Railway) runs once a day each way and sells out weeks ahead in season. Book on IRCTC as early as you can.',
        'The overnight Nilagiri Express from Chennai reaches Mettupalayam at 06:20, in time for the 07:10 toy train.',
        'Coming from Mysuru or Bengaluru, the road crosses Bandipur and Mudumalai forests, which close to traffic at night. Travel in daytime.',
        'Ooty is cold at night most of the year; carry a jacket.',
      ],
    },
  ],

  corridors: [
    // ---------------- Bengaluru ----------------
    {
      from: 'Bengaluru',
      to: 'mysuru',
      trains: [
        { number: '12007', name: 'Chennai Central - Mysuru Shatabdi Express', fromCode: 'SBC', toCode: 'MYS', departs: '10:35', arrives: '13:00', arrivalDayOffset: 0, durationMin: 145, runsOn: ['Mon', 'Tue', 'Wed', 'Fri', 'Sat', 'Sun'], classes: ['CC', 'EC'], source: 'https://erail.in/trains-between-stations/ksr-bengaluru-SBC/mysuru-jn-MYS' },
        { number: '20607', name: 'Chennai Central - Mysuru Vande Bharat Express', fromCode: 'SBC', toCode: 'MYS', departs: '10:05', arrives: '12:20', arrivalDayOffset: 0, durationMin: 135, runsOn: ['Mon', 'Tue', 'Thu', 'Fri', 'Sat', 'Sun'], classes: ['CC', 'EC'], source: 'https://erail.in/trains-between-stations/ksr-bengaluru-SBC/mysuru-jn-MYS' },
        { number: '12614', name: 'Wodeyar Express', fromCode: 'SBC', toCode: 'MYS', departs: '15:15', arrives: '17:45', arrivalDayOffset: 0, durationMin: 150, runsOn: 'daily', classes: ['CC', '2S'], source: 'https://erail.in/trains-between-stations/ksr-bengaluru-SBC/mysuru-jn-MYS' },
        { number: '16591', name: 'Hampi Express', fromCode: 'SBC', toCode: 'MYS', departs: '05:55', arrives: '08:55', arrivalDayOffset: 0, durationMin: 180, runsOn: 'daily', classes: ['1A', '2A', '3A', 'CC', 'SL'], source: 'https://erail.in/trains-between-stations/ksr-bengaluru-SBC/mysuru-jn-MYS' },
      ],
      buses: [
        bus({ operator: ksrtcKA, type: 'Airavat Club Class (Volvo AC Multi-Axle Semi-Sleeper)', boarding: 'Mysuru Road Satellite Bus Station or Majestic (Kempegowda Bus Station)', drop: 'Mysuru Suburban (KSRTC) bus stand', departs: 'Very frequent through the day and night', durationMin: 165, fareINR: [520, 550], government: true, source: AB + '332/Bangalore-Mysore' }),
        bus({ operator: ksrtcKL, type: 'Swift Deluxe Non-AC Seater', boarding: 'Mysuru Road Satellite Bus Station', drop: 'Mysuru KSRTC bus station', departs: '08:00-21:30', durationMin: 140, fareINR: [250, 370], government: true, source: AB + '332/Bangalore-Mysore' }),
        bus({ operator: 'IntrCity SmartBus', type: 'AC Seater/Sleeper', boarding: 'Madiwala, Majestic', drop: 'Mysuru ring road (Columbia Asia Hospital)', departs: '22:40-23:00', durationMin: 160, fareINR: [550, 600], government: false, source: AB + '332/Bangalore-Mysore' }),
      ],
      flights: [],
      advice: 'Take a train: the Shatabdi, Vande Bharat or Wodeyar Express reach Mysuru in about 2 to 2.5 hours. If you miss a train, KSRTC buses leave Mysuru Road Satellite Bus Station every few minutes.',
    },
    {
      from: 'mysuru',
      to: 'Bengaluru',
      trains: [
        { number: '20663', name: 'Mysuru - Chennai Vande Bharat Express', fromCode: 'MYS', toCode: 'SBC', departs: '06:00', arrives: '07:40', arrivalDayOffset: 0, durationMin: 100, runsOn: ['Mon', 'Tue', 'Wed', 'Fri', 'Sat', 'Sun'], classes: ['CC', 'EC'], source: 'https://erail.in/trains-between-stations/mysuru-jn-MYS/ksr-bengaluru-SBC' },
        { number: '16215', name: 'Chamundi Express', fromCode: 'MYS', toCode: 'SBC', departs: '06:45', arrives: '09:35', arrivalDayOffset: 0, durationMin: 170, runsOn: 'daily', classes: ['CC', '2S'], source: 'https://erail.in/trains-between-stations/mysuru-jn-MYS/ksr-bengaluru-SBC' },
        { number: '12613', name: 'Wodeyar Express', fromCode: 'MYS', toCode: 'SBC', departs: '11:30', arrives: '14:00', arrivalDayOffset: 0, durationMin: 150, runsOn: 'daily', classes: ['CC', '2S'], source: 'https://erail.in/trains-between-stations/mysuru-jn-MYS/ksr-bengaluru-SBC' },
        { number: '12008', name: 'Mysuru - Chennai Central Shatabdi Express', fromCode: 'MYS', toCode: 'SBC', departs: '14:15', arrives: '16:05', arrivalDayOffset: 0, durationMin: 110, runsOn: ['Mon', 'Tue', 'Wed', 'Fri', 'Sat', 'Sun'], classes: ['CC', 'EC'], source: 'https://erail.in/trains-between-stations/mysuru-jn-MYS/ksr-bengaluru-SBC' },
      ],
      buses: [
        bus({ operator: ksrtcKA, type: 'Airavat Club Class (Volvo AC Multi-Axle Semi-Sleeper)', boarding: 'Mysuru Suburban (KSRTC) bus stand', drop: 'Mysuru Road Satellite Bus Station, Kengeri', departs: 'Very frequent through the day', durationMin: 160, fareINR: [500, 550], government: true, source: AB + '999/Mysore-Bangalore' }),
        bus({ operator: ksrtcKA, type: 'EV Power Plus (AC Electric Seater)', boarding: 'Mysuru Suburban (KSRTC) bus stand', drop: 'Majestic or Mysuru Road Satellite Bus Station', departs: 'Several a day', durationMin: 180, fareINR: [520, 540], government: true, source: AB + '999/Mysore-Bangalore' }),
        bus({ operator: ksrtcKL, type: 'Swift Deluxe Non-AC Seater', boarding: 'Mysuru KSRTC bus station', drop: 'Mysuru Road Satellite Bus Station', departs: '00:45-02:10 (night services)', durationMin: 140, fareINR: [260, 320], government: true, source: AB + '999/Mysore-Bangalore' }),
      ],
      flights: [],
      advice: 'Trains are the easiest way back: there are many a day and the Vande Bharat and Shatabdi take under 2 hours. KSRTC buses from the suburban bus stand run every few minutes too.',
    },
    {
      from: 'Bengaluru',
      to: 'coorg',
      trains: [
        { number: '16591', name: 'Hampi Express', fromCode: 'SBC', toCode: 'MYS', departs: '05:55', arrives: '08:55', arrivalDayOffset: 0, durationMin: 180, runsOn: 'daily', classes: ['1A', '2A', '3A', 'CC', 'SL'], source: 'https://erail.in/trains-between-stations/ksr-bengaluru-SBC/mysuru-jn-MYS' },
        { number: '20607', name: 'Chennai Central - Mysuru Vande Bharat Express', fromCode: 'SBC', toCode: 'MYS', departs: '10:05', arrives: '12:20', arrivalDayOffset: 0, durationMin: 135, runsOn: ['Mon', 'Tue', 'Thu', 'Fri', 'Sat', 'Sun'], classes: ['CC', 'EC'], source: 'https://erail.in/trains-between-stations/ksr-bengaluru-SBC/mysuru-jn-MYS' },
        { number: '12007', name: 'Chennai Central - Mysuru Shatabdi Express', fromCode: 'SBC', toCode: 'MYS', departs: '10:35', arrives: '13:00', arrivalDayOffset: 0, durationMin: 145, runsOn: ['Mon', 'Tue', 'Wed', 'Fri', 'Sat', 'Sun'], classes: ['CC', 'EC'], source: 'https://erail.in/trains-between-stations/ksr-bengaluru-SBC/mysuru-jn-MYS' },
      ],
      buses: [
        bus({ operator: ksrtcKA, type: 'Airavat Club Class (Volvo AC Multi-Axle Semi-Sleeper)', boarding: 'Mysuru Road Satellite Bus Station, Kengeri', drop: 'Madikeri KSRTC bus stand', departs: '07:00-09:00 and more through the day', durationMin: 330, fareINR: [730, 800], government: true, source: AB + '832/Bangalore-Madikeri' }),
        bus({ operator: ksrtcKA, type: 'EV Power Plus (AC Electric Seater)', boarding: 'Majestic, Mysuru Road Satellite Bus Station', drop: 'Madikeri KSRTC bus stand', departs: '05:30-07:15', durationMin: 390, fareINR: [750, 800], government: true, source: AB + '832/Bangalore-Madikeri' }),
        bus({ operator: 'Asian Xpress', type: 'AC Sleeper (2+1)', boarding: 'Tin Factory, KR Puram', drop: 'General Thimmaiah Circle, Madikeri', departs: '21:45-23:00', durationMin: 470, fareINR: [545, 645], government: false, source: AB + '832/Bangalore-Madikeri' }),
      ],
      flights: [],
      advice: 'Coorg has no railway. The simplest way is a direct KSRTC bus from Bengaluru to Madikeri (about 5.5 hours). Or take a morning train to Mysuru and a KSRTC bus from the Mysuru suburban bus stand (about 3 hours more).',
    },
    {
      from: 'coorg',
      to: 'Bengaluru',
      trains: [
        { number: '12613', name: 'Wodeyar Express', fromCode: 'MYS', toCode: 'SBC', departs: '11:30', arrives: '14:00', arrivalDayOffset: 0, durationMin: 150, runsOn: 'daily', classes: ['CC', '2S'], source: 'https://erail.in/trains-between-stations/mysuru-jn-MYS/ksr-bengaluru-SBC' },
        { number: '12008', name: 'Mysuru - Chennai Central Shatabdi Express', fromCode: 'MYS', toCode: 'SBC', departs: '14:15', arrives: '16:05', arrivalDayOffset: 0, durationMin: 110, runsOn: ['Mon', 'Tue', 'Wed', 'Fri', 'Sat', 'Sun'], classes: ['CC', 'EC'], source: 'https://erail.in/trains-between-stations/mysuru-jn-MYS/ksr-bengaluru-SBC' },
        { number: '16592', name: 'Hampi Express', fromCode: 'MYS', toCode: 'SBC', departs: '18:50', arrives: '21:40', arrivalDayOffset: 0, durationMin: 170, runsOn: 'daily', classes: ['1A', '2A', '3A', 'CC', 'SL'], source: 'https://erail.in/trains-between-stations/mysuru-jn-MYS/ksr-bengaluru-SBC' },
      ],
      buses: [
        bus({ operator: ksrtcKA, type: 'Airavat Club Class (Volvo AC Multi-Axle Semi-Sleeper)', boarding: 'Madikeri KSRTC bus stand', drop: 'Mysuru Road Satellite Bus Station', departs: 'Morning, around 09:00', durationMin: 345, fareINR: [880, 950], government: true, source: AB + '10717/Madikeri-Bangalore' }),
        bus({ operator: ksrtcKA, type: 'Ashwamedha Point-to-Point Express (Non-AC Seater)', boarding: 'Madikeri KSRTC bus stand', drop: 'Mysuru Road Satellite Bus Station, Majestic', departs: '06:00-08:45', durationMin: 380, fareINR: [420, 450], government: true, source: AB + '10717/Madikeri-Bangalore' }),
        bus({ operator: 'Poornima Tours', type: 'Non-AC Sleeper (2+1)', boarding: 'Madikeri', drop: 'Mysuru Road Satellite Bus Station, Majestic', departs: '23:00-23:30', durationMin: 360, fareINR: [950, 1100], government: false, source: AB + '10717/Madikeri-Bangalore' }),
      ],
      flights: [],
      advice: 'No direct train. Take a KSRTC bus straight to Bengaluru, or a bus to Mysuru (about 3 hours) and then one of the frequent Mysuru to Bengaluru trains.',
    },
    {
      from: 'Bengaluru',
      to: 'ooty',
      trains: [
        { number: '26651', name: 'KSR Bengaluru - Ernakulam Vande Bharat Express', fromCode: 'SBC', toCode: 'CBE', departs: '05:10', arrives: '10:12', arrivalDayOffset: 0, durationMin: 302, runsOn: ['Mon', 'Tue', 'Thu', 'Fri', 'Sat', 'Sun'], classes: ['CC', 'EC'], source: 'https://erail.in/trains-between-stations/ksr-bengaluru-SBC/coimbatore-jn-CBE' },
        { number: '22665', name: 'KSR Bengaluru - Coimbatore Uday Express', fromCode: 'SBC', toCode: 'CBE', departs: '14:15', arrives: '21:05', arrivalDayOffset: 0, durationMin: 410, runsOn: 'daily', classes: ['CC', '2S'], source: 'https://erail.in/trains-between-stations/ksr-bengaluru-SBC/coimbatore-jn-CBE' },
        { number: '16526', name: 'KSR Bengaluru - Kanniyakumari Island Express', fromCode: 'SBC', toCode: 'CBE', departs: '20:10', arrives: '02:57', arrivalDayOffset: 1, durationMin: 407, runsOn: 'daily', classes: ['1A', '2A', '3A', 'SL', '3E'], source: 'https://erail.in/trains-between-stations/ksr-bengaluru-SBC/coimbatore-jn-CBE' },
      ],
      buses: [
        bus({ operator: ksrtcKA, type: 'Airavat Club Class (Volvo AC Multi-Axle Semi-Sleeper)', boarding: 'Shanthinagar, Mysuru Road Satellite Bus Station', drop: 'Ooty central bus stand', departs: '06:15-12:45', durationMin: 490, fareINR: [880, 920], government: true, source: AB + '1053/Bangalore-Ooty' }),
        bus({ operator: ksrtcKA, type: 'Non-AC Sleeper', boarding: 'Shanthinagar, Mysuru Road Satellite Bus Station', drop: 'Ooty central bus stand', departs: '21:45', durationMin: 660, fareINR: [820, 860], government: true, source: AB + '1053/Bangalore-Ooty' }),
        bus({ operator: 'Mayura Bus', type: 'AC Sleeper (2+1)', boarding: 'Kalasipalya, Anand Rao Circle', drop: 'Ooty', departs: '22:30', durationMin: 480, fareINR: [810, 900], government: false, source: AB + '1053/Bangalore-Ooty' }),
      ],
      flights: [fly('BLR', 'CJB', ['IndiGo', 'Air India Express'], 60, 'Coimbatore_International_Airport')],
      advice: 'No direct train. The easiest option is a daytime KSRTC bus via Mysuru and Bandipur (about 8 hours). By train, go to Coimbatore and then take a bus or taxi up to Ooty (about 3 hours).',
    },
    {
      from: 'ooty',
      to: 'Bengaluru',
      trains: [
        { number: '22666', name: 'Coimbatore - KSR Bengaluru Uday Express', fromCode: 'CBE', toCode: 'SBC', departs: '05:45', arrives: '12:45', arrivalDayOffset: 0, durationMin: 420, runsOn: 'daily', classes: ['CC', '2S'], source: 'https://erail.in/trains-between-stations/coimbatore-jn-CBE/ksr-bengaluru-SBC' },
        { number: '26652', name: 'Ernakulam - KSR Bengaluru Vande Bharat Express', fromCode: 'CBE', toCode: 'SBC', departs: '17:20', arrives: '23:00', arrivalDayOffset: 0, durationMin: 340, runsOn: ['Mon', 'Tue', 'Thu', 'Fri', 'Sat', 'Sun'], classes: ['CC', 'EC'], source: 'https://erail.in/trains-between-stations/coimbatore-jn-CBE/ksr-bengaluru-SBC' },
        { number: '16525', name: 'Kanniyakumari - KSR Bengaluru Island Express', fromCode: 'CBE', toCode: 'SBC', departs: '22:57', arrives: '07:00', arrivalDayOffset: 1, durationMin: 483, runsOn: 'daily', classes: ['1A', '2A', '3A', 'SL', '3E'], source: 'https://erail.in/trains-between-stations/coimbatore-jn-CBE/ksr-bengaluru-SBC' },
      ],
      buses: [
        bus({ operator: ksrtcKA, type: 'Airavat Club Class (Volvo AC Multi-Axle Semi-Sleeper)', boarding: 'Ooty central bus stand', drop: 'Mysuru Road Satellite Bus Station, Kengeri', departs: '07:15-15:35', durationMin: 425, fareINR: [1000, 1070], government: true, source: AB + '551/Ooty-Bangalore' }),
        bus({ operator: ksrtcKA, type: 'Rajahamsa Executive (Non-AC Seater)', boarding: 'Ooty central bus stand', drop: 'Mysuru Road Satellite Bus Station', departs: '14:00', durationMin: 510, fareINR: [880, 920], government: true, source: AB + '551/Ooty-Bangalore' }),
        bus({ operator: 'Mayura Bus', type: 'AC Sleeper (2+1)', boarding: 'Ooty, Charing Cross', drop: 'Hosur, Electronic City side', departs: '20:45', durationMin: 525, fareINR: [1400, 1600], government: false, source: AB + '551/Ooty-Bangalore' }),
      ],
      flights: [fly('CJB', 'BLR', ['IndiGo', 'Air India Express'], 60, 'Coimbatore_International_Airport')],
      advice: 'Take a daytime KSRTC bus via Mysuru (about 7 hours). By train, go down to Coimbatore first; the Uday Express and Vande Bharat run from there to Bengaluru by day.',
    },
    {
      from: 'Bengaluru',
      to: 'pondicherry',
      trains: [
        { number: '11005', name: 'Dadar - Puducherry Express', fromCode: 'SMVB', toCode: 'PDY', departs: '21:20', arrives: '07:15', arrivalDayOffset: 1, durationMin: 595, runsOn: ['Mon', 'Tue', 'Sat'], classes: ['2A', '3A', 'SL'], source: 'https://erail.in/trains-between-stations/ksr-bengaluru-SBC/puducherry-PDY' },
        { number: '16573', name: 'Yesvantpur - Puducherry Express', fromCode: 'YPR', toCode: 'PDY', departs: '20:45', arrives: '07:15', arrivalDayOffset: 1, durationMin: 630, runsOn: ['Fri'], classes: ['1A', '2A', '3A', 'SL'], source: 'https://erail.in/trains-between-stations/ksr-bengaluru-SBC/puducherry-PDY' },
      ],
      buses: [
        bus({ operator: ksrtcKA, type: 'Airavat Club Class (Volvo AC Multi-Axle Semi-Sleeper)', boarding: 'Shanthinagar, Madiwala', drop: 'Puducherry New Bus Stand', departs: '09:30 and 22:35', durationMin: 435, fareINR: [710, 810], government: true, source: AB + '278/Bangalore-Pondicherry' }),
        bus({ operator: ksrtcKA, type: 'AC Sleeper', boarding: 'Shanthinagar, Madiwala', drop: 'Puducherry New Bus Stand', departs: '22:00', durationMin: 450, fareINR: [880, 920], government: true, source: AB + '278/Bangalore-Pondicherry' }),
        bus({ operator: 'Fresh Bus', type: 'Electric AC Seater/Sleeper', boarding: 'Peenya, Yeshwanthpur', drop: 'Puducherry (JIPMER, Indira Gandhi Statue)', departs: '22:40-23:20', durationMin: 390, fareINR: [650, 700], government: false, source: AB + '278/Bangalore-Pondicherry' }),
      ],
      flights: [],
      advice: 'An overnight bus is the easiest choice (about 7 to 8 hours). Direct trains run only a few days a week and leave from SMVT Bengaluru or Yesvantpur, not KSR Bengaluru.',
    },
    {
      from: 'pondicherry',
      to: 'Bengaluru',
      trains: [
        { number: '11006', name: 'Puducherry - Dadar Chalukya Express', fromCode: 'PDY', toCode: 'SMVB', departs: '21:30', arrives: '05:00', arrivalDayOffset: 1, durationMin: 450, runsOn: ['Tue', 'Wed', 'Sun'], classes: ['2A', '3A', 'SL'], source: 'https://erail.in/trains-between-stations/puducherry-PDY/ksr-bengaluru-SBC' },
        { number: '16574', name: 'Puducherry - Yesvantpur Express', fromCode: 'PDY', toCode: 'YPR', departs: '22:25', arrives: '08:25', arrivalDayOffset: 1, durationMin: 600, runsOn: ['Sat'], classes: ['1A', '2A', '3A', 'SL'], source: 'https://erail.in/trains-between-stations/puducherry-PDY/ksr-bengaluru-SBC' },
      ],
      buses: [
        bus({ operator: ksrtcKA, type: 'Airavat Club Class (Volvo AC Multi-Axle Semi-Sleeper)', boarding: 'Puducherry New Bus Stand', drop: 'Electronic City side, Corporation Circle', departs: '10:00 and 22:30', durationMin: 435, fareINR: [830, 950], government: true, source: AB + '708/Pondicherry-Puducherry-Bangalore' }),
        bus({ operator: ksrtcKA, type: 'AC Sleeper', boarding: 'Puducherry New Bus Stand', drop: 'Electronic City side, Corporation Circle', departs: '21:30', durationMin: 450, fareINR: [1040, 1080], government: true, source: AB + '708/Pondicherry-Puducherry-Bangalore' }),
        bus({ operator: 'Fresh Bus', type: 'Electric AC Seater/Sleeper', boarding: 'Thavalakuppam, Puducherry New Bus Stand', drop: 'Attibele, Electronic City', departs: '09:30-10:30', durationMin: 415, fareINR: [820, 890], government: false, source: AB + '708/Pondicherry-Puducherry-Bangalore' }),
      ],
      flights: [],
      advice: 'An overnight KSRTC bus from the New Bus Stand is the simplest. The direct trains run only a few days a week and end at SMVT Bengaluru or Yesvantpur.',
    },
    {
      from: 'Bengaluru',
      to: 'munnar',
      trains: [
        { number: '16526', name: 'KSR Bengaluru - Kanniyakumari Island Express', fromCode: 'SBC', toCode: 'AWY', departs: '20:10', arrives: '06:48', arrivalDayOffset: 1, durationMin: 638, runsOn: 'daily', classes: ['1A', '2A', '3A', 'SL', '3E'], source: 'https://erail.in/trains-between-stations/ksr-bengaluru-SBC/aluva-AWY' },
        { number: '16377', name: 'KSR Bengaluru - Ernakulam Intercity Express', fromCode: 'SBC', toCode: 'AWY', departs: '06:10', arrives: '16:13', arrivalDayOffset: 0, durationMin: 603, runsOn: 'daily', classes: ['CC', '2S'], source: 'https://erail.in/trains-between-stations/ksr-bengaluru-SBC/aluva-AWY' },
        { number: '26651', name: 'KSR Bengaluru - Ernakulam Vande Bharat Express', fromCode: 'SBC', toCode: 'ERS', departs: '05:10', arrives: '13:50', arrivalDayOffset: 0, durationMin: 520, runsOn: ['Mon', 'Tue', 'Thu', 'Fri', 'Sat', 'Sun'], classes: ['CC', 'EC'], source: 'https://erail.in/trains-between-stations/ksr-bengaluru-SBC/ernakulam-jn-ERS' },
      ],
      buses: [
        bus({ operator: ksrtcKL, type: 'Swift Deluxe Non-AC Seater', boarding: 'Mysuru Road Satellite Bus Station', drop: 'Munnar', departs: '16:00', durationMin: 895, fareINR: [900, 950], government: true, source: AB + '527/Bangalore-Munnar' }),
        bus({ operator: 'Royal Travels', type: 'AC Sleeper (2+1)', boarding: 'Indiranagar, Tin Factory, KR Puram', drop: 'Munnar (direct bus)', departs: '21:00', durationMin: 720, fareINR: [1400, 1500], government: false, source: AB + '527/Bangalore-Munnar' }),
        bus({ operator: 'SSVM Travels', type: 'AC Sleeper (2+1)', boarding: 'Majestic, Anand Rao Circle, Indiranagar', drop: 'Munnar', departs: '20:00', durationMin: 705, fareINR: [1200, 1300], government: false, source: AB + '527/Bangalore-Munnar' }),
      ],
      flights: [fly('BLR', 'COK', ['IndiGo', 'Air India Express', 'Akasa Air'], 70, 'Cochin_International_Airport')],
      advice: 'Munnar has no railway. Take the overnight Island Express to Aluva and a KSRTC bus or taxi up to Munnar (3.5 to 4 hours), or take a direct overnight bus. Flying to Kochi saves time but you still have a 3.5 hour drive.',
    },
    {
      from: 'munnar',
      to: 'Bengaluru',
      trains: [
        { number: '16378', name: 'Ernakulam - KSR Bengaluru Intercity Express', fromCode: 'AWY', toCode: 'SBC', departs: '09:27', arrives: '21:00', arrivalDayOffset: 0, durationMin: 693, runsOn: 'daily', classes: ['CC', '2S'], source: 'https://erail.in/trains-between-stations/aluva-AWY/ksr-bengaluru-SBC' },
        { number: '16525', name: 'Kanniyakumari - KSR Bengaluru Island Express', fromCode: 'AWY', toCode: 'SBC', departs: '18:02', arrives: '07:00', arrivalDayOffset: 1, durationMin: 778, runsOn: 'daily', classes: ['1A', '2A', '3A', 'SL', '3E'], source: 'https://erail.in/trains-between-stations/aluva-AWY/ksr-bengaluru-SBC' },
        { number: '26652', name: 'Ernakulam - KSR Bengaluru Vande Bharat Express', fromCode: 'ERS', toCode: 'SBC', departs: '14:20', arrives: '23:00', arrivalDayOffset: 0, durationMin: 520, runsOn: ['Mon', 'Tue', 'Thu', 'Fri', 'Sat', 'Sun'], classes: ['CC', 'EC'], source: 'https://erail.in/trains-between-stations/ernakulam-jn-ERS/ksr-bengaluru-SBC' },
      ],
      buses: [
        bus({ operator: ksrtcKL, type: 'Swift Deluxe Non-AC Seater', boarding: 'Munnar', drop: 'Mandya, Srirangapatna, Bengaluru', departs: '15:30', durationMin: 915, fareINR: [950, 1000], government: true, source: AB + '11924/Munnar-Bangalore' }),
        bus({ operator: ksrtcKA, type: 'Non-AC Sleeper', boarding: 'Munnar bus stand', drop: 'Majestic', departs: '17:00', durationMin: 800, fareINR: [1250, 1350], government: true, source: AB + '11924/Munnar-Bangalore' }),
        bus({ operator: 'Royal Travels', type: 'AC Sleeper (2+1)', boarding: 'Munnar (direct bus)', drop: 'Hosur, Attibele, Bommasandra', departs: '17:45', durationMin: 690, fareINR: [1700, 2200], government: false, source: AB + '11924/Munnar-Bangalore' }),
      ],
      flights: [fly('COK', 'BLR', ['IndiGo', 'Air India Express', 'Akasa Air'], 70, 'Cochin_International_Airport')],
      advice: 'No train from Munnar. Go down to Aluva by bus or taxi in daylight and catch the evening Island Express, or take a direct overnight bus.',
    },
    {
      from: 'Bengaluru',
      to: 'alleppey',
      trains: [
        { number: '16315', name: 'Mysuru - Thiruvananthapuram North Express', fromCode: 'SBC', toCode: 'ALLP', departs: '16:35', arrives: '05:12', arrivalDayOffset: 1, durationMin: 757, runsOn: 'daily', classes: ['2A', '3A', 'CC', 'SL', '3E'], source: 'https://erail.in/trains-between-stations/ksr-bengaluru-SBC/alappuzha-ALLP' },
        { number: '16526', name: 'KSR Bengaluru - Kanniyakumari Island Express', fromCode: 'SBC', toCode: 'ERN', departs: '20:10', arrives: '07:10', arrivalDayOffset: 1, durationMin: 660, runsOn: 'daily', classes: ['1A', '2A', '3A', 'SL', '3E'], source: 'https://erail.in/trains-between-stations/ksr-bengaluru-SBC/ernakulam-jn-ERS' },
      ],
      buses: [
        bus({ operator: ksrtcKL, type: 'Swift Garuda AC Seater', boarding: 'Mysuru Road Satellite Bus Station, Shanthinagar, Madiwala', drop: 'Alappuzha', departs: '18:15', durationMin: 735, fareINR: [1000, 1100], government: true, source: AB + '3689/Bangalore-Alappuzha' }),
        bus({ operator: 'Oneness Tours and Travels', type: 'AC Sleeper (2+1)', boarding: 'Mysuru Road Satellite Bus Station, Kalasipalya', drop: 'YMCA Junction, Kommady (Alappuzha)', departs: '21:30-22:30', durationMin: 630, fareINR: [1200, 1300], government: false, source: AB + '3689/Bangalore-Alappuzha' }),
        bus({ operator: 'Kerala Lines', type: 'AC Sleeper (2+1)', boarding: 'Madiwala, Silk Board, Electronic City', drop: 'Kommady, Alappuzha', departs: '20:15', durationMin: 645, fareINR: [1150, 1250], government: false, source: AB + '3689/Bangalore-Alappuzha' }),
      ],
      flights: [fly('BLR', 'COK', ['IndiGo', 'Air India Express', 'Akasa Air'], 70, 'Cochin_International_Airport')],
      advice: 'Take the daily 16315 Mysuru to Thiruvananthapuram North Express, which reaches Alappuzha early next morning, or the Island Express to Ernakulam and a 1 to 1.5 hour train or bus on to Alappuzha.',
    },
    {
      from: 'alleppey',
      to: 'Bengaluru',
      trains: [
        { number: '16316', name: 'Thiruvananthapuram North - Mysuru Express', fromCode: 'ALLP', toCode: 'SBC', departs: '19:15', arrives: '08:20', arrivalDayOffset: 1, durationMin: 785, runsOn: 'daily', classes: ['2A', '3A', 'SL', '3E'], source: 'https://erail.in/trains-between-stations/alappuzha-ALLP/ksr-bengaluru-SBC' },
        { number: '16525', name: 'Kanniyakumari - KSR Bengaluru Island Express', fromCode: 'ERN', toCode: 'SBC', departs: '17:40', arrives: '07:00', arrivalDayOffset: 1, durationMin: 800, runsOn: 'daily', classes: ['1A', '2A', '3A', 'SL', '3E'], source: 'https://erail.in/trains-between-stations/ernakulam-jn-ERS/ksr-bengaluru-SBC' },
      ],
      buses: [
        bus({ operator: ksrtcKL, type: 'Swift Garuda AC Seater', boarding: 'Alappuzha KSRTC bus stand', drop: 'Hosur, Attibele, Bommasandra', departs: '18:05', durationMin: 770, fareINR: [1250, 1350], government: true, source: AB + '2712/Alappuzha-Bangalore' }),
        bus({ operator: ksrtcKA, type: 'Airavat Club Class (Volvo AC Multi-Axle Semi-Sleeper)', boarding: 'Alappuzha KSRTC bus stand', drop: 'Shanthinagar, Majestic', departs: '20:00', durationMin: 650, fareINR: [1450, 1550], government: true, source: AB + '2712/Alappuzha-Bangalore' }),
        bus({ operator: 'Oneness Tours and Travels', type: 'AC Sleeper (2+1)', boarding: 'YMCA Junction, Kommady', drop: 'Hosur, Attibele, Bommasandra', departs: '18:00-20:30', durationMin: 680, fareINR: [1800, 2000], government: false, source: AB + '2712/Alappuzha-Bangalore' }),
      ],
      flights: [fly('COK', 'BLR', ['IndiGo', 'Air India Express', 'Akasa Air'], 70, 'Cochin_International_Airport')],
      advice: 'The daily 16316 express leaves Alappuzha in the evening and reaches KSR Bengaluru next morning. Book a few weeks ahead.',
    },

    // ---------------- Chennai ----------------
    {
      from: 'Chennai',
      to: 'pondicherry',
      trains: [
        { number: '16115', name: 'Chennai Egmore - Puducherry Express', fromCode: 'MS', toCode: 'PDY', departs: '18:10', arrives: '22:15', arrivalDayOffset: 0, durationMin: 245, runsOn: 'daily', classes: ['2S'], source: 'https://erail.in/trains-between-stations/mgr-chennai-central-MAS/puducherry-PDY' },
        { number: '66051', name: 'Chennai Egmore - Puducherry MEMU', fromCode: 'MS', toCode: 'PDY', departs: '06:35', arrives: '10:40', arrivalDayOffset: 0, durationMin: 245, runsOn: 'daily', classes: ['2S'], source: 'https://erail.in/trains-between-stations/mgr-chennai-central-MAS/puducherry-PDY' },
        { number: '17653', name: 'Kacheguda - Puducherry Express', fromCode: 'MS', toCode: 'PDY', departs: '07:15', arrives: '11:05', arrivalDayOffset: 0, durationMin: 230, runsOn: ['Mon', 'Thu', 'Sat'], classes: ['2A', '3A', 'SL'], source: 'https://erail.in/trains-between-stations/mgr-chennai-central-MAS/puducherry-PDY' },
      ],
      buses: [
        bus({ operator: 'Fresh Bus', type: 'Electric AC Seater', boarding: 'Koyambedu, Vadapalani, Ashok Nagar', drop: 'Kalapet, Auroville, Puducherry', departs: '05:20-15:30', durationMin: 190, fareINR: [340, 430], government: false, source: AB + '335/Chennai-Pondicherry' }),
        bus({ operator: 'IntrCity SmartBus', type: 'AC Seater/Sleeper', boarding: 'Koyambedu, Vadapalani, Guindy', drop: 'Indira Gandhi Statue, Puducherry', departs: '23:40', durationMin: 130, fareINR: [320, 350], government: false, source: AB + '335/Chennai-Pondicherry' }),
      ],
      flights: [],
      advice: 'Buses along the coast are the most comfortable (about 3 to 3.5 hours). The daily trains from Chennai Egmore are cheap but are unreserved, so expect crowds.',
    },
    {
      from: 'pondicherry',
      to: 'Chennai',
      trains: [
        { number: '16116', name: 'Puducherry - Chennai Egmore Express', fromCode: 'PDY', toCode: 'MS', departs: '05:35', arrives: '09:30', arrivalDayOffset: 0, durationMin: 235, runsOn: 'daily', classes: ['2S'], source: 'https://erail.in/trains-between-stations/puducherry-PDY/mgr-chennai-central-MAS' },
        { number: '17656', name: 'Puducherry - Kakinada Port (Circar) Express', fromCode: 'PDY', toCode: 'MS', departs: '13:30', arrives: '16:55', arrivalDayOffset: 0, durationMin: 205, runsOn: ['Mon', 'Thu', 'Sat'], classes: ['2A', '3A', 'SL'], source: 'https://erail.in/trains-between-stations/puducherry-PDY/mgr-chennai-central-MAS' },
        { number: '17654', name: 'Puducherry - Kacheguda Express', fromCode: 'PDY', toCode: 'MS', departs: '12:45', arrives: '16:30', arrivalDayOffset: 0, durationMin: 225, runsOn: ['Tue', 'Fri', 'Sun'], classes: ['2A', '3A', 'SL'], source: 'https://erail.in/trains-between-stations/puducherry-PDY/mgr-chennai-central-MAS' },
      ],
      buses: [
        bus({ operator: 'Fresh Bus', type: 'Electric AC Seater', boarding: 'Thavalakuppam, Ariyankuppam', drop: 'Mahabalipuram, Kovalam and on into Chennai along the East Coast Road', departs: '06:20-20:30', durationMin: 205, fareINR: [380, 480], government: false, source: AB + '716/Pondicherry-Puducherry-Chennai' }),
        bus({ operator: 'IntrCity SmartBus', type: 'AC Seater/Sleeper', boarding: 'Marapalam, Indira Gandhi Statue', drop: 'Mahabalipuram, Thiruporur and on into Chennai', departs: '01:45', durationMin: 175, fareINR: [500, 550], government: false, source: AB + '716/Pondicherry-Puducherry-Chennai' }),
      ],
      flights: [],
      advice: 'Take the early morning Puducherry to Egmore train or a bus along the East Coast Road. Allow extra time if you are going to Chennai airport.',
    },
    {
      from: 'Chennai',
      to: 'ooty',
      trains: [
        { number: '12671', name: 'Nilagiri Express', fromCode: 'MAS', toCode: 'MTP', departs: '21:05', arrives: '06:20', arrivalDayOffset: 1, durationMin: 555, runsOn: 'daily', classes: ['1A', '2A', '3A', 'SL', '3E'], source: 'https://erail.in/trains-between-stations/mgr-chennai-central-MAS/mettupalayam-MTP' },
        { number: '56136', name: 'Nilgiri Mountain Railway (Mettupalayam - Ooty)', fromCode: 'MTP', toCode: 'UAM', departs: '07:10', arrives: '11:55', arrivalDayOffset: 0, durationMin: 285, runsOn: 'daily', classes: ['2S'], source: 'https://erail.in/trains-between-stations/mettupalayam-MTP/udagamandalam-UAM' },
        { number: '12243', name: 'Chennai Central - Coimbatore Shatabdi Express', fromCode: 'MAS', toCode: 'CBE', departs: '07:15', arrives: '14:15', arrivalDayOffset: 0, durationMin: 420, runsOn: ['Mon', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], classes: ['CC', 'EC'], source: 'https://erail.in/trains-between-stations/mgr-chennai-central-MAS/coimbatore-jn-CBE' },
      ],
      buses: [
        bus({ operator: 'Sri Bhagyalakshmi Travels', type: 'AC Sleeper (2+1)', boarding: 'Poonamallee, Maduravoyal', drop: 'Wellington, Aruvankadu, Ooty', departs: '19:45-21:15', durationMin: 660, fareINR: [800, 900], government: false, source: AB + '341/Chennai-Ooty' }),
        bus({ operator: 'SBM Transport', type: 'AC Sleeper (2+1)', boarding: 'Koyambedu, Porur, Vandalur', drop: 'Ooty main bus stand', departs: '21:30', durationMin: 685, fareINR: [1050, 1150], government: false, source: AB + '341/Chennai-Ooty' }),
        bus({ operator: 'National Travels', type: 'AC Sleeper (2+1)', boarding: 'Koyambedu, Maduravoyal, Porur', drop: 'Wellington, Aruvankadu', departs: '21:05', durationMin: 655, fareINR: [950, 1050], government: false, source: AB + '341/Chennai-Ooty' }),
      ],
      flights: [fly('MAA', 'CJB', ['IndiGo'], 70, 'Coimbatore_International_Airport')],
      advice: 'Take the overnight Nilagiri Express (12671) to Mettupalayam, then the 07:10 toy train (56136) up to Ooty. Book both on IRCTC early; if the toy train is full, take a bus or taxi from Mettupalayam.',
    },
    {
      from: 'ooty',
      to: 'Chennai',
      trains: [
        { number: '56137', name: 'Nilgiri Mountain Railway (Ooty - Mettupalayam)', fromCode: 'UAM', toCode: 'MTP', departs: '14:00', arrives: '17:30', arrivalDayOffset: 0, durationMin: 210, runsOn: 'daily', classes: ['2S'], source: 'https://erail.in/trains-between-stations/udagamandalam-UAM/mettupalayam-MTP' },
        { number: '12672', name: 'Nilagiri Express', fromCode: 'MTP', toCode: 'MAS', departs: '21:20', arrives: '06:25', arrivalDayOffset: 1, durationMin: 545, runsOn: 'daily', classes: ['1A', '2A', '3A', 'SL', '3E'], source: 'https://erail.in/trains-between-stations/mettupalayam-MTP/mgr-chennai-central-MAS' },
        { number: '12244', name: 'Coimbatore - Chennai Central Shatabdi Express', fromCode: 'CBE', toCode: 'MAS', departs: '15:05', arrives: '21:50', arrivalDayOffset: 0, durationMin: 405, runsOn: ['Mon', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], classes: ['CC', 'EC'], source: 'https://erail.in/trains-between-stations/coimbatore-jn-CBE/mgr-chennai-central-MAS' },
      ],
      buses: [
        bus({ operator: 'Sri Bhagyalakshmi Travels', type: 'AC Sleeper (2+1)', boarding: 'Sarkar Palace Hotel parking (Ooty), Lovedale', drop: 'Koyambedu', departs: '18:15-20:15', durationMin: 650, fareINR: [1250, 1550], government: false, source: AB + '556/Ooty-Chennai' }),
        bus({ operator: 'KBS Luxury Bus', type: 'AC Seater/Sleeper (2+1)', boarding: 'Ooty Omni Bus Stand', drop: 'Sriperumbudur, Poonamallee', departs: '20:10', durationMin: 635, fareINR: [1350, 1450], government: false, source: AB + '556/Ooty-Chennai' }),
        bus({ operator: 'National Travels', type: 'AC Sleeper (2+1)', boarding: 'Hotel Sarkar Palace complex, Lovedale Junction', drop: 'Chengalpattu side of Chennai', departs: '19:25', durationMin: 670, fareINR: [1500, 1550], government: false, source: AB + '556/Ooty-Chennai' }),
      ],
      flights: [fly('CJB', 'MAA', ['IndiGo'], 70, 'Coimbatore_International_Airport')],
      advice: 'Take the 14:00 toy train (56137) down to Mettupalayam, then the 21:20 Nilagiri Express (12672) to Chennai Central, arriving early next morning.',
    },
    {
      from: 'Chennai',
      to: 'mysuru',
      trains: [
        { number: '20607', name: 'Chennai Central - Mysuru Vande Bharat Express', fromCode: 'MAS', toCode: 'MYS', departs: '05:50', arrives: '12:20', arrivalDayOffset: 0, durationMin: 390, runsOn: ['Mon', 'Tue', 'Thu', 'Fri', 'Sat', 'Sun'], classes: ['CC', 'EC'], source: 'https://erail.in/trains-between-stations/mgr-chennai-central-MAS/mysuru-jn-MYS' },
        { number: '12007', name: 'Chennai Central - Mysuru Shatabdi Express', fromCode: 'MAS', toCode: 'MYS', departs: '06:00', arrives: '13:00', arrivalDayOffset: 0, durationMin: 420, runsOn: ['Mon', 'Tue', 'Wed', 'Fri', 'Sat', 'Sun'], classes: ['CC', 'EC'], source: 'https://erail.in/trains-between-stations/mgr-chennai-central-MAS/mysuru-jn-MYS' },
        { number: '16021', name: 'Kaveri Express', fromCode: 'MAS', toCode: 'MYS', departs: '21:15', arrives: '06:40', arrivalDayOffset: 1, durationMin: 565, runsOn: 'daily', classes: ['1A', '2A', '3A', 'SL'], source: 'https://erail.in/trains-between-stations/mgr-chennai-central-MAS/mysuru-jn-MYS' },
        { number: '20664', name: 'Chennai Central - Mysuru Vande Bharat Express', fromCode: 'MAS', toCode: 'MYS', departs: '17:00', arrives: '23:30', arrivalDayOffset: 0, durationMin: 390, runsOn: ['Mon', 'Tue', 'Wed', 'Fri', 'Sat', 'Sun'], classes: ['CC', 'EC'], source: 'https://erail.in/trains-between-stations/mgr-chennai-central-MAS/mysuru-jn-MYS' },
      ],
      buses: [
        bus({ operator: ksrtcKA, type: 'Airavat Club Class (Volvo AC Multi-Axle Semi-Sleeper)', boarding: 'Koyambedu, Poonamallee', drop: 'Mysuru Suburban (KSRTC) bus stand', departs: '19:45-21:00', durationMin: 630, fareINR: [1340, 1470], government: true, source: AB + '333/Chennai-Mysore' }),
        bus({ operator: ksrtcKA, type: 'Ambaari Dream Class (Volvo AC Multi-Axle Sleeper)', boarding: 'Koyambedu, Poonamallee', drop: 'Mysuru Suburban (KSRTC) bus stand', departs: '22:00', durationMin: 555, fareINR: [1680, 1720], government: true, source: AB + '333/Chennai-Mysore' }),
        bus({ operator: 'IntrCity SmartBus', type: 'AC Seater/Sleeper', boarding: 'Sholinganallur, Thoraipakkam', drop: 'Mysuru Suburban bus stand area', departs: '23:25-23:55', durationMin: 550, fareINR: [1200, 1250], government: false, source: AB + '333/Chennai-Mysore' }),
      ],
      flights: [fly('MAA', 'MYQ', ['IndiGo'], 75, 'Mysore_Airport')],
      advice: 'The Vande Bharat or Shatabdi from Chennai Central reach Mysuru in about 6.5 to 7 hours by day. The overnight Kaveri Express is a good budget choice.',
    },
    {
      from: 'mysuru',
      to: 'Chennai',
      trains: [
        { number: '20663', name: 'Mysuru - Chennai Central Vande Bharat Express', fromCode: 'MYS', toCode: 'MAS', departs: '06:00', arrives: '12:30', arrivalDayOffset: 0, durationMin: 390, runsOn: ['Mon', 'Tue', 'Wed', 'Fri', 'Sat', 'Sun'], classes: ['CC', 'EC'], source: 'https://erail.in/trains-between-stations/mysuru-jn-MYS/mgr-chennai-central-MAS' },
        { number: '20608', name: 'Mysuru - Chennai Central Vande Bharat Express', fromCode: 'MYS', toCode: 'MAS', departs: '13:05', arrives: '19:20', arrivalDayOffset: 0, durationMin: 375, runsOn: ['Mon', 'Tue', 'Thu', 'Fri', 'Sat', 'Sun'], classes: ['CC', 'EC'], source: 'https://erail.in/trains-between-stations/mysuru-jn-MYS/mgr-chennai-central-MAS' },
        { number: '12008', name: 'Mysuru - Chennai Central Shatabdi Express', fromCode: 'MYS', toCode: 'MAS', departs: '14:15', arrives: '21:25', arrivalDayOffset: 0, durationMin: 430, runsOn: ['Mon', 'Tue', 'Wed', 'Fri', 'Sat', 'Sun'], classes: ['CC', 'EC'], source: 'https://erail.in/trains-between-stations/mysuru-jn-MYS/mgr-chennai-central-MAS' },
        { number: '16022', name: 'Kaveri Express', fromCode: 'MYS', toCode: 'MAS', departs: '21:00', arrives: '06:45', arrivalDayOffset: 1, durationMin: 585, runsOn: 'daily', classes: ['1A', '2A', '3A', 'SL'], source: 'https://erail.in/trains-between-stations/mysuru-jn-MYS/mgr-chennai-central-MAS' },
      ],
      buses: [
        bus({ operator: ksrtcKA, type: 'Airavat Club Class (Volvo AC Multi-Axle Semi-Sleeper)', boarding: 'Mysuru Suburban (KSRTC) bus stand', drop: 'Koyambedu', departs: '18:40-19:30', durationMin: 650, fareINR: [1340, 1470], government: true, source: AB + '7878/Mysore-Chennai' }),
        bus({ operator: ksrtcKA, type: 'Ambaari Dream Class (Volvo AC Multi-Axle Sleeper)', boarding: 'Mysuru Suburban (KSRTC) bus stand', drop: 'Koyambedu', departs: '20:30', durationMin: 540, fareINR: [1680, 1720], government: true, source: AB + '7878/Mysore-Chennai' }),
        bus({ operator: 'IntrCity SmartBus', type: 'AC Seater/Sleeper', boarding: 'Bogadi, Hinkal, Infosys', drop: 'Sriperumbudur, Maduravoyal', departs: '18:55-19:35', durationMin: 600, fareINR: [1070, 1150], government: false, source: AB + '7878/Mysore-Chennai' }),
      ],
      flights: [fly('MYQ', 'MAA', ['IndiGo'], 75, 'Mysore_Airport')],
      advice: 'Take the Vande Bharat or Shatabdi by day, or the overnight Kaveri Express which reaches Chennai Central early morning.',
    },
    {
      from: 'Chennai',
      to: 'alleppey',
      trains: [
        { number: '22639', name: 'Chennai Central - Alappuzha Express', fromCode: 'MAS', toCode: 'ALLP', departs: '20:55', arrives: '10:40', arrivalDayOffset: 1, durationMin: 825, runsOn: 'daily', classes: ['1A', '2A', '3A', 'SL'], source: 'https://erail.in/trains-between-stations/mgr-chennai-central-MAS/alappuzha-ALLP' },
        { number: '13351', name: 'Dhanbad - Alappuzha Express', fromCode: 'MAS', toCode: 'ALLP', departs: '23:45', arrives: '15:15', arrivalDayOffset: 1, durationMin: 930, runsOn: 'daily', classes: ['1A', '2A', '3A', 'SL'], source: 'https://erail.in/trains-between-stations/mgr-chennai-central-MAS/alappuzha-ALLP' },
      ],
      buses: [
        bus({ operator: 'Kallada Travels', type: 'AC Sleeper (2+1)', boarding: 'Koyambedu, Maduravoyal, Porur', drop: 'Alappuzha', departs: '20:00', durationMin: 815, fareINR: [1400, 1500], government: false, source: AB + '1998/Chennai-Alappuzha' }),
        bus({ operator: 'Oneness Tours and Travels', type: 'AC Sleeper (2+1)', boarding: 'Koyambedu, Maduravoyal, Porur', drop: 'Kommady, YMCA Junction (Alappuzha)', departs: '19:15', durationMin: 780, fareINR: [1450, 1550], government: false, source: AB + '1998/Chennai-Alappuzha' }),
      ],
      flights: [fly('MAA', 'COK', ['IndiGo', 'Air India Express'], 75, 'Chennai_International_Airport')],
      advice: 'The daily overnight 22639 Alleppey Express from Chennai Central is the best option; it reaches Alappuzha mid-morning.',
    },
    {
      from: 'alleppey',
      to: 'Chennai',
      trains: [
        { number: '22640', name: 'Alappuzha - Chennai Central Express', fromCode: 'ALLP', toCode: 'MAS', departs: '15:20', arrives: '05:15', arrivalDayOffset: 1, durationMin: 835, runsOn: 'daily', classes: ['1A', '2A', '3A', 'SL'], source: 'https://erail.in/trains-between-stations/alappuzha-ALLP/mgr-chennai-central-MAS' },
        { number: '13352', name: 'Alappuzha - Dhanbad Express', fromCode: 'ALLP', toCode: 'MAS', departs: '06:00', arrives: '21:40', arrivalDayOffset: 0, durationMin: 940, runsOn: 'daily', classes: ['1A', '2A', '3A', 'SL'], source: 'https://erail.in/trains-between-stations/alappuzha-ALLP/mgr-chennai-central-MAS' },
      ],
      buses: [
        bus({ operator: 'Kallada Travels', type: 'AC Sleeper (2+1)', boarding: 'Alappuzha', drop: 'Koyambedu, Villupuram bypass', departs: '16:00-17:00', durationMin: 950, fareINR: [1850, 1950], government: false, source: IX + 'alappuzha-chennai-sts' }),
        bus({ operator: 'Oneness Tours and Travels', type: 'AC Sleeper (2+1)', boarding: 'YMCA Junction, Kommady', drop: 'Chengalpattu side of Chennai', departs: '18:15', durationMin: 825, fareINR: [2150, 2250], government: false, source: IX + 'alappuzha-chennai-sts' }),
      ],
      flights: [fly('COK', 'MAA', ['IndiGo', 'Air India Express'], 75, 'Chennai_International_Airport')],
      advice: 'Take the daily 22640 express in the afternoon; it reaches Chennai Central early next morning.',
    },
    {
      from: 'Chennai',
      to: 'munnar',
      trains: [
        { number: '12623', name: 'Chennai Central - Thiruvananthapuram Mail', fromCode: 'MAS', toCode: 'AWY', departs: '19:30', arrives: '05:40', arrivalDayOffset: 1, durationMin: 610, runsOn: 'daily', classes: ['1A', '2A', '3A', 'SL'], source: 'https://erail.in/trains-between-stations/mgr-chennai-central-MAS/aluva-AWY' },
        { number: '22639', name: 'Chennai Central - Alappuzha Express', fromCode: 'MAS', toCode: 'AWY', departs: '20:55', arrives: '07:48', arrivalDayOffset: 1, durationMin: 653, runsOn: 'daily', classes: ['1A', '2A', '3A', 'SL'], source: 'https://erail.in/trains-between-stations/mgr-chennai-central-MAS/aluva-AWY' },
      ],
      buses: [
        bus({ operator: 'PRM Roadways', type: 'AC Sleeper (2+1)', boarding: 'Koyambedu, Vadapalani, Guindy', drop: 'Munnar', departs: '21:00', durationMin: 735, fareINR: [1200, 1300], government: false, source: AB + '1972/Chennai-Munnar' }),
        bus({ operator: 'Vignesh TAT', type: 'AC Sleeper (2+1)', boarding: 'Urapakkam, Guduvancheri', drop: 'Munnar (last stretch from Theni in a van arranged by the operator)', departs: '19:35-21:30', durationMin: 790, fareINR: [1150, 1450], government: false, source: AB + '1972/Chennai-Munnar' }),
      ],
      flights: [fly('MAA', 'COK', ['IndiGo', 'Air India Express'], 75, 'Chennai_International_Airport')],
      advice: 'Munnar has no railway. Take the overnight train to Aluva (12623 or 22639) and a KSRTC bus or taxi up to Munnar, about 4 hours more.',
    },
    {
      from: 'munnar',
      to: 'Chennai',
      trains: [
        { number: '22640', name: 'Alappuzha - Chennai Central Express', fromCode: 'AWY', toCode: 'MAS', departs: '17:01', arrives: '05:15', arrivalDayOffset: 1, durationMin: 734, runsOn: 'daily', classes: ['1A', '2A', '3A', 'SL'], source: 'https://erail.in/trains-between-stations/aluva-AWY/mgr-chennai-central-MAS' },
        { number: '12624', name: 'Thiruvananthapuram - Chennai Central Mail', fromCode: 'AWY', toCode: 'MAS', departs: '19:42', arrives: '07:45', arrivalDayOffset: 1, durationMin: 723, runsOn: 'daily', classes: ['1A', '2A', '3A', 'SL'], source: 'https://erail.in/trains-between-stations/aluva-AWY/mgr-chennai-central-MAS' },
      ],
      buses: [
        bus({ operator: 'PRM Roadways', type: 'AC Sleeper (2+1)', boarding: 'Munnar', drop: 'Chengalpattu side of Chennai', departs: '18:30', durationMin: 735, fareINR: [1950, 2050], government: false, source: AB + '11921/Munnar-Chennai' }),
        bus({ operator: 'FlixBus', type: 'AC Sleeper', boarding: 'Munnar', drop: 'Chengalpattu, Mahindra World City', departs: '18:00', durationMin: 765, fareINR: [1550, 1650], government: false, source: AB + '11921/Munnar-Chennai' }),
      ],
      flights: [fly('COK', 'MAA', ['IndiGo', 'Air India Express'], 75, 'Chennai_International_Airport')],
      advice: 'Go down to Aluva by bus or taxi in daylight, then take the evening 22640 or 12624 to Chennai Central.',
    },

    // ---------------- Hyderabad ----------------
    {
      from: 'Hyderabad',
      to: 'mysuru',
      trains: [
        { number: '12785', name: 'Kacheguda - Mysuru Express', fromCode: 'KCG', toCode: 'MYS', departs: '19:05', arrives: '09:30', arrivalDayOffset: 1, durationMin: 865, runsOn: 'daily', classes: ['1A', '2A', '3A', 'CC', 'SL'], source: 'https://erail.in/trains-between-stations/secunderabad-jn-SC/mysuru-jn-MYS' },
      ],
      buses: [
        bus({ operator: ksrtcKA, type: 'Airavat Club Class (Volvo AC Multi-Axle Semi-Sleeper)', boarding: 'MGBS, Aramghar, Shamshabad', drop: 'Mysuru Suburban (KSRTC) bus stand', departs: '17:15-19:10', durationMin: 735, fareINR: [1790, 1920], government: true, source: AB + '101/Hyderabad-Mysore' }),
        bus({ operator: ksrtcKA, type: 'Ambaari Dream Class (Volvo AC Multi-Axle Sleeper)', boarding: 'MGBS, Aramghar, Shamshabad', drop: 'Mysuru Suburban (KSRTC) bus stand', departs: '19:45', durationMin: 765, fareINR: [2250, 2300], government: true, source: AB + '101/Hyderabad-Mysore' }),
        bus({ operator: 'TGSRTC', type: 'Lahari AC Sleeper (2+1)', boarding: 'RC Puram, Ashok Nagar', drop: 'Mysuru KSRTC bus station', departs: '14:40', durationMin: 980, fareINR: [2000, 2100], government: true, source: AB + '101/Hyderabad-Mysore' }),
      ],
      flights: [fly('HYD', 'MYQ', ['IndiGo'], 95, 'Mysore_Airport')],
      advice: 'The daily 12785 from Kacheguda (Hyderabad) reaches Mysuru next morning. Flying direct to Mysuru is quickest if fares suit you.',
    },
    {
      from: 'mysuru',
      to: 'Hyderabad',
      trains: [
        { number: '12786', name: 'Mysuru - Kacheguda Express', fromCode: 'MYS', toCode: 'KCG', departs: '15:15', arrives: '05:40', arrivalDayOffset: 1, durationMin: 865, runsOn: 'daily', classes: ['1A', '2A', '3A', 'CC', 'SL'], source: 'https://erail.in/trains-between-stations/mysuru-jn-MYS/secunderabad-jn-SC' },
      ],
      buses: [
        bus({ operator: ksrtcKA, type: 'Airavat Club Class (Volvo AC Multi-Axle Semi-Sleeper)', boarding: 'Mysuru Suburban (KSRTC) bus stand', drop: 'MGBS', departs: '16:15-20:05', durationMin: 775, fareINR: [1790, 1920], government: true, source: AB + '987/Mysore-Hyderabad' }),
        bus({ operator: ksrtcKA, type: 'Ambaari Dream Class (Volvo AC Multi-Axle Sleeper)', boarding: 'Mysuru Suburban (KSRTC) bus stand', drop: 'MGBS', departs: '19:00', durationMin: 795, fareINR: [2250, 2300], government: true, source: AB + '987/Mysore-Hyderabad' }),
        bus({ operator: 'TGSRTC', type: 'Lahari AC Sleeper (2+1)', boarding: 'Mysuru KSRTC bus station', drop: 'Shamshabad, Aramghar, MGBS', departs: '17:30', durationMin: 800, fareINR: [2000, 2100], government: true, source: AB + '987/Mysore-Hyderabad' }),
      ],
      flights: [fly('MYQ', 'HYD', ['IndiGo'], 95, 'Mysore_Airport')],
      advice: 'Take the daily 12786 in the afternoon to Kacheguda, arriving early next morning, or fly direct from Mysuru.',
    },
    {
      from: 'Hyderabad',
      to: 'pondicherry',
      trains: [
        { number: '17653', name: 'Kacheguda - Puducherry Express', fromCode: 'KCG', toCode: 'PDY', departs: '17:00', arrives: '11:05', arrivalDayOffset: 1, durationMin: 1085, runsOn: ['Wed', 'Fri', 'Sun'], classes: ['2A', '3A', 'SL'], source: 'https://erail.in/trains-between-stations/secunderabad-jn-SC/puducherry-PDY' },
      ],
      buses: [
        bus({ operator: 'Pramukh Travels', type: 'Volvo 9600 AC Multi-Axle Sleeper', boarding: 'Vanasthalipuram, LB Nagar', drop: 'Morattandi toll plaza, JIPMER, Puducherry', departs: '19:45', durationMin: 825, fareINR: [1950, 2050], government: false, source: AB + '1215/Hyderabad-Pondicherry-Puducherry' }),
        bus({ operator: 'JBT Travels', type: 'AC Sleeper (2+1)', boarding: 'Kukatpally, KPHB', drop: 'JIPMER, Rajiv Gandhi Statue (Puducherry)', departs: '18:25', durationMin: 830, fareINR: [1450, 1550], government: false, source: AB + '1215/Hyderabad-Pondicherry-Puducherry' }),
      ],
      flights: [fly('HYD', 'MAA', ['IndiGo', 'Air India', 'Air India Express'], 75, 'Chennai_International_Airport')],
      advice: 'The direct Kacheguda to Puducherry train runs only three days a week. On other days, fly to Chennai and take a taxi or bus (about 3.5 hours), or take an overnight private bus.',
    },
    {
      from: 'pondicherry',
      to: 'Hyderabad',
      trains: [
        { number: '17654', name: 'Puducherry - Kacheguda Express', fromCode: 'PDY', toCode: 'KCG', departs: '12:45', arrives: '07:55', arrivalDayOffset: 1, durationMin: 1150, runsOn: ['Tue', 'Fri', 'Sun'], classes: ['2A', '3A', 'SL'], source: 'https://erail.in/trains-between-stations/puducherry-PDY/secunderabad-jn-SC' },
      ],
      buses: [],
      flights: [fly('MAA', 'HYD', ['IndiGo', 'Air India', 'Air India Express'], 75, 'Chennai_International_Airport')],
      advice: 'The direct train runs three days a week. On other days, go to Chennai airport by taxi (about 3.5 hours) and fly to Hyderabad.',
    },
    {
      from: 'Hyderabad',
      to: 'alleppey',
      trains: [
        { number: '20629', name: 'Sabari Express', fromCode: 'SC', toCode: 'ERN', departs: '14:25', arrives: '12:50', arrivalDayOffset: 1, durationMin: 1345, runsOn: 'daily', classes: ['1A', '2A', '3A', 'SL'], source: 'https://erail.in/trains-between-stations/secunderabad-jn-SC/ernakulam-jn-ERS' },
      ],
      buses: [],
      flights: [fly('HYD', 'COK', ['IndiGo', 'Air India Express'], 100, 'Cochin_International_Airport')],
      advice: 'Flying to Kochi and taking a taxi to Alappuzha (about 2 hours) is far quicker. By train, the daily Sabari Express reaches Ernakulam Town after about 22 hours; continue by train or bus to Alappuzha (about 1.5 hours).',
    },
    {
      from: 'alleppey',
      to: 'Hyderabad',
      trains: [
        { number: '20630', name: 'Sabari Express', fromCode: 'ERN', toCode: 'SC', departs: '10:45', arrives: '11:02', arrivalDayOffset: 1, durationMin: 1457, runsOn: 'daily', classes: ['1A', '2A', '3A', 'SL'], source: 'https://erail.in/trains-between-stations/ernakulam-jn-ERS/secunderabad-jn-SC' },
      ],
      buses: [],
      flights: [fly('COK', 'HYD', ['IndiGo', 'Air India Express'], 100, 'Cochin_International_Airport')],
      advice: 'Fly from Kochi (about 2 hours by road from Alappuzha). By train, go to Ernakulam Town for the daily Sabari Express to Secunderabad.',
    },
    {
      from: 'Hyderabad',
      to: 'ooty',
      trains: [
        { number: '20629', name: 'Sabari Express', fromCode: 'SC', toCode: 'CBE', departs: '14:25', arrives: '09:10', arrivalDayOffset: 1, durationMin: 1125, runsOn: 'daily', classes: ['1A', '2A', '3A', 'SL'], source: 'https://erail.in/trains-between-stations/secunderabad-jn-SC/coimbatore-jn-CBE' },
      ],
      buses: [],
      flights: [fly('HYD', 'CJB', ['IndiGo'], 95, 'Coimbatore_International_Airport')],
      advice: 'Fly to Coimbatore and take a taxi or bus up to Ooty (about 3 hours). By train, the daily Sabari Express reaches Coimbatore next morning.',
    },
    {
      from: 'ooty',
      to: 'Hyderabad',
      trains: [
        { number: '20630', name: 'Sabari Express', fromCode: 'CBE', toCode: 'SC', departs: '15:40', arrives: '11:02', arrivalDayOffset: 1, durationMin: 1162, runsOn: 'daily', classes: ['1A', '2A', '3A', 'SL'], source: 'https://erail.in/trains-between-stations/coimbatore-jn-CBE/secunderabad-jn-SC' },
      ],
      buses: [],
      flights: [fly('CJB', 'HYD', ['IndiGo'], 95, 'Coimbatore_International_Airport')],
      advice: 'Go down to Coimbatore (about 3 hours by road) for a flight or the afternoon Sabari Express to Secunderabad.',
    },

    // ---------------- Kochi ----------------
    {
      from: 'Kochi',
      to: 'munnar',
      trains: [],
      buses: [
        bus({ operator: ksrtcKL, type: 'Super Fast Non-AC Seater', boarding: 'Ernakulam KSRTC bus stand or Vyttila hub', drop: 'Munnar KSRTC bus stand', departs: 'Morning departures from about 05:00, more through the day', durationMin: 255, fareINR: [185, 210], government: true, source: IX + 'ernakulam-munnar-sts' }),
        bus({ operator: 'Megha Tours and Travels', type: 'AC Pushback Seater', boarding: 'Aroor, Vyttila, Palarivattom', drop: 'Anachal, Munnar', departs: '02:00', durationMin: 255, fareINR: [400, 450], government: false, source: IX + 'ernakulam-munnar-sts' }),
      ],
      flights: [],
      advice: 'There is no train to Munnar. Take a KSRTC bus from Ernakulam or Aluva (about 4 hours up the ghat road), or hire a taxi for about 3.5 hours.',
    },
    {
      from: 'munnar',
      to: 'Kochi',
      trains: [],
      buses: [
        bus({ operator: ksrtcKL, type: 'Super Fast Non-AC Seater', boarding: 'Munnar KSRTC bus stand', drop: 'Vyttila hub', departs: '11:40-16:50', durationMin: 245, fareINR: [185, 210], government: true, source: IX + 'munnar-ernakulam-sts' }),
        bus({ operator: 'Megha Tours and Travels', type: 'AC Pushback Seater', boarding: 'Munnar, Anachal', drop: 'Kalamassery, Edappally, Palarivattom', departs: '19:00', durationMin: 225, fareINR: [600, 650], government: false, source: IX + 'munnar-ernakulam-sts' }),
      ],
      flights: [],
      advice: 'Take a KSRTC bus or taxi down to Ernakulam (about 4 hours). Leave in daylight if you can.',
    },
    {
      from: 'Kochi',
      to: 'alleppey',
      trains: [
        { number: '16341', name: 'Guruvayur - Thiruvananthapuram Intercity Express', fromCode: 'ERS', toCode: 'ALLP', departs: '05:20', arrives: '06:27', arrivalDayOffset: 0, durationMin: 67, runsOn: 'daily', classes: ['CC', '2S'], source: 'https://erail.in/trains-between-stations/ernakulam-jn-ERS/alappuzha-ALLP' },
        { number: '22639', name: 'Chennai Central - Alappuzha Express', fromCode: 'ERS', toCode: 'ALLP', departs: '08:45', arrives: '10:40', arrivalDayOffset: 0, durationMin: 115, runsOn: 'daily', classes: ['1A', '2A', '3A', 'SL'], source: 'https://erail.in/trains-between-stations/ernakulam-jn-ERS/alappuzha-ALLP' },
        { number: '16345', name: 'Netravati Express', fromCode: 'ERS', toCode: 'ALLP', departs: '12:25', arrives: '13:48', arrivalDayOffset: 0, durationMin: 83, runsOn: 'daily', classes: ['2A', '3A', 'SL', '3E'], source: 'https://erail.in/trains-between-stations/ernakulam-jn-ERS/alappuzha-ALLP' },
        { number: '16308', name: 'Kannur - Alappuzha Express', fromCode: 'ERS', toCode: 'ALLP', departs: '11:20', arrives: '13:30', arrivalDayOffset: 0, durationMin: 130, runsOn: 'daily', classes: ['CC', '2S'], source: 'https://erail.in/trains-between-stations/ernakulam-jn-ERS/alappuzha-ALLP' },
      ],
      buses: [
        bus({ operator: ksrtcKL, type: 'Swift / Super Deluxe Non-AC Seater', boarding: 'Vyttila hub', drop: 'Alappuzha KSRTC bus stand', departs: 'Frequent through the day', durationMin: 75, fareINR: [120, 130], government: true, source: AB + '53686/Ernakulam-Alappuzha' }),
        bus({ operator: ksrtcKL, type: 'Super Fast Non-AC Seater', boarding: 'Vyttila hub or Ernakulam KSRTC bus stand', drop: 'Alappuzha KSRTC bus stand', departs: 'Frequent through the day', durationMin: 90, fareINR: [90, 100], government: true, source: AB + '53686/Ernakulam-Alappuzha' }),
      ],
      flights: [],
      advice: 'Trains from Ernakulam Junction take about 1 to 1.5 hours, and KSRTC buses from Vyttila hub leave very often. Either is easy.',
    },
    {
      from: 'alleppey',
      to: 'Kochi',
      trains: [
        { number: '13352', name: 'Alappuzha - Dhanbad Express', fromCode: 'ALLP', toCode: 'ERS', departs: '06:00', arrives: '07:20', arrivalDayOffset: 0, durationMin: 80, runsOn: 'daily', classes: ['1A', '2A', '3A', 'SL'], source: 'https://erail.in/trains-between-stations/alappuzha-ALLP/ernakulam-jn-ERS' },
        { number: '16346', name: 'Netravati Express', fromCode: 'ALLP', toCode: 'ERS', departs: '11:55', arrives: '13:10', arrivalDayOffset: 0, durationMin: 75, runsOn: 'daily', classes: ['2A', '3A', 'SL', '3E'], source: 'https://erail.in/trains-between-stations/alappuzha-ALLP/ernakulam-jn-ERS' },
        { number: '22640', name: 'Alappuzha - Chennai Central Express', fromCode: 'ALLP', toCode: 'ERS', departs: '15:20', arrives: '16:22', arrivalDayOffset: 0, durationMin: 62, runsOn: 'daily', classes: ['1A', '2A', '3A', 'SL'], source: 'https://erail.in/trains-between-stations/alappuzha-ALLP/ernakulam-jn-ERS' },
        { number: '16307', name: 'Alappuzha - Kannur Express', fromCode: 'ALLP', toCode: 'ERS', departs: '15:50', arrives: '17:08', arrivalDayOffset: 0, durationMin: 78, runsOn: 'daily', classes: ['CC', '2S'], source: 'https://erail.in/trains-between-stations/alappuzha-ALLP/ernakulam-jn-ERS' },
      ],
      buses: [
        bus({ operator: ksrtcKL, type: 'Swift / Super Deluxe Non-AC Seater', boarding: 'Alappuzha KSRTC bus stand', drop: 'Ernakulam KSRTC bus stand or Vyttila hub', departs: 'Frequent through the day', durationMin: 75, fareINR: [120, 130], government: true, source: AB + '2715/Alappuzha-Ernakulam' }),
        bus({ operator: ksrtcKL, type: 'Super Fast Non-AC Seater', boarding: 'Alappuzha KSRTC bus stand', drop: 'Ernakulam KSRTC bus stand or Vyttila hub', departs: 'Frequent through the day', durationMin: 90, fareINR: [90, 100], government: true, source: AB + '2715/Alappuzha-Ernakulam' }),
      ],
      flights: [],
      advice: 'Take any train to Ernakulam Junction (about 1 to 1.5 hours) or a KSRTC bus from the bus stand near the boat jetty.',
    },

    // ---------------- Coimbatore ----------------
    {
      from: 'Coimbatore',
      to: 'ooty',
      trains: [
        { number: '12671', name: 'Nilagiri Express', fromCode: 'CBE', toCode: 'MTP', departs: '05:20', arrives: '06:20', arrivalDayOffset: 0, durationMin: 60, runsOn: 'daily', classes: ['1A', '2A', '3A', 'SL', '3E'], source: 'https://erail.in/trains-between-stations/coimbatore-jn-CBE/mettupalayam-MTP' },
        { number: '56136', name: 'Nilgiri Mountain Railway (Mettupalayam - Ooty)', fromCode: 'MTP', toCode: 'UAM', departs: '07:10', arrives: '11:55', arrivalDayOffset: 0, durationMin: 285, runsOn: 'daily', classes: ['2S'], source: 'https://erail.in/trains-between-stations/mettupalayam-MTP/udagamandalam-UAM' },
      ],
      buses: [
        bus({ operator: ksrtcKL, type: 'Super Fast Non-AC Seater', boarding: 'Gandhipuram bus stand', drop: 'Ooty central bus stand', departs: '11:00', durationMin: 165, fareINR: [100, 110], government: true, source: IX + 'coimbatore-ooty-sts' }),
        bus({ operator: 'Essaar', type: 'Non-AC Seater (2+2)', boarding: 'Gandhipuram, Tatabad, Saibaba Colony', drop: 'Wellington, Aruvankadu, Ooty', departs: '06:00', durationMin: 180, fareINR: [330, 370], government: false, source: IX + 'coimbatore-ooty-sts' }),
      ],
      flights: [],
      advice: 'For the toy train, take the 05:20 Nilagiri Express from Coimbatore to Mettupalayam and change to the 07:10 toy train. Otherwise, government buses from Gandhipuram and Mettupalayam run through the day (about 3 hours).',
    },
    {
      from: 'ooty',
      to: 'Coimbatore',
      trains: [
        { number: '56137', name: 'Nilgiri Mountain Railway (Ooty - Mettupalayam)', fromCode: 'UAM', toCode: 'MTP', departs: '14:00', arrives: '17:30', arrivalDayOffset: 0, durationMin: 210, runsOn: 'daily', classes: ['2S'], source: 'https://erail.in/trains-between-stations/udagamandalam-UAM/mettupalayam-MTP' },
        { number: '12672', name: 'Nilagiri Express', fromCode: 'MTP', toCode: 'CBE', departs: '21:20', arrives: '22:15', arrivalDayOffset: 0, durationMin: 55, runsOn: 'daily', classes: ['1A', '2A', '3A', 'SL', '3E'], source: 'https://erail.in/trains-between-stations/mettupalayam-MTP/coimbatore-jn-CBE' },
      ],
      buses: [
        bus({ operator: ksrtcKL, type: 'Super Fast Non-AC Seater', boarding: 'Ooty central bus stand', drop: 'Gandhipuram bus stand', departs: '11:30', durationMin: 180, fareINR: [100, 110], government: true, source: IX + 'ooty-coimbatore-sts' }),
        bus({ operator: 'FlixBus', type: 'AC Sleeper', boarding: 'Ooty bus stand (cab pickup)', drop: 'Gandhipuram, Saravanampatti', departs: '17:10-19:30', durationMin: 225, fareINR: [1150, 1650], government: false, source: IX + 'ooty-coimbatore-sts' }),
      ],
      flights: [],
      advice: 'Take the 14:00 toy train down to Mettupalayam and the evening Nilagiri Express to Coimbatore, or a bus straight down (about 3 hours).',
    },
    {
      from: 'Coimbatore',
      to: 'munnar',
      trains: [],
      buses: [],
      flights: [],
      advice: 'There is no train and no reliable bookable direct bus. Take a bus from Coimbatore (Ukkadam) to Udumalpet, then a Kerala KSRTC or TNSTC bus to Munnar via Marayoor (5 to 6 hours in all), or hire a taxi for about 4.5 hours.',
    },
    {
      from: 'munnar',
      to: 'Coimbatore',
      trains: [],
      buses: [],
      flights: [],
      advice: 'No train and no reliable bookable direct bus. Take a bus from Munnar to Udumalpet via Marayoor, then a frequent bus on to Coimbatore, or hire a taxi for about 4.5 hours. Start early: the road passes through forest.',
    },

    // ---------------- Thiruvananthapuram ----------------
    {
      from: 'Thiruvananthapuram',
      to: 'alleppey',
      trains: [
        { number: '16346', name: 'Netravati Express', fromCode: 'TVC', toCode: 'ALLP', departs: '09:15', arrives: '11:52', arrivalDayOffset: 0, durationMin: 157, runsOn: 'daily', classes: ['2A', '3A', 'SL', '3E'], source: 'https://erail.in/trains-between-stations/thiruvananthapuram-central-TVC/alappuzha-ALLP' },
        { number: '16316', name: 'Thiruvananthapuram North - Mysuru Express', fromCode: 'TVCN', toCode: 'ALLP', departs: '16:45', arrives: '19:12', arrivalDayOffset: 0, durationMin: 147, runsOn: 'daily', classes: ['2A', '3A', 'SL', '3E'], source: 'https://erail.in/trains-between-stations/thiruvananthapuram-central-TVC/alappuzha-ALLP' },
        { number: '16342', name: 'Thiruvananthapuram - Guruvayur Intercity Express', fromCode: 'TVC', toCode: 'ALLP', departs: '17:30', arrives: '20:13', arrivalDayOffset: 0, durationMin: 163, runsOn: 'daily', classes: ['CC', '2S'], source: 'https://erail.in/trains-between-stations/thiruvananthapuram-central-TVC/alappuzha-ALLP' },
      ],
      buses: [
        bus({ operator: ksrtcKL, type: 'Super Fast Non-AC Seater', boarding: 'Thampanoor Central bus stand, Pattom', drop: 'Alappuzha KSRTC bus stand', departs: 'Frequent through the day', durationMin: 230, fareINR: [205, 220], government: true, source: AB + '68586/Trivandrum-Alappuzha' }),
        bus({ operator: ksrtcKL, type: 'AC Seater', boarding: 'Thampanoor Central bus stand, Pattom', drop: 'Alappuzha KSRTC bus stand', departs: 'Several a day', durationMin: 225, fareINR: [230, 300], government: true, source: AB + '68586/Trivandrum-Alappuzha' }),
      ],
      flights: [],
      advice: 'A train is quicker than the bus: the Netravati and Intercity trains take about 2.5 hours from Thiruvananthapuram Central.',
    },
    {
      from: 'alleppey',
      to: 'Thiruvananthapuram',
      trains: [
        { number: '16315', name: 'Mysuru - Thiruvananthapuram North Express', fromCode: 'ALLP', toCode: 'TVCN', departs: '05:15', arrives: '09:15', arrivalDayOffset: 0, durationMin: 240, runsOn: 'daily', classes: ['2A', '3A', 'CC', 'SL', '3E'], source: 'https://erail.in/trains-between-stations/alappuzha-ALLP/thiruvananthapuram-central-TVC' },
        { number: '16341', name: 'Guruvayur - Thiruvananthapuram Intercity Express', fromCode: 'ALLP', toCode: 'TVC', departs: '06:30', arrives: '09:40', arrivalDayOffset: 0, durationMin: 190, runsOn: 'daily', classes: ['CC', '2S'], source: 'https://erail.in/trains-between-stations/alappuzha-ALLP/thiruvananthapuram-central-TVC' },
        { number: '16345', name: 'Netravati Express', fromCode: 'ALLP', toCode: 'TVC', departs: '13:51', arrives: '18:10', arrivalDayOffset: 0, durationMin: 259, runsOn: 'daily', classes: ['2A', '3A', 'SL', '3E'], source: 'https://erail.in/trains-between-stations/alappuzha-ALLP/thiruvananthapuram-central-TVC' },
      ],
      buses: [
        bus({ operator: ksrtcKL, type: 'Super Fast Non-AC Seater', boarding: 'Alappuzha KSRTC bus stand', drop: 'Thampanoor Central bus stand', departs: 'Frequent through the day', durationMin: 230, fareINR: [205, 215], government: true, source: AB + '17669/Alappuzha-Trivandrum' }),
        bus({ operator: ksrtcKL, type: 'AC Multi-Axle Seater', boarding: 'Alappuzha KSRTC bus stand', drop: 'Thiruvananthapuram', departs: 'Several a day', durationMin: 210, fareINR: [380, 400], government: true, source: AB + '17669/Alappuzha-Trivandrum' }),
      ],
      flights: [],
      advice: 'Take a train (about 3 to 3.5 hours). Note that 16315 ends at Thiruvananthapuram North (Kochuveli), not Central.',
    },

    // ---------------- Mumbai ----------------
    {
      from: 'Mumbai',
      to: 'mysuru',
      trains: [
        { number: '11035', name: 'Sharavati Express', fromCode: 'DR', toCode: 'MYS', departs: '21:30', arrives: '21:00', arrivalDayOffset: 1, durationMin: 1410, runsOn: ['Thu'], classes: ['2A', '3A', 'SL'], source: 'https://erail.in/trains-between-stations/mumbai-cst-CSMT/mysuru-jn-MYS' },
        { number: '16209', name: 'Ajmer - Mysuru Express', fromCode: 'BSR', toCode: 'MYS', departs: '21:25', arrives: '00:05', arrivalDayOffset: 2, durationMin: 1600, runsOn: ['Fri', 'Sun'], classes: ['1A', '2A', '3A', 'SL'], source: 'https://erail.in/trains-between-stations/mumbai-cst-CSMT/mysuru-jn-MYS' },
      ],
      buses: [
        bus({ operator: 'VRL Travels', type: 'Volvo 9600 AC Multi-Axle Sleeper', boarding: 'Borivali East, Malad East, CST', drop: 'Mysuru KSRTC bus station, Columbia Asia Hospital', departs: '11:15-15:00', durationMin: 1410, fareINR: [2100, 2400], government: false, source: AB + '7893/Mumbai-Mysore' }),
      ],
      flights: [],
      advice: 'There are no direct flights to Mysuru from Mumbai. Fly to Bengaluru and take a train to Mysuru (about 2 to 3 hours). The direct trains run only a few days a week and leave from Dadar or Vasai Road.',
    },
    {
      from: 'mysuru',
      to: 'Mumbai',
      trains: [
        { number: '11036', name: 'Sharavati Express', fromCode: 'MYS', toCode: 'DR', departs: '06:15', arrives: '05:45', arrivalDayOffset: 1, durationMin: 1410, runsOn: ['Sun'], classes: ['2A', '3A', 'SL'], source: 'https://erail.in/trains-between-stations/mysuru-jn-MYS/mumbai-cst-CSMT' },
        { number: '16210', name: 'Mysuru - Ajmer Express', fromCode: 'MYS', toCode: 'BSR', departs: '20:30', arrives: '22:35', arrivalDayOffset: 1, durationMin: 1565, runsOn: ['Tue', 'Thu'], classes: ['1A', '2A', '3A', 'CC', 'SL'], source: 'https://erail.in/trains-between-stations/mysuru-jn-MYS/mumbai-cst-CSMT' },
      ],
      buses: [],
      flights: [],
      advice: 'Take a train to Bengaluru and fly to Mumbai, or use one of the direct trains, which run only a few days a week to Dadar or Vasai Road.',
    },
    {
      from: 'Mumbai',
      to: 'alleppey',
      trains: [
        { number: '16345', name: 'Netravati Express', fromCode: 'LTT', toCode: 'ALLP', departs: '11:40', arrives: '13:48', arrivalDayOffset: 1, durationMin: 1568, runsOn: 'daily', classes: ['2A', '3A', 'SL', '3E'], source: 'https://erail.in/trains-between-stations/lokmanyatilak-t-LTT/alappuzha-ALLP' },
      ],
      buses: [],
      flights: [fly('BOM', 'COK', ['IndiGo', 'Air India'], 120, 'Cochin_International_Airport')],
      advice: 'Fly to Kochi and take a taxi to Alappuzha (about 2 hours). By train, the daily Netravati Express from Lokmanya Tilak Terminus takes about 26 hours along the Konkan coast.',
    },
    {
      from: 'alleppey',
      to: 'Mumbai',
      trains: [
        { number: '16346', name: 'Netravati Express', fromCode: 'ALLP', toCode: 'LTT', departs: '11:55', arrives: '17:05', arrivalDayOffset: 1, durationMin: 1750, runsOn: 'daily', classes: ['2A', '3A', 'SL', '3E'], source: 'https://erail.in/trains-between-stations/alappuzha-ALLP/lokmanyatilak-t-LTT' },
      ],
      buses: [],
      flights: [fly('COK', 'BOM', ['IndiGo', 'Air India'], 120, 'Cochin_International_Airport')],
      advice: 'Fly from Kochi, or take the daily Netravati Express to Lokmanya Tilak Terminus (about 29 hours).',
    },

    // ---------------- Hops between destinations ----------------
    {
      from: 'mysuru',
      to: 'coorg',
      trains: [],
      buses: [
        bus({ operator: ksrtcKA, type: 'Karnataka Sarige (Non-AC Seater)', boarding: 'Mysuru Suburban (KSRTC) bus stand', drop: 'Madikeri KSRTC bus stand', departs: 'Frequent from about 04:30', durationMin: 180, fareINR: [190, 210], government: true, source: AB + '12122/Mysore-Madikeri' }),
        bus({ operator: ksrtcKA, type: 'Rajahamsa Executive (Non-AC Seater)', boarding: 'Mysuru Suburban (KSRTC) bus stand', drop: 'Madikeri KSRTC bus stand', departs: 'Morning, around 06:45', durationMin: 180, fareINR: [260, 280], government: true, source: AB + '12122/Mysore-Madikeri' }),
        bus({ operator: ksrtcKA, type: 'Fly Bus (Volvo AC Multi-Axle Seater)', boarding: 'Mysuru Suburban (KSRTC) bus stand', drop: 'Madikeri KSRTC bus stand', departs: 'Early morning, around 04:15', durationMin: 180, fareINR: [470, 500], government: true, source: AB + '12122/Mysore-Madikeri' }),
      ],
      flights: [],
      advice: 'No train. KSRTC buses from the Mysuru suburban bus stand reach Madikeri in about 3 hours; a taxi takes about the same time.',
    },
    {
      from: 'coorg',
      to: 'mysuru',
      trains: [],
      buses: [
        bus({ operator: ksrtcKA, type: 'Karnataka Sarige (Non-AC Seater)', boarding: 'Madikeri KSRTC bus stand', drop: 'Mysuru Suburban (KSRTC) bus stand', departs: 'Frequent through the morning', durationMin: 240, fareINR: [190, 210], government: true, source: AB + '10722/Madikeri-Mysore' }),
        bus({ operator: ksrtcKA, type: 'EV Power Plus (AC Electric Seater)', boarding: 'Madikeri KSRTC bus stand', drop: 'Mysuru Suburban (KSRTC) bus stand', departs: 'Morning, around 08:00', durationMin: 180, fareINR: [450, 480], government: true, source: AB + '10722/Madikeri-Mysore' }),
        bus({ operator: ksrtcKA, type: 'Fly Bus (Volvo AC Multi-Axle Seater)', boarding: 'Madikeri KSRTC bus stand', drop: 'Mysuru Suburban (KSRTC) bus stand', departs: 'Morning, around 08:15', durationMin: 195, fareINR: [470, 500], government: true, source: AB + '10722/Madikeri-Mysore' }),
      ],
      flights: [],
      advice: 'No train. Take a KSRTC bus from Madikeri bus stand (3 to 4 hours) or a taxi.',
    },
    {
      from: 'mysuru',
      to: 'ooty',
      trains: [],
      buses: [
        bus({ operator: ksrtcKA, type: 'Karnataka Sarige (Non-AC Seater)', boarding: 'Mysuru Suburban (KSRTC) bus stand', drop: 'Ooty central bus stand', departs: '07:20-12:45', durationMin: 300, fareINR: [220, 240], government: true, source: AB + '11714/Mysore-Ooty' }),
        bus({ operator: ksrtcKA, type: 'Airavat Club Class (Volvo AC Multi-Axle Semi-Sleeper)', boarding: 'Mysuru Suburban (KSRTC) bus stand', drop: 'Ooty central bus stand', departs: '09:15-16:00', durationMin: 285, fareINR: [700, 750], government: true, source: AB + '11714/Mysore-Ooty' }),
        bus({ operator: ksrtcKA, type: 'Rajahamsa Executive (Non-AC Seater)', boarding: 'Mysuru Suburban (KSRTC) bus stand', drop: 'Ooty central bus stand', departs: '06:00-06:30', durationMin: 270, fareINR: [440, 460], government: true, source: AB + '11714/Mysore-Ooty' }),
      ],
      flights: [],
      advice: 'No train. KSRTC buses run through the day via Bandipur and Mudumalai (about 5 hours). Travel by day: the forest road closes to traffic at night.',
    },
    {
      from: 'ooty',
      to: 'mysuru',
      trains: [],
      buses: [
        bus({ operator: ksrtcKA, type: 'Karnataka Sarige (Non-AC Seater)', boarding: 'Ooty central bus stand', drop: 'Mysuru Suburban (KSRTC) bus stand', departs: '07:00-16:00', durationMin: 300, fareINR: [220, 240], government: true, source: AB + '12631/Ooty-Mysore' }),
        bus({ operator: ksrtcKA, type: 'Airavat Club Class (Volvo AC Multi-Axle Semi-Sleeper)', boarding: 'Ooty central bus stand', drop: 'Mysuru Suburban (KSRTC) bus stand', departs: '07:15-17:45', durationMin: 270, fareINR: [850, 930], government: true, source: AB + '12631/Ooty-Mysore' }),
        bus({ operator: ksrtcKA, type: 'Rajahamsa Executive (Non-AC Seater)', boarding: 'Ooty central bus stand', drop: 'Mysuru Suburban (KSRTC) bus stand', departs: '14:00-16:30', durationMin: 280, fareINR: [520, 550], government: true, source: AB + '12631/Ooty-Mysore' }),
      ],
      flights: [],
      advice: 'No train. Take a daytime KSRTC bus (about 5 hours); the road through the forest is closed at night.',
    },
    {
      from: 'munnar',
      to: 'alleppey',
      trains: [],
      buses: [
        bus({ operator: ksrtcKL, type: 'Super Fast Non-AC Seater', boarding: 'Munnar KSRTC bus stand', drop: 'Alappuzha KSRTC bus stand', departs: '11:40-16:50', durationMin: 340, fareINR: [245, 275], government: true, source: IX + 'munnar-alappuzha-sts' }),
        bus({ operator: 'Megha Tours and Travels', type: 'AC Pushback Seater', boarding: 'Munnar, Anachal', drop: 'Alappuzha', departs: '19:00', durationMin: 365, fareINR: [450, 500], government: false, source: IX + 'munnar-alappuzha-sts' }),
      ],
      flights: [],
      advice: 'No train. A taxi takes about 4.5 to 5 hours; KSRTC buses take about 5.5 to 6 hours via Kothamangalam.',
    },
    {
      from: 'alleppey',
      to: 'munnar',
      trains: [],
      buses: [
        bus({ operator: ksrtcKL, type: 'Super Fast Non-AC Seater', boarding: 'Alappuzha KSRTC bus stand', drop: 'Munnar KSRTC bus stand', departs: '04:40-08:40', durationMin: 330, fareINR: [245, 275], government: true, source: IX + 'alappuzha-munnar-sts' }),
        bus({ operator: 'Megha Tours and Travels', type: 'AC Pushback Seater', boarding: 'Alappuzha', drop: 'Anachal, Munnar', departs: '00:30', durationMin: 345, fareINR: [450, 500], government: false, source: IX + 'alappuzha-munnar-sts' }),
      ],
      flights: [],
      advice: 'No train. Take an early KSRTC bus or a taxi (about 4.5 to 5 hours) so you reach the hills in daylight.',
    },
    {
      from: 'coorg',
      to: 'ooty',
      trains: [],
      buses: [
        bus({ operator: ksrtcKA, type: 'Karnataka Sarige (Non-AC Seater)', boarding: 'Madikeri KSRTC bus stand', drop: 'Ooty central bus stand', departs: '07:30', durationMin: 540, fareINR: [390, 420], government: true, source: 'https://www.abhibus.com/bus-tickets/ksrtc-karnataka-coorg-ooty-bus-booking' }),
      ],
      flights: [],
      advice: 'No train. There is one direct morning KSRTC bus (about 9 hours). Otherwise go to Mysuru first and change to an Ooty bus, or hire a taxi for about 7 hours.',
    },
    {
      from: 'ooty',
      to: 'coorg',
      trains: [],
      buses: [
        bus({ operator: ksrtcKA, type: 'Karnataka Sarige (Non-AC Seater)', boarding: 'Ooty central bus stand', drop: 'Madikeri KSRTC bus stand', departs: '07:00', durationMin: 540, fareINR: [390, 420], government: true, source: 'https://www.abhibus.com/bus-tickets/ksrtc-karnataka-ooty-coorg-bus-booking' }),
      ],
      flights: [],
      advice: 'No train. Take the one direct morning KSRTC bus (about 9 hours), or go via Mysuru and change buses.',
    },
  ],
};
