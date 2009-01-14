var LifeCell = Class.create({
	initialize: function(element, pLife) {
		// showLog("LifeCell init");
		this.element = element;
		this.setLife(pLife);
		// showLog("LifeCell end init");
	},
	setLife: function(pLife) {
		this.life = pLife;
		// this.redraw();
	},
	redraw: function() {
		if (this.element) {
			setClass(this.element, this.life ? 'Alive' : 'Dead');
		}
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
	},
	getLife: function() {
		return this.life;
	},
	toggleLife: function() {
		this.setLife(!this.getLife());
	},
	onclick: function() {
		this.toggleLife();
	}
});

var LifeGrid = Class.create({
	initialize: function(pTable, pHeight, pWidth) {
		showLog("LifeGrid init");
		this.table = pTable;
		this.width = pWidth;
		this.height = pHeight;
		this.addCells();
		showLog("LifeGrid end init");
	},
	addCells: function() {
		this.cells = new Array();
		for (var row = 0; row < this.height; row++) {
			this.cells[row] = new Array();
			for (var col = 0; col < this.width; col++) {
				var tableCell = this.table ? this.table.rows[row].cells[col] : null;
				this.cells[row][col] = new LifeCell(tableCell, false);
			}
			// this.table.tBodies[0].appendChild(r);
		}
	},
	getCell: function(row, col) {
		if (row < 0 || row >= this.height || col < 0 || col >= this.width) {
			fatal('Bad coords row=' + row + ' col=' + col);
			return undefined;
		}
		return this.cells[row][col];
	},
	countNeighbours: function(row, col, wrap) {
		if (row < 0 || row >= this.height || col < 0 || col >= this.width) {
			fatal('Bad coords row=' + row + ' col=' + col);
			return 0;
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
	},
	redraw: function() {
		if (this.table) {
			for (var row = 0; row < this.height; row++) {
				for (var col = 0; col < this.width; col++) {
					this.cells[row][col].redraw();
				}
			}
		}
	}
});

var LifeBoard = Class.create({
	debug: true,
	initialize: function(pTable, pHeight, pWidth, wrap) {
		if (this.debug) {
			showLog("LifeBoard init");
		}
		this.table = pTable;
		setClass(this.table, 'LifeBoard');
		this.addCells(pHeight, pWidth);
		this.wrap = !!wrap;
		this.current = new LifeGrid(this.table, pHeight, pWidth);
		this.next = new LifeGrid(this.table, pHeight, pWidth);
		if (this.debug) {
			showLog("LifeBoard end init");
		}
	},
	addCells: function(height, width) {
		for (var row = 0; row < height; row++) {
			var tableRow = this.table.insertRow(this.table.rows.length);
			setClass(tableRow, 'LifeRow');
			for (var col = 0; col < width; col++) {
				var cell = tableRow.insertCell(0);
				// Must contain something in order to be drawn properly
				cell.appendChild(dctn(' '));
			}
			// this.table.tBodies[0].appendChild(r);
		}
	},
	redraw: function() {
		this.current.redraw();
	},
	nextGeneration: function() {
		clearLog();
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
				// log('row=' + row + ' col=' + col + ' oldN=' + n + ' newLife=' + nextCell.getLife());
			}
		}
		var temp = this.current;
		this.current = this.next;
		this.next = temp;
		// this.refill();
		if (changed) {
			this.redraw();
		} else if (this.debug) {
			showLog('Stable');
		}
		return !!changed;
	},
	toggleWrap: function() {
		this.wrap = !this.wrap;
		if (this.debug) {
			showLog('New wrap: ' + this.wrap);
		}
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
	}
});
