
const socket = io();

const clientsTotal = document.getElementById('client-total');
const messageContainer = document.getElementById('message-container');
const nameInput = document.getElementById('name-input');
const messageForm = document.getElementById('message-form');
const messageInput = document.getElementById('message-input');

let loadingOldMessages = false;
let allMessagesLoaded = false; 
let loadedMessageIds = new Set(); 

messageForm.addEventListener('submit', (e) => {
    e.preventDefault();
    sendMessage();
});

socket.on('clients-total', (data) => {
    clientsTotal.innerText = `Total Clients: ${data}`;
});

function sendMessage() {
    const data = {
        id: Date.now(), 
        name: nameInput.value,
        message: messageInput.value,
        dateTime: new Date()
    };

    socket.emit('message', data);
    addMessageToUI(true, data);
    messageInput.value = '';
}

socket.on('chat-message', (data) => {
    addMessageToUI(false, data);
});

function addMessageToUI(isOwnMessage, data) {
    clearFeedback()
    if (loadedMessageIds.has(data.id)) {
        return; 
    }
    
    loadedMessageIds.add(data.id);
    
    const messageElement = document.createElement('li');
    messageElement.classList.add(isOwnMessage ? 'message-right' : 'message-left');

    const messageContent = `
        <p class="message">
            ${data.message}
            <span>${data.name} &#9898 ${moment(data.dateTime).fromNow()}</span> 
        </p>
    `;

    messageElement.innerHTML = messageContent;
    messageContainer.appendChild(messageElement);
    scrollToBottom();
}

function scrollToBottom() {
    console.log("Scrolling to bottom", messageContainer.scrollHeight);
    messageContainer.scrollTop = messageContainer.scrollHeight;
}

messageContainer.addEventListener('scroll', () => {
    if (messageContainer.scrollTop === 0 && !loadingOldMessages && !allMessagesLoaded) {
        loadOldMessages();
    }
});

function loadOldMessages() {
    loadingOldMessages = true;
    const currentHeight = messageContainer.scrollHeight;

    socket.emit('load-old-messages', (oldMessages) => {
        if (oldMessages.length === 0) {
            allMessagesLoaded = true; 
        }

        oldMessages.forEach(message => {
            if (loadedMessageIds.has(message.id)) {
                return; 
            }
            
            loadedMessageIds.add(message.id); 

            const messageElement = document.createElement('li');
            messageElement.classList.add(message.isOwnMessage ? 'message-right' : 'message-left');

            const messageContent = `
                <p class="message">
                    ${message.message}
                    <span>${message.name} &#9898 ${moment(message.dateTime).fromNow()}</span> 
                </p>
            `;

            messageElement.innerHTML = messageContent;
            messageContainer.insertBefore(messageElement, messageContainer.firstChild);
        });

        
        messageContainer.scrollTop = messageContainer.scrollHeight - currentHeight;
        loadingOldMessages = false;
    });
}

messageInput.addEventListener('focus', (e)=>{
   socket.emit('feedback',{
    feedback: `${nameInput.value} is typing a message...`
   })
})

messageInput.addEventListener('keypress', (e)=> {
    socket.emit('feedback',{
        feedback: `${nameInput.value} is typing a message...`
       })
})
messageInput.addEventListener('blur', (e)=>{
    socket.emit('feedback',{
        feedback: ``,
       })
})

socket.on('feedback', (data)=>{
    clearFeedback()
    const element = `
            <li class="message-feedback">
                
                <p class="feedback" id="feedback">
                &#9997 ${data.feedback}
                </p>
            </li>
    `

    messageContainer.innerHTML += element
})

function clearFeedback(){
    document.querySelectorAll('li.message-feedback').forEach(element=>{
        element.parentNode.removeChild(element)
    })
}
