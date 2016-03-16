var pg = require('pg');
var connectionString = process.env.DATABASE_URL || 'postgres://localhost:5432/fossled_development';

var client = new pg.Client(connectionString);
client.connect(function(err) {
  if (err) throw err;
  console.log('Connected to postgres!');
});
