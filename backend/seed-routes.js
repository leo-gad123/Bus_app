const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const mongoose = require('mongoose');
const Route = require('./models/Route');

const routes = [
  {
    name: 'Kacyiru - Nyabugogo',
    startLocation: 'Kacyiru',
    endLocation: 'Nyabugogo',
    baseFare: 300,
    distance: 7.2,
    stops: [
      { name: 'Kacyiru', order: 1, fare: 0, lat: -1.9472, lng: 30.0756 },
      { name: 'Kimihurura', order: 2, fare: 150, lat: -1.9553, lng: 30.0681 },
      { name: 'Rugando', order: 3, fare: 200, lat: -1.9594, lng: 30.0603 },
      { name: 'Kiyovu', order: 4, fare: 250, lat: -1.9542, lng: 30.0469 },
      { name: 'Nyabugogo', order: 5, fare: 300, lat: -1.9442, lng: 30.0344 }
    ],
    coordinates: [
      { lat: -1.9472, lng: 30.0756 }, { lat: -1.9500, lng: 30.0720 },
      { lat: -1.9553, lng: 30.0681 }, { lat: -1.9575, lng: 30.0640 },
      { lat: -1.9594, lng: 30.0603 }, { lat: -1.9570, lng: 30.0530 },
      { lat: -1.9542, lng: 30.0469 }, { lat: -1.9490, lng: 30.0400 },
      { lat: -1.9442, lng: 30.0344 }
    ]
  },
  {
    name: 'Kimironko - Nyabugogo',
    startLocation: 'Kimironko',
    endLocation: 'Nyabugogo',
    baseFare: 350,
    distance: 8.5,
    stops: [
      { name: 'Kimironko', order: 1, fare: 0, lat: -1.9397, lng: 30.1006 },
      { name: 'KG 15 Ave', order: 2, fare: 150, lat: -1.9422, lng: 30.0914 },
      { name: 'Remera', order: 3, fare: 200, lat: -1.9450, lng: 30.0817 },
      { name: 'Kicukiro Center', order: 4, fare: 250, lat: -1.9489, lng: 30.0722 },
      { name: 'Gikondo', order: 5, fare: 300, lat: -1.9467, lng: 30.0556 },
      { name: 'Nyabugogo', order: 6, fare: 350, lat: -1.9442, lng: 30.0344 }
    ],
    coordinates: [
      { lat: -1.9397, lng: 30.1006 }, { lat: -1.9405, lng: 30.0960 },
      { lat: -1.9422, lng: 30.0914 }, { lat: -1.9435, lng: 30.0865 },
      { lat: -1.9450, lng: 30.0817 }, { lat: -1.9470, lng: 30.0770 },
      { lat: -1.9489, lng: 30.0722 }, { lat: -1.9478, lng: 30.0640 },
      { lat: -1.9467, lng: 30.0556 }, { lat: -1.9455, lng: 30.0450 },
      { lat: -1.9442, lng: 30.0344 }
    ]
  },
  {
    name: 'Kicukiro - Remera',
    startLocation: 'Kicukiro',
    endLocation: 'Remera',
    baseFare: 250,
    distance: 5.0,
    stops: [
      { name: 'Kicukiro', order: 1, fare: 0, lat: -1.9586, lng: 30.0772 },
      { name: 'Gahanga', order: 2, fare: 120, lat: -1.9625, lng: 30.0831 },
      { name: 'Kanombe', order: 3, fare: 180, lat: -1.9600, lng: 30.0914 },
      { name: 'Airport Area', order: 4, fare: 220, lat: -1.9536, lng: 30.0931 },
      { name: 'Remera', order: 5, fare: 250, lat: -1.9450, lng: 30.0817 }
    ],
    coordinates: [
      { lat: -1.9586, lng: 30.0772 }, { lat: -1.9605, lng: 30.0800 },
      { lat: -1.9625, lng: 30.0831 }, { lat: -1.9612, lng: 30.0870 },
      { lat: -1.9600, lng: 30.0914 }, { lat: -1.9568, lng: 30.0922 },
      { lat: -1.9536, lng: 30.0931 }, { lat: -1.9493, lng: 30.0874 },
      { lat: -1.9450, lng: 30.0817 }
    ]
  },
  {
    name: 'Gatsata - Downtown',
    startLocation: 'Gatsata',
    endLocation: 'Downtown Kigali',
    baseFare: 200,
    distance: 4.0,
    stops: [
      { name: 'Gatsata', order: 1, fare: 0, lat: -1.9308, lng: 30.0417 },
      { name: 'Biryogo', order: 2, fare: 100, lat: -1.9350, lng: 30.0394 },
      { name: 'Muhima', order: 3, fare: 150, lat: -1.9392, lng: 30.0381 },
      { name: 'Downtown', order: 4, fare: 200, lat: -1.9442, lng: 30.0344 }
    ],
    coordinates: [
      { lat: -1.9308, lng: 30.0417 }, { lat: -1.9330, lng: 30.0405 },
      { lat: -1.9350, lng: 30.0394 }, { lat: -1.9370, lng: 30.0388 },
      { lat: -1.9392, lng: 30.0381 }, { lat: -1.9417, lng: 30.0362 },
      { lat: -1.9442, lng: 30.0344 }
    ]
  },
  {
    name: 'Kabuga - Nyabugogo',
    startLocation: 'Kabuga',
    endLocation: 'Nyabugogo',
    baseFare: 500,
    distance: 14.0,
    stops: [
      { name: 'Kabuga', order: 1, fare: 0, lat: -1.9156, lng: 30.2186 },
      { name: 'Gikomero', order: 2, fare: 200, lat: -1.9197, lng: 30.1814 },
      { name: 'Gasogi', order: 3, fare: 300, lat: -1.9269, lng: 30.1369 },
      { name: 'Kicukiro', order: 4, fare: 400, lat: -1.9586, lng: 30.0772 },
      { name: 'Nyabugogo', order: 5, fare: 500, lat: -1.9442, lng: 30.0344 }
    ],
    coordinates: [
      { lat: -1.9156, lng: 30.2186 }, { lat: -1.9168, lng: 30.2000 },
      { lat: -1.9197, lng: 30.1814 }, { lat: -1.9225, lng: 30.1600 },
      { lat: -1.9269, lng: 30.1369 }, { lat: -1.9350, lng: 30.1200 },
      { lat: -1.9420, lng: 30.1000 }, { lat: -1.9480, lng: 30.0880 },
      { lat: -1.9586, lng: 30.0772 }, { lat: -1.9514, lng: 30.0558 },
      { lat: -1.9442, lng: 30.0344 }
    ]
  },
  {
    name: 'Airport - Kacyiru',
    startLocation: 'Kigali Airport',
    endLocation: 'Kacyiru',
    baseFare: 400,
    distance: 10.0,
    stops: [
      { name: 'Kigali Airport', order: 1, fare: 0, lat: -1.9536, lng: 30.0931 },
      { name: 'Kanombe', order: 2, fare: 150, lat: -1.9600, lng: 30.0914 },
      { name: 'Kicukiro', order: 3, fare: 250, lat: -1.9586, lng: 30.0772 },
      { name: 'Gikondo', order: 4, fare: 300, lat: -1.9467, lng: 30.0556 },
      { name: 'Kimihurura', order: 5, fare: 350, lat: -1.9553, lng: 30.0681 },
      { name: 'Kacyiru', order: 6, fare: 400, lat: -1.9472, lng: 30.0756 }
    ],
    coordinates: [
      { lat: -1.9536, lng: 30.0931 }, { lat: -1.9560, lng: 30.0922 },
      { lat: -1.9600, lng: 30.0914 }, { lat: -1.9595, lng: 30.0840 },
      { lat: -1.9586, lng: 30.0772 }, { lat: -1.9526, lng: 30.0664 },
      { lat: -1.9467, lng: 30.0556 }, { lat: -1.9510, lng: 30.0618 },
      { lat: -1.9553, lng: 30.0681 }, { lat: -1.9512, lng: 30.0718 },
      { lat: -1.9472, lng: 30.0756 }
    ]
  }
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    await Route.deleteMany({});
    console.log('Cleared existing routes');

    const created = await Route.insertMany(routes);
    console.log(`Seeded ${created.length} routes with coordinates and stops`);

    await mongoose.disconnect();
    console.log('Done');
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
}

seed();
