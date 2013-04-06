(function($) {
	$(function() {
		// 23 is prime
		var width = 23,
			height = 23,
			delay = 100,
			interval = undefined,
			buttonSingleStep = $('#buttonSingleStep'),
			buttonStart = $('#buttonStart'),
			buttonClear = $('#buttonClear'),
			buttonRandomise = $('#buttonRandomise'),
			checkboxWrap = $('#checkboxWrap'),
			board = new LifeBoard($('#boardTable'), width, height, checkboxWrap.val());
		function timerFunc() {
			if (!board.nextGeneration()) {
				stopRunning();
			}
		}

		function startRunning(delay) {
			interval = setInterval(timerFunc, delay);
			buttonStart.val('Pause');
		}

		function stopRunning() {
			clearInterval(interval);
			interval = undefined;
			buttonStart.val('Resume');
		}

		function toggleRunning(delay) {
			if (interval) {
				stopRunning();
			} else {
				startRunning(delay);
			}
		}
		checkboxWrap.on('click', function() {
			board.toggleWrap();
		});
		buttonSingleStep.on('click', function() {
			board.nextGeneration();
		});
		buttonStart.on('click', function() {
			toggleRunning(delay);
		});
		buttonClear.on('click', function() {
			board.clear();
		});
		buttonRandomise.on('click', function() {
			board.randomise();
		});
		board.glider(0, 0);
	});
})(jQuery);
