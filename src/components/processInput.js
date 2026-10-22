(function (simulator) {
  simulator.processInput = {
    rows: [],
    updateCount: function () {
      var count = this.rows.length;
      document.getElementById('processCount').textContent = count + ' process' + (count === 1 ? '' : 'es');
    },
    addRow: function (values) {
      values = values || {};
      var row = document.createElement('tr');
      var id = values.id || 'P' + (this.rows.length + 1);
      row.innerHTML =
        '<td><input type="text" aria-label="Process ID" data-field="id" value="' + simulator.escapeHtml(id) + '"></td>' +
        '<td><input type="number" min="0" step="1" aria-label="Arrival time" data-field="arrival" value="' + (values.arrival == null ? '' : values.arrival) + '"></td>' +
        '<td><input type="number" min="1" step="1" aria-label="Burst time" data-field="burst" value="' + (values.burst == null ? '' : values.burst) + '"></td>' +
        '<td><input type="number" min="1" step="1" aria-label="Priority" data-field="priority" value="' + (values.priority == null ? '' : values.priority) + '"></td>';
      document.getElementById('processTableBody').appendChild(row);
      this.rows.push(row);
      this.updateCount();
    },
    clear: function () {
      this.rows = [];
      document.getElementById('processTableBody').innerHTML = '';
      this.updateCount();
    },
    load: function (processes) {
      this.clear();
      processes.forEach(this.addRow.bind(this));
    },
    read: function () {
      var values = this.rows.map(function (row) {
        var fields = {};
        row.querySelectorAll('input').forEach(function (input) { fields[input.dataset.field] = input.value; });
        return fields;
      });
      return simulator.validateProcesses(values);
    }
  };
})(window.CPUSim = window.CPUSim || {});
