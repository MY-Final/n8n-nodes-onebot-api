# n8n-nodes-onebot-api

This is an n8n community node. It lets you use OneBot v11 in your n8n workflows.

The [OneBot standard](https://11.onebot.dev) is a universal chatbot application interface standard modified from the CQHTTP plug-in interface of the original CKYU platform.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/reference/license/) workflow automation platform.

[Installation](#installation)  
[Operations](#operations)  
[Credentials](#credentials)  <!-- delete if no auth needed -->  
[Compatibility](#compatibility)  
[Usage](#usage)  <!-- delete if not using this section -->  
[Resources](#resources)  

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

## Operations

### Bot
- Get login info

### Friend
- Get friend list
- Get stranger info
- Send like
- Send poke

### Group
- Get group info
- Get group list
- Get group member info
- Get group member list
- Kick user
- Leave group
- Mute all
- Mute user
- Send poke
- Group sign
- Set group admin
- Send Group Sign

### Message
- Send private message
- Send group message
- Forward message mode (for multiple messages)

### Relationship
- Delete friend
- Temporary block user (when deleting friend)
- Both-side delete (when deleting friend from both lists)

### Other
- Get status
- Get version info

## Credentials

Requires an access token for authenticating with the OneBot API.

## Compatibility

go-cqhttp v1.1.0
napcat

## Usage

This node provides a user-friendly interface to interact with OneBot API endpoints. Simply:
1. Configure your credentials with the OneBot API access token
2. Select the desired resource and operation
3. Fill in the required parameters
4. Run your workflow

For detailed usage instructions and examples, refer to the [n8n community nodes documentation](https://docs.n8n.io/integrations/community-nodes/).

## Resources

* [n8n community nodes documentation](https://docs.n8n.io/integrations/community-nodes/)
* [OneBot v11](https://11.onebot.dev/)
* [go-cqhttp](https://docs.go-cqhttp.org/)
