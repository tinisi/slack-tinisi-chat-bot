
// A super simple bot what does some rhyming and other tricks...
// Started from the example script in the node-slack-client project.

var Slack = require('slack-client');
var rhyme = require('rhyme-plus');
var Q = require('q');
var config = require('./config.js');

// get the token from config
var token = config.token;

// other args for the Slack class
var autoReconnect = true,
    autoMark = true;

// make a new slack client
var slack = new Slack(token, autoReconnect, autoMark);

// the main method that responds to incoming messages
var respondToText = function(channel, text) {

    // get the words into an array for easier manipulation
    var messageWords = text.split(' ');

    // we'll only respond if there is a command in the first word,
    // so may as well remove it from messareWords array
    var firstMessageWord = messageWords.shift();

    // use the helper to get a possible command, someone might have typed a : by mistake
    var possibleCommand = getCommand(firstMessageWord);

    // if there is a :command, use it to pick an action
    if ( possibleCommand ) {

        // since some of our responses are asyncronous,
        // using a promise to simplify the code
        var deferred = Q.defer();
        var message = '';
        
        switch(possibleCommand) {
            case 'rhyme':
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
                break;
            case 'missy':
                // I put my thing down, flip it, and reverse it...
                // ...ti esrever dna ,ti pilf ,nwod gniht ym tup I
                message = messageWords.join(' ').split('').reverse().join('');
                deferred.resolve(message);
                break;
            case 'echo':
                // get the number of chars
                // set a number of echos relative to that
                // create n message strings
                // replace more and more chars with empty spaces (using random position in the array)
                // send it all back as a multiline message
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
                break;
            default:
                // do nothing       
        }

        // when the promise is resolved, send a reply message
        deferred.promise.then(function (message) {
            sendMessage(channel, message);
            console.log('tinisi-chat-bot sending...');
        });
    }
}

// little private helper to extract a command from the message text
var getCommand = function(text) {
    var possibleCommand = '';
    // all our commands begin with :
    if ( text.charAt(0) == ':' ) {
        possibleCommand = text.substr(1);
    }
    return possibleCommand;
}

// another little helper that actually sends the message and outputs to console
var sendMessage = function(channel, message) {
    channel.send(message);
    console.log('@%s responded with "%s"', slack.self.name, message);
}

// This handler is just for debugging, the "open" event
// happens when the socket is opened
slack.on('open', function() {

    var channels = [],
        groups = [],
        unreads = slack.getUnreadCount(),
        key;

    for (key in slack.channels) {
        if (slack.channels[key].is_member) {
            channels.push('#' + slack.channels[key].name);
        }
    }

    for (key in slack.groups) {
        if (slack.groups[key].is_open && !slack.groups[key].is_archived) {
            groups.push(slack.groups[key].name);
        }
    }

    console.log('Welcome to Slack. You are @%s of %s', slack.self.name, slack.team.name);
    console.log('You are in: %s', channels.join(', '));
    console.log('As well as: %s', groups.join(', '));
    console.log('You have %s unread ' + (unreads === 1 ? 'message' : 'messages'), unreads);
});

// this is the main event we'll use to listen and respond to messages
slack.on('message', function(message) {

    var type = message.type,
        channel = slack.getChannelGroupOrDMByID(message.channel),
        user = slack.getUserByID(message.user),
        time = message.ts,
        text = message.text,
        response = '';

    console.log('Received: %s %s @%s %s "%s"', type, (channel.is_channel ? '#' : '') + channel.name, user.name, time, text);

    // Respond to messages with logic in respondToText()
    if (type === 'message') {
        respondToText(channel, text);
    }

});

// and some way to output errors
slack.on('error', function(error) {
    console.error('Error: %s', error);
});

// log the bot in to our instance
slack.login();
