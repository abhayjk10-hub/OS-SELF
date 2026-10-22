(function (simulator) {
  simulator.algorithms.sjf.run = function (processes, options) {
    return simulator.runScheduler(processes, 'sjf', options);
  };
})(window.CPUSim = window.CPUSim || {});
