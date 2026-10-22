(function (simulator) {
  simulator.algorithms.nonPreemptive.run = function (processes, options) {
    return simulator.runScheduler(processes, 'nonPreemptive', options);
  };
})(window.CPUSim = window.CPUSim || {});
