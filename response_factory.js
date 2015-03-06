
var rhyme = require('rhyme-plus');

var ResponseFactory = function() {

    var getResponse = function(responseKey) {
        switch(responseKey) {
            case 'rhyme':
                return rhymeResponse;
            break;
            case 'missy':
                return elliottResponse;
            break;
            case 'echo':
                return echoResponse;
            break;
            default:
                return nullResponse;
        }
    }

    var rhymeResponse = function(deferred, messageWords) {

        var message = '';

        // this lib uses a callback
        rhyme(function (r) {

            // make this a little configurable
            var syllablePlaceholder = 'blah';

            // pop the last word to get a rhyming match (we'll have some fun with the rest)
            // not worried about changing the array of words since we're in a case statement
            var lastWord = messageWords.pop();

            // figure out how many syllables are left
            var remainingMessageSyllables = 0;
            // count is used in the loop below, count of syllables per word
            var count = 0;
            // loop over the words, and keep adding the count of syllables to the total
            for ( var j=0; j < messageWords.length; j++) {
                // get the number of syllables in each word
                count = r.syllables(messageWords[j]);
                if ( !!count ) {
                    remainingMessageSyllables += count;                        
                }
            }

            // get an array of rhymes for the last word
            var rhymes = r.rhyme(lastWord);
            var numRhymes = rhymes.length;

            // gotta account for "orange"
            if ( !!numRhymes ) {
                // add a "blah" for each syllable (can be customized in plugin config)
                for ( var i=0; i < remainingMessageSyllables; i++) {
                    message = syllablePlaceholder + ' ' + message;
                }
                // let's grab a random rhyming word from the array
                var randomSelection = Math.floor((Math.random() * (numRhymes - 1)));
                // and finally put a random rhyme after the blahs,
                // and low case it since for some reason the rhyme lib is LOUD...
                message = message + rhymes[randomSelection].toLowerCase();
                // resolve our promise with the message string
                deferred.resolve(message);
            } else {
                // if there is no rhyme for the last word, we'll punt
                message = 'No soup for you!';
                // resolve our promise with the message string
                deferred.resolve(message);
            }
        });

    }

    var elliottResponse = function(deferred, messageWords) {
        // I put my thing down, flip it, and reverse it...
        // ...ti esrever dna ,ti pilf ,nwod gniht ym tup I
        var message = messageWords.join(' ').split('').reverse().join('');
        deferred.resolve(message);
    }

    var echoResponse = function(deferred, messageWords) {
        // get the number of chars
        // set a number of echos relative to that
        // create n message strings
        // replace more and more chars with empty spaces (using random position in the array)
        // send it all back as a multiline message
        var message = '';
        var messageChars = messageWords.join(' ').split('');
        var numChars = messageChars.length
        var numEchoes = Math.floor(messageChars.length / 5);
        var damagePerLoop = Math.floor(numChars / 4);
        // first line in the response has no damage
        var message = messageChars.join('');
        var randomCharIdx = 0;
        // repeat the message numEchoes times
        for ( var k = 0; k <= numEchoes; k++ ) {
            for ( var l = 0; l <= damagePerLoop; l++ ) {
                // gete a random number
                randomCharIdx = Math.floor((Math.random() * (numChars - 1)));
                // replace a random char with a space
                messageChars[randomCharIdx] = '_';
            }
            var message = message + '\n' + messageChars.join('');
        }
        deferred.resolve(message);
    }

    var nullResponse = function(deferred, messageWords) {
        // resolve with an empty string, should do nothing
        deferred.resolve('');
    }

    return {
        getResponse: getResponse
    }

}

module.exports = ResponseFactory;
