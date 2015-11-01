var processedKey = "processedEmbers";
var mapKey = "frequencyMap";
var total = 0;

chrome.tabs.getSelected(null, function(tab) {
    if(tab.url.indexOf("twitch.tv") < 0) {
      $("#message").text("Sorry, this extension only works on Twitch.tv.");
    }
    else {
      // This is like "main"
      chrome.storage.sync.remove([processedKey, mapKey], function() {
        var timer = setInterval(readChat, 12 * 1000); // fetch new chat lines every 12 seconds
        //var cleaner = setInterval(clearStorage, 5 * 60 * 1000); // reset set and map after 5 minutes
      });
      readChat();
    }
});

chrome.runtime.onMessage.addListener(function(request, sender) {
  if (request.action == "getSource") {
    //var date = Date.now();
    var el = $( '<div></div>' );
    el.html(request.source);
    var chatRoom = $('.chat-lines', el)[0];
    chrome.storage.sync.get(mapKey, function(mapObj) {
      chrome.storage.sync.get(processedKey, function(procObj) {
        var set = procObj[processedKey];
        if(!procObj[processedKey]) {
          set = {};
          console.log("Could not find storage element with processedKey.");
        }
        var freqMap = mapObj[mapKey];
        if(!procObj[processedKey]) {
          freqMap = {};
          console.log("Could not find storage element with mapKey.");
        }
        $(chatRoom).children().each(function() {
          var li = $(this).find("li");
          var time = $(li).find(".timestamp").text();
          //var hours = parseInt(time.substring(0, time.indexOf(":")));
          //var minutes = parseInt(time.substring(time.indexOf(":") + 1));
          var id = $(li).attr("id");
          id = parseInt(id.substring(5)); //since ember is 5 characters, so ember1532 will become 1532
          var message = $(li).find(".message").text().trim();
          if(!set[id] && message !== "") {
            set[id] = true;  
            if(!freqMap[message]) freqMap[message] = 0;
            freqMap[message] = freqMap[message] + 1;
            total++;
          }
          else if(set[id]) console.log("WOOP WOOP");
        });
        var obj = {};
        obj[processedKey] = set;
        obj[mapKey] = freqMap;
        console.log(freqMap);
        //console.log(set);
        console.log(total);
        var keysSorted = Object.keys(freqMap).sort(function(a,b){return freqMap[b]-freqMap[a]})
        console.log(keysSorted);
        //if(total > 1000) clearStorage();
        chrome.storage.sync.set(obj, function() {});
      });
    });
    
  }
});

function readChat() {
    chrome.tabs.executeScript(null, {
      file: "getPagesSource.js"
    }, function() {

      // If you try and inject into an extensions page or the webstore/NTP you'll get an error
      if (chrome.runtime.lastError) {
        console.log('There was an error getting the page source: \n' + chrome.runtime.lastError.message);
      }
    });
}


function clearStorage() {
   chrome.storage.sync.get(mapKey, function(mapObj) {
      chrome.storage.sync.get(processedKey, function(procObj) {
          var newSet = {};
          var newFreqMap = {};
          var freqMap = mapObj[mapKey];
          for(var key in freqMap) {
            if(freqMap[key] > 1) newFreqMap[key] = freqMap[key];
          }
          var newObj = {};
          newObj[mapKey] = newFreqMap;
          newObj[processedKey] = newSet;
          chrome.storage.sync.set(newObj, function() {});
      });
    });
}

