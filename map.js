 var map = {}

map.size = 150;
map.width = map.size;
map.height = map.size;
map.dataOffset = 0;
map.data = [];
map.pathFindingReady = false;
map.easystar = new EasyStar.js();

map.parseMapData = function(cb){
  $.ajax({
    url: "http://localhost:8000/maplist.csv",
  })
  .done(function(data) {
    for(var line of data.split("\n")){
      var data = line.split(";");
      var mapTile = {
        //id: parseInt(data[2]) + parseInt(data[3])*map.width,
        name: data[0],
        accessible: parseInt(data[1]),
        x: parseInt(data[2]),
        y: parseInt(data[3]),
        npc: data[4],
        imageUrl: data[5],
      }
      if(mapTile.x < 0 || mapTile.y < 0 || mapTile.x > map.width || mapTile.y > map.height){
        continue;
      }
      if(!map.data[mapTile.x]){
        map.data[mapTile.x] = [];
      }
      map.data[mapTile.x][mapTile.y] = mapTile;
    }
    cb();
  });
}

/*map.getTileById = function(id){
  var x = id % map.width;
  var y = (id - x) / map.width;
  return map.data[x][y];
}*/

map.move = function(direction){
  console.log("Waiting "+map.getMoveTimeout()+" seconds for Move Timeout...");
  setTimeout(function(){
    if(bot.active){
      var pos = map.getPosition();
      console.log("Moving to " + (pos.x + direction.x) + "/" + (pos.y + direction.y));
      bot.mapFrame()[0].defaultView.Move(direction.x,direction.y);
    }
  }, map.getMoveTimeout()*1000);
}

map.destination = null;

map.getPath = function(endPoint){
  if(!map.pathFindingReady){
    console.error("Path Finding not ready yet!");
    return;
  }

  var pos = map.getPosition();
  return map.easystar.findPathSync(pos.x, pos.y, endPoint.x, endPoint.y);
}

map.moveTo = function(endPoint){
  //map.destination = endPoint;
  var path = map.getPath(endPoint);
  var pos = map.getPosition();

  if(path == null){
    console.log("no path found to ("+endPoint.x+"/"+endPoint.y+") for map.moveTo()");
  } else {
    if(path.length >= 2){
      map.move({
        x: path[1].x-pos.x,
        y: path[1].y-pos.y
      });
    }
  }
}

map.getPosition = function(){
    var text = bot.mapFrame().find(".positiontext").text();
    var indexOfY = text.indexOf(" Y: ");
    var x = text.substring(" Position X: ".length, indexOfY);
    var y = text.substring(indexOfY+" Y: ".length);

    return {
      x: parseInt(x),
      y: parseInt(y)
    };
}

map.getMoveTimeout = function(){
    var delayText = bot.mapFrame().find("#test").first().text();
    if(!delayText){
        return 0;
    }
    return parseInt(delayText.replace("Du kannst in ", "").replace(" Sekunden weiterreisen", ""));
}

map.moveAlongRoute = function(){
    console.log("Moving along route");

    map.destination = config.route[bot.routeState];
    bot.routeState++;
    if(bot.routeState >= config.route.length){
       bot.routeState = 0;
    }
    bot.mainFrameRefresh();
}

map.getNearest = function(positions){
  if(positions.length == 1){
    return positions[0];
  }

  var distances = [];
  for(var i = 0; i < positions.length; i++){
    var path = map.getPath(positions[i]);
    if(path == null){
      console.error("no path found to ("+positions[i].x+"/"+positions[i].y+") for map.getNearest()");
      return;
    }
    distances.push(path.length);
  }

  for(var i = 0; i < positions.length; i++){
    positions[i].distance = distances[i];
  }
  positions.sort(function(a, b){
    return a.distance - b.distance;
  });

  return positions[0];
}


map.parseMapData(function() {
  var accessible = [];
  var grid = [];

  for(var x = 0; x < map.width; x++){
    for(var y = 0; y < map.height; y++){
      if(!grid[y]){
        grid[y] = [];
      }
      if(map.data[x] && map.data[x][y]){
        grid[y][x] = map.data[x][y].accessible;
      } else {
        grid[y][x] = 0; // fill empty spots with non accessible tiles
      }
    }
  }

  map.easystar.enableDiagonals();
  map.easystar.setGrid(grid);
  map.easystar.setAcceptableTiles([1]); // tiles labeled with 1 are accessible
  map.easystar.enableSync();

  map.pathFindingReady = true;
  console.log("Path Finding is Ready!");
});
