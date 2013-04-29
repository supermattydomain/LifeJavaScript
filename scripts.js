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
