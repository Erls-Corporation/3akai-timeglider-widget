/*
 * Licensed to the Sakai Foundation (SF) under one
 * or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership. The SF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License. You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations under the License.
 */

// load the master sakai object to access all Sakai OAE API methods
require(['jquery', 'sakai/sakai.api.core', 'underscore',
        '/devwidgets/timeglider/javascript/timeglider-0.1.4.min.js',
        '/devwidgets/timeglider/javascript/backbone-min.js',
        '/devwidgets/timeglider/javascript/jquery.tmpl.js',
        '/devwidgets/timeglider/javascript/ba-debug.min.js',
        '/devwidgets/timeglider/javascript/ba-tinyPubSub.js',
        '/devwidgets/timeglider/javascript/jquery.mousewheel.min.js',
        '/devwidgets/timeglider/javascript/jquery.ui.ipad.js',
        '/devwidgets/timeglider/javascript/timeglider/TG_Date.js',
        '/devwidgets/timeglider/javascript/timeglider/TG_Org.js',
        '/devwidgets/timeglider/javascript/timeglider/TG_Timeline.js',
        '/devwidgets/timeglider/javascript/timeglider/TG_TimelineView.js',
        '/devwidgets/timeglider/javascript/timeglider/TG_Mediator.js',
        '/devwidgets/timeglider/javascript/timeglider/timeglider.timeline.widget.js',
        '/devwidgets/timeglider/javascript/jquery-ui.js',
        'jquery-plugins/jquery.fileupload', 'jquery-plugins/jquery.MultiFile.sakai-edited'
        ], function($, sakai) {
    /**
     * @name sakai.timeglider
     *
     * @class timeglider
     *
     * @description
     * timeglider is a widget that embeds a Timeline generated from a JSON file.
     * This is done by using the Timglider library
     *
     * @version 0.0.1
     * @param {String} tuid Unique id of the widget
     * @param {Boolean} showSettings Show the settings of the widget or not
     */
    sakai_global.timeglider = function(tuid, showSettings) {

        /////////////////////////////
        // Configuration variables //
        /////////////////////////////
        var DEFAULT_URL = '/devwidgets/timeglider/default_data.json';
        var DEFAULT_MIN_ZOOM = 20;
        var DEFAULT_MAX_ZOOM = 50;


        // DOM jQuery Objects
        var $rootel = $('#' + tuid); //unique container for each widget instance
        var $mainContainer = $('#timeglider_main', $rootel);
        var $settingsContainer = $('#timeglider_settings', $rootel);
        var $settingsForm = $('#timeglider_settings_form', $rootel);
        var $cancelSettings = $('#timeglider_cancel_settings', $rootel);
        var $fileURL = $('#timeglider_file_url', $rootel);
        var $zoomRange = $('#timeglider_zoom_range_slider', $rootel);
        var $zoomNumbers = $('#timeglider_zoom_numbers', $rootel);
        var $uploadForm = $('#timeglider_upload_form', $rootel);
        var $uploadButton = $('#timeglider_upload_btn', $rootel);

        //Paths
        var uploadPath = '/system/pool/createfile';


        ///////////////////////
        // Utility functions //
        ///////////////////////

        /**
         * Checks if the provided profile or query is non-empty and returns it
         * if that is the case. If it is empty it returns the DEFAULT_URL
         *
         * @param {String} fileURL The JSON URL
         */
        var checkInput = function(fileURL) {
            return (fileURL && $.trim(fileURL)) ? $.trim(fileURL) : DEFAULT_URL;
        };


        /**
         * Gets the data from the server using an asynchronous request
         *
         * @param {Object} callback Function to call when the request returns. This
         * function will be sent a String with the preferred profile or channel.
         */
        var getPreferredInput = function(callback) {
            // get the data associated with this widget
            sakai.api.Widgets.loadWidgetData(tuid, function(success, data) {
                if (success) {
                    // fetching the data succeeded, send it to the callback function
                    callback(checkInput(data.fileURL), data.minZoom, data.maxZoom);
                } else {
                    // fetching the data failed, we use the DEFAULT_COLOR
                    callback(DEFAULT_URL, DEFAULT_MIN_ZOOM, DEFAULT_MAX_ZOOM);
                }
            });
        };

        /////////////////////////
        // Main View functions //
        /////////////////////////

        /**
         * Shows the Main view that contains the timeglider widget
         *
         * @param {String} fileURL The URL of the JSON file
         */

        var showMainView = function(fileURL, minZoom, maxZoom) {

            var widgetID = 'timeglider_actual_widget' + tuid;
            $mainContainer.timeline({
                "data_source":fileURL,
                "min_zoom":minZoom,
                "max_zoom":maxZoom
            });
            $mainContainer.show();

        }


        /////////////////////////////
        // Settings View functions //
        /////////////////////////////

        /**
         * Sets the Settings view to the right settings
         *
         * @param {String} fileURL The profile or query string
         */
        var renderSettings = function(fileURL, minZoom, maxZoom) {
            $fileURL.val(checkInput(fileURL));
            //show slider
            $zoomRange.slider({
                range: true,
                min:1,
                max:100,
                values:[minZoom, maxZoom],
                slide:function(event, ui) {
                    $zoomNumbers.html(ui.values[0] + ' - ' + ui.values[1]);
                }
            });
            $zoomNumbers.html($zoomRange.slider( "values", 0 ) +
                    ' - ' + $zoomRange.slider( "values", 1 ) );
        };



        //////////////////////////
        // Uploading a new file //
        //////////////////////////

        var constructItem = function() {
            var contentObj = {
                'sakai:pooled-content-file-name': 'Timgliderdataset',
                'sakai:description': 'Dataset for timeglider',
                'sakai:permissions': 'public',
                'sakai:copyright': 'creative commons',
                'sakai:originaltitle': '',
                'sakai:tags': '',
                'sakai:fileextension': 'json',
                'css_class': sakai.config.MimeTypes[sakai.config.Extensions['json'] || 'other'].cssClass || 'icon-unknown-sprite',
                'type': 'content',
                'origin':'user' // 'origin' tells Sakai that this file was selected from the users hard drive
            };
            uploadContent(contentObj);
        };


        /////////////////////////
        // Uploading new files //
        /////////////////////////

        /**
         * Execute the multifile upload
         */
        var uploadContent = function(contentObj) {
            $uploadForm.attr('action', uploadPath);
            $uploadForm.ajaxForm({
                dataType: 'json',
                data: {'_charset_': 'utf8'},
                success: function(data) {
                    var extractedData = [];
                    for (var i in data) {
                        if (data.hasOwnProperty(i)) {
                            contentObj = $.extend({}, data[i].item, contentObj);
                            setDataOnContent(contentObj);
                        }
                    }
                },
                error: function() {
                    checkUploadCompleted();
                }
            });
            $uploadForm.submit();
        };



        //////////////////////////////
        // General metadata setting //
        //////////////////////////////

        /**
         * Set extra data (title, description,...) on a piece of uploaded content
         * @param {Object} data Contains ID's returned from the server to construct the POST URL and title with
         */
        var setDataOnContent = function(contentObj) {
            var batchRequests = [];
            batchRequests.push({
                'url': '/p/' + contentObj['_path'],
                'method': 'POST',
                'parameters': {
                    'sakai:pooled-content-file-name': contentObj['sakai:pooled-content-file-name'],
                    'sakai:description': contentObj['sakai:description'],
                    'sakai:permissions': contentObj['sakai:permissions'],
                    'sakai:copyright': contentObj['sakai:copyright'],
                    'sakai:allowcomments': 'false',
                    'sakai:showcomments': 'false',
                    'sakai:fileextension': contentObj['sakai:fileextension']
                }
            });

/*****
            // Add this content to the selected library
            if(libraryToUploadTo !== sakai.data.me.user.userid) {
                batchRequests.push({
                    url: '/p/' + contentObj['_path'] + '.members.json',
                    parameters: {
                        ':viewer': libraryToUploadTo
                    },
                    method: 'POST'
                });
                // Add the selected library as a viewer to the cached results
                contentObj['sakai:pooled-content-viewer'] = contentObj['sakai:pooled-content-viewer'] || [];
                contentObj['sakai:pooled-content-viewer'].push(libraryToUploadTo);
                // If we are in the context of the group, make the group managers a manager of the
                // content as well
                if (sakai_global.group && sakai_global.group.groupData && sakai_global.group.groupData['sakai:group-id'] === libraryToUploadTo) {
                    // We only do this if the system is configured to support this
                    if (sakai.config.Permissions.Groups.addcontentmanagers) {
                        var roles = sakai.api.Groups.getRoles(sakai_global.group.groupData);
                        for (var role in roles) {
                            if (roles.hasOwnProperty(role) && roles[role].isManagerRole) {
                                batchRequests.push({
                                    url: '/p/' + contentObj['_path'] + '.members.json',
                                    parameters: {
                                        ':manager': libraryToUploadTo + '-' + roles[role].id
                                    },
                                    method: 'POST'
                                });
                            }
                        }
                    }
                }
            }
*****/
            // Set initial version
            if (contentObj['_mimeType'] !== 'x-sakai/document') {
                batchRequests.push({
                    'url': '/p/' + contentObj['_path'] + '.save.json',
                    'method': 'POST'
                });
            }

            sakai.api.Server.batch(batchRequests, function(success, response) {
                // Tag the content
                sakai.api.Util.tagEntity('/p/' + (contentObj['_path']), contentObj['sakai:tags'], false, function() {
                    // Set the correct file permissions
                    sakai.api.Content.setFilePermissions([{'hashpath': contentObj['_path'], 'permissions': contentObj['sakai:permissions']}], function() {
//                        lastUpload.push(contentObj);
//                        checkUploadCompleted(true);
                    });
                });
            });
            $fileURL.val('/p/' + contentObj['_path']);

        };


        ////////////////////
        // Event Handlers //
        ////////////////////

        $settingsForm.on('submit', function(ev) {
            // get the selected input
            constructItem();
            var fileURL = $fileURL.val();
            var minZoom = $zoomRange.slider('values', 0);
            var maxZoom = $zoomRange.slider('values', 1);
            // save the selected input
            sakai.api.Widgets.saveWidgetData(tuid, {
                fileURL: fileURL,
                minZoom: minZoom,
                maxZoom: maxZoom
            },
                function(success, data) {
                    if (success) {
                        // Settings finished, switch to Main view
                        sakai.api.Widgets.Container.informFinish(tuid, 'timeglider');
                    }
                }
            );
            return false
        });

        $cancelSettings.on('click', function() {
            sakai.api.Widgets.Container.informCancel(tuid, 'timeglider');
        });

        $uploadButton.on('click', function() {
            constructItem();
        });

        /////////////////////////////
        // Initialization function //
        /////////////////////////////

        /**
         * Initialization function DOCUMENTATION
         */
        var doInit = function() {
            if (showSettings) {
                getPreferredInput(renderSettings);

                $settingsContainer.show();
            } else {
                    getPreferredInput(showMainView);
            }
        };
        // run the initialization function when the widget object loads
            sakai.api.Util.include.css('/devwidgets/timeglider/javascript/timeglider/Timeglider.css');
            sakai.api.Util.include.css('/devwidgets/timeglider/css/ui-lightness/jquery-ui-1.8.20.custom.css');
        doInit();
    };

    // inform Sakai OAE that this widget has loaded and is ready to run
    sakai.api.Widgets.widgetLoader.informOnLoad('timeglider');
});
