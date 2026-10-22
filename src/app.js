(function (simulator) {
  var names = simulator.algorithms;
  var runButton = document.getElementById('runButton');
  var latestResult = null;
  var latestAlgorithm = '';
  var playbackIndex = -1;
  var playbackTimer = null;
  var savedWorkloadKey = 'kernel-lab.saved-workload.v1';
  var workloads = {
    priority: simulator.exampleProcesses,
    idle: [
      { id: 'P1', arrival: 2, burst: 4, priority: 2 },
      { id: 'P2', arrival: 9, burst: 2, priority: 1 },
      { id: 'P3', arrival: 10, burst: 1, priority: 3 }
    ],
    roundRobin: [
      { id: 'P1', arrival: 0, burst: 7, priority: 2 },
      { id: 'P2', arrival: 1, burst: 4, priority: 1 },
      { id: 'P3', arrival: 2, burst: 5, priority: 3 }
    ]
  };

  function showError(error) {
    document.getElementById('validationMessage').textContent = error.message;
  }
  function clearError() {
    document.getElementById('validationMessage').textContent = '';
  }
  function loadWorkload(name) {
    simulator.processInput.load(workloads[name]);
    document.querySelectorAll('.scenario-chip[data-workload]').forEach(function (button) {
      var active = button.dataset.workload === name;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    clearError();
  }
  function stopPlayback() {
    if (playbackTimer !== null) window.clearInterval(playbackTimer);
    playbackTimer = null;
    document.getElementById('playPauseButton').textContent = '▶';
    document.getElementById('playPauseButton').setAttribute('aria-label', 'Play schedule');
  }
  function showPlaybackBlock(index) {
    if (!latestResult || !latestResult.timeline.length) return;
    playbackIndex = Math.max(0, Math.min(index, latestResult.timeline.length - 1));
    var block = latestResult.timeline[playbackIndex];
    var slider = document.getElementById('timelineSlider');
    slider.value = String(playbackIndex);
    simulator.renderGantt(document.getElementById('ganttContainer'), latestResult.timeline, playbackIndex);
    document.getElementById('playbackTime').textContent = 't = ' + block.start + '–' + block.end;
    document.getElementById('playbackStatus').textContent =
      'Dispatch ' + (playbackIndex + 1) + ' of ' + latestResult.timeline.length + ' · ' + block.id +
      (block.type === 'process' ? ' runs' : block.type === 'idle' ? ' · CPU idle' : ' · context switch');
    document.getElementById('previousBlockButton').disabled = playbackIndex === 0;
    document.getElementById('nextBlockButton').disabled = playbackIndex === latestResult.timeline.length - 1;
  }
  function downloadFile(filename, content, mimeType) {
    var blob = new Blob([content], { type: mimeType });
    var url = URL.createObjectURL(blob);
    var link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }
  function collectInputs(algorithm) {
    clearError();
    return {
      processes: simulator.processInput.read(),
      options: simulator.algorithmSelector.settings(algorithm)
    };
  }
  function showResults(result, algorithm) {
    var section = document.getElementById('resultsSection');
    section.classList.remove('hidden');
    latestResult = result;
    latestAlgorithm = algorithm;
    stopPlayback();
    document.getElementById('resultsTitle').textContent = names[algorithm].label + ' results';
    document.getElementById('algorithmBadge').textContent = names[algorithm].label;
    document.getElementById('chartTitle').textContent = names[algorithm].label + ' timeline';
    var slider = document.getElementById('timelineSlider');
    slider.max = String(Math.max(0, result.timeline.length - 1));
    slider.disabled = !result.timeline.length;
    document.getElementById('playPauseButton').disabled = !result.timeline.length;
    showPlaybackBlock(0);
    simulator.renderMetrics(result);
    document.getElementById('comparisonSection').classList.add('hidden');
    var token = ++simulator.runToken;
    runButton.disabled = true;
    simulator.playReadyQueue(result.trace, token).then(function () {
      if (token === simulator.runToken) runButton.disabled = false;
    });
    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  function runSelected() {
    simulator.runToken += 1;
    runButton.disabled = false;
    try {
      var algorithm = simulator.algorithmSelector.get();
      var input = collectInputs(algorithm);
      showResults(names[algorithm].run(input.processes, input.options), algorithm);
    } catch (error) {
      showError(error);
    }
  }
  function runComparison() {
    simulator.runToken += 1;
    runButton.disabled = false;
    try {
      var input = collectInputs('roundRobin');
      var results = {};
      Object.keys(names).forEach(function (key) {
        results[key] = names[key].run(input.processes, input.options);
      });
      simulator.renderComparison(results);
    } catch (error) {
      showError(error);
    }
  }
  function resetResults() {
    simulator.runToken += 1;
    runButton.disabled = false;
    latestResult = null;
    latestAlgorithm = '';
    stopPlayback();
    playbackIndex = -1;
    document.getElementById('resultsTitle').textContent = 'Simulation results';
    document.getElementById('algorithmBadge').textContent = 'Ready';
    document.getElementById('chartTitle').textContent = 'CPU timeline';
    document.getElementById('ganttContainer').innerHTML = '<div class="empty-state">Run a simulation to see the CPU timeline.</div>';
    document.getElementById('timelineSlider').value = '0';
    document.getElementById('timelineSlider').max = '0';
    document.getElementById('timelineSlider').disabled = true;
    document.getElementById('playPauseButton').disabled = true;
    document.getElementById('previousBlockButton').disabled = true;
    document.getElementById('nextBlockButton').disabled = true;
    document.getElementById('playbackTime').textContent = 't = —';
    document.getElementById('playbackStatus').textContent = 'Run a schedule to step through dispatches.';
    document.getElementById('readyQueueCurrent').textContent = 'Run the simulation to see ready-queue decisions.';
    document.getElementById('readyQueueTrace').innerHTML = '';
    document.getElementById('performanceTableBody').innerHTML = '';
    document.getElementById('averagesNote').textContent = '';
    ['averageWaiting', 'averageTurnaround', 'averageResponse', 'cpuUtilization', 'throughput', 'contextSwitchCount'].forEach(function (id) {
      document.getElementById(id).textContent = '—';
    });
    document.getElementById('busyIdleLabel').textContent = 'Total simulation time —';
    document.getElementById('cpuBusyTime').textContent = '—';
    document.getElementById('cpuIdleTime').textContent = '—';
    document.getElementById('insightGrid').innerHTML = '';
    document.getElementById('resultsSection').classList.add('hidden');
    document.getElementById('comparisonSection').classList.add('hidden');
    clearError();
  }

  simulator.runToken = 0;
  document.getElementById('addProcessButton').addEventListener('click', function () { simulator.processInput.addRow(); });
  document.getElementById('removeProcessButton').addEventListener('click', function () {
    var row = simulator.processInput.rows.pop();
    if (row) row.remove();
    simulator.processInput.updateCount();
  });
  document.getElementById('clearAllButton').addEventListener('click', function () {
    simulator.processInput.clear();
    document.querySelectorAll('.scenario-chip[data-workload]').forEach(function (button) {
      button.classList.remove('is-active');
      button.setAttribute('aria-pressed', 'false');
    });
    clearError();
  });
  document.querySelectorAll('.scenario-chip[data-workload]').forEach(function (button) {
    button.addEventListener('click', function () { loadWorkload(button.dataset.workload); });
  });
  document.getElementById('processTableBody').addEventListener('input', function () {
    document.querySelectorAll('.scenario-chip[data-workload]').forEach(function (button) {
      button.classList.remove('is-active');
      button.setAttribute('aria-pressed', 'false');
    });
  });
  document.getElementById('runButton').addEventListener('click', runSelected);
  document.getElementById('compareButton').addEventListener('click', runComparison);
  document.getElementById('resetButton').addEventListener('click', resetResults);
  document.getElementById('closeComparisonButton').addEventListener('click', function () {
    document.getElementById('comparisonSection').classList.add('hidden');
  });
  document.getElementById('algorithmSelect').addEventListener('change', simulator.algorithmSelector.update.bind(simulator.algorithmSelector));
  document.getElementById('contextSwitchEnabled').addEventListener('change', function (event) {
    document.getElementById('contextSwitchSetting').classList.toggle('hidden', !event.target.checked);
  });
  document.getElementById('exportResultsButton').addEventListener('click', function () {
    if (!latestResult) return;
    function csvCell(value) {
      return '"' + String(value).replace(/"/g, '""') + '"';
    }
    var rows = [
      ['Process ID', 'Arrival time', 'Burst time', 'Priority', 'Completion time', 'Turnaround time', 'Waiting time', 'Response time', 'Response ratio']
    ];
    latestResult.metrics.forEach(function (process) {
      rows.push([process.id, process.arrival, process.burst, process.priority, process.completion, process.turnaround, process.waiting, process.response, process.turnaround / process.burst]);
    });
    rows.push([]);
    rows.push(['Schedule summary', 'Value']);
    rows.push(['Algorithm', names[latestAlgorithm].label]);
    rows.push(['Average waiting time', latestResult.averages.waiting]);
    rows.push(['Average turnaround time', latestResult.averages.turnaround]);
    rows.push(['Average response time', latestResult.averages.response]);
    rows.push(['CPU utilization (%)', latestResult.utilization]);
    rows.push(['CPU busy time', latestResult.busyTime]);
    rows.push(['CPU idle time', latestResult.idleTime]);
    rows.push(['Throughput', latestResult.throughput]);
    rows.push(['Context switches', latestResult.contextSwitches]);
    rows.push(['Context-switch time', latestResult.switchTime]);
    rows.push(['Context-switch overhead (%)', latestResult.switchOverhead]);
    rows.push([]);
    rows.push(['CPU timeline']);
    rows.push(['Block type', 'Process ID', 'Start', 'End', 'MLFQ level']);
    latestResult.timeline.forEach(function (block) {
      rows.push([block.type, block.id, block.start, block.end, block.queueLevel === undefined ? '' : block.queueLevel + 1]);
    });
    var csv = '\uFEFF' + rows.map(function (row) { return row.map(csvCell).join(','); }).join('\r\n');
    downloadFile('kernel-lab-' + latestAlgorithm + '-' + new Date().toISOString().slice(0, 10) + '.csv', csv, 'text/csv;charset=utf-8');
  });
  document.getElementById('previousBlockButton').addEventListener('click', function () {
    stopPlayback();
    showPlaybackBlock(playbackIndex - 1);
  });
  document.getElementById('nextBlockButton').addEventListener('click', function () {
    stopPlayback();
    showPlaybackBlock(playbackIndex + 1);
  });
  document.getElementById('timelineSlider').addEventListener('input', function (event) {
    stopPlayback();
    showPlaybackBlock(Number(event.target.value));
  });
  document.getElementById('playPauseButton').addEventListener('click', function () {
    if (!latestResult) return;
    if (playbackTimer !== null) {
      stopPlayback();
      document.getElementById('playbackStatus').textContent = 'Playback paused.';
      return;
    }
    if (playbackIndex >= latestResult.timeline.length - 1) showPlaybackBlock(0);
    var button = document.getElementById('playPauseButton');
    button.textContent = 'Ⅱ';
    button.setAttribute('aria-label', 'Pause schedule');
    playbackTimer = window.setInterval(function () {
      if (playbackIndex >= latestResult.timeline.length - 1) {
        stopPlayback();
        document.getElementById('playbackStatus').textContent = 'Schedule playback complete.';
        return;
      }
      showPlaybackBlock(playbackIndex + 1);
    }, Number(document.getElementById('playbackSpeed').value));
  });
  simulator.processInput.load(simulator.exampleProcesses);
  simulator.algorithmSelector.update();
  document.getElementById('contextSwitchSetting').classList.add('hidden');
})(window.CPUSim = window.CPUSim || {});
