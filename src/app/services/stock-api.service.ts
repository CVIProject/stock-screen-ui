import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class StockApiService {

  private apiUrl = 'http://localhost:8000/api/screener/filter';
  private regimeApiUrl = 'http://localhost:8000/api/regime/continue';

  constructor(private http: HttpClient) {}

  uploadExcel(stockFile: File, biblicalFile: File): Observable<HttpResponse<Blob>> {
    const formData = new FormData();

    formData.append('stock_file', stockFile);
    formData.append('biblical_file', biblicalFile);

    return this.http.post(
      this.apiUrl,
      formData,
      {
        observe: 'response',
        responseType: 'blob'
      }
    ) as Observable<HttpResponse<Blob>>;
  }

  uploadRegimeFile(regimeFile: File): Observable<HttpResponse<Blob>> {
    const formData = new FormData();
    formData.append('file', regimeFile);

    return this.http.post(
      this.regimeApiUrl,
      formData,
      {
        observe: 'response',
        responseType: 'blob'
      }
    ) as Observable<HttpResponse<Blob>>;
  }
}
