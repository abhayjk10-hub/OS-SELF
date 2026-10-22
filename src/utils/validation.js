(function (simulator) {
  simulator.validateProcesses = function (rows) {
    if (!rows.length) throw new Error('Add at least one process before running the simulation.');
    var ids = new Set();
    return rows.map(function (values, index) {
      var id = String(values.id || '').trim();
      var arrivalText = String(values.arrival).trim();
      var burstText = String(values.burst).trim();
      var priorityText = String(values.priority).trim();
      var arrival = Number(arrivalText);
      var burst = Number(burstText);
      var priority = Number(priorityText);
      if (!id || ids.has(id.toUpperCase())) throw new Error('Process ' + (index + 1) + ': IDs must be present and unique.');
      if (!arrivalText || !Number.isInteger(arrival) || arrival < 0) throw new Error(id + ': arrival time must be a whole number of 0 or more.');
      if (!burstText || !Number.isInteger(burst) || burst <= 0) throw new Error(id + ': burst time must be a whole number greater than 0.');
      if (!priorityText || !Number.isInteger(priority) || priority <= 0) throw new Error(id + ': priority must be a positive whole number.');
      ids.add(id.toUpperCase());
      return { id: id, arrival: arrival, burst: burst, priority: priority, order: index };
    });
  };
  simulator.validateSettings = function (algorithm, quantumText, contextEnabled, contextTimeText) {
    var quantum = Number(quantumText);
    var contextTime = Number(contextTimeText);
    if (algorithm === 'roundRobin' && (!String(quantumText).trim() || !Number.isInteger(quantum) || quantum <= 0)) {
      throw new Error('Time quantum must be a whole number greater than 0.');
    }
    if (contextEnabled && (!String(contextTimeText).trim() || !Number.isInteger(contextTime) || contextTime < 0)) {
      throw new Error('Context switch time must be a whole number of 0 or more.');
    }
    return { quantum: quantum, contextTime: contextEnabled ? contextTime : 0 };
  };
})(window.CPUSim = window.CPUSim || {});
