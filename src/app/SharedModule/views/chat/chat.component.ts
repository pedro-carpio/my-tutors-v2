import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';

// Angular Material imports
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatChipsModule } from '@angular/material/chips';
import { TextFieldModule } from '@angular/cdk/text-field';

// Services
import { ChatService } from '../../../services/chat.service';
import { SessionService } from '../../../services/session.service';
import { User } from '@angular/fire/auth';

@Component({
  selector: 'app-chat',
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatChipsModule,
    TextFieldModule
  ],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.scss'
})
export class ChatComponent implements OnInit {
  private chatService = inject(ChatService);
  private sessionService = inject(SessionService);

  text: string = '';
  messages$!: Observable<any[]>;
  user$!: Observable<User | null>;

  ngOnInit() {
    // Initialize observables from services
    this.messages$ = this.chatService.loadMessages();
    this.user$ = this.sessionService.user$;
  }

  sendTextMessage() {
    if (this.text.trim()) {
      this.chatService.saveTextMessage(this.text);
      this.text = '';
    }
  }

  uploadImage(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.chatService.saveImageMessage(file);
    }
  }
}
