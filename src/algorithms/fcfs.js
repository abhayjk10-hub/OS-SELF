(function (simulator) {
  simulator.algorithms.fcfs.run = function (processes, options) {
    return simulator.runScheduler(processes, 'fcfs', options);
  };
})(window.CPUSim = window.CPUSim || {});
