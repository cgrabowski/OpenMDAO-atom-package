/*
 * d3 extensions
 */
(function(d3, undefined) {

  // Adds svg elements of a datum's childrewindow.outerWidthn to the selection
  d3.selection.prototype.datumChildrenElements = function(datum) {
    var children = datum.element.children;

    if (children != null) {
      for (var i = 0; i < children.length; ++i) {
        this[0].push(children.item(i));
      }
    }

    return this;
  };

  // adds svg elements of a datum's ancestors to the selection
  d3.selection.prototype.datumAncestorElements = function(datum) {
    while (datum.parent != null) {
      this[0].push(datum.parent.element);
      datum = datum.parent;
    }

    return this;
  };

  // adds svg elements of a datum's descendants to the selection
  d3.selection.prototype.datumDescendantElements = function(datum) {
    (function _pushd(d) {
      var children = d.children;

      if (children != null) {
        for (var i = 0; i < children.length; ++i) {
          this[0].push(children[i].element);
          _pushd.call(this, children[i]);
        }
      }
    }).call(this, datum);

    return this;
  };

  // adds svg elements of a datum's siblings to the selection
  d3.selection.prototype.datumSiblingElements = function(datum) {
    if (datum.parent != null) {
      datum.parent.children.forEach(function(d, i, arr) {
        if (d.element !== datum.element) {
          this[0].push(d.element);
        }
      }, this);
    }
    return this;
  };

}(d3));
