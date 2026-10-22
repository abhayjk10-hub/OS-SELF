(function (simulator) {
  simulator.calculateMetrics = function (processes, timeline, contextSwitches) {
    var metrics = processes.map(function (process) {
      var turnaround = process.completion - process.arrival;
      return {
        id: process.id, arrival: process.arrival, burst: process.burst, priority: process.priority,
        completion: process.completion, turnaround: turnaround, waiting: turnaround - process.burst,
        response: process.firstStart - process.arrival
      };
    });
    var totalTime = timeline.length ? timeline[timeline.length - 1].end : 0;
    var busyTime = metrics.reduce(function (sum, process) { return sum + process.burst; }, 0);
    var idleTime = timeline.reduce(function (sum, block) { return sum + (block.type === 'idle' ? block.end - block.start : 0); }, 0);
    var switchTime = timeline.reduce(function (sum, block) { return sum + (block.type === 'switch' ? block.end - block.start : 0); }, 0);
    function average(field) {
      return metrics.reduce(function (sum, process) { return sum + process[field]; }, 0) / metrics.length;
    }
    return {
      metrics: metrics,
      averages: { waiting: average('waiting'), turnaround: average('turnaround'), response: average('response') },
      totalTime: totalTime, busyTime: busyTime, idleTime: idleTime,
      utilization: totalTime ? busyTime / totalTime * 100 : 0,
      switchTime: switchTime,
      switchOverhead: totalTime ? switchTime / totalTime * 100 : 0,
      throughput: totalTime ? metrics.length / totalTime : 0,
      contextSwitches: contextSwitches
    };
  };
})(window.CPUSim = window.CPUSim || {});
