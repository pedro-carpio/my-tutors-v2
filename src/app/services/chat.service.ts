import { inject, Injectable } from '@angular/core';
import { map, switchMap, firstValueFrom, filter, Observable, Subscription } from 'rxjs';
import {
  doc,
  docData,
  DocumentReference,
  Firestore,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  addDoc,
  deleteDoc,
  collectionData,
  Timestamp,
  serverTimestamp,
  query,
  orderBy,
  limit,
  onSnapshot,
  DocumentData,
  FieldValue,
} from '@angular/fire/firestore';
import {
  Storage,
  getDownloadURL,
  ref,
  uploadBytesResumable,
} from '@angular/fire/storage';
import { getToken, Messaging, onMessage } from '@angular/fire/messaging';
import { Router } from '@angular/router';
import { SessionService } from './session.service';
import { User } from '@angular/fire/auth';

type ChatMessage = {
  name: string | null,
  profilePicUrl: string | null,
  timestamp: FieldValue,
  uid: string | null,
  text?: string,
  imageUrl?: string
};


@Injectable({
  providedIn: 'root',
})
export class ChatService {
  firestore: Firestore = inject(Firestore);
  session: SessionService = inject(SessionService);
  storage: Storage = inject(Storage);
  messaging: Messaging = inject(Messaging);
  router: Router = inject(Router);
  LOADING_IMAGE_URL = 'https://www.google.com/images/spin-32.gif?a';

  // observable that is updated when the auth state changes
  currentUser: User | null = this.session.currentUser;

  // Adds a text or image message to Cloud Firestore.
    addMessage = async (
    textMessage: string | null,
    imageUrl: string | null,
    ): Promise<void | DocumentReference<DocumentData>> => {
    // ignore empty messages
    if (!textMessage && !imageUrl) {
        console.log(
        "addMessage was called without a message",
        textMessage,
        imageUrl,
        );
        return;
    }

    if (this.currentUser === null) {
        console.log("addMessage requires a signed-in user");
        return;
    }

    const message: ChatMessage = {
        name: this.currentUser.displayName,
        profilePicUrl: this.currentUser.photoURL,
        timestamp: serverTimestamp(),
        uid: this.currentUser?.uid,
    };

    textMessage && (message.text = textMessage);
    imageUrl && (message.imageUrl = imageUrl);

    try {
        const newMessageRef = await addDoc(
        collection(this.firestore, "messages"),
        message,
        );
        return newMessageRef;
    } catch (error) {
        console.error("Error writing new message to Firebase Database", error);
        return;
    }
    };


    saveTextMessage = async (messageText: string) => {
        return this.addMessage(messageText, null);
    };

    loadMessages = () => {
        // Create the query to load the last 12 messages and listen for new ones.
        const recentMessagesQuery = query(collection(this.firestore, 'messages'), orderBy('timestamp', 'desc'), limit(12));
        // Start listening to the query.
        return collectionData(recentMessagesQuery);
    }

    saveImageMessage = async(file: any) => {
        try {
            // 1 - Add a message with a loading icon that will get updated with the shared image.
            const messageRef = await this.addMessage(null, this.LOADING_IMAGE_URL);

            // 2 - Upload the image to Cloud Storage.
            const filePath = `${this.currentUser?.uid}/${file.name}`;
            const newImageRef = ref(this.storage, filePath);
            const fileSnapshot = await uploadBytesResumable(newImageRef, file);

            // 3 - Generate a public URL for the file.
            const publicImageUrl = await getDownloadURL(newImageRef);

            // 4 - Update the chat message placeholder with the image's URL.
            messageRef ?
            await updateDoc(messageRef, {
            imageUrl: publicImageUrl,
            storageUri: fileSnapshot.metadata.fullPath
            }): null;
        } catch (error) {
            console.error('There was an error uploading a file to Cloud Storage:', error);
        }
    }

    async updateData(path: string, data: any) {}

    async deleteData(path: string) {}

    getDocData(path: string) {}

    getCollectionData(path: string) {}

    async uploadToStorage(
        path: string,
        input: HTMLInputElement,
        contentType: any
    ) {
        return null;
    }

    requestNotificationsPermissions = async () => {
        console.log('Requesting notifications permission...');
        const permission = await Notification.requestPermission();

        if (permission === 'granted') {
        console.log('Notification permission granted.');
        // Notification permission granted.
        await this.saveMessagingDeviceToken();
        } else {
        console.log('Unable to get permission to notify.');
        }
    }

    saveMessagingDeviceToken= async () => {
        try {
        const currentToken = await getToken(this.messaging);
        if (currentToken) {
            console.log('Got FCM device token:', currentToken);
            // Saving the Device Token to Cloud Firestore.
            const tokenRef = doc(this.firestore, 'fcmTokens', currentToken);
            await setDoc(tokenRef, { uid: this.currentUser?.uid });

            // This will fire when a message is received while the app is in the foreground.
            // When the app is in the background, firebase-messaging-sw.js will receive the message instead.
            onMessage(this.messaging, (message) => {
            console.log(
                'New foreground notification from Firebase Messaging!',
                message.notification
            );
            });
        } else {
            // Need to request permissions to show notifications.
            this.requestNotificationsPermissions();
        }
        } catch(error) {
        console.error('Unable to get messaging token.', error);
        };
    }
}
