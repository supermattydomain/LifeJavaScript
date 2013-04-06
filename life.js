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
	setLife: function(newLife) {
		this.life = newLife;
		if (this.life) {
			this.element.removeClass('Dead').addClass('Alive');
		} else {
			this.element.removeClass('Alive').addClass('Dead');
		}
		return this;
	},
	toggleLife: function() {
		return this.setLife(!this.getLife());
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
		return this.setLife(newLife);
	}
});

Life.Grid = function(table, height, width) {
	this.table = table;
	this.width = width;
	this.height = height;
	this.createCells();
};

$.extend(Life.Grid.prototype, {
	getCell: function(row, col) {
		return this.cells[row][col];
	},
	createCells: function() {
		var row, col;
		this.cells = [];
		for (row = 0; row < this.height; row++) {
			this.cells[row] = [];
			for (col = 0; col < this.width; col++) {
				this.cells[row][col] = new Life.Cell($(this.table[0].rows[row].cells[col]), false);
			}
		}
		return this;
	},
	countNeighbours: function(row, col, wrap) {
		var n = 0, colmin = col - 1, rowmin = row - 1, colmax = col + 1, rowmax = row + 1, scanrow, scancol, wraprow, wrapcol;
		if (!wrap) {
			// If not wrapping, clip to board edges
			if (colmin < 0) { colmin = 0; }
			if (rowmin < 0) { rowmin = 0; }
			if (colmax >= this.width) { colmax = this.width - 1; }
			if (rowmax >= this.height) { rowmax = this.height - 1; }
		}
		for (scancol = colmin; scancol <= colmax; scancol++) {
			for (scanrow = rowmin; scanrow <= rowmax; scanrow++) {
				if (scanrow == row && scancol == col) {
					continue; // don't count self
				}
				wrapcol = scancol;
				wraprow = scanrow;
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
	this.createTable(pHeight, pWidth);
	this.wrap = !!wrap;
	this.current = new Life.Grid(this.table, pHeight, pWidth);
	this.next = new Life.Grid(this.table, pHeight, pWidth);
};

$.extend(Life.Board.prototype, {
	createTable: function(height, width) {
		var row, col, tableRow;
		for (row = 0; row < height; row++) {
			tableRow = this.table[0].insertRow(this.table[0].rows.length);
			for (col = 0; col < width; col++) {
				tableRow.insertCell(0);
			}
		}
		return this;
	},
	nextGeneration: function() {
		var row, col, changed = false, n, currentCell, nextCell, temp;
		for (row = 0; row < this.current.height; row++) {
			for (col = 0; col < this.current.width; col++) {
				n = this.current.countNeighbours(row, col, this.wrap);
				currentCell = this.current.getCell(row, col);
				nextCell = this.next.getCell(row, col);
				nextCell.setNeighbours(currentCell.getLife(), n);
				changed = changed || (currentCell.getLife() != nextCell.getLife());
			}
		}
		if (changed) {
			// swap current and next generation grids
			temp = this.current;
			this.current = this.next;
			this.next = temp;
		} else {
			debug('Stable');
		}
		return changed;
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
		var row, col;
		for (row = 0; row < this.current.height; row++) {
			for (col = 0; col < this.current.width; col++) {
				this.current.getCell(row, col).setLife(false);
			}
		}
		return this;
	},
	randomise: function() {
		var row, col;
		for (row = 0; row < this.current.height; row++) {
			for (col = 0; col < this.current.width; col++) {
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
