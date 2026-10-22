(function (simulator) {
  simulator.playReadyQueue = function (trace, token) {
    var current = document.getElementById('readyQueueCurrent');
    var list = document.getElementById('readyQueueTrace');
    list.innerHTML = '';
    if (!trace.length) {
      current.textContent = 'No scheduling decisions to display.';
      return Promise.resolve();
    }
    var index = 0;
    return new Promise(function (resolve) {
      function advance() {
        if (token !== simulator.runToken) { resolve(); return; }
        var step = trace[index];
        var queueLabels = step.queue.length ? step.queue.map(function (process) {
          if (step.kind === 'mlfq') return process.id + ' (Q' + (process.level + 1) + ')';
          return process.id + (step.kind === 'preemptive' || step.kind === 'nonPreemptive' ? ' (priority ' + process.priority + ')' : '');
        }) : [];
        var queueText = queueLabels.length ? queueLabels.join('  ›  ') : 'empty';
        current.innerHTML = '<strong>t=' + step.time + '</strong> · Running <strong>' +
          simulator.escapeHtml(step.running) + (step.kind === 'mlfq' ? ' (Q' + (step.level + 1) + ')' : '') + '</strong> · Ready: ' +
          (queueLabels.length ? queueLabels.map(simulator.escapeHtml).join('  ›  ') : 'empty');
        var item = document.createElement('li');
        item.textContent = 't=' + step.time + ': running ' + step.running +
          ((step.kind === 'preemptive' || step.kind === 'nonPreemptive') ? ' (priority ' + step.priority + ')' : '') +
          (step.kind === 'mlfq' ? ' (queue ' + (step.level + 1) + ')' : '') +
          ' · queue [' + (queueText === 'empty' ? '' : queueText) + ']';
        list.appendChild(item);
        index += 1;
        if (index < trace.length) window.setTimeout(advance, 140);
        else {
          window.setTimeout(function () {
            if (token === simulator.runToken) current.textContent = 'Simulation complete · ' + trace.length + ' dispatch decision' + (trace.length === 1 ? '' : 's') + ' shown.';
            resolve();
          }, 140);
        }
      }
      advance();
    });
  };
})(window.CPUSim = window.CPUSim || {});
