<template>
  <section>
     <div class="wrap"> 
    <div class="top-background">
      <div class="container">
        
          <h1>Buchicha!</h1>
          <p>Buchicha!は匿名の人とチャットすることができるサービスです。</p>
          <p>ルームを作成してリンクを共有すると、みんなはあなたと匿名でチャットすることができます。</p>
          <p>ルームは6時間で誰もアクセス出来なくなります。</p>
        
      </div>
    </div>
    <!-- <img width="100%" src="https://firebasestorage.googleapis.com/v0/b/my-chat-20efc.appspot.com/o/IMG_1704.JPG?alt=media&token=db9446a1-fa42-47af-81df-034bcc3bfdba"> -->
    <div v-if="authPending">
      <img style="margin: 0 auto;" src="https://loading.io/spinners/palette-ring/index.svg">
    </div>
    <div v-if="creator">
      {{creator.name}}に匿名でチャットしますか？
      <button type="button" @click="createChat">チャットする</button>
    </div>
    <div v-if="user">
      <a
        :href="'https://twitter.com/intent/tweet?text=だれか匿名でお話ししてくれませんか？送る側だけ匿名のチャット、Buchicha!をしよう！%20%23匿名チャット%20%23Buchicha&url=' + encodeURIComponent(
        `https://${window.location.host}/?creatorUid=${user.uid}`)"
      >あなたのリンクをTwitterで共有する</a>
      <div v-for="{uid,creatorName,expireAt,isCreator} in chats">
        <a :href="`./?chatUid=${uid}&expireAt=${expireAt}`">
          {{isCreator ? '匿名':creatorName}}さんとのチャット
          あと{{computeDate(expireAt).slice(0,computeDate(expireAt).length-1)}}
        </a>
      </div>
    </div>
    <div class="description">
      <!-- <p>Buchichaは匿名の人とチャットすることができるサービスです。</p>
      <p>ルームを作成してリンクを共有すると、みんなはあなたと匿名でチャットすることができます。</p>
      <p>ルームは6時間で誰もアクセス出来なくなります。</p> -->
      <button type="button" @click="clickHandler"><span class="fa fa-twitter"></span>Twitterではじめる</button>
      <p>匿名のチャットを募集して、匿名のチャットをしましょう！</p>
    </div>
      <img class="sample-image" src="https://firebasestorage.googleapis.com/v0/b/my-chat-20efc.appspot.com/o/%E3%82%B9%E3%82%AF%E3%83%AA%E3%83%BC%E3%83%B3%E3%82%B7%E3%83%A7%E3%83%83%E3%83%88%202020-01-16%2013.46.43.png?alt=media&token=4ec693be-cfe2-4943-b307-41118b509631">
    <!-- <button type="button" @click="clickHandler"><span class="fa fa-twitter"></span>Twitterではじめる</button> -->

      <footer>
      <div class="container">
        <img src="https://firebasestorage.googleapis.com/v0/b/my-chat-20efc.appspot.com/o/IMG_8795.png?alt=media&token=0e4ae5f9-25bc-4173-b506-0748e989cebe" alt="" />
        <p>Enjoy chat with Buchicha!.</p>
      </div>
    </footer>
    <!-- /.wrap --> </div> 
  </section>
</template>

<script>
import $ from "jquery";
import firebase from "firebase";
import "moment/locale/ja";

import moment from "moment";
// import 'moment/locale/ja'

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
}

export default {
  name: "TheRoot",
  props: ["chats", "user", "authPending", "clickHandler"],
  data() {
    return {
      creator: null,
      window: {}
    };
  },
  computed: {
    chatData: () => {
      this.chats.map(chat => {
        return { uid: Object.keys(chat)[0], ...Object.values(chat) };
      });
    }
  },
  created: async function() {
    this.window = window
    const url = new URL(location.href);
    const creatorUid = url.searchParams.get("creatorUid"); // "/ca
    if (creatorUid) {
      const creatorSnap = await firebase
        .database()
        .ref("users/" + creatorUid)
        .once("value");
      this.creator = creatorSnap.val();

      this.creator.uid = creatorUid;
    }
    const refChats = firebase.database().ref("chats");
    refChats.on("child_added", snap => {
      // if (!this.user.chats) {
      //   return
      // }
      // const newChat = snap.val()
      // if (this.user.chats[snap.key] === 'creator') {
      //   this.chats.creator.push(newChat)
      // } else if (this.user.chats[snap.key] === 'guest') {
      //   this.chats.guest.push(newChat)
      // }
    });
  },
  methods: {
    createChat: async function() {
      if (!this.user) {
        alert("Twitterログインが必要です(名前は相手には分かりません)");
        return;
      }
      if (!(this.user && this.creator)) {
        return;
      }
      const refChats = firebase.database().ref("chats");
      const expireAt = Date.now() + 1000 * 60 * 60 * 6;
      const chatUid = refChats.push().getKey();
      const refUser = firebase.database().ref("users");
      const updateObj = {};
      updateObj["name"] = this.user.displayName;
      updateObj["chats/" + chatUid] = "guest";
      refUser.child(this.user.uid).update(updateObj);
      await refChats
        .child(chatUid)
        .set({ creatorName: this.creator.name, expireAt });
      delete updateObj.name;
      updateObj["chats/" + chatUid] = "creator";
      await refUser.child(this.creator.uid).update(updateObj);
      const refMembers = await firebase
        .database()
        .ref("members/" + chatUid)
        .set({ [this.user.uid]: "guest", [this.creator.uid]: "creator" });
      await firebase
        .database()
        .ref("messages/" + chatUid)
        .push({
          image:
            "https://firebasestorage.googleapis.com/v0/b/necocha-io.appspot.com/o/animal_mark04_neko.png?alt=media&token=ba4e9920-bf1f-45ea-a3e6-0a34e3a85b21",
          message: "こんにちは！匿名さんが入室しました！By運営",
          isFromGuest: true
        });
      return (location = `/?chatUid=${chatUid}&expireAt=${expireAt}`);
    },
    computeDate(timestamp) {
      return moment(timestamp).fromNow();
    }
  }
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
section {
  /* max-width: 500px; */
  margin: 0 auto;
  text-align: center;
}
.container{
  width: 100%;
  margin-left: 20px;
  /* padding: 0 15px;
  margin: 0; */
}
.top-background {
  background-image: url("https://firebasestorage.googleapis.com/v0/b/my-chat-20efc.appspot.com/o/JPEG%E3%82%A4%E3%83%A1%E3%83%BC%E3%82%B7%E3%82%99-2396D624F1D8-1.jpeg?alt=media&token=9f8f7882-7261-4e91-8e0d-ebdddf6bbdc9");
  background-size: cover;
  color:rgba(255, 255, 255, 0.9);
  padding: 230px 0 230px 0;
  text-align: center;
  margin-bottom: 50px;
}
.top-background h1 {
  font-size: 47px;
  letter-spacing: 15px;
}
.description {
  margin-top: 10px;
  line-height: 30px;
  padding: 0 50px;
  margin-bottom: 50px;
}

.description button {
  padding: 8px 24px;
  color: white;
  display: inline-block;
  opacity: 0.8;
  border-radius: 4px;
  background-color: #55acee;
}
.description button:hover {
  opacity: 1;
}

button {
  border: none;
  border-radius: 2px;
  margin: 10px 0;
  color: white;
  font-size: 20px;
  background-color: #3ab383;
}
p {
  margin-bottom: 5px;
}
.ribbon11 {  
  margin-bottom: 30px;
  display: inline-block;
  position: relative;
  height: 45px;
  vertical-align: middle;
  text-align: center;
  box-sizing: border-box;
}
.ribbon11:before {
  /*左側のリボン端*/
  content: "";
  position: absolute;
  width: 10px;
  bottom: -10px;
  left: -35px;
  z-index: -2;
  border: 20px solid #6cbf86;
  border-left-color: transparent; /*山形に切り抜き*/
}

.ribbon11:after {
  /*右側のリボン端*/
  content: "";
  position: absolute;
  width: 10px;
  bottom: -10px;
  right: -35px;
  z-index: -2;
  border: 20px solid #6cbf86;
  border-right-color: transparent; /*山形に切り抜き*/
}

.ribbon11 h3 {
  display: inline-block;
  position: relative;
  margin: 0;
  padding: 0 20px;
  line-height: 45px;
  font-size: 15px;
  color: #fff;
  background: #42bc8e; /*真ん中の背景色*/
}
.ribbon11 h3:before {
  position: absolute;
  content: "";
  top: 100%;
  left: 0;
  border: none;
  border-bottom: solid 10px transparent;
  border-right: solid 15px #318c69; /*左の折り返し部分*/
}
.ribbon11 h3:after {
  position: absolute;
  content: "";
  top: 100%;
  right: 0;
  border: none;
  border-bottom: solid 10px transparent;
  border-left: solid 15px #318c69; /*右の折り返し部分*/
}
footer img {
width: 125px;
}
footer p {
  color: #b3aeb5;
  font-size: 12px;
}
footer {
  padding-top: 20px;
  padding-bottom: 10px;
  text-align: left;
  background-color: rgba(122, 122, 122, 0.8);
}
.sample-image {
  width: 300px;
  margin-bottom: 50px;
}
.wrap {
	overflow: hidden;
} 

@media only screen and (max-device-width : 480px) {
/* スマートフォンだけ以下を適用 */
  img { 
      width:100%;
  }
  footer img {
    width: 90px;
  }
  footer p {
    font-size: 8px;
  }
  .top-background h1 {
  font-size: 40px;
  letter-spacing: 10px;
}
  .top-background p {
    font-size: 14px;
}
}
</style>