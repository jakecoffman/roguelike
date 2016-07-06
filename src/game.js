(function () {

  var game = new Phaser.Game('100%', '100%', Phaser.CANVAS, 'phaser-example', {
    preload: preload,
    create: create,
    update: update,
    render: render
  });

  function preload() {
    game.stage.smoothed = false;
    game.load.image('ground_1x1', 'assets/ground_1x1.png');
    game.load.spritesheet('hero', 'assets/hero.png', 32, 32);
  }

  var tilemap;
  var layer;
  var map = {}; // actual map, key is string "x,y"
  var marker;
  var currentTile = 0;
  var zoom = 1;
  var player;
  var fov = new ROT.FOV.PreciseShadowcasting(lightPasses);

  function create() {
    // game.add.plugin(Phaser.Plugin.Debug);

    game.stage.backgroundColor = '#2d2d2d';

    //  Creates a blank tilemap
    tilemap = game.add.tilemap();

    tilemap.addTilesetImage('ground_1x1');

    //  Creates a new blank layer and sets the tileset dimensions.
    //  In this case the tileset is 40x30 tiles in size and the tiles are 32x32 pixels in size.
    layer = tilemap.create('level1', 40, 30, 32, 32);
    layer.setScale(zoom);

    //  Resize the map
    layer.resizeWorld();
    // game.world.scale.setTo(2, 2);

    var rotMap = new ROT.Map.Uniform(40, 30);
    var mapCallback = function (x, y, value) {
      if (value === 1) {
        map[x+','+y] = value;
        tilemap.putTile(0, x, y, layer);
      } else {
        if (!player) {
          map[x+','+y] = 'player';
          player = game.add.sprite(0,  0, 'hero');
          player.tileX = x;
          player.tileY = y;
          setXY(player);
        }
      }
    };
    rotMap.create(mapCallback.bind(this));
    player.scale.setTo(zoom);

    resetVision();
    computeFOV();

    //  Create our tile selector at the top of the screen
    //createTileSelector();

    // mouse pointer in creation mode
    marker = game.add.graphics();
    makeMarker();

    game.input.addMoveCallback(updateMarker, this);
    game.input.mouse.mouseWheelCallback = mouseWheelCallback;
  }

  function resetVision() {
    for (var x = 0; x < 40; x++) {
      for (var y = 0; y < 30; y++) {
        var tile = tilemap.getTile(x, y, 0);
        if (tile) {
          tile.alpha = 0;
        }
      }
    }
  }

  function computeFOV() {
    // seen tiles should fade unless still being seen
    for (var x = 0; x < 40; x++) {
      for (var y = 0; y < 30; y++) {
        var tile = tilemap.getTile(x, y, 0);
        if (tile) {
          tile.alpha = tile.alpha > 0 ? 0.5 : 0;
        }
      }
    }
    fov.compute(player.tileX, player.tileY, 10, function (x, y, r, visibility) {
      var tile = tilemap.getTile(x, y, 0);
      if (tile) {
        tile.alpha = visibility > 0 ? 1 : 0;
      }
      tilemap.layers[0].dirty = true;
    });
  }

  function lightPasses(x, y) {
    var key = x + ',' + y;
    if (x == player.tileX && y == player.tileY) {
      return true;
    }
    // we only keep track of obstacles currently, this may need to change?
    return !(key in map);
  }

  function mouseWheelCallback(event) {
    if (game.input.mouse.wheelDelta == Phaser.Mouse.WHEEL_UP) {
      zoom += 0.01;
    } else {
      zoom -= 0.01;
    }
    if (zoom < 1) {
      zoom = 1;
    }
    layer.setScale(zoom);
    marker.clear();
    makeMarker();
    updateMarker();
    player.scale.setTo(zoom);
    setXY(player, player.tileX, player.tileY);
    layer.resizeWorld();
  }

  // given tile x,y set world x, y
  function setXY(sprite) {
    sprite.x = sprite.tileX * 32 * zoom;
    sprite.y = sprite.tileY * 32 * zoom;
  }

  function makeMarker() {
    marker.lineStyle(2, 0xFFFFFFF, 1);
    marker.drawRect(0, 0, 32 * zoom, 32 * zoom);
  }

  function updateMarker() {
    marker.x = layer.getTileX(game.input.activePointer.worldX / zoom) * 32 * zoom;
    marker.y = layer.getTileY(game.input.activePointer.worldY / zoom) * 32 * zoom;
  }

  var downPoint;

  function update() {
    if (this.game.input.activePointer.isDown) {

      wasDown = true;
      if (downPoint) {
        // move the camera by the amount the mouse has moved since last update
        this.game.camera.x += downPoint.x - this.game.input.activePointer.position.x;
        this.game.camera.y += downPoint.y - this.game.input.activePointer.position.y;

        if (!equal(downPoint, this.game.input.activePointer.position)) {
          wasDrag = true;
        }
      }
      // set new drag origin to current position
      downPoint = this.game.input.activePointer.position.clone();
    } else if (wasDown) {
      if (!wasDrag) {
        //tilemap.putTile(currentTile, layer.getTileX(marker.x / zoom), layer.getTileY(marker.y / zoom), layer);
        player.tileX = layer.getTileX(marker.x / zoom);
        player.tileY = layer.getTileY(marker.y / zoom);
        setXY(player);
        computeFOV();
      }
      wasDrag = false;
      wasDown = false;
      downPoint = null;
    }
  }

  var wasDown = false;
  var wasDrag = false;

  function render() {
    game.debug.text('Zoom: ' + zoom, 16, 570);
    if (this.game.input.pointer2.isDown) {
      game.debug.text('Wow!', 16, 16);
    }
  }

  function createTileSelector() {

    //  Our tile selection window
    var tileSelector = game.add.group();

    var tileSelectorBackground = game.make.graphics();
    tileSelectorBackground.beginFill(0x000000, 0.5);
    tileSelectorBackground.drawRect(0, 0, 800, 32 * zoom + zoom);
    tileSelectorBackground.endFill();

    tileSelector.add(tileSelectorBackground);

    var tileStrip = tileSelector.create(1, 1, 'ground_1x1');
    tileStrip.inputEnabled = true;
    tileStrip.events.onInputDown.add(function (sprite, pointer) {
      currentTile = game.math.snapToFloor(pointer.x, 32 * zoom) / 32 * zoom;
    }, this);
    tileStrip.scale.x = zoom;
    tileStrip.scale.y = zoom;

    tileSelector.fixedToCamera = false;
    return tileSelector;
  }

  function equal(point1, point2) {
    return point1.x === point2.x && point1.y === point2.y;
  }

})();