<template>
  <div id="app">
    <header class="header">
      <div class="header-left">
        <a href="https://my-chat-20efc.firebaseapp.com"><img class="logo" src="https://firebasestorage.googleapis.com/v0/b/my-chat-20efc.appspot.com/o/IMG_8795.png?alt=media&token=0e4ae5f9-25bc-4173-b506-0748e989cebe" /></a>
      </div>
      <!-- <h1>
        <a href="/" style="font-family: Nikukyu; color: white;">Buchicha</a>
      </h1> -->
    </header>
    <section v-if="isChat">
      <!-- 入力フォーム -->
      <form action @submit.prevent="sendMessage" class="form">
        <textarea v-model="input" :disabled="!user"></textarea>
        <button type="submit" :disabled="!user" class="send-button">送信</button>
      </form>
      
      <transition-group name="chat" tag="div" class="list content">
        <section v-for="{ key, name, image, message, isFromGuest } in chat"　:key="key" class="item">
          <div class="item-image">
            <img
              :src="image"
              width="40"
              height="40"
            >
          </div>
          <div class="item-detail">
            <div class="item-name"></div>
            <div class="item-message">
              <nl2br tag="div" :text="message"/>
            </div>
          </div>
        </section>
      </transition-group>
    </section>
    <section v-else>
      <the-root :user="user" :chats="chats" :authPending="authPending" :clickHandler="signInTwitter"></the-root>
    </section>
  </div>
</template>

<script>
// firebase モジュール
// 改行を <br> タグに変換するモジュール
import firebase from "firebase";
import Nl2br from "vue-nl2br";
import TheRoot from "./components/TheRoot";

export default {
  components: { TheRoot, Nl2br },
  data() {
    return {
      authPending: true,
      user: null, // ユーザー情報
      chats: [], // 取得したメッセージを入れる配列
      chat: [],
      input: "",
      isChat: false, // 入力したメッセージ
      isGuest: false,
      key: ""
    };
  },
  mounted() {
    const authUser = Object.keys(window.localStorage)
      .filter(item => item.startsWith('firebase:host:necocha-me.firebaseio.com'))[0]
    if (!authUser) {
      this.authPending = false;
    }
  },
  beforeCreate() {

    firebase.auth().onAuthStateChanged(async user => {
      this.authPending = false
      this.user = user;
      if (user) {
        const refUser = firebase
          .database()
          .ref("users/" + this.user.uid)
        await refUser.child('name').set(user.displayName)
        const userSnap = await refUser.once('value');
        this.user.chats = userSnap.val().chats
      }
      const url = new URL(location.href);
      this.chatUid = url.searchParams.get("chatUid"); // "/ca
      this.isChat = !!this.chatUid;
      for (let chatUid of Object.keys(this.user.chats)) {
        const refChats = firebase
          .database()
          .ref("chats/" + chatUid);
        refChats.once('value', (snap) => {
          const newChat = snap.val()
          this.chats.push(({...newChat, uid: chatUid, isCreator: this.user.chats[chatUid] === 'creator'}))
        });
      }
      if (!user) {
        if (this.isChat) {
          alert('ログインして下さい')
          return this.signInTwitter()
        }
        return;
      }
      if (!this.isChat) {
        return;
      }
      const ref_messages = firebase
        .database()
        .ref("messages/" + this.chatUid);
      this.chat = [];
      const refUsers = firebase
        .database()
        .ref("users/" + this.user.uid + '/chats/' + this.chatUid);
      refUsers.once('value', (snap) => {
        this.isGuest = snap.val() === 'guest'
      })
      ref_messages.limitToLast(100).on("child_added", this.childAdded, e => {
      });
    });
  },
  created() {
    const url = new URL(location.href);
    this.chatUid = url.searchParams.get("chatUid"); // "/ca
    this.isChat = !!this.chatUid;
    if (!this.isChat) {
      return;
    }
    if (+url.searchParams.get("expireAt") < Date.now()) {
      alert("有効期限が過ぎています");
      return (window.location = "/");
    }
  },
  methods: {
    // ログイン処理
    // スクロール位置を一番下に移動
    scrollBottom() {
      this.$nextTick(() => {
        window.scrollTo(0, document.body.clientHeight);
      });
    },
    sendMessage() {
      firebase
        .database()
        .ref("messages/" + this.chatUid)
        .push({
          image: (this.isGuest ? 'https://firebasestorage.googleapis.com/v0/b/my-chat-20efc.appspot.com/o/animal_hamster.png?alt=media&token=d37b6e6b-42c3-44d5-89e7-e21b49a2a071' : this.user.profile_image_url),
          message: this.input,
          isFromGuest: this.isGuest
        }, () => {
          this.input = ""; // フォームを空にする
        });
    },
    childAdded(snap) {
      const message = snap.val();
      this.chat.push({
        key: snap.key,
        name: message.name,
        image: message.image,
        message: message.message,
        isFromGuest: message.isFromGuest
      });
      this.scrollBottom();
    },
    signInTwitter() {
      const providerTwitter = new firebase.auth.TwitterAuthProvider();
      firebase.auth().signInWithRedirect(providerTwitter);
    }
  }
};
</script>
<style>
* {
  /* width: 100%; */
  margin: 0;
  box-sizing: border-box;
  font-family: sans-serif;
}

section {
  text-align: center;
}
.header {
  height: 70px;
  width: 100%;
  background-color: rgba(5, 143, 170, 0.6);
  margin-bottom: 1em;
  padding: 0.4em 0.8em;
  color: #fff;
  position: fixed;
  top: 0;
  z-index: 10;
}
.header-left {
  float: left;
}
.logo {
  width: 200px;
}
.content {
  margin: 150px auto 0;
  padding: 0 10px;
  max-width: 600px;
}
.form {
  position: fixed;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 80px;
  width: 100%;
  background: #f5f5f5;
  padding-top: 38px;
  padding-bottom: 38px;
  z-index: 2;
  bottom: 0px;
}
.form textarea {
  border: 1px solid #ccc;
  border-radius: 2px;
  height: 3.5em;
  width: calc(100% - 6em);
  resize: none;
  font-size: 16px;
}
.list {
  margin-bottom: 100px;
}
.item {
  position: relative;
  display: flex;
  align-items: flex-end;
  margin-bottom: 0.8em;
}
.item-image img {
  border-radius: 20px;
  vertical-align: top;
}
.item-detail {
  margin: 0 0 0 1.4em;
}
.item-name {
  font-size: 75%;
}
.item-message {
  position: relative;
  display: inline-block;
  padding: 0.8em;
  background: #deefe8;
  border-radius: 4px;
  line-height: 1.2em;
}
.item-message::before {
  position: absolute;
  content: " ";
  display: block;
  left: -16px;
  bottom: 12px;
  border: 4px solid transparent;
  border-right: 12px solid #deefe8;
}
.send-button {
  height: 4em;
}
/* トランジション用スタイル */
.chat-enter-active {
  transition: all 1s;
}
.chat-enter {
  opacity: 0;
  transform: translateX(-1em);
}

a {
  text-decoration: none;
}

@media only screen and (max-device-width : 480px) {
  img {
    width: 100%;
  }
  .logo {
    width: 150px;
  }
  .header {
    height: 60px
  }

}
</style>