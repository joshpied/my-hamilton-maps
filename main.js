// Sets map height:
$( document ).ready(function() {
    $(window).ready(updateHeight);
    $(window).resize(updateHeight);

    function updateHeight() {
        // map and list in template
        var map = $('#map'),
            listContainer = $('#userLocations');
        // header height calculated
        var headerHeight = $('header').height();
        // window height calculated
        var windowHeight = $(window).height() - 320;
        // map height set
        map.css('height', (windowHeight));
        // list height set
        listContainer.css('max-height', (windowHeight));
    }
});

// Variables declared
let map,
    infobox,
    pushpins = [],
    travelPlaces = [],
    accommodationPlaces = [],
    restaurantPlaces = [],
    activitiesPins = [],
    userPins = [];

// On load:
// map created, infobox created, variables filled with data from data.js,
// travelPins is default data on display
function loadMap() {

    map = new Microsoft.Maps.Map(document.getElementById('map'), {});
    infobox = new Microsoft.Maps.Infobox(map.getCenter(), {
        visible: false
    });
    infobox.setMap(map);

    travelPlaces = TRAVEL_DATA;
    accommodationPlaces = ACCOMMODATION_DATA;
    restaurantPlaces = RESTAURANT_DATA.businesses;
    activitiesPins = ACTIVITIES_DATA;
    setTravelPins(true);
}

/**
 * Filter for displaying transportation hubs in the city
 * @param isFirstTimeLoading when false the progress bar is at 20%
 */
function setTravelPins(isFirstTimeLoading) {

    if (!isFirstTimeLoading) {
        document.getElementById('progressBar').style.width = '20%';
        document.getElementById('progressBar').setAttribute("aria-valuenow",'20');
    }
    infobox.setMap(null);
    displayMyMapPageElements(false);

    removeAllPins();

    travelPlaces.forEach((place, index) => {

        pushpins.push(
            new Microsoft.Maps.Pushpin(
                new Microsoft.Maps.Location(place.latitude, place.longitude),
                {
                    title: place.name,
                    icon: 'assets/' + travelPlaces[index].type + '.png',
                    anchor: new Microsoft.Maps.Point(10, 10)
                }
            )
        );
        pushpins[index].metadata = {
            name: travelPlaces[index].name,
            type: travelPlaces[index].type,
            address: travelPlaces[index].address,
            website: travelPlaces[index].website,
            phone: travelPlaces[index].phone
        };

        Microsoft.Maps.Events.addHandler(pushpins[index], 'click', pushpinClicked);

    });

    map.entities.push(pushpins);
}

/**
 * Creates infobox for a pushpin when clicked
 * Note: Different infobox for restaurants than for other filters
 */
function pushpinClicked(e) {
    // Previous infobox removed from map
    infobox.setMap(null);
    // New infobox created and set
    infobox = new Microsoft.Maps.Infobox(map.getCenter(), {visible: true});
    infobox.setMap(map);

    // Specific infobox details are filled
    // RESTAURANT PINS:
    if (e.target.metadata.rating) {
        infobox.setOptions({
            location: e.target.getLocation(),
            title: e.target.metadata.name,
            description: '<div style="font-family: Arial;"><h6>' + e.target.metadata.address + '</h6>' +
            '<h6>'+ e.target.metadata.phone +'</h6><a href="' + e.target.metadata.website + '" target="_blank">' + 'Visit Yelp' + '</a>' +
            '<img style="float: right;" src="' + e.target.metadata.rating + '"</></div>',
            actions: [{label: '+ Add to my map', eventHandler: function(){
                    pinAddedToMyMap(e.target);
                }}
            ],
            maxWidth: 500,
            maxHeight: 600,
            visible: true
        });
    }
    // ALL OTHER PINS:
    else {
        infobox.setOptions({
            location: e.target.getLocation(),
            title: e.target.metadata.name,
            description: '<div style="font-family: Arial;"><h6>' + e.target.metadata.address + '</h6>' +
            '<h6>'+ e.target.metadata.phone +'</h6><a href="'+e.target.metadata.website+'" target="_blank">' + 'Visit Website' + '</a></div>',
            actions: [{label: "+ Add to my map", eventHandler: function(){
                    pinAddedToMyMap(e.target);
                }}],
            maxWidth: 500,
            maxHeight: 600,
            visible: true
        });
    }
}

/**
 * A pin is added to a user's custom map and they are notified,
 * or they are notified the selected pin is already in their locations list
 * @param pin
 */
function pinAddedToMyMap(pin) {
    const warning = document.getElementById('locationWarning');
    const success = document.getElementById('locationSuccess');

    // location gets added
    if (userPins.indexOf(pin) == -1) {
        userPins.push(pin);
        warning.style.display = 'none';
        success.style.display = 'block';
        success.innerHTML = `<i class="fa fa-check"></i> ${pin.metadata.name} added!`;
    }
    // location already in user's list
    else {
        success.style.display = 'none';
        warning.style.display = 'block';
        warning.innerHTML = `<i class="fas fa-exclamation-triangle"></i> ${pin.metadata.name} is already in your map!`;
    }
}

/**
 * Filter for displaying user's custom map
 */
function setUserPins() {
    infobox.setMap(null);
    removeAllPins();
    displayMyMapPageElements(true);

    const
        userLocations = document.getElementById('userLocations'),
        list = document.getElementById('userLocationsList');

    // When user has no added locations
    if (userPins.length === 0) {
        document.getElementById('locationWarning').style.display = 'block';
        document.getElementById('locationWarning').innerHTML= '<i class="fas fa-exclamation-triangle"></i> Your map is empty!';
        userLocations.style.display = 'hidden';
    }
    // user has locations added
    else {
        // LOCATION LIST RIGHT OF MAP
        userLocations.style.display = 'block';
        list.innerHTML = '';
        userPins.forEach((pin, index) => {
            list.innerHTML +=
                `<div class="col-xs-12 location-list-item">
                <h4>${index + 1} ${pin.metadata.name}</h4> 
                <h4 class="text-muted">
                    <img src="assets/${pin.metadata.kind ? pin.metadata.kind : pin.metadata.type}.png"/> 
                    ${pin.metadata.kind ? pin.metadata.kind + ' - ' : ''} ${pin.metadata.type}
                </h4>
                <h5>
                    ${pin.metadata.address}
                </h5>
                <h5>
                    ${pin.metadata.phone}
                </h5>
                <h5 class="locationListWebsite">
                    <a href="${pin.metadata.website}" target="_blank">
                        Visit ${pin.metadata.kind === 'Restaurant' ? 'Yelp' : 'Website'}
                    </a>
                </h5>
            </div>`;
        });

        // MAP PINS
        removeAllPins();
        map.entities.push(userPins);
    }
}

/**
 * Displays certain elements that are only used when user has clicked on myMap, or removes them otherwise
 * Elements include: changing progress bar percentage to 100%, right side nav holding location list
 * @param shouldDisplay controls when elements are shown or not
 */
function displayMyMapPageElements(shouldDisplay) {
    const
        progressBar = document.getElementById('progressBar'),
        mapContainer = document.getElementById('mapContainer'),
        userLocations = document.getElementById('userLocations'),
        rightNav = document.getElementById('rightNav'),
        warning = document.getElementById('locationWarning'),
        success = document.getElementById('locationSuccess');

    warning.style.display = 'none';
    success.style.display = 'none';

    if (shouldDisplay) {
        progressBar.style.width = '100%';
        progressBar.setAttribute("aria-valuenow", '100');
        rightNav.style.display = 'inline';
        if (userPins.length > 0) {
            mapContainer.className = 'col-md-9';
        }
    } else {
        rightNav.style.display = 'none';
        userLocations.style.display = 'none';
        mapContainer.className = 'col-md-12';
    }
}

/**
 * Filter displaying available hotels, b&bs etc.
 */
function setAccommodationPins() {
    infobox.setMap(null);
    document.getElementById('progressBar').style.width = '40%';
    document.getElementById('progressBar').setAttribute("aria-valuenow",'40');
    displayMyMapPageElements(false);

    // Pins removed
    removeAllPins();

    // Accommodations staged to be placed on the map
    accommodationPlaces.forEach((place, index) => {

        pushpins.push(
            new Microsoft.Maps.Pushpin(
                new Microsoft.Maps.Location(place.latitude, place.longitude),
                {
                    title: place.name,
                    icon: 'assets/Accommodation.png',
                    anchor: new Microsoft.Maps.Point(10, 10),
                }
            )
        );

        pushpins[index].metadata = {
            name: accommodationPlaces[index].name,
            type: accommodationPlaces[index].type,
            address: accommodationPlaces[index].address,
            website: accommodationPlaces[index].website,
            phone: accommodationPlaces[index].phone,
            kind: 'Accommodation'
        };

        Microsoft.Maps.Events.addHandler(pushpins[index], 'click', pushpinClicked);

    });

    // Accommodations placed on the map
    map.entities.push(pushpins);
}

/**
 * Filter displays restaurants
 */
function setRestaurantPins() {
    infobox.setMap(null);
    document.getElementById('progressBar').style.width = '60%';
    document.getElementById('progressBar').setAttribute("aria-valuenow",'60');
    displayMyMapPageElements(false);

    // Pins removed
    removeAllPins();

    // Accommodations staged to be placed on the map
    restaurantPlaces.forEach((place, index) => {

        pushpins.push(
            new Microsoft.Maps.Pushpin(
                new Microsoft.Maps.Location(place.latitude, place.longitude),
                {
                    title: place.name,
                    icon: 'assets/Restaurant.png',
                    anchor: new Microsoft.Maps.Point(10, 10)
                }
            )
        );

        pushpins[index].metadata = {
            name: restaurantPlaces[index].name,
            type: restaurantPlaces[index].categories[0].title,
            kind: 'Restaurant',
            address: restaurantPlaces[index].location.address1 + ' ' + restaurantPlaces[index].location.city + ' ' + restaurantPlaces[index].location.state + ' ' + restaurantPlaces[index].location.zip_code,
            website: restaurantPlaces[index].url,
            phone: restaurantPlaces[index].display_phone,
            rating: 'assets/ratings/small_' + restaurantPlaces[index].rating + '.png',
        };

        Microsoft.Maps.Events.addHandler(pushpins[index], 'click', pushpinClicked);

    });

    // Accommodations placed on the map
    map.entities.push(pushpins);
}

/**
 * Filter for activities in the city: art galleries, malls. museums etc.
 */
function setActivitiesPins() {
    infobox.setMap(null);
    document.getElementById('progressBar').style.width = '80%';
    document.getElementById('progressBar').setAttribute("aria-valuenow",'80');
    displayMyMapPageElements(false);

    // Pins removed
    removeAllPins();

    // Accommodations staged to be placed on the map
    activitiesPins.forEach((place, index) => {

        pushpins.push(
            new Microsoft.Maps.Pushpin(
                new Microsoft.Maps.Location(place.latitude, place.longitude),
                {
                    title: place.name,
                    icon: 'assets/' + place.type + '.png',
                    anchor: new Microsoft.Maps.Point(10, 10)
                }
            )
        );

        pushpins[index].metadata = {
            name: activitiesPins[index].name,
            type: activitiesPins[index].type,
            address: activitiesPins[index].address ? activitiesPins[index].address : '',
            website: activitiesPins[index].website ? activitiesPins[index].website : '#',
            phone: activitiesPins[index].phone ? activitiesPins[index].phone : '',
            water_source: activitiesPins[index].water_source ? activitiesPins[index].water_source : ''
        };

        Microsoft.Maps.Events.addHandler(pushpins[index], 'click', pushpinClicked);

    });

    // Accommodations placed on the map
    map.entities.push(pushpins);
}

/**
 * Sets the pushpins array back to empty and removes the pin entities from the map
 */
function removeAllPins() {
    pushpins = [];

    for (var i = map.entities.getLength() - 1; i >= 0; i--) {
        var pushpin = map.entities.get(i);
        if (pushpin instanceof Microsoft.Maps.Pushpin) {
            map.entities.removeAt(i);
        }
    }
}

/**
 * Opens print dialog
 */
function printPage() {
    infobox.setMap(null); // closes any open info windows
    // re-centers map to Hamilton
    map.setView({
        center: new Microsoft.Maps.Location(43.20,-79.83),
        zoom: 12
    });
    setTimeout(timer => {
        window.print();
    }, 500);
}