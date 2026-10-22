(function (simulator) {
  simulator.renderGantt = function (container, timeline, currentBlock) {
    if (!timeline.length) {
      container.innerHTML = '<div class="empty-state">No CPU activity to display.</div>';
      return;
    }
    var blocks = timeline.map(function (block, index) {
      var className = 'gantt-block ' + block.type + (index === currentBlock ? ' is-current' : '');
      var color = block.type === 'process' ? 'background:' + simulator.colors[block.order % simulator.colors.length] + ';' : '';
      var detail = block.queueLevel === undefined ? block.start + '–' + block.end :
        'Q' + (block.queueLevel + 1) + ' · ' + block.start + '-' + block.end;
      return '<div class="' + className + '" data-block-index="' + index + '" style="--duration:' +
        (block.end - block.start) + ';' + color + '" title="' + simulator.escapeHtml(block.id) + ': ' +
        block.start + ' to ' + block.end + (block.queueLevel === undefined ? '' : ' · queue ' + (block.queueLevel + 1)) +
        '"><span>' + simulator.escapeHtml(block.id) + '</span><small>' + detail + '</small></div>';
    }).join('');
    var ticks = timeline.map(function (block, index) {
      return '<div class="gantt-tick" style="--duration:' + (block.end - block.start) + '">' +
        block.start + (index === timeline.length - 1 ? '<span class="tick-end">' + block.end + '</span>' : '') + '</div>';
    }).join('');
    container.innerHTML = '<div class="gantt-track">' + blocks + '</div><div class="gantt-ticks">' + ticks + '</div>';
  };
})(window.CPUSim = window.CPUSim || {});
