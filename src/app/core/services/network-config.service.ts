import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export interface NetworkConfig {
  host: string;
  port: number;
  httpPort: number;
  websocketUrl: string;
  restApiUrl: string;
  status: 'offline' | 'on-premise' | 'online';
  isLocal: boolean;
  serverType: 'none' | 'local-network' | 'internet';
}

@Injectable({
  providedIn: 'root'
})
export class NetworkConfigService {
  private configSubject = new BehaviorSubject<NetworkConfig>({
    host: 'localhost',
    port: 1234,
    httpPort: 3000,
    websocketUrl: '',
    restApiUrl: '',
    status: 'offline',
    isLocal: true,
    serverType: 'none'
  });

  public config$ = this.configSubject.asObservable();

  constructor() {
    this.detectNetworkConfig();
  }

  private async detectNetworkConfig(): Promise<void> {
    try {
      // First try to find on-premise server on local network
      const onPremiseConfig = await this.tryOnPremiseServer();
      if (onPremiseConfig) {
        this.configSubject.next(onPremiseConfig);
        return;
      }

      // Then try local host server
      const localConfig = await this.tryLocalHostServer();
      if (localConfig) {
        this.configSubject.next(localConfig);
        return;
      }

      // Fall back to offline mode
      this.setOfflineMode();
    } catch (error) {
      console.error('Failed to detect network configuration:', error);
      this.setOfflineMode();
    }
  }

  private async tryLocalHostServer(): Promise<NetworkConfig | null> {
    try {
      const response = await fetch('http://localhost:1234/api/health', {
        signal: AbortSignal.timeout(2000)
      });
      if (response.ok) {
        const data = await response.json();
        console.log('📍 Connected to localhost development server');
        return {
          host: 'localhost',
          port: data.port || 1234,
          httpPort: data.httpPort || 3000,
          websocketUrl: `ws://localhost:${data.port || 1234}`,
          restApiUrl: `http://localhost:${data.port || 1234}`,
          status: 'on-premise',
          isLocal: true,
          serverType: 'local-network'
        };
      }
    } catch (error) {
      console.log('No localhost server found');
    }
    return null;
  }

  private async tryOnPremiseServer(): Promise<NetworkConfig | null> {
    // Try common local network IP ranges for on-premise servers
    const networkRanges = [
      '192.168.1.',
      '192.168.0.',
      '192.168.2.',
      '10.0.0.',
      '10.0.1.',
      '172.16.0.',
      '172.16.1.'
    ];

    for (const range of networkRanges) {
      for (let i = 1; i < 255; i++) {
        const ip = range + i;
        
        // Skip localhost IPs
        if (ip === '192.168.1.1' || ip === '10.0.0.1') continue;
        
        try {
          const response = await fetch(`http://${ip}:1234/api/health`, {
            signal: AbortSignal.timeout(1000)
          });
          
          if (response.ok) {
            const data = await response.json();
            console.log(`🏢 Connected to on-premise server at ${ip}`);
            return {
              host: ip,
              port: data.port || 1234,
              httpPort: data.httpPort || 3000,
              websocketUrl: `ws://${ip}:${data.port || 1234}`,
              restApiUrl: `http://${ip}:${data.port || 1234}`,
              status: 'on-premise',
              isLocal: false,
              serverType: 'local-network'
            };
          }
        } catch (error) {
          // Continue scanning
        }
      }
    }
    return null;
  }

  private setOfflineMode(): void {
    console.log('💾 Working in offline mode');
    this.configSubject.next({
      host: 'localhost',
      port: 1234,
      httpPort: 3000,
      websocketUrl: '',
      restApiUrl: '',
      status: 'offline',
      isLocal: true,
      serverType: 'none'
    });
  }

  public getCurrentConfig(): NetworkConfig {
    return this.configSubject.value;
  }

  public isOffline(): boolean {
    return this.configSubject.value.status === 'offline';
  }

  public isOnPremise(): boolean {
    return this.configSubject.value.status === 'on-premise';
  }

  public isOnline(): boolean {
    return this.configSubject.value.status === 'online';
  }

  public getServerType(): string {
    const config = this.configSubject.value;
    switch (config.serverType) {
      case 'local-network':
        return config.isLocal ? 'Development Server' : 'On-Premise Server';
      case 'internet':
        return 'Cloud Server';
      default:
        return 'Offline Mode';
    }
  }

  public setCustomConfig(config: Partial<NetworkConfig>): void {
    const current = this.configSubject.value;
    this.configSubject.next({
      ...current,
      ...config
    });
  }

  public async testConnection(host: string, port: number): Promise<boolean> {
    try {
      const response = await fetch(`http://${host}:${port}/api/health`, {
        signal: AbortSignal.timeout(5000)
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  public getWebSocketUrl(documentId: string): string {
    const config = this.getCurrentConfig();
    if (config.status === 'offline') {
      return '';
    }
    return `${config.websocketUrl}/document-${documentId}`;
  }

  public getRestApiUrl(endpoint: string): string {
    const config = this.getCurrentConfig();
    if (config.status === 'offline') {
      return '';
    }
    return `${config.restApiUrl}/api${endpoint}`;
  }

  public generateShareableLink(documentId: string): string {
    const config = this.getCurrentConfig();
    
    if (config.status === 'offline') {
      return `${window.location.origin}/documents/${documentId}`;
    }
    
    // For on-premise servers, use the server's IP and standard port 4200
    return `http://${config.host}:4200/documents/${documentId}`;
  }

  public refresh(): void {
    console.log('🔄 Refreshing network configuration...');
    this.detectNetworkConfig();
  }

  public getNetworkInfo(): { status: string; type: string; host?: string; details: string } {
    const config = this.getCurrentConfig();
    
    switch (config.status) {
      case 'offline':
        return {
          status: 'Offline',
          type: 'Local Storage',
          details: 'Working without network connectivity'
        };
      case 'on-premise':
        return {
          status: 'Connected',
          type: this.getServerType(),
          host: config.host,
          details: `Connected to ${config.isLocal ? 'development' : 'on-premise'} server`
        };
      case 'online':
        return {
          status: 'Online',
          type: 'Cloud Server',
          host: config.host,
          details: 'Connected to internet-based server'
        };
      default:
        return {
          status: 'Unknown',
          type: 'Unknown',
          details: 'Unable to determine connection status'
        };
    }
  }
} 