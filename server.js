// Copyright (c) 2017 Luke San Antonio Bialecki
// All rights reserved

// Released under the BSD 2-Clause license

var express = require('express');
var path = require('path');

const yelp = require('yelp-fusion');

YELP_CLIENT_ID='qRzfu7UGUfcUKCe0TO5kkA';
YELP_CLIENT_SECRET='oP7VhvQYQjTdwGNIr3I8S0nUfjK3gnP3oUSpflWOHy7HaHqrJEixaKmOK9VE9Acd';

var access_token = null;

yelp.accessToken(YELP_CLIENT_ID, YELP_CLIENT_SECRET).then(response => {
    access_token = response.jsonBody.access_token
});

var app = express();

app.use('/public', express.static(path.join(__dirname, 'public')));
app.use('/', express.static(__dirname))

app.get('/yelp-search', function(req, res, err) {
    // wait for the server to get an access token from yelp.
    // TODO: Pick up some eye drops from the store, my eyes are bleeding out.
    while(access_token == null) {}

    var client = yelp.client(access_token);
    return client.search({
        latitude: req.query.latitude,
        longitude: req.query.longitude,
        limit: req.query.limit,
        offset: req.query.offset,
        radius: req.query.radius,
    }).then(response => {
        res.send(response.jsonBody);
    }).catch(e => {
        console.log(e);
    });
});

app.listen(8080, function() {
  console.log('Cesium-strava is now listening on 8080');
});
