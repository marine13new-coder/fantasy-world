(function (root) {
  const presets = {
    small: {half:5, rows:8, brick:.5},
    medium: {half:8, rows:12, brick:.65},
    large: {half:11, rows:16, brick:.8},
    huge: {half:14, rows:20, brick:.95}
  };
  function resolve(input) {
    const half = Math.max(5, Math.min(14, Number(input.half) || 8));
    const rows = Math.max(8, Math.min(20, Math.round(Number(input.rows) || 12)));
    const requested = Math.max(.45, Math.min(1.2, Number(input.brick) || .65));
    // shortcut: 5,000 rigid stones per castle, raise the limit when instanced rendering is added.
    let brick = requested;
    while (estimated(half, rows, brick) > 5000) brick = Math.round((brick + .025) * 1000) / 1000;
    return {half, rows, brick, requested, limited:brick > requested};
  }
  function estimated(half, rows, brick) {
    const walls = 4 * Math.ceil((2*half - 3)/brick) * (rows + 1);
    const towers = 4 * Math.ceil((2*Math.PI*(.55+half*.19))/brick) * (rows + 4);
    const keep = 4 * Math.ceil((half*.7)/brick) * Math.ceil(rows*.65);
    return walls + towers + keep;
  }
  root.SiegeSettings = {presets, resolve, estimated};
  if (typeof module !== 'undefined') module.exports = root.SiegeSettings;
})(typeof window === 'undefined' ? globalThis : window);
