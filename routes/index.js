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

/* GET Product Light Sources index */
router.get('/api/v1/product_light_source', function(req, res) {

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
        var query = client.query("SELECT * FROM product_light_sources ORDER BY id ASC;");

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

/* POST TO WARRANTY DATABASE ENDPOINT */
router.post('/api/v1/warranty_application', function(req, res) {

  // Grab data from http request
  var data = req.body;
      uniq_ref = 'this should change'

  var results = [];

    // Get a Postgres client from the connection pool
    pg.connect(connectionString, function(err, client, done) {
        // Handle connection errors
        if(err) {
          done();
          console.log(err);
          return res.status(500).json({ success: false, data: err});
        }

        // SQL Query > Insert Data
          client.query("INSERT INTO warranty_applications(warranty_type, company_name, contact_name, project_address, country, email, phone, who_are_you, vendor_name, date_of_purchase, date_of_install, quantity, installer_company_name, product_code, batch_number, reference, created_at, updated_at) values($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)", [data.warranty_type, data.company_name, data.contact_name, data.project_address, data.country, data.email, data.phone, data.who_are_you, data.vendor_name, data.date_of_purchase, data.date_of_install, data.quantity, data.installer_company_name, data.product_code, data.batch_number, uniq_ref, new Date(), new Date()], function(err, result) {
            if(err) {
              done();
              console.log(err);
              return res.status(400).json({success: false, data: err});
            }

            done();
            return res.json({status: 200, data: result});
          });
    });
});

/**
 * Set up send grid
 */

var sendgrid_username   = process.env.SENDGRID_USERNAME;
var sendgrid_password   = process.env.SENDGRID_PASSWORD;

var sendgrid   = require('sendgrid')(sendgrid_username, sendgrid_password);
var email      = new sendgrid.Email({to: 'info@fossled.eu'});

/* POST EMAILS ENDPOINT */
router.post('/email', function(req, res, next) {

  email.to      = req.body.to
  email.from    = req.body.from
  email.subject = req.body.subject
  email.text    = req.body.text

  sendgrid.send(email, function(err, json) {

    if (err) {
      console.log(err)
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
