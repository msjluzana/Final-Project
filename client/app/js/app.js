$(function() {

    var app = {
        init: function() {
            this.user = {};
            $('.menu-crud').addClass('hidden');
            $('.menu-user').addClass('hidden');
            $('.menu-loading').removeClass('hidden');
            $('.menu-user').addClass('hidden');
            $('.btn-login').addClass('hidden');
            $('.btn-login').attr('href', '/api/login?url=/');
            $('.btn-logout').attr('href','/api/logout?url=/');

            this.router = new Router();
            this.setEventListeners();
            this.getUser();

            Backbone.history.start({pushState: true});
        },

        setEventListeners: function() {
            var self = this;
            $('.menu-crud .item a').click(function(ev) {
                var $el = $(ev.target).closest('.item');

                $('.menu-crud .item').removeClass('active');
                $el.addClass("active");

                if ($el.hasClass('menu-list')) {
                    self.router.navigate('list', {trigger: true});
                }

                if ($el.hasClass('menu-create')) {
                    self.router.navigate('new', {trigger: true});
                }

            });

            $('.navbar-brand').click(function() {
                self.router.navigate('', {trigger: true});
            });
            $('.search').unbind('submit').submit(function(ev) {
                self.router.navigate('search?=' + $('.search_result').val(), {trigger: true});
                return false;
            });
            $('.btn-cancel').click(function(ev) {
                ev.preventDefault();
                self.router.navigate('list', {trigger: true});
            });
        },

        getUser: function() {
            var self = this;
            $.ajax({
                method: 'GET',
                url: '/api/users/me',
                success: function(me) {
                    // user is already signed in
                    console.log(me);
                    self.user = me;
                    self.showLogout();
                },

                error: function(err) {
                    console.log('you have not authenticated');
                    self.showLogin();
                }
            });
        },
        showLogin: function() {
           $('.menu-loading').addClass('hidden');
           $('.menu-user').addClass('hidden');
           $('.btn-login').removeClass('hidden');
        },
        showLogout: function() {
           $('.menu-crud').removeClass('hidden');
           $('.user-email').text(this.user.email);
           $('.menu-loading').addClass('hidden');
           $('.btn-login').addClass('hidden');
           $('.menu-user').removeClass('hidden');
        },
        showHome: function() {
            $('.app-content').html('');
        },
        showList: function() {
            var $listTemplate = getTemplate('tpl-thesis-list');
            $('.app-content').html($listTemplate);
        },
        search: function(query, callback) {
            $.get('/api/search/?q=' + query, {
                returned_fields: JSON.stringify(['Title', 'Year'])
            }, function(list) {
                callback(list);
            });
        },
        getThesisByID: function(id, callback) {
            var object = {};
            $.get('/api/thesis/' + id, function(item) {
                callback(item);
            });
        },
        showThesis: function(thesis) {
            var self = this;
            var $viewTemplate = getTemplate('tpl-thesis-detail', thesis);
            $('.app-content').html($viewTemplate);
        },
        showForm: function(object) {
            var self = this;
            if (!object) {
                object = {};
            }
            var $formTemplate = getTemplate('tpl-thesis-form', object);
            $('.app-content').html($formTemplate);
            $('form').unbind('submit').submit(function(ev) {
                var thesisObject = {};
                var inputs = $('form').serializeArray();
                for (var i = 0; i < inputs.length; i++) {
                    thesisObject[inputs[i].name] = inputs[i].value;
                }
                self.save(thesisObject);
                return false;
            });
            self.setEventListeners();
        },
        loadAllThesis: function() {
            var self = this;
            setTimeout(function() {
                $.get('/api/thesis', function(res) {
                    self.displayLoadedList(res);
                });
            }, 200);
        },
        displayLoadedList: function(list) {
            var self = this;
            _.each(list, function(item) {
                var $thesisItem = $(getTemplate('tpl-thesis-list-item', item));
                var id = item.Id
                if (item.Key) {
                    id = item.Key;
                }
                $thesisItem.find('.edit').click(function() {
                    self.router.navigate('edit-thesis-' + id, {trigger: true});
                });
                $thesisItem.find('.view').click(function() {
                    self.router.navigate('thesis-' + id, {trigger: true});
                });
                $thesisItem.find('.delete').click(function() {
                    self.router.navigate('delete-thesis-' + id, {trigger: true});
                });
                $('.thesis-list').append($thesisItem);
            });

            // add event handlers for the edit button

        },
        save: function(object) {
            var self = this;
            $.post('api/thesis', object, function(res) {
                self.router.navigate('list', {trigger: true});
            });
            self.showList();
        },
        deleteThesis: function(id){
            var self = this;
            $.ajax({
                type: 'DELETE',
                url: '/api/thesis/' + id,
                success: function() {
                    self.router.navigate('list', {trigger: true});
                }
            });
        },
        searchThesis: function(keyword){
            var self = this;
            var regex = new RegExp(".*(" + keyword + ").*", "i");
            $.get('/api/thesis', function(obj){
               var sorted_list = $.grep(obj, function(thesis, index){
                    return regex.test(thesis.Title);
               });
               if(sorted_list.length == 0){
                    alert('The thesis you are looking for is not existing in our database');
               }
               else{
                    var $listTemplate = getTemplate('tpl-thesis-list');
                    $('.app-content').html($listTemplate);
                    _.each(sorted_list, function(item) {
                        var $thesisItem = $(getTemplate('tpl-thesis-list-item', item));
                        $('.thesis-list').append($thesisItem);
                        var id = item.Id
                        if (item.Key) {
                            id = item.Key;
                        }
                        $thesisItem.find('.edit').click(function() {
                            self.router.navigate('edit-thesis-' + id, {trigger: true});
                        });
                        $thesisItem.find('.view').click(function() {
                            self.router.navigate('thesis-' + id, {trigger: true});
                        });
                        $thesisItem.find('.delete').click(function() {
                            self.router.navigate('delete-thesis-' + id, {trigger: true});
                        });
                    });
               }
               $('.search-input').val('');
            });
        }


    };

    function getTemplate(template_id, context) {
        var template, $template, markup;
        template = $('#' + template_id);
        $template = Handlebars.compile(template.html());
        markup = $template(context);
        return markup;

    }


    var Router = Backbone.Router.extend({
        routes: {
            '': 'onHome',
            'search?=:query': 'onSearch',
            'thesis-:id': 'onView',
            'new': 'onCreate',
            'edit-thesis-:id': 'onEdit',
            'list': 'onList',
            'delete-thesis-:id': 'onDelete'
        },

       onHome: function() {
            app.showHome();
       },
       onSearch: function(query) {
            app.searchThesis(query);
       },
       onView: function(id) {
           console.log('thesis id', id);
            app.getThesisByID(id, function(item) {
                app.showThesis(item);
                FB.XFBML.parse();
            });
       },
       onCreate: function() {
            app.showForm();
       },
       onEdit: function(id) {
            app.getThesisByID(id, function(item) {
                app.showForm(item);
            });
       },
       onList: function() {
            app.showList();
            app.loadAllThesis();
       },
       onDelete: function(id) {
            app.deleteThesis(id);
       },

    });
    app.init();


});