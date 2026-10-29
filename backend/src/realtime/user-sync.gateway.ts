import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { AuthService } from '../auth/auth.service';

@WebSocketGateway({
  namespace: '/sync',
  cors: { origin: true, credentials: true },
})
export class UserSyncGateway {
  private readonly logger = new Logger(UserSyncGateway.name);

  @WebSocketServer()
  server: Server;

  constructor(private readonly authService: AuthService) {}

  async handleConnection(socket: Socket) {
    const token = typeof socket.handshake.auth?.token === 'string'
      ? socket.handshake.auth.token
      : '';
    const user = token ? await this.authService.verifyUserToken(token) : null;
    if (!user) {
      socket.disconnect(true);
      return;
    }
    socket.data.userId = user.id;
    await socket.join(`user_${user.id}`);
  }

  handleDisconnect(socket: Socket) {
    if (socket.data.userId) this.logger.debug(`Sync client disconnected for ${socket.data.userId}`);
  }

  @SubscribeMessage('sync:ping')
  ping(@ConnectedSocket() socket: Socket, @MessageBody() payload: unknown) {
    return { event: 'sync:pong', data: payload };
  }

  emitUserEvent(userId: string, event: string, data: unknown) {
    this.server.to(`user_${userId}`).emit(event, data);
  }
}
