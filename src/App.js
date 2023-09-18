// Imports for react, firebase, webpage styling
import React, { useRef, useState } from 'react';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';

import firebase from 'firebase/compat/app'; 
import 'firebase/compat/firestore';
import 'firebase/compat/auth'; 

import { useCollectionData } from 'react-firebase-hooks/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';


// Init firebase
const firebaseInfo = require('./myAPIKeys.json');
firebase.initializeApp({
  apiKey: firebaseInfo.apiKey,
  authDomain: firebaseInfo.authDomain,
  projectId: firebaseInfo.projectId,
  storageBucket: firebaseInfo.storageBucket,
  messagingSenderId: firebaseInfo.messagingSenderId,
  appId: firebaseInfo.appId,
  measurementId: firebaseInfo.measurementId
});

const auth = firebase.auth();
// const analytics = firebase.analytics();
const firestore = firebase.firestore();

// ----------------------------------------------------------------------------------------------------------------- //

// Get user, offer option to sign & join chat room
function App() {
  const [user] = useAuthState(auth);
  return (
    <div className="App">
      <header>
        <h1>🐚  Global App Chat  🐚</h1>
        <LogOut />
      </header>

      <section>
        {user ? <ChatRoom /> : <LogIn />}
      </section>
    </div>
  );
}

// Signs user out
function LogOut() {
  return auth.currentUser && (
    <button className="btn btn-danger position-absolute top-0 end-0 m-3" onClick={() => auth.signOut()}>Log Out</button>
  )
}

// Button to sign user in with google
function LogIn() {
  const signInWithGoogle = () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider);
  }

  return (
    <div className="sign-in-container">
      <button className="btn btn-primary sign-in-google" onClick={signInWithGoogle}>Sign in with Google</button>
      <p>Welcome to the chat!</p>
    </div>
  )
}

function ChatRoom() {
  // Ref for scrolling to the bottom of the chat, Firestore collection reference for messages
  const scrollRef = useRef();
  const messagesCollection = firestore.collection('messages');
  
  // Get the 20 latest messages, state for storing messages, state for message input fields
  const messageQuery = messagesCollection.orderBy('createdAt').limit(20);
  const [messages] = useCollectionData(messageQuery, { idField: 'id' });
  const [messageText, setMessageText] = useState('');

  // Handles sending messages
  const sendMessage = async (e) => {
    e.preventDefault();

    const { uid, photoURL } = auth.currentUser;

    // Add the message to Firestore
    await messagesCollection.add({
      text: messageText,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      uid,
      photoURL
    });

    // Clear message input field, scroll to bottom of chat
    setMessageText('');
    scrollRef.current.scrollIntoView({ behavior: 'smooth' });
  }

  return (
    <>
      <main>
        {/* Render the chat messages */}
        {messages && messages.map(msg => <ChatMessage key={msg.id} message={msg} />)}
        {/* Dummy element for scrolling */}
        <span ref={scrollRef}></span>
      </main>

      <form onSubmit={sendMessage}>
        <input value={messageText} onChange={(e) => setMessageText(e.target.value)} placeholder="say something nice" />
        <button type="submit" disabled={!messageText}>Send</button>
      </form>
    </>
  )
}

function ChatMessage(props) {
  const { text, uid, photoURL } = props.message;

  // Determine the CSS class for the message based on the sender's UID
  const messageClass = uid === auth.currentUser.uid ? 'sent' : 'received';

  return (
    <div className={`message ${messageClass}`}>
      {/* User PFP */}
      <img src={photoURL || 'https://api.adorable.io/avatars/23/abott@adorable.png'} alt="User's Profile" width="50" height="50" />
      
      {/* Message contents */}
      <p>{text}</p>
    </div>
  );
}

export default App;