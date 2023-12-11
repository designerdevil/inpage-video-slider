var yourNameSpace = window.yourNameSpace || {};
yourNameSpace.rm5player = yourNameSpace.rm5player || (function ($, window) {
    const self = {};
    let apiCallTriggered = false;
    self.apiArray = [];
    const VIDEOTYPE = {
        YOUTUBE: 'youtube',
        BRIGHTCOVE: 'brightcove',
        VIMEO: 'vimeo'
    };
    self.playerCarousel = $('.video-carousel');
    self.players = [];
    self.getNewRandomId = () => Math.floor(100 + Math.random() * 100) + '' + Math.floor(100 + Math.random() * 100);

    /** Capturing player information and triggering Initialization  */
    self.initPlayer = function (currentCarousel) {
        // Looping through on non init slider items
        $(currentCarousel).find('li:not(.initDone)').each(function (index) {
            const currentItem = $(this);
            const videoType = currentItem.data("videotype");
            const videoId = currentItem.data("videoid");

            const id = `${videoId}${self.getNewRandomId()}${index}`;
            let player;
            switch (videoType) {
                case VIDEOTYPE.YOUTUBE:
                    player = self.initYT(videoId, currentItem, id);
                    break;
                case VIDEOTYPE.BRIGHTCOVE:
                    player = self.initBC(currentItem, id);
                    break;
                case VIDEOTYPE.VIMEO:
                    player = self.initVIM(currentItem, id);
                    break;
            }
            // Flagging slider items after its initialized
            currentItem.addClass('initDone');
            self.players.push({ id, videoType, player });
        });
    }

    /** Initializing YOUTUBE player */
    self.initYT = function (videoId, currentItem, playerId) {
        const playerElement = $(currentItem).find('.videoPlayer')[0];
        return new YT.Player(playerElement, {
            videoId,
            events: {
                'onStateChange': (event) => {
                    if (event.data == YT.PlayerState.PLAYING) {
                        self.pauseVideos(playerId);
                    }
                }
            }
        });
    }

    /** Initializing Brightcove player */
    self.initBC = function (currentItem, playerId) {
        const playerElement = $(currentItem).find('video-js')[0];
        const options = {};
        const player = videojs(playerElement, options, function onPlayerReady() {
            this.on('play', function () {
                self.pauseVideos(playerId)
            });
        });
        return player;
    }

    /** Initializing Vimeo player */
    self.initVIM = function (currentItem, playerId) {
        const playerElement = $(currentItem).find('iframe')[0];
        if (typeof window.Vimeo !== 'undefined') {
            const player = new Vimeo.Player(playerElement);
            player.on('play', function () {
                self.pauseVideos(playerId)
            });
            return player;
        }
    }

    /** Pausing all available players */
    self.pauseVideos = function (playerId) {
        $.each(self.players, function (_, item) {
            if (item.id !== playerId) {
                switch (item.videoType) {
                    case VIDEOTYPE.YOUTUBE:
                        item.player.pauseVideo();
                        break;
                    case VIDEOTYPE.BRIGHTCOVE:
                        item.player.pause();
                        break;
                    case VIDEOTYPE.VIMEO:
                        item.player.pause();
                        break;
                }
            }
        })
    }

    /** Check API availability and trigger player initialization */
    self.checkAllApiAvailability = function (status, type) {
        if(status) self.apiArray.push(type);
        if(self.apiArray.length === Object.entries(VIDEOTYPE).length) {
            self.playerCarousel.each(function (_, slider) {
                self.initPlayer(slider);
            });
        }
    }

    /** Trigger Plugin initialization  */
    self.init = function () {
        // Fetch API once caraousel init is done
        self.playerCarousel.on('init', function (event, current) {
            if(!apiCallTriggered) {
                $.getScript('https://www.youtube.com/iframe_api', function (_, textStatus) {
                    self.checkAllApiAvailability(textStatus, VIDEOTYPE.YOUTUBE);
                });
                $.getScript('https://players.brightcove.net/1752604059001/default_default/index.min.js', function (_, textStatus) {
                    self.checkAllApiAvailability(textStatus, VIDEOTYPE.BRIGHTCOVE)
                });
                $.getScript('https://player.vimeo.com/api/player.js', function (_, textStatus) {
                    self.checkAllApiAvailability(textStatus, VIDEOTYPE.VIMEO)
                });
                apiCallTriggered = true;
            }
        });
        // Carousel init based on options passed
        const options = { infinite: true, slidesToShow: 3, slidesToScroll: 3 };
        self.playerCarousel.slick(options);
    }

    return self;
})(jQuery, window);

/** Initiating carousel on DOM ready */
$(document).ready(function () {
    yourNameSpace.rm5player.init();
});
