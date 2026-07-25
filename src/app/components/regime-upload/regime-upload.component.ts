import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { finalize } from 'rxjs/operators';
import { Router } from '@angular/router';
import { StockApiService } from '../../services/stock-api.service';

interface Toast {
  id: string;
  type: 'success' | 'error';
  message: string;
  visible: boolean;
}

@Component({
  selector: 'app-regime-upload',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './regime-upload.component.html',
  styleUrls: ['./regime-upload.component.css'],
  changeDetection: ChangeDetectionStrategy.Default
})
export class RegimeUploadComponent {
  selectedRegimeFile?: File | null;
  loading = false;
  errorMessage: string | null = null;
  toasts: Toast[] = [];

  constructor(
    private stockApiService: StockApiService,
    private router: Router
  ) {}

  onRegimeFileSelected(event: Event) {
    const input = event.target as HTMLInputElement | null;
    this.selectedRegimeFile = input?.files?.[0] ?? null;
  }

  continueWithRegime() {
    console.log('RegimeUploadComponent continueWithRegime start', {
      selectedRegimeFile: !!this.selectedRegimeFile,
      online: navigator.onLine
    });

    if (!this.selectedRegimeFile) {
      this.showToast('Please select the Regime Excel file before submitting.', 'error');
      return;
    }

    if (!navigator.onLine) {
      this.errorMessage = 'No internet connection. Please check your network and try again.';
      this.showToast(this.errorMessage, 'error');
      return;
    }

    this.errorMessage = null;
    this.loading = true;

    this.stockApiService.uploadRegimeFile(this.selectedRegimeFile)
      .pipe(
        timeout(20000),
        catchError(error => {
          console.error('RegimeUploadComponent request timeout or error', error);
          return throwError(() => error);
        }),
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe({
        next: async (response: HttpResponse<Blob>) => {
          console.log('RegimeUploadComponent upload success', response);
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
          link.download = this.getDownloadFileName(response) ?? 'regime_output.xlsx';
          link.click();

          setTimeout(() => {
            window.URL.revokeObjectURL(url);
            this.loading = false;
            this.selectedRegimeFile = null;
            const input = document.getElementById('regimeFileInput') as HTMLInputElement | null;
            if (input) {
              input.value = '';
            }
            this.router.navigate(['/success']);
          }, 250);
        },
        error: (error: any) => {
          console.error('RegimeUploadComponent API error', error);
          this.errorMessage = this.extractErrorMessage(error, 'Error processing the regime file. Please try again.');
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
    this.toasts.push({ id, type, message, visible: true });
    setTimeout(() => this.removeToast(id), 5000);
  }

  removeToast(id: string) {
    this.toasts = this.toasts.filter(toast => toast.id !== id);
  }
}
