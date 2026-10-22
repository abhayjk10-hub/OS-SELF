(function (simulator) {
  simulator.renderComparison = function (results) {
    var section = document.getElementById('comparisonSection');
    section.classList.remove('hidden');
    document.getElementById('comparisonCharts').innerHTML = Object.keys(simulator.algorithms).map(function (key, index) {
      return '<article class="panel comparison-card"><p class="section-kicker">Algorithm ' + (index + 1) +
        '</p><h3>' + simulator.algorithms[key].label + '</h3><div class="gantt-container" id="comparisonGantt' + index + '"></div></article>';
    }).join('');
    Object.keys(simulator.algorithms).forEach(function (key, index) {
      simulator.renderGantt(document.getElementById('comparisonGantt' + index), results[key].timeline);
    });
    document.getElementById('comparisonTableBody').innerHTML = Object.keys(simulator.algorithms).map(function (key) {
      var result = results[key];
      return '<tr><td>' + simulator.algorithms[key].label + '</td><td>' + simulator.formatNumber(result.averages.waiting) +
        '</td><td>' + simulator.formatNumber(result.averages.turnaround) + '</td><td>' + simulator.formatNumber(result.averages.response) +
        '</td><td>' + simulator.formatNumber(result.utilization) + '%</td><td>' +
        simulator.formatNumber(result.switchOverhead) + '%</td><td>' + result.idleTime +
        '</td><td>' + simulator.formatNumber(result.throughput) + '</td><td>' + result.contextSwitches + '</td></tr>';
    }).join('');
    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
})(window.CPUSim = window.CPUSim || {});
