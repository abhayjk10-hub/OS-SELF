(function (simulator) {
  function compareFor(kind, first, second) {
    if (kind === 'preemptive' || kind === 'nonPreemptive') {
      return first.priority - second.priority || first.arrival - second.arrival || first.order - second.order;
    }
    if (kind === 'sjf') return first.remaining - second.remaining || first.arrival - second.arrival || first.order - second.order;
    if (kind === 'srtf') return first.remaining - second.remaining || first.arrival - second.arrival || first.order - second.order;
    return first.arrival - second.arrival || first.order - second.order;
  }

  simulator.runMlfqScheduler = function (input, options) {
    var quanta = [2, 4, 8];
    var processes = input.map(function (process, index) {
      return Object.assign({}, process, {
        order: index, remaining: process.burst, firstStart: null, completion: null,
        level: 0, sliceRemaining: null
      });
    });
    var queues = [[], [], []];
    var timeline = [];
    var trace = [];
    var time = 0;
    var completed = 0;
    var switches = 0;
    var admitted = new Set();
    var previousProcess = null;

    function admitArrivals() {
      processes.filter(function (process) {
        return !admitted.has(process.order) && process.arrival <= time;
      }).sort(function (first, second) {
        return first.arrival - second.arrival || first.order - second.order;
      }).forEach(function (process) {
        admitted.add(process.order);
        queues[0].push(process);
      });
    }
    function nextReadyLevel() {
      return queues.findIndex(function (queue) { return queue.length > 0; });
    }
    function takeNext() {
      var level = nextReadyLevel();
      return level < 0 ? null : queues[level].shift();
    }
    function snapshot() {
      return queues.reduce(function (items, queue, level) {
        queue.forEach(function (process) {
          items.push({ id: process.id, priority: process.priority, remaining: process.remaining, level: level });
        });
        return items;
      }, []);
    }
    function addBlock(type, id, start, end, order, level) {
      if (end <= start) return;
      var previous = timeline[timeline.length - 1];
      if (type === 'process' && previous && previous.type === 'process' && previous.id === id &&
          previous.queueLevel === level && previous.end === start) {
        previous.end = end;
        return;
      }
      var block = { type: type, id: id, start: start, end: end, order: order };
      if (level !== undefined) block.queueLevel = level;
      timeline.push(block);
    }

    admitArrivals();
    while (completed < processes.length) {
      var level = nextReadyLevel();
      if (level < 0) {
        var nextArrival = Math.min.apply(null, processes.filter(function (process) {
          return !admitted.has(process.order);
        }).map(function (process) { return process.arrival; }));
        if (!Number.isFinite(nextArrival)) throw new Error('MLFQ could not find a ready process or a future arrival.');
        addBlock('idle', 'IDLE', time, nextArrival);
        time = nextArrival;
        previousProcess = null;
        admitArrivals();
      }

      var current = takeNext();
      if (current.sliceRemaining === null) current.sliceRemaining = quanta[current.level];
      if (previousProcess && previousProcess.order !== current.order) {
        switches += 1;
        if (options.contextTime > 0) {
          addBlock('switch', 'CS', time, time + options.contextTime);
          time += options.contextTime;
          admitArrivals();
        }
        queues[current.level].unshift(current);
        current = takeNext();
        if (current.sliceRemaining === null) current.sliceRemaining = quanta[current.level];
      }

      if (current.firstStart === null) current.firstStart = time;
      trace.push({
        time: time, running: current.id, priority: current.priority, level: current.level,
        queue: snapshot(), kind: 'mlfq'
      });

      var duration = Math.min(current.remaining, current.sliceRemaining);
      if (current.level > 0) {
        var upcoming = processes.filter(function (process) {
          return !admitted.has(process.order);
        }).reduce(function (nearest, process) {
          return Math.min(nearest, process.arrival);
        }, Infinity);
        if (upcoming < time + duration) duration = upcoming - time;
      }
      if (!(duration > 0)) throw new Error('MLFQ encountered an invalid scheduling interval.');
      var start = time;
      time += duration;
      current.remaining -= duration;
      current.sliceRemaining -= duration;
      addBlock('process', current.id, start, time, current.order, current.level);
      admitArrivals();

      if (current.remaining === 0) {
        current.completion = time;
        completed += 1;
      } else if (current.sliceRemaining === 0) {
        current.level = Math.min(current.level + 1, queues.length - 1);
        current.sliceRemaining = null;
        queues[current.level].push(current);
      } else {
        queues[current.level].unshift(current);
      }
      previousProcess = current;
    }

    var result = simulator.calculateMetrics(processes, timeline, switches);
    result.timeline = timeline;
    result.trace = trace;
    result.queueQuanta = quanta;
    return result;
  };

  simulator.runScheduler = function (input, kind, options) {
    var processes = input.map(function (process, index) {
      return Object.assign({}, process, { order: index, remaining: process.burst, firstStart: null, completion: null });
    });
    var timeline = [];
    var ready = [];
    var trace = [];
    var time = 0;
    var completed = 0;
    var admitted = new Set();
    var previousProcess = null;
    var switches = 0;
    var roundRobin = kind === 'roundRobin';

    function admitArrivals() {
      processes.filter(function (process) {
        return !admitted.has(process.order) && process.arrival <= time;
      }).sort(function (first, second) {
        return first.arrival - second.arrival || first.order - second.order;
      }).forEach(function (process) {
        admitted.add(process.order);
        ready.push(process);
      });
    }
    function sortReady() {
      if (kind === 'hrrn') {
        ready.sort(function (first, second) {
          var firstRatio = (time - first.arrival + first.burst) / first.burst;
          var secondRatio = (time - second.arrival + second.burst) / second.burst;
          return secondRatio - firstRatio || first.arrival - second.arrival || first.order - second.order;
        });
      } else if (!roundRobin) ready.sort(function (first, second) { return compareFor(kind, first, second); });
    }
    function takeNext() {
      sortReady();
      return ready.shift();
    }
    function addBlock(type, id, start, end, order, queueLevel) {
      if (end <= start) return;
      var previous = timeline[timeline.length - 1];
      // Adjacent time slices are one visible run; an intervening process keeps preemptions separate.
      if (type === 'process' && previous && previous.type === 'process' && previous.id === id &&
          previous.queueLevel === queueLevel && previous.end === start) {
        previous.end = end;
        return;
      }
      var block = { type: type, id: id, start: start, end: end, order: order };
      if (queueLevel !== undefined) block.queueLevel = queueLevel;
      timeline.push(block);
    }
    function queueSnapshot() {
      sortReady();
      return ready.map(function (process) {
        return { id: process.id, priority: process.priority, remaining: process.remaining };
      });
    }

    admitArrivals();
    while (completed < processes.length) {
      if (!ready.length) {
        var nextArrival = Math.min.apply(null, processes.filter(function (process) {
          return process.remaining > 0 && !admitted.has(process.order);
        }).map(function (process) { return process.arrival; }));
        if (!Number.isFinite(nextArrival)) throw new Error('Scheduler could not find a ready process or a future arrival.');
        addBlock('idle', 'IDLE', time, nextArrival);
        time = nextArrival;
        previousProcess = null;
        admitArrivals();
      }

      var current = takeNext();
      var paidSwitch = false;
      if (previousProcess && previousProcess.order !== current.order) {
        switches += 1;
        if (options.contextTime > 0) {
          addBlock('switch', 'CS', time, time + options.contextTime);
          time += options.contextTime;
          admitArrivals();
        }
        paidSwitch = true;
        if (!roundRobin) {
          ready.push(current);
          current = takeNext();
        }
      }

      if (current.firstStart === null) current.firstStart = time;
      trace.push({
        time: time, running: current.id, priority: current.priority,
        queue: queueSnapshot(), kind: kind
      });
      var duration = kind === 'preemptive' || kind === 'srtf' ? 1 :
        (roundRobin ? Math.min(options.quantum, current.remaining) : current.remaining);
      var start = time;
      time += duration;
      current.remaining -= duration;
      addBlock('process', current.id, start, time, current.order);
      // Admit arrivals at the slice boundary before an unfinished RR process rejoins the queue.
      admitArrivals();
      if (current.remaining === 0) {
        current.completion = time;
        completed += 1;
      } else {
        ready.push(current);
      }
      previousProcess = current;
      if (paidSwitch && !roundRobin) sortReady();
    }

    var result = simulator.calculateMetrics(processes, timeline, switches);
    result.timeline = timeline;
    result.trace = trace;
    return result;
  };
})(window.CPUSim = window.CPUSim || {});
