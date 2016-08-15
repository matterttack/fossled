var path = require('path');
var express = require('express');
var router = express.Router();
var pg = require('pg');
var _ = require("underscore");
var connectionString = process.env.DATABASE_URL || 'postgres://localhost/fossled_development';

/* GET Product Collections index */
router.get('/api/v1/product_collections', function(req, res) {

    var results = [];

    // Get a Postgres client from the connection pool
    pg.connect(connectionString, function(err, client, done) {
        // Handle connection errors
        if(err) {
          done();
          console.log(err);
          return res.status(500).json({ success: false, data: err});
        }

        // SQL Query > Select Data
        var query = client.query("SELECT * FROM product_collections ORDER BY id ASC;");

        // Stream results back one row at a time
        query.on('row', function(row) {
            results.push(row);
        });

        // After all data is returned, close connection and return results
        query.on('end', function() {
            done();
            return res.json(results);
        });

    });

});

/* GET Product Collection by ID */
router.get('/api/v1/product_collections/:product_collection_id', function(req, res) {

    var results = [];

    // Grab data from the URL parameters
    var id = req.params.product_collection_id;

    // Get a Postgres client from the connection pool
    pg.connect(connectionString, function(err, client, done) {
        // Handle connection errors
        if(err) {
          done();
          console.log(err);
          return res.status(500).json({ success: false, data: err});
        }

        // SQL Query > Select Data
        var query = client.query("SELECT * FROM product_collections WHERE id=($1)", [id]);

        // Stream results back one row at a time
        query.on('row', function(row) {
            results.push(row);
        });

        // After all data is returned, close connection and return results
        query.on('end', function() {
            done();
            return res.json(results);
        });

    });

});

/* GET Product Light Sources by Nominal Code */
router.get('/api/v1/product_light_source/:nominal_code', function(req,res) {

  var results = [];

  // Grab data from the URL parameters
  var nominal_code = req.params.nominal_code;

  // Get a Postgres client from the connection pool
  pg.connect(connectionString, function(err, client, done) {
    // Handle connection errors
    if (err) {
      done();
      console.log(err);
      return res.status(500).json({ success: false, data: err});
    }

    // SQL Query > Select Data
    var query = client.query("SELECT * FROM product_light_sources WHERE nominal_code=($1)", [nominal_code]);

    // Stream the results back one row at a time
    query.on('row', function(row) {
      results.push(row);
    });

    // After all data is returned close the connection and return results
    query.on('end', function() {
      done();
      return res.json(results);
    });

  });

});

/* GET trees */
router.get('/api/v1/trees', function(req, res) {

    var results = [];

    // Get a Postgres client from the connection pool
    pg.connect(connectionString, function(err, client, done) {
        // Handle connection errors
        if(err) {
          done();
          console.log(err);
          return res.status(500).json({ success: false, data: err});
        }

        // SQL Query > Select Data
        var query = client.query("SELECT * FROM product_collections ORDER BY id ASC;");

        // Stream results back one row at a time
        query.on('row', function(row) {
            results.push(row);
        });

        // After all data is returned, close connection and return results
        query.on('end', function() {
            done();
            buildTree();
        });

    });

    var buildTree = function() {
      // Pluck the environments
      var envs = _.uniq(_.pluck(results, 'environment'));
      var a = [];

      // Iterate over environments, pluck the categories, and build the first branch
      envs.forEach(function(environment) {
        var ca = [];
        var categories = _.uniq(_.pluck(_.where(results, {environment: environment}), 'category'));
        a.push({name: environment, style: 'Environment', subtree: categories});
      })

      var ha = [];

      a.forEach(function(env) {
        var h = env;
        var ca = [];

        env.subtree.forEach(function(cat) {
          var sub_cats = _.uniq(_.pluck(_.where(results, {environment: env.name, category: cat}), 'sub_category'));

          // Sort them alphabetically
          sub_cats.sort(function(a, b){
              if(a < b) return -1;
              if(a > b) return 1;
              return 0;
          })

          var sa = [];
          sub_cats.forEach(function(sub_cat) {
            var series = _.uniq(_.pluck(_.where(results, {environment: env.name, category: cat, sub_category: sub_cat}), 'series'));
            sa.push({name: sub_cat, style: 'sub_category', series: series});
          });
          ca.push({name: cat, style: 'category', subtree: sa});
        });
        h.subtree = ca;
        ha.push(h);
      });

      return res.json(ha);
    }

});

/**
 * Set up send grid
 */

var sendgrid_username   = process.env.SENDGRID_USERNAME;
var sendgrid_password   = process.env.SENDGRID_PASSWORD;

var sendgrid   = require('sendgrid')(sendgrid_username, sendgrid_password);
var email      = new sendgrid.Email({to: 'info@fossled.eu'});

router.post('/email', function(req, res, next) {

  email.to      = req.body.to
  email.from    = req.body.from
  email.subject = req.body.subject
  email.text    = req.body.text

  sendgrid.send(email, function(err, json) {

    if (err) {
      return next(err);
    }

    return res.send(json);
  });

})

/* GET all other routes to angular homepage */
router.get('/*', function(req, res, next) {
  res.sendFile(path.join(__dirname, '../public', 'index.html'));
});

module.exports = router;
