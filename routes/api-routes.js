var amazonKeys = require("../key.js");
console.log(amazonKeys.secretAccessKey);
var aws = require('aws-sdk'),
  multer = require('multer'),
  multerS3 = require('multer-s3');

aws.config.update({
  secretAccessKey: process.env.S3_SECRET_KEY || amazonKeys.secretAccessKey,
  accessKeyId: process.env.S3_ACCESS_KEY || amazonKeys.accessKeyId,
  region: 'us-west-1'
});

var s3 = new aws.S3();

var upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: 'travelbookpictures',
    key: function(req, file, cb) {
      // console.log(file.originalname);
      cb(null, file.originalname); //use Date.now() for unique file keys
    }
  })
});

var db = require("../models");

module.exports = function(app) {

  app.post("/signup", function(req, res) {

    db.user.create({

      username: req.body.users,
      password: req.body.pws

    }).then(function(results) {

      console.log("user added");
      console.log(results);

      res.end();
    });
  });

  app.get("/login", function(req, res) {

    db.user.findAll({}).then(function(results) {

      // console.log("found user data");
      // console.log(results);

      res.json(results);
    });

  });

  app.get("/search/:country/:city/:categories", function(req, res) {

    db.post.findAll({

      where: {
        country: req.params.country,
        city: req.params.city,
        categories: req.params.categories,
      },
      include: [db.user]

    }).then(function(results) {

      // console.log(results);
      var data = {
        daty: results,
        city: req.params.city,
        country: req.params.country
      }

      console.log(data.daty);

      res.render("result", {
        data
      });
    });

  });

  app.post("/add", upload.array('upl', 1), function(req, res) {

    db.user.findOne({
      where: {
        username: req.body.user
      }
    }).then(function(results) {

      db.post.create({
        image: req.files[0].originalname,
        country: req.body.countryC,
        city: req.body.cityC,
        review: req.body.review,
        name: req.body.place,
        categories: req.body.category,
        price: parseInt(req.body.pricepoint),
        rating: parseInt(req.body.rating),
        userId: results.id

      }).then(function(results) {

        console.log(results.dataValues);

        res.redirect("/");
      });

    });

  });


  app.put("/loggedin", function(req, res) {

    db.user.update({

      loggedIn: true
    }, {

      where: {

        id: req.body.info
      }

    }).then(function(results) {

      res.end();

    });
  });

  app.get("/user", function(req, res) {

    db.user.findAll({}).then(function(results) {

      console.log(results);

      var data = {

        daty: results

      }

      console.log(data);

      res.render("userSearch", {
        data
      })

    });
  });


  app.get("/saved/:user", function(req, res) {

    db.user.findAll({
      where: {
        username: req.params.user
      },
      include: [db.post]
    }).then(function(results) {

      var userPost = {
        data: results[0].dataValues.posts
      }

      res.render('travelBooks', {
        userPost
      });

    });

  });

  app.get("/future/:user", function(req, res) {

    var username = req.params.user

    db.trip.findAll({

      where: {
        user: username
      },
      // include: [db.post]

    }).then(function(results) {
      //console.log(results[0].postIds.split(', '));

      var data = {
        // results is an array of all trips from user
        daty: results
      }

      for (var i=0; i < results.length; i++) {
        // convert string to array for postids
        results[i].postIds = results[i].postIds.split(', ');
      }

      // console.log(results[0].postIds);

      // run this function through each postIds list
      function findPost (postId) {
        var postIdInt = parseInt(postId);
        return db.post.findOne({
          where: {
            id: postIdInt
          }
        });
      }

      for (var i=0; i < results.length; i++) {
        var postInfo = [];
        // array of postids per trip
        var postIds = results[i].postIds;
        // console.log(postIds);
        var nestResult = results[i];
        for (var j=0; j < postIds.length; j++) {
          findPost(postIds[j]).then(function (result) {
            console.log(result);
            console.log('=========');
            postInfo.push(result);
            data[nestResult.tripName] = postInfo;
            console.log("229" + JSON.stringify(data[nestResult.tripName]));
            
          });
        }   
      }

      res.render('futureTrips', {
        data
      });

      });

    });


 app.post("/add/trip", function(req, res) {


    console.log(req.body.results);
    console.log(req.body.trip);
    console.log(req.body.user);


    db.trip.create({

      tripName: req.body.trip,
      user: req.body.user,
      postIds: req.body.results

    })
    .then(function(results2){
      res.end();
    })

});

  app.get("/edit/:user/:id", function(req, res) {

    db.post.findAll({
      where: {
        id: req.params.id
      },
    }).then(function(results) {

      var userPost = {
        data: results[0].dataValues.posts
      }

      res.render('updatePost', {
        userPost
      });

    });

  });


  app.delete("/deltrip", function(req, res) {


    console.log(req.body.id);

    var id = JSON.parse(req.body.id);

    db.trip.destroy({

      where:{

        postId: id
      }

    })

    res.end();

  });

};