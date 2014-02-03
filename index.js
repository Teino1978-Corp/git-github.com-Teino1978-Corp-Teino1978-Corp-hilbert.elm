(function() {
  var height, map, svg, vis, width, zoom;

  width = 960;

  height = 500;

  /* create the SVG
  */

  svg = d3.select('body').append('svg').attr('width', width).attr('height', height);

  vis = svg.append('g');

  map = vis.append('g').attr('transform', "translate(" + (width / 2) + "," + (height / 2) + ")");

  /* define a zoom behavior
  */

  zoom = d3.behavior.zoom().scaleExtent([1, 10]).on('zoom', function() {
    /* whenever the user zooms,
    */
    /* modify translation and scale of the zoom group accordingly
    */    return vis.attr('transform', "translate(" + (zoom.translate()) + ")scale(" + (zoom.scale()) + ")");
  });

  /* bind the zoom behavior to the main SVG
  */

  svg.call(zoom);

  /* read flare data
  */

  d3.json('flare-imports.json', function(data) {
    /* package tree
    */
    var cells2fontsize, defs, height2thickness, hierarchy, leaves, nodes, scale, tree;
    tree = flare_reader.tree(data);
    hierarchy = d3.layout.hierarchy();
    nodes = hierarchy(tree);
    /* imports links
    */
    /* this tree is unordered, we need a canonical ordering for it
    */
    tree_utils.canonical_sort(tree);
    /* obtain the sequence of leaves
    */
    leaves = tree_utils.get_leaves(tree);
    /* compute the subtree height for each node
    */
    tree_utils.compute_height(tree);
    /* VISUALIZATION
    */
    /* compute the space-filling curve layout
    */
    scale = 26;
    sfc_layout.displace(leaves, sfc_layout.HILBERT, scale, 0);
    /* compute also the position of internal nodes
    */
    sfc_layout.displace_tree(tree);
    /* define a bundle layout
    */
    /* define a color scale for leaf depth
    */
    /* define a thickness scale for region height
    */
    height2thickness = d3.scale.linear().domain([1, tree.height]).range([0.001, 1]);
    /* translate size to cell scale
    */
    /* translate cells to label font size
    */
    cells2fontsize = d3.scale.pow().exponent(0.3).domain([1, leaves.length]).range([4, 80]);
    /* compute all the internal nodes regions
    */
    jigsaw.treemap(tree, scale, jigsaw.SQUARE_CELL);
    /* define the level zero region (the land)
    */
    defs = svg.append('defs');
    defs.append('path').attr('id', 'land').attr('d', jigsaw.get_svg_path(tree.region));
    /* faux land glow (using filters takes too much resources)
    */
    map.append('use').attr('class', 'land-glow-outer').attr('xlink:href', '#land');
    map.append('use').attr('class', 'land-glow-inner').attr('xlink:href', '#land');
    /* draw the cells
    */
    /* draw the land border (above cells)
    */
    map.append('use').attr('class', 'land-fill').attr('xlink:href', '#land');
    /* draw boundaries
    */
    map.selectAll('.region').data(nodes).enter().append('path').attr('class', 'region').attr('d', function(d) {
      return jigsaw.get_svg_path(d.region);
    }).attr('stroke-width', function(d) {
      return height2thickness(d.height);
    });
    /* draw the graph links
    */
    /* draw labels
    */
    return map.selectAll('.label').data(nodes).enter().append('text').attr('class', 'label').attr('font-size', function(d) {
      return cells2fontsize(d.leaf_descendants.length);
    }).attr('dy', '0.35em').attr('transform', function(d) {
      return "translate(" + d.x + "," + d.y + ")";
    }).text(function(d) {
      return d.name.split('.').reverse()[0];
    });
    /* draw the leaf labels
    */
  });

}).call(this);
