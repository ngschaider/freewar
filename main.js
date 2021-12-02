
var bot = {};
bot.active = false;
bot.routeState = 0;

var states = {
  "hunting": {
    name: "Hunting",
  },
  "selling": {
    name: "Selling",
  },
  "sellingInMenu": {
    name: "Selling (in Menu)",
    manualSwitch: true,
  },
  "healing": {
    name: "Healing",
  },
}

bot.init = function(){
    $("iframe[name=mainFrame]").on("load", bot.mainFrameRefresh);
    $("iframe[name=bannerFrame]").on("load", bot.injectHtml);
    bot.injectHtml();
};

bot.bannerFrame = function(){
    return $(frames.bannerFrame.document);
}

bot.itemFrame = function(){
    return $(frames.itemFrame.document);
}

bot.mapFrame = function(){
    return $(frames.mapFrame.document);
}

bot.mainFrame = function(){
    return $(frames.mainFrame.document);
}

bot.mainFrameRefresh = function() {
    if(bot.active){
        bot.setState();
        bot.doAction();
    }
}

bot.doAction = function(){
    // read all messages if there are any
    var aTags = bot.mainFrame().find("a:contains('Weiter')");
    if(aTags.length >= 1){
      bot.mainFrame()[0].defaultView.location.href = aTags.first().attr("href");
      return;
    }

    // open inv if its closed
    var el = bot.itemFrame().find("#opencloseinv");
    if(el.text() == "öffnen"){
      el.click();
      bot.itemFrame()[0].defaultView.location.href = el.attr("href");
      return;
    }


    var itemsData = bot.getItemsData();
    var personsData = bot.getPersonsData();
    var info = bot.getCharacterInfo();

    // kill all enemies we can defeat
    for(var i = 0; i < personsData.length; i++){
        if(bot.canBeKilled(personsData[i]) && personsData[i].isNpc){
            personsData[i].attackNpc.click();
            console.log("Killing "+personsData[i].name);
            return;
        } else {
            console.log("Can't kill "+personsData[i].name);
        }
    }

    // collect all the items
    if(itemsData.length != 0) {
      if(!itemsData[0].take.text().includes("Ernten")){ // dont take plants because we suppose we dont have enough knowledge
        itemsData[0].take.click();
        console.log("Taking "+itemsData[0].name);
        return;
      }
    }

    // if we reached destination then unset it.
    if(map.destination && map.destination.x == map.getPosition().x && map.destination.y == map.getPosition().y){
      map.destination = null;
    }

    // îf we got a destination move to it.
    if(map.destination){
      map.moveTo(map.destination);
      return;
    }

    // take actions according to current state
    if(bot.state == states.hunting){
      map.moveAlongRoute();
    } else if(bot.state == states.selling) {
      bot.openSellMenu();
    } else if(bot.state == states.sellingInMenu) {
      if(info.items.length > 0){
        bot.sellItem();
      } else {
        bot.state = states.hunting;
        bot.mainFrameRefresh();
      }
    } else if(bot.state == states.healing) {
      bot.heal();
    }
}

bot.itemAmountForMarket = function(items) {
  for(var i = 0; i < items.length; i++){
    if(config.market[items[i].name]){
      
    }
  }
}

bot.injectHtml = function(){
    var tr = bot.bannerFrame().find("tr");
    var td = tr.children("td").empty().clone();

    var startButton = $("<input type='button' style='background-color:green;' value='START'>");
    var stopButton = $("<input type='button' style='background-color:red;' value='STOP'>");
    var setDestinationButton = $("<input type='button' style='background-color:yellow;' value='SET_DEST'>");
    var debugButton = $("<input type='button' style='background-color:blue;' value='DEBUG'>");
    var statusText = $("<p>").text(bot.active ? "ON" : "OFF");

    setDestinationButton.click(function(){
      var destPos = prompt("Destination Coordinates X/Y: ").split("/");
      if(!destPos){
        map.destination = null;
        return;
      }
      console.log("destination set");
      map.destination = {
        x: parseInt(destPos[0]),
        y: parseInt(destPos[1]),
      };
    });
    startButton.click(function(){
      statusText.text("ON");
      bot.active = true;
      bot.routeState = 0;
      bot.mainFrameRefresh();
    });
    stopButton.click(function(){
      statusText.text("OFF");
      bot.active = false;
    });
    debugButton.click(function(){
      bot.sellItem();
    });

    td.append(debugButton);
    td.append(setDestinationButton);
    td.append(startButton);
    td.append(stopButton);
    td.append(statusText);
    tr.append(td);
};

bot.getPersonsData = function() {
    var personlisttd = bot.mainFrame().find("#personlisttd")
    var persons = personlisttd.children(".listusersrow");
    var personsData = [];

    for(var i=0; i < persons.length; i++){
        var listuser = persons.eq(i);
        var text = listuser.text();

        var personData = {};

        personData.isNpc = text.indexOf(" (NPC)") != -1;
        personData.name = listuser.find("b").text().substring(0, listuser.find("b").text().length-1);
        if(personData.isNpc){
            personData.attackNpc = listuser.find(".fastattack").first();
            var strengthIndex = text.indexOf("Angriffsstärke: ");
            personData.attackStrength = parseInt(text.substring(strengthIndex+"Angriffsstärke: ".length, text.length-1));
            personData.defenseStrength = 0;
            if(!npcLifePoints[personData.name]){
                console.error("Could not find npcLifePoints['"+personData.name+"'] !!");
                personData.health = 0;
            } else {
                personData.health = npcLifePoints[personData.name];
            }
        }
        personsData.push(personData);
    }

    return personsData;
}

bot.getItemsData = function() {
    var itemsData =  [];

    var items = bot.mainFrame().find(".listplaceitemsrow");
    for(var i = 0; i < items.length; i++){
        var itemData = {};
        itemData.name = items.eq(i).find("b").text();
        itemData.take = items.eq(i).find("a").first();
        itemsData.push(itemData);
    }

    return itemsData;
}

bot.canBeKilled = function(personData){
    // FaktorVerteidiger = LAngreifer / ( AVerteidiger - VAngreifer )
    // FaktorAngreifer = LVerteidiger / ( AAngreifer - VVerteidiger)
    // Größerer Faktor verliert

    if(!personData.health) return false; // assume we can't kill it if we dont know its health

    var info = bot.getCharacterInfo();
    var FaktorVerteidiger = info.health / (personData.attackStrength - info.defenseStrength);
    var FaktorAngreifer = personData.health / (info.attackStrength - personData.defenseStrength);

    if(info.defenseStrength >= personData.attackStrength){
      FaktorVerteidiger = info.health;
    }

    return FaktorAngreifer <= FaktorVerteidiger;
}

bot.getCharacterInfo = function(){
    var money = parseInt(bot.itemFrame().find("#listrow_money").text().substring("Geld: ".length));

    var healthText = bot.itemFrame().find("#listrow_lifep").text();
    var slashIndex = healthText.indexOf("/");

    healthText = healthText.replace("Lebenspunkte: (", "").replace(")", "").split("/");

    var health = parseInt(healthText[0]);
    var maxHealth = parseInt(healthText[1]);

    var attackStrength = parseInt(bot.itemFrame().find("#listrow_attackp").text().replace("Angriffsstärke: ", ""));
    var defenseStrength = parseInt(bot.itemFrame().find("#listrow_defensep").text().replace("Verteidigungsstärke: ", ""));

    var items = [];

    var itemEl = bot.itemFrame().find(".listcaption").eq(1);
    var itemCount = itemEl.text().replace("Inventar (", "").replace(" Items)", ""));

    for(var i = 0; i < itemCount; i++) {
      var itemEl = itemEl.next();
      items.push({
        name: itemEl.find(".itemname").text(),
        amount: itemEl.find(".itemamount").text().substring(),
      });
    }

    return {
        money: money,
        health: health,
        maxHealth: maxHealth,
        attackStrength: attackStrength,
        defenseStrength: defenseStrength,
        items: items,
    };
}

bot.shouldHeal = function(){
  var info = bot.getCharacterInfo();
  if(info.health <= config.healAt){
    return true;
  }
  return false;
}

bot.shouldSell = function(){
  var info = bot.getCharacterInfo();
  if(info.items.length >= config.sellItemsAt){
    return true;
  }
  return false;
}

bot.shouldHunt = function(){
  return !bot.shouldSell() && !bot.shouldHeal();
}

bot.setState = function(){
  // if we are in a state which can only be manually switched from and to dont do anything in this function
  if(bot.state && bot.state.manualSwitch){
    return;
  }

  var info = bot.getCharacterInfo();

  var pois = [];
  if(bot.shouldSell()){
    var sellPoi = config.sellItemsLocation;
    sellPoi.type = "sellItemsLocation";
    pois.push(sellPoi);
  }
  if(bot.shouldHeal()){
    var healPoi = config.healLocation;
    healPoi.type = "healLocation";
    pois.push(healPoi);
  }

  if(pois.length == 0){
    if(bot.state != states.hunting){
      bot.state = states.hunting;
      console.log("Enough health, not enough items. Going Hunting!");
    }
    return;
  } else {
    map.destination = map.getNearest(pois);
    if(map.destination.type == "healLocation"){
      if(bot.state != states.healing){
        bot.state = states.healing;
        map.destination = config.healLocation;
        console.log("Got "+info.health+" health. "+states.healing.name);
      }
    } else if(map.destination.type == "sellItemsLocation"){
      if(bot.state != states.selling){
        bot.state = states.selling;
        map.destination = config.sellItemsLocation;
        console.log("Got "+info.items.length+" items. "+states.selling.name);
      }
    }
  }
}

bot.openSellMenu = function(){
  var pos = map.getPosition();

  console.log("Opening Sell Menu");
  if(pos.x == 106 && pos.y == 95){ // Ferdolien - Der Blumenpavillon
    bot.mainFrame()[0].defaultView.location.href = bot.mainFrame().find(".areadescription a").eq(1).attr("href");
    bot.state = states.sellingInMenu;
  }
}

bot.sellItem = function(){
  var el = bot.mainFrame().find("td > input").first().parent();

  if(!el){
    return;
  }

  el.find("span").click(); // set the max amount of items to the input element
  el.find("a").click(); // trigger click event so the href attribte gets the actual amount of items from the input element
  console.log(el.find("a").attr("href"));
  bot.mainFrame()[0].defaultView.location.href = el.find("a").attr("href"); // navigate to href
}

bot.heal = function(){
  var pos = map.getPosition();

  console.log("Healing");
  if(pos.x == 100 && pos.y == 100){ // Konlir - Das Haupthaus
    bot.mainFrame()[0].defaultView.location.href = bot.mainFrame().find("a").eq(0).attr("href");
  }
}

$(document).ready(function(){
  	setTimeout(bot.init, 1000);
});
