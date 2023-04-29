let socket;
const SERVER_URL = "ws://some.domain"; // SET YOUR BACKEND URL HERE

const syncTemplate = `
	<article id="sync-wrapper">
		<h1>VLC Remote Control Panel</h1>
		<div id="indicators">
			<div id="indicator">disconnected</div>
			<div id="room-count"><span></span> person in the room</div>
		</div>
		<div id="connect-wrapper">
		Enter room name: <input id="room" />
		<button id="connect">Connect</button>
		</div>
		<div id="remote-control">
			<button id="rewind">Jump to start</button>
			<button id="run-stop">Play | Pause</button>
		</div>
	</article>
`;

function initServerConnection(roomName) {
	socket = new WebSocket(SERVER_URL);

	socket.onopen = function (e) {
		switchToRemoteMode();

		const payload = JSON.stringify({room: roomName});
		socket.send(payload);
	};

	socket.onmessage = function (event) {
		if (event.data) {
			const payload = JSON.parse(event.data);

			if (payload.action === 'rewind') {
				vlcAction('rewind');
			}
			if (payload.action === 'run-stop') {
				vlcAction('run-stop');
			}
			if (payload.roomCount) {
				setRoomCount(payload.roomCount);
			}
		}
	};

	socket.onclose = function (event) {
		displayDisconnect();
	};

	socket.onerror = function (error) {
		console.log(`[error] ${error.message}`);
		displayDisconnect();
	};
}

function getRoomName() {
	return document.querySelector('#room').value;
}

function setRoomCount(count) {
	const roomWrapper = document.querySelector('#room-count');
	roomWrapper.style.display = 'inline-block';

	const counter = roomWrapper.querySelector('span');
	counter.innerText = count;
}

function displayDisconnect() {
	indicator.classList.remove('online');
	indicator.innerText = 'disconnected';
}

function switchToRemoteMode() {
	const indicator = document.querySelector('#indicator');
	indicator.classList.add('online');
	indicator.innerText = 'connected';

	const remoteWrapper = document.querySelector('#remote-control');
	const connectWrapper = document.querySelector('#connect-wrapper');
	remoteWrapper.style.display = 'block';
	connectWrapper.style.display = 'none';
}

function sendRewindCommand(room) {
	const message = {
		room,
		action: 'rewind',
	};
	const payload = JSON.stringify(message);
	socket.send(payload);
}

function sendRunStopCommand(room) {
	const message = {
		room,
		action: 'run-stop',
	};
	const payload = JSON.stringify(message);
	socket.send(payload);
}

function vlcAction(action) {
	if (action === 'rewind') {
		fetch('/requests/status.xml?command=seek&val=0%25');
	}

	if (action === 'run-stop') {
		fetch('/requests/status.xml?command=pl_pause');
	}
}

chrome.extension.sendMessage({}, function () {
	console.log("LOFASZ");
	var readyStateCheckInterval = setInterval(function () {
		if (document.readyState === "complete") {
			clearInterval(readyStateCheckInterval);

			const syncWrapper = document.createElement('div');
			syncWrapper.innerHTML = syncTemplate;
			document.body.appendChild(syncWrapper);

			const connect = document.querySelector('#connect');
			connect.addEventListener('click', () => {
				const room = getRoomName();
				if (!room) {
					alert('Please enter a room name. Prefer longer room names so others won\'t join your room by chance.')
				} else {
					initServerConnection(room);
				}
			});

			const playFromStart = document.querySelector('#rewind');
			playFromStart.addEventListener('click', () => {
				const room = getRoomName();
				sendRewindCommand(room);
			});

			const runStopButton = document.querySelector('#run-stop');
			runStopButton.addEventListener('click', () => {
				const room = getRoomName();
				sendRunStopCommand(room);
			});
		}
	}, 10);
});
