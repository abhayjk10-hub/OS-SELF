# Kernel Lab — CPU Scheduling Experiment Workbench

A dependency-free, browser-based operating-systems lab for exploring eight CPU scheduling policies. Design process workloads, inspect dispatch decisions, measure scheduler trade-offs, and export reproducible experiments.

## Learning objectives

- Distinguish preemptive and non-preemptive scheduling.
- Trace arrivals, dispatches, preemption, ready-queue order, idle time, and context-switch costs.
- Calculate completion, turnaround, waiting, response, utilization, throughput, and response ratio.
- Compare policies using the same input and reason about responsiveness, waiting, efficiency, and starvation.
- Save, exchange, and reproduce experimental workloads.

## Scheduling policies

| Policy | Selection rule | Preemption |
| --- | --- | --- |
| First Come, First Served (FCFS) | Earliest arrival; input order breaks ties | No |
| Shortest Job First (SJF) | Smallest burst among ready jobs | No |
| Shortest Remaining Time First (SRTF) | Smallest remaining burst; re-evaluate at arrivals | Yes |
| Preemptive Priority | Smallest numeric priority; input order breaks ties | Yes |
| Non-Preemptive Priority | Smallest numeric priority among ready jobs | No |
| Round Robin (RR) | FIFO ready queue with a configurable time quantum | At quantum boundaries |
| Highest Response Ratio Next (HRRN) | Highest `(waiting + burst) / burst` response ratio | No |
| Multilevel Feedback Queue (MLFQ) | Three feedback levels; quanta of 2, 4, and 8 units | Higher-level arrivals preempt lower-level work |

Lower numeric priority means a higher priority. HRRN’s response ratio is recalculated at dispatch time, allowing waiting processes to gain selection weight. MLFQ starts all processes in its highest-priority queue, demotes jobs that exhaust their time slice, and returns newly arriving processes to the top queue.

## Run the lab

1. Open `index.html` in a modern browser or serve the folder with a local static HTTP server.
2. Start from the Priority clash, Idle gaps, or Round Robin sample, or enter a custom workload.
3. Enter a custom workload with `id`, `arrival`, `burst`, and `priority` values.
4. Select an algorithm. Round Robin requires a positive integer time quantum. MLFQ uses three fixed levels with 2/4/8-unit quanta. Optional context-switch time must be a nonnegative integer.
5. Run a schedule, step or autoplay through Gantt chart dispatches, inspect the ready-queue trace and per-process results, and export the report to CSV.
6. Compare the standard algorithms against the same validated workload and context-switch setting.

## Metrics and formulas

- `CT`: completion time; `TAT = CT − AT`.
- `WT = TAT − BT`; `RT = first CPU start − AT`.
- `Response ratio = TAT / BT = (WT + BT) / BT`.
- `CPU utilization = useful CPU burst time / total elapsed time × 100`.
- `Throughput = completed processes / total elapsed time`.
- `Context-switch overhead = context-switch time / total elapsed time × 100`.

Context-switch counts measure process-to-process dispatch changes; idle periods do not count as switches. Switch time contributes to total elapsed time, not productive CPU burst time.

## Architecture

```text
index.html
style.css
src/
  algorithms/       FCFS, SJF, SRTF, HRRN, MLFQ, priority, RR, shared scheduler
  components/       Workload inputs, algorithm selector, Gantt, metrics, comparison
  styles/style.css  Existing simulator-specific component rules
  utils/            Validation, calculations, shared constants/helpers
  app.js            Browser interactions, playback, persistence and exports
tests/
  scheduler.test.js Node.js regression tests
```

The application uses classic browser scripts: no framework, bundler, server-side component, or third-party runtime dependency is required. The hero image is an Unsplash photo in `index.html`; replace its `src` with a local photo path to use supplied project imagery.

## Verify

Run all scheduler and validation regression tests with:

```powershell
node --test tests\scheduler.test.js
```

The project currently validates the required scheduling algorithms and the core simulator behavior. The command above passed successfully in the current workspace.

## Further third-year project extensions

- Configurable MLFQ quanta and periodic queue-promotion policies.
- Multi-core scheduling, processor affinity, and load balancing.
- CPU/I/O burst phases, blocking queues, and device utilization.
- Arrival distributions and Monte Carlo workloads with confidence intervals.
- A separate memory-management and paging lab connected to process execution.
