if (typeof(life) === 'undefined') {
	Life = {};
}

Life.Cell = function(element, pLife) {
	this.element = element;
	this.setLife(pLife);
};

$.extend(Life.Cell.prototype, {
	getLife: function() {
		return this.life;
	},
	setLife: function(pLife) {
		this.life = pLife;
		this.element.className = this.life ? 'Alive' : 'Dead';
		return this;
	},
	toggleLife: function() {
		this.setLife(!this.getLife());
		return this;
	},
	setNeighbours: function(currentLife, pNeighbours) {
		var newLife;
		if (pNeighbours < 2) {
			// death by isolation
			newLife = false;
		} else if (2 === pNeighbours) {
			// no change
			newLife = currentLife;
		} else if (3 === pNeighbours) {
			// birth or survival
			newLife = true;
		} else {
			// death by overcrowding
			newLife = false;
		}
		this.setLife(newLife);
		return this;
	}
});

Life.Grid = function(pTable, pHeight, pWidth) {
	this.table = pTable;
	this.width = pWidth;
	this.height = pHeight;
	this.createLifeCells();
};

$.extend(Life.Grid.prototype, {
	getCell: function(row, col) {
		return this.cells[row][col];
	},
	createLifeCells: function() {
		this.cells = [];
		for (var row = 0; row < this.height; row++) {
			this.cells[row] = [];
			for (var col = 0; col < this.width; col++) {
				var tableCell = this.table[0].rows[row].cells[col];
				this.cells[row][col] = new Life.Cell(tableCell, false);
			}
		}
		return this;
	},
	countNeighbours: function(row, col, wrap) {
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
});

Life.Board = function(pTable, pHeight, pWidth, wrap) {
	this.table = pTable;
	this.table[0].className = 'LifeBoard';
	this.createTable(pHeight, pWidth);
	this.wrap = !!wrap;
	this.current = new Life.Grid(this.table, pHeight, pWidth);
	this.next = new Life.Grid(this.table, pHeight, pWidth);
};

$.extend(Life.Board.prototype, {
	createTable: function(height, width) {
		for (var row = 0; row < height; row++) {
			var tableRow = this.table[0].insertRow(this.table[0].rows.length);
			for (var col = 0; col < width; col++) {
				tableRow.insertCell(0);
			}
		}
		return this;
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
				changed |= (currentCell.getLife() != nextCell.getLife());
				// debug('row=' + row + ' col=' + col + ' oldN=' + n + ' newLife=' + nextCell.getLife());
			}
		}
		if (changed) {
			// swap current and next generation grids
			var temp = this.current;
			this.current = this.next;
			this.next = temp;
		} else {
			debug('Stable');
		}
		return !!changed;
	},
	getWrap: function() {
		return this.wrap;
	},
	setWrap: function(newWrap) {
		if (newWrap != this.wrap) {
			this.wrap = newWrap;
		}
		return this;
	},
	toggleWrap: function() {
		this.setWrap(!this.getWrap());
		return this;
	},
	clear: function() {
		for (var row = 0; row < this.current.height; row++) {
			for (var col = 0; col < this.current.width; col++) {
				this.current.getCell(row, col).setLife(false);
			}
		}
		return this;
	},
	randomise: function() {
		for (var row = 0; row < this.current.height; row++) {
			for (var col = 0; col < this.current.width; col++) {
				var random = Math.random();
				this.current.getCell(row, col).setLife(random * 3 >= 2);
			}
		}
		return this;
	},
	glider: function(row, col) {
		//  O 
		//   O
		// OOO
		this.current.getCell(row + 0, col + 0).setLife(false);
		this.current.getCell(row + 1, col + 0).setLife(true);
		this.current.getCell(row + 2, col + 0).setLife(false);

		this.current.getCell(row + 0, col + 1).setLife(false);
		this.current.getCell(row + 1, col + 1).setLife(false);
		this.current.getCell(row + 2, col + 1).setLife(true);

		this.current.getCell(row + 0, col + 2).setLife(true);
		this.current.getCell(row + 1, col + 2).setLife(true);
		this.current.getCell(row + 2, col + 2).setLife(true);
		return this;
	},
	handleClick: function(row, col) {
		this.current.getCell(row, col).toggleLife();
	}
});
