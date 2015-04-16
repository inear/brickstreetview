'use strict';

exports.twitterUrl = twitterUrl;
exports.fbUrl = fbUrl;
exports.gplusUrl = gplusUrl;

function twitterUrl(url, message, imageUrl) {
  return 'https://twitter.com/intent/tweet' +
    '?original_referer=' + url +
    '&source=tweetbutton' +
    '&text=' + encodeURIComponent(message + ' ' + url + ' ' + imageUrl) +
    '&';
}

function gplusUrl(url) {
  return 'https://plus.google.com/share?url=' + url;
}

function fbUrl(url) {
  return 'http://www.facebook.com/sharer/sharer.php?u=' + url;
}
