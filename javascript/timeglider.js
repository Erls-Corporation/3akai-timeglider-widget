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
require(['jquery', 'sakai/sakai.api.core',
        '/devwidgets/timeglider/javascript/timeglider-0.1.3.min.js',
        '/devwidgets/timeglider/javascript/underscore-min.js',
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
        '/devwidgets/timeglider/javascript/jquery-ui.js'], function($, sakai) {
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

        ///////////////////////
        // Utility functions //
        ///////////////////////

        /**
         * Checks if the provided profile or query is non-empty and returns it
         * if that is the case. If it is empty it returns the DEFAULT_INPUT
         *
         * @param {String} fileURL The profile or query
         */
        var checkInput = function(fileURL) {
            return (fileURL && $.trim(fileURL)) ? $.trim(fileURL) : DEFAULT_URL;
        };


        /**
         * Gets the profile/query from the server using an asynchronous request
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
            $mainContainer.html('<div id="' + widgetID + '"></div>');
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


        ////////////////////
        // Event Handlers //
        ////////////////////

        $settingsForm.on('submit', function(ev) {
            // get the selected input
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
            sakai.api.Widgets.Container.informFinish(tuid, 'timeglider');
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
        $("head").append('<link id="timeglider_css' + tuid + '" rel="stylesheet" href="/devwidgets/timeglider/javascript/timeglider/Timeglider.css" type="text/css" media="screen" title="no title" charset="utf-8" />');
        $("head").append('<link id="timeglider_jquery_css' + tuid + '" rel="stylesheet" href="/devwidgets/timeglider/css/aristo/jquery-ui-1.8.5.custom.css" type="text/css" media="screen" title="no title" charset="utf-8" />');
        // run the initialization function when the widget object loads
        doInit();
    };

    // inform Sakai OAE that this widget has loaded and is ready to run
    sakai.api.Widgets.widgetLoader.informOnLoad('timeglider');
});
