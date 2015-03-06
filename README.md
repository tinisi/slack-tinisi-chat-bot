# slack-tinisi-chat-bot

A simple slack chat-bot.

I have three tricks.

I respond to :missy, :echo or :rhyme followed by a phrase...

## To integrate this into your Slack instance

* Go to "Configure Integrations"
* Scroll down to "Bots"
* Give it a catchy name
* Grab the API Token
* Paste it into config.js
* Run it with node ./

## Super punk rock daemon mode:

nohup node ./ > ./bot.log 2>&1 &
