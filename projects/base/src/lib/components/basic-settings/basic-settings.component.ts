import { Component } from '@angular/core';
import { MatSelectChange } from '@angular/material/select'
import { WsClient } from '@tuilder/ws-client'
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'lib-admin-basic-settings',
  templateUrl: './basic-settings.component.html',
  styleUrls: ['./basic-settings.component.scss']
})
export class AdminBasicSettingsComponent {
  constructor(private backend: WsClient) {
    firstValueFrom(this.backend.send<{ id: string, value: string }>('Read', {
      table: '_setting',
      options: {
        id: 'newAccounts',
        columns: ['id', 'value'],
        firstOnly: true
      }
    }).response).then((result) => {
      console.log(result)   
      if (result) {
        this.newAccounts = result.value
      }
    })
  }
  newAccounts = 'multi-tenant'
  onNewAccountsChanged(e: MatSelectChange) {
    this.backend.send('Write', { table: '_setting', data: { id: 'newAccounts', value: e.value } })
  }
}
