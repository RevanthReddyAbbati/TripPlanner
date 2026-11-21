// Departure hubs (railway stations, long-distance bus boarding points and airports) for the
// origin cities the planner supports.
//
// Station codes, IATA codes and coordinates were checked in Nov 2026 against Wikidata,
// Wikipedia and OpenStreetMap. Platforms, timings, bus boarding points and even station names
// change, so always confirm the station or boarding point printed on your ticket.

import type { TransportDataset } from './types';

export const DATA: TransportDataset = {
  hubs: [
    {
      city: 'Hyderabad',
      stations: [
        { code: 'SC', name: 'Secunderabad Junction', lat: 17.4331, lon: 78.5015, note: 'The busiest station in the city; most long-distance trains start or stop here.' },
        { code: 'HYB', name: 'Hyderabad Deccan (Nampally)', lat: 17.3934, lon: 78.4674, note: 'Older city-centre terminal at Nampally where several long-distance trains start.' },
        { code: 'KCG', name: 'Kacheguda', lat: 17.3896, lon: 78.4998, note: 'Many trains towards Bengaluru and the south start here.' },
        { code: 'LPI', name: 'Lingampalli', lat: 17.4829, lon: 78.3168, note: 'Western suburb terminal, handy for HITEC City and Gachibowli; some trains to Andhra Pradesh start here.' },
      ],
      busPoints: [
        { name: 'Mahatma Gandhi Bus Station (MGBS)', lat: 17.3781, lon: 78.4851, note: 'Main state transport bus station for buses to Andhra Pradesh, Karnataka and beyond.' },
        { name: 'Ameerpet', lat: 17.4375, lon: 78.4483, note: 'Common pickup area for private overnight buses.' },
        { name: 'Miyapur', lat: 17.4965, lon: 78.373, note: 'Pickup point on the western edge of the city for many private buses towards Mumbai, Pune and Bengaluru.' },
      ],
      airport: { code: 'HYD', name: 'Rajiv Gandhi International Airport', lat: 17.2386, lon: 78.4294 },
      localTip:
        'Hyderabad Metro stops at MGBS, Ameerpet and Miyapur, and near Secunderabad station; for the airport take an Uber, Ola or Rapido cab or the airport bus. Reach the station 30 minutes before your train and the airport 2 hours before your flight.',
    },
    {
      city: 'Bengaluru',
      stations: [
        { code: 'SBC', name: 'KSR Bengaluru City', lat: 12.9776, lon: 77.5681, note: 'Main city-centre station at Majestic, with trains in every direction.' },
        { code: 'YPR', name: 'Yesvantpur Junction', lat: 13.0228, lon: 77.5512, note: 'Many long-distance trains to the north and to Goa start here.' },
        { code: 'SMVB', name: 'SMVT Bengaluru', lat: 12.9996, lon: 77.6411, note: 'Newer terminal at Baiyappanahalli in east Bengaluru where some long-distance trains start.' },
        { code: 'BNC', name: 'Bengaluru Cantonment', lat: 12.9937, lon: 77.5993, note: 'Most trains towards Chennai stop here; convenient for central and east Bengaluru.' },
      ],
      busPoints: [
        { name: 'Kempegowda Bus Station (Majestic)', lat: 12.9782, lon: 77.5722, note: 'Main KSRTC bus station, opposite KSR Bengaluru City railway station.' },
        { name: 'Anand Rao Circle', lat: 12.9807, lon: 77.5747, note: 'Common pickup point for private overnight buses, a short walk from Majestic.' },
        { name: 'Shantinagar Bus Station', lat: 12.9545, lon: 77.5926, note: 'KSRTC bus station south of the centre where some long-distance buses start.' },
      ],
      airport: { code: 'BLR', name: 'Kempegowda International Airport', lat: 13.1989, lon: 77.7056 },
      localTip:
        'Namma Metro Purple and Green lines meet at Majestic, next to the railway and bus stations; the airport is far north, so allow at least 90 minutes by Vayu Vajra bus or an Uber, Ola or Rapido cab in traffic.',
    },
    {
      city: 'Chennai',
      stations: [
        { code: 'MAS', name: 'Chennai Central (Dr. MGR Central)', lat: 13.0848, lon: 80.2749, note: 'Trains to Bengaluru, Kerala, Hyderabad, Mumbai, Delhi and the north leave from here.' },
        { code: 'MS', name: 'Chennai Egmore', lat: 13.0777, lon: 80.2602, note: 'Most trains to southern Tamil Nadu leave from here.' },
        { code: 'TBM', name: 'Tambaram', lat: 12.926, lon: 80.1192, note: 'Southern suburb station where many trains to southern Tamil Nadu start or stop.' },
      ],
      busPoints: [
        { name: 'Kilambakkam Bus Terminus (KCBT)', lat: 12.8723, lon: 80.0815, note: 'Most government and private buses to southern Tamil Nadu leave from here, on the far southern edge of the city.' },
        { name: 'Koyambedu (CMBT)', lat: 13.066, lon: 80.2056, note: 'Older main bus terminus; some buses, including some towards Bengaluru, still leave from here, so check your ticket.' },
      ],
      airport: { code: 'MAA', name: 'Chennai International Airport', lat: 12.9822, lon: 80.1636 },
      localTip:
        'Chennai Metro links the airport with Central and Egmore stations and with Koyambedu; Kilambakkam is far south, so allow extra time by cab or suburban train. Uber, Ola and Rapido work across the city.',
    },
    {
      city: 'Mumbai',
      stations: [
        { code: 'CSMT', name: 'Chhatrapati Shivaji Maharaj Terminus', lat: 18.9398, lon: 72.8355, note: 'Historic terminus in south Mumbai for Central Railway trains to Pune and south and east India.' },
        { code: 'LTT', name: 'Lokmanya Tilak Terminus (Kurla)', lat: 19.0703, lon: 72.8917, note: 'Many long-distance trains start here, including several on the Konkan route to Goa and Kerala.' },
        { code: 'MMCT', name: 'Mumbai Central', lat: 18.9707, lon: 72.8194, note: 'Western Railway terminal for trains to Gujarat, Rajasthan and Delhi.' },
        { code: 'BDTS', name: 'Bandra Terminus', lat: 19.0626, lon: 72.8411, note: 'Suburban terminal for many trains to Gujarat, Rajasthan and north India.' },
      ],
      busPoints: [
        { name: 'Mumbai Central Bus Station (MSRTC)', lat: 18.9693, lon: 72.8221, note: 'Main state transport bus station, opposite Mumbai Central railway station.' },
        { name: 'Dadar', lat: 19.0183, lon: 72.8432, note: 'Busy pickup area near Dadar station for buses to Pune and many private overnight buses.' },
      ],
      airport: { code: 'BOM', name: 'Chhatrapati Shivaji Maharaj International Airport', lat: 19.0886, lon: 72.8681 },
      localTip:
        'Local trains are the fastest way to reach most stations but are very crowded at rush hour, so use an Uber or Ola cab if you have heavy bags. Allow at least an hour across the city in traffic.',
    },
    {
      city: 'Delhi',
      stations: [
        { code: 'NDLS', name: 'New Delhi', lat: 28.6423, lon: 77.22, note: 'Main station near Connaught Place, with trains to almost every part of India.' },
        { code: 'DLI', name: 'Delhi Junction (Old Delhi)', lat: 28.6618, lon: 77.2284, note: 'Many trains towards Punjab, Jammu and Rajasthan start here.' },
        { code: 'NZM', name: 'Hazrat Nizamuddin', lat: 28.587, lon: 77.2539, note: 'Most trains to Mumbai, Goa, Kerala and south India start or stop here.' },
        { code: 'ANVT', name: 'Anand Vihar Terminal', lat: 28.6486, lon: 77.314, note: 'Many trains to eastern Uttar Pradesh, Bihar and the east start here.' },
      ],
      busPoints: [
        { name: 'Kashmere Gate ISBT', lat: 28.6687, lon: 77.2304, note: 'Main bus terminal for Himachal Pradesh, Punjab, Uttarakhand and Jammu and Kashmir.' },
        { name: 'Anand Vihar ISBT', lat: 28.649, lon: 77.3183, note: 'Buses to Uttar Pradesh and Uttarakhand, next to Anand Vihar railway terminal.' },
        { name: 'Sarai Kale Khan ISBT', lat: 28.585, lon: 77.2588, note: 'Buses to Rajasthan and Haryana, close to Hazrat Nizamuddin station.' },
      ],
      airport: { code: 'DEL', name: 'Indira Gandhi International Airport', lat: 28.5686, lon: 77.1122 },
      localTip:
        'Delhi Metro reaches every station and bus terminal, and the Airport Express line runs from New Delhi station to the airport. Check your terminal before leaving and allow extra time at the big stations, which can be very crowded.',
    },
    {
      city: 'Pune',
      stations: [
        { code: 'PUNE', name: 'Pune Junction', lat: 18.5294, lon: 73.8731, note: 'Main station, with trains to Mumbai, Hyderabad, Bengaluru, Delhi and most other cities.' },
      ],
      busPoints: [
        { name: 'Swargate Bus Station (MSRTC)', lat: 18.4999, lon: 73.8589, note: 'Main state transport bus station for buses to south Maharashtra, Goa and Karnataka.' },
        { name: 'Shivajinagar Bus Station (at Wakdewadi)', lat: 18.5434, lon: 73.8524, note: 'Temporary home of the Shivajinagar bus station, for buses to north Maharashtra and Mumbai.' },
        { name: 'Pune Station Bus Stand', lat: 18.5275, lon: 73.8728, note: 'Bus stand next to Pune Junction railway station, with buses to Mumbai and nearby cities.' },
      ],
      airport: { code: 'PNQ', name: 'Pune International Airport', lat: 18.5822, lon: 73.9197 },
      localTip:
        'Pune Metro stops at Pune Railway Station and Swargate; for other hubs use an Uber, Ola or Rapido cab or an auto. Allow extra time in evening traffic.',
    },
    {
      city: 'Kolkata',
      stations: [
        { code: 'HWH', name: 'Howrah Junction', lat: 22.5829, lon: 88.3428, note: 'Largest terminal, across the Hooghly river, with trains to most of India.' },
        { code: 'SDAH', name: 'Sealdah', lat: 22.568, lon: 88.3711, note: 'Many trains to north Bengal, for Darjeeling and Sikkim, start here.' },
        { code: 'KOAA', name: 'Kolkata (Chitpur)', lat: 22.6013, lon: 88.3841, note: 'Smaller terminal in north Kolkata where some long-distance trains start.' },
      ],
      busPoints: [
        { name: 'Esplanade Bus Terminus', lat: 22.5626, lon: 88.3498, note: 'Central bus terminus for state and private buses to Digha and other towns in Bengal.' },
        { name: 'Karunamoyee (Salt Lake)', lat: 22.5856, lon: 88.421, note: 'Bus terminus in Salt Lake with long-distance and international coaches.' },
      ],
      airport: { code: 'CCU', name: 'Netaji Subhas Chandra Bose International Airport', lat: 22.6547, lon: 88.4467 },
      localTip:
        'The metro Green Line runs under the river to Howrah and also stops at Sealdah and Esplanade; Uber, Ola and yellow taxis are easy to find. Howrah Bridge traffic is slow, so leave early.',
    },
    {
      city: 'Ahmedabad',
      stations: [
        { code: 'ADI', name: 'Ahmedabad Junction (Kalupur)', lat: 23.0257, lon: 72.6017, note: 'Main station, with trains to Mumbai, Delhi and across India.' },
      ],
      busPoints: [
        { name: 'Gita Mandir Bus Station (GSRTC)', lat: 23.0154, lon: 72.5918, note: 'Main state transport bus station for buses across Gujarat and to nearby states.' },
      ],
      airport: { code: 'AMD', name: 'Sardar Vallabhbhai Patel International Airport', lat: 23.0772, lon: 72.6347 },
      localTip:
        'Ahmedabad Metro has a stop at Kalupur railway station; for the airport and bus station use an Uber, Ola or Rapido cab or an auto.',
    },
    {
      city: 'Kochi',
      stations: [
        { code: 'ERS', name: 'Ernakulam Junction (South)', lat: 9.9695, lon: 76.2907, note: 'Main station, where most long-distance trains stop.' },
        { code: 'ERN', name: 'Ernakulam Town (North)', lat: 9.9916, lon: 76.2861, note: 'Some trains that skip Ernakulam Junction stop here instead.' },
        { code: 'AWY', name: 'Aluva', lat: 10.1082, lon: 76.3565, note: 'Northern station, the closest major stop to Cochin airport.' },
      ],
      busPoints: [
        { name: 'Vyttila Mobility Hub', lat: 9.9685, lon: 76.3219, note: 'Main hub for KSRTC and private long-distance buses.' },
        { name: 'Ernakulam KSRTC Bus Station', lat: 9.9776, lon: 76.289, note: 'Central KSRTC bus station near Ernakulam Junction.' },
      ],
      airport: { code: 'COK', name: 'Cochin International Airport', lat: 10.1533, lon: 76.3882 },
      localTip:
        'Kochi Metro stops at Ernakulam South, Vyttila and Aluva; the airport is about 30 km north of the city, so allow an hour by Uber or Ola cab.',
    },
    {
      city: 'Visakhapatnam',
      stations: [
        { code: 'VSKP', name: 'Visakhapatnam Junction', lat: 17.7216, lon: 83.2895, note: 'Main station, with trains to Howrah, Chennai, Hyderabad and beyond.' },
        { code: 'DVD', name: 'Duvvada', lat: 17.7038, lon: 83.1521, note: 'Western suburb station where some trains that skip the main station stop.' },
      ],
      busPoints: [
        { name: 'Dwaraka Bus Station (APSRTC)', lat: 17.7239, lon: 83.3069, note: 'Main bus station for APSRTC and private long-distance buses.' },
      ],
      airport: { code: 'VTZ', name: 'Visakhapatnam Airport', lat: 17.7211, lon: 83.2244 },
      localTip:
        'Use an Uber, Ola or Rapido cab or an auto to reach the station, bus station and airport, which are all within about 15 km of each other.',
    },
    {
      city: 'Vijayawada',
      stations: [
        { code: 'BZA', name: 'Vijayawada Junction', lat: 16.5183, lon: 80.6186, note: 'One of the busiest junctions in south India, with trains in every direction.' },
      ],
      busPoints: [
        { name: 'Pandit Nehru Bus Station (PNBS)', lat: 16.5088, lon: 80.6157, note: 'Main APSRTC bus station for buses across Andhra Pradesh and to Hyderabad.' },
      ],
      airport: { code: 'VGA', name: 'Vijayawada International Airport', lat: 16.5289, lon: 80.7958 },
      localTip:
        'The railway station and bus station are close together in the city centre; the airport is about 20 km east at Gannavaram, so allow 45 minutes by cab.',
    },
    {
      city: 'Coimbatore',
      stations: [
        { code: 'CBE', name: 'Coimbatore Junction', lat: 10.9976, lon: 76.9663, note: 'Main station, with trains to Chennai, Bengaluru, Kerala and north India.' },
      ],
      busPoints: [
        { name: 'Gandhipuram Bus Stands', lat: 11.0141, lon: 76.9669, note: 'Cluster of city and long-distance bus stands; check which stand your ticket names.' },
      ],
      airport: { code: 'CJB', name: 'Coimbatore International Airport', lat: 11.0267, lon: 77.0417 },
      localTip:
        'Use an Uber, Ola or Rapido cab or an auto between the station, Gandhipuram and the airport; allow 30 to 45 minutes in traffic.',
    },
    {
      city: 'Jaipur',
      stations: [
        { code: 'JP', name: 'Jaipur Junction', lat: 26.9202, lon: 75.7869, note: 'Main station, with trains to Delhi, Mumbai, Agra and across India.' },
        { code: 'GADJ', name: 'Gandhinagar Jaipur', lat: 26.8731, lon: 75.7983, note: 'Station in south Jaipur where many trains also stop.' },
      ],
      busPoints: [
        { name: 'Sindhi Camp Bus Stand', lat: 26.9233, lon: 75.8006, note: 'Main RSRTC bus stand for buses across Rajasthan and to Delhi.' },
      ],
      airport: { code: 'JAI', name: 'Jaipur International Airport', lat: 26.8242, lon: 75.8122 },
      localTip:
        'Jaipur Metro stops at the railway station and Sindhi Camp; otherwise use an Uber, Ola or Rapido cab or an auto.',
    },
    {
      city: 'Lucknow',
      stations: [
        { code: 'LKO', name: 'Lucknow Charbagh', lat: 26.8307, lon: 80.9253, note: 'Main station, with trains to Delhi and most other cities.' },
        { code: 'LJN', name: 'Lucknow Junction', lat: 26.832, lon: 80.9186, note: 'Separate station right next to Charbagh; check which one your ticket names.' },
        { code: 'GTNR', name: 'Gomti Nagar', lat: 26.8603, lon: 81.0034, note: 'Terminal in east Lucknow where some long-distance trains start.' },
      ],
      busPoints: [
        { name: 'Alambagh Bus Station', lat: 26.8195, lon: 80.9068, note: 'Main UPSRTC bus station for buses to Delhi, Kanpur and across Uttar Pradesh.' },
      ],
      airport: { code: 'LKO', name: 'Chaudhary Charan Singh International Airport', lat: 26.7619, lon: 80.8833 },
      localTip:
        'Lucknow Metro links the airport, Alambagh bus station and Charbagh station; Uber, Ola and Rapido also work well.',
    },
    {
      city: 'Chandigarh',
      stations: [
        { code: 'CDG', name: 'Chandigarh Junction', lat: 30.702, lon: 76.8221, note: 'Main station, with trains to Delhi and onward to Kalka for Shimla.' },
      ],
      busPoints: [
        { name: 'ISBT Sector 43', lat: 30.7163, lon: 76.7427, note: 'Main terminal for long-distance buses, including many to Himachal Pradesh and Delhi.' },
        { name: 'ISBT Sector 17', lat: 30.7354, lon: 76.7792, note: 'Older bus terminal in the city centre.' },
      ],
      airport: { code: 'IXC', name: 'Shaheed Bhagat Singh International Airport', lat: 30.6733, lon: 76.7886 },
      localTip:
        'The railway station is about 6 km from the Sector 17 city centre; use an Uber or Ola cab or an auto and allow 30 minutes.',
    },
    {
      city: 'Bhubaneswar',
      stations: [
        { code: 'BBS', name: 'Bhubaneswar', lat: 20.2654, lon: 85.8426, note: 'Main station, with trains to Howrah, Puri, Chennai, Delhi and beyond.' },
      ],
      busPoints: [
        { name: 'Baramunda Bus Stand', lat: 20.2731, lon: 85.7923, note: 'Main bus stand for state and private long-distance buses.' },
      ],
      airport: { code: 'BBI', name: 'Biju Patnaik International Airport', lat: 20.2444, lon: 85.8178 },
      localTip:
        'The airport, station and bus stand are all within a few kilometres; use an Uber, Ola or Rapido cab or an auto.',
    },
    {
      city: 'Nagpur',
      stations: [
        { code: 'NGP', name: 'Nagpur Junction', lat: 21.1534, lon: 79.0889, note: 'Main station at the centre of the rail network, with trains in every direction.' },
        { code: 'AJNI', name: 'Ajni', lat: 21.1269, lon: 79.0825, note: 'South Nagpur station where some trains start; check your ticket.' },
      ],
      busPoints: [
        { name: 'Ganeshpeth Bus Station (MSRTC)', lat: 21.1391, lon: 79.0967, note: 'Main state transport bus station.' },
      ],
      airport: { code: 'NAG', name: 'Dr. Babasaheb Ambedkar International Airport', lat: 21.0922, lon: 79.0472 },
      localTip:
        'Use an Uber, Ola or Rapido cab or an auto; the airport is about 8 km south of Nagpur Junction.',
    },
    {
      city: 'Indore',
      stations: [
        { code: 'INDB', name: 'Indore Junction', lat: 22.7176, lon: 75.8684, note: 'Main station, with trains to Delhi, Mumbai and across India.' },
      ],
      busPoints: [],
      airport: { code: 'IDR', name: 'Devi Ahilya Bai Holkar Airport', lat: 22.7217, lon: 75.8008 },
      localTip:
        'Long-distance bus stands in Indore have been moving recently, so check the boarding point on your bus ticket; use an Uber, Ola or Rapido cab or an auto to get there.',
    },
    {
      city: 'Mangaluru',
      stations: [
        { code: 'MAQ', name: 'Mangaluru Central', lat: 12.8623, lon: 74.8441, note: 'City-centre terminal for trains to Kerala, Chennai and Bengaluru.' },
        { code: 'MAJN', name: 'Mangaluru Junction (Kankanadi)', lat: 12.8662, lon: 74.8801, note: 'Most Konkan route trains to Goa and Mumbai stop here, not at Mangaluru Central.' },
      ],
      busPoints: [
        { name: 'KSRTC Bus Station (Bejai)', lat: 12.8853, lon: 74.8417, note: 'Main KSRTC bus station for buses to Bengaluru and across Karnataka.' },
      ],
      airport: { code: 'IXE', name: 'Mangaluru International Airport', lat: 12.9614, lon: 74.89 },
      localTip:
        'The two railway stations are about 4 km apart, so check which one your ticket names; use an auto or app cab, and allow 40 minutes to the airport.',
    },
    {
      city: 'Thiruvananthapuram',
      stations: [
        { code: 'TVC', name: 'Thiruvananthapuram Central', lat: 8.4874, lon: 76.952, note: 'Main station in the city centre, where most long-distance trains start or stop.' },
        { code: 'TVCN', name: 'Thiruvananthapuram North (formerly Kochuveli)', lat: 8.5093, lon: 76.8961, note: 'Terminal where many long-distance trains to north India start.' },
      ],
      busPoints: [
        { name: 'Thampanoor Central Bus Station (KSRTC)', lat: 8.4882, lon: 76.952, note: 'Main KSRTC bus station, opposite Thiruvananthapuram Central railway station.' },
      ],
      airport: { code: 'TRV', name: 'Thiruvananthapuram International Airport', lat: 8.4822, lon: 76.92 },
      localTip:
        'Thiruvananthapuram North is outside the centre, so allow 30 minutes by Uber, Ola or auto; the airport is close to the city.',
    },
  ],
  access: [],
  corridors: [],
};
