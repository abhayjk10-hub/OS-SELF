(function (simulator) {
  simulator.algorithms = {
    preemptive: { label: 'Preemptive Priority' },
    nonPreemptive: { label: 'Non-Preemptive Priority' },
    fcfs: { label: 'FCFS' },
    sjf: { label: 'SJF' },
    srtf: { label: 'Shortest Remaining Time First' },
    hrrn: { label: 'Highest Response Ratio Next' },
    mlfq: { label: 'Multilevel Feedback Queue' },
    roundRobin: { label: 'Round Robin' }
  };
  simulator.exampleProcesses = [
    { id: 'P1', arrival: 0, burst: 8, priority: 3 },
    { id: 'P2', arrival: 1, burst: 4, priority: 1 },
    { id: 'P3', arrival: 2, burst: 2, priority: 4 },
    { id: 'P4', arrival: 3, burst: 5, priority: 2 }
  ];
  simulator.colors = ['#157a72', '#e9785b', '#dfad38', '#477ea0', '#986c9c', '#567b64', '#ce765d', '#3f8c88'];
  simulator.escapeHtml = function (value) {
    return String(value).replace(/[&<>'"]/g, function (character) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character];
    });
  };
  simulator.formatNumber = function (number) {
    return Number.isInteger(number) ? String(number) : number.toFixed(2);
  };
})(window.CPUSim = window.CPUSim || {});
