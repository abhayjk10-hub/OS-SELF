(function (simulator) {
  simulator.algorithms.hrrn.run = function (processes, options) {
    return simulator.runScheduler(processes, 'hrrn', options);
  };
})(window.CPUSim = window.CPUSim || {});
