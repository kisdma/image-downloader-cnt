Element.prototype._attachShadow = Element.prototype.attachShadow;
Element.prototype.attachShadow = function () {
  const shadow = this._attachShadow( { mode: "open" } );
  return shadow;
};