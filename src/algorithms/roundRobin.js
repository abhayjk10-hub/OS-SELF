(function (simulator) {
  simulator.algorithms.roundRobin.run = function (processes, options) {
    return simulator.runScheduler(processes, 'roundRobin', options);
  };
})(window.CPUSim = window.CPUSim || {});
