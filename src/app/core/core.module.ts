import { NgModule, Optional, SkipSelf } from '@angular/core';
import { CommonModule } from '@angular/common';

import { NetworkConfigService } from './services/network-config.service';
import { ShareService } from './services/share.service';

@NgModule({
  imports: [CommonModule],
  providers: [
    NetworkConfigService,
    ShareService
  ]
})
export class CoreModule {
  constructor(@Optional() @SkipSelf() parentModule: CoreModule) {
    if (parentModule) {
      throw new Error('CoreModule is already loaded. Import only once.');
    }
  }
} 