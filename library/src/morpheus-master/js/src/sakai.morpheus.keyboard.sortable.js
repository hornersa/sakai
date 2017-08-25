/**
 * Sakai jQuery keyboard sortable from https://raw.githubusercontent.com/hanshillen/sakai-keyboardsortable/master/js/jquery.sakai.js
 */

$PBJQ(document).ready(function() {
  var _defaults = {
      /* strings */
      dragModeStartMsg : "drag start, Use U and D keys to move the item up and down",
      dragModeEndMsg: "Drag end",
      newPositionMsg: "Moved to position %s"
      
  };
  
  /* Extends sortable, allows drag operations through keyboard shortcuts */ 
  $.widget("sakai.keyboardSortable", $.ui.sortable, {
    options: {
      /* optional, a selector determining what focusable element inside the sortable item should be responding to drag shortcuts.
       * defaults to the sortable item itself */
      keyboardHandle: false 
    },

    _create: function() {
      this._super();
      this.options.keyboardHandle = this.options.keyboardHandle || this.options.items;
      this._dragging = false;
      this.element.on("keydown", this.options.keyboardHandle, $.proxy(this._keydown, this));
      /* Live region used to provide feedback on drag actions to screen reader users*/
      this.liveRegion = $("<div class='ui-helper-hidden-accessible'></div>").liveregion().appendTo(document.body);
      this.element.find(this.options.keyboardHandle).attr({
        "aria-grabbed": "false",
        // proprietary attribute that lets JAWS pass certain key strokes through
        "data-at-shortcutkeys": '{"u":"drag item up","d":"drag item down"}'
      }).blur($.proxy(function(event) {
        var $target = $(event.target);
        if (this._isDragging()) {
          this._toggleDragMode($target, this._closestSortableNode($target));
        }
      }, this)).click($.proxy(function(event) {
        /* Allow drag mode to be toggled when click event is not generated by a mouse click */
        if (event.clientX <= 0 || event.clientX === undefined) {
          var $target = $(event.target);
          this._toggleDragMode($target, this._closestSortableNode($target));
        }
      }, this));
    },

    _keydown: function(event) {
      if ($.inArray(event.which, [ 27, 38, 40, 68, 85 ]) === -1) {
        return;
      }
      event.preventDefault();
      var $target = $(event.target);
      var $sortableNode = this._closestSortableNode($target);
      
      switch (event.which) {
      case 27: // Esc
        if (this._isDragging()) {
          this._toggleDragMode($target, $sortableNode);
        }
        break;
      case 38: // Up
      case 85: // u
        if (event.ctrlKey || this._isDragging() || event.which === 85) {
          this._moveBackward($sortableNode, $target);
        }
        break;
      case 40: // Down
      case 68: // d
        if (event.ctrlKey || this._isDragging() || event.which === 68) {
          this._moveForward($sortableNode, $target);
        }
        break;
      }
    },

    _closestSortableNode: function($node) {
      var $sortableNode = $node.parentsUntil(this.element).last();
      if (!$sortableNode.length) {
        $sortableNode = $node;
      }
      return $sortableNode
    },

    _isDragging: function() {
      return this._dragging;
    },

    _toggleDragMode: function($node, $sortableNode) {
      var dragging = this._isDragging();
      $sortableNode.toggleClass("sakai-dragging", !dragging);
      if (!dragging) {
        this.element.find(this.options.keyboardHandle).attr("aria-grabbed", "false");
        this._dragging = true;
        $node.attr("aria-grabbed", "true");
        this._notify(_defaults.dragModeStartMsg);
      } else {
        $node.attr("aria-grabbed", "false");
        this._dragging = false;
        this._notify(_defaults.dragModeEndMsg);
      }
    },

    _moveBackward: function($node, $focused, selector) {
      $prevNode = $node.prev(selector);
      if (!$prevNode.length) {
        return;
      }
      $prevNode.insertAfter($node);
      this._highlightDrag($node)
      this._notifyPosition($node);
    },

    _moveForward: function($node, $focused, selector) {
      $nextNode = $node.next(selector);
      if (!$nextNode.length) {
        return;
      }
      $nextNode.insertBefore($node);
      this._highlightDrag($node);
      this._notifyPosition($node);
    },
    
    _highlightDrag: function($node){
      if (this._isDragging()) {
        return;
      }
      $node.addClass("sakai-dragging-temp");
      setTimeout(function(){
        $node.removeClass("sakai-dragging-temp");
      }, 1000);
    },

    _notifyPosition: function($node) {
      var newIndex = this.element.find(this.options.items).index($node) + 1;
      this._notify(_defaults.newPositionMsg.replace("%s", newIndex));
    },
    _notify: function(msg) {
      this.liveRegion.liveregion("instance").notify(msg);
      this._trigger('update');
    }
  } );

  /* Creates a live region for quick notifications to screen reader users*/
  $.widget("sakai.liveregion", {
    _create: function() {
      this.timeout = null;
    },

    notify: function(msg) {
      setTimeout($.proxy(function() {
        /* some browser / screen reader combos don't honor aria-relevant="additions", so they will incrrectly announce messages being removed.
         * As a work around, create a separate live region for each message and add text to it after a short delay. */ 
        var $channel = $("<div aria-live='polite'></div>").attr("role", "status").appendTo(this.element);
        if (this.timeout) {
          clearTimeout(this.timeout);
        }

        this.timeout = setTimeout($.proxy(function() {
          $channel.text(msg);
        }, this), 500);
        setTimeout($.proxy(function() {
          this._clear($channel);
        }, this), 10000);

      }, this), 0);
    },

    _clear: function($node) {
      $node.remove();
    }
  });
});
