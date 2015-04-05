function DragAndDropBlock(runtime, element) {
    function publish_event(data) {
      $.ajax({
          type: "POST",
          url: runtime.handlerUrl(element, 'publish_event'),
          data: JSON.stringify(data)
      });
    }
    
    
    var dragAndDrop = (function($) {
        
        // small function to strip number of the 'px' value at the end (for css)
        // and add up to three numbers together plus perform add/subtract operation on those numbers
        // and concat to 'px'
        var pxOperation = function(one, two, three, operation){
            var first, second, pattern = /^([\d\.]+)px$/,
                added, third = three | 0;
    
            first = parseInt(one.match(pattern)[1]);
            second = parseInt(two.match(pattern)[1]);
            if (operation === "add"){
                added = (first + second + third) + "px";
            } else {
                added = (first - second - third) + "px";
            }
            
            return added;
        },
        
        // functionality to shuffle the list array
        // code borrowed from: http://stackoverflow.com/questions/6274339/how-can-i-shuffle-an-array-in-javascript
        shuffleArray = function(o){
            for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i), 
                    x = o[--i], o[i] = o[j], o[j] = x);
                return o;
        },

        _fn = {
            pupup_ts: Date.now(),

            // DOM Elements
            $ul: $('.xblock--drag-and-drop .items', element),
            $target: $('.xblock--drag-and-drop .target-img', element),
            $feedback: $('.xblock--drag-and-drop .feedback .message', element),
            $popup: $('.xblock--drag-and-drop .popup', element),
            $reset_button: $('.xblock--drag-and-drop .reset-button', element),

            // Cannot set until items added to DOM
            $items: {}, // $('.xblock--drag-and-drop .items .option'),
            $zones: {}, // $('.xblock--drag-and-drop .target .zone'),

            // jQuery UI Draggable options
            options: {
                drag: {
                    containment: '.xblock--drag-and-drop .drag-container',
                    cursor: 'move',
                    stack: '.xblock--drag-and-drop .items .option'
                },
                drop: {
                    accept: '.xblock--drag-and-drop .items .option',
                    tolerance: 'pointer'
                }
            },

            tpl: {
                init: function() {
                    _fn.tpl = {
                        item: Handlebars.compile($("#item-tpl", element).html()),
                        imageItem: Handlebars.compile($("#image-item-tpl", element).html()),
                        zoneElement: Handlebars.compile($("#zone-element-tpl", element).html())
                    };
                }
            },

            init: function(data) {
                _fn.data = data;

                // set attempts to 0
                _fn.currentAttempts = 0;

                // Compile templates
                _fn.tpl.init();

                // Add the items to the page
                _fn.items.draw();
                _fn.zones.draw();

                // Init drag and drop plugin
                _fn.$items.draggable(_fn.options.drag);
                _fn.$zones.droppable(_fn.options.drop);

                // Init click handlers
                _fn.eventHandlers.init(_fn.$items, _fn.$zones);

                // Position the already correct items
                _fn.items.init();

                // Load welcome or final feedback
                if (_fn.data.state.finished)
                    _fn.finish(_fn.data.feedback.finish);
                else
                    _fn.feedback.set(_fn.data.feedback.start);

                // Set the target image
                if (_fn.data.targetImg)
                    _fn.$target.css('background', 'url(' + _fn.data.targetImg + ') no-repeat');

                // Display target image
                _fn.$target.show();

                // Display the zone names if required
                if (_fn.data.displayLabels) {
                    $('p', _fn.$zones).css('visibility', 'visible');
                }
            },

            finish: function(final_feedback) {
                // Disable any decoy items
                _fn.$items.draggable('disable');
                _fn.$reset_button.show();

                // Show final feedback
                if (final_feedback) _fn.feedback.set(final_feedback);
            },

            reset: function() {
                _fn.$items.draggable('enable');
                _fn.$items.find('.numerical-input').removeClass('correct incorrect');
                _fn.$items.find('.numerical-input .input').prop('disabled', false).val('');
                _fn.$items.find('.numerical-input .submit-input').prop('disabled', false);
                _fn.$items.each(function(index, element) {
                    _fn.eventHandlers.drag.reset($(element));
                });
                _fn.$popup.hide();
                _fn.$reset_button.hide();
                _fn.feedback.set(_fn.data.feedback.start);
            },

            eventHandlers: {
                init: function($drag, $dropzone) {
                    var handlers = _fn.eventHandlers;

                    $drag.on('dragstart', handlers.drag.start);
                    $drag.on('dragstop', handlers.drag.stop);

                    $dropzone.on('drop', handlers.drop.success);
                    $dropzone.on('dropover', handlers.drop.hover);

                    $(element).on('click', '.submit-input', handlers.drag.submitInput);

                    $(document).on('click', function(evt) {
                        // Click should only close the popup if the popup has been
                        // visible for at least one second.
                        var popup_timeout = 1000;
                        if (Date.now() - _fn.popup_ts > popup_timeout) {
                            handlers.popup.close(evt);
                        }
                    });
                    _fn.$reset_button.on('click', handlers.problem.reset);
                },
                problem: {
                    reset: function(event, ui) {
                        $.ajax({
                            type: "POST",
                            url: runtime.handlerUrl(element, "reset"),
                            data: "{}",
                            success: _fn.reset
                        });
                    }
                },
                popup: {
                    close: function(event, ui) {
                        target = $(event.target);
                        popup_box = ".xblock--drag-and-drop .popup";
                        close_button = ".xblock--drag-and-drop .popup .close";
                        if (target.is(popup_box)) {
                            return;
                        };
                        if (target.parents(popup_box).length>0 && !target.is(close_button)) {
                            return;
                        };

                        _fn.$popup.hide();
                        publish_event({
                            event_type: 'xblock.drag-and-drop-v2.feedback.closed',
                            content: _fn.$popup.find(".popup-content").text(),
                            manually: true
                        });
                    }
                },
                drag: {
                    start: function(event, ui) {
                        _fn.eventHandlers.popup.close(event, ui);

                        target = $(event.currentTarget);
                        target.removeClass('within-dropzone fade');

                        var item_id = target.data("value");
                        publish_event({event_type:'xblock.drag-and-drop-v2.item.picked-up', item_id:item_id});
                    },

                    stop: function(event, ui) {
                        var $el = $(event.currentTarget);

                        if (!$el.hasClass('within-dropzone') || !$el.hasClass('accepted-dropzone')){
                            // Return to original position
                            _fn.eventHandlers.drag.reset($el);
				console.log("check attempts");
                            if (!$el.hasClass('accepted-dropzone')){
                                _fn.currentAttempts++;
                            }
                            if (_fn.currentAttempts > _fn.data.attempts){
				var current = window.location.href, newUrl, tempSplit, splitter;

				splitter = "courseware";

				tempSplit = current.split(splitter);
				
				newUrl = tempSplit[0];
                                //window.location.replace(_fn.data.redirect);
                                //window.location = _fn.data.redirect;
				console.debug("redirecting");
				console.debug(window.location);
				console.debug(newUrl);
				
				window.location.assign(newUrl + "jump_to_id/" + _fn.data.redirect);
                                //window.location = "/jump_to_id/" + _fn.data.redirect;
			    }
                        } else {
                            _fn.eventHandlers.drag.submitLocation($el);
                        }
                    },

                    submitLocation: function($el) {
                        var val = $el.data('value'),
                            zone = $el.data('zone') || null,
                            accepted = $el.data('accepted'),
                            maxAttempts = false;

                        if (_fn.currentAttempts >= _fn.data.attempts){
                            maxAttempts = true;
                        }

                	// snap into the same position as the droppable field
		        // instead of dropping exactly where the user dropped it
		        // TODO: make this possible as an option in the edit dialog of the xblock
                        $(element).find('.zone.ui-droppable').each(function(){ 
                            if ( $(this).data('zone') === $el.data('zone')){ 
                                $el.css('top', $(this).css('top'));
                                $el.css('left', 
                                    pxOperation( $(this).css('left'), 
                                        $el.parent().css('width'), 15, 'add') 
                                );

                                // set position to absolute to avoid weird positioning results
                                $el.css('position', 'absolute');
                            }
                        });

                        $.post(runtime.handlerUrl(element, 'do_attempt'),
                            JSON.stringify({
                                val: val,
                                zone: zone,
                                top: $el.css('top'),
                                left: $el.css('left'),
                                accepted: accepted,
                                redirect: _fn.data.redirect,
                                maxAttempts: maxAttempts
                        }), 'json').done(function(data){
                            if (data.correct_location) {
                                if (_fn.currentAttempts < _fn.data.attempts){
                                    $el.draggable('disable');
				}

                                if (data.finished) {
                                    _fn.finish(data.final_feedback);
                                }
                            } else {
                                // Return to original position
                                _fn.eventHandlers.drag.reset($el);
                                // add 1 to unsucessful attempts
                                _fn.currentAttempts++;
				console.log("check attempts");
                                if (_fn.currentAttempts >= _fn.data.attempts){
				  var current = window.location.href, newUrl, tempSplit, splitter;
				splitter = "courseware";

				tempSplit = current.split(splitter);
				
				newUrl = tempSplit[0];
                                //window.location.replace(_fn.data.redirect);
                                    //window.location.replace(_fn.data.redirect);
                                    //window.location = _fn.data.redirect;
				console.log("redirecting: ");
				console.debug(window.location);
				console.log(_fn.data.redirect);
                                    //window.location.href = _fn.data.redirect;
                                    //window.location.href = "/jump_to_id/" + _fn.data.redirect;
				window.location.assign(newUrl + "jump_to_id/" + _fn.data.redirect);
                                }
                            }

                            if (data.feedback) {
                                _fn.feedback.popup(data.feedback, data.correct);
                            }
                        });
                    },

                    submitInput: function(evt) {
                        var $el = $(this).closest('li.option');
                        var $input_div = $el.find('.numerical-input');
                        var $input = $input_div.find('.input');
                        var val = $el.data('value');

                        if (!$input.val()) {
                            // Don't submit if the user didn't enter anything yet.
                            return;
                        }

                        $input.prop('disabled', true);
                        $input_div.find('.submit-input').prop('disabled', true);

                        $.post(runtime.handlerUrl(element, 'do_attempt'),
                            JSON.stringify({
                                val: val,
                                input: $input.val()
                        }), 'json').done(function(data){
                            if (data.correct) {
                                $input_div.removeClass('incorrect').addClass('correct');
                            } else {
                                $input_div.removeClass('correct').addClass('incorrect');
                            }

                            if (data.finished) {
                                _fn.finish(data.final_feedback);
                            }

                            if (data.feedback) {
                                _fn.feedback.popup(data.feedback, data.correct);
                            }
                        });
                    },

                    set: function($el, top, left) {
                        $el.addClass('within-dropzone')
                            .css({
                                top: top,
                                left: left
                            })
                            .draggable('disable');
                    },

                    reset: function($el) {
                        $el.removeClass('within-dropzone fade')
                            .css({
                                top: '',
                                left: '',
                                position: 'relative'
                            });
                    }
                },
                drop: {
                    hover: function(event, ui) {
                        var zone = $(event.currentTarget).data('zone'),
                            maxAccept = $(event.currentTarget).data('maxaccept');

			console.debug("Zone: ");
			console.debug(zone);

                        ui.draggable.data('zone', zone);
                    },
                    success: function(event, ui) {
                        var accepted = $(event.currentTarget).data('accepted'),
                            maxAccept = $(event.currentTarget).data('maxaccept');


                        if (accepted === "" || !accepted){
                            $(event.currentTarget).data('accepted', 0);
                            accepted = 0;
                        }

                        ui.draggable.addClass('within-dropzone');

                        if (accepted <= maxAccept && ui.draggable.hasClass("within-dropzone")){ 
                            ui.draggable.addClass('accepted-dropzone');
                            ui.draggable.data('accepted', accepted);
                            $(event.currentTarget).data('accepted', ++accepted);
                        }

                        var item = _fn.data.items[ui.draggable.data('value')];
                        if (item.inputOptions) {
                            ui.draggable.find('.input').focus();
                        }
                    }
                }
            },

            items: {
                init: function() {
                    _fn.$items.each(function (){
                        var $el = $(this),
                            saved_entry = _fn.data.state.items[$el.data('value')];

                        if (saved_entry) {
                            var $input_div = $el.find('.numerical-input')
                            var $input = $input_div.find('.input');
                            $input.val(saved_entry.input);
                            if ('input' in saved_entry) {
                                $input_div.addClass(saved_entry.correct_input ? 'correct' : 'incorrect');
                                $input.prop('disabled', true);
                                $input_div.find('.submit-input').prop('disabled', true);
                            }
                            if ('input' in saved_entry || saved_entry.correct_input) {
                                $el.addClass('fade');
                                $el.css('position', 'absolute')
                            }
                            _fn.eventHandlers.drag.set($el, saved_entry.top, saved_entry.left);
                        }
                    });
                },
                draw: function() {
                    var list = [],
                        saved_state = false,
                        items = _fn.data.items,
                        tpl = _fn.tpl.item,
                        img_tpl = _fn.tpl.imageItem
                        shuffle = _fn.data.shuffleItems,
                        background = _fn.data.backgroundItems,
                        backgroundColor = _fn.data.backgroundColorItems;

                    items.forEach(function(item) {
                        if(_fn.data.state.items[$(item).data('value')]){
                            saved_state = true;
                        }

                        if (item.backgroundImage.length > 0) {
                            list.push(img_tpl(item));
                        } else {
                            list.push(tpl(item));
                        }
                    });

                    // shuffle the items array if not an exercise in progress (saved_state
                    // and if shuffle is enabled
                    if( !saved_state && shuffle ){
                        list = shuffleArray(list);
                    }

                    // Update DOM
                    _fn.$ul.html(list.join(''));

                    // Set variable
                    _fn.$items = $('.xblock--drag-and-drop .items .option', element);

                    // custom background color added here
                    if(background){
                        _fn.$items.each(function(key, item){
                            $(item).css("backgroundColor",backgroundColor);
                        });
                    }
                }
            },

            zones: {
                draw: function() {
                    var html = [],
                        zones = _fn.data.zones,
                        tpl = _fn.tpl.zoneElement,
                        i,
                        len = zones.length;

                    for (i=0; i<len; i++) {
                        html.push(tpl(zones[i]));
                    }

                    // Update DOM
                    _fn.$target.html(html.join(''));

                    // Set variable
                    _fn.$zones = _fn.$target.find('.zone');
                }
            },

            feedback: {
                // Update DOM with feedback
                set: function(str) {
                    if ($.trim(str) === '') _fn.$feedback.parent().hide();
                    else _fn.$feedback.parent().show();
                    return _fn.$feedback.html(str);
                },

                // Show a feedback popup
                popup: function(str, boo) {
                    if (str === undefined || str === '') return;

                    if (_fn.$popup.is(":visible")) {
                        publish_event({
                            event_type: "xblock.drag-and-drop-v2.feedback.closed",
                            content: _fn.$popup.find(".popup-content").text(),
                            manually: false
                        });
                    }
                    publish_event({
                        event_type: "xblock.drag-and-drop-v2.feedback.opened",
                        content: str
                    });

                    _fn.$popup.find(".popup-content").html(str);
                    _fn.$popup.show();

                    _fn.popup_ts = Date.now();
                }
            },

            data: null
        };

        return {
            init: _fn.init,
        };
    })(jQuery);

    $.ajax(runtime.handlerUrl(element, 'get_data'), {
        dataType: 'json'
    }).done(function(data){
        dragAndDrop.init(data);
    });

    publish_event({event_type:"xblock.drag-and-drop-v2.loaded"});
}
