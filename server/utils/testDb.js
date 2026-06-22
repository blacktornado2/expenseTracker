const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongo;

module.exports = {
  connect: async () => {
    mongo = await MongoMemoryServer.create();
    await mongoose.connect(mongo.getUri());
  },
  clearDatabase: async () => {
    const { collections } = mongoose.connection;
    for (const key of Object.keys(collections)) {
      await collections[key].deleteMany({});
    }
  },
  closeDatabase: async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    if (mongo) await mongo.stop();
  },
};
