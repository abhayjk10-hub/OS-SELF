const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

global.window = global;
const root = path.resolve(__dirname, '..');
[
  'src/utils/common.js',
  'src/utils/calculations.js',
  'src/utils/validation.js',
  'src/algorithms/scheduler.js',
  'src/algorithms/fcfs.js',
  'src/algorithms/sjf.js',
  'src/algorithms/srtf.js',
  'src/algorithms/hrrn.js',
  'src/algorithms/mlfq.js',
  'src/algorithms/roundRobin.js',
  'src/algorithms/preemptivePriority.js',
  'src/algorithms/nonPreemptivePriority.js'
].forEach(function (file) {
  vm.runInThisContext(fs.readFileSync(path.join(root, file), 'utf8'), { filename: file });
});

const sim = global.CPUSim;
const example = sim.exampleProcesses;
const noSwitch = { quantum: 2, contextTime: 0 };
function run(algorithm, processes, options = noSwitch) {
  return sim.algorithms[algorithm].run(processes, options);
}
function timeline(result) {
  return result.timeline.map(function (block) { return [block.id, block.start, block.end]; });
}

test('example preemptive-priority schedule and metrics are correct', function () {
  const result = run('preemptive', example);
  assert.deepEqual(timeline(result), [
    ['P1', 0, 1], ['P2', 1, 5], ['P4', 5, 10], ['P1', 10, 17], ['P3', 17, 19]
  ]);
  assert.deepEqual(result.metrics.map(function (process) {
    return [process.id, process.completion, process.turnaround, process.waiting, process.response];
  }), [
    ['P1', 17, 17, 9, 0], ['P2', 5, 4, 0, 0], ['P3', 19, 17, 15, 15], ['P4', 10, 7, 2, 2]
  ]);
  assert.deepEqual(result.averages, { waiting: 6.5, turnaround: 11.25, response: 4.25 });
  assert.equal(result.utilization, 100);
  assert.equal(result.idleTime, 0);
  assert.equal(result.throughput, 4 / 19);
});

test('non-preemptive priority, FCFS, and SJF keep their selection policies', function () {
  assert.deepEqual(timeline(run('nonPreemptive', example)), [
    ['P1', 0, 8], ['P2', 8, 12], ['P4', 12, 17], ['P3', 17, 19]
  ]);
  assert.deepEqual(timeline(run('fcfs', example)), [
    ['P1', 0, 8], ['P2', 8, 12], ['P3', 12, 14], ['P4', 14, 19]
  ]);
  assert.deepEqual(timeline(run('sjf', example)), [
    ['P1', 0, 8], ['P3', 8, 10], ['P2', 10, 14], ['P4', 14, 19]
  ]);
});

test('SRTF preempts on arrival and resumes the process with the least remaining time', function () {
  const workload = [
    { id: 'Long', arrival: 0, burst: 8, priority: 1 },
    { id: 'Short', arrival: 2, burst: 2, priority: 2 }
  ];
  const result = run('srtf', workload);
  assert.deepEqual(timeline(result), [
    ['Long', 0, 2], ['Short', 2, 4], ['Long', 4, 10]
  ]);
  assert.equal(result.metrics.find(function (process) { return process.id === 'Long'; }).response, 0);
});

test('HRRN dynamically favors accumulated waiting and avoids short-job starvation', function () {
  const workload = [
    { id: 'LongFirst', arrival: 0, burst: 10, priority: 1 },
    { id: 'WaitingLong', arrival: 0, burst: 12, priority: 2 },
    { id: 'LateShort', arrival: 10, burst: 1, priority: 3 }
  ];
  assert.deepEqual(timeline(run('hrrn', workload)), [
    ['LongFirst', 0, 10], ['WaitingLong', 10, 22], ['LateShort', 22, 23]
  ]);
  assert.deepEqual(timeline(run('sjf', workload)), [
    ['LongFirst', 0, 10], ['LateShort', 10, 11], ['WaitingLong', 11, 23]
  ]);
});

test('MLFQ demotes CPU-bound work through configured 2/4/8-unit feedback queues', function () {
  const result = run('mlfq', [
    { id: 'CPUbound', arrival: 0, burst: 15, priority: 1 }
  ]);
  assert.deepEqual(timeline(result), [
    ['CPUbound', 0, 2], ['CPUbound', 2, 6], ['CPUbound', 6, 15]
  ]);
  assert.deepEqual(result.timeline.map(function (block) { return block.queueLevel; }), [0, 1, 2]);
  assert.deepEqual(result.trace.map(function (step) { return step.level; }), [0, 1, 2, 2]);
});

test('MLFQ admits new work to the top queue and preserves interrupted lower-queue quantum', function () {
  const result = run('mlfq', [
    { id: 'CPUbound', arrival: 0, burst: 8, priority: 1 },
    { id: 'Interactive', arrival: 4, burst: 1, priority: 2 }
  ]);
  assert.deepEqual(timeline(result), [
    ['CPUbound', 0, 2], ['CPUbound', 2, 4], ['Interactive', 4, 5],
    ['CPUbound', 5, 7], ['CPUbound', 7, 9]
  ]);
  assert.deepEqual(result.timeline.map(function (block) { return block.queueLevel; }), [0, 1, 0, 1, 2]);
});

test('MLFQ accounts for context-switch cost without changing queue order', function () {
  const result = run('mlfq', [
    { id: 'CPUbound', arrival: 0, burst: 3, priority: 1 },
    { id: 'Interactive', arrival: 0, burst: 1, priority: 2 }
  ], { quantum: 2, contextTime: 1 });
  assert.deepEqual(timeline(result), [
    ['CPUbound', 0, 2], ['CS', 2, 3], ['Interactive', 3, 4], ['CS', 4, 5], ['CPUbound', 5, 6]
  ]);
  assert.equal(result.contextSwitches, 2);
  assert.equal(result.switchTime, 2);
});

test('Round Robin queues arrivals during a slice before re-queuing the runner', function () {
  const workload = [
    { id: 'P1', arrival: 0, burst: 5, priority: 1, order: 0 },
    { id: 'P2', arrival: 1, burst: 3, priority: 2, order: 1 }
  ];
  assert.deepEqual(timeline(run('roundRobin', workload, { quantum: 2, contextTime: 0 })), [
    ['P1', 0, 2], ['P2', 2, 4], ['P1', 4, 6], ['P2', 6, 7], ['P1', 7, 8]
  ]);
});

test('idle gaps and context switching contribute to total time, not busy time', function () {
  const workload = [
    { id: 'P1', arrival: 0, burst: 1, priority: 1, order: 0 },
    { id: 'P2', arrival: 1, burst: 1, priority: 2, order: 1 },
    { id: 'P3', arrival: 5, burst: 1, priority: 3, order: 2 }
  ];
  const result = run('fcfs', workload, { quantum: 2, contextTime: 2 });
  assert.deepEqual(timeline(result), [
    ['P1', 0, 1], ['CS', 1, 3], ['P2', 3, 4], ['IDLE', 4, 5], ['P3', 5, 6]
  ]);
  assert.equal(result.busyTime, 3);
  assert.equal(result.idleTime, 1);
  assert.equal(result.totalTime, 6);
  assert.equal(result.utilization, 50);
  assert.equal(result.contextSwitches, 1);
});

test('arrival-time ties are deterministic and preemption occurs at the arrival boundary', function () {
  const workload = [
    { id: 'P1', arrival: 0, burst: 3, priority: 3, order: 0 },
    { id: 'P2', arrival: 1, burst: 1, priority: 1, order: 1 },
    { id: 'P3', arrival: 0, burst: 1, priority: 2, order: 2 }
  ];
  assert.deepEqual(timeline(run('preemptive', workload)), [
    ['P3', 0, 1], ['P2', 1, 2], ['P1', 2, 5]
  ]);
});

test('single-process workloads and CPU idle before the first arrival are accounted for', function () {
  const result = run('sjf', [
    { id: 'Solo', arrival: 3, burst: 2, priority: 1 }
  ]);
  assert.deepEqual(timeline(result), [['IDLE', 0, 3], ['Solo', 3, 5]]);
  assert.deepEqual(result.metrics.map(function (process) {
    return [process.completion, process.turnaround, process.waiting, process.response];
  }), [[5, 2, 0, 0]]);
  assert.equal(result.busyTime, 2);
  assert.equal(result.idleTime, 3);
  assert.equal(result.utilization, 40);
  assert.equal(result.throughput, 0.2);
});

test('equal priority and arrival/burst ties preserve input order', function () {
  const workload = [
    { id: 'First', arrival: 0, burst: 2, priority: 1 },
    { id: 'Second', arrival: 0, burst: 2, priority: 1 }
  ];
  assert.deepEqual(timeline(run('nonPreemptive', workload)), [
    ['First', 0, 2], ['Second', 2, 4]
  ]);
});

test('validation rejects empty, duplicate, negative, zero, and invalid inputs', function () {
  assert.throws(function () { sim.validateProcesses([]); }, /at least one process/);
  assert.throws(function () {
    sim.validateProcesses([{ id: 'P1', arrival: '0', burst: '1', priority: '1' }, { id: 'p1', arrival: '0', burst: '1', priority: '1' }]);
  }, /unique/);
  assert.throws(function () { sim.validateProcesses([{ id: 'P1', arrival: '-1', burst: '1', priority: '1' }]); }, /arrival/);
  assert.throws(function () { sim.validateProcesses([{ id: 'P1', arrival: '0', burst: '0', priority: '1' }]); }, /burst/);
  assert.throws(function () { sim.validateProcesses([{ id: 'P1', arrival: '0', burst: '-1', priority: '1' }]); }, /burst/);
  assert.throws(function () { sim.validateProcesses([{ id: 'P1', arrival: '0', burst: '1', priority: '0' }]); }, /priority/);
  assert.throws(function () { sim.validateSettings('roundRobin', '0', false, '1'); }, /quantum/);
});
