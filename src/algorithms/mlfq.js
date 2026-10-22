(function (simulator) {
  simulator.algorithms.mlfq.run = function (processes, options) {
    return simulator.runMlfqScheduler(processes, options);
  };
})(window.CPUSim = window.CPUSim || {});
