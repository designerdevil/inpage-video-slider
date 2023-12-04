var yourNameSpace = window.yourNameSpace || {};
yourNameSpace.rm5player = yourNameSpace.rm5player || (function ($, window, document) {
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
    self.getRandomId = () => Math.floor(100000 + Math.random() * 900000);
    self.initPlayer = function (currentCarousel) {
        $(currentCarousel).find('li:not(.initDone)').each(function (index) {
            const currentItem = $(this);
            const videoType = currentItem.data("videotype");
            const videoId = currentItem.data("videoid");

            const id = `${videoId}${self.getRandomId()}${index}`;
            let player;
            switch (videoType) {
                case VIDEOTYPE.YOUTUBE:
                    player = self.initYT(videoId, currentItem, videoType, id);
                    break;
                case VIDEOTYPE.BRIGHTCOVE:
                    player = self.initBC(currentItem, videoType, id);
                    break;
                case VIDEOTYPE.VIMEO:
                    player = self.initVIM(currentItem, videoType, id);
                    break;
            }
            // Flagging when initialized
            currentItem.addClass('initDone');
            self.players.push({ id, videoType, player });
        });
    }

    self.initYT = function (videoId, currentItem, videoType, playerId) {
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

    self.initBC = function (currentItem, videoType, playerId) {
        const playerElement = $(currentItem).find('video-js')[0];
        const options = {};
        const player = videojs(playerElement, options, function onPlayerReady() {
            this.on('play', function () {
                self.pauseVideos(playerId)
            });
        });
        return player;
    }

    self.initVIM = function (currentItem, videoType, playerId) {
        const playerElement = $(currentItem).find('iframe')[0];
        if (typeof window.Vimeo !== 'undefined') {
            const player = new Vimeo.Player(playerElement);
            player.on('play', function () {
                self.pauseVideos(playerId)
            });
            return player;
        }
    }

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

    self.triggerPlayers = function() {
        self.playerCarousel.each(function (_, slider) {
            self.initPlayer(slider);
        });
    }

    self.checkAvailability = function (status, type, slider) {
        if(status) self.apiArray.push(type);
        if(self.apiArray.length === Object.entries(VIDEOTYPE).length) {
            self.triggerPlayers();
        }
    }

    self.init = function () {
        self.playerCarousel.on('init', function (event, current) {
            if(!apiCallTriggered) {
                $.getScript('https://www.youtube.com/iframe_api', function (_, textStatus) {
                    self.checkAvailability(textStatus, VIDEOTYPE.YOUTUBE);
                });
                $.getScript('https://players.brightcove.net/1752604059001/default_default/index.min.js', function (_, textStatus) {
                    self.checkAvailability(textStatus, VIDEOTYPE.BRIGHTCOVE)
                });
                $.getScript('https://player.vimeo.com/api/player.js', function (_, textStatus) {
                    self.checkAvailability(textStatus, VIDEOTYPE.VIMEO)
                });
                apiCallTriggered = true;
            }
        });
        self.playerCarousel.slick({ infinite: true, slidesToShow: 3, slidesToScroll: 3 });
    }

    return self;
})(jQuery, window, document);

/**
 * Initiating carousel and loading YT script
 */
$(document).ready(function () {
    yourNameSpace.rm5player.init();
});