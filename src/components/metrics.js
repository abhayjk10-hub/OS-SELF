(function (simulator) {
  simulator.renderMetrics = function (result) {
    var byId = function (id) { return document.getElementById(id); };
    byId('averageWaiting').textContent = simulator.formatNumber(result.averages.waiting);
    byId('averageTurnaround').textContent = simulator.formatNumber(result.averages.turnaround);
    byId('averageResponse').textContent = simulator.formatNumber(result.averages.response);
    byId('cpuUtilization').textContent = simulator.formatNumber(result.utilization) + '%';
    byId('busyIdleLabel').textContent = 'Total simulation time ' + result.totalTime;
    byId('cpuBusyTime').textContent = String(result.busyTime);
    byId('cpuIdleTime').textContent = String(result.idleTime);
    byId('throughput').textContent = simulator.formatNumber(result.throughput);
    byId('contextSwitchCount').textContent = String(result.contextSwitches);
    byId('averagesNote').textContent = 'Average WT: ' + simulator.formatNumber(result.averages.waiting) +
      ' · Average TAT: ' + simulator.formatNumber(result.averages.turnaround) +
      ' · Average RT: ' + simulator.formatNumber(result.averages.response);
    byId('performanceTableBody').innerHTML = result.metrics.map(function (process) {
      return '<tr><td>' + simulator.escapeHtml(process.id) + '</td><td>' + process.arrival +
        '</td><td>' + process.burst + '</td><td>' + process.priority + '</td><td>' + process.completion +
        '</td><td>' + process.turnaround + '</td><td>' + process.waiting + '</td><td>' + process.response +
        '</td><td>' + simulator.formatNumber(process.turnaround / process.burst) + '</td></tr>';
    }).join('');
    var longestWait = result.metrics.reduce(function (longest, process) {
      return process.waiting > longest.waiting ? process : longest;
    }, result.metrics[0]);
    var bestResponse = result.metrics.reduce(function (best, process) {
      return process.response < best.response ? process : best;
    }, result.metrics[0]);
    var insights = [
      ['Longest wait', simulator.escapeHtml(longestWait.id) + ' waited ' + longestWait.waiting + ' time units', 'WAITING TIME'],
      ['Quickest first response', simulator.escapeHtml(bestResponse.id) + ' responded in ' + bestResponse.response + ' time units', 'RESPONSE TIME'],
      ['Context-switch overhead', simulator.formatNumber(result.switchOverhead) + '% of elapsed time', result.switchTime + ' switch time units'],
      ['Workload efficiency', simulator.formatNumber(result.utilization) + '% productive CPU time', result.contextSwitches + ' context switches']
    ];
    byId('insightGrid').innerHTML = insights.map(function (insight) {
      return '<article class="insight-card"><span>' + insight[2] + '</span><strong>' + insight[0] +
        '</strong><small>' + insight[1] + '</small></article>';
    }).join('');
  };
})(window.CPUSim = window.CPUSim || {});
