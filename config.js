  var npcLifePoints = {
    "Hase": 2,
    "Schattenwiesel": 2,
    "Milchkuh": 3,
    "kleines Schaf": 5,
    "Kaklatron": 7,
    "Sprungechse": 7,
    "Blumenbeißer": 7,
    "Silberfuchs": 8,
    "Phasenwiesel": 8,
    "kleines Schlangentier": 8,
    "Feuerwolf": 9,
    "Wawruz": 10,
    "Waldvogel": 10,
    "Phasenratte": 10,
    "kleines Reen": 10,
    "Riesenlibelle": 10,
    "durstige Riesenlibelle": 10,
    "Phasenvogel": 13,
    "Phasenkuh": 15,
    "Waldschlurch": 15,
    "Phasenmücke": 18,
    "Phasenschabe": 18,
    "Wühlratte": 20,
    "Salzwasservogel": 20,
    "kleiner Laubbär": 20,
    "kleiner Phasenbär": 25,
    "Phasenlurch": 27,
    "Wasserbär": 35,
    "Phasenmade": 35,
    "Phasenschleim": 36,
    "Busch-Frul": 55,
    "Phasenschnecke": 55,
    "Donnersandschlange": 60,
    "Phasenfuchs": 61,
    "Geist von Pur Pur": 130,
    "Phasenkrokodil": 160,
    "Phasenwolf": 630,
    "Schachtelmesserfarn": 700,
    "Phasengarnele": 1101,
    "Phasengreifer": 3500,
    "Phasentiger": 5300,
    "Phasenkrake": 39000,
    "Phasenskorpion": 23000,
    "Phasenhummer": 260000,
    "Phasenqualle": 950000,
    "Phasenspinne": 320,
};

/*var dir = {
    "u": {x:0, y:-1},
    "r": {x:1, y:0},
    "d": {x:0, y:1},
    "l": {x:-1, y:0},
    "ur": {x:1, y:-1},
    "dr": {x:1, y:1},
    "ul": {x:-1, y:-1},
};*/


/*
*  CONFIG BEGIN
*/

var config = {};

config.route = [
  {x: 99, y: 101},
  {x: 100, y: 102},
  {x: 101, y: 101},
  {x: 102, y: 101},
  {x: 102, y: 99},
  {x: 101, y: 99},
  {x: 101, y: 100},
  {x: 100, y: 101},
];

config.route = [
  {x: 102, y: 100},
  {x: 105, y: 95},
  {x: 99, y: 101},
  {x: 102, y: 101},
];

config.sellItemsAt = 10; // sell items when X amount reached

config.sellItemsLocation =  { // sell items at 'Ferdolien - Der Blumenpavillon'
  x: 106,
  y: 95,
};

config.healAt = 2; // heal when X health or less reached

config.healLocation = { // heal here
  x: 100,
  y: 100,
};


config.market = {
  "Kuhkopf": 35,
};

config.marketLocation = {
  x: 96,
  y: 101,
};

/*
*  CONFIG END
*/
