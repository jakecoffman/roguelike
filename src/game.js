(function () {

  var game = new Phaser.Game('100%', '100%', Phaser.CANVAS, 'phaser-example', {
    preload: preload,
    create: create,
    update: update,
    render: render
  });

  function preload() {
    game.load.image('ground_1x1', 'assets/ground_1x1.png');

  }

  var tileset;
  var map;

  var marker;
  var currentTile = 0;

  function create() {

    game.stage.backgroundColor = '#2d2d2d';

    //  Creates a blank tilemap
    tileset = game.add.tilemap();

    //  Add a Tileset image to the tileset
    tileset.addTilesetImage('ground_1x1');

    //  Creates a new blank layer and sets the tileset dimensions.
    //  In this case the tileset is 40x30 tiles in size and the tiles are 32x32 pixels in size.
    map = tileset.create('level1', 40, 30, 32, 32);

    //  Resize the map
    map.resizeWorld();
    // game.world.scale.setTo(2, 2);

    //  Create our tile selector at the top of the screen
    createTileSelector();

    // mouse pointer in creation mode
    marker = game.add.graphics();
    marker.lineStyle(2, 0x000000, 1);
    marker.drawRect(0, 0, 32, 32);

    game.input.addMoveCallback(updateMarker, this);
  }

  function updateMarker() {
    marker.x = map.getTileX(game.input.activePointer.worldX) * 32;
    marker.y = map.getTileY(game.input.activePointer.worldY) * 32;
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
        tileset.putTile(currentTile, map.getTileX(marker.x), map.getTileY(marker.y), map);
      }
      wasDrag = false;
      wasDown = false;
      downPoint = null;
    }
  }

  var wasDown = false;
  var wasDrag = false;

  function render() {
    //game.debug.text('Hello map!', 16, 570);
  }

  function createTileSelector() {

    //  Our tile selection window
    var tileSelector = game.add.group();

    var tileSelectorBackground = game.make.graphics();
    tileSelectorBackground.beginFill(0x000000, 0.5);
    tileSelectorBackground.drawRect(0, 0, 800, 34);
    tileSelectorBackground.endFill();

    tileSelector.add(tileSelectorBackground);

    var tileStrip = tileSelector.create(1, 1, 'ground_1x1');
    tileStrip.inputEnabled = true;
    tileStrip.events.onInputDown.add(function (sprite, pointer) {
      currentTile = game.math.snapToFloor(pointer.x, 32) / 32;
    }, this);

    tileSelector.fixedToCamera = true;
  }

  function equal(point1, point2) {
    return point1.x === point2.x && point1.y === point2.y;
  }

})();