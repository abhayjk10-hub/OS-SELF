(function (simulator) {
  simulator.algorithmSelector = {
    get: function () { return document.getElementById('algorithmSelect').value; },
    settings: function (algorithm) {
      return simulator.validateSettings(
        algorithm,
        document.getElementById('timeQuantum').value,
        document.getElementById('contextSwitchEnabled').checked,
        document.getElementById('contextSwitchTime').value
      );
    },
    update: function () {
      var algorithm = this.get();
      document.getElementById('quantumSetting').classList.toggle('hidden', algorithm !== 'roundRobin');
      document.getElementById('mlfqHint').classList.toggle('hidden', algorithm !== 'mlfq');
      var explanations = {
        preemptive: ['How preemptive priority works', 'The CPU selects the ready process with the smallest priority number. It checks again at each arrival, allowing a higher-priority process to preempt the current one.'],
        nonPreemptive: ['How non-preemptive priority works', 'The CPU selects the ready process with the smallest priority number and lets it complete before choosing another process.'],
        fcfs: ['How FCFS works', 'First Come First Serve runs processes in arrival order. It is non-preemptive, so a running process keeps the CPU until completion.'],
        sjf: ['How SJF works', 'Shortest Job First chooses the ready process with the smallest burst time. The selected process then runs to completion.'],
        srtf: ['How SRTF works', 'Shortest Remaining Time First is preemptive SJF: when a process arrives, the scheduler compares its burst with the running process’s remaining time and may preempt.'],
        hrrn: ['How HRRN works', 'At each dispatch, Highest Response Ratio Next selects the largest (waiting time + burst time) / burst time. Long-waiting jobs gradually gain priority.'],
        mlfq: ['How MLFQ works', 'New processes enter the highest-priority queue. Each level uses round robin; a process that consumes its whole quantum is demoted. New arrivals preempt lower-level work.'],
        roundRobin: ['How Round Robin works', 'Each ready process receives up to one time quantum. Arrivals during a slice join the back of the queue before an unfinished process is re-queued.']
      };
      document.getElementById('explanationTitle').textContent = explanations[algorithm][0];
      document.getElementById('selectedAlgorithmExplanation').textContent = explanations[algorithm][1];
    }
  };
})(window.CPUSim = window.CPUSim || {});
