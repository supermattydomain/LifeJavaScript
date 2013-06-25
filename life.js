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

Life.Board = function(table) {
	this.table = table;
	this.createTable(this.height, this.width);
	this.current = new Life.Grid(this.table, this.height, this.width);
	this.next = new Life.Grid(this.table, this.height, this.width);
};

$.extend(Life.Board.prototype, {
	delay: 100,
	// 53 is prime
	width: 53,
	height: 53,
	wrap: true,
	interval: undefined,
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
			$().toastmessage('showNoticeToast', 'Stable');
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
		this.wrap = !this.wrap;
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
	cannedShape: function(row, col, shapeName) {
		var shape = Life.cannedShapes[shapeName], r, c;
		for (r = 0; r < shape.length; r++) {
			if (shape[r].charAt(0) === '!') {
				continue;
			}
			for (c = 0; c < shape[r].length; c++) {
				this.current.getCell(row + r, col + c).setLife(shape[r].charAt(c) !== ' ' && shape[r].charAt(c) !== '.');
			}
		}
	},
	handleClick: function(row, col) {
		this.current.getCell(row, col).toggleLife();
	},
	tick: function() {
		if (!this.nextGeneration()) {
			this.stop();
		}
	},
	isRunning: function() {
		return !!this.interval;
	},
	start: function() {
		var that = this;
		this.stop();
		this.interval = setInterval(function() {
			that.tick();
		}, this.delay);
		this.table.trigger(Life.eventNames.started);
		return this;
	},
	stop: function() {
		if (this.interval) {
			clearInterval(this.interval);
			this.interval = undefined;
			this.table.trigger(Life.eventNames.stopped);
		}
		return this;
	},
	toggleRunning: function() {
		if (this.isRunning()) {
			this.stop();
		} else {
			this.start();
		}
		return this;
	},
	setDelay: function(newDelay) {
		var that = this, running;
		if (this.interval) {
			clearInterval(this.interval);
			this.interval = undefined;
			running = true;
		} else {
			running = false;
		}
		this.delay = newDelay;
		if (running) {
			this.interval = setInterval(function() {
				that.tick();
			}, this.delay);
		}
		return this;
	}
});

$.extend(Life, {
	eventNames: {
		started: 'Life.started',
		stopped: 'Life.stopped'
	},
	cannedShapes: {
		glider: [
			'!Name: Glider',
			'!Richard Guy, 1970',
			'!,',
			'.O.',
			'..O',
			'OOO'
		],
		'light-weight spaceship': [
			'Name: Light-weight spaceship',
			'!John Conway, 1970',
			'!',
			'.O..O',
			'O....',
			'O...O',
			'OOOO.'
		],
		'middle-weight spaceship': [
			'!Name: Middle-weight spaceship',
			'!John Conway, 1970',
			'!',
			'...O..',
			'.O...O',
			'O.....',
			'O....O',
			'OOOOO.'
		],
		'heavy-weight spaceship': [
			'!Name: Heavy-weight spaceship',
			'!John Conway, 1970',
			'!',
			'...OO..',
			'.O....O',
			'O......',
			'O.....O',
			'OOOOOO.'
		],
		'glider gun': [
			'!Name: Gosper glider gun',
			'!Bill Gosper, November 1970',
			'!',
			'........................O...........',
			'......................O.O...........',
			'............OO......OO............OO',
			'...........O...O....OO............OO',
			'OO........O.....O...OO..............',
			'OO........O...O.OO....O.O...........',
			'..........O.....O.......O...........',
			'...........O...O....................',
			'............OO......................'
		]
	}
});

(function($) {
	$(function() {
		var buttonSingleStep = $('#buttonSingleStep'),
			buttonStart = $('#buttonStart'),
			buttonClear = $('#buttonClear'),
			buttonRandomise = $('#buttonRandomise'),
			checkboxWrap = $('#checkboxWrap'),
			boardTable = $('table.LifeBoard'),
			speedSlider = $('#speedSlider'),
			board = new Life.Board(boardTable);
		$('button, input[type="button"], input[type="checkbox"]').button();
		checkboxWrap.on('click', function() {
			board.toggleWrap();
		});
		buttonSingleStep.on('click', function() {
			board.tick();
		});
		buttonStart.on('click', function() {
			board.toggleRunning();
		});
		boardTable.on(Life.eventNames.started, function() {
			buttonStart.val('Pause');
		}).on(Life.eventNames.stopped, function() {
			buttonStart.val('Resume');
		});
		buttonClear.on('click', function() {
			board.clear();
		});
		buttonRandomise.on('click', function() {
			board.randomise();
		});
		boardTable.find('td').on('click', function() {
			board.handleClick(this.parentNode.rowIndex, this.cellIndex);
		});
		function updateDelay() {
			board.setDelay(speedSlider.slider("option", "max") - speedSlider.slider("option", "value"));
		}
		speedSlider.slider({ min: 0, max: 1000, value: 500, stop: updateDelay });
		updateDelay();
		board.cannedShape(0, 0, 'glider gun');
	});
})(jQuery);
