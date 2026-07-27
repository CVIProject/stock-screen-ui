import { Component, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { catchError, finalize } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { StockApiService } from '../../services/stock-api.service';
import { RegimeUploadComponent } from '../regime-upload/regime-upload.component';

interface Toast {
  id: string;
  type: 'success' | 'error';
  message: string;
  visible: boolean;
}

@Component({
  selector: 'app-file-upload',
  standalone: true,
  imports: [CommonModule, RegimeUploadComponent],
  templateUrl: './file-upload.component.html',
  styleUrls: ['./file-upload.component.css'],
  changeDetection: ChangeDetectionStrategy.Default
})
export class FileUploadComponent {

  selectedStockFile?: File | null;
  selectedBiblicalFile?: File | null;

  loading = false;
  errorMessage: string | null = null;

  toasts: Toast[] = [];

  constructor(
    private stockApiService: StockApiService,
    private router: Router
  ) {}

  onStockFileSelected(event: Event) {
    const input = event.target as HTMLInputElement | null;
    this.selectedStockFile = input?.files?.[0] ?? null;
  }

  onBiblicalFileSelected(event: Event) {
    const input = event.target as HTMLInputElement | null;
    this.selectedBiblicalFile = input?.files?.[0] ?? null;
  }

  filterFile() {
    console.log('FileUploadComponent filterFile start', {
      selectedStockFile: !!this.selectedStockFile,
      selectedBiblicalFile: !!this.selectedBiblicalFile,
      online: navigator.onLine
    });

    if (!this.selectedStockFile) {
      this.showToast('Please select the Stock Excel file before submitting.', 'error');
      return;
    }

    if (!this.selectedBiblicalFile) {
      this.showToast('Please select the Biblical Screening Excel file before submitting.', 'error');
      return;
    }

    if (!navigator.onLine) {
      this.errorMessage = 'No internet connection. Please check your network and try again.';
      this.showToast(this.errorMessage, 'error');
      return;
    }

    this.errorMessage = null;
    this.loading = true;

    this.stockApiService
      .uploadExcel(this.selectedStockFile, this.selectedBiblicalFile)
      .pipe(
        catchError(error => {
          console.error('FileUploadComponent request timeout or error', error);
          return throwError(() => error);
        }),
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe({
        next: async (response: HttpResponse<Blob>) => {
          console.log('FileUploadComponent upload success', response);
          const contentType = response.headers.get('content-type') ?? '';
          const body = response.body as Blob;

          if (contentType.includes('application/json') || contentType.includes('text/plain') || contentType.includes('text/html')) {
            try {
              const text = await body.text();
              const parsed = JSON.parse(text);
              const message = parsed?.message || 'Server returned an error response. Please try again.';
              this.errorMessage = message;
              this.showToast(message, 'error');
              return;
            } catch {
              const text = await body.text();
              this.errorMessage = text || 'Server returned an error response. Please try again.';
              this.showToast(this.errorMessage, 'error');
              return;
            }
          }

          const blob = new Blob([body], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          });

          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = this.getDownloadFileName(response) ?? 'filtered_output.xlsx';
          link.click();

          setTimeout(() => {
            try {
              window.URL.revokeObjectURL(url);
            } catch (e) {
              // ignore revoke errors
            }

            this.selectedStockFile = null;
            this.selectedBiblicalFile = null;

            const stockInputEl = document.getElementById('stockFileInput') as HTMLInputElement | null;
            if (stockInputEl) {
              try { stockInputEl.value = ''; } catch (e) { /* ignore */ }
            }

            const biblicalInputEl = document.getElementById('biblicalFileInput') as HTMLInputElement | null;
            if (biblicalInputEl) {
              try { biblicalInputEl.value = ''; } catch (e) { /* ignore */ }
            }

            this.router.navigate(['/success']);
          }, 250);
        },
        error: (error: any) => {
          console.error('FileUploadComponent API error', error);
          this.errorMessage = this.extractErrorMessage(error, 'Error processing files. Please try again.');
          this.showToast(this.errorMessage, 'error');
        }
      });
  }

  private extractErrorMessage(error: any, fallback: string): string {
    if (!navigator.onLine || error?.status === 0) {
      return 'No internet connection or server unreachable. Please check your network and try again.';
    }

    if (error?.name === 'TimeoutError') {
      return 'Request timed out. Please try again.';
    }

    if (!error) {
      return fallback;
    }

    if (error instanceof HttpErrorResponse) {
      if (error.error instanceof Blob) {
        error.error.text().then(text => {
          try {
            const parsed = JSON.parse(text);
            const message = parsed?.message || fallback;
            this.errorMessage = message;
            this.showToast(message, 'error');
          } catch {
            this.showToast(fallback, 'error');
          }
        }).catch(() => this.showToast(fallback, 'error'));
        return fallback;
      }
      return error.error?.message || error.message || fallback;
    }

    if (typeof error === 'string') {
      return error;
    }

    return error.message || fallback;
  }

  private getDownloadFileName(response: HttpResponse<Blob>): string | null {
    const contentDisposition = response.headers.get('content-disposition') ?? '';
    const utf8FilenameMatch = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);

    if (utf8FilenameMatch?.[1]) {
      return decodeURIComponent(utf8FilenameMatch[1]);
    }

    const filenameMatch = contentDisposition.match(/filename="?([^";]+)"?/i);
    return filenameMatch?.[1]?.trim() ?? null;
  }

  showToast(message: string, type: 'success' | 'error') {
    console.log('showToast', { message, type });
    const id = Date.now().toString();
    const toast: Toast = {
      id,
      type,
      message,
      visible: true
    };

    this.toasts.push(toast);

    // Auto remove toast after 5 seconds
    setTimeout(() => {
      this.removeToast(id);
    }, 5000);
  }

  removeToast(id: string) {
    this.toasts = this.toasts.filter(t => t.id !== id);
  }
}
