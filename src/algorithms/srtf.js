(function (simulator) {
  simulator.algorithms.srtf.run = function (processes, options) {
    return simulator.runScheduler(processes, 'srtf', options);
  };
})(window.CPUSim = window.CPUSim || {});
