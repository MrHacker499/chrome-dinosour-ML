class Player {
    constructor() {
        this.distance = 0;
        this.velocity = 0;
        this.position = 180;
        this.rotation = 0;
        this.isDead = false;
        this.neuralNet = null;
    }
}

let generation = 1;
const numOfPlayers = 50;
let players = [];
let maxScore = 0;

const gravity = 0.25;
const jump = -4.6;
const flyArea = $("#flyarea").height();


const pipeheight = 100;
const pipewidth = 52;
let pipes = [];

//loops
let loopGameloop;
let loopPipeloop;

$(document).ready(function () {
    generatePlayers();
    startGame();
});

function startGame() {
    const updaterate = 1000.0 / 60.0; //60 times a second
    loopGameloop = setInterval(gameloop, updaterate);
    loopPipeloop = setInterval(updatePipes, 1400);
    $('#generation').text("Generation: " + generation);
    updatePipes();
}

function generatePlayers() {
    for (let i = 0; i < numOfPlayers; i++) {
        const player = new Player();
        player.neuralNet = new NeuralNet([]);
        player.neuralNet.random();
        addPlayerView(player);
        players.push(player);
        playerJump(player);
    }
}

function addPlayerView(player) {
    const view = $('#player');
    player.view = view.clone();
    player.view.insertAfter($('#ceiling'));
    player.view.removeAttr('id');
}

function gameloop() {
    const alivePlayers = players.filter(player => !player.isDead);
    if (alivePlayers.length === 0) {
        restartGame();
        return;
    }
    $('#alive').text("Alive: " + alivePlayers.length + " / " + numOfPlayers);
    $('#score').text("Distance: " + alivePlayers[0].distance);
    alivePlayers.forEach(function (player) {
        updatePlayer(player);
        checkIfDead(player);
    });
}

function restartGame() {
    let newMaxScore = 0;
    let maxScoreGeneration = 0;
    for (let i = 0; i < players.length; i++) {
        if (players[i].distance > newMaxScore) {
            newMaxScore = players[i].distance;
        }
    }
    if (maxScore < newMaxScore) {
        maxScore = newMaxScore;
        maxScoreGeneration = generation;
        $('#maxScore').text("Max distance: " + maxScore + " in generation " + maxScoreGeneration);
    }

    $('.pipe').remove();
    pipes = [];

    clearInterval(loopGameloop);
    clearInterval(loopPipeloop);
    loopGameloop = null;
    loopPipeloop = null;

    generation++;
    regeneratePlayers();
    startGame();
}

function regeneratePlayers() {
    const newPlayers = [];
    for (let i = 0; i < numOfPlayers; i++) {
        const parents = getNewPlayerParents();
        const player = new Player();
        player.neuralNet = NeuralNet.combine(parents[0].neuralNet, parents[1].neuralNet);
        addPlayerView(player);
        newPlayers.push(player);
        playerJump(player);
    }
    players = newPlayers;
}

function getNewPlayerParents() {
    const firstPlayerIndex = getNewPlayerParentIndex();
    let secondPlayerIndex = getNewPlayerParentIndex();
    while (firstPlayerIndex === secondPlayerIndex) {
        secondPlayerIndex = getNewPlayerParentIndex();
    }
    return [players[firstPlayerIndex], players[secondPlayerIndex]];
}

function getNewPlayerParentIndex() {
    let fitnessSum = 0;
    for (let i = 0; i < players.length; i++) {
        fitnessSum += Math.pow(players[i].distance, 2);
    }

    let random = Math.random() * fitnessSum;
    for (let i = 0; i < players.length; i++) {
        random -= Math.pow(players[i].distance, 2);
        if (random <= 0) {
            return i;
        }
    }
}

function updatePlayer(player) {
    player.velocity += gravity;
    player.position += player.velocity;
    player.rotation = Math.min((player.velocity / 10) * 90, 90);
    player.distance += 1;
    player.view.css({rotate: player.rotation, top: player.position});
}

function checkIfDead(player) {
    var box = player.view[0].getBoundingClientRect();
    var origwidth = 34.0;
    var origheight = 24.0;

    var boxwidth = origwidth - (Math.sin(Math.abs(player.rotation) / 90) * 8);
    var boxheight = (origheight + box.height) / 2;
    var boxleft = ((box.width - boxwidth) / 2) + box.left;
    var boxtop = ((box.height - boxheight) / 2) + box.top;
    var boxright = boxleft + boxwidth;
    var boxbottom = boxtop + boxheight;

    //did we hit the ground?
    if (box.bottom >= $("#land").offset().top) {
        playerDead(player);
        return;
    }

    //have they tried to escape through the ceiling? :o
    var ceiling = $("#ceiling");
    if (boxtop <= (ceiling.offset().top + ceiling.height())) {
        //player.position = 0;
        playerDead(player);
        return;
    }


    //determine the bounding box of the next pipes inner area
    var nextpipe = pipes[0];
    var nextpipeupper = nextpipe.children(".pipe_upper");

    var pipetop = nextpipeupper.offset().top + nextpipeupper.height();
    var pipeleft = nextpipeupper.offset().left - 2; // for some reason it starts at the inner pipes offset, not the outer pipes.
    var piperight = pipeleft + pipewidth;
    var pipebottom = pipetop + pipeheight;

    var distanceToPipe = pipetop + pipeheight / 2 - boxbottom - boxheight / 2;
    var distanceToCenter = piperight - boxleft;

    //have we gotten inside the pipe yet?
    if (boxright > pipeleft) {
        //we're within the pipe, have we passed between upper and lower pipes?
        if (boxtop > pipetop && boxbottom < pipebottom) {
            //yeah! we're within bounds

        }
        else {
            //no! we touched the pipe
            playerDead(player);
            return;
        }
    }


    //have we passed the imminent danger?
    if (boxleft > piperight) {
        //yes, remove it
        pipes.splice(0, 1);
    }


    const neuralOutput = player.neuralNet.output([distanceToPipe, distanceToCenter]);
    if (neuralOutput > 0.5) {
        playerJump(player);
    }
}

function playerJump(player) {
    player.velocity = jump;
}

function playerDead(player) {
    player.isDead = true;
    player.view.remove();
}

function updatePipes() {
    //Do any pipes need removal?
    $(".pipe").filter(function () {
        return $(this).position().left <= -100;
    }).remove();

    //add a new pipe (top height + bottom height  + pipeheight == flyArea) and put it in our tracker
    var padding = 80;
    var constraint = flyArea - pipeheight - (padding * 2); //double padding (for top and bottom)
    var topheight = Math.floor((Math.random() * constraint) + padding); //add lower padding
    var bottomheight = (flyArea - pipeheight) - topheight;
    var newpipe = $('<div class="pipe animated"><div class="pipe_upper" style="height: ' + topheight + 'px;"></div><div class="pipe_lower" style="height: ' + bottomheight + 'px;"></div></div>');
    $("#flyarea").append(newpipe);
    pipes.push(newpipe);
}
