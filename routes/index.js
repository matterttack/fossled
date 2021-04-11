var path = require('path');
var express = require('express');
var router = express.Router();
var pg = require('pg');
var _ = require("underscore");
var connectionString = process.env.DATABASE_URL || 'postgres://localhost/fossled_development';

const testFolder = './public/img/product_images';
const fs = require('fs');
var images = [];

// Makes an array of file names in the product_images folder
// We later use this to append an array to product collection resources
fs.readdir(testFolder, (err, files) => {
  files.forEach(file => {
    images.push(file);
  });
})

// Filter which take a query and returns true for a string which contains that query followed by a non 
function filterImages(query) {
  regEx = `${query}(\\W+)`

  return images.filter(function(string, index) {
    var pattern = new RegExp(regEx, "g");
    if(string.match(pattern)) {
      return true
    }
  })
}

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
          // Search through the images array and add any extra images found in the product_images folder which match the products nominal code
            product_images = []
            product_images = filterImages(row.nominal_code);
            row['product_images'] = product_images
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
            product_images = []
            product_images = filterImages(row.nominal_code);
            row['product_images'] = product_images
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
  
  console.log('api route called');
  console.log(connectionString);
  
    var results = [];

    // Get a Postgres client from the connection pool
    pg.connect(connectionString, function(err, client, done) {
      console.log('connected to pg')
        // Handle connection errors
        if(err) {
          console.log('connection error encountered');
          done();
          console.log(err);
          return res.status(500).json({ success: false, data: err});
        }

        // SQL Query > Select Data
        var query = client.query("SELECT * FROM product_collections ORDER BY order_rank ASC;");
      
      console.log(query);
      
        // Stream results back one row at a time
        query.on('row', function(row) {
          console.log('streaming results');
          console.log(row);
            results.push(row);
        });

        // After all data is returned, close connection and return results
        query.on('end', function() {
          console.log('all data received');
          console.log(results);
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
          // sub_cats.sort(function(a, b){
          //     if(a < b) return -1;
          //     if(a > b) return 1;
          //     return 0;
          // })

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

// var sendgrid_username   = process.env.SENDGRID_USERNAME;
// var sendgrid_password   = process.env.SENDGRID_PASSWORD;

/* POST EMAILS ENDPOINT */
router.post('/email', function(req, res, next) {

var helper = require('sendgrid').mail;

var from_email = new helper.Email(req.body.from)
var to_email = new helper.Email('info@fossled.eu')
var subject = req.body.subject
var content = new helper.Content('text/plain', req.body.text)
var mail = new helper.Mail(from_email, subject, to_email, content)

var sg = require('sendgrid')(process.env.SENDGRID_API_KEY);
var request = sg.emptyRequest({
  method: 'POST',
  path: '/v3/mail/send',
  body: mail.toJSON(),
});


sg.API(request, function(error, response) {
  console.log(response.statusCode);
  console.log(response.body);
  console.log(response.headers);
    if (error) {
      console.log(error)
      return next(error);
    }
    return res.send(response);
})

})

/* GET all other routes to angular homepage */
router.get('/*', function(req, res, next) {
  res.sendFile(path.join(__dirname, '../public', 'index.html'));
});

module.exports = router;
