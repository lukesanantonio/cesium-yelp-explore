// Copyright (c) 2017 Luke San Antonio Bialecki
// All rights reserved

// Released under the BSD 2-Clause license

const DEADZONE = .12;

Cesium.BingMapsApi.defaultKey = 'AlmGGd7X7C5Xwee0085LzpXYuGTaifDSGRGAlR_Ahbw8jRGCm0Sdk4SbGe2XsGXq';
var viewer = new Cesium.Viewer('cesiumContainer');
var scene = viewer.scene;
var canvas = viewer.canvas;
canvas.setAttribute('tabindex', 0);
canvas.onclick = function() {
    canvas.focus();
};

var startingPosition = {
    x: -75.62898254394531, y: 40.02804946899414, z: 40.0
}

var planeDiff = {
    x: 0.0, y: 0.0, z: 0.0
}

var plane = viewer.entities.add({
    position: Cesium.Cartesian3.fromDegrees(startingPosition.x, startingPosition.y, startingPosition.z),
    model: {
        uri: 'data/CesiumAir/Cesium_Air.gltf',
    }
});

viewer.trackedEntity = plane;

function lerp3D(a, b, c, x1, y1, z1, x2, y2, z2) {
    var scale = (c - a) / (b - a);
    var xval = ((x2 - x1) * scale) + x1;
    var yval = ((y2 - y1) * scale) + y1;
    var zval = ((z2 - z1) * scale) + z1;
    return {x: xval, y: yval, z: zval }
}

var val = null;
viewer.clock.onTick.addEventListener(function(e) {
    var gamepad = navigator.getGamepads()[0];
    if(gamepad !== null) {
        var forward = -gamepad.axes[1];
        if(Math.abs(forward) > DEADZONE) {
            planeDiff.x += forward * .000075;
            plane.position = Cesium.Cartesian3.fromDegrees(
                startingPosition.x + planeDiff.x,
                startingPosition.y + planeDiff.y,
                startingPosition.z + planeDiff.z
            );
            Cesium.Cartesian3(forward * .001, 0.0, 0.0);
        }
    }
});

viewer.camera.moveEnd.addEventListener(function(e) {

    // TODO: Sample the camera's edge locations and figure out a latitude and
    // longitude range.

    // Don't bother with the curvature of the earth, for large zooms it won't
    // matter and for big areas we can't even search a very large area such that
    // it will cause too many issues.

    var globe = scene.globe.ellipsoid;
    var near = viewer.camera.pickEllipsoid(
        new Cesium.Cartesian2(0,0), globe
    );

    var far = viewer.camera.pickEllipsoid(
        new Cesium.Cartesian2(canvas.width, canvas.height), globe
    );

    // Dist in meters
    // var dist = Cesium.Cartesian3.distance(near, far);
    var dist = 20000;

    var pos = viewer.camera.positionCartographic;
    var xhr = new XMLHttpRequest();
    var posLat = pos.latitude * 180.0 / Math.PI;
    var posLong = pos.longitude * 180.0 / Math.PI;

    var url = '/yelp-search?latitude=' + posLat + '&longitude=' + posLong
        + '&radius=' + Math.min(40000, Math.trunc(dist / 2.0))
        + '&limit=50&offset=0';

    xhr.open('GET', url);
    xhr.send();
    xhr.onreadystatechange = function() {
        if(xhr.readyState === XMLHttpRequest.DONE && xhr.status === 200) {
            var json = JSON.parse(xhr.responseText);

            // Make a bunch of pins and attach them to entities
            var pinBuilder = new Cesium.PinBuilder();
            for(var i = 0; i < json.businesses.length; ++i) {
                var business = json.businesses[i];

                if(viewer.entities.getById(business.id)) {
                    // The business is already there
                    //console.log('INFO business ' + business.id +
                                //' already exists');
                    continue;
                }

                var lerpRes = lerp3D(0.0, 5.0, business.rating,
                                     1.0, 0.0, 0.0,
                                     0.0, 1.0, 0.6);
                var pin = pinBuilder.fromColor(new Cesium.Color(lerpRes.x,
                                                                lerpRes.y,
                                                                lerpRes.z,
                                                                1.0), 40);

                var bizLat = business.coordinates.latitude;
                var bizLong = business.coordinates.longitude;

                var entity = new Cesium.Entity({
                    id: business.id,
                    name: business.name,
                    position: new Cesium.Cartesian3.fromDegrees(bizLong, bizLat, 0.0),
                    billboard: {
                        image: pin
                    }
                });

                viewer.entities.add(entity);

                //console.log('added ' + business.name);
            }
        }
    };
});
