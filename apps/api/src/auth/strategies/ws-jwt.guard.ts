import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';

@Injectable()
export class WsJwtGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client: Socket = context.switchToWs().getClient<Socket>();
    const token = this.extractTokenFromHeader(client);
    
    if (!token) {
      throw new WsException('Unauthorized');
    }

    try {
      const payload = await this.jwtService.verifyAsync(token);
      // We assign the payload to the client data so we can access it in our route handlers
      client.data.userId = payload.sub;
      client.data.user = payload;
    } catch {
      throw new WsException('Unauthorized');
    }
    return true;
  }

  private extractTokenFromHeader(client: Socket): string | undefined {
    // Check both auth.token and headers.authorization
    const tokenFromAuth = client.handshake.auth?.token;
    if (tokenFromAuth) {
      const [type, token] = typeof tokenFromAuth === 'string' ? tokenFromAuth.split(' ') : [];
      if (type === 'Bearer' && token) {
        return token;
      }
      return typeof tokenFromAuth === 'string' ? tokenFromAuth : undefined; // Some clients pass without 'Bearer '
    }

    const authHeader = client.handshake.headers?.authorization;
    if (authHeader) {
      const [type, token] = authHeader.split(' ');
      return type === 'Bearer' ? token : undefined;
    }

    return undefined;
  }
}
