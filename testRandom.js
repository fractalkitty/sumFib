//11358
let gameData = []; // Array to store scores
let largestNumber = 0;
let gameCounter = 0; // Counter for games played
const totalGamesToSimulate = 10; // Total number of games to simulate
let moveDelay = 5; // Delay between moves, in frames
let moveCounter = 0; // Counter for move delay
let readyForNewGame = false;
let bg1 = "#4a6660";
let bg2 = "#467971";

let spots = [];
let nums = [];
let newGame = false;
let c, score, dw, dh;
let onMobile = false;
let startX, startY, endX, endY, r1, g1, b1;


function setup() {
    largestNumber = 0;
    score = 0; // Make sure score is reset
    nums = []; // Fully reset the board
    readyForNewGame = false;
    c = windowHeight * 0.9;
    createCanvas((3 / 5) * c, c);
    score = 0;
    dw = width / 3;
    dh = height / 5;
    for (let i = 0; i < 15; i++) {
        spots[i] = false;
    }
    for (let i = 0; i < 5; i++) {
        nums[i] = [];
        nums[i] = [0, 0, 0];
    }
    newNum();
    newNum();
    textSize(c / 20);
    textAlign(CENTER);
    loop();
    newGame = false;
}

function draw() {
    if (!newGame) {
        if (moveCounter % moveDelay === 0) {
            makeRandomMove();
            moveCounter = 0; // Reset move counter after making a move
        }
        moveCounter++; // Increment move counter
        updateLargestNumber(); // Ensure the largest number is updated
    } else {
        if (gameCounter < totalGamesToSimulate) {
            endGameAndPrepareNew(); // Handle end of game and setup for new game
        } else {
            finishSimulation(); // When all games are completed
        }
    }
}

function updateLargestNumber() {
    for (let i = 0; i < nums.length; i++) {
        for (let j = 0; j < nums[i].length; j++) {
            if (nums[i][j] > largestNumber) {
                largestNumber = nums[i][j];
            }
        }
    }
}

function newNum() {
    let emptySpots = [];
    for (let i = 0; i < nums.length; i++) {
        for (let j = 0; j < nums[i].length; j++) {
            if (nums[i][j] === 0) emptySpots.push({ i, j });
        }
    }
    if (emptySpots.length > 0) {
        let spot = random(emptySpots);
        nums[spot.i][spot.j] = random([1, 2]);
        // Directly update largestNumber if necessary
        largestNumber = Math.max(largestNumber, nums[spot.i][spot.j]);
    }
}

function keyPressed() {
    if (keyCode === 37 || keyCode === 65) {
        moveLeftAndCombine();
    } else if (keyCode === 38 || keyCode === 87) {
        moveUpAndCombine();
    } else if (keyCode === 39 || keyCode === 68) {
        moveRightAndCombine();
    } else if (keyCode === 40 || keyCode === 83) {
        moveDownAndCombine();
    }
    if (keyCode === 32) {
        newGame = false;
        setup();
        draw();
    }
}
function moveLeftAndCombine() {
    let rows = nums.length;
    let moveOccurred = false;

    for (let i = 0; i < rows; i++) {
        let row = nums[i].filter((val) => val !== 0); // Remove zeros for combination logic

        // Combine tiles from left to right
        for (let j = 0; j < row.length - 1; j++) {
            if (isFibonacci(row[j] + row[j + 1])) {
                row[j] += row[j + 1]; // Combine the current and next tile
                row.splice(j + 1, 1); // Remove the next tile
                row.push(0); // Add a zero at the end to maintain row length, correctly this time
                score += row[j]; // Update score
                moveOccurred = true;
            }
        }

        // After combining, the row might be shorter than the original.
        // Fill the remainder of the row with zeros to ensure it has the same length as before.
        while (row.length < nums[i].length) {
            row.push(0); // Push zeros to the end of the row to fill it out
        }

        // Check for any changes in the row compared to its original state.
        if (!nums[i].every((val, index) => val === row[index])) {
            nums[i] = row;
            moveOccurred = true;
        }
    }

    // Trigger new number addition and game over check only if any move has occurred
    if (moveOccurred) {
        newNum();
        checkGameOver();
    }
}

function shiftTilesLeft(row) {
    let newRow = nums[row].filter((val) => val !== 0); // Remove zeros
    let missing = nums[row].length - newRow.length; // Calculate missing tiles
    nums[row] = newRow.concat(Array(missing).fill(0)); // Fill the rest with zeros
}

function moveRightAndCombine() {
    let rows = nums.length;
    let moveOccurred = false;

    for (let i = 0; i < rows; i++) {
        // Store the original state of the row for comparison.
        let originalRow = [...nums[i]];

        // Extract non-zero values to the end, effectively shifting right.
        let newRow = nums[i].filter((val) => val !== 0).reverse();

        // Attempt to combine adjacent tiles from the end.
        for (let j = 0; j < newRow.length - 1; j++) {
            if (isFibonacci(newRow[j] + newRow[j + 1])) {
                score += newRow[j] + newRow[j + 1];
                newRow[j] += newRow[j + 1];
                newRow.splice(j + 1, 1);
                moveOccurred = true;
                j--; // Adjust the index to stay in place after a merge.
            }
        }

        // Reverse back after combining.
        newRow.reverse();

        // Fill the start of the row with zeros to shift all tiles right.
        while (newRow.length < nums[i].length) {
            newRow.unshift(0);
        }

        // Update the row in the original grid.
        nums[i] = newRow;

        // Check for any changes in the row compared to its original state.
        if (!originalRow.every((val, index) => val === nums[i][index])) {
            moveOccurred = true;
        }
    }

    // Add a new number only if a move has happened.
    if (moveOccurred) {
        newNum();
    }
    checkGameOver();
}

function shiftTilesRight(row) {
    let newRow = nums[row].filter((val) => val !== 0); // Remove zeros
    let missing = nums[row].length - newRow.length; // Calculate missing tiles
    nums[row] = Array(missing).fill(0).concat(newRow); // Fill the beginning with zeros
}

function moveUpAndCombine() {
    let cols = nums[0].length;
    let moveOccurred = false;

    for (let j = 0; j < cols; j++) {
        let originalColumn = [];
        for (let i = 0; i < nums.length; i++) {
            originalColumn.push(nums[i][j]);
        }

        let column = originalColumn.filter((val) => val !== 0);
        let combined = new Array(column.length).fill(false); // Track which tiles have combined

        for (let i = 0; i < column.length - 1; i++) {
            if (!combined[i] && isFibonacci(column[i] + column[i + 1])) {
                score += column[i] + column[i + 1];
                column[i] += column[i + 1];
                column.splice(i + 1, 1); // Remove the combined tile
                combined.splice(i + 1, 1); // Ensure we track combined state correctly
                combined[i] = true; // Mark this tile as having combined
                moveOccurred = true;
            }
        }

        while (column.length < nums.length) {
            column.push(0); // Fill with zeros
        }

        for (let i = 0; i < nums.length; i++) {
            nums[i][j] = column[i];
            if (nums[i][j] !== originalColumn[i]) moveOccurred = true;
        }
    }

    if (moveOccurred) {
        newNum();
        checkGameOver();
    }
}

function moveDownAndCombine() {
    let cols = nums[0].length;
    let moveOccurred = false;

    for (let j = 0; j < cols; j++) {
        // Store the original state of the column for comparison.
        let originalColumn = [];
        for (let i = 0; i < nums.length; i++) {
            originalColumn.push(nums[i][j]);
        }

        // Extract the current column, ignoring zeros.
        let column = originalColumn.filter((val) => val !== 0);

        // Attempt to combine tiles in the column, starting from the bottom.
        for (let i = column.length - 1; i > 0; i--) {
            if (isFibonacci(column[i] + column[i - 1])) {
                score += column[i] + column[i - 1];
                column[i] += column[i - 1];
                column.splice(i - 1, 1); // Remove the combined tile, moving everything down.
                moveOccurred = true; // Mark that a combination occurred.
                i--; // Adjust index due to the removal.
            }
        }

        // Update the grid with the new column state, placing it at the bottom.
        let filledColumn = Array(nums.length - column.length)
            .fill(0)
            .concat(column);

        // Update the original grid and check if any tile has moved or combined.
        for (let i = 0; i < nums.length; i++) {
            nums[i][j] = filledColumn[i];
            if (nums[i][j] !== originalColumn[i]) moveOccurred = true;
        }
    }

    // Add a new number only if a move has happened.
    if (moveOccurred) {
        newNum();
    }
    checkGameOver();
}

function isFibonacci(num) {
    let a = 0;
    let b = 1;
    if (num === a || num === b) return true;
    let c = a + b;
    while (c <= num) {
        if (c === num) return true;
        a = b;
        b = c;
        c = a + b;
    }
    return false;
}

function findFibonacciIndex(n) {
    if (n <= 0) return -1; // Handle non-positive inputs
    let a = 0,
        b = 1,
        index = 1;

    while (b < n) {
        let temp = b;
        b = a + b;
        a = temp;
        index++;
    }

    return b === n ? index : -1; // Check if the number is actually a Fibonacci number
}

function canMakeMove() {
    for (let i = 0; i < nums.length; i++) {
        for (let j = 0; j < nums[i].length; j++) {
            // Check right for possible combination
            if (j < nums[i].length - 1) {
                if (
                    isFibonacci(nums[i][j] + nums[i][j + 1]) &&
                    nums[i][j] !== 0 &&
                    nums[i][j + 1] !== 0
                ) {
                    return true;
                }
            }
            // Check down for possible combination
            if (i < nums.length - 1) {
                if (
                    isFibonacci(nums[i][j] + nums[i + 1][j]) &&
                    nums[i][j] !== 0 &&
                    nums[i + 1][j] !== 0
                ) {
                    return true;
                }
            }
        }
    }
    return false; // No moves can be made
}

function checkGameOver() {
    if (!canMakeMove() && isBoardFull()) {
        newGame = true;
    }
}

function isBoardFull() {
    for (let i = 0; i < nums.length; i++) {
        for (let j = 0; j < nums[i].length; j++) {
            if (nums[i][j] === 0) {
                return false; // Found an empty spot, so the board isn't full.
            }
        }
    }
    return true; // No empty spots found, board is full.
}

function windowResized() {
    c = windowHeight * 0.9;
    score = 0;
    dw = width / 3;
    dh = height / 5;
    resizeCanvas((3 / 5) * c, c);
    textSize(max(20, c / 10));
    dw = width / 3;
    dh = height / 5;
}

function touchStarted() {
    if (onMobile) {
        if (touches.length > 0) {
            startX = touches[0].x;
            startY = touches[0].y;
        }
        return false; // Prevent default browser behavior
    }
}

function touchEnded() {
    if (onMobile) {
        if (touches.length > 0) {
            endX = touches[0].x;
            endY = touches[0].y;
        } else {
            endX = mouseX;
            endY = mouseY;
        }

        const diffX = endX - startX;
        const diffY = endY - startY;

        if (!newGame || readyForNewGame) {
            // Process swipes only if it's not end game or ready for a new game
            if (abs(diffX) > abs(diffY)) {
                // Horizontal movement
                diffX > 0 ? moveRightAndCombine() : moveLeftAndCombine();
            } else {
                // Vertical movement
                diffY > 0 ? moveDownAndCombine() : moveUpAndCombine();
            }
        }

        if (newGame && !readyForNewGame) {
            // If the game has ended and it's the first swipe after the end, set readyForNewGame to true
            readyForNewGame = true;
        } else if (newGame && readyForNewGame) {
            // If it's the second swipe after the game has ended, reset for a new game
            newGame = false;
            readyForNewGame = false; // Reset readyForNewGame
            setup();
            draw();
        }

        return false; // Prevent default
    }
}

function makeRandomMove() {
    const moves = [
        moveLeftAndCombine,
        moveRightAndCombine,
        moveUpAndCombine,
        moveDownAndCombine
    ];
    const randomMove = moves[Math.floor(Math.random() * moves.length)];
    randomMove();
}

function analyzeGameData() {
    let sumScores = gameData.reduce((a, b) => a + b.score, 0);
    let averageScore = sumScores / gameData.length;

    let averageLargestNumber =
        gameData.reduce((a, b) => a + b.largestNumber, 0) / gameData.length;

    console.log(
        `Average Score after ${totalGamesToSimulate} games: ${averageScore}`
    );
    console.log(
        `Average Largest Number after ${totalGamesToSimulate} games: ${averageLargestNumber}`
    );
    console.log(gameData);
    // Further analysis and display of metrics as needed
}

function endGameAndPrepareNew() {
    // Logic to handle game end and start a new game
    if (!readyForNewGame) {
        gameData.push({ score, largestNumber });
        gameCounter++;
        readyForNewGame = true;
    }
    setup(); // Re-initialize game state for a new game
    readyForNewGame = false;
}

function finishSimulation() {
    noLoop(); // Stop the simulation
    let csvData = createCSVData(gameData); // Convert game data to CSV format
    downloadCSV(csvData, "game_simulation_data.csv"); // Download the data as a CSV file
    console.log("Simulation finished. CSV downloaded.");
}

function createCSVData(gameData) {
    let csvContent = "data:text/csv;charset=utf-8,";
    // CSV Header
    csvContent += "Game Number,Score,Largest Number\n";

    // Each game data
    gameData.forEach((game, index) => {
        let row = `${index + 1},${game.score},${game.largestNumber}`;
        csvContent += row + "\n";
    });

    return csvContent;
}

function downloadCSV(csvContent, filename) {
    // Encode the CSV content
    var encodedUri = encodeURI(csvContent);
    // Create a link element
    var link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    // Append the link to the body (required for Firefox)
    document.body.appendChild(link);
    // Simulate the link click
    link.click();
    // Clean up by removing the link
    document.body.removeChild(link);
}
