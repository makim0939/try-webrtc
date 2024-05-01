//要素の取得
const textContainer = document.getElementById('textContainer')!;
const input = document.getElementById('input')! as HTMLTextAreaElement;
input.placeholder = '手動接続用の入力欄';

const localVideo = document.getElementById('localVideo') as HTMLVideoElement;
const remoteVideo = document.getElementById('remoteVideo') as HTMLVideoElement;

const createOfferButton = document.getElementById('createOfferButton') as HTMLButtonElement;
const setAnswerButton = document.getElementById('setAnswerButton') as HTMLButtonElement;
const copyIceCandidateButton = document.getElementById('copyIceCandidateButton') as HTMLButtonElement;
const createAnswerButton = document.getElementById('createAnswerButton') as HTMLButtonElement;
const setOfferButton = document.getElementById('setOfferButton') as HTMLButtonElement;
const setIceCandidateButton = document.getElementById('setIceCandidateButton') as HTMLButtonElement;

const user1Connection = new RTCPeerConnection();
const user2Connection = new RTCPeerConnection();

navigator.mediaDevices.getUserMedia({ audio: true, video: true }).then((stream) => {
  localVideo.srcObject = stream;
  stream.getTracks().forEach((track) => {
    user1Connection.addTrack(track, stream);
    user2Connection.addTrack(track, stream);
  });
});

const copyToClipboard = (data: string, message: { success: string; fail: string }) => {
  navigator.clipboard
    .writeText(data)
    .then(() => (textContainer.innerHTML = message.success))
    .catch((e) => (textContainer.innerHTML = message.fail + data));
};

createOfferButton.onclick = () => {
  //Offerを生成
  user1Connection
    .createOffer()
    .then((offer) => user1Connection.setLocalDescription(offer))
    .then(() => {
      console.log(user1Connection.localDescription);
      copyToClipboard(JSON.stringify(user1Connection.localDescription), {
        success:
          'SDP Offerをクリップボードにコピーしました。\nもう1つウィンドウで入力欄に貼り付け「② Offerを登録」を押してください。',
        fail: '● 以下の文字列をコピーし、もう1つウィンドウで入力欄に貼り付け「② Offerを登録」を押してください。\n\n',
      });
    });
};

setAnswerButton.onclick = async () => {
  //Answerを登録
  const answer = input.value;
  try {
    await user1Connection.setRemoteDescription(JSON.parse(answer)).then(() => {
      textContainer.innerHTML = 'Answerを登録しました。';
    });
  } catch (e) {
    textContainer.innerHTML =
      'Answerの登録に失敗しました。\n正しくSDP Answerがコピー・ペーストできているか確認してください。';
  }
};

const candidates: RTCIceCandidate[] = [];
user1Connection.onicecandidate = (e) => e.candidate && candidates.push(e.candidate);

copyIceCandidateButton.onclick = () => {
  copyToClipboard(JSON.stringify(candidates), {
    success:
      'ICE Candidateをクリップボードにコピーしました。\nもう1つウィンドウで入力欄に貼り付け「⑥ ICE経路情報を登録」を押してください。',
    fail: '● 以下の文字列をコピーし、もう1つウィンドウで入力欄に貼り付け「⑥ ICE経路情報を登録」を押してください。\n\n',
  });
};

user1Connection.ontrack = (e) => (remoteVideo.srcObject = e.streams[0]);

createAnswerButton.onclick = async () => {
  try {
    await user2Connection
      .createAnswer()
      .then((answer) => user2Connection.setLocalDescription(answer))
      .then(() => {
        console.log(user2Connection.localDescription);
        copyToClipboard(JSON.stringify(user2Connection.localDescription), {
          success:
            'SDP Answerをクリップボードにコピーしました。\nもう1つウィンドウで入力欄に貼り付け「④ Answerを登録」を押してください。',
          fail: '● 以下の文字列をコピーし、もう1つウィンドウで入力欄に貼り付け「④ Answerを登録」を押してください。\n\n',
        });
      });
  } catch (e) {
    console.error(e);
    textContainer.innerHTML = 'Answerの生成に失敗しました。\n正しくOfferが登録できているか確認してください。';
  }
};

setOfferButton.onclick = async () => {
  //Offerを登録
  const offer = input.value;
  try {
    await user2Connection.setRemoteDescription(JSON.parse(offer)).then(() => {
      textContainer.innerHTML = 'Offerを登録しました。';
    });
  } catch (e) {
    textContainer.innerHTML =
      'Offerの登録に失敗しました。\n正しくSDP Offerがコピー・ペーストできているか確認してください。';
  }
};

setIceCandidateButton.onclick = () => {
  //ICE Candidatesを登録
  const candidatesStr = input.value;
  try {
    const senderCandidates = JSON.parse(candidatesStr);
    senderCandidates.forEach(async (candidate: RTCIceCandidate) => {
      if (candidate === null) return;
      await user2Connection.addIceCandidate(candidate);
    });
    textContainer.innerHTML = 'ICE経路情報を登録しました。';
  } catch (e) {
    textContainer.innerHTML =
      'ICE経路情報の登録に失敗しました。\n正しくICE経路情報がコピー・ペーストできているか確認してください。';
  }
};

user2Connection.ontrack = (e) => (remoteVideo.srcObject = e.streams[0]);
