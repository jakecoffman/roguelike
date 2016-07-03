var game = new Phaser.Game(800, 600, Phaser.CANVAS, 'phaser-example', {
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

var cursors;

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

    //  Create our tile selector at the top of the screen
    createTileSelector();

    // mouse pointer in creation mode
    marker = game.add.graphics();
    marker.lineStyle(2, 0x000000, 1);
    marker.drawRect(0, 0, 32, 32);

    game.input.addMoveCallback(updateMarker, this);

    cursors = game.input.keyboard.createCursorKeys();
}

function updateMarker() {

    marker.x = map.getTileX(game.input.activePointer.worldX) * 32;
    marker.y = map.getTileY(game.input.activePointer.worldY) * 32;

    if (game.input.mousePointer.isDown)
    {
        tileset.putTile(currentTile, map.getTileX(marker.x), map.getTileY(marker.y), map);
    }

}

function update() {

    if (cursors.left.isDown)
    {
        game.camera.x -= 4;
    }
    else if (cursors.right.isDown)
    {
        game.camera.x += 4;
    }

    if (cursors.up.isDown)
    {
        game.camera.y -= 4;
    }
    else if (cursors.down.isDown)
    {
        game.camera.y += 4;
    }

    move_camera_by_pointer(game.input.mousePointer);
    move_camera_by_pointer(game.input.pointer1);
}

var cameraPosition;

function move_camera_by_pointer(pointer) {
    if (!pointer.timeDown) { return; }
    if (pointer.isDown && !pointer.targetObject) {
        if (cameraPosition) {
            game.camera.x += cameraPosition.x - pointer.position.x;
            game.camera.y += cameraPosition.y - pointer.position.y;
        }
        cameraPosition = pointer.position.clone();
    }
    if (pointer.isUp) { cameraPosition = null; }
}

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
    tileStrip.events.onInputDown.add(function(sprite, pointer) {
        currentTile = game.math.snapToFloor(pointer.x, 32) / 32;
    }, this);

    tileSelector.fixedToCamera = true;
}
