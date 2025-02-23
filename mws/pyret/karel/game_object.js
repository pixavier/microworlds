// Super Karel http://web.stanford.edu/class/cs106a/materials/midterm-1-reference.pdf
// TODO: Hint for level
// TODO: more obvious win state
// TODO: Title / styling, disable run button while running, highlight on error

var CACHE_KEY = "karel-js-7";
var GameObject = {
  currentSnapshots: [],
  renderers: [],
  stateChanged: false,
  worlds: [],

  initialize: function(levels, cache) {
    this.initialLevels = $.extend(true, {}, levels.levels);
    this.editor = Editor;
    this.currentLevel = levels.currentLevel;
    if (cache) {
      this.initLevels(this.fetchLevels() || levels.levels);
    } else {
      this.initLevels(levels.levels);
    }
    this.buildLevelSelect();

    $('.run').click(this.run.bind(this));
    $('.reset').click(this.reset.bind(this));
    $('.solution').click(this.solution.bind(this));
    $('.help').click(this.help.bind(this));

    this.main();
    setInterval(this.update.bind(this), 500);
  },

  emptyLevelSelect: function() {
    var select = $('.level-select');
    for(var i = 0; i < this.levels.length; i++) {
	  select.empty();	
    }
  },

  buildLevelSelect: function() {
	this.emptyLevelSelect();
    var select = $('.level-select');
    for(var i = 0; i < this.levels.length; i++) {
      select.append($("<option></option>")
			.attr("value", i)
        .text(this.levels[i].name));
    }
    select.change(this.setLevel.bind(this));
    select.val(this.currentLevel);
  },

  checkSolution: function() {
    var compare = function(a, b) {
      return a.x === b.x && a.y === b.y && a.count === b.count;
    };

    for(var i = 0; i < this.worlds.length; i++) {
      var world = this.worlds[i];
      var beepers = world.beepers;
      var solution = world.solution;
      var found = false;

      if (beepers.length !== solution.length) {
        return false;
      }

      for(var j = 0; j < beepers.length; j++) {
        found = false;
        for(var k = 0; k < solution.length; k++) {
          if (compare(beepers[j], solution[k])) {
            found = true;
          }
        }

        if (!found) {
          return false;
        }
      }
    }

    return true;
  },

  completed: function() {
    $(".run").html("completed!");
  },

  code: function() {
    return this.editor.doc.getValue();
  },

  setCode: function(code) {
    this.editor.doc.setValue(code);
  },

  fetchLevels: function() {
    if (this.loadState()) {
      return this.savedLevels;
    }

    return false;
  },

  hasSnapshots: function() {
    for(var i = 0; i < this.worlds.length; i ++) {
      if (this.worlds[i].snapshots.length > 0) {
        return true;
      }
    }
  },

  help: function() {
    $(".help-container").toggle();
  },

  loadState: function() {
    var savedLevels = JSON.parse(localStorage.getItem(CACHE_KEY));
    if (!savedLevels || typeof savedLevels.currentLevel !== "number" || savedLevels.levels === undefined) {
      return false;
    }

    this.currentLevel = savedLevels.currentLevel;
    this.savedLevels = savedLevels.levels;
    return true;
  },

  main: function() {
    var snapshots = this.currentSnapshots;
    var showSolution = $(".solution").hasClass("active");
    if (showSolution) {
      for(var i = 0; i < this.renderers.length; i++) {
        var renderer = this.renderers[i];
        renderer.solution(this.worlds[i]);
      }
    } else if (snapshots.length > 0) {
      for(var i = 0; i < this.renderers.length; i++) {
        var renderer = this.renderers[i];
        if (snapshots[i]) {
          var world = snapshots[i];
          renderer.render(world, world.karel);
        }
      }
    }

    var w = window;
    requestAnimationFrame = w.requestAnimationFrame || w.webkitRequestAnimationFrame || w.msRequestAnimationFrame || w.mozRequestAnimationFrame;
    requestAnimationFrame(this.main.bind(this));
  },

  initLevels: function(levels) {
    this.levels = levels;
    this.level = levels[this.currentLevel];
    this.setCode(this.level.code);

    // TODO: abbstract to method, used in reset
    for(var i = 0; i < this.level.worlds.length; i++) {
      var renderer = Renderer.initialize();
      var world = World.initialize(this.level.worlds[i], renderer);
      this.renderers.push(renderer);
      this.worlds.push(world);
      world.takeSnapshot();
    }
    this.setHelpCommands();
    this.setCurrentSnapshots();
  },

  levelIndex: function() {
    return Number($(".level-select").val());
  },

  reset: function() {
    for(var i = 0; i < this.renderers.length; i++) {
      this.renderers[i].remove();
    }

    this.renderers = [];
    this.worlds = [];
    this.setCurrentSnapshot = [];
    this.level.worlds = $.extend(true, [], this.initialLevels[this.currentLevel].worlds);
    for(var i = 0; i < this.level.worlds.length; i++) {
      var renderer = Renderer.initialize();
      var world = World.initialize(this.level.worlds[i], renderer);
      this.renderers.push(renderer);
      this.worlds.push(world);
      world.takeSnapshot();
    }
    this.setCurrentSnapshots();
    $(".run").html("run");
  },

  run: function() {
    var code = this.code();
    this.setError("");
    for(var i = 0; i < this.worlds.length; i++) {
      try {
        this.worlds[i].executeCode(code);
      } catch(err) {
        console.log(err);
        this.setError(err);
//        this.reset();
      }
    }
  },

  save: function() {
    var value = JSON.stringify(this.serializeLevels());
    localStorage.setItem(CACHE_KEY, value);
  },

  serializeLevels: function() {
    this.levels[this.levelIndex()].code = this.code();
    return { levels: this.levels, currentLevel: this.levelIndex() };
  },

  setCurrentSnapshots: function() {
    this.currentSnapshots = this.worlds.map(function(world) {
      if (world.snapshots.length > 0) {
        return world.snapshots.shift();
      }
      return false;
    });
  },

  setError: function(error) {
    $('.error').text(error);
  },

  setHelpCommands: function() {
    var commands = this.worlds[0].karel.commands();
    var commandsHtml = "";
    for(var i = 0; i < commands.length; i++) {
      commandsHtml += "<li>" + commands[i] + "()</li>";
    }

    $(".help-commands").html(commandsHtml);
    $(".beeper-count").text(this.worlds[0].karel.beeperCount);
  },

  setLevel: function() {
    var index = Number($(".level-select").val());
    this.currentLevel = index;
    this.level = this.levels[index];
    this.setCode(this.level.code);
    this.reset();
    this.setHelpCommands();
  },

  setLevelIndex: function(index) {
    $(".level-select").val(index);
    this.setLevel();
  },

  solution: function() {
    $(".solution").toggleClass("active");
  },

  update: function() {
    if (this.hasSnapshots()) {
      this.setCurrentSnapshots();
      this.stateChanged = true;
    } else if(this.stateChanged) {
      this.stateChanged = false;
      if (this.checkSolution()) {
        this.completed();
      } else {
//        this.reset();
      }
    }

    this.save();
  }
};

window.karel = {};
window.karel.executeCode = function (code) {
    GameObject.setError("");
    for(var i = 0; i < GameObject.worlds.length; i++) {
      try {
		GameObject.worlds[i].executeCode(code);		  
      } catch(err) {
        console.log(err);
        GameObject.setError(err);
//        GameObject.reset();
      }
    }
}

window.karel.executeCommand = function (code, worldIndex = 0) {
  let ret = null;
  GameObject.setError("");
  try {
	ret = GameObject.worlds[worldIndex].executeCommand(code);		  
  } catch(err) {
	console.log(err);
	GameObject.setError(err);
//        GameObject.reset();
  }
  return ret;
}

window.karel.run = function () {
    var code = GameObject.code();
    GameObject.setError("");
    for(var i = 0; i < GameObject.worlds.length; i++) {
      try {
        GameObject.worlds[i].executeCode(code);
      } catch(err) {
        console.log(err);
        GameObject.setError(err);
//        GameObject.reset();
      }
    }
}

window.karel.reset = function () {
  GameObject.reset();
}

window.karel.help = function () {
  $(".help-container").toggle();
}

window.karel.solution = function () {
  $(".solution").toggleClass("active");
}

window.karel.setLevel = function (index) {
  $(".level-select").val(index);
  GameObject.setLevel();
}

window.karel.initialize = function (levels) {
  GameObject.initialize(levels, false);
  GameObject.reset();
}


GameObject.initialize(levels, true);
