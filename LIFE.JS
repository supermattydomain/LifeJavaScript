var debug = 0;

function log(text) {
	$('logDiv').appendChild(document.createTextNode(text));
	$('logDiv').appendChild(document.createElement('br'));
}

function clearLog() {
	var log = $('logDiv');
	while (log.firstChild) {
		log.removeChild(log.firstChild);
	}
}

function LifeCell(pLife) {
	var td = document.createElement('td');
	this.setLife = function(pLife) {
		this.life = pLife;
		this.className = this.life ? 'Alive' : 'Dead';
	};
	this.setNeighbours = function(currentLife, pNeighbours) {
		var life;
		if (pNeighbours < 2) {
			// death by isolation
			life = false;
		} else if (2 == pNeighbours) {
			// no change
			life = currentLife;
		} else if (3 == pNeighbours) {
			// birth or survival
			life = true;
		} else {
			// death by ovecrowding
			life = false;
		}
		this.setLife(life);
	};
	this.getLife = function() {
		return this.life;
	};
	this.toggleLife = function() {
		this.setLife(!this.getLife());
	};
	this.onclick = function() {
		this.toggleLife();
	};
	Object.extend(td, this);
	td.appendChild(document.createTextNode(' '));
	td.setLife(pLife);
	return td;
}

function LifeGrid(pWidth, pHeight) {
	var table = document.createElement('table');
	this.className = 'LifeBoard';
	this.width = pWidth;
	this.height = pHeight;
	this.addCells = function() {
		for (var i = 0; i < this.height; i++) {
			row = document.createElement('tr');
			row.className = 'LifeRow';
			for (var j = 0; j < this.width; j++) {
				var cell = new LifeCell();
				row.appendChild(cell);
			}
			this.appendChild(row);
		}
	};
	this.getCell = function(x, y) {
		if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
			log('Bad coords x=' + x + ', y=' + y);
			return undefined;
		}
		var rows = this.getElementsByTagName("tr");
		var cells = rows[y].getElementsByTagName("td");
		return cells[x];
	};
	this.countNeighbours = function(x, y, wrap) {
		var n = 0;
		var xmin = x - 1, ymin = y - 1;
		var xmax = x + 1, ymax = y + 1;
		if (!wrap) {
			// If not wrapping, clip to board edges
			if (xmin < 0) { xmin = 0; }
			if (ymin < 0) { ymin = 0; }
			if (xmax >= this.width) { xmax = this.width - 1; }
			if (ymax >= this.height) { ymax = this.height - 1; }
		}
		for (xx = xmin; xx <= xmax; xx++) {
			for (yy = ymin; yy <= ymax; yy++) {
				if (xx == x && yy == y) {
					continue; // don't count self
				}
				var xxx = xx, yyy = yy;
				if (wrap) {
					// if wrapping, wrap around edges
					if (xxx < 0) {
						xxx += this.height;
					} else if (xx >= this.height) {
						xxx -= this.height;
					}
					if (yyy < 0) {
						yyy += this.height;
					} else if (yy >= this.height) {
						yyy -= this.height;
					}
				}
				if (this.getCell(xxx, yyy).getLife()) {
					n++;
				}
			}
		}
		return n;
	};
	Object.extend(table, this);
	table.addCells();
	return table;
}

function LifeBoard(width, height, wrap) {
	var div = document.createElement('div');
	this.wrap = !!wrap;
	this.current = new LifeGrid(width, height);
	this.next = new LifeGrid(width, height);
	this.refill = function() {
		while (this.firstChild) {
			this.removeChild(this.firstChild);
		}
		if (debug) {
			this.appendChild(document.createTextNode('Current'));
		}
		this.appendChild(this.current);
		if (debug) {
			this.appendChild(document.createTextNode('Next'));
			this.appendChild(this.next);
		}
	};
	this.nextGeneration = function() {
		clearLog();
		var changed = false;
		var x, y;
		for (y = 0; y < this.current.height; y++) {
			for (x = 0; x < this.current.width; x++) {
				var n = this.current.countNeighbours(x, y, this.wrap);
				var currentCell = this.current.getCell(x, y);
				var nextCell = this.next.getCell(x, y);
				nextCell.setNeighbours(currentCell.getLife(), n);
				if (!changed && currentCell.getLife() != nextCell.getLife()) {
					changed = true;
				}
				// log('x=' + x + ', y=' + y + ', oldN=' + n + ', newLife=' + nextCell.getLife());
			}
		}
		var temp = this.current;
		this.current = this.next;
		this.next = temp;
		this.refill();
		return changed;
	};
	this.toggleWrap = function() {
		this.wrap = !this.wrap;
		if (debug) {
			log('New wrap: ' + this.wrap)
		}
	};
	this.clear = function() {
		for (y = 0; y < this.current.height; y++) {
			for (x = 0; x < this.current.width; x++) {
				this.current.getCell(x, y).setLife(false);
			}
		}
	};
	this.glider = function(x, y) {
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
	};
	Object.extend(div, this);
	div.refill();
	return div;
}

var interval;

function timerFunc() {
	document.getElementById('boardDiv').firstChild.nextGeneration();
}

function startRunning(delay) {
	interval = setInterval("timerFunc()", delay);
}

function stopRunning() {
	clearInterval(interval);
	interval = undefined;
}

function toggleRunning(delay) {
	if (interval) {
		$('toggleButton').value = 'Resume';
		stopRunning();
	} else {
		$('toggleButton').value = 'Pause';
		startRunning(delay);
	}
}

function toggleWrap() {
	document.getElementById('boardDiv').firstChild.toggleWrap();
}

function clearBoard() {
	document.getElementById('boardDiv').firstChild.clear();
}
