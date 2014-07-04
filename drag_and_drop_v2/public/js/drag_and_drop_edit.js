function DragAndDropEditBlock(runtime, element) {
    var dragAndDrop = (function($) {
        var _fn = {

            // DOM Elements
            $target: $('.xblock--drag-and-drop .target-img', element),

            // item template
            tpl: {
                zoneInput: function() {
                    return [
                        '<div class="zone-row <%= name %>">',
                            '<label>Text</label>',
                            '<input type="text" class="title" placeholder="<%= title %>" />',
                            '<a href="#" class="remove-zone hidden">',
                                '<div class="icon remove"></div>',
                            '</a>',
                            '<div class="layout">',
                                '<label>width</label>',
                                '<input type="text" class="size width" value="200" />',
                                '<label>height</label>',
                                '<input type="text" class="size height" value="100" />',
                                '<br />',
                                '<label>x</label>',
                                '<input type="text" class="coord x" value="0" />',
                                '<label>y</label>',
                                '<input type="text" class="coord y" value="0" />',
                            '</div>',
                        '</div>'
                    ].join('');
                },
                zoneElement: function() {
                    return [
                        '<div id="<%= id %>" class="zone" data-zone="<%= title %>" style="',
                            'top:<%= y %>px;',
                            'left:<%= x %>px;',
                            'width:<%= width %>px;',
                            'height:<%= height %>px;">',
                            '<p><%= title %></p>',
                        '</div>'
                    ].join('');
                },
                zoneDropdown: '<option value="<%= value %>"><%= value %></option>',
                itemInput: function() {
                    return [
                        '<div class="item">',
                            '<div class="row">',
                                '<label>Text</label>',
                                '<input type="text" class="item-text"></input>',
                                '<label>Zone</label>',
                                '<select class="zone-select"><%= dropdown %></select>',
                                '<a href="#" class="remove-item hidden">',
                                    '<div class="icon remove"></div>',
                                '</a>',
                            '</div>',
                            '<div class="row">',
                                '<label>Background image URL (alternative to the text)</label>',
                                '<textarea class="background-image"></textarea>',
                            '</div>',
                            '<div class="row">',
                                '<label>Success Feedback</label>',
                                '<textarea class="success-feedback"></textarea>',
                            '</div>',
                            '<div class="row">',
                                '<label>Error Feedback</label>',
                                '<textarea class="error-feedback"></textarea>',
                            '</div>',
                            '<div class="row">',
                                '<label>Width (px - 0 for auto)</label>',
                                '<input type="text" class="item-width" value="190"></input>',
                                '<label>Height (px - 0 for auto)</label>',
                                '<input type="text" class="item-height" value="0"></input>',
                            '</div>',
                        '</div>'
                    ].join('');
                }
            },

            build: {
                $el: {
                    feedback: {
                        form: $('.xblock--drag-and-drop .drag-builder .feedback-form', element),
                        tab: $('.xblock--drag-and-drop .drag-builder .feedback-tab', element)
                    },
                    zones: {
                        form: $('.xblock--drag-and-drop .drag-builder .zones-form', element),
                        tab: $('.xblock--drag-and-drop .drag-builder .zones-tab', element)
                    },
                    items: {
                        form: $('.xblock--drag-and-drop .drag-builder .items-form', element),
                        tab: $('.xblock--drag-and-drop .drag-builder .items-tab', element)
                    },
                    target: $('.xblock--drag-and-drop .drag-builder .target-img', element)
                },
                init: function(data) {
                    _fn.data = data;

                    _fn.build.clickHandlers();
                    _fn.build.form.zone.add();
                },
                clickHandlers: function() {
                    var $fbkTab = _fn.build.$el.feedback.tab,
                        $zoneTab = _fn.build.$el.zones.tab,
                        $itemTab = _fn.build.$el.items.tab;

                    $(element).one('click', '.continue-button', function(e) {
                        e.preventDefault();
                        _fn.build.form.feedback(_fn.build.$el.feedback.form);

                        $fbkTab.addClass('hidden');
                        $zoneTab.removeClass('hidden');

                        // Placeholder shim for IE9
                        $.placeholder.shim();

                        $(this).one('click', function(e) {
                            e.preventDefault();
                            _fn.build.form.zone.setAll();
                            _fn.build.form.item.add();

                            $zoneTab.addClass('hidden');
                            $itemTab.removeClass('hidden');

                            // Placeholder shim for IE9
                            $.placeholder.shim();

                            $(this).addClass('hidden');
                            $('.save-button', element).parent()
                                .removeClass('hidden')
                                .one('click', function(e) {
                                    e.preventDefault();
                                    _fn.build.form.submit();
                                });
                        });
                    });

                    $zoneTab
                        .on('click', '.add-zone', _fn.build.form.zone.add)
                        .on('click', '.remove-zone', _fn.build.form.zone.remove)
                        .on('click', '.target-image-form button', function(e) {
                            e.preventDefault();

                            _fn.data.targetImg = $('.target-image-form input', element).val();
                            _fn.$target.css('background', 'url(' + _fn.data.targetImg + ') no-repeat');

                            // Placeholder shim for IE9
                            $.placeholder.shim();
                        });

                    $itemTab
                        .on('click', '.add-item', _fn.build.form.item.add)
                        .on('click', '.remove-item', _fn.build.form.item.remove);
                },
                form: {
                    zone: {
                        count: 0,
                        formCount: 0,
                        dropdown: '',
                        list: [],
                        obj: [],
                        add: function(e) {
                            var inputTemplate = _fn.tpl.zoneInput(),
                                zoneTemplate = _fn.tpl.zoneElement(),
                                name = 'zone-',
                                $elements = _fn.build.$el,
                                num,
                                obj;

                            if (e) {
                                e.preventDefault();
                            }

                            _fn.build.form.zone.count++;
                            _fn.build.form.zone.formCount++;
                            num = _fn.build.form.zone.count;
                            name += num;

                            // Update zone obj
                            zoneObj = {
                                title: 'Zone ' + num,
                                id: name,
                                active: false,
                                index: num,
                                width: 200,
                                height: 100,
                                x: 0,
                                y: 0
                            };

                            _fn.build.form.zone.obj.push(zoneObj);

                            // Add fields to zone position form
                            $elements.zones.form.append(_.template(inputTemplate, {
                                title: 'Zone ' + num,
                                name: name
                            }));
                            _fn.build.form.zone.enableDelete();

                            // Add zone div to target
                            $elements.target.append(_.template(zoneTemplate, zoneObj));

                            // Listen to changes in form to update zone div
                            _fn.build.form.zone.clickHandler(num);

                            // Placeholder shim for IE9
                            $.placeholder.shim();
                        },
                        remove: function(e) {
                            var $el = $(e.currentTarget).closest('.zone-row'),
                                classes = $el.attr('class'),
                                id = classes.slice(classes.indexOf('zone-row') + 9);

                            e.preventDefault();
                            $el.detach();
                            $('#' + id, element).detach();

                            _fn.build.form.zone.formCount--;
                            _fn.build.form.zone.disableDelete();

                            // Placeholder shim for IE9
                            $.placeholder.shim();
                        },
                        enableDelete: function() {
                            if (_fn.build.form.zone.formCount > 1) {
                                _fn.build.$el.zones.form.find('.remove-zone').removeClass('hidden');
                            }
                        },
                        disableDelete: function() {
                            if (_fn.build.form.zone.formCount === 1) {
                                _fn.build.$el.zones.form.find('.remove-zone').addClass('hidden');
                            }
                        },
                        setAll: function() {
                            var zones = [],
                                $form = _fn.build.$el.zones.form.find('.title');

                            $form.each(function(i, el) {
                                var val = $(el).val();

                                if (val.length > 0) {
                                    zones.push(val);
                                }
                            });

                            _fn.build.form.zone.list = zones;
                            _fn.build.form.createDropdown(zones);
                        },
                        clickHandler: function(num) {
                            var $div = $('#zone-' + num, element),
                                $form = _fn.build.$el.zones.form.find('.zone-row.zone-' + num);

                            // Listen to form changes and update zone div position
                            $form.on('keyup', '.title', function(e) {
                                    var text = $(e.currentTarget).val(),
                                        record = _.findWhere(_fn.build.form.zone.obj, {
                                            index: num
                                        });

                                    $div.find('p').html(text);
                                    record.title = text;

                                    if (!record.active) {
                                        record.active = true;
                                    }
                                }).on('keyup', '.width', function(e) {
                                    var width = $(e.currentTarget).val(),
                                        record = _.findWhere(_fn.build.form.zone.obj, {
                                            index: num
                                        });

                                    $div.css('width', width + 'px');
                                    record.width = width;
                                }).on('keyup', '.height', function(e) {
                                    var height = $(e.currentTarget).val(),
                                        record = _.findWhere(_fn.build.form.zone.obj, {
                                            index: num
                                        });

                                    $div.css('height', height + 'px');
                                    record.height = height;
                                }).on('keyup', '.x', function(e) {
                                    var x = $(e.currentTarget).val(),
                                        record = _.findWhere(_fn.build.form.zone.obj, {
                                            index: num
                                        });

                                    $div.css('left', x + 'px');
                                    record.x = x;
                                }).on('keyup', '.y', function(e) {
                                    var y = $(e.currentTarget).val(),
                                        record = _.findWhere(_fn.build.form.zone.obj, {
                                            index: num
                                        });

                                    $div.css('top', y + 'px');
                                    record.y = y;
                                });
                        },
                        cleanObject: function(arr) {
                            var clean = [],
                                i,
                                len = arr.length;

                            for (i=0; i<len; i++) {
                                if (arr[i].active) {
                                    clean.push(arr[i]);
                                }
                            }

                            return clean;
                        }
                    },
                    createDropdown: function(arr) {
                        var tpl = _fn.tpl.zoneDropdown,
                            i,
                            len = arr.length,
                            dropdown = [],
                            html;

                        for (i=0; i<len; i++) {
                            dropdown.push(_.template(tpl, { value: arr[i] }));
                        }

                        // Add option to include dummy answers
                        dropdown.push(_.template(tpl, { value: 'none' }));

                        html = dropdown.join('');
                        _fn.build.form.zone.dropdown = html;
                        _fn.build.$el.items.form.find('.zone-select').html(html);
                    },
                    feedback: function($form) {
                        _fn.data.feedback = {
                            start: $form.find('.intro-feedback').val(),
                            finish: $form.find('.final-feedback').val()
                        };
                    },
                    item: {
                        count: 0,
                        add: function(e) {
                            var $form = _fn.build.$el.items.form,
                                tpl = _fn.tpl.itemInput();

                            if (e) {
                                e.preventDefault();
                            }

                            _fn.build.form.item.count++;
                            $form.append(_.template(tpl, { dropdown: _fn.build.form.zone.dropdown }));
                            _fn.build.form.item.enableDelete();

                            // Placeholder shim for IE9
                            $.placeholder.shim();
                        },
                        remove: function(e) {
                            var $el = $(e.currentTarget).closest('.item');

                            e.preventDefault();
                            $el.detach();

                            _fn.build.form.item.count--;
                            _fn.build.form.item.disableDelete();

                            // Placeholder shim for IE9
                            $.placeholder.shim();
                        },
                        enableDelete: function() {
                            if (_fn.build.form.item.count > 1) {
                                _fn.build.$el.items.form.find('.remove-item').removeClass('hidden');
                            }
                        },
                        disableDelete: function() {
                            if (_fn.build.form.item.count === 1) {
                                _fn.build.$el.items.form.find('.remove-item').addClass('hidden');
                            }
                        }
                    },
                    submit: function() {
                        var items = [],
                            $form = _fn.build.$el.items.form.find('.item');

                        $form.each(function(i, el) {
                            var $el = $(el),
                                name = $el.find('.item-text').val(),
                                backgroundImage = $el.find('.background-image').val();

                            if (name.length > 0 || backgroundImage.length > 0) {
                                var width = $el.find('.item-width').val(),
                                    height = $el.find('.item-height').val();

                                if (height === '0') height = 'auto';
                                else height = height + 'px';

                                if (width === '0') width = 'auto';
                                else width = width + 'px';

                                items.push({
                                    displayName: name,
                                    zone: $el.find('.zone-select').val(),
                                    id: i,
                                    feedback: {
                                        correct: $el.find('.success-feedback').val(),
                                        incorrect: $el.find('.error-feedback').val()
                                    },
                                    size: {
                                        width: width,
                                        height: height
                                    },
                                    backgroundImage: backgroundImage
                                });
                            }
                        });

                        _fn.data.items = items;
                        _fn.data.zones = _fn.build.form.zone.cleanObject(_fn.build.form.zone.obj);

                        var data = {
                            'display_name': $(element).find('.display-name').val(),
                            'question_text': $(element).find('.question-text').val(),
                            'data': JSON.stringify(_fn.data),
                        };

                        $('.xblock-editor-error-message', element).html();
                        $('.xblock-editor-error-message', element).css('display', 'none');
                        var handlerUrl = runtime.handlerUrl(element, 'studio_submit');
                        $.post(handlerUrl, JSON.stringify(data)).done(function(response) {
                            if (response.result === 'success') {
                                window.location.reload(false);
                            } else {
                                $('.xblock-editor-error-message', element).html('Error: '+response.message);
                                $('.xblock-editor-error-message', element).css('display', 'block');
                            }
                        });
                    }
                }
            },

            data: null
        };

        return {
            builder: _fn.build.init
        };
    })(jQuery);

    $(element).find('.cancel-button').bind('click', function() {
        runtime.notify('cancel', {});
    });

    $.ajax(runtime.handlerUrl(element, 'get_data')).done(function(data){
        dragAndDrop.builder(data);
    });
}
