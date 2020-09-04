import firebase from 'firebase'
import("firebase/functions");
import Vue from 'vue'
import App from './App'
import axios from 'axios'
import VueAxios from 'vue-axios'
import VueClipboard from 'vue-clipboard2'
import Meta from 'vue-meta'

// Vue.use(Meta)
VueClipboard.config.autoSetContainer = true // add this line

Vue.use(VueClipboard)
Vue.use(VueAxios, axios)
var VueCookie = require('vue-cookie');
// Tell Vue to use the plugin
// import moment from 'vue-moment'
// moment.locale('ja');
Vue.use(VueCookie);

// Vue.use(moment);

Vue.config.productionTip = false

// Initialize Firebase
var config = {
  // ここにFirebaseから取得したconfigをペースト
  apiKey: "AIzaSyDHJack6eMO7unx70ggSjcEfnotvOX38tE",
  authDomain: "my-chat-20efc.firebaseapp.com",
  databaseURL: "https://my-chat-20efc.firebaseio.com",
  projectId: "my-chat-20efc",
  storageBucket: "my-chat-20efc.appspot.com",
  messagingSenderId: "627286864292",
  appId: "1:627286864292:web:d6d7a1e3401e9194e5d131",
  measurementId: "G-DGJTW4WTF3"
};
firebase.initializeApp(config);
new Vue({
  el: '#app',
  components: { App },
  template: '<App/>'
})