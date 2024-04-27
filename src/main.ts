import './style.css';

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  
  <div class="container">
    <div id="user1">Local</div>
    <div id="user2">Remote</div>
  </div>
  <div class="common">
    <textarea id="input" row="1"></textarea>
    <div id="textContainer"></div>
  </div>
`;

//エレメントの定義
const textArea = document.getElementById('textContainer')!;
const input = document.getElementById('input')! as HTMLTextAreaElement;
input.placeholder = '手動接続用の入力欄';

const user1Video = document.createElement('video');
const user2Video = document.createElement('video');
user1Video.autoplay = true;
user1Video.playsInline = true;
user2Video.autoplay = true;
user2Video.playsInline = true;

const createOfferButton = document.createElement('button');
const setAnswerButton = document.createElement('button');
const copyIceCandidateButton = document.createElement('button');
const createAnswerButton = document.createElement('button');
const setOfferButton = document.createElement('button');
const setIceCandidateButton = document.createElement('button');

createOfferButton.textContent = '① Offerを生成';
setAnswerButton.textContent = '④ Answerを登録';
copyIceCandidateButton.textContent = '⑤ ICE経路情報をコピー';
createAnswerButton.textContent = '③ Answerを生成';
setOfferButton.textContent = '② Offerを登録';
setIceCandidateButton.textContent = '⑥ ICE経路情報を登録';

document
  .getElementById('user1')!
  .append(
    user1Video,
    createOfferButton,
    setAnswerButton,
    copyIceCandidateButton,
  );
document
  .getElementById('user2')!
  .append(
    user2Video,
    setOfferButton,
    createAnswerButton,
    setIceCandidateButton,
  );

const user1Connection = new RTCPeerConnection();
const user2Connection = new RTCPeerConnection();

//mediaStreamを取得し、トラックをRTCPeerConnectionに登録
navigator.mediaDevices
  .getUserMedia({ audio: true, video: true })
  .then((stream) => {
    user1Video.srcObject = stream;
    //音声トラックとビデオトラックをRTCPeerConnectionに登録
    stream.getTracks().forEach((track) => {
      user1Connection.addTrack(track, stream);
      user2Connection.addTrack(track, stream);
    });
  });

// ===== user1 ===== //
//Offerを生成
createOfferButton.onclick = () => {
  //MediaStreamトラックを登録した後にSDPを生成
  user1Connection
    .createOffer()
    .then((offer) => user1Connection.setLocalDescription(offer))
    .then(() => {
      console.log(user1Connection.localDescription);
      navigator.clipboard
        .writeText(JSON.stringify(user1Connection.localDescription))
        .then(() => {
          console.log('offerをコピーしました。');
          textArea.innerHTML = 'クリップボードにコピーしました。';
        })
        .catch((e) => {
          console.log('Offerのコピーに失敗', e);
          textArea.innerHTML = JSON.stringify(user1Connection.localDescription);
        });
    });
};
//Answerを登録
setAnswerButton.onclick = () => {
  const answer = input.value;
  if (!answer) return;
  user1Connection.setRemoteDescription(JSON.parse(answer));
  console.log('Answer登録完了');
};

const candidates: RTCIceCandidate[] = [];
user1Connection.onicecandidate = (e) => {
  //setLocalDescriptionで発火するイベント
  if (!e.candidate) {
    // 自分(Sender) の ICE を出力する
    console.log(JSON.stringify(candidates));
    return;
  }
  candidates.push(e.candidate);
};

copyIceCandidateButton.onclick = () => {
  navigator.clipboard
    .writeText(JSON.stringify(candidates))
    .then(() => {
      console.log('経路情報をコピーしました');
      textArea.innerHTML = 'クリップボードにコピーしました。';
    })
    .catch((e) => {
      console.log('経路情報のコピーに失敗しました', e);
      textArea.innerHTML = JSON.stringify(candidates);
    });
};

user1Connection.ontrack = (e) => {
  const stream = e.streams[0];
  if (stream === undefined) {
    console.error('stream not found');
    throw new Error('');
  }
  user2Video.srcObject = stream;
};

// ===== user2 ===== //
createAnswerButton.onclick = () => {
  user2Connection
    .createAnswer()
    .then((answer) => user2Connection.setLocalDescription(answer))
    .then(() => {
      console.log(JSON.stringify(user2Connection.localDescription));
      navigator.clipboard
        .writeText(JSON.stringify(user2Connection.localDescription))
        .then(() => {
          console.log('Answerをコピーしました。');
          textArea.innerHTML = 'クリップボードにコピーしました。';
        })
        .catch((e) => {
          console.log('Answerのコピーに失敗', e);
          textArea.innerHTML = JSON.stringify(user2Connection.localDescription);
        });
    });
};
setOfferButton.onclick = () => {
  const offer = input.value;
  console.log(offer);
  if (!offer) return;
  user2Connection.setRemoteDescription(JSON.parse(offer)).catch((e) => {
    console.log(e);
  });
  console.log('Offer登録完了');
};

setIceCandidateButton.onclick = () => {
  const candidatesStr = input.value;
  if (!candidatesStr) return;
  const senderCandidates = JSON.parse(candidatesStr);
  senderCandidates.forEach((candidate: RTCIceCandidate) => {
    if (candidate === null) return;
    user2Connection.addIceCandidate(candidate).catch((e) => {
      console.error('Sender addIceCandidate error', e);
    });
  });
};

user2Connection.ontrack = (e) => {
  const stream = e.streams[0];
  if (stream === undefined) {
    console.error('stream not found');
    throw new Error('');
  }
  user2Video.srcObject = stream;
};
