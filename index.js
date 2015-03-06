
// A super simple bot what does some rhyming and other tricks...
// Started from the example script in the node-slack-client project.

var Slack = require('slack-client');
var Q = require('q');
var config = require('./config.js');
var ResponseFactory = require('./response_factory.js');
// make an instance to be re-used whenever a message comes in
var responseFactory = ResponseFactory();

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
        
        // use the response factory and pass the response method
        // a promise and and array of words to work with
        responseFactory.getResponse(possibleCommand)(deferred, messageWords);

        // when the promise is resolved, send a reply message
        deferred.promise.then(function (message) {
            // if message is anything other than an empty string, send a message
            if ( message !== '' ) {
                sendMessage(channel, message);
                console.log('tinisi-chat-bot sending...');
            }
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
