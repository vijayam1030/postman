import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { RequestBuilderComponent } from './components/request-builder.component';
import { RequestHistoryComponent } from './components/request-history.component';
import { RequestHistory, KeyValue } from './models/request.model';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RequestBuilderComponent, RequestHistoryComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected title = 'Postman Clone';

  onRequestSelected(historyItem: RequestHistory): void {
    // This will be handled by ViewChild in the updated version
    console.log('Request selected:', historyItem);
  }
}
