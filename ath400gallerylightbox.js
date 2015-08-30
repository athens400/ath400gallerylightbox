/**
 * Place your JS-code here.
 */
 
(function($) {
    
    /*****************************
     * ATH400LIGHTBOX PLUGIN
     * ---------------------
     *****************************/
    $.fn.ath400lightbox = function(options) {
        options = $.extend({}, $.fn.ath400lightbox.defaults, options);
        options.duration = options.duration / 2;
        
        var lightbox,
            figure,
            navNext = '',
            navPrev = '';
            
        if(options.navigation) {
            navNext = '<div class="ath400lightboxNext"></div>',
            navPrev = '<div class="ath400lightboxPrev"></div>';
        }
        
        // Navigate images with arrow keys
        $(document).keyup(function (e) {
            switch(e.which) {
                case 37:    // Left key: previous image
                $('div.ath400lightboxPrev').trigger('click');
                break;
                case 39:    // Right key: next image
                $('div.ath400lightboxNext').trigger('click');
                break;
                default: return;
            }
            e.preventDefault();
        });
        
        /***************************
         * Display image
         ***************************/
        function showLightbox(imgSrc, caption, that, duration) {    // duration is only used to override options.duration (for toggling between images)
            duration = duration || 0;
            // Make selector into variable. Looks messy but runs faster than multiple selector searches
            lightbox = $('<div class="ath400lightboxOverlay"><span class="alignmentHelperHeight"></span>' + navPrev + '<div class="ath400lightbox"></div>' + navNext + '</div>'),
            figure = $('<figure class="imgFrame"><figcaption class="ath400lightboxCaption">' + caption + '</figure>');
            
            lightbox.appendTo('body')
            .fadeOut(0)
            .fadeIn(duration)
            .click(function () {
               removeLightbox(options.duration);
            });
            
            // Navigation next event
            $('div.ath400lightboxNext').click(function (e) {
                var next = that.next('figure').length !== 0 ? that.next('figure') : that.siblings('figure').first();    // If no next img, first is next
                toggleImage(next, $(this));
                e.stopPropagation();
            });
            
            // Navigation prev event
            $('div.ath400lightboxPrev').click(function (e) {
                var prev = that.prev('figure').length !== 0 ? that.prev('figure') : that.siblings('figure').last();     // If no prev img, last is prev
                toggleImage(prev, $(this));
                e.stopPropagation();
            });
               
            $('<img class="ath400lightboxImage">').attr('src', imgSrc)
            .load(function() {
                figure.prepend($(this)).appendTo('div.ath400lightbox');
                var captionHeight = $('figcaption.ath400lightboxCaption').height();
                
                $(this).css('max-height', ($(window).height() * 0.8 - captionHeight));  // Img no bigger than 80% of screen height (minus caption).
                // Maybe change to window - captionHeight - padding - margin ???
                
                // Fade out (0) and fade in figure
                figure.animate({
                    height: 'hide',
                    width: 'hide',
                    opacity: 0
                }, 0, function() {
                    $(this).animate({
                        height: 'show',
                        width: 'show',
                    }, options.duration, function() {
                        $(this).animate({'opacity': 1}, (options.duration/3)*2);
                    });
                });
            });            
        }
        
        /***************************
         * Close displayed image
         ***************************/
        function removeLightbox(duration, callback) {
            duration = duration || 0;
            callback = callback || function (){};
            lightbox.fadeOut(duration, function() {
                $(this).remove();
                callback();
            });
        }
        
        /***************************
         * Next/prev image
         ***************************/
        function toggleImage(image) {
            figure.animate({
                    height: 'hide',
                    width: 'hide',
                    opacity: 0
                }, options.duration, function () {
                    removeLightbox(0, function () { image.trigger('click', 0); });
                });
        }
        
        return $(this).bind('click', function(e, duration) {
            var imgSrc,
                caption;
                
            if (typeof duration === 'undefined' || duration === null) {
                duration = options.duration;
            }
            
            // Find src, and caption if there is any
            if ($(this).is('a')) {      // Link connected to lightbox
                imgSrc = $(this).attr('href');
            }
            else if ($(this).is('img')) {       // Plain image
                imgSrc = $(this).attr('src');
                caption = $(this).siblings('figcaption').text();
            } else {        // Container (figure/div etc.)
                if($(this).children('a').has('img').length !== 0) {     // Container with image inside link
                    imgSrc = $(this).children('a').has('img').first().attr('href');
                } else {
                    imgSrc = $(this).children('img').first().attr('src');
                }
                caption = $(this).children('figcaption').first().text();
            }
            
            if ($(this).parent().attr('href'))            //If image is link: use a href instead of img src (thumbnailing)
            {
                imgSrc = $(this).parent().attr('href');
            }
        
            showLightbox(imgSrc, caption, $(this), duration);
            console.log(imgSrc);
            
            e.preventDefault();
        });
    };
    
    // Default options for ath400lightbox
    $.fn.ath400lightbox.defaults = {
        navigation: false,
        duration: 800
    };
    
//-------------------------------------------------------------------------------------------------------------------------------------------
    
    /*****************************
     * ATH400GALLERY PLUGIN
     * --------------------
     *****************************/
    $.fn.ath400gallery = function(options) {
        options = $.extend({}, $.fn.ath400gallery.defaults, options);
        options.categoryDuration = options.categoryDuration === null ? options.duration / 2 : options.categoryDuration;
        
        var gallery,
            noOfImages,
            currentImage,
            display,
            animate = true,
            displayFunctions = {    // Build in display-options: lightbox or gallery. noDisplay is just a failsafe.
                lightbox:
                    function () {
                        $(this).ath400lightbox({
                            navigation: options.navigation,
                            duration: options.duration
                        });
                    }, 
                gallery:
                    function() {
                        $(this).click( function (e, duration) {
                            displayImage($(this), duration);
                            e.preventDefault();
                        });
                    },
                noDisplay:
                    function() {
                        $(this).click(function () { console.log('No display'); });
                    }
            };
        
        // Check options for display choice. Custom display or built-in. noDisplay as failsafe
        if($.isFunction(options.display)) {                             // Custom display (check if function)
            console.log('custom display');
            display = options.display;
        } else if($.isFunction(displayFunctions[options.display])) {    // Build-in display (check if display name matches built-in function)
            display = displayFunctions[options.display];
        } else {                                                        // No display fail-safe
            console.log('No valid display function');
            display = displayFunctions.noDisplay;
        }
        
        /***************************
         * Prepage gallery items
         ***************************/
        function prepGalleryItems(container) {
            container.addClass('thumbs');
            
            //Wrap all unwrapped imgs in figure
            container.children('img')
                .wrap('<figure class="imgFrame">')
                .end()
            .children('a')
                .children('img')
                    .wrap('<figure class="imgFrame">')
                    .end()
                .end()
            .find('figure')
                .prepend('<span class="alignmentHelperHeight">')    //Add element to enable vertical-alignment
                .addClass('imgFrame ' + options.shape)
                .each(display)
                .find('img')
                    .addClass('galleryImg');
        }
        
        /***************************
         * Prepage gallery categories
         ***************************/
        function prepGalleryCategories(that) {
            var categoryCounter = 0;
            
            that.prepend('<div class="galleryCategories">');    // Add categories list section/element
            
            that.children('div').not('.galleryCategories').each(function() {
                ++categoryCounter;
                $(this).addClass('galleryCategory category' + categoryCounter);     // 'categoryN'-class has no function in plugin. Easier css-access
                prepGalleryItems($(this));
                prepCategory($(this));
            });
        }
        
        /***************************
         * Prepare individual category
         ***************************/
        function prepCategory(category) {
            var heading = category.find(':header').length !== 0 ? '<figcaption>' + category.find(':header').text() + '</figcaption>' : '';  // Header (h1,h2 or etc) will be used as cover-text

            category.animate({      // Hide category
                opacity: 0,
                height: 'toggle'
            }, 0)
            .find('figure.imgFrame')      // Find first image and make it category cover
            .first()
                .clone()
                .addClass('categoryCover')
                .find('figcaption')                 // Remove existing figcaption (only from clone)
                    .remove()
                    .end()
                .append(heading)
                .appendTo(gallery.find('div.galleryCategories'))
                .click(function(init) {
                    toggleCategory(category, $(this), init);
                });
        }
        
        /***************************
         * Close and open categories
         ***************************/
        function toggleCategory(category, that, init) {
            init = init || false;
            
            var h1,
                h2,
                duration = init === true ? 0 : options.categoryDuration; //Open category without animation duration on page-load.
            
            that.toggleClass('openCategory')    // Toggle openCategory class for category cover, remove from previously open
            .siblings('.openCategory')
                .removeClass('openCategory');   
            
            gallery.find('div.galleryCategory').animate({     // Fade out all categories
                opacity: 0
            }, gallery.find('div.galleryCategory.openCategory').length === 0 ? 0 : duration); // If nothing is open, don't wait for initial fadeout.
            
            // Check size of clicked (height animation duration = 0 if toggled categories are the same size)
            category.toggle(0, function() { 
                h1 = $(this).height();
                $(this).toggle(0, function () {
            
                    h2 = category.siblings('.openCategory').height();
                    
                    category.siblings('.openCategory')      // Close other open category.
                    .animate({
                        height: 'hide'
                    }, h1 === h2 ? 0 : duration)
                    .removeClass('openCategory');
                    
                    category.animate({      // Toggle clicked category (launched simultaneously as close).
                        height: 'toggle'
                    }, h1 === h2 ? 0 : duration, function () {
                        $(this).animate({opacity: 1}, duration);    // Fade in opened category
                        })
                    .toggleClass('openCategory'); 
                });
            });
        }
        
        /***************************
         * Display image
         ***************************/
        function displayImage (that, duration) {    // Duration only used to override options.duration on first image on page load
            var imgSrc = that.parent().is('a') ? that.parent().attr('href') : 
                    (that.children('a').has('img').length !== 0 ? that.children('a').has('img').first().attr('href') : that.children('img').first().attr('src'));
                    
            if (typeof duration === 'undefined' || duration === null) {
                duration = options.duration;
            }
            
            //Prevent animation from being interrupted by the next animation
            if(animate) {
                animate = false;
                
                var time = duration;
                
                console.log(imgSrc);
                
                $('<img>').attr('src', imgSrc)
                .load(function() {
                    var image = $('<figure>').append($(this));
                    gallery.find('div.currentImage').append(image);
                    image.fadeOut(0).fadeIn(time);
                    gallery.find('div.currentImage figure').first().addClass('absolute').fadeOut(time, function() {
                        $(this).remove();
                        animate = true;
                    });    
                });
            }
        }
        
        gallery = $(this);
        
        gallery.addClass('ath400gallery');
        
        // If gallery is divided into divs, make categories. Else single gallery        
        if (gallery.children('div').length !== 0) 
        {
            prepGalleryCategories(gallery);
        }
        else 
        {   
            gallery.wrapInner('<div>');
            prepGalleryItems(gallery.find('div').first());
        }
        
        // Open first category if options.openCategory is true
        if (options.openCategory) {
                gallery.find('.galleryCategories figure.imgFrame')
                    .first().trigger('click', true);
            }
        
        // If display is gallery, add div for display
        if (options.display === 'gallery') {
            gallery.prepend('<div class="currentImage"><figure><img alt="" /><figcaption></figcaption></figure></div>')
            .find('.thumbs figure.imgFrame')
                .first().trigger('click', 0);
        }
        
    };
    
    // Default options for ath400gallery
    $.fn.ath400gallery.defaults = {
        display: 'lightbox',
        shape: 'square',
        duration: 800,
        categoryDuration: null,
        navigation: true,
        openCategory: false,
    };
        
}) (jQuery);