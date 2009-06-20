function LifeCell(element, pLife) {
	// this.setDebug(true);
	this.debugLog("LifeCell init");
	this.element = element;
	this.setLife(pLife);
	this.debugLog("LifeCell end init");
}

LifeCell.prototype = {
	getLife: function() {
		return this.life;
	},
	setLife: function(pLife) {
		this.life = pLife;
		setClass(this.element, this.life ? 'Alive' : 'Dead');
	},
	toggleLife: function() {
		this.setLife(!this.getLife());
	},
	setNeighbours: function(currentLife, pNeighbours) {
		var newLife;
		if (pNeighbours < 2) {
			// death by isolation
			newLife = false;
		} else if (2 == pNeighbours) {
			// no change
			newLife = currentLife;
		} else if (3 == pNeighbours) {
			// birth or survival
			newLife = true;
		} else {
			// death by overcrowding
			newLife = false;
		}
		this.setLife(newLife);
	}
};

function LifeGrid(pTable, pHeight, pWidth) {
	// this.setDebug(true);
	this.debugLog("LifeGrid init");
	this.table = pTable;
	this.width = pWidth;
	this.height = pHeight;
	this.createLifeCells();
	this.debugLog("LifeGrid end init");
}

LifeGrid.prototype = {
	getCell: function(row, col) {
		if (bad(row) || bad(col) || row < 0 || row >= this.height || col < 0 || col >= this.width) {
			fatal('Bad coords row=' + row + ' col=' + col);
		}
		return this.cells[row][col];
	},
	createLifeCells: function() {
		this.cells = new Array();
		for (var row = 0; row < this.height; row++) {
			this.cells[row] = new Array();
			for (var col = 0; col < this.width; col++) {
				var tableCell = this.table.rows[row].cells[col];
				this.cells[row][col] = new LifeCell(tableCell, false);
			}
		}
	},
	countNeighbours: function(row, col, wrap) {
		if (row < 0 || row >= this.height || col < 0 || col >= this.width) {
			fatal('Bad coords row=' + row + ' col=' + col);
		}
		var n = 0;
		var colmin = col - 1, rowmin = row - 1;
		var colmax = col + 1, rowmax = row + 1;
		if (!wrap) {
			// If not wrapping, clip to board edges
			if (colmin < 0) { colmin = 0; }
			if (rowmin < 0) { rowmin = 0; }
			if (colmax >= this.width) { colmax = this.width - 1; }
			if (rowmax >= this.height) { rowmax = this.height - 1; }
		}
		for (var scancol = colmin; scancol <= colmax; scancol++) {
			for (var scanrow = rowmin; scanrow <= rowmax; scanrow++) {
				if (scanrow == row && scancol == col) {
					continue; // don't count self
				}
				var wrapcol = scancol, wraprow = scanrow;
				if (wrap) {
					// if wrapping, wrap around edges
					if (wraprow < 0) {
						wraprow += this.height;
					} else if (wraprow >= this.height) {
						wraprow -= this.height;
					}
					if (wrapcol < 0) {
						wrapcol += this.width;
					} else if (wrapcol >= this.width) {
						wrapcol -= this.width;
					}
				}
				if (this.getCell(wraprow, wrapcol).getLife()) {
					n++;
				}
			}
		}
		return n;
	}
};

function LifeBoard(pTable, pHeight, pWidth, wrap) {
	// this.setDebug(true);
	this.debugLog("LifeBoard init");
	this.table = pTable;
	setClass(this.table, 'LifeBoard');
	this.createTable(pHeight, pWidth);
	this.wrap = !!wrap;
	this.current = new LifeGrid(this.table, pHeight, pWidth);
	this.next = new LifeGrid(this.table, pHeight, pWidth);
	this.debugLog("LifeBoard end init");
}

LifeBoard.prototype = {
	createTable: function(height, width) {
		for (var row = 0; row < height; row++) {
			var tableRow = this.table.insertRow(this.table.rows.length);
			setClass(tableRow, 'LifeRow');
			for (var col = 0; col < width; col++) {
				var cell = tableRow.insertCell(0);
				var board = this;
				cell.onclick = function() {
					board.debugLog("cell: onClick, row=" + this.parentNode.rowIndex + ", col=" + this.cellIndex);
					board.handleClick(this.parentNode.rowIndex, this.cellIndex);
				}
			}
		}
	},
	nextGeneration: function() {
		var changed = false;
		var row, col;
		for (row = 0; row < this.current.height; row++) {
			for (col = 0; col < this.current.width; col++) {
				var n = this.current.countNeighbours(row, col, this.wrap);
				var currentCell = this.current.getCell(row, col);
				var nextCell = this.next.getCell(row, col);
				nextCell.setNeighbours(currentCell.getLife(), n);
				if (!changed && currentCell.getLife() != nextCell.getLife()) {
					changed = true;
				}
				// this.debugLog('row=' + row + ' col=' + col + ' oldN=' + n + ' newLife=' + nextCell.getLife());
			}
		}
		if (changed) {
			// swap current and next generation grids
			var temp = this.current;
			this.current = this.next;
			this.next = temp;
		} else {
			this.debugLog('Stable');
		}
		return changed;
	},
	toggleWrap: function() {
		this.wrap = !this.wrap;
		this.debugLog('New wrap: ' + this.wrap);
	},
	clear: function() {
		for (var y = 0; y < this.current.height; y++) {
			for (var x = 0; x < this.current.width; x++) {
				this.current.getCell(x, y).setLife(false);
			}
		}
	},
	glider: function(x, y) {
		//  X 
		//   X
		// XXX
		this.current.getCell(x + 0, y + 0).setLife(false);
		this.current.getCell(x + 1, y + 0).setLife(true);
		this.current.getCell(x + 2, y + 0).setLife(false);

		this.current.getCell(x + 0, y + 1).setLife(false);
		this.current.getCell(x + 1, y + 1).setLife(false);
		this.current.getCell(x + 2, y + 1).setLife(true);

		this.current.getCell(x + 0, y + 2).setLife(true);
		this.current.getCell(x + 1, y + 2).setLife(true);
		this.current.getCell(x + 2, y + 2).setLife(true);
	},
	handleClick: function(row, col) {
		this.debugLog("LifeBoard.handleClick(" + row + ", " + col + ")");
		this.current.getCell(row, col).toggleLife();
	}
};
