import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class StockApiService {

   private apiUrl = 'http://localhost:8000/screen';

  constructor(private http: HttpClient) {}

  uploadExcel(file: File): Observable<Blob> {

    const formData = new FormData();

    formData.append('file', file);

    return this.http.post(
      this.apiUrl,
      formData,
      {
        responseType: 'blob'
      }
    );
  }
}
