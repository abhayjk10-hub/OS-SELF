(function (simulator) {
  simulator.algorithms.preemptive.run = function (processes, options) {
    return simulator.runScheduler(processes, 'preemptive', options);
  };
})(window.CPUSim = window.CPUSim || {});
